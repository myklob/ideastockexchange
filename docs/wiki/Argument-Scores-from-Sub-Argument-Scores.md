# Argument Scores from Sub-Argument Scores

[[Home]] > Page Design > [Algorithms](https://myklob.github.io/ideastockexchange/beliefs/method.html) > [[ReasonRank]]

Every reason on this site is also a claim, and every claim has its own page with its own reasons beneath it. So the score of an argument has to come from somewhere, and the only honest place for it to come from is the arguments underneath. This page is about that one step: how the score of a sub-argument becomes part of the score of the argument above it, and how that repeats all the way up to the belief at the top.

The owner's explanation behind this title was exported from PBworks under the heading *ReasonRank: PageRank for Truth*, and it has never been on the GitHub wiki before. All of it is kept below, in its order, with its table, its worked example and its lists. Under each part is what the code actually does today. Where a number or formula is given, its basis is labelled: **the code** (with its file), **a calculation** (arithmetic done for this page from the code's own rules, as of 17 October 2026), or **the owner's judgment**.

## Which rule runs where

Before the math, a warning that saves confusion later. The repository holds several rules for turning sub-argument scores into an argument score, and they do not agree. Here they all are on one table, so nothing below is mistaken for the only version.

| Rule | Where it lives | How a sub-argument reaches its parent | Status |
|---|---|---|---|
| The signed row rule | [tools/static-site/score_reference.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py) | Each row adds `sign × (2 × Truth − 1) × Confidence × Link × Imp × Uniq`; the page's truth is `(POS + w × p0) / (POS + NEG + w)` | **Built and published.** It sets the truth score on every page of [the live site](https://myklob.github.io/ideastockexchange/beliefs/index.html) |
| Counting every reason until it is argued down | [tools/static-site/tally.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) | Each reason weighs `Truth × Link × Imp × Uniq`, each finding the same times `(1 + ESIW × ERQ × ERP/100)`, uncapped | **Built and published beside the truth score**, read by no other number, so the two can be compared ([method](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)) |
| The damped ReasonRank blend | `scoreArgument` in [src/core/scoring/scoring-engine.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts) | `0.15 × baseTruth + 0.85 × (0.5 + 0.5 × net / count)` | **Built; runs in the Next.js app**, not on the published site |
| Stored impact propagation | [src/lib/propagate-belief-scores.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts) with `computeArgumentImpactScore` | `sign × childTruth × |Link| × Imp × Uniq × 100`, written to the database and pushed up to every parent | **Built; runs in the Next.js app** when a belief changes |
| The cost-benefit recursion | `calculateRecursiveArgumentScore` in [src/core/scoring/cba-scoring.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/cba-scoring.ts) | `base + Σ subScore × 0.5^(depth − 1)` | **Built; runs on the app's `/cba` pages** |
| The founding workbook | [src/lib/conclusion-score.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/conclusion-score.ts) | `nAgree − nDisagree + m × (Σ agree score × linkage − Σ disagree score × linkage)`, m = 0.7 | **Replaced**; kept runnable for reference, unwired |
| Conclusion Score with depth division | [docs/ALGORITHMS.md](https://github.com/myklob/ideastockexchange/blob/master/docs/ALGORITHMS.md), section 1 | Each level's contribution divided by its depth, the total divided by the number of arguments | **Replaced**; the published site lists it under [rules it does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun) |
| The page/edge model in TypeScript | [src/lib/ise-pages/score.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/ise-pages/score.ts) | The same Truth × Link × Imp × Uniq rows as the static site, scored on read | **Proposed successor**, tested, imported by no route |

The first and third rows disagree about something that matters a great deal: whether listing a reason nobody has argued moves a score. That is covered in "Where the engines disagree about volume", near the end.

## ReasonRank: PageRank for Truth

Imagine if every argument automatically showed its score. Not based on how many people believe it, how loudly someone shouts it, or how slickly it's packaged. Based on *evidence*.

That's ReasonRank.

Google revolutionized web search by treating links as votes. A webpage matters when other important pages link to it. The algorithm doesn't care about popularity contests or paid placement. It follows the network of trust.

ReasonRank does the same thing for ideas. Instead of counting hyperlinks, it weighs arguments. Instead of ranking websites, it scores beliefs. The truth rises not because we voted for it, but because the evidence demands it.

**What the code does with the name.** The analogy is borrowed by two different pieces of the published site, and it helps to keep them apart (the code):

- **The recursive score.** A page's truth comes from the truth of the pages its rows point at. That is [score_reference.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), and it is what this page explains.
- **The PageRank walk.** A separate ranking of how much of the whole site rests on a claim, true or not. That is [reasonrank.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py): a random walk that starts at the beliefs, steps along rows in proportion to `capacity(row) = Link × Imp × Uniq`, restarts with probability 1 − d where `DAMPING = 0.85`, and runs until the change is below `TOLERANCE = 1e-12`. Every page prints the result as "Relied on" and as `work(page) = rank × (1 − confidence)`, the next job worth doing. The walk changes no truth score. The full story is on [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]].

"The truth rises because the evidence demands it" is literal on the published site, in a way the original text could not have known. Arguments alone cannot move a score there at all, as the section on the 0.50 trap shows. Only evidence can.

## Why Traditional Debate Is Broken

Here's what happens in a typical online debate:

- Arguments scatter across threads, lost in chronological chaos
- The same tired points get repeated endlessly, each time counting as "new"
- Debunked claims linger forever because nobody updates the old posts
- Weak reasoning hides behind confident rhetoric
- Important evidence gets buried while catchy soundbites go viral

We've built a system where being *persuasive* beats being *correct*. Where tribal loyalty trumps factual accuracy. Where feelings matter more than data.

This isn't how we solve hard problems. This is how we keep having the same stupid arguments forever.

**What answers each complaint today (the code):**

| Complaint | What the published site does |
|---|---|
| Arguments scatter across threads | One page per claim, built from two flat tables, `pages` and `edges` ([ise_tables.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)); see [[One Page per Debate Topic]] and [[Pros and Cons on the Same Page]] |
| The same points repeated, each counting as new | A uniqueness factor on every row, plus a duplicate check as you type ([contribute.js](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js)) that turns a repeat into a vote for the claim already there; see [[The Redundancy Problem]] |
| Debunked claims linger | A claim argued false scores below zero through `2 × Truth − 1` and counts *against* the side it was filed on, on every page that cites it |
| Weak reasoning behind confident rhetoric | An unargued claim contributes exactly zero, however confidently it is worded |
| Evidence buried under soundbites | Evidence is the only thing that sets where a claim starts ([evidence.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py)); a vote is shown and never scored |

## How ReasonRank Fixes This

### The Core Insight: Truth Flows Upstream

Think of arguments as a river system. Evidence is the source, flowing from small tributaries (individual studies, data points, expert testimony) into larger streams (sub-arguments), eventually feeding the main river (your conclusion).

Here's what makes this powerful:

- **Nodes are beliefs.** Each claim gets [[one canonical page|One Page per Debate Topic]], not scattered fragments across a thousand comment threads.
- **Edges are logical connections.** Supporting or opposing links show how arguments relate to each other.
- **Strength propagates automatically.** When the foundation is solid, the conclusion strengthens. When evidence crumbles, everything built on it collapses.

The system doesn't care about your credentials, your charisma, or how many followers you have. It cares about one thing: *Can you show your work?*

**How the river is plumbed (the code).** A node is a row of the `pages` table, with a `kind`: belief, claim, or one of the special kinds `linkage`, `importance`, `interest`, `uniqueness`, `equivalence`, `driver`, `media` (`SPECIAL` in score_reference.py). An edge is a row of the `edges` table: it sits on one page (`page_id`), points at another (`claim_id`), lives in a `section` (argument, evidence, prediction and about thirty more) and takes a `side` (agree or disagree). Each edge can name three more pages, `link_id`, `imp_id` and `uniq_id`, whose truth scores become its multipliers. **No score is stored anywhere.** Every number is computed on read from those two tables, so strengthening a foundation strengthens every conclusion above it the next time the site is built, which happens on every change (CI rebuilds and republishes; [changes.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/changes.py) prints what moved since the last revision).

The river metaphor is more exact than it looks. Water only flows downhill if there is a source. In this engine, an argument graph with no evidence anywhere in it is a lake with no inflow: perfectly level at 0.50, forever. More on that shortly.

## The Math Behind the Magic

Every argument gets scored using three multiplied factors:

> **Argument Strength = [[Truth Score]] × [[Linkage Score|Linkage Scores]] × [Importance Weight](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula)**

| Component | What It Measures | Range |
|---|---|---|
| **Truth Score** | Is this claim actually true based on evidence? | 0% to 100% |
| **Linkage Score** | If true, does it actually prove your point? | -100% (contradicts) to +100% (proves) |
| **Importance Weight** | Does this actually matter, or is it trivial? | 0.0 to 1.0 multiplier |

Notice what this prevents:

- **True but irrelevant** claims get filtered out (high truth, low importance)
- **Important but unproven** claims get flagged (high importance, low truth)
- **Logically disconnected** arguments can't hide (low linkage score)

You can't game this system by shouting louder. You have to *show your math*.

### What the published site multiplies

The three factors survived. Three more joined them, each to close a specific hole. This is the one formula every scored row on the published site uses, whether it is an argument, a cited finding or a prediction (the code, `Model._contrib` in [score_reference.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), mirrored by `Corpus.row` in [render_site.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py) and checked against it on every render):

```
contribution = sign × (2 × Truth − 1) × Confidence × Link × Imp × Uniq
```

| Factor | Range | Read from | When nobody has argued it |
|---|---|---|---|
| **sign** | +1 or −1 | The side the row was filed on: agree +1, disagree −1 | Always set |
| **2 × Truth − 1** | −1 to +1 | The truth score of the claim's own page, moved onto the scale the original table used for linkage | `UNARG = 0.5`, so this factor is 0 |
| **Confidence** | 0 to 1 | How much work stands behind the claim's page ([confidence.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py)) | 0 for a row with no page of its own |
| **Link** | 0 to 1 | The truth score of a linkage page: "if this were true, would it bear on that?" | `DEFLINK = 1` |
| **Imp** | 0 to 1 | The truth score of an importance page: the largest `Validity × Bears` among the interests it lists | `DEFIMP = 0.5` |
| **Uniq** | 0 to 1 | The truth score of a uniqueness page arguing the row says something its siblings do not | `DEFUNIQ = 1` |

The constants are `CONSTS = {'K': 1, 'UNARG': 0.5, 'DEFLINK': 1, 'DEFIMP': 0.5, 'DEFUNIQ': 1}` in score_reference.py, and every page shows a factor still resting on one in grey ([method](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants)).

How the original three map onto this:

- **Truth Score, 0% to 100%.** Unchanged as a page's score. Inside a row it is moved to −1..+1 by `2 × Truth − 1`. That move is the single most important design decision in the engine, and the next section is about why.
- **Linkage Score, −100% to +100%.** The *sign* of the original linkage moved to the row's side, and the *strength* stayed as Link, 0 to 1. On the published site "contradicts" is written by filing the row as a reason to disagree, not by a negative linkage, and Link starts at 1 and falls only when someone argues the connection down. That matches the owner's direction on linkage (October 2026): start trusting, lower it as people show a reason is unrelated, and let a well-argued link rise. The Next.js app keeps the original −1..+1 range in `scoreLinkageDebate`, `LS = (A − D) / (A + D)` clamped to [−1, 1], and that function returns **0.0** when a linkage debate exists but nobody has argued it (scoring-engine.ts), which is the opposite of starting trusting. `calculateLinkageFromArguments` in the same file returns 0.5 when nothing is argued. Three defaults, one idea; see [[Linkage Scores]] and [[Template: Linkage Evaluation]].
- **Importance Weight, 0.0 to 1.0.** Unchanged in range. On the published site it is computed, not typed: an importance page reads `max over listed interests of Validity × Bears` ("A maximum and not a sum, because a reason that speaks to one interest that matters is important; listing five interests it barely touches is not five times as important", method.py). In the app, `deriveImportanceFromBeliefScore` maps an importance belief's net score from [−100, +100] onto [0, 1] as `(overallScore + 100) / 200`, and an argument with no importance set reads 1.0 (scoring-engine.ts).

And the three the original did not have:

- **Confidence** stops a claim that nobody has done any work on from moving anything, however true it looks. See [[Confidence Stability Scores]].
- **Uniqueness** stops one point from being counted three times because it was worded three ways. See [[The Redundancy Problem]] and [[Equivalency Score:]].
- **The (2 × Truth − 1) shift** makes a refuted reason hurt its own side, and makes an unargued one worth nothing.

### Notice what this prevents, checked against the code

| The original claim | What the published site does |
|---|---|
| True but irrelevant claims get filtered out (high truth, low importance) | **Built.** Imp multiplies the row, so a claim at truth 1.00 with importance 0.10 contributes at most 0.10. The roundabout example below shows it |
| Important but unproven claims get flagged (high importance, low truth) | **Built, and stronger than flagged.** An unproven claim sits at 0.50 and contributes exactly 0 whatever its importance. The page names the input that would move it most under "What would move this most" ([sensitivity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py)), and every row carries `stake = Conf × Link × Imp × Uniq × (1 − |2 × Truth − 1|)`, how much it could still move the page once argued (render_site.py); the "What to argue next" ranking on the [lists page](https://myklob.github.io/ideastockexchange/beliefs/lists.html) points contributors at the claims where work moves the most |
| Logically disconnected arguments can't hide (low linkage score) | **Built.** A linkage page argued down to 0.2 cuts the row to a fifth. Unargued, Link reads 1, so the defence works only once someone opens the linkage page |

## From sub-arguments to a page's score

This is the heart of the page. Here is exactly what the published site does with a page's rows once each has a contribution (the code, `Model.evaluate` in score_reference.py):

```
POS          = the sum of the positive contributions
NEG          = the sum of the negative contributions, as a magnitude
argued truth = (POS + w × p0) / (POS + NEG + w)
page truth   = min(argued truth, weakest load-bearing premise that has its own page)
belief score = POS − NEG          (open-ended, printed beside the truth score)
```

Four things in there are worth slowing down for.

**A row lands on the side its sign puts it, not the side it was filed on.** POS and NEG are split by the sign of the contribution (`_split` in score_reference.py), not by the column. A reason to agree whose own page has been argued down to 0.20 contributes `+1 × (0.4 − 1) = −0.6` times its multipliers, so it counts against the belief. "Ten refuted reasons to agree weaken the belief instead of padding it" is how the code's own comment puts it. A refuted objection likewise counts as support. Being wrong in public costs you.

**An unargued row contributes exactly nothing.** A claim nobody has argued sits at 0.50, and `2 × 0.50 − 1 = 0`. Listing a reason earns nothing until somebody argues it. That was the fix for padding: you cannot win by typing faster.

**The starting point comes from evidence, not from nothing.** `p0` and `w` come from what the page declares it rests on ([evidence.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py)):

```
p0 = 0.5 + 0.5 × ESIW × (2 × ERP/100 − 1)
w  = k × replication(ERQ),   replication(n) = 2 × n / (n + 1),   k = 1
```

ESIW is the source type's weight from sixteen tiers plus one addition (statistics 0.90, primary official record 0.90, randomized trial 0.85, meta-analysis 0.80, observational study 0.75, historical trend 0.70, expert testimony with data 0.65, expert or social media claim 0.60, anecdote 0.55, common sense or logic 0.50, analogy 0.45, cultural norm 0.40, intuition 0.35, news report 0.30, survey 0.25, eyewitness 0.20, visual evidence 0.15, historical artifact 0.10; no source named, 0.0). ERQ is the number of independent replications and ERP the share that agreed. So a published statistic every replication confirms starts at 0.95, the same statistic every replication contradicts starts at 0.05, and a page that names no source starts at 0.50 with weight 1 however many times it is cited. Replication is rewarded and capped: `REP_CAP = 2.0`, so 1 replication weighs 1.00, 2 weigh 1.33, 3 weigh 1.50, 10 weigh 1.82, and no pile of studies ever puts a claim beyond the reach of one good argument. See [[Evidence Verification Score (EVS)]].

**A conclusion cannot be more settled than a premise it needs.** A premise marked load-bearing (`lb = Y` on a `component` row) caps the page. If the belief needs three things to be true and one of them reads 0.50, the belief reads at most 0.50, however strong the case on its own rows. As probability that is conservative and correct. It is also, combined with the unargued-row rule, much of what holds the corpus where it is (an open decision, listed at the end).

### Confidence: why a sub-argument has to earn its say

The `Confidence` factor deserves its own paragraph, because it is the part of the sub-argument rule most people do not expect. A row's claim may be true, relevant and important, and still move its parent very little, because nobody has done the work on the claim's own page. Confidence is a weighted average of structural components (the code, `STRUCTURAL` in confidence.py):

| Component | Weight | Asks |
|---|---|---|
| grounding | 0.30 | Is this claim established, by its own cited source (its ESIW) or by the claims argued beneath it (their mean confidence), whichever is stronger? |
| two_sided | 0.20 | Has anyone argued the other side? 1.0 if both sides have rows, 0.35 if one does, 0 if none |
| scrutiny | 0.20 | Of the Link, Imp and Uniq slots on its rows, what share point at a page of their own? |
| breadth | 0.15 | `saturate(rows + predictions, 6)`, where `saturate(n, half) = n / (n + half)` |
| depth | 0.05 | `saturate(depth below the page, 3)` |
| sourcing | 0.05 | Of its evidence rows, half for citing a source and half for classifying it |
| testability | 0.05 | Of its predictions, the share that are dated and have a linkage page |

A component that does not apply to a page is dropped and the rest renormalised. The behavioural signals the wiki also lists (up and down votes, weekly visitors, dwell time, edit frequency, duplicate submission attempts, evaluation responses, score variance over time) are carried at weight zero and reported as "no data", because two flat tables have no users to watch. Confidence is not a cap on a page's own truth. "Truth is what the arguments say; confidence is how much to bet on it" ([method](https://myklob.github.io/ideastockexchange/beliefs/method.html#confidence)).

### The rule that keeps being rediscovered: by induction, everything reads 0.50

Put the pieces together and something startling falls out. A page with no rows reads 0.50 (or its evidence prior). A row pointing at a 0.50 page contributes zero. So a page whose rows all point at 0.50 pages reads 0.50. By induction, **every page of an argument graph in which nothing is cited reads exactly 0.50, forever**, however many thousands of arguments it holds. Argument about argument never touches the world. ([evidence.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py) says it plainly: "reasoning about reasoning never touches the world. Something has to come in from outside, and what comes in from outside is evidence.")

That is not a bug and it is pinned by a test: `test_argument_alone_can_never_leave_the_neutral_point` in [test_engines.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py). If it ever fails, something has been added that lets a score move without evidence, and that needs a reason, not a fix to the test.

What it does to the published numbers today (a calculation, run on `content/` on 17 October 2026): of 4,263 pages, 4,005 read exactly 0.50. Of the 196 beliefs, 178 read exactly 0.50 and the other 18 read below it; none reads above. Twenty-one beliefs argue to above 0.50 on their own rows and are held at or below 0.50 by a load-bearing premise nobody has argued up. A worked case follows below.

That is why the owner's starting rule is printed beside the truth score on every belief page: "Counting every reason until it is argued down". Under it, 45 of the 195 beliefs with any listed weight read above 0.50 and 25 below (same calculation).

## Recursion: The Key to Scaling Reason

Here's where it gets interesting. Every argument is itself a belief page with its own supporting and opposing arguments. The scoring cascades through multiple levels:

1. **Foundation Level:** A peer-reviewed study confirms Process X is safe. *(Truth Score: 95%)*
2. **Middle Level:** That study supports "Process X is safe." *(Updated Score: 85%)*
3. **Conclusion Level:** "We should implement Process X" gains strength. *(Updated Score: 70%)*

Now watch what happens when new evidence appears. If that peer-reviewed study gets retracted, the score doesn't just update on one page. It ripples through the entire network instantly. Every conclusion built on that foundation automatically adjusts.

This is what makes ReasonRank revolutionary. **The truth updates itself.**

### The same three levels, run through the engine

The 95%, 85% and 70% above are the owner's illustration, not the output of any rule. Here is what the published engine actually does with that exact shape: a finding page that is a published statistic, confirmed by 4 independent replications out of 4, cited as evidence on a middle claim, which is a reason to agree on the conclusion. No linkage, importance or uniqueness pages are open, so Link reads 1, Imp 0.5 and Uniq 1 (a calculation with `Model` from score_reference.py and `Confidence` from confidence.py):

| Level | Starting point | Confidence forced to 1 | With real confidence | After the finding is contradicted (ERP 0%), real confidence |
|---|---|---|---|---|
| Foundation: the finding | p0 = 0.95, w = 1.60 | 0.950 | 0.950 (confidence 0.30) | 0.050 |
| Middle: the claim it supports | 0.50, w = 1 | 0.655 | 0.560 (confidence 0.22) | 0.441 |
| Conclusion | 0.50, w = 1 | 0.567 | 0.506 (confidence 0.19) | 0.494 |

Read it from the left. With every page treated as fully worked, the finding's 0.95 becomes a contribution of `0.9 × 1 × 1 × 0.5 × 1 = 0.45` on the middle page, which reads `(0.45 + 0.5) / (0.45 + 1) = 0.655`. Each level up halves the pull again, because each level is one row with importance 0.5 and one coin-flip prior to overcome. Truth does flow upstream, and it loses pressure on the way, the way a river does when nobody digs the channel.

With real confidence the loss is much steeper. The finding's page has a source and nothing else: grounding 0.90, everything else zero, so its confidence is `0.30 × 0.90 / 0.90 = 0.30` (sourcing and testability do not apply and drop out). Its 0.95 reaches the middle page at under a third of its strength. That is the engine telling you the finding is real and the argument built on it has not been done.

And the retraction ripple is real. Flip the replications from all agreeing to all disagreeing and the finding drops to 0.05; the middle claim falls from 0.560 to 0.441 and the conclusion from 0.506 to 0.494, with nobody touching either page. "Instantly" means at the next build, which on the published site is every change, because nothing is stored. In the Next.js app it means at the next mutation: [propagate-belief-scores.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts) recomputes the changed belief, rewrites the `impactScore` of every argument that cites it, and recurses upward to every parent, with a visited set so a loop cannot run forever.

Which single input would ripple furthest is computed too. Every belief page has a sensitivity table ([sensitivity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py)) that sweeps each input page's truth from 0 to 1 with everything else held, in two columns: "Moves it now", with confidence as it is, and "Moves it if settled", with that page's confidence held at 1. The gap between the two is the value of doing the work. A flip point is where the belief crosses 0.50 (`FLIP = 0.5`), found by bisection (`STEPS = 16`), looking `DEPTH = 6` levels down. The file's own caution: this is one-at-a-time analysis, and it does not find three inputs each moving a little in the same direction ([method](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity)).

One more thing the recursion has to refuse. If a claim supports itself through a chain of other claims, a loop can hold any value at all and stay consistent, so there is no number to publish. The scorer raises `CircularSupport` by name, and [integrity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) runs first in CI and names the loop before anything is built ([method](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks)).

## Example: Should We Build Roundabouts?

Let's see this in action. The city is debating whether to replace stop signs with roundabouts.

| ✅ Reasons to Agree | Truth | Linkage | Impact |
|---|---|---|---|
| "Reduces fatal accidents by 90%" | **95%** (multiple studies) | **1.0** (critical safety factor) | **+0.95** |
| "Improves traffic flow during off-peak" | **80%** (good data) | **0.5** (minor convenience) | **+0.40** |
| **❌ Reasons to Disagree** | | | |
| "Confusing for elderly drivers" | **60%** (mostly anecdotal) | **0.8** (real safety concern) | **-0.48** |
| "Construction causes delays" | **100%** (obviously true) | **0.1** (temporary, not policy-relevant) | **-0.10** |
| | | **TOTAL SCORE:** | **+0.77** (Strongly Favor) |

Look at that last row. The "construction delays" argument is 100% true, but contributes almost nothing to the final decision because its linkage and importance scores are low. This is exactly how reasoning should work. Being technically correct about an irrelevant detail doesn't win you the debate.

**Checking the arithmetic (a calculation).** Each Impact is Truth × Linkage: 0.95 × 1.0 = 0.95, 0.80 × 0.5 = 0.40, 0.60 × 0.8 = 0.48, 1.00 × 0.1 = 0.10. The total is 0.95 + 0.40 − 0.48 − 0.10 = **+0.77**. It adds up. Two notes on the table as written: the Linkage column's labels ("critical safety factor", "minor convenience", "temporary, not policy-relevant") describe importance as much as linkage, so the one column is doing the work of two; and the table has no importance column, so the text's "linkage and importance scores are low" is carried by linkage alone.

### The same four rows under every rule that runs

Here are those exact numbers, with each Linkage value as an argued linkage page, run through each engine (a calculation using each engine's own code; confidence is held at 1 on the static site so the comparison is about the formula, not about unfinished pages):

| Rule | Per-row contributions | Result |
|---|---|---|
| The original table | +0.95, +0.40, −0.48, −0.10 | **+0.77** net |
| Published site, importance 1 on every row | +0.90, +0.30, −0.16, −0.10 | Truth **0.691**; belief score POS − NEG = **+0.94** |
| Published site, no importance pages (Imp reads 0.5) | +0.45, +0.15, −0.08, −0.05 | Truth **0.636**; belief score **+0.47** |
| Counting every reason (tally.py), importance 1 | 0.95, 0.40, 0.48, 0.10 by weight | **63%** for: (1.35 + 0.5) / (1.93 + 1) |
| Counting every reason, Imp 0.5 | half of each | **60%** for |
| Next.js app, `scoreProtocolBelief`, leaf arguments | 0.95, 0.40, 0.48, 0.10 by weight | Truth **0.699** = 1.35 / (1.35 + 0.58) |

Every rule agrees the city should build roundabouts, and every rule agrees the construction delays barely matter: 0.10 in every row of this table, despite being the only claim at 100%. Where they part company is the elderly drivers. At 60% truth, "mostly anecdotal", the published site counts that objection at `2 × 0.6 − 1 = 0.2` of its weight, not 0.6, because a claim barely better than a coin flip is barely an argument at all. The other rules count all 0.6 of it. That one row is the whole disagreement about volume in miniature.

Two more things the published site would do with this debate that no table above shows. The "90%" in the first reason is a finding: on the published site it would be filed as evidence with a source type, replications and their agreement, and that is what would set its 95% rather than someone typing it. And every one of these rows would start at 0.50 and contribute zero until somebody did that work. The table above is what the page would say after the work, not before.

## A real page, row by row

To see the rule on real data rather than a toy, here is the first belief on the published site, [Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html), filed under [Public office and private gain](https://myklob.github.io/ideastockexchange/beliefs/t/public-office-private-gain.html) (a calculation from `content/` on 17 October 2026; the live page may have moved since).

| Row | Truth | Confidence | Link | Imp | Uniq | Contribution |
|---|---|---|---|---|---|---|
| Reason to agree: [Members regularly trade in the industries their own committees oversee](https://myklob.github.io/ideastockexchange/beliefs/p/members-regularly-trade-industries.html) | 0.50 | 0.28 | 0.5 | 0.5 | 1 | 0.000 |
| Reason to agree: [The Federal Reserve barred its own policymakers from holding individual stocks in 2022](https://myklob.github.io/ideastockexchange/beliefs/p/federal-reserve-barred-its.html) | 0.50 | 0.28 | 0.5 | 0.5 | 1 | 0.000 |
| Reason to disagree: [A ban on the official leaves the conflict in place through spouses](https://myklob.github.io/ideastockexchange/beliefs/p/ban-official-leaves-conflict.html) | 0.50 | 0.26 | 0.5 | 0.5 | 1 | 0.000 |
| Evidence for: 78 members of the 117th Congress violated the STOCK Act's disclosure deadlines | 0.95 | 0.56 | 0.5 | 0.5 | 1 | +0.127 |
| Evidence for: 131 federal judges heard 685 cases involving companies in which they or their families held stock | 0.95 | 0.58 | 0.5 | 0.5 | 1 | +0.130 |
| Evidence against: congressional portfolios underperformed market benchmarks by roughly 2 to 3 percent a year over 2004 to 2008 | 0.875 | 0.51 | 0.5 | 0.5 | 1 | −0.096 |

Take the 78-members row: `+1 × (2 × 0.95 − 1) × 0.564 × 0.5 × 0.5 × 1 = 0.127`. Every reason and objection on the page contributes zero, because none of their pages has been argued off 0.50. All of the movement comes from five findings for and two against: POS = 0.419, NEG = 0.096, so the argued truth is `(0.419 + 0.5) / (0.515 + 1) = 0.607`. Then the load-bearing cap applies. The belief lists three premises it needs, and one of them, "Removing the holding removes the influence rather than relocating it to a spouse, a partnership or a post-office job", reads 0.50 because nobody has argued it. So the page reads **0.50**, with a belief score of **+0.32** and, beside it, "Counting every reason until it is argued down" at **57%** for: 5 independent reasons for, 5.5 against (one reason against has a uniqueness page at 0.5), findings weighing 1.73 for and 0.60 against.

That is the engine working exactly as designed and also the clearest picture of the open question: the evidence leans for, the argument has not been done, and the published number says so by not moving.

## How the Next.js app combines sub-argument scores

The app's rule is a different animal, and it is worth seeing in full because it is the one the original text most resembles (the code, `scoreArgument` in [scoring-engine.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)):

```
fallacyPenalty = Σ |fallacy impact| / 100
baseTruth      = max(0, truthScore × (1 − fallacyPenalty))

leaf:           ReasonRank = baseTruth
with subs:      proSubRank = Σ rawImpact of pro subs,  conSubRank = Σ rawImpact of con subs
                net        = (proSubRank − conSubRank) / number of subs
                subArgScore = clamp(0.5 + 0.5 × net, 0, 1)
                ReasonRank = (1 − d) × baseTruth + d × subArgScore,   d = DAMPING_FACTOR = 0.85

rawImpact = ReasonRank × Link × Imp × Uniq          (Imp and Uniq default to 1.0)
```

A belief then reads `ProRank / (ProRank + ConRank)` over its top-level arguments' rawImpact, 0.5 when there are none, plus an evidence term `(supporting − weakening) / evidence count × 0.2` using tier weights T0 0.05 (retracted), T1 1.0, T2 0.75, T3 0.5, T4 0.25, clamped to [0.01, 0.99] (`scoreProtocolBelief`).

A worked case (a calculation): a middle argument whose own base truth is 0.5 has one pro sub-argument at 0.95, Link 1. Then net = 0.95, subArgScore = 0.975, and ReasonRank = 0.15 × 0.5 + 0.85 × 0.975 = **0.904**. Retract the sub-argument to 0.05 and it falls to 0.15 × 0.5 + 0.85 × 0.525 = **0.521**. The ripple works here too, and much harder than on the published site, because nothing gates it on work done.

Four properties of this rule that differ from the published site, each read from the code:

- **An unargued reason counts.** A leaf's ReasonRank is its stored base truth, so a reason entered at 0.5 adds 0.5 × its multipliers to its side. There is no 0.50 trap, and there is nothing stopping padding but the uniqueness factor.
- **Averaging penalises a weak supporting reason.** Because net is divided by the number of sub-arguments, adding a weak reason for lowers the score (a calculation): with one pro sub at rawImpact 0.9, ReasonRank is 0.075 + 0.85 × 0.95 = 0.883; add a second pro sub at 0.1 and net becomes 1.0 / 2 = 0.5, so ReasonRank drops to 0.075 + 0.85 × 0.75 = 0.713. Agreeing with someone badly hurts them. The owner's direction on volume (count independent reasons, weigh pro against con) points the other way.
- **A refuted objection still counts as an objection.** rawImpact is never negative unless the linkage is, so a con at ReasonRank 0.1 adds 0.1 to the con side rather than switching sides.
- **A fallacy flag moves the score.** `fallaciesDetected` reduces baseTruth multiplicatively, and `calculateTruthScoreBreakdown` in [all-scores.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts) applies `fallacyPenalty` too. The owner's direction (October 2026) is that software may flag a possible fallacy, nothing is final, the flag is argued like any claim, and a flag alone moves no score. The published site follows that ([fallacy.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) flags by a short published phrase list and opens a form on each side; "the flag never does" move a score). The app does not yet.

The app's belief pages read a second path, the stored one. When a belief changes, [propagate-belief-scores.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts) rewrites each citing argument's `impactScore = sign × childTruth × |Link| × Imp × Uniq × 100`, rounded to one decimal (`computeArgumentImpactScore`), where childTruth is the child belief's `importanceWeightedScore`, the pro share of `|impactScore| × importance`. The parent's net score is then `overallScore = (totalPositive − totalNegative) / total × 100`, with evidence counted at `|impactScore| × verificationWeight` (VERIFIED 1.0, UNVERIFIED and DISPUTED 0.5, FALSIFIED 0; rows with no status recorded count in full, deliberately, see the retraction exposure readout). Uniqueness on this path is computed, not argued: `uniquenessFromSimilarities` in [duplication-scoring.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/duplication-scoring.ts) returns `1 − max similarity` to earlier same-side siblings, so "a 90% restatement contributes ~10% of its weight". The published site refuses that by design, for reasons given under Quality Control.

`calculateTruthScoreBreakdown` used to average every argument's weight regardless of side, so one strong objection took a belief from 0.600 to 0.775. It now takes the pro share of argued weight, which is what its own evidence half and scoring-engine.ts already did (all-scores.ts).

## The cost-benefit engine's recursion

The app's `/cba` pages use a third rule, from [docs/automated-cba/SKILL.md](https://github.com/myklob/ideastockexchange/blob/master/docs/automated-cba/SKILL.md) (the code, [cba-scoring.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/cba-scoring.ts)):

```
argument_score         = truth × linkage × importance          (truth on a 0 to 10 scale)
effective_score(arg)   = base_score(arg) + Σ effective_score(sub) × 0.5^(depth − 1)
likelihood             = pro_total / (pro_total + con_total),   0.5 when there are none
```

Depth 1 counts 1.0, depth 2 counts 0.5, depth 3 counts 0.25. Nothing else in the repository attenuates by depth, and here sub-arguments *add* to their parent's score rather than replacing it. An unargued importance reads 1.0 and there is no uniqueness multiplier; `applyArgumentDeduplication`, the defence it has instead, is exported and called by nothing. [cba-scoring.test.ts](https://github.com/myklob/ideastockexchange/blob/master/tests/unit/core/scoring/cba-scoring.test.ts) pins each difference so reconciling the engines has to be deliberate. For choices of action the owner's direction asks a different question from belief strength: costs and benefits across every stakeholder with a legitimate interest, the quantity and quality of interests met, under different assumptions about which interests are valid. See [[Likelihood of Costs and Benefits]], [[Likely Interests of Those Who Agree and Disagree]] and the site's [cost-benefit method](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba).

## The older rules, and what replaced them

**The founding workbook (replaced, kept runnable).** The very first version of this page's idea, in the owner's Excel workbook, counted reasons (the code, [conclusion-score.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/conclusion-score.ts), with twins in `sql/conclusion_score_process.sql` and `examples/php-score-retrieval/`):

```
linkage(edge) = (agree − disagree) / (agree + disagree)      in [−1, 1], 1 when nobody has debated it
score(C)      = nAgree − nDisagree
              + m × (Σ_agree score(child) × linkage − Σ_disagree score(child) × linkage)
```

`m` is the sub-argument multiplier, the workbook's `Index!O1 = 0.7` (its per-sheet formulas predate that cell and use m = 1). Each listed reason counted one point whether or not it had a page. That is the owner's current direction on volume in its earliest form: a contribution counts from the moment it is posted. It was replaced by Truth × Link × Imp × Uniq, in which raw counts became argued weights.

**Conclusion Score with depth division (replaced).** [docs/ALGORITHMS.md](https://github.com/myklob/ideastockexchange/blob/master/docs/ALGORITHMS.md), section 1, gives:

```
CS = Σ[(A(n,i)/n) × L] − Σ[(D(n,j)/n) × L] / (Total Arguments)
```

where n is depth (direct arguments full weight, each level down divided by n), L is linkage 0.0 to 1.0, and the total is normalised by the argument count. As written, operator precedence divides only the disagree term by the total; the JavaScript example beside it divides the whole difference, `(proSum − conSum) / Math.max(totalArgs, 1)`, which is evidently what was meant (a reading of the two). Neither engine runs it. The published site says what runs instead: "No division by depth or by count. A row passes its page's truth, gated by that page's confidence, and a page's truth is a share of argued weight around its starting point" ([method](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun)).

The same table on the method page lists the other replaced rules near this one: evidence start values by kind (meta-analysis 1.0, peer-reviewed 0.8, anecdote 0.1) replaced by the evidence tiers, which keep every start between 0.05 and 0.95; lifecycle multipliers (active 1.0, weakened 0.7, conditional 0.8, outdated 0.3, refuted 0.1) replaced by nothing, because a row argued false already scores below zero through `2 × Truth − 1`; and "only the first of several rows making one point counts, plus a corroboration boost" replaced by a uniqueness factor per row and a replication reward capped at twice k.

## Where the engines disagree about volume

Here is the disagreement, stated once and plainly.

On the published site, listing a reason nobody has argued is worth **exactly zero**. A score cannot be padded. The price is the 0.50 trap: every page whose foundations cite nothing reads 0.50 forever.

In the Next.js app, `A / (A + D)` over argument strengths means listing an unargued reason **does** raise the score. Volume counts. The price is that a score can be padded by anyone willing to type, held back only by the uniqueness factor.

**The owner's direction (October 2026)** settles the goal and leaves the rule to be found: for belief strength, start from the quantity of truly independent reasons to agree and disagree, rank how valid they are against each other, and let the weight of pro against con decide. Contributions count from the moment they are posted and are argued down from there, because "a rule under which work counts for nothing until someone proves it tells contributors their effort is wasted". Evidence should be able to outweigh opinion by 15 or 200 times, with no ceiling. Whatever rule best promotes good ideas and demotes bad ones in the real world wins, and the way to find it is to publish a rule beside the current one and compare them on real pages.

That is what [tally.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) is. It keeps every factor (so a reason argued false, Truth near 0, weighs nearly nothing, and a duplicate argued redundant, Uniqueness near 0, adds nearly nothing) and drops the two things that hold the argued score at 0.50: the `2 × Truth − 1` and the confidence gate.

```
a reason or prediction weighs   Truth × Linkage × Importance × Uniqueness
a finding weighs                the same × (1 + ESIW × ERQ × ERP/100), uncapped
independent reasons on a side   the sum of Uniqueness over its reasons
share for                       (weight for + w × p0) / (weight for + weight against + w)
```

The evidence strength `ESIW × ERQ × ERP/100` has no ceiling, as the owner prefers: a statistic (0.90) replicated 20 times with 100% agreement weighs `1 + 18 = 19` times a bare reason. The argued truth score's own evidence prior is still bounded (replication capped at 2.0, p0 between 0.05 and 0.95), and changing that is a rule change with a conformance diff to review ([conformance.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py), `python3 conformance.py --write`). The two rules have not yet been compared and neither leads; see the [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally).

## What Makes This Different

| Traditional Debate | Idea Stock Exchange | Status today |
|---|---|---|
| Arguments appear chronologically | Arguments organized by logical structure | **Built.** Every table on a page is sorted by score, top rows shown, the rest collapsed |
| Winner determined by rhetoric | Winner determined by evidence weight | **Built, literally.** On the published site only evidence can move a score off 0.50 |
| Same points repeated endlessly | Duplicates merged via semantic clustering | **Partly built.** Duplicates are *flagged* by a lexical measure and turned into votes at submission; they are not merged or scored automatically on the published site (see below) |
| **Static:** Debunked claims stay visible | **Dynamic:** Scores update when evidence changes | **Built.** Scores are computed on read, every build. Debunked claims also stay visible, deliberately: nothing drafted is ever deleted, and a refuted claim stays on the page counting against its own side |
| No way to measure argument strength | Every claim gets a quantified score | **Built.** Every page has a truth score, a belief score, a confidence, a count-every-reason share, and a sensitivity table |
| Tribal warfare and loyalty tests | Show your work or lose credibility | **Built.** Every number on a page links to the page that argues it, or shows in grey that it rests on a labelled constant |

## Quality Control: Preventing Garbage In, Garbage Out

Any scoring system is only as good as its inputs. ReasonRank includes three layers of protection:

### 1. Semantic Clustering

The system groups similar arguments automatically. "Roundabouts reduce crashes" and "Roundabouts improve safety" don't get counted twice. You can't inflate your score by restating the same point fifty different ways.

**Status.** On the published site this is built as a flag, not as automatic grouping, and the difference is deliberate. [similarity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) compares every pair of claims by two lexical signals, Jaccard overlap of content words and cosine over character 4-grams, both weighted by inverse document frequency, averaged. A pair at `FLAG = 0.45` is listed for a human to read; at `MERGE = 0.70` the two pages are probably one page. It measures wording, not meaning, and says so: it would flag "officials must not trade stocks" against "officials must not trade bonds" and miss "the ban is unenforceable" against "no agency could police it". So it changes no score. The equivalency blend `ES = w_ces × CES + w_ues × UES` gives the computed half weight 0 until a validity comparison page argues otherwise, and the uniqueness factor stays at 1 until someone opens a uniqueness page. "Roundabouts reduce crashes" and "Roundabouts improve safety" would likely be flagged and would count twice until someone argued the overlap. At submission the same measure runs as you type ([contribute.js](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js)) and again on the GitHub issue ([intake.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py)): at or above 0.70 a submission becomes a vote for the claim already there. The Next.js app does score computed similarity, as `1 − max similarity`. See [[Equivalency Score:]], [[The Redundancy Problem]] and [[Template: Belief Equivalence Scorecard]].

### 2. Community Validation

Users can flag weak linkage scores, identify missing counterarguments, and challenge the relevance of evidence. Crowdsourced verification catches what automation misses.

**Status: built, through GitHub, because there is no server.** Every belief page has a form under each table and a propose-a-belief form; each opens a prefilled GitHub issue, and the intake workflow turns it into rows, a vote, or a pull request. Challenging a linkage means adding a row to that row's linkage page, which is how Link falls (and rises). Votes are recorded and shown on the heading line after the score and never scored: `NO_MOVE = 'A vote never moves a score; the page shows it next to what the analysis says, as what people think.'` (intake.py). That is the owner's direction on votes: they may decide what gets attention, never what is valid, and the gap between the vote share and the truth score is ranked on its own list, "Votes vs the analysis" ([lists](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes)), once anyone has voted, because it says where people need more time with the argument.

### 3. Expert Review

Specialists assess [[evidence quality|Evidence Verification Score (EVS)]], evaluate logical consistency, and review the [[assumptions|Assumptions]] underlying major claims. This prevents sophisticated manipulation while keeping the system open to new contributors.

**Status: proposed, not built as a role.** No part of the code knows who is an expert, and nothing weighs a contributor's credentials, which is consistent with the original's own line that the system "doesn't care about your credentials". What exists in its place: evidence quality is set by source type, replication and agreement, so an expert's work enters as a classified finding (expert testimony with supporting data is a tier at 0.65; an expert or social media claim, 0.60); logical consistency has the structural checks in [integrity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) (circular support, a conclusion listed among its own premises, a page padded with the same row twice, among others), which name faults and move no score; and assumptions are rows with a typed load-bearing flag that caps the page, rather than a separately argued necessity score. A specialist reviewing a page does it the same way anyone else does: by adding rows that argue.

## The Bigger Picture

ReasonRank isn't just an algorithm. It's a commitment to a specific vision of how we make decisions:

- Beliefs should be **proportional to evidence**, not popularity
- Arguments should be **transparent**, not hidden behind rhetoric
- Truth should **update dynamically** as facts change
- Reasoning should be **systematic**, not tribal

We've spent centuries developing the scientific method for testing physical reality. ReasonRank applies those same principles to evaluating arguments about policy, values, and complex social questions.

This is how we complete the Enlightenment project. This is how we build collective intelligence that actually works.

The first bullet is the one the published engine takes most seriously, to the point of discomfort. "Proportional to evidence" means a belief with no evidence beneath it is held at a coin flip, and the site prints that coin flip rather than a flattering number. Whether that is the right place to start, or whether contributions should count from the moment they are posted as the owner now directs, is exactly what the two rules side by side are there to find out. See [[Quantifying Reason: The Power of Truth Scores]] and [[Evidence‐based policy]].

## Technical Deep Dives

Want to understand the implementation details? Explore these resources:

- [Full codebase on GitHub](https://github.com/myklob/ideastockexchange)
- [[How Truth Scores Work|Truth Score]]
- [[Understanding Linkage Scores|Linkage Scores]]
- [[Evidence Evaluation Framework|Evidence Verification Score (EVS)]]
- [Importance Weighting System](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula)
- [[Sub-Argument Score Calculation|Argument Scores from Sub-Argument Scores]] (this page)
- [Integration with Cost-Benefit Analysis](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba)

And the files this page quotes:

| File | What it holds |
|---|---|
| [tools/static-site/score_reference.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py) | The published row rule, page truth, load-bearing cap, constants |
| [tools/static-site/evidence.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py) | Where a page starts: ESIW tiers, `p0`, replication weight |
| [tools/static-site/confidence.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py) | How much a page's score is allowed to count |
| [tools/static-site/tally.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) | The owner's count-every-reason rule, printed beside the truth score |
| [tools/static-site/sensitivity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py) | Which single input would change the answer |
| [tools/static-site/reasonrank.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py) | How much of the site rests on a page |
| [tools/static-site/similarity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) | Which claims say the same thing |
| [tools/static-site/integrity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) | Structural faults, and the pre-publish loop check |
| [tools/static-site/method.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/method.py) | The reader-facing [methodology page](https://myklob.github.io/ideastockexchange/beliefs/method.html) |
| [src/core/scoring/scoring-engine.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts) | The app's damped ReasonRank, linkage debates, impact formula |
| [src/lib/propagate-belief-scores.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts) | The app's upward propagation on change |
| [src/core/scoring/cba-scoring.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/cba-scoring.ts) | The cost-benefit recursion with depth attenuation |
| [src/lib/conclusion-score.ts](https://github.com/myklob/ideastockexchange/blob/master/src/lib/conclusion-score.ts) | The founding workbook's rule, kept for reference |

## Join the Movement

The Idea Stock Exchange isn't complete. It's not perfect. It never will be, because the pursuit of truth is an ongoing process, not a destination.

But it's *better*. Better than shouting matches. Better than tribal warfare. Better than letting the loudest voice or the slickest marketing win.

We're building Wikipedia for policy debates. A system where you can see every argument, trace every claim back to its evidence, and watch the scores update as truth emerges.

**[Help us improve the algorithm.](https://myklob.github.io/ideastockexchange/beliefs/index.html)** Submit edge cases. Challenge our assumptions. Propose better weighting systems. The strength of this platform depends on people like you who care about getting things right.

Because here's what's at stake: Democracy requires informed citizens. Markets require accurate information. Progress requires distinguishing good ideas from bad ones. And none of that works when we can't agree on basic facts or evaluate arguments systematically.

ReasonRank is our answer. Not perfect. But measurable. Transparent. Self-correcting.

**Show us your math. Let's build something better together.**

The quickest way to do that today is the form on any belief page, or the propose-a-belief form on the [home page](https://myklob.github.io/ideastockexchange/beliefs/index.html). The most useful edge case right now is any belief held at 0.50 by an unargued load-bearing premise: argue the premise, or file the finding under it, and watch the number move. The "What to argue next" ranking on the [lists page](https://myklob.github.io/ideastockexchange/beliefs/lists.html) ranks claims by `rank × (1 − confidence)`, so the ones everything rests on and nobody has worked on come first.

## Related Scores Needed to be Calculated

| Score | Where it is explained | Status |
|---|---|---|
| [[Argument scores from sub-argument scores\|Argument Scores from Sub-Argument Scores]] | This page | **Built** on the published site (score_reference.py) and, differently, in the app (scoring-engine.ts) |
| [[Evidence Scores\|Evidence Verification Score (EVS)]] | [[Evidence Verification Score (EVS)]], [method](https://myklob.github.io/ideastockexchange/beliefs/method.html#evs) | **Built.** Evidence sets a page's starting point; the wiki's Overall EVS, `ESIW × ECRS × ERQ × ERP/100`, is shown on every Evidence Ledger and read by no score |
| [[Book Logical Validity Score\|Media]] | [[Media]], [[Template: Media Analysis]] | **Built as a media page's quality**: its own argument table, scored by the page-truth rule |
| [Importance Score](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula) | [[Likely Interests of Those Who Agree and Disagree]] | **Built.** `max over listed interests of Validity × Bears`; unargued, 0.5 |
| [[Linkage Score Code\|Linkage Scores]] | [[Linkage Scores]], [[Evidence to Conclusion Relevance Score]] | **Built.** A linkage page's truth by the argued-truth rule; unargued, 1 |
| [[Truth Scores\|Truth Score]] | [[Truth Score]] | **Built** |
| [[Media Truth Score\|Media]] | [[Media]], [method](https://myklob.github.io/ideastockexchange/beliefs/method.html#media) | **Built.** Quality and influence each by the page-truth rule on the site; the app's engine is [media-truth.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/media-truth.ts) |
| topic overlap scores | (no page yet) | **Not run on the published site**; each belief is filed under one topic by an author. The app has `calculateTopicOverlapScore` in all-scores.ts |
| Objective criteria scores | [[Template: Belief Analysis]] | **Partly built.** The `criterion` section feeds a belief page's Objective Criteria table; the app has `calculateObjectiveCriteriaScore` in all-scores.ts |
| [[Media Genre and Style Scores:\|Media]] | [[Media]] | **Built in the app only**: `calculateMediaScores` by genre in all-scores.ts |

## Open decisions for the owner

These are recorded in the repository's CLAUDE.md as calls for the owner, not for a session, and each bears directly on how sub-argument scores become argument scores:

1. **The two engines disagree about volume.** The published site's signed rule against the app's `A / (A + D)`. Which leads is to be settled by comparing them on real pages, which the count-every-reason line now makes possible.
2. **Evidence is filed above the premise it bears on.** Beliefs cite findings on the belief page while their load-bearing premises cite nothing, so they argue above 0.50 and read 0.50. Re-filing a finding under the premise it supports changes what the argument says, so it is an editorial act.
3. **`applyArgumentDeduplication` in cba-scoring.ts is called by nothing**, so a point made three ways in one cost-benefit argument tree counts three times.
4. **The load-bearing cap treats "unargued" as 0.50 and lets it cap.** Conservative and correct as probability, and with the unargued-row rule it is what holds most beliefs at 0.50. Changing it is a rule change with a conformance diff, and waits on the comparison above.

## See also

[[ReasonRank]] · [[ReasonRank: Google's PageRank for Arguments]] · [[Truth Score]] · [[Quantifying Reason: The Power of Truth Scores]] · [[Linkage Scores]] · [[Evidence Verification Score (EVS)]] · [[Evidence to Conclusion Relevance Score]] · [[Confidence Stability Scores]] · [[Equivalency Score:]] · [[The Redundancy Problem]] · [[Assumptions]] · [[Belief Web Navigation]] · [[Pros and Cons on the Same Page]] · [[One Page per Debate Topic]] · [[Likelihood of Costs and Benefits]] · [[Templates]] · [[Template: Belief Analysis]] · [[Template: Linkage Evaluation]]
