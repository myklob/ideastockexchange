# Idea Stock Exchange (ISE)
## Product Requirements Document: User Activity Tracking & Dashboard

**Version:** 1.0.0
**Status:** Draft
**Last Updated:** 2026-01-29

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Domain Model](#2-core-domain-model)
3. [Feature Specifications](#3-feature-specifications)
4. [Data Models & Schemas](#4-data-models--schemas)
5. [API Contracts](#5-api-contracts)
6. [Additional Tracking Recommendations](#6-additional-tracking-recommendations)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Glossary](#8-glossary)

---

## 1. Executive Summary

### 1.1 Purpose

Build a **User Activity Dashboard** that exposes each user's belief positions, reasoning behavior, and engagement patterns in a structured, queryable way.

### 1.2 Core Principle

> **This dashboard is not a social profile. It is a debugging interface for human reasoning.**

The system must answer four questions for any user:
1. **What** do they believe?
2. **Why** do they believe it?
3. **How strongly** do they believe it?
4. **Under what assumptions** do they believe it?

### 1.3 Strategic Value

This data is foundational for:
- Belief scoring algorithms
- User compatibility analysis
- Collective intelligence systems
- Epistemic reputation metrics

---

## 2. Core Domain Model

### 2.1 Node Types in the Belief Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                      BELIEF GRAPH NODES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   BELIEF (Conclusion)                                           │
│   └── A propositional claim (e.g., "X is true/good/necessary")  │
│                                                                 │
│   ARGUMENT (Reason)                                             │
│   └── A logical structure supporting or opposing a belief       │
│                                                                 │
│   EVIDENCE                                                      │
│   └── Empirical data, citations, or observations                │
│                                                                 │
│   ASSUMPTION                                                    │
│   └── Implicit premises required for an argument to hold        │
│                                                                 │
│   VALUE                                                         │
│   └── Normative priority (e.g., "freedom > security")           │
│                                                                 │
│   INTEREST                                                      │
│   └── Stakeholder-specific desired outcome                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Relationship Types (Edges)

| Relationship | Source → Target | Description |
|--------------|-----------------|-------------|
| `SUPPORTS` | Argument → Belief | Argument provides positive support |
| `OPPOSES` | Argument → Belief | Argument provides counter-support |
| `REQUIRES` | Argument → Assumption | Argument depends on assumption |
| `EVIDENCES` | Evidence → Argument | Evidence substantiates argument |
| `EQUIVALENT_TO` | Belief → Belief | Beliefs are semantically identical |
| `SIMILAR_TO` | Belief → Belief | Beliefs are related but distinct |
| `CONFLICTS_WITH` | Value → Value | Values are in tension |
| `DERIVES_FROM` | Belief → Value | Belief stems from value priority |

---

## 3. Feature Specifications

### 3.1 Voting History (Belief-Level Tracking)

#### Description
Track and display all user votes across the belief graph.

#### Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| VOT-001 | Store all vote events with UTC timestamp | P0 |
| VOT-002 | Support vote types: `UPVOTE`, `DOWNVOTE`, `RETRACT` | P0 |
| VOT-003 | Distinguish target node type: `BELIEF`, `ARGUMENT`, `EVIDENCE` | P0 |
| VOT-004 | Enable filtering by: topic, score range, date range | P0 |
| VOT-005 | Enable sorting by: recency, score magnitude, topic | P0 |
| VOT-006 | Maintain full vote history (no destructive updates) | P0 |
| VOT-007 | Support vote change tracking (flips from up→down) | P1 |

#### Data Model

```typescript
interface VoteEvent {
  id: UUID;
  userId: UUID;
  targetNodeId: UUID;
  targetNodeType: 'BELIEF' | 'ARGUMENT' | 'EVIDENCE';
  voteType: 'UPVOTE' | 'DOWNVOTE' | 'RETRACT';
  timestamp: ISO8601DateTime;
  previousVoteId: UUID | null;  // For tracking vote changes
  metadata: {
    sessionId: UUID;
    clientContext?: string;
  };
}
```

---

### 3.2 Agreement Intensity (Continuous Scale)

#### Description
Allow users to express degree of agreement/disagreement on a continuous scale.

#### Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| AGR-001 | Support numeric range: `-100` to `+100` (integer) | P0 |
| AGR-002 | `0` represents neutral/undecided | P0 |
| AGR-003 | Persist all historical values (belief drift tracking) | P0 |
| AGR-004 | Calculate and expose delta from previous position | P1 |
| AGR-005 | Support bulk position updates with single timestamp | P2 |

#### Data Model

```typescript
interface AgreementPosition {
  id: UUID;
  userId: UUID;
  beliefId: UUID;
  value: number;           // -100 to +100
  labelId: UUID;           // Reference to semantic label
  timestamp: ISO8601DateTime;
  previousPositionId: UUID | null;
  delta: number | null;    // Change from previous position
  trigger: AgreementChangeTrigger;
}

type AgreementChangeTrigger =
  | 'USER_DIRECT'          // User manually changed
  | 'EVIDENCE_UPDATE'      // New evidence prompted reconsideration
  | 'ARGUMENT_ADDED'       // New argument changed position
  | 'ASSUMPTION_CHALLENGED'// Underlying assumption was questioned
  | 'SYSTEM_RECALC';       // System-triggered recalculation
```

---

### 3.3 Semantic Agreement Labels

#### Description
Map quantitative agreement values to human-readable labels.

#### Default Label Configuration

| Range | Label | Description |
|-------|-------|-------------|
| `+100` | Existential Commitment | "I would stake my life on this" |
| `+75` to `+99` | Passionately Agree | Strong conviction with high confidence |
| `+50` to `+74` | Strongly Agree | Clear agreement, open to evidence |
| `+25` to `+49` | Somewhat Agree | Lean toward agreement |
| `-24` to `+24` | Neutral / Unsure | No clear position |
| `-49` to `-25` | Somewhat Disagree | Lean toward disagreement |
| `-74` to `-50` | Strongly Disagree | Clear disagreement |
| `-99` to `-75` | Passionately Disagree | Strong conviction against |
| `-100` | Existential Rejection | "This belief is fundamentally wrong" |

#### Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| LBL-001 | Labels must be stored in database (not hard-coded) | P0 |
| LBL-002 | Support label versioning with effective dates | P0 |
| LBL-003 | Store both numeric value AND label reference on positions | P0 |
| LBL-004 | Allow admin configuration of label ranges | P1 |
| LBL-005 | Support localization of label text | P2 |

#### Data Model

```typescript
interface AgreementLabel {
  id: UUID;
  version: number;
  minValue: number;        // Inclusive
  maxValue: number;        // Inclusive
  labelKey: string;        // e.g., "STRONGLY_AGREE"
  displayText: string;     // e.g., "Strongly Agree"
  description: string;     // Extended explanation
  effectiveFrom: ISO8601DateTime;
  effectiveTo: ISO8601DateTime | null;
  isActive: boolean;
}
```

#### UI Input Methods (Implementation Choice)

Support at least one of:
- **Slider**: Continuous drag from -100 to +100
- **Discrete buttons**: Click predefined positions
- **Dropdown**: Select from labeled options
- **Numeric input**: Direct value entry

Recommendation: Slider with snap-to-label option.

---

### 3.4 Compatibility Preconditions (Private Belief Flags)

#### Description
Users may flag beliefs as relationship-critical for compatibility scoring.

#### Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| CMP-001 | Default visibility: PRIVATE | P0 |
| CMP-002 | Support relationship contexts: `ROMANTIC`, `PARTNERSHIP`, `FRIENDSHIP`, `PROFESSIONAL` | P0 |
| CMP-003 | Allow minimum alignment threshold (e.g., "≥ +60") | P0 |
| CMP-004 | Allow range-based threshold (e.g., "within 25 points of my position") | P1 |
| CMP-005 | Support "must not exceed" thresholds for rejection criteria | P1 |
| CMP-006 | Enable querying for compatibility scoring algorithms | P0 |
| CMP-007 | User controls whether to reveal preconditions to matches | P1 |

#### Data Model

```typescript
interface CompatibilityPrecondition {
  id: UUID;
  userId: UUID;
  beliefId: UUID;
  context: CompatibilityContext;
  thresholdType: 'MINIMUM' | 'MAXIMUM' | 'RANGE' | 'EXACT_MATCH';
  thresholdConfig: {
    minValue?: number;
    maxValue?: number;
    withinDelta?: number;  // "within X points of my position"
  };
  weight: number;          // Importance: 0.0 to 1.0
  isRequired: boolean;     // Dealbreaker vs. preference
  visibility: 'PRIVATE' | 'MATCHES_ONLY' | 'PUBLIC';
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

type CompatibilityContext =
  | 'ROMANTIC'
  | 'LONG_TERM_PARTNERSHIP'
  | 'FRIENDSHIP'
  | 'PROFESSIONAL'
  | 'INTELLECTUAL';
```

---

### 3.5 Argument Validity Judgments

#### Description
Track nuanced user evaluations of argument quality beyond binary voting.

#### Validity States

| State | Meaning |
|-------|---------|
| `VALID` | Argument is logically sound |
| `INVALID` | Argument contains logical errors |
| `CONDITIONALLY_VALID` | Valid only under specific conditions |
| `VALID_INSUFFICIENT` | Sound but overridden by stronger counter-arguments |
| `IRRELEVANT` | Does not meaningfully relate to the conclusion |
| `UNDECIDED` | User has not evaluated |

#### Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| VAL-001 | Support all validity states above | P0 |
| VAL-002 | For `CONDITIONALLY_VALID`, require condition specification | P0 |
| VAL-003 | Conditions must reference structured entities (not free text only) | P0 |
| VAL-004 | Track overriding counter-argument for `VALID_INSUFFICIENT` | P1 |
| VAL-005 | Allow confidence level on validity judgment | P1 |

#### Condition Structure

Conditions must reference one or more of:
- **Assumptions**: "Valid if assumption A holds"
- **Evidence quality**: "Valid if evidence is peer-reviewed"
- **Contextual constraints**: "Valid in context C but not D"
- **Temporal bounds**: "Valid as of date X"

#### Data Model

```typescript
interface ArgumentValidityJudgment {
  id: UUID;
  userId: UUID;
  argumentId: UUID;
  validityState: ValidityState;
  confidence: number;      // 0.0 to 1.0
  conditions: ValidityCondition[];
  overriddenBy: UUID[];    // Argument IDs that override this
  reasoning: string | null; // Optional free-text explanation
  timestamp: ISO8601DateTime;
}

interface ValidityCondition {
  id: UUID;
  conditionType: 'ASSUMPTION' | 'EVIDENCE_QUALITY' | 'CONTEXT' | 'TEMPORAL';
  referenceId: UUID | null;  // ID of referenced entity
  referenceType: string | null;
  operator: 'REQUIRES' | 'EXCLUDES' | 'IF_TRUE' | 'IF_FALSE';
  description: string;
  metadata: Record<string, unknown>;
}

type ValidityState =
  | 'VALID'
  | 'INVALID'
  | 'CONDITIONALLY_VALID'
  | 'VALID_INSUFFICIENT'
  | 'IRRELEVANT'
  | 'UNDECIDED';
```

---

### 3.6 Comprehensive Activity Log

#### Description
Track all meaningful user actions in an immutable audit log.

#### Tracked Actions

| Category | Actions |
|----------|---------|
| **Creation** | Create belief, argument, evidence, assumption |
| **Modification** | Edit node content, update metadata |
| **Linkage** | Propose support/opposition link, evaluate link strength |
| **Equivalence** | Propose belief equivalence, propose similarity |
| **Moderation** | Flag duplicate, flag bad-faith argument, report content |
| **Evaluation** | Vote, set agreement position, judge validity |
| **Contribution** | Add cost-benefit analysis, challenge assumption |

#### Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| LOG-001 | All actions must have UTC timestamp | P0 |
| LOG-002 | All actions must be immutable (append-only log) | P0 |
| LOG-003 | All actions must reference specific graph node(s) | P0 |
| LOG-004 | Support action reversal via compensating events | P0 |
| LOG-005 | Enable audit queries by user, node, action type, time range | P0 |
| LOG-006 | Store before/after state for modifications | P1 |
| LOG-007 | Track action source (web, mobile, API, system) | P1 |

#### Data Model

```typescript
interface ActivityEvent {
  id: UUID;
  userId: UUID;
  actionType: ActionType;
  actionCategory: ActionCategory;
  targetNodes: NodeReference[];
  timestamp: ISO8601DateTime;
  sessionId: UUID;
  source: 'WEB' | 'MOBILE' | 'API' | 'SYSTEM';

  // State tracking
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;

  // Reversal tracking
  isReversed: boolean;
  reversedBy: UUID | null;  // ID of compensating event
  reversalOf: UUID | null;  // ID of original event if this is a reversal

  metadata: Record<string, unknown>;
}

interface NodeReference {
  nodeId: UUID;
  nodeType: NodeType;
  role: 'PRIMARY' | 'SECONDARY' | 'CONTEXT';
}

type ActionCategory =
  | 'CREATION'
  | 'MODIFICATION'
  | 'LINKAGE'
  | 'EQUIVALENCE'
  | 'MODERATION'
  | 'EVALUATION'
  | 'CONTRIBUTION';

type ActionType =
  | 'CREATE_BELIEF'
  | 'CREATE_ARGUMENT'
  | 'CREATE_EVIDENCE'
  | 'CREATE_ASSUMPTION'
  | 'EDIT_NODE'
  | 'DELETE_NODE'
  | 'VOTE'
  | 'SET_AGREEMENT'
  | 'JUDGE_VALIDITY'
  | 'PROPOSE_LINK'
  | 'EVALUATE_LINK'
  | 'PROPOSE_EQUIVALENCE'
  | 'PROPOSE_SIMILARITY'
  | 'FLAG_DUPLICATE'
  | 'FLAG_BAD_FAITH'
  | 'CHALLENGE_ASSUMPTION'
  | 'ADD_COST_BENEFIT'
  // ... extensible
  ;
```

---

### 3.7 Derived Behavioral Metrics

#### Description
Compute meta-signals from user activity for reputation and trust algorithms.

#### Core Metrics

| Metric | Description | Computation Approach |
|--------|-------------|---------------------|
| **Belief Consistency Score** | Coherence of positions across related beliefs | Graph analysis of user positions on linked beliefs |
| **Update Willingness** | Tendency to revise beliefs when evidence changes | Ratio of position changes following new evidence |
| **Contribution Ratio** | Original content vs. voting activity | `(creations + edits) / (votes + evaluations)` |
| **Engagement Depth** | How deeply user explores argument chains | Average depth of argument trees user engages with |
| **Disagreement Quality** | Engages strongest opposing views vs. strawmen | Analysis of which counter-arguments user addresses |
| **Evidence Responsiveness** | Position changes correlate with evidence quality | Correlation between evidence scores and position shifts |

#### Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| MET-001 | Compute metrics asynchronously (not blocking user actions) | P0 |
| MET-002 | Store metric snapshots with timestamps | P0 |
| MET-003 | Expose metrics via API for algorithm consumption | P0 |
| MET-004 | Support configurable computation frequency | P1 |
| MET-005 | Provide metric history for trend analysis | P1 |
| MET-006 | Allow metric weighting configuration for trust algorithms | P2 |

#### Data Model

```typescript
interface UserMetricSnapshot {
  id: UUID;
  userId: UUID;
  computedAt: ISO8601DateTime;
  metrics: {
    beliefConsistency: MetricValue;
    updateWillingness: MetricValue;
    contributionRatio: MetricValue;
    engagementDepth: MetricValue;
    disagreementQuality: MetricValue;
    evidenceResponsiveness: MetricValue;
  };
  sampleSize: number;      // Actions considered
  windowDays: number;      // Time window for computation
}

interface MetricValue {
  value: number;           // Normalized 0.0 to 1.0
  confidence: number;      // Statistical confidence
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  percentile: number;      // Relative to other users
}
```

---

## 4. Data Models & Schemas

### 4.1 Complete Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     User     │────<│  VoteEvent   │>────│     Node     │
└──────────────┘     └──────────────┘     └──────────────┘
       │                                         │
       │             ┌──────────────┐            │
       ├────────────<│  Agreement   │>───────────┤
       │             │   Position   │            │
       │             └──────────────┘            │
       │                    │                    │
       │             ┌──────────────┐            │
       │             │  Agreement   │            │
       │             │    Label     │            │
       │             └──────────────┘            │
       │                                         │
       │             ┌──────────────┐            │
       ├────────────<│ Compatibility│>───────────┤
       │             │ Precondition │            │
       │             └──────────────┘            │
       │                                         │
       │             ┌──────────────┐            │
       ├────────────<│  Validity    │>───────────┤
       │             │  Judgment    │            │
       │             └──────────────┘            │
       │                    │                    │
       │             ┌──────────────┐            │
       │             │  Validity    │            │
       │             │  Condition   │            │
       │             └──────────────┘            │
       │                                         │
       │             ┌──────────────┐            │
       ├────────────<│  Activity    │>───────────┘
       │             │    Event     │
       │             └──────────────┘
       │
       │             ┌──────────────┐
       └────────────<│   Metric     │
                     │  Snapshot    │
                     └──────────────┘
```

### 4.2 Database Table Definitions

```sql
-- Core node types (polymorphic)
CREATE TABLE nodes (
    id UUID PRIMARY KEY,
    node_type VARCHAR(50) NOT NULL,  -- BELIEF, ARGUMENT, EVIDENCE, ASSUMPTION, VALUE, INTEREST
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB
);

-- Vote events (immutable log)
CREATE TABLE vote_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    target_node_id UUID NOT NULL REFERENCES nodes(id),
    target_node_type VARCHAR(50) NOT NULL,
    vote_type VARCHAR(20) NOT NULL,  -- UPVOTE, DOWNVOTE, RETRACT
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    previous_vote_id UUID REFERENCES vote_events(id),
    session_id UUID,
    metadata JSONB
);

-- Agreement positions (with history)
CREATE TABLE agreement_positions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    belief_id UUID NOT NULL REFERENCES nodes(id),
    value INTEGER NOT NULL CHECK (value >= -100 AND value <= 100),
    label_id UUID REFERENCES agreement_labels(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    previous_position_id UUID REFERENCES agreement_positions(id),
    delta INTEGER,
    trigger VARCHAR(50) NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT TRUE
);

-- Agreement labels (versioned)
CREATE TABLE agreement_labels (
    id UUID PRIMARY KEY,
    version INTEGER NOT NULL,
    min_value INTEGER NOT NULL,
    max_value INTEGER NOT NULL,
    label_key VARCHAR(100) NOT NULL,
    display_text VARCHAR(255) NOT NULL,
    description TEXT,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Compatibility preconditions
CREATE TABLE compatibility_preconditions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    belief_id UUID NOT NULL REFERENCES nodes(id),
    context VARCHAR(50) NOT NULL,
    threshold_type VARCHAR(20) NOT NULL,
    threshold_config JSONB NOT NULL,
    weight DECIMAL(3,2) NOT NULL CHECK (weight >= 0 AND weight <= 1),
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Argument validity judgments
CREATE TABLE validity_judgments (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    argument_id UUID NOT NULL REFERENCES nodes(id),
    validity_state VARCHAR(30) NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    reasoning TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_current BOOLEAN NOT NULL DEFAULT TRUE
);

-- Validity conditions
CREATE TABLE validity_conditions (
    id UUID PRIMARY KEY,
    judgment_id UUID NOT NULL REFERENCES validity_judgments(id),
    condition_type VARCHAR(30) NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    operator VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB
);

-- Activity events (immutable log)
CREATE TABLE activity_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    action_category VARCHAR(30) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id UUID,
    source VARCHAR(20) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    is_reversed BOOLEAN NOT NULL DEFAULT FALSE,
    reversed_by UUID REFERENCES activity_events(id),
    reversal_of UUID REFERENCES activity_events(id),
    metadata JSONB
);

-- Activity event node references
CREATE TABLE activity_event_nodes (
    event_id UUID NOT NULL REFERENCES activity_events(id),
    node_id UUID NOT NULL REFERENCES nodes(id),
    node_type VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    PRIMARY KEY (event_id, node_id)
);

-- User metric snapshots
CREATE TABLE user_metric_snapshots (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metrics JSONB NOT NULL,
    sample_size INTEGER NOT NULL,
    window_days INTEGER NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_vote_events_user ON vote_events(user_id, timestamp DESC);
CREATE INDEX idx_vote_events_node ON vote_events(target_node_id);
CREATE INDEX idx_agreement_user_current ON agreement_positions(user_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_agreement_belief ON agreement_positions(belief_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_activity_user ON activity_events(user_id, timestamp DESC);
CREATE INDEX idx_activity_type ON activity_events(action_type, timestamp DESC);
CREATE INDEX idx_compatibility_user ON compatibility_preconditions(user_id, context);
CREATE INDEX idx_validity_user ON validity_judgments(user_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_metrics_user ON user_metric_snapshots(user_id, computed_at DESC);
```

---

## 5. API Contracts

### 5.1 Vote Endpoints

```yaml
POST /api/v1/votes
  description: Record a vote on a node
  request:
    targetNodeId: UUID
    voteType: UPVOTE | DOWNVOTE | RETRACT
  response:
    voteEvent: VoteEvent
    currentScore: number

GET /api/v1/users/{userId}/votes
  description: Get user's voting history
  query:
    nodeType?: BELIEF | ARGUMENT | EVIDENCE
    voteType?: UPVOTE | DOWNVOTE
    topicId?: UUID
    fromDate?: ISO8601
    toDate?: ISO8601
    sortBy?: recency | score
    limit?: number (default: 50, max: 200)
    cursor?: string
  response:
    votes: VoteEvent[]
    nextCursor: string | null
```

### 5.2 Agreement Endpoints

```yaml
POST /api/v1/agreements
  description: Set agreement position on a belief
  request:
    beliefId: UUID
    value: number (-100 to +100)
    trigger?: AgreementChangeTrigger
  response:
    position: AgreementPosition
    label: AgreementLabel

GET /api/v1/users/{userId}/agreements
  description: Get user's current agreement positions
  query:
    beliefIds?: UUID[]
    minValue?: number
    maxValue?: number
    includeHistory?: boolean
    limit?: number
    cursor?: string
  response:
    positions: AgreementPosition[]
    nextCursor: string | null

GET /api/v1/users/{userId}/agreements/{beliefId}/history
  description: Get position history for a specific belief
  response:
    positions: AgreementPosition[]
    drift: { totalChange: number, direction: string }
```

### 5.3 Compatibility Endpoints

```yaml
POST /api/v1/compatibility/preconditions
  description: Create a compatibility precondition
  request:
    beliefId: UUID
    context: CompatibilityContext
    thresholdType: MINIMUM | MAXIMUM | RANGE | EXACT_MATCH
    thresholdConfig: object
    weight?: number
    isRequired?: boolean
  response:
    precondition: CompatibilityPrecondition

GET /api/v1/users/{userId}/compatibility/score
  description: Calculate compatibility with another user
  query:
    targetUserId: UUID
    context?: CompatibilityContext
  response:
    overallScore: number
    breakdown: {
      beliefId: UUID
      myPosition: number
      theirPosition: number
      meetsThreshold: boolean
      contribution: number
    }[]
    dealbreakers: UUID[]  # Beliefs where required threshold not met
```

### 5.4 Validity Judgment Endpoints

```yaml
POST /api/v1/validity-judgments
  description: Record validity judgment on an argument
  request:
    argumentId: UUID
    validityState: ValidityState
    confidence?: number
    conditions?: ValidityCondition[]
    overriddenBy?: UUID[]
    reasoning?: string
  response:
    judgment: ArgumentValidityJudgment

GET /api/v1/users/{userId}/validity-judgments
  description: Get user's validity judgments
  query:
    validityState?: ValidityState
    argumentIds?: UUID[]
    limit?: number
    cursor?: string
  response:
    judgments: ArgumentValidityJudgment[]
    nextCursor: string | null
```

### 5.5 Activity & Metrics Endpoints

```yaml
GET /api/v1/users/{userId}/activity
  description: Get user's activity log
  query:
    actionCategory?: ActionCategory
    actionType?: ActionType
    nodeId?: UUID
    fromDate?: ISO8601
    toDate?: ISO8601
    limit?: number
    cursor?: string
  response:
    events: ActivityEvent[]
    nextCursor: string | null

GET /api/v1/users/{userId}/metrics
  description: Get user's behavioral metrics
  query:
    includeHistory?: boolean
    windowDays?: number
  response:
    current: UserMetricSnapshot
    history?: UserMetricSnapshot[]
```

---

## 6. Additional Tracking Recommendations

Based on the ISE's goal as a "debugging interface for human reasoning," the following additional tracking should be implemented:

### 6.1 Belief Revision Audit Trail

Track complete before/after state when users change positions:

```typescript
interface BeliefRevision {
  id: UUID;
  userId: UUID;
  beliefId: UUID;
  previousValue: number;
  newValue: number;
  catalysts: {
    type: 'NEW_EVIDENCE' | 'NEW_ARGUMENT' | 'PEER_DISCUSSION' | 'SELF_REFLECTION' | 'REAL_WORLD_EVENT';
    referenceId?: UUID;
    description?: string;
  }[];
  userExplanation?: string;  // Optional: why did you change?
  timestamp: ISO8601DateTime;
}
```

### 6.2 Assumption Dependency Tracking

Map which of a user's beliefs depend on which assumptions:

```typescript
interface AssumptionDependency {
  userId: UUID;
  beliefId: UUID;
  assumptionId: UUID;
  dependencyStrength: 'CRITICAL' | 'STRONG' | 'MODERATE' | 'WEAK';
  userAcknowledged: boolean;  // Has user explicitly confirmed this dependency?
}
```

**Value**: When an assumption is challenged, surface all dependent beliefs for review.

### 6.3 Value Conflict Detection

Track when user positions on different beliefs imply conflicting values:

```typescript
interface ValueConflict {
  id: UUID;
  userId: UUID;
  beliefA: { id: UUID; impliedValue: UUID; position: number };
  beliefB: { id: UUID; impliedValue: UUID; position: number };
  conflictType: 'DIRECT_CONTRADICTION' | 'PRIORITY_INCONSISTENCY' | 'CONTEXTUAL_TENSION';
  severity: number;  // 0.0 to 1.0
  userResolution?: {
    resolvedAt: ISO8601DateTime;
    resolution: 'CHANGED_POSITION_A' | 'CHANGED_POSITION_B' | 'ACCEPTED_TENSION' | 'CLARIFIED_CONTEXT';
    explanation?: string;
  };
  detectedAt: ISO8601DateTime;
}
```

### 6.4 Confidence-Evidence Calibration

Flag mismatches between user certainty and supporting evidence:

```typescript
interface CalibrationAlert {
  id: UUID;
  userId: UUID;
  beliefId: UUID;
  userConfidence: number;        // Agreement intensity
  evidenceStrength: number;      // System-calculated from evidence quality
  mismatchSeverity: number;      // |confidence - evidenceStrength|
  mismatchDirection: 'OVERCONFIDENT' | 'UNDERCONFIDENT';
  suggestedAction?: string;
  acknowledgedAt?: ISO8601DateTime;
}
```

### 6.5 Source Diversity Tracking

Track the diversity of sources a user engages with:

```typescript
interface SourceEngagement {
  userId: UUID;
  metrics: {
    uniqueSourcesEngaged: number;
    sourceTypeDistribution: Record<string, number>;  // academic, news, social, etc.
    politicalSpectrumCoverage: number;  // 0.0 to 1.0
    echoChhamberScore: number;  // How insular is their engagement?
  };
  computedAt: ISO8601DateTime;
}
```

### 6.6 Prediction Tracking

Allow users to register falsifiable predictions tied to beliefs:

```typescript
interface Prediction {
  id: UUID;
  userId: UUID;
  beliefId: UUID;
  predictionText: string;
  confidence: number;  // 0.0 to 1.0
  resolutionCriteria: string;
  deadline: ISO8601DateTime;
  outcome?: {
    resolvedAt: ISO8601DateTime;
    result: 'CORRECT' | 'INCORRECT' | 'PARTIALLY_CORRECT' | 'UNRESOLVABLE';
    evidenceId?: UUID;
  };
  createdAt: ISO8601DateTime;
}
```

**Value**: Calibrate user confidence against real-world outcomes.

### 6.7 Argument Engagement Quality

Track how users engage with opposing arguments:

```typescript
interface ArgumentEngagementMetrics {
  userId: UUID;
  metrics: {
    steelmanRatio: number;      // Engages strongest form of opposing arguments
    strawmanFlags: number;      // Times flagged for strawmanning
    charityScore: number;       // Interprets others charitably
    counterargumentDepth: number;  // Average depth of counter-engagement
  };
  computedAt: ISO8601DateTime;
}
```

### 6.8 Cognitive Bias Flags

Track identified cognitive biases (self-reported or peer-identified):

```typescript
interface BiasFlag {
  id: UUID;
  targetUserId: UUID;
  biasType: CognitiveBiasType;
  evidenceContext: {
    beliefId?: UUID;
    argumentId?: UUID;
    description: string;
  };
  flaggedBy: UUID | 'SYSTEM';  // Other user or automated detection
  isSelfReported: boolean;
  acknowledgedAt?: ISO8601DateTime;
  timestamp: ISO8601DateTime;
}

type CognitiveBiasType =
  | 'CONFIRMATION_BIAS'
  | 'ANCHORING'
  | 'AVAILABILITY_HEURISTIC'
  | 'DUNNING_KRUGER'
  | 'SUNK_COST'
  | 'IN_GROUP_BIAS'
  | 'BACKFIRE_EFFECT'
  | 'MOTIVATED_REASONING'
  // ... extensible
  ;
```

### 6.9 Temporal Belief Stability

Track how stable beliefs are over time:

```typescript
interface BeliefStability {
  userId: UUID;
  beliefId: UUID;
  metrics: {
    totalChanges: number;
    averageTimeBetweenChanges: number;  // days
    volatilityScore: number;  // Standard deviation of positions
    stabilityTrend: 'STABILIZING' | 'VOLATILE' | 'STABLE';
    currentStreak: number;  // Days at current position
  };
  computedAt: ISO8601DateTime;
}
```

### 6.10 Social Influence Mapping

Track whose arguments/evidence most influence position changes:

```typescript
interface InfluenceRecord {
  influencedUserId: UUID;
  influencerUserId: UUID;
  beliefId: UUID;
  influenceEvent: {
    type: 'ARGUMENT' | 'EVIDENCE' | 'DISCUSSION';
    referenceId: UUID;
  };
  positionChangeMagnitude: number;
  timestamp: ISO8601DateTime;
}
```

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Requirement | Target |
|-------------|--------|
| Vote recording latency | < 100ms p95 |
| Agreement position update | < 150ms p95 |
| Activity log query (paginated) | < 200ms p95 |
| Metric computation (per user) | < 5s |
| Dashboard initial load | < 2s |

### 7.2 Scalability

| Requirement | Target |
|-------------|--------|
| Concurrent users | 100,000+ |
| Activity events per day | 10M+ |
| Vote events per day | 50M+ |
| Metric computation parallelism | 1000 users/minute |

### 7.3 Data Retention

| Data Type | Retention |
|-----------|-----------|
| Activity events | Indefinite (immutable log) |
| Vote history | Indefinite |
| Agreement position history | Indefinite |
| Metric snapshots | 2 years (aggregate older) |

### 7.4 Privacy & Security

| Requirement | Description |
|-------------|-------------|
| Compatibility preconditions | Encrypted at rest, private by default |
| Activity log | User can export all their data (GDPR) |
| Deletion | Support "right to be forgotten" with audit trail tombstones |
| Access control | Users can only view their own private data |

### 7.5 Auditability

- All data mutations must be traceable to a user action or system event
- No hard deletes; use soft deletes with tombstones
- Maintain referential integrity across reversals

---

## 8. Glossary

| Term | Definition |
|------|------------|
| **Belief** | A propositional claim that can be agreed or disagreed with |
| **Argument** | A logical structure that supports or opposes a belief |
| **Evidence** | Empirical data or citations that substantiate an argument |
| **Assumption** | An implicit premise required for an argument to hold |
| **Value** | A normative priority that influences belief formation |
| **Interest** | A stakeholder-specific desired outcome |
| **Agreement Position** | A user's degree of agreement with a belief (-100 to +100) |
| **Compatibility Precondition** | A belief that must meet alignment thresholds for relationship compatibility |
| **Validity Judgment** | A user's assessment of an argument's logical soundness |
| **Belief Drift** | Change in agreement position over time |
| **Engagement Depth** | How far into argument chains a user explores |
| **Epistemic Reputation** | Trust metric based on reasoning quality |

---

## Appendix A: Reference Links

- Reasons structure: https://myclob.pbworks.com/Reasons
- Assumptions framework: https://myclob.pbworks.com/Assumptions
- Truth scoring: https://myclob.pbworks.com/w/page/21960078/truth
- Linkage scores: https://myclob.pbworks.com/w/page/159338766/Linkage%20Scores
- Values framework: https://myclob.pbworks.com/w/page/21956745/American%20values
- Stakeholder interests: https://myclob.pbworks.com/w/page/159301140/Interests

---

## Appendix B: Implementation Phases (Suggested)

### Phase 1: Foundation (MVP)
- Vote events with history
- Agreement positions with labels
- Basic activity log
- Core API endpoints

### Phase 2: Reasoning Quality
- Validity judgments with conditions
- Assumption dependency tracking
- Argument engagement metrics

### Phase 3: Social Intelligence
- Compatibility preconditions
- Influence mapping
- Source diversity tracking

### Phase 4: Advanced Analytics
- Derived behavioral metrics
- Bias detection
- Prediction tracking
- Confidence-evidence calibration

---

*End of Document*
