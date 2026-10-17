# Truth Score

A truth score is the number on a belief page that says how far the argument, so far, has moved the claim away from a coin flip. On the published site it runs from 0 to 1, starts at 0.50, and is computed from two flat tables every time the site is built. Nobody types it. Nobody votes it up. It moves only when somebody argues a reason, cites a finding, or shows that a reason already listed is false, beside the point, or a repeat.

This page began life in 2025 as "Truth Score: Integrating Logical Fallacy and Evidence Verification Scores". That page said the Truth Score combines two measures, a Logical Fallacy Score and an Evidence Verification Score, and sketched a machine-learning fallacy detector. Everything it said is still here. What has changed is that the code now exists, in two engines that do not agree with each other, and the page says for every mechanism what runs, where, with which constants, and what was proposed and never built.

**How to read the labels on this page.** Each mechanism carries one of five statuses: *runs on the published site* (the static site at myklob.github.io, built from `tools/static-site/`), *runs in the Next.js app* (the product in `src/`, which the belief page `/beliefs/[slug]` reads), *proposed, not built*, *replaced* (by a named mechanism), or *refused by design* (the code does the opposite and says why). Every formula is quoted from the file that runs it, with a link. Where a number comes from arithmetic done for this page rather than from the code, it says "calculation". Where it comes from the owner's stated direction rather than from code, it says so.

Related pages: [[Evidence Verification Score (EVS)]] for the evidence half in full, [[Linkage Scores]] and [[Evidence to Conclusion Relevance Score]] for relevance, [[Confidence Stability Scores]] for how much a score is allowed to count, [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]] for how scores flow through the graph, and [[Quantifying Reason: The Power of Truth Scores]], which is a second draft of this same page with a six-step algorithm and an "alternate explanation"; read it after this one.

## The original framing: two measures

The 2025 page opened like this, and the owner's framing stands:

> The **Truth Score** quantifies the strength of an argument by combining two key measures:
>
> 1. **Logical Fallacy Score**: evaluates the extent to which an argument relies on logical fallacies.
> 2. **Evidence Verification Score**: measures how strongly a claim is supported by independent, replicable evidence (e.g., blind studies, scenario comparisons).
>
> By integrating these scores, we can more accurately assess the rationality and validity of an argument.

And it gave three reasons the pairing matters:

- **Logical integrity**: detect and weigh the use of common fallacies.
- **Empirical validation**: reward arguments supported by verified data.
- **Better group decision-making**: stronger foundations for policy, public opinion, and collaboration.

Three things about that framing have moved, and the rest of this page is the detail.

**First, the object.** In both engines the Truth Score is a score of a *page* (a belief or a claim), not of an argument. An argument's strength is a different number: on the published site it is the row's contribution, `sign x (2 x Truth - 1) x Conf x Link x Imp x Uniq` (code: [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)); in the app it is `impactScore` (code: [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)). "Quantifies the strength of an argument" was the wrong noun.

**Second, the fallacy half.** No module in either engine computes anything called a Logical Fallacy Score; the name appears nowhere in `src/` or `tools/`. The 2025 page linked it to a private Google Sites draft, and no wiki page of that name exists, so the words "Logical Fallacy Score" on this page are plain text. What replaced it: on the published site, a flag that is a question people argue, plus structural checks that move no score (refused by design, with the reason quoted below); in the app, structured fallacy *claims* that are arguments, confirmed by a weighted vote, with a validity ladder that is written and tested but not yet wired to anything.

**Third, the evidence half.** It survived with its name and its table. See [[Evidence Verification Score (EVS)]]. But on the published site evidence is not a multiplier combined with anything; it sets where a page's truth *starts*, and that turns out to be the one thing that lets any score leave 0.50 at all.

**"Logical integrity: detect and weigh."** Status: partial in the app, refused on the published site. Detection exists in the app as six regular expressions run only on agent-submitted claims, and weighing exists through a community vote; the two are deliberately decoupled, so nothing is weighed until people confirm it (code: [`fallacy-detector.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/fallacy-detector.ts), [`propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts), which reads only `status: 'published'` rows). The published site detects by phrase list and weighs nothing.

**"Empirical validation: reward arguments supported by verified data."** Status: runs in both engines, differently. Published site: a page that declares its evidence type, replication count and replication agreement starts above or below 0.50 by the prior formula below; a page that declares nothing stays at 0.50 however often it is cited (code: [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py)). App: each evidence row's EVS is multiplied by a lifecycle weight, `VERIFIED 1.0`, `UNVERIFIED 0.5`, `DISPUTED 0.5`, `FALSIFIED 0.0` (code: `VERIFICATION_SCORES` in [`src/core/reasonrank/types.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/reasonrank/types.ts)), and the Evidence Ledger prints a Standing column plus how many points rest on standing nobody has established (code: [`evidence-exposure.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/evidence-exposure.ts)).

**"Better group decision-making."** The owner's judgment, not a mechanism. The nearest thing in code is the published site's rule that every number is a link to the page that argues it, so a disagreement about a score becomes a disagreement about a specific row that anyone can go and argue.

## The published site's truth score

This is what myklob.github.io serves. Everything here is from [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py) and [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py), and the site's own methodology page says the same thing in prose: [How every number on this site is computed](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula).

### One formula for every row

Every scored row on every page, whether it is a reason, a cited finding or a prediction, contributes exactly this to the page above it (code: `Model._contrib`):

```
row contribution = sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq
```

- `sign` is +1 for a row filed on the agree side and -1 for the disagree side.
- `Truth` is the truth score of the row's own page (the claim it cites).
- `Confidence` is how much that page has earned the right to count, in [0, 1], from [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py). A row whose claim has no page of its own gets confidence 0.0 and contributes nothing.
- `Link`, `Imp`, `Uniq` are the truth scores of the row's linkage, importance and uniqueness pages, each of which is itself an argued page with reasons for and against.

A multiplier with no page reads a labelled constant (code: the `CONSTS` line):

| Constant | Value | What it presumes |
|---|---|---|
| `K` | 1 | The weight of a page's starting point, before its own rows count |
| `UNARG` | 0.5 | The truth of a claim nobody has opened a page for |
| `DEFLINK` | 1 | A link nobody has argued is presumed fully relevant |
| `DEFIMP` | 0.5 | An importance nobody has argued is presumed middling |
| `DEFUNIQ` | 1 | A row nobody has argued a duplicate is presumed distinct |

Each constant is shown in grey on the page, so a reader can see which factors are still resting on a presumption ([the labelled constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants)).

`DEFLINK = 1` is the owner's direction on linkage built as a default: start trusting, and lower a link as people show a reason is unrelated or invalid. The owner's stated view is that any sensible starting guess is acceptable (the contributor's record, topic relatedness, an AI estimate, or 0.5 where tokens are short); the site uses 1.

### Why the (2 x Truth - 1) is there

Truth enters on the -1 to +1 scale, which does two things at once (code: the `_contrib` docstring).

A claim argued *false* counts **against** the side it was filed on. Ten refuted reasons to agree weaken the belief instead of padding it. The site's `_split` function puts each row on the side its sign lands on, not the side it was filed on, so a refuted objection counts as support and a refuted reason counts against.

A claim nobody has argued sits at `UNARG = 0.5`, and `2 x 0.5 - 1 = 0`. **Listing a claim is worth exactly nothing until it is argued.** That is the anti-padding rule, and it is why a page cannot be gamed by typing in twenty reasons.

Calculation, to see it move. Suppose a belief lists one reason to agree whose own page has been argued to 0.80, with confidence 1, no linkage, importance or uniqueness page (so `Link = 1`, `Imp = 0.5`, `Uniq = 1`), and the belief cites no evidence. The row contributes `(2 x 0.80 - 1) x 1 x 1 x 0.5 x 1 = 0.30`. The same reason argued down to 0.20 contributes `(2 x 0.20 - 1) x 0.5 = -0.30`, which lands on the disagree side. The same reason with no page at all contributes `(2 x 0.5 - 1) x 0 = 0` twice over: once for the neutral truth, once for the zero confidence.

### From rows to a page's truth

```
POS, NEG            = the positive and negative contributions, as magnitudes
truth (argued)      = (POS + w x p0) / (POS + NEG + w)
truth (published)   = min(argued, weakest load-bearing component that has its own page)
belief score        = POS - NEG            (open-ended)
```

`p0` and `w` are where the page starts and how heavily, from what the page says it rests on (next section). A page that cites nothing has `p0 = 0.5` and `w = K = 1`, the neutral vote the rule always had.

Continuing the calculation: with `POS = 0.30`, `NEG = 0`, `p0 = 0.5`, `w = 1`, the belief reads `(0.30 + 0.5) / (0.30 + 0 + 1) = 0.615`. With the reason refuted, `(0 + 0.5) / (0 + 0.30 + 1) = 0.385`. With the reason unargued, `0.5 / 1 = 0.50`. One reason moves a page part of the way, never to certainty, because the starting vote is always in the denominator.

**The load-bearing cap.** A page may list components it needs to be true and mark some of them load-bearing (the `lb` flag on the Logical Anatomy table, typed by the author). A conclusion cannot be more settled than a premise it cannot survive without, so the published truth is the smaller of what the rows argue and the weakest such premise that has a page. It is a minimum, not a replacement: a premise better established than the conclusion leaves it alone, and a premise with no page caps nothing (code: `Model.evaluate`; prose: [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula)). The wiki's Necessity Score under [[Assumptions]], an argued number for how much a conclusion needs each premise, is not computed; this one typed flag does that job.

**What is deliberately not in the formula.** No fallacy term. No vote. No source-quality multiplier on the row (source quality belongs to the claim, so it sets where the claim's own page starts, and putting it on the edge as well would count it twice). Arguments, evidence and predictions all go through the one formula into one share: `pos, neg = _split(args + evid + preds)`.

### Where a page starts, and why it has to start somewhere

This is the part that is easy to skip and is load-bearing. The docstring of [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py) works it out: a row contributes `(2 x Truth - 1)`, so a claim at 0.50 contributes nothing; a page with no rows reads 0.50; so every page whose rows all point at such pages also reads 0.50; and by induction **every page of any finite argument graph in which nothing is cited reads exactly 0.50 forever.** Run the scorer on a chain of a thousand claims with confidence forced to 1 and every one of them is 0.50. Argument about argument never touches the world.

[`test_engines.py::test_argument_alone_can_never_leave_the_neutral_point`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py) pins this for unsourced chains of 2, 5 and 40 pages. If it ever fails, something has been added that lets a score move without evidence, and that needs a reason, not a fix to the test.

The way out is evidence. A page may declare three typed fields, `etype`, `erq` and `erp`, and they set where its truth starts:

```
ESIW   how far that kind of source can move it      a published statistic outranks an eyewitness
ERQ    how many independent replications exist      one study is a finding; four is a fact
ERP    what share of them agreed                     four studies that disagree are not four studies

prior   p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)
weight  w  = k x replication(ERQ),   replication(n) = 2n / (n + 1),   REP_CAP = 2.0
truth      = (POS + w x p0) / (POS + NEG + w)
```

Defaults when a field is absent: `erq 1`, `erp 100`, and `ESIW = NOSOURCE = 0.0` when no type is named, so a page that declares nothing returns exactly `(0.5, k)`.

Read it at its corners (calculation, matching the file's own examples). A published statistic (ESIW 0.90) that every replication confirms starts at `0.5 + 0.5 x 0.90 x 1 = 0.95`; the same statistic contradicted by every replication starts at 0.05. The strongest source in the table weighs 0.90, so `p0` is confined to [0.05, 0.95] and evidence alone never drives a claim to certainty; the last twentieth takes an argument on a page. An eyewitness account (0.20) confirmed starts at 0.60 and contradicted at 0.40. Anything at half agreement starts at 0.50 whatever its tier, because a contested literature has established nothing.

The weight line: `replication(1) = 1.00`, `replication(2) = 1.33`, `replication(3) = 1.50`, `replication(10) = 1.82`, limit 2.00. A prior backed by four replications takes more arguing to shift than one backed by a single paper, but it is bounded at twice `k`, so no pile of replications puts a claim beyond argument. At `k = 1` even the strongest prior is within reach of a single well-argued objection. Evidence opens the question; it does not close it.

**The tiers.** The sixteen rows are the wiki's table from [[Evidence Verification Score (EVS)]], in its order, with its weights, plus one marked addition (code: the `ESIW` dict):

| Key | ESIW | Wiki rank | What it covers |
|---|---|---|---|
| `statistics` | 0.90 | 1 | Statistics and data, with the source cited |
| `record` | 0.90 | added | Primary official record: statute, judicial holding, agency rule, sworn filing |
| `rct` | 0.85 | 2 | Formal scientific study: randomized controlled trial |
| `meta` | 0.80 | 2 | Formal scientific study: meta-analysis |
| `observational` | 0.75 | 3 | Observational or correlational study |
| `historical` | 0.70 | 4 | Historical trend, with references |
| `expert_data` | 0.65 | 5 | Expert testimony with supporting data |
| `expert_claim` | 0.60 | 6 | Expert or social media claim |
| `anecdote` | 0.55 | 7 | Personal experience or anecdote |
| `logic` | 0.50 | 8 | Common sense or logic |
| `analogy` | 0.45 | 9 | Analogy or metaphor |
| `norm` | 0.40 | 10 | Cultural norm |
| `intuition` | 0.35 | 11 | Intuition or gut feeling |
| `news` | 0.30 | 12 | News or media report |
| `survey` | 0.25 | 13 | Survey or poll |
| `eyewitness` | 0.20 | 14 | Eyewitness testimony |
| `visual` | 0.15 | 15 | Visual evidence |
| `artifact` | 0.10 | 16 | Historical artifact |

Two notes an auditor should have, from the file: the wiki gives rank 2 as one band, "0.85-0.80", over RCTs and meta-analyses together, so the split follows the order they are listed in (read the other way round it would be 0.80 / 0.85); and the wiki has no row for a primary official record, so `record` was added at 0.90 and marked, because calling a Supreme Court holding a "historical trend" would be wrong. Drop it and those rows fall to unclassified. Classify what the sentence on the page asserts, not the instrument that produced it: "58 percent of Americans told a pollster X" is a published statistic; "Americans believe X" inferred from the same poll is survey evidence.

"Blind studies" and "scenario comparisons", the examples the 2025 page gave, are not tiers in either engine. A blind study would be filed as `rct`; the nearest thing to a scenario comparison is a testable prediction, which scores through the same row formula (see Falsifiability below).

**The wiki's own EVS is still printed.** `evs(row, ecrs) = ESIW x ECRS x ERQ x (ERP/100)`, with the row's linkage score standing in for ECRS, is computed for every finding and summed under every Evidence Ledger, and no score reads it ([method page, EVS](https://myklob.github.io/ideastockexchange/beliefs/method.html#evs)). It is unbounded on purpose and good at the one thing a bounded score cannot show: a page whose Overall EVS is 30 rests on a body of replicated work, and a page whose Overall EVS is 0.4 rests on one uncorroborated claim. It is also why it is not used for scoring: a sum that grows with every finding listed is the padding the site exists to stop.

**Where this meets the owner's direction.** The owner prefers an evidence weight with no ceiling, so a body of replicated work can outweigh opinion by 15 or 200 times. The scoring prior above is bounded (weight at most `2k`, `p0` within [0.05, 0.95]). The uncapped rule is built next door, in the tally below, which is printed beside the truth score precisely so the two can be compared on real pages before either one leads.

### Counting every reason until it is argued down

Status: runs on the published site, printed beside the truth score, read by no other number. Code: [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py); prose: [method page, tally](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally).

The owner's direction (October 2026) is that for belief strength you start from the quantity of truly independent reasons to agree and disagree, rank how valid they are against each other, and let the weight of pro against con decide; that a contribution counts from the moment it is posted and is argued down from there, because a rule under which work counts for nothing until someone proves it tells contributors their effort is wasted; and that evidence may weigh more than any argument, without a ceiling. The owner also said to change the inputs and see whether volume counts. So this is published next to the argued score rather than instead of it:

```
a reason or a prediction weighs    Truth x Linkage x Importance x Uniqueness
a finding weighs                   the same, x (1 + ESIW x ERQ x ERP/100), its uncapped evidence strength
independent reasons on a side      the sum of Uniqueness over its reasons
share for                          (weight for + w x p0) / (weight for + weight against + w)
```

What it keeps from the argued rule: every factor is read from a page or a labelled constant, so a reason argued false (Truth near 0) weighs nearly nothing and a duplicate argued redundant (Uniqueness near 0) adds nearly nothing. What it drops: the `(2 x Truth - 1)` that makes an unargued reason worth exactly zero, and the confidence gate that zeroes a row with no work behind it. Those two are why most argued truth scores in the corpus read 0.50. A vote enters neither rule. On a belief page it appears in "What the numbers are made of" as "Counting every reason until it is argued down: N% for, starting from the same even split as the truth score: X independent reasons for and Y against, findings weighing A for and B against" (on a page that declares what it rests on, the line names that starting point instead, for example "starting where the truth score starts, at 0.95 because of what the page rests on") (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)).

Choices of action are a different question in the owner's direction, answered by cost and benefit across every stakeholder with a legitimate interest, counting the quantity and the quality of interests met, under different assumptions about which interests are valid. That is the cost-benefit section of each page ([method page, costs and benefits](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba)), not this score.

### Confidence: how much a score is allowed to count

Status: runs on the published site. Code: [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py); prose: [method page, confidence](https://myklob.github.io/ideastockexchange/beliefs/method.html#confidence); wiki page: [[Confidence Stability Scores]].

Confidence multiplies what a page passes to the page above it. At 0 a claim moves its parent not at all, however true it looks. It is deliberately **not** a cap on the page's own truth: truth is what the arguments say; confidence is how much to bet on it. Seven structural components, weighted, renormalised over whichever apply to the page's shape:

| Component | Weight | What it measures |
|---|---|---|
| grounding | 0.30 | The better of the page's own ESIW tier and the mean confidence of the claims argued beneath it. Recursive, so a tree of bare assertions scores near zero however many rows it lists |
| two_sided | 0.20 | 1.0 if both sides have rows, 0.35 if one side does, 0 if neither; not applied to an importance page |
| scrutiny | 0.20 | Of the link, imp and uniq slots on each row, the share that have an argued page |
| breadth | 0.15 | `saturate(rows + predictions, 6)`, where `saturate(n, half) = n / (n + half)` |
| depth | 0.05 | `saturate(depth of the tree, 3)` |
| sourcing | 0.05 | Half for citing a source at all, half for saying what kind |
| testability | 0.05 | Predictions that are dated and have a linkage page |

The wiki also lists seven behavioural signals (up and down votes, weekly visitors, dwell time, edit frequency, duplicate submission attempts, evaluation responses, score variance over time). A published corpus has one snapshot and no users, so all seven carry weight 0 and are reported as "no data" rather than scored as 0. Bands: `established 0.75`, `developing 0.45`, `early 0.15`.

### Votes are shown and never scored

Status: runs on the published site; the owner's direction, built. A vote recorded through the GitHub issue forms lands in `content/votes.csv` and is shown on the heading line after the score badge with the words "votes, not a score" (code: [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py), [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)). Once three people have voted on a claim, the home page ranks "Votes vs the analysis" by how far the vote share sits from the truth score ([lists page, votes](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes)). The owner's direction: votes may decide what is promoted and given attention, never what is valid, and the gap between the two is worth showing because it says where people need more time with the argument.

### What else a belief page prints beside its truth score

None of these moves the score; each tells the reader what the number is made of.

- **What would change the answer.** Every claim beneath a page is held at false and then at true, one at a time, and the whole graph recomputed, to `DEPTH = 6` levels; the flip point where a page crosses `FLIP = 0.5` is found by bisection to `STEPS = 16` places; an input that moves a page by less than `INERT = 0.005` is reported as inert (code: [`sensitivity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py); [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity)).
- **Relied on.** The ReasonRank walk, which asks how much of the corpus depends on a page and deliberately ignores its truth ([method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank); see [[ReasonRank]]).
- **Structural Checks** and **possible fallacies**, in the fallacy section below.
- **Scoring Engine** table: every quantity, its value, and how, with a line "Truth score: argued truth, capped by the weakest load-bearing component that has its own page", plus the page's numbers as a downloadable JSON.

A page to see all of this on: [Barring members of Congress and the president from owning or trading individual stocks](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html), under the topic [Government ethics](https://myklob.github.io/ideastockexchange/beliefs/t/government-ethics.html).

## The Next.js app's truth score

The app in `src/` has two truth numbers, which is one more than it should have. Both are from `src/core/scoring/`.

### The two-channel average on the belief page

Status: runs in the Next.js app. Code: `calculateTruthScoreBreakdown` in [`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts), called from [`fetch-belief.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/data/fetch-belief.ts).

This is the one that kept the 2025 page's shape: a logical half and a verification half, averaged.

```
Logical validity (LV)
  weight(arg)            = max(0, truthScore x (1 - fallacyPenalty))      fallacyPenalty defaults to 0
  proWeight, conWeight   = sums of weight by the side each argument was filed on
  LV                     = clamp(0.01, 0.99, proWeight / (proWeight + conWeight)),   0.5 when nothing argued

Verification (V)
  contribution(ev)       = (evsScore > 0 ? evsScore : 0.1) x linkageScore
  V                      = clamp(0.01, 0.99, supporting / (supporting + weakening)),  0.5 with no evidence

Overall
  (LV + V) / 2 when both halves have rows; the one that has rows otherwise; 0.5 with neither
  clamped to [0.01, 0.99]
```

Two things the belief page passes in matter. Each argument's `truthScore` is `|impactScore| / 100`, clamped to [0, 1]. And **no `fallacyPenalty` is passed**, so on every live belief page the logical half is the pro share of argued weight, full stop; the only caller that passes a penalty is `/api/scoring`, from in-memory demo data (code: [`src/app/api/scoring/route.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/scoring/route.ts)).

The code's own comment records the bug it replaced: LV used to average every argument's weight regardless of side, so a well-argued objection raised a belief's logical validity by as much as an equally well-argued reason for it; one strong con took a belief from 0.600 to 0.775. It now takes the pro share, which is what the evidence half of the same function and `scoring-engine.ts` already did.

Calculation. Two pro arguments at 0.7 and 0.5 and one con at 0.8 give `LV = 1.2 / 2.0 = 0.60`. One supporting finding with EVS 0.9 and linkage 0.8 (0.72) against one weakening finding with EVS 0.3 and linkage 0.5 (0.15) gives `V = 0.72 / 0.87 = 0.828`. Overall `(0.60 + 0.828) / 2 = 0.714`.

### The engine's belief score

Status: runs in the Next.js app. Code: `scoreBelief` in [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts).

```
rawImpact(arg)      = ReasonRank x linkage x importance x uniqueness
proRank, conRank    = sums of rawImpact over the pro and con trees
baseTruth           = proRank / (proRank + conRank),   0.5 with no arguments
evidenceImpact(ev)  = tierWeight x linkageScore
evidenceNet         = supporting - weakening
truthScore          = clamp(0.01, 0.99, baseTruth + (evidenceNet / evidenceCount) x 0.2)
```

Evidence here can move the score by at most 0.2 either way. And this engine does **not** share the published site's zero rule: it scores `A / (A + D)` over argument strengths, so listing an unargued reason there does raise the score. CLAUDE.md records this as open decision 1: the two engines disagree about whether volume counts, the disagreement is unresolved rather than accidental, and the owner's direction is to settle it by comparing them on real pages.

The same function also returns a confidence interval: `baseCI = 0.15`, `argFactor = max(0.3, 1 - totalArgs x 0.03)`, `balanceFactor = 1 - argBalance x 0.5` where `argBalance = |proRank - conRank| / (proRank + conRank)`, product clamped to [0.02, 0.2]. That is the only "confidence interval" in the product, and it is a belief metric; it has nothing to do with fallacies, despite the 2025 page's step 7 (below).

`scoreArgument` in the same file applies a fallacy penalty to an argument's base truth: `fallacyPenalty = sum(|impact| / 100)` over `fallaciesDetected`, and `baseTruth = max(0, truthScore x (1 - fallacyPenalty))`. In the running product `fallaciesDetected` is populated only by demo data (`schlicht-data.ts`); the bridge from confirmed community claims into that array exists and is not called (see the ladder below).

### The app's evidence score

Status: runs in the Next.js app. Code: `calculateEVS` and `EVIDENCE_TYPE_WEIGHTS` in [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts), `verificationWeight` in [`evidence-exposure.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/evidence-exposure.ts).

```
EVS = ESIW x log2(ERQ + 1) x ECRS x ERP          ERP as a fraction 0..1
ESIW tiers:  T0 0.05 (retracted / fraudulent)   T1 1.0 (peer-reviewed / official)
             T2 0.75 (expert / institutional)   T3 0.5 (journalism / surveys)
             T4 0.25 (opinion / anecdote)       unknown tier 0.5
on the belief page:  evsScore = EVS x verificationWeight(status)
```

The three differences between the two engines and the wiki's EVS page, item by item: replication enters as `log2(ERQ + 1)` in the app, linear `ERQ` in the wiki, and bounded `2n / (n + 1)` on the published site; the app has 5 tiers, the wiki 16, the published site 18 (16 plus `record` plus none); and in the app evidence is a multiplier on a row while on the published site it is a prior on the claim's page.

**Retraction exposure** is the app's readout of how much of a belief's evidence case is not yet earned. A row with no status on record counts in full and so carries the largest exposure (`1.0 x |impact|`); UNVERIFIED and DISPUTED rows count at half and could move `0.5 x |impact|` either way; VERIFIED and FALSIFIED rows are settled. `NEGLIGIBLE_EXPOSURE = 0.5` points, `HIGH_EXPOSURE_SHARE = 0.5`. The counting-in-full of unrecorded rows is deliberate, not a bug to fix by defaulting them to verified (code and CLAUDE.md).

## Three formulas, one name

| | Published site (`score_reference.py`) | Next.js belief page (`all-scores.ts`) | Next.js engine (`scoring-engine.ts`) | `docs/ALGORITHMS.md` section 5 |
|---|---|---|---|---|
| Status | Runs; what myklob.github.io serves | Runs; the Truth Score row on `/beliefs/[slug]` | Runs; `/api/protocol`, `/api/scoring`, CBA | Proposed; implemented by nothing |
| Scale | 0 to 1 | 0 to 1, clamped [0.01, 0.99] | 0 to 1, clamped [0.01, 0.99] | -1 to +1 |
| Rule | `(POS + w x p0) / (POS + NEG + w)`, then `min(., weakest load-bearing premise)` | `(LV + V) / 2` | `proRank / (proRank + conRank) + 0.2 x evidence net` | `TS = (LV x EQ x VL) +/- CW` |
| Unargued reason | Worth exactly 0 | Counts at `\|impactScore\| / 100` | Raises the score | Unspecified |
| Evidence | Sets where the page starts (prior) | Half of the average | Up to +/- 0.2 | `EQ` 0-10 normalised, `VL` 0-1 |
| Fallacies | No term, by design | `fallacyPenalty`, never passed on the belief page | `fallaciesDetected`, demo data only | `LV`, "absence of fallacies" |
| Votes | Shown, never scored | Not read | Not read here (the fallacy vote is upstream) | Not mentioned |

The `docs/ALGORITHMS.md` formula, kept in full because it is the owner's draft and nothing has replaced it on paper (file: [`docs/ALGORITHMS.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/ALGORITHMS.md)):

```
TS = (LV x EQ x VL) +/- CW
```

| Symbol | Meaning | Range |
|---|---|---|
| `LV` | Logical Validity (absence of fallacies) | 0-1 |
| `EQ` | Evidence Quality (aggregate) | 0-10, normalized to 0-1 |
| `VL` | Verification Level (independent confirmation) | 0-1 |
| `CW` | Counterargument Weight (reduces score) | 0-1 |

Output range: +1.0 definitively true (rare); +0.5 to +0.9 strong evidence for truth; 0.0 to +0.5 uncertain, leaning true; -0.5 to 0.0 uncertain, leaning false; -0.9 to -0.5 strong evidence against; -1.0 definitively false (rare).

Status: superseded. The published site's method page lists "Truth score on a scale from -1 to +1, built from logical validity, evidence quality and verification" under [Rules in the wiki this site does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun), with what runs instead: truth runs 0 to 1 by the argued-truth rule, and the -1 to +1 scale appears only inside a row, as `2 x Truth - 1`.

Which of the three is canonical is an open decision for the owner (listed at the end). This page's position, which is the code's position: the published site's rule is what readers see, and the app's two rules are the product's interim arithmetic.

## The fallacy half

### The common fallacies the 2025 page named

The page listed four. Here they are with where each one lives now (code: [`catalog.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/catalog.ts) for the app, [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) for the published site):

| 2025 page | Definition given | App catalog entry | Published site flag |
|---|---|---|---|
| **Ad hominem** | Attacking the person instead of the argument | `ad-hominem` (relevance, major; not a fallacy when a relevant conflict of interest is documented with evidence) | "Attacking the person" |
| **Appeal to authority** | Relying solely on authority without evidence | `appeal-to-authority` (evidence-quality, minor; not a fallacy when citing a genuine domain expert consistent with the evidence base, which is T2 evidence) | "Appeal to authority" |
| **Red herring** | Distracting from the main issue with irrelevant points | No entry. Relevance is argued on the row's linkage page; `whataboutism` (relevance, minor) covers the deflection case | No flag; "Pointing at the other side" covers the deflection case |
| **False cause** | Mistaking correlation for causation | `false-cause` (logical-validity, major) and `post-hoc` (logical-validity, major) | "After, therefore because of" |

### The algorithm outline, step by step

The 2025 page gave seven steps. Each is kept with its status.

1. **Maintain a comprehensive list of recognized logical fallacies.** *Runs in the app:* `FALLACY_CATALOG`, a `ReadonlyMap` of 14 entries, is the single source for the detector, the accusation template, the ladder and the explainer page, and `GET /api/arguments/[id]/fallacy-claims` returns it as `template.fallacyTypes`. Comprehensive in the sense of one list, not of coverage. Severity is copied onto each claim at filing so history survives catalog edits (schema: [`prisma/schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma), `FallacyClaim`). *Runs on the published site:* the nine-pattern phrase list in `fallacy.py`.
2. **Allow users to flag arguments for potential fallacies.** *Runs in the app:* `POST /api/arguments/[id]/fallacy-claims`, and flagging is deliberately not a button (below). *Runs on the published site:* each flag links two prefilled GitHub issue forms on the flagged claim's own page.
3. **Enable discussion for and against each fallacy accusation.** *Partial in the app:* the for/against mechanism is a weighted vote with an optional `reasoning` string, not a pro/con tree; `LinkageArgument` has no children, so there is nowhere to argue about the accusation except the vote. *Runs on the published site, closer to the wording:* the accusation is a reason to disagree on the claim's page, and that reason has its own page with its own reasons, scored like anything else; there is no accusation object and no vote.
4. **Auto-flag similar arguments using semantic equivalency.** *Proposed, not built.* A `FallacyClaim` is keyed to exactly one `argumentId` and no code copies a claim, a detection or a confirmation to an equivalent argument. Equivalence detection exists separately: the app's agent ingest computes `textSimilarity` against `EQUIVALENCE_CANDIDATE_THRESHOLD` and resolves candidates by the same 60% vote (`/api/equivalence-candidates/[id]/votes`); the published site's [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) is lexical (IDF-weighted overlap of content words averaged with cosine over character 4-grams, `FLAG 0.45`, `MERGE 0.70`) and by its own docstring changes no score. Note that the app's `/algorithms/fallacy-detection` explainer says "a fallacy confirmed once stays confirmed for the whole cluster"; nothing in the code does that, so the explainer over-claims pending the owner's answer. See [[Equivalency Score:]] and [[The Redundancy Problem]].
5. **Use ML to detect linguistic patterns associated with fallacies.** *Replaced.* No machine learning anywhere in the product. What runs is six regular expressions in the app (below) and nine phrase patterns on the published site; neither has training data, a model, or a measured accuracy. Sentence-transformer code exists in `src/core/ai/similarity.py` and `overlap_engine.py` for claim overlap, not fallacies, and nothing imports it.
6. **Score flagged arguments based on supporting/opposing sub-arguments.** *Replaced in the app* by a weighted vote with a credibility multiplier (below); *runs on the published site* in the literal sense, since the accusation is a claim with sub-arguments and its truth score is what it earns.
7. **Aggregate results into a Logical Fallacy Score (confidence interval).** *Proposed, not built.* Per claim the app stores `consensus` (the weighted agree share at last resolution, null until quorum) and a three-state status; per argument the only aggregate is the validity ladder, which is not wired. The 2025 sketch's five bands (score below -2 "Very likely fallacious", below 0 "Possibly fallacious", 0 "No indication of fallacy", below 2 "Possibly sound", otherwise "Very likely sound") appear nowhere in `src/`, `tools/` or `tests/`.

### What runs on the published site: a flag is a question

Status: runs on the published site; the owner's direction (October 2026) built. Code: [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py); prose: [method page, structural checks](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks).

The owner's direction: nothing is final. Software may flag a possible fallacy, and the flag is a claim people argue for and against like any other; a flag alone moves no score. The flagger is deliberately a short, readable list of phrases and not a model, because a flag that cannot say why it fired cannot be answered. It reads reasons and objections only (a finding is an observation, and its weakness is argued on its own page), never reads a score, and phrases each hit as a question with the words that set it off and two prefilled forms on the flagged claim's own page: a reason to disagree saying "This is <fallacy>: it <what it is>, because" and a reason to agree saying "This is not <fallacy>, because". What the argument there concludes moves the claim's truth through the ordinary rules; the flag never does.

The nine patterns, with the kind of wording each one watches for (the full regular expressions are in the file, word-bounded and case-insensitive):

| Possible fallacy | What it is | Wording that raises the flag |
|---|---|---|
| Attacking the person | answers who said a thing instead of whether it is true | "he's a liar / idiot / hypocrite / fool / crook / shill / extremist", "can't be trusted because he", "what do you expect from", "paid shills", "only says that because" |
| Appeal to popularity | treats how many believe a claim as evidence that it is true | "everyone knows", "everybody knows", "most people agree / believe / think / know", "millions of people agree / can't be wrong", "common knowledge", "nobody really believes" |
| Appeal to authority | rests a claim on who endorses it rather than on the evidence they had | "experts agree / say", "scientists agree / say", "doctors / economists agree / say", "according to the experts", "trust the experts / science" |
| Slippery slope | claims a first step will lead to an extreme outcome without showing each step | "slippery slope", "will inevitably lead to", "opens the floodgates", "where does it end / stop", "next thing you know" |
| False choice | presents two options as the only ones when others exist | "the only alternative / other option / choice is", "either we ... or we", "there are only two options / choices", "if we don't ..., we will" |
| Sweeping generalization | states a rule with no exceptions where exceptions are likely | "all politicians / immigrants / corporations / liberals / conservatives / experts / scientists are", "no one ever", "every single one" |
| Appeal to tradition | treats a practice as right because it is old | "we've always done it this way", "for centuries,", "the way things have always been" |
| Pointing at the other side | answers a criticism by saying the critic does the same thing | "what about the", "they do it too", "the other side does the same" |
| After, therefore because of | concludes that one thing caused another because it came first | "ever since ...,", "right after ..., crime / prices / test scores / unemployment", "and then crime / prices / scores rose / fell" |

On a belief page the flags appear under Structural Checks as a table: the reason, "reason to agree" or "reason to disagree", the words in quotes, the fallacy with a question mark, and "It is / It is not" links (code: `checks_section` in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)). A reason that has no page of its own gets "give the reason a page of its own first" instead of the links.

### What runs on the published site: structural checks, and why no deductions

Status: runs on the published site; the deduction is refused by design. Code: [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py).

The file's docstring says why the 2025 page's pattern-matched deduction is not done, and it is worth quoting in substance: on this corpus, whose whole subject is officials acting on financial interests, a pattern matcher looking for "attacking the person instead of the argument" would fire on the central legitimate argument on every page. A check that deducts points from the strongest claim in the corpus, silently, with no page to appeal to, is worse than no check. And a score moved by a regular expression breaks the one rule the site keeps everywhere else: every number is a link to the page that argues it. The method page says in bold "Fallacy detection is not done", and [`test_render.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_render.py) fails the build if that sentence disappears. The method page's not-run table has the row: "Logical validity from weighted fallacy deductions | ALGORITHMS.md 8; wiki: Truth Score | Not computed. The structural checks name faults, and possible fallacies are flagged by wording and argued on the flagged claim's page; neither moves a score."

What the two tables *can* show is structural, and a structural fault is not a matter of interpretation. Nine checks, none of which changes a score:

| Check | How serious | What sets it off |
|---|---|---|
| Circular support | serious | Following the reasons beneath a claim leads back to the claim itself |
| Assumes its own conclusion | serious | A load-bearing premise rests on the claim, or is argued to be the same claim (equivalence 0.90 or more) |
| The same page listed more than once | worth checking | Two or more reason or evidence rows on one page read the same claim page |
| Rows that may be the same point twice | worth checking | Two rows on one page read alike to the duplicate detector and no uniqueness page argues the overlap |
| Rests only on authority or experience | worth checking | Every claim beneath the page is classified as an expert claim, expert testimony, an anecdote, a norm or a hunch |
| Evidence filed above the premise it bears on | worth checking | The page cites findings and argues higher than it reads, because a load-bearing premise beneath it cites nothing |
| Costs and benefits given as single figures | worth checking | A priced cost or benefit states one number and no range |
| Nothing stated would show it false | a note | A belief lists no testable prediction |
| Nobody has argued the other side | a note | Every reason and finding on the page is on one side |

The two serious ones are also refused outright before anything is published: `cycles_in_tables` runs Tarjan's strongly connected components over the claim graph and names one loop per component, because a loop can hold any value at all and stay consistent, so there is no number to publish. Circular reasoning is therefore a build failure here, not a fallacy type.

### What runs in the app: an accusation is an argument

Status: runs in the Next.js app. Code: [`src/lib/fallacy/claims.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/claims.ts), [`catalog.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/catalog.ts), [`src/lib/consensus.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/consensus.ts), [`calibration.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/calibration.ts), [`caller-record.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/caller-record.ts), the routes [`api/arguments/[id]/fallacy-claims`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/arguments/%5Bid%5D/fallacy-claims/route.ts) and [`api/fallacy-claims/[id]/votes`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/fallacy-claims/%5Bid%5D/votes/route.ts), and the explainer at `/algorithms/fallacy-detection` ([source](https://github.com/myklob/ideastockexchange/blob/master/src/app/algorithms/fallacy-detection/page.tsx)).

The rule the module enforces is the one tribal fallacy-calling breaks: an accusation is an argument, so it carries the same burdens as one. Filing requires every template field; a filed claim changes nothing; only a claim confirmed by weighted community consensus touches the target, and then only through the catalog's target factor for that type.

**The catalog.** Fourteen entries. Each names which factor a confirmed claim damages (`relevance` hits the linkage, `logical-validity` hits the validity ladder, `evidence-quality` hits evidence quality), a severity (`minor` or `major`), a definition, detection criteria, what the `evidenceLinks` field must contain, and, where honest, when the pattern is *not* a fallacy:

| Slug | Label | Target factor | Severity | Exhibits required | Not a fallacy when |
|---|---|---|---|---|---|
| `false-dilemma` | False Dilemma | logical-validity | major | List the excluded alternatives with evidence they exist | Only two options logically exist |
| `ad-hominem` | Ad Hominem | relevance | major | | A relevant conflict of interest is documented with evidence |
| `straw-man` | Straw Man | relevance | major | Link the opponent's actual stated position showing the discrepancy | |
| `slippery-slope` | Slippery Slope | logical-validity | major | Show the missing causal mechanism between the steps | The causal mechanism for each step is demonstrated with evidence |
| `appeal-to-authority` | Appeal to Authority (improper) | evidence-quality | minor | | Citing a genuine domain expert consistent with the evidence base (T2 evidence) |
| `cherry-picking` | Cherry Picking / Suppressed Evidence | evidence-quality | major | Link the contradicting evidence being ignored | |
| `moving-goalposts` | Moving the Goalposts | logical-validity | minor | Quote the earlier criterion and show it was met before the switch | |
| `whataboutism` | Tu Quoque / Whataboutism | relevance | minor | | |
| `post-hoc` | Post Hoc Ergo Propter Hoc | logical-validity | major | | |
| `hasty-generalization` | Hasty Generalization | logical-validity | minor | | |
| `appeal-to-popularity` | Appeal to Popularity | relevance | minor | | |
| `false-cause` | False Cause | logical-validity | major | | |
| `overgeneralization` | Overgeneralization | logical-validity | minor | | |
| `anecdotal-evidence` | Anecdotal Evidence | evidence-quality | minor | | |

**Filing.** "Can't just click a fallacy button." `validateFallacyClaimInput` requires six fields: `fallacyType` (a catalog slug), `quotedText` (the exact text that commits the fallacy), `explanation` (at least `MIN_EXPLANATION_LENGTH = 40` characters), `missingElements` (what is excluded, misrepresented or left unsupported), `consequences` (how the fallacy affects the argument's validity if confirmed), and `evidenceLinks`, each with a label, and non-empty for the five types with an exhibit requirement. The body may not carry `severity`, `weight`, `consensus`, `status` or `score`; the route answers 422 with "severity comes from the catalog, weight from the track record, status from community consensus." Filing creates a `LinkageArgument` on the target's linkage sub-debate, side `disagree`, status `draft`, with the counter-statement `"<Label> claimed: "<quote>" <explanation> Missing: <missingElements>"`, plus the `FallacyClaim` row and an audit log row, and returns "Filed. No score changed". It is refused with 423 while the market graph is frozen.

**Confirmation.** `resolveConsensus` over the claim's votes: `upheld` if the weighted agree share is at least `CONSENSUS_THRESHOLD = 0.6`, `rejected` if the weighted disagree share is, `open` otherwise, and nothing settles below `CONSENSUS_QUORUM = 3` votes. One vote per (claim, user); re-voting updates. The counter-argument's status follows the outcome, `open` to `draft`, `upheld` to `published`, `rejected` to `rejected`, and on publication it takes `counterArgumentStrength`: **0.8 for a major, 0.5 for a minor** fallacy. Then `propagateFromLinkageChange` reruns the linkage aggregate over published rows only and ripples upward. On rejection "the accusation failed its own debate. The target is untouched", and only the accuser's accuracy record falls. Consensus can move back as votes accumulate. Every filing, vote and resolution writes an audit log row.

**Vote weight.** Each vote carries the voter's credibility multiplier, computed *before* the vote is stored so voting on your own pending accusation never lifts your own weight (code: `calibration.ts`, `caller-record.ts`):

```
accuracyFactor = 2 x upheld / (upheld + rejected)        once at least MIN_RESOLVED_FOR_ACCURACY = 3 resolved, else 1
sideBalance    = (min(agreeFlags, disagreeFlags) + 1) / (max(agreeFlags, disagreeFlags) + 1)
balanceFactor  = 0.4 + 0.9 x sideBalance                  once at least MIN_FLAGGED_FOR_BALANCE = 5 flagged, else 1
credibility    = clamp(accuracyFactor x balanceFactor, CREDIBILITY_FLOOR 0.3, CREDIBILITY_CEILING 1.4)
```

Side is read from the accused argument's side in its parent debate, an observable proxy for flagging only the other team. A new user is exactly 1.0. Filing volume never raises it; only being right and being even-handed do. Calculation: a caller with 82% accuracy who has flagged five arguments on each side gets `1.64 x 1.3 = 2.13`, clamped to 1.4. A caller with 40% accuracy who has flagged ten arguments all on one side gets `0.8 x (0.4 + 0.9 x 1/11) = 0.39`; the code's comment says such a caller "lands at the floor", and the arithmetic puts them a little above it, with the 0.3 floor binding at about 31% accuracy on the same record.

**The validity ladder.** Defined and tested, wired to nothing. `logicalValidityMultiplier` over an argument's confirmed claims: no confirmed fallacy `VALIDITY_NO_FALLACY = 0.95`; one minor `VALIDITY_MINOR = 0.75`; one major `VALIDITY_MAJOR = 0.45`; two or more `VALIDITY_MULTIPLE = 0.25`. The same evidence argued without the fallacy scores higher, so removing the fallacy is the profitable move, which is the point. `confirmedClaimsToDetectedFallacies` turns the set into `DetectedFallacy` impacts summing to `(1 - multiplier) x 100`, split evenly per claim, sized so that `scoreArgument`'s `truth x (1 - sum|impact| / 100)` lands exactly on the ladder. Calculation: two confirmed claims give multiplier 0.25, a total penalty of 75 split 37.5 each, and base truth of a quarter of what it was. Both functions are exported, pinned by [`tests/unit/lib/fallacy/claims.test.ts`](https://github.com/myklob/ideastockexchange/blob/master/tests/unit/lib/fallacy/claims.test.ts), and called by nothing in `src/` outside their own file. The only wired effect of a confirmed claim on a score is the published counter-argument at 0.8 or 0.5 in the linkage aggregate.

**On the belief page.** Only claims with `status: 'confirmed'` are fetched at all. A confirmed one renders as an inline red note in the argument cell, "<type> confirmed, dents Linkage | Argument Score (validity) | Evidence Quality" by target factor, linking the explainer (code: `ConfirmedFallacyNotes` in [`ArgumentTreesSection.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/ArgumentTreesSection.tsx)). An unconfirmed accusation changes nothing and is not rendered. On the linkage page `/arguments/[id]/linkage`, draft rows are displayed and excluded from the aggregate.

**The automated detector.** Six regular expressions, run only on agent-ingested claims (statement plus rationale; code: [`ingest.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/ingest.ts)), never on human submissions:

| Catalog type | What the pattern matches |
|---|---|
| `ad-hominem` | liar(s), idiot(s), stupid, corrupt, dishonest, evil, fraud(s), shill(s), crook(s) |
| `appeal-to-popularity` | everyone knows, everybody knows, most people agree / believe / think, nobody believes / thinks / doubts, it is widely believed |
| `false-cause` | correlat... and caus... / proves / proof within one sentence, either order |
| `overgeneralization` | always, never, without exception, in every case |
| `cherry-picking` | one study, a single study / case / example, the only study / evidence, one survey |
| `anecdotal-evidence` | I know a / someone, my friend / uncle / aunt / neighbor / cousin, personal experience |

Each hit becomes a draft `LinkageArgument` on side `disagree` authored by the agent `system:fallacy-detector`, with the rationale "Automated detector flagged '<text>'. The accusation enters the tree and lives or dies by its own sub-arguments." The `FallacyDetection` type has no numeric field by construction, and [`fallacy-detector.test.ts`](https://github.com/myklob/ideastockexchange/blob/master/tests/unit/lib/agent-ingest/fallacy-detector.test.ts) asserts "never returns numeric fields". The detector's accuracy is never measured and it has no track record.

**The one place a vote moves a score.** The confirmation vote is the one path in either engine where a vote changes a number: at 60% weighted agreement a counter-argument of strength 0.8 or 0.5 enters the linkage aggregate. The owner's direction is that votes decide attention, never validity. The published site's standing rule is that a vote never moves a score. The app's vote is therefore the exception, and whether it stays, becomes a sub-argument tree on the accusation (the published site's shape), or is adopted by the published site is listed under open decisions.

### The weighted-deduction formula in docs/ALGORITHMS.md

Status: proposed, implemented by nothing. Section 8 of [`docs/ALGORITHMS.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/ALGORITHMS.md) gives a Logical Validity Score:

```
LVS = 1 - (sum(Fallacy_Severity x Fallacy_Weight) / Max_Possible)
```

| Fallacy | Severity weight |
|---|---|
| Contradiction | 1.0 (invalidates argument) |
| Circular reasoning | 0.9 |
| False dichotomy | 0.7 |
| Straw man | 0.7 |
| Ad hominem | 0.6 |
| Appeal to authority | 0.5 |
| Hasty generalization | 0.5 |
| Slippery slope | 0.4 |
| Red herring | 0.3 |
| Appeal to emotion | 0.3 |

No code reads this table; the catalog uses only `minor` and `major`. Of its ten rows, red herring, appeal to emotion and contradiction have no catalog entry, and circular reasoning is the published site's build-refusing structural check rather than a fallacy type.

## The evidence half, in one paragraph

The full treatment is on [[Evidence Verification Score (EVS)]]; the formulas and tiers are quoted above under *Where a page starts*. In short: the wiki's `EVS = ESIW x ECRS x ERQ x (ERP/100)`, summed over a belief's evidence, is computed and printed by the published site and read by no score; what scores there is the prior `p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)` with weight `k x 2 x ERQ / (ERQ + 1)`; the app computes `ESIW x log2(ERQ + 1) x ECRS x ERP` over five tiers and multiplies by the lifecycle weight. ECRS, the relevance factor, is the row's linkage page in both engines rather than a fourth thing to argue ([[Evidence to Conclusion Relevance Score]], [[Linkage Scores]]). The owner's category rule from the EVS page, that the category choice for each piece of evidence is debated in pro/con form, has no mechanism in either engine beyond editing the `etype` column; the published site's confidence `sourcing` component gives half credit for naming a type at all.

## Falsifiability and testable predictions

Neither the 2025 page nor its sources mention this, and it is the other way the world gets into a score.

*Published site.* A belief page carries `falsify_for` and `falsify_against` rows, rendered as "Evidence that would strengthen / weaken" with a Result column and vote counts, and prediction rows (`pred_true`, `pred_false`), which score through the same row formula as reasons and findings (code: [`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py), `render_site.py`). The line under the Testable Predictions table counts predictions that are dated and whose linkage reads 0.50 or more. The structural check "Nothing stated would show it false" fires on any belief with no prediction, and "testable predictions or a falsifiability test" is one of the seven requirements of `publish.CORE_BAR` for a belief to count as complete rather than a draft (code: [`publish.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/publish.py); the others are reasons to agree, reasons to disagree, evidence, objective criteria, costs and benefits, and interests on either side). Every belief is published however far along it is; a draft is marked, never hidden.

*App.* `FalsifiabilityTestSection` shows strengthen/weaken rows ranked by each row's own sub-debate score, plus predictions with what follows if the belief is true, a timeframe, a verification method, the result so far and a score (code: [`FalsifiabilityTestSection.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/FalsifiabilityTestSection.tsx)). The canonical belief page layout is [[Template: Belief Analysis]].

## The 2025 sketches

Both code samples from the 2025 page are kept here as the owner wrote them. Neither runs. Both are labelled proposed.

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

What runs instead: six regular expressions over agent-submitted text in `src/lib/agent-ingest/fallacy-detector.ts`, each hit a draft counter-argument with no number attached. spaCy is not a dependency of the app, the published site or the pipeline. Note also that this sketch's keyword lists are the *names* of fallacies ("ad hominem", "red herring", "post hoc", "correlation is not causation"), so none of its own four example sentences would match and the example prints four empty dicts; the shipped detector matches the behaviour (an insult, "everyone knows", "my uncle") instead of the name.

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

## Future development, as the 2025 page listed it

1. **Large, diverse dataset: train ML models on fallacy examples from multiple domains/media types.** Proposed, not built. No dataset, no training code, no model artefacts. The only accuracy data the system accumulates is per caller: `FallacyClaim.status` by `submittedById`, read by `callerRecordFor`. The detector agent's own hits are never scored for accuracy.
2. **Domain-specific tuning: adjust algorithms for political, scientific, or commercial contexts.** Proposed, not built. No per-domain configuration. The catalog's `notFallacyWhen` fields are the only domain guard (ad hominem is not a fallacy when a conflict of interest is documented; appeal to authority is not when the expert is in-domain and consistent with the evidence), and they are text shown to voters, not code. The published site's refusal is itself a domain argument: on a corpus about officials acting on financial interests, an ad hominem matcher fires on the legitimate central claim.
3. **Human feedback loop: let users flag, verify, or reject fallacy identifications.** Runs in the app. Users file, and vote agree or disagree on both human-filed and detector-drafted claims; outcome maps to draft, published or rejected; consensus moves in both directions; every step is audit-logged. Runs on the published site in the form of the two "It is / It is not" forms.
4. **Continuous refinement: iteratively improve detection accuracy and scoring fairness.** Partial. Scoring fairness has a mechanism, the cross-partisan credibility multiplier, which penalises one-sided callers and rewards upheld claims. Detection accuracy has none: the six regex rules are constants, the detector agent has no track record, and nothing measures how often its drafts are confirmed or rejected.

## Open decisions for the owner

These are design disagreements between this page's sources and the code that only the owner can settle. The owner has asked not to be asked at the level of individual numbers; these are listed so that whoever next touches the code knows which choices are still open.

1. **Which Truth Score formula is canonical?** Three exist and none is the 2025 page's: the published site's `(POS + w x p0) / (POS + NEG + w)` with a load-bearing cap, the app's `(LV + V) / 2`, and `docs/ALGORITHMS.md`'s `(LV x EQ x VL) +/- CW`. Options: declare the published site's rule canonical and list the app's as interim; declare the app's canonical and reconcile the site; or keep both as the open comparison and delete the ALGORITHMS.md formula. The owner's direction is to compare on real pages, which the tally beside the truth score is the first step of.
2. **Should automated fallacy detection ever move a score, or only draft a question for people to argue?** The 2025 page says detect and aggregate into a score; the published site refuses and has a build test for the refusal; the app's detector is barred from scoring by its own type shape and runs only on agent submissions. The owner's direction (nothing is final; a flag is argued like any claim and moves no score) matches what both engines do today, and the rewrite above adopts it; the ML version stays labelled proposed.
3. **Does a vote move a score?** In the app a 60% weighted vote publishes a counter-argument at 0.8 or 0.5; on the published site a vote never does. Options: keep the vote as the confirmation gate and name it the exception; replace it with a sub-argument tree on the accusation, whose own truth score decides whether the counter-argument publishes; or make the published site adopt the gate. The owner's direction (attention, never validity) favours the second.
4. **Should a confirmed fallacy propagate to equivalent arguments?** The 2025 page's step 4 and the app's explainer say yes; the schema keys every claim to one argument and nothing propagates. Options: implement propagation; correct the explainer and say claims are per-argument; or auto-file draft claims on equivalents that still need their own vote.
5. **Which fallacies are in scope, and what are their weights?** Four on the 2025 page, ten with numeric weights in ALGORITHMS.md, fourteen with minor/major in the catalog, nine phrase patterns on the published site. The ladder constants 0.95 / 0.75 / 0.45 / 0.25, the strengths 0.8 / 0.5 and the credibility clamp [0.3, 1.4] are code constants with no page arguing them, which the published site's rule (every number is a link to the page that argues it) would not permit.
6. **The unargued-row rule against the owner's direction on volume.** The published site makes an unargued reason worth exactly 0, which with the load-bearing cap holds most beliefs at 0.50; the owner's direction counts a contribution from the moment it is posted. The tally is the comparison rule. Changing the argued rule is still a rule change with a conformance diff to review.

## See also

- [[Evidence Verification Score (EVS)]]: the evidence half in full, with the sixteen-tier table this page quotes.
- Logical Fallacy Score: no wiki page of this name exists; the 2025 page linked a private Google Sites draft. What replaced it is the fallacy half above.
- [[Quantifying Reason: The Power of Truth Scores]]: the second draft of this page.
- [[Linkage Scores]] and [[Evidence to Conclusion Relevance Score]]: the relevance factor in the row formula.
- [[Confidence Stability Scores]]: the confidence gate.
- [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]]: how scores and dependence flow through the graph.
- [[Argument Scores from Sub-Argument Scores]] and [[Pros and Cons on the Same Page]]: the recursion and the layout it rests on.
- [[Equivalency Score:]] and [[The Redundancy Problem]]: the uniqueness factor and the duplicate detector.
- [[Assumptions]]: the load-bearing premises that cap a truth score.
- [[Template: Belief Analysis]] and [[Template: Linkage Evaluation]]: the pages these numbers live on.
- The live site: [home](https://myklob.github.io/ideastockexchange/beliefs/index.html), [how every number is computed](https://myklob.github.io/ideastockexchange/beliefs/method.html), [what this cannot do](https://myklob.github.io/ideastockexchange/beliefs/method.html#limits), [the tables behind every page](https://myklob.github.io/ideastockexchange/beliefs/method.html#data).
