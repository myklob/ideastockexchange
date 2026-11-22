# Pros and Cons on the Same Page

*[[Home]] > Page Design > **Pros and Cons on the Same Page***

**Why Every Idea Deserves a Two-Column Debate Page**

> **Core Principle:** Truth emerges from weighing the strongest evidence *for* a claim against the strongest evidence *against* it, simultaneously, not sequentially.

This page is the owner's explanation of the idea that started the Idea Stock Exchange, kept whole, with every claim it makes checked against the code that runs today. Where the code does what the owner describes, the page says so and links the file. Where the code does something different, or something the owner's text never mentions, the page says that too, in the place it comes up, with the real formula and the real constants.

**Two engines, so sometimes two answers.** The repository has two scoring implementations, and on this subject they disagree in ways that matter.

- **The published site** is [`tools/static-site/`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md). It builds [myklob.github.io/ideastockexchange/beliefs/](https://myklob.github.io/ideastockexchange/beliefs/index.html) from two flat tables, `pages` and `edges`. When this page says "the site", it means this one.
- **The Next.js app** is [`src/core/scoring/`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts), with its belief page in [`src/app/beliefs/[slug]/page.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/app/beliefs/%5Bslug%5D/page.tsx). "The app" means this one.

Every status below is one of: **runs on the site**, **runs in the app**, **proposed, not built**, **replaced** (and by what), or **refused by design** (and why). Every number is labelled with its basis: the code (with its file), a calculation from the code, or the owner's judgment.

---

## The problem: scattered arguments make truth invisible

Right now, if you want to understand whether raising the minimum wage helps workers, you'll find:

- Pro-wage articles on progressive sites
- Anti-wage articles on libertarian sites
- Academic studies buried in paywalls
- Partisan talking points on social media

**Result:** You never see the best case for *and* against in one place. You choose your tribe, read their arguments, and think you've done your homework.

This is why debates never end. We're not actually engaging with the strongest version of the opposing view. We're fighting straw men while our opponents do the same.

Think of it as two football teams that have never met. Each one plays every Saturday against a cardboard cutout of the other, wins every game, and goes home convinced it is unbeatable. Nobody ever finds out which team is better, because the two teams are never on the same field. The fix is not a better cardboard cutout. It is one field.

**That field now exists for this exact question.** The site has a belief page for it: [Raising the minimum wage generally helps low-paid workers more than it hurts them](https://myklob.github.io/ideastockexchange/beliefs/p/raising-minimum-wage-generally.html), filed under the [Jobs](https://myklob.github.io/ideastockexchange/beliefs/t/jobs.html) topic. Here is what it showed at the revision this page was checked against (the built page, from [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)):

| Reasons to agree | Truth | Conf | Link | Imp | Uniq | Score |
|---|---|---|---|---|---|---|
| A single worker has almost no power to bargain with a large employer, and a wage floor gives them the bargaining position they lack. | 0.50 | 0.00 | 1.00 | 0.50 | 1.00 | +0.00 |
| Low-paid workers spend nearly everything they earn, so higher wages flow straight back into local businesses. | 0.50 | 0.00 | 1.00 | 0.50 | 1.00 | +0.00 |
| When wages are too low to live on, taxpayers end up topping them up through public benefits, which is a subsidy to low-paying employers. | 0.50 | 0.00 | 1.00 | 0.50 | 1.00 | +0.00 |

| Reasons to disagree | Truth | Conf | Link | Imp | Uniq | Score |
|---|---|---|---|---|---|---|
| When labor costs more, employers hire fewer people, cut hours or turn to machines, and the workers who lose out are the least skilled. | 0.50 | 0.00 | 1.00 | 0.50 | 1.00 | +0.00 |
| Small businesses in poorer regions cannot pay what a big-city employer can, so one national floor destroys jobs where they are most needed. | 0.50 | 0.00 | 1.00 | 0.50 | 1.00 | +0.00 |
| Many minimum-wage earners are young people or second earners in comfortable households, so a higher minimum wage misses the poorest families it is meant to help. | 0.50 | 0.00 | 1.00 | 0.50 | 1.00 | +0.00 |

Six reasons, three a side, each a complete claim with its own page. Every score is zero and the belief reads 0.50, because nobody has argued any of the six yet, and on the site a claim nobody has argued is worth exactly nothing (the rule is explained under [How a reason is weighed](#how-a-reason-is-weighed-the-formula-as-it-runs)). The page is a draft, and says so in its own header: it still needs evidence, objective criteria, testable predictions or a falsifiability test, costs and benefits, and interests on either side. Under the owner's standing rule it is published anyway, because quality is ranked, never gated (code: `CORE_BAR` in [`publish.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/publish.py)).

The empty scores are not a failure of the idea. They are the idea working honestly. The page has done the first job the owner asks for (the best case each way, in one place) and refuses to pretend it has done the second (deciding which case is stronger) until somebody does the work.

---

## The solution: one page per topic, two columns per page

The Idea Stock Exchange treats every significant belief as deserving its own page where *all* perspectives converge and compete on merit. See: [[One Page Per Topic|One Page per Debate Topic]].

**The Architecture:**

**Left Column: [Reasons to Agree](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula)**
**Right Column: Reasons to Disagree**

Not static lists. Live argument markets where [[Evidence|Evidence Verification Score (EVS)]] quality determines position.

**Status: runs on both engines, with one difference in what "position" means.** On both, each side is ranked by score, strongest first, and a row moves only when its score moves (code: `side_order` in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py); `rankByScore` and `byScoreDesc` in [`src/features/belief-analysis/lib/ranking.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/lib/ranking.ts)). Nobody hand-orders a table: "If a row deserves to be higher, win its sub-debate" ([`docs/BELIEF_PAGE_RULES.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/BELIEF_PAGE_RULES.md), Rule 8). But the score that sets position is not evidence quality alone. It is the whole row: truth, confidence, linkage, importance and uniqueness multiplied together. Evidence quality enters through truth (on the site, it sets where a claim's truth starts; see [Evidence tiers](#the-evidence-tier-system)).

Both engines also show each table's top five rows and fold the rest behind a toggle, so a reader meets the strongest case first and can still see everything (code: `collapse_tables(markup, n=5)` in `render_site.py`, a plain checkbox with no script needed; `TABLE_TOP_LIMIT = 5` in `ranking.ts`). A sixth-ranked reason is never hidden, only folded. Nothing ranked low is deleted.

### What "two columns" looks like, surface by surface

The owner's picture is literal: reasons to agree on the left, reasons to disagree on the right, in the same eyeline. Here is what each surface actually draws.

| Surface | Layout | Basis |
|---|---|---|
| The canonical template | One table, 14 columns: seven for Reasons to Agree, seven for Reasons to Disagree, so row 1 holds the best reason each way side by side. A Pro Total and a Con Total close the table, then the Net Belief Score line. | [`templates/belief-analysis-template.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/belief-analysis-template.html); see [[Template: Belief Analysis]] |
| The app's belief page | The same 14-column table. Each side keeps its own ranking and row *i* holds the *i*-th best reason of each side, padded with blanks when one side is shorter. | `pairBySide` in `ranking.ts`; [`ArgumentTreesSection.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/ArgumentTreesSection.tsx) |
| The published site | Two tables, one per side, in a grid that puts them side by side only when each side can get 720 pixels, and stacks them (agree above disagree) otherwise. Below 900 pixels it always stacks. | the `.sides` rule in `render_site.py`'s stylesheet: `grid-template-columns:repeat(auto-fit,minmax(min(100%,720px),1fr))` |

**What that means on the site, by calculation.** A belief page's main column is at most 1,180 pixels wide with 20 pixels of padding each side, so it holds at most 1,140 pixels of content. Two 720-pixel columns plus the 16-pixel gap need 1,456. So on the published site, at every screen width, the two sides of the argument table sit one above the other: same page, same section, back to back, never shoulder to shoulder. The reason is in the code's own comment on the stacked layout: a table with a sentence column does not fit in half a page, and a table that scrolls sideways "hides columns behind a gesture nobody makes". A build test enforces it (`TestNoTableIsWiderThanWhatHoldsIt` in [`test_render.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_render.py)). Shorter two-sided tables (assumptions, obstacles, biases, laws, people on record) use the same grid; the wide ones (interests, media) always stack.

So the owner's principle (both sides, same page, same moment) holds everywhere. The owner's picture (left and right, same eyeline) holds in the template and the app, and on the published site is replaced by agree-then-disagree in one section. Whether that trade is right is listed under [Open questions](#open-questions-for-the-owner).

### Which column is "left"

The columns are *agree* and *disagree with the belief as worded*, not left-wing and right-wing. On the minimum wage page above, the progressive case happens to sit in the agree column. Word the belief as "Cutting the corporate tax rate raises wages" and the conservative case sits there instead. The page does not know or care which tribe a reason comes from. It only knows which way the reason pushes this particular sentence.

---

## How it works: the ReasonRank engine

### 1. Arguments link to evidence, not emotions

Every reason to agree or disagree must connect to verifiable evidence. No evidence? The argument doesn't appear. See: [[Evidence Scores|Evidence Verification Score (EVS)]].

**Status: replaced, and the gate is refused by the owner's own later direction.** No engine hides a reason for lacking evidence.

- **On the site** (runs), every reason anyone files appears on the page, ranked. A reason with no evidence and no argument beneath it sits at Truth 0.50 and contributes exactly 0 to the argued truth score, so it appears and weighs nothing (code: `_contrib` in [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)). That is the evidence requirement turned from a bouncer at the door into a scale inside the room: the reason gets in, and it weighs what has been shown.
- **The owner's direction (October 2026)** goes further the other way: contributions count from the moment they are posted and are argued down from there, because a rule under which work counts for nothing until someone proves it tells contributors their effort is wasted. The site prints that rule beside the argued truth score on every belief page, as "Counting every reason until it is argued down" (code: [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py); [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)). Under it, the six unargued minimum wage reasons above count three and three, and the page reads 50% for.
- **In the app** (runs), every reason in the database renders, and an unargued one counts at whatever truth score is stored for it.

A hard "no evidence, no appearance" gate would contradict both the site's publish-everything rule and the owner's direction, so it is not built and is not planned.

What *is* built is the separation the owner's sentence was reaching for: **arguments are not evidence.** On both engines a belief page has an Argument Trees table (reasons, which are claims) and a separate Evidence Ledger (findings, which can fail empirically), and a finding is never filed as a reason (Rule 4 of [`docs/BELIEF_PAGE_RULES.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/BELIEF_PAGE_RULES.md)). A finding can be filed under one of the belief's reasons instead of under the belief itself, in which case it reaches the belief through that reason's truth score.

#### The evidence tier system

The owner's tiers:

- **T1:** Peer-reviewed studies, official government data
- **T2:** Expert institutional analysis
- **T3:** Quality journalism, surveys
- **T4:** Opinion, anecdote

**Status: runs in the app almost exactly as written; replaced on the site by the eighteen-row table from the [[Evidence Verification Score (EVS)]] page.**

| Owner's tier | App weight (code: `EVIDENCE_TYPE_WEIGHTS`, [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)) | Nearest rows on the site (code: `ESIW`, [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py)) |
|---|---|---|
| (not in the owner's list) | **T0** Retracted / Fraudulent: **0.05** | none; a retraction is recorded as replications that disagree (see [Truth scores update](#3-truth-scores-update-automatically)) |
| **T1** Peer-reviewed studies, official government data | **1.0** | statistics 0.90, primary official record 0.90, RCT 0.85, meta-analysis 0.80 |
| **T2** Expert institutional analysis | **0.75** | expert testimony with supporting data 0.65, expert or social media claim 0.60 |
| **T3** Quality journalism, surveys | **0.5** | news or media report 0.30, survey or poll 0.25 |
| **T4** Opinion, anecdote | **0.25** | personal experience or anecdote 0.55, intuition or gut feeling 0.35 |
| unknown tier | **0.5** (the default in `getEvidenceTypeWeight`) | no source type named: **0.0**, so the claim starts at a coin flip |

The site's full table, strongest first (code: `ESIW` in `evidence.py`; [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#evs)):

| Rank | Source type | Weight |
|---|---|---|
| 1 | Statistics and data, with the source cited | 0.90 |
| (addition) | Primary official record: statute, judicial holding, agency rule, sworn filing | 0.90 |
| 2 | Formal scientific study: randomized controlled trial | 0.85 |
| 2 | Formal scientific study: meta-analysis | 0.80 |
| 3 | Observational or correlational study | 0.75 |
| 4 | Historical trend, with references | 0.70 |
| 5 | Expert testimony with supporting data | 0.65 |
| 6 | Expert or social media claim | 0.60 |
| 7 | Personal experience or anecdote | 0.55 |
| 8 | Common sense or logic | 0.50 |
| 9 | Analogy or metaphor | 0.45 |
| 10 | Cultural norm | 0.40 |
| 11 | Intuition or gut feeling | 0.35 |
| 12 | News or media report | 0.30 |
| 13 | Survey or poll | 0.25 |
| 14 | Eyewitness testimony | 0.20 |
| 15 | Visual evidence | 0.15 |
| 16 | Historical artifact | 0.10 |

Two notes an auditor should have, both from `evidence.py`'s own header. The EVS page gives rank 2 as one band, "0.85-0.80", over two things; the split (RCT 0.85, meta-analysis 0.80) follows the order they are listed in. And the primary official record row is an addition, marked as one, because a statute or court holding is most of the record in policy work and calling it a "historical trend" would be wrong.

Notice one thing the mapping exposes. The owner's tiers put quality journalism and surveys (T3) *above* opinion and anecdote (T4). The site's table, copied from the EVS page, puts personal anecdote (0.55) *above* news (0.30) and surveys (0.25). The app follows the owner. The two engines therefore disagree about whether your neighbour's story outranks the evening news. That is listed under [Open questions](#open-questions-for-the-owner).

**How a tier becomes a number on the site** (code: `prior` in `evidence.py`; [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts)). A tier is not a multiplier on the row. It sets where the finding's own page starts before anyone argues with it:

```
prior p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)
weight w = k x 2 x ERQ / (ERQ + 1)              (k = 1, so w runs from 1.00 toward a ceiling of 2.00)
truth    = (POS + w x p0) / (POS + NEG + w)
```

ESIW is the tier weight, ERQ the number of independent replications, ERP the share of them that agree. Read it at the corners (a calculation from the formula): a published statistic every replication confirms starts at 0.95; the same statistic every replication contradicts starts at 0.05; an eyewitness account starts at 0.60 confirmed and 0.40 contradicted, because eyewitness testimony was never going to settle much either way; anything at half agreement starts at 0.50 whatever its tier. Replication is rewarded with a ceiling: 1 replication weighs 1.00, 2 weigh 1.33, 3 weigh 1.50, 10 weigh 1.82, and no pile of replications passes 2.00, "so no pile of replications can put a claim beyond argument" (`REP_CAP = 2.0`).

Why a prior and not a multiplier? Because source quality belongs to the claim, not to the place the claim is cited. The same study cited on four pages has one truth. How much it bears on each conclusion is a separate question, argued on a [[Linkage Scores|Linkage Scores]] page.

**The owner's direction on evidence weight** prefers no ceiling at all, so a body of replicated work can outweigh opinion by 15 or 200 times. The site's count-every-reason rule does that: a finding weighs `Truth x Linkage x Importance x Uniqueness x (1 + ESIW x ERQ x ERP/100)`, uncapped (code: `finding_strength` and `weight` in `tally.py`). The EVS page's own unbounded sum, `ESIW x ECRS x ERQ x (ERP/100)` per finding, is shown in every Evidence Ledger's EVS column and read by no score (code: `evs` in `evidence.py`).

**How a tier becomes a number in the app** (code: `calculateEVS` and `computeEvidenceImpactScore` in `scoring-engine.ts`):

```
EVS             = ESIW x log2(ERQ + 1) x ECRS x ERP
evidence impact = clamp(EVS x linkage x 10, 0, 100)
```

The code's own comment: "A single well-replicated T1 study (EVS ≈ 1-2, linkage ≈ 0.7-0.9) lands in the 7-18 range, comparable to a solid argument edge; a retracted T0 source collapses to ≈ 0."

### 2. Linkage determines strength

An argument scores high only if it *actually supports the conclusion*. Logical fallacies (ad hominem, strawman, false dichotomy) get scored down automatically. See: [[Linkage Scores]].

The first sentence **runs on both engines**. Every row carries a linkage factor, and "The sky is blue" filed under a carbon tax gets a linkage near zero however true it is. The whole idea, with worked examples, is on [[Linkage Scores]]. Two facts matter here:

- **On the site**, linkage is the truth score of a linkage page where people argue whether this reason bears on this belief. With no linkage page it reads `DEFLINK = 1`: presumed relevant until someone argues otherwise (code: `CONSTS` in `score_reference.py`). That matches the owner's direction exactly: start trusting, fall when a reason is shown unrelated or invalid, and rise when the link is argued well. Under every reason on a belief page there is also a "Bears on this: yes / no" pair of vote links; those are shown and never scored (see [Votes](#votes-shown-beside-the-score-never-inside-it)).
- **In the app**, linkage is `LS = (A − D) / (A + D)` over a linkage debate, on a scale from −1 to +1, and **0.0 when nobody has argued it** (code: `scoreLinkageDebate` in `scoring-engine.ts`). That starts suspicious rather than trusting, which differs from the owner's direction.

The second sentence, **fallacies scored down automatically, is refused by design on the site** and refused by code shape in the app.

- **On the site** (runs), software flags a *possible* fallacy and never scores it. [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) is a short published phrase list with nine patterns: Attacking the person, Appeal to popularity, Appeal to authority, Slippery slope, False choice, Sweeping generalization, Appeal to tradition, Pointing at the other side, and After, therefore because of. Each flag is phrased as a question, shows the exact words that set it off, and opens two prefilled forms on the flagged claim's own page: a reason to disagree saying it *is* the fallacy, and a reason to agree saying it *is not*. Whatever that argument concludes moves the claim's truth score through the ordinary rules. The flag never does. The reason is written into [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py): on a corpus about officials acting on financial interests, a pattern matcher hunting for "attacking the person instead of the argument" would fire on the central legitimate argument on every page, and "a check that deducts points from the strongest claim in the corpus, silently, with no page to appeal to, is worse than no check." This is the owner's direction to the letter: software may flag, nothing is final, and a flag moves no score.
- **In the app** (runs), the agent-ingest detector drafts counter-arguments aimed at the factor a fallacy damages (linkage for relevance fallacies, logical validity for formal ones, evidence quality for cherry-picking) and "deliberately returns NO numeric fields" (code: [`src/lib/agent-ingest/fallacy-detector.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/fallacy-detector.ts)). There is one place a number moves: a structured fallacy claim that reaches 60% weighted agreement with at least 3 votes is confirmed (`CONSENSUS_THRESHOLD = 0.6`, `CONSENSUS_QUORUM = 3` in [`src/lib/consensus.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/consensus.ts)) and publishes a counter-argument at strength 0.8 for a major fallacy or 0.5 for a minor one (code: [`src/lib/fallacy/claims.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/claims.ts)). There, a vote decides validity, which the owner's direction on votes rules out. That is listed under [Open questions](#open-questions-for-the-owner).

**Formula:**

```
Argument Strength = Evidence Quality × Logical Linkage × Importance
```

See: [[ReasonRank]] for the complete algorithm.

**Status: replaced.** No engine runs this three-factor product. Each runs a longer one, and the extra factors are what stop the gaming the owner worries about.

### How a reason is weighed: the formula as it runs

| Rule | A row weighs | Where |
|---|---|---|
| Owner's formula (2023 page) | Evidence Quality × Linkage × Importance | not run |
| **Site, argued truth score** (runs; this is the number on the heading line) | sign × (2 × Truth − 1) × Confidence × Linkage × Importance × Uniqueness | `_contrib` in [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py); [method](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula) |
| **Site, count every reason** (runs; printed beside it, read by no other number) | Truth × Linkage × Importance × Uniqueness, and a finding × (1 + ESIW × ERQ × ERP/100) | `weight` in [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py); [method](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally) |
| **App belief page** (runs) | impactScore = sign × truth × \|linkage\| × importance × uniqueness × 100, with uniqueness discounting restatements of earlier same-side siblings | [`propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts); the app's protocol demo uses the same product as `rawImpact` in [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts) |

What each extra factor is for:

- **(2 × Truth − 1)** puts truth on a −1 to +1 scale. A reason argued *false* counts *against* the side it was filed on, so ten refuted reasons to agree weaken a belief instead of padding it. A reason nobody has argued (0.50) contributes exactly 0.
- **Confidence** (0 to 1) is how much work stands behind the reason's own page: both sides argued, multipliers challenged rather than presumed, sources cited, the claims underneath established. At 0 a claim moves its parent not at all, however true it looks. That is why every row on the minimum wage page shows Conf 0.00: their pages are empty. The weights are structural, `grounding 0.30, two_sided 0.20, scrutiny 0.20, breadth 0.15, depth 0.05, sourcing 0.05, testability 0.05`, and the behavioural signals (votes, visitors, dwell time and the rest) carry weight 0 because a two-table corpus has no users to measure (code: [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py); [[Confidence Stability Scores]]).
- **Uniqueness** (0 to 1) stops one point being counted three times in three wordings. It reads 1 until someone argues the overlap on a uniqueness page ([[The Redundancy Problem]], [[Equivalency Score:]]).

Every multiplier with no page of its own reads a labelled constant, printed on the page when it is used (code: `CONSTS` in `score_reference.py`; [method](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants)):

| Constant | Value | Meaning |
|---|---|---|
| `K` | 1 | weight of a page's starting vote |
| `UNARG` | 0.5 | truth of a claim with no page |
| `DEFLINK` | 1 | linkage with no linkage page: presumed relevant |
| `DEFIMP` | 0.5 | importance with no importance page: the neutral start (the app starts at 1.0) |
| `DEFUNIQ` | 1 | uniqueness with no uniqueness page: presumed distinct |

A page's truth is then the share of argued weight on the agree side, starting from its prior, and capped by the weakest load-bearing component that has a page of its own (code: `evaluate` in `score_reference.py`):

```
truth (argued)   = (POS + w x p0) / (POS + NEG + w)
truth (published) = min(argued, weakest load-bearing component with its own page)
```

**One worked example, three engines** (a calculation from the code). A belief has exactly one reason, filed to agree, with Linkage 0.9, Importance 0.5, Uniqueness 1, and Confidence 1 where the rule uses it. Nothing is filed against.

| The one reason is argued to | Owner's formula (Evidence Quality = truth) | Site, argued | Site, count every reason | App belief page |
|---|---|---|---|---|
| **Truth 0.80** | row 0.8 × 0.9 × 0.5 = **0.36** | row (2 × 0.8 − 1) × 0.9 × 0.5 = **0.27**; page (0.27 + 0.5) / (0.27 + 1) = **0.61** | row 0.8 × 0.9 × 0.5 = **0.36**; page (0.36 + 0.5) / (0.36 + 1) = **0.63** | pro weight / (pro + con) = 0.36 / 0.36 = 1.0, clamped to **0.99** |
| **Truth 0.20** (argued false) | row **0.09** | row (0.4 − 1) × 0.45 = **−0.27**, which lands on the *against* side; page 0.5 / 1.27 = **0.39** | row **0.09**, still on the for side; page 0.59 / 1.09 = **0.54** | 0.09 / 0.09 = 1.0, clamped to **0.99** |

Read the bottom row twice. On the site's argued rule a reason shown to be false actively hurts the side that filed it, so the belief drops below even. On the count-every-reason rule it adds a sliver, because posting counts until arguing removes it. In the app, *any* unanswered pro reason, however weak, makes the belief 99% true, because the app scores a share of pro over pro-plus-con and starts from no prior (code: `calculateTruthScoreBreakdown` in [`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts), called from [`fetch-belief.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/data/fetch-belief.ts) with each argument's truth read as `|impactScore| / 100`, logical validity bounded to [0.01, 0.99]; the protocol demo's `baseTruthScore = proRank / totalRank` in `scoring-engine.ts` gives the same 0.99). That is the strongest argument there is for putting the con column on the same page: a pro column with nothing beside it is a landslide by default.

The two site rules disagree about whether volume counts, and the disagreement is open, not accidental (CLAUDE.md, open decision 1). The owner asked for it to be settled by comparing the two on real pages rather than in the abstract, so the site publishes a page listing the beliefs where the two rules part ways most. At the revision checked here it reported that the argued rule had moved 17 of 195 beliefs with a reason listed off an even split.

### 3. Truth scores update automatically

When new evidence appears, every connected belief updates. If a study gets retracted, arguments citing it lose strength immediately. See: [[Truth Scores|Truth Score]].

**No manual scoring.** No editorial boards deciding what counts. The [[Audit Lock|ReasonRank]] principle: if a score isn't traceable to linked evidence, it doesn't exist.

**Status: runs on both engines, with "immediately" meaning different things.**

- **On the site**, there is no server and no stored score. Every number is computed from the two tables on every build, and a build runs on every push to `master` that touches `tools/static-site/` (code: [`.github/workflows/pages.yml`](https://github.com/myklob/ideastockexchange/blob/master/.github/workflows/pages.yml)). "Immediately" is "on the next merge", usually minutes. Every connected belief does update, because the scorer walks the whole graph: change one finding and every page that rests on it, at any depth, is recomputed. A changes page lists what moved since the last revision and by how much, because "a one-word edit to a linkage page can move forty conclusions, and nothing in an ordinary diff will tell you that" (code: [`changes.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/changes.py)).
- **In the app**, a source marked `FALSIFIED` drops to zero and the collapse propagates (code: `VERIFICATION_SCORES` in [`src/core/reasonrank/types.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/reasonrank/types.ts): VERIFIED 1.0, DISPUTED 0.5, UNVERIFIED 0.5, FALSIFIED 0.0). The app also measures how much of a belief's score is riding on evidence nobody has checked yet, before any retraction fires: a "Standing" column and a readout in the Evidence Ledger (code: [`evidence-exposure.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/evidence-exposure.ts)). A row with no recorded status counts at full weight and so carries the largest exposure, deliberately.

**A retraction, worked on the site** (a calculation run through `score_reference.py`). A belief cites one randomized controlled trial as evidence for it: ESIW 0.85, 1 replication, 100% agreeing. The trial's page starts at 0.5 + 0.5 × 0.85 × 1 = 0.925 with weight 1.00. Then the trial is retracted, which on the site means recording that the replications now disagree (ERP 0), so its page starts at 0.075. With Linkage 1 and Importance 0.5:

| | Trial's truth | Row, argued rule (Confidence 1) | Belief, argued rule | Belief, count every reason |
|---|---|---|---|---|
| Before | 0.925 | +0.425 | **0.649** | **0.731** |
| After retraction | 0.075 | −0.425 (now on the against side) | **0.351** | **0.518** |

Under the argued rule a retracted study does not just stop helping: it turns round and testifies against the belief that leaned on it, by exactly as much as it once helped. Under the count-every-reason rule it keeps a sliver on the side it was filed on until someone argues it off. (With the confidence the site actually computes for a lone leaf, say 0.3, the argued figures shrink to 0.557 before and 0.443 after; the direction is the same.)

**No manual scoring, as it runs.** On the site, every number is either computed from the two tables or one of the five labelled constants above, and every computed number links to the page that argues it. The few typed inputs are labelled as typed where they appear: a belief's position on its topic's axis ("typed, not scored": nothing reads it), which components are load-bearing, the supporters' and opponents' value rankings, the magnitudes on costs and benefits (the owner's estimates), and an author's bottom line, which the page flags when every row scores 0 ("this sentence is the author's and is not a result of them"). In the app, the audit lock is a written rule ("Every score must trace to underlying arguments and evidence. No manual overrides," [`docs/DOCUMENT_HIERARCHY.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/DOCUMENT_HIERARCHY.md)) and is enforced on machine submissions: an agent payload carrying any score field is rejected ([`docs/AI_AGENT_INTEGRATION_SPEC.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/AI_AGENT_INTEGRATION_SPEC.md)).

---

## Why side-by-side matters: cognitive architecture

### The hardware problem

Human brains have confirmation bias. Reading arguments we agree with releases dopamine. Reading dissent triggers threat response. That's why we self-sort into echo chambers.

*(The neuroscience here is the owner's judgment and a popular summary of it; no code tests it. What the code can do is refuse to let either side be read alone.)*

**Current System:**

- Conservative arguments on RedState
- Progressive arguments on DailyKos
- Never the twain shall meet

**Our System:**

- Best conservative arguments in right column
- Best progressive arguments in left column
- Same page, same moment, impossible to ignore

As [Which column is "left"](#which-column-is-left) says, which tribe lands in which column depends on how the belief is worded, and on the published site the two columns are stacked rather than side by side. The principle survives both: there is no URL on the site that shows one side of a belief without the other. Every belief page carries both argument tables, and its opening invitation speaks directly to the reader who disagrees: "**If you disagree, this page has a column for you.**" followed by one specific gap they could fill, read off the page's own tables (code: `invitation` in `render_site.py`). The promise printed above it: "One belief, both sides, ranked by how well the arguments hold up rather than how often they are repeated. Permanent, and open to revision by anyone with a better argument."

### The virtue-vice problem

Values become vices without their counterweights:

| Virtue Alone | Missing Counterweight | Becomes |
|---|---|---|
| **Compassion** | Prudence | Enables dependency, prevents growth |
| **Justice** | Mercy | Rigid cruelty, authoritarianism |
| **Progress** | Tradition | Destroys wisdom, creates instability |
| **Tradition** | Innovation | Stagnation, inability to adapt |

Two-column layout forces synthesis instead of victory. You cannot dismiss the opposing value when it's staring at you with equal visual weight.

**Status.** The table is the owner's judgment, and no engine stores virtue-and-counterweight pairs. Where it lands in the code:

- **"Equal visual weight" is a rule.** Every section with supporters and opponents (values, interests, biases, motivations) must have the same structure, the same depth and the same rigor for both sides: "Asymmetric treatment is the single most common way debate systems fail at neutrality" (Rule 7, [`docs/BELIEF_PAGE_RULES.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/BELIEF_PAGE_RULES.md)). On the site every two-sided section is drawn by the same two functions, `two_sided` and `stacked`, so neither side can get a different table shape.
- **The values half runs on the site**, as "Shared values, different rankings": a table of values with a Supporters rank, an Opponents rank, the Gap between them, and why the rankings differ. Compassion and prudence, or justice and mercy, are exactly the kind of pair it holds: both sides value both, and disagree about the order. The ranks are typed by the author. The mean gap, divided by 3 and capped at 1, is the values signal in the site's "kind of dispute" classifier, which calls a belief a values conflict when that signal leads the factual and linkage signals by at least 0.1 (code: `stats` in `render_site.py`; [method](https://myklob.github.io/ideastockexchange/beliefs/method.html#dispute); the [hardest-to-resolve list](https://myklob.github.io/ideastockexchange/beliefs/lists.html#hardest)).
- **Synthesis instead of victory runs on the site** as three tables under the interests section: Shared interests (with a direction both could take), Best compromise (with what it rests on and why it is difficult), and Obstacles to resolution for each side. They produce one computed number, ease of resolution: `max(compromise truth) x (1 - mean obstacle truth)`, with obstacles reading 0.5 when none are listed (code: `stats` in `render_site.py`). See [[Automated Conflict Resolution Platform]].

---

## Beyond binary: interest mapping

Most debates argue about **positions** (what we want) rather than **interests** (why we want it). Two columns enable deeper analysis. See: [[Interests|Likely Interests of Those Who Agree and Disagree]].

**Example: Surveillance Debate**

**Standard Frame:**

- Pro: "We need surveillance for security!"
- Con: "We need privacy for freedom!"

**ISE Frame:**

| Shared Interests | Conflicting Interests |
|---|---|
| • Safety from threats | • Who controls data |
| • Constitutional rights | • Scope of monitoring |
| • Effective law enforcement | • Transparency vs. secrecy |

Once interests are mapped on the same page, we stop arguing which value "wins" and start engineering solutions that honor both. See: [[Compromise Solutions|Automated Conflict Resolution Platform]].

**Status: runs on both engines.**

- **In the app**, the owner's two-column table exists almost word for word: the Interests section draws a table headed **Shared Interests** and **Conflicting Interests** (code: `SharedVsConflictingTable` in [`InterestsSection.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/InterestsSection.tsx)).
- **On the site**, the section is called "Interests, Not Positions". Each interest is written as a need with a subject ("who needs what") and is argued two ways that never borrow from each other (code: `render_belief` in `render_site.py`):
  - **Validity**: should the need be honored? Settled on the interest's own page by the mirror test: would this side accept the same need honored for its opponents, and what happens if everyone pursues it? Who holds the need, how many of them there are and how much power they have never count.
  - **Drives**: is this need really why this side holds its position? Settled by what the side does.
  - Each interest scores `Validity x Drives`, and the page names the **primary conflict pair**: the highest-scoring interest on each side, set against each other, with the share of the paired weight on the supporting side. The product uses validity on purpose, so a cover story cannot lead a side and neither can a worthy need nobody is moved by.

The surveillance debate has a page on the site in its sharpest current form: [Law enforcement should be able to read encrypted messages when it has a warrant](https://myklob.github.io/ideastockexchange/beliefs/p/law-enforcement-able-read.html), under [Privacy and Data](https://myklob.github.io/ideastockexchange/beliefs/t/privacy-and-data.html). Its reasons already map onto the owner's table. "A warrant already lets police search a home or open a safe" is effective law enforcement. "There is no way to build a way into encrypted messages that only the police can use" is who controls data. "Letting police read an encrypted message only after a judge finds there is cause keeps the decision to look with a court" is transparency against secrecy, with a proposed answer attached. Its interests section is still empty (the page is a draft that says so), which makes it an open slot for exactly the mapping the owner describes. The [who-has-a-stake list](https://myklob.github.io/ideastockexchange/beliefs/lists.html#stake) gathers every interest on the site by the group that holds it.

---

## Integration with the ISE framework

This two-column approach isn't isolated. It's the front door to systematic reasoning:

**Step 1:** [[One Page Per Topic|One Page per Debate Topic]] establishes the belief
**Step 2:** Two columns organize [Reasons](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula) for and against
**Step 3:** [[Evidence|Evidence Verification Score (EVS)]] scores determine argument strength
**Step 4:** [[Linkage Scores]] measure logical connection
**Step 5:** [[Truth Scores|Truth Score]] integrate validity + evidence + linkage
**Step 6:** [[Cost-Benefit Analysis|Likelihood of Costs and Benefits]] evaluates real-world outcomes
**Step 7:** [[Stakeholder Analysis|Likely Interests of Those Who Agree and Disagree]] maps who benefits and who pays
**Step 8:** [[Assumptions]] reveals unstated premises

Every element feeds back into the two-column display, making the best arguments visible at a glance.

**Where each step runs.**

| Step | On the site | In the app |
|---|---|---|
| 1. One page per belief | Runs: one page per row of `pages.csv`, filed under a topic page (`t/<topic>.html`) | Runs: `/beliefs/[slug]` |
| 2. Two columns of reasons | Runs, stacked (see above) | Runs, side by side |
| 3. Evidence | Runs as a prior on the finding's own page; findings also listed in a two-sided Evidence Ledger | Runs as EVS × linkage × 10 |
| 4. Linkage | Runs: a linkage page per edge, default 1 | Runs: (A − D) / (A + D), default 0 |
| 5. Truth | Runs: `(POS + w x p0) / (POS + NEG + w)`, capped by the weakest load-bearing component | Runs: `(logical validity + verification) / 2`, each a pro share bounded to [0.01, 0.99] |
| 6. Cost-benefit | Runs: benefits and costs, each a claim, with net expected value and a low-high band where rows state one ([method](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba)) | Runs: `cba-scoring.ts`, a different rule (three factors, depth attenuation `0.5^(d-1)`) |
| 7. Stakeholders | Runs: interests of each side, Validity × Drives, primary conflict pair | Runs: interests section with shared and conflicting interests |
| 8. Assumptions | Runs: Logical Anatomy (load-bearing components cap the truth score) plus assumptions required to accept and to reject | Runs: `AssumptionsSection` |

"Every element feeds back into the two-column display" is literal on the site in one way the owner may not have expected: the argument table is not the end of the page but the top of a stack. A reason's linkage, importance and uniqueness are themselves pages with two columns of their own, so the two-column display recurses all the way down. See [[Argument Scores from Sub-Argument Scores]] and [[Belief Web Navigation]].

---

## What this enables

### 1. Nuance becomes accessible

See the full landscape in five minutes instead of five hours of Google searches that lead to tribal echo chambers.

*(The five minutes is the owner's judgment.)* What the site does to earn it: every table shows its five strongest rows first and folds the rest, and every belief page ends with a derivation that multiplies the numbers out, so a reader can stop after the top rows or check every factor.

### 2. Deception becomes difficult

Weak arguments can't hide when placed next to strong evidence. Cherry-picked data gets exposed by the evidence tier system.

**Status: runs, with the work done by more than the tiers.** A cherry-picked finding is one whose replications mostly disagree with it, and on the site the ERP term drags its starting point toward 0.50 or below, whatever its tier (a calculation: an RCT with 3 replications, 33% agreeing, starts at 0.5 + 0.5 × 0.85 × (0.66 − 1) ≈ 0.36). The site also runs structural checks that catch deception the graph's shape reveals: a claim used to support itself, a conclusion listed among its own premises, a page padded with the same row twice (code: [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py)). Circular support is refused outright: the scorer will not publish a number for a loop, because a loop can hold any value at all and stay consistent.

### 3. Tribalism becomes obsolete

Ideas judged on merit, not source. A strong conservative argument appears high in the right column *even if* you're progressive. You must engage with it.

**Status: runs.** Rank on both engines comes only from the row's score. Who filed a reason is recorded (`added_by` on every row a form adds) and shown under it, and never enters a number.

### 4. Expertise becomes transparent

No more "trust the experts" vs "do your own research." The evidence trail is public. Anyone can verify. See: [Evidence Leaderboard](https://myklob.github.io/ideastockexchange/beliefs/lists.html#works).

**Status: runs on the site.** Every finding names its source type, its replications and their agreement, and prints the arithmetic of its starting point beside it ("tier weight 0.85; starting point 0.5 + 0.5 x 0.85 x (2 x 100/100 - 1) = 0.93; weight 1 x 2 x 1 / (1 + 1) = 1.00"; code: `label` and `working` in `evidence.py`). The whole corpus is downloadable as JSON, XML, SQL and SQLite ([method, data](https://myklob.github.io/ideastockexchange/beliefs/method.html#data)). The evidence leaderboard is the site's list of the best books, studies and reports, where a work counts as one of the best on its question until somebody shows otherwise and is never removed.

### 5. Progress becomes measurable

When new evidence appears, beliefs update automatically. We can track which predictions proved accurate. See: [[Predictions & Reality Check|Template: Media Analysis]] in book analysis templates.

**Status: runs on the site.** Each belief states what should be observed if it is true and if it is false, each with a deadline and a way of checking. [`predictions.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/predictions.py) reads the deadlines, sorts every prediction into overdue, coming due, resolved and later, and gives each a form to record what happened. An outcome is a finding filed on the prediction's own page, so "came true" means its truth has risen above 0.50 and "did not" means it has fallen below; nothing is typed in as a verdict. "Today" is the date of the revision the site was built from, so a build can be reproduced exactly. The book version is the "Predictions the Work Made" table in [[Template: Media Analysis]].

---

## The meta-principle: process over positions

Most organizations compete on *what* they believe. The Idea Stock Exchange competes on *how* we believe: the methodology itself.

We're not saying "Here's the right answer on minimum wage." We're saying "Here's how to evaluate competing claims about minimum wage systematically."

That's why two columns matter. They enforce intellectual honesty. You cannot claim to understand an issue until you can state the opposing view strongly enough that its advocates would agree with your characterization.

See: Colorado Forward Party for how this becomes a political platform based on transparent reasoning rather than tribal positioning. *(No page on the wiki or the site covers this yet, so the name stays as plain text.)*

**Status: the site takes "we're not saying here's the right answer" literally.** There is no verdict module any more: a page prints its numbers and does not tell the reader what to conclude from them (CLAUDE.md, "The static site's modules"). The minimum wage page above is the proof: six reasons, a 0.50, and a note that the author's one-line bottom line is not a result of the tables. The steelman test (state the other side so its advocates would sign it) has two pieces of machinery behind it: the mirror test on every interest's validity, and the rule that a submission matching an existing claim becomes a vote for that claim rather than a second, weaker wording of it.

---

## Mechanisms on the page the owner's text never mentions

These run on a belief page today and bear directly on putting both sides together.

### Votes: shown beside the score, never inside it

Every belief and every reason carries Agree and Disagree vote links, and every reason also carries "Bears on this: yes / no". The counts show on the heading line after the score badge. The page says, on every belief: "Votes are shown as what people think, next to what the analysis says, and never move a score." (code: `VOTE_NOTE` in `render_site.py`; votes recorded in `content/votes.csv` by [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py), one per account per claim, latest wins). The gap between the two is tracked: once three or more people have voted on a claim, it enters the [votes-versus-analysis list](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes), widest gap first, because "a claim the analysis rates low that many people agree with, or the other way round, is where a reason is missing from the page." This is the owner's direction on votes as built: attention, never validity, with popular tracked apart from what holds up.

### What would change the answer

Right under the argument tables, every belief page holds each claim beneath it at false and then at true, one at a time, recomputes the whole graph, and ranks the inputs by how far they move the page. It labels each one ("breaks it alone", "carries it alone", "worth settling", "inert" below a 0.005 move), and reports what each would be worth once the work behind it is done (code: [`sensitivity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py), `INERT = 0.005`, `DEPTH = 6`; [method](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity)). Two columns tell you what each side says. This tells you which single reason, settled, would decide it. On the minimum wage page, all six reasons are "worth settling": each moves the page 0.00 now and 0.17 once its own page has work behind it.

### Relied on

How much of the rest of the site depends on this page, by a PageRank-style walk over the graph with damping 0.85, run until the residual falls below 1e-12 (code: [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py); [method](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank)). It is not a truth score: the walk ignores truth and confidence on purpose. It answers "if this page were wrong, how much else would wobble?"

### Wording overlap

Under the argument tables the page flags pairs of reasons whose wording overlaps, by IDF-weighted word overlap and character 4-gram similarity (code: [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py), `FLAG = 0.45`, `MERGE = 0.70`; [method](https://myklob.github.io/ideastockexchange/beliefs/method.html#equivalency)). It changes no score: the weight on the computed similarity is 0 until somebody argues that a lexical proxy tracks meaning well enough to act on. It is a reading queue for the uniqueness pages that do move scores.

### Every belief published, ranked rather than gated

A belief that has reasons both ways, evidence, objective criteria, predictions or a falsifiability test, costs and benefits, and interests is complete and comes first in every ranking. Every other belief is published as a draft, marked as one, saying what it still needs (code: `CORE_BAR` in `publish.py`). No drafted argument is ever deleted. This is why a one-sided page can exist at all, and why it says it is one-sided: the confidence factor's `two_sided` component is 1.0 with both sides argued, 0.35 with one, and 0 with neither.

### In the app: ranking edges by what is still at stake

The app ranks a belief's argument edges by how much of the conclusion's score is still at stake on each, so the next contribution goes where it would move the answer most (code: [`decision-leverage.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts), shown right after the argument trees). The site's equivalent is the sensitivity table above.

---

## Join the build

We're creating infrastructure for collective intelligence that scales before artificial intelligence makes the project moot.

**Contribute:**

- Challenge existing argument scores
- Submit evidence for claims
- Propose new belief pages
- Code the algorithm improvements

**How each one works on the site today.** There is no server, so taking part goes through GitHub. Every table on a belief page has a form under it, and each belief page, topic page and the home page has a propose-a-belief form. A form is a plain link to a prefilled GitHub issue (a free account is needed; a Copy as text button covers readers without one). As you type, the page checks your claim against every claim already in the tables, drafts included, and a near-duplicate becomes your vote for the claim already there instead of a second page (code: [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js)). When the issue is filed, [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) checks again with the full measure: at or above 0.70 similarity the submission *is* the existing claim and counts as a vote for it; between 0.45 and 0.70 the rows are added and the maintainer is shown the near matches; below that, a pull request adds the rows.

| The owner's ask | What you actually do |
|---|---|
| Challenge existing argument scores | Add a reason to disagree on the reason's own page, or on its linkage page ("True but irrelevant", "Missing step"). A score moves only when an argument moves it. |
| Submit evidence for claims | Use the Evidence Ledger form, naming the source type, replications and how many agreed, so the finding gets a starting point. |
| Propose new belief pages | Use the propose-a-belief form, with at least one reason each way if you can. |
| Code the algorithm improvements | Change the engine in `tools/static-site/`, run its test suite, and if the change moves a published number, regenerate the cross-implementation contract with `python3 conformance.py --write` and explain the diff. |

Contact Me *(the owner's contact page has no counterpart on the wiki or the site; the GitHub forms above are the way in)* | [[Book Analysis Examples|Media]] | [[Complete ISE Framework|Home]]

---

## Open questions for the owner

These are places where the owner's page, the owner's later direction and the code part ways. Each needs a call, not a fix.

1. **Should the published site show the two argument tables literally side by side?** Today it never does: a side needs 720 pixels and the content column holds 1,140, so agree always sits above disagree. The template and the app draw one 14-column table with both sides in the same row. Options: narrow the argument table on belief pages (fewer columns per side, with the rest in the derivation) so each side fits in 562 pixels; widen belief pages; or keep the stack and say on the page that "two columns" means two tables in one section.
2. **Should a vote ever decide validity in the app?** A fallacy claim confirmed by 60% weighted agreement with 3 or more votes publishes a counter-argument at strength 0.8 or 0.5 (`consensus.ts`, `claims.ts`). The owner's direction says votes decide attention, never validity, and the site has no vote path into any number. Options: replace the vote gate with the accusation's own argued truth score, as the site does; or keep it and name it as the app's one exception.
3. **Which tier order is right: the owner's or the EVS page's?** The owner and the app put journalism and surveys above opinion and anecdote; the site, following the EVS page, weighs anecdote at 0.55 and news at 0.30. A page arguing the tier order would settle it the way the site settles everything else.
4. **Which strength rule leads the page?** The argued rule (an unargued reason counts 0) and the count-every-reason rule (it counts until argued down) are both printed on every belief page. The owner asked for them to be compared on real pages before either leads (CLAUDE.md, open decision 1). The app's pro-share rule, which reads any one-sided page as 0.99, is a third answer to the same question.

---

## Related pages

**Related Pages (from the owner's page):**
[Reasons](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula) • [[Evidence Scoring|Evidence Verification Score (EVS)]] • [[Linkage Scores]] • [[Truth Evaluation|Truth Score]] • [[One Page Per Topic|One Page per Debate Topic]] • [[ReasonRank Algorithm|ReasonRank]]

**For depth:**

- [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]]: how a page's truth is computed.
- [[ReasonRank: Google's PageRank for Arguments]]: the dependence walk and the scoring recursion.
- [[Evidence to Conclusion Relevance Score]]: linkage, formula by formula.
- [[Confidence Stability Scores]]: the confidence factor on every row.
- [[The Redundancy Problem]] and [[Equivalency Score:]]: why one point made three ways counts once.
- [[Likely Interests of Those Who Agree and Disagree]] and [[Likelihood of Costs and Benefits]]: the two halves of a choice of action.
- [[Automated Conflict Resolution Platform]]: shared interests, compromises and obstacles.
- [[Media]]: pro and con media per belief, and [[Template: Why Pro and Con Media per Belief]].

**Templates:** [[Template: Belief Analysis]] (the two-sided page itself) • [[Template: Topic]] • [[Template: Linkage Evaluation]] • [[Template: Interest Validity Debate]] • [[Template: Media Analysis]] • [[Templates]]

**On the live site:** [Home](https://myklob.github.io/ideastockexchange/beliefs/index.html) • [Topics](https://myklob.github.io/ideastockexchange/beliefs/topics.html) • [Lists and how each is ranked](https://myklob.github.io/ideastockexchange/beliefs/lists.html) • [How the numbers are worked out](https://myklob.github.io/ideastockexchange/beliefs/method.html)
