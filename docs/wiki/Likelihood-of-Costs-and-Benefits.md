# Likelihood of Costs and Benefits

[[Home]] > Scoring > Likelihood of Costs and Benefits

## The Likelihood Score: calibrated probability for [Cost-Benefit Analysis](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba)

This page is the owner's explanation from the old PBworks wiki, never before on GitHub, merged with what the code does today. Every claim the original made has been checked against the source. Where the code does it, you get the file and the formula. Where the code does it differently, you get both versions. Where it is proposed and not built, it says so. The basis of every technical claim is labelled: **the code** (with its file), **a calculation** (numbers worked from the live tables or the sample data), or **the owner's judgment**.

In the Idea Stock Exchange, a **Likelihood Score** is not a subjective guess, a slider, or a gut feeling. It is a **nested belief** that must earn its probability through structured reasoning.

In any Cost-Benefit Analysis (CBA), the final contribution of a line item is its **Expected Value**:

> **Expected Value = Predicted Impact × Likelihood Score**

For example, a predicted benefit of **$1,000,000** with a **50%** Likelihood Score contributes exactly **$500,000** to the final decision. A catastrophic risk of **$10M** with a **10%** likelihood subtracts **$1M**. This ensures that high-impact but low-probability outcomes do not distort the analysis, and that uncertainty is accounted for mathematically.

Think of it as a betting slip pinned to every promise. "This bridge will save commuters $4.5 million" is a promise. "And there is a 75% chance it actually happens" is the bet. Promises are free. Bets have to be paid for, and on this site the currency is arguments.

## Where each piece stands today

The repository has two engines that both compute a likelihood, and they do it differently. The published site is [tools/static-site/](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md), which builds [myklob.github.io/ideastockexchange/beliefs](https://myklob.github.io/ideastockexchange/beliefs/index.html). The Next.js app is [src/core/scoring/](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/cba-scoring.ts), which runs the `/cba` pages.

| What the owner's page describes | Published site | Next.js app (`/cba`) | Status |
|---|---|---|---|
| Expected Value = Predicted Impact × Likelihood | Built. Expected value = typed estimate × Likelihood, per row ([render_site.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), `ev()`) | Built. `calculateExpectedValue(predictedImpact, activeLikelihood)` returns `predictedImpact * activeLikelihood` ([scoring-engine.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)) | Built in both |
| The likelihood is a nested belief with its own page | Built. Every cost and benefit row is a claim with its own page, and Likelihood is that page's truth score | Built. Each line item carries a `LikelihoodBelief` ([types/cba.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/types/cba.ts)) | Built in both, in different shapes |
| Several competing estimates ("30%", "50, 60%", "90%+") | Not built. One estimate per row | Built. A `LikelihoodBelief` holds a list of `LikelihoodEstimate`s, each with its own pro and con arguments | App only |
| Pro/con argument trees, recursive | Built. The cost's own page is argued like any other page | Built. Each estimate has `proArguments` and `conArguments`, each with sub-arguments | Built in both |
| Scored by Truth, Linkage and Importance | Built, plus Uniqueness and Confidence | Built, plus Uniqueness and a fallacy penalty | Built in both, different formulas (section 3) |
| The winning likelihood is the strongest surviving tree, not an average and not a vote | Not built. Listed under "Rules in the wiki this site does not run" ([method.html#notrun](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun)) | Built. `determineActiveLikelihood` picks the estimate with the highest ReasonRank score | App only |
| A status and a confidence interval on the likelihood | Not built | Built. Status `calibrated`, `contested` or `emerging`; interval from the spread of the estimates | App only |
| Which likelihood, moved, would flip the decision | Not built for costs and benefits (the sensitivity sweep covers truth scores, not nets) | Built. Swing per item, three scenarios, and compromise candidates | App only, and the Excel workbook |

The short version: **the Next.js app runs the owner's design almost exactly, on two sample analyses held in memory. The published site runs a simpler rule on real pages, and on every one of them the likelihood currently reads 0.50.** Both halves of that sentence are explained below.

## 1. The likelihood is a "conclusion"

When a user adds a cost or benefit (e.g., "This project will save $1M"), they are implicitly making a second claim: *"There is an X% chance this will happen."* This probability claim becomes a nested belief node [with its own page](https://myklob.github.io/ideastockexchange/beliefs/p/rise-u-s-unemployment.html). Multiple competing estimates (e.g., "30%", "50, 60%", "90%+") can coexist and compete for dominance.

This is the single most important design move on the page, and it is worth a moment. Most cost-benefit spreadsheets have a column called "probability" that somebody types into. The number in that cell is the least examined number in the whole analysis, and it is often the one that decides the answer. The ISE's move is to refuse that cell. If you want a probability, you open a debate about it.

### What the published site does

Every cost and benefit on a belief page is a row pointing at a claim page of its own ([the code: render_site.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), the "What Acting On This Would Cost and Gain" section). The section's own caption says it plainly: "Every cost and benefit is a claim with its own page, so Likelihood is that page's truth score, and Exp. value is the estimate times Likelihood."

A live example. The belief [The U.S. unemployment rate will reach 5 percent or higher before the end of 2027](https://myklob.github.io/ideastockexchange/beliefs/p/u-s-unemployment-rate-3.html) (filed under [The U.S. economy](https://myklob.github.io/ideastockexchange/beliefs/t/us-economy.html)) lists as a cost: [A rise in the U.S. unemployment rate from 4.2 percent to 5 percent would mean roughly 1.4 million more unemployed Americans](https://myklob.github.io/ideastockexchange/beliefs/p/rise-u-s-unemployment.html). Its estimate is typed as 1,360,000 people. Its likelihood is the truth score of its own page, 0.50, so its expected value is 680,000 people (a calculation from `content/edges.csv`, October 2026).

What the site does **not** do is hold several competing probabilities for one row. There is one row, one claim page, one truth score. The method page says so under "Not computed": "The wiki's likelihood ... is a winning estimate among several competing ones, each argued, with a status and a confidence interval. Here there is one estimate per row, and its likelihood is simply its page's truth score: a cost nobody has argued is taken at 0.50" ([method.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/method.py), section `cba`).

### What the Next.js app does

The app implements the owner's structure literally ([the code: types/cba.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/types/cba.ts)). Each line item has a `LikelihoodBelief` whose comment reads: "The probability is not voted on, it is argued for. 'There is an X% chance this will happen' is itself a claim that must survive adversarial scrutiny." Inside it sits a list of `LikelihoodEstimate`s, each with:

| Field | What it holds |
|---|---|
| `probability` | 0 to 1 (e.g., 0.7 for 70%) |
| `label` | human-readable ("70%", "50-60%", "90%+") |
| `reasoning` | why this probability was proposed |
| `proArguments`, `conArguments` | the argument trees for and against this estimate |
| `reasonRankScore` | computed from the trees, 0 to 1 |
| `isActive` | whether this estimate is currently winning |
| `contributor` | human or AI, with a name and a timestamp |

The sample data in [cba-data.ts](https://github.com/myklob/ideastockexchange/blob/master/src/features/cost-benefit-analysis/data/cba-data.ts) carries two analyses, "New Highway Bridge Construction (Route 47)" and "Universal Pre-K Program Expansion (State-Level)". They live in an in-memory store, not the database, so nothing a reader adds survives a restart.

## 2. Arguments build the score (the tree)

Users and AI agents submit pro/con arguments that branch into further sub-arguments, forming a recursive "argument tree" for each proposed likelihood. A high score requires strong supporting arguments and weak opposing ones.

High-quality arguments typically appeal to **Reference Class Forecasting** and related super-forecasting techniques. For example:

| Kind of argument | The owner's example |
|---|---|
| **Base Rates** | "In 100 similar bridge projects, 60% went over budget." |
| **Historical Data** | "When inflation exceeds 5%, this asset class drops in value 80% of the time." |
| **Falsifiable Assumptions** | "This outcome assumes the law passes: currently, it has only 30% polling support." |

The point of reference class forecasting is humility enforced by arithmetic. Your bridge feels special. So did the last hundred bridges. The base rate is what happened to them, and it is a far better starting guess than the enthusiasm of the people who want this one built.

### Where base rates go on the published site

On the published site a base rate is **evidence**, declared on the claim's page with three fields on the `pages` sheet: `etype` (the kind of source), `erq` (how many independent replications) and `erp` (the percentage of them that agree). Those set where the page's truth starts ([the code: evidence.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py), `prior()`):

> p0 = 0.5 + 0.5 × ESIW × (2 × ERP/100 − 1)
> weight = k × 2 × ERQ / (ERQ + 1)

ESIW is the evidence tier's weight. A base rate from a cited database is `statistics`, at 0.90; "historical trend, with references" is `historical`, at 0.70; "common sense or logic" is 0.50; "intuition or gut feeling" is 0.35. The full table has eighteen tiers, from 0.90 down to 0.10 for a historical artifact, and is printed at [method.html#starts](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts). With k = 1, replication is worth 1.00 for one study, 1.33 for two, 1.50 for three, 1.82 for ten, and never more than 2.00 (`REP_CAP = 2.0`).

There is a trap here worth spelling out, because it bites anyone who reads "likelihood = truth score" too fast. ERP is **the share of replications that agree with the claim**, not a frequency. Suppose the claim page says "The Route 47 bridge will cost more than its $18.7M estimate" and cites the owner's base rate (60 of 100 similar bridges went over) as one `statistics` source that agrees. Then ERP = 100, and p0 = 0.5 + 0.5 × 0.90 × (2 × 1 − 1) = **0.95**, not 0.60 (a calculation). Typing ERP = 60 instead gives 0.5 + 0.45 × 0.2 = **0.59**, which looks close to 0.60 and is a coincidence: it means "60% of the studies agreed", which is a different statement. Section 6 explains why this matters.

### Where base rates go in the Next.js app

In the app a base rate is simply a pro or con argument on an estimate. The bridge sample's 30% estimate is backed by "Reference class: only 30% of bridge projects complete within original budget" (truth 0.91, linkage 0.88, importance 0.95), citing "200+ bridge construction projects (ASCE database, 2005-2023)" with a median overrun of 34%, and by "Current inflation in construction materials exceeds 5%" (truth 0.85, linkage 0.82, importance 0.8). The truth values are typed into the sample, not computed from evidence: the app's evidence tiers (T1 10, T2 7, T3 5, T4 3, out of 10) feed only an item's `confidence`, and confidence never touches the expected value ([cba-scoring.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/cba-scoring.ts), `argumentConfidence`, default 0.3 when no tier is given).

## 3. ReasonRank scoring

The system scores every argument and sub-argument using three recursive metrics:

| Metric | The owner's question |
|---|---|
| **[[Truth\|Truth Score]]** | Is the underlying evidence factually accurate? |
| **[[Linkage\|Linkage Scores]]** | How strongly does this reasoning connect to *this specific* prediction? (e.g., A weak analogy like "twice the size = twice the cost" has low linkage if data shows non-linear scaling.) |
| **[Importance](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula)** | How much does this argument move the probability? |

Both engines use all three, add more, and combine them differently. See [[ReasonRank]] and [[Argument Scores from Sub-Argument Scores]] for the full machinery; what follows is the part that decides a likelihood.

### The published site's rule

A cost's likelihood is its page's truth, computed by the same rule as every other page ([the code: score_reference.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)):

> row contribution = sign × (2 × Truth − 1) × Confidence × Link × Imp × Uniq
> page truth (argued) = (POS + w × p0) / (POS + NEG + w)
> page truth = min(argued, weakest load-bearing component that has its own page)

POS and NEG are the positive and negative contributions as magnitudes. p0 and w come from the evidence prior above; a page that cites nothing starts at p0 = 0.5 with w = k = 1. When a factor has no page of its own the engine reads a labelled constant: UNARG = 0.5 for truth, DEFLINK = 1 for linkage, DEFIMP = 0.5 for importance, DEFUNIQ = 1 for uniqueness ([method.html#constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants)). Confidence comes from [confidence.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py) and measures how much work stands behind the row's own page.

Two things follow. The likelihood is **not** the output of a separate likelihood engine: it is a truth score, read from a page, the same number that page shows on its own heading line. And the cost-benefit rows do **not** feed the belief's own truth score. They are a separate readout; the truth score is built from reasons, evidence and predictions only.

### The Next.js app's rule

Each argument is scored by `scoreArgument` ([the code: scoring-engine.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)):

> baseTruth = truthScore × (1 − Σ |fallacy.impact| / 100)
> leaf: reasonRank = baseTruth
> with sub-arguments: subArgScore = clamp(0.5 + 0.5 × (proSub − conSub) / count, 0, 1)
> reasonRank = 0.15 × baseTruth + 0.85 × subArgScore   (DAMPING_FACTOR = 0.85)
> rawImpact = reasonRank × linkage × importance × uniqueness

Then each estimate gets one score from its two trees (`calculateReasonRankScore`):

> score = ProRank / (ProRank + ConRank), clamped to [0.01, 0.99]; 0.5 when there are no arguments

where ProRank and ConRank are the summed `rawImpact`s of the pro and con arguments. Linkage comes from a linkage debate if the argument has one, otherwise from community linkage votes, otherwise from the typed value (`resolveLinkageScore`).

**A stale document.** [docs/ALGORITHMS.md](https://github.com/myklob/ideastockexchange/blob/master/docs/ALGORITHMS.md) section 11, which was written from this page, gives a different formula: `ReasonRankScore = 0.5 + (ProStrength − ConStrength) / (2 × TotalArguments)`, with sub-arguments modifying the parent's truth by at most ±30% through `SubArgumentFactor = 1 + (NetSubStrength / SubArgCount) × 0.3`. The code runs neither. It runs the share-of-weight formula and the 0.15/0.85 blend above. Where the two disagree, the code is what produces the numbers on `/cba`.

**A third path, unused.** [cba-scoring.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/cba-scoring.ts) also exports `calculateLikelihoodFromTree`, which implements the rule in `docs/automated-cba/SKILL.md`: likelihood = pro_total / (pro_total + con_total), with truth on a 0 to 10 scale and a depth attenuation of 0.5^(d−1) (depth 1 counts 1.0, depth 2 counts 0.5, depth 3 counts 0.25). No route calls it. `recalculateCBA`, which is what the `/cba` pages run, uses the competing-estimates engine above.

## 4. The "winning" likelihood

The Likelihood Score is **not an average** and **not a vote**. It is the specific probability (or range) supported by the **strongest surviving argument tree**.

- If arguments for a "90% likelihood" rely on wishful thinking (low Truth/Linkage), that score decays.
- If arguments for a "50% likelihood" are backed by solid reference classes and survive scrutiny, **50% becomes the active Likelihood Score**.

This is a tournament, not a poll. Averaging "30%" and "90%" gives you 60%, a number nobody argued for and nobody believes. The tournament gives you whichever number had the better case.

### What the Next.js app does

`determineActiveLikelihood` ([scoring-engine.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)) scores every estimate, takes the one with the highest score, and returns **that estimate's probability**, not its score. With no estimates at all it returns 0.5 with status `emerging`. It then sets a status:

| Status | Condition in the code |
|---|---|
| `calibrated` | Two or more estimates and the winner leads the runner-up by more than 0.2; or exactly one estimate with at least two pro arguments |
| `contested` | Two or more estimates and a lead of 0.2 or less |
| `emerging` | Everything else: no estimates, or one estimate with fewer than two pro arguments |

And a confidence interval (`calculateLikelihoodCI`):

> CI = min(0.3, max(0.02, StdDev(probabilities) × max(0.5, 1 − TotalArgs × 0.03)))

where TotalArgs counts the top-level pro and con arguments across all estimates. A belief with one estimate or none gets 0.15.

### What the published site does

Nothing like it. There is one estimate per row and the likelihood is that row's page truth. The method page lists "Likelihood as the winning estimate among competing ones, with a status and an interval" among the rules the site does not run, and names what runs instead: "The truth score of the cost or benefit's own page" ([method.html#notrun](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun)). **Status: proposed for the published site, built in the app.**

## 5. A worked example: the Route 47 bridge

Here is the owner's design running, on the app's own sample data. The numbers below were produced by running `recalculateCBA` on the bridge analysis (a calculation, October 2026), and checked by hand for the first item.

The cost item is "Bridge construction and engineering costs", predicted impact −$18,700,000. Its likelihood question is "What is the probability that construction costs will stay at or below $18.7M?" Two estimates compete.

**Estimate "30%"** (contributed by an AI agent, Base-Rate-Core-v3):

| Argument | Side | Truth | Linkage | Importance | rawImpact |
|---|---|---|---|---|---|
| Reference class: only 30% of bridge projects complete within original budget | pro | 0.91 | 0.88 | 0.95 | 0.583 |
| ... sub: Base rates from large databases are the most reliable predictor (Flyvbjerg, 258 projects) | pro | 0.92 | 0.90 | 1.0 | 0.828 |
| ... sub: ASCE database uses standardized reporting | pro | 0.80 | 0.78 | 1.0 | 0.624 |
| ... sub: Database includes projects from different regulatory regimes | con | 0.72 | 0.68 | 1.0 | 0.490 |
| Current inflation in construction materials exceeds 5% | pro | 0.85 | 0.82 | 0.8 | 0.558 |
| This project uses design-build delivery, which reduces cost overruns | con | 0.75 | 0.70 | 1.0 | 0.525 |

The first argument's three sub-arguments net to 0.828 + 0.624 − 0.490 = 0.962, or 0.321 each, so subArgScore = 0.5 + 0.160 = 0.660 and its reasonRank = 0.15 × 0.91 + 0.85 × 0.660 = 0.698; times 0.88 × 0.95 that is 0.583. ProRank = 0.583 + 0.558 = 1.141. ConRank = 0.525. **Score = 1.141 / 1.666 = 0.685.**

**Estimate "70%"** (contributed by TaxpayerWatchdog): one pro, "Flyvbjerg: cost overruns in bridge projects average 34%" (0.90 × 0.85 = 0.765), and one con, "This is not a megaproject; small bridge projects have lower overrun rates" (0.72 × 0.75 = 0.540). **Score = 0.765 / 1.305 = 0.586.**

The 30% estimate wins. Its lead is 0.099, under 0.2, so the status is **contested**. The probabilities 0.3 and 0.7 have a standard deviation of 0.2, five top-level arguments give a factor of 0.85, so **CI = 0.17**. Expected value = −$18,700,000 × 0.30 = **−$5,610,000**.

The whole analysis comes out like this:

| Item | Impact | Winning estimate | Status | Expected value |
|---|---|---|---|---|
| Reduced commute times for 50,000 daily commuters | +$4,500,000 | 75% (beat "40-50%", 0.736 to 0.534) | calibrated | +$3,375,000 |
| New commercial development in the bridge corridor | +$2,100,000 | 20-30%, used as 0.25 (beat "60%", 0.990 to 0.544) | calibrated | +$525,000 |
| Reduction in traffic accidents at Route 47 intersection | +$2,160,000 | 85% (only estimate) | calibrated | +$1,836,000 |
| Bridge construction and engineering costs | −$18,700,000 | 30% (beat "70%", 0.685 to 0.586) | contested | −$5,610,000 |
| Environmental remediation and habitat disruption | −$1,200,000 | 80% (only estimate) | emerging | −$960,000 |
| Economic disruption during 3-year construction period | −$3,000,000 | 50-60%, used as 0.55 | emerging | −$1,650,000 |
| **Net** | | | | **−$2,484,000, verdict `net_negative`** |

The verdict rule is in `recalculateCBA`: `uncertain` when the absolute net is under 10% of total expected benefits, otherwise `net_positive` or `net_negative`.

### Two things the example exposes

**The construction cost is multiplied by the wrong probability.** The question the 30% answers is "will costs stay at or below $18.7M?" The engine then multiplies the entire $18.7M by 30%, which treats the bridge as having a 70% chance of costing nothing at all. Nobody believes that, least of all the people who argued for 30%: their point was that the bridge will cost *more*. The arguments are excellent and the tournament works; the line item is framed so the winning number answers a different question from the one the multiplication asks (a reading of the sample data). The fix is in the data, not the engine: split it into "the bridge costs $18.7M" (near certain) and "it overruns by about $6.4M" (34% median overrun, at whatever likelihood wins). This is exactly the kind of mistake the owner's insistence on "compared to what, in what units, how likely?" exists to catch, and it slipped through in the showcase example.

**The "optimistic" scenario is the gloomier one.** `generateScenarios` shifts every likelihood by +0.15 for optimistic and −0.15 for pessimistic, costs included. Raising the likelihood of a cost is not optimism. On the bridge, the optimistic scenario nets −$4,605,000, worse than the base case's −$2,484,000 (a calculation). The labels would be right if the shift went up for benefits and down for costs.

## 6. Truth is not a probability, and the published site leans on it as one

The Next.js app keeps two numbers apart: **how well argued an estimate is** (its ReasonRank score, 0.685 above) and **what the estimate says** (its probability, 0.30). The tournament uses the first to choose; the multiplication uses the second.

The published site has only one number per row, the page's truth score, and uses it as the probability. That works when the claim is a plain prediction ("this cost will happen") and truth is read as "how likely is this claim to hold". It goes wrong as soon as a claim carries its own number, the way the owner's estimates do. A page saying "there is a 30% chance this happens" that is argued to near-certainty has truth 0.95, and the site would multiply by 0.95, not 0.30. The site's own limits section warns about this in general terms: "A truth score is not a probability. It is a share of argued weight around a starting point. It has the shape of a probability and does not have the calibration of one. Nothing here has been checked against outcomes" ([method.html#limits](https://myklob.github.io/ideastockexchange/beliefs/method.html#limits)).

So the competing-estimates design is not a luxury the published site skipped. It is the piece that lets a likelihood mean a probability rather than a degree of settledness. **Status: proposed for the published site** (owner's judgment that it is wanted, from this page; the analysis of why it matters is a reading of the code).

## 7. What the published site computes from a likelihood

The owner's page stops at the expected value of one row. The published site does more with it, none of which the original page mentions ([the code: render_site.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), `stats()` and the cost-benefit section; [method.html#cba](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba)):

| Readout | How it is worked out |
|---|---|
| **Expected value of a row** | the typed estimate × Likelihood, where Likelihood is the truth score of the row's own page |
| **The row's band** | if the author typed a low end (`mag_low`) and a high end (`mag_high`), each end × the same Likelihood. The band is the lowest and highest of whatever endpoints the row states, the central estimate included |
| **Ranking** | Benefits and Costs and risks are two tables, each ranked by expected value, highest first; a row with no estimate shows "not priced" and goes last (Rule 8 of [the belief page rules](https://github.com/myklob/ideastockexchange/blob/master/docs/BELIEF_PAGE_RULES.md)) |
| **Net expected value** | benefit expected values minus cost expected values, added up **within each unit of measure, never across units** |
| **Net band** | bottom: every benefit at its low end and every cost at its high end; top: the reverse. A row with no range adds its single figure at both ends, and the page counts how many rows did |
| **Benefit to cost** | benefit EV / cost EV, printed only when everything is in one unit and costs are not zero |
| **Net by category** | one line per unit: benefits EV, costs EV, net |
| **Who gains, who pays** | the same expected values, added up by the interest page each row names as the one that collects or pays |
| **Structural check** | "Costs and benefits given as single figures": "A decision cannot be checked against a point estimate: the reader cannot tell whether the net survives the estimate being wrong, which is usually the whole question" ([integrity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py)) |

Readers add rows through a form under the cost-benefit table, with fields for Best estimate, Low end and High end, the units, and who gains or pays. [intake.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) (`estimate()`) copies a number only when it is one, writes magnitudes positive (the side says whether it is a cost), refuses a range whose low end is above its high end, and leaves a row with no units unpriced. **There is no likelihood field on the form, and that is deliberate**: the likelihood is whatever the row's own page argues to.

The Excel workbook that [build_pages.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/build_pages.py) generates adds one more column the HTML site does not show:

> Swing = |Magnitude| × (1 − |2 × Likelihood − 1|)

"the expected value still up for grabs on this row, in its own units. Large where the stakes are high and the likelihood is near 0.5." The workbook then names the row with the most swing on each side: "These are the rows a compromise has to move: high stakes, likelihood still near the middle."

### The live tables, October 2026

A calculation over `content/edges.csv` and the scoring model:

| Count | Value |
|---|---|
| Beliefs with a cost-benefit table | 42 |
| Cost and benefit rows | 218 |
| Rows with an estimate typed | 93 |
| Rows with a low and a high end | 0 |
| Beliefs whose priced rows are in more than one unit (so no single net) | 23 |
| Rows whose likelihood is anything other than 0.50 | **0** |

Every expected value on the published site today is exactly half its estimate. That is not a bug in the arithmetic. It is the next section.

## 8. Why every likelihood on the site reads 0.50

On the published site a row contributes `sign × (2 × Truth − 1) × Confidence × Link × Imp × Uniq`. A claim nobody has argued has Truth 0.50, so (2 × 0.50 − 1) = 0 and it contributes nothing. A page whose rows all contribute nothing reads its starting point, and with no evidence declared the starting point is 0.50. By induction, **every page in a graph where nothing is cited reads exactly 0.50 forever**. The test `test_engines.py::test_argument_alone_can_never_leave_the_neutral_point` pins it ([the code: test_engines.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py)). Argument about argument never touches the world.

Cost and benefit pages are claim pages, so they inherit this exactly. None of the 218 declares `etype`, `erq` or `erp`, so all 218 start at 0.50 and stay there. The way out is the same as for any page: cite the base rate. Put the owner's "60 of 100 similar bridges went over budget" on the overrun claim's page as a `statistics` source and that page's likelihood moves the moment the site rebuilds.

This is also where the two engines part company on volume. The Next.js estimate score is ProRank / (ProRank + ConRank), so listing an unargued pro argument raises an estimate's score. The published rule gives that argument exactly zero. CLAUDE.md lists the disagreement as open decision 1, unresolved and not accidental.

## 9. Which likelihood would flip the decision

The owner's page asks for a likelihood that survives attack. The obvious follow-up question is: which likelihood, if it lost its argument, would change the answer? Both codebases have partial answers.

| Mechanism | Where | Formula and constants | Status |
|---|---|---|---|
| Swing per item | Next.js, `calculateSensitivity` ([cba-scoring.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/cba-scoring.ts)) | swing = \|magnitude × (likelihood_high − likelihood_low)\|; the band is the CI either side, or with two or more estimates 0.5 × (lowest estimate score / highest estimate score) either side, clamped to [0, 1], so estimates that score alike give the widest band. Top 5 by swing | Built. On the bridge, construction cost swings $13,612,996 (likelihood 0 to 0.728) |
| Scenarios | Next.js, `generateScenarios` | every likelihood +0.15, 0, −0.15, clamped to [0, 1] | Built, with the labelling problem in section 5 |
| Compromise candidates | Next.js, [conflict-resolution.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/conflict-resolution.ts) | items where a likelihood shift at or below `ACHIEVABLE_SHIFT = 0.15` flips their category's net sign, keeping the shifted likelihood in [0, 1] | Built in the app; Rule 7 of the belief page rules calls these "the winnable disagreements" |
| Swing column | The Excel workbook | \|Magnitude\| × (1 − \|2 × Likelihood − 1\|) | Built in the workbook only |
| Sensitivity sweep | Published site, [sensitivity.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py) | each claim held at false and at true, one at a time, the whole graph recomputed; flip at 0.5 by bisection (`STEPS = 16`) | Built, but for **truth scores**, not cost-benefit nets. It never sweeps a likelihood to see whether a net changes sign |
| Small likelihood changes that flip a disagreement | Published site, topic pages | The topic page's own caption: "nothing on this site yet tests which disagreements a small change in likelihood would flip" ([render_site.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)) | Not built on the published site |

See [Sensitivity on the method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity) and [[Confidence Stability Scores]].

## 10. The other likelihood number in the Next.js app

The app's belief page shows a score called **CBA likelihood** in its scorecard ([ScorecardSection.tsx](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/ScorecardSection.tsx), computed in [fetch-belief.ts](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/data/fetch-belief.ts) and again in [all-scores.ts](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts)):

> CBA likelihood = clamp((benefitLikelihood − costLikelihood) / 2 + 0.5, 0, 1), each defaulting to 0.5 when missing

Both inputs are typed floats on the `CostBenefitAnalysis` table in [prisma/schema.prisma](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma) (`benefitLikelihood Float?`, `costLikelihood Float?`), set by seed scripts to values like 0.65, 0.72, 0.85 and 0.9. No argument tree stands behind them. That is precisely the slider this page opens by forbidding. **Status: built, and contrary to the owner's rule.** The fix is to compute it from the `/cba` engine or to retire it; until then it should be read as a typed estimate.

The app also discounts near-duplicate line items before adding them up (`applyImpactDeduplication`): word overlap above 0.8 flags a pair for review, overlap between 0.3 and 0.8 multiplies the weaker item's impact by (1 − overlap). The argument-level version, `applyArgumentDeduplication`, is exported and called by nothing, so a point made three ways inside one estimate's tree counts three times (CLAUDE.md, open decision 4). See [[The Redundancy Problem]].

## 11. Why this matters

- **Combats Optimism Bias:** Proponents cannot just claim a "Best Case Scenario." They must build a surviving argument tree justifying why that outcome is *probable*. *Status:* in the app, an optimistic estimate has to beat the others in the tournament; on the published site, an optimistic cost page has to be argued off 0.50 like any claim, and a range is asked for so the best case is visible as one end of a band rather than the whole story.
- **Standardizes Comparisons:** A 10% chance of $10M and a 100% chance of $1M are treated as equal expected value ($1M). *Status:* both engines do exactly this. Note what it costs: expected value is risk-neutral by construction. A town that cannot survive a $10M loss is not indifferent between those two bets, and the arithmetic does not know that. The published site's net band (every benefit low, every cost high) is its only nod to spread, and with no row stating a range today the band has zero width (a calculation, from the table in section 7).
- **Rejects Intuition:** To reject this method is to claim that human intuition handles complexity better than mathematical expected value; a claim that is demonstrably false. *Basis:* the owner's judgment, consistent with the forecasting literature the sample arguments cite (Flyvbjerg's reference class forecasting). Neither engine has been checked against outcomes.

> **The Blunt Rule:** Impacts do not count unless their probabilities survive attack.

How each engine keeps the Blunt Rule today: the app makes every probability win a tournament before it is used; the published site multiplies every impact by a truth score that sits at 0.50 until somebody grounds it. The published site therefore counts every impact at half weight, whether or not its probability has survived anything. That is a neutral default, not a survived attack, and it is the gap between the rule and the site.

## 12. The owner's direction on scoring, applied to likelihood

The owner answered the scoring questions in October 2026 (CLAUDE.md, "The owner's direction on scoring"; [docs/WIKI_AUDIT.md](https://github.com/myklob/ideastockexchange/blob/master/docs/WIKI_AUDIT.md)). The goal is a score that promotes good ideas and demotes bad ones in the real world, and the preferred way to change a rule is to publish the new one beside the old and compare them on real pages. Here is what that direction says for likelihood, against what runs.

| Direction | What runs today | Where it differs |
|---|---|---|
| **Volume.** For choices of action the question is costs and benefits across every stakeholder with a legitimate interest, counting both the quantity and the quality of interests met, under different assumptions about which interests are valid. Contributions count from the moment they are posted and are argued down from there | Published site: "Who gains, who pays" adds expected values by interest, but one net, under one assumption (every named interest counts). [tally.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py), the count-every-reason rule, is printed beside the truth score and explicitly leaves choices for action to the cost-benefit section. App: unargued arguments raise an estimate's score from the start | Not built: nets recomputed under different assumptions about which interests are valid; a count-every-reason reading of each likelihood page beside its argued truth. Both are proposed |
| **Votes.** Votes may decide what is promoted, never what is valid; track popular apart from sound | Published site: every cost and benefit row carries vote links whose counts are shown and never scored ([intake.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py): "A vote never moves a score"). App: community linkage votes can set an argument's linkage when there is no linkage debate (`resolveLinkageScore`, priority 2), and so can move an estimate's score | The app's linkage-vote path lets votes move a likelihood, which the direction rules out |
| **Fallacies.** Software may flag; nothing is final; a flag is argued like any claim and moves no score | Published site: [fallacy.py](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) flags by a published phrase list and moves nothing. App: `scoreArgument` multiplies truth by (1 − Σ \|fallacy.impact\| / 100) | The app's fallacy penalty lets a flag move a likelihood. The bridge sample has no fallacies recorded, so it does not show |
| **Linkage.** Start trusting, lower it when argued down, let it rise when argued well | Published site: DEFLINK = 1 when no linkage page exists, then the linkage page's argued truth. App: a typed linkage on each argument (0.88, 0.68 and so on in the sample), or a linkage debate's score | The app's typed linkages are starting guesses the direction allows ("any sensible starting guess is acceptable"). The owner's own example, "twice the size = twice the cost" scoring low where data shows non-linear scaling, has no dedicated treatment anywhere; it is argued like any linkage |
| **Evidence.** Prefer no ceiling, so replicated work can outweigh opinion by 15 or 200 times; tally.py uses ESIW × ERQ × ERP/100 uncapped | Published site: a likelihood page's start is bounded to [0.05, 0.95] and replication is capped at 2.00 times k. App: evidence tiers set an item's confidence, never its likelihood | Both engines keep a ceiling on how far evidence can move a likelihood. The uncapped weight exists only in tally.py, which does not read cost-benefit rows |

## 13. Proposed, not built

Nothing here is deleted for being unbuilt. Each is labelled with where it stands.

| Proposal | Source | Status |
|---|---|---|
| Competing likelihood estimates, the winning one chosen by its argument tree, with a status and an interval, on the published site | This page; ALGORITHMS.md section 11 | Built in the app (`/cba`); proposed for the published site, where it would also separate "how well argued" from "what probability" (section 6) |
| A linkage treatment for non-linear scaling ("twice the size = twice the cost" has low linkage if data shows non-linear scaling) | This page's example; the original ended with an offer to draft a Linkage Score page that "specifically defines how we score non-linear scaling in these models" | Proposed. No such page or rule exists; see [[Linkage Scores]] and [[Template: Linkage Evaluation]] |
| Nets recomputed under different assumptions about which interests are valid | The owner's direction, October 2026 | Proposed |
| Low and high ends for every estimate | The belief template and the structural check; CLAUDE.md open decision 3 ("Filling them is the owner's estimate to make, not a session's") | The columns exist and all 93 priced rows leave them empty |
| A sweep that finds which likelihood would flip a net's sign | The Next.js compromise candidates; the topic page caption | Built in the app; not built on the published site |
| Scenario labels that move benefits and costs in opposite directions | Section 5 of this page | Proposed fix to `generateScenarios` |
| Re-framing the bridge construction cost so the winning probability answers the question the multiplication asks | Section 5 of this page | Proposed fix to the sample data |
| Computing the app's "CBA likelihood" scorecard number from argument trees, or retiring it | Section 10 of this page | Proposed |
| Bringing ALGORITHMS.md section 11 into line with the code | Section 3 of this page | Proposed |

## Related pages and templates

- [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]]: the number the published site uses as a likelihood.
- [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]]: the scoring the tournament runs.
- [[Argument Scores from Sub-Argument Scores]]: how sub-arguments feed a parent.
- [[Linkage Scores]] and [[Evidence to Conclusion Relevance Score]]: the "does this reason bear on this prediction" factor.
- [[Evidence Verification Score (EVS)]]: how a cited base rate sets where a page starts.
- [[Confidence Stability Scores]]: how much work stands behind a likelihood page.
- [[Likely Interests of Those Who Agree and Disagree]]: who gains and who pays.
- [[Assumptions]]: the "falsifiable assumptions" arguments, and the load-bearing cap on truth.
- [[The Redundancy Problem]]: why a point made three ways should not count three times.
- [[Evidence‐based policy]] and [[Automated Conflict Resolution Platform]]: where cost-benefit results are meant to be used.
- [[Template: Belief Analysis]]: the Cost-Benefit Analysis section, with the columns Category (Units), Magnitude, Range, Likelihood and Expected Value.
- [[Template: Interest Validity Debate]] and [[Template: Stakeholder Profile]]: where the interests that gain and pay are argued.
- On the site: [method.html#cba](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba) (costs and benefits), [method.html#starts](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts) (where a page starts), [method.html#notrun](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun) (rules not run), [method.html#limits](https://myklob.github.io/ideastockexchange/beliefs/method.html#limits) (what it cannot do).
- In the app: [the CBA explainer](https://github.com/myklob/ideastockexchange/blob/master/src/app/cba/about/page.tsx), whose example cascade has a Tier 1 study moving a cost's likelihood "from 65% → 20%" and the policy score adjusting with it.
