from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
import os

from database import init_db, get_db
from services import StatementService
from scraper import StatementAggregator

# Initialize FastAPI app
app = FastAPI(
    title="Idea Stock Exchange",
    description="Platform for finding, linking, and tracking similar statements and their arguments across the internet",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    print("Database initialized successfully")


# Pydantic models for request/response
class StatementCreate(BaseModel):
    text: str
    source_url: Optional[str] = None
    author: Optional[str] = None
    platform: Optional[str] = None


class ArgumentCreate(BaseModel):
    statement_id: int
    text: str
    argument_type: str  # 'agree' or 'disagree'
    source_url: Optional[str] = None
    author: Optional[str] = None


class URLCollectRequest(BaseModel):
    url: HttpUrl
    source_type: Optional[str] = 'auto'


class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 10


# API Endpoints

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main web interface"""
    try:
        with open("index.html", "r") as f:
            return f.read()
    except FileNotFoundError:
        return HTMLResponse(content="<h1>Idea Stock Exchange</h1><p>Web interface not found. Visit <a href='/docs'>/docs</a> for API documentation.</p>")


@app.get("/api")
async def api_info():
    """API information endpoint"""
    return {
        "message": "Welcome to Idea Stock Exchange API",
        "version": "1.0.0",
        "endpoints": {
            "statements": "/statements",
            "arguments": "/arguments",
            "search": "/search",
            "collect": "/collect",
            "docs": "/docs"
        }
    }


@app.post("/statements", status_code=201)
async def create_statement(
    statement: StatementCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new statement

    Args:
        statement: Statement data including text, source, author, platform

    Returns:
        Created statement with ID and similarity links
    """
    service = StatementService(db)
    new_statement = service.add_statement(
        text=statement.text,
        source_url=statement.source_url,
        author=statement.author,
        platform=statement.platform
    )

    return {
        "id": new_statement.id,
        "text": new_statement.text,
        "normalized_text": new_statement.normalized_text,
        "source_url": new_statement.source_url,
        "author": new_statement.author,
        "platform": new_statement.platform,
        "created_at": new_statement.created_at
    }


@app.get("/statements/{statement_id}")
async def get_statement(statement_id: int, db: Session = Depends(get_db)):
    """
    Get a statement with its similar statements

    Args:
        statement_id: ID of the statement

    Returns:
        Statement details with similar statements
    """
    service = StatementService(db)
    statement = service.get_statement_with_similar(statement_id)

    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")

    return statement


@app.get("/statements/{statement_id}/arguments")
async def get_arguments(statement_id: int, db: Session = Depends(get_db)):
    """
    Get all arguments (reasons to agree/disagree) for a statement

    Args:
        statement_id: ID of the statement

    Returns:
        Dictionary with 'agree' and 'disagree' argument lists
    """
    service = StatementService(db)
    arguments = service.get_statement_arguments(statement_id)
    return arguments


@app.post("/arguments", status_code=201)
async def create_argument(
    argument: ArgumentCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new argument for a statement

    Args:
        argument: Argument data including statement_id, text, type

    Returns:
        Created argument details
    """
    service = StatementService(db)

    try:
        new_argument = service.add_argument(
            statement_id=argument.statement_id,
            argument_text=argument.text,
            argument_type=argument.argument_type,
            source_url=argument.source_url,
            author=argument.author
        )

        if not new_argument:
            raise HTTPException(status_code=404, detail="Statement not found")

        return {
            "id": new_argument.id,
            "statement_id": new_argument.statement_id,
            "text": new_argument.text,
            "argument_type": new_argument.argument_type,
            "source_url": new_argument.source_url,
            "author": new_argument.author,
            "created_at": new_argument.created_at
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/search")
async def search_statements(
    search: SearchRequest,
    db: Session = Depends(get_db)
):
    """
    Search for statements similar to a query

    Args:
        search: Search query and limit

    Returns:
        List of matching statements with similarity scores
    """
    service = StatementService(db)
    results = service.search_statements(search.query, search.limit)
    return {
        "query": search.query,
        "results": results,
        "count": len(results)
    }


@app.post("/collect")
async def collect_from_url(
    request: URLCollectRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Collect statements from a URL

    Args:
        request: URL and source type

    Returns:
        Status and collected statements count
    """
    aggregator = StatementAggregator()
    service = StatementService(db)

    # Collect statements
    result = await aggregator.collect_from_url(str(request.url), request.source_type)

    statements = result.get('statements', [])
    metadata = result.get('metadata', {})

    # Add statements to database
    created_statements = []
    for statement_text in statements:
        stmt = service.add_statement(
            text=statement_text,
            source_url=metadata.get('url'),
            author=metadata.get('author'),
            platform=metadata.get('platform')
        )
        created_statements.append(stmt.id)

    return {
        "status": "success",
        "url": str(request.url),
        "statements_collected": len(created_statements),
        "statement_ids": created_statements,
        "metadata": metadata
    }


@app.post("/cluster")
async def auto_cluster(db: Session = Depends(get_db)):
    """
    Automatically cluster similar statements

    Returns:
        List of created clusters
    """
    service = StatementService(db)
    clusters = service.auto_cluster_statements()

    return {
        "clusters_created": len(clusters),
        "clusters": [
            {
                "id": cluster.id,
                "representative_text": cluster.representative_text,
                "description": cluster.description
            }
            for cluster in clusters
        ]
    }


@app.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """
    Get system statistics

    Returns:
        Statistics about statements, arguments, and clusters
    """
    from models import Statement, Argument, StatementCluster

    statement_count = db.query(Statement).count()
    argument_count = db.query(Argument).count()
    cluster_count = db.query(StatementCluster).count()

    # Count similar links
    similar_links = db.execute("SELECT COUNT(*) FROM similar_statements").fetchone()[0]

    return {
        "total_statements": statement_count,
        "total_arguments": argument_count,
        "total_clusters": cluster_count,
        "total_similarity_links": similar_links
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
