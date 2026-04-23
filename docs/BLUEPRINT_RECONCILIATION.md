# Blueprint Reconciliation

How the `TECHNICAL_BLUEPRINT.md` proposal relates to what already exists in this repo.

Purpose: before adopting or ignoring any section of the blueprint, surface which parts duplicate existing work, which parts conflict with it, and which parts are genuinely new. This doc is a map, not a decision.

## TL;DR

The blueprint is a **derivatives-market vision layer** bolted on top of the epistemic machinery this repo has already built. The epistemic machinery (beliefs, arguments, evidence, linkage, clustering, fallacies) largely exists; the **market microstructure, epoch/settlement system, algorithm versioning, and mobile app** are new. The blueprint also conflicts with existing choices in three specific places (market maker, database, score range) that must be resolved before merging the two.

## 1. Overlap — the blueprint restates what the repo already has

| Blueprint item | Existing implementation | File / line |
|---|---|---|
| `beliefs` table | `model Belief` | `prisma/schema.prisma:172-231` |
| `arguments` table | `model Argument` with `parentBeliefId` + `beliefId` edge | `prisma/schema.prisma:251-281` |
| `evidence` table with T1-T4 tiers | `model Evidence` with `evidenceType` (T1-T4) and EVS formula | `prisma/schema.prisma:313-340` |
| Linkage score (R5, P1) | `Argument.linkageScore`, `Evidence.linkageScore`, plus dedicated `LinkageArgument` + `LinkageVote` | `prisma/schema.prisma:283-311` |
| ECLS vs ACLS distinction | `LinkageScoreType` enum already models this | `prisma/schema.prisma:246-249` |
| Linkage classification (DEDUCTIVE_PROOF, STRONG_CAUSAL, …) | `LinkageClassification` enum — richer than the blueprint asks for | `prisma/schema.prisma:233-241` |
| Importance weighting (R4) | `Argument.importanceScore`, `Belief` importance via DebateTopic | `prisma/schema.prisma:265-267` |
| Recursive reinforcement / decay by depth | `Argument.depth` with `0.5^depth` attenuation | `prisma/schema.prisma:272-274` |
| Claim strength bands | `Belief.claimStrength` (Weak/Moderate/Strong/Extreme) | `prisma/schema.prisma:188-195` |
| Fallacy detection (P2) | `backend/utils/fallacyDetection.js` (referenced in `docs/README.md:147`) | — |
| Semantic clustering (P7, R10) | `backend/utils/semanticClustering.js`, `EquivalenceAnalysis` model | `prisma/schema.prisma:753-845` |
| Cost/benefit counterweighting (P8) | Full `CBAAnalysis`/`CBAImpact`/`CBAArgument` subsystem | `prisma/schema.prisma:416-551` |
| Objective criteria scoring | `ObjectiveCriteria` model + ReasonRank 4-dimension algorithm | `prisma/schema.prisma:342-360`; `ObjectiveCriteriaScoringAlgorithm.md` |
| Play money / IdeaCredits | `User.currentBalance Float @default(10000.0)` | `prisma/schema.prisma:109-121` |
| Market contracts on claims | `Claim` + `LiquidityPool` + `Share` + `Trade` (instant, not epoch-gated) | `prisma/schema.prisma:12-107` |

**Net:** everything in blueprint §1.1 R1-R5, R8, R10 and §1.2 P1-P4, P7, P8 already has a home in the data model. The blueprint's §2 schema is not a green-field design; it is a **parallel naming** of entities that already exist under different names.

## 2. Conflict — blueprint contradicts choices already made

These are the decisions that must be made before any scoring or market code lands.

### 2.1 Market maker: LMSR (blueprint) vs CPMM (repo)

- Blueprint §5.2 prescribes Logarithmic Market Scoring Rule with liquidity parameter `b`.
- Repo has a working `LiquidityPool` using `x * y = k` (Constant Product Market Maker). `README.md:30-47`, `prisma/schema.prisma:50-61`.
- These produce different price dynamics and different trader P&L. Pick one; migrating later invalidates all prior trades.
- Recommendation: keep CPMM unless the team has a concrete reason to switch. LMSR's "infinite liquidity" advantage is marginal for play-money phase, and CPMM is simpler to explain and already implemented.

### 2.2 Database: PostgreSQL (blueprint) vs SQLite (repo)

- Blueprint §2 assumes Postgres with `VECTOR(768)` for embeddings and pgvector.
- `prisma/schema.prisma:7-8` declares `provider = "sqlite"`. But `prisma/schema.prisma:1195-1212`-era tables use `cuid()` and `@default(autoincrement())` interchangeably, and `docs/ARCHITECTURE.md:763-767` claims MongoDB.
- Three different storage assumptions across three surfaces of the repo. The blueprint's Postgres choice is defensible, but this needs a written DB decision before anything else.

### 2.3 Score range: [-1, +1] tanh (blueprint) vs [0, 100] (repo)

- Blueprint §3.1 uses `tanh(...)` bounded in `[-1, +1]` with `sign(c)` for pros/cons.
- `ObjectiveCriteriaScoringAlgorithm.md` uses `[0, 100]` throughout with a sigmoid.
- `ARCHITECTURE.md:394-397` uses `CS = Σ((RtA - RtD) × ...)` with 0-100 range.
- `Belief.positivity` already runs `-100 to +100` (`prisma/schema.prisma:183-184`), which is closer to blueprint's sign convention.
- These are not trivially interchangeable — every downstream UI component, every contract target, every threshold assumes one or the other.

### 2.4 Argument taxonomy — flat tree (blueprint) vs sibling tables (repo)

- Blueprint §2.1 folds `pro | con | assumption | interest | cost | benefit | objective_criterion` under one `arguments.argument_type` enum.
- Repo splits these across separate tables: `Argument` (pro/con), `Assumption`, `InterestsAnalysis`, `CostBenefitAnalysis`, `ObjectiveCriteria`, `BiasEntry`, `Obstacle`, etc. `prisma/schema.prisma:390-415`, etc.
- The repo design trades a richer per-node schema for a less-uniform scoring pass. Unifying these behind the blueprint's flat model would require touching every analysis section already built.

## 3. Genuinely new — not present anywhere in the repo

These are the blueprint's real contribution. If the blueprint is adopted, this is what engineering picks up.

| # | Feature | Why it matters |
|---|---|---|
| N1 | **Monthly epoch lifecycle** (§4) with freeze, snapshot, settle, publish-next-algorithm | Repo has no concept of time-boxed scoring. All current scores are live-computed. |
| N2 | **Algorithm version registry** with pre-announcement (§4.3) | No versioning of scoring logic exists today; algorithm changes would invalidate history silently. |
| N3 | **`belief_score_history` snapshot table** (§2.3) | Nothing in Prisma captures point-in-time scores. |
| N4 | **Contracts decoupled from instant resolution** — `contracts` with `resolution_epoch` (§2.2) | Existing `Claim`/`Share`/`Trade` resolves on event, not on epoch score threshold. |
| N5 | **Meta-markets on algorithm changes** (§1.3 G3, §5.1 Phase 4) | Novel; has no analog. |
| N6 | **Challenged-linkage markets** (§1.2 P9, §7.2) — betting on whether A supports B | `LinkageVote` exists as one-person-one-vote; no market-priced linkage. |
| N7 | **Reputation as a ledger** (§2.4 `reputation_events`) | Repo has `User.reputation Number` as a flat field. No event history, no decay model. |
| N8 | **Sockpuppet/device fingerprinting** (§7.4) | No such data is collected. |
| N9 | **React Native mobile app** (§6) | Repo is Next.js web only; no iOS/Android shell exists. |
| N10 | **Play → real money gate with KYC** (§5.4, §9 Months 7-12) | No KYC, deposits, or jurisdictional gating exist. |
| N11 | **Fallacy auto-penalty with human review queue** (§7.5) — detection exists; the moderation queue + blended scoring penalty does not | — |

## 4. Open questions this reconciliation raises

1. **Is the blueprint authoritative, advisory, or speculative?** Until this is answered, committing it risks implying it supersedes `ObjectiveCriteriaScoringAlgorithm.md` and `docs/ARCHITECTURE.md`. Save with a clear "proposal" banner.
2. **Which market maker ships?** CPMM is in code. LMSR is in the blueprint. Keeping both is not an option.
3. **Which scoring algorithm is canonical?** ReasonRank (4-dimension, 0-100) is implemented and documented. Conclusion Score (6-factor, 0-100) is in the architecture doc. Blueprint's tanh-bounded recursion is a third variant.
4. **Is the repo moving to Postgres?** `prisma/schema.prisma` says SQLite; `ARCHITECTURE.md` says MongoDB; blueprint says Postgres + pgvector. One of these needs to be declared authoritative.
5. **Do epochs and settlement replace the existing instant-resolution `Claim` model, or coexist with it?** Coexistence is possible but doubles the ops surface.

## 5. Recommended positioning

When saved, the blueprint should be framed as **a founder's vision proposal for a v2 market layer**, not as a ratified spec. It is valuable as:

- A strategic target that explains *why* the scoring machinery matters (it becomes the underlying asset of a real market).
- An inventory of reward/punishment mechanisms (§1) that can be cross-checked against implementation.
- A mobile product brief (§6) that fills a gap in existing docs.

It should not be treated as:

- A schema to migrate to (conflicts with §2).
- A replacement for `ObjectiveCriteriaScoringAlgorithm.md` (conflicts with §2.3).
- A commitment to LMSR or to Postgres (§2.1, §2.2 — these are open).

The companion file `TECHNICAL_BLUEPRINT.md` carries a preamble pointing here.
