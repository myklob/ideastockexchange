"""
Main FastAPI application for Idea Stock Exchange Objective Criteria system.
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db, init_db
from backend.models import Topic, Criterion, DimensionArgument, ArgumentEvidence, Evidence
from backend.schemas import (
    TopicCreate, TopicResponse, TopicWithCriteria,
    CriterionCreate, CriterionResponse, CriterionWithArguments,
    DimensionArgumentCreate, DimensionArgumentUpdate, DimensionArgumentResponse,
    ArgumentEvidenceCreate, ArgumentEvidenceResponse,
    EvidenceCreate, EvidenceResponse,
    CriterionScoreBreakdown
)
from backend.algorithms.scoring import (
    recalculate_criterion_scores,
    get_criterion_score_breakdown
)

# Create FastAPI app
app = FastAPI(
    title="Idea Stock Exchange API",
    description="API for Objective Criteria evaluation system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Initialize database on startup."""
    init_db()


@app.get("/")
def read_root():
    """Root endpoint."""
    return {
        "message": "Idea Stock Exchange API",
        "docs": "/docs",
        "version": "1.0.0"
    }


# ============================================================================
# TOPIC ENDPOINTS
# ============================================================================

@app.post("/topics/", response_model=TopicResponse)
def create_topic(topic: TopicCreate, db: Session = Depends(get_db)):
    """Create a new topic."""
    db_topic = Topic(**topic.model_dump())
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic


@app.get("/topics/", response_model=List[TopicResponse])
def list_topics(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all topics."""
    topics = db.query(Topic).offset(skip).limit(limit).all()
    return topics


@app.get("/topics/{topic_id}", response_model=TopicWithCriteria)
def get_topic(topic_id: int, db: Session = Depends(get_db)):
    """Get a specific topic with all its criteria."""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@app.delete("/topics/{topic_id}")
def delete_topic(topic_id: int, db: Session = Depends(get_db)):
    """Delete a topic and all its criteria."""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    db.delete(topic)
    db.commit()
    return {"message": "Topic deleted successfully"}


# ============================================================================
# CRITERION ENDPOINTS
# ============================================================================

@app.post("/criteria/", response_model=CriterionResponse)
def create_criterion(criterion: CriterionCreate, db: Session = Depends(get_db)):
    """Create a new criterion for a topic."""
    # Verify topic exists
    topic = db.query(Topic).filter(Topic.id == criterion.topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    db_criterion = Criterion(**criterion.model_dump())
    db.add(db_criterion)
    db.commit()
    db.refresh(db_criterion)
    return db_criterion


@app.get("/criteria/{criterion_id}", response_model=CriterionWithArguments)
def get_criterion(criterion_id: int, db: Session = Depends(get_db)):
    """Get a specific criterion with all its arguments."""
    criterion = db.query(Criterion).filter(Criterion.id == criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")
    return criterion


@app.get("/topics/{topic_id}/criteria/", response_model=List[CriterionResponse])
def list_topic_criteria(topic_id: int, db: Session = Depends(get_db)):
    """List all criteria for a topic."""
    criteria = db.query(Criterion).filter(Criterion.topic_id == topic_id).all()
    return criteria


@app.delete("/criteria/{criterion_id}")
def delete_criterion(criterion_id: int, db: Session = Depends(get_db)):
    """Delete a criterion."""
    criterion = db.query(Criterion).filter(Criterion.id == criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    db.delete(criterion)
    db.commit()
    return {"message": "Criterion deleted successfully"}


# ============================================================================
# DIMENSION ARGUMENT ENDPOINTS
# ============================================================================

@app.post("/arguments/", response_model=DimensionArgumentResponse)
def create_argument(argument: DimensionArgumentCreate, db: Session = Depends(get_db)):
    """
    Create a new argument for a criterion dimension.

    After creating the argument, recalculates all scores for the criterion.
    """
    # Verify criterion exists
    criterion = db.query(Criterion).filter(Criterion.id == argument.criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    db_argument = DimensionArgument(**argument.model_dump())
    db.add(db_argument)
    db.commit()
    db.refresh(db_argument)

    # Recalculate criterion scores
    recalculate_criterion_scores(db, argument.criterion_id)

    # Refresh to get updated weight
    db.refresh(db_argument)
    return db_argument


@app.put("/arguments/{argument_id}", response_model=DimensionArgumentResponse)
def update_argument(
    argument_id: int,
    argument_update: DimensionArgumentUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an argument's content or quality scores.

    After updating, recalculates all scores for the criterion.
    """
    db_argument = db.query(DimensionArgument).filter(DimensionArgument.id == argument_id).first()
    if not db_argument:
        raise HTTPException(status_code=404, detail="Argument not found")

    # Update fields
    update_data = argument_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_argument, field, value)

    db.commit()

    # Recalculate criterion scores
    recalculate_criterion_scores(db, db_argument.criterion_id)

    db.refresh(db_argument)
    return db_argument


@app.get("/criteria/{criterion_id}/arguments/", response_model=List[DimensionArgumentResponse])
def list_criterion_arguments(criterion_id: int, db: Session = Depends(get_db)):
    """List all arguments for a criterion."""
    arguments = db.query(DimensionArgument).filter(
        DimensionArgument.criterion_id == criterion_id
    ).all()
    return arguments


@app.delete("/arguments/{argument_id}")
def delete_argument(argument_id: int, db: Session = Depends(get_db)):
    """Delete an argument and recalculate criterion scores."""
    argument = db.query(DimensionArgument).filter(DimensionArgument.id == argument_id).first()
    if not argument:
        raise HTTPException(status_code=404, detail="Argument not found")

    criterion_id = argument.criterion_id
    db.delete(argument)
    db.commit()

    # Recalculate criterion scores
    recalculate_criterion_scores(db, criterion_id)

    return {"message": "Argument deleted successfully"}


# ============================================================================
# ARGUMENT EVIDENCE ENDPOINTS
# ============================================================================

@app.post("/evidence/argument/", response_model=ArgumentEvidenceResponse)
def create_argument_evidence(evidence: ArgumentEvidenceCreate, db: Session = Depends(get_db)):
    """Add evidence supporting an argument."""
    # Verify argument exists
    argument = db.query(DimensionArgument).filter(DimensionArgument.id == evidence.argument_id).first()
    if not argument:
        raise HTTPException(status_code=404, detail="Argument not found")

    db_evidence = ArgumentEvidence(**evidence.model_dump())
    db.add(db_evidence)
    db.commit()
    db.refresh(db_evidence)
    return db_evidence


@app.get("/arguments/{argument_id}/evidence/", response_model=List[ArgumentEvidenceResponse])
def list_argument_evidence(argument_id: int, db: Session = Depends(get_db)):
    """List all evidence for an argument."""
    evidence = db.query(ArgumentEvidence).filter(
        ArgumentEvidence.argument_id == argument_id
    ).all()
    return evidence


# ============================================================================
# EVIDENCE ENDPOINTS
# ============================================================================

@app.post("/evidence/", response_model=EvidenceResponse)
def create_evidence(evidence: EvidenceCreate, db: Session = Depends(get_db)):
    """Create evidence for a topic measured against a criterion."""
    # Verify criterion exists
    criterion = db.query(Criterion).filter(Criterion.id == evidence.criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    db_evidence = Evidence(**evidence.model_dump())
    # Set weight based on criterion score
    db_evidence.weight = criterion.overall_score
    db.add(db_evidence)
    db.commit()
    db.refresh(db_evidence)
    return db_evidence


@app.get("/criteria/{criterion_id}/evidence/", response_model=List[EvidenceResponse])
def list_criterion_evidence(criterion_id: int, db: Session = Depends(get_db)):
    """List all evidence measured against a criterion."""
    evidence = db.query(Evidence).filter(Evidence.criterion_id == criterion_id).all()
    return evidence


# ============================================================================
# SCORING ENDPOINTS
# ============================================================================

@app.post("/criteria/{criterion_id}/recalculate")
def recalculate_scores(criterion_id: int, db: Session = Depends(get_db)):
    """Manually trigger score recalculation for a criterion."""
    criterion = db.query(Criterion).filter(Criterion.id == criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    recalculate_criterion_scores(db, criterion_id)

    db.refresh(criterion)
    return {
        "message": "Scores recalculated successfully",
        "overall_score": criterion.overall_score,
        "validity_score": criterion.validity_score,
        "reliability_score": criterion.reliability_score,
        "independence_score": criterion.independence_score,
        "linkage_score": criterion.linkage_score
    }


@app.get("/criteria/{criterion_id}/breakdown", response_model=CriterionScoreBreakdown)
def get_score_breakdown(criterion_id: int, db: Session = Depends(get_db)):
    """Get detailed breakdown of how a criterion's score was calculated."""
    criterion = db.query(Criterion).filter(Criterion.id == criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    breakdown = get_criterion_score_breakdown(db, criterion_id)
    return breakdown


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
