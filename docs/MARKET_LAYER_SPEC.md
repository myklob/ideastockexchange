# Market Layer: Canonical Implementation Spec

The prediction-market layer lets anyone buy and sell binary contracts on where
a belief's score will land at the next monthly snapshot. This document is the
canonical spec for what is **implemented**. The readable pitch lives on the
"Investing in Ideas" page and `/prediction-markets-comparison`.

**Status: built, play money.** Everything below runs in this repository today
— including the five features the original design deferred (meta-markets,
continuous forecast feeds, bundles, leverage, platform shorts), which were
built later by explicit decision with their original warnings preserved
inline. Real money and external-exchange listings remain future work with
real-world dependencies. The full ReasonRank engine is still to come:
snapshots run a **versioned provisional engine** and say so.

## The Firewall (the one absolute rule)

**Market prices and trading volume never feed back into the scoring engine.**
Data flows one way: the engine publishes scores, the market settles against
them. A billion play-dollars on a false claim moves its score by nothing.

Enforced in code, not vibes:

- No file under `src/lib/markets/`, `src/app/api/v1/market/`,
  `src/app/api/v1/oracle/`, or `src/app/markets/` performs a write to any
  graph model. `tests/unit/lib/markets/market-firewall.test.ts` scans the
  source in both directions (market code never writes graph models; scoring
  code never references market tables) and fails CI on a violation.
- `tests/integration/market-layer.test.ts` trades, graduates, bundles,
  leverages, and settles an entire epoch, then asserts the belief score is
  bit-identical to before any market existed.

## The engine and epoch snapshots

- `src/lib/markets/engine.ts` — the versioned scoring function
  (`SCORING_ALGORITHM_VERSION`, currently `reasonrank-provisional-v0.1`):
  importance-weighted pro share of argument impact with the claim-strength
  burden penalty. Pure module: no database, no clock.
- `EpochSnapshot` rows are immutable: `(beliefId, epoch)` unique, storing
  `truthScore`, `algorithmVersion`, and `graphArchive` — the exact inputs the
  algorithm read. `recomputeFromArchive(archive)` reproduces the score to the
  decimal; the integration suite asserts it. No hidden parameters.
- Epochs are calendar months (`"YYYY-MM"`). The boundary is 23:59:59.999 UTC
  on the last day. Arguments posted at 23:59:58 count; 00:00:01 does not.

### Transparency requirements (non-negotiable)

1. Every snapshot records its algorithm version; algorithm changes never
   invalidate old snapshots.
2. Score-affecting algorithm changes are committed to the public repository
   and announced at least two weeks before taking effect.
3. Every score is reproducible from the archived graph state + version.
4. Graph state at each boundary is archived on the snapshot row itself.

## Contracts

`MarketContract` (see `prisma/schema.prisma`):

- **SCORE** (the standard case): binary claim `belief score {ABOVE|BELOW}
  thresholdValue at resolutionEpoch`. Strict inequality — a score exactly at
  the threshold resolves NO.
- **ALGORITHM_DELTA** (meta-market on algorithm governance, formerly
  rejected): YES iff the resolution epoch's snapshot algorithm version
  differs from the prior epoch's AND the score moved in the bet direction;
  no prior baseline → NO. **Governance warning, preserved from the original
  design:** these contracts put market pressure on algorithm governance.
  Versioning, advance announcement, and non-retroactivity are the
  counterweights, and this contract type is the first to cut if the pressure
  distorts governance.
- **PLATFORM_FAILURE** (shorting the platform, formerly rejected): YES iff no
  epoch snapshot lands within the 72-hour grace window after the boundary
  (`SNAPSHOT_GRACE_MS`). A settlement run inside the window proves the
  platform showed up.

Creation: `POST /api/v1/market/contracts` or `service.createContract`.
Resolution epochs must be strictly future at creation.

## Pricing: the hybrid approach

1. **LMSR** (`src/lib/markets/lmsr.ts`) for young markets:
   `C(q) = b·ln(e^{q_yes/b} + e^{q_no/b})`, numerically stable via
   log-sum-exp. Buys cost `C(after) − C(before)`; sells pay the reverse.
   Default `b = 100`; worst-case maker loss `b·ln 2`, covered by transaction
   fees (`feeRate` default 100 bps), which accrue to the contract's
   `liquidityPool` — the current answer to "who funds the subsidy".
2. **Order book** after graduation at `GRADUATION_VOLUME = 1000` traded
   shares: price-time priority, execution at the resting order's limit,
   taker pays the fee, partial fills, no naked shorts (sells require held
   shares net of open sell commitments), buy-side funds escrowed at
   placement and refunded on cancel or price improvement.

Prices are probability units; winning shares pay $1.00 at settlement.

## Settlement (`src/lib/markets/settle.ts`, `scripts/run-epoch.ts`)

Per epoch, in order — and idempotent per epoch:

1. **Graph freeze** 23:50–00:10 UTC around the boundary: score-affecting
   writes (agent ingestion, suggestion acceptance) are rejected with HTTP 423
   / failure mode `graph-freeze`. Reads stay open.
2. **Snapshot run** for every belief referenced by a live contract.
3. **Contract settlement**: pure arithmetic against the snapshot rows.
4. **Payout**: $1.00 per winning share, losing shares expire at zero, open
   orders cancelled with escrow refunds, realized P&L logged, margin loans
   repaid (defaults logged, never absorbed silently).

Cron: `npm run epoch:run` shortly after each boundary (e.g. 00:10 UTC on
the 1st).

## Anti-manipulation

- **Last-minute score manipulation** → the freeze window, plus a settlement
  monitor: any SCORE contract whose final score lands within 5% of its
  threshold gets checked for editors active in the final 7 days who also held
  the winning side; hits create `NEAR_THRESHOLD_EDITOR_POSITION` flags.
- **Wash trading** → self-crossing orders never match (skipped at the
  matching layer); at settlement, any buyer-seller pair above 40% of a
  contract's book volume (min 50 shares) creates a `WASH_TRADING_PATTERN`
  flag.
- **Coordinated argument brigading** → deliberately NOT defended at the
  market layer. Bettors improving the argument graph is the system working;
  the ReasonRank engine is the referee. Do not add market-side censorship or
  vote heuristics — if the engine can't handle adversarial bettors, fix the
  engine.
- A `ManipulationFlag` is a to-do for humans. It is never a settlement input
  and never a scoring input.

## Formerly-deferred features, now built

| Feature | Implementation | Retained caveat |
|---|---|---|
| Meta-markets on algorithm changes | `ALGORITHM_DELTA` contracts | Governance-pressure warning above |
| Continuous forecast price feeds | `PriceTick` rows + `GET /api/v1/market/contracts/[id]/feed`; forecast = score drift model (`forecast.ts`) | Feed/display only; never settles, never scores |
| Complex derivatives | `MarketBundle` — atomic multi-leg execution via `POST /api/v1/market/bundles` | LMSR legs only, all-or-nothing |
| Leverage | `MarginLoan` — borrow up to portfolio equity (2x buying power), auto-repay at settlement, explicit defaults | Play money only; conservative cap on purpose |
| Shorting the platform | `PLATFORM_FAILURE` contracts on the snapshot job's grace window | Falsifiable definition, not vibes |

## External infrastructure (one-way export)

- **Oracle attestations**: `GET /api/v1/oracle/snapshot?belief_id={id}&epoch={YYYY-MM}`
  returns the immutable snapshot signed with Ed25519 over a canonical
  encoding (`src/lib/markets/oracle.ts`). Set `ORACLE_PRIVATE_KEY_PEM`
  (PKCS8) in production; without it a per-process dev key is used and the
  response says `keySource: "ephemeral-dev"`. Any conditional-token market
  can designate this endpoint as its resolution source. Getting listed
  venues (Polymarket/UMA, Kalshi/CFTC) to consume it is business
  development, not code — the endpoint assumes nobody's cooperation.
- **External market mapping**: `ExternalMarketLink` +
  `/api/v1/market/external-links`, and `scripts/sync-external-markets.ts`
  fetches external market state (Kalshi public API), files settlement facts
  as **suggestions** (explicit acceptance required), and prints hedge
  candidates. **The integration rule:** every external hook is a one-way
  export. External prices, volume, and order books never pipe back into any
  score.

## Play-money account model

Users are `User` rows keyed by username (auto-created on first trade,
$10,000 starting balance). No auth on market endpoints while the mechanics
are proven — the same trust level as the rest of the play-money platform.
KYC and device fingerprinting are real-money-phase work and deliberately
absent.

## Open questions (still open)

1. LMSR subsidy funding beyond fees, if maker losses outrun them.
2. Fee structure for a real-money phase.
3. Dispute protocol if a trader claims the engine miscalculated: the
   audit-and-rerun path exists (`recomputeFromArchive`), but the human
   process around it needs specification before any real-money phase.
4. Mobile-first vs desktop-first UI.
5. Divergence display design — the number ships on `/markets` and the
   contract page; proper visualization still needs mockups.

## File map

| Concern | Where |
|---|---|
| Schema | `prisma/schema.prisma` ("Prediction Market Layer" section) |
| LMSR math | `src/lib/markets/lmsr.ts` |
| Epochs + freeze | `src/lib/markets/epoch.ts` |
| Snapshot engine | `src/lib/markets/engine.ts` |
| Forecast model | `src/lib/markets/forecast.ts` |
| Order matching | `src/lib/markets/matching.ts` |
| Trading/margin/bundles | `src/lib/markets/service.ts` |
| Settlement + monitors | `src/lib/markets/settle.ts` |
| Oracle signing | `src/lib/markets/oracle.ts` |
| API | `src/app/api/v1/market/*`, `src/app/api/v1/oracle/snapshot` |
| UI | `src/app/markets/*` |
| Jobs | `scripts/run-epoch.ts`, `scripts/sync-external-markets.ts` |
| Seeds | `prisma/seed-markets.ts` |
| Tests | `tests/unit/lib/markets/*`, `tests/integration/market-layer.test.ts` |
