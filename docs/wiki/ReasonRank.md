# ReasonRank

[[Home]] > Page Design > ReasonRank

This page has carried two subtitles: *ReasonRank: Enlightenment Promotion Algorithm* (the live wiki page, last edited 9 August 2025) and *ReasonRank: The PageRank for Arguments* (the owner's newer draft, never published). Both are merged here, and every mechanism they describe is marked with what the code does today. Where a number or formula is given, its basis is labelled: the code (with its file), a calculation, or the owner's judgment.

**ReasonRank** is a network-based scoring algorithm designed to measure the strength of a belief based on the quality of its supporting arguments, rather than its popularity. Just as Google's PageRank revolutionized the web by treating hyperlinks as "votes" for importance, ReasonRank treats logical arguments as votes for a belief's validity. The framework evaluates arguments by breaking them into components and scoring each one using specialized algorithms. The goal is to tie the strength of a conclusion directly to the strength of the evidence supporting it, and to make the process transparent by showing the math.

One warning before the math. The name ReasonRank is borrowed, in this project's code, for three different things, and they answer three different questions:

| What carries the name | Where it runs | The question it answers | Status |
|---|---|---|---|
| The recursive row rule: every reason is a claim with its own page, and its page's score feeds the score of the conclusion above it | [score_reference.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), the scorer of record for the published site | How true is this claim, given what has been argued and cited beneath it? | Built and published on every belief page |
| The PageRank walk: how much of the whole corpus rests on a claim | [reasonrank.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py) | How much depends on this claim, true or not? | Built and published ("Relied on" and "Work value" on every page) |
| A damped blend of an argument's own truth with the net strength of its sub-arguments, 15% to 85% | [scoring-engine.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts) in the Next.js app | How strong is this argument, given its sub-arguments? | Built; runs in the app, not on the published site |

The first and third disagree about whether listing an unargued reason moves a score. That disagreement is real, recorded, and unresolved, and it is covered below under "Where the engines disagree". This is the code's state, read from those three files.

## Guiding Principles

- **"Extraordinary claims require extraordinary evidence."** (Carl Sagan)
- **"The wise man proportions his belief to the evidence."** (David Hume)
- From Aristotle to modern science, progress has relied on linking belief strength to evidence quality.
- For the first time, we define these principles explicitly in software, enabling large-scale, simultaneous reasoning.

The published engine takes Hume literally. A claim with no evidence behind it and no argument beneath it reads 0.50, a coin flip, and contributes exactly nothing to anything above it. That single design choice has consequences that run through this whole page, so it is worth meeting early.

## The Problem vs. The Solution

| Current Online Debates | The ReasonRank Solution |
|---|---|
| **Volume over Quality:** The most frequent or loudest comments win, not the most truthful. | **Meritocracy of Ideas:** Logic and verified evidence determine the score, not "likes" or post frequency. |
| **Echo Chambers:** Algorithms optimize for engagement and outrage, not objective understanding. | **Trust Graph:** Mathematical weighting of connections ensures only sound reasoning moves the needle. |
| **Information Amnesia:** Debates "reset" constantly; we rarely build on previously established conclusions. | **Institutional Memory:** Every topic has one permanent page that grows in accuracy over time. |

All three of the right-hand column are built, in the shape the static site gives them. "Likes" never enter a number: a vote is recorded and shown and never scored (the rule is stated in [intake.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py), line 90: `NO_MOVE = 'A vote never moves a score; the page shows it next to what the analysis says, as what people think.'`). The trust graph is literal: every multiplier on every row is the truth score of another page, or a labelled constant when no such page exists. And every belief, claim, linkage, importance and uniqueness question has one permanent page, built from two flat tables (`pages` and `edges`) that are never deleted from; see [[One Page per Debate Topic]] and [[Pros and Cons on the Same Page]].

## How ReasonRank Compares to PageRank

ReasonRank applies graph theory to logic. It functions within a network where every claim is a node and every reason is a weighted link.

| Feature | Google PageRank | ISE ReasonRank | What the code does today |
|---|---|---|---|
| **The Node** | A webpage | A belief or argument | A page in the `pages` table: belief, claim, linkage, importance, interest, uniqueness, equivalence, driver or media (`SPECIAL` kinds listed in score_reference.py line 35) |
| **The Connection** | A hyperlink | A "reason to agree" or "reason to disagree" | A row in the `edges` table, with a `section` (argument, evidence, prediction and 30 more) and a `side` (agree or disagree) |
| **The Weight** | Domain authority (traffic/trust) | Truth score (verified evidence and logic) | The row's claim page truth, on a -1 to +1 scale, times Confidence, Link, Imp and Uniq, each of them a page's truth score or a constant |
| **Propagation** | "Link Juice" flows to important pages | "Logic Strength" flows to valid conclusions | Recursive: a conclusion's score is computed from its rows, whose claims are computed from theirs, with no stored scores anywhere (static site). The dependence walk goes the other way: it measures how much flows *through* a claim |
| **Spam Filter** | Filters link farms/spam sites | Filters redundancy using uniqueness scores | The uniqueness multiplier (`DEFUNIQ = 1`, presumed distinct until a uniqueness page argues the overlap), plus a computed duplicate detector that flags pairs and moves no score |

## The Four Scoring Dimensions

The owner's draft states the composite rule this way. A score of any conclusion (C) is updated dynamically using the formula:

**C = Σ [(A - D) × L × V × U]**

1. **Truth (Evidence Score - V).** How logically sound is the argument? This is recursive; an argument's score depends on the score of its sub-arguments. Reference: Evidence Verification Tiers, on [[Evidence Verification Score (EVS)]].
2. **Linkage (Relevance Score - L).** Does the evidence actually prove the conclusion? This penalizes "True but Irrelevant" claims. Reference: Linkage Score Methodology, on [[Linkage Scores]] and [[Evidence to Conclusion Relevance Score]].
3. **Impact (Importance Score - A/D).** How much weight should this point carry? Does it address a core pillar or a minor triviality? Reference: Importance Scores (the app's explainer is [src/app/algorithms/importance-score/page.tsx](https://github.com/myklob/ideastockexchange/blob/master/src/app/algorithms/importance-score/page.tsx); the published site's is [method.html#formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula)).
4. **Uniqueness (Redundancy Factor - U).** Is this a new point? We group semantically similar arguments to prevent a user from inflating a score by repeating the same point. Reference: Belief Sorting & Uniqueness, on [[The Redundancy Problem]] and [[Equivalency Score:]].

That is the intent, and the published engine keeps all four. It also has a fifth factor the drafts never mention, and it writes the formula differently in two ways that matter. Here is what actually runs, from `Model._contrib` in [score_reference.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py) (lines 160 to 174):

**row contribution = sign × (2 × Truth - 1) × Confidence × Link × Imp × Uniq**

| Factor | Range | What it is | What a row reads when nobody has argued it | Owner's draft letter |
|---|---|---|---|---|
| sign | +1 or -1 | Which side of the table the row was filed on. | Not applicable: every row sits on a side. | The sign of (A - D) |
| Truth | 0 to 1 | The row's own claim page score, put on a -1 to +1 scale so a claim argued false subtracts from the side it was filed on. | `UNARG = 0.5`, and (2 × 0.5 - 1) is 0, so it contributes exactly nothing. | V |
| Confidence | 0 to 1 | How much of the work behind that claim page has been done. It gates what the page passes upward; it never changes the page's own truth score. | A claim with no page contributes 0 regardless. Default 1.0 in the bare scorer (score_reference.py line 137), computed by [confidence.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py) in the published site. | (none) |
| Link | 0 to 1 | The linkage page: if the claim were true, would the conclusion have to move? | `DEFLINK = 1`. A reason placed under a conclusion is presumed relevant and the burden is on the challenger. | L |
| Imp | 0 to 1 | The importance page: the most valid interest this row really speaks to. | `DEFIMP = 0.5`, the neutral start. Not a penalty; the absence of a claim either way. | The magnitude of (A - D) |
| Uniq | 0 to 1 | The uniqueness page: does this row make a point some other row has not already made? | `DEFUNIQ = 1`. Presumed distinct until someone argues the overlap. | U |

The constants are one dictionary, `CONSTS = {'K': 1, 'UNARG': 0.5, 'DEFLINK': 1, 'DEFIMP': 0.5, 'DEFUNIQ': 1}` (score_reference.py line 34), and every belief page prints them in grey so a reader can see which factors are still resting on a presumption. The published explanation is [method.html#constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants).

The two differences from the draft's formula:

**First, Truth enters as (2 × Truth - 1), not as Truth.** A claim argued down to 0.2 does not contribute a little; it contributes *negatively*, against the side that filed it. Ten refuted reasons to agree weaken a belief instead of padding it. The draft's "if the data for Argument A is debunked, its score drops to zero" is gentler than what runs: in the published engine a debunked reason goes below zero and counts for the other side. The worked example further down shows the numbers.

**Second, Confidence is a factor.** The drafts do not have it. In the published site each page's confidence comes from seven structural components with these weights (confidence.py lines 31 to 37): grounding 0.30, two_sided 0.20, scrutiny 0.20, breadth 0.15, depth 0.05, sourcing 0.05, testability 0.05. Components a page's shape cannot carry are dropped and the rest renormalised. The wiki's seven behavioural signals (up and down votes, weekly visitors, dwell time, edit frequency, duplicate submission attempts, evaluation responses, score variance over time) are listed in the same file as `BEHAVIOURAL` with weight 0 and reported as "no data" rather than scored as zero. The bands are `established` 0.75, `developing` 0.45, `early` 0.15. Full page: [[Confidence Stability Scores]]; published explanation: [method.html#confidence](https://myklob.github.io/ideastockexchange/beliefs/method.html#confidence).

The draft's "group semantically similar arguments" for Uniqueness is half built. The multiplier is argued (a uniqueness page), not computed. What is computed is a flagger: [similarity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) measures Jaccard overlap of content words and cosine over character 4-grams, both weighted by inverse document frequency over the corpus, with `FLAG = 0.45` (worth a human reading the pair) and `MERGE = 0.70` (near-identical wording). It has no language model and no network. Its own docstring says why it moves no score: "w_ces is read from a VCA page when one exists and is 0 when none does, which is the same rule as everything else here: an input nobody has argued counts nothing." An equivalence page that scores at least `EQUIV_MERGE = 0.9` (render_site.py line 40) lets the shorter wording stand in for a page in breadcrumbs and index columns; it still weights no row. The Next.js app goes further and does discount: `calculateBeliefEquivalencyScore` in [all-scores.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts) blends `0.4 × mechanical + 0.6 × semantic`, calls a pair mechanically equivalent at `MECHANICAL_THRESHOLD = 0.85`, and bands the result at 0.90 (identical), 0.70 (near-identical), 0.45 (overlapping) and 0.20 (related). That is the app's grouping aid; its row multiplier is `uniquenessScore ?? 1.0` in `scoreArgument`.

## Belief Score

The **Belief Score** is the primary output of ReasonRank, in the sense the live page meant: the one number a page's rows add up to. It continuously updates based on the performance of multiple sub-scores, including truth scores, linkage scores, equivalency scores, logical fallacy penalties and evidence verification. **Purpose:** reflect the current best estimate of a belief's validity given all available arguments and evidence.

Each of those five sub-scores has a real status now, and two of the five are not what the live page says.

| Sub-score the live page lists | Status | What runs |
|---|---|---|
| Truth scores | Built | The claim's own page truth, `UNARG = 0.5` when it has no page. Static site: argued truth is `(POS + w × p0) / (POS + NEG + w)`, then capped by the weakest load-bearing component (score_reference.py lines 207 to 209). Next.js: `calculateTruthScoreBreakdown` in all-scores.ts takes `logicalValidity = proWeight / (proWeight + conWeight)` with `weight = truthScore × (1 - fallacyPenalty)`, clamped to [0.01, 0.99], then averages it with the verification half. This used to average every argument regardless of side, so one strong objection took a belief from 0.600 to 0.775; the fix is pinned by `tests/unit/core/scoring/all-scores.test.ts`. |
| Linkage scores | Built, two ways | Static site: `Link` is the truth of a linkage page, else `DEFLINK = 1`. Next.js `resolveLinkageScore` priority chain: a LinkageDebate scored `(A - D) / (A + D)` in [-1, 1] with 0.0 when it has no arguments; else the weighted mean of community linkage votes, clamped to [-1, 1]; else the static field. `calculateLinkageFromArguments` separately gives `A / (A + D)` in [0, 1] with 0.5 when empty. The diagnostic wizard maps proof 1.0, strong 0.8, context 0.5, weak 0.2, and 0.0 ("NON_SEQUITUR") when the answer to "is it relevant at all?" is no. Three defaults, three answers (1, 0.0, 0.5) to the question "what does an unargued link transmit?" |
| Equivalency scores | **Replaced by uniqueness** | No engine multiplies a belief score by an equivalency score. The redundancy factor is the uniqueness multiplier (`uniq_id` / `DEFUNIQ = 1` on the site, `uniquenessScore` default 1.0 in the app). Equivalence pages exist as their own page kind, shown as "Equiv" in each page's Similar Beliefs table and used to choose a merge candidate at 0.9. The wiki's blend `ES = w_ces × CES + w_ues × UES` is built with `w_ces = 0` until a validity comparison argument page exists. |
| Logical fallacy penalties | **Refused by design on the published site; partly built and unwired in the app** | The published site does not deduct for a fallacy. Structural Checks on every page say: "None of these changes a score. A flag is a question, not a verdict" (render_site.py lines 1030 to 1037). [fallacy.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) flags reasons by a short published phrase list (Attacking the person, Appeal to popularity, Appeal to authority, Slippery slope, False choice, Sweeping generalization, Appeal to tradition, Pointing at the other side), says which words set each flag off, and opens two prefilled forms on the flagged claim's page: a reason to disagree saying it is the fallacy and a reason to agree saying it is not. Whatever that argument concludes moves the claim's truth through the ordinary rules; the flag never does. [integrity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) adds shape faults (circular support, a conclusion among its own premises, the same page counted twice) and refuses to score a corpus containing a loop. In the Next.js app, `scoreArgument` does compute `baseTruth = truthScore × (1 - Σ|impact|/100)`, and [claims.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/claims.ts) has a validity ladder (`VALIDITY_NO_FALLACY` 0.95, `VALIDITY_MINOR` 0.75, `VALIDITY_MAJOR` 0.45, `VALIDITY_MULTIPLE` 0.25) and a bridge `confirmedClaimsToDetectedFallacies`, but that bridge is called by nothing outside its test, so the penalty path does not reach the live belief page. What does reach a number: a fallacy accusation confirmed at `CONSENSUS_THRESHOLD = 0.6` weighted agreement with `CONSENSUS_QUORUM = 3` ([consensus.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/consensus.ts)) publishes a counter-argument of strength 0.8 (major) or 0.5 (minor) into the target's linkage sub-debate, where it is scored like any other argument. [fallacy-detector.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/fallacy-detector.ts) opens with the rule: "A fallacy detection is an argument, not a penalty... no score is ever docked because a detector fired." The owner's direction (October 2026) is the same: software may flag, a flag is argued like any claim, and a flag alone moves no score. So read "penalty" on this page as **proposed and not in any published scoring path**. |
| Evidence verification | Built, as a starting point rather than a multiplier | See "Where a page starts" below. The wiki's own `Overall EVS = ESIW × ECRS × ERQ × (ERP/100)` is still computed by `evs()` in evidence.py and printed on every Evidence Ledger; no score reads it. |

### What the Belief Score is, numerically

On the published site the belief score is **POS - NEG**, open-ended and signed (score_reference.py lines 21 and 210). POS is the sum of every row whose signed contribution came out positive and NEG the magnitude of every row that came out negative, from either side of the table: a refuted objection counts as support, a refuted reason counts against. It is the number the Best beliefs list ranks by ("Belief score is the weight for minus the weight against", render_site.py `render_best`). The method page is blunt about what it is: "a quantity of argued weight, not a probability, and comparing it between a page with forty rows and a page with four is comparing volumes."

But it is not the number in the heading. The badge beside every claim on the published site is the **truth score**, and it is what every parent row reads:

**truth, argued = (POS + w × p0) / (POS + NEG + w)**
**truth, published = min(truth argued, the smallest truth among load-bearing components that have a page of their own)**

p0 and w are where the page starts and how heavily (next section). The cap is the second line: a page may list components it needs to be true and mark some load-bearing (`lb = Y`), and a conclusion cannot be more settled than a premise it needs. That is the mechanism behind the [[Assumptions]] page.

The Scoring Engine table on every published page prints, in this order: Argument score (pro - con), Evidence score (supp - weak), Prediction contribution, Belief score (the three added), Positive total, Negative total, Starting point, Weight of the starting point, Truth score argued, Truth score, then the second rule's five lines (Independent reasons for, Independent reasons against, Weight for counting every reason, Weight against, Share for), then Relied on (ReasonRank), Work value, Complete, and whether both sides have reasons (`engine_table` in [render_site.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)). Every number is also exported as `<key>.json` beside the page.

In the Next.js app there is no quantity called Belief Score. `scoreProtocolBelief` returns `truthScore = ProRank / (ProRank + ConRank)`, 0.5 when there are no arguments, plus an evidence term `(supporting - weakening) / count × 0.2` (tier weights are at most 1.0, so the term is bounded by ±0.2), clamped to [0.01, 0.99]; `argumentScore = proRank - conRank` rides along as a secondary field. Its evidence tiers are four, not eighteen: `T0` 0.05 (retracted), `T1` 1.0, `T2` 0.75, `T3` 0.5, `T4` 0.25, unknown tier 0.5; and its `calculateEVS = ESIW × log2(ERQ + 1) × ECRS × ERP`, a logarithm in ERQ where the wiki and the static site are linear. The app's stored impact scale is `computeArgumentImpactScore = sign × childTruth × |linkage| × importance × uniqueness × 100`, rounded to one decimal, and its importance can be derived from an importance sub-belief by `importance = (overallScore + 100) / 200`, so +100 is 1.0, 0 is 0.5 and -100 is 0.0. An argument's contribution at depth can also be halved per level, `attenuated = score × 0.5^depth` (`applyDepthAttenuation`); the static site has no depth term at all.

### "Continuously updates" and "current best estimate"

Two phrases from the live page need qualifying.

*Continuously updates.* The static site stores no scores. Every number is recomputed from the two tables at build time (`Model` keeps a per-build memo and nothing else; every Scoring Engine table says "Every value here is computed from the tables above at build time"), so it updates per revision, and [changes.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/changes.py) reports what moved since the last one. The Next.js app persists `truthScore` and `impactScore` in Prisma and recomputes upward on each mutation (`propagateFromArgumentChange` and `propagateFromLinkageChange` in [propagate-belief-scores.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts)), which is the closest thing to continuous.

*Current best estimate of validity.* The published method page disclaims this in its limits list: "A truth score is not a probability. It is a share of argued weight around a starting point. It has the shape of a probability and does not have the calibration of one. Nothing here has been checked against outcomes." The Next.js engine's own docstring claims the opposite, the PageRank probability interpretation ("the probability that a random walker following the argument graph lands on a pro-conclusion"). This page sides with the method page because it is the one that has been honest about calibration: nobody has yet checked these numbers against the world. Treat the estimate wording as the goal and the disclaimer as the status.

## Where a page starts, and why it has to start somewhere

This is the part of the engine the drafts did not have and the part everything else depends on. It lives in [evidence.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py) and is explained at [method.html#starts](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts).

Start with the arithmetic. A row contributes (2 × Truth - 1). A page with no rows reads 0.50, so (2 × 0.50 - 1) = 0, so it contributes nothing, so every page above it reads 0.50 too. By induction, **every page of an argument graph in which nothing is cited reads exactly 0.50, forever**, however many reasons are listed and however cleverly they are argued. Reasoning about reasoning never touches the world. The test that pins this is `test_argument_alone_can_never_leave_the_neutral_point` in [test_engines.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py): it builds unsourced chains of 2, 5 and 40 pages with confidence forced to 1 and asserts truth 0.5 and belief score 0.0 at every one. If that test ever fails, something has been added that lets a score move without evidence, and that needs a reason, not a fix to the test.

What touches the world is evidence. A page may declare three typed fields, and they set where its truth starts before any of its own rows count:

| Field | What it is | The wiki's name |
|---|---|---|
| `etype` | How far that kind of source can move the claim: a published statistic outranks an eyewitness | ESIW, Evidence Source Independence Weight |
| `erq` | How many independent replications exist: one study is a finding; four is a fact | ERQ, Evidence Replication Quantity |
| `erp` | What share of them agreed: four studies that disagree are not four studies | ERP, Evidence Replication Percentage |

**prior p0 = 0.5 + 0.5 × ESIW × (2 × ERP/100 - 1)**
**weight w = k × 2 × ERQ / (ERQ + 1)**, with k = 1 and the replication reward capped at `REP_CAP = 2.0` × k
**truth = (POS + w × p0) / (POS + NEG + w)**

Read the prior at its corners (calculation from the formula): a published statistic (ESIW 0.90) that every replication confirms starts at 0.5 + 0.5 × 0.90 × 1 = **0.95**; the same statistic that every replication contradicts starts at **0.05**; an eyewitness account (0.20) confirmed starts at **0.60** and contradicted at **0.40**; anything at half agreement starts at **0.50** whatever its tier, because a contested literature has established nothing; a page naming no source has ESIW `NOSOURCE = 0.0` and stays at 0.50 however many times it is cited. The strongest tier is 0.90, so p0 is confined to [0.05, 0.95] and evidence alone never drives a claim to certainty. Getting the last twentieth takes an argument, on a page.

The weight line rewards replication but refuses to let it close the question: `replication(n) = 2n / (n + 1)` gives 1 → 1.00, 2 → 1.33, 3 → 1.50, 10 → 1.82, limit 2.00. At k = 1 even the strongest prior is within reach of one well-argued objection. Absent fields read ERQ = 1 and ERP = 100; ERQ below 1 reads as 1; ERP is held inside 0 and 100 (a typo of 150 would otherwise give a starting truth of 1.40). These coercions are part of the published contract, and an SQL port once passed every other check while returning that 1.40.

The eighteen tiers, from the wiki's sixteen plus one addition, as evidence.py carries them:

| Key | Weight | Wiki rank | What it covers |
|---|---|---|---|
| statistics | 0.90 | 1 | Statistics and data, with the source cited |
| record | 0.90 | (added) | Primary official record: statute, judicial holding, agency rule, sworn filing |
| rct | 0.85 | 2 | Formal scientific study: randomized controlled trial |
| meta | 0.80 | 2 | Formal scientific study: meta-analysis |
| observational | 0.75 | 3 | Observational or correlational study |
| historical | 0.70 | 4 | Historical trend, with references |
| expert_data | 0.65 | 5 | Expert testimony with supporting data |
| expert_claim | 0.60 | 6 | Expert or social media claim |
| anecdote | 0.55 | 7 | Personal experience or anecdote |
| logic | 0.50 | 8 | Common sense or logic |
| analogy | 0.45 | 9 | Analogy or metaphor |
| norm | 0.40 | 10 | Cultural norm |
| intuition | 0.35 | 11 | Intuition or gut feeling |
| news | 0.30 | 12 | News or media report |
| survey | 0.25 | 13 | Survey or poll |
| eyewitness | 0.20 | 14 | Eyewitness testimony |
| visual | 0.15 | 15 | Visual evidence |
| artifact | 0.10 | 16 | Historical artifact |

Two auditor's notes from the file. The wiki gives rank 2 as one band, "0.85-0.80", over RCTs and meta-analyses; the split follows their listed order and read the other way would be 0.80 / 0.85. And the wiki has no row for a primary official record, which for policy work is most of the record; `record` is the addition, weighted with statistics because its existence is not in dispute. Drop it and those rows fall to unclassified. The earlier ReasonRank wiki page's four start values (meta-analysis 1.0, peer-reviewed study 0.8, anecdote 0.1, refuted evidence 0.0) are a different list and are listed on the method page as a rule the site does not run.

Source quality is deliberately **not** a multiplier on the row. It belongs to the claim, not to the place the claim is cited, and the same finding cited on four pages has one truth. How much a finding bears on a particular conclusion is the linkage page, which is the wiki's ECRS; putting source quality on the edge as well would count it twice. And classify what the claim *says*, not the instrument that produced it: "58 percent of Americans told a pollster X" is a published statistic; "Americans believe X" inferred from the same poll is survey evidence.

**Where the owner's direction differs.** The owner prefers an evidence weight with no ceiling, so a body of replicated work can outweigh opinion by 15 or 200 times. The truth score's weight is capped at 2k on purpose (the file calls uncapped replication "how a score gets padded"). The owner's rule is built beside it rather than instead of it: [tally.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) weighs a finding at `Truth × Linkage × Importance × Uniqueness × (1 + ESIW × ERQ × ERP/100)`, uncapped. Both numbers print on every belief page so they can be compared on real pages before either leads; see "Counting every reason" below and [method.html#tally](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally).

## Example: The Logic Cascade

The owner's draft, verbatim:

**Conclusion:** "Solar energy is cost-competitive with fossil fuels"

- **Supporting Argument A:** "Solar costs decreased 90%." (High Weight)
  Calculation: 85 (Evidence) × 0.8 (Linkage) × 0.9 (Impact) = **+61.2**
- **Supporting Argument B:** "Installation is cheaper." (Low Weight due to 70% overlap with A)
  Calculation: 75 × 0.7 × 0.6 × 0.3 (Uniqueness) = **+9.45**
- **Current Total: +70.65**

**The Power of ReasonRank:** If the data for Argument A is debunked, its score drops to zero. Because the system is a Network Logic, the final conclusion score immediately collapses to +9.45. The system stays current automatically as new evidence appears.

Now the same two arguments through each of the rules that actually run. Every number below is a calculation from the formulas quoted on this page, with Confidence taken as 1 for both claims so the comparison is about the rules and not the work behind them.

**The owner's arithmetic is tally.py's rule.** `Truth × Linkage × Importance × Uniqueness` with truth out of 100 gives A = 0.85 × 0.8 × 0.9 × 1 = 0.612 and B = 0.75 × 0.7 × 0.6 × 0.3 = 0.0945, total 0.7065: the draft's 61.2, 9.45 and 70.65 divided by 100. Tally's share for the conclusion, starting from the neutral vote (p0 0.5, w 1), is (0.7065 + 0.5) / (0.7065 + 1) = **0.707**. Debunk A to truth 0 and it weighs 0; the share falls to (0.0945 + 0.5) / 1.0945 = **0.543**. That is the draft's cascade, exactly.

**The published truth score (score_reference.py).** A contributes +1 × (2 × 0.85 - 1) × 1 × 0.8 × 0.9 × 1 = **+0.504**; B contributes (2 × 0.75 - 1) × 0.7 × 0.6 × 0.3 = **+0.063**. POS 0.567, NEG 0, belief score **+0.567**, truth argued (0.567 + 0.5) / (0.567 + 1) = **0.681**. Now debunk A, which here means its own page is argued down to truth 0. It does not drop to zero: (2 × 0 - 1) = -1, so A contributes -1 × 0.8 × 0.9 = **-0.72**, against the side it was filed on. POS 0.063, NEG 0.72, belief score **-0.657**, truth (0.063 + 0.5) / (0.063 + 0.72 + 1) = **0.316**. The conclusion does not fall back to B's level; it is now argued *against*, because listing a refuted reason is evidence of a weak case. If instead A's page is merely unargued (0.5), A contributes 0 and the conclusion reads (0.063 + 0.5) / 1.063 = **0.530**.

**The Next.js ratio (scoring-engine.ts).** Leaf arguments have RR equal to their truth, so A's `rawImpact` = 0.85 × 0.8 × 0.9 × 1 = 0.612 and B's = 0.0945; ProRank 0.7065, ConRank 0, so `truthScore` = 1.0, clamped to **0.99**. Debunk A and ProRank is 0.0945, ConRank still 0, truth still **0.99**. With nothing on the con side the ratio cannot say anything but "all pro", which is the volume disagreement in one line.

**A real page.** The build checked into the repository (revision cb8d1bc, 26 September 2026; the live site has grown since) scores the belief [Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html) at weight for 0.419, weight against 0.096, belief score +0.323, truth argued 0.607, truth published **0.50**. The gap is the load-bearing cap: the page cites 7 findings but 3 of its load-bearing premises cite nothing, and a conclusion cannot be more settled than a premise it needs. Its Structural Checks say so on the page ("Evidence filed above the premise it bears on"). Its ReasonRank is 0.1295, place 1 of 315 pages, confidence 68%, work value 0.0411. That is the engine behaving as designed, and it is also the reason most published beliefs read 0.50, which the owner's direction on volume is meant to address.

## Argument Ranking Algorithm

The live page offered this Python sample, ranking arguments by pro and con votes times evidence strength.

<details><summary>Original sketch (2023), not what runs</summary>

```python
def rank_arguments(arguments):
    """
    Ranks arguments based on pro/con votes and evidence strength.
    arguments: list of dicts with 'pro_votes', 'con_votes', 'evidence_strength'
    """
    for arg in arguments:
        total_votes = arg['pro_votes'] + arg['con_votes']
        if total_votes == 0:
            pro_score = con_score = 0
        else:
            pro_score = arg['pro_votes'] / total_votes
            con_score = arg['con_votes'] / total_votes

        # Strength score: assumed to be between 0 and 1
        strength_score = arg['evidence_strength']

        # Overall argument score
        arg['score'] = (pro_score - con_score) * strength_score

    # Sort arguments from strongest to weakest
    return sorted(arguments, key=lambda x: x['score'], reverse=True)
```

</details>

What runs instead is the signed row contribution `sign × (2 × Truth - 1) × Conf × Link × Imp × Uniq` in `score_reference.py`, and no engine ranks by votes. Item by item against the sketch: the vote share `pro_score - con_score` (a number in [-1, 1]) is replaced by `(2 × Truth - 1)` of the claim's own argued page, also in [-1, 1]; the single `evidence_strength` in [0, 1] is replaced by four argued multipliers (Conf, Link, Imp, Uniq) and by the evidence prior on the claim's page; and the one property that survives, "no votes means score 0", survives by a different mechanism: an unargued claim at `UNARG = 0.5` contributes exactly 0. "Strength score: assumed to be between 0 and 1" holds on the static site, where every multiplier is a truth score or a constant in that range; it does not hold in the Next.js app, where `scoreLinkageDebate` and the wizard return linkage in [-1, 1] and a negative linkage flips the row, which is why `computeArgumentImpactScore` takes `|linkageScore|` so that only the side controls direction.

Every per-row table on a belief page sorts by that score, descending, with unscored rows last and the top rows shown and the rest collapsed (Rule 8 of the belief page rules; `byScoreDesc` and `TABLE_TOP_LIMIT = 5` in [ranking.ts](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/lib/ranking.ts) for the app; `side_order` in render_site.py for the site).

### Votes: shown, never scored

The owner's direction (October 2026): there are many scores. Track what is popular separately from what stands up to analysis. Votes may decide what is promoted and given attention, never what is valid, and the gap between the two is worth showing because it says where people need more time with the argument.

The published site does exactly this. Anyone with a GitHub account can vote agree or disagree on a claim through a prefilled issue form; [intake.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) records it in `content/votes.csv`, one row per (page, on, login), latest wins. A reason or finding can also be voted on *as an argument*: yes or no to whether it bears on the page it sits on, counted apart from votes on whether it is true. The counts sit on the claim's heading line after the truth score badge with the note "Votes are shown as what people think, next to what the analysis says, and never move a score" (`VOTE_NOTE`, render_site.py line 1631). A home-page card, [Votes vs the analysis](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes), ranks the gap between the share of votes to agree and the truth score, widest first, once three or more people have voted on a claim. The method page's limits list says the rest: "No vote enters any number here: every score comes from the structure of the argument and from what pages cite... a score is not a measure of what anyone believes."

A submission that duplicates an existing claim (similarity at or above `MERGE`) is counted as the submitter's vote for the claim already there, and [contribute.js](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) checks as the reader types against `data/claims_index.json` so a duplicate becomes a vote before it is ever filed.

One exception, in the app only: `aggregateLinkageVotes` in scoring-engine.ts is priority 2 of `resolveLinkageScore`, a reputation-weighted mean of linkage votes clamped to [-1, 1], used when an edge has no LinkageDebate. So in the Next.js app a vote can set one edge's linkage multiplier until somebody opens the debate. The published site has no such path.

### Counting every reason until it is argued down

The owner's direction on volume: for belief strength, start from the quantity of truly independent reasons to agree and disagree, rank how valid they are against each other, and let the weight of pro against con decide. Contributions count from the moment they are posted and are argued down from there; a rule under which work counts for nothing until someone proves it tells contributors their effort is wasted. For choices of action the question is different: costs and benefits across every stakeholder with a legitimate interest, the quantity and the quality of interests met, under different assumptions about which interests are valid.

[tally.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) is that starting rule, printed on every belief page beside the truth score and read by no other number:

| Quantity | Rule |
|---|---|
| A reason or a prediction weighs | Truth × Linkage × Importance × Uniqueness |
| A finding weighs | the same × (1 + ESIW × ERQ × ERP/100), its uncapped evidence strength |
| Independent reasons on a side | the sum of Uniqueness over its reasons: two reasons that say the same thing count as one once a uniqueness page says so |
| Share for | (weight for + w × p0) / (weight for + weight against + w), the same starting vote the truth score uses, so one unanswered reason moves a page part of the way and not to certainty |

What it keeps from the argued rule: every factor is read from a page or a labelled constant, so a reason argued false weighs nearly nothing and a duplicate argued redundant adds nearly nothing. What it drops: the (2 × Truth - 1) that makes an unargued reason worth exactly zero, and the confidence gate that zeroes a row whose own page has no work behind it. Those two are why nearly every argued truth score in the corpus reads 0.50. A vote enters neither rule. The argued rule and its pinned test are unchanged until the two have been compared on real pages; that comparison is the owner's call.

## ReasonRank proper: how much depends on a claim

PageRank does not ask whether a page is correct. It asks how much of the web's attention arrives there. The argument analogue asks how much of the corpus's conclusion-weight flows *through* a claim: not "is this true" but "how much depends on it". A claim can be perfectly true and matter to nothing, and a claim can be undecided and hold up four separate policy conclusions at once. Nothing else on the site can tell those two apart. [reasonrank.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py) does, and its docstring opens with the promise "Nothing in this file changes a truth score."

**The walk.** Start at the beliefs, spread evenly. From any page, step to one of the pages it reads, choosing among its rows in proportion to how much each row can transmit:

**capacity(row) = Link × Imp × Uniq**

Two things are deliberately absent from that product. The truth score of the claim the row points at, because capacity is how much the row *could* carry once that claim is settled either way, and a ranking that fell when a claim was refuted would be measuring agreement rather than dependence. And confidence, because a page nobody has started work on is exactly the page this ranking exists to find. The multipliers are not absent, and they are themselves truth scores: a linkage page argued down to 0.2 really does transmit less, whatever happens to the claim. A row's capacity is split evenly among the pages it reads, because each factor of a product is equally load-bearing. With damping d the walk restarts at the beliefs with probability 1 - d, which keeps the ranking anchored to the conclusions people actually want decided instead of drifting into whatever corner of the graph is densest; mass that reaches a page with no rows goes back to the beliefs.

The constants (reasonrank.py lines 49 to 51): `DAMPING = 0.85` (PageRank's own), `ITERATIONS = 2000` (a cap the walk never reaches), `TOLERANCE = 1e-12` (where it actually stops), and the residual is published. The method page reports the live residual at [method.html#reasonrank](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank). The earlier wiki sample's `num_iterations = 100` and the `iterations = 100` in docs/ALGORITHMS.md match neither this (2000 cap, tolerance stop) nor the app (no iteration at all); the method page lists "ReasonRank restarting evenly across every argument" as a wiki rule the site does not run, because the walk restarts at the beliefs only.

**What it is for.** Rank alone names what matters. Rank against confidence names what to do:

**work(page) = rank × (1 - confidence)**

High rank and finished work is a settled foundation. High rank and unfinished work is the next thing an analyst should spend a week on, and there is usually a short list of those holding up everything else. Every page's Scoring Engine table prints "Relied on (ReasonRank)" as a share of the site with its place out of all pages, and "Work value"; the heading area prints how many beliefs the page sits beneath and how many pages read it (`rank_note`). The home page carries a "Relied on" column and a "Work value" column, and the beliefs themselves are left out of the work queue, because "argue the conclusion" is not a plan. Six tests pin the behaviour in test_engines.py: the walk is a distribution, it converged, no page outranks the beliefs it starts from, rank ignores the truth of the claims it ranks, rank does follow a multiplier that is argued down, and rank ignores confidence entirely.

**The app's counterpart** is Decision Leverage ([decision-leverage.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts), section 1c on the app's belief page, `/leverage` for the corpus-wide queue, `/api/leverage` as JSON). It ranks argument edges by the conclusion score still at stake on each one: `weight(e) = |linkage| × importance × uniqueness × DEPTH_ATTENUATION^depth` (the engine's impact formula with truth factored out, so weight × 100 is the derivative of impact with respect to truth), times `openRange(e)`, a weighted shortfall across four resolution gaps (evidence 0.40, from one minus the grounding score; linkage 0.25, as 1/√(1 + votes) in the edge's sub-debate; scoring 0.15, 1 when the child has no score; examination 0.20, as 1/√(1 + min(support, opposition))), with `leverage = weight × openRange × 100`, an upper bound on movement, not a forecast. Same question as the work queue, asked per edge rather than per page.

**The app's "ReasonRank" number** is the third thing under the name. In `scoreArgument` (scoring-engine.ts, `DAMPING_FACTOR = 0.85` at line 58): a leaf's `reasonRank` is its `baseTruth`; for an argument with sub-arguments, `proSubRank` and `conSubRank` are the sums of the sub-arguments' `rawImpact`, `normalizedNet = (proSubRank - conSubRank) / count`, `subArgScore = 0.5 + 0.5 × normalizedNet`, and

**reasonRank = (1 - 0.85) × baseTruth + 0.85 × subArgScore**
**rawImpact = reasonRank × linkage × importance × uniqueness**

It is a blend, not an iteration: there is no fixed-point loop. The test file works examples such as `RR = 0.15 × 0.6 + 0.85 × 1.0 = 0.94` and `RR = 0.15 × 0.8 + 0.85 × 0.05 = 0.1625`. The app's explainer is `/algorithms/reason-rank` ([page source](https://github.com/myklob/ideastockexchange/blob/master/src/app/algorithms/reason-rank/page.tsx)); the full matrix form with `d = 0.85` lives in [[ReasonRank: Google's PageRank for Arguments]].

## Technical Integration

The owner's draft closes its mechanics with three lines. Each has a status.

- **Linkage Propagation: Scores flow through the entire graph.** Built. On the static site nothing is stored, so a change anywhere is a change everywhere at the next build, and [sensitivity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py) uses the same fact to answer "which single input, if it moved, would change the answer?": it pins one page's truth, clears the memo, reads the belief again, and finds the flip point (a truth crossing `FLIP = 0.5`) by bisection to `STEPS = 16` (about 1.5e-5), with `INERT = 0.005` as the line below which an input moves nothing visible. It reports two columns, "Moves it now" (confidence as it stands) and "Moves it if settled" (confidence held at 1); the gap between them is the value of doing the work. It is one-at-a-time analysis and the page says so: it finds single points of failure and not three inputs each moving a little in the same direction. Explained at [method.html#sensitivity](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity). In the app, propagation is `propagate-belief-scores.ts`.
- **Objective Criteria: Measurable standards for evaluation.** Built as content, typed rather than computed. The `criterion` edge section feeds every belief page's Objective Criteria table and the topic pages' equivalent; the four labels on each criterion are typed by an author (listed under `TYPED_INPUTS` in render_site.py), and "objective criteria" is one of the seven parts of the completeness bar below. The app's explainer is `/algorithms/objective-criteria`. No score reads a criterion.
- **Bias Detection: Algorithms identify systematic reasoning errors.** Proposed, and deliberately replaced by two things that move no score. Each belief page has Biases tables (`bias_sup` and `bias_opp` sections), which are argued rows, not detections. What software does is the structural checks of integrity.py (circular support, a conclusion among its own premises, double counting, each naming the rows that caused it) and the phrase flags of fallacy.py, both as questions with a form to argue them. An algorithm that deducts from "the strongest claim in the corpus, silently, with no page to appeal to, is worse than no check" (integrity.py's own words). The owner's direction agrees: flag, argue, never deduct by flag.

## Transparency

- **Every component of the score is public and open to challenge.** Built. Every multiplier is a page id (`link_id`, `imp_id`, `uniq_id`, `drives_id`, `equiv_id`, `bearing_id`, `who_id`) or a labelled constant printed in grey, so each factor can be opened and argued. The method page is honest that some inputs are typed rather than argued: the evidence classifications (source type, replications, share agreeing), cost and benefit magnitudes and their ranges, the supporters' and opponents' value rankings, the four labels on each objective criterion, the load-bearing flag on a premise, a claim's position on its topic's axis, and the one-sentence bottom line. "Every other number is derived from the tables; these are not, so treat them as an author's judgement with an author's error." The wiki's EVS page says the evidence category should itself be debated pro and con; the site types it and names that as a limitation.
- **Users can see exactly how each argument influences the overall belief score.** Built. The Argument Trees print Truth, Conf, Link, Imp, Uniq and the signed product for every row ("every column is here so the row can be multiplied out and checked"), the Scoring Engine table prints the totals, the sensitivity sweep names which input would flip the conclusion, ReasonRank names what rests on the page, and `<key>.json` carries all of it as data. The app adds an impact-provenance page per argument at `/arguments/[id]/score` and the linkage sub-debate at `/arguments/[id]/linkage`.
- **Algorithms are linked across the wiki so the scoring process is auditable.** Replaced. The built site no longer sends readers to this wiki for method: every rule link on it points at a section of its own [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html) ("a built site carries its whole methodology and depends on nothing outside it", `WIKI` table in [build_pages.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/build_pages.py)), and the app has its own index at `/algorithms`. Auditability is now a contract: [conformance.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py) publishes a corpus of twenty-four pages built to exercise every rule at least once, their expected numbers, the five constants and the eighteen tiers as `conformance_corpus.json` and `conformance_expected.json`, so an implementation in any language can be held to the same rules without reading this repository. Compare to 1e-9. `python3 conformance.py` checks the engine of record; `python3 conformance.py --write` rebuilds the expected file after a deliberate rule change, which then needs a reviewed diff. CI runs the whole test suite before it publishes anything.

### What a published belief must have

Rankings rest on completeness, so the bar is worth stating. A belief is **complete** when it has all seven of `publish.CORE_BAR` ([publish.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/publish.py)): reasons to agree, reasons to disagree, evidence, objective criteria, testable predictions or a falsifiability test, costs and benefits, and interests on either side. Complete beliefs come first in every ranking. Every other belief is a **draft**, still published, with a draft mark in lists and on its own heading line saying what it still needs, and listed in `data/drafts.json`. The owner's standing rule: every belief in the tables is published however far along it is, and no drafted argument, reason or analysis is ever deleted. Improve a weak page by adding to it or by ranking it lower, never by removing it.

## Where the engines disagree

These are the places the live page, the owner's draft, the published site and the app do not all say the same thing. The owner's direction (October 2026) governs where the old page and the code disagree; where the code itself is split, the split is named and left for the owner.

| Question | Published site (tools/static-site) | Next.js app (src/core/scoring) | Owner's direction |
|---|---|---|---|
| Does volume count? | No, in the truth score: an unargued row contributes 0, pinned by test. Yes, in the tally printed beside it. | Yes: `ProRank / (ProRank + ConRank)` over stored truth scores, so listing an unargued reason raises the score. | Count truly independent reasons from the moment they are posted and argue them down; compare the two rules on real pages before either leads. |
| Do votes move a score? | Never. Shown on the heading line and ranked against the truth score once three people have voted. | One path: reputation-weighted linkage votes set an edge's linkage when no debate exists. | Attention, never validity; show the gap. |
| Fallacies | Flagged by phrase list, argued on the claim's page, no deduction. | Accusation confirmed at 60% with quorum 3 becomes a scored counter-argument (0.8 / 0.5); the validity ladder and the `scoreArgument` penalty branch exist but are not wired to the live page. | Software may flag; nothing is final; a flag moves no score. |
| Unargued linkage | `DEFLINK = 1`: trust first, burden on the challenger. | 0.0 for an empty LinkageDebate, 0.5 for empty simple linkage arguments. | Start trusting and lower it when argued down; a link argued well must rise; any sensible starting guess is acceptable. |
| Evidence weight | Capped: w at most 2k. | Four tiers, log2 in replications, evidence term bounded by ±0.2. | No ceiling; tally.py's `ESIW × ERQ × ERP/100` uncapped is the starting rule. |
| Equivalency | A flag and a merge candidate; `w_ces = 0`; uniqueness is the multiplier. | Computed blend 0.4 / 0.6 with bands 0.90 / 0.70 / 0.45 / 0.20 as a grouping aid; uniqueness default 1.0 as the multiplier. | (not addressed) |
| What the number means | "A share of argued weight around a starting point," not a probability. | "The probability that a random walker lands on a pro-conclusion." | (not addressed; nothing has been checked against outcomes) |

The repository's own guidance is that adding a further engine is the wrong move: if the page/edge model wins, migrate the app onto it and delete the loser; if it does not, delete the proposal. The owner asked not to be asked these questions again at this level of detail: know the goals and build toward them, and prefer publishing a rule beside the current one and comparing them on real pages over replacing a rule unseen.

## Ready for Better Thinking?

Explore the Argument Structure at [[Argument Scores from Sub-Argument Scores]] and on the [live site](https://myklob.github.io/ideastockexchange/beliefs/index.html), where every card and column that ranks links to [what it shows and how it is worked out](https://myklob.github.io/ideastockexchange/beliefs/lists.html), or help us build the future of rational debate.

[View the Code on GitHub](https://github.com/myklob/ideastockexchange) | Contact the Project Lead (every belief page carries a form that opens a GitHub issue; that is also how to reach the project)

## See Also

- Evidence Verification Score: [[Evidence Verification Score (EVS)]]
- Logical Fallacy Score: no wiki page by that name exists and no module computes one. The nearest living things are the fallacy catalog at [src/lib/fallacy/catalog.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/catalog.ts), the app's `/algorithms/fallacy-detection` explainer, and the phrase flags in [fallacy.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py); the fallacy half of [[Truth Score]] covers the history.
- Equivalency Score: [[Equivalency Score:]] and [[The Redundancy Problem]]
- Evidence-to-Conclusion Linkage Score (ECLS): [[Evidence to Conclusion Relevance Score]] and [[Linkage Scores]]
- [[ReasonRank: Google's PageRank for Arguments]], the matrix form and the 2023 sketch
- [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]]
- [[Confidence Stability Scores]] and [[Assumptions]]
- [[Likelihood of Costs and Benefits]] and [[Likely Interests of Those Who Agree and Disagree]], for the choices-of-action half of the owner's direction
- Templates that carry these scores: [[Template: Belief Analysis]], [[Template: Linkage Evaluation]], [[Template: Topic]]
- The published method page, section by section: [the one formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula), [where a page starts](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts), [counting every reason](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally), [confidence](https://myklob.github.io/ideastockexchange/beliefs/method.html#confidence), [sensitivity](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity), [ReasonRank](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank), [rules in the wiki the site does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun), [the constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants), [what this cannot do](https://myklob.github.io/ideastockexchange/beliefs/method.html#limits), [the data](https://myklob.github.io/ideastockexchange/beliefs/method.html#data)
- The corpus this page's real example comes from: [Government ethics](https://myklob.github.io/ideastockexchange/beliefs/t/government-ethics.html)
