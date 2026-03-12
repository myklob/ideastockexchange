"""
Scoring algorithms for the Objective Criteria system.

This module implements the ReasonRank algorithm for calculating:
- Argument weights based on evidence quality, logical validity, and importance
- Dimension scores based on weighted arguments
- Overall criterion scores from dimension scores
"""
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from backend.models import Criterion, DimensionArgument, ArgumentDirection, DimensionType


def calculate_argument_weight(
    evidence_quality: float,
    logical_validity: float,
    importance: float
) -> float:
    """
    Calculate the weight of an argument based on its quality metrics.

    Args:
        evidence_quality: How well-supported is the argument (0-100)
        logical_validity: How logically sound is the argument (0-100)
        importance: How important is this consideration (0-100)

    Returns:
        Weight value (0-100)
    """
    # Normalize to 0-1 range
    eq = evidence_quality / 100.0
    lv = logical_validity / 100.0
    imp = importance / 100.0

    # Use geometric mean to ensure all three factors matter
    # If any factor is very low, the overall weight drops significantly
    weight = (eq * lv * imp) ** (1/3)

    # Convert back to 0-100 scale
    return weight * 100.0


def calculate_dimension_score(
    supporting_args: List[DimensionArgument],
    opposing_args: List[DimensionArgument]
) -> float:
    """
    Calculate a dimension score based on supporting and opposing arguments.

    The algorithm:
    1. Calculate total weight of supporting arguments
    2. Calculate total weight of opposing arguments
    3. Use a logistic function to map the difference to 0-100 scale
    4. Arguments with higher evidence quality, logical validity, and importance
       have more influence on the final score

    Args:
        supporting_args: Arguments pushing score higher
        opposing_args: Arguments pushing score lower

    Returns:
        Dimension score (0-100)
    """
    # Calculate total weighted support
    total_support = sum(arg.weight for arg in supporting_args)
    total_oppose = sum(arg.weight for arg in opposing_args)

    # Handle edge case: no arguments
    if total_support == 0 and total_oppose == 0:
        return 50.0  # Neutral score

    # Calculate the balance
    # Positive = more support, Negative = more opposition
    balance = total_support - total_oppose

    # Use a sigmoid-like function to map balance to 0-100 scale
    # This ensures that:
    # - Equal support/oppose = 50
    # - Strong support = approaches 100
    # - Strong opposition = approaches 0
    # - The function is smooth and continuous

    # Scale factor determines how quickly score changes with balance
    scale = 100.0

    # Sigmoid function: 1 / (1 + e^(-x))
    import math
    sigmoid = 1 / (1 + math.exp(-balance / scale))

    # Map from [0, 1] to [0, 100]
    score = sigmoid * 100.0

    return score


def calculate_overall_criterion_score(
    validity: float,
    reliability: float,
    independence: float,
    linkage: float,
    weights: Dict[str, float] = None
) -> float:
    """
    Calculate overall criterion score from dimension scores.

    By default, all dimensions are equally weighted, but custom weights
    can be provided to emphasize certain dimensions.

    Args:
        validity: Validity dimension score (0-100)
        reliability: Reliability dimension score (0-100)
        independence: Independence dimension score (0-100)
        linkage: Linkage dimension score (0-100)
        weights: Optional custom weights for each dimension

    Returns:
        Overall criterion score (0-100)
    """
    if weights is None:
        # Default: equal weights
        weights = {
            'validity': 0.25,
            'reliability': 0.25,
            'independence': 0.25,
            'linkage': 0.25
        }

    # Normalize weights to sum to 1.0
    total_weight = sum(weights.values())
    if total_weight > 0:
        weights = {k: v/total_weight for k, v in weights.items()}

    # Calculate weighted average
    overall = (
        validity * weights.get('validity', 0.25) +
        reliability * weights.get('reliability', 0.25) +
        independence * weights.get('independence', 0.25) +
        linkage * weights.get('linkage', 0.25)
    )

    return overall


def update_argument_weights(db: Session, criterion_id: int) -> None:
    """
    Update weights for all arguments of a criterion.

    Args:
        db: Database session
        criterion_id: ID of the criterion
    """
    # Get all arguments for this criterion
    arguments = db.query(DimensionArgument).filter(
        DimensionArgument.criterion_id == criterion_id
    ).all()

    for arg in arguments:
        # Calculate and update weight
        arg.weight = calculate_argument_weight(
            arg.evidence_quality,
            arg.logical_validity,
            arg.importance
        )

    db.commit()


def update_dimension_scores(db: Session, criterion_id: int) -> None:
    """
    Update all dimension scores for a criterion based on its arguments.

    Args:
        db: Database session
        criterion_id: ID of the criterion
    """
    # Get the criterion
    criterion = db.query(Criterion).filter(Criterion.id == criterion_id).first()
    if not criterion:
        return

    # Update each dimension
    for dimension_type in DimensionType:
        # Get supporting and opposing arguments for this dimension
        supporting = [
            arg for arg in criterion.dimension_arguments
            if arg.dimension == dimension_type and arg.direction == ArgumentDirection.SUPPORTING
        ]
        opposing = [
            arg for arg in criterion.dimension_arguments
            if arg.dimension == dimension_type and arg.direction == ArgumentDirection.OPPOSING
        ]

        # Calculate dimension score
        score = calculate_dimension_score(supporting, opposing)

        # Update the appropriate dimension score
        if dimension_type == DimensionType.VALIDITY:
            criterion.validity_score = score
        elif dimension_type == DimensionType.RELIABILITY:
            criterion.reliability_score = score
        elif dimension_type == DimensionType.INDEPENDENCE:
            criterion.independence_score = score
        elif dimension_type == DimensionType.LINKAGE:
            criterion.linkage_score = score

    db.commit()


def update_overall_criterion_score(db: Session, criterion_id: int, custom_weights: Dict[str, float] = None) -> None:
    """
    Update the overall criterion score based on dimension scores.

    Args:
        db: Database session
        criterion_id: ID of the criterion
        custom_weights: Optional custom dimension weights
    """
    criterion = db.query(Criterion).filter(Criterion.id == criterion_id).first()
    if not criterion:
        return

    criterion.overall_score = calculate_overall_criterion_score(
        criterion.validity_score,
        criterion.reliability_score,
        criterion.independence_score,
        criterion.linkage_score,
        custom_weights
    )

    db.commit()


def recalculate_criterion_scores(db: Session, criterion_id: int) -> None:
    """
    Fully recalculate all scores for a criterion.

    This is the main entry point for updating a criterion after arguments change.

    Args:
        db: Database session
        criterion_id: ID of the criterion
    """
    # Step 1: Update argument weights
    update_argument_weights(db, criterion_id)

    # Step 2: Update dimension scores based on weighted arguments
    update_dimension_scores(db, criterion_id)

    # Step 3: Update overall criterion score
    update_overall_criterion_score(db, criterion_id)


def get_criterion_score_breakdown(db: Session, criterion_id: int) -> Dict:
    """
    Get a detailed breakdown of how a criterion's score was calculated.

    Returns:
        Dictionary with score breakdown information
    """
    criterion = db.query(Criterion).filter(Criterion.id == criterion_id).first()
    if not criterion:
        return {}

    breakdown = {
        'criterion_id': criterion.id,
        'criterion_name': criterion.name,
        'overall_score': criterion.overall_score,
        'dimensions': {},
        'argument_count': len(criterion.dimension_arguments)
    }

    for dimension_type in DimensionType:
        dimension_name = dimension_type.value

        # Get score for this dimension
        if dimension_type == DimensionType.VALIDITY:
            score = criterion.validity_score
        elif dimension_type == DimensionType.RELIABILITY:
            score = criterion.reliability_score
        elif dimension_type == DimensionType.INDEPENDENCE:
            score = criterion.independence_score
        else:  # LINKAGE
            score = criterion.linkage_score

        # Get arguments for this dimension
        supporting = [
            {
                'id': arg.id,
                'content': arg.content,
                'weight': arg.weight,
                'evidence_quality': arg.evidence_quality,
                'logical_validity': arg.logical_validity,
                'importance': arg.importance
            }
            for arg in criterion.dimension_arguments
            if arg.dimension == dimension_type and arg.direction == ArgumentDirection.SUPPORTING
        ]

        opposing = [
            {
                'id': arg.id,
                'content': arg.content,
                'weight': arg.weight,
                'evidence_quality': arg.evidence_quality,
                'logical_validity': arg.logical_validity,
                'importance': arg.importance
            }
            for arg in criterion.dimension_arguments
            if arg.dimension == dimension_type and arg.direction == ArgumentDirection.OPPOSING
        ]

        total_support = sum(arg['weight'] for arg in supporting)
        total_oppose = sum(arg['weight'] for arg in opposing)

        breakdown['dimensions'][dimension_name] = {
            'score': score,
            'supporting_arguments': supporting,
            'opposing_arguments': opposing,
            'total_support_weight': total_support,
            'total_oppose_weight': total_oppose,
            'balance': total_support - total_oppose
        }

    return breakdown
