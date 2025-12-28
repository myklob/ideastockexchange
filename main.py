"""
Idea Stock Exchange - REST API
FastAPI application implementing Topic Overlap Scores
"""

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import os

from database import get_db, init_db
from services import TopicService, StatementService, OverlapService
from models import Topic, Statement, TopicOverlapScore, Argument

# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class TopicCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    keywords: Optional[List[str]] = None

class TopicResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    keywords: Optional[str]
    created_at: datetime
    statement_count: Optional[int] = 0

    class Config:
        from_attributes = True

class StatementCreate(BaseModel):
    text: str = Field(..., min_length=1)
    author: Optional[str] = None
    source_url: Optional[str] = None
    platform: Optional[str] = None

class StatementResponse(BaseModel):
    id: int
    text: str
    author: Optional[str]
    source_url: Optional[str]
    platform: Optional[str]
    truth_score: float
    disagreement_score: float
    created_at: datetime

    class Config:
        from_attributes = True

class OverlapScoreResponse(BaseModel):
    id: int
    statement_id: int
    topic_id: int
    overlap_score: float
    topic_rank: float
    signal_breakdown: Optional[str]
    calculated_at: datetime

    class Config:
        from_attributes = True

class RankedStatementResponse(BaseModel):
    statement: StatementResponse
    overlap_score: float
    topic_rank: float
    signal_breakdown: Optional[Dict]

class ArgumentCreate(BaseModel):
    statement_id: int
    text: str = Field(..., min_length=1)
    argument_type: str = Field(..., pattern="^(pro|con)$")
    author: Optional[str] = None
    source_url: Optional[str] = None
    strength: float = 1.0

class ArgumentResponse(BaseModel):
    id: int
    statement_id: int
    text: str
    argument_type: str
    author: Optional[str]
    source_url: Optional[str]
    strength: float
    created_at: datetime

    class Config:
        from_attributes = True

class OverlapClaimCreate(BaseModel):
    overlap_score_id: int
    claimed_overlap: float = Field(..., ge=0, le=100)
    claim_text: Optional[str] = None

class OverlapArgumentCreate(BaseModel):
    claim_id: int
    text: str = Field(..., min_length=1)
    argument_type: str = Field(..., pattern="^(pro|con)$")
    proposed_overlap_min: Optional[float] = Field(None, ge=0, le=100)
    proposed_overlap_max: Optional[float] = Field(None, ge=0, le=100)
    author: Optional[str] = None

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    limit: int = Field(20, ge=1, le=100)

class SearchResult(BaseModel):
    statement: StatementResponse
    similarity_score: float

class TopicHierarchyCreate(BaseModel):
    parent_id: int
    child_id: int
    relationship_type: str = 'subtopic'
    distance: int = 1

class StatsResponse(BaseModel):
    total_topics: int
    total_statements: int
    total_overlap_scores: int
    total_arguments: int
    total_overlap_claims: int

# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="Idea Stock Exchange - Topic Overlap Scores",
    description="ReasonRank applied to information architecture",
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
    print("✓ Database initialized")
    print("✓ API server ready")

# ============================================================================
# TOPIC ENDPOINTS
# ============================================================================

@app.post("/api/topics", response_model=TopicResponse, status_code=201)
def create_topic(topic: TopicCreate, db: Session = Depends(get_db)):
    """Create a new topic."""
    try:
        created_topic = TopicService.create_topic(
            db,
            name=topic.name,
            description=topic.description,
            keywords=topic.keywords
        )
        return created_topic
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/topics", response_model=List[TopicResponse])
def list_topics(limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    """List all topics."""
    topics = TopicService.list_topics(db, limit=limit)
    return topics

@app.get("/api/topics/{topic_id}", response_model=TopicResponse)
def get_topic(topic_id: int, db: Session = Depends(get_db)):
    """Get a specific topic."""
    topic = TopicService.get_topic(db, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic

@app.get("/api/topics/slug/{slug}", response_model=TopicResponse)
def get_topic_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get a topic by its slug."""
    topic = TopicService.get_topic_by_slug(db, slug)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic

@app.post("/api/topics/hierarchy", status_code=201)
def add_topic_hierarchy(hierarchy: TopicHierarchyCreate, db: Session = Depends(get_db)):
    """Add a parent-child relationship between topics."""
    try:
        created = TopicService.add_topic_hierarchy(
            db,
            parent_id=hierarchy.parent_id,
            child_id=hierarchy.child_id,
            relationship_type=hierarchy.relationship_type,
            distance=hierarchy.distance
        )
        return {"id": created.id, "parent_id": created.parent_id, "child_id": created.child_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# STATEMENT ENDPOINTS
# ============================================================================

@app.post("/api/statements", response_model=StatementResponse, status_code=201)
def create_statement(statement: StatementCreate, db: Session = Depends(get_db)):
    """Create a new statement (belief)."""
    try:
        created_statement = StatementService.create_statement(
            db,
            text=statement.text,
            author=statement.author,
            source_url=statement.source_url,
            platform=statement.platform
        )
        return created_statement
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/statements", response_model=List[StatementResponse])
def list_statements(limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    """List all statements."""
    statements = StatementService.list_statements(db, limit=limit)
    return statements

@app.get("/api/statements/{statement_id}", response_model=StatementResponse)
def get_statement(statement_id: int, db: Session = Depends(get_db)):
    """Get a specific statement."""
    statement = StatementService.get_statement(db, statement_id)
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")
    return statement

@app.post("/api/statements/search", response_model=List[SearchResult])
def search_statements(search: SearchRequest, db: Session = Depends(get_db)):
    """Semantic search for statements."""
    results = StatementService.search_statements(db, search.query, limit=search.limit)
    return [
        {"statement": stmt, "similarity_score": score}
        for stmt, score in results
    ]

# ============================================================================
# ARGUMENT ENDPOINTS (for Truth Scoring)
# ============================================================================

@app.post("/api/arguments", response_model=ArgumentResponse, status_code=201)
def add_argument(argument: ArgumentCreate, db: Session = Depends(get_db)):
    """Add an argument (reason to agree/disagree) to a statement."""
    try:
        created_arg = StatementService.add_argument(
            db,
            statement_id=argument.statement_id,
            text=argument.text,
            argument_type=argument.argument_type,
            author=argument.author,
            source_url=argument.source_url,
            strength=argument.strength
        )
        return created_arg
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/statements/{statement_id}/arguments", response_model=Dict[str, List[ArgumentResponse]])
def get_statement_arguments(statement_id: int, db: Session = Depends(get_db)):
    """Get all arguments for a statement, grouped by type."""
    arguments = db.query(Argument).filter(Argument.statement_id == statement_id).all()

    pro_args = [arg for arg in arguments if arg.argument_type == 'pro']
    con_args = [arg for arg in arguments if arg.argument_type == 'con']

    return {
        "pro": pro_args,
        "con": con_args
    }

# ============================================================================
# OVERLAP SCORE ENDPOINTS
# ============================================================================

@app.post("/api/overlap/calculate", response_model=OverlapScoreResponse, status_code=201)
def calculate_overlap_score(
    statement_id: int,
    topic_id: int,
    db: Session = Depends(get_db)
):
    """
    Calculate and store the overlap score between a statement and topic.
    Uses all 5 algorithmic signals.
    """
    try:
        overlap_score = OverlapService.calculate_overlap_score(
            db,
            statement_id=statement_id,
            topic_id=topic_id
        )
        return overlap_score
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/topics/{topic_id}/statements", response_model=List[RankedStatementResponse])
def get_topic_statements(
    topic_id: int,
    min_overlap: float = Query(0.0, ge=0, le=100),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get statements for a topic page, ranked by TopicRank.
    This is the core "Page 1" functionality from the spec.
    """
    results = OverlapService.get_topic_ranked_statements(
        db,
        topic_id=topic_id,
        min_overlap=min_overlap,
        page=page,
        page_size=page_size
    )

    response = []
    for statement, overlap in results:
        response.append({
            "statement": statement,
            "overlap_score": overlap.overlap_score,
            "topic_rank": overlap.topic_rank,
            "signal_breakdown": overlap.get_signal_breakdown()
        })

    return response

@app.get("/api/overlap/{overlap_score_id}", response_model=OverlapScoreResponse)
def get_overlap_score(overlap_score_id: int, db: Session = Depends(get_db)):
    """Get a specific overlap score."""
    overlap = db.query(TopicOverlapScore).filter(TopicOverlapScore.id == overlap_score_id).first()
    if not overlap:
        raise HTTPException(status_code=404, detail="Overlap score not found")
    return overlap

# ============================================================================
# OVERLAP CLAIM ENDPOINTS (Argument Trees for Overlap)
# ============================================================================

@app.post("/api/overlap/claims", status_code=201)
def create_overlap_claim(claim: OverlapClaimCreate, db: Session = Depends(get_db)):
    """Create a contestable claim about an overlap score."""
    try:
        created_claim = OverlapService.create_overlap_claim(
            db,
            overlap_score_id=claim.overlap_score_id,
            claimed_overlap=claim.claimed_overlap,
            claim_text=claim.claim_text
        )
        return {
            "id": created_claim.id,
            "claim_text": created_claim.claim_text,
            "claimed_overlap": created_claim.claimed_overlap
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/overlap/arguments", status_code=201)
def add_overlap_argument(argument: OverlapArgumentCreate, db: Session = Depends(get_db)):
    """Add an argument for/against an overlap claim."""
    try:
        created_arg = OverlapService.add_overlap_argument(
            db,
            claim_id=argument.claim_id,
            text=argument.text,
            argument_type=argument.argument_type,
            proposed_overlap_min=argument.proposed_overlap_min,
            proposed_overlap_max=argument.proposed_overlap_max,
            author=argument.author
        )
        return {
            "id": created_arg.id,
            "claim_id": created_arg.claim_id,
            "argument_type": created_arg.argument_type
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# STATS ENDPOINT
# ============================================================================

@app.get("/api/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """Get system statistics."""
    from models import OverlapClaim

    stats = {
        "total_topics": db.query(Topic).count(),
        "total_statements": db.query(Statement).count(),
        "total_overlap_scores": db.query(TopicOverlapScore).count(),
        "total_arguments": db.query(Argument).count(),
        "total_overlap_claims": db.query(OverlapClaim).count()
    }

    return stats

# ============================================================================
# FRONTEND
# ============================================================================

@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    """Serve the frontend HTML."""
    if os.path.exists("index.html"):
        with open("index.html", "r") as f:
            return f.read()
    else:
        return """
        <html>
            <head><title>Idea Stock Exchange</title></head>
            <body>
                <h1>Idea Stock Exchange - Topic Overlap Scores</h1>
                <p>API is running. Visit <a href="/docs">/docs</a> for API documentation.</p>
            </body>
        </html>
        """

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
