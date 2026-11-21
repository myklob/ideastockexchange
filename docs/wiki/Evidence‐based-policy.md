# Evidence-based policy

**Evidence-based policy** is the practice of grounding policy decisions in rigorously established, objective evidence rather than ideology, "common sense," anecdotes, or personal intuition.

The **Idea Stock Exchange** aims to promote evidence-based policy by providing a transparent, quantifiable, and dynamic framework for evaluating policy proposals.

That was the whole promise in 2025. Here is the problem it is aimed at. To build a system like the **Stock Exchange of Beliefs**, we have to solve the "Structural Crisis of Information." Today the internet treats a link to a rigorous, controlled study exactly the same as a link to a gut feeling. They are both just blue underlines. That visual equivalence lets misinformation flourish, because the interface does not care about the methodology. A citation to a randomized trial with 5,000 people and a citation to somebody's uncle look identical on the page, and the reader is left to sort them out with whatever patience they have left.

The Idea Stock Exchange (ISE) is designed to strip away the "Wall of Text" and the "Appeal to Authority." It replaces them with a transparent, automated audit of the logical foundations and evidence quality of every belief.

This page says what the code actually does with each of those promises: the real formulas, constants and defaults, where the code went somewhere the old pages did not expect, what is still only proposed, and what the code refuses to do on purpose (and why). Nothing proposed has been dropped for being unbuilt; it is labelled proposed. It merges two texts: the five-point page published on the wiki on 2025-08-09, and a newer, never-published draft by the owner (the "Evidence Scoring Engine" text with a Technical Requirement Specification, which sat in the repository's `docs/wiki/` under this same filename from 2026-03-27). Everything either one said is still here.

**Two engines.** The repository runs two implementations that sometimes disagree, and the difference matters for this page more than most.

- The **published site** is [`tools/static-site/`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md). It builds [myklob.github.io/ideastockexchange/beliefs/](https://myklob.github.io/ideastockexchange/beliefs/index.html) from two flat tables: 4,263 pages and 9,472 rows at the current revision, plus 95 topics and a votes table (counted from `content/*.csv`; the site's own pages print the live counts). "The site does" means this one.
- The **Next.js app** is [`src/core/scoring/`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts) plus its belief pages under `src/app/beliefs/`, backed by a Prisma database. "The app does" means this one.

## The page at a glance

Every promise either text made, and where it stands (source: an audit of the 2025 page against the code, October 2026, rechecked against the files linked in each section below):

| Promise | Status on the site | Where |
|---|---|---|
| A structured database linking conclusions to assumptions | **Built**, as two flat tables, not a database server | [`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py), [`export_db.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/export_db.py) |
| Quantifies the strength of those links | **Partly built.** Links to reasons, evidence and predictions are scored; links to assumptions only through a typed flag | [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py) |
| Prioritizes well-supported policies | **Built**, three ways: completeness, confidence, ReasonRank | [`publish.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/publish.py), [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py), [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py) |
| Score from argument strength, linkage and uniqueness | **Built, and the list is short by three factors** (importance, confidence, the evidence starting point) | [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py) |
| Uniqueness stops double-counting | **Partly built** on the site (argued, presumed 1, a detector flags); **computed** in the app | [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py), [`duplication-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/duplication-scoring.ts) |
| Scores recalculate automatically | **Replaced** on the site by a full recompute on every build; **built** in the app as propagation on write | [`pages.yml`](https://github.com/myklob/ideastockexchange/blob/master/.github/workflows/pages.yml), [`propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts) |
| Outdated data kept out of decisions | **Refused by design** on the site (argue it false instead); the app has a verification lifecycle | [`method.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/method.py), [`evidence-exposure.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/evidence-exposure.ts) |
| A hub to share evidence and challenge assumptions | **Built** through GitHub issue forms; a reader cannot set a finding's evidence tier | [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py), [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) |
| Public participation | **Built**, and a vote **never moves a score** on the site, by design | [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py), [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py) |
| Open to public review, replication, validation | **Built**: five data shapes, per-page JSON, a cross-language conformance contract | [`export_db.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/export_db.py), [`conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py) |
| Evidence Impact = Quality Score x Linkage Score (2026 draft) | **Built in both engines, in different shapes** | [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py), [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts) |
| Users earn ReasonRank by spotting flaws (2026 draft) | **Not on the site** (ReasonRank ranks pages); the app weights fallacy votes by a track record | [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py), [`calibration.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/calibration.ts) |
| An NLP parser suggests unstated assumptions (2026 draft) | **Not wired.** Code exists, unimported, and a model-asserted number is refused | [`src/core/ai/`](https://github.com/myklob/ideastockexchange/blob/master/src/core/ai/README.md) |
| PostgreSQL or Neo4j, UUIDs (2026 draft) | **Replaced**: a PostgreSQL-flavoured schema is exported, no server runs; ids are integers and text keys | [`export_db.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/export_db.py) |

---

## The core philosophy: arguments over credentials

The current system relies on institutional trust, but institutions have failed repeatedly: the Gulf of Tonkin, the Iraq WMD debacle, and the opioid crisis. In each case, "experts" had high authority but low argument quality.

The ISE rejects the "trust the experts" fallacy. We don't care about your PhD or your institutional letterhead. We care about whether your argument survives scrutiny. If a dissenting amateur makes a methodological challenge that holds up, they win. If a Harvard professor relies on a logical fallacy, they lose.

That is the owner's position (2026 draft). Four pieces of running code carry it on the site, and none of them reads a credential:

1. **Kinds of evidence are ranked, not kinds of people.** A finding's page starts where its source type puts it (the full table is under [The evidence starting point](#the-evidence-starting-point)). An `expert_claim` ("Expert or social media claim") weighs 0.60 and `expert_data` ("Expert testimony with supporting data") 0.65, while `statistics` weighs 0.90 and `rct` 0.85. So the professor's say-so starts lower than the professor's data, and the amateur's published statistic starts higher than either. Source: [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py), `ESIW`.
2. **A page that rests only on authority gets a warning.** One of the nine structural checks, "Rests only on authority or experience," fires when every claim beneath a page is classified as `expert_claim`, `expert_data`, `anecdote`, `intuition` or `norm` (the `AUTHORITY` tuple in [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py)). It moves no score; it tells the reader where to look.
3. **"Experts agree" gets flagged as a possible fallacy.** [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) carries a published phrase list. Its "Appeal to authority" entry fires on `experts (?:agree|say|all agree)`, `scientists (?:agree|say)`, `(?:doctors|economists) (?:agree|say)`, `according to (?:the )?experts` and `trust the (?:experts|science)`. The flag is phrased as a question and opens two forms on the flagged claim's own page, one to argue it is the fallacy and one to argue it is not. Per the owner's direction (October 2026), the flag itself moves nothing; only the argument that follows can.
4. **A challenge wins by being argued, not by who made it.** A reason to disagree filed by an anonymous GitHub account and one filed by a tenured economist are the same kind of row and go through the same formula. There is no author field anywhere in the scoring path.

The amateur-versus-professor sentence is the owner's judgment about what the system should reward. Whether the site actually rewards it on a given page depends on someone doing the arguing, which is exactly where the corpus is thinnest (see the worked example next).

---

## A worked example: the belief that policy should follow the data

The corpus contains a belief that is this page's subject stated as a claim: [Public policy should be driven by data and measurable outcomes rather than by ideology](https://myklob.github.io/ideastockexchange/beliefs/p/public-policy-driven-data.html), filed under the topic [Evidence and process](https://myklob.github.io/ideastockexchange/beliefs/t/evidence-and-process.html). Here is what the engine makes of it at the current revision. The numbers below are my calculation, running `render_site.Corpus` over `content/` exactly as the build does; the live page prints the same quantities and will move as rows are added.

**What it lists.** Five reasons to agree, five to disagree, three findings for, two against, four predictions that should come true if it is right and three that should come true if it is wrong, and six interests on each side. Among the reasons:

| Side | Reason (as written in the tables) |
|---|---|
| Agree | Policies with measurable outcomes can be corrected when they fail, and policies without them cannot. |
| Agree | Voters can only hold officials accountable for outcomes they can measure. |
| Agree | Good policy ideas come from all parts of the political spectrum, and filtering ideas by ideology discards them. |
| Disagree | Most major policy disagreements are about values rather than facts, and data cannot resolve disputes about values. |
| Disagree | Measurable outcomes create their own distortions, because when a measure becomes a target it ceases to be a good measure (Goodhart's Law). |
| Disagree | Expert consensus has been wrong on important questions, sometimes systematically, so policy frameworks that defer excessively to it build in a systematic lag before correcting errors that independent political pressure might have caught sooner. |

The findings include, for: "The UK's National Institute for Health and Care Excellence, a standing body that reviews evidence and issues binding recommendations based on cost-effectiveness, is documented to save the NHS about 1.5 billion pounds a year compared with unevaluated adoption of new treatments, while improving patient outcomes," and "Education programs rated 'strong evidence' by the U.S. Department of Education's What Works Clearinghouse consistently outperform programs without evidence ratings." Against: "Cochrane Reviews and meta-analyses of pharmaceutical research consistently find that industry-funded studies produce favorable results at two to three times the rate of independent studies of the same treatments." Note what those sentences already contain ("documented," "meta-analyses," "two to three times") and what the tables do not: an `etype`, an `erq` or an `erp` on any of their pages.

**What it scores.**

| Quantity | Value | Why |
|---|---|---|
| Truth (argued) | **0.50** | Every claim page beneath it has confidence 0.000, and no finding page declares an evidence type, so every row contributes exactly 0 |
| Belief score (POS - NEG) | **0** | Same reason |
| Owner's tally rule | **0.54** | Counts every reason from the moment it is posted (arithmetic below) |
| Confidence | **0.36**, band "early" | two_sided 1.0, breadth 0.79, depth 0.25, sourcing 0.5, scrutiny 0, grounding 0, testability 0 |
| Status | **Draft** | Missing objective criteria and costs and benefits from the publish bar |
| Largest single swing if settled | **0.33** | The sensitivity sweep, with that input's confidence held at 1 |

The tally arithmetic, by hand. Under [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) every row weighs Truth x Linkage x Importance x Uniqueness, and with nothing argued each factor reads its labelled default: 0.5 x 1 x 0.5 x 1 = 0.25. A finding weighs the same times (1 + ESIW x ERQ x ERP/100), and with no source type named ESIW is 0, so a finding is also 0.25.

- For: 5 reasons + 4 predictions + 3 findings = 12 rows x 0.25 = **3.0**
- Against: 5 reasons + 3 predictions + 2 findings = 10 rows x 0.25 = **2.5**
- Share for = (3.0 + 1 x 0.5) / (3.0 + 2.5 + 1) = 3.5 / 6.5 = **0.538**

And the confidence, by hand, with the weights from [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py): 0.30 x 0 + 0.20 x 1.0 + 0.20 x 0 + 0.15 x 0.786 + 0.05 x 0.25 + 0.05 x 0.5 + 0.05 x 0 = **0.355**. Breadth is 22 rows and predictions saturated at 6, 22/28 = 0.786; depth is one level saturated at 3, 1/4 = 0.25.

**What this example teaches.** The belief that policy should follow the evidence currently cites five findings and none of them has been classified, so under the argued rule it is exactly as settled as a coin. That is not a bug; it is the arithmetic being honest that nobody has yet done the work. Five classifications (say NICE as `record`, the clearinghouse as `statistics`, the Cochrane finding as `meta`, each with a replication count) would start moving it. Under the tally rule it already leans 0.54 toward agree, purely because more rows were filed on that side, which is precisely the property the owner wants compared against the argued rule before either one leads. Across the corpus, 179 of 196 beliefs read exactly 0.50 under the argued rule and 42 of 196 meet the publish bar (my count at the current revision).

---

## Core contributions to evidence-based policy

The 2025 page named five contributions. Each keeps its original wording and gets its real status.

### Structured database of conclusions and assumptions

The 2025 promise:

- Maps **how conclusions relate** to other conclusions and to their underlying assumptions.
- Quantifies the strength of these links.
- Prioritizes policies supported by **strong, interconnected assumptions** and **well-reasoned conclusions**.

#### What runs: two flat tables, one claim per page

**Built, though not as a database server.** The site is two flat tables plus two beside them, authored in `ISE_Data_Entry.xlsx` or directly as CSV and kept in step by [`sync_content.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sync_content.py):

| Table | One row per | Columns (from [`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)) |
|---|---|---|
| `pages` (`content/pages.csv`) | claim, belief, linkage, importance, interest, uniqueness, equivalence, driver or media page | `key, tab, kind, text, standalone, topic, parent, x, y, type, direction, rowkind, value, measured_by, where_found, etype, erq, erp, if_true, if_false, latest, bridge, bottom_line, hook, question, ask, positivity, strength, form` |
| `edges` (`content/edges.csv`) | row of every table on every page | `page, section, side, claim, text, source, link, imp, uniq, drives, equiv, who, bearing, pattern, category, magnitude, mag_low, mag_high, deadline, extra` |
| `topics` (`content/topics.csv`) | topic page | `key, name, parent, definition, scope, axis` |
| `votes` (`content/votes.csv`) | person's latest vote on a claim | `key, login, vote, issue, date, on` |

At the current revision that is 4,263 pages (196 beliefs, 3,385 claims, 407 interests, 177 media, 50 importance, 34 linkage, 9 driver, 3 equivalence, 2 uniqueness) and 9,472 edges.

"How conclusions relate to other conclusions" is every edge whose `claim`, `link`, `imp`, `uniq`, `drives`, `equiv`, `who` or `bearing` column names another page. The renderer builds both directions of that index (`Corpus.uses` and `Corpus.reads` in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)), and every page prints a "Where This Page Is Used" table: "Every page that reads this one. One claim, one home, every use visible." So a claim cited under four different policy beliefs is one page with four uses, not four copies drifting apart.

**No score is stored anywhere.** The export says it in its first data line: "Scores are computed, not stored." Every number on the site is a pure function of those tables, recomputed at build.

#### Where the assumptions live

"Underlying assumptions" are two kinds of row on a belief page:

- **`component` rows** (the Logical Anatomy table), each with four extra fields: `type`, `stated`, `lb` and `assumes` (`EXTRA['component']` in `ise_tables.py`). `stated` records whether the premise is stated or unstated; `lb: Y` marks it load-bearing, a premise the claim does not survive without. In the corpus, 108 of 125 component rows carry `lb: Y`.
- **`assumption` rows** (233 in the corpus), printed as "Required to accept" and "Required to reject" on the belief page.

The 2026 draft asked for exactly this split: "For every belief, the system uses templates to identify **Stated Assumptions** and **Unstated Assumptions**. Users must post reasons why an assumption is 'Load-Bearing' (necessary for the belief to stand) or 'Non-Essential.'" The first half is built (`stated`). The second half is **partly built**: the load-bearing flag exists, but an author types it. Nobody posts reasons for it, and the contribution form cannot set it.

#### Quantifying the links: the one formula

**Partly built.** A link from a conclusion to a reason, a finding or a prediction is scored by one formula ([`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), `Model._contrib`):

```
contribution = sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq
```

- `sign` is +1 for a row filed as a reason to agree and -1 for a reason to disagree.
- `Truth` is the truth score of the claim's own page, moved onto a -1 to +1 scale by `2 x Truth - 1`. A claim argued false counts *against* the side it was filed on: ten refuted reasons to agree weaken a belief instead of padding it. A claim nobody has argued sits at 0.5 and contributes exactly 0.
- `Confidence` is how much work stands behind the claim's page (see [Prioritizing](#prioritizing-what-is-well-supported)), and 0 when the row's claim has no page at all.
- `Link`, `Imp` and `Uniq` are each the truth score of a page that argues that factor, or a labelled constant when nobody has opened one.

The five labelled constants ([`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py) `CONSTS`, with their meanings from [`build_pages.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/build_pages.py)):

| Constant | Value | What it presumes |
|---|---|---|
| `K` | 1 | A page starts as one vote of this weight, at 0.5 when it cites nothing and at its evidence starting point when it does |
| `UNARG` | 0.5 | What a row reads for Truth when its claim has no page yet: a coin flip |
| `DEFLINK` | 1 | "A reason placed under a conclusion is presumed relevant until a linkage page says otherwise; the burden is on the challenger" |
| `DEFIMP` | 0.5 | "An importance nobody has argued opens at 0.5, neither trivial nor decisive" |
| `DEFUNIQ` | 1 | "A reason is presumed distinct until a uniqueness page shows the overlap" |

How much those presumptions carry today: only 32 rows in the whole corpus name a linkage page, 50 an importance page and 2 a uniqueness page. In the worked example above, all 22 scored rows rest on all three defaults.

#### The link to an assumption: a cap, not a weight

The link from a conclusion to an *assumption* is quantified in exactly one way, through the load-bearing flag:

```
Truth, published = min(Truth argued, the smallest truth among load-bearing components that have a page of their own)
```

A conclusion cannot be more settled than a premise it needs. It is a minimum and not a replacement, so a premise better established than the conclusion leaves it where its rows put it, and a premise stated in words with no page caps nothing. The `assumption` rows ("Required to accept / Required to reject") are listed and read by no formula.

The method page says so in print: "Which components are load-bearing is typed by the author (the load-bearing flag on the Logical Anatomy table), not argued. The wiki's Necessity Score, an argued number for how much a conclusion needs each premise, is not computed, so this one typed flag decides which premise can cap a page." **The Necessity Score is proposed, not built** (see [[Assumptions]]).

That cap matters more than its size suggests. An unargued load-bearing premise reads 0.50, so it holds any conclusion above it at 0.50, however much evidence that conclusion cites. A structural check names this case: "Evidence filed above the premise it bears on." It is open decision 6 in the project's CLAUDE.md.

#### Prioritizing what is well supported

**Built, three ways.** "Strong, interconnected assumptions and well-reasoned conclusions" turned into three rankings that answer three different questions.

**1. Completeness: is the analysis all there?** A belief meeting `publish.CORE_BAR` in [`publish.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/publish.py) is "complete" and comes first in every list. The bar, in order:

| Part | Needs |
|---|---|
| reasons to agree | at least one |
| reasons to disagree | at least one |
| evidence | at least one finding, either side |
| objective criteria | at least one |
| testable predictions or a falsifiability test | at least one of either |
| costs and benefits | at least one |
| interests on either side | at least one |

Every other belief is still published, marked "draft," saying what it still needs, and listed in `data/drafts.json`. That is the owner's standing rule: quality is ranked, not gated, and no drafted argument is ever deleted. (A `--complete-only` build exists that writes only complete beliefs and the pages beneath them; CI builds everything.)

**2. Confidence: how much work stands behind the number?** [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py) scores seven structural components in [0, 1] and averages them by weight, dropping any component that does not apply to a page and renormalising the rest:

| Component | Weight | Asks |
|---|---|---|
| `grounding` | 0.30 | Is the claim established, by its own cited source (its tier weight) or by the mean confidence of the claims beneath it, whichever is higher? |
| `two_sided` | 0.20 | Has anyone argued the other side? (1.0 both sides, 0.35 one side, 0 none) |
| `scrutiny` | 0.20 | Of the link, importance and uniqueness slots on its rows, how many have pages of their own? |
| `breadth` | 0.15 | How much has been brought to bear: rows and predictions, saturating as n/(n+6) |
| `depth` | 0.05 | How far down the tree goes, saturating as n/(n+3) |
| `sourcing` | 0.05 | Half for citing a source, half for naming what kind of source |
| `testability` | 0.05 | Predictions that are dated and have a linkage page arguing how diagnostic they are |

Bands: established at 0.75 or more, developing at 0.45, early at 0.15, unstarted below. The wiki's behavioural signals (up and down votes, weekly visitors, dwell time, edit frequency, duplicate submission attempts, evaluation responses, score variance over time) carry **weight 0** and are reported as "no data," because a two-table corpus has one snapshot and no user. See [[Confidence Stability Scores]].

**3. ReasonRank: how much of the corpus depends on this page?** [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py) runs a damped random walk that starts at the beliefs and steps along rows in proportion to how much each row can carry:

```
capacity(row) = Link x Imp x Uniq
work(page)    = rank x (1 - confidence)
```

with `DAMPING = 0.85` (PageRank's own constant), stopping at `TOLERANCE = 1e-12`. Truth and confidence are deliberately left out of capacity, because "a ranking that fell when a claim was refuted would be measuring agreement rather than dependence." The work value turns it into a to-do list: high rank and unfinished work is "the next thing an analyst should spend a week on." See [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]].

---

### Scoring system for arguments

The 2025 promise:

- Each conclusion's score is determined by:
  - **Strength of supporting/opposing arguments**
  - **Linkage scores** (relevance between evidence and conclusion)
  - **Uniqueness scores** (avoiding double-counting similar arguments)
- Ensures that **well-supported policies** gain visibility and credibility.

**Built, and the list is three factors short.** The site multiplies in everything on that list plus importance, confidence and an evidence starting point. A reader who takes the three-item list as the whole recipe cannot work out why nearly every belief reads 0.50. Here is the whole recipe.

#### Two numbers per page, not one

From [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), applied to the argument, evidence and prediction rows together:

```
POS             = sum of the positive row contributions
NEG             = sum of the negative row contributions, as a magnitude
truth (argued)  = (POS + w x p0) / (POS + NEG + w)
truth           = min(truth argued, weakest load-bearing component with a page)
belief score    = POS - NEG     (open-ended)
```

A row lands on the side its sign puts it on, not the side it was filed on, so a refuted objection counts as support. Truth runs 0 to 1. The belief score is a quantity of argued weight and has no ceiling. `p0` and `w` are the page's evidence starting point, next.

#### The evidence starting point

This is the only thing in the engine that can move a score off 0.50, and it is the heart of "evidence-based." A page may declare what it rests on in three columns of the `pages` table, and [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py) turns them into a starting point:

```
p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)
w  = k x 2 x ERQ / (ERQ + 1)        bounded at REP_CAP = 2.0 x k
```

- **ESIW** (`etype`): how far that kind of source can move the claim.
- **ERQ** (`erq`): how many independent replications exist. Blank reads 1.
- **ERP** (`erp`): what share of them agreed, clamped to 0..100. Blank reads 100.

The replications decide which way a claim is pushed and the source type decides how far. The replication reward runs 1 replication 1.00, 2 gives 1.33, 3 gives 1.50, 10 gives 1.82, with a limit of 2.00, so "no pile of replications can put a claim beyond argument." A page that declares nothing reads `p0 = 0.5, w = k`, exactly the neutral vote it always had.

The eighteen tiers, with each tier's starting point when every replication confirms (ERP 100) and when every one contradicts (ERP 0), by calculation from the formula above:

| Key | Weight | What it covers | Confirmed | Contradicted |
|---|---|---|---|---|
| `statistics` | 0.90 | Statistics and data, with the source cited | 0.950 | 0.050 |
| `record` | 0.90 | Primary official record: statute, judicial holding, agency rule, sworn filing (an addition beyond the wiki's sixteen) | 0.950 | 0.050 |
| `rct` | 0.85 | Formal scientific study: randomized controlled trial | 0.925 | 0.075 |
| `meta` | 0.80 | Formal scientific study: meta-analysis | 0.900 | 0.100 |
| `observational` | 0.75 | Observational or correlational study | 0.875 | 0.125 |
| `historical` | 0.70 | Historical trend, with references | 0.850 | 0.150 |
| `expert_data` | 0.65 | Expert testimony with supporting data | 0.825 | 0.175 |
| `expert_claim` | 0.60 | Expert or social media claim | 0.800 | 0.200 |
| `anecdote` | 0.55 | Personal experience or anecdote | 0.775 | 0.225 |
| `logic` | 0.50 | Common sense or logic | 0.750 | 0.250 |
| `analogy` | 0.45 | Analogy or metaphor | 0.725 | 0.275 |
| `norm` | 0.40 | Cultural norm | 0.700 | 0.300 |
| `intuition` | 0.35 | Intuition or gut feeling | 0.675 | 0.325 |
| `news` | 0.30 | News or media report | 0.650 | 0.350 |
| `survey` | 0.25 | Survey or poll | 0.625 | 0.375 |
| `eyewitness` | 0.20 | Eyewitness testimony | 0.600 | 0.400 |
| `visual` | 0.15 | Visual evidence | 0.575 | 0.425 |
| `artifact` | 0.10 | Historical artifact | 0.550 | 0.450 |
| (none named) | 0.0 | No source type: no pull either way | 0.500 | 0.500 |

The wiki gave rank 2 as one band, "Formal Scientific Studies - RCTs, Meta-analyses" at "0.85-0.80"; the code splits it RCT 0.85, meta-analysis 0.80 in the order listed. Two things to read off the corners: evidence alone confines `p0` to [0.05, 0.95], so "getting the last twentieth takes an argument, on a page"; and anything at half agreement starts at 0.50 whatever its tier, because "a contested literature has established nothing." The 2025 page's first line rejected "anecdotes" and "personal intuition" as a basis for policy; the table is that sentence turned into numbers, with anecdote at 0.55 and intuition at 0.35 against 0.90 for a cited statistic.

A worked finding, by calculation: a published statistic with four independent replications, three of which agree (`etype statistics, erq 4, erp 75`). Then `p0 = 0.5 + 0.5 x 0.90 x (2 x 0.75 - 1) = 0.725` and `w = 1 x 2 x 4 / 5 = 1.60`. Cited as a reason to agree with no linkage, importance or uniqueness page, it contributes `+1 x (2 x 0.725 - 1) x Confidence x 1 x 0.5 x 1 = 0.225 x Confidence` to the belief above it, where Confidence is that finding page's own.

Who sets the tier: an author, by typing `etype`, `erq` and `erp` into the tables. At the current revision 243 of 4,263 pages declare an `etype`, 56 an `erq` and 50 an `erp`. The method page lists this as its second limitation: "The evidence classifications are a judgement call. Somebody decided that a newspaper's tally of public filings is a published statistic rather than a news report, and that decision moves the claim from 0.65 to 0.95." (Those are `news` and `statistics`, confirmed, from the table above.) See [[Evidence Verification Score (EVS)]].

#### Why everything reads 0.50 until evidence arrives

A row contributes `(2 x Truth - 1)`, so a claim at 0.50 contributes nothing. A page with no rows reads 0.50, so its parent reads 0.50, and by induction **every page of an argument graph in which nothing is cited reads exactly 0.50 forever.** The code's own comment: "reasoning about reasoning never touches the world." [`test_engines.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py) `test_argument_alone_can_never_leave_the_neutral_point` pins it on chains of 2, 5 and 40 pages. If that test ever fails, something has been added that lets a score move without evidence.

For an evidence-based-policy page this is the right property to have. It means you cannot argue a policy into a high score by stacking unsourced claims; you have to go and find out. It is also why the worked example above reads 0.50: five findings cited, zero classified.

#### Linkage: relevance between evidence and conclusion

**Built, and wider than the 2025 page said.** A row may name a linkage page, a page of kind `linkage` whose question is rendered "If it were true that X, it would significantly strengthen/weaken the conclusion that Y" ([`export_db.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/export_db.py)). Its truth score, argued like any other page, is the `Link` factor. With no linkage page, `DEFLINK = 1`: start trusting, and let a challenger argue it down. The 2025 page tied linkage to evidence; the code applies it identically to arguments, evidence and predictions ("One formula for arguments, evidence and predictions alike"). Readers can also vote yes or no on whether a reason bears on the page it is filed under, counted apart from votes on whether it is true; shown, never scored. 34 linkage pages exist for the whole corpus. See [[Evidence to Conclusion Relevance Score]], [[Linkage Scores]] and [[Template: Linkage Evaluation]].

**The app differs.** Its `Argument` table defaults `linkageScore` to 0.1 ([`prisma/schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma)), and its linkage debates score `LS = (A - D) / (A + D)` on [-1, 1] (`scoreLinkageDebate` in [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)).

#### Importance

**Built, unmentioned in 2025.** `Imp` is the truth of the row's importance page or `DEFIMP = 0.5`. An importance page reads differently from every other page: "max over listed interests of Validity x Bears," where Bears is the truth of a bearing page or `DEFLINK`. So a reason matters as much as the most valid interest it serves. See [[Likely Interests of Those Who Agree and Disagree]].

#### Uniqueness: avoiding double-counting similar arguments

**Partly built on the site, computed in the app.**

On the site, the `Uniq` multiplier exists (`uniq_id`, `DEFUNIQ = 1`) and is **never computed**. A row is presumed distinct until someone opens a uniqueness page and argues the overlap; 2 such pages exist in 4,263. What *is* computed is a lexical similarity in [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py): the average of an IDF-weighted Jaccard overlap of content words and an IDF-weighted cosine over character 4-grams (`NGRAM = 4`), flagged at `FLAG = 0.45` ("worth a human reading the pair") and treated as near-identical at `MERGE = 0.70`. It feeds the structural check "Rows that may be the same point twice" and the duplicate check on the forms. It changes no score, and the method page says why in bold: "It changes no score and cannot." The module's reason: a weight for the computed half would have to come from an argued validity comparison, none exists, so the computed weight is 0, "the same rule as everything else here: an input nobody has argued counts nothing." Its honest limits, from the same file: it will flag "officials must not trade stocks" against "officials must not trade bonds," and miss "the ban is unenforceable" against "no agency could police it."

The rule the wiki asked for, "Uniqueness computed as one minus the highest similarity," is listed on the method page under rules the site does not run.

The app runs it. [`propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts) compares each argument with its earlier same-side siblings by `mechanicalSimilarity` (Jaccard over normalised claim text) and sets `uniqueness = 1 - max similarity` (`uniquenessFromSimilarities` in [`duplication-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/duplication-scoring.ts)), with a mechanical duplicate declared at `MECHANICAL_EQUIVALENCE_THRESHOLD = 0.85`. So the two engines answer "is this the same point twice?" in opposite ways: the site waits for an argument, the app computes. See [[Equivalency Score:]] and [[The Redundancy Problem]].

#### The owner's starting rule, printed beside the argued one

The owner's direction (October 2026) is that belief strength should start from the quantity of truly independent reasons on each side, weighted by validity, counting from the moment they are posted. [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) does that and prints it on every belief page as "Counting every reason until it is argued down," read by no other number:

| Under the tally rule | Weighs |
|---|---|
| A reason or a prediction | Truth x Linkage x Importance x Uniqueness |
| A finding | the same x (1 + ESIW x ERQ x ERP/100), its evidence strength, **uncapped** |
| Independent reasons on a side | the sum of Uniqueness over its reasons |
| Share for | (weight for + w x p0) / (weight for + weight against + w) |

It drops the two things that hold the argued rule at 0.50 (the `2 x Truth - 1` and the confidence gate) and keeps everything else. The uncapped evidence strength is the owner's preference: a published statistic replicated 17 times, all agreeing, weighs 1 + 0.90 x 17 x 1 = 16.3 times an otherwise identical reason (by calculation), and nothing stops it reaching 200. The argued rule and its pinned test are unchanged until the two have been compared on real pages. See the method page's [tally section](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally).

#### The app's scoring, where it differs

The app's belief score ([`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)):

```
ProRank    = sum over pro args of RR(arg) x linkage x importance x uniqueness
ConRank    = sum over con args of RR(arg) x linkage x importance x uniqueness
TruthScore = ProRank / (ProRank + ConRank)
ReasonRank = (1 - d) x baseTruth + d x subArgScore,   d = 0.85
```

Under this rule listing an unargued reason does raise the score, which the site's rule forbids. The project records that disagreement as unresolved (open decision 1 in CLAUDE.md), to be settled by comparing rules on real pages. The app also multiplies an argument's base truth by `(1 - sum of |impact|/100)` over its detected fallacies (`scoreArgument`), which the site refuses (see [Fallacies](#the-owners-direction-and-where-the-code-differs)).

#### Visibility and credibility

**Built.** Complete beliefs rank first and then by truth on the best-beliefs page (whose caption explains why a well-argued belief can still read 0.50); the [home page](https://myklob.github.io/ideastockexchange/beliefs/index.html) is cards of ranked lists, each linking to [what the list shows and why it is tracked](https://myklob.github.io/ideastockexchange/beliefs/lists.html); every page heading carries a score badge. "Credibility" is confidence, a separate number printed beside truth and in the citation line.

---

### The evidence scoring engine (the 2026 draft)

The owner's 2026 draft put evidence at the centre. To automate the audit, the software decomposes every belief into an argument chain. When someone submits evidence, they aren't just dropping a link; they are making a set of nested claims that must be individually scored:

1. **The Measurement Claim:** "We observed Y."
2. **The Methodology Claim:** "Our observation method was reliable (e.g., random assignment, N=5000)."
3. **The Inference Claim:** "Observing Y proves X."

What each of the three is on the site today:

| Nested claim | On the site | Status |
|---|---|---|
| Measurement: "We observed Y" | The finding's own page. Its truth is argued by its own rows, starting from its evidence starting point | **Built** |
| Methodology: "Our method was reliable" | The three typed columns `etype`, `erq`, `erp`. Random assignment is the `rct` tier (0.85); "N=5000" has no field | **Partly built.** Typed by an author, not argued. The method page: "The wiki says the category should itself be argued in pro and con form. Here it is typed" |
| Inference: "Observing Y proves X" | The row's linkage page, "If it were true that X, it would significantly strengthen/weaken the conclusion that Y" | **Built**, default `DEFLINK = 1` |

#### The impact formula

The draft calculates **Evidence Impact** from two independent, quantifiable metrics:

> **Evidence Impact = Quality Score x Linkage Score**

- **Quality (Intrinsic):** This measures methodology. Did the study control for variables? Is the data available? Is it falsifiable? Has it been replicated?
- **Linkage (Contextual):** This measures relevance. Does the evidence actually support the specific belief, or is it a "data dump" intended to look credible without being relevant?

**Built in both engines, in two different shapes.**

- **The site** keeps the two halves apart on purpose. Quality belongs to the claim, not to the place it is cited, so it sets where the finding's own page starts (`p0`, `w`) instead of multiplying the row; linkage is the row's `Link`. The effect on a conclusion is the row formula, `(2 x Truth - 1) x Confidence x Link x Imp x Uniq`. The code's reason for not multiplying quality onto the row as well: "putting source quality on the edge as well would count it twice," and "the same finding cited on four pages has one truth." Of the draft's four quality questions, replication is built (`erq`, `erp`); "controlled for variables," "data available" and "falsifiable" are not fields on a finding. (Falsifiability exists at the belief level as the Falsifiability Test and Testable Predictions sections.)
- **The app** does almost literally what the draft says: `computeEvidenceImpactScore(evs, linkage) = clamp(EVS x linkage x 10, 0, 100)`, with `EVS = ESIW x log2(ERQ + 1) x ECRS x ERP` (`calculateEVS`) over five tiers: T0 0.05 (retracted or fraudulent), T1 1.0 (peer-reviewed or official), T2 0.75 (expert or institutional), T3 0.5 (journalism or surveys), T4 0.25 (opinion or anecdote), unknown tier 0.5.
- **Proposed elsewhere:** [`docs/EVIDENCE_QUALITY_SCORING.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/EVIDENCE_QUALITY_SCORING.md) specifies `Evidence Impact = Quality Score (0-100) x Linkage Score (0-1)` with quality from four methodology patterns. No engine reads it, and the method page lists "Evidence quality from four ratings (internal validity, statistical soundness, replicability, bias resistance)" among the rules the site does not run.
- **Displayed, not scored:** the wiki's own Overall EVS, `ESIW x ECRS x ERQ x ERP/100` summed over a page's findings, is computed by `evidence.evs()` and printed in every Evidence Ledger "for comparison; no score reads it" (the method page's [EVS note](https://myklob.github.io/ideastockexchange/beliefs/method.html#evs)).

#### Automation through logic templates

To eliminate "Walls of Text," the draft has the ISE use structured forms and templates to gather potential assumptions and evidence:

- **Evidence Submission Forms:** Users cannot simply comment. They must fill out a form that categorizes their evidence (Statistical, Logical, Observational) and explicitly states their methodology claims. **Partly built.** The site's contribution form is structured (no free comments), and an `evidence` row carries Source, URL and Date checked. It has **no field for the evidence category**: `etype`, `erq` and `erp` are page columns, and [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) contains no handling for them. So a finding a reader submits starts at `p0 = 0.50` with weight `k` and moves nothing until an author classifies it.
- **Assumption Mapping:** stated and unstated, load-bearing or non-essential. **Partly built**, as described under [Where the assumptions live](#where-the-assumptions-live): the fields exist, the flag is typed, the reasons are not posted.
- **Challenge Sub-Exchanges:** When a challenge is made (e.g., "Your sample size is too small"), that challenge becomes its own nested debate. If the challenge is validated, the Quality Score of the evidence drops, which automatically triggers a recalculation of the Belief's total score. **Built, by a different route.** On the site the challenge is a reason to disagree on the finding's own page (which lowers its truth) or on the row's linkage page (which lowers `Link`). Either one lowers the row's contribution, and the belief above it recomputes on the next build. What it cannot lower is the typed tier itself, because the tier is not a page. "Your sample size is too small" therefore argues the finding down rather than reclassifying it.

---

### Automatic score updates

The 2025 promise:

- Scores dynamically **recalculate** when related assumptions are strengthened or weakened.
- Keeps results aligned with **current, most reliable evidence**.
- Prevents outdated data from influencing decision-making.

The 2026 draft asked for more: "The backend must support real-time recursive updates. If a piece of evidence is debunked, every belief that relies on that specific piece of evidence must have its **Truth Score** updated instantly."

#### On the site: recomputed in full on every build

**Replaced.** There is no runtime and no server. Every number is a pure function of the tables, so "recalculate" means rebuild: [`pages.yml`](https://github.com/myklob/ideastockexchange/blob/master/.github/workflows/pages.yml) runs on every push to `master`, and [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) starts it (`gh workflow run pages.yml`) after a vote lands. Before it publishes anything, CI checks the CSVs match the workbook (`sync_content.py --check`), runs the circular-argument check (`integrity.py`), the full test suite, the template and wiki-template checks, and the conformance contract (`conformance.py --print --check`). A debunked finding therefore reaches every belief that relies on it at the next build, minutes rather than instantly, and the change is in git with a reason attached.

**What moved is published.** [`changes.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/changes.py) rebuilds the previous revision from `git show HEAD~1:content/*.csv` and subtracts. Its page (`changes.html`) lists rows added, removed and edited column by column, and every page whose truth or confidence moved, sorted by the size of the move, with `truth_before`, `truth_after`, `delta`, `conf_delta` and a `crossed` flag when a page changed sides of 0.5. CI checks out with `fetch-depth: 2` so there is something to compare. If git or the previous revision is missing the page is left out rather than published wrong. The limit, stated on the method page: "A number that drifts across twenty revisions drifts invisibly," because it compares against the previous revision only.

**What would move, ahead of time.** [`sensitivity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py) answers "what if an assumption were strengthened or weakened" before anyone does it. "This is the question a budget office actually asks." Every input beneath a page is pinned at 0 and at 1 and the page re-read; where the conclusion crosses `FLIP = 0.5`, the flip point is found by bisection to `STEPS = 16` (about 1.5e-5); an input that moves the answer less than `INERT = 0.005` is marked inert; the sweep looks `DEPTH = 6` levels down and every page says how many inputs sit deeper. The page's table has two columns that matter: "Move" (how far the page shifts between the input false and the input true, with everything else, confidence included, as it is) and "If settled" (the same distance with that input's confidence held at 1), because "the gap between Move and If settled is the value of doing that work." The caution printed beside it: "this is one-at-a-time analysis. It finds single points of failure. It does not find the case where three inputs each move a little in the same direction, which is how correlated assumptions actually fail." See the method page's [sensitivity section](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity).

#### In the app: propagation on write

**Built.** The app stores scores and pushes changes upward when something changes. [`propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts) opens with the promise this page made: "When you strengthen or weaken an underlying fact, the algorithm automatically updates the score of every conclusion connected to it." On a change it recomputes the belief's truth, then every argument where that belief is the reason, `impactScore = sign x truthScore x |linkageScore| x importanceScore x uniquenessScore x 100`, then the parent's stability score, and recurses upward with a visited set against cycles. It is called from mutation points such as a new piece of evidence or a linkage vote (`propagateFromArgumentChange`, `propagateFromLinkageChange`). That is the 2026 draft's "real-time recursive updates," in the app.

#### Current, most reliable evidence

**Partly built.** "Most reliable" is the evidence tier: the eighteen weights above, the bounded replication reward, and the agreement share. The `grounding` component of confidence reads the tier too. **"Current" has no implementation on the site**: nothing in the engine reads a date. Intake stamps a `checked` date (and `url`, `added_by`, `added`) into a submitted row's extra cell (`PROVENANCE` in `ise_tables.py`), and interest pages carry a `latest` column; both are displayed and read by nothing.

#### Keeping outdated data out

**Refused by design on the site.** There is no recency, decay or lifecycle factor. The method page lists the wiki's "Lifecycle multipliers (active 1.0, weakened 0.7, conditional 0.8, outdated 0.3, refuted 0.1)" under [rules the site does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun), with what runs instead: "None. A row argued false scores below zero through 2 x Truth - 1." So an outdated finding stops counting in one of two ways: its own page is argued down, or its `erp` (the share of replications agreeing) is lowered when newer replications fail, which drags `p0` below 0.5. A scraped or model-asserted "staleness" number is also refused, because every number on the site must link to a page that argues it.

The design reason, as the code states it, is that an automatic penalty with no page behind it cannot be audited. A 1998 finding that still replicates is not outdated, and a 2025 finding that never replicated is not current in any useful sense. Age is a proxy; the agreement share is the thing itself.

**The app has a lifecycle.** `VERIFICATION_SCORES` in [`src/core/reasonrank/types.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/reasonrank/types.ts) weights an evidence row by standing:

| Standing | Counts at |
|---|---|
| `VERIFIED` | 1.0 |
| `UNVERIFIED` | 0.5 |
| `DISPUTED` | 0.5 |
| `FALSIFIED` | 0.0 |

Mark a source falsified and its contribution drops to zero and the propagation above carries that upward. [`evidence-exposure.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/evidence-exposure.ts) then reports, before anything is retracted, how much of a belief's score rests on evidence whose standing nobody has established: 0.5 x |impact| for an unverified or disputed row, and 1.0 x |impact| for a row with no status at all (legacy rows predate the lifecycle and keep full weight, so they carry the largest exposure, deliberately). "A belief drawing 40 points from three studies reads exactly like one drawing 40 points from three studies nobody has checked." It is the app's answer to "outdated data": not a date, but a standing.

---

### Facilitating evidence-based discussions

The 2025 promise:

- A hub for **fact-driven debate**.
- Allows policymakers, researchers, and the public to:
  - Share evidence
  - Challenge assumptions
  - Collaboratively refine policy proposals

#### The hub, without a server

**Built, through GitHub.** Every table on every page carries a form underneath it that is a plain GET to a prefilled GitHub issue form ([`contribute.yml`](https://github.com/myklob/ideastockexchange/blob/master/.github/ISSUE_TEMPLATE/contribute.yml), with 35 table sections to choose from; `belief.yml` for proposing a belief; `vote.yml` for votes). Readers without an account get a "Copy as text" path. The path a contribution takes:

1. **As you type,** [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) checks the claim against `data/claims_index.json` (written from the full tables, drafts included), so a duplicate is caught before it is filed.
2. **On the issue,** the intake Action runs [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py), which re-checks with the same similarity engine. At or above `MERGE = 0.70` the submission counts as the submitter's vote for the claim already there, and if that claim is not yet a row on the target page, a pull request adds just that row. Between `FLAG = 0.45` and `MERGE` the rows are added and the near matches listed for the maintainer.
3. **A circular argument is refused** (`cycles_in_tables`), because a loop "can hold any value at all and stay consistent."
4. **Otherwise a pull request** opens with the new rows, and `check.yml` runs the full suite on it before merge.

**Sharing evidence: partly built.** Covered above: Source, URL and Date checked are carried and stamped; the evidence tier is not settable from the form.

**Challenging assumptions: partly built.** Rows can be added to the `component` and `assumption` sections by form, and readers can vote on whether a claim bears on a page. But the load-bearing flag, the thing that makes an assumption count, is not settable by the form (intake has no `lb` handling), and assumption rows carry no score. A challenge that has an effect today is a reason to disagree on the assumption's own page, which lowers its truth and, if it is load-bearing, caps the conclusion.

**Collaboratively refining proposals: built.** A proposed belief (`belief.yml`: The belief, Topic, A reason to agree, A reason to disagree, Source) becomes new rows and a pull request. Nothing drafted is deleted, so refining means adding rows and re-ranking, never removing.

#### Votes: attention, never validity

**A vote never moves a score on the site, by design.** `NO_MOVE` in `intake.py` says so on every issue comment ("A vote never moves a score; the page shows it next to what the analysis says, as what people think"), and `VOTE_NOTE` in `render_site.py` says so on every page. `test_no_vote_moves_any_score` in [`test_render.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_render.py) asserts truth and belief score are identical with and without `votes.csv`. The reason, from the code: "a claim nobody has argued is worth exactly nothing, however many people like it."

Votes are kept in `content/votes.csv` (one row per person and claim, latest wins; 2 rows at the current revision), shown on the heading line after the score badge with a link to each vote's issue, and once `MIN_VOTERS = 3` people have voted on a claim, a home card ranks the gap between the vote share and the truth score ([lists](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes)). That gap is the owner's direction made visible: popular tracked apart from what holds up, and the distance between them is where people need more time with the argument.

#### The app: fallacy votes weighted by a track record

The 2026 draft proposed: "**ReasonRank Algorithm:** This is the core of the meritocracy. Users earn **ReasonRank** by accurately identifying methodological flaws. If your challenge is upheld by the network, your credibility goes up. If you rely on an 'Appeal to Authority' without substance, your ReasonRank drops."

**Not on the site, where ReasonRank means something else.** The site's ReasonRank is a page's share of a damped walk from the beliefs; it scores claims, never people, and there is no user record anywhere in the scoring path.

**Built in the app, under a different name, for fallacy claims only.** [`calibration.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/calibration.ts) gives each user a credibility multiplier for their votes on fallacy claims:

```
multiplier     = clamp(accuracyFactor x balanceFactor, 0.3, 1.4)
accuracyFactor = 2 x accuracy        (share of your resolved claims the community upheld; neutral 1.0 below 3 resolved)
balanceFactor  = 0.4 + 0.9 x sideBalance    (neutral 1.0 below 5 flagged)
sideBalance    = (min(a, b) + 1) / (max(a, b) + 1)   over claims filed against agree-side and disagree-side arguments
```

"Filing volume never raises it; only being right and being even-handed do." So it rewards accuracy, as the draft wanted, and adds something the draft did not ask for: a penalty for only ever seeing fallacies on the other side. Anyone can fetch exactly how a contributor's weight is derived at `/api/contributors/[userId]/track-record`. A fallacy claim resolves at `CONSENSUS_THRESHOLD = 0.6` of weighted votes with a quorum of `CONSENSUS_QUORUM = 3`; when upheld, its counter-argument is published into the linkage sub-debate and scores propagate.

That last step is where the app departs from the owner's direction: there, a credibility-weighted vote decides whether a counter-argument counts, which is a vote reaching validity. On the site it cannot happen.

---

### Transparency and accessibility

The 2025 promise:

- The database and scoring system are **open to public review**.
- Transparent methodology allows **scrutiny, replication, and validation**.
- Builds **trust** in the policy-making process.

#### Open to review

**Built.** The two tables, topics and votes go out beside the site in five shapes, compared row by row by `TestEveryExportCarriesTheSameTwoTables` in `test_render.py`:

| File | What it is |
|---|---|
| `data/ise.json` | The tables as JSON |
| `data/ise.xml` | The tables as XML |
| `data/schema.sql` | The schema (PostgreSQL; notes for MySQL 8), with foreign keys and views |
| `data/ise_data.sql` | The rows as SQL inserts |
| `data/ise.sqlite` | A loaded SQLite database |

The SQLite file carries analyst views: `page_uses`, `page_start`, `page_coverage`, `page_one_sided`, `page_inert`, `evidence_ledger` and `page_orphan` (`SCHEMA` in [`export_db.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/export_db.py)). So `sqlite3 ise.sqlite 'select * from page_inert'` lists the pages nothing would move. Each page's computed numbers also go out as `p/<key>.json` (truth, confidence, starting point and its weight, what it rests on, ReasonRank, work value, checks, sensitivity, citation), indexed at `data/pages_index.json`, plus `data/claims_index.json` and `data/drafts.json`. The source tables are in the public repository as `content/pages.csv`, `edges.csv`, `topics.csv` and `votes.csv`. See the method page's [data section](https://myklob.github.io/ideastockexchange/beliefs/method.html#data).

#### Scrutiny, replication and validation

**Built.**

- **Scrutiny.** [The method page](https://myklob.github.io/ideastockexchange/beliefs/method.html) is generated from the live modules, so it "cannot describe a rule the site is not running." It prints [the formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula), [the starting points](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts), [the confidence weights](https://myklob.github.io/ideastockexchange/beliefs/method.html#confidence), [the constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants), [ReasonRank](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank), [the structural checks](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks), [the rules it does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun) and [what it cannot do](https://myklob.github.io/ideastockexchange/beliefs/method.html#limits). Every belief page ends with a Scoring Engine table, each quantity with a "How" cell, plus the typed inputs it reads but does not compute.
- **Replication.** "Cite this page" prints the claim, page key, truth, confidence and "revision <short sha> of <commit date>" from git; a build outside a checkout says "revision unidentified" rather than dropping the line. Anyone can check out that revision and rebuild the same numbers. `TestThePublishedNumbersAreReproducible` holds published precision to the engine's tolerance.
- **Validation.** [`conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py) states the scoring contract in eight numbered rules (starting point, confidence, row contribution, POS and NEG, argued truth and belief score, the load-bearing cap, importance pages, media pages), ships a corpus that exercises each (25 pages and 26 edges at the current revision), checks the five constants and eighteen tiers against the engine, and compares at `TOL = 1e-9`. A port in any language can be held to it without reading this repository. It is published as `data/conformance_corpus.json` and `data/conformance_expected.json`, and CI runs it before publishing.

#### Trust

**Asserted by nobody, earned by disclosure.** The code does not claim to build trust. It prints a section called "What this cannot do," introduced with "A methodology without this section is marketing." Its entries:

| Limitation | What it says |
|---|---|
| Votes are counted and shown, and never scored | The behavioural half of confidence carries zero weight |
| The evidence classifications are a judgement call | A typed tier can move a claim "from 0.65 to 0.95," and a wrong call is not visible as a disagreement |
| One-at-a-time sensitivity misses correlated failure | "The failure mode most likely to matter in a real decision" |
| The duplicate detector reads words, not meaning | "It will miss a paraphrase that shares no vocabulary, which is the case that pads a score most effectively" |
| Some inputs are typed, not computed | Magnitudes, evidence classifications, value rankings, criterion labels, the load-bearing flag, topic-axis positions |
| The bottom line on a page is typed by the author | "Read it as a comment on the tables, not a result of them" |
| The sensitivity sweep stops a fixed number of levels down | Each page says how deep it looked |
| The revision page compares against the previous revision only | Drift across many revisions is invisible |
| The duplicate detector has a work limit | What it could not examine is named |
| A truth score is not a probability | "Nothing here has been checked against outcomes" |
| The corpus is small | Live counts of pages, beliefs and topics, "written by very few people" |

For a page about evidence-based policy, that last pair is the honest close: the site has not yet tested whether its own scores predict anything.

---

## Why this matters

Evidence-based policy improves:

- **Decision quality**: grounded in measurable facts.
- **Public trust**: via open and transparent evaluation.
- **Adaptability**: policies evolve as evidence changes.

Right now, the 2026 draft adds, policy is often driven by ideology or "Expert Consensus" that collapses under pressure. The Idea Stock Exchange provides an **Evidence-Based Policy Framework** that is:

- **Transparent:** You can see exactly which study is carrying the weight of a policy.
- **Auditability:** Anyone can pull on the argument chain to see where it breaks.
- **Antifragile:** The system gets stronger as more people challenge it. By rewarding valid dissent, we ensure that policy is grounded in arguments that have actually survived the "pressure test" of scrutiny.

What each claim rests on today:

| Claim | Status | What runs |
|---|---|---|
| Decision quality, grounded in measurable facts | **Partly built** | Evidence is the only way a score moves, and 243 of 4,263 pages declare a tier. Costs and benefits are typed point estimates: expected value = the typed magnitude x the truth of the cost or benefit's own page, nets added within one unit only, and 0 of 218 cost-benefit rows state a low and high range (the check "Costs and benefits given as single figures" says so). See the method page's [cost-benefit section](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba) and [[Likelihood of Costs and Benefits]] |
| Public trust, via open evaluation | **Built** | The exports, the method page, the vote-versus-analysis gap card. Trust is asked for by showing where people and analysis disagree, not by merging them |
| Adaptability, as evidence changes | **Built** | Full recompute on every build, the revision page, and the standing rule that nothing drafted is deleted |
| Transparent: which study carries the weight | **Built** | Every row shows its contribution and its factors; the Evidence Ledger lists each finding's starting point with the arithmetic filled in (`evidence.label`, ending with "tier weight ...; starting point 0.5 + 0.5 x ... = ...; weight ... = ...") |
| Auditability: where the chain breaks | **Built** | The sensitivity sweep names the single input that would flip a page, and ReasonRank's work value names the unfinished pages everything rests on |
| Antifragile: rewarding valid dissent | **Partly built** | A reason to disagree that survives argument lowers the score on the site, and the confidence component `two_sided` rewards a page for having one. Nothing rewards the *person* on the site; the app's fallacy credibility multiplier does, for fallacy claims |

---

## Summary

The Idea Stock Exchange supports evidence-based policy by:

1. **Structuring and linking conclusions to assumptions.** Built as two flat tables; assumptions link through a typed load-bearing cap, and the Necessity Score is proposed.
2. **Scoring arguments with quantitative metrics.** Built, with six factors rather than the three the 2025 page named, plus an evidence starting point that is the only thing able to move a score.
3. **Automatically updating scores as new evidence emerges.** Replaced on the site by a full recompute on every build with a published diff; built in the app as propagation on write. Keeping outdated data out is refused on the site in favour of arguing it false.
4. **Enabling collaborative, fact-driven discussions.** Built through GitHub issue forms; votes shown, never scored; a reader cannot yet classify a finding.
5. **Ensuring transparency and accessibility.** Built: five data shapes, per-page JSON, a conformance contract, and a methodology page with a limitations section.

By embedding these principles into the platform, policy decisions can become **more informed, less partisan, and better aligned with real-world evidence**. "Less partisan" has a concrete implementation: interests are filed by the group that holds them, the interests page groups stakes by party, and every belief page's Interests section says "the same suspicion applies to both sides," with symmetric Supporters and Opponents tables (Rule 7, "Symmetry Between Supporters and Opponents," in [`docs/BELIEF_PAGE_RULES.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/BELIEF_PAGE_RULES.md)). "More informed" and "better aligned with real-world evidence" are outcomes nothing on the site measures yet, as its method page says.

---

## The 2026 draft's technical requirement specification, item by item

The draft addressed "a team of data scientists, logicians, and programmers." Every requirement it stated, with what the code did:

| Requirement (2026 draft) | Status | What the code does instead or as well |
|---|---|---|
| **Database architecture:** "a highly relational database (e.g., PostgreSQL or Neo4j for graph-based links) to manage the nesting of ideas" | **Replaced** | Two flat tables in CSV, exported with a PostgreSQL-flavoured schema and a loaded SQLite file. No database server runs for the site. The app uses Prisma on SQLite |
| **Belief IDs:** "Every belief is assigned a UUID and nested within specific categories (e.g., Science > Medicine > Inoculations)" | **Replaced** | Pages carry an integer tab number and a text key (`public-policy-driven-data`). Categories are the `topics` table with a `parent` column, one topic per belief: `science` and `medicine` both exist as topic keys. The app's `Belief` ids are autoincrement integers |
| **Assumption Database:** "A dedicated table for text classified as assumptions, linked to their parent Belief IDs" | **Built, as rows** | `component` and `assumption` rows in `edges`, keyed by their page |
| **Evidence Packets:** "the source, the methodology claims, and the current scores" | **Partly built** | A finding is a page with `etype`, `erq`, `erp` and rows with `source`; its scores are computed and published in `p/<key>.json`, never stored |
| **NLP Parser:** "An AI module to scan 'Walls of Text' and suggest potential unstated assumptions to be reviewed by the community" | **Not wired** | [`src/core/ai/`](https://github.com/myklob/ideastockexchange/blob/master/src/core/ai/README.md) holds a Python and TypeScript framework for LLM-generated analysis that no route imports, and two of its files (`main.py`, `services.py`) do not parse. The site refuses any number a model asserts, so a suggestion would have to enter as a row people argue, not as a score |
| **ReasonRank as user credibility** | **Not on the site; partly in the app** | Site: ReasonRank ranks pages by dependence. App: a credibility multiplier in [0.3, 1.4] on fallacy-claim votes |
| **Scoring Integration:** "real-time recursive updates" when evidence is debunked | **Site: replaced by rebuild. App: built** | See [Automatic score updates](#automatic-score-updates) |

---

## Mechanisms in this area neither text mentions

Things the code does that bear on evidence-based policy and that neither the 2025 page nor the 2026 draft described:

- **Nine structural checks** ([`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py)), each naming the rows that set it off and moving no score. Serious: "Circular support," "Assumes its own conclusion" (a load-bearing premise rests on the claim, or is argued the same at equivalence 0.90 or more). Worth checking: "The same page listed more than once," "Rows that may be the same point twice," "Rests only on authority or experience," "Evidence filed above the premise it bears on," "Costs and benefits given as single figures." A note: "Nothing stated would show it false," "Nobody has argued the other side." The two serious ones are also refused outright by the scorer, and CI runs the cycle check first.
- **The fallacy flagger** ([`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py)): nine patterns (Attacking the person, Appeal to popularity, Appeal to authority, Slippery slope, False choice, Sweeping generalization, Appeal to tradition, Pointing at the other side, After therefore because of), each a question with the words that set it off, argued on the flagged claim's page, moving no score.
- **Evidence filed above its premise.** The structural check that explains most of today's 0.50s: a belief that cites findings and argues higher than it reads, held down by a load-bearing premise beneath it that cites nothing. Re-filing the finding under the premise it supports would fix it, and changes what the argument says, so it is an editorial act (open decision 2 in CLAUDE.md).
- **Cost-benefit expected value** with low and high bands, worst case taking every benefit at its low end and every cost at its high end, and benefit-to-cost printed only when everything is in one unit. This is the "choices of action" half of the owner's direction.
- **Crux ranking, in the app** ([`decision-leverage.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts), shown as section 1c of the app's belief page): ranks a belief's argument edges by the points of conclusion score still at stake on each, `weight x openRange x 100`, where `weight = |linkage| x importance x uniqueness x 0.5^depth` and `openRange` is a weighted shortfall over four gaps: evidence 0.40, linkage 0.25, scoring 0.15, examination 0.20. It is the app's counterpart to the site's work value: where the next piece of evidence would buy the most.
- **The pro-share fix in the app.** `calculateTruthScoreBreakdown` in [`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts) used to average every argument's weight regardless of side, so one strong objection could raise a belief's logical validity from 0.600 to 0.775. It now takes the pro share of argued weight.

---

## The owner's direction, and where the code differs

From CLAUDE.md and [`docs/WIKI_AUDIT.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/WIKI_AUDIT.md), October 2026. The goal is a score that promotes good ideas and demotes bad ones in the real world; whatever rule does that best wins, and a new rule is published beside the current one and compared on real pages rather than swapped in unseen.

| Direction | The site today | The app today |
|---|---|---|
| **Volume.** Count truly independent reasons, weigh pro against con, count contributions from the moment they are posted. For choices of action, cost and benefit across every legitimate interest | The argued rule counts an unargued row as 0; `tally.py` follows the direction and is printed beside it, read by no other number. Cost and benefit by interest is the "Who gains, who pays" table | `ProRank / (ProRank + ConRank)` counts listed reasons |
| **Votes.** Attention, never validity; popular tracked apart from what holds up | Matches: votes shown, never scored, gap card at 3 voters | Credibility-weighted fallacy votes decide whether a counter-argument is published, which reaches validity |
| **Fallacies.** Software may flag; nothing is final; a flag is argued like any claim and moves no score | Matches: `fallacy.py` flags, forms argue, no score moves | `scoreArgument` multiplies base truth by `1 - sum of |impact|/100` over detected fallacies |
| **Linkage.** Start trusting, fall when argued down, rise when argued well | Matches: `DEFLINK = 1`, a linkage page argued like any other | Defaults `linkageScore` to 0.1 |
| **Evidence.** Prefer no ceiling; `tally.py` uses ESIW x ERQ x ERP/100 uncapped | The argued rule bounds the starting point to [0.05, 0.95] and its weight to 2k; the tally rule is uncapped | `log2(ERQ + 1)` is uncapped but slow; evidence impact is clamped to [0, 100] |

---

## Open decisions for the owner

Calls rather than bugs. The owner asked not to be asked again at the level of detail the audit raised, so these are listed as what is unresolved, not as questions:

1. **Which rule leads the page.** The site's signed rule, the tally rule printed beside it, or the app's `A / (A + D)`. To be settled by comparing them on real pages (CLAUDE.md open decision 1).
2. **Dated evidence.** Keep "argue it false, or lower its `erp`," add a dated rule (a rule change: `conformance.py --write`, a reviewed diff, a pinned test), or add a structural check that names old findings and moves no score. The app's verification lifecycle is a fourth option, and the site has none of it.
3. **Uniqueness.** Keep it argued-only with a lexical reading queue, wire the computed similarity in as the app does, or let a flagged and unargued pair cap the pair's combined weight as a middle rule.
4. **Assumptions.** Keep the typed load-bearing flag, add an argued necessity page per premise (like a linkage page), or give assumption rows their own scored pages so "challenge an assumption" has a target.
5. **Who classifies evidence.** Author only (today), add `etype`, `erq`, `erp` and `lb` to the contribution form, or make the tier itself an argued page as the EVS wiki asks. Until one of these, a reader-submitted finding moves nothing.
6. **The load-bearing cap at 0.50.** It holds most beliefs at 0.50, which is correct as probability and at odds with the direction on counting contributions from the start (CLAUDE.md open decision 6).

---

## Related pages

- [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]]: the argued-truth rule in full.
- [[Evidence Verification Score (EVS)]]: the evidence starting point and every competing evidence table.
- [[Evidence to Conclusion Relevance Score]] and [[Linkage Scores]]: the `Link` factor.
- [[Equivalency Score:]] and [[The Redundancy Problem]]: uniqueness and the duplicate detector.
- [[Confidence Stability Scores]]: the seven components.
- [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]]: the walk and the work value.
- [[Assumptions]]: the load-bearing flag and the proposed Necessity Score.
- [[Argument Scores from Sub-Argument Scores]]: how a finding's truth travels upward.
- [[Likelihood of Costs and Benefits]] and [[Likely Interests of Those Who Agree and Disagree]]: the choices-of-action half.
- [[Pros and Cons on the Same Page]] and [[One Page per Debate Topic]]: why every claim gets one page and both sides.
- [[Automated Conflict Resolution Platform]] and [[Electronic Democracy]]: the same machinery aimed at disputes and at elections.
- [[Template: Belief Analysis]] and [[Template: Linkage Evaluation]]: the page shapes the evidence lands in.
- [[Home]]
- Live: [the home page](https://myklob.github.io/ideastockexchange/beliefs/index.html), [the methodology page](https://myklob.github.io/ideastockexchange/beliefs/method.html), [the topic list](https://myklob.github.io/ideastockexchange/beliefs/topics.html), the [Evidence and process](https://myklob.github.io/ideastockexchange/beliefs/t/evidence-and-process.html) topic, and the worked example, [Public policy should be driven by data and measurable outcomes rather than by ideology](https://myklob.github.io/ideastockexchange/beliefs/p/public-policy-driven-data.html).
