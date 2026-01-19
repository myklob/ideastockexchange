# Evidence Quality Scoring System - Integration Guide

## Overview

The Evidence Quality Scoring system implements the principle: **"Arguments matter more than credentials"**

Evidence is scored based on methodology quality, not source authority. A blog post with transparent methodology can score higher than a government report that hides its reasoning behind credentials.

## Quick Start

### 1. Server Integration ✅

The methodology challenge routes are now integrated into the server:

```javascript
// backend/server.js
import methodologyChallengeRoutes from './routes/methodologyChallenges.js';
app.use('/api/methodology-challenges', methodologyChallengeRoutes);
```

### 2. Run the Demo

See the system in action with a complete demonstration:

```bash
cd backend
npm run demo:evidence-quality
```

This will:
- Create test users (PhD researcher, blogger, evaluators)
- Submit evidence with different quality scores
- Create methodology challenges
- Evaluate challenges with community consensus
- Update ReasonRanks based on accuracy
- Show how credentials are tracked but NOT used for scoring

### 3. Seed Sample Data

Populate your database with realistic examples:

```bash
cd backend
npm run seed:evidence-quality
```

This creates:
- 6 users with varying credentials and ReasonRanks
- 4 evidence items with different quality patterns
- 3 methodology challenges (valid, invalid, partially valid)
- Full evaluation history

## API Endpoints

### Submit a Methodology Challenge

**Endpoint:** `POST /api/methodology-challenges`

**Authentication:** Required

**Request:**
```json
{
  "evidenceId": "64a7f...",
  "challengeType": "control_variables",
  "claim": "Study claims to control for income",
  "challenge": "Income data is self-reported and unreliable",
  "affectedPattern": "transparent_measurement",
  "supportingEvidence": ["evidence_id_1", "evidence_id_2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "evidenceId": "...",
    "challenger": { "username": "uncle_blogger", "reasonRank": { "overall": 0 } },
    "challengeType": "control_variables",
    "status": "pending",
    "evaluation": {
      "consensusVerdict": "pending",
      "weightedImpact": 0
    }
  },
  "message": "Methodology challenge created. It will be evaluated by the community."
}
```

### Evaluate a Challenge

**Endpoint:** `POST /api/methodology-challenges/:id/evaluate`

**Authentication:** Required

**Request:**
```json
{
  "verdict": "valid",
  "reasoning": "The challenge correctly identifies a gap in the control variables",
  "impactScore": 20
}
```

**Note:** Your evaluation is weighted by your ReasonRank, not your credentials!

### Get Challenges for Evidence

**Endpoint:** `GET /api/methodology-challenges/evidence/:evidenceId`

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "challengeType": "control_variables",
      "challenge": "...",
      "status": "accepted",
      "evaluation": {
        "consensusVerdict": "valid",
        "weightedImpact": 20
      }
    }
  ]
}
```

### Get Your Challenge History

**Endpoint:** `GET /api/methodology-challenges/user/:userId`

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 10,
    "accepted": 7,
    "refuted": 2,
    "pending": 1
  },
  "data": [...]
}
```

## Programming Examples

### Calculate Evidence Quality Score

```javascript
import Evidence from './models/Evidence.js';
import mongoose from 'mongoose';

// Create evidence
const evidence = await Evidence.create({
  title: 'Climate Study 2024',
  description: 'Analysis of CO2 levels',
  type: 'study',
  submittedBy: userId,

  // Pattern 1: Transparent Measurement (40% weight)
  methodologyTransparency: {
    hasDisclosedMethod: true,
    hasControlVariables: true,
    hasRawData: true,
    hasPeerReview: true,
  },

  // Pattern 2: Replication (20% weight)
  replication: {
    hasIndependentReplications: true,
    replicationContexts: [
      { description: 'Lab A', source: 'University X', successful: true },
      { description: 'Lab B', source: 'Company Y', successful: true },
    ],
  },

  // Pattern 3: Falsifiable Predictions (15% weight)
  falsifiability: {
    hasFalsifiablePredictions: true,
    predictions: [
      { prediction: 'CO2 > 420ppm by 2025', outcome: 'validated' },
    ],
    validatedPredictionCount: 1,
    falsifiedPredictionCount: 0,
  },

  // Pattern 4: Explicit Assumptions (25% weight)
  assumptions: {
    hasExplicitAssumptions: true,
    assumptionsList: [
      {
        assumption: 'Assumes ice cores represent historical atmosphere',
        justification: 'Ice traps air bubbles that preserve ancient atmosphere',
      },
    ],
  },
});

// Calculate quality score
await evidence.calculateQualityScore();
console.log(`Quality Score: ${evidence.qualityScore}`);
// Output: Quality Score: 92
```

### Set Linkage and Calculate Impact

```javascript
// Set how directly this evidence supports the argument
evidence.setLinkageScore(argumentId, 0.9, 'directly_proves');

// Calculate Evidence Impact = Quality × Linkage
const impact = await evidence.calculateEvidenceImpact(argumentId);
console.log(impact);
// {
//   qualityScore: 92,
//   linkageScore: 0.9,
//   evidenceImpact: 82.8
// }
```

### Submit and Evaluate a Challenge

```javascript
import MethodologyChallenge from './models/MethodologyChallenge.js';
import User from './models/User.js';

// Submit challenge
const challenge = await MethodologyChallenge.create({
  evidenceId: evidence._id,
  challenger: userId,
  challengeType: 'assumption_unjustified',
  claim: 'Study assumes prices remain stable',
  challenge: 'Price volatility was not accounted for',
  affectedPattern: 'explicit_assumptions',
});

// Evaluate challenge
const evaluator = await User.findById(evaluatorId);
await challenge.addEvaluation(
  evaluatorId,
  'valid',
  'This is a legitimate concern',
  15,  // Impact score
  evaluator.reasonRank.overall  // Evaluator's ReasonRank
);

// Calculate consensus (after 3+ evaluations)
await challenge.calculateConsensus();
// challenge.evaluation.consensusVerdict: 'valid'
// challenge.evaluation.weightedImpact: 15

// Update evidence quality
await evidence.calculateQualityScore();
// Quality reduced by 15 points
```

### Update User ReasonRank

```javascript
import User from './models/User.js';

// When a challenge is validated
const user = await User.findById(challengerId);
await user.updateMethodologyFromChallenge(challengeId, true);
// user.reasonRank.methodologyAssessment.validChallenges += 1
// user.reasonRank.overall increases

// When an evaluation aligns with consensus
await user.updateMethodologyFromEvaluation(evaluationId, true);
// user.reasonRank.methodologyAssessment.accurateEvaluations += 1
// user.reasonRank.overall increases
```

## The 4 Patterns of Argument Strength

### Pattern 1: Transparent Measurement with Controls (40%)

**What it measures:** Can you inspect the methodology and verify it's sound?

**Score breakdown:**
- ✅ Methodology disclosed (+25 points)
- ✅ Control variables (+25 points)
- ✅ Raw data available (+25 points)
- ✅ Peer reviewed (+25 points)

**Max:** 100 points

### Pattern 2: Replication Across Contexts (20%)

**What it measures:** Can others reproduce the findings?

**Score breakdown:**
- Base: 30 points for having replications
- +14 points per successful replication (max 5)

**Max:** 100 points (5+ successful replications)

### Pattern 3: Falsifiable Predictions (15%)

**What it measures:** Does the claim make specific predictions that can be proven wrong?

**Score breakdown:**
- 0 points: No predictions
- 40 points: Has predictions but not yet tested
- Up to 100: Based on validation ratio
- -20 points per falsified prediction

**Max:** 100 points

### Pattern 4: Explicit Assumptions (25%)

**What it measures:** Are assumptions clearly stated so they can be challenged?

**Score breakdown:**
- 50 points: No explicit assumptions (neutral)
- -15 points per hidden assumption exposed
- 70 points: Has explicit assumptions
- +30 points: All assumptions justified
- -10 points per challenged assumption

**Max:** 100 points

## Challenge Types

1. **measurement_method** - "Your measurement instrument is unreliable"
2. **control_variables** - "You didn't control for X confounding variable"
3. **sample_issues** - "Sample size too small / biased selection"
4. **assumption_unjustified** - "Your assumption Y is doing all the work"
5. **data_quality** - "Your data source is unreliable"
6. **analysis_method** - "Your statistical method is inappropriate"
7. **replication_failure** - "This hasn't been independently replicated"
8. **conflicts_of_interest** - "Financial incentives bias this"
9. **cherry_picking** - "You selected data to support conclusion"
10. **outdated** - "Methodology or data is outdated"

## ReasonRank Calculation

### Components (Weighted Average)

1. **Methodology Assessment (50%)**
   - Challenge validity ratio (60%): valid / (valid + invalid)
   - Evaluation accuracy (40%): accurate / total evaluations
   - Activity bonus (up to 20 points)

2. **Argument Creation (30%)**
   - Quality ratio: high-quality arguments / total created
   - Volume bonus (up to 20 points)

3. **Linkage Assessment (20%)**
   - Accuracy ratio: accurate linkages / total evaluated

### Example Calculation

```javascript
user.reasonRank = {
  methodologyAssessment: {
    challengesSubmitted: 10,
    validChallenges: 8,
    invalidChallenges: 2,
    evaluationsSubmitted: 50,
    accurateEvaluations: 45,
    score: 82  // High accuracy
  },
  argumentAssessment: {
    argumentsCreated: 20,
    highQualityArguments: 14,
    score: 76
  },
  linkageAssessment: {
    linkagesEvaluated: 30,
    accurateLinkages: 27,
    score: 90
  },
  overall: (82 × 0.50) + (76 × 0.30) + (90 × 0.20) = 82.8
};
```

### Credentials Are Tracked But NOT Used

```javascript
user.reasonRank.credentials = [
  {
    type: 'PhD',
    field: 'Climate Science',
    institution: 'MIT',
    verified: true,
    note: 'Credentials are tracked for transparency but do not affect ReasonRank'
  }
];

// PhD doesn't increase ReasonRank
// Only accurate methodology assessment does
```

## Testing

Run the test suite:

```bash
cd backend
npm test
```

Tests cover:
- All 4 pattern scoring calculations
- Challenge impact on quality scores
- ReasonRank updates
- Credential independence
- Quality × Linkage formula
- Consensus calculation

## Frontend Integration (TODO)

The backend is ready. To complete integration, create:

1. **Evidence Quality Display**
   - Show 4 pattern breakdown
   - Visual quality score
   - Challenge count and impact

2. **Challenge Submission UI**
   - Form for submitting challenges
   - Challenge type selector
   - Supporting evidence picker

3. **Challenge Evaluation UI**
   - List of pending challenges
   - Evaluation form (verdict, reasoning, impact)
   - Consensus display

4. **User ReasonRank Dashboard**
   - Show methodology assessment stats
   - Challenge history (valid/invalid)
   - Evaluation accuracy
   - Credential display (with note about non-use)

## Philosophy

> "We don't care about credentials. We don't care about institutional prestige. We care about one thing: **Does your argument survive scrutiny?**"

The Evidence Quality Scoring system makes this principle operational:

- **Arguments matter more than credentials**
- **Anyone can challenge any evidence**
- **Challenges evaluated by community, weighted by ReasonRank**
- **Valid challenges reduce evidence quality**
- **ReasonRank earned through accuracy, not credentials**
- **Credentials tracked but NOT used for scoring**

**Your uncle's blog can beat NASA if the methodology is better. The system doesn't care about credentials. It cares about whether the reasoning survives scrutiny.**

## Support

- Full documentation: `/docs/EVIDENCE_QUALITY_SCORING.md`
- API examples: `/backend/examples/evidenceQualityExample.js`
- Seed data: `/backend/seeds/evidenceQualitySeed.js`
- Tests: `/backend/tests/evidenceQualityScoring.test.js`
- Models: `/backend/models/MethodologyChallenge.js`, `/backend/models/Evidence.js`, `/backend/models/User.js`
- Routes: `/backend/routes/methodologyChallenges.js`

---

**Show us your reasoning. Let's see if it holds up.**
