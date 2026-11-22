# Confidence Stability Scores

A truth score answers "how likely is this to be true?" A confidence score answers a different and sneakier question: **how much should anyone bet on that answer?** A score of 0.80 that rests on one unanswered assertion and a score of 0.80 that has survived years of argument from both sides look identical on the page. They are not the same animal. One is a guess wearing a lab coat; the other has been through the wringer.

This page used to be titled **Belief and Argument Stability Scores**. It proposed three numbers: a **Belief Stability Score (BSS)**, an **Evidence Stability Score (ESS)**, and a **Confidence Stability Score** that combined them, built mostly from how people behave around an argument (votes, visitors, time spent, edits) and from how much a score wobbles over time. None of those three acronyms is used by the code today. What the project built instead is described below, with the formulas and constants read straight off the source, beside the 2025 proposal it replaced. Nothing from the 2025 page has been dropped: every factor, every step and both code samples are still here, each with its real status.

Two engines carry a number in this area, and they do not agree about what it means:

| Where | Name in the code | What it measures | What it does |
|---|---|---|---|
| The published site ([`tools/static-site/`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md), which builds [the live belief pages](https://myklob.github.io/ideastockexchange/beliefs/index.html)) | `Confidence` / `conf` in [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py) | How much work stands behind a page, from seven structural components | Multiplies every row's contribution to the page above it |
| The Next.js app ([`src/core/scoring/`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts)) | `stabilityScore`, from `calculateConfidenceStabilityScore` in [`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts) | How many arguments a belief has and how one-sided their strength is | Stored and displayed; multiplies nothing |

On this page, **Confidence** means the published site's number and **Confidence Stability Score** means the Next.js app's number. Where "the site does" appears, it means the first; "the app does" means the second. Where either differs from the owner's October 2026 direction on scoring, that direction is stated too.

## The idea, as the 2025 page put it

> The **Belief Stability Score (BSS)** measures how consistent and reliable a belief's score remains over time. It reflects how a group of well-informed, reasonable users would evaluate the most important pro/con arguments to reach consensus or equilibrium.

The premise underneath is right, and the site's code says it out loud: a score means nothing until the work behind it has been done, and then means more and more as the work is done (code: the docstring at the top of [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py), which cites this very page as its source). What changed is the yardstick. The 2025 page measured that work by watching people. The site measures it by looking at the argument itself.

**Status of "over time": not built in either engine.** No engine computes how consistent a score has been across time. The site's Confidence is a snapshot of one build; the app's Confidence Stability Score reads only the current pro strength, con strength and argument count. What is recorded about the past, and what is not, is in [What "over time" means today](#what-over-time-means-today).

**Status of "a group of well-informed, reasonable users would evaluate": not built, and refused by design on the site.** There are no evaluating users in either engine. The site's own docstring describes its input as "one snapshot and no user" (code: [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py), lines 15 to 20). People take part through GitHub issue forms that add rows or record votes, and votes are shown and never scored (see [Votes: shown, never scored](#votes-shown-never-scored)). Scores come from the structure of the argument tables and from the sources the pages cite, not from what any group thinks.

The 2025 page went on:

> Even if assembling a "perfect" group is unlikely, the platform can give ordinary users the **tools and structure** to:
> - Apply conflict resolution techniques.
> - Use formal logic.
> - Conduct cost-benefit analysis.
> - Engage in evidence-based reasoning.

Each of those tools now has a real status:

| 2025 tool | Status | What exists |
|---|---|---|
| Apply conflict resolution techniques | Partly built | The site classifies a belief's disagreement as "Factual dispute", "Linkage dispute", "Values conflict" or "Mixed dispute" (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py); explained on the [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#dispute)). Every belief page carries interests, shared interests and a best-compromise table. The app has [`conflict-resolution.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/conflict-resolution.ts). See [[Automated Conflict Resolution Platform]]. |
| Use formal logic | Partly built | A pre-publish check refuses circular support, and [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) prints the structural faults the graph can show. [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) flags a possible fallacy by a published phrase list, as a question argued on the flagged claim's page; a flag moves no score. |
| Conduct cost-benefit analysis | Built | Site: `expected value = magnitude x truth` of the cost or benefit's own page, a net, a low-to-high band and a benefit-to-cost ratio ([method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba)). App: `predictedImpact x activeLikelihood` with a `0.5^(d-1)` depth attenuation ([`cba-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/cba-scoring.ts)). See [[Likelihood of Costs and Benefits]]. |
| Engage in evidence-based reasoning | Built | Eighteen evidence tiers set where a finding's truth starts ([`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py)). See [[Evidence Verification Score (EVS)]]. |

None of these four is an input to Confidence except through the rows and pages they produce.

> Many widely accepted beliefs, like the wrongness of **theft, pollution, and murder**, show high stability because consensus has already been reached.

**Status: contradicted by design in both engines.** This is the sentence the code most flatly disagrees with, and the disagreement is deliberate. Consensus earns nothing on its own. On the site, a page nobody has argued and nobody has sourced reads truth 0.50, its grounding component is 0, and its Confidence sits at or near zero, so it moves nothing above it. The engine's own words: "listing an unargued, unsourced claim is still worth precisely zero" (code: [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py), lines 47 to 49). In the app, zero arguments gives `argFactor = 0`, so a belief everyone agrees with and nobody has argued gets a Confidence Stability Score of 0 and the label "fragile".

The way to make "murder is wrong" read as established on the site is to do the work: file the cultural norm (the `norm` evidence tier, weight 0.40) or the statistic that establishes it, and argue both sides. Consensus is a reason to expect the work will go quickly, not a substitute for it. Whether a declared-consensus prior should exist is listed under [Open decisions for the owner](#open-decisions-for-the-owner).

## What runs on the published site: Confidence

**Confidence is how much a page's score has earned the right to count, a number from 0 to 1.** It is computed for every page from the same two tables the scorer reads (`page` and `edge`), and it enters the score in exactly one place: every row a page lists contributes

```
contribution = sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq
```

to the page it sits on (code: `_contrib` in [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py); the same rule is item 3 of the cross-implementation contract in [`conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py)). `Truth` and `Confidence` are the row's claim page's own numbers; `Link`, `Imp` and `Uniq` are the truth scores of the row's linkage, importance and uniqueness pages, or the labelled constants `DEFLINK = 1`, `DEFIMP = 0.5` and `DEFUNIQ = 1` where nobody has opened one. A row whose claim has no page at all gets Confidence 0 and contributes exactly 0.

Two consequences are worth stating plainly, because they are the whole point:

1. **At Confidence 0 a claim moves its parent not at all, however true it looks.** A claim with nothing behind it is a rumour, and rumours do not get a vote.
2. **Confidence never caps the page's own truth score.** The code's docstring: confidence "is deliberately NOT a cap on the truth score itself: truth stays what the arguments say it is, and confidence says how much to bet on it" (code: [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py), lines 11 to 13). A thinly argued page can read 0.95 on its own page; it just cannot push anything else around until the work behind it is done.

Think of it as a loudspeaker volume knob rather than a filter. The claim says what it says at full strength on its own page. Confidence decides how loudly that claim gets to speak in every room above it.

### The seven components

Confidence is a weighted average of seven structural measurements of a page (code: `STRUCTURAL` and `Confidence.parts` in [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py), lines 30 to 38 and 62 to 126). The weights sum to 1.00.

| Component | Weight | Formula (from the code) | The question it asks | Dropped when |
|---|---|---|---|---|
| `grounding` | 0.30 | `max(own, kids)`: `own` is the ESIW tier weight of the page's own declared evidence type (0 when none); `kids` is the mean Confidence of the pages argued or cited beneath it | Is this claim actually established, by the world or by the claims beneath it? | Never |
| `two_sided` | 0.20 | 1.0 if both sides have at least one argument or evidence row; 0.35 if only one side does; 0.0 if neither | Has anyone argued the other side at all? | The page is an importance page (it has no sides by design) |
| `scrutiny` | 0.20 | Share of multiplier slots that name a page of their own: `link`, `imp`, `uniq` on every argument, evidence and prediction row, plus the bearing slot (`addresses`) on an importance page's interest listings | Are the multipliers argued, or resting on their starting constants? | Never (reads 0 with no slots) |
| `breadth` | 0.15 | `saturate(rows + predictions, 6)` | How much has been brought to bear? | Never |
| `depth` | 0.05 | `saturate(d, 3)`, where `d` is the longest chain of argument rows below the page | How far down does the tree go? | Never |
| `sourcing` | 0.05 | Mean over evidence rows of `0.5 x (cites a source string) + 0.5 x (the cited page names its evidence type)` | Do the findings cite a source and say what kind of source it is? | The page has no evidence rows |
| `testability` | 0.05 | Share of predictions that are dated and have a linkage page | Are the predictions diagnostic and dated? | The page has no predictions |

The saturating curve is `saturate(n, half) = n / (n + half)`, which is 0 at `n = 0`, exactly 0.5 at `n = half`, and creeps toward 1 without ever reaching it. Its docstring says why it exists: it "keeps volume from ever dominating reasoning quality". Six rows get you half of breadth; sixty get you 91 percent of it. A page cannot shout its way to confidence by listing.

Components that do not apply to a page are dropped and the remaining weights renormalised:

```
confidence = sum(weight_k x value_k) / sum(weight_k)     over the components that apply
```

so no page is punished for a signal its shape cannot carry (code: lines 119 to 121). An importance page, which lists interests rather than arguing two columns, is scored on the other six; a page with no predictions is not marked down for failing to date them. The test `test_an_importance_page_can_reach_full_scrutiny` in [`test_engines.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py) pins the importance-page case.

Three details a careful reader will want:

- **Grounding is recursive, and that recursion is what makes the measure honest.** A tree of bare assertions scores near zero however many rows it lists, because each assertion's own grounding is near zero, and so is the average of them. Either the world backs a claim (its own source tier) or the claims beneath it are themselves established. A claim needs one of the two, not both, so grounding takes whichever is larger.
- **Confidence never reads a truth score.** Testability counts whether a prediction's linkage page *exists*, not what it scores, so confidence cannot recurse through the scorer and the two numbers stay independent (code comment at line 115).
- **Cycles are handled without lying.** If a cycle has to be cut while computing a page, the result depends on which page in the loop was asked first, so it is recomputed every time and never cached; `test_confidence_does_not_depend_on_which_page_is_asked_first` pins that.

### Bands

The site names four bands, highest floor first (code: `BANDS` and `Confidence.label`, lines 48 and 152 to 155):

| Confidence | Band on the site |
|---|---|
| 0.75 or more | established |
| 0.45 to under 0.75 | developing |
| 0.15 to under 0.45 | early |
| under 0.15 | unstarted |

The app uses a different table with different labels for its different number; both are in [The app's Confidence Stability Score](#the-apps-confidence-stability-score).

### Where a reader sees it

Every belief and claim page prints its Confidence with its two weakest components on the heading readout, in the form "Confidence 67%. Weakest parts: depth 25% · grounding 36%" (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py); that example is the belief worked through below, computed on the current tables). Every row in the Argument Trees and the Evidence Ledger carries a Confidence column, as the [[Template: Belief Analysis]] lays out. A section headed **Not filled in yet** lists the parts of the template nobody has filled in, "each one a reason the confidence above is not higher". The [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#confidence) prints the seven weights and the range of Confidence across the whole corpus on every build.

## A worked example: one finding, one belief

Take the belief **[Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html)**, filed under the topic [Public office and private gain](https://myklob.github.io/ideastockexchange/beliefs/t/public-office-private-gain.html). The numbers below are a calculation run on the content tables as they stand at commit `782de88` (17 October 2026); the live site may lag by one build.

### The finding: 131 federal judges

One of the belief's reasons to agree is the finding **[131 federal judges heard 685 cases involving companies in which they or their families held stock, over 2010 to 2018](https://myklob.github.io/ideastockexchange/beliefs/p/131-federal-judges-heard.html)**. Its page declares the evidence type `statistics` (ESIW 0.90), so its truth starts at `0.5 + 0.5 x 0.90 x (2 x 100/100 - 1) = 0.95` (formula: `prior` in [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py)). Its Confidence:

| Component | Value | Why | Weight | Weight x value |
|---|---|---|---|---|
| grounding | 0.90 | Its own tier, `statistics` | 0.30 | 0.270 |
| two_sided | 1.00 | It has rows on both sides | 0.20 | 0.200 |
| scrutiny | 0.00 | None of its rows' multipliers has a page of its own | 0.20 | 0.000 |
| breadth | 0.333 | 3 rows: `3 / (3 + 6)` | 0.15 | 0.050 |
| depth | 0.00 | No argument chain below it | 0.05 | 0.000 |
| sourcing | n/a | No evidence rows of its own | (dropped) | |
| testability | n/a | No predictions | (dropped) | |
| **Total** | | | **0.90** | **0.520** |

`Confidence = 0.520 / 0.90 = 0.578`. On the belief page the row reads `Link = 0.50` (its linkage page exists and reads 0.50), `Imp = 0.50` (its importance page reads 0.50) and `Uniq = 1` (no uniqueness page, so `DEFUNIQ`). The row contributes

```
+1 x (2 x 0.95 - 1) x 0.578 x 0.50 x 0.50 x 1 = 0.130
```

to the belief. With its Confidence at 1, the same row would pass `0.225`. The gap, 0.095, is what finishing the work behind that finding is worth to this belief; the sensitivity sweep reports exactly that kind of gap as "Moves it if settled" beside "Moves it now" (see [Mechanisms the 2025 page never mentioned](#mechanisms-the-2025-page-never-mentioned)).

Its neighbour in the Evidence Ledger, **[78 members of the 117th Congress violated the STOCK Act's disclosure deadlines](https://myklob.github.io/ideastockexchange/beliefs/p/78-members-117th-congress.html)**, is the same kind of finding with two rows instead of three, so breadth reads `2/8 = 0.25` and Confidence `0.564`. One fewer row costs 0.014 of Confidence. Volume counts, a little, and saturates fast.

A cautionary neighbour: **[Trades placed before legislative events earned abnormal returns of about 3 to 5 percent over 2014 to 2021](https://myklob.github.io/ideastockexchange/beliefs/p/trades-placed-before-legislative.html)** is an observational study (ESIW 0.75) that declares two replications splitting 50/50 (`ERQ = 2`, `ERP = 50`). A contested literature establishes nothing, so it starts at exactly 0.50 and contributes 0, even with Confidence 0.514. Confidence says the work has been done; the work found a coin flip. The row's `stake`, the share of its weight still undecided (`stake = Conf x Link x Imp x Uniq x (1 - |2 x Truth - 1|)`, code: `Corpus.row` in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)), is 0.129, the largest in that ledger: the most valuable question left on the page is the one where the evidence disagrees with itself.

### What a statistic alone is worth

A claim page that cites a published statistic and has nothing else around it (no rows, no multipliers, no predictions) carries grounding 0.90 and zeros elsewhere, with sourcing and testability dropped: `0.30 x 0.90 / 0.90 = 0.30`. That is the ceiling for a lone source: **one third of its tier weight**. The corpus has such pages (for example [In the 2024 regular season, nationally televised Indiana Fever games averaged 1.18 million viewers while all other WNBA national telecasts averaged 394,000](https://myklob.github.io/ideastockexchange/beliefs/p/2024-regular-season-nationally.html), at truth 0.95 and Confidence 0.30). Finding the number is real work and it earns real Confidence; it does not earn the right to speak at full volume until someone has also argued the other side and the multipliers.

### The belief itself

The belief has 5 reasons to agree, 6 to disagree, 5 findings for, 2 against, and 6 predictions: 24 rows and predictions in all.

| Component | Value | Why | Weight | Weight x value |
|---|---|---|---|---|
| grounding | 0.3625 | No evidence type of its own (0), so the mean Confidence of the 18 pages argued and cited beneath it | 0.30 | 0.109 |
| two_sided | 1.00 | Both sides argued | 0.20 | 0.200 |
| scrutiny | 0.6528 | 47 of its 72 link, importance and uniqueness slots name a page | 0.20 | 0.131 |
| breadth | 0.80 | `24 / (24 + 6)` | 0.15 | 0.120 |
| depth | 0.25 | Its reasons have no argued reasons of their own: `1 / (1 + 3)` | 0.05 | 0.013 |
| sourcing | 1.00 | All 7 findings cite a source and name its type | 0.05 | 0.050 |
| testability | 1.00 | All 6 predictions are dated and have a linkage page | 0.05 | 0.050 |
| **Total** | | | **1.00** | **0.672** |

Confidence 0.672: **developing**, and as it happens the highest Confidence of any page in the corpus. Its two weakest parts are depth (0.25) and grounding (0.36). The grounding is low because the eleven reasons beneath it are each an argued page with three unsourced rows and no argued multipliers, which works out at `(0.20 x 1.0 + 0.15 x 0.333) / 0.90 = 0.278` apiece, and one objection has no rows at all and reads 0.

Meanwhile its truth score reads 0.50. It argues to 0.61, and is held at 0.50 by the weakest of its load-bearing components, none of which cites anything yet. That is the clearest picture of the two numbers doing different jobs: **the work behind this page is the most complete in the corpus, and the work has not yet settled the question.** A page can be well-built and undecided. That is not a contradiction; it is a finding.

### The corpus as a whole

Across all 4,263 pages (calculation, same tables): Confidence runs from 0.00 to 0.67 with a mean of 0.045. 3,621 pages are unstarted, 618 early, 24 developing, and none is established. The 196 beliefs average 0.34: 189 early, 4 developing, 3 unstarted. Claim pages average 0.03. Nobody should read that as failure. It is a ledger of where the work is, and the "What to argue next" queue described below is ordered by exactly that.

## The app's Confidence Stability Score

The Next.js app computes a different number under the 2025 page's name (code: `calculateConfidenceStabilityScore` in [`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts), lines 486 to 540):

```
argFactor      = min(1, argumentCount / 10)                        # STABILITY_ARG_THRESHOLD = 10
dominanceRatio = |proStrength - conStrength| / (proStrength + conStrength)    # 0 when there are no arguments
stabilityScore = clamp01(argFactor x (0.4 + 0.6 x dominanceRatio))
```

`proStrength` and `conStrength` are the sums of `|impactScore|` over the belief's agree and disagree arguments, and `argumentCount` is both sides together (code: lines 870 to 879). The 0.4 floor is there so "a perfectly balanced but heavily argued belief" does not score 0, per the code comment. Bands (code: lines 527 to 531):

| stabilityScore | Status in the app |
|---|---|
| 0.75 or more | robust |
| 0.50 to under 0.75 | established |
| 0.25 to under 0.50 | developing |
| under 0.25 | fragile |

Some readings, by calculation from that formula:

| Arguments | Strength split | stabilityScore | Status |
|---|---|---|---|
| 0 | none | 0.00 | fragile |
| 4 | all pro | 0.40 | developing |
| 5 | all pro | 0.50 | established |
| 10 | evenly balanced | 0.40 | developing |
| 10 | pro three times con | 0.70 | established |
| 10 | all pro, no objection filed | 1.00 | robust |
| 20 | evenly balanced | 0.40 | developing |

Read the sixth row twice. Ten unanswered reasons and not one objection earns the app's top mark, "robust". On the site, the same page would score `two_sided = 0.35`, because nobody has argued the other side. The two engines disagree about whether one-sidedness is strength or a warning light. The site's view is the owner's older one, from this page's own factor list: the number of reasons *for each side* matters.

Where the app's number goes:

- **Stored** as `Belief.stabilityScore Float @default(0.5)` ([`prisma/schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma), line 193). A belief nobody has scored reads 0.5 from the default, which is not what the formula gives for zero arguments (0).
- **Recomputed** by [`propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts) whenever a child belief changes, and logged as `stabilityBefore` and `stabilityAfter` on a `BeliefScoreEvent` when it moves by more than `SCORE_EVENT_EPSILON = 1e-6`.
- **Displayed** as the "Confidence stability" row of the belief page's scorecard ([`ScorecardSection.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/ScorecardSection.tsx), line 92), with no link because there is no `/algorithms/confidence-stability` explainer, and returned as `confidence_stability` by [`/api/scoring`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/scoring/route.ts).
- **Played with.** The `/battlefield` game turns it into a unit's hit points, `HP = stabilityScore x 100` ([`battlefield.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/battlefield.ts)), and the `/arena` game into a tank's health, `maxHealth = 60 + stabilityScore x 100 + min(agreeArguments, 30) x 2` ([`arena-tank.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/arena-tank.ts)). The 2025 page never imagined its score as armour, but "how much damage the belief can absorb" is not a bad gloss.
- **Multiplies nothing.** No score in the app reads it, and no vitest pins its constants (0.4, 0.6, 10, and the 0.75 / 0.50 / 0.25 bands); [`all-scores.test.ts`](https://github.com/myklob/ideastockexchange/blob/master/tests/unit/core/scoring/all-scores.test.ts) never mentions stability.

**A promise the app's belief page makes and does not keep.** The page prints a per-row "Confidence" column, defined in [`types.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/types.ts) as "how much of the work behind the argument's own page has been done", and a scorecard line saying a row counts `sign x (2 x Truth - 1) x Confidence x Linkage x Importance x Uniqueness`. That is the site's rule. No TypeScript function computes a per-row confidence or multiplies by one: `confidenceScore` is never populated, so the column renders blank (which Rule 6 of the belief page rules requires for a score that is not real yet), and the scorecard sentence describes the published site, not the app's own arithmetic.

## A third thing called stability: confidence intervals

The word "stability" turns up once more in the app, attached to something else again (code: [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)).

- **Protocol beliefs** carry a confidence interval: `CI = clamp(0.02, 0.2, 0.15 x max(0.3, 1 - totalArgs x 0.03) x (1 - argBalance x 0.5))`, where `argBalance = |proRank - conRank| / totalRank`. Volatility is "high" above 0.12, "medium" above 0.06, otherwise "low"; status is "calibrated" with 4 or more arguments and a CI under 0.08, "contested" with 2 or more and a CI of 0.08 or more, otherwise "emerging". The dashboard's [`ConfidenceMeter.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/epistemology/components/ConfidenceMeter.tsx) labels low, medium and high volatility "High Stability", "Moderate Stability" and "Low Stability".
- **Likelihood beliefs** (`calculateLikelihoodCI`) carry `CI = min(0.3, max(0.02, stdDev(estimate probabilities) x max(0.5, 1 - totalArgs x 0.03)))`, and 0.15 when there is only one estimate. It is documented in [`docs/ALGORITHMS.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/ALGORITHMS.md).

That `stdDev` is the **only standard deviation in the whole codebase**, and it is taken across competing estimates at one moment, not across time. The 2025 page's "standard deviation of argument scores over time" exists nowhere.

## The 2025 factor list, each with its status

The 2025 page listed eight things to track "to compute the ESS and BSS for each pro/con sub-argument". The site's [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py) keeps the behavioural ones in a list of its own, word for word:

```python
BEHAVIOURAL = ['up and down votes', 'weekly visitors', 'dwell time', 'edit frequency',
               'duplicate submission attempts', 'evaluation responses', 'score variance over time']
```

Every one of the seven carries **weight zero** and is reported as "no data" rather than scored as zero, "so a page is never punished for a signal the format cannot carry". The docstring then leaves the door open: "Wire them up and they take weight from the structural components, which is the migration the wiki describes." The [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun) lists them in its table of rules the site does not run as "Behavioural confidence signals (votes, visitors, dwell time and four more)": weight zero; votes are shown and never scored.

| # | 2025 factor | Status | What the code does instead |
|---|---|---|---|
| 1 | **Number of reasons** for each side | Built, as presence and breadth rather than a ratio | Site: `two_sided` (1.0 both sides, 0.35 one, 0.0 none) and `breadth = n / (n + 6)` over all rows and predictions. App: `argFactor = min(1, args / 10)` over both sides together, with the split entering only through `dominanceRatio`. No engine uses a count ratio. |
| 2 | **Duplicate submission attempts** (users trying to add arguments already submitted and evaluated) | Detected, recorded as a vote, weight zero in Confidence | The propose form checks what is typed against `data/claims_index.json` in the browser ([`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js)), and [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) repeats the check with [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py). At or above `MERGE = 0.70` the submission "is the existing claim and is counted as the submitter's vote for it"; between `FLAG = 0.45` and `MERGE` the maintainer is shown the near matches. The vote never moves a score. |
| 3 | **Evaluation responses** to nine questions | No survey exists; three questions became argued pages | See the table just below. |
| 4 | **Up/down vote counts** and ratios | Recorded and shown; refused as a score input by design | See [Votes: shown, never scored](#votes-shown-never-scored). |
| 5 | **Weekly visitors** | Refused by design | The site has no server and records no traffic. The app's engagement firewall test bans `viewCount`, `views` and `impressions` from scoring modules. |
| 6 | **Google PageRank** for related searches | Replaced by the project's own PageRank | Nothing reads Google, and Google retired the public metric. [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py) runs a damped walk over the argument graph (`DAMPING = 0.85`, `TOLERANCE = 1e-12`, at most `ITERATIONS = 2000`) starting evenly at the beliefs and stepping along rows in proportion to `capacity = Link x Imp x Uniq`. The site: "Nobody's votes or views are counted here, so this says how much rests on a claim, not how many people like it." See [[ReasonRank]]. |
| 7 | **Time spent** reading/referencing the debate | Refused by design | The site's Most argued list: "Hours spent arguing are not recorded anywhere, so they are not counted; the count of reasons is the part that can be checked." The firewall bans `watchTime` and `readerEngagement`. |
| 8 | **Engagement frequency** (argument edits, additions, challenges) | Reported, not scored | [`changes.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/changes.py) lists rows added, removed and changed since the previous revision, column by column; rows carry `added_by` and `added` for attribution. No frequency over more than one revision is computed. |

The nine evaluation questions, each with its status:

| 2025 question | Status | Where it went |
|---|---|---|
| Is it **true** (factually correct)? | Replaced by an argued page | The claim's own truth score: its own page, argued with its own reasons and evidence. See [[Truth Score]]. |
| Is it **logically sound** (premises support conclusion)? | Partly replaced | The Logical Anatomy section caps a page's truth at its weakest load-bearing component; the pre-publish cycle check refuses circular support. |
| Is it **clear and concise**? | Not built | No counterpart. The site does print the shortest equivalent wording of a claim (`Corpus.brief`), which is a related idea, not a rating. |
| Is it **relevant**? | Replaced by an argued page | The row's linkage page. See [[Linkage Scores]] and [[Evidence to Conclusion Relevance Score]]. |
| Is it **coherent** with related arguments? | Not built | No counterpart. |
| Is it **consistent** with other accepted arguments? | Not built | No counterpart. |
| Is it **complete**? | Built at the belief level only | `publish.CORE_BAR` marks a belief complete (reasons both ways, evidence, objective criteria, predictions or a falsifiability test, costs and benefits, interests) or a draft that says what it still needs. |
| Is it **persuasive**? | Not built | A search for "persuasive" in `src/` and `tools/` finds nothing. |
| Is the tone **respectful and appropriate**? | Not built | A search for "respectful" finds nothing. |

Importance and uniqueness, which the 2025 list never named, are argued pages too: the `Imp` and `Uniq` multipliers on every row.

## Votes: shown, never scored

Votes are the 2025 page's biggest input and the code's firmest refusal, so the rule gets stated in full.

- **What is recorded.** Anyone with a GitHub account can vote agree or disagree on a claim through a prefilled issue form. Votes land in `content/votes.csv`, one row per page key, (optional) `on` page and GitHub login; only that account's latest vote counts. A vote with `on` set is a vote on whether a reason or finding *bears on* the page it is filed on, counted apart from votes on whether it is true. As of this writing the file holds two votes, both from the owner, both "agree".
- **What is shown.** The counts sit on the claim's heading line after the truth score. A home card ranks the gap between the vote share and the truth score, once three or more people have voted on a claim (`MIN_VOTERS = 3` in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)); fewer votes are shown on the page but rank nothing.
- **What it never does.** Move a number. Every reply `intake.py` posts on a vote or a proposal carries the sentence `NO_MOVE = 'A vote never moves a score; the page shows it next to what the analysis says, as what people think.'` ([`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py)). The test class `TestVotesAreShownAndNeverCounted` in [`test_render.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_render.py) builds the corpus with and without the votes table and fails if any truth score differs.
- **The app's firewall.** [`engagement-firewall.test.ts`](https://github.com/myklob/ideastockexchange/blob/master/tests/unit/core/engagement-firewall.test.ts) fails the build if any file under `src/core/scoring` mentions `viewCount`, `views`, `likes`, `upvotes`, `downvotes`, `reactions`, `followers`, `trending`, `popularity`, `impressions`, `watchTime`, `readerEngagement`, `socialShares`, `crowdConsensus`, `replyCount` or `karma`. Its header calls this "the founding claim of the scoring engine: engagement appears NOWHERE in the calculation. A claim that goes viral gains nothing; a claim that survives scrutiny gains everything." The 2025 sample code below would fail it on the words `up_votes` and `down_votes`.
- **Retired.** The only vote-weighted formula in the repository is archived and unwired: an old server's ReasonRank used `voteScore = 1 / (1 + exp(-netVotes / 10))` at weight 0.15 (`_archive/src-experimental-server/services/reasonRank.ts`).

The owner's direction (October 2026) agrees with the refusal and sharpens it: votes may decide what is promoted and given attention, never what is valid, and the gap between what is popular and what stands up to analysis is worth showing because it says where people need more time with the argument. The site already does exactly that. One small case in the app sits on the attention side of the line: Decision Leverage counts linkage votes as a measure of how much a link has been debated (`1 / sqrt(1 + votes)`), which changes which edge is ranked as the next question, not any score.

## What "over time" means today

The 2025 page defined stability as consistency over time. Here is everything the code records about time, and what it does with it.

| Record | Engine | What it keeps | Turned into a stability number? |
|---|---|---|---|
| [`changes.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/changes.py) `since(content_dir, corpus, rev='HEAD~1')` | Site | Rows added, removed and changed since the previous git revision, column by column; and `score_moves`: `truth_before`, `truth_after`, `delta`, `conf_before`, `conf_after`, `conf_delta` and `crossed` (whether the truth score changed sides of 0.50) for every page that moved more than `1e-9`, sorted by the size of the move. It returns nothing rather than a wrong page when git or the previous revision is unavailable. | No. One revision back only, printed on the site's changes page and a home card. |
| `BeliefScoreEvent` ([`schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma)) | App | `scoreBefore`, `scoreAfter`, `stabilityBefore`, `stabilityAfter` for every propagation that moved a score, served raw by [`/api/beliefs/[id]/history`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/beliefs/%5Bid%5D/history/route.ts) | No. |
| `score variance over time` | Site | Nothing | Listed in `BEHAVIOURAL`, weight zero. |

**Status of "standard deviation of argument scores over time": proposed, not built in either engine.** The raw material now exists on both sides (git history for the site, the event ledger for the app), so it could be built. Doing it on the site would mean an eighth component with weight taken from the other seven, which moves every published number and needs a reviewed conformance diff. That choice is listed under [Open decisions for the owner](#open-decisions-for-the-owner).

## How the 2025 page said the score is computed, step by step

| 2025 step | Status | What the code does |
|---|---|---|
| 1. Collect all interaction data. | Not built | The site's inputs are the `page` and `edge` tables (plus `topics.csv` for layout and `votes.csv` for display). There is no interaction data to collect. |
| 2. Assign **relative weights** to each measure (e.g., reasoning quality > raw vote count). | Built | Site: grounding 0.30, two_sided 0.20, scrutiny 0.20, breadth 0.15, depth 0.05, sourcing 0.05, testability 0.05, every behavioural measure 0. The code comment cites "the wiki's own ordering" for putting reasoning quality above volume. App: a fixed `0.4 + 0.6 x dominanceRatio` blend scaled by `argFactor`, with no per-measure weights. |
| 3. Compute **BSS**: stability of belief over time. | Replaced | By a snapshot: the site's Confidence (how much work has been done) and the app's Confidence Stability Score (how many arguments and how one-sided). Movement over time is reported, one revision back, by `changes.py`. |
| 3. Compute **ESS**: stability of the evidence supporting it. | Replaced | Evidence quality sets where a page's truth starts (`p0` and its weight) and enters Confidence through `grounding` and `sourcing`. On the app's belief page the Evidence Ledger instead carries retraction exposure ([`evidence-exposure.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/evidence-exposure.ts)): how many points of the published score rest on evidence whose standing is not yet established. |
| 4. Calculate **Confidence Stability Score**, using the **standard deviation** of argument scores over time. | Name kept, formula replaced | The app's `stabilityScore = clamp01(min(1, args/10) x (0.4 + 0.6 x dominanceRatio))`. No standard deviation over time exists anywhere. |
| 4. Adjust for **effort** invested (evaluations, edits, reads, etc.). | Replaced | Effort is measured structurally, as work visible in the tables (both sides argued, multipliers argued on their own pages, breadth, depth, sources cited and classified, dated predictions with linkage pages), never behaviourally. |
| 4. Weigh higher BSS/ESS more heavily. | Not built | There is no BSS, no ESS and no blend of the two. |
| 5. **Percentile rank** arguments compared to all others. | Partly built, ordinally | No percentile is computed. The site ranks pages by ReasonRank ("rank N of M", `place_of`) and by share of the walk (which sums to 1), and orders beliefs complete-first, then by belief score, rows and Confidence (`best_beliefs`). |

## Path Forward, each with its status

The 2025 page promised to keep improving the ESS and related measures by:

| 2025 promise | Status | What exists |
|---|---|---|
| Gathering **user feedback** | Collected and shown; refused as a score input | Issue forms turn feedback into rows (argued like any other) or votes (shown, never scored). |
| Tracking **algorithm performance** | Partly built, as accounting | No calibration or outcome tracking. `changes.py` reports which pages moved and which crossed 0.50; [`conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py) pins twenty-four pages' expected numbers so any port is held to the same rule, with Confidence as item 2 of the contract; the app writes a `BeliefScoreEvent` whenever a score moves. |
| New factor: quality and credibility of sources | Built (the 2025 tense is out of date) | The eighteen-tier ESIW table: `statistics` 0.90, `record` 0.90 (an addition marked as one), `rct` 0.85, `meta` 0.80, `observational` 0.75, `historical` 0.70, `expert_data` 0.65, `expert_claim` 0.60, `anecdote` 0.55, `logic` 0.50, `analogy` 0.45, `norm` 0.40, `intuition` 0.35, `news` 0.30, `survey` 0.25, `eyewitness` 0.20, `visual` 0.15, `artifact` 0.10, and 0.0 for no source named. It sets `p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)` with weight `k x 2n / (n + 1)` (capped at `REP_CAP = 2.0`), and in Confidence it is the `own` half of grounding and half of sourcing. It is deliberately not a multiplier on the row, because source quality belongs to the claim, not to where the claim is cited. |
| New factor: level of expert agreement | Partly built | `ERP`, the share of independent replications that agreed (clamped to 0 to 100, default 100), decides which way the starting point is pushed. Half agreement starts at 0.50 whatever the tier. It is agreement among replications, not among experts. |
| New factor: degree of evidence scrutiny | Partly built | The site's `scrutiny` component measures whether a row's multipliers are argued, not whether the finding itself has been examined. Decision Leverage's `examination` gap, `1 / sqrt(1 + min(support, opposition))` over sub-arguments plus evidence rows (1 when nothing is attached), is the app's nearest thing. |
| New factor: number and recency of citations | Number built; recency not built | Number: `ERQ` feeds `replication(n) = 2n / (n + 1)` (1 gives 1.00, 2 gives 1.33, 3 gives 1.50, 10 gives 1.82, limit 2.00), and rows feed `breadth`. Recency: nothing reads a date for scoring; the `checked` and `added` columns are display only. |

> The goal: **A reliable, transparent, user-friendly stability metric** for individuals and groups engaged in debates.

**Status: built for transparency; the two engines disagree on the metric.** The site prints Confidence with its two weakest parts on every page and every weight on the method page; the app prints a scorecard row with its status. As shown above, a score of 0.50 is "established" in the app and "developing" on the site, the site has no "robust" or "fragile", and the app has no "early" or "unstarted".

## Why this matters: the three promises and what serves them

> The **Confidence Stability Score** helps:
> - **Highlight well-established beliefs** with stable evidence.
> - **Focus attention on unresolved issues**.
> - **Promote reasoned debate** by showing where consensus exists, and where more scrutiny is needed.

| Promise | Status | What serves it |
|---|---|---|
| Highlight well-established beliefs | Built | The site labels Confidence of 0.75 or more "established" and lists Best beliefs with complete beliefs (meeting `publish.CORE_BAR`) first and drafts marked; the app labels a stabilityScore of 0.75 or more "robust". |
| Focus attention on unresolved issues | Built, three ways | (1) The site's What to argue next queue (each ranking is explained on the [lists page](https://myklob.github.io/ideastockexchange/beliefs/lists.html)) ranks pages by `work = ReasonRank x (1 - Confidence)`, beliefs left out because "work on the conclusion is not a work plan". (2) The sensitivity sweep reports what each input could do now and what it could do once settled. (3) The app's Decision Leverage and its [`/leverage`](https://github.com/myklob/ideastockexchange/blob/master/src/app/leverage/page.tsx) work queue. All three are described below. |
| Promote reasoned debate by showing where consensus exists and where more scrutiny is needed | Built | Every site page prints a sensitivity headline naming what its conclusion rests on, its Confidence with the two weakest parts, and the Not filled in yet list. The app's page names each edge's widest gap ("Needs evidence", "Linkage undebated", "Sub-debate unscored", "No opposition yet") and the Evidence Ledger's retraction exposure. |

## Mechanisms the 2025 page never mentioned

These are implemented, sit squarely in this page's territory, and appear nowhere in the 2025 text.

**The two sensitivity sweeps** (code: [`sensitivity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py); [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity)). For every input up to `DEPTH = 6` levels below a page, the engine holds that input's truth at 0 and then at 1 and recomputes the whole graph. It does this twice: once with Confidence as it is ("Moves it now", what would happen today if someone settled that claim) and once with that input's Confidence pinned at 1 ("Moves it if settled", what the input would be worth with its work finished). In the code's words, "the gap between them is the value of doing the work." The flip point, where the conclusion crosses `FLIP = 0.5`, is found by bisection (`STEPS = 16`, about 1.5e-5) rather than algebra, so there is no second implementation of the rule to drift; an input that moves the page by less than `INERT = 0.005` is called inert. Verdicts read "decides it alone", "breaks it alone", "carries it alone", "moves it", "worth settling" or "inert". The test `test_settling_an_input_can_only_widen_what_it_can_do` pins the direction: Confidence gates a row down, never up. This is the cleanest answer to the 2025 page's real question. Stability is not how much a score has wobbled; it is how far one input would have to move before the conclusion flips.

**The work queue** (code: `work_queue` in [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py); [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank)). `work(page) = ReasonRank x (1 - Confidence)`. ReasonRank deliberately leaves both truth and Confidence out of the walk (`test_rank_ignores_confidence_entirely`), "because a page nobody has started is exactly what the ranking exists to find." High rank with the work done is a settled foundation; high rank with the work undone, per the method page, "is the next week an analyst should spend."

**Decision Leverage, the app's counterpart** (code: [`decision-leverage.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts)). It ranks a belief's argument edges by the conclusion score still at stake on each:

```
weight    = |linkage| x importance x uniqueness x 0.5^depth
openRange = 0.40 x (1 - grounding) + 0.25 x 1/sqrt(1 + linkageVotes) + 0.15 x [argument unscored] + 0.20 x examination
leverage  = weight x openRange x 100
```

An edge is load-bearing at `weight >= 0.35` (`LOAD_BEARING_WEIGHT`), open at `openRange >= 0.40` (`OPEN_RANGE_THRESHOLD`), negligible below 0.5 points (`NEGLIGIBLE_LEVERAGE`), and a belief is fragile when one edge carries 0.5 or more of its total (`FRAGILE_CONCENTRATION`); classes are crux, load-bearing, open-minor and settled-minor. `openRange` plays the role that `1 - Confidence` plays on the site.

**The stake readout.** Every site row carries `stake = Conf x Link x Imp x Uniq x (1 - |2 x Truth - 1|)`, the weight it could still swing. Confidence gates it too, so a row whose page has no work behind it shows no stake at all; that is why the sensitivity sweep reports "if settled" beside "now".

**Confidence from two flat tables.** `TableCorpus` in [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py) presents bare `page` and `edge` rows in the shape the scorer reads, so a SQL or PHP port computes Confidence with "one implementation of the rule rather than two that can drift."

**The owner's starting rule drops the gate.** [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) prints a second strength on every belief page, "Counting every reason until it is argued down", and it deliberately drops both the `(2 x Truth - 1)` term and "the confidence gate that zeroes a row whose own page has no work behind it". See the next section.

## The owner's direction, and where today's code differs from it

The owner answered the scoring questions in October 2026 (recorded in the repository's `CLAUDE.md` and at the top of [`docs/WIKI_AUDIT.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/WIKI_AUDIT.md)). The goal is a score that promotes good ideas and demotes bad ones in the real world; whatever rule does that best wins, and a new rule is published beside the current one and compared on real pages rather than swapped in unseen.

- **Volume.** Direction: start from the quantity of truly independent reasons to agree and disagree, rank how valid they are, and let pro against con decide; contributions count from the moment they are posted and are argued down from there, because a rule under which work counts for nothing until someone proves it tells contributors their effort is wasted. For choices of action, weigh costs and benefits across every stakeholder with a legitimate interest. **Where Confidence differs:** it is the gate that makes a freshly posted reason count for nothing. A new claim page has Confidence near 0, so its row passes near 0 however strong it is. `tally.py` is the owner's rule with that gate removed, printed beside the argued truth score and read by no other number. The argued rule, Confidence included, is unchanged until the two have been compared.
- **Votes.** Direction: votes decide attention, never validity; track popular apart from what holds up. **Matches:** see [Votes: shown, never scored](#votes-shown-never-scored).
- **Fallacies.** Direction: software may flag, nothing is final, and a flag is a claim argued like any other that moves no score alone. **Matches:** Confidence reads no fallacy flag; [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) files the flag as a question on the claim's page.
- **Linkage.** Direction: start trusting (the site's 1), fall when argued down, rise when argued well. **Matches for linkage itself** (`DEFLINK = 1`). Note that Confidence takes the opposite starting posture to the owner's linkage rule: it starts at zero trust and rises as work is done. Its `scrutiny` component counts whether a linkage page exists, not what it says, so an argued-down link and an argued-up link earn the same scrutiny.
- **Evidence weight.** Direction: no ceiling, so a body of replicated work can outweigh opinion by 15 or 200 times. **Where Confidence differs:** grounding reads the ESIW tier, at most 0.90, and replication is capped at `REP_CAP = 2.0` in the starting-point weight. `tally.py` uses `ESIW x ERQ x ERP/100` uncapped for exactly this reason.

## The original samples

The 2025 page carried two code samples. Both are kept verbatim below (the first block's closing fence was four backticks in the original and is fixed here).

<details><summary>Original sketch (2023), not what runs</summary>

What runs instead is the structural Confidence in [`tools/static-site/confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py), read from the `page` and `edge` tables, and in the Next.js app `calculateConfidenceStabilityScore` in [`src/core/scoring/all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts).

**Example Python Snippet**

```python
import statistics

# Example pro/con data
pro_sub_args = [{"up_votes": 15, "down_votes": 5, "reasons": ["reason1", "reason2"]}]
con_sub_args = [{"up_votes": 8, "down_votes": 12, "reasons": ["reasonA"]}]

# Scores
pro_scores = [a["up_votes"] / (a["up_votes"] + a["down_votes"]) for a in pro_sub_args]
con_scores = [a["up_votes"] / (a["up_votes"] + a["down_votes"]) for a in con_sub_args]

# Standard deviations
pro_std = statistics.stdev(pro_scores) if len(pro_scores) > 1 else 0
con_std = statistics.stdev(con_scores) if len(con_scores) > 1 else 0

# Weighting
bss_weight = min(sum(len(a["reasons"]) for a in pro_sub_args) /
                 sum(len(a["reasons"]) for a in con_sub_args), 1)

ess_weight = con_std / pro_std if pro_std != 0 else 0

# Argument quantity stability
argument_quantity_stability_score = ((pro_std + con_std) * bss_weight) + ess_weight
print(argument_quantity_stability_score)
```

This sample:

* Calculates **BSS/ESS weights**.
* Computes a **stability score** factoring in both quantity and variation of reasoning.

What became of each line:

| Line in the sample | Status | What replaced it |
|---|---|---|
| `pro_scores = up_votes / (up_votes + down_votes)` | Refused by design | An argument's score is its own page's truth, `(POS + w x p0) / (POS + NEG + w)`; votes never enter. |
| `pro_std = statistics.stdev(pro_scores)` | Not built | No dispersion of argument scores is computed anywhere. |
| `bss_weight = min(pro reasons / con reasons, 1)` | Replaced | By presence, not ratio: `two_sided` (1.0 / 0.35 / 0.0) on the site, `dominanceRatio` in the app (which rises with imbalance where this weight falls). |
| `ess_weight = con_std / pro_std` | Not built | Nothing compares the spread of one side to the other. |
| `((pro_std + con_std) * bss_weight) + ess_weight` | Replaced | By a bounded 0-to-1 number in each engine. |

Three faults in the sample, found by running it: it prints `0` on its own data (one sub-argument per side, so both standard deviations are guarded to 0 and `ess_weight` is 0); it divides by zero when a belief has no con sub-arguments; and its result grows as scores vary more, so by its own definition a score that wobbles more would read as more stable.

**Data Collection Example**

We can scrape debate content to feed the algorithm:

```python
import requests
from bs4 import BeautifulSoup

def scrape_argument_data(url):
    soup = BeautifulSoup(requests.get(url).content, 'html.parser')
    upvotes = int(soup.find('span', class_='upvote-count').text)
    downvotes = int(soup.find('span', class_='downvote-count').text)
    num_reasons = len(soup.find_all('div', class_='reason'))
    return {
        "upvotes": upvotes,
        "downvotes": downvotes,
        "num_reasons": num_reasons
    }

argument_data = scrape_argument_data("https://example.com/argument")
print(argument_data)
```

**Status: not built.** The engine reads two CSV tables kept in git, `content/pages.csv` and `content/edges.csv` (plus `topics.csv` for layout and `votes.csv` for display), and the site it builds publishes the same data as JSON, XML, SQL and SQLite on the [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#data). No template has a `upvote-count`, `downvote-count` or `reason` class to scrape. The repository's one BeautifulSoup user, [`src/core/ai/scraper.py`](https://github.com/myklob/ideastockexchange/blob/master/src/core/ai/scraper.py), is an unwired collector that splits fetched pages into sentences and reads no vote counts.

</details>

## Open decisions for the owner

The audit of this page turned up eight questions that are the owner's to answer, not a session's.

1. **Which number is the Confidence Stability Score?** Options: (a) port `confidence.py` to TypeScript, fill the app's blank Confidence column from it, make it gate impact as the app's scorecard sentence already claims, and rename the current `stabilityScore` as a separate "dominance" readout; (b) keep both, rename the app's (it measures argument count and one-sidedness, not work done), and remove the unfulfilled column and sentence; (c) make the app's formula canonical and change the site, which moves every published number and the conformance contract.
2. **Do the behavioural signals stay as proposed inputs?** Options: (a) keep them listed as recorded or recordable, weight zero by design, with the firewall and the votes test as the stated reason (the current state); (b) keep them as a proposed later phase with weights to be assigned, which means removing the firewall and the votes test on purpose; (c) wire some in now. The October 2026 direction on votes points to (a) for votes.
3. **Does "over time" stay in the definition?** Options: (a) drop it and call Confidence a snapshot of work done, with `changes.py` as the errata sheet; (b) add an eighth component from git history (site) or `BeliefScoreEvent` (app), with weight taken from the seven and a conformance diff; (c) report movement over time only, as `changes.py` already does.
4. **Should broad consensus (theft, pollution, murder) read as stable without cited evidence?** Options: (a) accept the code's rule: a consensus belief is established once someone files the norm or statistic that establishes it; (b) add a declared-consensus prior, a rule change with a conformance diff; (c) keep the 2025 sentence as an aspiration marked "not how the engine behaves".
5. **Unargued importance: 0.5 or 1.0?** The site and its contract use `DEFIMP = 0.5`; the app falls back to `importanceScore ?? 1.0` in `scoring-engine.ts` and `cba-scoring.ts`. The same unargued argument counts twice as much in the app.
6. **One band table or two?** The site: established 0.75, developing 0.45, early 0.15, else unstarted. The app: robust 0.75, established 0.50, developing 0.25, else fragile.
7. **Where should the Home page's "Impact Algorithm" bullets live?** The 2025 Home page sent readers here for an Argument Importance Score and a Belief Impact Score, which this page never discussed. The rewritten [[Home]] now covers them in place: importance runs (an importance page scores `max(Validity x Bears)`; the app derives `(netScore + 100) / 200`), "how much a belief depends on an argument" is answered by the sensitivity sweep and Decision Leverage, and "Belief Impact Score" is a proposed name with no code (the cost-benefit expected value is what serves it, and "BIS" on [[Media]] means Book Importance Score). Whether to split out a page of its own is open.
8. **What happens to the 2025 sample?** Kept verbatim and labelled (the current state), or joined by a second runnable sample that calls `confidence.Confidence` over `TableCorpus`, or corrected and still labelled proposed.

## Related pages

- [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]]: the number Confidence gates.
- [[Evidence Verification Score (EVS)]]: the evidence tiers behind `grounding` and `sourcing`.
- [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]]: the walk behind the work queue, and the replacement for "Google PageRank for related searches".
- [[Linkage Scores]] and [[Evidence to Conclusion Relevance Score]]: the pages `scrutiny` counts.
- [[Argument Scores from Sub-Argument Scores]]: how a row's contribution climbs the tree.
- [[The Redundancy Problem]] and [[Equivalency Score:]]: why duplicate submissions become votes for the claim already there.
- [[Likelihood of Costs and Benefits]]: choices of action, scored by cost and benefit rather than by Confidence.
- [[Template: Belief Analysis]]: the Confidence column in the Argument Trees and the Evidence Ledger.
- On the live site: [confidence](https://myklob.github.io/ideastockexchange/beliefs/method.html#confidence), [what would change the answer](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity), [ReasonRank](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank), [the owner's counting rule](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally), [the five constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants), [rules the site does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun) and [what this cannot do](https://myklob.github.io/ideastockexchange/beliefs/method.html#limits).
