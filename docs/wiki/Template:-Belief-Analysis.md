# Template: Belief Analysis

> Generated from [`templates/belief-analysis-template.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/belief-analysis-template.html) by `tools/wiki_templates.py`. The HTML file is the template; edit it, not this page. CI regenerates this page and refuses a copy that has drifted.

**Kind:** Page template  
**Purpose:** One belief, every section in the canonical order: argument trees, evidence ledger, objective criteria, falsifiability and predictions, logical anatomy, costs and benefits, the conflict resolution framework, media, law, general to specific, similar beliefs, definitions, people on the record, what the page needs, what the numbers are made of. The source of truth for section order.  
**Rendered by:** tools/static-site/render_site.py (a belief page on the built site); src/app/beliefs/[slug]/page.tsx with src/features/belief-analysis/components/*  
**Live example:** https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html  

**Currency rules.** `tools/check_templates.py` refuses a template that uses the retired column names Argument Score or Evidence Score (the current names are Truth, Importance and Linkage), an em dash, an empty anchor, or an address that looks like an email; a topic template must carry the four magnitude bands Modest, Moderate, Strong and Total and treat engagement as a section, not a continuum. CI runs it on every change under `templates/`, and `tools/wiki_templates.py --check` refuses a wiki copy that differs from the HTML.

Square-bracketed text is a placeholder for the author to fill; a token with underscores, such as [Truth_Score], is a slot the software fills. A score cell is blank until a real page stands behind it. Each table on the built site carries a form that files a row in it; a form cannot be submitted from a wiki page, so the forms are left out here.

---
> **Builder notes**
>
> ===== ISE BELIEF PAGE MASTER TEMPLATE (July 2026 revision, layout update 2) =====
> Canonical rules: see docs/BELIEF_PAGE_RULES.md.
> This template is the source of truth for section order and structure. It is
> mirrored by the React implementation in src/app/beliefs/[slug]/page.tsx and the
> section components in src/features/belief-analysis/components/*. If you change
> this template, update that rulebook AND the React implementation. The three
> must stay in sync.
>
> HARD RULES (every generation must follow):
>   1. NO summary / background / hook / overview at the top. Header metadata, then
>      straight to Argument Trees. The single truth score on the heading line is the
>      only number above the arguments: no other score and no verdict is announced
>      before them. The readout of what the numbers are made of comes after What
>      This Page Needs Right Now.
>   2. Definitions go LAST among analysis sections, never first.
>   3. Argument cells are complete, atomic propositions whose pro/con direction is
>      evident from the cell alone: the claim, the single most famous supporting
>      quote inline (italic, small), then the submitter as ~Name.
>   4. Arguments are NOT Evidence. Citations, stats, and studies go in the Evidence
>      Ledger, not in argument cells, and every evidence item names what it BEARS
>      ON: a specific argument (by its opening words) or this belief directly.
>   5. No broken links. Check every href before publishing; use plain text if the
>      target page doesn't exist.
>   6. Score cells stay blank until real sub-argument scoring exists. No "+0"
>      placeholders. Readout cells marked auto-derived are computed from the
>      tables above them, never hand-picked. A typed number (Prevalence, a cost or
>      benefit estimate) carries its source or stays blank, and every typed input
>      is labelled typed where it appears (position on the topic axis, criteria
>      labels, value ranks, the load-bearing flag, the bottom line).
>   7. Supporters and Opponents get symmetric structure everywhere.
>   8. Every table sorts by its rank key, descending. Rows enter and rank only by
>      the performance of their pro/con sub-arguments, never by editorial
>      placement. The rank key is the rightmost score column: Impact for arguments
>      and evidence, Expected Value for costs and benefits, Gap for shared values,
>      Equiv for similar beliefs, and Score everywhere else. In the ISE software each
>      table shows its top five rows and collapses the rest until expanded.
>   Also: spell words out, no abbreviated column headers, no cryptic placeholder
>   tokens. Underscored [Bracketed_Tokens] are machine-replaceable substitution
>   slots; keep the underscores AND keep every word readable.
>
> CANONICAL SECTION ORDER:
>   Breadcrumb (Home › Topics › Category › This Belief)
>   Header (Belief / invitation block / metadata: Topic > Subcategory · Position on
>       the topic axis (typed, not scored) · Used on: the page this belief is a row
>       on). The heading line's single truth score is the only number above the
>       arguments.
>   1.  Argument Trees (scored two-sided table: Argument / Score / Confidence /
>       Linkage / Importance / Uniqueness / Impact, spelled out, no abbreviations;
>       Pro+Con totals, Net Belief Score line). A row contributes
>       sign x (2 x Truth - 1) x Confidence x Linkage x Importance x Uniqueness,
>       so a reason nobody has argued sits at Truth 0.50 and reads exactly 0.
>       Confirmed fallacy claims are noted inline in the
>       argument cell and damage exactly the factor their type targets
>       (relevance → Linkage, formal → the validity component of the Argument
>       Score, evidence → Evidence Quality); unconfirmed accusations change
>       nothing. In the software every score cell is a doorway: Score opens the
>       child belief, Linkage the linkage debate, Importance the importance
>       sub-belief, Impact the provenance page.
>   1b. Contrast Class (software only; the denominator: mutually exclusive rivals
>       this belief is priced against). Only when the topic has a rival option set.
>   1c. Decision Leverage (software only; Argument / Leverage / Weight / Open / What
>       would settle it / Status; engine-ranked, omitted when every edge is settled)
>   1d. What Would Change the Answer (the sensitivity sweep: # / Input / Its truth /
>       Confidence / If false / If true / Move / If settled / What it does here;
>       engine-computed, omitted when nothing sits beneath the page)
>   2.  Evidence Ledger (two-sided: Supporting / Weakening, each with
>       Evidence (Producer, Year) / Bears On / Source type / Standing / Confidence /
>       Linkage / Uniqueness / Impact; Source type is one of the engine's eighteen,
>       listed in the authoring notes with where each starts. Standing is software
>       only: the static site has no verification lifecycle, counts every row in
>       full as Unrecorded, and prints Starts at / Truth / Confidence / Linkage /
>       Importance / Uniqueness / Score / EVS instead)
>   3.  Objective Criteria (Criterion, with how it is measured and the reading
>       each side predicts under it / Score / Validity / Reliability / Linkage /
>       Importance / Latest Reading; the four labels are typed, not computed)
>   4.  Falsifiability Test (Evidence That Would Strengthen+Score / Weaken+Score,
>       plus the "if nothing could falsify this" note row)
>       + Testable Predictions (two tables, Follows If the Belief Is True and
>       Follows If the Belief Is False, each Prediction (timeframe and how it is
>       checked under it) / Result So Far / Confidence / Linkage / Importance /
>       Contribution / At Stake)
>   5.  Logical Anatomy & Foundational Assumptions (logical form, Component
>       Claims table with Load Bearing (typed), Assumptions by Side with Scores)
>   6.  Cost-Benefit Analysis (Benefits table + Costs table: Claim / Category
>       (Units) / Magnitude / Range / Likelihood / Expected Value), then Net by
>       Category and Who Gains, Who Pays (built site), then Short vs. Long-Term
>       Impacts (with Scores)
>   7.  Conflict Resolution Framework (in the software it opens with the computed
>       Pipeline readout, the scored cost-benefit trees read sideways)
>       a. Shared Values, Different Rankings (Value / Supporters Rank / Opponents
>          Rank / Gap / Why; ranks typed; + what-would-shift row)
>       b. Likely Interests of Supporters (Interest, a need with a subject, with
>          Measured By and Prevalence under it / Validity / Drives / Score /
>          Value; Score = Validity x Drives)
>       c. Likely Interests of Opponents (symmetric)
>       d. Shared and Conflicting Interests (Shared Interests with Score + the
>          computed Primary Conflict Pair line: the highest Validity x Drives
>          interest on each side)
>       e. Best Compromise Solutions (with Score: interests satisfied)
>       f. Advertised vs. Actual Motivations (with Divergence Score)
>       g. Dispute Types (Factual / Definitional / Values / Linkage, the
>          computed kind of dispute marked)
>       h. Primary Obstacles to Resolution (with Scores)
>       i. Biases (with Scores)
>   8.  Media Resources (two-sided: Work / Type / Bears / Quality / Influence /
>       Importance / Score; shown, not counted)
>   9.  Legal Framework (Supporting+Score / Complicating+Score)
>   10. General to Specific Belief Mapping (Upstream / Downstream, each
>       Support+Score / Oppose+Score)
>   11. Similar Beliefs (More Extreme+Equiv / More Moderate+Equiv, scored by
>       equivalency; near-100% paraphrases go in prose as merge candidates,
>       not in the table)
>   11a. Ways of Saying the Same Thing (built site; Wording / Characters /
>       Equiv / Verdict; the shortest wording whose equivalence holds stands in
>       where space is short)
>   11b. Where This Belief Is Used (what-links-here; the static site calls it
>       Where This Page Is Used)
>   11c. Score History (software only; the accumulation ledger)
>   12. Definitions (Term / Definition / Score, defined operationally), last
>       analysis section
>   12b. People on the Record (On record agreeing / Source / On record
>       disagreeing / Source: where the position was stated, with date; history,
>       never weight; omit when empty)
>   13. What This Page Needs Right Now (# / The gap / Where it goes / Who is best
>       placed to fill it)
>   14. What the numbers are made of (the readout, formerly the Scorecard: Net
>       Belief Score · Pro vs. Con / Bottom line / Strongest pro+con [auto-derived:
>       top-ranked row from each side of the Argument Trees] / What would move
>       this score most [auto-derived: top-scoring Falsifiability row] / the row
>       formula; in the software also the collapsed twelve-dimension engine
>       readout) + "How to read this page" box. It sits here, after the
>       arguments, because no score or verdict is announced before them.
>   14b. Add to This Page (the participation block: one form per table on the
>       built site, vote links on the heading line; a vote never moves a score)
>   14c. Structural Checks (built site; Finding / How serious / What it means;
>       faults the shape of the argument shows, none of which moves a score)
>   14d. Scoring Engine and Cite This Page (built site; Quantity / Value / How,
>       a list of what an author typed, then a citation naming the revision)
>   15. Contribute / footer
>   16. Related Topics (the category cluster; current page as plain text; the
>       static site calls it Related Beliefs)
>   The static site may also follow Definitions with Not filled in yet, Structural
>   Checks and Scoring Engine, which list or derive rather than analyse (Rule 1).

Home (`/`) › Topics (`/topics`) › [Category] › [This Belief]

AUTHORING RULES (hidden text; leave in place, readers never see this): state the belief in positive form so the page headlines the supported claim. Every argument cell must be a complete, atomic proposition whose pro/con direction is evident from the cell alone. Never fill a score cell for an empty item. All scores stay [bracketed] until the ReasonRank engine computes them. Every table sorts by its rank key, descending; rows enter and rank only by the performance of their pro/con sub-arguments, never by editorial placement. Every row in every table is a scored relationship between this belief and the row's content; the software renders each table's top five rows and collapses the rest, so a row's position always traces to its score. Every evidence item must name what it bears on: a specific argument above, identified by its opening words, or this belief directly. Cells of the readout (What the numbers are made of) marked auto-derived are computed from the tables above it, never hand-picked. Arguments fail logically and go in the tree; evidence fails empirically and goes in the ledger. Spell words out: no abbreviated column headers, no cryptic placeholder tokens. Underscored [Bracketed_Tokens] are machine-replaceable substitution slots; leave the underscores so a script can find them, but keep every word readable. An Importance of [0.50] is the default that means not yet differentiated, the neutral start rather than a penalty or a claim of importance either way; differentiate it whenever the material supports doing so. Never ship an unverified link: check every href before publishing, and when a target page does not exist, use plain text rather than a dead link. When publishing an instance of this template, delete any section that would ship with nothing but blank cells; empty scaffolding is not analysis, and a short correct page beats a long blank one. When migrating an old page, preserve its filled content somewhere on the new page (People lists go to People on the Record; equivalent phrasings go to Similar Beliefs) rather than deleting it. INVITATION BLOCK: the boxed block under the H1 names an itch the reader already feels, asks the one question this page dissects, says why this is not a feed, and names one specific slot a newcomer can fill in five minutes; it never asks "what do you think," it invites the reader who disagrees, and it passes the reciprocity test (it names a behavior, never a tribe, so it would read the same to either side). OBJECTIVE CRITERIA: each criterion is a belief with its own page and its Score is that page’s truth; it also carries four labels (validity, reliability, linkage, importance) typed by the author, which no score reads; the Reading That Would Strengthen and the Reading That Would Weaken must differ from each other, and every page includes at least one deliberately failing criterion scored low with its reasons, because a rubric with no failing example does not show readers where the line is. WHAT THIS PAGE NEEDS: the table above Contribute names concrete gaps (a missing counterargument stated as the shape of the argument wanted, an evidence slot, an unfilled criterion reading), each with where it goes and who is best placed to fill it; update it as gaps fill. ADD TO THIS PAGE: the block between that table and Contribute is the participation block; on the built site every table that takes rows carries a form like it, the heading line carries Agree and Disagree vote links after the score, and a vote is shown and never counted, because a claim nobody has argued is worth nothing however many people like it. ROW FORMULA: a row in the Argument Trees or the Evidence Ledger contributes sign x (2 x Truth - 1) x Confidence x Linkage x Importance x Uniqueness to the page above it. Truth is the row's own page score on 0 to 1; a claim nobody has argued sits at 0.50, so (2 x Truth - 1) is 0 and the row reads exactly 0, however famous the claim. Confidence is how much of the work behind that page has been done (0 to 1); a claim with no page contributes 0. Linkage, Importance and Uniqueness are each argued on a page of their own and read a labelled constant until then (Linkage 1, Importance 0.5, Uniqueness 1). Nothing on this page can be padded by listing more. SOURCE TYPES: the Evidence Ledger's Source type cell holds one of the engine's eighteen types, and the type sets where a finding's truth starts before anyone argues it (the weight is how far that kind of source can move it; a finding every replication confirms starts at 0.5 plus half the weight, one every replication contradicts starts at 0.5 minus half the weight, and one at half agreement starts at 0.50 whatever its type): Statistics and data, with the source cited (statistics, 0.90, starts at 0.95) / Primary official record: statute, judicial holding, agency rule, sworn filing (record, 0.90, starts at 0.95) / Randomized controlled trial (rct, 0.85, starts at 0.925) / Meta-analysis (meta, 0.80, starts at 0.90) / Observational or correlational study (observational, 0.75, starts at 0.875) / Historical trend, with references (historical, 0.70, starts at 0.85) / Expert testimony with supporting data (expert_data, 0.65, starts at 0.825) / Expert or social media claim (expert_claim, 0.60, starts at 0.80) / Personal experience or anecdote (anecdote, 0.55, starts at 0.775) / Common sense or logic (logic, 0.50, starts at 0.75) / Analogy or metaphor (analogy, 0.45, starts at 0.725) / Cultural norm (norm, 0.40, starts at 0.70) / Intuition or gut feeling (intuition, 0.35, starts at 0.675) / News or media report (news, 0.30, starts at 0.65) / Survey or poll (survey, 0.25, starts at 0.625) / Eyewitness testimony (eyewitness, 0.20, starts at 0.60) / Visual evidence (visual, 0.15, starts at 0.575) / Historical artifact (artifact, 0.10, starts at 0.55). A finding with no source type named starts at 0.50 exactly and pulls nothing either way. Classify what the claim says, not the instrument that produced it: a published poll result is a statistic, what the public believes inferred from it is a survey. TYPED INPUTS: cost and benefit estimates and their ranges, Prevalence (interest tables), each finding’s source type, replications and share agreeing, the four criteria labels, the supporters’ and opponents’ value ranks, the load-bearing flag, the position on the topic axis and the bottom line are typed by a person, not computed; each is labelled typed where it appears, a typed number carries its source in the cell or in a parenthetical, and a typed number without a source stays blank. The bottom line is the one sentence that is not computed: label it as typed, and where every row on the page scores 0, say so beside it. No em dashes anywhere on the page; use commas, parentheses, or separate sentences.

# Belief: [Insert Belief Statement Here] Truth score [Truth_Score]

The truth score on the heading line is the only number above the arguments; what it is made of is read out after What This Page Needs Right Now. It stays [bracketed] until the engine computes it.

[HOOK: one or two sentences naming an itch the reader already feels. Concrete, not abstract. No throat-clearing.]

[QUESTION: one sentence ending in a question mark, stating exactly what this page dissects. Answerable, not rhetorical.]

[PROMISE: one or two sentences on why this is not a feed. One belief, both sides, ranked by how well arguments hold up rather than how often they are repeated, permanent, and open to revision by anyone with a better argument.]

If you disagree, this page has a column for you. [ASK: name one specific slot a newcomer can fill in five minutes: an empty con row, a missing counterexample, an unproposed criterion. Never "what do you think?"]

Topic: [Category] > [Subcategory] · Position on the topic axis (typed, not scored): [-100 to +100] · Used on: [The page this belief is a row on]

# 🔍 Argument Trees (`/algorithms/reason-rank`)

Each argument is a belief with its own page, and its Score is that page’s truth score. A row contributes sign × (2 × Truth − 1) × Confidence × Linkage (`/algorithms/linkage-scores`) × Importance (`/algorithms/importance-score`) × Uniqueness (`/algorithms/unique-scores`), and that is the Impact column. A reason nobody has argued sits at Truth 0.50, so it reads exactly 0: listing a claim is worth nothing until it is argued. Confidence is how much of the work behind the argument’s page has been done; Uniqueness is whether this row makes a point no other row has made. Pro and con impacts sum to the Net Belief Score. A true-but-irrelevant argument scores high on truth and near zero on linkage, so it contributes nothing. Confirmed fallacy claims feed these factors too: a community-confirmed fallacy damages exactly the factor its type targets (relevance fallacies hit Linkage, formal fallacies hit the validity component of the Truth Score, evidence fallacies hit Evidence Quality) and is noted inline in the argument cell. A fallacy accusation that has not been confirmed changes nothing.

**✅ Reasons to Agree / ❌ Reasons to Disagree**

| Argument | Score | Confidence | Linkage (`/algorithms/linkage-scores`) | Importance (`/algorithms/importance-score`) | Uniqueness (`/algorithms/unique-scores`) | Impact | Argument | Score | Confidence | Linkage (`/algorithms/linkage-scores`) | Importance (`/algorithms/importance-score`) | Uniqueness (`/algorithms/unique-scores`) | Impact |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| [Claim]. *"[most famous quote]"* ~Name | [Score] | [Confidence] | [Linkage] | [Importance] | [Uniqueness] | [Impact] | [Claim]. ~Name | [Score] | [Confidence] | [Linkage] | [Importance] | [Uniqueness] | [Impact] |
| Pro Total: |   |   |   |   |   | [Pro_Total] | Con Total: |   |   |   |   |   | [Con_Total] |

Net Belief Score = Pro Total + Con Total = [Net_Score]. [Net_Score_Interpretation]

---

> **Builder notes**
>
> DECISION LEVERAGE: the argument table read sideways. Every row is an edge
>     from the tree above, ranked by the points of conclusion score still at
>     stake on it (transmission weight x unresolved range). Engine-computed from
>     existing scores; never hand-ranked. Omit this whole block when every edge
>     is settled (nothing at stake). See /algorithms/decision-leverage.
>     SOFTWARE ONLY: the ISE software computes it; the static site does not, and
>     its What Would Change the Answer section below answers the same question.

# 🎯 Decision Leverage (`/algorithms/decision-leverage`) (software only)

Which argument is worth settling next. Leverage is the points of conclusion score still at stake on one edge: Weight (how much of a change in that reason transmits to this conclusion: \|linkage\| × importance × uniqueness × 0.5depth) × Open (how much about that reason is still unresolved: evidence, linkage votes, opposition, scoring). High where an argument both carries the conclusion and rests on little. An upper bound on movement, not a forecast, direction is unknown, which is why the edge is worth investigating.

| Argument | Leverage | Weight | Open | What would settle it | Status |
|---|---|---|---|---|---|
| [Argument label] (supports\|opposes) | [L] | [W] | [O] | [Needs evidence \| Linkage undebated \| No opposition yet \| Sub-debate unscored] (links where that gap closes) | Crux |
| [Argument label] (supports\|opposes) | [L] | [W] | [O] | [Widest gap] | Load-bearing |

[N] cruxes carry [TOTAL] points of unsettled score. The largest single gap is “[Top argument]” at [L] points. [When one edge holds more than half of it: one edge holds most of what is unsettled, so the verdict here is fragile.]

---

> **Builder notes**
>
> WHAT WOULD CHANGE THE ANSWER: the sensitivity sweep. Every claim beneath this page
>     is held at false and then at true, one at a time, and the whole graph is recomputed.
>     Engine-computed from the same two tables as every other number; never hand-ranked.
>     Omit this whole block when nothing sits beneath the page for the answer to rest on.
>     The static site computes it; the ISE software does not yet.

# ⚖ What Would Change the Answer

Every claim beneath this page held at false and then at true, one at a time, with the whole graph recomputed each time. If false and If true are where this page’s truth score lands; Move is how far apart they are. If settled is that same distance with the input’s confidence held at 1, which is what it would be worth once the work behind it is finished, so the gap between Move and If settled is the value of doing that work. An input that moves this page by less than 0.005 is inert: nothing anyone could learn about it changes the answer. This is one input at a time and finds single points of failure; it does not test several inputs moving together, which is how correlated assumptions actually fail.

| # | Input | Its truth | Confidence | If false | If true | Move | If settled | What it does here |
|---|---|---|---|---|---|---|---|---|
| 1 | [Claim beneath this page] ([argument \| evidence \| linkage \| importance]) | [Truth] | [Confidence] | [If_False] | [If_True] | [Move] | [If_Settled] | [Flips the conclusion at Truth [Flip_Point] \| Moves it without flipping it \| Inert] |

Not shown: [N] further inputs, each moving it less than any row shown · [M] inputs sit deeper than [D] levels and were not swept. [When one input alone can flip the conclusion: the verdict here rests on one claim; settle that one first.]

---

# 📊 Evidence Ledger (`/algorithms/evidence-scores`)

***Source type is what kind of thing the finding is, one of the eighteen the engine knows, and it sets where the finding’s truth starts before anyone argues it: statistics and data with the source cited, primary official record, randomized controlled trial, meta-analysis, observational study, historical trend, expert testimony with data, expert or social media claim, personal anecdote, common sense or logic, analogy, cultural norm, intuition, news report, survey or poll, eyewitness testimony, visual evidence, historical artifact (strongest first; the authoring notes list where each starts). Classify what the claim says, not the instrument that produced it. A finding with no source type named starts at 0.50 and pulls nothing either way. A row counts as sign × (2 × Truth − 1) × Confidence × Linkage × Importance × Uniqueness, the same rule as the arguments above, so a finding nobody has argued or sourced reads exactly 0. Standing is the verification lifecycle: Verified rows count in full, Unverified and Disputed at half, Falsified at nothing, Unrecorded (no status on record) in full. Standing is kept by the software only; where no lifecycle is recorded every row is Unrecorded and the column is left off. Format each item as: Finding (Producer, Year). Evidence is data that can fail empirically; a reason that can only fail logically is an argument and belongs in the tree above, not here. Every item must also name what it bears on: a specific argument above, identified by its opening words, or this belief directly. Evidence that bears on nothing contributes nothing, no matter how true it is.*

**✅ Supporting Evidence / ❌ Weakening Evidence**

| Evidence (Producer, Year) | Bears On | Source type | Standing | Confidence | Linkage (`/algorithms/linkage-scores`) | Uniqueness (`/algorithms/unique-scores`) | Impact | Evidence (Producer, Year) | Bears On | Source type | Standing | Confidence | Linkage (`/algorithms/linkage-scores`) | Uniqueness (`/algorithms/unique-scores`) | Impact |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|   | [Argument’s opening words / this belief] | [Statistics and data / Primary official record / Randomized controlled trial / Meta-analysis / Observational study / Historical trend / Expert testimony with data / Expert or social media claim / Personal anecdote / Common sense or logic / Analogy / Cultural norm / Intuition / News report / Survey or poll / Eyewitness testimony / Visual evidence / Historical artifact] | Unverified |   |   |   |   |   | [Argument’s opening words / this belief] | [Statistics and data / Primary official record / Randomized controlled trial / Meta-analysis / Observational study / Historical trend / Expert testimony with data / Expert or social media claim / Personal anecdote / Common sense or logic / Analogy / Cultural norm / Intuition / News report / Survey or poll / Eyewitness testimony / Visual evidence / Historical artifact] | Unverified |   |   |   |   |

> **Builder notes**
>
> RETRACTION EXPOSURE: engine-computed from the Standing column above.
>     Include only when something is actually at risk.

Retraction exposure. [X] of the [Y] points this belief draws from evidence ([N]%) rest on standing nobody has established. [K rows are counted in full with no verification on record.] [Above half: More than half of the evidence case is unearned; read the score as provisional.]

# 🎯 Objective Criteria (`/algorithms/objective-criteria`)

These are the measurements that would settle this debate if both sides committed to them in advance. Pick the standard first, then check the result: that is what keeps the verdict tied to the world instead of to whoever argues loudest. The best criteria are specific enough that supporters and opponents would predict *different* readings. A criterion both sides expect to come out the same way tests nothing. See Applying "Getting to Yes" Principles.

| Proposed Criterion, and the Reading Each Side Predicts | Score | Validity | Reliability | Linkage | Importance | Latest Reading |
|---|---|---|---|---|---|---|
| [Criterion]<br>How it is measured: [method]<br>A reading that would strengthen the belief: [reading]<br>A reading that would weaken it: [reading] |   | [High / Medium / Low] | [High / Medium / Low] | [High / Medium / Low] | [High / Medium / Low] |   |
| *[Failing criterion: at least one criterion that does not work, scored low, with reasons. A page that lists only good criteria has not shown anyone where the line is.]*<br>[why it feels relevant and is not: both sides predict the same reading, or the reading tracks something other than the claim. Say which.] | [low] | Low |   | Low |   |   |
| Validity, Reliability, Linkage and Importance are labels typed by the author, not computed, and nothing reads them; Score is the criterion page’s own truth. The Latest Reading column is the open invitation. It stays blank until somebody fills it with a sourced number, and filling one does more for this page than a hundred people agreeing with it. Missing a criterion entirely? Propose one (`/contact`) with your reasons for its validity, reliability, linkage, and importance, and say what reading would cut against your own position. The community scores it. |   |   |   |   |   |   |

# 🧪 Falsifiability Test

Evidence rarely proves or disproves anything outright; it strengthens or weakens. List the strongest realistic score-movers in each direction, and be as specific as a bet: what result, from what kind of source, by when? Each row’s Score is the performance of its own pro/con sub-debate: if this evidence appeared, would it actually move this belief?

| Evidence That Would Strengthen | Score | Evidence That Would Weaken | Score |
|---|---|---|---|
|   |   |   |   |
| *If no realistic evidence could falsify this belief, say so here and note what that implies about the strength of the claim.* |   |   |   |

## 🔮 Testable Predictions

If this belief is true, what should the world show us that it would not show us otherwise? If it is false, what should we see instead? A belief that predicts nothing cannot be evaluated, only asserted. Each prediction that comes true or fails feeds back into the belief score above.

**Follows If the Belief Is True**

| Prediction | Result So Far | Confidence | Linkage | Importance | Contribution | At Stake |
|---|---|---|---|---|---|---|
| [If this belief is true, we should observe…]<br>By when, and how it is checked: [timeframe and verification method] |   |   |   |   |   |   |

**Follows If the Belief Is False**

| Prediction | Result So Far | Confidence | Linkage | Importance | Contribution | At Stake |
|---|---|---|---|---|---|---|
| [If this belief is false, we should observe…]<br>By when, and how it is checked: [timeframe and verification method] |   |   |   |   |   |   |

Prediction contribution [Prediction_Contribution] · points at stake [At_Stake] · [Share]% of predictions are dated and have a linkage reading of 0.50 or more. A pending prediction sits at 0.50 and contributes nothing yet; At Stake for a row = Confidence × Linkage × Importance × Uniqueness × (1 − \|2 × Truth − 1\|), what it would add once settled.

# 💡 Logical Anatomy & Foundational Assumptions (`/algorithms/assumptions`)

A belief statement that reads as one claim is usually several claims wearing one sentence. Split it into its parts, type each part, surface what it silently assumes, and mark which parts are load-bearing. If the belief is a chain of ANDs, it is exactly as strong as its weakest load-bearing part.

Logical form: [This belief] = [Part 1] AND [Part 2] AND ([Part 3] OR [Part 4])

| Component Claim (stated or implied) | Type | Stated? | Load Bearing (typed) | Truth | What it silently assumes |
|---|---|---|---|---|---|
|   | [Empirical / Causal / Definitional / Normative] | [Stated / Implied] | [Yes, if the belief does not survive this part being false] |   |   |

Weakest load-bearing component [Weakest] · argued truth [Argued_Truth] · truth score [Truth_Score] · product of load-bearing truths [Product], shown for comparison and read by nothing. Which components are load-bearing is typed by the author, not argued; the Necessity Score is not computed.

## Assumptions by Side

| Required to Accept This Belief | Score | Required to Reject This Belief | Score |
|---|---|---|---|
|   |   |   |   |

# ⚖ Cost-Benefit Analysis (`/cba`)

Every cost and benefit is itself a debatable claim with its own argument tree, and every row must survive three questions: compared to what, measured in what units, and how likely? Magnitude is an estimate in explicit units, typed by the author, with a low and a high end wherever one can be given. Likelihood is the truth score of that claim’s own page, computed from how its pro and con arguments score, never assigned by gut. Expected Value = Magnitude × Likelihood. Keep unlike categories (dollars, life-years, people-hours, freedom) in separate rows and subtotal only within a category; converting across categories is itself a debatable claim, so if you do it, state the conversion out loud (e.g., the value of a statistical life). Method per the canonical cost-benefit analysis (`/cba`) page and Sunstein’s *The Cost-Benefit Revolution*.

**✅ Benefits**

| Benefit Claim (links to its own page; who gains under it) | Category (Units) | Magnitude | Range | Likelihood | Expected Value |
|---|---|---|---|---|---|
|   | [dollars / life-years / hours / freedom] |   | [Low] to [High], or none stated |   |   |
| Subtotal (within each category only): |   |   |   |   |   |

**❌ Costs and Risks**

| Cost Claim (links to its own page; who pays under it) | Category (Units) | Magnitude | Range | Likelihood | Expected Value |
|---|---|---|---|---|---|
|   | [dollars / life-years / hours / freedom] |   | [Low] to [High], or none stated |   |   |
| Subtotal (within each category only): |   |   |   |   |   |

> **Builder notes**
>
> NET BY CATEGORY and WHO GAINS, WHO PAYS: built site. Both are computed from the two
>     tables above and never typed.

## Net by Category

| Units | Benefit Expected Value | Cost Expected Value | Net |
|---|---|---|---|
| [dollars / life-years / hours / freedom] |   |   |   |

## Who Gains, Who Pays (by interest)

| Interest | Benefit Expected Value | Cost Expected Value | Net | Units |
|---|---|---|---|---|
| [An interest from the tables below that collects a benefit or pays a cost] |   |   |   |   |

Expected Value = Magnitude × Likelihood, where Likelihood is the truth score of the cost or benefit’s own page. Nets add only within one unit; a page priced in two units shows two nets and no single one. The band under a net takes every benefit at its low end and every cost at its high end. The estimate and its range are typed by the author; a row that states one figure and no range is marked, because a single number is not an estimate a decision can be checked against.

## 🎯 Short vs. Long-Term Impacts

| Short-Term (0-2 Years) | Score | Long-Term (5+ Years) | Score |
|---|---|---|---|
|   |   |   |   |

# 🤝 Conflict Resolution Framework

Both sides of most debates share the same values. They disagree about how to rank them, and that ranking shifts based on perceived costs, benefits (`/cba`), and likelihood of success (`/cba`). The conflict readout below is the scored cost-benefit trees above, read sideways. See Interest Scoring Methodology, Focusing on Interests, Not Positions, and Conflict Resolution Scoring for the pipeline math.

## ⚖ Shared Values, Different Rankings

Both sides hold these values. The disagreement is about priority order, not whether each value matters. Rankings shift when new evidence (`/algorithms/evidence-scores`) changes perceived costs/benefits (`/cba`) or likelihood of success (`/cba`). The value the two sides rank most differently usually is the primary conflict pair scored further below.

| Value | Supporters Rank (typed) | Opponents Rank (typed) | Gap | Why Rankings Differ on This Issue |
|---|---|---|---|---|
| [Value 1] |   |   |   |   |
| [Value 2] |   |   |   |   |
| [Value 3] |   |   |   |   |
| The two rank columns are typed by the author; Gap is the difference between them and the only typed input to the computed kind of dispute (Dispute Types, below). What would shift these rankings? [What evidence, cost-benefit findings, or likelihood changes would cause either side to re-rank?] |   |   |   |   |

## 💡 Likely Interests of Supporters

Each interest is a need with a subject (who needs what), argued two ways that never borrow from each other. Validity asks whether the need should be honored, and is settled on the interest’s own page by the mirror test: would the side accept the same need honored for its opponents, and what happens if everyone pursues it? Who holds the need, how many of them there are and how much power they have never count. Drives asks whether this need is really why the side holds its position, settled by the side’s record, not its rhetoric (the scoring methodology calls it Linkage Accuracy). Score = Validity × Drives, and the table ranks by it. Prevalence is typed by a person, not computed, so it carries its source in a parenthetical; a typed number without a source stays blank. A motive that is real and illegitimate stays in the table with its low validity, and the same suspicion applies to both sides. An interest shared by several beliefs has one page, built from the Interest Evaluation template, and every belief that lists it reads the same scores.

| Interest (a need with a subject; its page argues validity) | Validity | Drives | Score | Value |
|---|---|---|---|---|
| [Who] need [what].<br>Measured by: [what would show the need is met] · Prevalence (typed, with source): [share] ([survey or record, year]) |   |   |   | [Fairness / Accountability / Liberty / Security / ...] |
| *Pretextual / Low-validity (if any): real and illegitimate, scored rather than deleted* | [low] |   |   |   |

## 💡 Likely Interests of Opponents

| Interest (a need with a subject; its page argues validity) | Validity | Drives | Score | Value |
|---|---|---|---|---|
| [Who] need [what].<br>Measured by: [what would show the need is met] · Prevalence (typed, with source): [share] ([survey or record, year]) |   |   |   | [Fairness / Accountability / Liberty / Security / ...] |
| *Pretextual / Low-validity (if any): real and illegitimate, scored rather than deleted* | [low] |   |   |   |

## 🔗 Shared and Conflicting Interests

### Shared Interests (foundation for compromise)

| Shared Interest | Validity | Compromise direction it opens | Score |
|---|---|---|---|
|   |   |   |   |

### ⚔ Primary Conflict Pair (the ranking difference that drives this debate)

Primary conflict pair (computed: the interest with the highest Validity × Drives on each side) [Supporter interest] ([Validity] × [Drives]) against [Opponent interest] ([Validity] × [Drives]). [Share]% of the paired weight sits on the supporting side. This is the one disagreement actually driving the debate: the product uses validity on purpose, so a cover story cannot lead a side and neither can a worthy need nobody is moved by. Validity and Drives are different numbers; conflating them is a scoring error. Never typed: the line is read off the two interest tables.

## 🤝 Best Compromise Solutions

| Shared Premise Both Sides Accept | Proposed Synthesis | Why This Is Difficult | Score (interests satisfied) |
|---|---|---|---|
|   |   |   |   |

## 🎭 Advertised vs. Actual Motivations

|   | Supporters | Opponents |
|---|---|---|
| Advertised reason |   |   |
| Actual driver (if different) |   |   |
| Evidence for divergence |   |   |
| Divergence Score (performance of the sub-debate that advertised ≠ actual) |   |   |

## ⚖ Dispute Types

| Dispute Type | The Specific Disagreement | Evidence That Would Move Both Sides |
|---|---|---|
| Factual dispute [leading here, when computed] |   |   |
| Definitional dispute |   |   |
| Values conflict |   |   |
| Linkage dispute |   |   |

The kind leading here is computed from the tables above, never typed: [Factual dispute / Linkage dispute / Values conflict / Mixed dispute]. Evidence two-sidedness [X]% (the smaller of the evidence weight for and against, over the larger), linkage leaning against relevance [Y]% (the share of reasons whose linkage reads below 0.50), value-ranking gap [Gap] (divided by 3 and capped at 1 for the comparison). Whichever leads both others by at least 0.1 names the kind; otherwise it is a mixed dispute and no row is marked. A definitional dispute is not computed.

## 🚫 Primary Obstacles to Resolution

| Obstacles for Supporters | Score | Obstacles for Opponents | Score |
|---|---|---|---|
|   |   |   |   |

## ⚠ Biases

| Biases Affecting Supporters | Score | Biases Affecting Opponents | Score |
|---|---|---|---|
|   |   |   |   |

# 📚 Media Resources (`/media`)

**Supporting the Belief**

| Work (Author, Year) | Type | Bears | Quality | Influence | Importance | Score |
|---|---|---|---|---|---|---|
|   | [Book / Study / Report / Article / Film / Podcast / Video] |   |   |   |   |   |

**Challenging or Complicating the Belief**

| Work (Author, Year) | Type | Bears | Quality | Influence | Importance | Score |
|---|---|---|---|---|---|---|
|   | [Book / Study / Report / Article / Film / Podcast / Video] |   |   |   |   |   |

Each work has its own page where its quality and its influence are argued separately; whether it bears on this belief is a linkage page. Score = (2 × Quality − 1) × Bears × Influence × Importance, signed like every other row, so a work nobody has argued scores exactly 0. These rows are shown, not counted: the belief score is arguments, evidence and predictions only, because a book is a container for reasons rather than a reason.

# ⚖ Legal Framework

| Laws and Frameworks Supporting | Score | Laws and Constraints Complicating | Score |
|---|---|---|---|
|   |   |   |   |

# 🧮 General to Specific Belief Mapping

## 🔹 Most General (Upstream)

| Support | Score | Oppose | Score |
|---|---|---|---|
|   |   |   |   |

## 🔹 More Specific (Downstream)

| Support | Score | Oppose | Score |
|---|---|---|---|
|   |   |   |   |

# 🔄 Similar Beliefs (`/algorithms/combine-similar-beliefs`)

Equiv is the truth score of an equivalence page: how close each version sits to this belief. High-equivalency pairs are merge candidates; see combining similar beliefs (`/algorithms/combine-similar-beliefs`). Same-strength paraphrases (equivalency near 100%) go here in prose, not in the table: equivalent phrasings of this belief include [Phrasing 1] and [Phrasing 2], all merge candidates.

| More Extreme Versions | Equiv | More Moderate Versions | Equiv |
|---|---|---|---|
|   |   |   |   |

> **Builder notes**
>
> WAYS OF SAYING THE SAME THING: built site. Renders only when an equivalence page
>     connects this belief to another wording.

## Ways of Saying the Same Thing

| Wording | Characters | Equiv | Verdict |
|---|---|---|---|
| [A wording of this claim, linked to its own page] | [N] |   | [Same claim: may stand in for this page / Overlapping claim: keep both, name the difference / Distinct claim] |

Equiv is the truth score of the equivalence page that says the wording makes the same claim as this one. The shortest wording whose equivalence scores at least 0.90 stands in for this page where space is short.

# 📖 Definitions

Key terms used in this analysis, defined operationally (how would you measure it?), not philosophically. For ISE-wide definitions, see Explanation.

| Term | Definition Used in This Analysis | Score |
|---|---|---|
|   |   |   |

# 🗣 People on the Record

Recorded public positions, preserved for tracing the debate. In the ISE, who holds a belief never changes its score: author identity is orthogonal to the final score, so these names carry history, not weight. Each listing is itself a debatable claim that the person actually holds the position; annotate entries whose accuracy is contested. The Source column says where the position was stated (the bill, the floor statement, the column, the interview), with its date; a name with no source is a rumour, not a record. Omit this section when no notable positions are on record.

| On record agreeing | Source | On record disagreeing | Source |
|---|---|---|---|
| [Person] | [Bill, floor statement, column or interview, linked where it exists], [Date] | [Person] | [Bill, floor statement, column or interview, linked where it exists], [Date] |

## 🛠 What This Page Needs Right Now

Named gaps, updated as they fill. A strong entry in any of these raises the page’s score, and none of them require agreeing with the page.

| # | The gap | Where it goes | Who is best placed to fill it |
|---|---|---|---|
| 1 | [Strongest missing counterargument, stated as the shape of the argument wanted, not a topic label] | [Table and column] | [Someone who holds the opposing position] |
| 2 | [Evidence slot: a claim currently resting on argument alone that needs a study, record, or dataset] | Evidence Ledger | [Anyone with the source] |
| 3 | [A criterion nobody has proposed, or a proposed criterion that needs its first reading] | Objective Criteria, Latest Reading | [Anyone who can name a measurement both sides would accept in advance] |

> **Builder notes**
>
> WHAT THE NUMBERS ARE MADE OF: the readout, formerly the Scorecard. It sits here,
>     after the arguments and after What This Page Needs Right Now, because no score or
>     verdict is announced before the arguments; the single truth score on the heading
>     line is the only number above them. Every cell is computed from the tables above.

# 📋 What the numbers are made of

| Net Belief Score | [Net_Score] · Pro [Pro_Total] vs. Con [Con_Total] · brackets = placeholders until ReasonRank (`/algorithms/reason-rank`) computes live scores |
|---|---|
| Bottom line (typed by the author) | [One sentence, scoped to what the argument tree above actually supports. No bigger claim than the leaves can carry. It is the one sentence on the page that is not computed: read it as a comment on the tables, not a result of them. Where every row scores 0, say so beside it.] |
| Strongest pro / con | [Best pro argument] · [Best con argument] (auto-derived: the top-ranked row from each side of the Argument Trees) |
| What would move this score most | [The single piece of evidence that would most change the verdict] (auto-derived: the top-scoring row of the Falsifiability Test above) |
| How a row counts | sign × (2 × Truth − 1) × Confidence × Linkage × Importance × Uniqueness. A claim nobody has argued sits at Truth 0.50 and reads exactly 0, so no score here can be padded by listing more. Confidence is how much of the work behind the row’s page has been done; Linkage, Importance and Uniqueness each read a labelled constant until a page argues them. |

How to read this page: nothing here is placed by editorial choice. The heading line’s truth score is the only number announced before the arguments; this readout comes last so that nothing tells you what to conclude before you have seen what it rests on. Every row in every table is itself a claim, and its Score is the ReasonRank (`/algorithms/reason-rank`) performance of the pro/con sub-debate about that claim, computed recursively down to the evidence. Every table sorts by its rank key, best content first; the rank key is the rightmost score column: Impact for arguments and evidence, Expected Value for costs and benefits, Gap for shared values, Equiv for similar beliefs, and Score everywhere else. In the ISE software each table shows its top five rows and collapses the rest until expanded. [Bracketed] numbers are hand-estimated placeholders until the engine ships, and score cells stay blank until real content exists to score. This wiki can’t sort tables live; the score columns are the data contract that lets the software sort, filter, and collapse every table automatically.

## ✍ Add to This Page

Every table above takes rows from readers. On the built site each of those tables carries a form like the one below: type one complete sentence, and as you type the page shows the claims already on the site that say the same thing, so a duplicate becomes a vote for the claim already here instead of a second page. Submitting opens a prefilled GitHub issue; a free GitHub account is the cost. A check on GitHub then either records your vote or opens a pull request that adds your rows for the maintainer to merge.

The forms a built page carries, one per table: a reason to agree and a reason to disagree (Argument Trees), a finding (Evidence Ledger), a prediction (Testable Predictions), a criterion (Objective Criteria), a cost or benefit (What Acting On This Would Cost and Gain), an interest (Interests, Not Positions) and a new belief (Related Beliefs). A table with nothing in it yet gets a form for its first row, and every row of What This Page Needs Right Now links to the form it goes in. The heading line carries Agree and Disagree vote links after the score, with the counts once anyone has voted. Votes are shown as what people think, next to what the analysis says, and never move a score: a claim nobody has argued is worth nothing however many people like it.

> **Builder notes**
>
> STRUCTURAL CHECKS: built site. Faults the shape of the argument can show without
>     reading the prose. None of them moves a score. Renders only when one fires.

## Structural Checks

| Finding | How serious | What it means |
|---|---|---|
| [Circular support / Assumes its own conclusion / The same page listed more than once / Rows that may be the same point twice / Rests only on authority or experience / Evidence filed above the premise it bears on / Costs and benefits given as single figures / Nothing stated would show it false / Nobody has argued the other side] | [serious / worth checking / a note] |   |

Fallacy detection by pattern-matching the prose is not done: a score moved by a pattern match has no page to appeal to. A fallacy is argued as a reason to disagree on the linkage page of the row it infects.

> **Builder notes**
>
> SCORING ENGINE and CITE THIS PAGE: built site. Every value computed at build time,
>     followed by the list of what an author typed and a citation naming the revision.

## Scoring Engine

| Quantity | Value | How |
|---|---|---|
| Argument score / Evidence score / Prediction contribution / Belief score / Positive total / Negative total / Starting point / Weight of the starting point / Truth score, argued / Truth score / ReasonRank / Work value / Completeness |   | [One line each: the formula, with the numbers above filled in] |

Every value here is computed from the tables above at build time. What it reads but does not compute, because an author typed it: a position on the topic axis; the source type, replications and share agreeing on each finding; the four labels on each objective criterion; the supporters’ and opponents’ value rankings; the load-bearing flag on each component; the cost and benefit estimates and their ranges; the bottom line.

Cite this page: [Belief]. Idea Stock Exchange, belief page [Page_Key], truth [Truth_Score], confidence [Confidence]%, revision [Revision] of [Date].

# 📬 Contribute

Posted by ~Myclob. Contact me (`/contact`) to contribute to the Idea Stock Exchange.

[View the full codebase and technical documentation on GitHub](https://github.com/myklob/ideastockexchange) to understand the scoring algorithms, contribute to development, or adapt this system for your own use.

## 🔗 Related Topics

[Topic hub link] / related beliefs (list the sibling beliefs in this cluster; the current page appears as plain text, unlinked):

1. [Sibling belief 1]

2. [Sibling belief 2]
