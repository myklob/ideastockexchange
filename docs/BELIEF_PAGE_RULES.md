# ISE Belief Page Rules (Canonical)

**This is the authoritative rulebook for generating any Idea Stock Exchange belief page, CBA, blog post, or scored argument content. Read before generating. Every rule has a specific failure mode it exists to prevent.**

This document is referenced by:

- `src/app/beliefs/[slug]/page.tsx` — the live belief page route
- `src/features/belief-analysis/components/DefinitionsSection.tsx` — renders last per Rule 1
- `templates/belief-analysis-template.html` — the PBworks / wiki template
- Any skill, generator, or prompt that produces ISE belief pages

If you change the rules here, update the code that implements them. If you change the code, update these rules.

---

## Rule 1: Definitions Go at the BACK

Definitions, scoring concept explanations, and terminology glossaries live at the END of the page, never the top.

**Why:** The page is a navigation tool into a scored argument network, not a tutorial. Readers come to see the structured argument, not to be taught what a Linkage Score is. Anyone who needs a definition clicks the link to that concept's own page. Definitions at the top are friction; they push the scored content below the fold.

**How to apply:** If a page has a Definitions section, Scoring Concepts section, or anything labeled "What this is" — it goes AFTER arguments, evidence, values, interests, assumptions, CBA, resolution, and belief mapping. It is the last *analysis* section; only People on the Record (history, not analysis), the Contribute footer, and Related Topics may follow it. Definitions are operational (how would you measure it?), not philosophical.

---

## Rule 2: No Wikipedia-Style Summary or Background

Do NOT write a "Background," "Summary," "Context," "Overview," or "Hook" section explaining what the topic is.

**Why:** ISE does not compete with Wikipedia for topic explanation. People have a billion places to go for "what is public banking." ISE's only value proposition is the ReasonRank decomposition: chopping arguments into atomic scored parts. A background paragraph at the top dilutes that value proposition and makes ISE look like a worse Wikipedia.

**How to apply:**

- No prose intro before the Argument Trees section.
- No callout boxes with historical context or framing.
- Belief statement → Topic metadata → Argument Trees. That's it. Go straight to the decomposition.
- If the user explicitly asks for a summary, ask them to clarify why. The answer is almost always "move straight to the arguments."

---

## Rule 3: Arguments Are ATOMIC PROPOSITIONS, Not Essays

Every cell in the Reasons-to-Agree / Reasons-to-Disagree tables is a complete, atomic proposition whose pro/con direction is evident from the cell alone — one short claim, not a paragraph, not a claim with evidence attached.

**Why:** Each argument is a belief with its own page, so its cell must stand alone as a claim someone could agree or disagree with — a bare topic fragment ("long-term cost") can't anchor a sub-debate, and a mini-essay dumps evidence into the wrong place and turns the page into a wall of text. ISE only works if each argument is atomic, linkable to its own page, and scannable at a glance.

**How to apply:**

GOOD argument cells (atomic, direction evident, one clause):

- "Financial exclusion imposes a poverty tax on the unbanked"
- "Postal infrastructure already reaches every zip code"
- "Public banks capture political influence"
- "RCV eliminates the spoiler effect"

BAD argument cells:

- Too fragmentary to be a proposition: "long-term cost", "voter confusion"
- Embeds the evidence: "The EITC, which requires earned income, raised single mothers' employment by 6 to 10 percent after the 1993 expansion..."
- Chains reasoning: "RCV eliminates the spoiler effect — voters can rank their genuine first choice without wasting their vote on a non-viable candidate"

Test: If the cell contains a percentage, a citation, the word "because," or more than one clause, it's wrong. If it couldn't headline its own belief page as a claim, it's too fragmentary. State the single proposition and stop.

---

## Rule 4: Arguments Are NOT Evidence

Arguments are logical claims. Evidence is empirical data. They go in DIFFERENT sections and fail differently.

**Why:** Arguments fail logically (wrong reasoning, fallacies, non-sequiturs). Evidence fails empirically (bad data, weak methodology, small sample). Conflating them means a true data point piled into the argument column inflates the score without any logical scrutiny, and a weak argument in the evidence column looks T1 because it's labeled as evidence.

**Scoring formula (applied per argument, computed recursively — never manually assigned):**

> *Argument Score = Evidence Quality x Logical Validity x Linkage Strength*

An argument with great evidence but a logical fallacy still scores low. Evidence attached to the wrong argument contributes almost nothing even if the data is impeccable. Both layers are required — this is why they live in separate sections with different scoring criteria.

**Evidence Tiers (set by the underlying source, not the format):**

- **T1** — peer-reviewed research / official government data
- **T2** — expert analysis / institutional reports
- **T3** — investigative journalism / survey data
- **T4** — opinion / anecdote

A meme visualizing a T1 study is T1. A pundit asserting a claim on video is T4 at best — and is an argument, not evidence.

**How to apply:**

- Argument cell: an atomic proposition naming a reason. No citations, no percentages, no study names.
- Evidence Ledger row: `Evidence (Producer, Year) / Bears On / Tier / Linkage / Impact`. Data lives HERE, formatted as Finding (Producer, Year).
- Every evidence item must name what it **bears on**: a specific argument above, identified by its opening words, or this belief directly. Evidence that bears on nothing contributes nothing, no matter how true it is. (In the software this is the `bearsOnArgumentId` edge; null means the belief itself.)
- Visual and video evidence (charts, photos, memes, documentaries, book imagery) belongs in the Evidence Ledger too, tiered by the underlying source, and paired with the argument it bears on.
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

---

## Rule 7: Symmetry Between Supporters and Opponents

Every section with "Supporters" and "Opponents" (Values, Interests, Biases, Motivations) must have the same structure, same depth, and same rigor for both sides.

**Why:** Asymmetric treatment is the single most common way debate systems fail at neutrality. If "Advertised vs Actual" appears under Supporters, it must appear under Opponents. If Opponents get three rows of biases, Supporters must get three rows. Any asymmetry signals to the reader that the page is biased.

**How to apply:** Mirror the structure exactly. Both sides get the same table shape, the same number of labeled rows, the same analytical lenses.

---

## Rule 8: Every Table Ranks by Its Rank Key

Every row in every table relates to the belief through a scored relationship: the
ReasonRank performance of that row's own pro/con sub-debate. Tables sort by their
rank key, descending — highest-scoring content first — and the software shows each
table's top five rows and collapses the rest until expanded. The rank key is the
rightmost score column: **Impact** for arguments and evidence, **Expected Value**
for costs and benefits, **Claim Strength** for the Primary Conflict Pair, and
**Score** everywhere else. Rows enter and rank only by how their sub-arguments
perform, never by editorial placement.

**Why:** If editors can order rows by hand, the ordering becomes an argument nobody
can audit. Score-ranked tables make placement itself a claim that traces to scored
sub-debates, and top-five collapse keeps every table scannable without hiding
anything — a row's position always traces to its score.

**How to apply:**

- Every per-row model carries a nullable `score` (Cost-Benefit rows use
  `expectedValue = magnitude × likelihood` as their rank key; Media rows use their
  impact score; Similar Beliefs use the equivalency score).
- Sort descending with unscored rows last — their score cells render blank (Rule 6),
  and blanks must never bury real scores. Until scores exist, Interests rows sort by
  estimated prevalence.
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
  any section that would ship with nothing but blank cells — a short correct page
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
bracket, superseded by the engine — it is never shown as a computed score, and
nothing in the trace feeds any score column.

---

## Canonical Section Order

The July 2026 revision adds the **Scorecard** readout, per-row relationship scores on
every table, the **Logical Anatomy** decomposition, and row-based Falsifiability and
Cost-Benefit tables. The second layout update adds the Evidence Ledger's **Bears On**
column, spelled-out column headers, inline confirmed-fallacy notes, **People on the
Record**, and the **Related Topics** footer. The source of truth is
`templates/belief-analysis-template.html`.

Breadcrumb (`Home › Topics › Category › This Belief`), then the header: Belief
statement → metadata line (Topic > Subcategory / Dewey / Positivity / Related — the
Net Belief Score lives in the Scorecard, not here) → "Beliefs this supports" line.
No summary or background (Rule 2).
When an open prediction-market contract exists on this belief's score, a one-line
**market pointer** follows the header (an affordance, not a summary): it links the
contract on `/markets` and restates the firewall — prices predict the engine, never
feed it. Renders nothing when no open contract exists.

0. **Scorecard** — a readout of the scored content below, not a prose summary:
   `Net Belief Score (Pro vs. Con)` / `Bottom line` (one-sentence verdict scoped to
   what the tree supports) / `Strongest pro / con` (**auto-derived**: the top-ranked
   row from each side of the Argument Trees) / `What would move this score most`
   (**auto-derived**: the top-scoring row of the Falsifiability Test), plus a
   collapsed **twelve-dimension engine readout** (each dimension links to its
   `/algorithms/*` explainer; null dimensions render blank per Rule 6). Cells marked
   auto-derived are computed from the tables below, never hand-picked.
   Followed by the "How to read this page" box explaining score-ranked tables and
   naming the rank key (Rule 8).
1. **Argument Trees** — one two-sided scored table (Reasons to Agree / Reasons to
   Disagree), each side with `Argument / Score / Linkage / Importance / Impact`
   (spelled out — no abbreviated headers). Each argument cell is the claim (a
   complete atomic proposition), the single most famous supporting quote inline
   (italic, small), then the submitter as `~Name`; community-confirmed fallacy
   claims render an inline note naming the factor they dent (Rule 4). **Every score
   cell is a doorway** (a blank cell is never a link, per Rule 6): Score opens the
   child belief's own page, Linkage opens the edge's linkage debate, Importance
   opens the importance sub-belief when one sources it, and Impact opens the
   score-provenance page (`/arguments/[id]/score`) showing the full
   sign × truth × |linkage| × importance × uniqueness derivation with a live
   uniqueness trace. Pro Total / Con Total row, then the **Net Belief Score** line.
   The Net Belief Score is reported as a **share and margin** — the net divided by the
   belief's own `Pro + Con` total — not as a bare numerator. A bare "+9.2" floats free;
   "58% of the argument weight, a +15-point margin" is actionable. This is the *internal*
   denominator (the belief vs. its own rebuttals). See `docs/THE_DENOMINATOR.md`.
1b. **Contrast Class** *(only when the topic has a rival option set)* — the *external*
   denominator made visible: the mutually exclusive rivals this belief is priced against,
   each with its own argument-tree score `S` and an **opportunity-cost value**
   `OCV = S(this) − max S(rivals)`. Exactly one option (the field winner) has `OCV > 0`.
   Every option's score must trace to its own belief's tree — never a fabricated constant
   (Rule 6). Options rank by score descending, nulls last (Rule 8). Comparative arguments
   ("rival Y beats X") belong here, not in the con column.
2. **Evidence Ledger** — one two-sided table (Supporting / Weakening), each side with
   `Evidence (Producer, Year) / Bears On / Tier / Linkage / Impact`. Items are
   formatted as Finding (Producer, Year); tiers spell out as "Tier 1"…"Tier 4"; the
   Bears On cell names the argument the item bears on by its opening words (linking
   into that argument's sub-debate) or reads "this belief".
3. **Objective Criteria** (`Criterion / How to Measure / Reading That Would Strengthen /
   Reading That Would Weaken / Latest Reading / Score`) — the best criteria are ones
   where the two sides predict different readings.
4. **Falsifiability Test** (`Evidence That Would Strengthen / Score / Evidence That
   Would Weaken / Score` — each row a realistic, bet-specific score-mover) +
   **Testable Predictions** (`Prediction / Follows If / Timeframe / Verification
   Method / Result So Far / Score`)
5. **Logical Anatomy & Foundational Assumptions** — the belief's logical form
   (ANDs/ORs), the Component Claims table (`Component Claim / Type / Stated? /
   If false, does the belief survive? / Unstated assumptions / Score`), then
   Assumptions by Side (`Required to Accept / Score / Required to Reject / Score`)
6. **Cost-Benefit Analysis** — Benefits table and Costs and Risks table, each
   `Claim (links to its own page) / Category (Units) / Magnitude / Likelihood % /
   Expected Value`, ranked by Expected Value with subtotals only within a category;
   then **Short vs. Long-Term Impacts** (`Short-Term / Score / Long-Term / Score`)
7. **Conflict Resolution Framework** — opens with the **Pipeline readout**, computed
   from the scored rows below (never hand-authored): interests both sides actually
   share (cross-side similarity, both clearing the Resolution Floor), the primary
   conflict pair (highest validity-weighted linkage-accuracy unshared interest per
   side), genuine value conflicts (shared values ranked far apart), and compromise
   candidates (cost/benefit items where a likelihood shift ≤ 15 points flips their
   category's net — the winnable disagreements).
   - 7a. Shared Values, Different Rankings (`Value / Supporter Rank / Opponent Rank /
     Why Rankings Differ / Score`, then a "What would shift these rankings?" row)
   - 7b. Likely Interests of Supporters (`Interest / Prevalence / Linkage Confidence /
     Validity / Evidence Basis / Connected Value`, plus a Pretextual/Low-validity row)
   - 7c. Likely Interests of Opponents (same columns, symmetric)
   - 7d. Shared and Conflicting Interests — Shared Interests table (`Shared Interest /
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
    reason somewhere)* — what-links-here: every parent debate using this belief
    as a reason (`Used as a reason in / Side / Impact`), ranked by impact
    magnitude (Rule 8), impact 0 rendering blank (Rule 6). One argument, one
    home, every use visible.
11c. **Score History** *(renders only when score events exist)* — the
    accumulation ledger: every engine-computed movement of this belief's score
    (`When / Score / Change / What moved it`), latest first, written exclusively
    by score propagation. The visible answer to the clean-slate problem; nothing
    here is hand-entered, so history rows are never authored (Rule 6 by
    construction). Also served by `GET /api/beliefs/[id]/history`.
12. **Definitions** (`Term / Definition / Score`, defined operationally — how would
    you measure it? — not philosophically) — last analysis section (Rule 1)
12b. **People on the Record** *(renders only when notable positions are on
    record)* — recorded public positions, preserved for tracing the debate
    (`On record agreeing / On record disagreeing`, each entry a name linking to
    the statement or source). Who holds a belief never changes its score: author
    identity is orthogonal to the final score, so these names carry history, not
    weight. Each listing is itself a debatable claim that the person holds the
    position; contested listings are annotated.
13. **Contribute / footer** — the two moves, stated and usable: an add-a-reason form
    (the new reason becomes a belief page of its own; no score field is ever
    submitted — the audit lock rejects them and the engine computes scores on
    propagation), and the reminder that every score above is a clickable doorway.
    On high-stakes beliefs the form and API walk the speed bumps: acknowledge the
    strongest current opposing argument (verified server-side) and affirm the moral
    principle the post rests on.
14. **Related Topics** *(renders only when the belief has category siblings)* —
    the category cluster: a link to the topic hub (the category-filtered belief
    index) and the sibling beliefs in this cluster, each linked, with the current
    page appearing as plain text, unlinked.

---

## Pre-Generation Checklist

Before outputting any ISE belief page, verify:

- [ ] No summary or background section at the top — the Scorecard is a scored readout, not prose
- [ ] Breadcrumb reads Home › Topics › Category › This Belief
- [ ] Header has the metadata line (Topic > Subcategory / Dewey / Positivity / Related) and "Beliefs this supports"; the Net Belief Score appears in the Scorecard, not the metadata line
- [ ] Belief is stated in positive form so the page headlines the supported claim
- [ ] Scorecard shows Net Belief Score (Pro vs. Con), Bottom line, and the auto-derived Strongest pro/con and top score-mover — auto-derived cells computed from the tables, never hand-picked
- [ ] Definitions section is the last analysis section; only People on the Record, Contribute, and Related Topics follow
- [ ] Argument cells are complete atomic propositions with the famous quote inline and `~Name` submitter — no citations, percentages, or study names; confirmed fallacies noted inline
- [ ] Argument Trees and Evidence Ledger each render as a single two-sided table with Pro/Con (or Supporting/Weakening) halves
- [ ] Column headers are spelled out (Linkage, Importance) — no abbreviations
- [ ] All evidence lives in the Evidence Ledger as Finding (Producer, Year) with tier assigned and a Bears On target (an argument's opening words or "this belief")
- [ ] Every table sorts by its rank key descending (Impact / Expected Value / Claim Strength / Score), unscored rows sink to the bottom, and the software shows the top five rows
- [ ] Objective Criteria has Criterion / How to Measure / Reading That Would Strengthen / Reading That Would Weaken / Latest Reading / Score
- [ ] Falsifiability Test rows are bet-specific score-movers with per-row Scores (plus the nothing-could-falsify note row); Testable Predictions include Follows If and Result So Far
- [ ] Logical Anatomy decomposes the belief (logical form + typed, load-bearing-flagged component claims)
- [ ] Cost-Benefit rows carry Category (Units) / Magnitude / Likelihood % / Expected Value and subtotal only within a category; cross-category conversions are stated out loud
- [ ] Conflict Resolution Framework has all sub-sections in order: Shared Values rankings, Interests of Supporters, Interests of Opponents, Shared+Conflicting (Shared Interests + Primary Conflict Pair), Best Compromise Solutions, Advertised vs. Actual (with Divergence Score), Dispute Types, Primary Obstacles, Biases
- [ ] Where This Belief Is Used, Score History, People on the Record, and Related Topics render only when they have rows; sections that would ship all-blank are deleted (wiki) or self-suppressed (software)
- [ ] Similar Beliefs puts near-100% paraphrases in prose as merge candidates, not in the table
- [ ] Every link points to a page that exists OR is plain text
- [ ] No `href="#"` anchors anywhere
- [ ] Both sides have symmetric structure in Interests, Advertised vs. Actual, Biases, Obstacles
- [ ] Score cells are blank for unpopulated arguments; Importance 100% is treated as "not yet differentiated"
