"""
Main FastAPI application for Idea Stock Exchange Objective Criteria system.
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from backend.database import get_db, init_db
from backend.models import (
    Topic, Criterion, DimensionArgument, ArgumentEvidence, Evidence,
    User, Bet, BetType, MarketStatus
)
from backend.schemas import (
    TopicCreate, TopicResponse, TopicWithCriteria,
    CriterionCreate, CriterionResponse, CriterionWithArguments,
    DimensionArgumentCreate, DimensionArgumentUpdate, DimensionArgumentResponse,
    ArgumentEvidenceCreate, ArgumentEvidenceResponse,
    EvidenceCreate, EvidenceResponse,
    CriterionScoreBreakdown,
    UserCreate, UserResponse,
    TradeRequest, TradeResponse, BetResponse,
    PortfolioResponse, PortfolioPosition,
    MarketSummary, ResolveMarketRequest, ResolveMarketResponse
)
from backend.algorithms.scoring import (
    recalculate_criterion_scores,
    get_criterion_score_breakdown
)
from backend.algorithms.market_maker import (
    execute_trade,
    get_market_summary,
    calculate_payout,
    lmsr_price_yes,
    MarketState
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


# ============================================================================
# USER ENDPOINTS
# ============================================================================

@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user with starting balance."""
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    db_user = User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/users/", response_model=List[UserResponse])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all users."""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ============================================================================
# TRADE / PREDICTION MARKET ENDPOINTS
# ============================================================================

@app.post("/api/trade", response_model=TradeResponse)
def execute_market_trade(trade: TradeRequest, db: Session = Depends(get_db)):
    """
    Execute a prediction market trade.

    1. Validates the user has enough balance.
    2. Calculates the new price based on the trade size using LMSR.
    3. Updates the user's balance and the criterion's market state atomically.
    """
    # Validate user exists and has enough balance
    user = db.query(User).filter(User.id == trade.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.balance < trade.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Have {user.balance:.2f}, need {trade.amount:.2f}"
        )

    # Validate criterion exists and market is open
    criterion = db.query(Criterion).filter(Criterion.id == trade.criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    if criterion.market_status != MarketStatus.OPEN:
        raise HTTPException(status_code=400, detail="Market is not open for trading")

    # Execute the trade using LMSR
    bet_type_str = trade.bet_type.value
    shares_bought, new_price, new_yes, new_no = execute_trade(
        yes_shares=criterion.yes_shares_outstanding,
        no_shares=criterion.no_shares_outstanding,
        liquidity=criterion.total_liquidity_pool,
        bet_type=bet_type_str,
        amount=trade.amount
    )

    # Record the price before updating
    price_at_trade = criterion.market_price

    # Update user balance
    user.balance -= trade.amount

    # Update criterion market state
    criterion.yes_shares_outstanding = new_yes
    criterion.no_shares_outstanding = new_no
    criterion.market_price = new_price

    # Create bet record
    db_bet = Bet(
        user_id=trade.user_id,
        criterion_id=trade.criterion_id,
        bet_type=trade.bet_type,
        amount_spent=trade.amount,
        shares_bought=shares_bought,
        price_at_trade=price_at_trade
    )
    db.add(db_bet)
    db.commit()
    db.refresh(db_bet)

    return TradeResponse(
        bet_id=db_bet.id,
        user_id=user.id,
        criterion_id=criterion.id,
        bet_type=trade.bet_type,
        amount_spent=trade.amount,
        shares_bought=shares_bought,
        price_at_trade=price_at_trade,
        new_market_price=new_price,
        user_balance_after=user.balance
    )


@app.get("/users/{user_id}/bets", response_model=List[BetResponse])
def list_user_bets(user_id: int, db: Session = Depends(get_db)):
    """List all bets for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    bets = db.query(Bet).filter(Bet.user_id == user_id).order_by(Bet.created_at.desc()).all()
    return bets


@app.get("/users/{user_id}/portfolio", response_model=PortfolioResponse)
def get_user_portfolio(user_id: int, db: Session = Depends(get_db)):
    """
    Get a user's portfolio showing all active positions and their market values.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Aggregate bets by criterion and bet_type
    bets = db.query(Bet).filter(Bet.user_id == user_id).all()

    # Group by (criterion_id, bet_type)
    positions_map = {}
    for bet in bets:
        key = (bet.criterion_id, bet.bet_type.value)
        if key not in positions_map:
            positions_map[key] = {
                "criterion_id": bet.criterion_id,
                "bet_type": bet.bet_type,
                "total_shares": 0.0,
                "total_spent": 0.0,
            }
        positions_map[key]["total_shares"] += bet.shares_bought
        positions_map[key]["total_spent"] += bet.amount_spent

    positions = []
    total_invested = 0.0
    total_market_value = 0.0

    for key, pos in positions_map.items():
        criterion = db.query(Criterion).filter(Criterion.id == pos["criterion_id"]).first()
        if not criterion:
            continue

        # Current value: shares * current_price for that side
        state = MarketState(
            yes_shares=criterion.yes_shares_outstanding,
            no_shares=criterion.no_shares_outstanding,
            b=criterion.total_liquidity_pool
        )
        if pos["bet_type"].value == "yes":
            current_price = lmsr_price_yes(state)
        else:
            current_price = 1.0 - lmsr_price_yes(state)

        market_value = pos["total_shares"] * current_price
        profit_loss = market_value - pos["total_spent"]

        positions.append(PortfolioPosition(
            criterion_id=criterion.id,
            criterion_name=criterion.name,
            bet_type=pos["bet_type"],
            total_shares=pos["total_shares"],
            total_spent=pos["total_spent"],
            current_price=current_price,
            market_value=market_value,
            profit_loss=profit_loss
        ))

        total_invested += pos["total_spent"]
        total_market_value += market_value

    return PortfolioResponse(
        user_id=user.id,
        username=user.username,
        balance=user.balance,
        positions=positions,
        total_invested=total_invested,
        total_market_value=total_market_value,
        total_profit_loss=total_market_value - total_invested
    )


@app.get("/criteria/{criterion_id}/market", response_model=MarketSummary)
def get_criterion_market(criterion_id: int, db: Session = Depends(get_db)):
    """Get the prediction market summary for a criterion."""
    criterion = db.query(Criterion).filter(Criterion.id == criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    summary = get_market_summary(
        criterion.yes_shares_outstanding,
        criterion.no_shares_outstanding,
        criterion.total_liquidity_pool
    )

    return MarketSummary(
        criterion_id=criterion.id,
        criterion_name=criterion.name,
        reason_rank_score=criterion.overall_score,
        market_price=criterion.market_price,
        yes_price_percent=summary["yes_price_percent"],
        no_price_percent=summary["no_price_percent"],
        yes_shares_outstanding=summary["yes_shares_outstanding"],
        no_shares_outstanding=summary["no_shares_outstanding"],
        market_status=criterion.market_status
    )


@app.post("/api/resolve", response_model=ResolveMarketResponse)
def resolve_market(request: ResolveMarketRequest, db: Session = Depends(get_db)):
    """
    Resolve a prediction market and pay out winners.

    Winners receive 1.0 per share held. Losers get nothing.
    """
    criterion = db.query(Criterion).filter(Criterion.id == request.criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    if criterion.market_status != MarketStatus.OPEN:
        raise HTTPException(status_code=400, detail="Market is already resolved")

    # Update market status
    if request.resolved_yes:
        criterion.market_status = MarketStatus.RESOLVED_YES
        criterion.market_price = 1.0
    else:
        criterion.market_status = MarketStatus.RESOLVED_NO
        criterion.market_price = 0.0

    # Calculate and distribute payouts
    bets = db.query(Bet).filter(Bet.criterion_id == request.criterion_id).all()
    payouts = []

    for bet in bets:
        payout = calculate_payout(bet.shares_bought, bet.bet_type.value, request.resolved_yes)
        if payout > 0:
            user = db.query(User).filter(User.id == bet.user_id).first()
            if user:
                user.balance += payout
                payouts.append({
                    "user_id": user.id,
                    "username": user.username,
                    "payout": payout,
                    "bet_type": bet.bet_type.value,
                    "shares": bet.shares_bought
                })

    db.commit()

    return ResolveMarketResponse(
        criterion_id=criterion.id,
        resolved_yes=request.resolved_yes,
        market_status=criterion.market_status,
        payouts=payouts
    )


@app.get("/criteria/{criterion_id}/bets", response_model=List[BetResponse])
def list_criterion_bets(criterion_id: int, db: Session = Depends(get_db)):
    """List all bets for a criterion's market."""
    criterion = db.query(Criterion).filter(Criterion.id == criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    bets = db.query(Bet).filter(Bet.criterion_id == criterion_id).order_by(Bet.created_at.desc()).all()
    return bets


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
