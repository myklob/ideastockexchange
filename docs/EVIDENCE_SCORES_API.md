# Evidence Scores API Documentation

## Overview

The Evidence Scores system implements credential-agnostic evaluation of evidence based on methodological rigor. This system allows anyone to submit methodology claims about evidence, challenge those claims, and evaluate challenges - with ReasonRank rewards for accurate assessments.

**Core Formula:**
```
Evidence Impact = Quality Score × Linkage Score
```

Where:
- **Quality Score (0-100)**: How well does the methodology survive challenges?
- **Linkage Score (0-100)**: How directly does this prove the specific claim?
- **Evidence Impact (0-100)**: The final weight this evidence carries

## The 4 Patterns of Argument Strength

Quality Score is calculated from 4 methodology patterns:

1. **Transparent Measurement (30%)**: Showed methodology, controlled for alternatives, data available
2. **Replication Across Contexts (30%)**: Multiple independent groups, different methods, similar conclusions
3. **Falsifiable Predictions (20%)**: Made specific testable predictions that were validated
4. **Explicit Assumptions (20%)**: Clearly stated assumptions so they can be challenged

## API Endpoints

### Methodology Claims

#### Create Methodology Claim
```http
POST /api/evidence/:evidenceId/methodology-claims
Authorization: Bearer {token}

{
  "claim": "This used random assignment",
  "claimType": "random-assignment",
  "details": "Participants were randomly assigned using block randomization stratified by age and gender",
  "sourceReference": {
    "section": "Methods, page 3",
    "url": "https://example.com/study#methods",
    "quote": "Participants were randomly assigned..."
  }
}
```

**Claim Types:**
- `measurement-method` - "We used double-blind trials"
- `sample-size` - "N=5000 participants"
- `control-variables` - "Controlled for age, income, geography"
- `random-assignment` - "Participants were randomly assigned"
- `replication` - "Replicated across 3 independent studies"
- `validation` - "Instrument validated in prior research"
- `transparency` - "Data and code publicly available"
- `peer-review` - "Published in peer-reviewed journal"
- `pre-registration` - "Study pre-registered before data collection"
- `conflict-disclosure` - "No conflicts of interest"
- `falsifiable-prediction` - "Made specific testable predictions"
- `explicit-assumptions` - "Clearly stated our assumptions"

#### Get Methodology Claims for Evidence
```http
GET /api/evidence/:evidenceId/methodology-claims

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "claim": "This used random assignment",
      "claimType": "random-assignment",
      "credibilityScore": 75,
      "status": "validated",
      "networkEvaluation": {
        "validChallengeCount": 1,
        "invalidChallengeCount": 3,
        "strengthScore": 75
      },
      "challenges": [...]
    }
  ],
  "count": 5
}
```

#### Get Single Methodology Claim
```http
GET /api/methodology-claims/:id

Response includes full challenge details and evaluations.
```

### Methodology Challenges

#### Submit Challenge to Methodology Claim
```http
POST /api/methodology-claims/:claimId/challenges
Authorization: Bearer {token}

{
  "challenge": "Your multipliers are from 2010 data, but labor markets changed significantly. Using outdated multipliers overstates job creation.",
  "challengeType": "outdated-data",
  "supportingEvidence": {
    "description": "More recent studies show lower multipliers",
    "sources": [
      {
        "url": "https://example.com/study2020",
        "title": "Updated Labor Market Analysis 2020",
        "author": "Smith et al.",
        "quote": "Multiplier effects have declined by 30% since 2010"
      }
    ]
  }
}
```

**Challenge Types:**
- `confounding-variable` - "You didn't control for X"
- `outdated-data` - "Your data is from 2010, context has changed"
- `small-sample` - "N=50 is too small for this claim"
- `selection-bias` - "Your sample isn't representative"
- `measurement-error` - "Your instrument doesn't measure what you claim"
- `unjustified-assumption` - "You assume X without evidence"
- `lack-of-replication` - "No independent verification"
- `conflicts-of-interest` - "Undisclosed financial incentives"
- `p-hacking` - "Looks like data was cherry-picked"
- `circular-reasoning` - "Your evidence assumes your conclusion"
- `lack-of-transparency` - "Data/methods not available"
- `falsification` - "This claim contradicts the source data"
- `misrepresentation` - "Quote taken out of context"

#### Evaluate a Challenge
```http
POST /api/methodology-challenges/:challengeId/evaluate
Authorization: Bearer {token}

{
  "isValid": true,
  "reasoning": "The challenger is correct - the study uses 2010 multipliers which don't account for automation's impact on job creation. This is a valid methodological concern.",
  "confidence": 85
}
```

**Parameters:**
- `isValid` (boolean): Is this a valid methodological challenge?
- `reasoning` (string): Why you think the challenge is valid or invalid
- `confidence` (0-100): How confident are you in this assessment?

**ReasonRank Rewards:**
- **Challenger rewards** (if challenge is validated):
  - Valid challenge: +5 to +15 RR based on consensus strength
  - Invalid challenge: -3 to -10 RR based on consensus strength
- **Evaluator rewards** (after 3+ evaluations):
  - Accurate evaluation: +2 to +8 RR based on confidence and consensus
  - Inaccurate evaluation: -1 to -5 RR based on confidence

#### Get Challenges for Claim
```http
GET /api/methodology-claims/:claimId/challenges

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "challenge": "Your multipliers are from 2010 data...",
      "challengeType": "outdated-data",
      "challenger": {
        "username": "your_uncle",
        "reasonRank": 45
      },
      "networkConsensus": {
        "isValid": true,
        "confidenceScore": 85,
        "evaluationCount": 5,
        "validCount": 4,
        "invalidCount": 1
      },
      "reasonRankImpact": {
        "challengerReward": 12,
        "evaluatorRewards": [...]
      },
      "status": "accepted"
    }
  ]
}
```

### Evidence Quality Breakdown

#### Get Full Methodology Breakdown
```http
GET /api/evidence/:evidenceId/methodology-breakdown

Response:
{
  "success": true,
  "data": {
    "qualityScore": 68,
    "linkageScore": 75,
    "evidenceImpact": 51,
    "patternScores": {
      "transparentMeasurement": 70,
      "replicationAcrossContexts": 65,
      "falsifiablePredictions": 60,
      "explicitAssumptions": 75
    },
    "claims": [
      {
        "id": "...",
        "claim": "This used random assignment",
        "type": "random-assignment",
        "credibilityScore": 75,
        "status": "validated",
        "challengeCount": 4,
        "validChallenges": 1,
        "invalidChallenges": 3,
        "challenges": [...]
      }
    ]
  },
  "explanation": {
    "qualityScore": "How well the methodology survives scrutiny (0-100)",
    "linkageScore": "How directly this proves the claim (0-100)",
    "evidenceImpact": "Quality × Linkage = Final weight (0-100)"
  }
}
```

#### Recalculate Evidence Quality Score
```http
PUT /api/evidence/:evidenceId/recalculate-quality

Response:
{
  "success": true,
  "data": {
    "qualityScore": 68,
    "linkageScore": 75,
    "evidenceImpact": 51,
    "methodologyPatternScores": {
      "transparentMeasurement": 70,
      "replicationAcrossContexts": 65,
      "falsifiablePredictions": 60,
      "explicitAssumptions": 75
    }
  }
}
```

### ReasonRank Tracking

#### Get User's Methodology ReasonRank
```http
GET /api/users/:userId/methodology-reasonrank

Response:
{
  "success": true,
  "data": {
    "summary": {
      "totalMethodologyReasonRank": 127,
      "challengerReasonRank": 85,
      "evaluatorReasonRank": 42,
      "challengesSubmitted": 12,
      "challengesEvaluated": 28
    },
    "challengesSubmitted": [
      {
        "_id": "...",
        "challenge": "Your multipliers are from 2010...",
        "networkConsensus": {
          "isValid": true,
          "confidenceScore": 85
        },
        "reasonRankImpact": {
          "challengerReward": 12
        }
      }
    ],
    "challengesEvaluated": [...]
  }
}
```

## Usage Examples

### Example 1: Challenging Government Data

**Scenario:** Government claims "Policy X will create 100,000 jobs" based on economic modeling.

**Step 1:** Someone submits methodology claims:
```javascript
// Claim 1: "We used Bureau of Labor Statistics multipliers"
POST /api/evidence/{evidenceId}/methodology-claims
{
  "claim": "Job creation estimated using BLS input-output multipliers",
  "claimType": "measurement-method",
  "details": "Applied standard BLS employment multipliers to estimate indirect job creation"
}

// Claim 2: "We assumed 80% implementation rate"
POST /api/evidence/{evidenceId}/methodology-claims
{
  "claim": "Model assumes 80% voluntary participation rate",
  "claimType": "explicit-assumptions",
  "details": "Economic impact calculated assuming 80% of eligible businesses participate"
}
```

**Step 2:** Your uncle (an accountant) challenges:
```javascript
POST /api/methodology-claims/{claimId}/challenges
{
  "challenge": "Your multipliers are from 2010 data, but labor markets changed significantly post-automation. Using outdated multipliers overstates job creation.",
  "challengeType": "outdated-data",
  "supportingEvidence": {
    "description": "Recent studies show employment multipliers have declined",
    "sources": [...]
  }
}
```

**Step 3:** Network evaluates the challenge:
```javascript
// Evaluator 1 (high ReasonRank user)
POST /api/methodology-challenges/{challengeId}/evaluate
{
  "isValid": true,
  "reasoning": "Correct - 2010 multipliers don't account for automation's impact",
  "confidence": 90
}

// Evaluator 2
POST /api/methodology-challenges/{challengeId}/evaluate
{
  "isValid": true,
  "reasoning": "Valid point about outdated data",
  "confidence": 75
}

// Evaluator 3
POST /api/methodology-challenges/{challengeId}/evaluate
{
  "isValid": true,
  "reasoning": "The challenger identified a real methodological flaw",
  "confidence": 85
}
```

**Result:**
- Challenge is validated (3/3 evaluators agree it's valid)
- Your uncle earns +12 ReasonRank (despite having no economics credentials)
- Evaluators earn +5 to +7 ReasonRank each (for accurate assessment)
- Methodology claim's credibility score drops from 50 to 35
- Evidence quality score drops from 60 to 42
- Evidence impact drops from 45 to 31

**The system elevated your uncle's valid argument regardless of his credentials.**

### Example 2: Defending Good Methodology

**Scenario:** Someone challenges a well-designed study claiming the methodology is flawed.

**Step 1:** Bad-faith challenge:
```javascript
POST /api/methodology-claims/{claimId}/challenges
{
  "challenge": "This study is biased because it was funded by the government",
  "challengeType": "conflicts-of-interest"
}
```

**Step 2:** Network evaluates:
```javascript
// Multiple evaluators recognize this is ad hominem, not methodological
POST /api/methodology-challenges/{challengeId}/evaluate
{
  "isValid": false,
  "reasoning": "Government funding alone doesn't invalidate methodology. Need evidence of actual bias in methods.",
  "confidence": 85
}
```

**Result:**
- Challenge is rejected (network consensus: invalid)
- Challenger loses -8 ReasonRank (for invalid challenge)
- Methodology claim gains +5 credibility (survived invalid challenge)
- Evaluators earn +5 to +7 ReasonRank (for accurate rejection)

**The system penalized the invalid challenge and rewarded those who correctly identified it.**

## How to Earn ReasonRank

### As a Challenger (regardless of credentials)

1. **Find methodological flaws** in evidence claims
2. **Submit specific challenges** pointing to the flaw
3. **Provide supporting evidence** when possible
4. **Earn rewards** when network validates your challenge

**Good challenges:**
- "You didn't control for confounding variable X"
- "Your sample size is too small for subgroup analysis"
- "Your data is outdated given recent changes"
- "Your assumption Y is unjustified by the source"

**Bad challenges:**
- "This source is biased" (ad hominem)
- "I don't trust this journal" (appeal to authority)
- "This contradicts my beliefs" (not methodological)

### As an Evaluator (regardless of credentials)

1. **Evaluate challenges** based on methodological merit
2. **Ignore credentials** of challenger and claim submitter
3. **Be accurate** - rewards depend on aligning with network consensus
4. **Be confident** when you're sure, uncertain when you're not

**Your ReasonRank increases when:**
- You correctly identify valid methodological challenges
- You correctly reject invalid challenges
- Your assessments align with network consensus

**Your ReasonRank decreases when:**
- You approve invalid challenges
- You reject valid challenges
- Your assessments contradict network consensus

## Integration with Existing Argument System

Evidence with methodology claims automatically contributes to:

1. **Argument Evidence Strength**: Evidence Impact feeds into argument's `evidenceStrength` dimension
2. **ReasonRank**: Methodology RR feeds into overall user ReasonRank
3. **Belief Scores**: High-impact evidence strengthens linked arguments → strengthens belief scores
4. **What Links Here**: Evidence quality affects all arguments that cite it

## Philosophy: Credentials Don't Matter, Arguments Do

This system embodies the core ISE principle: **judge arguments by their quality, not their source**.

- Your uncle's accountant experience doesn't give him authority
- But his valid challenge about legal text earns him ReasonRank
- A Harvard professor's credentials don't protect bad methodology
- Their arguments either survive scrutiny or they don't

**What matters:** Does your methodological argument hold up when challenged?

**What doesn't matter:** Your degree, your job title, your institutional affiliation

---

## Next Steps

1. **Submit methodology claims** for existing evidence
2. **Challenge weak methodology** wherever you see it
3. **Evaluate challenges** to earn ReasonRank
4. **Build your reputation** through accurate methodological assessment

The system doesn't care about your resume. It cares about your reasoning.

**Show us your arguments. Let's see if they hold up.**
