# Quantifying Reason: The Power of Truth Scores

Every argument you have ever lost to someone louder than you was lost for want of a number. Not a vote. Not a like count. A number that says, for one specific claim, how far the reasons and the evidence so far have moved it away from a coin flip, and that is itself a link to the argument that produced it, so that anyone who disagrees with the number can go and argue with the row that made it.

That is the whole idea of the Idea Stock Exchange, and this page is the case for it. The sister page, [[Truth Score]], is the mechanism: every formula, every constant, every file, with its status. Read this one to see why anyone would want such a number and what it does to a debate once it exists. Read that one to see exactly how it is computed. Each page stands on its own, and nothing either page says has been dropped from the other.

**How to read the labels here.** This page began in 2025 as a short manifesto for combining a "Logical Fallacy Score" with an "Evidence Verification Score". Everything that manifesto said is still on this page, in its own words where they were specific. But the code now exists, in two engines that do not agree with each other, so every mechanism carries its real status: *runs on the published site* (the static site at myklob.github.io, built from `tools/static-site/`), *runs in the Next.js app* (the product in `src/`, which the belief page `/beliefs/[slug]` reads), *proposed, not built*, *replaced* (by a named mechanism), or *refused by design* (the code does the opposite, and says why). Every technical claim says where it comes from: the code (with its file), a calculation done for this page, or the owner's judgment.

## The original framing

The 2025 page opened like this, and the opening is kept because it is still the goal:

> Welcome to a new approach to argument evaluation, directly integrating two key metrics:
>
> 1. **Logical Fallacy Score**: Measures the relative performance of pro/con sub-arguments on whether an argument uses logical fallacies.
> 2. **Evidence Verification Score**: Measures the degree of independent corroboration for a belief (e.g., blind studies, replication rates, scenario similarity).
>
> Together, these scores strengthen our ability to tie belief strength to evidence quality, fostering more accurate, rational, and transparent discourse.

The Evidence Verification Score has its own page, [[Evidence Verification Score (EVS)]], and its name survives in the code. The Logical Fallacy Score does not: the name appears nowhere in `src/` or `tools/`, and the 2025 page pointed it at a private Google Sites draft that no longer resolves, so on this page the words are plain text. What replaced it is described under *The fallacy half* below, and it is more interesting than a score: an accusation of fallacy is itself an argument, and it has to win.

Three of the 2025 page's specifics have moved, and the rest of the page is the detail. "Blind studies" and "scenario similarity" are tiers in neither engine's evidence table (code: `ESIW` in [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py); `EVIDENCE_TYPE_WEIGHTS` in [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)); a blind study is filed as `rct`, and the nearest thing to a scenario comparison is a testable prediction, which scores through the same row formula as a reason. "Replication rates" survived as `ERQ` and `ERP`. And the two-metric composition, logical half plus evidence half, exists in exactly one place in the code, `calculateTruthScoreBreakdown` in [`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts), where the "logical" half is not a fallacy score but the pro share of argued weight.

## Why a number at all

Here is the problem a truth score solves. Put a hundred people in a room and ask whether members of Congress should be barred from trading individual stocks. You will get reasons, and you will get them in proportion to how many people are on each side and how much they like talking. Nothing in the room keeps count of whether the third reason to agree is the first reason to agree wearing a hat. Nothing checks whether the reason everyone found most moving has any evidence behind it. Nothing remembers, a year later, which reason turned out to be false. The debate is won by volume, stamina and charm, and the winner's beliefs are not one bit more likely to be true for having won.

A truth score replaces the room with a ledger. One claim per page. Every reason to agree and every reason to disagree on that page, each one a claim with a page of its own, each one carrying a relevance, an importance and a uniqueness that are themselves argued on pages of their own. Then one rule for what a row is worth, applied the same way to every row in the corpus, and a number at the top that nobody typed. On the published site that number is built from two flat tables every time the site is built (code: [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py); prose: [how every number is computed](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula)).

The rule, for every row on every page (code: `Model._contrib` in `score_reference.py`):

```
row contribution = sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq
```

and from the rows to the page:

```
truth (argued)     = (POS + w x p0) / (POS + NEG + w)
truth (published)  = min(argued, weakest load-bearing component that has its own page)
```

Two consequences fall out of that rule, and they are the reason it is the rule rather than a simpler one.

**You cannot pad a score.** A reason nobody has argued sits at `UNARG = 0.5` (code: `CONSTS` in `score_reference.py`), and `2 x 0.5 - 1 = 0`. Type in twenty reasons to agree and the page reads exactly what it read before: 0.50. The site's method page calls this the anti-padding rule and it is the single most consequential line of code in the project. A row has to be argued before it counts, and if it is argued *false* it counts against the side that filed it: ten refuted reasons to agree make a belief weaker, not stronger (code: `_split` in `score_reference.py`, which puts each row on the side its sign lands on).

**Argument alone never touches the world.** A page with no rows reads 0.50. A row pointing at a page that reads 0.50 contributes nothing. So a page whose rows all point at such pages also reads 0.50, and by induction every page of any argument graph in which nothing is cited reads exactly 0.50 forever (code: the docstring of `evidence.py`; pinned by [`test_engines.py::test_argument_alone_can_never_leave_the_neutral_point`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py) for unsourced chains of 2, 5 and 40 pages). The way out is evidence: a page that declares what kind of source backs it, how many replications exist and how many agreed starts above or below 0.50 by the prior `p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)` with weight `w = k x 2n/(n + 1)`, `REP_CAP = 2.0` (code: `prior` and `replication` in `evidence.py`). A page that declares nothing starts at `(0.5, k)` exactly as before.

Calculation, to watch it move. A belief lists one reason to agree whose own page has been argued to 0.80, with confidence 1 and no linkage, importance or uniqueness page (so `Link = DEFLINK = 1`, `Imp = DEFIMP = 0.5`, `Uniq = DEFUNIQ = 1`). The row contributes `(2 x 0.80 - 1) x 1 x 1 x 0.5 x 1 = 0.30`, and the belief, citing nothing, reads `(0.30 + 0.5) / (0.30 + 1) = 0.615`. The same reason argued down to 0.20 contributes `-0.30` and the belief reads `0.5 / 1.30 = 0.385`. The same reason unargued contributes `0` and the belief reads 0.50. Now give the belief one published statistic (ESIW 0.90) that its one replication confirmed (ERQ 1, ERP 100): `p0 = 0.95`, `w = 1`, and with the argued reason the belief reads `(0.30 + 0.95) / (0.30 + 1) = 0.96`. One good source and one argued reason did what twenty unargued reasons could not.

A page to see all of this on: [Barring members of Congress and the president from owning or trading individual stocks](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html), under the topic [Government ethics](https://myklob.github.io/ideastockexchange/beliefs/t/government-ethics.html). Every number on it is a link to the page that argues it.

### The owner's direction, and the rule printed beside the score

The anti-padding rule has a cost, and the owner has named it. A rule under which a reason counts for nothing until somebody does the work of proving it tells contributors their effort is wasted. The owner's direction (October 2026) is that for belief strength you start from the quantity of truly independent reasons to agree and disagree, rank how valid they are against each other, and let the weight of pro against con decide; that a contribution counts from the moment it is posted and is argued down from there; and that evidence should be able to outweigh opinion without a ceiling, by 15 or 200 times if the replicated work is there. For choices of action the question is different: costs and benefits across every stakeholder with a legitimate interest, the quantity and the quality of interests met, under different assumptions about which interests are valid.

Rather than replace the argued rule unseen, the site publishes the owner's starting rule beside it and lets the two be compared on real pages (code: [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py); prose: [method page, tally](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)). Status: runs on the published site, printed on every belief page as "Counting every reason until it is argued down", read by no other number.

```
a reason or a prediction weighs    Truth x Linkage x Importance x Uniqueness
a finding weighs                   the same, x (1 + ESIW x ERQ x ERP/100), uncapped
independent reasons on a side      the sum of Uniqueness over its reasons
share for                          (weight for + w x p0) / (weight for + weight against + w)
```

Calculation, same page as above but with the reason *unargued*: under the tally it weighs `0.5 x 1 x 0.5 x 1 = 0.25` and the belief reads `(0.25 + 0.5) / (0.25 + 1) = 0.60`; under the argued rule it reads 0.50. That gap, printed on every page, is the volume question made visible. The evidence term `ESIW x ERQ x ERP/100` has no cap, which is the owner's preference built: four confirming statistics weigh `1 + 0.90 x 4 x 1 = 4.6` times a bare reason. A vote enters neither rule.

## Why this matters

The 2025 page gave four reasons. Each is kept, with what the code does about it.

**Logical integrity: detect and score fallacious reasoning.** Status: partial in the app, refused in part on the published site. Detection exists in the app as six regular expressions that run only on agent-submitted claims and return only strings (code: [`fallacy-detector.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/fallacy-detector.ts), whose test asserts "never returns numeric fields"). Scoring exists in the app as a community vote that, at 60% weighted agreement, publishes a counter-argument of strength 0.8 or 0.5 into the accused argument's linkage debate (code: [`consensus.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/consensus.ts), [`claims.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/claims.ts)). The two are deliberately decoupled: nothing is scored until people confirm it. The published site detects by a nine-phrase list and scores nothing for it; a flag is a question, and the argument on the flagged claim's own page decides (code: [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py)). This is the owner's direction: nothing is final, a flag is argued like any claim, a flag alone moves no score.

**Empirical validation: quantify verification from independent evidence.** Status: runs in both engines, differently. Published site: the evidence prior above, over 18 source tiers (the wiki's 16 from [[Evidence Verification Score (EVS)]], from `statistics` 0.90 down to `artifact` 0.10, plus an added `record` at 0.90 for a primary official record, plus `NOSOURCE = 0.0` for a page that names no type). App: `EVS = ESIW x log2(ERQ + 1) x ECRS x ERP` over five tiers, `T0 0.05` (retracted or fraudulent), `T1 1.0` (peer-reviewed or official), `T2 0.75` (expert or institutional), `T3 0.5` (journalism or surveys), `T4 0.25` (opinion or anecdote), unknown tier 0.5 (code: `calculateEVS` and `EVIDENCE_TYPE_WEIGHTS` in `scoring-engine.ts`), multiplied by a lifecycle weight `VERIFIED 1.0`, `DISPUTED 0.5`, `UNVERIFIED 0.5`, `FALSIFIED 0.0` (code: `VERIFICATION_SCORES` in [`src/core/reasonrank/types.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/reasonrank/types.ts)), with `computeEvidenceImpactScore = clamp(EVS x linkage x 10, 0, 100)`. Three replication curves now exist for one idea: linear `ERQ` on the wiki's EVS page, `log2(ERQ + 1)` in the app, bounded `2n/(n + 1)` on the published site's prior, and uncapped `ERQ` again in the tally. The wiki's own `Overall EVS = ESIW x ECRS x ERQ x ERP/100` is computed and printed under every Evidence Ledger on the published site and read by no score ([method page, EVS](https://myklob.github.io/ideastockexchange/beliefs/method.html#evs)).

**Better decisions: connect belief strength directly to evidence strength.** Status: runs in both engines. In the app each evidence row adds `tierWeight x linkageScore` to a supporting or weakening pile and `(supporting - weakening) / count x 0.2` is added to the argued balance, so evidence can move a belief by at most 0.2 either way (code: `scoreProtocolBelief` in `scoring-engine.ts`). The published site goes further: evidence is the only thing that can move any page off 0.50 at all, as the induction above shows.

**Scalable system: machine learning + human input + transparent scoring.** Status: two of three. Human input runs in the app as weighted votes on fallacy accusations, where the weight is the voter's track record: `credibility = clamp(accuracyFactor x balanceFactor, 0.3, 1.4)`, `accuracyFactor = 2 x upheld / (upheld + rejected)` once at least 3 claims are resolved, `balanceFactor = 0.4 + 0.9 x (min(agreeFlags, disagreeFlags) + 1) / (max + 1)` once at least 5 arguments are flagged, a new user exactly 1.0 (code: [`calibration.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/calibration.ts)). Transparent scoring runs in both: `GET /api/contributors/[userId]/track-record` returns every voter's raw inputs, both factors, the formula and the clamps; on the published site every number is a link to the page that argues it, and the labelled constants a page still rests on are shown in grey ([method page, constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants)). Machine learning: proposed, not built, in the fallacy path. The only machine learning in the repository is sentence-transformer similarity in `src/core/ai/similarity.py` and `overlap_engine.py`, which no route imports, and CLAUDE.md records the owner's rule that a number a model asserted is the one thing the published engine refuses to carry.

## What "two metrics" became: three formulas, one name

The 2025 page said the Truth Score integrates two metrics. The code has three truth scores, and only one of them has that shape (the full derivation of each is on [[Truth Score]]):

| | Published site (`score_reference.py`) | Next.js belief page (`all-scores.ts`) | Next.js engine (`scoring-engine.ts`) |
|---|---|---|---|
| Status | Runs; what myklob.github.io serves | Runs; the Truth Score row on `/beliefs/[slug]` | Runs; `/api/protocol`, `/api/scoring`, CBA |
| Rule | `(POS + w x p0) / (POS + NEG + w)`, then `min(., weakest load-bearing premise)` | `(LV + V) / 2`, each half clamped [0.01, 0.99] | `proRank / (proRank + conRank) + 0.2 x evidence net`, clamped [0.01, 0.99] |
| Logical half | The signed row sum | `LV = proWeight / (pro + con)`, `weight = max(0, truth x (1 - fallacyPenalty))`, 0.5 when nothing argued | `rawImpact = ReasonRank x linkage x importance x uniqueness` |
| Evidence half | Sets where the page starts | `V = supporting / (supporting + weakening)`, row weight `(evsScore > 0 ? evsScore : 0.1) x linkage` | Up to +/- 0.2 |
| Unargued reason | Worth exactly 0 | Counts at `\|impactScore\| / 100` | Raises the score |
| Fallacies | No term, by design | `fallacyPenalty`, never passed on the belief page | `fallaciesDetected`, demo data only |

The two-channel average kept the 2025 shape and nothing else of the 2025 content: on every live belief page the `fallacyPenalty` is not passed, so the "logical" half is the pro share of argued weight, full stop (code: [`fetch-belief.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/data/fetch-belief.ts)). The engine does not share the published site's zero rule at all: it scores `A / (A + D)` over argument strengths, so an unargued reason raises the score. CLAUDE.md lists that disagreement as open decision 1 and the owner's direction is to settle it by comparing on real pages, which the tally is the first step of. A fourth formula, `TS = (LV x EQ x VL) +/- CW` on a -1 to +1 scale in `docs/ALGORITHMS.md`, is implemented by nothing and listed on the method page under [rules this site does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun).

## The fallacy half

### Common logical fallacies we track

The 2025 page named four and gave each a one-line definition. Here they are, with where each one lives now. The app's catalog is [`catalog.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/catalog.ts); the published site's phrase list is [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py).

| 2025 page | Definition given | App catalog | Published site flag |
|---|---|---|---|
| **Ad hominem** | Attacking the person instead of the argument | `ad-hominem`: target factor relevance, severity major, no exhibits required; not a fallacy when "a relevant conflict of interest is documented with evidence"; has a detector rule (liar, idiot, stupid, corrupt, dishonest, evil, fraud, shill, crook) | "Attacking the person": "he's a liar / idiot / hypocrite / fool / crook / shill / extremist", "can't be trusted because he", "what do you expect from", "paid shills", "only says that because" |
| **Appeal to authority** | Citing authority without supporting evidence | `appeal-to-authority`, label "Appeal to Authority (improper)": evidence-quality, minor; not a fallacy when "citing a genuine domain expert consistent with the evidence base (that is T2 evidence, not a fallacy)"; no detector rule, human-filed only | "Appeal to authority": "experts agree / say", "scientists agree / say", "doctors / economists agree / say", "according to the experts", "trust the experts / science" |
| **Red herring** | Distracting from the issue with irrelevant points | **Not in the catalog.** `validateFallacyClaimInput` rejects it as an unknown type. Relevance is argued on the row's linkage page, and `whataboutism` (relevance, minor) covers the deflection case. Proposed: a `red-herring` entry (relevance, minor, no exhibits) is an editorial decision for the owner | No flag; "Pointing at the other side" covers the deflection case |
| **False cause** | Assuming causation from sequence or correlation | Split in two: `post-hoc` (Post Hoc Ergo Propter Hoc, logical-validity, major: the sequence form) and `false-cause` (logical-validity, major: the correlation form); the detector fires `false-cause` on "correlat..." and "caus... / proves / proof" in one sentence, either order | "After, therefore because of": "ever since ...,", "right after ..., crime / prices / test scores / unemployment", "and then crime / prices / scores rose / fell" |

The other ten catalog entries, so the list is complete: `false-dilemma` (logical-validity, major; exhibits: list the excluded alternatives with evidence they exist; not a fallacy when only two options logically exist), `straw-man` (relevance, major; exhibits: link the opponent's actual stated position), `slippery-slope` (logical-validity, major; exhibits: show the missing causal mechanism; not a fallacy when each step's mechanism is demonstrated), `cherry-picking` (evidence-quality, major; exhibits: link the contradicting evidence being ignored), `moving-goalposts` (logical-validity, minor; exhibits: quote the earlier criterion and show it was met), `whataboutism` (relevance, minor), `hasty-generalization` (logical-validity, minor), `appeal-to-popularity` (relevance, minor), `overgeneralization` (logical-validity, minor), `anecdotal-evidence` (evidence-quality, minor). The published site's other five patterns: "Appeal to popularity", "Slippery slope", "False choice", "Sweeping generalization", "Appeal to tradition". Severity in the app is two-valued, `minor` or `major`; there is no `moderate`.

> By identifying these, we help prevent **non-sequiturs** and flawed reasoning from distorting conclusions.

That sentence from 2025 is true, but non sequitur turned out not to be a fallacy type at all. It is a property of the link between a reason and its conclusion, and it is handled where relevance is handled. In the app, `detectNonSequitur` flags an argument when its linkage classification is `NON_SEQUITUR` or `|linkage| < 0.05`, and raises the warning "True but Irrelevant" when `|linkage| < 0.1` and the argument's own truth is above 0.8: a true claim that does not bear on the conclusion (code: `scoring-engine.ts`). The classification bands: `<= -0.5 CONTRADICTION`, `|s| < 0.05 IRRELEVANT`, `< 0.35 ANECDOTAL`, `< 0.65 CONTEXTUAL`, `< 0.95 STRONG_CAUSAL`, else `DEDUCTIVE_PROOF` (code: `classifyLinkageScore`). On the published site a non sequitur is a reason whose linkage page has been argued toward 0, and `DEFLINK = 1` means every link starts fully trusted and falls only when someone shows it does not hold: the owner's direction on linkage, built as a default. See [[Linkage Scores]] and [[Template: Linkage Evaluation]].

### Algorithm outline, step by step

The 2025 page gave six steps. Each is kept with its status.

1. **Identify a set of common logical fallacies.** *Runs in the app:* `FALLACY_CATALOG`, a `ReadonlyMap` of 14 entries, each with `slug`, `label`, `targetFactor` (`relevance` | `logical-validity` | `evidence-quality`), `severity` (`minor` | `major`), `definition`, `detectionCriteria`, `evidenceRequirement` and an optional `notFallacyWhen`. It is the single source for the detector, the accusation template, the validity ladder and the explainer page, and the severity is copied onto each claim at filing so history survives catalog edits (schema: `FallacyClaim` in [`prisma/schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma)). *Runs on the published site:* the nine patterns in `fallacy.py`.
2. **Allow users to flag arguments containing them.** *Runs in the app, and stricter than "flag":* `POST /api/arguments/[id]/fallacy-claims` requires all six template fields (`fallacyType` from the catalog, `quotedText`, `explanation` of at least `MIN_EXPLANATION_LENGTH = 40` characters, `missingElements`, `evidenceLinks` each with a label and non-empty for the five types with an exhibit requirement, `consequences`), answers 422 with one issue per missing field, answers 422 if the body carries `severity`, `weight`, `consensus`, `status` or `score` ("severity comes from the catalog, weight from the track record, status from community consensus"), and answers 423 inside the monthly graph-freeze window (code: [`route.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/arguments/%5Bid%5D/fallacy-claims/route.ts), `validateFallacyClaimInput` in `claims.ts`). The explainer's phrase: you can't just click a fallacy button. Filing returns "Filed. No score changed". *Runs on the published site:* each flag links two prefilled GitHub issue forms on the flagged claim's own page, "This is <fallacy>: it <what it is>, because" and "This is not <fallacy>, because".
3. **Enable pro/con reasoning on whether a fallacy is truly present.** *Partial in the app:* filing creates one draft `LinkageArgument` (side `disagree`, status `draft`) in the accused argument's linkage sub-debate, and others vote agree or disagree on the claim with an optional free-text `reasoning`. There is no nested pro/con tree under the accusation; the "relative performance of pro/con sub-arguments" the 2025 page described is a weighted yes/no tally. *Runs on the published site, closer to the wording:* the accusation is a reason to disagree on the claim's page, that reason has a page of its own with its own reasons for and against, and it is scored like anything else. There is no accusation object and no vote.
4. **Use semantic equivalency scores to auto-flag similar arguments.** *Partial, and lexical rather than semantic.* The app's agent ingest computes `textSimilarity = 0.7 x token Jaccard + 0.3 x bigram Jaccard`; at or above `EQUIVALENCE_CANDIDATE_THRESHOLD = 0.5` it persists an `EquivalenceCandidate` row, at `RESTATEMENT_SPEEDBUMP_THRESHOLD = 0.8` it is a restatement speed bump plus grouping vote, at `SAME_CLAIM_THRESHOLD = 0.95` it proposes grouping outright, and grouping needs the same 60% weighted consensus with a quorum of 3 (code: [`similarity.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/similarity.ts), [`ingest.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/ingest.ts)). `calculateBeliefEquivalencyScore` blends `0.4 x mechanical + 0.6 x semantic` when an embedding is supplied, and none is; its bands are identical `>= 0.90`, near-identical `>= 0.70`, overlapping `>= 0.45`, related `>= 0.20`, with `MECHANICAL_THRESHOLD = 0.85` (code: `all-scores.ts`). The published site's [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) uses IDF-weighted overlap of content words averaged with cosine over character 4-grams, `FLAG = 0.45`, `MERGE = 0.70`, and by its own docstring carries weight 0 in every score until a uniqueness page argues it. What all of this flags is duplicates, not fallacies: no code copies a confirmed `FallacyClaim` to an equivalent argument, and the app's explainer sentence "a fallacy confirmed once stays confirmed for the whole cluster" rests on pages being merged to one per claim, not on propagation. See [[Equivalency Score:]], [[The Redundancy Problem]] and [[Template: Belief Equivalence Scorecard]].
5. **Develop ML algorithms to detect fallacy patterns in text.** *Refused by design on the published site; replaced by regular expressions in the app.* The docstring of [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) gives the reason, and it deserves quoting: on a corpus whose whole subject is officials acting on financial interests, a pattern matcher looking for "attacking the person instead of the argument" would fire on the central legitimate argument on every page; "a check that deducts points from the strongest claim in the corpus, silently, with no page to appeal to, is worse than no check"; and "a score moved by a regular expression breaks the one rule this site keeps everywhere else: every number is a link to the page that argues it." The method page prints, in bold, "Fallacy detection is not done", and [`test_render.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_render.py) fails the build if that sentence disappears. The app's detector is six regexes, not a model, with no training data and no measured accuracy, and its module header makes "fallacy detection changes zero score fields" the invariant. The only engine that ever scored a pattern match is retired: `_archive/backend/utils/fallacyDetector.js`, with `confidence = min(0.3 x patterns + 0.1 x keywords, 1)` and a logical-consistency deduction of `{high 0.15, medium 0.10, low 0.05} x confidence / 100`, imported by nothing.
6. **Score flagged arguments based on:**
   - **Performance of pro/con sub-arguments.** *Replaced in the app by weighted consensus:* after each vote `resolveConsensus` recomputes `agreeShare = agreeWeight / totalWeight`; `upheld` when `votes >= CONSENSUS_QUORUM (3)` and `agreeShare >= CONSENSUS_THRESHOLD (0.6)`, `rejected` when `1 - agreeShare >= 0.6`, `open` otherwise, and it can move back as votes arrive (code: `consensus.ts`). Confirmation sets the counter-argument to `published` with `counterArgumentStrength = 0.8` for a major and `0.5` for a minor fallacy; rejection sets it `rejected` and lowers the accuser's accuracy record; open returns it to `draft`. Published rows then feed `linkage = A / (A + D)` (0.5 with none) and `propagateFromLinkageChange` ripples upward (code: [`propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts)). Vote weight is computed before the vote is stored, so voting on your own accusation never lifts your own weight. *Runs on the published site in the literal sense:* the accusation is a claim with sub-arguments and earns whatever truth score they give it.
   - **Confidence intervals for detection accuracy.** *Proposed, not built.* No detection accuracy is measured anywhere. Two numbers with similar names are different things: `scoreProtocolBelief`'s `confidenceInterval = clamp(0.15 x max(0.3, 1 - 0.03 x args) x (1 - 0.5 x |pro - con| / (pro + con)), 0.02, 0.2)` is an interval on a *belief's* truth (code: `scoring-engine.ts`), and a caller's `accuracyRate = upheld / (upheld + rejected)` is how often a *human's* past accusations were upheld, used to weight their votes (code: `calibration.ts`). The [[Truth Score]] page's 2025 sketch adds a seventh step, "Aggregate results into a Logical Fallacy Score (confidence interval)", with five text bands at thresholds -2, 0 and 2; those bands appear nowhere in `src/`, `tools/` or `tests/`.

### The validity ladder: written, tested, wired to nothing

The nearest thing in the code to a Logical Fallacy Score is `logicalValidityMultiplier` (code: `claims.ts`): no confirmed fallacy `VALIDITY_NO_FALLACY = 0.95`, one minor `VALIDITY_MINOR = 0.75`, one major `VALIDITY_MAJOR = 0.45`, two or more `VALIDITY_MULTIPLE = 0.25`. `confirmedClaimsToDetectedFallacies` turns an argument's confirmed claims into `DetectedFallacy` impacts summing to `(1 - multiplier) x 100`, split evenly, sized so that `scoreArgument`'s `baseTruth = truth x (1 - sum|impact| / 100)` lands exactly on the ladder (pinned by the engine test at `0.8 x (1 - 0.2) = 0.64`, and by [`claims.test.ts`](https://github.com/myklob/ideastockexchange/blob/master/tests/unit/lib/fallacy/claims.test.ts)). Calculation: two confirmed claims give a multiplier of 0.25, a penalty of 75 split 37.5 each, and an argument worth a quarter of what it was. Both functions are exported and called by nothing in `src/` outside their own file. Status: proposed, in working code. Today the only wired effect of a confirmed fallacy on any score, whatever its `targetFactor` says it should damage, is the published counter-argument at 0.8 or 0.5 in the linkage aggregate; the target factor is a label on the inline note, not a routing of the damage.

## Role in the larger system

> The Logical Fallacy Score is **one of many algorithms** used in the Idea Stock Exchange.

It is listed at `/algorithms` under the name **Fallacy Detection**, described as "Fallacy accusations as scored arguments: a required template, a 60% consensus bar, and a credibility multiplier that punishes tribal calling", and the explainer at `/algorithms/fallacy-detection` documents the template, the bar, the ladder and the [0.3, 1.4] multiplier (code: [`page.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/app/algorithms/fallacy-detection/page.tsx)). The 2025 page's three bullets, each with its status:

- **Works alongside Equivalency Scores to group similar arguments.** *Runs in the app:* the redundancy scan proposes pairs, the community groups them at 60% weighted consensus (`/api/equivalence-candidates/[id]/votes`), and the sibling uniqueness discount prices whatever overlap remains: `uniqueness = 1 - max similarity to earlier same-side siblings`, oldest first (code: `siblingUniquenessFor` in `propagate-belief-scores.ts`). *Runs on the published site:* the computed similarity carries weight 0 until a uniqueness page argues it; the structural check "Rows that may be the same point twice" names the pair.
- **Adjusts overall Belief Scores by reducing weight for fallacious reasoning.** *Partial in the app:* engine-level, `scoreArgument` computes `fallacyPenalty = sum(|impact|) / 100` and `baseTruth = max(0, truthScore x (1 - fallacyPenalty))`, and `calculateTruthScoreBreakdown` weights each argument by `truth x (1 - penalty)`; but in the database-backed product nothing fills `fallaciesDetected` from confirmed claims, so the only reduction a confirmed fallacy causes is the published counter-argument lowering `linkage = A / (A + D)` and so `impactScore`. *Refused on the published site:* "Not computed. The structural checks above name faults, and possible fallacies are flagged by wording and argued on the flagged claim's page; neither moves a score" (method page, not-run table, the row "Logical validity from weighted fallacy deductions"). The 2025 page's "Belief Scores" are `truthScore` in the app and, on the published site, `belief score = POS - NEG`, open-ended, printed beside the truth score.
- **Tracks confidence over time, similar to stock price charts.** *Partial.* The app stores one `truthScore` snapshot per belief per calendar month, labelled `YYYY-MM`, at 23:59:59.999 UTC on the month's last day, with a write freeze from 23:50 to 00:10 (code: [`epoch.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/markets/epoch.ts); schema `EpochSnapshot` with `truthScore`, `algorithmVersion`, `graphArchive`), so the time series exists; no component renders it as a chart, and nothing tracks the fallacy consensus over time. The published site diffs scores between git revisions, row by row and page by page, with which pages crossed the line (code: [`changes.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/changes.py)), and lists "score variance over time" among the behavioural confidence signals at weight 0 with "no data" (code: `BEHAVIOURAL` in [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py)). The stock-price chart itself: proposed, not built.

## Path forward

The 2025 page listed four. Each is kept as a proposal with the standing objection attached, because the owner should decide against it knowingly or for it knowingly.

- **Large, diverse dataset: examples of fallacies across domains and media types.** Proposed, not built. No fallacy corpus, labelled examples or training data exist in the repository. The only accuracy data the system accumulates is per human caller (`FallacyClaim.status` by `submittedById`, read by `callerRecordFor` in [`caller-record.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/caller-record.ts)); the detector agent's own hits are never scored.
- **Domain-specific knowledge: tailor detection to fields like politics or science.** Proposed, not built. The only domain tailoring is editorial, the catalog's `notFallacyWhen` text shown to voters. And the published site's refusal is itself a domain argument: on a corpus about officials acting on their own financial interests, an ad hominem matcher fires on the legitimate central claim.
- **Human feedback loop: correct false positives and refine detection.** Runs in the app. Detector output enters as a draft counter-argument attributed to the agent `system:fallacy-detector`, displayed but never counted until reviewed; a claim that loses its vote goes to `rejected`, its counter-argument is retired, and every rejected claim permanently lowers the accuser's `accuracyRate`; consensus moves in both directions; every filing, vote and resolution writes an audit log row. Runs on the published site as the two "It is / It is not" forms. "Refine detection" in the retraining sense does not happen: the regex rules are static.
- **Continual improvement: regularly retrain algorithms on updated data.** Proposed, not built. There is no model to retrain. The only tunable constants are the six regexes, the ladder, the strengths 0.8 and 0.5 and the credibility constants, all hard-coded, none with a page arguing it, which the published site's own rule would not permit.

## Code reference

The 2025 page pointed at a GitHub wiki anchor, `#logical-fallacy-score`, that does not exist on the wiki Home page, and promised "the latest examples" there; the examples it meant are the two 2023 sketches kept at the bottom of this page. The live code:

| What | Where |
|---|---|
| The catalog of 14 fallacy types | [`src/lib/fallacy/catalog.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/catalog.ts) |
| The accusation template, the validity ladder, the counter-argument strengths | [`src/lib/fallacy/claims.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/claims.ts) |
| Vote weight from the caller's record | [`src/lib/fallacy/calibration.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/calibration.ts), [`caller-record.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/caller-record.ts) |
| The 60% / quorum-3 consensus rule | [`src/lib/consensus.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/consensus.ts) |
| The six-rule drafting detector | [`src/lib/agent-ingest/fallacy-detector.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/fallacy-detector.ts) |
| Filing an accusation | [`src/app/api/arguments/[id]/fallacy-claims/route.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/arguments/%5Bid%5D/fallacy-claims/route.ts) |
| Voting on one | [`src/app/api/fallacy-claims/[id]/votes/route.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/fallacy-claims/%5Bid%5D/votes/route.ts) |
| The explainer | `/algorithms/fallacy-detection` ([source](https://github.com/myklob/ideastockexchange/blob/master/src/app/algorithms/fallacy-detection/page.tsx)) |
| The published site's phrase flags and structural checks | [`tools/static-site/fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py), [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) |
| The retired scoring detector (10 types, pattern 0.3 / keyword 0.1 confidence, deductions 0.15 / 0.10 / 0.05) | [`_archive/backend/utils/fallacyDetector.js`](https://github.com/myklob/ideastockexchange/blob/master/_archive/backend/utils/fallacyDetector.js) |

## Alternate explanation

The 2025 page offered a second way to picture the Logical Fallacy Score, and the picture is kept with the number it now attaches to.

**A confidence meter for whether an argument depends on flawed logic.** The code has such a meter per accusation, not per argument: `FallacyClaim.consensus` holds the weighted agree share (null until quorum), and `GET /api/arguments/[id]/fallacy-claims` returns the live `agreeShare`, `voteCount`, `threshold` and `quorum`. There is no roll-up of "how likely this argument depends on flawed logic"; the belief page fetches only claims with `status: 'confirmed'` and renders each as an inline red note in the argument cell, "<type> confirmed, dents Linkage | Argument Score (validity) | Evidence Quality" by target factor, linking the explainer (code: `ConfirmedFallacyNotes` in [`ArgumentTreesSection.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/ArgumentTreesSection.tsx)). An unconfirmed accusation is never rendered.

**Combining an Argument Importance Score with the likelihood it hinges on minor, moderate, or major fallacies.** Two corrections from the code. Severity is `minor` or `major`; there is no moderate. And importance is not combined with the fallacy term: in `scoreArgument` the fallacy penalty multiplies the argument's own truth (`baseTruth`), while `importanceWeight` (default 1.0) multiplies separately in `rawImpact = reasonRank x linkage x importance x uniqueness`. A confirmed claim's strength is 0.8 or 0.5 by severity alone. The code's name for the 2025 page's Argument Importance Score is `importanceScore`.

**A tool to reduce misinformation risk by making weaknesses in reasoning transparent.** Runs in both engines. In the app, every confirmed claim is visible in the cell it dents and every voter's weight derivation is public. On the published site, the Structural Checks panel names nine faults the shape of the graph can show without reading the prose (circular support; assumes its own conclusion; the same page listed more than once; rows that may be the same point twice; rests only on authority or experience; evidence filed above the premise it bears on; costs and benefits given as single figures; nothing stated would show it false; nobody has argued the other side), and moves no score for any of them (code: `integrity.py`; prose: [method page, checks](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks)). The two serious ones are refused before publication: `cycles_in_tables` runs Tarjan's strongly connected components over the claim graph and names one loop per component, because a loop can hold any value at all and stay consistent, so there is no number to publish. Circular reasoning is a build failure, not a fallacy type.

> Low score: argument likely stands without fallacies.
> High score: argument likely relies on flawed reasoning.

No single published number has that direction, and the sources disagree among themselves, so the reader should know which way each one runs. `FallacyClaim.consensus` runs 0 to 1 with high meaning the accusation is upheld, which matches this paragraph. The unwired `logicalValidityMultiplier` runs 0.95 (clean) down to 0.25 (two or more confirmed), so high means clean, the reverse. The 2023 sketch on [[Truth Score]] scores below -2 as "Very likely fallacious" and above 2 as "Very likely sound", also the reverse. Which direction and scale a published fallacy number should have, if one is published at all, is an open decision for the owner.

## What the 2025 page never mentioned

Several things that run today bear directly on what a truth score is and how far it can be trusted, and the 2025 page knew nothing of them. A reader who wants the power of truth scores should know these exist.

**Confidence: how much a score is allowed to count.** Runs on the published site (code: `confidence.py`; wiki: [[Confidence Stability Scores]]). Confidence multiplies what a page passes to the page above it, and at 0 a claim moves its parent not at all however true it looks. It is deliberately not a cap on the page's own truth: truth is what the arguments say, confidence is how much to bet on it. Seven structural components, weighted and renormalised over whichever apply: `grounding 0.30` (the better of the page's own source tier and the mean confidence of the claims beneath it, recursive, so a tree of bare assertions scores near zero however many rows it lists), `two_sided 0.20` (1.0 if both sides have rows, 0.35 if one does), `scrutiny 0.20` (the share of link, imp and uniq slots that have an argued page), `breadth 0.15` (`saturate(rows + predictions, 6)`, where `saturate(n, half) = n / (n + half)`), `depth 0.05` (`saturate(depth, 3)`), `sourcing 0.05` (half for citing a source, half for saying what kind), `testability 0.05` (predictions dated and with a linkage page). Bands: `established 0.75`, `developing 0.45`, `early 0.15`. The seven behavioural signals from the wiki (up and down votes, weekly visitors, dwell time, edit frequency, duplicate submission attempts, evaluation responses, score variance over time) carry weight 0 on a published corpus with one snapshot and no users, and are reported as "no data" rather than scored as 0.

**The load-bearing cap.** Runs on the published site (code: `Model.evaluate` in `score_reference.py`). An author may mark a premise load-bearing (the `lb` flag), and a conclusion cannot be more settled than a premise it cannot survive without, so the published truth is the smaller of what the rows argue and the weakest such premise that has a page. It is a minimum, not a replacement, and a premise with no page caps nothing. Open decision 6 in CLAUDE.md: the cap treats "unargued" as 0.50 and lets it cap, which is correct as probability and is, with the unargued-row rule, what holds most beliefs at 0.50. See [[Assumptions]].

**What would change the answer.** Runs on the published site (code: [`sensitivity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py); prose: [method page, sensitivity](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity)). Every claim beneath a page is held at false and then at true, one at a time, and the whole graph recomputed, to `DEPTH = 6` levels; the flip point where the page crosses `FLIP = 0.5` is found by bisection to `STEPS = 16` places; an input that moves the page by less than `INERT = 0.005` is reported as inert. This is the truth score's answer to "so what should I go argue?": the one input that would flip the conclusion. Beside it, the [Hardest to resolve](https://myklob.github.io/ideastockexchange/beliefs/lists.html#hardest) list classifies each belief from its own tables as a factual dispute, a linkage dispute or a values conflict, because the kind of dispute says what kind of work would move it ([method page, dispute](https://myklob.github.io/ideastockexchange/beliefs/method.html#dispute)).

**Decision Leverage.** Runs in the app (code: [`decision-leverage.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts); explainer at `/algorithms/decision-leverage`; work queue at `/leverage` with a JSON twin at `/api/leverage`). The app's version of the same question: every unsettled argument edge ranked by the conclusion score still at stake on it, `leverage = weight x openRange x 100`, where `weight = |linkage| x importance x uniqueness x DEPTH_ATTENUATION^depth` with `DEPTH_ATTENUATION = 0.5` and `openRange` is a weighted shortfall across four resolution gaps. It reuses linkage, importance, uniqueness and grounding and adds no schema.

**Relied on.** Runs on the published site (code: [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py); prose: [method page, ReasonRank](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank)). A PageRank-style walk over the claim graph with `DAMPING = 0.85`, run to `TOLERANCE = 1e-12` within a cap of `ITERATIONS = 2000`, asking how much of the corpus depends on a page, and deliberately ignoring the page's truth: a false claim that twenty beliefs rest on is the most important thing on the site to go and argue. See [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]].

**Votes are shown and never scored.** Runs on the published site; the owner's direction built. A vote recorded through the GitHub issue forms lands in `content/votes.csv` and is shown on the heading line after the score badge with the words "votes, not a score" (code: [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py), [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)). Once three people have voted on a claim, the home page ranks "Votes vs the analysis" by how far the vote share sits from the truth score ([lists page, votes](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes)). The owner's direction: votes may decide what is promoted and given attention, never what is valid, and the gap between the two is worth showing because it says where people need more time with the argument. The one place in either engine where a vote moves a number is the app's fallacy confirmation at 60%, and that exception is listed under open decisions.

**Retraction exposure.** Runs in the app (code: [`evidence-exposure.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/evidence-exposure.ts)). The Evidence Ledger prints a Standing column and a readout of how many of a belief's points rest on evidence nobody has checked. A row with no status on record counts in full and so carries the largest exposure, `1.0 x |impact|`; UNVERIFIED and DISPUTED rows count at half and could move `0.5 x |impact|` either way; VERIFIED and FALSIFIED rows are settled. `NEGLIGIBLE_EXPOSURE = 0.5` points, `HIGH_EXPOSURE_SHARE = 0.5`. Counting unrecorded rows in full is deliberate, not a bug to fix by defaulting them to verified. The `/leverage` page lists the exposed rows corpus-wide.

**Falsifiability and testable predictions.** Runs in both engines. On the published site a belief carries `falsify_for` and `falsify_against` rows ("Evidence that would strengthen / weaken") and prediction rows, which score through the same row formula as reasons and findings; the structural check "Nothing stated would show it false" fires on any belief with no prediction; and "predictions or a falsifiability test" is one of the seven requirements of `publish.CORE_BAR` for a belief to count as complete rather than a draft, with reasons to agree, reasons to disagree, evidence, objective criteria, costs and benefits, and interests (code: [`publish.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/publish.py)). Every belief is published however far along it is; a draft is marked, never hidden, and no drafted argument is ever deleted. In the app, `FalsifiabilityTestSection` shows strengthen and weaken rows ranked by each row's own sub-debate score plus predictions with timeframe, verification method and result (code: [`FalsifiabilityTestSection.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/FalsifiabilityTestSection.tsx)). The canonical layout is [[Template: Belief Analysis]].

**What changed since last time.** Runs on the published site (code: `changes.py`). Because the content is two tables kept as text in git and the engine is a pure function of them, a revision can answer the first question anyone asks of it exactly: what somebody changed, row by row with old and new text, and what it did to the scores, which pages moved, by how much, and which crossed the line. That is the errata sheet an institution publishes, computed instead of written.

## The 2023 sketches

The 2025 page's "Code Reference" pointed at these. They were written for the sister page and are kept here as the owner wrote them, so this page stands alone. Neither runs.

<details><summary>Original sketch (2023), not what runs</summary>

What runs instead: in the app, structured fallacy claims confirmed by weighted vote (`src/lib/fallacy/claims.ts`, `src/lib/consensus.ts`); on the published site, phrase flags argued on the claim's page (`tools/static-site/fallacy.py`) and structural checks that move no score (`tools/static-site/integrity.py`). Both functions in this sketch are TODO stubs returning 0, the loop runs over an empty dict, and the five bands appear nowhere in the code.

```python
logical_fallacies = ['ad hominem', 'appeal to authority', 'red herring', 'false cause']
argument_scores = {}

def evaluate_sub_argument_score(argument, fallacy, evidence):
    score = 0
    # TODO: Implement scoring logic using evidence
    return score

def evaluate_argument_score(argument, evidence):
    score = 0
    for fallacy in logical_fallacies:
        score += evaluate_sub_argument_score(argument, fallacy, evidence.get(fallacy, []))
    return score

flagged_arguments = {}  # {argument: {fallacy_type: [evidence_items]}}
similar_arguments = {}  # Placeholder for auto-flagging system

class FallacyDetector:
    def detect(self, argument):
        # TODO: Implement ML detection
        return []

fallacy_detector = FallacyDetector()

for argument, evidence in flagged_arguments.items():
    score = evaluate_argument_score(argument, evidence)
    if score < -2:
        confidence = "Very likely fallacious"
    elif score < 0:
        confidence = "Possibly fallacious"
    elif score == 0:
        confidence = "No indication of fallacy"
    elif score < 2:
        confidence = "Possibly sound"
    else:
        confidence = "Very likely sound"
    argument_scores[argument] = {'score': score, 'confidence_interval': confidence}
```

</details>

<details><summary>Original sketch (2023), not what runs</summary>

What runs instead: six regular expressions over agent-submitted text in `src/lib/agent-ingest/fallacy-detector.ts`, each hit a draft counter-argument with no number attached. spaCy is not a dependency of the app, the published site or the pipeline (`pipeline/requirements.txt` has sentence-transformers; the archived `_archive/legacy-root/requirements.txt` had spaCy and is retired). Note also that this sketch's keyword lists are the *names* of fallacies ("ad hominem", "red herring", "post hoc", "correlation is not causation"), so none of its own four example sentences would match and the example prints four empty dicts; the shipped detector matches the behaviour (an insult, "everyone knows", "my uncle") instead of the name.

```python
import re
import spacy

class ImprovedFallacyDetector:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
        self.fallacies = {
            'ad hominem': ['ad hominem', 'personal attack', 'character assassination'],
            'appeal to authority': ['appeal to authority', 'argument from authority', 'expert opinion'],
            'red herring': ['red herring', 'diversion', 'distract', 'sidetrack'],
            'false cause': ['false cause', 'post hoc', 'correlation is not causation', 'causal fallacy']
        }
        self.patterns = {
            f: re.compile(r'\b(?:%s)\b' % '|'.join(k), re.IGNORECASE)
            for f, k in self.fallacies.items()
        }

    def detect_fallacy(self, text):
        results = {}
        doc = self.nlp(text)
        for sent in doc.sents:
            for fallacy, pattern in self.patterns.items():
                if pattern.search(sent.text):
                    results.setdefault(fallacy, []).append(sent.text)
        return results

# Example usage
detector = ImprovedFallacyDetector()
examples = [
    "You can't trust anything he says because he's a convicted criminal.",
    "Dr. Smith said it, so it must be true.",
    "I know I made a mistake, but what about all the good things I've done for the company?",
    "I wore my lucky socks, and then we won the game, so my socks must have caused the win."
]

for text in examples:
    print(detector.detect_fallacy(text))
```

</details>

## In summary

The 2025 page closed: "By integrating logical fallacy detection with evidence verification, we create a transparent, data-driven way to evaluate arguments and beliefs. This supports critical thinking, strengthens evidence-based decisions, and improves the quality of public discourse." The owner's judgment, and still the goal.

What a year of code adds to it is this. The power of a truth score is not that it is right. It is that it is *argued*: every factor is a page, every page has two sides, every number is a link, and the one way to change the number is to change the argument. A score that could be moved by a vote, a pattern match or a model's say-so would be a score with a back door, and the published site refuses all three, with a test that fails the build if the refusal is quietly removed. The app lets one vote through, at 60% with a track-record weight, to confirm a fallacy accusation, and whether that door stays open is the owner's call. Everything else the 2025 page hoped for is either built, printed beside the score for comparison, or labelled proposed on this page where the owner can find it.

## Open decisions for the owner

These are the design disagreements between this page's sources and the code that only the owner can settle. The owner has asked not to be asked again at the level of individual numbers; they are listed so whoever next touches the code knows what is still open.

1. **Should any automatic detector, regex or ML, ever move a score, or is a fallacy always and only an argument someone must win?** The published site refuses and pins the refusal; the app's detector drafts arguments and is barred by its type shape from scoring; the owner's direction (a flag moves no score) matches both. Options: keep the refusal everywhere and mark ML abandoned by design; let detectors auto-file full `FallacyClaim`s that still need the 60% vote, so a model is an accuser with a track record like anyone else; or build the scoring detector and accept that the static site's test and method page must change.
2. **Which factor does a confirmed fallacy damage, and through which path?** The catalog promises relevance to linkage, logical-validity to the validity ladder, evidence-quality to evidence quality; the code sends every confirmed claim through linkage at 0.8 or 0.5 and the ladder is unwired. Options: wire the bridge; declare all fallacies linkage objections and delete the ladder and its test; or keep both and say the ladder is proposed, which this page does.
3. **Which Truth Score composition is canonical?** Three run and a fourth is on paper; none is the 2025 page's. The owner's direction is to compare on real pages, which the tally begins.
4. **Does a community vote move a score?** Yes in the app's fallacy confirmation, never on the published site. Options: accept the split and say so; replace the vote with a sub-argument tree on the accusation whose own truth decides whether the counter-argument publishes (the published site's shape, and what the direction "attention, never validity" favours); or bring the published site to the app's rule.
5. **Which direction and scale should a published fallacy number have, if any?** This page says high means fallacious; the ladder says high means clean; the 2023 sketch says positive means sound. Options: publish no roll-up and show per-claim consensus only, as today; publish the multiplier and rewrite the low/high paragraph; or publish a fallacy likelihood and invert the ladder's presentation.
6. **Should red herring, and the 2025 page's four, be the published list, or the catalog's fourteen?** Adding `red-herring` means deciding whether it is a relevance or a validity fallacy and whether it needs exhibits. The ten with numeric weights in `docs/ALGORITHMS.md` (Red Herring 0.3) would revive the weighted-deduction model the published site refuses.
7. **Merge the two drafts or keep both pages?** This page and [[Truth Score]] began as two drafts of one page. This rewrite keeps both: that one is the mechanism, this one is the case for it, and each links the other. The duplication is the price, and the owner may still choose to fold one into the other.

## See also

- [[Truth Score]]: the mechanism page, with every formula, constant and file in full.
- [[Evidence Verification Score (EVS)]]: the evidence half, with the sixteen-tier table.
- [[Evidence to Conclusion Relevance Score]] and [[Linkage Scores]]: the relevance factor, where a non sequitur is argued.
- [[Confidence Stability Scores]]: how much a score is allowed to count.
- [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]]: how dependence flows through the graph.
- [[Argument Scores from Sub-Argument Scores]] and [[Pros and Cons on the Same Page]]: the recursion and the layout it rests on.
- [[Equivalency Score:]] and [[The Redundancy Problem]]: the uniqueness factor and the duplicate detector.
- [[Assumptions]]: the load-bearing premises that cap a truth score.
- [[Likelihood of Costs and Benefits]] and [[Likely Interests of Those Who Agree and Disagree]]: the other question, for choices of action.
- [[Template: Belief Analysis]], [[Template: Linkage Evaluation]], [[Template: Belief Equivalence Scorecard]]: the pages these numbers live on.
- The live site: [home](https://myklob.github.io/ideastockexchange/beliefs/index.html), [how every number is computed](https://myklob.github.io/ideastockexchange/beliefs/method.html), [what this cannot do](https://myklob.github.io/ideastockexchange/beliefs/method.html#limits), [the tables behind every page](https://myklob.github.io/ideastockexchange/beliefs/method.html#data), [every ranked list and what it shows](https://myklob.github.io/ideastockexchange/beliefs/lists.html).
