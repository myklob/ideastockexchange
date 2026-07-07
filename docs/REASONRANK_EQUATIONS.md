# ReasonRank Equations (Canonical)

**This document is canonical for the math the live engine runs.** Every
equation below is implemented and tested; file references point at the
implementation. If you change an equation here, change the code, and vice
versa. Illustrative prose lives on `/how-it-works` and `/algorithms`; this is
the exact form.

## 1. The per-edge impact (the conclusion-score core)

For every argument edge (child belief → parent belief):

```
impact = sign × truth × |linkage| × importance × uniqueness × 100
```

| Term | Range | Source |
|---|---|---|
| `sign` | ±1 | +1 for `agree`, −1 for `disagree` |
| `truth` | 0–1 | the child belief's own tree score (§3) |
| `linkage` | 0–1 | the edge's linkage sub-debate (§4) |
| `importance` | 0–1 | manual weight, or derived from an importance sub-belief (§5) |
| `uniqueness` | 0–1 | 1 − max similarity to earlier same-side siblings (§6) |

Rounded to one decimal on the ×100 scale.
**Implementation:** `computeArgumentImpactScore`, `src/core/scoring/scoring-engine.ts`.
**Tests:** `tests/unit/lib/propagate-belief-scores.test.ts`.

## 2. Evidence impact

For every evidence row on a belief:

```
EVS    = ESIW × log2(ERQ + 1) × ECRS × ERP
impact = sign × EVS × |linkage| × verificationFactor × 100
```

- `ESIW` — source-independence weight by tier (T1 > T2 > T3 > T4)
- `ERQ` — replication quantity; `ERP` — replication consistency (0–1)
- `ECRS` — conclusion relevance (0–1)
- `verificationFactor` — VERIFIED 1.0, UNVERIFIED/DISPUTED 0.5, FALSIFIED 0.
  Falsified evidence is a circuit breaker: it contributes nothing, and
  propagation lowers every conclusion that leaned on it.

**Implementation:** `calculateEVS`, `computeEvidenceImpactScore`,
`VERIFICATION_FACTORS` in `src/core/scoring/scoring-engine.ts`; recomputed on
every propagation pass by `recomputeEvidenceImpacts` in
`src/lib/propagate-belief-scores.ts`. Status changes via
`PATCH /api/evidence/[id]`.

## 3. Belief truth (the recursion)

```
pro   = Σ |impact| over agree arguments  + Σ |impact| over supporting evidence
con   = Σ |impact| over disagree arguments + Σ |impact| over weakening evidence
net   = (pro − con) / (pro + con) × 100          (0 when pro + con = 0)
truth = importance-weighted pro share ∈ [0, 1]   (0.5 when unargued)
```

The recursion: each edge's `truth` term is the **child** belief's own score,
whose edges use their children's scores, down to evidence. There is no
hardcoded floor. Beliefs with no scored content stay unscored — the engine
never stamps a fake 0 over an editorial valence (Rule 6).

**Implementation:** `computeBeliefScores`,
`src/features/belief-analysis/data/fetch-belief.ts`; recursion driven by
`propagateBeliefScores` (visited-set cycle guard, upward from any change).

## 4. Linkage

```
LS = A / (A + D)          over the edge's linkage sub-debate   (0.5 when empty)
```

where `A`/`D` are the strengths of arguments that the edge does/does not
support its conclusion. Signed variant `(A − D)/(A + D)` exists for the
in-memory protocol demo — the two are intentionally distinct. Depth
attenuation `× 0.5^depth` is computed for display on linkage pages.

**Implementation:** `calculateLinkageFromArguments`, `scoreLinkageDebate`,
`applyDepthAttenuation` in `src/core/scoring/scoring-engine.ts`. Posting a
linkage argument triggers `propagateFromLinkageChange`.

## 5. Importance

```
importance = (childNet + 100) / 200   clamped to [0, 1]
```

when the edge names an importance sub-belief (`Argument.importanceBeliefId`)
— "does this matter?" is itself a scored debate. Otherwise the manual
placement-time weight is used unchanged.

**Implementation:** `deriveImportanceFromBeliefScore`,
`src/core/scoring/scoring-engine.ts`.

## 6. Uniqueness (the restatement discount)

```
uniqueness(i) = 1 − max similarity(i, j)   over earlier same-side siblings j
```

Similarity is the mechanical layer of `duplication-scoring.ts` (synonym
collapse + Jaccard; ≥ 0.85 short-circuits to 1). Oldest keeps full credit;
computed and persisted at scoring time. Belief-level readout: topic overlap
= average uniqueness (dimension 10).

**Implementation:** `siblingUniquenessFor` in
`src/lib/propagate-belief-scores.ts`; `mechanicalSimilarity`,
`uniquenessFromSimilarities` in `src/core/scoring/duplication-scoring.ts`.

## 7. The Denominator (rivals)

```
J   = (Pro − Con) / (Pro + Con)                    justification, internal
OCV = S(option) − max S(rivals)                    opportunity cost, external
```

Read-only outputs (one-way valve). Full spec: `docs/THE_DENOMINATOR.md`;
implementation `src/core/scoring/contrast-class.ts`.

## 8. Conflict-resolution pipeline

Over scored rows, all read-only:

- shared interests: cross-side statement similarity ≥ 0.5, both validities ≥ 70
  (Resolution Floor); paired validity = harmonic mean
- primary conflict pair: per side, max `linkageAccuracy × validity / 100`
  among unshared interests
- value conflicts: rank gap ≥ 2, sorted by gap
- compromise candidates: category nets `Σ EV(benefits) − Σ EV(costs)`;
  candidate when `|net| / |magnitude| ≤ 0.15` and the shifted likelihood
  stays in [0, 1]
- dispute type: factual = 2·min(S,W)/(S+W) over evidence weight;
  linkage = 1 − mean |2L − 1|; values = max gap / (n − 1); leader wins only
  with a ≥ 0.15 margin, else "mixed"

**Implementation:** `src/core/scoring/conflict-resolution.ts`.
**Tests:** `tests/unit/core/scoring/conflict-resolution.test.ts`.

## 9. The twelve score dimensions

`BeliefScores` (`src/features/belief-analysis/types.ts`), computed per
request by `computeBeliefScores`: truth (net + logical validity +
verification), linkage (mean), importance-weighted share, evidence (EVS
share), CBA likelihood, objective criteria, confidence stability, media
truth, media genre, topic overlap (uniqueness), belief equivalency, claim
strength (`raw × (1 − 0.75 × claimStrength)`).

## 10. Propagation triggers

Linkage posts, human argument posts (`POST /api/beliefs/[id]/arguments`),
agent ingestion (`/api/v1/ingest`), evidence acceptance, evidence
verification changes (`PATCH /api/evidence/[id]`), manual
`/api/beliefs/[id]/propagate` and `/api/scoring/propagate-all`, and the seed
chain's final engine pass. Ingestion itself writes no scores (audit lock);
the engine derives every number at scoring time.
