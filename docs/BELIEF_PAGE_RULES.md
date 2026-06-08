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

The April 2026 redesign restructures the page around a single **Conflict Resolution
Framework** and brings back the Falsifiability Test, Testable Predictions, and Media
Resources sections. The source of truth is `templates/belief-analysis-template.html`.

Header: Belief statement → metadata line (Topic / Dewey / Positivity / Net Belief
Score / Related) → "Beliefs this supports" line. No summary or background (Rule 2).

1. **Argument Trees** — one two-sided scored table (Reasons to Agree / Reasons to
   Disagree), each side with `Argument / Score / Link / Impact`. Each argument cell is
   the claim, the single most famous supporting quote inline (italic, small), then the
   submitter as `~Name`. Pro Total / Con Total row, then the **Net Belief Score** line.
2. **Evidence Ledger** — one two-sided table (Supporting / Weakening), each side with
   `Evidence / Type / Link / Impact`.
3. **Conflict Resolution Framework**
   - 3a. Shared Values, Different Rankings (`Value / Supporter Rank / Opponent Rank /
     Why Rankings Differ`, then a "What would shift these rankings?" row)
   - 3b. Likely Interests of Supporters (`Interest / Prevalence / Linkage Confidence /
     Validity / Evidence Basis / Connected Value`, plus a Pretextual/Low-validity row)
   - 3c. Likely Interests of Opponents (same columns, symmetric)
   - 3d. Shared and Conflicting Interests — Shared Interests table (`Shared Interest /
     Validity / Compromise direction`) + Primary Conflict Pair (`Interest in the pair /
     Standalone Validity / Claim strength on THIS issue / What drives its claim here`)
   - 3e. Advertised vs. Actual Motivations (rows: Advertised reason / Actual driver /
     Evidence for divergence, columns Supporters / Opponents)
   - 3f. Dispute Types (Empirical / Definitional / Values)
   - 3g. Primary Obstacles to Resolution (Supporters / Opponents)
4. **Objective Criteria** (`Criterion / How to Measure / Current Status / Target`)
5. **Falsifiability Test** (Evidence That Would Confirm / Falsify) + **Testable
   Predictions** (`Prediction / Timeframe / Verification Method`)
6. **Foundational Assumptions** (Required to Accept / Required to Reject)
7. **Cost-Benefit Analysis** (Benefits / Costs and Risks), then **Short vs. Long-Term
   Impacts**, then **Best Compromise Solutions** (`Shared Premise / Proposed Synthesis /
   Why This Is Difficult`)
8. **Biases** (Affecting Supporters / Affecting Opponents)
9. **Media Resources** (Supporting / Challenging or Complicating, with Books)
10. **Legal Framework** (Supporting / Complicating)
11. **General to Specific Belief Mapping** (Upstream Support/Oppose, Downstream
    Support/Oppose)
12. **Similar Beliefs** (More Extreme / More Moderate)
13. **Definitions** (`Term / Definition`) — LAST before footer
14. **Contribute / footer**

**Reintroduced in this redesign:** Falsifiability Test, Testable Predictions, and Media
Resources are once again top-level sections. (They were folded into other sections in the
prior revision; the April 2026 template restores them as standalone sections.)

---

## Pre-Generation Checklist

Before outputting any ISE belief page, verify:

- [ ] No summary or background section at the top
- [ ] Header has the metadata line (Topic / Dewey / Positivity / Net Belief Score / Related) and "Beliefs this supports"
- [ ] Definitions section is LAST, not first
- [ ] Argument cells are short claim labels with the famous quote inline and `~Name` submitter — no citations, percentages, or study names
- [ ] Argument Trees and Evidence Ledger each render as a single two-sided table with Pro/Con (or Supporting/Weakening) halves
- [ ] All evidence lives in the Evidence Ledger with tier assigned
- [ ] Conflict Resolution Framework has all seven sub-sections: Shared Values rankings, Interests of Supporters, Interests of Opponents, Shared+Conflicting (Shared Interests + Primary Conflict Pair), Advertised vs. Actual, Dispute Types, Primary Obstacles
- [ ] Objective Criteria has Criterion / How to Measure / Current Status / Target
- [ ] Falsifiability Test, Testable Predictions, and Media Resources are present as standalone sections
- [ ] Cost-Benefit Analysis bundles Short vs. Long-Term and Best Compromise Solutions (3 columns)
- [ ] Every link points to a page that exists OR is plain text
- [ ] No `href="#"` anchors anywhere
- [ ] Both sides have symmetric structure in Interests, Advertised vs. Actual, Biases, Obstacles
- [ ] Score cells are blank for unpopulated arguments
