# Objective Criteria Scoring Algorithm

This document explains how the Idea Stock Exchange calculates criterion scores using the ReasonRank algorithm.

## Overview

The algorithm answers: **"How good is this criterion for measuring this topic?"**

Scores range from 0-100%, where:
- **80-100%**: Excellent measure (e.g., Glacier Mass Balance for climate change)
- **60-80%**: Good measure
- **40-60%**: Moderate measure
- **0-40%**: Weak measure (e.g., Twitter Sentiment for climate change)

## The Three-Level Hierarchy

```
Criterion Overall Score
    ↓
Four Dimension Scores (Validity, Reliability, Independence, Linkage)
    ↓
Supporting vs. Opposing Arguments (each weighted by quality)
```

## Level 1: Argument Weight Calculation

Each argument has three quality metrics (0-100%):

1. **Evidence Quality**: How well-supported is this argument?
2. **Logical Validity**: How logically sound is this argument?
3. **Importance**: How important is this consideration?

The argument's weight is calculated using the geometric mean:

```python
def calculate_argument_weight(evidence_quality, logical_validity, importance):
    # Normalize to 0-1
    eq = evidence_quality / 100.0
    lv = logical_validity / 100.0
    imp = importance / 100.0

    # Geometric mean ensures all three factors matter
    weight = (eq * lv * imp) ** (1/3)

    # Convert back to 0-100
    return weight * 100.0
```

**Why geometric mean?**

The geometric mean ensures that if ANY quality metric is very low, the overall weight drops significantly. This prevents poorly-supported arguments from having undue influence.

**Example:**
- Argument A: Evidence=90%, Logic=90%, Importance=90% → Weight=90%
- Argument B: Evidence=90%, Logic=90%, Importance=30% → Weight=66%
- Argument C: Evidence=30%, Logic=30%, Importance=30% → Weight=30%

## Level 2: Dimension Score Calculation

Each dimension (Validity, Reliability, Independence, Linkage) is scored based on the balance of supporting vs. opposing arguments.

```python
def calculate_dimension_score(supporting_args, opposing_args):
    # Sum weights
    total_support = sum(arg.weight for arg in supporting_args)
    total_oppose = sum(arg.weight for arg in opposing_args)

    # Calculate balance
    balance = total_support - total_oppose

    # Map to 0-100 using sigmoid function
    scale = 100.0
    sigmoid = 1 / (1 + exp(-balance / scale))
    score = sigmoid * 100.0

    return score
```

**Key properties:**

- **Equal support/oppose** → 50% score
- **More support** → Higher score (approaches 100%)
- **More opposition** → Lower score (approaches 0%)
- **Smooth and continuous** → Small changes don't cause jumps

**Example:**

Validity dimension for "Glacier Mass Balance":
- Supporting arguments: Total weight = 300
- Opposing arguments: Total weight = 100
- Balance = 300 - 100 = +200
- Score ≈ 88%

## Level 3: Overall Criterion Score

The overall score is the weighted average of the four dimension scores.

```python
def calculate_overall_score(validity, reliability, independence, linkage):
    # Default: equal weights
    return (validity + reliability + independence + linkage) / 4
```

**Default weights:** All dimensions equally important (25% each)

**Custom weights:** Can emphasize certain dimensions for specific contexts

**Example:**

For "Glacier Mass Balance":
- Validity: 95%
- Reliability: 92%
- Independence: 90%
- Linkage: 92%
- **Overall: (95+92+90+92)/4 = 92%**

## Real-World Examples

### Example 1: Glacier Mass Balance (High Score)

**Validity: 95%**
- ✓ Supporting (weight=90): "Ice melts only when heat is added - integrates temperature naturally"
- ✗ Opposing (weight=70): "Some glaciers affected by local precipitation"
- Balance: +20 → High score

**Reliability: 92%**
- ✓ Supporting (weight=98): "Satellite imagery provides objective measurements"
- ✗ Opposing (weight=65): "Historical data less precise"
- Balance: +33 → High score

**Independence: 90%**
- ✓ Supporting (weight=92): "Independent verification across different systems"
- Balance: +92 → High score

**Linkage: 92%**
- ✓ Supporting (weight=90): "Correlates strongly with atmospheric CO2"
- Balance: +90 → High score

**Overall Score: 92%** ← Excellent criterion

---

### Example 2: Twitter Sentiment (Low Score)

**Validity: 8%**
- ✗ Opposing (weight=95): "Measures perception, not reality"
- Balance: -95 → Very low score

**Reliability: 10%**
- ✗ Opposing (weight=90): "Heavily influenced by bots and viral events"
- Balance: -90 → Very low score

**Independence: 12%**
- ✗ Opposing (weight=92): "Subject to manipulation and echo chambers"
- Balance: -92 → Very low score

**Linkage: 5%**
- ✗ Opposing (weight=95): "No correlation with actual temperature"
- Balance: -95 → Very low score

**Overall Score: 9%** ← Very weak criterion

---

### Example 3: Stock Market Performance (Medium Score)

**Validity: 40%**
- ✗ Opposing (weight=88): "Measures profit, not wellbeing"
- ✓ Supporting (weight=70): "Predicts future employment"
- Balance: -18 → Below-average score

**Reliability: 85%**
- ✓ Supporting (weight=98): "Precise real-time data"
- Balance: +98 → High score

**Independence: 50%**
- (No strong arguments either way)
- Balance: 0 → Neutral score

**Linkage: 30%**
- ✗ Opposing (weight=90): "Weak correlation with median quality of life"
- Balance: -90 → Low score

**Overall Score: 51%** ← Moderate criterion

## Why This Approach Works

### 1. Evidence-Based Weighting

Arguments with strong evidence carry more weight than speculation. This filters noise automatically.

### 2. Transparent Calculation

Every score can be traced back to specific arguments. No black boxes.

### 3. Self-Correcting

As the community adds better arguments, scores converge toward accuracy.

### 4. Resistant to Gaming

Gaming requires successfully arguing that a biased measure is unbiased, using verifiable evidence, against informed opposition. Much harder than gaming unstructured debates.

### 5. Separates Layers

- **Criteria quality** (what we're measuring)
- **Evidence** (what the measurements show)
- **Values** (which criteria we prioritize)

Mixing these layers causes endless confusion. Separating them enables progress.

## Integration with Truth Scores

Once criteria are scored, they're used to weigh evidence:

```python
def calculate_truth_score(claim, evidence_items):
    weighted_evidence = 0
    total_weight = 0

    for evidence in evidence_items:
        # Use criterion score as evidence weight
        criterion_score = evidence.criterion.overall_score
        weighted_evidence += evidence.supports * criterion_score
        total_weight += criterion_score

    if total_weight == 0:
        return 50  # Neutral if no evidence

    return (weighted_evidence / total_weight) * 100
```

**Result:** Claims measured by excellent criteria get higher confidence than claims measured by poor criteria.

## Handling Edge Cases

### No Arguments Yet

- **Default:** All dimensions start at 50% (neutral)
- **Overall:** 50% (neutral)
- **Interpretation:** "We don't know if this is good or bad yet"

### Only Supporting Arguments

- **Balance:** Positive
- **Score:** High (70-100%)
- **Interpretation:** "Community thinks this is a good measure"

### Only Opposing Arguments

- **Balance:** Negative
- **Score:** Low (0-30%)
- **Interpretation:** "Community thinks this is a poor measure"

### Balanced Arguments

- **Balance:** Near zero
- **Score:** Around 50%
- **Interpretation:** "Legitimate disagreement about quality"

## Extending the Algorithm

### Custom Dimension Weights

For domain-specific applications, you can adjust dimension importance:

```python
# Emphasize validity and linkage over reliability
weights = {
    'validity': 0.35,
    'reliability': 0.15,
    'independence': 0.15,
    'linkage': 0.35
}
overall_score = calculate_overall_score(
    validity, reliability, independence, linkage, weights
)
```

### Additional Dimensions

You can add new quality dimensions (e.g., "Timeliness", "Cost"):

1. Add to DimensionType enum in models.py
2. Add score field to Criterion model
3. Update scoring algorithm to include new dimension
4. Update UI to display new dimension

### Argument Hierarchies

Arguments can themselves have sub-arguments, creating nested reasoning:

```
Criterion: "GDP Growth"
  ↓
Dimension: Validity
  ↓
Argument: "GDP doesn't measure distribution"
  ↓
Counter-Argument: "But it correlates with employment"
  ↓
Counter-Counter-Argument: "Only for certain sectors"
```

This is implemented through the recursive argument scoring system.

## Performance Considerations

### Caching

Scores are cached in the database. Recalculation only happens when:
- New argument is added
- Existing argument is updated
- Manual recalculation is triggered

### Batch Updates

When many arguments change, batch the recalculation:

```python
# Don't recalculate after each argument
for arg in new_arguments:
    db.add(arg)
db.commit()

# Recalculate once at the end
recalculate_criterion_scores(db, criterion_id)
```

## Mathematical Properties

### Monotonicity

Adding a supporting argument can only increase (or maintain) the score. Adding an opposing argument can only decrease (or maintain) the score.

### Bounded

Scores are always in [0, 100]. No overflow or underflow.

### Continuous

Small changes in argument quality → small changes in score. No discontinuities.

### Convergent

As more arguments are added, scores converge toward "true" quality (assuming good-faith participants).

## References

- Fisher, R., & Ury, W. (1981). *Getting to Yes* - Separating criteria from conclusions
- Pearl, J. (2009). *Causality* - Causal inference and measurement validity
- Silver, N. (2012). *The Signal and the Noise* - Bayesian updating and evidence weighting

## Implementation

See:
- `/backend/algorithms/scoring.py` - Core algorithm implementation
- `/backend/models.py` - Data model
- `/backend/main.py` - API endpoints
- `/frontend/src/components/DimensionBreakdown.tsx` - Score visualization
