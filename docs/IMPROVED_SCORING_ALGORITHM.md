# Improved Belief Scoring Algorithm

## Overview

This document describes the enhanced scoring algorithm that implements the principles outlined in the "Why Every Belief Must Face Its Critics" manifesto. The new algorithm transforms the simple pro/con ratio approach into a sophisticated multi-dimensional evaluation system.

---

## Key Improvements

### 1. Dynamic Argument Health Monitoring

Every argument now tracks 5 health metrics that reflect its current validity:

| Metric | Description | How It's Calculated |
|--------|-------------|---------------------|
| **Strength** | Evidence network power | Quality and quantity of supporting evidence (0-100) |
| **Integrity** | Logic connection strength | Based on logical coherence and absence of fallacies (0-100) |
| **Freshness** | Evidence currency | Decays 2 points per month since creation (0-100) |
| **Relevance** | Importance to conclusion | Linkage relevance (60%) + argument importance (40%) |
| **Impact** | Real-world significance | Vote ratio (50%) + stakeholder magnitude (50%) |

**Implementation:** `ArgumentSchema.methods.calculateHealthMetrics()`

**Example:**
```javascript
{
  healthMetrics: {
    strength: 85,    // Strong evidence base
    integrity: 92,   // Highly logical
    freshness: 88,   // Recent evidence
    relevance: 95,   // Directly relevant
    impact: 72       // Significant real-world stakes
  }
}
```

---

### 2. Argument Lifecycle Tracking

Arguments evolve through distinct lifecycle stages based on challenges and evidence:

| Status | Meaning | Impact on Score |
|--------|---------|----------------|
| **Active** | Currently valid | 100% weight (×1.0) |
| **Weakened** | Countered but not refuted | 70% weight (×0.7) |
| **Conditional** | Valid under specific circumstances | 80% weight (×0.8) |
| **Outdated** | Superseded by new evidence | 30% weight (×0.3) |
| **Refuted** | Disproven | 10% weight (×0.1) |

**Automatic Detection:**
- **Refuted**: Strong opposing sub-arguments (avg > 80) + weak support (avg < 30)
- **Weakened**: Moderate opposition (avg > 60) exceeding support by 20+ points
- **Outdated**: Freshness score < 30
- **Conditional**: Has conditional validity conditions defined

**Implementation:** `ArgumentSchema.methods.updateLifecycleStatus()`

**Example:**
```
Argument: "Nuclear is too expensive"
Status: Weakened (2023)
Reason: Cost data from 2015, new SMR technology changes economics
```

---

### 3. ReasonRank Algorithm

Replaces simple averaging with sophisticated multi-factor ranking:

**Formula:**
```
ReasonRank = (Direct Evidence Support × 40%) +
             (Resistance to Counterarguments × 30%) +
             (Logical Network Position × 20%) +
             (Expert Consensus × 10%)
```

**Component Breakdown:**

#### Direct Evidence Support (40%)
- Evidence strength (quality + quantity): 60%
- Verification credibility: 40%
- Range: 0-100

#### Resistance to Counterarguments (30%)
- How well argument withstands challenges
- Based on ratio of supporting vs. opposing sub-arguments
- Adjusted by quality of counterarguments addressed
- Range: 0-100

#### Logical Network Position (20%)
- Centrality in debate network
- Ratio of supported by vs. challenged by arguments
- Consistency with established facts
- Range: 0-100

#### Expert Consensus (10%)
- Vote ratio (up votes / total votes)
- Author reputation (future enhancement)
- Range: 0-100

**Implementation:** `ArgumentSchema.methods.calculateReasonRankScore()`

**Example:**
```javascript
// Argument: "Exercise improves mental health"
ReasonRank = (0.87 × 40) +    // Strong evidence: 87/100
             (0.82 × 30) +    // Good resistance: 82/100
             (0.65 × 20) +    // Moderate centrality: 65/100
             (0.91 × 10)      // High consensus: 91/100
           = 34.8 + 24.6 + 13.0 + 9.1
           = 81.5 → 82/100
```

---

### 4. Enhanced Belief Conclusion Score

The conclusion score now considers argument lifecycle and quality:

**Old Formula (Simple):**
```javascript
CS = (supportingAvg × supportWeight) +
     ((100 - opposingAvg) × opposeWeight)
```

**New Formula (Enhanced):**
```javascript
// 1. Calculate each argument's ReasonRank
for each argument:
  reasonRank = calculateReasonRankScore()
  lifecycle = updateLifecycleStatus()

// 2. Apply lifecycle multipliers
weightedScore = reasonRank × lifecycleMultiplier

// 3. Filter out refuted/outdated (they count less)
activeSupporting = supporting.filter(not refuted/outdated)
activeOpposing = opposing.filter(not refuted/outdated)

// 4. Calculate weighted averages
supportingAvg = sum(weightedScores) / count
opposingAvg = sum(weightedScores) / count

// 5. Weight by both quality AND quantity
supportWeight = activeSupporting.length / totalArgs
opposeWeight = activeOpposing.length / totalArgs

// 6. Final score
CS = (supportingAvg × supportWeight × 100 +
      (100 - opposingAvg) × opposeWeight × 100) / 100
```

**Key Improvements:**
- ✅ Uses sophisticated ReasonRank instead of simple averages
- ✅ Applies lifecycle multipliers (refuted arguments barely count)
- ✅ Filters out outdated arguments
- ✅ Considers both quality (scores) and quantity (count)
- ✅ Transparent calculation with detailed breakdown

**Implementation:** `BeliefSchema.methods.calculateConclusionScore()`

---

### 5. Score Interpretation

Provides human-readable context for scores:

| Range | Level | Description | Confidence |
|-------|-------|-------------|------------|
| 80-100 | Strongly Supported | Well-evidenced, minimal valid opposition | High |
| 60-79 | Moderately Supported | Good evidence, some valid concerns | Moderate |
| 40-59 | Contested | Balanced arguments, unclear position | Low |
| 20-39 | Weakly Supported | Strong opposition, limited support | Moderate |
| 0-19 | Likely False | Overwhelming opposition | High |

**Implementation:** `BeliefSchema.methods.getScoreInterpretation()`

---

### 6. Conditional Truth Detection

Arguments can specify conditions under which they're valid:

**Schema:**
```javascript
conditionalOn: [{
  condition: "Carbon price > $50/ton",
  validityScore: 85
}, {
  condition: "Build time < 10 years",
  validityScore: 65
}]
```

**Example:**
```
Argument: "Nuclear is cost-effective"
Status: Conditional

Conditions:
- IF carbon price > $50/ton → 85% valid
- IF construction time < 10 years → 65% valid
- OTHERWISE → 35% valid
```

This escapes binary true/false thinking and captures nuance.

---

### 7. Stakeholder Impact Analysis

Tracks who benefits/is harmed by argument being true:

**Schema:**
```javascript
stakeholderImpacts: [{
  stakeholder: "Nuclear industry",
  impact: "benefits",
  magnitude: 8  // -10 to +10
}, {
  stakeholder: "Coal workers",
  impact: "harmed",
  magnitude: -6
}]
```

**Purpose:**
- Follow the incentives (who promotes this belief?)
- Identify conflicts of interest
- Surface hidden agendas
- Enable transparent interest analysis

**Implementation:** Added to Argument model

---

## Complete Scoring Flow

```
┌─────────────────────────────────────────────────────────┐
│                     USER REQUEST                        │
│            Calculate Belief Conclusion Score            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FOR EACH ARGUMENT:                         │
│                                                          │
│  1. Calculate Health Metrics                            │
│     ├─ Strength (evidence quality + quantity)           │
│     ├─ Integrity (logical coherence)                    │
│     ├─ Freshness (evidence currency)                    │
│     ├─ Relevance (linkage + importance)                 │
│     └─ Impact (votes + stakeholder magnitude)           │
│                                                          │
│  2. Calculate ReasonRank Score                          │
│     ├─ Direct Evidence Support (40%)                    │
│     ├─ Resistance to Counterarguments (30%)             │
│     ├─ Logical Network Position (20%)                   │
│     └─ Expert Consensus (10%)                           │
│                                                          │
│  3. Update Lifecycle Status                             │
│     ├─ Active / Weakened / Conditional                  │
│     └─ Outdated / Refuted                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FILTER & WEIGHT:                           │
│                                                          │
│  1. Filter out refuted/outdated (minimal weight)        │
│                                                          │
│  2. Apply lifecycle multipliers                         │
│     ├─ Active: ×1.0                                     │
│     ├─ Weakened: ×0.7                                   │
│     ├─ Conditional: ×0.8                                │
│     ├─ Outdated: ×0.3                                   │
│     └─ Refuted: ×0.1                                    │
│                                                          │
│  3. Calculate weighted averages                         │
│     ├─ Supporting average                               │
│     └─ Opposing average                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           CONCLUSION SCORE:                             │
│                                                          │
│  CS = (supportingAvg × supportWeight × 100 +            │
│        (100 - opposingAvg) × opposeWeight × 100) / 100  │
│                                                          │
│  Result: 0-100 (clamped to valid range)                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           DETAILED BREAKDOWN:                           │
│                                                          │
│  • Conclusion Score                                     │
│  • Supporting arguments analysis                        │
│    ├─ Count, avg scores, health metrics                 │
│    └─ Lifecycle distribution                            │
│  • Opposing arguments analysis                          │
│    ├─ Count, avg scores, health metrics                 │
│    └─ Lifecycle distribution                            │
│  • Human-readable interpretation                        │
│    ├─ Level (Strongly Supported, etc.)                  │
│    ├─ Description                                       │
│    └─ Confidence                                        │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Calculate Score
```
POST /api/beliefs/:id/calculate-score
Authorization: Required (Admin/Moderator)

Response:
{
  "success": true,
  "data": {
    "conclusionScore": 67
  }
}
```

### Get Score Breakdown
```
GET /api/beliefs/:id/score-breakdown
Authorization: Optional

Response:
{
  "success": true,
  "data": {
    "conclusionScore": 67,
    "supporting": {
      "count": 12,
      "avgOverall": 72,
      "avgReasonRank": 68,
      "avgHealthMetrics": {
        "strength": 75,
        "integrity": 85,
        "freshness": 82,
        "relevance": 88,
        "impact": 65
      },
      "lifecycleDistribution": {
        "active": 10,
        "weakened": 2
      }
    },
    "opposing": {
      "count": 8,
      "avgOverall": 58,
      "avgReasonRank": 52,
      "avgHealthMetrics": {
        "strength": 60,
        "integrity": 72,
        "freshness": 65,
        "relevance": 70,
        "impact": 55
      },
      "lifecycleDistribution": {
        "active": 6,
        "weakened": 1,
        "outdated": 1
      }
    },
    "interpretation": {
      "level": "Moderately Supported",
      "description": "Good evidence but some valid concerns or counterarguments exist",
      "color": "green",
      "confidence": "moderate"
    }
  }
}
```

---

## Example Scenario

### Belief: "Universal Basic Income is beneficial"

**Supporting Arguments:**

1. **"Reduces poverty and inequality"**
   - ReasonRank: 78
   - Lifecycle: Active
   - Health Metrics:
     * Strength: 85 (multiple studies)
     * Integrity: 90 (sound logic)
     * Freshness: 92 (recent data)
     * Relevance: 95 (directly relevant)
     * Impact: 75 (significant stakes)

2. **"Provides economic stimulus"**
   - ReasonRank: 65
   - Lifecycle: Conditional
   - Conditions: "If inflation remains < 3%"
   - Health Metrics:
     * Strength: 70
     * Integrity: 85
     * Freshness: 88
     * Relevance: 80
     * Impact: 65

3. **"Similar programs work in other countries"**
   - ReasonRank: 52
   - Lifecycle: Weakened
   - Reason: Different economic contexts
   - Health Metrics:
     * Strength: 60
     * Integrity: 75
     * Freshness: 70
     * Relevance: 65
     * Impact: 50

**Opposing Arguments:**

1. **"Too expensive for federal budget"**
   - ReasonRank: 72
   - Lifecycle: Active
   - Health Metrics:
     * Strength: 80
     * Integrity: 88
     * Freshness: 90
     * Relevance: 92
     * Impact: 85

2. **"Reduces work incentive"**
   - ReasonRank: 58
   - Lifecycle: Weakened
   - Reason: Mixed evidence from pilots
   - Health Metrics:
     * Strength: 65
     * Integrity: 70
     * Freshness: 75
     * Relevance: 85
     * Impact: 70

**Calculation:**

```javascript
// Apply lifecycle multipliers
Supporting weighted scores:
- Arg 1: 78 × 1.0 = 78
- Arg 2: 65 × 0.8 = 52  (conditional)
- Arg 3: 52 × 0.7 = 36  (weakened)
Supporting avg: (78 + 52 + 36) / 3 = 55.3

Opposing weighted scores:
- Arg 1: 72 × 1.0 = 72
- Arg 2: 58 × 0.7 = 40  (weakened)
Opposing avg: (72 + 40) / 2 = 56

// Weight by count
Support weight: 3/5 = 0.6
Oppose weight: 2/5 = 0.4

// Final score
CS = (55.3 × 0.6 × 100 + (100 - 56) × 0.4 × 100) / 100
CS = (33.2 + 17.6)
CS = 50.8 → 51

Interpretation: CONTESTED
"Balanced arguments on both sides, unclear which position is stronger"
Confidence: LOW
```

---

## Migration Notes

The new fields are backwards compatible. Existing arguments will use defaults:

- `lifecycleStatus`: 'active'
- `healthMetrics`: All default to 50
- `counterargumentResistance`: 50
- `networkMetrics`: Defaults to 0
- `conditionalOn`: []
- `stakeholderImpacts`: []

The enhanced scoring will work with existing data, but benefits fully when new fields are populated.

---

## Benefits Over Old Algorithm

| Old Algorithm | New Algorithm |
|---------------|---------------|
| Simple average | ReasonRank with 4 factors |
| Binary active/flagged | 5 lifecycle stages |
| No health tracking | 5 dynamic health metrics |
| No lifecycle evolution | Tracks argument death/weakening |
| No conditional truth | Captures nuanced conditions |
| No interest analysis | Stakeholder impact tracking |
| Static scores | Dynamic, evolving scores |
| Opaque calculation | Transparent breakdown |
| Count-based weighting | Quality AND quantity weighting |
| No context | Human-readable interpretation |

---

## Alignment with Manifesto

This implementation directly addresses the manifesto's key principles:

✅ **Dynamic Argument Health Monitoring**: 5 metrics (Strength, Integrity, Freshness, Relevance, Impact)

✅ **ReasonRank Algorithm**: 4-factor ranking (Evidence 40%, Resistance 30%, Network 20%, Consensus 10%)

✅ **Argument Evolution Tracking**: Lifecycle (Active, Weakened, Outdated, Refuted, Conditional)

✅ **Conditional Truth Detection**: Arguments can specify validity conditions

✅ **Interest Analysis**: Stakeholder impact tracking

✅ **Transparency**: Detailed score breakdown API

✅ **Steelman Enforcement**: Best arguments weighted highest via ReasonRank

✅ **Breaking Amnesia Cycles**: Argument lifecycle prevents resurrection of refuted claims

---

## Future Enhancements

1. **Temporal Weighting**: Recent arguments weighted more heavily
2. **Author Reputation**: Expert opinions weighted higher in consensus
3. **Cross-Belief Network Analysis**: Related beliefs influence scores
4. **Bayesian Updating**: Prior beliefs adjusted by new evidence
5. **Confidence Intervals**: Show uncertainty ranges
6. **Automated Lifecycle Detection**: AI-powered argument status updates
7. **Argument Obituaries**: Track why arguments died and what killed them
8. **Breakpoint Detection**: Find where arguments break down

---

## References

- Manifesto: "Why Every Belief Must Face Its Critics"
- Implementation: `backend/models/Argument.js` (lines 119-390)
- Implementation: `backend/models/Belief.js` (lines 100-273)
- API: `backend/controllers/beliefController.js` (lines 268-294)
- Routes: `backend/routes/beliefs.js` (line 22)

---

**Last Updated:** 2025-11-22
**Version:** 1.0
**Status:** Implemented
