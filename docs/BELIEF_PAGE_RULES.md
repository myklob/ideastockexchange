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

**How to apply:** If a page has a Definitions section, Scoring Concepts section, or anything labeled "What this is" — it goes AFTER arguments, evidence, values, interests, assumptions, CBA, resolution, and belief mapping. The last section before Contribute/footer, not the first.

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

## Rule 3: Arguments Are SHORT LABELS, Not Sentences

Every cell in the Reasons-to-Agree / Reasons-to-Disagree tables is a 2 to 6 word LABEL, not a sentence, not a paragraph, not a claim with evidence attached.

**Why:** The pro/con column header provides context. If the column says "Reasons to Agree with Public Banking," the stance is already implied. Writing "Public banking would reduce the poverty tax on unbanked households because..." re-states the context and then dumps evidence into the wrong place. That turns every cell into a mini-essay, making the page a wall of text instead of a scannable network. ISE only works if each argument is atomic, linkable to its own page, and scannable at a glance.

**How to apply:**

GOOD argument labels:

- "poverty tax on unbanked"
- "postal infrastructure already exists"
- "captures political influence"
- "crowding out private banks"
- "long-term cost"
- "spoiler effect"
- "ballot exhaustion"
- "voter confusion"

BAD argument labels (too long, re-states context, embeds evidence):

- "Financial exclusion imposes a documented poverty tax on low-income households through check cashing fees, payday loans, and money orders..."
- "The EITC, which requires earned income, raised single mothers' employment by 6 to 10 percent after the 1993 expansion..."
- "RCV eliminates the spoiler effect — voters can rank their genuine first choice without wasting their vote on a non-viable candidate"

Test: If the label contains a percentage, a citation, the word "because," or more than one clause, it's wrong. Strip it to the subject.

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

- Argument cell: a label naming a reason. No citations, no percentages, no study names.
- Evidence Ledger row: Tier, Source, Stance, Which-Argument-It-Bears-On, Linkage. Data lives HERE.
- Visual and video evidence (charts, photos, memes, documentaries, book imagery) belongs in the Evidence Ledger too, tiered by the underlying source, and paired with the argument it bears on.
- If a cell in the Argument Tree contains "FDIC data," "Pew research shows," or a number, it's misfiled. Move the data to the Evidence Ledger and keep the label in the argument tree.

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

## Canonical Section Order

1. Belief Statement
2. Score + Topic line (Score: pro/con from sub-arguments | Topic: Category > Subcategory)
3. Argument Trees (Reasons to Agree vs. Reasons to Disagree — labels only)
4. Evidence Ledger
   - 4a. Text and Data Sources (Tier / Source / Stance / Argument It Bears On / Linkage)
   - 4b. Visual and Video Evidence (Type / Description / Stance / Source / Tier / Argument It Bears On / Linkage)
5. Values Conflict Analysis
   - 5a. Value Priority Rankings (Value / Supporters' Rank / Opponents' Rank / Gap / Self-Reported % / Confidence / Source)
   - 5b. Shared Values, Different Priorities (Shared Value / Supporters' Priority Context / Opponents' Priority Context)
   - 5c. Cross-Context Consistency Check (Value / Deprioritized By / Other Topic Where They Champion It / What This Suggests)
   - 5d. Advertised vs. Actual Motivation (symmetric Supporters/Opponents)
6. Interests and Motivations
   - 6a. Interest Priority Rankings (same column shape as Values)
   - 6b. Shared vs. Conflicting Interests (with "Why the Conflict Exists")
   - 6c. How Interests Drive Value Rankings (Interest at Stake / Side / Value Elevated / Value Deprioritized / Confidence)
7. Foundational Assumptions (Required to Accept vs. Required to Reject)
8. Objective Criteria (Criterion / Current Status / Threshold for Agreement)
9. Cost-Benefit Analysis (Benefits vs. Costs, then Short-Term vs. Long-Term)
10. Resolution
    - 10a. Best Compromise Solutions vs. Primary Obstacles
    - 10b. Biases (Affecting Supporters vs. Affecting Opponents)
11. Belief Mapping (Upstream / Downstream / Similar)
12. Legal Framework (Supporting Laws vs. Contradicting Laws)
13. **Definitions and Scoring Concepts (LAST before footer)**
14. Contribute / footer

**Removed from canonical order (intentionally):** Falsifiability Test, Testable
Predictions, and Media Resources are no longer top-level sections. Falsifiability
is implicit in the Objective Criteria thresholds. Testable Predictions, when
relevant, render as objective criteria. Media items move into Visual and Video
Evidence under the Evidence Ledger, paired with the argument they bear on.

---

## Pre-Generation Checklist

Before outputting any ISE belief page, verify:

- [ ] No summary or background section at the top
- [ ] Definitions section is LAST, not first
- [ ] Every argument cell is 2-6 words
- [ ] No citations, percentages, or study names in argument cells
- [ ] All evidence lives in the Evidence Ledger with tier assigned
- [ ] Visual/video items live in the Visual and Video Evidence sub-table, not in a separate Media section
- [ ] Values section has all four sub-tables: Priority Rankings, Shared Values, Cross-Context, Advertised vs. Actual
- [ ] Interests section has all three sub-tables: Priority Rankings, Shared vs. Conflicting (with Why), Interest -> Value Linkage
- [ ] Resolution section bundles Compromise/Obstacles AND Biases together
- [ ] Every link points to a page that exists OR is plain text
- [ ] No `href="#"` anchors anywhere
- [ ] Both sides have symmetric structure in Values, Interests, Biases
- [ ] Score cells are blank for unpopulated arguments
