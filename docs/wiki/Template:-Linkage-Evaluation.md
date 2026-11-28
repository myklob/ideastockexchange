# Template: Linkage Evaluation

> Generated from [`templates/linkage-evaluation-template.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/linkage-evaluation-template.html) by `tools/wiki_templates.py`. The HTML file is the template; edit it, not this page. CI regenerates this page and refuses a copy that has drifted.

**Kind:** Page template  
**Purpose:** One linkage: "If X were true, it would necessarily strengthen Y", argued pro and con. Its truth score is the Linkage factor of the row it belongs to; a row with no linkage page is presumed relevant (Linkage 1) until this page says otherwise.  
**Rendered by:** tools/static-site/build_pages.py (the linkage page a row opens); src/app/arguments/[id]/linkage  

**Currency rules.** `tools/check_templates.py` refuses a template that uses the retired column names Argument Score or Evidence Score (the current names are Truth, Importance and Linkage), an em dash, an empty anchor, or an address that looks like an email; a topic template must carry the four magnitude bands Modest, Moderate, Strong and Total and treat engagement as a section, not a continuum. CI runs it on every change under `templates/`, and `tools/wiki_templates.py --check` refuses a wiki copy that differs from the HTML.

Square-bracketed text is a placeholder for the author to fill; a token with underscores, such as [Truth_Score], is a slot the software fills. A score cell is blank until a real page stands behind it. Each table on the built site carries a form that files a row in it; a form cannot be submitted from a wiki page, so the forms are left out here.

---
> **Builder notes**
>
> ===== ISE LINKAGE PAGE MASTER TEMPLATE (July 2026, plain-words revision) =====
> Scores one linkage: whether X (an argument or piece of evidence) supports or
> weakens Y (the claim it was placed under), never whether X or Y is true on
> its own. Mirrored by the React implementation in
> src/app/arguments/[id]/linkage/page.tsx. If you change this template, update
> that page. The two must stay in sync.
>
> HARD RULES (every generation must follow):
>   1. The page title IS the linkage question, written in full words: "If [X]
>      were true, would it necessarily [support / weaken] [Y]?" Never use arrow
>      notation anywhere on the page; no symbols in place of words.
>   2. The question is asked at full strength ("necessarily"); the Linkage
>      Score answers by degree. 1.0 = Y must move if X is true; 0 = X can be
>      completely true and Y doesn't budge; in between = yes, but only if the
>      named assumptions hold.
>   3. Bridge-framing rule: every reason cell is a complete proposition about
>      whether X supports Y, its direction evident from the cell alone. A cell
>      arguing that X or Y is true or false is misfiled and belongs on X's or
>      Y's own page.
>   4. Audit lock: linkage scores are computed from the linkage argument tree,
>      never hand-assigned as final. The Check Table's provisional
>      estimate is a bracketed placement-time author bracket that the computed
>      score supersedes. The 0.7 flag threshold is a working heuristic.
>   5. Every table row ranks by its score, never by editorial placement; the
>      software shows each table's top five rows and collapses the rest.
>      Score cells stay [bracketed]/blank until computed.
>   6. The bold lead-in on each reason row is that row's pattern name (a
>      stored field, not decoration). The four patterns per side are starter
>      scaffolding, not fixed content or fixed order. Current pattern canon:
>      Mechanism / Necessity / Scope fit / Monotonicity vs. Missing step /
>      True But Irrelevant / Scope mismatch / Wrong parent.
>   7. Drift is signed: the rephrasing's linkage minus the canonical linkage.
>   8. Worked failure-mode examples with real names and real politics live
>      once, on the canonical Linkage Scores page, never in this template.
>   9. Spell abbreviations out at first use (Evidence-to-Conclusion (ECLS),
>      Argument-to-Conclusion (ACLS)). Underscored [Bracketed_Tokens] are
>      machine-replaceable slots.
>
> SECTION ORDER (October 2026: brought to the page the static site builds;
> sections marked software only are not on the built page):
>   Header (breadcrumb "[This Linkage]" / question-as-title H1 / answer-key
>   box / score-type-direction line / X and Y links / contribution / scope
>   note / when-a-page-is-warranted note)
>   1. Linkage Arguments (two stacked tables, "Reasons to agree/disagree that X
>      bears on Y", each # / Reason (pattern) / Truth / Confidence / Linkage /
>      Importance / Uniqueness / Score; a Pattern note under them; four starter
>      patterns per side)
>   2. Equivalent Rephrasings (software only; X table + Y table: equivalency,
>      linkage under phrasing, signed drift)
>   3. Check Table (built from the pages above: exact Y, exact X, how X bears on
>      Y in one sentence (typed), the computed linkage score, Flagged / Not
>      flagged below 0.7, the bottom line (typed))
>   4. Failure Mode Worked Examples (software only; generic pattern rows; real
>      examples live on the Linkage Scores hub)
>   5. Where Else X and Y Are Used (software only; other Ys for this X; other
>      Xs for this Y)
>   6. Hidden Assumptions Required and 7. Bias Risks Specific to This Linkage
>      (built when either has rows; hold / fail and inflate / deflate, scored)
>   8. Definitions and Scoring Concepts (the linkage question, the score, audit
>      lock)
>   9. Where This Page Is Used (Page / Table / As / Its truth: every page that
>      reads this linkage)
>   10. Scoring Engine (built site; Quantity / Value / How, then what an author
>       typed and a citation naming the revision)
>   11. Contribute
>
> WORDING STILL TO DECIDE: this template asks "would it necessarily support /
> weaken"; the static site currently titles the page "it would significantly
> strengthen / weaken". Which word stays is the owner's call; until then the
> two differ only in that word.

Home (`/`) › Linkage Scores (`/algorithms/linkage-scores`) › [This Linkage]

AUTHORING RULES (hidden; readers never see this). This page scores one linkage: whether X supports (or weakens) Y, never whether X or Y is true on its own. The page title IS the linkage question, written in full words; never use arrow notation anywhere on the page. The linkage question is asked at full strength: if X were true, would it necessarily [support / weaken] Y? The Linkage Score is the answer as a degree: 1.0 means yes, Y must move if X is true; 0 means no, X's truth leaves Y untouched; in between means yes, but only if the assumptions named on this page hold. BRIDGE-FRAMING RULE: every reason cell is a complete proposition about whether X supports Y, its direction evident from the cell alone; a cell arguing that X or Y is true or false is misfiled and belongs on X's or Y's own page. Build a dedicated linkage page only when the connection is contested or load-bearing; routine linkages stay as rows on the belief page, and each Linkage cell on a belief page links to its linkage page like this one. All scores stay [bracketed] until the ReasonRank engine computes them; never fill a score cell for an empty row. Every table row ranks by its score, never by editorial placement; the software shows each table's top five rows and collapses the rest. The bold lead-in on each reason row is that row's pattern name (a stored field, not decoration); the four patterns per side are starter scaffolding, not fixed content or fixed order. A provisional estimate entered in the software is an author's bracket that the computed score supersedes; linkage scores are never hand-assigned as final (audit lock). Drift is signed: the rephrasing's linkage minus the canonical linkage. Worked failure-mode examples with real names and real politics live on the canonical Linkage Scores page, never in this template; keep the pattern rows here generic. Underscored [Bracketed_Tokens] are machine-replaceable slots; spell all words out, no abbreviations and no symbols in place of words.

# If [X: short-form argument or evidence statement] were true, would it necessarily [support / weaken] [Y: short-form claim statement]?

That is the only question on this page. The Linkage Score is the answer, as a degree: 1.0 means yes, Y must move if X is true. 0 means no, X can be completely true and Y doesn't budge. Anything in between means yes, but only if the assumptions named below hold. This page never debates whether X or Y is true; each has its own page for that.

Linkage Score: [0.00–1.00] \| Type: [Evidence-to-Conclusion (ECLS) / Argument-to-Conclusion (ACLS)] (`/algorithms/linkage-scores`) \| Direction: [Supports / Weakens]  
Argument or Evidence X: [link to X's page once it exists], [X full statement]  
Claim Y: [link to Y's page once it exists], [Y full statement]  
Contribution to Y: [X argument score] × [linkage score] = [computed from sub-argument scores (`/algorithms/reason-rank`)]  
Scope note: [Optional. Use only when this linkage is easily confused with a different one between similar X and Y.]

A dedicated page like this exists because the connection is contested or load-bearing; routine linkages live as rows on the belief page, and every Linkage cell there links to its linkage page. Every bracketed number is a placeholder until ReasonRank (`/algorithms/reason-rank`) computes live scores; every table ranks by its score column, and the software shows each table's top five rows and collapses the rest.

# 🔗 Linkage Arguments

Every reason below is about whether X supports Y, not about whether X or Y is true. A claim that X is false belongs on X's page; a claim that Y is false belongs on Y's page. Each cell must read as a complete statement that makes sense on its own. The four rows per side are starter patterns; rows enter and rank by their own scores.

### ✅ Reasons to agree that X [supports / weakens] Y

| # | Reason to agree (pattern) | Truth | Confidence | Linkage | Importance | Uniqueness | Score |
|---|---|---|---|---|---|---|---|
| 1 | Mechanism: X leads to Y through a named pathway: [state the causal or logical mechanism in 1-3 sentences]. The bridge is direct, with few steps in between. |   |   |   |   |   |   |
| 2 | Necessity: There is no realistic way for X to be true without Y moving: [explain why every route from X ends at Y]. |   |   |   |   |   |   |
| 3 | Scope fit: X and Y cover the same people, place, and time, so nothing has to be stretched: [show the match]. |   |   |   |   |   |   |
| 4 | Monotonicity: More X consistently means more Y: [the relationship holds across the whole range and never flips]. |   |   |   |   |   |   |

### ❌ Reasons to disagree that X [supports / weakens] Y

| # | Reason to disagree (pattern) | Truth | Confidence | Linkage | Importance | Uniqueness | Score |
|---|---|---|---|---|---|---|---|
| 1 | Missing step: X only reaches Y if [hidden assumption] is also true. Without that step, X doesn't get there. |   |   |   |   |   |   |
| 2 | True but irrelevant: X can be completely true and Y doesn't budge: [why X has nothing to do with Y]. The most common linkage failure. |   |   |   |   |   |   |
| 3 | Scope mismatch: X is about a different population, scale, or time than Y. Stretching it across that gap requires an assumption nobody has stated. |   |   |   |   |   |   |
| 4 | Wrong parent: X really supports a different claim than Y: [name the claim it actually supports]. It sounds like it fits here, but it doesn't. |   |   |   |   |   |   |

Pattern: the bold lead-in names the shape of each reason. Mechanism: X leads to Y through a named pathway with few steps. Necessity: no realistic way for X to be true without Y moving. Scope fit: same people, place and time. Monotonicity: more X means more Y across the whole range. Missing step: X reaches Y only if a hidden assumption holds. True but irrelevant: X can be true and Y does not budge. Scope mismatch: X is about a different population, scale or time. Wrong parent: X really supports a different claim than Y.

*Linkage arguments are scored by the same recursive engine as belief arguments: a row contributes sign × (2 × Truth − 1) × Confidence × Linkage × Importance × Uniqueness, so a reason nobody has argued reads exactly 0. The Linkage Score is this page’s truth score: the agree share of the scored weight here, shrunk toward the 0.50 starting point by weight k. The wiki’s (Agree minus Disagree) / (Agree plus Disagree) form is 2 × this score − 1, once enough is argued here that the starting point no longer matters. See Argument Scores from Sub-Argument Scores (`/algorithms/reason-rank`).*

# 📝 Equivalent Rephrasings (software only)

If the same linkage holds across multiple phrasings of X and Y, it is logically robust. If it only holds under one phrasing, the linkage is rhetorical, not logical. Equivalency scores come from the Belief Equivalency Engine (`/beliefs`); if a rephrasing produces a substantially different linkage score, the linkage is fragile and that fragility itself is informative.

### Rephrasings of X (the argument or evidence)

| # | Rephrased X | Equivalency to canonical X | Linkage to Y under this phrasing | Drift |
|---|---|---|---|---|
| 0 | [Canonical X] | 1.00 | [Canonical_Linkage] |   |
| 1 | [Filler-stripped, plain language] |   |   |   |
| 2 | [Active voice, named actor and date] |   |   |   |
| 3 | [Mechanism-explicit form] |   |   |   |
| 4 | [Quantified form, where possible] |   |   |   |
| 5 | [Scope-narrowed form] |   |   |   |

### Rephrasings of Y (the claim being supported or weakened)

| # | Rephrased Y | Equivalency to canonical Y | Linkage from X under this phrasing | Drift |
|---|---|---|---|---|
| 0 | [Canonical Y] | 1.00 | [Canonical_Linkage] |   |
| 1 | [Filler-stripped, plain language] |   |   |   |
| 2 | [Active voice, named outcome] |   |   |   |
| 3 | [Mechanism-explicit form] |   |   |   |
| 4 | [Quantified form, where possible] |   |   |   |
| 5 | [Scope-narrowed form] |   |   |   |

Drift is signed and computed by the engine: the linkage score under the rephrased version minus the canonical linkage score. Negative drift means the linkage weakens under that phrasing; positive drift means it strengthens, which is common when a scope-narrowed claim links more tightly than the broad original. High drift in either direction means the linkage depends on specific wording. Low drift means the linkage survives translation, which is what we want.

# ✅ Check Table

Every placement of evidence under a claim, or argument under a parent argument, passes through these steps, answered from the pages above. Only the one-sentence bridge and the bottom line are typed; everything else is read from the pages it names. A linkage score is only as defensible as the check that produced it.

| Step | Question | Answer for this placement |
|---|---|---|
| 1 | Exact wording of Y, read from its page | [Verbatim. No paraphrase.] |
| 2 | Exact wording of X, read from its page | [Verbatim. No paraphrase.] |
| 3 | How X bears on Y, in one sentence (typed) | [If you cannot write this sentence cleanly, X probably doesn't bear on Y.] |
| 4 | Computed linkage score | [Score] from [N] reason(s) to agree and [M] to disagree. Computed from the tables above, never typed (audit lock). In the software an author may first enter a bracketed placement-time estimate and its dominant factor; the computed score supersedes it. |
| 5 | Flag if below 0.7 (a working rule of thumb) | [Flagged / Not flagged]. [If flagged: the action is to find better evidence for Y, not to reach with X.] |
| 6 | Bottom line, typed by the author after the tables above | [Optional. One sentence; the one cell here that is a judgement rather than a reading.] |

# 🔍 Failure Mode Worked Examples (software only)

Linkage failures fall into recognizable patterns. Naming them creates muscle memory: once you have seen a wrong-parent case dissected, you start spotting them everywhere. The rows below define the pattern shapes; fill them with examples from this linkage's own domain. Fully worked examples with real names live on the canonical Linkage Scores (`/algorithms/linkage-scores`) page, not in this template, so that one contested illustration never ships inside every page built from it.

| Failure Mode | X (evidence or argument) | Y (claim it was placed under) | Why the linkage fails |
|---|---|---|---|
| Wrong parent | [Real, well-documented X showing actor A violating constraint type 1] | [Y claiming actor A violates constraint type 2] | [X and Y run through different mechanisms and belong under different parents. The fluent reading is misleading; the correct parent for X is the type-1 claim.] |
| True But Irrelevant | [X that is well-evidenced and true] | [Y that X is supposed to support] | [Why the connection requires assumptions not in evidence.] |
| Scope mismatch | [X applies to a specific population, time, or context] | [Y is a broader or different-scope claim] | [Extrapolation requires an unstated similarity assumption.] |
| Missing step | [X] | [Y, where the chain from X to Y has uncertain middle links] | [Each missing step compounds uncertainty. Name the steps.] |
| Reversal at scale | [X is true at small scale] | [Y is the same claim at large scale] | [The relationship reverses or collapses outside the tested range.] |

# 🧭 Where Else X and Y Are Used (software only)

A linkage is a single connection, but the graph it lives in matters. The tables below show other places X is used to support claims, and other arguments used to support Y. Both tables rank by argument score (`/algorithms/reason-rank`), descending, which counts evidence quality and logical validity. Every row is itself a linkage with its own page like this one; in the software each row links to that page, so the graph is navigable in both directions. Vote ratio is a secondary view, never the default and never an input to any score.

### Other claims X is placed under

*Same X, different Y. Useful for spotting whether X is being applied consistently or stretched into places it does not belong.*

| Other Y (claim X also supports or weakens) | Linkage Score | Truth Score of that linkage |
|---|---|---|
| [Other Y, linked to that linkage's page] |   |   |
| [Other Y] |   |   |
| [Other Y] |   |   |

### Other arguments and evidence placed under Y

*Same Y, different X. Lets the reader see how this linkage compares to the other support Y is built on.*

| Other X (argument or evidence supporting or weakening Y) | Linkage Score | Truth Score of that linkage |
|---|---|---|
| [Other X, linked to that linkage's page] |   |   |
| [Other X] |   |   |
| [Other X] |   |   |

# 📜 Hidden Assumptions Required

If the Linkage Score is below 1.0, something must be true in addition to X for Y to follow. Naming those assumptions is half the work of evaluating any linkage: they are the exact distance between this linkage and "necessarily." Each assumption is itself a claim, scored by its own sub-debate. See the Assumptions page (`/algorithms/assumptions`).

| Required for the linkage to hold | Score | Required for the linkage to fail | Score |
|---|---|---|---|
|   |   |   |   |
|   |   |   |   |

# 🧠 Bias Risks Specific to This Linkage

Motivated reasoning expresses itself most clearly through linkage placement, not through claims themselves. People rarely invent evidence; they place real evidence under conclusions it does not support. The wrong-parent failure mode is exactly this pattern. Each bias risk is a claim about this linkage's editors and evidence, scored like any other. See the Bias page.

| Biases that inflate this linkage score | Score | Biases that deflate this linkage score | Score |
|---|---|---|---|
| [e.g., motivated reasoning toward Y] |   | [e.g., contrarian bias against Y] |   |
| [e.g., availability bias if X is recent and salient] |   | [e.g., scope insensitivity dismissing X's relevance] |   |

# 📖 Definitions and Scoring Concepts

The linkage question: If X were true, would it necessarily support (or weaken) Y? Asked at full strength; answered by degree.

Linkage Score: The degree to which the answer to the linkage question is yes: this page’s truth score, the agree share of the scored weight in the Linkage Arguments, shrunk toward the 0.50 starting point by weight k. The page Y reads it as the Linkage multiplier on X’s row. See Linkage Scores (`/algorithms/linkage-scores`).

The Type field changes the question. Prediction asks “if it were observed” (how diagnostic it is: a result both sides expect scores low). Interest makes this a bearing page: whether the row really speaks to an interest listed on its importance page. Media asks whether a work supports the conclusion at all.

Relevance fallacies: a straw man, whataboutism or attack on the person is a reason to disagree on this page, scored like any other row. An accusation with no support changes nothing.

Evidence-to-Conclusion (ECLS) vs. Argument-to-Conclusion (ACLS): Evidence-to-Conclusion Linkage connects a study or data point to a conclusion. Argument-to-Conclusion Linkage connects a logical claim to a conclusion. The check table applies to both.

Contribution to parent: An argument's effect on its parent claim equals Truth Score × Linkage Score. A perfect argument with a 0.3 linkage contributes less than a moderate argument with a 0.9 linkage. See Argument scores from sub-argument scores (`/algorithms/reason-rank`).

Equivalency Score: How similar two phrasings of the same statement are. Used in the rephrasings table to test linkage robustness. See the Belief Equivalency Engine (`/beliefs`).

Drift: The rephrasing's linkage score minus the canonical linkage score, computed by the engine. Signed: negative weakens, positive strengthens.

Audit lock: Linkage scores are computed from sub-arguments, never assigned by hand. A provisional estimate entered in the software is a placement-time bracket, not a score. If the score on this page changes, the change traces to a specific edit in the linkage argument tree above.

# 📍 Where This Page Is Used

Every page that reads this linkage. One claim, one home, every use visible.

| Page | Table | As | Its truth |
|---|---|---|---|
| [Y, the page whose row this linkage scores] | [reasons / evidence / predictions] | the linkage of a row |   |

> **Builder notes**
>
> SCORING ENGINE: built site. Every value computed at build time.

# 🧮 Scoring Engine

| Quantity | Value | How |
|---|---|---|
| Reasons to agree, total / Reasons to disagree, total / Linkage score / ReasonRank / Work value / Completeness |   | [One line each: the formula, with the numbers above filled in] |

Every value here is computed from the tables above at build time. What it reads but does not compute, because an author typed it: the kind of row it connects and the direction it pushes. Cite this page: [The linkage question]. Idea Stock Exchange, linkage page [Page_Key], truth [Linkage_Score], confidence [Confidence]%, revision [Revision] of [Date].

# 🔬 Contribute

Contact me (`/contact`) to add linkage arguments, equivalent rephrasings, or new failure mode examples. \| [GitHub](https://github.com/myklob/ideastockexchange) for the scoring algorithm.
