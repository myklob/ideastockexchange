# Idea Stock Exchange: Technical Blueprint

> **Status: Founder's proposal, not ratified spec.**
> This document describes a v2 derivatives-market layer over the existing epistemic machinery. It overlaps with, and in several places conflicts with, `ObjectiveCriteriaScoringAlgorithm.md`, `docs/ARCHITECTURE.md`, and `prisma/schema.prisma`. Before implementing any section, consult `docs/BLUEPRINT_RECONCILIATION.md`, which maps each proposal onto what already exists and flags the open decisions (market maker, database, score range, argument taxonomy).

**Audience:** Founding engineering and science team (backend, mobile, ML, quant, product)
**Purpose:** Build a derivatives market where the underlying asset is the logical strength of a belief, computed from a recursive argument graph
**Format:** Authoritative spec. Opinions where the author has them. Open questions flagged explicitly.
**Owner:** Mike Laub

---

## Part 0: What We Are Building (and What We Are Not)

Polymarket lets people bet on whether a thing will happen. The Idea Stock Exchange lets people bet on whether an argument will survive scrutiny. That is a different animal.

On Polymarket, the price of a contract moves because reality changed. A candidate won, a ceasefire was signed, a quarterly GDP number printed. Price discovery is downstream of news.

On the ISE, the price of a contract moves because the *argument graph* changed. Someone added a new pro argument with strong evidence. Someone demolished an assumption three layers down the tree. Someone showed that argument A does not actually support belief B, collapsing its linkage score to near zero. The market reprices because the structural integrity of the belief changed, not because the world changed.

This is a market for epistemology. Build it accordingly.

### What this document covers

1. The complete reward and punishment system (every lever we use to promote good arguments and destroy bad ones)
2. Data model (tables, relationships, indices)
3. Scoring engine (math and pseudocode)
4. Epoch system (how monthly freezes work)
5. Market microstructure (LMSR, contracts, settlement)
6. Mobile app architecture (iOS and Android)
7. Anti-gaming and redundancy systems
8. 90-day MVP roadmap
9. Post-MVP roadmap
10. Team structure and roles
11. Open decisions the team must make

---

## Part 1: The Complete Reward and Punishment Inventory

Every mechanism on this list must appear somewhere in the codebase. If a mechanism is missing, a dimension of truth-seeking is missing. The list is the contract between product and engineering.

### 1.1 Rewards (mechanisms that push good arguments up)

| # | Mechanism | Implementation Location |
|---|---|---|
| R1 | Recursive reinforcement: strong sub-arguments propagate score to parents | Scoring engine, recursive traversal |
| R2 | Evidence anchoring with tiered quality (T1-T4) | Evidence table, tier field, scoring weights |
| R3 | Truth scoring (likelihood correct, not popular) | Argument table, truth_score field |
| R4 | Importance weighting (magnitude of consequence if true) | Argument table, importance_score field |
| R5 | Linkage enforcement (relevance to parent, multiplicative) | Linkage table, linkage_score field |
| R6 | Survival through counterargument (withstanding attack strengthens score) | Score persistence across epochs, counter-attack counters |
| R7 | Trader profit aligned with epistemic accuracy | Market settlement, P&L ledger |
| R8 | Cross-belief reinforcement (one argument can support many beliefs) | Graph structure, many-to-many linkages |
| R9 | Reputation weighting (strong track record amplifies influence) | User table, reputation_score field |
| R10 | Unique-argument bonus (novel reasoning beats repetition) | Semantic clustering, uniqueness_factor |
| R11 | Contributor rewards (bonus credits when your argument shifts a score) | Epoch settlement, contributor attribution |

### 1.2 Punishments (mechanisms that kill bad arguments)

| # | Mechanism | Implementation Location |
|---|---|---|
| P1 | Linkage collapse (irrelevance drives contribution to zero) | Multiplicative linkage in scoring equation |
| P2 | Fallacy penalties (logical inconsistencies detected and scored down) | Fallacy detection service, fallacy_flags field |
| P3 | Evidence failure (weak, contradicted, or unreplicated sources drag score down) | Evidence table, verification_score field |
| P4 | Recursive collapse (weak sub-arguments drag parents down) | Scoring engine, same recursion that propagates rewards |
| P5 | Reputation damage for bad predictors | Reputation decay for wrong trades and bad arguments |
| P6 | Identity and behavior tracking (sockpuppet suppression) | Anti-abuse service, IP and device fingerprinting, behavior patterns |
| P7 | Semantic clustering (redundant arguments share one slot) | Embedding service, duplicate detection |
| P8 | Cost-benefit counterweighting (bad consequences reduce belief score) | Cost-benefit nodes attached to beliefs |
| P9 | Challenged-linkage markets (users bet on whether A supports B) | Linkage market contracts |

### 1.3 Governance (the moat)

| # | Mechanism | Implementation Location |
|---|---|---|
| G1 | Monthly epoch freeze (graph locked at epoch close) | Epoch cron, snapshot table |
| G2 | Pre-announced algorithm versioning (next month's method published in advance) | Algorithm version registry, public changelog |
| G3 | Meta-markets on algorithm changes (bet on whether new algo moves scores) | Second-order contract type |
| G4 | Hybrid moderation (human editors early, algorithm-driven later) | Moderator queue, escalation rules |
| G5 | Play-money phase before real stakes (calibration, not extraction) | Ledger type field, withdrawal gate |

If you ever catch yourself cutting one of these to ship faster, stop. The value proposition *is* this list.

---

## Part 2: Data Model

We use a relational core (PostgreSQL) with a graph-style access pattern on top. For recursive traversal at scale we will add a graph layer (Neo4j or a materialized adjacency model) in Phase 3, but Phase 1 and 2 live in Postgres.

### 2.1 Core Tables

```sql
-- The asset. Every belief is one row.
CREATE TABLE beliefs (
  belief_id            UUID PRIMARY KEY,
  statement            TEXT NOT NULL,
  category             TEXT NOT NULL,
  subcategory          TEXT,
  dewey_number         TEXT,
  positivity_score     REAL,
  current_score        REAL DEFAULT 0.0 CHECK (current_score BETWEEN -1.0 AND 1.0),
  status               TEXT CHECK (status IN ('active', 'locked', 'archived')),
  created_by           UUID REFERENCES users(user_id),
  created_at           TIMESTAMPTZ DEFAULT now(),
  last_scored_at       TIMESTAMPTZ
);

-- Every argument is itself a belief. This table captures the attributes
-- that apply when a node is acting as an argument for or against a parent.
CREATE TABLE arguments (
  argument_id          UUID PRIMARY KEY,
  belief_id            UUID NOT NULL REFERENCES beliefs(belief_id),
  content              TEXT NOT NULL,
  argument_type        TEXT CHECK (argument_type IN ('pro', 'con', 'assumption', 'interest', 'cost', 'benefit', 'objective_criterion')),
  truth_score          REAL,
  importance_score     REAL,
  uniqueness_factor    REAL DEFAULT 1.0,
  fallacy_flags        JSONB DEFAULT '[]',
  submitted_by         UUID REFERENCES users(user_id),
  cluster_id           UUID REFERENCES argument_clusters(cluster_id),
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- Directed edges. Any node can link to any other node.
CREATE TABLE linkages (
  linkage_id           UUID PRIMARY KEY,
  parent_type          TEXT CHECK (parent_type IN ('belief', 'argument')),
  parent_id            UUID NOT NULL,
  child_id             UUID NOT NULL REFERENCES arguments(argument_id),
  linkage_score        REAL DEFAULT 0.5 CHECK (linkage_score BETWEEN 0.0 AND 1.0),
  linkage_votes_up     INTEGER DEFAULT 0,
  linkage_votes_down   INTEGER DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE (parent_type, parent_id, child_id)
);

-- Evidence anchors arguments to reality.
CREATE TABLE evidence (
  evidence_id          UUID PRIMARY KEY,
  argument_id          UUID NOT NULL REFERENCES arguments(argument_id),
  description          TEXT NOT NULL,
  url_citation         TEXT,
  tier                 TEXT CHECK (tier IN ('T1', 'T2', 'T3', 'T4')),
  evidence_role        TEXT CHECK (evidence_role IN ('supports', 'weakens')),
  verification_score   REAL DEFAULT 0.5,
  submitted_by         UUID REFERENCES users(user_id),
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- Clustering prevents duplicate arguments from gaming the system.
CREATE TABLE argument_clusters (
  cluster_id           UUID PRIMARY KEY,
  canonical_argument   UUID REFERENCES arguments(argument_id),
  embedding            VECTOR(768),
  member_count         INTEGER DEFAULT 1
);
```

### 2.2 Market Tables

```sql
-- A contract is a bet on whether a belief score crosses a threshold.
CREATE TABLE contracts (
  contract_id          UUID PRIMARY KEY,
  belief_id            UUID NOT NULL REFERENCES beliefs(belief_id),
  condition            TEXT CHECK (condition IN ('greater_than', 'less_than')),
  target_score         REAL NOT NULL,
  resolution_epoch     UUID NOT NULL REFERENCES epochs(epoch_id),
  status               TEXT CHECK (status IN ('open', 'locked', 'settled')),
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- An LMSR market maker for each contract. Start simple.
CREATE TABLE market_state (
  contract_id          UUID PRIMARY KEY REFERENCES contracts(contract_id),
  yes_shares           NUMERIC(20,4) DEFAULT 0,
  no_shares            NUMERIC(20,4) DEFAULT 0,
  liquidity_parameter  NUMERIC(20,4) DEFAULT 100.0,
  current_yes_price    REAL,
  total_volume         NUMERIC(20,4) DEFAULT 0
);

CREATE TABLE positions (
  position_id          UUID PRIMARY KEY,
  user_id              UUID NOT NULL REFERENCES users(user_id),
  contract_id          UUID NOT NULL REFERENCES contracts(contract_id),
  side                 TEXT CHECK (side IN ('yes', 'no')),
  shares               NUMERIC(20,4),
  average_buy_price    REAL,
  realized_pnl         NUMERIC(20,4) DEFAULT 0,
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE trades (
  trade_id             UUID PRIMARY KEY,
  user_id              UUID NOT NULL REFERENCES users(user_id),
  contract_id          UUID NOT NULL REFERENCES contracts(contract_id),
  side                 TEXT,
  shares               NUMERIC(20,4),
  price                REAL,
  fee                  NUMERIC(20,4),
  executed_at          TIMESTAMPTZ DEFAULT now()
);
```

### 2.3 Epoch and Algorithm Versioning

```sql
CREATE TABLE epochs (
  epoch_id             UUID PRIMARY KEY,
  epoch_number         INTEGER UNIQUE,
  start_date           DATE NOT NULL,
  end_date             DATE NOT NULL,
  algorithm_version    TEXT NOT NULL,
  status               TEXT CHECK (status IN ('future', 'active', 'settling', 'closed'))
);

-- Snapshot of the full graph state at epoch close. This is what contracts settle against.
CREATE TABLE belief_score_history (
  history_id           UUID PRIMARY KEY,
  belief_id            UUID NOT NULL REFERENCES beliefs(belief_id),
  epoch_id             UUID NOT NULL REFERENCES epochs(epoch_id),
  final_score          REAL NOT NULL,
  algorithm_version    TEXT NOT NULL,
  computed_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (belief_id, epoch_id)
);
```

### 2.4 Users, Reputation, and Ledger

```sql
CREATE TABLE users (
  user_id              UUID PRIMARY KEY,
  handle               TEXT UNIQUE NOT NULL,
  email                TEXT UNIQUE NOT NULL,
  reputation_score     REAL DEFAULT 0.5,
  play_balance         NUMERIC(20,4) DEFAULT 10000.0,
  real_balance         NUMERIC(20,4) DEFAULT 0,
  kyc_status           TEXT CHECK (kyc_status IN ('none', 'pending', 'verified')),
  device_fingerprints  JSONB DEFAULT '[]',
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reputation_events (
  event_id             UUID PRIMARY KEY,
  user_id              UUID NOT NULL REFERENCES users(user_id),
  event_type           TEXT, -- 'argument_survived', 'prediction_correct', 'fallacy_detected', etc.
  delta                REAL,
  source_id            UUID,
  created_at           TIMESTAMPTZ DEFAULT now()
);
```

### 2.5 Indices You Will Need

```sql
CREATE INDEX idx_linkages_parent ON linkages (parent_type, parent_id);
CREATE INDEX idx_linkages_child ON linkages (child_id);
CREATE INDEX idx_arguments_belief ON arguments (belief_id);
CREATE INDEX idx_arguments_cluster ON arguments (cluster_id);
CREATE INDEX idx_evidence_argument ON evidence (argument_id);
CREATE INDEX idx_contracts_belief_epoch ON contracts (belief_id, resolution_epoch);
CREATE INDEX idx_belief_score_history_belief ON belief_score_history (belief_id, epoch_id);
```

---

## Part 3: The Scoring Engine

This is the heart. If this is wrong, nothing else matters.

### 3.1 Core Equation

For any node $N$ in the graph, its score $S_N$ is computed recursively:

$$S_N = \tanh\left(T_N \cdot I_N \cdot U_N + \sum_{c \in \text{children}(N)} \text{sign}(c) \cdot S_c \cdot L_c \cdot D(d_c) \cdot U_c\right)$$

Where:
- $T_N$ is the truth score of $N$ derived from its evidence
- $I_N$ is the importance score
- $U_N$ is the uniqueness factor (1.0 for novel arguments, less for members of dense clusters)
- $L_c$ is the linkage score of the edge from $c$ to $N$
- $D(d_c) = 1 / (1 + d_c)$ is the decay factor based on depth
- $\text{sign}(c)$ is +1 for pros and -1 for cons
- $\tanh$ bounds the final score between -1 and +1

Key properties this gives you:

1. Evidence is the floor. If no evidence, $T_N$ approaches zero and the node contributes only through its children.
2. Linkage is multiplicative. An irrelevant argument with $L = 0.05$ is effectively dead regardless of how true it is.
3. Decay prevents deep rabbit holes from dominating. A ten-layer-deep rebuttal still counts, just less.
4. Uniqueness prevents spam. Ten copies of the same argument share one slot.
5. The $\tanh$ envelope is symmetric and saturates gracefully. No overflow, no unbounded scores.

### 3.2 Reference Pseudocode

```python
from math import tanh
from functools import lru_cache

MAX_DEPTH = 6
DECAY_BASE = 1.0

def compute_belief_score(belief_id: UUID, algorithm_version: str) -> float:
    visited = set()
    return _score_node(belief_id, node_type='belief', depth=0, visited=visited)

def _score_node(node_id, node_type, depth, visited):
    # Cycle guard. Revisiting a node within the same traversal returns 0.
    if (node_type, node_id) in visited:
        return 0.0
    visited = visited | {(node_type, node_id)}

    if depth > MAX_DEPTH:
        return 0.0

    node = load_node(node_id, node_type)

    # Base score from this node's own properties
    truth = node.truth_score if node.truth_score is not None else derive_truth_from_evidence(node_id)
    importance = node.importance_score or 0.5
    uniqueness = node.uniqueness_factor or 1.0
    fallacy_penalty = compute_fallacy_penalty(node.fallacy_flags)

    base = truth * importance * uniqueness * (1.0 - fallacy_penalty)

    # Recursive contribution from children
    child_sum = 0.0
    decay = DECAY_BASE / (1.0 + depth)

    for edge in load_child_edges(node_id, node_type):
        child_score = _score_node(edge.child_id, 'argument', depth + 1, visited)
        sign = +1 if edge.argument_type in ('pro', 'benefit', 'objective_criterion') else -1
        contribution = sign * child_score * edge.linkage_score * decay * edge.child_uniqueness
        child_sum += contribution

    return tanh(base + child_sum)
```

### 3.3 How Each Reward and Punishment Mechanism Shows Up in the Math

Every item from Part 1 must be traceable to a variable or term in the equation. If you cannot point to it, the mechanism is not implemented.

| Mechanism | Where it lives in the equation |
|---|---|
| R1 Recursive reinforcement | The child summation term |
| R2 Evidence tier | $T_N$ weighted by tier (T1 = 1.0, T2 = 0.7, T3 = 0.4, T4 = 0.15) |
| R5 Linkage enforcement | $L_c$ multiplier |
| R10 Unique-argument bonus | $U_N$ factor |
| P1 Linkage collapse | $L_c \approx 0$ kills contribution |
| P2 Fallacy penalty | $(1 - \text{fallacy\_penalty})$ term |
| P4 Recursive collapse | Same child summation, but negative when cons dominate |
| P7 Semantic clustering | $U_N$ reduced for cluster members |

### 3.4 Truth Score Derivation

Truth score is not hand-entered. It comes from the evidence attached to an argument:

$$T_N = \text{clip}\left(\frac{\sum_{e \in E_N} \sigma(e) \cdot w_{\text{tier}(e)} \cdot v_e}{\sum_{e \in E_N} w_{\text{tier}(e)}}, 0, 1\right)$$

Where $\sigma(e) = +1$ for supporting evidence, $-1$ for weakening, $w_{\text{tier}}$ is the tier weight, and $v_e$ is the verification score (community-validated or algorithmic).

An argument with no evidence has $T_N = 0.5$ by default, a neutral prior. Its entire score then depends on whether its children are strong.

### 3.5 Performance Budget

At launch we will have hundreds of beliefs, not millions. Naive recursion is fine. At 10,000 beliefs with average depth 4 and average fanout 6, a full recompute is roughly $10^4 \times 6^4 = 1.3 \times 10^7$ operations. That runs in seconds on a single worker.

At 100,000 beliefs we move to:
- Materialized views for sub-tree scores
- Incremental recomputation (only dirty sub-trees)
- Graph database (Neo4j) for traversal

Do not prematurely optimize. Build the reference recursion first, benchmark, then add caching.

---

## Part 4: The Epoch System

Monthly epochs are the clock that the entire market runs on. They solve three problems at once: preventing mid-cycle manipulation, forcing algorithmic transparency, and creating natural settlement moments for contracts.

### 4.1 Epoch Lifecycle

```
Day 1 of month     -> Epoch opens. Previous epoch scores published. New contracts available.
Day 1 to Day 25    -> Active trading. Arguments and evidence can be added. Scores update live.
Day 26 to Day 30   -> Freeze window. New arguments accepted but flagged for next epoch.
Day 30, 23:59 UTC  -> Graph locked. Settlement algorithm runs. Final scores written.
Day 31 or Day 1    -> Settlement. Contracts pay out. New epoch opens.
```

### 4.2 What the Freeze Actually Does

At freeze time, the system:

1. Copies every belief, argument, linkage, and evidence row into an immutable snapshot table keyed by epoch_id.
2. Runs the official scoring algorithm (whose version was announced at the previous epoch close) over the snapshot.
3. Writes final scores to `belief_score_history`.
4. Settles every contract with `resolution_epoch = current_epoch_id` by comparing final score to target.
5. Updates reputation scores based on prediction accuracy and argument performance.
6. Publishes the next epoch's algorithm version with a diff against the previous version.

### 4.3 Algorithm Versioning

Every epoch runs exactly one algorithm version. The version is pre-announced at the start of the previous epoch. Changes to the algorithm between announcement and use are forbidden. This creates a meta-market: users can bet on whether the upcoming algorithm version will move specific scores up or down.

Algorithm versions are stored as code in a versioned registry, not as hand-edited numbers. Every version has unit tests, property tests, and a reference set of beliefs with known expected scores. A version cannot be promoted to production until it passes the regression suite.

---

## Part 5: Market Microstructure

Users trade contracts whose settlement value depends on whether a belief's end-of-epoch score crosses a target.

### 5.1 Contract Types

**Phase 1 (MVP):** Binary contracts.
"Belief X score will be greater than 0.25 at epoch close." Pays 1.0 if true, 0.0 if false.

**Phase 2:** Range contracts.
"Belief X score will be between 0.10 and 0.30 at epoch close."

**Phase 3:** Delta contracts.
"Belief X score will increase by more than 0.05 this epoch."

**Phase 4:** Meta-contracts.
"Under algorithm version 2.1, Belief X score will exceed 0.40."
"Algorithm version 2.1 will increase the average score of climate-related beliefs."

### 5.2 Market Maker: LMSR

Use Logarithmic Market Scoring Rule. It is the standard for prediction markets, it provides infinite liquidity, and the math is well understood.

The cost function:

$$C(q_Y, q_N) = b \cdot \ln(e^{q_Y / b} + e^{q_N / b})$$

The instantaneous price of YES:

$$P_Y = \frac{e^{q_Y / b}}{e^{q_Y / b} + e^{q_N / b}}$$

Where $b$ is the liquidity parameter. Higher $b$ means more liquidity but also means the market maker's maximum loss is higher. Start with $b = 100$ for play-money markets.

### 5.3 Transaction Fees

Take a fee of 2% on every trade. This is the revenue model. Do not take a spread. LMSR already implies a spread as $b \to 0$. Fees are additive and transparent.

### 5.4 Play Money, Then Real Money

Phase 1 runs on play money only. Every new user gets 10,000 Reason Credits. There is no deposit, no withdrawal, no KYC.

Phase 2 introduces real money in jurisdictions where prediction markets on abstract scores are legal. This is where the lawyers earn their keep. Regulatory status of betting on algorithmic scores of arguments is ambiguous. Kalshi took years to get CFTC approval for event contracts. Plan for a long regulatory runway and build the product so that play-money users never migrate automatically. Real-money trading is opt-in, KYC-gated, jurisdiction-gated.

---

## Part 6: Mobile Apps (iOS and Android)

The mobile app is the primary surface. Web exists but is secondary. Users should be able to trade on a bus.

### 6.1 Technology Choice

Use **React Native** with TypeScript. Reasons:

1. One codebase, two platforms, one team.
2. The UI is heavy on lists, cards, charts, and forms. All of this is React Native's sweet spot.
3. Native modules are available for the few places we need them (biometric auth, push, in-app purchase of Reason Credit packs).

The alternative is Flutter. It is fine. React Native wins on hiring because every web engineer on the team can contribute.

Do not use a WebView wrapper. Users will notice and leave.

### 6.2 App Architecture

```
/apps
  /mobile
    /src
      /screens          # BeliefList, BeliefDetail, ArgumentEditor, MarketDetail, Portfolio, Profile
      /components       # BeliefCard, ArgumentTreeNode, EvidenceBadge, OrderBookWidget, PriceChart
      /state            # Redux Toolkit + RTK Query for API calls
      /api              # REST client, WebSocket client for live prices
      /charts           # Score-over-time, price-over-time (Victory Native or react-native-skia)
      /navigation       # Stack + bottom tabs
    /ios                # Pod config, entitlements
    /android            # Gradle, manifest
```

### 6.3 Core User Journeys

The mobile app ships with exactly these five screens in v1. Nothing else.

1. **Home / Belief Feed.** Infinite scroll of beliefs. Each card shows statement, current score, 30-day chart, open contracts, number of arguments. Filter by category. Search.
2. **Belief Detail.** Argument tree (collapsible, color-coded pro vs con), evidence list, linked markets. Tap a market to open trade panel.
3. **Trade Panel.** Slider for position size, YES vs NO toggle, real-time price, "max loss" display, confirm button. Use biometric auth for confirm.
4. **Portfolio.** Open positions, P&L, transaction history, play-money balance.
5. **Profile.** Reputation score, arguments submitted, arguments that survived, predictions made and their accuracy, settings.

### 6.4 Real-Time Updates

Prices, scores, and argument changes push via WebSocket. Fall back to polling every 15 seconds if the socket drops. Use a single socket connection per user, multiplex topics.

### 6.5 Offline Behavior

Read-only access when offline: cached beliefs, cached tree, last-known prices. Trades, argument submissions, and votes queue locally and flush on reconnect. Never lose a user's draft argument.

### 6.6 Submitting Arguments From Mobile

This is the hardest part of mobile UX. Good arguments take thought. Mobile is not where most people want to write them. But mobile is where most people *will* write them, because that is where their attention lives.

Solutions:

1. Draft persistence. A half-written argument survives app close, reboot, and device switch.
2. Structured templates. Do not give users a free-text box. Give them "Claim," "Because," "Evidence URL." The structure forces clarity.
3. Evidence link previews. Paste a URL, the app fetches Open Graph data and shows a preview card inline.
4. Voice dictation with post-edit. Dictate, then clean up. Most people type slowly on phones.
5. Fallacy linter. As the user types, flag patterns that look like common fallacies (appeal to authority without citation, ad hominem, circular reasoning). Do not block submission, just nudge.

### 6.7 What Mobile Does Not Do in v1

- Full belief authoring. Create-a-new-belief is web-only in v1.
- Advanced charts, order books, bulk trading. Save for Phase 2.
- Discussion threads. There are no threads in this product, only structured arguments.

---

## Part 7: Anti-Gaming and Redundancy Systems

Without these, the platform becomes Reddit with extra steps. These are not optional.

### 7.1 Semantic Argument Clustering

Every new argument passes through an embedding model (sentence-transformers or OpenAI embeddings). The embedding is compared against existing arguments in the same belief's tree. If cosine similarity exceeds 0.85, the new argument is merged into the existing cluster and its `uniqueness_factor` drops to `1 / cluster_size`.

This does three things:

1. Prevents spam submissions of the same argument.
2. Forces users to differentiate their reasoning to get full credit.
3. Preserves a record of all paraphrases for audit.

Implementation: nightly batch job in v1 (pgvector). Real-time in v2.

### 7.2 Linkage Markets

Users can bet on a second-order question: "Does argument A actually support belief B?" This produces a market-derived linkage score. The final linkage used in the scoring engine is a blend of community voting (one person one vote) and market pricing (stake-weighted). Market weight increases over time as the user base matures.

### 7.3 Reputation

Reputation is a single scalar between 0 and 1 per user, updated after every epoch based on:

- Did arguments they submitted survive attack?
- Did their predictions settle in the money?
- Were their linkage votes aligned with eventual market consensus?
- Did they receive flags for sockpuppet behavior?

Reputation affects:

- Their weight in linkage voting.
- The visibility of their new arguments (low-rep users require moderation pass before showing in feed).
- Their access to real-money markets in Phase 2.

Reputation decays slowly. A user who earned high rep in 2026 and stopped contributing should drift back toward 0.5 over a year.

### 7.4 Sockpuppet and Coordinated Manipulation Detection

Standard defenses:

- Device fingerprinting across all submissions
- IP clustering (flag clusters of new accounts from one IP range)
- Behavior pattern detection (accounts that always vote in lockstep)
- KYC gate for real-money trading
- Rate limits on argument submission per user per belief

Phase 3 adds ML-based detection. Phase 1 is heuristic and manual.

### 7.5 Fallacy Detection

Start with rule-based detection of the most common patterns: ad hominem, appeal to popularity, false dichotomy, slippery slope, circular reasoning. These catch perhaps half of real fallacies. Phase 2 adds a fine-tuned LLM classifier.

Every flagged argument is queued for human review before its fallacy penalty is applied in the scoring engine. Do not let the ML model auto-penalize in v1.

---

## Part 8: 90-Day MVP Roadmap

Three phases of 30 days each. Each phase has one goal. Do not start phase N+1 until phase N meets its acceptance criteria.

### Phase 1 (Days 1-30): The Knowledge Graph

**Goal:** Users can create beliefs, submit arguments, attach evidence, and see a computed score.

Backend:
- Schemas for beliefs, arguments, linkages, evidence, users
- REST API for CRUD on all the above
- Scoring engine reference implementation (Python worker)
- Embedding service for clustering

Web:
- Belief list, belief detail, argument editor, evidence editor
- Admin dashboard for moderation

Acceptance:
- 20 seeded beliefs with real argument trees
- Reference scores match hand-calculated expected values within 0.01
- Five beta users can submit arguments without engineering assistance

### Phase 2 (Days 31-60): The Scoring Engine and Epoch System

**Goal:** The scoring engine runs on a schedule, scores are versioned, contracts can be created against future epochs.

Backend:
- Epoch cron that snapshots, scores, and settles
- Algorithm version registry
- Contract creation API
- Linkage voting and market API
- Reputation event ledger

Web:
- Score history charts
- Algorithm changelog page
- Linkage voting UI

Acceptance:
- Two full epochs run to completion without manual intervention
- All scores reproduce exactly from the snapshot given the algorithm version
- Meta-market contracts can be created on the next algorithm version

### Phase 3 (Days 61-90): The Market and Mobile Apps

**Goal:** Users on iPhone and Android can trade contracts with play money.

Backend:
- LMSR market maker
- Trade execution engine
- Position and P&L ledger
- WebSocket price feed

Mobile:
- iOS and Android apps with five core screens
- Biometric auth
- Push notifications for price moves and epoch close

Acceptance:
- 100 beta users have each made at least one trade
- Apps submitted to App Store and Play Store (even if not approved yet)
- End-to-end latency from argument submission to score update is under 60 seconds

---

## Part 9: Post-MVP Roadmap

### Months 4-6: Hardening

- Load testing. Can the scoring engine handle 10,000 beliefs?
- Neo4j integration for graph traversal.
- Real-time clustering (replace nightly batch).
- LLM-based fallacy detection in moderation queue.
- API for external consumers (researchers, journalists).

### Months 7-12: Real Money (Regulatory Dependent)

- KYC integration (Persona or Plaid).
- Jurisdictional gating.
- Real-money deposit and withdrawal.
- Tax reporting.
- Monitored liquidity for real-money markets.

### Months 13+: The Vision

- Institutional dashboards (universities, think tanks, newsrooms).
- API access tiers.
- Premium analytics (user reputation, argument survival curves, epoch diffs).
- Public API for researchers.
- Integration with Wikipedia, PBworks, and other reference wikis.

---

## Part 10: Team Structure

Minimum viable team, by role:

| Role | Count | Responsibilities |
|---|---|---|
| Backend engineer | 2 | Postgres schema, REST API, scoring engine, epoch cron |
| Mobile engineer | 2 | React Native app, iOS and Android builds, App Store releases |
| Frontend engineer | 1 | Web app, admin dashboard |
| ML / data engineer | 1 | Embedding service, clustering, fallacy detection, reputation model |
| Quant / economist | 1 | LMSR implementation, market microstructure, reputation formula |
| Product / content lead | 1 | Seeded beliefs, moderation rules, community curation |
| Design | 1 | Mobile UX (the hard part), visual identity |
| Legal counsel | 0.25 FTE | Prediction market regulatory strategy |

Total: 8 people, roughly. Ship the MVP in 90 days with this team.

---

## Part 11: Open Decisions the Team Must Make

These are on-purpose ambiguous above. The team should decide and document.

1. **Neo4j or not?** Postgres with recursive CTE works at launch scale. Graph DB is a later optimization. Default: no, until benchmarks show we need it.
2. **Real money jurisdiction strategy.** Start US only with CFTC precedent from Kalshi? Offshore? Both? This is a legal decision, not an engineering one.
3. **Fallacy taxonomy.** Whose list? Aristotle's? Something modern? Pick one and stick with it.
4. **Moderation appeals process.** How do users contest a fallacy flag or a linkage score they think is wrong?
5. **Seeded vs crowd-sourced beliefs at launch.** How many beliefs do we hand-curate before opening the gates? 50? 500?
6. **Algorithm change cadence.** How often can the algorithm change? Monthly is the ceiling. Is there a floor?
7. **Real-money KYC gate threshold.** At what balance does KYC kick in? $0? $1? $100?

---

## Part 12: What We Are Actually Building

Close the document where we opened it.

Every prediction market in existence today prices sentiment. Polymarket is a poll with money attached. Kalshi is a sportsbook in a business suit. They aggregate opinion and call the aggregation "truth."

We are building something different. The price on this exchange moves when the argument graph changes. If nobody submits a new argument, prices drift randomly around their fundamental value. If someone demolishes a load-bearing assumption, half the tree collapses and markets reprice. Traders who noticed the collapse first profit. Users who submitted the demolishing argument earn reputation and contributor rewards. The belief score ends the epoch closer to what the structural integrity of the reasoning actually justifies.

Over time, this produces a system where bad arguments die because they cost their proponents money, good arguments survive because they pay their authors, and belief scores track reasoning quality rather than loudness.

That is what makes this worth building. That is what the code in this document enables.

The rest is engineering.

