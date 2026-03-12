# Core Concepts

This page explains the fundamental concepts of the Idea Stock Exchange and how they relate to each other.

---

## The Big Picture

The Idea Stock Exchange treats discourse like a financial market where:

- **Beliefs** are like stocks with fluctuating "truth scores"
- **Arguments** are like analyst reports that affect stock prices
- **Evidence** is like financial data that backs up reports
- **Users** are like investors who contribute to market intelligence

```
┌─────────────────────────────────────────────────┐
│                    BELIEF                        │
│     "Raising minimum wage reduces poverty"       │
│                                                  │
│           Conclusion Score: 67/100               │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐       ┌───────────────┐
│   SUPPORTING  │       │    OPPOSING   │
│   ARGUMENTS   │       │   ARGUMENTS   │
│               │       │               │
│ • Arg 1 (72)  │       │ • Arg 1 (65)  │
│ • Arg 2 (58)  │       │ • Arg 2 (71)  │
│ • Arg 3 (81)  │       │               │
└───────┬───────┘       └───────┬───────┘
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│   EVIDENCE    │       │   EVIDENCE    │
│               │       │               │
│ • Studies     │       │ • Studies     │
│ • Articles    │       │ • Expert Ops  │
│ • Data        │       │ • Data        │
└───────────────┘       └───────────────┘
```

---

## Belief

A **Belief** is a claim about reality, policy, or ethics that can be evaluated for truth.

### What Makes a Good Belief Statement

| Good | Bad |
|------|-----|
| "Raising the minimum wage to $15/hour reduces poverty rates" | "Minimum wage is complicated" |
| "Climate change is primarily caused by human activity" | "Climate change is bad" |
| "Universal healthcare improves population health outcomes" | "Healthcare should be better" |

### Belief Properties

```javascript
// From backend/models/Belief.js
{
  statement: String,      // The claim itself (10-500 chars)
  description: String,    // Optional elaboration (up to 2000 chars)
  category: String,       // politics, science, technology, etc.
  tags: [String],         // Keywords for search
  conclusionScore: Number, // 0-100, calculated from arguments
  statistics: {
    views: Number,
    supportingCount: Number,
    opposingCount: Number,
    totalArguments: Number
  },
  status: String,         // draft, active, archived, flagged
  trending: Boolean       // Highlighted for high activity
}
```

### Categories

| Category | Description | Example |
|----------|-------------|---------|
| **politics** | Government policy, political systems | "Democracy is the best form of government" |
| **science** | Scientific claims, research findings | "Vaccines are safe and effective" |
| **technology** | Tech trends, digital impact | "AI will replace most jobs by 2050" |
| **philosophy** | Ethics, metaphysics, logic | "Free will is an illusion" |
| **economics** | Markets, fiscal policy | "Universal basic income reduces inequality" |
| **social** | Society, culture, behavior | "Social media increases loneliness" |
| **other** | Miscellaneous beliefs | Everything else |

---

## Argument

An **Argument** is a logical reason that either supports or opposes a Belief.

### Argument Types

```
┌─────────────────────────────────────────────┐
│              BELIEF STATEMENT                │
└─────────────────────┬───────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
    ┌────▼────┐              ┌─────▼────┐
    │SUPPORTING│              │ OPPOSING │
    │   ✓     │              │    ✗     │
    └─────────┘              └──────────┘
    Reasons to                Reasons to
    AGREE                     DISAGREE
```

### Argument Structure

```javascript
// From backend/models/Argument.js
{
  content: String,         // The argument text (10-2000 chars)
  type: 'supporting' | 'opposing',
  beliefId: ObjectId,      // Which belief this argues for/against
  author: ObjectId,        // Who wrote it

  scores: {
    overall: Number,              // 0-100, average of subscores
    logical: Number,              // Logic quality
    linkage: Number,              // Relevance to belief
    importance: Number,           // Real-world impact

    // Six multiplicative factors (0-1):
    evidenceStrength: Number,     // Quality of evidence
    logicalCoherence: Number,     // Absence of fallacies
    verificationCredibility: Number, // Verified sources
    linkageRelevance: Number,     // Direct connection
    uniqueness: Number,           // Not redundant
    argumentImportance: Number    // Significance
  },

  votes: {
    up: Number,
    down: Number
  },

  evidence: [ObjectId],    // Supporting evidence
  subArguments: [ObjectId], // Nested arguments
  reasonRankScore: Number  // PageRank-style score
}
```

### Writing Good Arguments

**Do:**
- Focus on one clear point
- Provide logical reasoning
- Reference evidence when possible
- Stay relevant to the belief
- Be original (don't repeat others)

**Don't:**
- Attack people (ad hominem)
- Use emotional manipulation
- Include multiple unrelated points
- Make broad generalizations without evidence
- Commit logical fallacies

### Hierarchical Arguments

Arguments can have sub-arguments, creating a tree structure:

```
Argument: "Minimum wage increases help workers"
├─ Sub-argument: "Workers have more disposable income"
│  └─ Sub-sub: "This increases economic activity"
└─ Sub-argument: "Reduces need for government assistance"
   └─ Sub-sub: "Saves taxpayer money"
```

---

## Evidence

**Evidence** is data, studies, quotes, or references that support an Argument.

### Evidence Types

| Type | Description | Example |
|------|-------------|---------|
| **study** | Academic research, peer-reviewed papers | "2023 MIT study on minimum wage effects" |
| **article** | Journalism, analysis pieces | "NYT investigative report" |
| **book** | Published books | "Capital in the 21st Century" |
| **video** | Documentaries, lectures | "TED Talk by economist" |
| **image** | Infographics, photos | "Census data visualization" |
| **data** | Raw datasets, statistics | "Bureau of Labor Statistics dataset" |
| **expert-opinion** | Quotes from authorities | "Nobel laureate's statement" |
| **other** | Miscellaneous sources | Everything else |

### Evidence Structure

```javascript
// From backend/models/Evidence.js
{
  title: String,           // Name of the evidence
  description: String,     // Summary/context
  type: String,            // study, article, book, etc.

  source: {
    url: String,           // Link to source
    author: String,        // Who created it
    publication: String,   // Where it was published
    date: Date             // When it was published
  },

  metadata: {
    doi: String,           // Digital Object Identifier
    isbn: String,          // International Standard Book Number
    pmid: String,          // PubMed ID
    citations: Number      // How many times cited
  },

  credibilityScore: Number, // 0-100, based on verifications
  verificationStatus: String, // unverified, pending, verified, disputed, debunked

  verifiedBy: [{
    user: ObjectId,
    status: 'verified' | 'disputed',
    notes: String,
    verifiedAt: Date
  }],

  tags: [String],
  arguments: [ObjectId]    // Which arguments use this evidence
}
```

### Verification System

Evidence credibility is crowdsourced:

```
Initial Score: 50

User verifies → +10 points
User disputes → -10 points

Final Score = 50 + (verifiedCount × 10) - (disputedCount × 10)
Bounded: 0 to 100
```

Example:
- 3 users verify, 1 disputes
- Score = 50 + (3 × 10) - (1 × 10) = 70

When 3+ users verify → Status becomes "verified"
When 3+ users dispute → Status becomes "disputed"

---

## User

A **User** is a participant who contributes to the platform.

### User Properties

```javascript
// From backend/models/User.js
{
  username: String,        // Display name (3-50 chars)
  email: String,           // Unique email address
  password: String,        // Hashed with bcrypt
  role: String,            // user, moderator, admin
  reputation: Number,      // Contribution score

  createdBeliefs: [ObjectId],    // Beliefs they authored
  createdArguments: [ObjectId],  // Arguments they wrote
  votedArguments: [{             // Vote tracking
    argumentId: ObjectId,
    vote: 'up' | 'down'
  }]
}
```

### User Roles

| Role | Permissions |
|------|-------------|
| **user** | Create beliefs, arguments, evidence; vote; verify evidence |
| **moderator** | All user permissions + flag content, manage disputes |
| **admin** | All permissions + change user roles, delete any content |

### Reputation System (Planned)

In future phases, reputation will be earned by:
- Creating high-scoring arguments
- Submitting verified evidence
- Having accurate predictions
- Helpful contributions

High-reputation users may have:
- Weighted votes
- Moderation privileges
- Chief Belief Officer eligibility

---

## Relationships

### How Entities Connect

```
USER creates → BELIEF
USER creates → ARGUMENT → attached to BELIEF
USER creates → EVIDENCE → supports ARGUMENT
USER votes on → ARGUMENT
USER verifies → EVIDENCE

BELIEF has many → ARGUMENTS (supporting & opposing)
ARGUMENT has many → EVIDENCE
ARGUMENT has many → SUB-ARGUMENTS
BELIEF has many → RELATED BELIEFS (supports, opposes, related)
```

### Related Beliefs

Beliefs can be linked with relationship types:

```javascript
relatedBeliefs: [{
  beliefId: ObjectId,
  relationship: 'supports' | 'opposes' | 'related',
  linkageStrength: Number  // 0-1, how strongly connected
}]
```

Example:
- Belief A: "Climate change is caused by humans"
- Belief B: "We should reduce carbon emissions"
- Relationship: A **supports** B (linkage: 0.8)

---

## Scoring Flow

How scores propagate through the system:

```
1. USER submits EVIDENCE
   ↓
2. Other USERs verify/dispute EVIDENCE
   ↓
3. EVIDENCE.credibilityScore updates
   ↓
4. ARGUMENT.scores.evidenceStrength recalculated
   ↓
5. ARGUMENT.scores.overall recalculated
   ↓
6. BELIEF.conclusionScore recalculated
   ↓
7. RELATED BELIEFS potentially affected
```

---

## Real-World Example

Let's trace through a complete example:

### The Belief
**"Remote work increases productivity"**

### Supporting Arguments
1. **"Employees save commute time"** (Score: 75)
   - Evidence: Study showing 40 min/day saved
   - Logical, well-linked, unique

2. **"Fewer workplace distractions"** (Score: 68)
   - Evidence: Survey data from remote workers
   - Some fallacy detected (hasty generalization)

### Opposing Arguments
1. **"Communication becomes harder"** (Score: 71)
   - Evidence: Case study from tech company
   - Strong linkage, verified source

2. **"Work-life boundaries blur"** (Score: 62)
   - Evidence: Mental health statistics
   - Lower uniqueness (similar to arg 1)

### Conclusion Score Calculation

```
Supporting Avg: (75 + 68) / 2 = 71.5
Opposing Avg: (71 + 62) / 2 = 66.5

Weight Support: 2/4 = 0.5
Weight Oppose: 2/4 = 0.5

CS = (71.5 × 0.5) + ((100 - 66.5) × 0.5)
CS = 35.75 + 16.75
CS = 52.5

Final Score: 53 (rounded)
```

The belief is slightly positive but contested.

---

## Next Steps

Now that you understand the core concepts:

1. See [Data Models](Data-Models) for complete schema details
2. Learn about the [Scoring System](Scoring-System) in depth
3. Explore [Algorithms](Algorithms) that power the platform
4. Review the [API Reference](API-Reference) to interact with these entities

---

**Remember:** The goal is not to win debates, but to collaboratively discover truth through structured, evidence-based reasoning.
