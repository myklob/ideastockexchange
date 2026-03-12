# Evidence Quality Scoring System

## Core Principle: Arguments Matter More Than Credentials

The Idea Stock Exchange evaluates evidence based on **methodology quality**, not source authority. A blog post with transparent methodology and explicit assumptions can score higher than a government report that hides its reasoning behind credentials.

This document describes how evidence quality is assessed and how methodology challenges affect scores.

---

## The Formula

```
Evidence Impact = Quality Score × Linkage Score
```

Where:
- **Quality Score** (0-100): How well the methodology holds up under scrutiny
- **Linkage Score** (0-1): How directly the evidence supports the specific claim

### Why Multiplication?

Multiplicative scoring prevents two forms of BS:
- **Strong methodology + irrelevant evidence** (data dumping) = Low impact
- **Weak methodology + directly relevant claims** (anecdotes) = Low impact

Both quality AND linkage must be strong for evidence to carry weight.

---

## Quality Score: The 4 Patterns of Argument Strength

Evidence quality is assessed via four independent patterns. These are **observable characteristics** that can be evaluated by anyone, regardless of credentials.

### Pattern 1: Transparent Measurement with Controls (40% weight)

**What it measures:** Can you inspect the methodology and verify it's sound?

**Scoring criteria:**
- ✅ **Methodology disclosed** (+25 points): Measurement method is explicitly described
- ✅ **Control variables** (+25 points): Alternative explanations are controlled for
- ✅ **Raw data available** (+25 points): Data can be inspected by others
- ✅ **Peer review** (+25 points): Has been scrutinized by independent reviewers

**Max score:** 100 points

**Example:**
```javascript
evidence.methodologyTransparency = {
  hasDisclosedMethod: true,
  hasControlVariables: true,
  hasRawData: false,
  hasPeerReview: true
};
// Score: 75 (missing raw data)
```

**Credential fake vs. Real transparency:**
- ❌ "We're experts, trust our model" (no score without disclosure)
- ✅ "Here's our code, data, and methods. Critique away." (full score)

---

### Pattern 2: Replication Across Contexts (20% weight)

**What it measures:** Can others reproduce the findings using different methods?

**Scoring criteria:**
- Base score: 30 points for having any independent replications
- +14 points per successful replication (up to 5 replications)
- 0 points if no replications exist

**Max score:** 100 points (5+ successful replications)

**Example:**
```javascript
evidence.replication = {
  hasIndependentReplications: true,
  replicationCount: 3,
  replicationContexts: [
    { description: 'Lab A', source: 'University X', successful: true },
    { description: 'Lab B', source: 'Company Y', successful: true },
    { description: 'Lab C', source: 'Institute Z', successful: false }
  ]
};
// Score: 30 + (2 × 14) = 58
```

**Credential fake vs. Real replication:**
- ❌ Citing 10 studies from the same research network (circular references)
- ✅ Independent groups using different methods arriving at similar conclusions

---

### Pattern 3: Falsifiable Predictions (15% weight)

**What it measures:** Does the claim make specific predictions that can be proven wrong?

**Scoring criteria:**
- 0 points: No falsifiable predictions
- 40 points: Has predictions but not yet tested
- Up to 100 points: Based on (validated predictions / total tested)
- -20 points per falsified prediction

**Max score:** 100 points

**Example:**
```javascript
evidence.falsifiability = {
  hasFalsifiablePredictions: true,
  predictions: [
    { prediction: 'Temperature will rise 2°C by 2050', outcome: 'pending' },
    { prediction: 'Sea level will rise 1m by 2100', outcome: 'validated' }
  ],
  validatedPredictionCount: 1,
  falsifiedPredictionCount: 0
};
// Score: 100 (1/1 validated)
```

**Credential fake vs. Real falsifiability:**
- ❌ Vague predictions retrofitted to any outcome
- ✅ "If X is true, we should observe Y by date Z" (testable and specific)

---

### Pattern 4: Explicit Assumptions (25% weight)

**What it measures:** Are assumptions clearly stated so they can be challenged?

**Scoring criteria:**
- 50 points: No explicit assumptions (neutral baseline)
- -15 points per hidden assumption exposed by challenges
- 70 points: Has explicit assumptions
- +30 points: All assumptions have justifications
- -10 points per challenged assumption

**Max score:** 100 points

**Example:**
```javascript
evidence.assumptions = {
  hasExplicitAssumptions: true,
  assumptionsList: [
    {
      assumption: 'Assumes constant growth rate',
      justification: 'Based on 50-year historical trend',
      challenged: false
    },
    {
      assumption: 'Assumes no policy changes',
      justification: 'Using current regulatory framework',
      challenged: true  // Someone found this problematic
    }
  ]
};
// Score: 70 + 30 - 10 = 90
```

**Credential fake vs. Real explicitness:**
- ❌ Hiding assumptions in jargon or claiming "standard in the field"
- ✅ "We assume A, B, C. If you disagree with C, here's how that changes the conclusion."

---

## Overall Quality Score Calculation

The four pattern scores are combined using weighted averaging:

```
Quality Score = (Transparency × 0.40) +
                (Assumptions × 0.25) +
                (Replication × 0.20) +
                (Falsifiability × 0.15)
                - (Challenge Impact)
```

**Then apply methodology challenge reductions** (see below).

---

## Methodology Challenges

Anyone can challenge evidence methodology, regardless of credentials. Challenges are evaluated by the community, weighted by evaluator ReasonRank (not their credentials).

### Challenge Types

1. **Measurement Method** - "Your measurement instrument is unreliable"
2. **Control Variables** - "You didn't control for X confounding variable"
3. **Sample Issues** - "Sample size too small / biased selection"
4. **Assumption Unjustified** - "Your assumption Y is doing all the work"
5. **Data Quality** - "Your data source is unreliable"
6. **Analysis Method** - "Your statistical method is inappropriate"
7. **Replication Failure** - "This hasn't been independently replicated"
8. **Conflicts of Interest** - "Financial incentives bias this"
9. **Cherry Picking** - "You selected data to support conclusion"
10. **Outdated** - "Methodology or data is outdated"

### Challenge Evaluation Process

1. **Challenge submitted** by anyone (challenger's credentials don't matter)
2. **Community evaluates** the challenge:
   - Is this a valid methodological concern?
   - Does it actually break the inference chain?
   - Impact score: How much does this reduce quality? (0-100)
3. **Evaluations weighted by ReasonRank** (not credentials)
4. **Consensus emerges:**
   - Valid (>60% weighted agreement)
   - Invalid (>60% disagreement)
   - Partially valid (40-60% agreement)
   - Contested (no clear consensus)
5. **Quality score reduced** by weighted impact if valid

### Example: Valid Challenge

```javascript
// Initial quality score: 88
const challenge = {
  challengeType: 'control_variables',
  claim: 'Study claims to control for income',
  challenge: 'Income data is self-reported and unreliable. This confounds the results.',
  affectedPattern: 'transparent_measurement',

  evaluation: {
    consensusVerdict: 'valid',
    weightedImpact: 20  // Reduces quality by 20 points
  }
};

// New quality score: 88 - 20 = 68
```

---

## Linkage Score

**Linkage Score** measures how directly evidence supports a specific argument.

### Linkage Types and Scores

| Type | Score Range | Description |
|------|------------|-------------|
| `directly_proves` | 0.9-1.0 | Evidence directly demonstrates the claim |
| `strongly_supports` | 0.7-0.9 | Strong support but not definitive |
| `moderately_supports` | 0.5-0.7 | Provides support with caveats |
| `weakly_supports` | 0.3-0.5 | Tangentially related |
| `barely_relevant` | 0.1-0.3 | Weak connection |
| `irrelevant` | 0.0-0.1 | Does not support claim |

### Linkage Challenges

Separate from methodology challenges, linkage challenges question whether evidence actually proves what's claimed.

**Example:**
```javascript
// Evidence: "Study shows masks reduce transmission by 70%"
// Argument: "Mask mandates reduce COVID deaths"

linkageChallenge = {
  challenge: 'Study is about transmission, not deaths. Also assumes mandates lead to actual mask use.',
  isValid: true,
  impact: 30  // Reduces linkage by 30%
};

// Original linkage: 0.9 (directly_proves)
// After challenge: 0.9 - 0.3 = 0.6 (moderately_supports)
```

---

## Evidence Impact Calculation

**Final formula:**

```javascript
evidenceImpact = qualityScore × linkageScore

// Example:
// Quality: 75 (good methodology)
// Linkage: 0.8 (strongly supports)
// Impact: 75 × 0.8 = 60
```

### Multiple Arguments

Evidence can support multiple arguments with different linkages:

```javascript
evidence.evidenceImpacts = [
  {
    argumentId: 'arg1',
    qualityScore: 75,
    linkageScore: 0.9,  // Directly proves arg1
    evidenceImpact: 67.5
  },
  {
    argumentId: 'arg2',
    qualityScore: 75,
    linkageScore: 0.3,  // Weakly supports arg2
    evidenceImpact: 22.5
  }
];
```

---

## ReasonRank: Meritocracy of Arguments

Users earn **ReasonRank** through accurate assessment, not credentials.

### How to Earn ReasonRank

#### 1. Methodology Assessment (50% of ReasonRank)

**Valid Challenges** (60% of methodology score):
- Submit methodology challenges
- +5 RR when challenge deemed valid
- -3 RR when challenge deemed invalid
- Validity ratio = valid / (valid + invalid)

**Accurate Evaluations** (40% of methodology score):
- Evaluate other people's challenges
- +2 RR when aligned with consensus
- -1 RR when contradicted by consensus

#### 2. Argument Creation (30% of ReasonRank)

- Create arguments
- Arguments scored on 6-dimensional system
- High-quality arguments (>70 score) increase RR
- Quality ratio = high quality / total created

#### 3. Linkage Assessment (20% of ReasonRank)

- Assess how well evidence links to arguments
- Accurate assessments (aligned with community consensus) increase RR

### Example ReasonRank Calculation

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

### Credentials Are Tracked But Not Used

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

---

## API Usage

### Submit a Methodology Challenge

```http
POST /api/methodology-challenges
Content-Type: application/json
Authorization: Bearer <token>

{
  "evidenceId": "64a7f...",
  "challengeType": "control_variables",
  "claim": "Claims to control for income",
  "challenge": "Income data is self-reported and unreliable",
  "affectedPattern": "transparent_measurement"
}
```

### Evaluate a Challenge

```http
POST /api/methodology-challenges/:id/evaluate
Content-Type: application/json
Authorization: Bearer <token>

{
  "verdict": "valid",
  "reasoning": "Self-reported income is indeed problematic for this type of analysis",
  "impactScore": 20
}
```

Your evaluation is **weighted by your ReasonRank**, not your credentials.

### Set Evidence Linkage

```javascript
// In Evidence model
evidence.setLinkageScore(argumentId, 0.8, 'strongly_supports');
await evidence.save();
```

### Calculate Evidence Impact

```javascript
const impact = await evidence.calculateEvidenceImpact(argumentId);
console.log(impact);
// {
//   qualityScore: 75,
//   linkageScore: 0.8,
//   evidenceImpact: 60
// }
```

---

## Real-World Examples

### Example 1: Government Report vs. Independent Analysis

**Government Report:**
- Transparency: 25 (methodology disclosed but no raw data or controls)
- Replication: 0 (no independent replications)
- Falsifiability: 40 (predictions not yet tested)
- Assumptions: 50 (no explicit assumptions)
- **Quality Score:** (25×0.4) + (50×0.25) + (0×0.2) + (40×0.15) = 28.5

**Independent Analysis:**
- Transparency: 100 (full methodology, data, peer review)
- Replication: 58 (2 successful replications)
- Falsifiability: 80 (4/5 predictions validated)
- Assumptions: 90 (explicit and justified)
- **Quality Score:** (100×0.4) + (90×0.25) + (58×0.2) + (80×0.15) = 86.1

**The independent analysis scores 3× higher**, even if the government report comes from a prestigious agency.

### Example 2: Challenge Impact

**Pharmaceutical Study:**
- Initial Quality: 85
- Linkage to "Drug is safe": 0.9

**Challenge:** "Financial conflict of interest not disclosed. Company funded this study."
- Type: conflicts_of_interest
- Consensus: Valid
- Impact: -25 points

**After Challenge:**
- New Quality: 60
- Linkage: 0.9
- Evidence Impact: 60 × 0.9 = 54 (down from 76.5)

---

## Why This Matters

Traditional systems optimize for **credentials**:
- Did you go to the right school?
- Do you have institutional backing?
- How many letters after your name?

The ISE optimizes for **arguments that survive scrutiny**:
- Is your methodology transparent?
- Can others replicate your findings?
- Do your assumptions hold up when challenged?
- Does your evidence actually prove what you claim?

**Your uncle's blog can beat the New York Times** if your uncle makes better arguments. The system doesn't care about his resume. It cares about whether his reasoning survives scrutiny.

That's not a bug. **That's the entire point.**

---

## Future Enhancements

Planned improvements to the evidence quality system:

1. **Automated methodology detection** - NLP to extract methodology claims from papers
2. **Prediction tracking** - Automated checking of falsifiable predictions over time
3. **Replication networks** - Cross-linking studies that attempt replication
4. **Challenge templates** - Common methodological issues with guided prompts
5. **Expert flagging** - High-RR users can flag low-quality evidence for review (but flags don't auto-reduce scores)

---

## Related Documentation

- [ReasonRank System](./REASONRANK.md)
- [Argument Scoring](./ARGUMENT_SCORING.md)
- [Linkage Scores](../wiki/Linkage-Score-Code.md)
- [Truth Scores](../wiki/Truth-Scores.md)

---

## Philosophy

> "We don't care about credentials. We don't care about institutional prestige. We care about one thing: **Does your argument survive scrutiny?**"

The Evidence Quality Scoring system makes this principle operational. It rewards transparent methodology over authority, welcomes challenges from anyone, and builds credibility through validated accuracy, not gatekeeping.

**Show us your reasoning. Let's see if it holds up.**
