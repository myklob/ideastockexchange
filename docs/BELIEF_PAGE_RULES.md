# ISE Belief Page Rules (Canonical)

**This is the authoritative rulebook for generating any Idea Stock Exchange belief page, CBA, blog post, or scored argument content. Read before generating. Every rule has a specific failure mode it exists to prevent.**

This document is referenced by:

- `src/app/beliefs/[slug]/page.tsx`: the live belief page route
- `src/features/belief-analysis/components/DefinitionsSection.tsx`: renders last per Rule 1
- `src/core/scoring/decision-leverage.ts`: the Decision Leverage engine behind section 1c
- `src/core/scoring/evidence-exposure.ts`: the retraction-exposure readout under the Evidence Ledger
- `src/features/belief-analysis/components/ScorecardSection.tsx`: the readout, What the numbers are made of (section 14)
- `tools/static-site/score_reference.py`, `evidence.py` and `sensitivity.py`: the published engine's row rule, the eighteen source types, and the What Would Change the Answer sweep
- `templates/belief-analysis-template.html`: the PBworks / wiki template
- Any skill, generator, or prompt that produces ISE belief pages

If you change the rules here, update the code that implements them. If you change the code, update these rules.

---

## Rule 1: Definitions Go at the BACK

Definitions, scoring concept explanations, and terminology glossaries live at the END of the page, never the top.

**Why:** The page is a navigation tool into a scored argument network, not a tutorial. Readers come to see the structured argument, not to be taught what a Linkage Score is. Anyone who needs a definition clicks the link to that concept's own page. Definitions at the top are friction; they push the scored content below the fold.

**How to apply:** If a page has a Definitions section, Scoring Concepts section, or anything labeled "What this is": it goes AFTER arguments, evidence, values, interests, assumptions, CBA, resolution, and belief mapping. It is the last *analysis* section; only People on the Record (history, not analysis), What This Page Needs Right Now, What the numbers are made of (the readout), Add to This Page, the Contribute footer, and Related Topics may follow it. Definitions are operational (how would you measure it?), not philosophical.

The readout sits at the back for the same reason the definitions do. The single truth score on the heading line is the only number above the arguments; no other score and no verdict is announced before them, and what the numbers are made of is read out only after the reader has seen what they rest on.

---

## Rule 2: No Wikipedia-Style Summary or Background

Do NOT write a "Background," "Summary," "Context," or "Overview" section explaining what the topic is.

The one thing allowed under the heading is the **invitation block** (a boxed hook, question, promise and
ask, see the Canonical Section Order). It is not a summary: the hook names an itch the reader already
feels in one or two concrete sentences, the question states what the page dissects, the promise says why
this is not a feed, and the ask names one slot a newcomer can fill. It explains nothing about the topic
and it invites the reader who disagrees; a block that starts explaining is a summary and fails this rule.

**Why:** ISE does not compete with Wikipedia for topic explanation. People have a billion places to go for "what is public banking." ISE's only value proposition is the ReasonRank decomposition: chopping arguments into atomic scored parts. A background paragraph at the top dilutes that value proposition and makes ISE look like a worse Wikipedia.

**How to apply:**

- No prose intro before the Argument Trees section.
- No callout boxes with historical context or framing.
- Belief statement (its single truth score on the heading line) → invitation block → Topic metadata → Argument Trees. Nothing else before the decomposition: the truth score on the heading line is the only number above the arguments, and the readout of what the numbers are made of comes after What This Page Needs Right Now.
- If the user explicitly asks for a summary, ask them to clarify why. The answer is almost always "move straight to the arguments."

---

## Rule 3: Arguments Are ATOMIC PROPOSITIONS, Not Essays

Every cell in the Reasons-to-Agree / Reasons-to-Disagree tables is a complete, atomic proposition whose pro/con direction is evident from the cell alone: one short claim, not a paragraph, not a claim with evidence attached.

**Why:** Each argument is a belief with its own page, so its cell must stand alone as a claim someone could agree or disagree with; a bare topic fragment ("long-term cost") can't anchor a sub-debate, and a mini-essay dumps evidence into the wrong place and turns the page into a wall of text. ISE only works if each argument is atomic, linkable to its own page, and scannable at a glance.

**How to apply:**

GOOD argument cells (atomic, direction evident, one clause):

- "Financial exclusion imposes a poverty tax on the unbanked"
- "Postal infrastructure already reaches every zip code"
- "Public banks capture political influence"
- "RCV eliminates the spoiler effect"

BAD argument cells:

- Too fragmentary to be a proposition: "long-term cost", "voter confusion"
- Embeds the evidence: "The EITC, which requires earned income, raised single mothers' employment by 6 to 10 percent after the 1993 expansion..."
- Chains reasoning: "RCV eliminates the spoiler effect: voters can rank their genuine first choice without wasting their vote on a non-viable candidate"

Test: If the cell contains a percentage, a citation, the word "because," or more than one clause, it's wrong. If it couldn't headline its own belief page as a claim, it's too fragmentary. State the single proposition and stop.

---

## Rule 4: Arguments Are NOT Evidence

Arguments are logical claims. Evidence is empirical data. They go in DIFFERENT sections and fail differently.

**Why:** Arguments fail logically (wrong reasoning, fallacies, non-sequiturs). Evidence fails empirically (bad data, weak methodology, small sample). Conflating them means a true data point piled into the argument column inflates the score without any logical scrutiny, and a weak argument in the evidence column looks T1 because it's labeled as evidence.

**How a row counts (the published engine's rule, computed on read, never typed):**

> *sign x (2 x Truth - 1) x Confidence x Linkage x Importance x Uniqueness*

Truth is the row's own page score on 0 to 1. A reason nobody has argued sits at 0.50, so (2 x Truth - 1) is 0 and the row reads exactly 0, however famous the claim: listing a reason is worth nothing until it is argued, and no score can be padded by listing more. Confidence is how much of the work behind that page has been done (0 to 1); a claim with no page contributes 0. Linkage, Importance and Uniqueness are each argued on a page of their own and read a labelled constant until then (Linkage 1, Importance 0.5, Uniqueness 1). The same rule applies to arguments and to evidence, which is why they can share a column set; they live in separate sections because they fail differently. An argument with a fallacy loses truth on its own page; a finding attached to the wrong argument loses linkage and contributes almost nothing however impeccable the data. The rule is `tools/static-site/score_reference.py`; `src/core/scoring/scoring-engine.ts` still scores A / (A + D) over argument strengths, so a listed-but-unargued reason raises a score there, and that disagreement is open (see CLAUDE.md), not accidental.

**Source type (set by what the claim says, not the instrument that produced it):**

Each finding in the Evidence Ledger names one of the eighteen source types the engine knows (`tools/static-site/evidence.py`). The type sets where the finding's truth starts before anyone argues it. The weight is how far that kind of source can move it: a finding every replication confirms starts at 0.5 plus half the weight, one every replication contradicts starts at 0.5 minus half the weight, and one at half agreement starts at 0.50 whatever its type. The old four tiers (T1 to T4) are retired; a row still carrying one renders it as plain text until it is reclassified.

| Source type | Key | Weight | Starts at, when every replication confirms it |
|---|---|---|---|
| Statistics and data, with the source cited | `statistics` | 0.90 | 0.95 |
| Primary official record: statute, judicial holding, agency rule, sworn filing | `record` | 0.90 | 0.95 |
| Randomized controlled trial | `rct` | 0.85 | 0.925 |
| Meta-analysis | `meta` | 0.80 | 0.90 |
| Observational or correlational study | `observational` | 0.75 | 0.875 |
| Historical trend, with references | `historical` | 0.70 | 0.85 |
| Expert testimony with supporting data | `expert_data` | 0.65 | 0.825 |
| Expert or social media claim | `expert_claim` | 0.60 | 0.80 |
| Personal experience or anecdote | `anecdote` | 0.55 | 0.775 |
| Common sense or logic | `logic` | 0.50 | 0.75 |
| Analogy or metaphor | `analogy` | 0.45 | 0.725 |
| Cultural norm | `norm` | 0.40 | 0.70 |
| Intuition or gut feeling | `intuition` | 0.35 | 0.675 |
| News or media report | `news` | 0.30 | 0.65 |
| Survey or poll | `survey` | 0.25 | 0.625 |
| Eyewitness testimony | `eyewitness` | 0.20 | 0.60 |
| Visual evidence | `visual` | 0.15 | 0.575 |
| Historical artifact | `artifact` | 0.10 | 0.55 |

A finding with no source type named starts at 0.50 exactly and pulls nothing either way. A published poll result is a statistic; what the public believes, inferred from it, is a survey. A meme visualizing a published statistic is a statistic. A pundit asserting a claim on video is an expert or social media claim at best, and is usually an argument, not evidence.

**How to apply:**

- Argument cell: an atomic proposition naming a reason. No citations, no percentages, no study names.
- Evidence Ledger row: `Evidence (Producer, Year) / Bears On / Source type / Standing / Confidence / Linkage / Uniqueness / Impact`. Data lives HERE, formatted as Finding (Producer, Year).
- Every evidence item must name what it **bears on**: a specific argument above, identified by its opening words, or this belief directly. Evidence that bears on nothing contributes nothing, no matter how true it is. (In the software this is the `bearsOnArgumentId` edge; null means the belief itself.)
- Visual and video evidence (charts, photos, memes, documentaries, book imagery) belongs in the Evidence Ledger too, typed by what the claim says (a chart of a published statistic is a statistic; footage of an event is visual evidence), and paired with the argument it bears on.
- If a cell in the Argument Tree contains "FDIC data," "Pew research shows," or a number, it's misfiled. Move the data to the Evidence Ledger and keep the proposition in the argument tree.
- Confirmed fallacy claims bridge the two: a community-confirmed fallacy damages exactly the factor its type targets (relevance fallacies hit Linkage, formal fallacies hit the validity component of the Argument Score, evidence fallacies hit Evidence Quality) and is noted inline in the argument cell. An unconfirmed accusation changes nothing.

---

## Rule 5: No Broken Links. Ever.

Never use `href="#"` placeholder links. Never link to a PBworks or blog page that does not exist. Never link to a canonical term if its canonical page hasn't been created yet.

**Why:** Broken links destroy trust in the whole system. A reader who clicks three dead links will never click another. It is always better to show plain text than a link that goes to 404 or to the same page's top.

**How to apply:**

- If the target page exists: link to it.
- If the target page doesn't exist yet: use plain text. No `<a href="#">`. No `<a href="">`. Just text.
- When in doubt about whether a page exists, use plain text. It's safer to miss a link than to publish a broken one.
- Internal anchor links (`href="#some-id"`) DO NOT WORK on PBworks because PBworks strips custom `id` attributes. Don't use them. Use plain text section labels instead.

---

## Rule 6: Score Columns Stay Empty Until Content Exists

Do not assign scores (Truth, Linkage, Importance, argument score, net score) to cells that don't have actual scored arguments underneath them.

**Why:** Fake scores make the page look populated when it isn't. Readers can't tell which numbers are real and which are placeholders, which destroys the value of the numbers that ARE real. Either a score is grounded in sub-argument scoring or the cell is blank.

**How to apply:**

- Placeholder cells: leave blank or use "[pending]" in italics.
- Never use "+0" or "-0" as a default. That's a score, not a blank.
- Never assign a confident-looking score to an argument that has no sub-arguments, no linked evidence, and no linkage evaluation.
- Confidence and Uniqueness cells follow the same rule: blank until the engine computes them. The software carries them as optional fields and renders blank when absent.
- Readout cells marked auto-derived (What the numbers are made of) are computed from the tables above them, never hand-picked.
- A typed number is not a score and is not exempt. Prevalence in the interest tables and Dewey on the header line are typed by a person, not computed; each carries its source in the cell or in a parenthetical (`[share] ([survey or record, year])`, `Dewey [Number] (typed, with source: [Classification source])`), and a typed number without a source stays blank.

---

## Rule 7: Symmetry Between Supporters and Opponents

Every section with "Supporters" and "Opponents" (Values, Interests, Biases, Motivations) must have the same structure, same depth, and same rigor for both sides.

**Why:** Asymmetric treatment is the single most common way debate systems fail at neutrality. If "Advertised vs Actual" appears under Supporters, it must appear under Opponents. If Opponents get three rows of biases, Supporters must get three rows. Any asymmetry signals to the reader that the page is biased.

**How to apply:** Mirror the structure exactly. Both sides get the same table shape, the same number of labeled rows, the same analytical lenses.

---

## Rule 8: Every Table Ranks by Its Rank Key

Every row in every table relates to the belief through a scored relationship: the
ReasonRank performance of that row's own pro/con sub-debate. Tables sort by their
rank key, descending, highest-scoring content first, and the software shows each
table's top five rows and collapses the rest until expanded. The rank key is the
rightmost score column: **Impact** for arguments and evidence, **Expected Value**
for costs and benefits, **Claim Strength** for the Primary Conflict Pair, and
**Score** everywhere else. Rows enter and rank only by how their sub-arguments
perform, never by editorial placement.

**Why:** If editors can order rows by hand, the ordering becomes an argument nobody
can audit. Score-ranked tables make placement itself a claim that traces to scored
sub-debates, and top-five collapse keeps every table scannable without hiding
anything, a row's position always traces to its score.

**How to apply:**

- Every per-row model carries a nullable `score` (Cost-Benefit rows use
  `expectedValue = magnitude × likelihood` as their rank key; Media rows use their
  impact score; Similar Beliefs use the equivalency score).
- Sort descending with unscored rows last: their score cells render blank (Rule 6),
  and blanks must never bury real scores. Until scores exist, Interests rows sort by
  prevalence, which is typed with its source or left blank (Rule 6).
- Render the top five rows, then a "Show N more lower-scoring rows" toggle for the
  rest (`TABLE_TOP_LIMIT` in `src/features/belief-analysis/lib/ranking.ts`).
- Never hand-order rows to promote a favorite. If a row deserves to be higher, win
  its sub-debate.

### Presentation conventions (Rule 8 corollary)

- **Spell words out.** No abbreviated column headers ("Linkage" and "Importance",
  never "Link" / "Imp") and no cryptic placeholder tokens.
- **Underscored [Bracketed_Tokens]** in the wiki template are machine-replaceable
  substitution slots: keep the underscores so a script can find them, but keep
  every word readable.
- **An Importance of 100% is a default** meaning "not yet differentiated," never a
  claim of maximal importance; differentiate it whenever the material supports it.
- **Delete empty scaffolding.** When publishing an instance of the template, drop
  any section that would ship with nothing but blank cells; a short correct page
  beats a long blank one. (The software equivalent: sections like People on the
  Record and Related Topics render only when they have rows.)
- **Migrations preserve content.** When migrating an old page, keep its filled
  content somewhere on the new page (People lists → People on the Record;
  equivalent phrasings → Similar Beliefs prose) rather than deleting it.

---

### Agent provenance traces (Rule 6 corollary)

Arguments submitted through the agent ingestion API (`/api/v1/ingest`) carry an
expandable "Show the work" trace in their Argument Trees cell: the submitting
agent, its rationale, the Five-Step Linkage Check answers, and the evidence
provenance. The trace is display-only. The five-step `provisionalEstimate`
renders bracketed (e.g. `[0.8]`) because it is the author's placement-time
bracket, superseded by the engine; it is never shown as a computed score, and
nothing in the trace feeds any score column.

---

## Canonical Section Order

The July 2026 revision adds the Scorecard readout, per-row relationship scores on
every table, the **Logical Anatomy** decomposition, and row-based Falsifiability and
Cost-Benefit tables. The second layout update adds the Evidence Ledger's **Bears On**
column, spelled-out column headers, inline confirmed-fallacy notes, **People on the
Record**, and the **Related Topics** footer. The third layout update prints the
published engine's row rule, adds the **Confidence** and **Uniqueness** columns to the
Argument Trees and the Evidence Ledger, adds **What Would Change the Answer** (the
sensitivity sweep) after Decision Leverage, replaces the four evidence tiers with the
engine's eighteen **Source types**, gives People on the Record a **Source** column,
marks Prevalence and Dewey as typed with source, and moves the Scorecard to the back
as **What the numbers are made of**, after What This Page Needs Right Now, so that the
heading line's single truth score is the only number above the arguments. The source
of truth is `templates/belief-analysis-template.html`.

Breadcrumb (`Home › Topics › Category › This Belief`), then the header: Belief
statement, with the page's single truth score on the heading line (the only number
above the arguments; blank until computed) → metadata line (Topic > Subcategory /
Dewey (typed, with source) / Positivity / Related; the Net Belief Score lives in What
the numbers are made of, not here) → "Beliefs this supports" line.
No summary or background (Rule 2).
When an open prediction-market contract exists on this belief's score, a one-line
**market pointer** follows the header (an affordance, not a summary): it links the
contract on `/markets` and restates the firewall: prices predict the engine, never
feed it. Renders nothing when no open contract exists.

0a. **Invitation block**: boxed, directly under the H1: `[HOOK]` (one or two sentences naming an
   itch the reader already feels; concrete, no throat-clearing), `[QUESTION]` (one sentence ending in a
   question mark, stating exactly what the page dissects; answerable, not rhetorical), `[PROMISE]` (why this
   is not a feed: one belief, both sides, ranked by how well arguments hold up rather than how often they
   are repeated, permanent, open to revision), and the ask: **"If you disagree, this page has a column for
   you."** followed by one specific slot a newcomer can fill in five minutes (an empty con row, a missing
   counterexample, an unproposed criterion). Never "what do you think?" It passes the reciprocity test: it
   names a behavior, never a tribe, so it reads the same to either side. The software derives the slot
   from "What This Page Needs Right Now" when the author has not typed one.
1. **Argument Trees**: one two-sided scored table (Reasons to Agree / Reasons to
   Disagree), each side with `Argument / Score / Confidence / Linkage / Importance /
   Uniqueness / Impact` (spelled out, no abbreviated headers). The caption prints the
   row rule, `sign x (2 x Truth - 1) x Confidence x Linkage x Importance x Uniqueness`,
   and says that a reason nobody has argued sits at Truth 0.50 and reads exactly 0
   (Rule 4). Each argument cell is the claim (a
   complete atomic proposition), the single most famous supporting quote inline
   (italic, small), then the submitter as `~Name`; community-confirmed fallacy
   claims render an inline note naming the factor they dent (Rule 4). **Every score
   cell is a doorway** (a blank cell is never a link, per Rule 6): Score opens the
   child belief's own page, Linkage opens the edge's linkage debate, Importance
   opens the importance sub-belief when one sources it, and Impact opens the
   score-provenance page (`/arguments/[id]/score`) showing the full
   derivation, factor by factor, with a live
   uniqueness trace. Confidence and Uniqueness render blank until the engine
   computes them (Rule 6). Pro Total / Con Total row, then the **Net Belief Score** line.
   The Net Belief Score is reported as a **share and margin**, the net divided by the
   belief's own `Pro + Con` total, not as a bare numerator. A bare "+9.2" floats free;
   "58% of the argument weight, a +15-point margin" is actionable. This is the *internal*
   denominator (the belief vs. its own rebuttals). See `docs/THE_DENOMINATOR.md`.
1b. **Contrast Class** *(only when the topic has a rival option set)*: the *external*
   denominator made visible: the mutually exclusive rivals this belief is priced against,
   each with its own argument-tree score `S` and an **opportunity-cost value**
   `OCV = S(this) − max S(rivals)`. Exactly one option (the field winner) has `OCV > 0`.
   Every option's score must trace to its own belief's tree, never a fabricated constant
   (Rule 6). Options rank by score descending, nulls last (Rule 8). Comparative arguments
   ("rival Y beats X") belong here, not in the con column.
1c. **Decision Leverage** *(only when something is actually at stake)*: the argument
   table read sideways: which edge is worth settling next. One row per edge from the
   tree above (`Argument / Leverage / Weight / Open / What would settle it / Status`),
   ranked by Leverage descending. **Leverage** is the points of conclusion score still
   at stake on that edge: `weight × openRange × 100`, where `weight = |linkage| ×
   importance × uniqueness × 0.5^depth` (the impact formula with truth factored out, so
   weight × 100 is how many points of impact move per unit of truth) and `openRange` is
   the weighted shortfall across four resolution gaps: evidence 0.40 (1 − the child's
   grounding), linkage 0.25 (`1/√(1+votes)`), examination 0.20
   (`1/√(1+min(support, opposition))` over the child's sub-arguments *and* its evidence
   by side), scoring 0.15 (1 while the child sub-debate is unscored). Status is the
   quadrant on (weight ≥ 0.35, openRange ≥ 0.40): **Crux** carries weight and rests on
   little, **Load-bearing** carries weight and is supported, **Open but minor**,
   **Settled or minor**. The "What would settle it" cell names the widest gap and links
   the page where it closes (the child belief, the linkage sub-debate, or the
   score-provenance page), plain text when no such route exists (Rule 5). A closing
   line reports the total at stake and flags **concentration** above 0.5, where one
   unresolved edge is carrying the verdict. Engine-computed from scores the page already
   shows (`src/core/scoring/decision-leverage.ts`); never hand-ranked, and the whole
   section is omitted when every edge is settled. Explainer:
   `/algorithms/decision-leverage`.
1d. **What Would Change the Answer** *(only when something sits beneath the page)*: the
   sensitivity sweep: which single input, moved alone, would change this belief's
   score. Every claim beneath the page is held at false and then at true, one at a
   time, and the whole graph is recomputed. One row per input (`# / Input / Its truth /
   Confidence / If false / If true / Move / If settled / What it does here`), ranked by
   Move descending. **If false** and **If true** are where this page's truth lands;
   **Move** is the distance between them; **If settled** is the same distance with the
   input's confidence held at 1, which is what the input would be worth once the work
   behind it is finished, so the gap between Move and If settled is the value of doing
   that work. The flip point, where the page crosses 0.50 and the conclusion changes
   sides, is found by bisection against the one engine, never by a second formula. An
   input that moves the page by less than 0.005 is inert. A closing line says how many
   inputs were not shown, how deep the sweep looked and how many inputs sit deeper, and,
   when one input alone can flip the conclusion, that the verdict rests on one claim.
   The sweep is one input at a time: it finds single points of failure and does not
   test correlated inputs moving together. Engine-computed and never hand-ranked. The
   static site computes it (`tools/static-site/sensitivity.py`); the React page does
   not yet, because `src/core/scoring` has no sensitivity engine, so the section
   appears in the template and not on `/beliefs/[slug]` until one exists.
2. **Evidence Ledger**: one two-sided table (Supporting / Weakening), each side with
   `Evidence (Producer, Year) / Bears On / Source type / Standing / Confidence / Linkage /
   Uniqueness / Impact`. Items are formatted as Finding (Producer, Year); **Source type**
   is one of the engine's eighteen (the table in Rule 4), spelled out in the cell, and
   it sets where the finding's truth starts before anyone argues it; a row counts by the
   same rule as an argument row, so a finding nobody has argued or sourced reads exactly
   0; the
   Bears On cell names the argument the item bears on by its opening words (linking
   into that argument's sub-debate) or reads "this belief". **Standing** is the
   verification lifecycle, and it is not decoration: it decides how much of the row's
   impact the engine counts: Verified in full, Unverified and Disputed at half,
   Falsified at nothing, and *Unrecorded* (no status on the row at all) in full. A row
   is never shown without its standing, because a reader cannot otherwise tell a checked
   source from an unchecked one carrying the same weight. Below the table, when anything
   is actually at risk, a **retraction exposure** line reports how many of the points the
   belief draws from evidence rest on standing nobody has established, how many rows are
   counted in full on no record, how many are weighted by an unconfirmed source-type
   claim, and, above half, that the score should be read as provisional. Engine-computed
   (`src/core/scoring/evidence-exposure.ts`); omitted when every row is established.
3. **Objective Criteria** (`Criterion / Score / Validity / Reliability / Linkage / Importance /
   Reading That Would Strengthen / Reading That Would Weaken / Latest Reading`), each criterion is
   itself a belief with its own page, scored on the four dimensions. The Reading That Would Strengthen
   and the Reading That Would Weaken must differ from each other: a criterion both sides expect to come
   out the same way tests nothing. Every page includes at least one **deliberately failing criterion**,
   scored low with its reasons, because a rubric with no failing example does not show readers where the
   line is. The Latest Reading column is the open invitation; it stays blank until somebody fills it with
   a sourced number.
4. **Falsifiability Test** (`Evidence That Would Strengthen / Score / Evidence That
   Would Weaken / Score`, each row a realistic, bet-specific score-mover) +
   **Testable Predictions** (`Prediction / Follows If / Timeframe / Verification
   Method / Result So Far / Score`)
5. **Logical Anatomy & Foundational Assumptions**: the belief's logical form
   (ANDs/ORs), the Component Claims table (`Component Claim / Type / Stated? /
   If false, does the belief survive? / Unstated assumptions / Score`), then
   Assumptions by Side (`Required to Accept / Score / Required to Reject / Score`)
6. **Cost-Benefit Analysis**: Benefits table and Costs and Risks table, each
   `Claim (links to its own page) / Category (Units) / Magnitude / Likelihood % /
   Expected Value`, ranked by Expected Value with subtotals only within a category;
   then **Short vs. Long-Term Impacts** (`Short-Term / Score / Long-Term / Score`)
7. **Conflict Resolution Framework**: opens with the **Pipeline readout**, computed
   from the scored rows below (never hand-authored): interests both sides actually
   share (cross-side similarity, both clearing the Resolution Floor), the primary
   conflict pair (highest validity-weighted linkage-accuracy unshared interest per
   side), genuine value conflicts (shared values ranked far apart), and compromise
   candidates (cost/benefit items where a likelihood shift ≤ 15 points flips their
   category's net: the winnable disagreements).
   - 7a. Shared Values, Different Rankings (`Value / Supporter Rank / Opponent Rank /
     Why Rankings Differ / Score`, then a "What would shift these rankings?" row)
   - 7b. Likely Interests of Supporters (`Interest / Prevalence (typed, with source) /
     Linkage Confidence / Validity / Evidence Basis / Connected Value`, plus a
     Pretextual/Low-validity row). Prevalence is typed by a person, not computed, so the
     cell carries its source in a parenthetical, and a typed number without a source
     stays blank (Rule 6).
   - 7c. Likely Interests of Opponents (same columns, symmetric)
   - 7d. Shared and Conflicting Interests: Shared Interests table (`Shared Interest /
     Validity / Compromise direction / Score`) + Primary Conflict Pair (`Interest in
     the pair / Standalone Validity / Claim strength on THIS issue / What drives its
     claim here`)
   - 7e. Best Compromise Solutions (`Shared Premise / Proposed Synthesis / Why This Is
     Difficult / Score (interests satisfied)`)
   - 7f. Advertised vs. Actual Motivations (rows: Advertised reason / Actual driver /
     Evidence for divergence / Divergence Score, columns Supporters / Opponents)
   - 7g. Dispute Types (Empirical / Definitional / Values, each with Score)
   - 7h. Primary Obstacles to Resolution (`Obstacles for Supporters / Score /
     Obstacles for Opponents / Score`)
   - 7i. Biases (`Affecting Supporters / Score / Affecting Opponents / Score`)
8. **Media Resources** (two-sided: `Resource (Author, Year) / Type / Score`)
9. **Legal Framework** (`Supporting / Score / Complicating / Score`)
10. **General to Specific Belief Mapping** (Upstream and Downstream, each
    `Support / Score / Oppose / Score`)
11. **Similar Beliefs** (`More Extreme / Score / More Moderate / Score`, scored by
    belief equivalency). Same-strength paraphrases (equivalency near 100%) render
    as prose merge candidates above the table, not as table rows.
11b. **Where This Belief Is Used** *(renders only when the belief serves as a
    reason somewhere)*: what-links-here, every parent debate using this belief
    as a reason (`Used as a reason in / Side / Impact`), ranked by impact
    magnitude (Rule 8), impact 0 rendering blank (Rule 6). One argument, one
    home, every use visible.
11c. **Score History** *(renders only when score events exist)*: the
    accumulation ledger: every engine-computed movement of this belief's score
    (`When / Score / Change / What moved it`), latest first, written exclusively
    by score propagation. The visible answer to the clean-slate problem; nothing
    here is hand-entered, so history rows are never authored (Rule 6 by
    construction). Also served by `GET /api/beliefs/[id]/history`.
12. **Definitions** (`Term / Definition / Score`, defined operationally (how would
    you measure it?), not philosophically), last analysis section (Rule 1)
12b. **People on the Record** *(renders only when notable positions are on
    record)*: recorded public positions, preserved for tracing the debate
    (`On record agreeing / Source / On record disagreeing / Source`). The **Source**
    column says where the position was stated (the bill, the floor statement, the
    column, the interview), linked where the source exists, with its date; a name
    with no source is a rumour, not a record. Who holds a belief never changes its
    score: author identity is orthogonal to the final score, so these names carry
    history, not weight. Each listing is itself a debatable claim that the person
    holds the position; contested listings are annotated.
13. **What This Page Needs Right Now** (`# / The gap / Where it goes / Who is best placed to fill
    it`): concrete gaps, updated as they fill: the strongest missing counterargument stated as the shape
    of the argument wanted (not a topic label), an evidence slot (a claim resting on argument alone), a
    criterion nobody has proposed or a proposed one that needs its first reading. The software derives
    these from the tables above (`src/features/belief-analysis/lib/gaps.ts`); none of them require
    agreeing with the page.
14. **What the numbers are made of**: the readout, formerly the Scorecard. It sits
    here, after the arguments and after What This Page Needs Right Now, because no
    score or verdict is announced before the arguments; the single truth score on
    the heading line is the only number above them. It is a readout of the scored
    content above, not a prose summary:
    `Net Belief Score (Pro vs. Con)` / `Bottom line` (one-sentence verdict scoped to
    what the tree supports) / `Strongest pro / con` (**auto-derived**: the top-ranked
    row from each side of the Argument Trees) / `What would move this score most`
    (**auto-derived**: the top-scoring row of the Falsifiability Test) / `How a row
    counts` (the row rule from Rule 4, with the sentence that a claim nobody has argued
    reads exactly 0), plus, in the software, a collapsed **twelve-dimension engine
    readout** (each dimension links to its `/algorithms/*` explainer; null dimensions
    render blank per Rule 6). Cells marked auto-derived are computed from the tables
    above, never hand-picked. Followed by the "How to read this page" box explaining
    score-ranked tables and naming the rank key (Rule 8).
14b. **Add to This Page**: the participation block. On the built site every
    table above carries a form that takes rows (a reason to agree or disagree, a
    finding, a prediction, a criterion, a cost or benefit, an interest) and the
    Related Beliefs section carries a propose-a-belief form; the heading line
    carries Agree and Disagree links after the score badge, with counts once
    anyone has voted. As a reader types, claims already on the site that say the
    same thing are shown, and a near-identical one turns the submit button into
    a vote for the claim already here. A vote is shown as what people think,
    next to what the analysis says, and never moves a score.
15. **Contribute / footer**: the three moves, stated and usable: a
    suggest-evidence form (queue-only; a suggestion becomes evidence only on
    acceptance, which runs the same validation as agent ingestion),
    challenge-a-number, and an add-a-reason form
    (the new reason becomes a belief page of its own; no score field is ever
    submitted; the audit lock rejects them and the engine computes scores on
    propagation), and the reminder that every score above is a clickable doorway.
    On high-stakes beliefs the form and API walk the speed bumps: acknowledge the
    strongest current opposing argument (verified server-side) and affirm the moral
    principle the post rests on.
16. **Related Topics** *(renders only when the belief has category siblings)*:
    the category cluster: a link to the topic hub (the category-filtered belief
    index) and the sibling beliefs in this cluster, each linked, with the current
    page appearing as plain text, unlinked.

---

## Pre-Generation Checklist

Before outputting any ISE belief page, verify:

- [ ] No summary or background section at the top, and no readout before the arguments: the heading line's single truth score is the only number above them
- [ ] Breadcrumb reads Home › Topics › Category › This Belief
- [ ] Header has the metadata line (Topic > Subcategory / Dewey (typed, with source) / Positivity / Related) and "Beliefs this supports"; the Net Belief Score appears in What the numbers are made of, not the metadata line
- [ ] Belief is stated in positive form so the page headlines the supported claim
- [ ] The invitation block sits directly under the H1: hook, question, promise, and "If you disagree, this page has a column for you" naming one specific slot; it explains nothing about the topic
- [ ] Objective Criteria has at least one deliberately failing criterion scored low with its reasons, and every Strengthen/Weaken pair differs
- [ ] "What This Page Needs Right Now" names concrete gaps with where each goes and who fills it, above Contribute
- [ ] What the numbers are made of sits after What This Page Needs Right Now and shows Net Belief Score (Pro vs. Con), Bottom line, the auto-derived Strongest pro/con and top score-mover, and How a row counts; auto-derived cells computed from the tables above, never hand-picked
- [ ] Definitions section is the last analysis section; only People on the Record, What This Page Needs Right Now, What the numbers are made of, Add to This Page, Contribute, and Related Topics follow
- [ ] Add to This Page sits after What the numbers are made of: a form per table, Agree/Disagree links after the score, and the sentence that a vote is shown and never counted
- [ ] Argument Trees and Evidence Ledger carry Confidence and Uniqueness columns, and the caption prints sign x (2 x Truth - 1) x Confidence x Linkage x Importance x Uniqueness with the sentence that a reason nobody has argued reads exactly 0
- [ ] What Would Change the Answer follows Decision Leverage when anything sits beneath the page (template; the React page waits on an engine), ranked by Move, with the not-shown and sweep-depth line
- [ ] Argument cells are complete atomic propositions with the famous quote inline and `~Name` submitter, no citations, percentages, or study names; confirmed fallacies noted inline
- [ ] Argument Trees and Evidence Ledger each render as a single two-sided table with Pro/Con (or Supporting/Weakening) halves
- [ ] Column headers are spelled out (Linkage, Importance, Confidence, Uniqueness, Standing, Source type), no abbreviations
- [ ] All evidence lives in the Evidence Ledger as Finding (Producer, Year) with one of the eighteen Source types named and a Bears On target (an argument's opening words or "this belief")
- [ ] Every evidence row shows its Standing, and the retraction-exposure line appears whenever points are at risk
- [ ] Every table sorts by its rank key descending (Impact / Expected Value / Claim Strength / Score), unscored rows sink to the bottom, and the software shows the top five rows
- [ ] Objective Criteria has Criterion / How to Measure / Reading That Would Strengthen / Reading That Would Weaken / Latest Reading / Score
- [ ] Falsifiability Test rows are bet-specific score-movers with per-row Scores (plus the nothing-could-falsify note row); Testable Predictions include Follows If and Result So Far
- [ ] Logical Anatomy decomposes the belief (logical form + typed, load-bearing-flagged component claims)
- [ ] Cost-Benefit rows carry Category (Units) / Magnitude / Likelihood % / Expected Value and subtotal only within a category; cross-category conversions are stated out loud
- [ ] Conflict Resolution Framework has all sub-sections in order: Shared Values rankings, Interests of Supporters, Interests of Opponents, Shared+Conflicting (Shared Interests + Primary Conflict Pair), Best Compromise Solutions, Advertised vs. Actual (with Divergence Score), Dispute Types, Primary Obstacles, Biases
- [ ] Decision Leverage is engine-ranked (never hand-ordered), each row's "what would settle it" link resolves, and the section is omitted when nothing is at stake
- [ ] Where This Belief Is Used, Score History, People on the Record, and Related Topics render only when they have rows; sections that would ship all-blank are deleted (wiki) or self-suppressed (software)
- [ ] People on the Record carries a Source column (the bill, floor statement, column or interview, with date) beside each name
- [ ] Prevalence and Dewey, the two typed numbers, each carry a source or stay blank
- [ ] Similar Beliefs puts near-100% paraphrases in prose as merge candidates, not in the table
- [ ] Every link points to a page that exists OR is plain text
- [ ] No `href="#"` anchors anywhere
- [ ] Both sides have symmetric structure in Interests, Advertised vs. Actual, Biases, Obstacles
- [ ] Score cells are blank for unpopulated arguments; Importance 100% is treated as "not yet differentiated"
