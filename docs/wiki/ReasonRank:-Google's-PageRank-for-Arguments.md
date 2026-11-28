# ReasonRank: Google's PageRank for Arguments

_[[Home]] > Page Design > [[ReasonRank]] **Algorithm**_

Google's **PageRank** measures the number and quality of links to a website to decide how important it is. It does **not** ask whether anything on that website is true. A page explaining that the moon is made of cheese, linked by ten thousand cheese enthusiasts, outranks a careful page on lunar geology linked by three astronomers. PageRank was built to find what the web pays attention to, and it does that brilliantly.

**ReasonRank** steals the idea and points it at a **pro/con forum**. Instead of web pages and hyperlinks, it reads beliefs and the reasons filed under them, and it evaluates the persuasiveness, relevance and quality of each individual argument. The owner's newer draft of this page put the ambition bluntly: ReasonRank is "the operating system for truth", the core algorithm of the Idea Stock Exchange. Just as PageRank treated hyperlinks as votes for a website's importance, ReasonRank treats logical arguments as votes for a belief's truth.

That is the pitch. Here is the honest state of things, because a page about scoring that misdescribes the score is worse than no page.

**The name now sits on three different mechanisms in the code, and they answer three different questions.** The static site's own source says so in its first paragraph: "Two different things live under that name in the wiki, and only one of them was missing here" ([`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py), lines 3 to 4). The Next.js app adds a third.

| Mechanism | The question it answers | Where it runs | Status |
|---|---|---|---|
| **The scoring rule** | Is this claim true, given its reasons and evidence? | [`tools/static-site/score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), the published site | Running, on every page of [the live site](https://myklob.github.io/ideastockexchange/beliefs/index.html) |
| **The walk** (the part that is actually PageRank) | How much of the whole site depends on this claim? | [`tools/static-site/reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py) | Running; printed as "Relied on (ReasonRank)" on every page |
| **The damped tree blend** | How strong is this argument, blending its own truth with its sub-arguments? | [`src/core/scoring/scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts), the Next.js app | Running in the app's protocol dashboard and cost-benefit likelihoods; the app's main belief page uses a simpler per-edge formula (below) |

The rest of this page explains each one with its real formula, then walks through every promise the earlier versions of this page made and says what became of it: built, built differently, proposed, or refused on purpose.

---

## The core philosophy

The internet solved the problem of **information access**, and in doing so it created the problem of **information verification**. Online debates today are decided by three things, none of which has anything to do with being right:

1. **Volume:** who shouts the loudest?
2. **Repetition:** who posts the most often?
3. **Tribalism:** who has the most followers?

ReasonRank replaces those metrics with a single standard: **evidence**. You cannot win by being charismatic. You can only win by building a structure of strong evidence that logically supports your conclusion.

### The "Trust Graph"

ReasonRank imagines all human knowledge as a directed graph:

* **Nodes** are claims (beliefs).
* **Edges** are logical connections (arguments).
* **Weight** is the strength of the evidence (truth score).

**What the code does with that picture.** The published site stores exactly this graph and nothing else: two flat tables, `pages` (one claim per page) and `edges` (one row per argument, from the page it sits on to the page it reads), with **no stored scores**. Every number on the site is computed from those two tables when the site is built (code: [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), lines 5 to 26). One refinement the original picture lacked: an edge is not weighted by one number but by three, each of which is itself a claim with its own page that anyone can argue (linkage, importance, uniqueness). The weight of an argument is never typed in by a moderator. It is argued for, like everything else.

> Just as PageRank scores pages higher when they are linked to by high-quality pages, ReasonRank scores arguments higher when they are supported by high-quality reasoning.

That sentence is true of the scoring rule. It is deliberately **not** true of the walk, which ranks a claim by how much rests on it, whether or not the claim is any good. Both halves are explained below, and the difference turns out to be the most useful idea on this page.

---

## How It Works (what the 2025 page promised, and what runs)

The 2025 version of this page said ReasonRank modifies PageRank to do four things. Each one, with its status:

| Promise | Status | What actually runs |
|---|---|---|
| Evaluate both **pro** and **con** arguments | **Running in both engines** | Static site: every row is signed, and a row lands on the side its sign puts it on, so a reason to agree that has been argued false counts *against* the belief ([`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), lines 161 to 179). Next.js: pro and con sub-arguments are summed separately and subtracted ([`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts), `scoreArgument`). The walk itself carries no sign: a con row transmits dependence exactly like a pro row, because a claim that could sink a belief matters as much as one that could float it. |
| Weigh arguments by **quantity** and **quality** of their supporting or opposing reasons | **Quality: running. Quantity: the two engines disagree, on purpose, pending a comparison** | See "Does volume count?" below. The static site's argued rule makes an unargued reason worth exactly zero; the owner's count-every-reason rule is printed beside it; the Next.js engine counts every listed reason. |
| Consider *linkage strength*, *uniqueness*, *verification*, and *logical soundness* | **Linkage, uniqueness, verification: running. Logical soundness: built differently from the promise** | Linkage and uniqueness are multipliers on every row; verification sets where a claim's truth starts; logical soundness enters as argued fallacy claims, never as a pattern-match deduction. Each has a section below. |
| Incorporate **user feedback** (votes, credibility scores) to refine rankings over time | **Refused by the published site; partly built in the Next.js app** | On the static site a vote never moves a score. In the Next.js app, credibility-weighted votes can settle a fallacy claim and set an edge's linkage. Details in "Votes, credibility and feedback" below. |

---

## Part one: the scoring rule (is it true?)

This is what most people mean when they say ReasonRank, and it is the rule every truth score on [the live site](https://myklob.github.io/ideastockexchange/beliefs/index.html) comes from. The methodology page prints it with every constant at [method.html#formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula).

### What one row contributes

Every reason, piece of evidence and prediction filed under a page is one row, and one formula covers all three (code: [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), `_contrib`, lines 160 to 174):

```
row contribution = sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq
```

| Factor | What it is | What it reads when nobody has argued it |
|---|---|---|
| `sign` | +1 for a reason to agree, -1 for a reason to disagree | |
| `Truth` | The truth score of the claim the row points at, moved onto a -1 to +1 scale by `2 x Truth - 1` | `UNARG = 0.5`, so `2 x 0.5 - 1 = 0`: an unargued claim contributes exactly nothing |
| `Confidence` | How much work stands behind that claim's own page, 0 to 1 ([`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py)) | 0 for a row whose claim has no page at all |
| `Link` | The truth score of the row's **linkage page**: if the claim were true, would the conclusion have to move? | `DEFLINK = 1`: a reason placed under a conclusion is presumed relevant |
| `Imp` | The truth score of the row's **importance page**: the most valid interest this row really speaks to | `DEFIMP = 0.5`, the neutral start |
| `Uniq` | The truth score of the row's **uniqueness page**: does this row say something no other row already says? | `DEFUNIQ = 1`: presumed distinct until someone argues the overlap |

The constants live in one line of code: `CONSTS = {'K': 1, 'UNARG': 0.5, 'DEFLINK': 1, 'DEFIMP': 0.5, 'DEFUNIQ': 1}` (line 34). Each one shows in grey on any page where it is standing in for an argument nobody has made yet, so a reader can see at a glance which factors are resting on a presumption ([method.html#constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants)).

Two features of that formula do most of the work:

* **Arguing a reason false turns it into a reason against.** Ten refuted reasons to agree do not pad a belief; they weaken it. A reason argued down to 0.2 contributes `2 x 0.2 - 1 = -0.6` times its multipliers, on the other side of the ledger.
* **Listing a claim is worth nothing until it is argued.** A claim sitting at 0.5 contributes zero, so nobody can win by flooding a page with assertions. This is the static site's answer to "Volume, Repetition, Tribalism".

### From rows to a page's truth

The rows on a page are split by the sign they land on, into POS (weight for) and NEG (weight against), and the page's truth is (code: `_share`, lines 152 to 159):

```
page truth (argued) = (POS + w x p0) / (POS + NEG + w)
page truth          = min(argued, weakest load-bearing component that has its own page)
belief score        = POS - NEG   (open-ended)
```

`p0` and `w` are the page's **starting point** and how heavily it counts, set by the evidence the page itself declares (next section). A page that cites nothing starts at `p0 = 0.5` with `w = K = 1`, which works exactly like one neutral vote already in the box. The second line is the **load-bearing cap**: a conclusion cannot be more settled than a premise it needs. If a belief has three components flagged load-bearing and one of them reads 0.50, the belief reads at most 0.50, however strong everything else is (code: lines 208 to 209).

The owner's 2026 draft wrote the formula as **Belief Score = Base + Σ(Pro Scores) - Σ(Con Scores)**, with each argument scored **Argument Score = V x L x I x U**, on a scale of 0 to 100. The code is recognisably that idea, with three differences: the "Base" became the evidence prior `w x p0`, inside a ratio rather than added on; the truth score runs 0 to 1 rather than 0 to 100 (the open-ended `POS - NEG` is printed separately as the belief score); and a fifth factor, Confidence, gates every row.

### The trap, and the way out: evidence

Follow that arithmetic to its end and something alarming happens. A page with no rows reads 0.50. A row pointing at a 0.50 page contributes zero. So its parent reads 0.50. By induction, **every page of an argument graph in which nothing is cited reads exactly 0.50, forever**, however much arguing goes on. Reasoning about reasoning never touches the world. The test suite pins this as a law: `test_argument_alone_can_never_leave_the_neutral_point` builds unsourced chains of 2, 5 and 40 claims and checks every one reads 0.5 ([`test_engines.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py), line 43). If that test ever fails, something has been added that lets a score move without evidence, and it needs a reason, not a fix to the test.

The way out is evidence. A page may declare what it rests on, in three typed fields, and that sets where its truth starts (code: [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py), `prior`, line 140):

```
p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)
w  = K x replication(ERQ),   replication(n) = 2 x n / (n + 1)
```

* **ESIW** is the kind of source: sixteen tiers from the [[Evidence Verification Score (EVS)]] page plus one addition, from statistics with the source cited (0.90) and a primary official record (0.90, the addition) through randomised trials (0.85), meta-analyses (0.80), anecdote (0.55) and common sense (0.50) down to a historical artifact (0.10). It decides **how far** a claim can be pushed.
* **ERP** is the share of independent replications that agreed. It decides **which way**. At 50% a claim starts at 0.50 whatever its tier, because a contested literature has established nothing.
* **ERQ** is the number of replications. It decides **how hard the start is to shift**, and it is bounded: 1 replication gives weight 1.00, 2 give 1.33, 3 give 1.50, 10 give 1.82, and no number ever gives more than 2.00.

Because the strongest tier weighs 0.90, every starting point stays between 0.05 and 0.95. Evidence opens the question; it never closes it. The last twentieth takes an argument, on a page. The full tier table is on [method.html#starts](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts).

### The count-every-reason rule, printed beside it

The owner's direction (October 2026) is that belief strength should start from the quantity of truly independent reasons to agree and disagree, rank how valid they are against each other, and let the weight of pro against con decide, with contributions counting **from the moment they are posted** and argued down from there. A rule under which work counts for nothing until someone proves it tells contributors their effort is wasted (owner's judgment).

The argued rule above does the opposite, so a second rule is now computed and printed on every belief page beside the truth score, under the heading "Counting every reason until it is argued down" (code: [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py); explained at [method.html#tally](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)):

```
a reason or prediction weighs   Truth x Linkage x Importance x Uniqueness
a finding weighs                the same x (1 + ESIW x ERQ x ERP/100), uncapped
independent reasons on a side   the sum of Uniqueness over its reasons
share for                       (weight for + w x p0) / (weight for + weight against + w)
```

It drops the two things that hold the argued rule at 0.50: the `2 x Truth - 1` and the confidence gate. It keeps everything else, so a reason argued false still weighs almost nothing and a duplicate argued redundant still adds almost nothing. The evidence term has no ceiling, which is the owner's stated preference: a body of replicated work should be able to outweigh a pile of opinion by 15 or 200 times. **No other number reads it yet.** The argued rule and its pinned test stay unchanged until the two have been compared on real pages.

**A worked comparison** (calculation, from the two formulas and the default constants). A belief with one reason to agree that nobody has argued, no linkage, importance or uniqueness page, and no evidence:

| Rule | Arithmetic | Reads |
|---|---|---|
| Argued rule (`score_reference.py`) | row = `+1 x (2 x 0.5 - 1) x ... = 0`; truth = `(0 + 1 x 0.5) / (0 + 0 + 1)` | **0.50** |
| Count-every-reason (`tally.py`) | weight for = `0.5 x 1 x 0.5 x 1 = 0.25`; share = `(0.25 + 0.5) / (0.25 + 0 + 1)` | **0.60** |
| Next.js protocol engine (`scoring-engine.ts`) | ProRank = `0.5 x linkage x 1 x 1 > 0`, ConRank = 0; truth = `ProRank / (ProRank + 0) = 1`, clamped | **0.99** |

Same input, three answers. That spread is the unresolved volume question in one table.

---

## Part two: the walk (how much depends on it?)

This is the part the name was actually borrowed for, and it took the project a while to notice that it is not a truth score at all. PageRank never asks whether a page is correct. It asks how much of the web's attention arrives there. The argument analogue asks **how much of the site's conclusion-weight flows through a claim**: not "is this true?" but "how much depends on it?" In the code's own words, "a claim can be perfectly true and matter to nothing, and a claim can be undecided and hold up four separate policy conclusions at once. Nothing else on this site could tell those two apart" ([`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py), lines 13 to 14).

### The algorithm

Picture a reader who starts at a belief picked at random, follows one of its reasons to that reason's page, follows one of the reasons there, and so on. ReasonRank is the share of that reader's time spent on each page. Precisely (code: `_channels` and `_run`, lines 85 to 125):

1. **Start** with the walk spread evenly over the beliefs: `1/n` on each of the `n` belief pages, 0 everywhere else.
2. **Step** from a page to one of the pages its rows read. Each row's pull is its capacity:

   ```
   capacity(row) = Link x Imp x Uniq      (defaults 1.0, 0.5, 1.0)
   ```

   A row with capacity 0 or less is skipped. A row's capacity is split **evenly** among every page it references (its claim, its linkage page, its importance page, its uniqueness page, and any `drives`, `addresses` or `equiv` page), because each factor of a product is equally load-bearing: a linkage argued to 0 kills a row as thoroughly as a claim argued false.
3. **Restart**: with probability `1 - d` the reader jumps back to a belief. `d = DAMPING = 0.85`, PageRank's own constant, so 15% of the walk's time is spent restarting. That keeps the ranking anchored to the conclusions people actually want decided, instead of drifting into whichever corner of the graph is densest.
4. **Dangling pages**: the walk arriving at a page with no rows goes back to the beliefs.
5. **Stop** when the total change in one step (the L1 residual) falls below `TOLERANCE = 1e-12`. `ITERATIONS = 2000` is a cap the walk never reaches.

Every page in the rows of every table counts: reasons and evidence on both sides, predictions, logical components, interests, costs and benefits, and media (code: `ROW_KEYS`, `FLAT_KEYS`, `NESTED_KEYS`, lines 53 to 56).

### What is deliberately left out

Two things are absent from `capacity`, and their absence is the whole point (code: docstring, lines 21 to 25; pinned by tests):

* **The truth of the claim being ranked.** Capacity is how much the row could carry once the claim is settled either way. A ranking that fell when a claim was refuted would be measuring agreement rather than dependence, and a page would drop off the work list at the very moment it was proved false. `test_rank_ignores_the_truth_of_the_claims_it_ranks` pins a claim's truth at 0 and checks no rank on the site moves, to nine decimal places.
* **Confidence.** A page nobody has started work on is exactly the page this ranking exists to find. `test_rank_ignores_confidence_entirely` checks that forcing every confidence to 1 moves nothing.

The multipliers are not left out, and they are themselves truth scores. A linkage page argued down to 0.2 really does carry less, whatever happens to the claim. So moving the truth of a page used as a multiplier moves the ranking, and moving the truth of a page used only as a claim does not. `test_rank_does_follow_a_multiplier_that_is_argued_down` is the mirror test.

Other pinned properties: the ranks are a probability distribution (they sum to 1 and none is negative), the walk converged (residual below 1e-6), no page outranks a belief the walk starts from, and the damping is PageRank's 0.85 restarting at the beliefs ([`test_engines.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py), lines 234 to 301).

### What it is for: the work queue

Rank alone names what matters. Rank against confidence names what to do:

```
work(page) = rank x (1 - confidence)
```

High rank and finished work is a settled foundation. High rank and unfinished work is the next thing an analyst should spend a week on (code: `work_queue`, line 162; pinned by `test_work_value_is_rank_times_unfinished_work`). The beliefs themselves are left out of the queue, because they always top a ranking that starts from them, and "work on the conclusion" is not a work plan.

### Live numbers

On the current tables (calculation: the site's own `ReasonRank` class run over `tools/static-site/content/`, October 2026), the walk covers **4,263 pages**, starts from **196 beliefs**, and converges to a residual of about **9.6e-13**. The most relied-on claim that is not itself a belief is the interest [Voters need enough information to judge whether an official is compromised](https://myklob.github.io/ideastockexchange/beliefs/p/voters-need-enough-information.html): rank 197 of 4,263 (right behind the 196 beliefs), sitting under **five** separate beliefs, with a truth score of exactly **0.50** and confidence 0.30. It is undecided and five conclusions lean on it. That is precisely the kind of claim a truth score alone cannot flag and the walk exists to find.

### Where you see it

* On every claim page, the meta table prints **"Relied on (ReasonRank)"** (the rank and its place out of all pages) and **"Work value"** (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), lines 1176 to 1177).
* The [home page](https://myklob.github.io/ideastockexchange/beliefs/index.html) carries a **Most relied on** card and a **What to argue next** card; [lists.html](https://myklob.github.io/ideastockexchange/beliefs/lists.html) says for each what it shows, how it is worked out and why it is tracked. Its entry for Most relied on says outright that the list "is also the honest stand-in for 'popular'. Nobody's votes or views are counted here". The What to argue next page also prints, for each claim, how many beliefs sit above it (`beliefs_reached`).
* Each page's JSON export carries `reasonrank` and `reasonrank_place`.
* The methodology is at [method.html#reasonrank](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank).

### The matrix PageRank that is written down and not run

[`docs/ALGORITHMS.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/ALGORITHMS.md) section 7 carries the textbook form, `R(p) = (1-d)/N + d x Σ(R(q)/L(q))`, with a JavaScript `reasonRank(adjacencyMatrix, iterations = 100, d = 0.85)` that restarts evenly over every argument and runs 100 fixed iterations. **Replaced.** The site's methodology lists it among "Rules in the wiki this site does not run": "The walk restarts at the beliefs only and steps in proportion to Link x Imp x Uniq" ([method.html#notrun](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun)). Restarting at every argument would rank a claim by how many claims exist near it rather than by how many conclusions need it.

---

## Part three: the Next.js engine (the damped tree blend)

The Next.js app in `src/core/scoring/` carries a third reading of the name, and it is the one that most resembles the formula on the 2025 page. Its header states the analogy directly (code: [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts), lines 11 to 13):

```
PageRank:   PR(A) = (1-d)/N + d x Σ PR(Ti)/C(Ti)
ReasonRank: RR(A) = (1-d) x baseTruth + d x f(proSubRank - conSubRank)
```

### One argument (`scoreArgument`)

```
baseTruth    = max(0, truthScore x (1 - Σ |fallacy impact| / 100))
leaf:          reasonRank = baseTruth
otherwise:     proSubRank  = Σ rawImpact of pro sub-arguments
               conSubRank  = Σ rawImpact of con sub-arguments
               subArgScore = clamp(0.5 + 0.5 x (proSubRank - conSubRank) / numSubArgs, 0, 1)
               reasonRank  = 0.15 x baseTruth + 0.85 x subArgScore
rawImpact    = reasonRank x linkage x importance x uniqueness
               (importance and uniqueness default to 1.0 when absent)
```

`DAMPING_FACTOR = 0.85` (line 58). Here it means something different from the walk: 85% of an argument's score comes from its sub-arguments and 15% from its own base truth, applied only to arguments that have sub-arguments.

**A worked example** (calculation). An argument with base truth 0.8 and two pro sub-arguments, each a leaf with truth 0.9 and every multiplier at 1: proSubRank = 1.8, conSubRank = 0, subArgScore = `0.5 + 0.5 x 1.8 / 2 = 0.95`, reasonRank = `0.15 x 0.8 + 0.85 x 0.95 = 0.9275`.

### One belief (`scoreProtocolBelief`)

```
ProRank    = Σ rawImpact of pro arguments
ConRank    = Σ rawImpact of con arguments
base       = ProRank / (ProRank + ConRank)          (0.5 when both are zero)
evidence   = (supporting - weakening) / count x 0.2,   each item = tier weight x linkage
truthScore = clamp(base + evidence, 0.01, 0.99)
```

Evidence tier weights: `T0 = 0.05` (retracted or fraudulent), `T1 = 1.0` (peer-reviewed or official), `T2 = 0.75` (expert or institutional), `T3 = 0.5` (journalism or surveys), `T4 = 0.25` (opinion or anecdote) (lines 108 to 114).

**Where it runs.** The Schlicht protocol dashboard, the `/api/protocol/[id]/linkage` route, and cost-benefit likelihood estimates through `calculateReasonRankScore`.

**Where it does not.** The app's canonical belief page (`/beliefs/[slug]`) scores each edge with a flatter rule, `computeArgumentImpactScore = sign x childTruth x |linkage| x importance x uniqueness x 100` (line 774), and propagates it upward through every parent belief whenever anything changes ([`propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts)). Its truth breakdown (`calculateTruthScoreBreakdown` in [`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts)) takes the pro share of argued weight.

### A fourth kernel, mostly unwired

[`src/core/reasonrank/engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/reasonrank/engine.ts) implements five invariants: propagation continuity (a child's change recomputes every parent until the change is below epsilon), the "death match" (a node with more opposition than support contributes 0 and never propagates a negative), diminishing returns for semantically identical arguments, falsified evidence forcing a branch to 0, and relevance as a property of the edge rather than the node. Its `DEFAULT_CONFIG` is `epsilon 0.001, maxDepth 100, baseScore 1.0` ([`types.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/reasonrank/types.ts)). Only one piece of it reaches a page: `VERIFICATION_SCORES = VERIFIED 1.0, DISPUTED 0.5, UNVERIFIED 0.5, FALSIFIED 0.0`, which the belief page's Evidence Ledger turns into its Standing column.

### The app's work queue

The Next.js app answers "what should be argued next?" with its own engine rather than the walk: [`decision-leverage.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts) ranks every argument edge by the conclusion score still at stake on it, from four gaps (evidence 0.40, linkage 0.25, scoring 0.15, examination 0.20). Same purpose as the walk's work value, different arithmetic, and unlike the walk it does read the number of linkage votes (`1/sqrt(1 + votes)`).

### The product explainer is behind

The app's `/algorithms/reason-rank` page ([`page.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/app/algorithms/reason-rank/page.tsx)) gives no formula and no damping constant, and its description lists Objective Criteria and Confidence Stability among ReasonRank's inputs, neither of which the per-edge formula reads. The how-it-works page says "twelve score dimensions" where `all-scores.ts` says "All 11 ReasonRank scores". Both are stale text, not different rules.

---

## The 0.85, three ways

The damping factor is the one number on the 2025 page that the code shares verbatim, and it means something different everywhere it appears.

| Where | What `d = 0.85` means |
|---|---|
| Google's PageRank | The chance a random surfer clicks another link rather than jumping to a random page |
| The static site's walk (`reasonrank.py`) | The chance the walk steps on rather than restarting at a belief, so 15% of its time is restarts |
| The Next.js engine (`scoring-engine.ts`) | The share of an argument's score that comes from its sub-arguments; the other 15% is its own base truth |
| The 2025 sample code below | A multiplier on the whole propagated vector with no `1 - d` term, which is neither of the above and makes the scores decay to zero |

---

## The four dimensions

The owner's 2026 draft weighs every argument on four dimensions. All four are multipliers in the running code, each with its own status.

| Variable | Dimension | Definition (owner's draft) | What runs |
|---|---|---|---|
| **V** | [[Truth Score]] | Is the argument itself true? Based on [[Evidence Tiers|Evidence Verification Score (EVS)]]. | `Truth` in the row rule, on the -1 to +1 scale inside a row; recursive, because a claim's truth comes from its own rows |
| **L** | [[Linkage Score|Linkage Scores]] | Is the argument relevant? (0.0 to 1.0). "True but irrelevant" gets a low score. | `Link`, the truth of the row's linkage page; 1 when no page exists |
| **I** | [Importance Score](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula) | Is this a major point or a minor nitpick? | `Imp`, the truth of the row's importance page: the largest `Validity x Bears` among the interests it lists; 0.5 when no page exists |
| **U** | [[Uniqueness Score|The Redundancy Problem]] | Is this a new point, or a duplicate? (Anti-spam filter.) | `Uniq`, the truth of the row's uniqueness page; 1 when no page exists |

The running rule adds a fifth, **Confidence**, which the draft did not have: how much work stands behind the claim's own page. At confidence 0 a claim moves its parent not at all however true it looks. The structural parts of confidence are grounding 0.30, two-sidedness 0.20, scrutiny of the multipliers 0.20, breadth 0.15, depth 0.05, sourcing 0.05 and testability 0.05 ([`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py), lines 30 to 38; see [[Confidence Stability Scores]]).

### A. Truth Score (V)

The engine of the system. It measures the internal validity of a claim, and it is **recursive**: the truth score of a conclusion depends on the truth scores of its premises (see [[Argument Scores from Sub-Argument Scores]] and [[Quantifying Reason: The Power of Truth Scores]]).

The owner's draft started a claim at a value set by its kind of evidence:

* **Tier 1 evidence (meta-analysis):** V = 1.0
* **Tier 2 evidence (peer-reviewed study):** V = 0.8
* **Tier 4 evidence (anecdote):** V = 0.1
* **Refuted evidence:** V = 0.0

**Replaced.** The static site's methodology lists these four figures among the rules it does not run ([method.html#notrun](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun)). What runs instead is the sixteen-tier evidence prior above, where a meta-analysis that every replication confirms starts at 0.90 (not 1.0), a confirmed anecdote starts at 0.775 and a contradicted one at 0.225, and refuted evidence never reaches 0.0, because the floor is 0.05 (calculation from `p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)`). The principle survives intact: a cited finding does not start at a coin flip. The Next.js app keeps a five-tier table closer to the draft's (T1 = 1.0 down to T0 = 0.05 for retracted).

### B. Linkage Score (L)

This prevents the "red herring" fallacy. A user might post a fact that is 100% true ("The sun is hot") and use it to support an unrelated conclusion ("Therefore, we should lower taxes"). The draft has ReasonRank assign this a **Linkage Score of 0.1**, neutralising the argument despite its high truth score.

**What runs.** Nothing assigns 0.1 automatically. On the static site, linkage is the truth score of a linkage page, argued with its own reasons to agree and disagree (see [[Linkage Scores]], [[Evidence to Conclusion Relevance Score]] and [[Template: Linkage Evaluation]]). The sun-and-taxes row gets its low linkage when someone argues it down on that page, and from then on it carries almost nothing. This matches the owner's direction on linkage: **start trusting, fall when argued down, rise when argued well.** One wrinkle worth knowing (calculation from the code): with no linkage page the row reads `DEFLINK = 1`, but a linkage page that has been opened and not yet argued reads its neutral start, 0.50, so opening the page halves the row until someone argues it back up. In the Next.js app linkage runs from -1 to +1 and resolves in priority order: a full linkage debate scored by its own tree, then a reputation-weighted mean of linkage votes, then a static field (`resolveLinkageScore`, lines 214 to 230).

### C. Uniqueness Score (U)

This solves the "echo chamber" problem. On social media, if 1,000 people repeat the same slogan, it trends. The draft has the algorithm detect semantic similarity:

* **First instance:** U = 1.0 (full impact)
* **Duplicate instance:** U = 0.05 (diminished impact)
* _Result: 1,000 people shouting the same thing counts as ONE argument._

**What runs on the static site** gets the same result by a different route, in two places:

1. **At the door.** When a reader types a new claim, [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) scores it against every claim already in the tables, and [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) checks again on the GitHub issue. At or above `MERGE = 0.70` similarity, the submission **is** the existing claim and is recorded as the submitter's vote for it. So 1,000 people posting the same slogan produce one claim and 1,000 votes, and votes never move a score. The draft's result, achieved without any discount.
2. **On the page.** `Uniq` is the truth of a uniqueness page, presumed 1 until argued. A computed similarity ([`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py)) reads every pair of claims: 0.5 x IDF-weighted Jaccard overlap of content words + 0.5 x IDF-weighted cosine over character 4-grams, with `FLAG = 0.45` (worth a human reading), `MERGE = 0.70` (probably one page), `IDF_FLOOR = 0.05`, `JMIN = 0.05` and `PAIRCAP = 1,500,000`. **It changes no score.** Its weight in the blend `ES = w_ces x CES + (1 - w_ces) x UES` is 0 until a validity comparison page argues otherwise, because "a number that silently discounts an argument and has no page behind it cannot be audited" ([method.html#equivalency](https://myklob.github.io/ideastockexchange/beliefs/method.html#equivalency)). It flags pairs for someone to open a uniqueness page and argue.

**What runs in the Next.js app** is the draft's version: `uniquenessScore = 1 - max similarity to any prior argument` ([`duplication-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/duplication-scoring.ts), line 355), from token Jaccard with synonym and negation normalisation, `MECHANICAL_EQUIVALENCE_THRESHOLD = 0.85` and layer weights 0.4 / 0.6 / 0.0. An argument 95% similar to an earlier sibling gets U = 0.05, exactly the draft's number, and this one **does** move the app's scores at propagation time. See [[The Redundancy Problem]], [[Equivalency Score:]] and [[Template: Belief Equivalence Scorecard]].

---

## The logic cascade (recursion)

This is the most powerful feature of ReasonRank. Because arguments are linked in a network, changes to the foundation automatically update the roof.

### Scenario: the retraction (owner's draft)

1. **Level 1 (Foundation):** A scientific paper claims Drug X is safe. (Score: 90)
2. **Level 2 (Argument):** A user argues "We should approve Drug X because it is safe." (Score: 90)
3. **Level 3 (Policy):** The belief page "Legalize Drug X" has a high score.

**The event:** the scientific paper is retracted due to errors.

* **Level 1 score** drops to **0**.
* **Level 2 score** automatically recalculates: (Truth 0 x Linkage 1.0) = **0**.
* **Level 3 score** collapses immediately.

No human moderator needs to intervene. The truth updates itself.

### The same scenario through the running code

**Static site** (calculation: `score_reference.py` run on a three-page chain, confidence held at 1 as the engine's tests do; on the live site confidence would shrink every number toward 0.50). The paper is a meta-analysis (ESIW 0.80) with four replications:

| | Before: all 4 replications agree (ERP 100) | After: all 4 contradict (ERP 0) | Contested: half agree (ERP 50) |
|---|---|---|---|
| Level 1, the finding | 0.90 (weight 1.6) | 0.10 | 0.50 |
| Level 2, "approve because it is safe" | 0.643 | 0.357 | 0.50 |
| Level 3, "Legalize Drug X" | 0.5625 | 0.4375 | 0.50 |

Two differences from the draft. First, the static site has no "retracted" flag; a retraction is expressed by the replication record turning against the finding or by arguing its page down. Second, the cascade does not stop at zero, it **reverses**: a finding argued false contributes `2 x Truth - 1 < 0`, so the argument that rested on it now counts against approval. A paper shown wrong is evidence of something, not merely the absence of evidence (code: `_contrib`, `_split`).

**Next.js app.** Here the draft's arithmetic is closer to literal. A retracted source is tier `T0 = 0.05`, a falsified one scores 0 in `VERIFICATION_SCORES`, the edge's impact `sign x childTruth x |linkage| x importance x uniqueness x 100` falls toward 0 (neutralised, not reversed), and `propagate-belief-scores.ts` recomputes every parent upward with a visited set to stop loops. The Evidence Ledger's Standing column also shows how many points of a belief's score rest on evidence whose standing is not established ([`evidence-exposure.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/evidence-exposure.ts)).

**Two things the cascade needs that the draft did not mention**, both running on the static site:

* **Loops are refused.** A claim that supports itself (directly or through a chain) can hold any value and stay consistent, so there is no number to publish. The scorer raises `CircularSupport` by name, and [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) checks the tables for it before CI will publish anything.
* **What would flip the answer.** [`sensitivity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py) holds each claim beneath a page at false and then at true, one at a time, recomputes the whole graph, and reports where the conclusion crosses 0.50, both as things stand and with that claim's work finished ([method.html#sensitivity](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity)). It is the cascade run deliberately, as a what-if, before the retraction happens. [`changes.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/changes.py) reports what actually moved since the last revision.

---

## Votes, credibility and feedback

The 2025 page promised that ReasonRank would "incorporate user feedback (votes, credibility scores) to refine rankings over time", and its variable list included `feedback_data` (votes, credibility, sentiment).

**The owner's direction (October 2026):** there are many scores. Track what is popular separately from what stands up to analysis. Votes may decide what is promoted and given attention, **never what is valid**, and the gap between the two is worth showing because it says where people need more time with the argument.

**The static site follows that exactly.** A vote is a GitHub issue filed from a form on the page; [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) records it in [`content/votes.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/votes.csv), one row per person per claim, latest vote wins. A vote can be on whether a claim is true, or on whether a row bears on the page it is filed on, which is a vote on the argument as an argument. The counts show on the claim's heading line after the score badge, and the [home page](https://myklob.github.io/ideastockexchange/beliefs/index.html) has a Recently voted card ([lists.html#votes](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes)). And then: `NO_MOVE = 'A vote never moves a score; the page shows it next to what the analysis says, as what people think.'` (intake.py, line 90). The walk takes no feedback input at all (`ReasonRank(corpus, damping)`), and the confidence score lists "up and down votes" among behavioural signals at weight 0. The file holds two votes today.

**The Next.js app does let votes in, in three narrow places:**

* **Fallacy claims.** Votes on a filed fallacy accusation are weighted by the voter's credibility, a track record of accuracy and of flagging both sides, clamped between `CREDIBILITY_FLOOR = 0.3` and `CREDIBILITY_CEILING = 1.4` ([`calibration.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/calibration.ts)). At 60% weighted agreement (`CONSENSUS_THRESHOLD = 0.6`) the claim's counter-argument is published into the edge's linkage debate and the scores propagate upward ([`votes/route.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/fallacy-claims/%5Bid%5D/votes/route.ts)). Filing volume never raises credibility; only being right and even-handed do.
* **Protocol linkage.** In the protocol engine, when no linkage debate exists, a reputation-weighted mean of linkage votes sets the edge's linkage, clamped to [-1, 1] (`aggregateLinkageVotes`), and that multiplies into the belief's truth score.
* **Equivalence pairs.** Weighted votes resolve whether two claims are the same, at the same 60% bar, without touching a score.

Sentiment appears in no engine as an input.

So, measured against the owner's line: the static site is on it. The app's fallacy votes are close to it (a vote decides which counter-argument is published, and the argument then does the scoring), while the protocol engine's vote-set linkage is a place where a vote sets a validity number directly, which the direction says it should not.

---

## Logical soundness and fallacies

The 2025 page listed "logical soundness" as a ReasonRank input.

**The owner's direction:** nothing is final. Software may flag a possible fallacy, and the flag is a claim people argue for and against like any other. **A flag alone moves no score.**

* **Static site: no pattern matching at all.** "Fallacy detection is not done." On a site whose subject is often officials acting on their own interests, a matcher looking for "attacking the person rather than the argument" would fire on the central legitimate argument page after page, "and a score moved by a pattern match has no page anyone can argue with. A fallacy is argued instead, as a reason to disagree on the linkage page of the row it infects" ([method.html#checks](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks)). What it does compute is structural: circular support, a conclusion listed among its own premises, padding, each named on the page and none moving a score.
* **Next.js app: software flags, people decide.** [`fallacy-detector.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/fallacy-detector.ts) matches prose against patterns (ad hominem, appeal to popularity, false cause, overgeneralisation and others) and drafts a counter-argument aimed at the factor the fallacy damages. Its own header: "A fallacy detection is an argument, not a penalty", and "no score is ever docked because a detector fired"; it returns no numeric fields by design. A draft counts only once a fallacy claim is confirmed by credibility-weighted vote, at which point it enters the linkage debate with strength 0.8 for a major fallacy or 0.5 for a minor one. This is the owner's direction, built.
* **One older path still deducts.** The protocol engine's `scoreArgument` docks `baseTruth = truthScore x (1 - Σ |impact| / 100)` for any fallacies recorded on an argument. A ladder in [`claims.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/claims.ts) (0.95 no confirmed fallacy, 0.75 one minor, 0.45 one major, 0.25 two or more) exists and nothing calls it.

The wiki's "Logical Fallacy Score" was never a page; the fallacy material lives in the sections above and on [method.html#checks](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks).

---

## Sentiment

The 2025 sample multiplied every final score by `(1 + doc.sentiment)` from spaCy. **Refused by design.** A number asserted by a model, or produced by matching text, is the one thing the published engine will not carry: every number on the site is a link to the page that argues it, and sentiment has no page anyone could argue with. Being cheerful about a claim is not evidence for it. (It would also have done nothing: spaCy's `en_core_web_lg` sets `doc.sentiment` to 0.0 unless a custom component fills it in.) The only model-asserted scores in the repository, in `src/core/ai/scorer.py`, are imported by nothing in the product.

---

## Variables Needed (2025 page), and what replaced each

The 2025 page said that to implement ReasonRank the algorithm uses:

1. **`M_pro` / `M_con`**: adjacency matrices for pro and con arguments.
2. **`M_linkage_pro` / `M_linkage_con`**: matrices for argument-to-conclusion linkage.
3. **`uniqueness_scores_pro` / `uniqueness_scores_con`**: argument uniqueness values.
4. **`initial_scores_pro` / `initial_scores_con`**: starting scores for arguments.
5. **`num_iterations`**: number of PageRank-like update cycles (default: `100`).
6. **`d`**: damping factor (default: `0.85`).
7. **`feedback_data`**: optional user feedback (votes, credibility, sentiment).

None of the names exists in the repository. What does:

| 2025 variable | Status | Static site | Next.js app |
|---|---|---|---|
| `M_pro` / `M_con` | Replaced | No matrices. The walk builds `page -> {page it reads: share}` from row capacities (`_channels`), unsigned, one structure for both sides | A tree: `arg.subArguments`, filtered by side |
| `M_linkage_pro` / `M_linkage_con` | Replaced | One linkage page per edge (`link_id`), default `DEFLINK = 1` | `resolveLinkageScore` per argument: debate, then votes, then static field |
| `uniqueness_scores_pro` / `_con` | Replaced | One uniqueness page per edge (`uniq_id`), default `DEFUNIQ = 1`; computed similarity flags only | `1 - max similarity` to prior same-side siblings, default 1.0 |
| `initial_scores_pro` / `_con` | Replaced | Walk: `1/n` on each belief, 0 elsewhere. Truth: the evidence prior `p0` with weight `w` | A leaf's score is its own base truth |
| `num_iterations` = 100 | Replaced | Run until the residual is below `1e-12`, cap 2000, residual published | No iteration: one recursive pass over the tree |
| `d` = 0.85 | **Running**, same constant | Chance of stepping on rather than restarting at a belief | Share of an argument's score from its sub-arguments |
| `feedback_data` | Refused (static site); partly built (app) | A vote never moves a score | Credibility-weighted fallacy votes; vote-set protocol linkage |

---

## Sample code (2025 page)

<details><summary>Original sketch (2023), not what runs</summary>

What runs instead is the walk in [`tools/static-site/reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py) for dependence and the row rule in [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py) for truth, both pure Python with no dependencies beyond the standard library (the site's `requirements.txt` is `openpyxl` only, for reading the workbook).

```python
import numpy as np
import dask.array as da
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from typing import Dict, List, Optional

nlp = spacy.load("en_core_web_lg")

def reason_rank(M_pro, M_con, initial_scores, argument_texts,
                num_iterations=100, feedback_data=None, damping_factor=0.85):
    uniqueness_scores = compute_uniqueness_scores(argument_texts)
    feedback_scores = integrate_feedback(feedback_data) if feedback_data else {
        'pro': np.ones_like(initial_scores['pro']),
        'con': np.ones_like(initial_scores['con'])
    }
    scores = {'pro': initial_scores['pro'].copy(), 'con': initial_scores['con'].copy()}

    for _ in range(num_iterations):
        scores = propagate_scores(M_pro, M_con, scores, uniqueness_scores, feedback_scores, damping_factor)

    return apply_domain_specific_enhancements(scores, argument_texts)

def propagate_scores(M_pro, M_con, scores, uniqueness_scores, feedback_scores, damping_factor):
    updated_scores = {}
    for arg_type, M in [('pro', M_pro), ('con', M_con)]:
        dask_M = da.from_array(M, chunks=(1000, 1000))
        dask_scores = da.from_array(scores[arg_type] * uniqueness_scores[arg_type] * feedback_scores[arg_type], chunks=(1000,))
        updated_scores[arg_type] = da.dot(dask_M, dask_scores).compute() * damping_factor
    return updated_scores

def compute_uniqueness_scores(argument_texts):
    all_texts = argument_texts['pro'] + argument_texts['con']
    vectorizer = TfidfVectorizer().fit(all_texts)
    return {
        arg_type: 1 - vectorizer.transform(argument_texts[arg_type]).toarray().max(axis=1)
        for arg_type in ['pro', 'con']
    }

def integrate_feedback(feedback_data):
    return {
        arg_type: np.mean(feedback_data[arg_type], axis=0) if arg_type in feedback_data else np.ones(len(feedback_data[arg_type]))
        for arg_type in ['pro', 'con']
    }

def apply_domain_specific_enhancements(scores, argument_texts):
    enhanced_scores = scores.copy()
    for arg_type in ['pro', 'con']:
        for i, text in enumerate(argument_texts[arg_type]):
            doc = nlp(text)
            sentiment = doc.sentiment
            enhanced_scores[arg_type][i] *= (1 + sentiment)
    return enhanced_scores

# Example
M_pro = np.array([[0.1, 0.2], [0.2, 0.1]])
M_con = np.array([[0.1, 0.2], [0.2, 0.1]])
initial_scores = {'pro': np.array([1, 1]), 'con': np.array([1, 1])}
argument_texts = {'pro': ["Pro 1", "Pro 2"], 'con': ["Con 1", "Con 2"]}
feedback_data = {'pro': np.array([[0.9, 1.1]]), 'con': np.array([[0.8, 1.2]])}

final_scores = reason_rank(M_pro, M_con, initial_scores, argument_texts, feedback_data=feedback_data)
print("Final Scores:", final_scores)
```

Why it would not work as written, for anyone tempted to resurrect it (calculation, from the code above):

* **It decays to zero.** There is no `1 - d` restart term and no normalisation, so each pass multiplies by the matrix (whose rows sum to 0.3) and by 0.85. After 100 passes every score is vanishingly small.
* **The uniqueness step does not measure duplication.** `toarray().max(axis=1)` takes the largest TF-IDF weight *inside* each text, a property of one text, not a similarity between two. In the example it is worse: scikit-learn's default tokenizer drops one-character tokens, so each text ("Pro 1") reduces to a single word, its normalised weight is 1.0, and every uniqueness score is `1 - 1 = 0`. The example prints zeros.
* **`integrate_feedback` cannot take its own fallback.** Its else-branch reads `feedback_data[arg_type]` for exactly the key it just found missing.
* **The sentiment step is a no-op**, as above.
* **None of numpy, dask, spaCy or scikit-learn is a project dependency.** scikit-learn appears only in the unwired `src/core/ai/` modules.

</details>

### The owner's simplified sketch (2026 draft)

<details><summary>Original sketch (2023), not what runs</summary>

What runs instead is the convergent walk with a restart term in [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py), and the signed row rule in [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), where pro adds and con subtracts exactly as this sketch intends.

The draft introduced it this way: "ReasonRank is implemented using **Matrix Propagation**. We treat the debate as a linear algebra problem, allowing us to calculate scores for millions of arguments simultaneously."

```python
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

def calculate_reason_rank(M_pro, M_con, initial_scores, argument_texts, damping=0.85):
    """
    M_pro: Adjacency matrix of supporting arguments
    M_con: Adjacency matrix of opposing arguments
    damping: The 'friction' that prevents infinite loops (standard PageRank physics)
    """
    # 1. Calculate Uniqueness (The Anti-Echo Filter)
    # We use TF-IDF to find and down-weight redundant text
    uniqueness_scores = compute_uniqueness(argument_texts)

    # 2. The Propagation Loop
    # Logic flows from evidence nodes -> conclusion nodes
    # Pro Arguments ADD to the score
    pro_flow = np.dot(M_pro, initial_scores['pro'] * uniqueness_scores['pro'])
    # Con Arguments SUBTRACT from the score
    con_flow = np.dot(M_con, initial_scores['con'] * uniqueness_scores['con'])

    # 3. Final Calculation
    # New Score = Old Score + (Pro Flow - Con Flow) * Damping
    net_score = (pro_flow - con_flow) * damping

    return normalize_score(net_score)
```

Notes: `compute_uniqueness` and `normalize_score` are placeholders never defined. The sketch makes one pass, not an iteration. "Damping prevents infinite loops" is not what damping does in PageRank (it keeps the walk from getting trapped and makes the ranking unique); in the running code, infinite loops are prevented by refusing circular support outright.

</details>

---

## Comparison: PageRank vs. ReasonRank

The owner's draft table, with a column for what the code actually does:

| Feature | Google PageRank | ISE ReasonRank (draft) | What runs |
|---|---|---|---|
| **Input** | Webpages and hyperlinks | Beliefs and arguments | Two tables, `pages` and `edges`; every multiplier is itself a page |
| **Primary metric** | Popularity / authority | Validity / evidence | Two metrics, kept apart: truth (the row rule) and dependence (the walk) |
| **Direction** | Positive only (links help) | Positive and negative (refutations hurt) | Truth: signed, and a refuted reason flips sides. Walk: unsigned, because dependence has no direction |
| **Spam protection** | Link farm detection | [Semantic clustering](https://myklob.github.io/ideastockexchange/beliefs/method.html#equivalency) | Duplicate submissions become votes at the door (similarity 0.70 or more); unargued claims count 0; computed similarity flags, argued uniqueness discounts |
| **Goal** | Find the most _important_ page | Find the most _truthful_ idea | Both: the truth score finds the best-supported idea, and the walk finds the most important unsettled claim |

The draft's table framed ReasonRank as PageRank with importance swapped for truth. The code ended up keeping both, and the combination is the interesting part: importance times unfinished work is a to-do list for civilisation.

---

## Why It Matters

* **Objective ranking** of arguments instead of relying on loudness or popularity. **Running.** On the static site no vote enters any score, and an unargued claim contributes exactly 0, so repetition cannot pad. The Next.js how-it-works page makes the same point: not by counting upvotes, "because a vote measures how many people showed up, not whether they are right."
* **Transparent scoring**: every factor in the score is visible and open to challenge. **Running.** Every multiplier is a page with its own reasons; every unargued factor shows its labelled constant in grey; every page prints its weight for and against, its starting point, its ReasonRank and its work value; the methodology page is generated from the same modules the pages run, "so it cannot describe a rule the site is not using." In the app, each edge has a factor-by-factor provenance page and a linkage sub-debate.
* **Dynamic updates**: scores shift as evidence, feedback, and arguments change. **Running for evidence and arguments; feedback only in the app.** The static site recomputes everything on every build and reports what moved; the app propagates upward from any changed belief. Votes shift nothing on the static site; in the app, a confirmed fallacy claim re-scores the edge and everything above it.

---

## What is still unsettled

These are recorded as open in the project's `CLAUDE.md`, and the owner's direction says to settle them by publishing rules side by side and comparing them on real pages rather than by replacing one unseen:

1. **Does volume count?** The argued rule says no, the Next.js engine says yes, and the owner's count-every-reason rule (`tally.py`) is now printed beside the argued truth score so the two can be compared. Until then the pinned test stands.
2. **The load-bearing cap treats "unargued" as 0.50 and lets it cap.** Conservative and correct as probability, and with the unargued-row rule it is what holds most beliefs at 0.50. Changing it is a rule change with a conformance diff to review ([`conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py) holds the cross-implementation contract).
3. **Which mechanism should carry the name.** This page describes all three. The static site's methodology already uses "ReasonRank" for the walk and "truth score" for the rule, which is the least confusing split.

---

## The future of reason

ReasonRank is not just code; it is a mechanism for **collective intelligence**. By forcing arguments to compete on **evidence (V)** and **logic (L)** rather than rhetoric, it builds a system where the best ideas rise to the top. The owner calls it the first step toward a **reason-based society**: see [[Electronic Democracy]], [[Automated Conflict Resolution Platform]] and [[Evidence‐based policy]].

The code adds a sober footnote the draft did not have. Argument alone cannot lift a single claim off 0.50; only evidence can. A reason-based society, on this arithmetic, is an evidence-based one, and the most useful thing ReasonRank can tell you is not which side is winning but which undecided claim everything else is waiting on.

---

## See also

* [[ReasonRank Overview|ReasonRank]]
* [[Evidence Verification Score|Evidence Verification Score (EVS)]]
* Logical Fallacy Score (never written as a page; see "Logical soundness and fallacies" above and [method.html#checks](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks))
* [[Equivalency Score|Equivalency Score:]]
* [[Truth Scores|Truth Score]]: how we verify facts.
* [[Linkage Scores]]: how we measure relevance.
* [[Confidence Stability Scores]], [[Argument Scores from Sub-Argument Scores]], [[The Redundancy Problem]], [[Pros and Cons on the Same Page]], [[Belief Web Navigation]]
* Templates: [[Template: Belief Analysis]] (the page every score lands on), [[Template: Linkage Evaluation]], [[Template: Belief Equivalence Scorecard]], and the full list at [[Templates]]
* On the live site: [the home page](https://myklob.github.io/ideastockexchange/beliefs/index.html), [the lists and how each is ranked](https://myklob.github.io/ideastockexchange/beliefs/lists.html), [topics](https://myklob.github.io/ideastockexchange/beliefs/topics.html), [Public office and private gain](https://myklob.github.io/ideastockexchange/beliefs/t/public-office-private-gain.html) (a topic whose beliefs share the most relied-on interest), and the methodology sections [formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula), [starts](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts), [tally](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally), [confidence](https://myklob.github.io/ideastockexchange/beliefs/method.html#confidence), [reasonrank](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank), [sensitivity](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity), [equivalency](https://myklob.github.io/ideastockexchange/beliefs/method.html#equivalency), [checks](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks), [rules not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun) and [constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants)
* Code: [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py), [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py), [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py), [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts), and the [GitHub repository](https://github.com/myklob/ideastockexchange) itself
