# Scoring System

The Idea Stock Exchange uses a multi-dimensional scoring system to evaluate the strength and validity of beliefs based on their supporting and opposing arguments.

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CONCLUSION SCORE (CS)                    │
│                                                             │
│   CS = Σ((RtA - RtD) × ES × LC × VC × LR × UD × AI)       │
│                                                             │
│                      Final Score: 0-100                     │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
              ┌───────────────┴────────────────┐
              │                                │
    ┌─────────▼─────────┐          ┌──────────▼──────────┐
    │    SUPPORTING     │          │      OPPOSING       │
    │    ARGUMENTS      │          │     ARGUMENTS       │
    │                   │          │                     │
    │  Each scored by:  │          │   Each scored by:   │
    │  • ES (Evidence)  │          │   • ES (Evidence)   │
    │  • LC (Logic)     │          │   • LC (Logic)      │
    │  • VC (Verified)  │          │   • VC (Verified)   │
    │  • LR (Linkage)   │          │   • LR (Linkage)    │
    │  • UD (Unique)    │          │   • UD (Unique)     │
    │  • AI (Important) │          │   • AI (Important)  │
    └───────────────────┘          └─────────────────────┘
```

---

## Conclusion Score

The **Conclusion Score (CS)** represents how well-supported a belief is, ranging from 0 (strongly refuted) to 100 (strongly supported).

### Formula

```
CS = Σ((RtA - RtD) × ES × LC × VC × LR × UD × AI)
```

Where each argument contributes based on:
- **RtA**: Reason to Agree (positive value for supporting arguments)
- **RtD**: Reason to Disagree (positive value for opposing arguments)
- **ES**: Evidence Strength (0-1)
- **LC**: Logical Coherence (0-1)
- **VC**: Verification Credibility (0-1)
- **LR**: Linkage Relevance (0-1)
- **UD**: Uniqueness/Distinctiveness (0-1)
- **AI**: Argument Importance (0-1)

### Current Implementation

In the current codebase (`backend/models/Belief.js`), the calculation uses a simplified weighted average:

```javascript
calculateConclusionScore = async function() {
  // Get average scores
  const supportingAvg = averageOf(supportingArguments.scores.overall);
  const opposingAvg = averageOf(opposingArguments.scores.overall);

  // Weight by argument count
  const supportWeight = supportingArguments.length / totalArguments;
  const opposeWeight = opposingArguments.length / totalArguments;

  // Final score
  CS = (supportingAvg × supportWeight) + ((100 - opposingAvg) × opposeWeight);
}
```

**Visual Example:**

```
Belief: "Exercise improves mental health"

Supporting Arguments:
├─ Arg 1: Score 85 ████████████████░░░
├─ Arg 2: Score 72 ██████████████░░░░░
└─ Arg 3: Score 68 █████████████░░░░░░

Opposing Arguments:
├─ Arg 1: Score 45 █████████░░░░░░░░░░
└─ Arg 2: Score 52 ██████████░░░░░░░░░

Calculation:
Supporting Avg: (85 + 72 + 68) / 3 = 75
Opposing Avg: (45 + 52) / 2 = 48.5

Weights: Support = 3/5 = 0.6, Oppose = 2/5 = 0.4

CS = (75 × 0.6) + ((100 - 48.5) × 0.4)
CS = 45 + 20.6
CS = 65.6 → 66

Final Score: 66/100 (Moderately Supported)
```

---

## Score Components

Each argument is evaluated across 6 dimensions:

### 1. Evidence Strength (ES)

**What it measures:** Quality and credibility of supporting evidence.

**Range:** 0.0 to 1.0

**How it's calculated:**
```javascript
// Based on evidence credibility scores
ES = average(evidence.map(e => e.credibilityScore / 100));
```

**Visual Scale:**
```
0.0 ─────────────────────────────── 1.0
No Evidence                    Verified Research
    │         │         │         │
   0.25      0.50      0.75      1.0
  Anecdotal  Some      Studies   Peer-reviewed
   only      sources   cited     replicated
```

**Impact on Score:**
- **1.0**: Full weight to argument
- **0.5**: Half weight (reduces impact by 50%)
- **0.0**: Argument has no weight

---

### 2. Logical Coherence (LC)

**What it measures:** Absence of logical fallacies and sound reasoning.

**Range:** 0.0 to 1.0

**How it's calculated:** Via the Fallacy Detector (`backend/utils/fallacyDetector.js`)

```javascript
// Start at 1.0, deduct for fallacies
let LC = 1.0;

for (fallacy of detectedFallacies) {
  const deduction = severityMultiplier[fallacy.severity] × (fallacy.confidence / 100);
  LC -= deduction;
}

// Severity multipliers:
// high: -0.15
// medium: -0.10
// low: -0.05
```

**Visual Example:**
```
Original LC: 1.0 ████████████████████

Fallacies Detected:
├─ Ad Hominem (high, 80% conf)  → -0.12
├─ Hasty Generalization (med, 60%) → -0.06
└─ Appeal to Emotion (med, 40%) → -0.04

Final LC: 0.78 ███████████████░░░░░
```

---

### 3. Verification Credibility (VC)

**What it measures:** Percentage of evidence that has been independently verified.

**Range:** 0.0 to 1.0

**How it's calculated:**
```javascript
// Based on evidence verification status
const verifiedEvidence = evidence.filter(e => e.verificationStatus === 'verified');
VC = verifiedEvidence.length / evidence.length;

// If no evidence
if (evidence.length === 0) VC = 0.5; // Neutral
```

**Visual Scale:**
```
Evidence Status:
[✓] Verified    = 1.0 points
[?] Unverified  = 0.5 points
[✗] Disputed    = 0.0 points

VC = sum(points) / count
```

---

### 4. Linkage Relevance (LR)

**What it measures:** How directly the argument relates to the conclusion.

**Range:** 0.0 to 1.0

**How it's calculated:** Currently based on user-assigned scores and relatedBeliefs linkageStrength.

**Visual Example:**
```
Belief: "Universal healthcare is beneficial"

Argument: "Reduces medical bankruptcies"
├─ LR = 0.95 (Directly relevant)
│  ████████████████████

Argument: "Other countries have it"
├─ LR = 0.60 (Somewhat relevant)
│  ████████████░░░░░░░░

Argument: "Doctors make too much money"
├─ LR = 0.30 (Tangential)
│  ██████░░░░░░░░░░░░░░
```

---

### 5. Uniqueness/Distinctiveness (UD)

**What it measures:** How original the argument is compared to others.

**Range:** 0.0 to 1.0

**How it's calculated:** Via Redundancy Detector (`backend/utils/redundancyDetector.js`)

```javascript
calculateUniqueness = function(argument, allArguments) {
  // Find most similar argument
  let maxSimilarity = 0;

  for (other of allArguments) {
    const similarity = calculateSimilarity(argument, other);
    maxSimilarity = Math.max(maxSimilarity, similarity);
  }

  // Uniqueness is inverse of similarity
  UD = 1 - maxSimilarity;
}

// Similarity uses 4 algorithms:
// - Levenshtein distance (20% weight)
// - Jaccard similarity (30% weight)
// - TF-IDF cosine (30% weight)
// - N-gram analysis (20% weight)
```

**Visual Example:**
```
Arguments for "Climate change is real":

1. "97% of scientists agree" (UD: 0.85)
   ████████████████░░░░

2. "Temperature records show warming" (UD: 0.92)
   ██████████████████░░

3. "Most climate experts concur" (UD: 0.35)  ← Similar to #1
   ███████░░░░░░░░░░░░░

4. "Ice core data demonstrates change" (UD: 0.88)
   █████████████████░░░
```

---

### 6. Argument Importance (AI)

**What it measures:** The significance of the argument's impact on the conclusion.

**Range:** 0.0 to 1.0

**How it's calculated:** Based on:
- Number of sub-arguments
- Vote ratio
- Evidence count
- User-assigned importance

```javascript
// Simplified calculation
AI = (votes.up - votes.down) / (votes.up + votes.down + 1) × 0.5 + 0.5;
// Normalized to 0-1 range
```

---

## Combined Effect

The multiplicative nature of the formula means that weakness in any dimension significantly impacts the final score:

```
Example Argument Scoring:

Content: "Studies show exercise reduces depression symptoms"
Type: Supporting

Individual Scores:
├─ ES = 0.85 (Strong evidence)
├─ LC = 0.95 (Minor appeal to authority)
├─ VC = 0.75 (Most evidence verified)
├─ LR = 0.90 (Highly relevant)
├─ UD = 0.80 (Fairly unique)
└─ AI = 0.70 (Moderately important)

Combined Multiplier:
0.85 × 0.95 × 0.75 × 0.90 × 0.80 × 0.70 = 0.304

If RtA base score = 100
Final contribution = 100 × 0.304 = 30.4
```

**Why Multiplicative?**

An argument that's:
- Well-evidenced but illogical → Low score
- Logical but irrelevant → Low score
- Relevant but redundant → Low score
- Unique but unimportant → Low score

All dimensions must be strong for high scores.

---

## Frontend Display

The `ScoreBreakdown.jsx` component visualizes these scores:

```jsx
const components = [
  {
    key: 'ES',
    label: 'Evidence Strength',
    value: scores.ES,
    description: 'Quality and credibility of supporting evidence',
    color: 'blue'
  },
  {
    key: 'LC',
    label: 'Logical Coherence',
    value: scores.LC,
    description: 'Absence of logical fallacies and sound reasoning',
    color: 'purple'
  },
  // ... etc
];

// Color coding based on score
const getColor = (score) => {
  if (score >= 70) return 'green';   // Strong
  if (score >= 40) return 'yellow';  // Moderate
  return 'red';                       // Weak
};
```

**UI Representation:**
```
┌─────────────────────────────────────┐
│      CONCLUSION SCORE: 67           │
│      ████████████████████████░░░░░░ │
└─────────────────────────────────────┘

Evidence Strength     85  █████████████████░░░
Logical Coherence     92  ██████████████████░░
Verification          75  ███████████████░░░░░
Linkage Relevance     88  █████████████████░░░
Uniqueness            72  ██████████████░░░░░░
Argument Importance   68  █████████████░░░░░░░

Supporting: 12    Opposing: 8
```

---

## Score Interpretation Guide

### Conclusion Score Ranges

| Range | Interpretation | Color |
|-------|----------------|-------|
| 80-100 | Strongly supported, well-evidenced | Green |
| 60-79 | Moderately supported, some concerns | Green/Yellow |
| 40-59 | Contested, balanced arguments | Yellow |
| 20-39 | Weakly supported, strong opposition | Yellow/Red |
| 0-19 | Likely false, overwhelming opposition | Red |

### Component Score Meanings

| Score | Quality Level |
|-------|---------------|
| 0.9-1.0 | Excellent |
| 0.7-0.89 | Good |
| 0.5-0.69 | Average |
| 0.3-0.49 | Below Average |
| 0.0-0.29 | Poor |

---

## Future Enhancements

### Planned Improvements:

1. **Temporal Weighting** - Recent arguments weighted more heavily
2. **Source Reputation** - Author reputation affects argument weight
3. **Cross-Belief Analysis** - Related beliefs influence scores
4. **Bayesian Updating** - Prior beliefs adjusted by new evidence
5. **Confidence Intervals** - Show uncertainty ranges for scores

### Advanced Formulas (Planned):

**Truth Score:**
```
Truth Score = (LV × EQ × VL) ± CW
Where:
- LV = Logical Validity
- EQ = Evidence Quality
- VL = Verification Level
- CW = Counterargument Weight
Range: -1 (false) to +1 (true)
```

**Epistemic Impact:**
```
Epistemic Impact = Truth Score × Reach × Linkage Strength
```

**Belief Stability:**
```
Stability = f(depth_of_analysis, unresolved_subargs, score_variance)
```

---

## Next Steps

- Learn about the [Algorithms](Algorithms) that calculate these scores
- See the [API Reference](API-Reference) for score calculation endpoints
- Explore [Frontend Components](Frontend-Components) for UI implementation

---

**Remember:** The scoring system is designed to promote evidence-based reasoning, not to determine absolute truth. High scores indicate well-supported arguments, not necessarily correct ones.
