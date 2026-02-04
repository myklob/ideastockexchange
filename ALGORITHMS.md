# ISE Algorithms: Quick Reference

This document provides implementable specifications for the core ISE scoring algorithms.

---

## 1. Conclusion Score (CS)

The master score for any belief or conclusion.

### Formula

```
CS = Σ[(A(n,i)/n) × L] − Σ[(D(n,j)/n) × L] / (Total Arguments)
```

### Variables

| Symbol | Meaning | Range |
|--------|---------|-------|
| `A(n,i)` | Agreement argument i at depth n | Recursive |
| `D(n,j)` | Disagreement argument j at depth n | Recursive |
| `n` | Depth level (1, 2, 3...) | Integer ≥ 1 |
| `L` | Linkage score for this argument | 0.0 - 1.0 |

### Implementation Notes

- Depth 1 arguments (direct) have full weight
- Each subsequent depth divides contribution by n
- Linkage score gates all contributions
- Normalize by total argument count to bound output

### Example

```javascript
function calculateConclusionScore(arguments) {
  let proSum = 0;
  let conSum = 0;
  let totalArgs = 0;

  function processArgument(arg, depth) {
    const contribution = (arg.score / depth) * arg.linkage;
    if (arg.type === 'pro') proSum += contribution;
    else conSum += contribution;
    totalArgs++;

    for (const child of arg.children) {
      processArgument(child, depth + 1);
    }
  }

  for (const arg of arguments) {
    processArgument(arg, 1);
  }

  return (proSum - conSum) / Math.max(totalArgs, 1);
}
```

---

## 2. Evidence Quality Score (EQ)

Intrinsic reliability of evidence, independent of what it's being used to prove.

### Formula

```
EQ = (IV × 0.30) + (SS × 0.25) + (R × 0.25) + (BR × 0.20)
```

### Variables

| Symbol | Meaning | Weight | Scale |
|--------|---------|--------|-------|
| `IV` | Internal Validity (methodology rigor) | 30% | 0-10 |
| `SS` | Statistical Soundness (effect size, p-values) | 25% | 0-10 |
| `R` | Replicability (independent verification) | 25% | 0-10 |
| `BR` | Bias Resistance (conflicts of interest) | 20% | 0-10 |

### Evidence Type Defaults

| Type | Typical EQ Range |
|------|------------------|
| Meta-analysis of RCTs | 9-10 |
| Single large RCT | 8-9 |
| Observational study (well-designed) | 6-7 |
| Small study, no replication | 4-5 |
| Expert opinion | 5-6 |
| Anecdote / single case | 1-2 |

---

## 3. Linkage Score (LS)

How directly evidence supports a specific conclusion.

### Formula

```
LS = (DR × 0.40) + (CS × 0.30) + (NC × 0.20) + (SC × 0.10)
```

### Variables

| Symbol | Meaning | Weight | Scale |
|--------|---------|--------|-------|
| `DR` | Direct Relevance (is this actually about the conclusion?) | 40% | 0-1 |
| `CS` | Causal Strength (does the evidence show causation?) | 30% | 0-1 |
| `NC` | Necessary Condition (is this evidence required for the conclusion?) | 20% | 0-1 |
| `SC` | Sufficient Condition (does this evidence alone prove the conclusion?) | 10% | 0-1 |

### Linkage Thresholds

| LS Range | Interpretation |
|----------|----------------|
| 0.8 - 1.0 | Core supporting evidence |
| 0.5 - 0.8 | Relevant but not definitive |
| 0.2 - 0.5 | Tangentially related |
| 0.0 - 0.2 | Essentially irrelevant |

---

## 4. Evidence Contribution (EC)

Net impact of a piece of evidence on a conclusion.

### Formula

```
EC = EQ × LS × Direction
```

Where `Direction` = +1 for pro, -1 for con.

### Total Evidence Score

```
Total ES = Σ(EC_pro) - Σ(EC_con)
```

### Why This Prevents Gaming

| Scenario | Calculation | Result |
|----------|-------------|--------|
| Strong evidence, low relevance | 9 × 0.2 = 1.8 | Minimal impact |
| Weak evidence, high relevance | 2 × 0.9 = 1.8 | Minimal impact |
| Strong evidence, high relevance | 9 × 0.95 = 8.55 | Maximum impact |

---

## 5. Truth Score (TS)

Master integration of all validity dimensions.

### Formula

```
TS = (LV × EQ × VL) ± CW
```

### Variables

| Symbol | Meaning | Range |
|--------|---------|-------|
| `LV` | Logical Validity (absence of fallacies) | 0-1 |
| `EQ` | Evidence Quality (aggregate) | 0-10, normalized to 0-1 |
| `VL` | Verification Level (independent confirmation) | 0-1 |
| `CW` | Counterargument Weight (reduces score) | 0-1 |

### Output Range

- **+1.0**: Definitively true (rare)
- **+0.5 to +0.9**: Strong evidence for truth
- **0.0 to +0.5**: Uncertain, leaning true
- **-0.5 to 0.0**: Uncertain, leaning false
- **-0.9 to -0.5**: Strong evidence against
- **-1.0**: Definitively false (rare)

---

## 6. Topic Overlap Score (TO)

Determines which beliefs belong on which topic pages.

### Formula

```
TO = (SEM × 0.40) + (TAX × 0.25) + (CIT × 0.15) + (NAV × 0.10) + (GD × 0.10)
```

### Variables

| Symbol | Meaning | Weight |
|--------|---------|--------|
| `SEM` | Semantic Overlap (embedding similarity) | 40% |
| `TAX` | Taxonomy Distance (position in topic hierarchy) | 25% |
| `CIT` | Citation Co-occurrence (shared sources) | 15% |
| `NAV` | User Navigation Behavior (click-through patterns) | 10% |
| `GD` | Graph Dependency (usage in argument trees) | 10% |

### TopicRank (for page ordering)

```
TopicRank = TO × TS × (1 + DisagreementBoost) × RecencyWeight
```

---

## 7. ReasonRank (ArgumentRank)

PageRank-style algorithm for argument importance.

### Formula

```
R(p) = (1-d)/N + d × Σ(R(q)/L(q))
```

Where:
- `R(p)` = rank of argument p
- `d` = damping factor (typically 0.85)
- `N` = total number of arguments
- `R(q)` = rank of arguments linking to p
- `L(q)` = number of outlinks from q

### Implementation

```javascript
function reasonRank(adjacencyMatrix, iterations = 100, d = 0.85) {
  const N = adjacencyMatrix.length;
  let ranks = new Array(N).fill(1 / N);

  for (let i = 0; i < iterations; i++) {
    const newRanks = new Array(N).fill(0);

    for (let j = 0; j < N; j++) {
      let sum = 0;
      for (let k = 0; k < N; k++) {
        if (adjacencyMatrix[k][j] > 0) {
          const outlinks = adjacencyMatrix[k].reduce((a, b) => a + b, 0);
          sum += ranks[k] / outlinks;
        }
      }
      newRanks[j] = (1 - d) / N + d * sum;
    }

    // Normalize
    const total = newRanks.reduce((a, b) => a + b, 0);
    ranks = newRanks.map(r => r / total);
  }

  return ranks;
}
```

---

## 8. Logical Validity Score (LVS)

Evaluates argument structure independent of content.

### Formula

```
LVS = 1 - (Σ(Fallacy_Severity × Fallacy_Weight) / Max_Possible)
```

### Fallacy Weights

| Fallacy | Severity Weight |
|---------|-----------------|
| Contradiction | 1.0 (invalidates argument) |
| Circular reasoning | 0.9 |
| False dichotomy | 0.7 |
| Straw man | 0.7 |
| Ad hominem | 0.6 |
| Appeal to authority | 0.5 |
| Hasty generalization | 0.5 |
| Slippery slope | 0.4 |
| Red herring | 0.3 |
| Appeal to emotion | 0.3 |

---

## 9. Importance Score (IS)

Real-world significance, separate from truth.

### Formula

```
IS = (SCOPE × 0.30) + (MAG × 0.30) + (REV × 0.20) + (URG × 0.20)
```

### Variables

| Symbol | Meaning | Scale |
|--------|---------|-------|
| `SCOPE` | How many people affected | 0-1 (log scale of population) |
| `MAG` | Magnitude of effect per person | 0-1 |
| `REV` | Reversibility (irreversible = higher importance) | 0-1 |
| `URG` | Urgency (time-sensitive = higher importance) | 0-1 |

---

## 10. Uniqueness Score (US)

Reduces impact of redundant arguments.

### Detection Methods

1. **Levenshtein Distance**: Edit distance < 20% of length = duplicate
2. **Jaccard Similarity**: Token overlap > 80% = duplicate
3. **TF-IDF Cosine**: Similarity > 0.85 = duplicate
4. **N-gram Analysis**: 3-gram overlap > 70% = duplicate

### Score Adjustment

```
Effective_Score = Original_Score × (1 - Redundancy_Penalty)

Where:
Redundancy_Penalty = 0.5 if soft duplicate (0.7-0.85 similarity)
Redundancy_Penalty = 0.9 if hard duplicate (>0.85 similarity)
```

---

## 11. Likelihood Score (Calibrated Probability for Cost-Benefit Analysis)

The Likelihood Score is not a subjective guess. It is a nested belief that must earn its probability through structured reasoning using ReasonRank.

### Core Formula

```
Expected Value = Predicted Impact × Likelihood Score
```

Where the Likelihood Score is a probability (0-1) derived from a competition between arguments, not from voting or averaging.

### How the Score Is Generated

#### Step 1: Likelihood as a Conclusion

When a user adds a cost or benefit (e.g., "This project will save $1M"), a second claim is implicitly created: "There is an X% chance this will happen." This probability claim becomes a nested belief node. Multiple competing probability estimates can coexist.

#### Step 2: Argument Trees Build the Score

Each competing probability estimate has its own pro/con argument tree. Arguments can branch into recursive sub-arguments. A likelihood earns strength only if:
- It has strong supporting sub-arguments
- It has weak opposing sub-arguments

Evidence types include base rates, historical data, and falsifiable assumptions.

#### Step 3: Three-Metric Recursive Scoring

Each argument is scored using three recursive metrics:

| Metric | Question | Range |
|--------|----------|-------|
| **Truth** | Is the evidence or data factually accurate? | 0-1 |
| **Linkage** | How strongly does this connect to *this specific* prediction? | 0-1 |
| **Importance** | How much does this argument move the probability? | 0-1 |

#### Argument Impact Formula

```
Impact = AdjustedTruth × Linkage × Importance

Where:
  AdjustedTruth = TruthScore × (1 - FallacyPenalty) × SubArgumentFactor
  SubArgumentFactor = 1 + (NetSubStrength / SubArgCount) × 0.3
  FallacyPenalty = Σ(|fallacy.impact| / 100)
```

Sub-arguments modify the parent's effective truth score by up to ±30%:
- Pro sub-arguments strengthen the parent argument's credibility
- Con sub-arguments weaken it

#### Step 4: ReasonRank Score per Estimate

```
ReasonRankScore = 0.5 + (ProStrength - ConStrength) / (2 × TotalArguments)

Where:
  ProStrength = Σ(proArg.truth × proArg.linkage × proArg.importance)
  ConStrength = Σ(conArg.truth × conArg.linkage × conArg.importance)
```

Bounded to [0.01, 0.99].

#### Step 5: The "Winning" Likelihood

The active Likelihood Score is **not an average**. It is the specific probability from the estimate with the highest ReasonRank score.

- If arguments for "90% likelihood" are exposed as wishful thinking (low Truth or Linkage), that estimate's ReasonRank decays.
- If arguments for "50% likelihood" are grounded in solid reference classes and survive adversarial scrutiny, 50% becomes the active Likelihood Score.

### Status Determination

| Status | Condition |
|--------|-----------|
| `calibrated` | Winner has ≥0.2 ReasonRank gap over second place, or single estimate with ≥2 pro arguments |
| `contested` | Multiple estimates with <0.2 gap between top two |
| `emerging` | Single estimate or insufficient arguments |

### Confidence Interval

```
CI = min(0.3, max(0.02, StdDev(probabilities) × ArgumentCountFactor))

Where:
  ArgumentCountFactor = max(0.5, 1 - TotalArgs × 0.03)
```

### Why This Matters

- **Combats Optimism Bias**: Proponents cannot simply assert a best-case scenario; they must justify why that outcome is *probable*.
- **Standardizes Comparisons**: A 10% chance of $10M and a 100% chance of $1M are treated as equal expected utilities.
- **Rejects Intuition**: Mathematical expected value outperforms human gut feeling on complex predictions.

### Testing Invariants

1. **Arguments with sub-arguments score differently than flat arguments**
2. **High importance arguments contribute more than low importance ones**
3. **An estimate with only con arguments has ReasonRank < 0.5**
4. **The active likelihood always comes from the highest-scoring estimate**
5. **Fallacy penalties always reduce argument impact**
6. **Sub-argument net strength modifies parent truth by at most ±30%**

---

## Implementation Checklist

### Minimum Viable Scoring

- [ ] Conclusion Score (pro/con aggregation)
- [ ] Evidence Quality (tier-based defaults)
- [ ] Basic Linkage (relevance rating 0-1)
- [ ] Simple normalization

### Full Scoring System

- [ ] Recursive depth-weighted argument aggregation
- [ ] Multi-factor evidence quality assessment
- [ ] Four-factor linkage calculation
- [ ] ReasonRank propagation
- [ ] Fallacy detection
- [ ] Redundancy detection
- [ ] Topic overlap scoring
- [ ] Importance scoring (separate from truth)

---

## Testing Your Implementation

### Invariants That Must Hold

1. **Strong evidence + weak linkage < Strong evidence + strong linkage**
2. **Redundant arguments contribute less than unique ones**
3. **Arguments with fallacies score lower than clean arguments**
4. **Deeper arguments contribute less than direct arguments**
5. **Scores bounded appropriately (no infinity, no NaN)**

### Edge Cases

- Zero arguments (return neutral score)
- All arguments on one side (cap at max, don't overflow)
- Circular argument references (damping factor prevents infinite loops)
- Identical evidence used for multiple conclusions (link separately)

---

*These algorithms are subject to refinement. The key principle is auditability: every score must be traceable to underlying data.*
