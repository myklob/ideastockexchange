# Belief Web Navigation

[[Home]] > Page Design > Belief Web Navigation

**🔍 Understanding the Belief Web Interface.** Or: *How This Works: What You See When You Click Any Belief.*

This page is the owner's explanation from the old PBworks wiki, never before on GitHub, merged with what the code actually does today. Every claim the original made has been checked against the source. Where the code does it, you get the file and the formula. Where the code does it differently, you get both versions. Where it is proposed and not built, it says so. The basis of every technical claim is labelled: **the code** (with its file), **a calculation** (numbers worked from the live tables), or **the owner's judgment**.

## A belief is a node, not a sentence

Each belief on the Idea Stock Exchange is not just a sentence. It is a node in a larger web of beliefs, the thing the old wiki called "Wikipedia for Debates" (see [[One Page per Debate Topic]]). When you click on any belief, you are shown how it connects to all other beliefs through [[Linkage Scores]], [[Argument Scores from Sub-Argument Scores]], and the overall belief score (see [[Truth Score]]).

Think of a library where every book has a card in the back listing every other book it quotes and every book that quotes it, with a number beside each saying how much the quotation actually carries. Pull one card and you can walk the whole library. That is the design.

The owner's original page promised four things on every belief page:

1. **All reasons to agree** with the belief, sorted by strength
2. **All reasons to disagree** with the belief, also sorted by strength
3. **All other beliefs this belief supports** (downstream links)
4. **All beliefs that support this belief** (upstream links)

Here is where each of those stands today.

| Promise | The published site ([myklob.github.io/ideastockexchange/beliefs](https://myklob.github.io/ideastockexchange/beliefs/index.html)) | The Next.js app (`src/`) | Status |
|---|---|---|---|
| 1. Reasons to agree, sorted by strength | "Argument Trees" section, left table "Reasons to agree", each row scored and ranked strongest first ([render_site.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), `side_order`) | `ArgumentTreesSection`, rows ordered by `impactScore` descending ([fetch-belief.ts](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/data/fetch-belief.ts)) | Built in both. The sort formula changed from the original; see section 1 |
| 2. Reasons to disagree, sorted by strength | Right table "Reasons to disagree", same rule, strongest objection first | Same component, same ordering | Built in both |
| 3. Downstream beliefs | "General to Specific" section, "Downstream" table; plus "Where This Page Is Used", which lists every page that reads this one | `BeliefMappingSection` ("More Specific (Downstream)") and `UsedAsReasonSection` ("Where This Belief Is Used") | Built in both. The General to Specific table is navigation only and carries no score on the site; see section 3 |
| 4. Upstream beliefs | "General to Specific" section, "Upstream" table; plus the breadcrumb trail at the top of every page, and the load-bearing components that actually cap the score | `BeliefMappingSection` ("Most General (Upstream)") | Built in both. Same caveat: the upstream table is navigation, the components are what bear weight |

## 1. Reasons to agree and disagree, sorted by strength

Every belief page contains two lists, side by side: **Reasons to Agree** and **Reasons to Disagree** (the format argued for in [[Pros and Cons on the Same Page]]). These are not random lists. They are ranked.

### What the original page said

The owner's original sort key was:

> **Contribution Score = Linkage Score × Belief Score**

Where:

- Linkage Score ([[Linkage Scores]]) measures how strongly the reason relates to this belief.
- Belief Score ([[Truth Score]]) measures the independent strength of the reason itself (based on all of its own pros and cons).

> High-scoring reasons rise to the top automatically. Weak, low-quality, or poorly supported reasons sink to the bottom. This makes every belief page a ranked, evidence-weighted map of the most rational arguments available.

### What the published site does now (the code)

The two-factor product was **replaced** by a six-factor product, which keeps both of the original factors and adds four more. Every row on every belief page, whether it is a reason, a cited finding or a prediction, contributes exactly this ([score_reference.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), `Model._contrib`, mirrored row by row in [render_site.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), `Corpus.row`):

```
contribution = sign x (2 x Truth - 1) x Confidence x Linkage x Importance x Uniqueness
```

| Factor | What it asks | Where its number comes from | Value when nobody has made a page for it |
|---|---|---|---|
| sign | Which side was it filed on? | +1 for a reason to agree, -1 for a reason to disagree | (always set) |
| Truth | Is the reason itself true? This is the original "Belief Score" | The reason's own page, scored by its own reasons, recursively | `UNARG = 0.5`, which makes `2 x Truth - 1` zero |
| Confidence | How much work stands behind that truth score? | [confidence.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py): grounding 0.30, two-sidedness 0.20, scrutiny of multipliers 0.20, breadth 0.15, depth 0.05, sourcing 0.05, testability 0.05 | 0.0 for a row with no page at all |
| Linkage | If the reason were true, would it bear on this belief? This is the original "Linkage Score" | A linkage page argued on its own ([[Linkage Scores]]) | `DEFLINK = 1` (presumed relevant) |
| Importance | How much would it move the conclusion? | An importance page | `DEFIMP = 0.5` (the neutral start) |
| Uniqueness | Is it a new point, or one already made? | A uniqueness page ([[The Redundancy Problem]]) | `DEFUNIQ = 1` (presumed distinct) |

Those five constants live in one line of [score_reference.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py): `CONSTS = {'K': 1, 'UNARG': 0.5, 'DEFLINK': 1, 'DEFIMP': 0.5, 'DEFUNIQ': 1}`. The method page prints them at [method.html#constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants) and the formula at [method.html#formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula).

Three consequences matter for navigation, and each corrects the original page a little:

- **Weak reasons do not just sink. Refuted ones fight for the other side.** Truth enters as `2 x Truth - 1`, a scale from -1 to +1. A reason to agree argued down to a truth of 0.2 contributes a *negative* number, so it now counts against the belief it was filed under. Ten refuted reasons to agree weaken the belief instead of padding it (the code's own docstring says so in those words). `Model._split` then files each row by the sign it came out with, not the side it was typed on.
- **An unargued reason is worth exactly zero.** Listing a claim nobody has argued (truth 0.50) contributes nothing. This is the anti-padding rule, and it is deliberate.
- **The ranking is strongest first on each side.** The row's score is signed for the page above it, so the strongest objection is the most negative number. `side_order` multiplies by the sign before sorting, because (as the code comment admits) ranking both sides by the raw score once put the *weakest* objection first.

Every column is printed in the table (`#`, the reason, Truth, Conf, Link, Imp, Uniq, Score), so any row can be multiplied out by hand and checked. Under the two tables sits a totals line: *Weight for · weight against · net*.

**Top five, then the rest.** Per Rule 8 of [the belief page rules](https://github.com/myklob/ideastockexchange/blob/master/docs/BELIEF_PAGE_RULES.md), every ranked table shows its top rows and collapses the rest. On the site that is `collapse_tables(markup, n=5)` in [render_site.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py): rows past the fifth are hidden behind a real checkbox labelled "Top 5 of N rows shown. Show all", which needs no script and which a keyboard can reach. Printing shows every row. In the Next.js app the same limit is `TABLE_TOP_LIMIT = 5` in [ranking.ts](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/lib/ranking.ts).

### What the Next.js app does where it differs (the code)

The app in `src/` sorts arguments by a stored `impactScore`, highest first ([fetch-belief.ts](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/data/fetch-belief.ts), `orderBy: { impactScore: 'desc' }`). That number comes from `computeArgumentImpactScore` in [scoring-engine.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts):

```
impact = sign x truth x |linkage| x importance x uniqueness x 100     (rounded to one decimal)
```

and the belief's own score is `TruthScore = ProRank / (ProRank + ConRank)`, where each side sums `RR(arg) x linkage x importance x uniqueness`. Two differences from the published site, both unresolved by design (CLAUDE.md lists this as open decision 1):

| | Published site | Next.js app |
|---|---|---|
| Truth scale | `2 x Truth - 1`, so a refuted reason counts against its side | `truth` on 0 to 1, so a refuted reason still adds a little to its side |
| An unargued reason | Contributes 0 | Contributes, so listing more reasons raises the score |
| Confidence factor | Yes | No |

### The owner's direction on volume, and the rule printed beside the score

The owner (October 2026, in CLAUDE.md and [WIKI_AUDIT.md](https://github.com/myklob/ideastockexchange/blob/master/docs/WIKI_AUDIT.md)) wants belief strength to start from the quantity of truly independent reasons to agree and disagree, rank how valid they are against each other, and let the weight of pro against con decide. Contributions count from the moment they are posted and are argued down from there, because a rule under which work counts for nothing until someone proves it tells contributors their effort is wasted.

That differs from the argued rule above, where an unargued reason counts zero. The site does not pick a winner unseen. It prints the owner's rule beside the argued truth score on every belief page, under the label "Counting every reason until it is argued down", computed by [tally.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) and read by no other number ([method.html#tally](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)):

| Under the tally rule | Formula (the code, `tally.py`) |
|---|---|
| A reason or prediction weighs | `Truth x Linkage x Importance x Uniqueness` |
| A finding weighs | the same, `x (1 + ESIW x ERQ x ERP/100)`, uncapped |
| Independent reasons on a side | the sum of Uniqueness over its reasons, so two reasons that say the same thing count as one once a uniqueness page says so |
| Share for | `(weight for + w x p0) / (weight for + weight against + w)`, where `p0` and `w` are the page's own evidence starting point and weight |

It drops exactly two things from the argued rule: the `2 x Truth - 1` and the confidence gate. Those two are why most argued truth scores in the corpus read 0.50 (next section). For choices of action (should we do X?) the owner's question is different: costs and benefits across every stakeholder with a legitimate interest, under different assumptions about which interests are valid. That is scored in the cost-benefit section of the page, not in the reason tables (see [[Likelihood of Costs and Benefits]] and [[Likely Interests of Those Who Agree and Disagree]]).

### A worked example from the live tables (a calculation)

Take [Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html), filed under the topic [Public office and private gain](https://myklob.github.io/ideastockexchange/beliefs/t/public-office-private-gain.html). These numbers were computed from `tools/static-site/content/` on 17 October 2026 with the site's own `Corpus` class.

| Side | Reason (abridged) | Truth | Conf | Link | Imp | Uniq | Score |
|---|---|---|---|---|---|---|---|
| Agree | Members regularly trade in the industries their own committees oversee | 0.50 | 0.28 | 0.50 | 0.50 | 1 | 0.00 |
| Agree | Disclosure has failed as a check: 78 members of one Congress filed late under the STOCK Act, and the standard penalty is a $200 fee that is routinely waived | 0.50 | 0.28 | 0.50 | 0.50 | 1 | 0.00 |
| Agree | A holdings ban removes the conflict itself | 0.50 | 0.28 | 0.50 | 0.50 | 1 | 0.00 |
| Agree | The Federal Reserve barred its own policymakers from holding individual stocks in 2022 and kept functioning | 0.50 | 0.28 | 0.50 | 0.50 | 1 | 0.00 |
| Agree | Trading on a closed briefing is almost impossible to prosecute | 0.50 | 0.26 | 0.50 | 0.50 | 1 | 0.00 |
| Disagree | The best-identified studies find congressional portfolios underperform the market | 0.50 | 0.28 | 0.50 | 0.50 | 1 | 0.00 |
| Disagree | A ban on the official leaves the conflict in place through spouses, children, partnerships, real estate and crypto | 0.50 | 0.26 | 0.50 | 0.50 | 1 | 0.00 |
| Disagree | Forced divestiture narrows who can afford to serve | 0.50 | 0.28 | 0.50 | 0.50 | 1 | 0.00 |
| Disagree | Members keep the property rights of other citizens | 0.50 | 0.28 | 1 | 0.50 | 1 | 0.00 |
| Disagree | Congress will not enforce a ban on itself | 0.50 | 0.28 | 0.50 | 0.50 | 0.50 | 0.00 |
| Disagree | A qualified blind trust already removes knowledge and control | 0.50 | 0.00 | 1 | 0.50 | 1 | 0.00 |

Eleven reasons, every one scoring 0.00, because nobody has yet argued any of them away from 0.50. Notice the Link column: rows with a linkage page read 0.50, and the two rows with no linkage page read 1. That is because an empty linkage page starts at its evidence prior, 0.50, while a missing one falls back to `DEFLINK = 1` (the code). The owner's direction on linkage is to start trusting and lower it as people show a reason is unrelated, and to let a well-argued link rise; the site honours that for rows with no linkage page and not yet for rows whose linkage page exists but is empty. That gap is real and worth knowing when you read a Link cell.

The evidence ledger on the same page does carry weight: supporting findings weigh 0.4193, weakening ones 0.0964, so the raw reading is `(0.4193 + 1 x 0.5) / (0.4193 + 0.0964 + 1) = 0.6065` (a calculation from the `_share` rule). The page still reads **0.50**, because three load-bearing components ("Officials' financial holdings currently influence how they vote", "Removing the holding removes the influence rather than relocating it", "A holdings ban can be enacted and enforced") each sit at 0.50, and the code caps a page at its weakest load-bearing part: `truth = min(raw, min(lb))`. Meanwhile the owner's tally rule, printed beside it, counts 5 independent reasons for and 5.5 against (one row carries uniqueness 0.5), weighs 2.73 for against 1.91 against, and reads **0.572**. Same page, two rules, both shown. That is the comparison the owner asked for.

## 2. Upstream beliefs: what this belief depends on

Every belief is supported by other beliefs. The original page put these under the heading **"More General Beliefs That Support This"**:

> These show you *why* supporters believe the belief is true. They include moral principles, factual assumptions, foundational values, and broader claims. Clicking any of these takes you to a new belief page, where you see that belief's own reasons to agree and disagree.
>
> This reveals the deeper structure of the argument: the assumptions and principles that hold the belief up.

### What the published site does now (the code)

There are three ways up from any page, and they do different jobs.

| Way up | Where on the page | Does it move a score? |
|---|---|---|
| **General to Specific, Upstream** | A section near the end, captioned "Upstream: the broader principles this belief inherits from." Two tables side by side, "Supports the belief" and "Opposes the belief", each row showing the linked page's own truth score in an "Its truth" column. Rows come from the `upstream` section of [edges.csv](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/edges.csv) (`up_for`, `up_against` in [ise_tables.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)) | **No.** `Model.evaluate` reads only the `argument`, `evidence`, `prediction` and `component` sections. Upstream rows are signposts |
| **The breadcrumb trail** | The top line of every page: Home › Topics › the topic chain › each page in the `parent` chain › this page (`Corpus.crumbs` and `head` in [render_site.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)) | No. It is how you got here |
| **Load-bearing components** | The page's logical components, each flagged `lb: Y` or `N` | **Yes, hard.** A page can read no higher than its weakest load-bearing component. These are "the assumptions and principles that hold the belief up" in the most literal sense available: knock one down and the belief falls with it (see [[Assumptions]]) |

In the worked example above, the upstream table holds two rows: [Public office should not be usable for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/public-office-usable-private.html) supports it, and [Citizens keep their ordinary rights when they take public office](https://myklob.github.io/ideastockexchange/beliefs/p/citizens-keep-ordinary-rights.html) opposes it. Both read 0.50. Neither changes the belief's score by a hair, whatever it reads. What does change it are the three load-bearing components named above.

**How much of this exists yet (a calculation).** Across the whole corpus (4,263 pages, 196 beliefs, 9,472 edge rows) there are **5 upstream rows and 8 downstream rows**. The General to Specific section is rendered only when a page has at least one; otherwise the page lists it at the end as work to do ("not linked to broader or narrower beliefs"). Every belief page carries an "Add a broader belief" form ("A broader principle this inherits from, as one sentence") and an "Add a narrower belief" form, each with a supports-or-opposes choice.

**A gap against Rule 8.** On the site the upstream and downstream tables are drawn by `simple_rows`, which keeps the order the rows were filed in. They are not sorted by score, and when one passes five rows the collapse hides rows six onward by position, not by rank. The rules say every table ranks by its score. No table has reached five rows yet, so nobody has seen it bite.

### What the Next.js app does where it differs (the code)

The app models this as a `BeliefMapping` row in [schema.prisma](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma): `parentBeliefId`, `childBeliefId`, `direction` ("upstream" or "downstream"), `side` ("support" or "oppose"), and a nullable `score` described as the "strength of the general↔specific relationship, per its own pro/con sub-debate". [BeliefMappingSection.tsx](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/BeliefMappingSection.tsx) renders "Most General (Upstream)" and "More Specific (Downstream)" as Support / Score / Oppose / Score tables, sorted by score descending with blanks last, top five shown. So the app obeys Rule 8 here and the site does not. Neither feeds the mapping score into the belief's truth score.

### Proposed, not built

Letting an upstream principle carry weight on the page beneath it. The original wording ("what this belief depends on") implies it; the code does it only through components and argument rows. Turning the General to Specific rows into scored rows would change published numbers, so it would be a rule change with a conformance diff ([conformance.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py)), not a fix.

## 3. Downstream beliefs: what this belief leads to

Every belief is also used to support other, more specific claims. The original page put these under **"More Specific Beliefs That This Supports"**:

> This shows what conclusions depend on the belief being true. If the belief is rejected, these downstream conclusions lose support. If the belief is strengthened, the downstream conclusions become stronger.
>
> This makes debate transparent: you can see how changing one belief affects many others.

### Is that true today? Partly, and here is exactly which part (the code)

"If the belief is rejected, these downstream conclusions lose support" is **true for every page that reads this one as a scored row**, and **not true for the General to Specific table**.

- **Scored dependence.** Scores are computed on read, recursively, from the `page` and `edge` tables, with no stored scores. If belief A is a reason, a finding, a prediction, a component, or a multiplier (linkage, importance, uniqueness) on page B, then A's truth score is a factor in B's score, and rejecting A really does pull B. The site lists every such use in a section called **"Where This Page Is Used"** ("Every page that reads this one. One claim, one home, every use visible."), with columns Page, Table, As (a row; the linkage of a row; the importance of a row; the uniqueness of a row; the driver of an interest; an equivalence; who gains or pays; a bearing) and Its truth (`used_on` in [render_site.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)). This is the real downstream list.
- **The General to Specific "Downstream" table** shows narrower beliefs that inherit from this one ("Downstream: the narrower beliefs that inherit from it"). It is a signpost and moves nothing. In the worked example it lists [Senior executive branch officials and their spouses should be barred from holding individual stocks](https://myklob.github.io/ideastockexchange/beliefs/p/senior-executive-branch-officials.html) (supports) and [Congressional staff with access to nonpublic information should face the same ban](https://myklob.github.io/ideastockexchange/beliefs/p/congressional-staff-access-nonpublic.html) (opposes).

The two lists can meet. [Public office should not be usable for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/public-office-usable-private.html) lists the stock-ban belief as a downstream row, so the stock-ban page's "Where This Page Is Used" shows page 5, table "downstream", as a row. That line tells you the link exists; it does not mean weight flows along it.

The Next.js equivalent is [UsedAsReasonSection.tsx](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/UsedAsReasonSection.tsx), "Where This Belief Is Used": every parent debate that uses this belief as a reason, with side (supports or opposes) and impact, ranked by the size of the impact with blanks last.

### "How changing one belief affects many others": three mechanisms the original never named

The original promised you could *see* the ripple. The code now computes it three different ways, and they answer three different questions.

| Question | Mechanism | Formula and constants (the code) | Where you see it |
|---|---|---|---|
| Which single claim beneath this page, if settled, would move it most? | Sensitivity sweep, [sensitivity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py) | Pin one page's truth at 0 and at 1, re-read the whole graph with the same engine, report "If false", "If true" and the move. A second column holds that page's confidence at 1 ("If settled"), so the gap is the value of doing the work. The flip line is `FLIP = 0.5`, found by bisection with `STEPS = 16` (about 1.5e-5 resolution); an input moving the page by less than `INERT = 0.005` is inert | "What Would Change the Answer" section on every belief page; the top line also appears as "What would move this most" in the page's readout ([method.html#sensitivity](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity)) |
| How much of the whole site depends on this claim? | ReasonRank as a network walk, [reasonrank.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py) | A random walk starting at the beliefs, stepping to the pages a page reads in proportion to `capacity(row) = Link x Imp x Uniq`, restarting with probability `1 - d`, `DAMPING = 0.85`, run to `TOLERANCE = 1e-12`. Truth and confidence are deliberately left out, so the rank measures dependence, not agreement. Then `work(page) = rank x (1 - confidence)` names what to argue next | "Most relied on" and "What to argue next" on [lists.html](https://myklob.github.io/ideastockexchange/beliefs/lists.html) ([method.html#reasonrank](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank); see [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]]) |
| Which argument edge on this belief still has the most score at stake? | Decision Leverage, Next.js only, [decision-leverage.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts) | `weight(e) = |linkage| x importance x uniqueness x 0.5^depth` (`DEPTH_ATTENUATION = 0.5`), `leverage(e) = weight x openRange x 100`, where openRange blends four gaps: evidence 0.40, linkage 0.25, scoring 0.15, examination 0.20 | Section 1c of the Next.js belief page, the `/leverage` work queue, and `/algorithms/decision-leverage` |

In the worked example the stock-ban belief holds 0.0028 of the site's ReasonRank (a calculation), and its sensitivity sweep says that settling "Officials' financial holdings currently influence how they vote and what they say" could move it from 0.50 down to 0.00 if false, but not above 0.50 if true. That asymmetry is the load-bearing cap at work: settled false, that component drags the page to its own level; settled true, it lifts only its own cap, and the other two load-bearing components, still at 0.50, keep the page where it is.

## 4. The web of beliefs

Because every belief links both upward and downward, clicking through several belief pages shows you the full web of beliefs. The original page listed what the walk reveals. Each item survives, with what shows it today:

| What you can see | How the published site shows it (the code) |
|---|---|
| which beliefs support each other | Argument, evidence, prediction and component rows; "Where This Page Is Used" on the page being supported |
| which beliefs contradict each other | Reasons to disagree, and any row whose own page is argued false, which flips sign and counts against its filed side (`Model._split`). The "Similar Beliefs" section also files more extreme and more moderate wordings |
| where assumptions branch out into conclusions | Load-bearing components on each belief page; on topic pages, "Continuum 3: General to Specific, with Branching Subcategories", which runs from Most General (Worldview) down through subcategories to specific beliefs, and "Assumption Stack Behind Each Position" (topic template: [[Template: Topic]]) |
| where many beliefs point to the same foundational issue | ReasonRank's "Most relied on" list, and the structural check "Evidence filed above the premise it bears on" ([integrity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py)) |
| which arguments are strong, which are weak, and why | Every factor printed in its own column; every factor is itself a page you can click and argue |

Walking a web has one famous failure: you can walk in a circle. A circle of support can hold any value at all and stay consistent, so the scorer refuses it by name (`CircularSupport` in [score_reference.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)), and [integrity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) runs a pre-publish cycle check that CI runs first. Its first two checks, both rated serious, are "Circular support" (following the reasons beneath a claim leads back to the claim itself) and "Assumes its own conclusion" (a load-bearing premise rests on the claim, or is argued to be the same claim at equivalence 0.90 or more). Structural checks are listed on the page and change no score ([method.html#checks](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks)).

The original page's summary of the result:

> This creates the opposite of normal debates (which go in circles). It becomes more like **Wikipedia + a mathematical scoring system + a living map of reasoning**.

### Why most of the web reads 0.50 right now (the code, and a calculation)

You will click through a lot of pages that read exactly 0.50. On 17 October 2026, **178 of the 196 beliefs** read 0.50 (a calculation). That is not a bug, and it is worth understanding before you conclude the site has no opinions.

A row contributes `sign x (2 x Truth - 1) x ...`, so an unargued row contributes zero. A page with no scored rows therefore reads 0.50, so its parent reads 0.50, and by induction **every page of an argument graph in which nothing is cited reads exactly 0.50 forever.** Argument about argument never touches the world. A test pins this: `test_engines.py::test_argument_alone_can_never_leave_the_neutral_point` in [test_engines.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py).

The way out is evidence. A page declares an evidence type (`etype`), a replication count (`erq`) and a percentage agreeing (`erp`), and [evidence.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py) sets where its truth starts:

```
Starts at = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)
weight    = k x 2 x ERQ / (ERQ + 1)          k = 1, so replication is worth at most REP_CAP = 2.0
```

ESIW runs from 0.90 for statistics with a cited source (and for a primary official record) down to 0.10 for a historical artifact, eighteen tiers in all; no source type named gives 0.0, the coin flip exactly ([method.html#starts](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts); [[Evidence Verification Score (EVS)]]). The argued rule caps replication at double weight, which is a ceiling; the owner prefers an evidence weight with no ceiling, so a body of replicated work can outweigh opinion by 15 or 200 times, and that is what the tally rule printed beside the score uses (`ESIW x ERQ x ERP/100`, uncapped). Both are on the page; the comparison decides which leads. Load-bearing components holding a page at 0.50 is open decision 6 in CLAUDE.md, waiting on the same comparison.

## Getting around the site

The original page described one belief page. The site now has several ways in, all static pages built from the tables by [render_site.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py):

| Page | What it is for |
|---|---|
| [Home](https://myklob.github.io/ideastockexchange/beliefs/index.html) | A way in: search, the ranked lists as cards, topics |
| [Lists](https://myklob.github.io/ideastockexchange/beliefs/lists.html) | For every ranking, what it shows, how it is worked out and why it is tracked: best beliefs, most argued over, [hardest to resolve](https://myklob.github.io/ideastockexchange/beliefs/lists.html#hardest), most relied on, what to argue next, [who has a stake](https://myklob.github.io/ideastockexchange/beliefs/lists.html#stake), [best books, studies and reports](https://myklob.github.io/ideastockexchange/beliefs/lists.html#works), [votes vs the analysis](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes), [topics](https://myklob.github.io/ideastockexchange/beliefs/lists.html#topics) |
| [Topics](https://myklob.github.io/ideastockexchange/beliefs/topics.html) | Every topic, nested; for example [Government ethics](https://myklob.github.io/ideastockexchange/beliefs/t/government-ethics.html) contains [Public office and private gain](https://myklob.github.io/ideastockexchange/beliefs/t/public-office-private-gain.html) |
| [Method](https://myklob.github.io/ideastockexchange/beliefs/method.html) | The formula, the constants, and every engine, in plain words |
| One page per claim (`p/<key>.html`) | The belief page this wiki page is about |

Section order on a belief page follows the canonical template ([[Template: Belief Analysis]]): the arguments come first, no score is announced above them (Rule 1: a number a reader meets before the reasons for it is a verdict), and definitions come last. Sections with nothing in them are not drawn; they are listed once at the end as work to do.

**Votes.** Each claim heading carries vote counts after the score badge, with the note "Votes are shown as what people think, next to what the analysis says, and never move a score." The share of votes and its gap from the analysis wait for `MIN_VOTERS = 3` (the code, `render_site.py`). This matches the owner's direction: votes decide what gets attention, never what is valid, and the gap is worth showing because it says where people need more time with the argument.

**Duplicates.** Two rows on one page that read alike are flagged as "Wording overlap, unargued" by [similarity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) (`FLAG = 0.45`, near-identical at `MERGE = 0.70`); the flag moves no score until a uniqueness page argues the overlap ([method.html#equivalency](https://myklob.github.io/ideastockexchange/beliefs/method.html#equivalency); [[Equivalency Score:]]).

**Fallacies.** [fallacy.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) flags a possible fallacy from a published phrase list, as a question on the flagged claim's page with two prefilled forms to argue it either way. A flag alone moves no score, per the owner's direction that nothing is final.

## Why this matters

The original page's case, kept whole. This system solves the problem of debates being:

- repetitive
- factually chaotic
- endlessly circular

Instead, you get:

- a single page per belief
- the strongest arguments first
- transparent scoring
- automatic ranking of reasons
- a navigable structure of interconnected ideas

> Every belief becomes a living reference page, like a scientific article with a debate engine built in.

The owner's judgment behind it: an argument made once, in one home, and linked everywhere it is used, cannot be repeated into false strength. The site makes that literal: one claim, one page, every use visible ([[The Redundancy Problem]], [[One Page per Debate Topic]]).

## Adding to the web

The original page ended: "For improvements, or to add arguments or evidence, you can always Contact Me." There is no server behind the published site, so the contact link became a form under every table. Each form is a plain GET to a prefilled GitHub issue. As you type, [contribute.js](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) scores your claim against every claim already in the tables (published or draft) with the same rule `similarity.py` uses (`FLAG = 0.45, MERGE = 0.70, NGRAM = 4`), so a duplicate becomes a vote for the claim already there instead of a second page. When the issue lands, [intake.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) checks again with the Python engine and either records a vote in `content/votes.csv` or opens a pull request with your rows. A broader belief submitted through the upstream form is "Filed as a claim under this page; a broader belief that already has a page should point at that page instead" (the code, `intake.py`). Every belief, however far along, is published, and no drafted row is ever deleted: weak pages are improved by adding to them or ranked lower, never removed (the owner's standing rule).

## Related pages

- [[Argument Scores from Sub-Argument Scores]]: how a reason's own page feeds the row above it
- [[Linkage Scores]]: the Link column, argued on its own page
- [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]]: the Truth column
- [[Confidence Stability Scores]]: the Conf column
- [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]]: how much depends on a claim
- [[Assumptions]]: load-bearing components, the upstream that bears weight
- [[Evidence Verification Score (EVS)]] and [[Evidence to Conclusion Relevance Score]]: where evidence enters
- [[Pros and Cons on the Same Page]], [[One Page per Debate Topic]], [[The Redundancy Problem]]: the page design this navigation serves
- [[Templates]], [[Template: Belief Analysis]], [[Template: Topic]], [[Template: Linkage Evaluation]]: the page shapes, section by section
