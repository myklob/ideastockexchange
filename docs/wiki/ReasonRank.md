# ReasonRank: Enlightenment Promotion Algorithm

The **ReasonRank** framework evaluates arguments by breaking them into components and scoring each one using specialized algorithms.  
The goal is to **tie the strength of a conclusion directly to the strength of the evidence** supporting it — and to make this process transparent by showing the math.

---

## Guiding Principles
- **"Extraordinary claims require extraordinary evidence."** – Carl Sagan  
- **"The wise man proportions his belief to the evidence."** – David Hume  
- From Aristotle to modern science, progress has relied on linking belief strength to evidence quality.  
- For the first time, we define these principles explicitly in software, enabling large-scale, simultaneous reasoning.

---

## Belief Score
The **Belief Score** is the primary output of ReasonRank.  
It continuously updates based on the performance of multiple sub-scores, including:
- Truth scores
- Linkage scores
- Equivalency scores
- Logical fallacy penalties
- Evidence verification

**Purpose:** Reflect the **current best estimate** of a belief's validity given all available arguments and evidence.

---

## Argument Ranking Algorithm

ReasonRank uses a **PageRank-inspired algorithm** where:
- **Supporting arguments ADD to the belief score**
- **Opposing/con arguments SUBTRACT from the belief score**

This promotes beliefs with strong supporting arguments and weak opposing arguments.

### Core Formula

```
Belief Score = BaseScore + Σ(Supporting Scores) - Σ(Opposing Scores)
```

Where:
- `BaseScore = 50` (neutral)
- Each argument score is weighted by its ReasonRank and lifecycle status
- Final score is clamped to 0-100 range

### Python Example

```python
def calculate_belief_score(supporting_args, opposing_args):
    """
    Calculate belief score using PageRank-style algorithm.
    Args contribute their score POSITIVELY (supporting) or NEGATIVELY (opposing).
    """
    base_score = 50

    # Lifecycle multipliers
    lifecycle_multipliers = {
        'active': 1.0,
        'weakened': 0.7,
        'conditional': 0.8,
        'outdated': 0.3,
        'refuted': 0.1
    }

    # Calculate weighted scores
    def weighted_score(args):
        if not args:
            return 0
        total = sum(
            arg['reason_rank'] * lifecycle_multipliers[arg['lifecycle_status']]
            for arg in args
        )
        return total / len(args)

    supporting_avg = weighted_score(supporting_args)
    opposing_avg = weighted_score(opposing_args)

    total_args = len(supporting_args) + len(opposing_args)
    if total_args == 0:
        return base_score

    # Weight by argument count
    support_weight = len(supporting_args) / total_args
    oppose_weight = len(opposing_args) / total_args

    # PageRank formula: ADD supporting, SUBTRACT opposing
    score = base_score + (supporting_avg * support_weight) - (opposing_avg * oppose_weight)

    # Clamp to valid range
    return max(0, min(100, round(score)))

# Example
supporting = [
    {'reason_rank': 85, 'lifecycle_status': 'active'},
    {'reason_rank': 72, 'lifecycle_status': 'active'},
    {'reason_rank': 68, 'lifecycle_status': 'weakened'}
]

opposing = [
    {'reason_rank': 45, 'lifecycle_status': 'active'},
    {'reason_rank': 52, 'lifecycle_status': 'weakened'}
]

belief_score = calculate_belief_score(supporting, opposing)
print(f"Belief Score: {belief_score}/100")
# Output: Belief Score: 75/100
```

**Why this works:**
- Strong supporting arguments (high scores) INCREASE the belief score significantly
- Weak opposing arguments (low scores) barely DECREASE the belief score
- A belief with high-quality pro arguments and low-quality con arguments scores high
- This naturally promotes reason-based conclusions over emotional or unfounded ones

---

## Transparency

* Every component of the score is public and **open to challenge**.
* Users can see exactly how each argument influences the overall belief score.
* Algorithms are linked across the wiki (see sidebar) so the scoring process is auditable.

---

**See Also:**

* (http://myclob.pbworks.com/w/page/159300543/ReasonRank)
