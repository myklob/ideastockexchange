# The Denominator: Scoring a Belief Against Its Counterclaims

*Framework spec for the ISE scoring engine. A pro-minus-con score floats free
until you divide it by something, and the right something is the rival claim.*

This document is the canonical reference for the contrast-class / opportunity-cost
layer. It is referenced by:

- `src/core/scoring/contrast-class.ts` — the engine (pure math, two layers)
- `src/features/belief-analysis/components/ContrastClassSection.tsx` — the page block
- `src/features/belief-analysis/components/ArgumentTreesSection.tsx` — the share/margin readout
- `src/features/belief-analysis/data/contrast-classes.ts` — the static option-set overlay
- `templates/belief-analysis-template.html` and `docs/BELIEF_PAGE_RULES.md`

Keep this doc, the rules doc, the template, and the page in sync.

---

## 1. The bug

A bare **Net Belief Score** of `Pro Total − Con Total` is a numerator with nothing
under the line. "+9.2 relative to what?" A pro-minus-con silently picks "do nothing"
as the denominator and never tells you. The real rival is often already sitting in
the con column disguised as a single argument. The fix is to stop hiding the
denominator and make it a structural part of the page.

## 2. Core principle

Value is never absolute. It is always *against the next thing you could have chosen* —
the economist's **opportunity cost**. The unit of scoring is the belief plus its
**contrast class**: the set of mutually exclusive claims that answer the same question
and compete for the same budget. On ISE this is the spectrum of positions on the Topic
page. One constraint makes it rigorous: **you can only divide commensurable things.**
Only rival answers to one question share a denominator.

## 3. Two layers (they stack, they do not compete)

- **Layer 1 — Justification (internal denominator).** `J(X) = (Pro − Con) / (Pro + Con)`,
  range −1..+1. How lopsided the belief is versus its own rebuttals. Doubles as the
  Rule 9 inversion trigger (negative ⇒ net-refuted). Identity: `J = 2p − 1` where
  `p = Pro / (Pro + Con)` is the implied-probability / market-share view.
  - *Cautions:* it washes out evidence volume (`[9,1]` and `[90,10]` both score +0.8 —
    report mass alongside, never folded in) and it is paddable (discount duplicates).
- **Layer 2 — Comparative / opportunity cost (external denominator).**
  `OCV(oi) = S(oi) − max_{j≠i} S(oj)`. Does the belief beat its best rival? Exactly one
  option has `OCV > 0`. Magnitude is what you give up by not choosing the best rival.

Layer 1 produces the quantity Layer 2 compares: Layer 1 runs inside each node, Layer 2
across the siblings.

### Criteria-normalized denominator
Score every option on the same objective criteria, min-max normalize each criterion
across the rivals (`n(oi,k) = (r − min)/(max − min)`), then weight by per-criterion
**importance** (which lives on the *topic*, the right home for the otherwise-blank
Importance column): `W(oi) = Σ_k importance_k · n(oi,k)`. Use `W` to *decompose* a
margin, not as a second headline.

### Argument sorting (the dedup that cleans Layer 1)
Sort every argument before scoring: **intrinsic** ("X is true on its own terms") feeds
Layer 1; **comparative** ("rival Y beats X") is pulled out of the pro/con tally and
moved to Layer 2. Left in the con column a comparative argument double-counts the rival.

## 4. Signed-score edge case

ReasonRank scores can go negative. A share `S / ΣS` is only meaningful for non-negative
inputs. **Preferred:** drop the share for signed quantities and report `OCV` (well-defined
for any reals). **If a 0–1 field view is wanted:** rank-shift `S'(o) = S(o) − min + ε`
first and state the shift so nobody mistakes it for a probability. Rule 9 (invert
negative beliefs to positive form) reinforces this — a class of positive claims mostly
avoids the signed-score problem at the top level.

## 5. Engine spec

For a topic with mutually exclusive options `O = {o1 … on}`:

1. Each `oi` carries an argument-tree score `S(oi)` from existing ReasonRank machinery.
   No new scoring primitive — the denominator is built from scores the engine produces.
2. Pairwise margin `M(oi, oj) = S(oi) − S(oj)`.
3. Opportunity-cost value `OCV(oi) = S(oi) − max_{j≠i} S(oj)` — the headline comparative score.
4. Criteria matrix `n(oi,k)` (min-max) and `W(oi) = Σ importance_k · n(oi,k)` for decomposition.
5. Field share (optional) `Price(oi) = S(oi) / Σ S(oj)` **only** when all `S ≥ 0`; otherwise
   report `OCV`, never a faked probability.

## 6. Invariant contract

All seven engine invariants hold: the 0–1 ranges are affine rescalings of real rival
scores (no tanh/clamp by fiat); `OCV`/`Price` are **outputs** that must never feed back
into any argument's `S` (one-way valve); every term under the line is itself a fully
scored, audited node, so traceability holds end to end.

## 7. What changes on a belief page

1. Add a **Contrast Class** block: the mutually exclusive option set, each rival's `S`, and OCV.
2. Promote comparative "rival is better" arguments out of the con table into the Contrast Class.
3. Relabel the headline: bare net → share + margin (Layer 1) and `OCV` vs. the named best rival (Layer 2).
4. Fill the **Importance** column from the topic's per-criterion weights.
5. Print the denominator beside every verdict: "harm > good" never stands alone; it carries its "compared to ___".

---

*Bottom line: pro-minus-con answered "do the reasons to agree win on this island,"
when the real question is "does this island beat the next island over." Put the rival
under the line.*
