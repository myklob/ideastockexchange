# ReasonRank

[[Home]] > Page Design > ReasonRank

This page has carried two subtitles: *ReasonRank: Enlightenment Promotion Algorithm* (the live wiki page, last edited 9 August 2025) and *ReasonRank: The PageRank for Arguments* (the owner's newer draft, never published). Both are merged here, and every mechanism they describe is marked with what the code does today. Where a number or formula is given, its basis is labelled: the code (with its file and line), a calculation, a built page, or the owner's judgment.

## Two questions, two numbers

The live page described ReasonRank this way:

> **ReasonRank** is a network-based scoring algorithm designed to measure the strength of a belief based on the quality of its supporting arguments, rather than its popularity. Just as Google's PageRank revolutionized the web by treating hyperlinks as "votes" for importance, ReasonRank treats logical arguments as votes for a belief's validity.

That pitch asks two questions at once, and the published site answers them with two different numbers:

1. **How strong is this belief?** That is the **truth score** (0 to 1, the badge beside every claim) and the **belief score** (weight for minus weight against). Both come from the scoring rule in [score_reference.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py). The site does not call this ReasonRank.
2. **How much rests on this claim?** That is **ReasonRank** on the published site: a PageRank-style walk in [reasonrank.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py) that measures how much of the site depends on a claim. It reads no truth score, no confidence and no votes, and it changes no score. Its own first lines say so: "Nothing in this file changes a truth score" (reasonrank.py:8).

So on the site **ReasonRank measures reliance, not strength.** A claim can be perfectly true and matter to nothing, and a claim can be undecided and hold up five separate beliefs at once. The truth score cannot tell those two apart; ReasonRank can. The goal the live page set, tying the strength of a conclusion to the strength of the evidence beneath it and showing the math, is carried by the truth score, and this page explains both.

The name is also used, in other parts of the repository, for things that are not published. Here is everything that carries it:

| What carries the name | Where it runs | The question it answers | Status |
|---|---|---|---|
| **ReasonRank, the reliance walk** | [reasonrank.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py) | How much of the site depends on this claim, true or not? | Published: "Relied on (ReasonRank)" and "Work value" on every page, and the Most relied on and What to argue next lists |
| The scoring rule (the old pages' "ReasonRank"; the site's truth score and belief score) | [score_reference.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py) | How true is this claim, given what has been argued and cited beneath it? | Published on every belief page, under the name truth score |
| A damped blend of an argument's own truth with the net strength of its sub-arguments, 15% to 85% | [scoring-engine.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts) in the Next.js app | How strong is this argument, given its sub-arguments? | Runs in the app, which is not published |
| The founding workbook's Conclusion Score | [conclusion-score.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/conclusion-score.ts) | How many reasons each way, plus what their own debates earned? | Unwired reference |
| The page/edge model | [src/lib/ise-pages/](https://github.com/myklob/ideastockexchange/tree/master/src/lib/ise-pages) | The same question as the scoring rule | Unwired proposal |
| `pipeline/` | [pipeline/scoring/reason_rank.py](https://github.com/myklob/ideastockexchange/blob/master/pipeline/scoring/reason_rank.py) | How fit is each argument, for sorting a page? | Unwired standalone tool |

The scoring rule and the app's blend disagree about whether listing an unargued reason moves a score. That disagreement is real, recorded and unresolved; it is covered under "Where the engines disagree".

## Guiding Principles

- **"Extraordinary claims require extraordinary evidence."** (Carl Sagan)
- **"The wise man proportions his belief to the evidence."** (David Hume)
- From Aristotle to modern science, progress has relied on linking belief strength to evidence quality.
- For the first time, we define these principles explicitly in software, enabling large-scale, simultaneous reasoning.

The published scoring rule takes Hume literally. A claim with no evidence behind it and no argument beneath it reads 0.50, a coin flip, and contributes exactly nothing to anything above it. That single design choice runs through this whole page, so it is worth meeting early.

## The Problem vs. The Solution

| Current Online Debates | The ReasonRank Solution |
|---|---|
| **Volume over Quality:** The most frequent or loudest comments win, not the most truthful. | **Meritocracy of Ideas:** Logic and verified evidence determine the score, not "likes" or post frequency. |
| **Echo Chambers:** Algorithms optimize for engagement and outrage, not objective understanding. | **Trust Graph:** Mathematical weighting of connections ensures only sound reasoning moves the needle. |
| **Information Amnesia:** Debates "reset" constantly; we rarely build on previously established conclusions. | **Institutional Memory:** Every topic has one permanent page that grows in accuracy over time. |

All three of the right-hand column are built, in the shape the static site gives them. "Likes" never enter a number: a vote is recorded and shown and never scored (`NO_MOVE = 'A vote never moves a score; the page shows it next to what the analysis says, as what people think.'`, [intake.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py):146, pinned by `test_no_vote_moves_any_score` in test_render.py). The trust graph is literal: every multiplier on every row is the truth score of another page, or a labelled constant when no such page exists. And every belief, claim, linkage, importance and uniqueness question has one permanent page, built from two flat tables (`pages` and `edges`) that are never deleted from; see [[One Page per Debate Topic]] and [[Pros and Cons on the Same Page]].

## How ReasonRank Compares to PageRank

ReasonRank applies graph theory to logic. It works within a network where every claim is a node and every reason is a weighted link.

| Feature | Google PageRank | ISE ReasonRank (the old pages) | What the code does today |
|---|---|---|---|
| **The Node** | A webpage | A belief or argument | A page in the `pages` table: belief, claim, linkage, importance, interest, uniqueness, equivalence, driver or media (`SPECIAL` kinds, score_reference.py:35) |
| **The Connection** | A hyperlink | A "reason to agree" or "reason to disagree" | A row in the `edges` table, with a `section` (argument, evidence, prediction and more) and a `side` (agree or disagree) |
| **The Weight** | Domain authority (traffic/trust) | Truth score (verified evidence and logic) | Two weights for two questions. For reliance, the walk steps by `Link × Imp × Uniq` and leaves truth out (reasonrank.py:95). For strength, a row counts its claim's truth on a -1 to +1 scale times Confidence, Link, Imp and Uniq (score_reference.py:160-174) |
| **Propagation** | "Link Juice" flows to important pages | "Logic Strength" flows to valid conclusions | Strength flows up: a conclusion's truth is computed from its rows, whose claims are computed from theirs, with no stored scores. Reliance flows down: the walk starts at the beliefs and measures how much flows *through* each claim |
| **Spam Filter** | Filters link farms/spam sites | Filters redundancy using uniqueness scores | The uniqueness multiplier (`DEFUNIQ = 1`, presumed distinct until a uniqueness page argues the overlap), plus a computed duplicate detector that flags pairs and moves no score |

## Reliance: ReasonRank on the published site

PageRank does not ask whether a page is correct. It asks how much of the web's attention arrives there. The argument version asks how much of the site's conclusion-weight flows *through* a claim: not "is this true" but "how much depends on it". The method page states it at [method.html#reasonrank](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank), under the heading "ReasonRank: how much depends on a claim".

**The walk.** Picture a reader who starts at a belief picked at random, follows one of its reasons to that reason's page, follows one of the reasons there, and so on. ReasonRank is the share of that reader's time spent on each page. From any page the reader steps to one of the pages its rows read, choosing among the rows in proportion to how much each row can carry:

**capacity(row) = Link × Imp × Uniq** (reasonrank.py:95; a row with no linkage page reads 1.0, no importance page 0.5, no uniqueness page 1.0)

Two things are deliberately absent from that product. The truth score of the claim the row points at, because capacity is how much the row *could* carry once that claim is settled either way, and a ranking that fell when a claim was refuted would be measuring agreement rather than dependence. And confidence, because a page nobody has started work on is exactly the page this ranking exists to find. The multipliers are not absent, and they are themselves truth scores: a linkage page argued down to 0.2 really does carry less, whatever happens to the claim. A row's capacity is split evenly among the pages it reads (its claim and any linkage, importance, uniqueness, drives, addresses or equivalence page), because each factor of a product is equally load-bearing (reasonrank.py:31-33, 93-98). With damping d the reader jumps back to a belief with probability 1 - d, which keeps the ranking anchored to the conclusions people actually want decided instead of drifting into whatever corner of the graph is densest; a reader who reaches a page with no rows goes back to the beliefs (reasonrank.py:103-120).

Votes are not an input either. The walk is built from the corpus and a damping constant and nothing else (`ReasonRank(corpus, damping)`, reasonrank.py:75).

The constants (reasonrank.py:49-51): `DAMPING = 0.85` (PageRank's own), `ITERATIONS = 2000` (a cap the walk never reaches), `TOLERANCE = 1e-12` (where it actually stops). The method page prints the residual it stopped at; in a build from revision fa47ebf (27 November 2026) the walk covered 7,123 pages, started from 245 beliefs, and stopped at a residual of 8.9e-13.

**What it is for.** Rank alone names what matters. Rank against confidence names what to do:

**work(page) = rank × (1 - confidence)** (reasonrank.py:172)

High rank and finished work is a settled foundation. High rank and unfinished work is the next thing an analyst should spend a week on, and there is usually a short list of those holding up everything else.

**Where a reader sees it.**

- Every page's Scoring Engine table prints "Relied on (ReasonRank)", with its place out of all pages, and "Work value" (render_site.py:1352-1353). The heading area says what share of the site the page carries, how many beliefs it sits beneath and how many pages read it (`rank_note`, render_site.py:1240).
- The home page has a **Most relied on** card and a **What to argue next** card, each printed as a multiple of the average page. Their full lists are [relied.html](https://myklob.github.io/ideastockexchange/beliefs/relied.html) and [next.html](https://myklob.github.io/ideastockexchange/beliefs/next.html), and [lists.html#relied](https://myklob.github.io/ideastockexchange/beliefs/lists.html#relied) and [lists.html#next](https://myklob.github.io/ideastockexchange/beliefs/lists.html#next) explain them. The beliefs themselves are left out of both lists, because the walk starts from them and "argue the conclusion" is not a plan (reasonrank.py:162-175).
- Each page's JSON export carries `reasonrank`, `reasonrank_place` and `work_value`.

The Most relied on page calls itself "the nearest thing to 'popular' that can be measured here: nobody's votes or views are counted, so it says how much rests on a claim, not how many people like it" (render_site.py:2719).

**On a real build** (revision fa47ebf, 27 November 2026). The most relied-on claim that is not itself a belief is the interest [Voters need enough information to judge whether an official is compromised](https://myklob.github.io/ideastockexchange/beliefs/p/voters-need-enough-information.html): place 246 of 7,123, right behind the 245 beliefs, 4.2 times what rests on an average page, beneath five beliefs, with a truth score of 0.49 and confidence 39%. It is undecided and five conclusions lean on it. The top of What to argue next is a claim nobody has started: "Liberty, personal responsibility and civic engagement each become distorted when pursued on their own", confidence 0%. Twenty-eight claims sat beneath more than one belief.

**What pins it.** Eight tests in [test_engines.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py) (lines 234 to 316): the walk is a distribution, it converged, no page outranks the beliefs it starts from, rank ignores the truth of the claims it ranks, rank does follow a multiplier that is argued down, rank ignores confidence entirely, the damping is PageRank's 0.85 restarting at the beliefs, and work value is rank times unfinished work.

**What the walk is not.** The live page's sample code, the matrix form in [docs/ALGORITHMS.md](https://github.com/myklob/ideastockexchange/blob/master/docs/ALGORITHMS.md) section 7 (`reasonRank(adjacencyMatrix, iterations = 100, d = 0.85)`, restarting evenly over every argument) and the owner's 2026 matrix sketch are not what runs. The method page lists "ReasonRank restarting evenly across every argument" among the rules the site does not run ([method.html#notrun](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun); method.py:318), because the walk restarts at the beliefs only. Restarting everywhere would rank a claim by how many claims sit near it rather than by how many conclusions need it. The matrices are covered in full, with what became of each variable, on [[ReasonRank: Google's PageRank for Arguments]].

## Strength: the truth score and the belief score

This section is what the live page and the owner's draft meant by ReasonRank. On the published site it is called the truth score, and ReasonRank (the walk above) does not read it.

### The Four Scoring Dimensions

The owner's draft states the composite rule this way. A score of any conclusion (C) is updated dynamically using the formula:

**C = Σ [(A - D) × L × V × U]**

1. **Truth (Evidence Score - V).** How logically sound is the argument? This is recursive; an argument's score depends on the score of its sub-arguments. Reference: Evidence Verification Tiers, on [[Evidence Verification Score (EVS)]].
2. **Linkage (Relevance Score - L).** Does the evidence actually prove the conclusion? This penalizes "True but Irrelevant" claims. Reference: Linkage Score Methodology, on [[Linkage Scores]] and [[Evidence to Conclusion Relevance Score]].
3. **Impact (Importance Score - A/D).** How much weight should this point carry? Does it address a core pillar or a minor triviality? Reference: Importance Scores (the published site's explanation is [method.html#formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula); the unpublished app's is [src/app/algorithms/importance-score/page.tsx](https://github.com/myklob/ideastockexchange/blob/master/src/app/algorithms/importance-score/page.tsx)).
4. **Uniqueness (Redundancy Factor - U).** Is this a new point? We group semantically similar arguments to prevent a user from inflating a score by repeating the same point. Reference: Belief Sorting & Uniqueness, on [[The Redundancy Problem]] and [[Equivalency Score:]].

That is the intent, and the published rule keeps all four. It also has a fifth factor the drafts never mention, and it writes the formula differently in two ways that matter. Here is what runs, from `Model._contrib` (score_reference.py:160-174):

**row contribution = sign × (2 × Truth - 1) × Confidence × Link × Imp × Uniq**

| Factor | Range | What it is | What a row reads when nobody has argued it | Owner's draft letter |
|---|---|---|---|---|
| sign | +1 or -1 | Which side of the table the row was filed on. | Not applicable: every row sits on a side. | The sign of (A - D) |
| Truth | 0 to 1 | The row's own claim page score, put on a -1 to +1 scale so a claim argued false subtracts from the side it was filed on. | `UNARG = 0.5`, and (2 × 0.5 - 1) is 0, so it contributes exactly nothing. | V |
| Confidence | 0 to 1 | How much of the work behind that claim page has been done. It gates what the page passes upward; it never changes the page's own truth score. | A row whose claim has no page contributes 0 regardless. The bare scorer defaults confidence to 1.0 (score_reference.py:137); the published site computes it with [confidence.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py). | (none) |
| Link | 0 to 1 | The linkage page: if the claim were true, would the conclusion have to move? | `DEFLINK = 1`. A reason placed under a conclusion is presumed relevant and the burden is on the challenger. An opened but unargued linkage page also starts at 1 (`FACTOR_START`, evidence.py:106). | L |
| Imp | 0 to 1 | The importance page: the most valid interest this row really speaks to. | `DEFIMP = 0.5`, the neutral start. Not a penalty; the absence of a claim either way. | The magnitude of (A - D) |
| Uniq | 0 to 1 | The uniqueness page: does this row make a point some other row has not already made? | `DEFUNIQ = 1`. Presumed distinct until someone argues the overlap. | U |

The constants are one dictionary, `CONSTS = {'K': 1, 'UNARG': 0.5, 'DEFLINK': 1, 'DEFIMP': 0.5, 'DEFUNIQ': 1}` (score_reference.py:34), and every belief page prints them in grey so a reader can see which factors are still resting on a presumption ([method.html#constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants)). A claim page read by more than one row on the same side counts once, at its strongest reading, so listing one claim five times weighs what listing it once does (`_once`, score_reference.py:175-189).

The two differences from the draft's formula:

**First, Truth enters as (2 × Truth - 1), not as Truth.** A claim argued down to 0.2 does not contribute a little; it contributes *negatively*, against the side that filed it. Ten refuted reasons to agree weaken a belief instead of padding it. The draft's "if the data for Argument A is debunked, its score drops to zero" is gentler than what runs: on the published site a debunked reason goes below zero and counts for the other side. The worked example further down shows the numbers.

**Second, Confidence is a factor.** The drafts do not have it. Each page's confidence comes from seven structural components with these weights (confidence.py:30-38): grounding 0.30, two_sided 0.20, scrutiny 0.20, breadth 0.15, depth 0.05, sourcing 0.05, testability 0.05. Components a page's shape cannot carry are dropped and the rest renormalised. The wiki's seven behavioural signals (up and down votes, weekly visitors, dwell time, edit frequency, duplicate submission attempts, evaluation responses, score variance over time) are listed in the same file as `BEHAVIOURAL` with weight 0 and reported as "no data" rather than scored as zero (confidence.py:39). The bands are `established` 0.75, `developing` 0.45, `early` 0.15 (confidence.py:48). Full page: [[Confidence Stability Scores]]; published explanation: [method.html#confidence](https://myklob.github.io/ideastockexchange/beliefs/method.html#confidence).

The draft's "group semantically similar arguments" for Uniqueness is half built. The multiplier is argued (a uniqueness page), not computed. What is computed is a flagger: [similarity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) blends IDF-weighted Jaccard overlap of content words with cosine over character 4-grams, half and half, with `FLAG = 0.45` (worth a human reading the pair) and `MERGE = 0.70` (near-identical wording) (similarity.py:48, 52). It has no language model and no network. Its docstring says why it moves no score: "w_ces is read from a VCA page when one exists and is 0 when none does" (similarity.py:39). An equivalence page that scores at least `EQUIV_MERGE = 0.9` (render_site.py:42) lets the shorter wording stand in for a page in breadcrumbs and index columns; it still weights no row.

### Belief Score

The live page called the **Belief Score** "the primary output of ReasonRank": the one number a page's rows add up to, continuously updated from truth scores, linkage scores, equivalency scores, logical fallacy penalties and evidence verification, to "reflect the current best estimate of a belief's validity given all available arguments and evidence." On the published site it is the output of the scoring rule, not of the walk, and two of its five inputs are not what the live page says.

| Sub-score the live page lists | Status | What runs on the published site |
|---|---|---|
| Truth scores | Built | The claim's own page truth, `UNARG = 0.5` when it has no page. Argued truth is `(POS + w × p0) / (POS + NEG + w)`, then capped by the weakest load-bearing component (score_reference.py:268-270). |
| Linkage scores | Built | `Link` is the truth of a linkage page, else `DEFLINK = 1`. |
| Equivalency scores | **Replaced by uniqueness** | No published number multiplies a belief score by an equivalency score. The redundancy factor is the uniqueness multiplier (`uniq_id`, `DEFUNIQ = 1`). Equivalence pages exist as their own page kind, shown as "Equiv" in each page's Similar Beliefs table and used to choose a merge candidate at 0.9. |
| Logical fallacy penalties | **Refused by design** | The published site does not deduct for a fallacy. Structural Checks on every page say: "None of these changes a score. A flag is a question, not a verdict" (render_site.py:1201). [fallacy.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) flags reasons by a short published phrase list, says which words set each flag off, and opens two prefilled forms on the flagged claim's page: a reason to disagree saying it is the fallacy and a reason to agree saying it is not. Whatever that argument concludes moves the claim's truth through the ordinary rules; the flag never does. [integrity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) adds shape faults (circular support, a conclusion among its own premises, the same page counted twice) and refuses to score a corpus containing a loop. The owner's direction (October 2026) is the same: software may flag, a flag is argued like any claim, and a flag alone moves no score. The penalty idea is kept under "Proposed and not built" below. |
| Evidence verification | Built, as a starting point rather than a multiplier | See "Where a page starts" below. The wiki's own `Overall EVS = ESIW × ECRS × ERQ × (ERP/100)` is still computed by `evs()` (evidence.py:160) and printed on every Evidence Ledger; no score reads it. |

### What the Belief Score is, numerically

On the published site the belief score is **POS - NEG**, open-ended and signed (score_reference.py:21, 271). POS is the sum of every row whose signed contribution came out positive and NEG the magnitude of every row that came out negative, from either side of the table: a refuted objection counts as support, a refuted reason counts against (`_split`, score_reference.py:191-196). It is the number the [Highest belief scores](https://myklob.github.io/ideastockexchange/beliefs/best.html) list ranks by, complete beliefs first ("Belief score is the weight for minus the weight against", `render_best`, render_site.py:2756; ordering in `best_beliefs`). It is a quantity of argued weight, not a probability, so comparing it between a page with forty rows and a page with four is comparing volumes.

But it is not the number in the heading. The badge beside every claim is the **truth score**, and it is what every parent row reads:

**truth, argued = (POS + w × p0) / (POS + NEG + w)**
**truth, published = min(truth argued, the smallest truth among load-bearing components that have a page of their own)**

p0 and w are where the page starts and how heavily (next section). The cap is the second line: a page may list components it needs to be true and mark some load-bearing (`lb = Y`), and a conclusion cannot be more settled than a premise it needs. That is the mechanism behind the [[Assumptions]] page.

The Scoring Engine table on every published belief page prints, in this order: Argument score, Evidence score, Prediction contribution, Belief score (the three added), Positive total, Negative total, Starting point, Weight of the starting point, Truth score argued, Truth score, then the second rule's five lines (Independent reasons for, Independent reasons against, Weight for counting every reason, Weight against, Share for), then Relied on (ReasonRank), Work value, Complete, and whether both sides have reasons (`engine_table`, render_site.py:1314-1360). Every number is also exported as `<key>.json` beside the page.

### "Continuously updates" and "current best estimate"

Two phrases from the live page need qualifying.

*Continuously updates.* The static site stores no scores. Every number is recomputed from the two tables at build time (`Model` keeps a per-build memo and nothing else), so it updates once per revision of the tables, not continuously.

*Current best estimate of validity.* The published method page disclaims this in its limits list ([method.html#limits](https://myklob.github.io/ideastockexchange/beliefs/method.html#limits)): a truth score is a share of argued weight around a starting point, with the shape of a probability and not its calibration, and nothing has been checked against outcomes. Treat the estimate wording as the goal and the disclaimer as the status.

### Where a page starts, and why it has to start somewhere

This is the part the drafts did not have and the part everything else depends on. It lives in [evidence.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py) and is explained at [method.html#starts](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts).

Start with the arithmetic. A row contributes (2 × Truth - 1). A page with no rows reads 0.50, so (2 × 0.50 - 1) = 0, so it contributes nothing, so every page above it reads 0.50 too. By induction, **every page of an argument graph in which nothing is cited reads exactly 0.50, forever**, however many reasons are listed and however cleverly they are argued. Reasoning about reasoning never touches the world. The test that pins this is `test_argument_alone_can_never_leave_the_neutral_point` ([test_engines.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py):43): it builds unsourced chains of 2, 5 and 40 pages with confidence forced to 1 and asserts truth 0.5 and belief score 0.0 at every one. If that test ever fails, something has been added that lets a score move without evidence, and that needs a reason, not a fix to the test.

What touches the world is evidence. A page may declare three typed fields, and they set where its truth starts before any of its own rows count:

| Field | What it is | The wiki's name |
|---|---|---|
| `etype` | How far that kind of source can move the claim: a published statistic outranks an eyewitness | ESIW, Evidence Source Independence Weight |
| `erq` | How many independent replications exist: one study is a finding; four is a fact | ERQ, Evidence Replication Quantity |
| `erp` | What share of them agreed: four studies that disagree are not four studies | ERP, Evidence Replication Percentage |

**prior p0 = 0.5 + 0.5 × ESIW × (2 × ERP/100 - 1)**
**weight w = k × 2 × ERQ / (ERQ + 1)**, with k = 1, so the replication reward never exceeds `REP_CAP = 2.0` × k
**truth = (POS + w × p0) / (POS + NEG + w)**

(evidence.py:101, 109-113, 144-157.) Read the prior at its corners (calculation from the formula): a published statistic (ESIW 0.90) that every replication confirms starts at 0.5 + 0.5 × 0.90 × 1 = **0.95**; the same statistic that every replication contradicts starts at **0.05**; an eyewitness account (0.20) confirmed starts at **0.60** and contradicted at **0.40**; anything at half agreement starts at **0.50** whatever its tier, because a contested literature has established nothing; a page naming no source has ESIW `NOSOURCE = 0.0` (evidence.py:99) and stays at 0.50 however many times it is cited. The strongest tier is 0.90, so p0 is confined to [0.05, 0.95] and evidence alone never drives a claim to certainty. Getting the last twentieth takes an argument, on a page.

The weight line rewards replication but refuses to let it close the question: `replication(n) = 2n / (n + 1)` gives 1 → 1.00, 2 → 1.33, 3 → 1.50, 10 → 1.82, limit 2.00. At k = 1 even the strongest prior is within reach of one well-argued objection. Absent fields read ERQ = 1 and ERP = 100; ERQ below 1 reads as 1; ERP is held inside 0 and 100 (evidence.py:134-140), because a typo of 150 would otherwise give a starting truth of 1.40. These coercions are part of the published contract, and an SQL port once passed every other check while returning that 1.40.

The eighteen tiers, from the wiki's sixteen ranks with rank 2 split in two, plus one addition, as evidence.py:79-98 carries them:

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

Two notes from the file. The wiki gives rank 2 as one band, "0.85-0.80", over RCTs and meta-analyses; the split follows their listed order. And the wiki has no row for a primary official record, which for policy work is most of the record; `record` is the addition, weighted with statistics because its existence is not in dispute. The earlier ReasonRank page's four start values (meta-analysis 1.0, peer-reviewed study 0.8, anecdote 0.1, refuted evidence 0.0) are a different list, and the method page names them as a rule the site does not run (method.py:314).

Source quality is deliberately **not** a multiplier on the row. It belongs to the claim, not to the place the claim is cited, and the same finding cited on four pages has one truth (score_reference.py:167-169). How much a finding bears on a particular conclusion is the linkage page, which is the wiki's ECRS; putting source quality on the edge as well would count it twice.

**Where the owner's direction differs.** The owner prefers an evidence weight with no ceiling, so a body of replicated work can outweigh opinion by 15 or 200 times. The truth score's weight is capped at 2k on purpose (the file calls unbounded replication "how a score gets padded", evidence.py:111). The owner's rule is built beside it rather than instead of it: [tally.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) weighs a finding at `Truth × Linkage × Importance × Uniqueness × (1 + ESIW × ERQ × ERP/100)`, uncapped. Both numbers print on every belief page so they can be compared on real pages before either leads; see "Counting every reason" below.

### Example: The Logic Cascade

The owner's draft, verbatim:

**Conclusion:** "Solar energy is cost-competitive with fossil fuels"

- **Supporting Argument A:** "Solar costs decreased 90%." (High Weight)
  Calculation: 85 (Evidence) × 0.8 (Linkage) × 0.9 (Impact) = **+61.2**
- **Supporting Argument B:** "Installation is cheaper." (Low Weight due to 70% overlap with A)
  Calculation: 75 × 0.7 × 0.6 × 0.3 (Uniqueness) = **+9.45**
- **Current Total: +70.65**

**The Power of ReasonRank:** If the data for Argument A is debunked, its score drops to zero. Because the system is a Network Logic, the final conclusion score immediately collapses to +9.45. The system stays current automatically as new evidence appears.

Now the same two arguments through each rule that runs. Every number below is a calculation from the formulas on this page, with Confidence taken as 1 for both claims so the comparison is about the rules and not the work behind them.

**The owner's arithmetic is tally.py's rule.** `Truth × Linkage × Importance × Uniqueness` with truth out of 100 gives A = 0.85 × 0.8 × 0.9 × 1 = 0.612 and B = 0.75 × 0.7 × 0.6 × 0.3 = 0.0945, total 0.7065: the draft's 61.2, 9.45 and 70.65 divided by 100. Tally's share for the conclusion, starting from the neutral vote (p0 0.5, w 1), is (0.7065 + 0.5) / (0.7065 + 1) = **0.707**. Debunk A to truth 0 and it weighs 0; the share falls to (0.0945 + 0.5) / 1.0945 = **0.543**. That is the draft's cascade, exactly.

**The published truth score (score_reference.py).** A contributes +1 × (2 × 0.85 - 1) × 1 × 0.8 × 0.9 × 1 = **+0.504**; B contributes (2 × 0.75 - 1) × 0.7 × 0.6 × 0.3 = **+0.063**. POS 0.567, NEG 0, belief score **+0.567**, truth argued (0.567 + 0.5) / (0.567 + 1) = **0.681**. Now debunk A, which here means its own page is argued down to truth 0. It does not drop to zero: (2 × 0 - 1) = -1, so A contributes -1 × 0.8 × 0.9 = **-0.72**, against the side it was filed on. POS 0.063, NEG 0.72, belief score **-0.657**, truth (0.063 + 0.5) / (0.063 + 0.72 + 1) = **0.316**. The conclusion does not fall back to B's level; it is now argued *against*, because listing a refuted reason is evidence of a weak case. If instead A's page is merely unargued (0.5), A contributes 0 and the conclusion reads (0.063 + 0.5) / 1.063 = **0.530**.

**The Next.js ratio (scoring-engine.ts, not published).** Leaf arguments have RR equal to their truth, so A's `rawImpact` = 0.85 × 0.8 × 0.9 × 1 = 0.612 and B's = 0.0945; ProRank 0.7065, ConRank 0, so `truthScore` = 1.0, clamped to **0.99**. Debunk A and ProRank is 0.0945, ConRank still 0, truth still **0.99**. With nothing on the con side the ratio cannot say anything but "all pro", which is the volume disagreement in one line.

**What ReasonRank says about the same pages.** Nothing changes. Debunking A moves its truth, and the walk does not read truth, so A carries exactly as much of the site as before. That is the point of keeping the two numbers apart: A is now a refuted claim the conclusion still rests on, which is a reason to look at it, not to stop looking.

**A real page** (build from revision fa47ebf, 27 November 2026). The belief [Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html) has weight for 0.97, weight against 0.20, belief score +0.78, truth argued 0.68, and truth published **0.50**. The gap is the load-bearing cap: two of its load-bearing premises ("Officials' financial holdings currently influence how they vote and what they say", and that removing the holding removes the influence rather than relocating it) read 0.50, and a conclusion cannot be more settled than a premise it needs. The count-every-reason share for the same page is 62%. Its ReasonRank is place 1 of 7,123 pages (0.22% of the site), confidence 69%, work value 0.0007. That is the scoring rule behaving as designed, and it is also why most published beliefs read 0.50, which the owner's direction on volume is meant to address.

### Argument Ranking Algorithm

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

What runs instead is the signed row contribution `sign × (2 × Truth - 1) × Conf × Link × Imp × Uniq`, and no published number ranks by votes. Item by item against the sketch: the vote share `pro_score - con_score` (a number in [-1, 1]) is replaced by `(2 × Truth - 1)` of the claim's own argued page, also in [-1, 1]; the single `evidence_strength` in [0, 1] is replaced by four argued multipliers (Conf, Link, Imp, Uniq) and by the evidence prior on the claim's page; and the one property that survives, "no votes means score 0", survives by a different mechanism: an unargued claim at `UNARG = 0.5` contributes exactly 0.

Every argument table on a published belief page sorts each side by that score, strongest first (`side_order`, render_site.py:567).

### Votes: shown, never scored

The owner's direction (October 2026): there are many scores. Track what is popular separately from what stands up to analysis. Votes may decide what is promoted and given attention, never what is valid, and the gap between the two is worth showing because it says where people need more time with the argument.

The published site does exactly this, and it does it for both numbers: no vote enters the truth score, and no vote enters ReasonRank. Anyone with a GitHub account can vote agree or disagree on a claim through a prefilled issue form; [intake.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) records it in `content/votes.csv`, one row per (page, on, login), latest wins. A reason or finding can also be voted on *as an argument*: yes or no to whether it bears on the page it sits on, counted apart from votes on whether it is true. The counts sit on the claim's heading line after the truth score badge with the note "Votes are shown as what people think, next to what the analysis says, and never move a score" (`VOTE_NOTE`, render_site.py:1792). The [Votes vs the analysis](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes) card ranks the gap between the share of votes to agree and the truth score, widest first, once three or more people have voted on a claim (`MIN_VOTERS = 3`, render_site.py:2140); [Recently voted](https://myklob.github.io/ideastockexchange/beliefs/lists.html#voted) lists the newest votes. The table held two votes in this build.

A submission that duplicates an existing claim (similarity at or above `MERGE`) is counted as the submitter's vote for the claim already there, and [contribute.js](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) checks as the reader types against `data/claims_index.json` so a duplicate becomes a vote before it is ever filed.

### Counting every reason until it is argued down

The owner's direction on volume: for belief strength, start from the quantity of truly independent reasons to agree and disagree, rank how valid they are against each other, and let the weight of pro against con decide. Contributions count from the moment they are posted and are argued down from there; a rule under which work counts for nothing until someone proves it tells contributors their effort is wasted. For choices of action the question is different: costs and benefits across every stakeholder with a legitimate interest, the quantity and the quality of interests met, under different assumptions about which interests are valid.

[tally.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) is that starting rule, printed on every belief page beside the truth score and read by no other number, ReasonRank included ([method.html#tally](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)):

| Quantity | Rule (tally.py:11-17) |
|---|---|
| A reason or a prediction weighs | Truth × Linkage × Importance × Uniqueness |
| A finding weighs | the same × (1 + ESIW × ERQ × ERP/100), its uncapped evidence strength |
| Independent reasons on a side | the sum of Uniqueness over its reasons: two reasons that say the same thing count as one once a uniqueness page says so |
| Share for | (weight for + w × p0) / (weight for + weight against + w), the same starting vote the truth score uses, so one unanswered reason moves a page part of the way and not to certainty |

What it keeps from the argued rule: every factor is read from a page or a labelled constant, so a reason argued false weighs nearly nothing and a duplicate argued redundant adds nearly nothing. What it drops: the (2 × Truth - 1) that makes an unargued reason worth exactly zero, and the confidence gate that zeroes a row whose own page has no work behind it. Those two are why nearly every argued truth score reads 0.50. A vote enters neither rule. The argued rule and its pinned test are unchanged until the two have been compared on real pages; [compare.html](https://myklob.github.io/ideastockexchange/beliefs/compare.html) lists the beliefs where they disagree most. Which rule leads is open decision 1 in the project's CLAUDE.md, to be settled by that comparison.

## In the Next.js app (not published)

The Next.js app under `src/` is not deployed; nothing below appears on the published site. It carries a third use of the name.

**The app's "ReasonRank" number** is a strength score, not a reliance score. In `scoreArgument` (scoring-engine.ts:430-513, `DAMPING_FACTOR = 0.85` at line 58): `baseTruth = max(0, truthScore × (1 - Σ|fallacy impact|/100))`; a leaf's `reasonRank` is its `baseTruth`; for an argument with sub-arguments, `proSubRank` and `conSubRank` are the sums of the sub-arguments' `rawImpact`, `subArgScore = clamp(0.5 + 0.5 × (proSubRank - conSubRank) / count, 0, 1)`, and

**reasonRank = 0.15 × baseTruth + 0.85 × subArgScore** (scoring-engine.ts:486)
**rawImpact = reasonRank × linkage × importance × uniqueness**, importance and uniqueness 1.0 when absent

It is one recursive pass, not an iteration: there is no fixed-point loop, no iteration count, no vote input and no sentiment term. The test file works examples such as `RR = 0.15 × 0.6 + 0.85 × 1.0 = 0.94` and `RR = 0.15 × 0.8 + 0.85 × 0.05 = 0.1625` (tests/unit/core/scoring/scoring-engine.test.ts:141, 159). Here 0.85 means the share of an argument's score that comes from its sub-arguments, which is not what it means in the walk.

**The app's belief score.** `scoreProtocolBelief` (scoring-engine.ts:532) returns `truthScore = ProRank / (ProRank + ConRank)`, 0.5 when there are no arguments, plus an evidence term `(supporting - weakening) / count × 0.2` (line 571; tier weights are at most 1.0, so the term is bounded by ±0.2), clamped to [0.01, 0.99]; `argumentScore = proRank - conRank` rides along as a secondary field. Its evidence tiers are `T0` 0.05 (retracted), `T1` 1.0, `T2` 0.75, `T3` 0.5, `T4` 0.25 (lines 108-114), and its `calculateEVS = ESIW × log2(ERQ + 1) × ECRS × ERP` (line 122) has a logarithm in ERQ where the wiki and the static site are linear. This runs in the app's protocol dashboard, the `/api/protocol/[id]/linkage` route and the cost-benefit likelihood estimates (`calculateReasonRankScore`, line 649). The header calls the ratio "the probability that a random walker following the argument graph lands on a pro-conclusion"; nothing in the app runs a walk, and nothing has checked that number against outcomes.

**The app's canonical belief page** (`/beliefs/[slug]`) scores each edge with a flatter rule, `computeArgumentImpactScore = sign × childTruth × |linkage| × importance × uniqueness × 100`, rounded to one decimal (scoring-engine.ts:774), and recomputes upward through every parent on each change ([propagate-belief-scores.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts)). Its truth breakdown (`calculateTruthScoreBreakdown` in [all-scores.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts):296-345) takes `logicalValidity = proWeight / (proWeight + conWeight)`, clamped to [0.01, 0.99], and averages it with the evidence half. It used to average every argument regardless of side, so one strong objection took a belief from 0.600 to 0.775; the fix is pinned in tests/unit/core/scoring/all-scores.test.ts. Importance can come from an importance sub-belief by `(overallScore + 100) / 200`, and `applyDepthAttenuation` halves a score per level (`score × 0.5^depth`, scoring-engine.ts:203); the static site has no depth term.

**The app's reliance counterpart** is Decision Leverage ([decision-leverage.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts), section 1c on the app's belief page, `/leverage` for the corpus-wide queue, `/api/leverage` as JSON). It ranks argument edges by the conclusion score still at stake on each one: `weight = |linkage| × importance × uniqueness × 0.5^depth` (`DEPTH_ATTENUATION = 0.5`, line 75), times an open range made of four gaps weighted evidence 0.40, linkage 0.25, scoring 0.15, examination 0.20 (lines 79-82), times 100. Same question as the site's work value, asked per edge rather than per page, and unlike the walk it reads the number of linkage votes (`1/√(1 + votes)`).

**Votes in the app.** `aggregateLinkageVotes` (scoring-engine.ts:341) is the second step of `resolveLinkageScore` (line 215): a reputation-weighted mean of linkage votes, clamped to [-1, 1], used when an edge has no linkage debate. So in the app a vote can set one edge's linkage until somebody opens the debate. A fallacy accusation confirmed at `CONSENSUS_THRESHOLD = 0.6` weighted agreement with `CONSENSUS_QUORUM = 3` ([consensus.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/consensus.ts):31-33) publishes a counter-argument of strength 0.8 (major) or 0.5 (minor) into the edge's linkage sub-debate ([claims.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/claims.ts):143), where it is scored like any other argument. The published site has neither path.

The app's explainer is `/algorithms/reason-rank` ([page source](https://github.com/myklob/ideastockexchange/blob/master/src/app/algorithms/reason-rank/page.tsx)).

## Labelled references, not wired to any page

These carry the ideas this page grew from. None of them produces a number any reader sees.

- **The founding workbook's Conclusion Score** ([conclusion-score.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/conclusion-score.ts), with SQL and PHP twins). `score = nAgree - nDisagree + m × (Σ agree child score × linkage - Σ disagree child score × linkage)`, with linkage `(agree - disagree) / (agree + disagree)` from the edge's sub-debate and 1 when nobody has debated it (conclusion-score.ts:9-15). The multiplier is `m = 0.7` (`DEFAULT_SUB_ARGUMENT_MULTIPLIER`, line 74; the workbook's older per-sheet formulas use 1.0, line 77). It counts listed reasons, one point each, not votes, and its 0.7 is a sub-argument multiplier, not a PageRank damping factor. It is the clearest statement of "quantity and quality of reasons", and the nearest ancestor of the owner's count-every-reason rule.
- **The page/edge model** ([src/lib/ise-pages/score.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/ise-pages/score.ts), with the worked zoning example in `examples/ise-zoning/`). One claim per page, one row per edge, no stored scores, every multiplier an argued page. Its row is `Truth × Link × Imp × Uniq` (score.ts:11), without the `(2 × Truth - 1)` the published rule now uses, so it is an earlier form of the same idea. Only a script and its test import it. The project's guidance is to migrate the app onto it or delete it, not to leave both.
- **`pipeline/`**, a standalone tool that also names its scorer ReasonRank: `(Impact - CounterImpact) × Relevance × Evidence × Uniqueness` over scores typed into an input sheet, floored at `MIN_RANK_SCORE = 0.001`, with "debunked" below `DEBUNKED_THRESHOLD = 0.05` (pipeline/scoring/reason_rank.py:9; pipeline/config.py:54-55). No CI job or page runs it.
- **`src/core/reasonrank/`**, a recursive kernel with five invariants (propagation until a change is below epsilon, a node with more opposition than support contributing 0, diminishing returns for identical arguments, falsified evidence forcing a branch to 0, relevance on the edge) and `DEFAULT_CONFIG` of epsilon 0.001, maxDepth 100, baseScore 1.0 ([types.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/reasonrank/types.ts):171-175). Only `VERIFICATION_SCORES` reaches the app's belief page, as the Evidence Ledger's Standing column.

The repository's own guidance is that adding a further engine is the wrong move.

## Technical Integration

The owner's draft closes its mechanics with three lines. Each has a status on the published site.

- **Linkage Propagation: Scores flow through the entire graph.** Built. Nothing is stored, so a change anywhere is a change everywhere at the next build, and [sensitivity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py) uses the same fact to answer "which single input, if it moved, would change the answer?": it pins one page's truth, reads the belief again, and finds the flip point (a truth crossing `FLIP = 0.5`) by bisection to `STEPS = 16` (about 1.5e-5), with `INERT = 0.005` as the line below which an input moves nothing visible (sensitivity.py:37-40). It reports "Moves it now" (confidence as it stands) and "Moves it if settled" (confidence held at 1); the gap between them is the value of doing the work. It is one-at-a-time analysis and the page says so ([method.html#sensitivity](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity)). Sensitivity asks what would move one belief; ReasonRank asks how many beliefs a claim could move.
- **Objective Criteria: Measurable standards for evaluation.** Built as content, typed rather than computed. The `criterion` edge section feeds every belief page's Objective Criteria table; the four labels on each criterion are typed by an author (listed under `TYPED_INPUTS`, render_site.py:1311), and objective criteria are one of the seven parts of the completeness bar below. No score reads a criterion.
- **Bias Detection: Algorithms identify systematic reasoning errors.** Not built as stated; see "Proposed and not built". What runs instead moves no score: Biases tables on each belief page (argued rows, not detections), the structural checks of integrity.py, and the phrase flags of fallacy.py, each with a form to argue it.

## Transparency

- **Every component of the score is public and open to challenge.** Built. Every multiplier is a page id (`link_id`, `imp_id`, `uniq_id`, `drives_id`, `equiv_id`, `bearing_id`, `who_id`, score_reference.py:7) or a labelled constant printed in grey, so each factor can be opened and argued. Some inputs are typed rather than argued, and the method page lists them: the evidence classifications, cost and benefit magnitudes and their ranges, the supporters' and opponents' value rankings, the four labels on each objective criterion, the load-bearing flag on a premise, a claim's position on its topic's axis, and the one-sentence bottom line.
- **Users can see exactly how each argument influences the overall belief score.** Built. The Argument Trees print Truth, Conf, Link, Imp, Uniq and the signed product for every row, the Scoring Engine table prints the totals, the sensitivity sweep names which input would flip the conclusion, ReasonRank names how much rests on the page, and `<key>.json` carries all of it as data.
- **Algorithms are linked across the wiki so the scoring process is auditable.** Replaced. The built site no longer sends readers to this wiki for method: every rule link points at a section of its own [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html), so "a built site carries its whole methodology and depends on nothing outside it" (`WIKI` table, [build_pages.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/build_pages.py):31-32). Auditability is now a contract: [conformance.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py) publishes a small corpus (`conformance/corpus.json`, 28 pages and 30 edges) built to exercise every rule at least once, with its expected numbers in `conformance/expected.json`, the five constants and the eighteen tiers, so an implementation in any language can be held to the same rules, compared to 1e-9 (conformance.py:79). `python3 conformance.py --write` rebuilds the files after a deliberate rule change, which then needs a reviewed diff. CI runs the whole test suite before it publishes anything.

### What a published belief must have

Rankings rest on completeness, so the bar is worth stating. A belief is **complete** when it has all seven parts of `CORE_BAR` ([publish.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/publish.py):13): reasons to agree, reasons to disagree, evidence, objective criteria, testable predictions or a falsifiability test, costs and benefits, and interests on either side. Complete beliefs come first in every ranking. Every other belief is a **draft**, still published, with a draft mark in lists and on its own heading line saying what it still needs, and listed in `data/drafts.json`. The owner's standing rule: every belief in the tables is published however far along it is, and no drafted argument, reason or analysis is ever deleted. Improve a weak page by adding to it or by ranking it lower, never by removing it. The walk does not use this bar: a draft belief is a starting point for the walk like any other.

## Proposed and not built

These are the owner's ideas from the live page and the drafts that no published number runs. They are kept here because they are the owner's, and each says where it stands.

- **A fallacy penalty inside the belief score.** The live page lists "logical fallacy penalties" as a Belief Score input. The published site refuses this by design (see the Belief Score table), and the owner's October 2026 direction agrees: software may flag a possible fallacy, the flag is a claim argued like any other, and a flag alone moves no score. In the unpublished app, `scoreArgument` still docks `baseTruth` for recorded fallacies, and [claims.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/claims.ts):100-103 has a validity ladder (0.95 no fallacy, 0.75 minor, 0.45 major, 0.25 multiple) behind a bridge, `confirmedClaimsToDetectedFallacies`, that nothing outside its test calls. [fallacy-detector.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/fallacy-detector.ts) opens with the rule the owner chose: "A fallacy detection is an argument, not a penalty."
- **Bias Detection algorithms.** No module detects bias. An algorithm that deducted from a claim with no page to appeal to would break the rule that every number links to the page that argues it.
- **An equivalency score multiplying the belief score.** Not built; uniqueness does that job, and the wiki's blend `ES = w_ces × CES + w_ues × UES` runs with `w_ces = 0` until a validity comparison page exists.
- **User feedback (votes, credibility, sentiment) refining the rankings.** Not built on the published site, for either number, and the owner's direction says votes decide attention, never validity. The app has the two narrow vote paths described above.
- **Matrix propagation, 100 iterations, TF-IDF uniqueness and a sentiment multiplier.** The owner's 2025 and 2026 sketches. None is a live input anywhere; the sketches and why each would not run as written are on [[ReasonRank: Google's PageRank for Arguments]].
- **A calibrated "best estimate".** Nothing has been checked against outcomes; see the limits list on the method page.

## Where the engines disagree

These are the places the live page, the owner's draft, the published site and the app do not all say the same thing. Where the code itself is split, the split is named and left for the owner, whose direction is to publish rules side by side and compare them on real pages rather than replace one unseen.

| Question | Published site (tools/static-site) | Next.js app, not published (src/core/scoring) | Owner's direction |
|---|---|---|---|
| What does "ReasonRank" measure? | Reliance: how much of the site rests on a claim. It reads no truth, no confidence and no votes, and changes no score. | Strength: an argument's damped blend of its own truth and its sub-arguments'. | (not addressed; the method page's split is the one this wiki follows) |
| Does volume count? | No, in the truth score: an unargued row contributes 0, pinned by test. Yes, in the tally printed beside it. | Yes: `ProRank / (ProRank + ConRank)` over stored truth scores, so listing an unargued reason raises the score. | Count truly independent reasons from the moment they are posted and argue them down; compare the two rules on real pages before either leads (open decision 1). |
| Do votes move a score? | Never, in either number. Shown on the heading line and ranked against the truth score once three people have voted. | One path: reputation-weighted linkage votes set an edge's linkage when no debate exists. | Attention, never validity; show the gap. |
| Fallacies | Flagged by phrase list, argued on the claim's page, no deduction. | A confirmed accusation becomes a scored counter-argument (0.8 or 0.5); a penalty branch in `scoreArgument` and an uncalled validity ladder remain. | Software may flag; nothing is final; a flag moves no score. |
| Unargued linkage | `DEFLINK = 1`, and an opened, unargued linkage page also starts at 1: trust first, burden on the challenger. | 0.0 for an empty linkage debate, 0.5 for empty simple linkage arguments. | Start trusting and lower it when argued down; a link argued well must rise. |
| Evidence weight | Capped: w at most 2k in the truth score; uncapped in the tally. | Five tiers, log2 in replications, evidence term bounded by ±0.2. | No ceiling; tally.py's `ESIW × ERQ × ERP/100` uncapped is the starting rule. |
| An unargued premise under a load-bearing flag | Reads 0.50 and caps the belief at 0.50. | No load-bearing cap on a truth score; the app uses "load-bearing" only to rank edges in Decision Leverage. | Open decision 6: a rule change with a conformance diff, waiting on the comparison. |
| What the number means | "A share of argued weight around a starting point," not a probability. | "The probability that a random walker lands on a pro-conclusion." | (not addressed; nothing has been checked against outcomes) |

## Ready for Better Thinking?

Explore the argument structure at [[Argument Scores from Sub-Argument Scores]] and on the [live site](https://myklob.github.io/ideastockexchange/beliefs/index.html), where every card and column that ranks links to [what it shows and how it is worked out](https://myklob.github.io/ideastockexchange/beliefs/lists.html). Start with [Most relied on](https://myklob.github.io/ideastockexchange/beliefs/relied.html) to see what ReasonRank finds, and [What to argue next](https://myklob.github.io/ideastockexchange/beliefs/next.html) to see where your work would count most.

[View the Code on GitHub](https://github.com/myklob/ideastockexchange) | Contact the Project Lead (every belief page carries a form that opens a GitHub issue; that is also how to reach the project)

## See Also

- [[ReasonRank: Google's PageRank for Arguments]], the PageRank analogy in full, the matrix sketches and what became of each variable
- Evidence Verification Score: [[Evidence Verification Score (EVS)]]
- Logical Fallacy Score: no wiki page by that name exists and no module computes one. The nearest living things are the phrase flags in [fallacy.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py), the published [method.html#checks](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks), and, in the unpublished app, the catalog at [src/lib/fallacy/catalog.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/catalog.ts); the fallacy half of [[Truth Score]] covers the history.
- Equivalency Score: [[Equivalency Score:]] and [[The Redundancy Problem]]
- Evidence-to-Conclusion Linkage Score (ECLS): [[Evidence to Conclusion Relevance Score]] and [[Linkage Scores]]
- [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]]
- [[Votes Are Shown, Never Scored]]
- [[Confidence Stability Scores]] and [[Assumptions]]
- [[Likelihood of Costs and Benefits]] and [[Likely Interests of Those Who Agree and Disagree]], for the choices-of-action half of the owner's direction
- Templates that carry these scores: [[Template: Belief Analysis]], [[Template: Linkage Evaluation]], [[Template: Topic]]
- The published method page, section by section: [the one formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula), [where a page starts](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts), [counting every reason](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally), [confidence](https://myklob.github.io/ideastockexchange/beliefs/method.html#confidence), [sensitivity](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity), [ReasonRank](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank), [rules in the wiki the site does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun), [the constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants), [what this cannot do](https://myklob.github.io/ideastockexchange/beliefs/method.html#limits), [the data](https://myklob.github.io/ideastockexchange/beliefs/method.html#data)
- The corpus this page's real example comes from: [Government ethics](https://myklob.github.io/ideastockexchange/beliefs/t/government-ethics.html)
