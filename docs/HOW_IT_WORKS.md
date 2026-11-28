# How the Idea Stock Exchange Works

> The reader-facing version of this document is the live route **`/how-it-works`**
> (`src/app/how-it-works/page.tsx`). This file is the developer map of the same
> claims, each tied to the code that implements it.

## The one-sentence version

One permanent, structured, evidence-ranked page per idea. Every argument is a
belief page of its own, every edge between them carries scores, the engine
computes every number recursively, and every score on a page is a doorway into
the sub-debate that produced it.

## The engine

The live conclusion-score core, per argument edge:

```
impact = sign x truth x |linkage| x importance x uniqueness x 100
```

- **Implementation:** `computeArgumentImpactScore` in
  `src/core/scoring/scoring-engine.ts`; recursive propagation in
  `src/lib/propagate-belief-scores.ts` (`propagateBeliefScores`,
  `propagateAllBeliefScores`, `propagateFromLinkageChange`).
- **truth** — the child belief's own tree score, computed from *its* arguments
  and evidence (`computeBeliefScores` in
  `src/features/belief-analysis/data/fetch-belief.ts`). Recursion with no
  hardcoded floor: `Argument` joins two `Belief` rows (`prisma/schema.prisma`).
- **linkage** — computed from the edge's own linkage sub-debate
  (`calculateLinkageFromArguments`); every linkage value links to
  `/arguments/[id]/linkage`.
- **importance** — optionally sourced from a dedicated importance sub-belief
  (`Argument.importanceBeliefId` → `deriveImportanceFromBeliefScore`), so
  "does this matter?" is itself debatable.
- **uniqueness** — computed at scoring time from each argument's similarity to
  earlier same-side siblings (`siblingUniquenessFor` +
  `src/core/scoring/duplication-scoring.ts`); restatements never double-count.
- **Propagation triggers:** linkage posts, agent ingestion
  (`/api/v1/ingest`), evidence acceptance, human argument posts
  (`/api/beliefs/[id]/arguments`), manual `/api/beliefs/[id]/propagate` and
  `/api/scoring/propagate-all`, plus the seed chain's final engine pass
  (`prisma/seed-propagate.ts`).

## Click-into-the-score

Every score cell on the belief page is a doorway (Rule 6 keeps blank cells
unlinked):

| Cell | Opens |
|---|---|
| Score | the child belief's own page (the sub-debate that produced it) |
| Link | `/arguments/[id]/linkage` — the edge's linkage debate |
| Imp | the importance sub-belief, when one sources it |
| Impact | `/arguments/[id]/score` — the factor-by-factor provenance page with a live uniqueness trace |

The Scorecard carries the twelve-dimension engine readout
(`BeliefScores` in `src/features/belief-analysis/types.ts`), each dimension
linking to its `/algorithms/*` explainer.

## The denominator

A bare net is a numerator. `src/core/scoring/contrast-class.ts` supplies the
two denominators: the justification share/margin (internal) and the
opportunity-cost value against the best rival in the contrast class
(external), rendered as the Contrast Class section. Spec:
`docs/THE_DENOMINATOR.md`.

## Conflict resolution pipeline

`src/core/scoring/conflict-resolution.ts` reads the scored trees sideways and
computes four outputs (rendered as the Pipeline readout in the Conflict
Resolution section; adapter in
`src/features/belief-analysis/lib/conflict-pipeline.ts`):

1. **Shared interests** — cross-side similarity over interest statements, both
   sides clearing the Resolution Floor (70).
2. **Primary conflict pair** — the highest validity-weighted linkage-accuracy
   unshared interest per side.
3. **Genuine value conflicts** — shared values the two sides rank far apart.
4. **Compromise candidates** — cost/benefit items where a likelihood shift
   ≤ 0.15 flips their category's net: the winnable disagreements.

CBA row likelihoods derive from each claim's own belief tree when linked
(`deriveCbaItems`) — never assigned by gut.

## Posting and speed bumps

`POST /api/beliefs/[id]/arguments` is the human add-a-row move: the reason
becomes a belief page, the edge is created unscored (the audit lock rejects
submitted score fields), and the engine propagates. On beliefs flagged
`highStakes`, the API enforces the speed bumps: acknowledge the strongest
current opposing argument (verified server-side) and affirm the moral
principle the post rests on. The form lives in the belief page's Contribute
section (`AddArgumentForm.tsx`).

## The canonical trio

`docs/BELIEF_PAGE_RULES.md` (rules) ↔ `templates/belief-analysis-template.html`
(template) ↔ `src/app/beliefs/[slug]/page.tsx` + section components (code).
Change one, update the other two.
