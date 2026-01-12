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

## Current Implementation

The ReasonRank algorithm is implemented in the Idea Stock Exchange codebase as a **weighted composite score** combining multiple dimensions of argument quality.

### Algorithm Formula

```
ReasonRank = (TruthScore × 0.30) +
             (ImportanceScore × 0.25) +
             (RelevanceScore × 0.20) +
             (VoteScore × 0.15) +
             (MediaScore × 0.08) +
             (RecencyBoost × 0.02)
```

**Total:** 100% weighted score on a 0-10 scale

### Component Breakdown

#### 1. Truth Score (30% weight)
Measures the **factual accuracy** of the argument.

**Scoring:**
- Manual scoring by users (0-10 scale)
- Future: Automated fallacy detection
- Future: Fact-checking API integration

**Factors:**
- Logical validity
- Freedom from fallacies (ad hominem, strawman, etc.)
- Empirical support
- Internal consistency

#### 2. Importance Score (25% weight)
Measures how **significant** the argument is to the debate's central question.

**Scoring:**
- Manual scoring by users (0-10 scale)
- Considers: How critical is this point?
- Would the debate conclusion change without this argument?

**Example:**
- Debate: "Should we implement UBI?"
- High importance: "UBI reduces poverty by 30%" (core claim)
- Low importance: "Finland tried UBI" (interesting but not decisive)

#### 3. Relevance Score (20% weight)
Measures how **on-topic** the argument is.

**Scoring:**
- Manual scoring by users (0-10 scale)
- Does this directly address the thesis?
- Or is it a tangent/distraction?

**Prevents:**
- Topic drift
- Whataboutism
- Red herrings

#### 4. Vote Score (15% weight)
Reflects **community consensus** on argument quality.

**Calculation:**
```typescript
function calculateVoteScore(upvotes: number, downvotes: number): number {
  const netVotes = upvotes - downvotes;

  // Sigmoid normalization to 0-10 scale
  // Prevents vote manipulation from dominating score
  return 10 / (1 + Math.exp(-netVotes / 10));
}
```

**Why sigmoid?**
- Prevents runaway vote domination
- First 20 votes matter more than votes 1000-1020
- Caps at 10 regardless of total votes
- Symmetric for negative votes

**Example Vote Scores:**
- +50 votes: ~9.3/10
- +10 votes: ~7.3/10
- 0 votes: 5.0/10
- -10 votes: ~2.7/10
- -50 votes: ~0.7/10

#### 5. Media Score (8% weight)
Measures quality and quantity of **supporting evidence**.

**Calculation:**
```typescript
function calculateMediaScore(media: ArgumentMedia[]): number {
  if (media.length === 0) return 5.0; // Neutral baseline

  let totalScore = 0;

  for (const item of media) {
    let mediaValue = item.media.credibilityScore; // 0-10

    // Position modifier
    if (item.position === 'SUPPORTS') {
      mediaValue *= 1.0; // Full value
    } else if (item.position === 'REFUTES') {
      mediaValue *= -0.5; // Penalty for contradicting evidence
    } else {
      mediaValue *= 0.3; // Minimal value for neutral
    }

    // Relevance modifier
    mediaValue *= (item.relevanceScore / 10);

    totalScore += mediaValue;
  }

  // Average and normalize to 0-10
  const avgScore = totalScore / media.length;
  return Math.max(0, Math.min(10, avgScore + 5));
}
```

**Evidence Quality Tiers:**
- **10 pts:** Peer-reviewed meta-analyses
- **9 pts:** Peer-reviewed experimental studies
- **7 pts:** Peer-reviewed observational studies
- **5 pts:** Expert opinion from credentialed source
- **3 pts:** News articles from reputable sources
- **1 pt:** Anecdotes, blog posts
- **0 pts:** No source or unreliable

**Position Tags:**
- `SUPPORTS` - Evidence backs up the argument (full credit)
- `REFUTES` - Evidence contradicts the argument (penalty)
- `NEUTRAL` - Related but doesn't prove/disprove (minimal credit)

#### 6. Recency Boost (2% weight)
Small bonus for **newer arguments** to encourage fresh perspectives.

**Calculation:**
```typescript
function calculateRecencyBoost(createdAt: Date): number {
  const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  // Exponential decay: newer = higher boost
  // Half-life: ~90 days
  return 10 * Math.exp(-ageInDays / 90);
}
```

**Effect:**
- Brand new argument: +10 points
- 30 days old: +7.2 points
- 90 days old: +5.0 points
- 180 days old: +2.5 points
- 1 year old: +0.8 points

**Rationale:**
- Prevents stagnation
- Encourages ongoing engagement
- Doesn't overwhelm other factors (only 2%)

---

## Implementation

### Database Schema

Arguments store all scoring components:

```typescript
model Argument {
  id              String   @id @default(uuid())
  content         String   @db.Text
  position        Position // PRO, CON, NEUTRAL

  // Score components
  truthScore      Float    @default(5.0)
  importanceScore Float    @default(5.0)
  relevanceScore  Float    @default(5.0)
  reasonRank      Float    @default(5.0) // Computed

  // Relationships for scoring
  votes           Vote[]
  media           ArgumentMedia[]

  createdAt       DateTime @default(now())
}
```

### Service Implementation

```typescript
// src/server/services/reasonrank.service.ts

export class ReasonRankService {
  async calculateReasonRank(argumentId: string): Promise<number> {
    const argument = await prisma.argument.findUnique({
      where: { id: argumentId },
      include: {
        votes: true,
        media: {
          include: { media: true }
        }
      }
    });

    if (!argument) throw new Error('Argument not found');

    // Calculate each component
    const truthScore = argument.truthScore * 0.30;
    const importanceScore = argument.importanceScore * 0.25;
    const relevanceScore = argument.relevanceScore * 0.20;

    const voteScore = this.calculateVoteScore(
      argument.votes.filter(v => v.voteType === 'UPVOTE').length,
      argument.votes.filter(v => v.voteType === 'DOWNVOTE').length
    ) * 0.15;

    const mediaScore = this.calculateMediaScore(argument.media) * 0.08;
    const recencyBoost = this.calculateRecencyBoost(argument.createdAt) * 0.02;

    const reasonRank = truthScore + importanceScore + relevanceScore +
                       voteScore + mediaScore + recencyBoost;

    // Update stored value
    await prisma.argument.update({
      where: { id: argumentId },
      data: { reasonRank }
    });

    return reasonRank;
  }

  private calculateVoteScore(upvotes: number, downvotes: number): number {
    const netVotes = upvotes - downvotes;
    return 10 / (1 + Math.exp(-netVotes / 10));
  }

  private calculateMediaScore(media: ArgumentMedia[]): number {
    // Implementation shown above
  }

  private calculateRecencyBoost(createdAt: Date): number {
    // Implementation shown above
  }
}
```

### Recalculation Triggers

ReasonRank is recalculated when:
1. A vote is cast on the argument
2. Media is added/removed from the argument
3. Truth/Importance/Relevance scores are updated
4. Periodically (background job for recency decay)

---

## Belief Score

The **Belief Score** represents the overall strength of a position in a debate (PRO vs CON).

**Calculation:**
```
BeliefScore = WeightedAverage(ProArguments.ReasonRank) -
              WeightedAverage(ConArguments.ReasonRank)
```

**Result:** Score from -10 (strong CON) to +10 (strong PRO)

**Future Enhancement:** Hierarchical propagation
- Child arguments influence parent scores
- Recursive calculation up the argument tree
- Resembles PageRank's link-based authority`

---

## Transparency

* Every component of the score is public and **open to challenge**.
* Users can see exactly how each argument influences the overall belief score.
* Algorithms are linked across the wiki (see sidebar) so the scoring process is auditable.

---

**See Also:**

* [[Evidence Verification Score](https://chatgpt.com/g/g-zEqCtLTMb-idea-stock-exchange/c/Evidence-Verification-Score-%28EVS%29)](Evidence-Verification-Score-%28EVS%29)
* [[Logical Fallacy Score](https://chatgpt.com/g/g-zEqCtLTMb-idea-stock-exchange/c/6897d671-d650-832b-8023-136f71fcc17f#)](#)
* [[Equivalency Score](https://chatgpt.com/g/g-zEqCtLTMb-idea-stock-exchange/c/Equivalency-Score)](Equivalency-Score)
* [[Evidence-to-Conclusion Linkage Score (ECLS)](https://chatgpt.com/g/g-zEqCtLTMb-idea-stock-exchange/c/Evidence-to-Conclusion-Relevance-Score)](Evidence-to-Conclusion-Relevance-Score)

