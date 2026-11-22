# Electronic Democracy

We aim to establish a political party that uses **open, transparent online platforms** (inspired by Wikipedia) to:

1. Organize and present **pro/con reasons** for each government policy.
2. Rank reasons by **evidence strength and performance**.
3. Score conclusions based on the **performance of supporting reasons**.
4. Include multiple cost/benefit dimensions:
   - Financial
   - Time
   - Freedom
   - Security
   - Autonomy
   - Risk
   - Health
5. Promote candidates who pledge to **use public forums** for transparent policy evaluation.

That was the platform as the wiki stated it in August 2025, and the ambition has not shrunk. Democracy as practised is a shouting match scored by volume: whoever repeats a slogan most often, to the most people, with the most money behind it, wins. Wikipedia showed that strangers on the internet can build something better than any of them would alone, if the structure rewards getting it right instead of getting it loud. The Idea Stock Exchange is that structure pointed at policy. Every reason for and against a law gets its own page, every page gets a score, and the scores are computed in the open from what has actually been argued and cited.

This page keeps every promise the 2025 version made and says, next to each one, what the code does with it today: the real formula, the constants and defaults, the file it lives in, and whether the promise is built, partly built, proposed, replaced by something else, or refused on purpose. Nothing proposed has been deleted for being unbuilt. It is labelled proposed.

**Two engines.** The repository runs two scoring implementations, and they disagree about some things that matter here. The **published site** is [`tools/static-site/`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md), which builds [myklob.github.io/ideastockexchange/beliefs/](https://myklob.github.io/ideastockexchange/beliefs/index.html) from two flat tables, `pages` and `edges`. The **Next.js app** scores with [`src/core/scoring/`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts). When this page says "the site", it means the first; "the app" means the second. Where they differ, both are given.

**What has no code at all.** The political program itself (a party, candidates, pledges, elections, representatives, facilitators, voting reform) is proposed and has no code behind it. Nobody should go looking for a `Party` table. What the code has instead is the machinery the party would run on: pro and con pages, scores, a cost-benefit section, and a way for anyone to add to them through GitHub. The one democratic mechanism that exists, the vote, is deliberately barred from moving any score on the site (see [Pragmatic Democracy](#pragmatic-democracy)).

## The five aims, then and now

| 2025 aim | Status | What exists today |
|---|---|---|
| 1. Organize pro/con reasons for each policy | **Built** | Every belief page opens with Argument Trees: Reasons to Agree and Reasons to Disagree, each reason a claim with its own page. The corpus holds 196 belief pages and 3,385 claim pages ([`content/pages.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/pages.csv)). |
| 2. Rank reasons by evidence strength and performance | **Built** | Every table is ranked by score, top rows shown and the rest collapsed (Rule 8 in [`docs/BELIEF_PAGE_RULES.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/BELIEF_PAGE_RULES.md); the app's version is [`ranking.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/lib/ranking.ts)). |
| 3. Score conclusions from their supporting reasons | **Built, two ways** | The site: signed five-factor rows with an evidence prior ([`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)). The app: `ProRank / (ProRank + ConRank)` ([`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)). The two disagree about whether volume counts; see [How It Works](#how-it-works). |
| 4. Seven cost/benefit dimensions | **Partly built** | A priced cost-benefit section exists on every belief page, but no file carries the seven-item list. Security, Autonomy and Risk are a category nowhere. See [Cost and benefit dimensions](#cost-and-benefit-dimensions). |
| 5. Promote candidates who pledge to use public forums | **Proposed, no code** | No candidate, pledge or party is modelled. The nearest things are the [[Template: Candidate Evaluation]] (a belief page specialised to "[Candidate] is the most qualified candidate for [office]") and a static explainer at `/candidate-evaluation` in the app ([`page.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/app/candidate-evaluation/page.tsx)) that uses hard-coded example data. |

---

## How It Works

Each policy proposal will have two main columns:
- **Reasons to Agree**
- **Reasons to Disagree**

That survives exactly. On the site the two columns sit under the section heading **Argument Trees**, and the rules doc adds one requirement the 2025 page did not have: each cell is a complete, atomic proposition that could headline a page of its own ("Postal infrastructure already reaches every zip code"), never a two-word topic fragment ("long-term cost"). The reason is mechanical, not stylistic. Every reason is a belief with its own page, and a fragment cannot carry a truth score because there is nothing in it to be true or false. Putting both columns on one page is its own argument: see [[Pros and Cons on the Same Page]] and [[One Page per Debate Topic]].

### The rule the site runs

Every row on a belief page contributes this much to the page above it (code: `_contrib` in [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)):

```
contribution = sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq
```

- **sign** is +1 for a reason to agree and -1 for a reason to disagree.
- **Truth** is the reason's own page's truth score, put on a -1 to +1 scale by `(2 x Truth - 1)`. A reason argued false counts *against* the side it was filed on, so ten refuted reasons to agree weaken a belief instead of padding it.
- **Confidence** is how much work stands behind that page ([`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py); see [[Confidence Stability Scores]]). A row whose claim has no page of its own gets confidence 0.0 and contributes nothing.
- **Link, Imp, Uniq** are the truth scores of the row's linkage, importance and uniqueness pages, when those pages exist.

When a multiplier has no page, it reads a labelled constant. The five constants are in one line of `score_reference.py`:

| Constant | Value | Meaning |
|---|---|---|
| `K` | 1 | Weight of the starting vote every page gets before its own rows count |
| `UNARG` | 0.5 | Truth of a claim with no page |
| `DEFLINK` | 1 | Linkage when nobody has argued it: presumed relevant |
| `DEFIMP` | 0.5 | Importance when nobody has argued it |
| `DEFUNIQ` | 1 | Uniqueness when nobody has argued it: presumed distinct |

Positive contributions add up to POS and negative ones to NEG (as magnitudes; a row lands on the side its sign puts it on, so a refuted objection counts as support). Then:

```
page truth (argued) = (POS + w x p0) / (POS + NEG + w)
page truth          = min(argued, weakest load-bearing component that has its own page)
belief score        = POS - NEG   (open-ended)
```

`p0` and `w` are where the page starts and how heavily, set by the evidence it declares (next section). The cap means a conclusion can never be more settled than a premise it needs: if "We should go to war" rests on a load-bearing claim that reads 0.55, the conclusion reads 0.55 at most, however good everything else looks.

**The consequence nobody expected.** A claim nobody has argued sits at 0.5, and `(2 x 0.5 - 1)` is 0, so listing it is worth exactly nothing. That is the defence against padding, and it is deliberate. But follow it down: a page with no rows reads 0.50, so its parent reads 0.50, and by induction every page in an argument graph where nothing is cited reads 0.50 forever. Argument about argument never touches the world. A test pins this ([`test_engines.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py), `test_argument_alone_can_never_leave_the_neutral_point`), and if it ever fails, something has been added that lets a score move without evidence. The way out is evidence, which sets `p0`.

### The rule printed beside it: counting every reason

The owner's October 2026 direction is that, for belief strength, the starting point is the quantity of truly independent reasons to agree and disagree, ranked by how valid they are against each other, with contributions counting from the moment they are posted and argued down from there. A rule under which work counts for nothing until somebody proves it tells contributors their effort is wasted.

So every belief page now prints a second number beside the truth score, under the label "Counting every reason until it is argued down" (code: [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py); method: [method.html#tally](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)):

```
a reason or a prediction weighs   Truth x Linkage x Importance x Uniqueness
a finding weighs                  the same, x (1 + ESIW x ERQ x ERP/100)    (uncapped)
independent reasons on a side     the sum of Uniqueness over its reasons
share for                         (weight for + w x p0) / (weight for + weight against + w)
```

It keeps every factor from the argued rule, so a reason argued false (Truth near 0) still weighs nearly nothing, and a duplicate argued redundant (Uniqueness near 0) adds nearly nothing. It drops the two things that hold the argued score at 0.50: the `(2 x Truth - 1)` that zeroes an unargued reason, and the confidence gate. No other number reads it yet. The owner's instruction is to publish a rule beside the current one and compare them on real pages before either leads, so the argued rule and its pinned test are unchanged.

### The rule the app runs

The app does not share the zero-for-unargued rule (code: `scoreArgument` and the belief scorer in [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)):

```
baseTruth  = truthScore x (1 - sum of |fallacy impact| / 100)
ReasonRank = baseTruth                                         (a reason with no sub-arguments)
ReasonRank = 0.15 x baseTruth + 0.85 x subArgScore              (DAMPING_FACTOR = 0.85)
rawImpact  = ReasonRank x linkage x importance x uniqueness     (importance and uniqueness default to 1.0)
belief truth = clamp(0.01, 0.99, ProRank / (ProRank + ConRank) + evidenceContribution)
evidenceContribution = (net evidence weight / number of evidence items) x 0.2
```

Listing an unargued reason there raises the score, because its stored truth flows straight into ProRank. The two engines disagree about whether volume counts. CLAUDE.md records that as open decision 1, unresolved rather than accidental, to be settled by comparing the rules on real pages.

### What reasons can include

The 2025 page said reasons can include:
- **Costs & Benefits** (e.g., money, lives, man-hours, freedom, health).
- **Logical Arguments** (if-then logic, causality, strengthening arguments).
- **Scientific Studies** (ranked by rigor: sample size, randomization, blinding, controls, study setting).
- **Media References** (books, videos, speeches, poems, etc.).

| Kind | Status | What happens to it today |
|---|---|---|
| Costs & Benefits | **Replaced** | Not reason rows, and they do not enter the truth score. They are a separate priced section, "What Acting On This Would Cost and Gain", where each cost or benefit is a claim with its own page and Likelihood is that page's truth. See [Cost and benefit dimensions](#cost-and-benefit-dimensions). "Man-hours" is `person-hours` in the app's types ([`cba.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/types/cba.ts)) and `hours` in the Prisma schema. |
| Logical Arguments | **Partly built** | A belief may type a `form` (its logical form), which is displayed under Logical Anatomy and not scored; 4 pages carry one. A claim can be split into components (125 component rows), each with a load-bearing flag, and the truth is capped at the weakest load-bearing component. [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) finds structural faults (a claim used to support itself, a conclusion among its own premises, a page counted twice) that change no score. Nothing types a reason as if-then, causal or strengthening, and nothing scores a causal chain. See [[Assumptions]]. |
| Scientific Studies | **Replaced** | Rigor is not scored by sample size, randomization, blinding, controls or setting; none of those is a field anywhere. A finding's page declares a source type, a replication count and an agreement share instead, and those set where its truth starts. See [Scientific studies: the evidence prior](#scientific-studies-the-evidence-prior). The five rigor factors stay here as a **proposed** refinement no field carries. |
| Media References | **Built, but shown, not counted** | 177 media pages and 187 media rows. A work is not a reason on the site: "These rows are shown, not counted: the belief score above is arguments, evidence and predictions only, because a book is a container for reasons rather than a reason" ([`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)). The site's media types are Book, Study, Article, Report, Film, Podcast, Video ([`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)); speeches and poems are not on the list. See [Using Media as Evidence](#using-media-as-evidence). |

### Scientific studies: the evidence prior

A finding's page names one of eighteen source types, an ESIW weight saying how far that kind of source can move a claim (code: [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py); method: [method.html#evs](https://myklob.github.io/ideastockexchange/beliefs/method.html#evs); depth: [[Evidence Verification Score (EVS)]]):

| Key | ESIW | Covers |
|---|---|---|
| `statistics` | 0.90 | Statistics and data, with the source cited |
| `record` | 0.90 | Primary official record: statute, judicial holding, agency rule, sworn filing (an addition to the wiki's sixteen) |
| `rct` | 0.85 | Randomized controlled trial |
| `meta` | 0.80 | Meta-analysis |
| `observational` | 0.75 | Observational or correlational study |
| `historical` | 0.70 | Historical trend, with references |
| `expert_data` | 0.65 | Expert testimony with supporting data |
| `expert_claim` | 0.60 | Expert or social media claim |
| `anecdote` | 0.55 | Personal experience or anecdote |
| `logic` | 0.50 | Common sense or logic |
| `analogy` | 0.45 | Analogy or metaphor |
| `norm` | 0.40 | Cultural norm |
| `intuition` | 0.35 | Intuition or gut feeling |
| `news` | 0.30 | News or media report |
| `survey` | 0.25 | Survey or poll |
| `eyewitness` | 0.20 | Eyewitness testimony |
| `visual` | 0.15 | Visual evidence |
| `artifact` | 0.10 | Historical artifact |

It also declares ERQ (independent replications) and ERP (the share of them that agreed, in percent). Then:

```
p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)
w  = k x 2 x ERQ / (ERQ + 1)          (REP_CAP = 2.0: replication can at most double the starting weight)
```

Worked through: a randomized trial replicated three times, all agreeing, starts at `0.5 + 0.5 x 0.85 x 1 = 0.925` with weight `2 x 3/4 = 1.5`. The same trial with half the replications disagreeing starts at exactly 0.50, because a contested literature has established nothing. A page that names no source type starts at 0.50 with weight 1, exactly as before, so evidence opens a question without closing it.

Source quality is a property of the claim, never a multiplier on the row: the same finding cited on four pages has one truth, and how much it bears on a particular conclusion is a separate argument on its linkage page (see [[Evidence to Conclusion Relevance Score]]).

The tally rule above uses the uncapped form, `ESIW x ERQ x ERP/100`, because the owner prefers an evidence weight with no ceiling: two hundred agreeing statistical replications weigh `1 + 0.90 x 200 x 1 = 181` times a bare reason, which is the "15 or 200 times" the owner asked for. The argued rule keeps the bounded prior until the two are compared.

The app's CBA engine still grades evidence by four tiers, T1 10, T2 7, T3 5, T4 3, with confidence = tier max / 10 and 0.3 when no tier is given ([`cba.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/types/cba.ts), [`cba-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/cba-scoring.ts)). The rules doc calls T1 to T4 retired.

### Every argument gets three scores

The 2025 page promised that every argument gets:
- A **score** for its own merit.
- A **linkage score** when it's used as evidence for another argument.
- A **unique score** to track originality.

| Score | Status | Site | App |
|---|---|---|---|
| Own merit | **Built** | The truth score of the reason's own page, computed from its own rows by the same rule, all the way down. | The same per belief: every argument cell is a belief with its own page. |
| Linkage | **Built** | A page of kind `linkage` (x = the row, y = the page it sits under, type Argument, Evidence, Prediction, Interest or Media, direction Supports or Weakens), argued like any other page; its truth multiplies the row. With no page, `DEFLINK = 1`, "presumed relevant". 32 rows in the corpus name a linkage page. | A sub-debate at `/arguments/[id]/linkage`. Priority chain in `resolveLinkageScore`: a linkage debate first, then aggregated community votes (a weighted average clamped to [-1, 1]), then a static value. |
| Uniqueness | **Built, rarely used** | A uniqueness page asks whether reason X makes a different point from Z; its truth is the share of X's score that survives on the parent page. With no page, `DEFUNIQ = 1`, "presumed distinct". 2 rows have one. [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) detects near-duplicate wording for the structural checks and the issue intake, and moves no score. | `uniquenessScore`, default 1.0, multiplied into every rawImpact. The CBA engine reads no uniqueness at all. |

The owner's direction on linkage is to start trusting and lower the link as people show a reason is unrelated or invalid, and to let a well-argued link rise. The site's `DEFLINK = 1` is that starting trust; a linkage page's truth can fall below it when argued down. Depth: [[Linkage Scores]], [[The Redundancy Problem]], [[Template: Linkage Evaluation]].

### Example: genocide and war

The 2025 example, kept as written: the belief *"Nazis committed genocide during WWII"* has its own score. If used to support *"We should go to war with Germany"*, and combined with *"We should violently oppose genocide"*, the linkage score applies.

These three pages are not in the corpus; this is an illustration. Here it is run through both rules, with illustrative numbers.

Say the genocide claim's page reads T = 0.95 with confidence 1, its linkage page ("If the Nazis committed genocide, that is a reason to go to war with Germany") reads L = 0.6, and nobody has argued importance or uniqueness, so Imp = 0.5 and Uniq = 1.

| Case | Argued rule (site) | Counting rule (tally) | App |
|---|---|---|---|
| As above | `(2 x 0.95 - 1) x 1 x 0.6 x 0.5 x 1 = 0.27`, so with no other rows the war belief reads `(0.27 + 0.5)/(0.27 + 1) = 0.61` | weight `0.95 x 0.6 x 0.5 x 1 = 0.285`, share `(0.285 + 0.5)/(1.285) = 0.61` | rawImpact `0.95 x 0.6 x 1.0 x 1.0 = 0.57`; one unopposed reason gives ProRank/(ProRank + ConRank) = 1, clamped to 0.99 |
| Linkage never argued | L = DEFLINK = 1, contribution 0.45, belief `(0.45 + 0.5)/(1.45) = 0.66` | weight 0.475, share 0.66 | linkage = its static value |
| Genocide claim never argued (T = 0.5) | contribution exactly 0, belief stays 0.50 | weight `0.5 x 0.6 x 0.5 = 0.15`, share 0.57 | rawImpact still positive, belief still 0.99 |

The last row is the volume disagreement in one line. And the second premise, "We should violently oppose genocide", has two homes on the site: as a reason on the linkage page (it is why the genocide is a reason for war), or as a load-bearing component under Logical Anatomy, in which case the war belief can read no higher than that premise does.

---

## Cost and benefit dimensions

The 2025 page listed seven dimensions: **Financial, Time, Freedom, Security, Autonomy, Risk, Health**. That list is **proposed**. No file in the repository carries it, and the lists that do exist are different:

| Where | Categories | Status |
|---|---|---|
| The 2025 wiki | Financial, Time, Freedom, Security, Autonomy, Risk, Health | Proposed; no code |
| App CBA engine ([`cba.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/types/cba.ts)) | Financial `$ (USD)`, HumanLife `lives`, Freedom `Liberty Index %`, Time `person-hours` | Built; every per-category breakdown iterates these four |
| CBA skill doc ([`SKILL.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/automated-cba/SKILL.md)) | The same four, plus expansion categories Health (QALYs), Environmental, Social Cohesion, Innovation | The four built; expansions are prose |
| Prisma `CostBenefitItem` ([`schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma)) | `dollars`, `life-years`, `hours`, `freedom` | A schema comment |
| `/cba/about` ([`page.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/app/cba/about/page.tsx)) | Maslow levels: Physiological, Safety, Social Belonging, Esteem and Self-Actualization | An explainer checklist; it says Level 1 costs "receive maximum weight", and no scoring function reads a Maslow level |
| The site ([`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)) | None. `category` is "cost and benefit rows: the units", free text | Built; 218 rows use 213 different unit strings, from "dollars a year" to "percentage points of public trust in Congress" |

Security, Autonomy and Risk are a category nowhere. The skill doc comes closest in prose: "Human Life captures mortality and safety. Freedom captures autonomy, rights, and civil liberties." Risk survives only as a heading, "Costs and risks", on the site's cost table. The owner has not picked a controlled list (see [Open questions](#open-questions-for-the-owner)).

### What the site computes

Every belief page has a section headed **What Acting On This Would Cost and Gain**: "Not the cost of the belief being true, but of doing what it implies: who gains, who pays, in what units, and how likely." (code: the cost-benefit block in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py); method: [method.html#cba](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba); depth: [[Likelihood of Costs and Benefits]]).

- Each cost or benefit is a claim with its own page. **Likelihood** is that page's truth score.
- **Expected value** = magnitude x Likelihood.
- The **range** is the lowest and highest of whatever the row states (magnitude, `mag_low`, `mag_high`), each times Likelihood.
- The **worst case** takes every benefit at its low end and every cost at its high end.
- Each row names **who** gains or pays (an interest page) and its **units**.
- When more than one unit is priced, the net is withheld and the readout says "mixed units, no single net", listing each unit's net instead. Dollars do not add to lives, and pretending they do is how bad policy gets a respectable number.
- A **benefit-to-cost ratio** is printed only when the units are not mixed and costs are not zero.
- "A row that states one figure and no range is marked, because a single number is not an estimate a decision can be checked against."
- A **Short-term (0 to 2 years)** against **Long-term (5 years and beyond)** sub-table lists unpriced effects with their truth.

A worked illustration: a benefit typed as $10 million, low $6 million, high $14 million, on a page reading 0.7, has expected value $7 million and range $4.2 million to $9.8 million.

The corpus today: 218 cost and benefit rows, all 218 naming who gains or pays, 93 carrying a magnitude, and **0** carrying a range. Filling the ranges is the owner's estimate to make, and every belief page says so.

None of this enters the truth score. A cost is a claim about the world that gets priced, not a reason that scores. That matches the owner's direction: for choices of action, the question is costs and benefits across every stakeholder with a legitimate interest, the quantity and quality of interests met, under different assumptions about which interests are valid. It is a different question from whether a belief is true, answered in a different section.

### What the app computes

The app's CBA engine ([`cba-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/cba-scoring.ts)) gives each line item its own argument trees for competing probability estimates. `recalculateCBA` scores each estimate's tree, takes the typed probability of the estimate whose tree scores best as `activeLikelihood`, and computes EV = predictedImpact x activeLikelihood. It then applies impact-level de-duplication, totals benefits and costs, and breaks them down by the four categories. Unlike the site, it prints a **verdict**: `uncertain` when |net| is under 10 percent of total expected benefits, otherwise `net_positive` or `net_negative`. Its argument-level de-duplication, `applyArgumentDeduplication`, is exported and called by nothing (CLAUDE.md open decision 4).

---

## Using Media as Evidence

Arguments appear in many forms of media: books, films, songs, essays. Some media pieces cover a topic so fully that they should be evaluated as a whole.

We can:
1. List the most influential works for or against a conclusion.
2. Extract and score each argument within that work.
3. Average validity scores for the overall "pull" of the media.
4. Track **direction** (what conclusions it supports), **validity** (argument quality), and **influence** (sales, citations, cultural reach).

| Step | Status | Site | App |
|---|---|---|---|
| 1. List the most influential works for or against | **Built** | Every belief page has Supporting and Weakening media tables, ranked by `(2 x Quality - 1) x Bears x Influence x Importance`, signed like every row, so a work nobody has argued scores exactly 0. | `/media` ranks works by Epistemic Impact = Media Truth Score x reach. |
| 2. Extract and score each argument within the work | **Built** | A work's own page carries **Quality Arguments** (is it well made?) and **Influence Arguments** (did it change anything?), each scored `(agree + w x p0)/(agree + disagree + w)`. | Claims extracted from a work link to belief pages; each contributes its belief's signed truth weighted by centrality. |
| 3. Average validity for the overall pull | **Replaced** | Not a plain average. "Accuracy of what it backs" is the carried truths of the beliefs citing the work, from -1 to +1 and turned around where the work argues against, averaged with centrality as the weight. | `mediaTruthScore = sum(signed truth x linkage) / sum(linkage)`, clamped to [-1, 1]; with nothing scoreable it sits at a genre prior: peer_reviewed 0.90, institutional 0.80, investigative 0.70, news_report 0.60, editorial 0.40, opinion 0.30, social_media 0.15, unknown 0.50 ([`media-truth.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/media-truth.ts), [`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts)). |
| 4. Track direction, validity and influence | **Partly built** | Direction is each belief row's side and carried truth. Validity is the Quality score, argued on the work's page and kept apart from whether what it backs is true. Influence is *argued*, not measured: "a large audience that already agreed is not influence". Reach is a separate typed number, recorded for no work yet, so nothing is multiplied by it. | Reach is an integer (copies, box office, streams, citations) defaulting to 0 and multiplied into Epistemic Impact, which is the 2025 page's "sales, citations" reading. A work with no reach typed has impact 0. |

The two engines disagree about whether influence is argued or typed, and about whether a work's score flows into a belief (it does not, on either: on the site media rows are shown and not counted; in the app belief scores flow into a work's score, not the reverse). Depth: [[Media]], [[Template: Media Analysis]], [[Template: Why Pro and Con Media per Belief]].

---

## Policy Analysis Algorithm

Like the U.S. Founding Fathers, we believe **well-designed systems** solve difficult problems.
Our algorithm evaluates policies using:
- Cost-benefit analysis.
- Logical reasoning.
- Scientific evidence review.

This creates a **systematic framework** for identifying policies that maximize safety, happiness, and societal well-being.

**Status: all three inputs built; the final step refused on the site by design.** Every belief page carries all three: the cost-benefit section, Logical Anatomy and the Structural Checks, and an Evidence Ledger built on the evidence prior. What the site will not do is the last word of the sentence, "identifying". There is no verdict module any more: a page prints its numbers and does not tell the reader what to conclude from them. Even the net expected value is withheld when units are mixed. The app's CBA engine does print a verdict (`net_positive`, `net_negative`, or `uncertain` inside 10 percent).

No module scores safety, happiness or well-being as such. The nearest things are the interests framework (each interest scored Validity x Drives, below) and the Maslow checklist on `/cba/about`.

---

## Pragmatic Democracy

Optimal policies are identified by **communities of informed, rational participants** who:
- Research thoroughly.
- Evaluate evidence.
- Minimize costs and risks while maximizing benefits.

The process is collaborative, evidence-based, and **pragmatic**.

**Status: participation built; the community decides nothing numerically, by design.** Here is how a reader takes part today, with no server and no accounts on the site:

1. Every table on a belief page carries a form, and so do the home and topic pages (a propose-a-belief form). Each form is a plain GET to a prefilled GitHub issue (`.github/ISSUE_TEMPLATE/contribute.yml`, `belief.yml`, `vote.yml`).
2. As the reader types, [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) scores the claim against every claim already on the site, drafts included (`data/claims_index.json`), with the same measure as `similarity.py`: FLAG = 0.45, MERGE = 0.70. A near-duplicate becomes a vote for the claim already there instead of a second page.
3. When the issue lands, [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) re-checks with the Python engine. At or above MERGE it records the submitter's vote for the existing claim (and, if that claim is not yet a row on the page it was filed on, opens a pull request adding just that row). Between FLAG and MERGE it adds the rows and shows the maintainer the near matches. Otherwise it opens a pull request with the new rows.
4. A maintainer merges. Every row records who added it and when (`added_by`, `added`).

And the votes? "A vote never moves a score; the page shows it next to what the analysis says, as what people think." (`intake.py`). Votes live in `content/votes.csv`, one row per page, login and target, latest wins. There are two kinds: a vote on whether a claim is true, and a "Bears on this: yes / no" vote on whether a row bears on the page it sits on, which is a vote on the argument as an argument. Counts appear on the heading line after the score badge with the words "votes, not a score". Once anyone has voted, the home page gets a "Recently voted" card; once three people (`MIN_VOTERS = 3`) have voted on a claim, a "Votes vs the analysis" card ranks claims by how far the share of votes to agree sits from the truth score ([lists.html#votes](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes)). As of this writing the file holds two votes, both by the owner.

This is the owner's direction exactly: votes may decide what is promoted and given attention, never what is valid, and the gap between popular and well-argued is worth showing because it says where people need more time with the argument. The site's README puts the rule bluntly: "a claim nobody has argued is worth exactly nothing, however many people like it."

[`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py) lists the behavioural signals a live community would produce (up and down votes, weekly visitors, dwell time, edit frequency, duplicate submission attempts, evaluation responses, score variance over time) with weight 0, reported as "no data" rather than scored as 0. Wiring them up is the migration path if votes are ever to feed confidence; it would be a rule change with a conformance diff.

**The app differs in two places.** Aggregated linkage votes set a row's linkage when no linkage debate exists (priority 2 in `resolveLinkageScore`, a weighted average clamped to [-1, 1]). And a fallacy claim that reaches 60 percent weighted agreement with at least three votes (`CONSENSUS_THRESHOLD = 0.6`, `CONSENSUS_QUORUM = 3` in [`consensus.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/consensus.ts)) publishes a counter-argument into the linkage debate. In both, a vote moves a number, which the owner's direction does not allow.

---

## Balancing Conflicting Principles

Political debates often involve **competing values** (justice vs. mercy, liberty vs. security).
Our party's process:
- Uses **objective criteria** to determine when one principle should outweigh another.
- Avoids swinging between extremes by weighing both **costs and benefits**.

**Status: the parts exist; nothing computes when one principle outweighs another.** What exists on every belief page:

- **Objective Criteria.** "Pick the yardstick before you look at the reading." Each criterion is a claim with its own page and its own truth, with the reading each side predicts; a criterion both sides expect to come out the same way tests nothing. Four labels (Validity, Reliability, Linkage, Importance) "are typed by the author, not computed, and nothing reads them". The Latest Reading column stays blank until somebody fills it with a sourced number. The corpus has 117 criterion rows on beliefs and 374 on topics.
- **Values.** Each value is listed with the rank supporters give it and the rank opponents give it, and a sentence on why they differ (48 value rows).
- **Kind of dispute.** Each belief is classified from four numbers read off its own tables, none of which changes a score ([method.html#dispute](https://myklob.github.io/ideastockexchange/beliefs/method.html#dispute)):
  - evidence two-sidedness = min(supporting, weakening) / max(supporting, weakening)
  - linkage leaning against relevance = the share of reasons whose linkage reads under 0.5
  - value gap = min(1, mean |supporter rank - opponent rank| / 3)
  - whichever beats both others by 0.1 names the dispute **Factual**, **Linkage** or **Values conflict**; otherwise it is **Mixed**. The [hardest-to-resolve list](https://myklob.github.io/ideastockexchange/beliefs/lists.html#hardest) puts values conflicts first, "because no measurement settles it".
- **Interests, Not Positions.** Each interest is a need with a subject, argued two ways that never borrow from each other: **Validity** (should the need be honored? settled by the mirror test: would the side accept the same need honored for its opponents?) and **Drives** (is this really why the side holds its position? settled by its record, not its rhetoric). Score = Validity x Drives. The primary conflict pair is the highest-scoring interest on each side. 427 interest rows, 72 shared interests, 77 compromises.
- **Ease of resolution** = max(compromise truth) x (1 - mean obstacle truth), with 0.5 standing in for the obstacles when none are listed.

What does not exist is the 2025 promise itself: a rule that says, given these criteria, liberty outweighs security here and not there. That is **proposed**. Depth: [[Likely Interests of Those Who Agree and Disagree]], [[Automated Conflict Resolution Platform]], [[Template: Interest Validity Debate]], [[Template: Conflict Analysis]].

---

## Moving Beyond Political Dogma

Dogma (e.g., "big government is always bad") limits problem-solving.
Instead, we focus on **effective decision-making processes** that:
- Use evidence, transparency, and reason.
- Are adaptable to new data.
- Remove bias and corruption.

| Promise | Status | What exists |
|---|---|---|
| Evidence, transparency, reason | **Built** | The evidence prior; every column on a row is printed "so the row can be multiplied out and checked"; the method page; two CSV tables anyone can diff. |
| Adaptable to new data | **Built** | No score is stored. Every number is recomputed from the two tables on every build, and [`changes.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/changes.py) reports what moved since the last revision. The tables are CSV so "a change to an argument reads as a change to an argument" in git. |
| Remove bias | **Partly built** | Cognitive biases are a section, symmetric for both sides (Affecting supporters / Affecting opponents), scored like other rows; 8 bias rows today. Possible fallacies are **flagged, never scored**: [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) matches a short published phrase list for nine patterns (Attacking the person, Appeal to popularity, Appeal to authority, Slippery slope, False choice, Sweeping generalization, Appeal to tradition, Pointing at the other side, After therefore because of). Each flag is a question that names the words that set it off and links two prefilled forms on the flagged claim's own page, "It is" and "It is not". What that argument concludes moves the claim's truth by the ordinary rules; the flag never does ([method.html#checks](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks)). |
| Remove corruption | **Partly built** | No mechanism beyond the Interests and "Advertised versus actual motivations" tables (2 motive rows). |

The fallacy rule is the owner's direction verbatim: software may flag a possible fallacy, nothing is final, and a flag is argued like any claim and moves no score. Why not just deduct points? Because on a site whose subject is often officials acting on their own financial interests, "attacking the person" fires on legitimate arguments about conflicts of interest. A deduction with no page to appeal to is worse than no check.

The app's `scoreArgument` still has a penalty branch, `baseTruth = truthScore x (1 - sum of |fallacy impact| / 100)`, but the bridge that would feed confirmed fallacy claims into it (`confirmedClaimsToDetectedFallacies` in [`claims.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/claims.ts)) is called by nothing but its test, so on the live belief page the penalty path does not run.

---

## Promoting Process-Based Politics

Political parties should **compete on process quality**, not ideology.
Processes include:
- Separation of powers
- Scientific method
- Cost-benefit analysis
- Logical validation
- Bias removal
- Conflict resolution techniques
- Voting reform
- Transparency and deliberative democracy

The **goal**:
Find solutions that work for the majority, park intractable issues peacefully, and leave participants more satisfied after debate.

| Process | Status | Where |
|---|---|---|
| Separation of powers | **Proposed** | No code |
| Scientific method | **Built, in part** | The evidence prior; Testable Predictions and the Falsifiability Test on each belief page; predictions score by the same signed rule |
| Cost-benefit analysis | **Built** | See [Cost and benefit dimensions](#cost-and-benefit-dimensions) |
| Logical validation | **Built, structural only** | Logical Anatomy, the load-bearing cap, `integrity.py` Structural Checks, and a pre-publish cycle check CI runs first |
| Bias removal | **Partly built** | Bias and motive tables; fallacy flags argued, never scored |
| Conflict resolution techniques | **Built** | Interests (Validity x Drives), shared interests, compromises, obstacles, kind of dispute, ease of resolution |
| Voting reform | **Proposed** | No code. It is, however, argued as content: [Ranked-choice voting produces better electoral outcomes than plurality voting](https://myklob.github.io/ideastockexchange/beliefs/p/ranked-choice-voting-produces-2.html) is a belief page |
| Transparency and deliberative democracy | **Transparency built; deliberation partly** | The method page, the conformance contract (twenty-four pages, five constants, eighteen evidence tiers in [`conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py)), git-diffable tables. Deliberation is the GitHub issue flow; [Representative civic juries should be convened, online and in person, to deliberate on key legislation](https://myklob.github.io/ideastockexchange/beliefs/p/representative-civic-juries-convened.html) is itself a belief page under argument |

The goal, line by line: **work for the majority** is **refused as a scoring input** (votes never score; the vote-versus-analysis gap is shown instead). **Park intractable issues peacefully** is **proposed**; the site ranks the hardest disputes and the ease of resolution but does not act on either. **Leave participants more satisfied** is **proposed**; no satisfaction signal exists, and the behavioural signals in `confidence.py` sit at weight 0.

---

## Why a Process-Based Approach?

Direct democracy on every decision is impractical.
Instead:
- Allow citizens to **contribute as they can**.
- Use representatives and facilitators guided by **evidence-based processes**.
- Make policy development transparent and accountable.

Representative democracy is not the problem; **parties ignoring data is**.

| Promise | Status | What exists |
|---|---|---|
| Contribute as they can | **Built** | A form under every table; one sentence is enough. Every belief is published however far along it is, and no drafted argument is ever deleted: quality is ranked, not gated. A belief that meets the core bar in [`publish.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/publish.py) (reasons both ways, evidence, objective criteria, predictions or a falsifiability test, costs and benefits, interests) comes first in every ranking; every other belief is published with a `draft` mark saying what it still needs. |
| Representatives and facilitators | **Proposed** | No such role in the code. The maintainer who merges pull requests is the only gate. |
| Transparent and accountable | **Built** | The git history of two CSV tables is the accountability record; every row says who added it and when. |

The owner's line still stands as the thesis: representative democracy is not the problem. The site does not replace representatives. It gives them, and everybody watching them, a public ledger of which reasons survived argument, which ones nobody has checked, and which ones a crowd likes anyway.

---

## Mechanisms the 2025 page never named

These are built, they bear on how a public would reason together, and the 2025 page did not mention them.

- **Sensitivity: what would move this most.** Every belief's readout names the single input whose settlement would change the answer most, with the score if that claim proved false and if true ([`sensitivity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py)). It reports two columns: "moves it now" and "moves it if settled" (confidence held at 1), and the gap between them is the value of doing the work. This is the question a budget office actually asks: not "what is the score" but "how far would one number have to move before the recommendation flips?"
- **ReasonRank as a dependence walk.** [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py) asks how much of the site's conclusion-weight flows through a claim, stepping along rows in proportion to capacity = Link x Imp x Uniq, deliberately ignoring truth and confidence. The home page's "Most relied on" card is the nearest thing to "popular" the site measures, and "What to argue next" ranks claims by the share of the site resting on them times the share of their work still undone. For a public with limited hours, that is the answer to "where should I help?" Depth: [[ReasonRank]], [[ReasonRank: Google's PageRank for Arguments]].
- **The app's work queue.** `/leverage` ranks every unsettled argument edge by the conclusion score still at stake on it ([`decision-leverage.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts)), the app's counterpart to "What to argue next".
- **Topic pages with a position axis.** Each topic in [`content/topics.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/topics.csv) gets a page laid out like [[Template: Topic]]. A topic people take a side on as a whole has an `axis` saying what a positive position means; a subject nobody is for or against leaves it empty. The ones nearest this page: [Democracy and rule of law](https://myklob.github.io/ideastockexchange/beliefs/t/democracy-and-rule-of-law.html), [Elections](https://myklob.github.io/ideastockexchange/beliefs/t/elections.html), [Evidence and process](https://myklob.github.io/ideastockexchange/beliefs/t/evidence-and-process.html).
- **Electronic democracy as content.** The ideas on this page are argued on the site like anything else: [Public policy should be driven by data and measurable outcomes rather than by ideology](https://myklob.github.io/ideastockexchange/beliefs/p/public-policy-driven-data.html), [We should support and strengthen democracy to restore the voter's voice](https://myklob.github.io/ideastockexchange/beliefs/p/we-support-strengthen-democracy.html), [Congressional term limits would reduce corruption and improve legislative quality](https://myklob.github.io/ideastockexchange/beliefs/p/congressional-term-limits-reduce.html), [Any registered voter should be able to vote by mail without giving a reason](https://myklob.github.io/ideastockexchange/beliefs/p/any-registered-voter-able.html), [Voters should generally be required to show government-issued photo identification](https://myklob.github.io/ideastockexchange/beliefs/p/voters-generally-required-show.html). A platform that would not put its own premises on trial would be the dogma it complains about.
- **Open data.** Every table rides along as JSON, XML, SQL and a loaded SQLite database, so anyone can rebuild every number without trusting this site ([method.html#data](https://myklob.github.io/ideastockexchange/beliefs/method.html#data)).
- **Plain words on reader pages.** A build test (`TestThePagesSpeakPlainly` in `test_render.py`) fails the build if engine words like "corpus" appear anywhere but the method page. A democracy that needs a glossary is not one.

---

## Where the site meets the owner's direction (October 2026)

| Direction | What the site does today | Gap |
|---|---|---|
| **Volume:** count truly independent reasons, weigh pro against con, count contributions from the moment they are posted | The argued rule zeroes an unargued reason; `tally.py` counts it and is printed beside the truth score | The argued rule still leads; the comparison on real pages is pending (CLAUDE.md open decisions 1 and 6) |
| **Choices of action:** cost and benefit across every legitimate interest | A priced section with `who` on every row, kept out of the truth score | No controlled dimension list; no ranges typed; no scoring of interests met under different validity assumptions |
| **Votes:** attention, never validity; popular tracked apart from sound | Votes shown as "votes, not a score"; the vote-versus-truth gap card | Matches. The app's linkage votes and fallacy consensus do move numbers |
| **Fallacies:** software may flag, nothing is final, a flag is argued and moves no score | `fallacy.py` flags with "It is" / "It is not" forms; no deduction | Matches. The app keeps a dormant penalty branch |
| **Linkage:** start trusting, fall when argued down, rise when argued well | `DEFLINK = 1`; a linkage page's truth replaces it | A linkage page cannot read above 1, so "rise" means rising back toward full trust |
| **Evidence:** prefer no ceiling | `tally.py` uses ESIW x ERQ x ERP/100 uncapped | The argued rule keeps the bounded prior (p0 in [0.05, 0.95], weight at most 2k) until compared |

---

## Open questions for the owner

1. **Cost-benefit dimensions.** Should there be a controlled list, and which: the 2025 seven, the app's four, or the site's free-text units? Options: adopt the seven in both engines and map the free-text units onto them (most live rows become "other"); keep "a row's unit is whatever it is measured in" and drop the list; or keep both and say which engine a reader is looking at.
2. **Media: reason or container?** The 2025 page lists media among reasons. The site shows media rows and does not count them. Keep the one-way flow, or let `(2 x Quality - 1) x Bears x Influence x Importance` enter the belief score (which moves every published number)?
3. **Study rigor.** Keep the eighteen source types plus replication and agreement, add typed rigor fields (sample size, randomization, blinding, controls, setting) that adjust a study's starting point, and/or retire T1 to T4 from the app's CBA types to match the rules doc?
4. **Influence: argued or measured?** Argued with reach shown and never multiplied (site), typed reach multiplied in (app), or both with reach typed for the site's works so the two agree?
5. **Verdicts.** Remove the app's CBA verdict to match the site, keep it and document the difference, or restore a verdict on the site?
6. **The app's CBA likelihood.** The skill doc says likelihood is "computed (never manually assigned)"; `recalculateCBA` takes the typed probability of the best-argued estimate, and the recursive three-factor function with `0.5^(d-1)` attenuation is imported by nothing but tests. Wire it in, correct the doc, or retire the unused path?
7. **The political program.** Party, candidates, pledges, representatives, facilitators, majority solutions, parking issues, satisfaction: all proposed with no code. Which, if any, should be built first, and should a candidate be modelled as a belief page ([[Template: Candidate Evaluation]]) or as something new?

---

## Original sketch (2023), not what runs

<details><summary>Original sketch (2023), not what runs</summary>

The 2025 page carried no sample code. Its only technical content was the prose kept above: two columns, three scores per argument, seven cost/benefit dimensions, rigor factors for studies, and four steps for scoring media. What runs instead is the signed five-factor rule in `tools/static-site/score_reference.py`, with the counting rule in `tally.py` printed beside it, and the app's ratio rule in `src/core/scoring/scoring-engine.ts`.

</details>

---

## Related pages

- [[Home]]: the overview of the whole project
- [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]]: how a page's truth is computed
- [[ReasonRank]], [[Argument Scores from Sub-Argument Scores]]: how scores flow up the tree
- [[Linkage Scores]], [[Evidence to Conclusion Relevance Score]], [[The Redundancy Problem]], [[Equivalency Score:]]: the multipliers
- [[Evidence Verification Score (EVS)]], [[Confidence Stability Scores]]: where a score starts and how much it counts
- [[Likelihood of Costs and Benefits]], [[Likely Interests of Those Who Agree and Disagree]], [[Automated Conflict Resolution Platform]]: choices of action and conflict
- [[Media]], [[Belief Web Navigation]], [[Evidence‐based policy]]
- Templates: [[Templates]], [[Template: Belief Analysis]], [[Template: Topic]], [[Template: Candidate Evaluation]], [[Template: Interest Validity Debate]], [[Template: Stakeholder Profile]], [[Template: Conflict Analysis]]
- On the site: [the methodology](https://myklob.github.io/ideastockexchange/beliefs/method.html), [what every ranking shows](https://myklob.github.io/ideastockexchange/beliefs/lists.html), [all topics](https://myklob.github.io/ideastockexchange/beliefs/topics.html)

## External Links
- [Evidence-based legislation](https://en.wikipedia.org/wiki/Evidence-based_legislation)
- [Evidence-based policy](https://en.wikipedia.org/wiki/Evidence-based_policy)
