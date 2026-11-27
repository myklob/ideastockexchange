# Topic Template compliance

Template: PBWorks "Topic_Template" (page 163299003). Authority: the Drive export `15QgAif9nfO1o-qH-TRqS-QOJXPkVRyMQ`
(Drive file dated 2026-03-12; its export header reads 2026-02-15), copied to
`scratchpad/tpl/topic_template-export.txt`.
The live crawl of Topic_Template (`pb_pages.jsonl`, "last edited 9 months, 1 week ago") matches the export section for
section, column for column. So the "Export / live differ?" column below compares the export with the **live successor
page**, "Beliefs_on_topic_organized_by_Spectrum_Positions" (edited about 3 months ago). That is the page the repo's
`templates/topic-template.html` and `render_topic` actually follow.

Related export `13hCzS1WkcqjGIKEArXrv1Oeh9soAXe_J` (2026-03-08), copied to
`scratchpad/tpl/beliefs_on_topic_organized_by_spectrum_positions-export.txt`.
It is not a topic template. It is a belief-page draft with a topic breadcrumb, and the export is cut off partway
through "Similar Beliefs". The live page at that address is a different, later document: a filled topic page
("Protecting the Constitution"). Section C below lists the differences.

**Measured on:** all 104 topic pages in the build under `site/t/`. 23 have an `axis` in `content/topics.csv` and get the
full layout. 81 are subjects with no axis and get a directory page; 66 of those have rows of their own and 15 are
directory-only. Counts come from
`scratchpad/tplscripts/measure_topic.py`
and `measure_topic2.py`. Both strip forms and scripts first and match tags by attribute.

**Skeptic pass (2026-11-22).** Every page count was re-measured with an independent script,
`scratchpad/skeptic_topic/m.py`, over the
same build; every cited render_site.py line was re-opened against the checkout at `3276ea1`; the export was re-read for
elements the matrix skipped. Rows marked "(checked)" held. Rows marked "(corrected)" changed: 34, 46, 47, 48, 58, 59 and
62, plus three A2 rows. Rows 64 to 70 are "(added)". The tally is now 70 elements: 26 comply, 25 comply differently,
7 partly, 10 missing, 2 conflict with the rules doc. "66 of those" below means 66 subject pages with beliefs or rows
filed on them (`topic_has_content`, render_site.py:132).

**Next.js app:** `src/app/debate-topics/[slug]/page.tsx` with `src/components/debate-topic/*`. This is the route
`topic-template.html` names as its mirror. `src/app/topics/[slug]` is a separate list of beliefs by dimension. Nothing
was measured on the Next.js app because it has no build.

**Empty sections.** A topic page does not use the belief page's "Not filled in yet" block (render_site.py:1070).
Instead, each unfilled section stays in place as its heading, its caption, the line "Nothing here yet." and its form
(`NOTHING_YET`, render_site.py:2163). This is the rule in `topic-template.html`. The PBWorks template draws every table
with bracketed placeholder rows, but it is a fill-in form and nowhere requires an empty table to be published. The rules
doc's checklist (BELIEF_PAGE_RULES.md:560) says sections that would ship all blank are "self-suppressed (software)". The
site therefore meets both. Below, "carried as unfilled" means that one-line form. The fixed-band tables (Direction,
Claim Strength, General to Specific) are always drawn: 12 of 118 Direction band rows and 20 of 184 Claim Strength cells
print "Nothing here yet." (checked)

## A. Compliance matrix (Topic_Template, in its own order)

Counts are "axis pages of 23; subject pages of 81".

| # | Template element (template wording) | Export / live differ? | Static site: where (render_site.py:line) | Pages carrying it | Next.js app | Status | Gap |
|---|---|---|---|---|---|---|---|
| 1 | "Templates:" list (Belief Analysis, Topic) | Live successor drops it | Not printed; `templates/` plays this role | 0 of 104 | Not printed | Complies differently (author navigation, not page content) (checked) | None. |
| 2 | Breadcrumb "Home › Topics › [Category] > [Topic Name]" | Same | `render_topic` crumbs, 2190-2192 | 104 of 104; parent shown on 90 of 90 that have one | `page.tsx:39-50`, "Topics > cat > title", no Home | Complies (checked) | Only the immediate parent is shown, which matches a one-level [Category]. |
| 3 | H1 "Topic: [Topic Name]" | Same | 2193 | 104 of 104 | `page.tsx:53` | Complies (checked) | None. |
| 4 | "Definition: [Neutral, objective definition of the topic]" | Same | 2194 | 104 of 104 | `page.tsx:57` | Complies (checked) | Rule 2 (no background) governs belief pages only. If it were extended to topics, this line would need an owner ruling. |
| 5 | "Scope: [What is included ... vs. related topics]" | Same | 2195, printed only when typed | 4 of 104 (the `scope` column is filled for 4 of 104 topics) | `page.tsx:60`, always printed | Partly (checked) | Content is missing, and the page says nothing about the blank. |
| 6 | Topic Metrics box | Same | 2288-2295 | 23 of 23; 0 of 81 | `TopicMetrics.tsx` | Partly (checked) | Subject pages have no metrics at all. |
| 7 | Metric "Importance: [0-100]" | Live keeps "[XX]" | Deliberately left off (comment at 2278) | 0 of 104 | Printed from `importanceScore` | Conflicts with rules doc (Rule 6) (checked) | Nothing computes topic importance. Rule 6 forbids a placeholder number but allows "[pending]". |
| 8 | Metric "Evidence Depth: [Low/Med/High]" | Live: "High" | 2289-2290, a count of findings plus how many name a source type | 23 of 23 | Low/Med/High band | Complies differently (a count, not a band) (checked) | Prints a count, not a band. Links to `lists.html#topics`. |
| 9 | Metric "Controversy Rating: [0-100]" | Live: "Controversy: [XX]" | 2291-2292, % of beliefs with scored weight on both sides | 23 of 23 | Number | Complies differently (a percentage of beliefs) (checked) | None. |
| 10 | "Spectrum 1: The Debate Landscape (Negative ↔ Positive)" | Live: "Continuum 1: Direction (Oppose ↔ Support)" | 2305 | 23 of 23; 0 of 81 | `PositionSpectrum.tsx`, "1. The Position Spectrum" | Complies differently (live-page name; subjects get a directory per CLAUDE.md) (checked) | The template has no subject variant. The 81 subject pages follow the owner direction in CLAUDE.md, not the template. |
| 11 | Caption "Mapping beliefs based on their sentiment ..." | Live rewrites it | 2306-2308 | 23 of 23 | Own caption | Complies differently (live wording) (checked) | None. |
| 12 | Column "Position" | Same | 2311 | 23 of 23 | Yes | Complies (checked) | None. |
| 13 | Column "Core Belief / Claim" | Same | 2311, 2323-2330 | 23 of 23 | "Belief Held at This Position" | Complies (checked) | None. |
| 14 | Column "Top Underlying Argument" | Same | 2311; `strongest_reason` 2129 | 23 of 23 | "Top Sub-Argument Driving the Score" | Complies (checked) | None. |
| 15 | Column "Truth Score" [±XX] | Live renamed it "Belief Score" | 2311, signed `sf(belief)` | 23 of 23 | "Belief Score" | Complies differently (signed Belief Score, the live name) (checked) | The signed value matches the template's [−XX]/[+XX]. Only the label differs. |
| 16 | Column "Media" [Link] | Live drops it | Not printed | 0 of 104 | Replaced by "Evidence" | Missing (checked) | No position row links its best media. |
| 17 | Five bands: -100% Strongly Oppose ... +100% Strongly Support | Same | `DIRECTION_BANDS` 2147; loop 2318 | 23 of 23 | Yes | Complies (checked) | The site adds a "Not labelled yet" row on 3 pages, so an unplaced belief does not borrow the 0% band. |
| 18 | "See: Full Positivity Framework" | Same in live | Not printed | 0 of 104 | Not printed | Missing (checked) | A target exists: `grouping.html#direction`. |
| 19 | "Foundational Assumptions: What You Must Believe at Each Position" | Live: "Assumption Stack Behind Each Position" | 2395 | 23 of 23 | `FoundationalAssumptions.tsx` | Complies differently (live name) (checked) | None. |
| 20 | Caption "Your position on this spectrum depends on deeper assumptions ..." | Live rewrites it | 2396-2397 | 23 of 23 | Yes | Complies differently (live wording) (checked) | None. |
| 21 | "Key Insight: [the core assumption that divides the two sides]" | Live renames it "Core split:" in the caption | Not printed | 0 of 23 | Printed when `assumptionKeyInsight` is set | Missing (checked) | `topic-template.html` keeps "Core split:", but `render_topic` has no field for it. `topic-template.html`:38 bans "Key insight" boxes; its stack caption (line 204) carries the split inline as "Core split:". |
| 22 | Columns "To Hold Position" / "You Must Believe These Assumptions (Ordered General → Specific)" | Live: "You Must Accept" | 2418 | 23 of 23 drawn (19 typed, 4 with load-bearing parts only); 0 unfilled | Yes | Complies (checked) | None. |
| 23 | Band "-100% to -50% (Strongly Oppose)" | Same | `STACK_BANDS` 2152 | 23 of 23 | Yes | Complies (checked) | None. |
| 24 | Band "-50% to -20% (Skeptical)" | Live drops it | Not in `STACK_BANDS` | 0 of 23 | Yes | Missing (checked) | Skeptical believers have no row. |
| 25 | Band "-20% to +20% (Nuanced/Mixed)" | Same | 2154 | 23 of 23 | Yes | Complies (checked) | None. |
| 26 | Band "+20% to +50% (Supportive)" | Live drops it | Not in `STACK_BANDS` | 0 of 23 | Yes | Missing (checked) | Supportive believers have no row. |
| 27 | Band "+50% to +100% (Strongly Support)" | Same | 2156 | 23 of 23 | Yes | Complies (checked) | None. |
| 28 | Five numbered lines per outer band (worldview, political, causal, topic-specific, "5. Most specific claim") | Live has 4 | `STACK_BANDS` fields, 4 per band | 19 of 23 typed, with 4 lines | 5 | Partly (checked) | Line 5, "Most specific claim", has no field. |
| 29 | "Spectrum 2: The Abstraction Ladder (General ↔ Specific)" | Live: "Continuum 3: General to Specific, with Branching Subcategories" | 2359 | 23 of 23 | `AbstractionLadder.tsx` | Complies differently (live branching tree) (checked) | None. |
| 30 | Columns "Level" / "Pro-Topic Assumption Chain" / "Anti-Topic Assumption Chain" | Live: "Rung / Branch", "Pro-Topic Belief", "Anti-Topic Belief" | 2363 | 23 of 23 | Template columns | Complies differently (live columns) (checked) | None. |
| 31 | Rung "Most General (Worldview)" | Same | 2369 / 2385 | 23 of 23 | Yes | Complies (checked) | None. |
| 32 | Rung "Political/Ethical Philosophy" | Live replaces it with Subcategory branches | Not printed | 0 of 23 | Only if authored | Missing (checked) | Subcategory rows exist on 19 of 23 pages, but none is a political-philosophy rung. |
| 33 | Rung "This Topic" (position on this topic) | Live drops it | Not printed | 0 of 23 | Only if authored | Missing (checked) | None. |
| 34 | Rung "Most Specific (Policy/Action)" | Live: "└─ Specific" leaves | 2379 / 2391 | 19 of 23 | Yes | Complies differently (leaf rows) (corrected) | 4 pages (ai-progress, climate-outcomes, crypto, us-economy) have no `rung` rows and no belief filed beneath another, so their ladder is the one "Most General" row: no branch and no leaf. |
| 35 | "↓" connector rows between rungs | Live: one "branches into subcategories ↓" row | 2370 / 2387 | 23 of 23 | ↓ connectors | Complies differently (checked) | None. |
| 36 | "See: General to Specific Framework" | Same in live | Not printed | 0 of 104 | Not printed | Missing (checked) | A target exists: `grouping.html#specificity`. |
| 37 | "Core Values Conflict" | Same | 2424 | 23 of 23 | `CoreValuesConflict.tsx` | Complies (checked) | None. |
| 38 | Columns "Values Supporting This Topic" / "Values Opposing This Topic" | Same | 2438 | 23 of 23 drawn; 0 unfilled | Yes | Complies (checked) | None. |
| 39 | "Advertised:" numbered list | Same | 2435 | 23 of 23 | Yes | Complies (checked) | None. |
| 40 | "Actual (critics say):" numbered list | Live: "Critics say the actual motivation is:" | 2436, printed only when typed | 19 of 23 | "Actual (per critics):" | Complies differently (live wording) (checked) | 4 pages print no critics' list. |
| 41 | "Common Ground & Compromise" | Live: "and" | 2459 | 23 of 23 | `CommonGround.tsx` | Complies (checked) | None. |
| 42 | Columns "What Both Sides Might Agree On" / "Possible Compromise Positions" | Live: Shared Interests / Real Value Conflicts / Compromise Candidates | 2467-2469, three columns | 20 drawn, 3 unfilled | The template's two columns exactly | Complies differently (live three-column form) (checked) | None. |
| 43 | "The Evidence Ledger" | Same | 2478 | 23 of 23 | `EvidenceLedger.tsx` | Complies (checked) | None. |
| 44 | Caption "Weighing the raw data. Quality scores are based on methodology, sample size, and reproducibility." | Live: "highlight reel ... sorted by quality" | 2479-2480 | 23 of 23 | Own caption | Complies differently (live wording) (checked) | None. |
| 45 | Columns "Supporting Evidence (Pro)" / "Weakening Evidence (Con)" | Same | 2488 | 17 drawn, 6 unfilled | One table with a ↑↓ column, not two sides | Complies (checked) | Next.js does not lay the sides beside each other. |
| 46 | Column "Quality" [95%] (source type) | Same in live | 2488, "Truth" with the source type beneath | 17 of 17 tables; 79 of 364 filled Truth cells read "(Nothing observed)" | "Quality" plus Linkage and Standing | Complies differently (finding truth, not quality) (corrected) | The label differs from both template and live page. Renaming it changes what the number claims to be. |
| 47 | Row "[Study/Data Title] / Source: [Institution/Author] (Year) / Finding: [...]" | Live: "Producer. Finding:" | `ev_cell` 2482-2486 via `H.rowtext` (495): the finding, linked, then its typed `source` line and a "read the source; checked [date]" line | 338 of 364 findings print a source line, 294 of them with a year; 210 have the read-the-source line | Source column | Complies differently (corrected) | The source line is the row's typed `source` text (e.g. "Anthropic, &quot;Anthropic Economic Index ...,&quot; 2025"), not separate Institution and Year fields. 26 findings print no source line and 44 more print no year. |
| 48 | "See: Evidence Scoring Methodology" | Same in live | Not printed | 0 of 104 | Has a "See" link | Missing (corrected) | A target exists: `method.html#starts` ("Where a page starts"), which explains how a finding's source type sets its truth, the number this ledger prints. `method.html#evs` is the wrong target: it describes the EVS column, which the topic ledger does not print and "no score reads". |
| 49 | "Best Media & Resources" | Live: "and" | `media_section` 2204-2223, call 2513 | 14 drawn and 9 unfilled of 23; 22 of 81 | `MediaResources.tsx` | Complies (checked) | None. |
| 50 | Sort "sorted by their bias (positivity) and informational value" | Live: "Sorted by positivity, highest first" | 2217, by impact | 36 tables | Authored order | Conflicts with rules doc (Rule 8: rows rank by score, never editorial placement) (checked) | Positivity is typed by authors. Sorting by it is the editorial ordering Rule 8 forbids. |
| 51 | Column "Title" | Same | 2216 | 569 of 569 rows | Yes | Complies (checked) | None. |
| 52 | Column "Medium" | Same | 2216, falls back to page type | 569 of 569 | Yes | Complies (checked) | None. |
| 53 | Column "Bias/Tone" | Same | 2216, from typed `tone` | 167 of 569 | "Bias / Tone" | Partly (checked) | Mostly blank, because `topic_media` rows are rare. |
| 54 | Column "Positivity" [±XX%] | Same | 2216, from typed `positivity` | 166 of 569 | "Direction" | Partly (checked) | Same cause as row 53. |
| 55 | Column "Key Insight" | Same | 2216, `insight` or the page's `bridge` | 569 of 569 | Yes | Complies (checked) | None. |
| 56 | "See: Media Framework" | Same in live | Not printed | 0 of 104 | Has a "See" link | Missing (checked) | A target exists: `method.html#media`. |
| 57 | "Related Topics" | Same | `related_section` 2225-2242 | 23 of 23; 66 of 81 | `RelatedTopics.tsx` | Partly (checked) | The 15 directory-only pages have no Related Topics. |
| 58 | Column "Broader Categories (Parents)" | Live: "Broader (Parents)" | 2240-2241 | 89 of 89 filled | "Broader (Parents)" | Partly (corrected) | One parent at most. The template asks for "[Link to Parent 1], [Link to Parent 2]", but `topics.csv` has a single `parent` column and `related` rows take only child, sibling or opposing (ise_tables.py:72; `related_section` 2241 prints `tl(parent['key'])` alone). |
| 59 | Column "Specific Sub-Issues (Children)" | Live: "Sub-Issues (Children)" | 2241 | 82 of 89 filled | "Narrower (Children)" | Complies (corrected) | None. |
| 60 | Column "Related Concepts (Siblings)" | Live: "Related (Siblings)" | 2241 | 84 of 89 filled | "Adjacent (Siblings)" | Complies (checked) | The site adds a fourth column, "Opposing / Critical Views", from the live page (19 of 23 filled). |
| 61 | "Contribute" | Same | 2269 / 2519 | 104 of 104 | `page.tsx:190` | Complies (checked) | None. |
| 62 | "Contact me to add beliefs, strengthen arguments, or link new evidence." | Live adds "or propose criteria" | 2520-2522: forms under 9 of the 11 axis-page tables (all but the Evidence Ledger and Best Media, 2491 and 2222) and a propose-a-belief form, 10 in all | 0 of 104 print "Contact me"; 104 of 104 have forms (230 on the 23 axis pages) | "Contact us" links `/contact` | Complies differently (GitHub issue forms; no server) (corrected) | The Contribute caption (2520) says "Every table above has a form under it", and `topic-template.html`:43 says "a form under every table". The Evidence Ledger and Best Media tables have none. |
| 63 | "GitHub for technical implementation and scoring algorithms." | Same | 2523 (`GIT_NOTE`) | 104 of 104 | Yes | Complies (checked) | None. |
| 64 | Metric labels linked to concept pages (Importance Score, Evidence, ReasonRank) | Same in live | Both printed metrics link `../lists.html#topics` (2289, 2291) | 23 of 23 | Linked to `/algorithms/importance-score`, `/algorithms/evidence-scores`, `/algorithms/reason-rank` (`TopicMetrics.tsx`:26-40) | Complies differently (added) | The static site links the ranking that uses each number, not a page explaining it. `method.html#starts` would explain Evidence Depth. |
| 65 | Spectrum 2 caption "Organizing the assumption chains by level of abstraction. Shows how general worldviews lead to specific positions on this topic." | Live rewrites it | 2360-2362, own caption | 23 of 23 | Own caption | Complies differently (added) | None. |
| 66 | Section headings linked: "Foundational Assumptions" (Assumptions), "Core Values Conflict", "Common Ground &amp; Compromise" (Compromise) | Live keeps the links (Assumption Stack to Assumptions, Common Ground to Compromise) | Plain-text headings (2395, 2424, 2459) | 0 of 23 linked | Foundational Assumptions links `/algorithms/assumptions` | Complies differently (added) | The site has no assumptions, values or compromise explainer page, so plain text is what Rule 5 requires. |
| 67 | Common Ground prompts: "Shared value or goal / Shared concern / Common enemy or problem" and "Solution addressing both sides / Incremental approach / Pilot program or experiment" | Live drops the prompts | Numbered rows typed or read from belief pages (2463-2473) | 20 of 23 | Numbered lists | Complies differently (added) | The prompt categories are not offered on the form, so pilot programs and incremental approaches are not asked for by name. |
| 68 | Ledger rows that are not studies: "[Historical Precedent/Statistic]" against "[Logical Paradox/Counter-Statistic]", unlinked, Quality only | Live keeps finding rows only | Every cell is a finding page with a source type (2482-2486) | 17 of 17 tables | Source column | Complies differently (added) | A "Logical Paradox" is an argument, not evidence, so that placeholder conflicts with Rule 4. The site's finding-only ledger follows Rule 4. |
| 69 | Colour cues: red [−XX], green [+XX], tinted band cells | Not visible in the text crawl | Band cells tinted (`BAND_COLOURS` 2146); scores signed by `sf` (449) but not coloured | 23 of 23 | Tinted bands | Complies differently (added) | Sign carries the meaning; no colour. |
| 70 | Icons before headings (📊, 📜, 🪜, ⚖️, 🤝, 📚, 🔗, 📬) | Live keeps them | None | 0 of 104 | None in headings | Complies differently (added) | Deliberate: `topic-template.html`:38, "Headings are words. No pictures in front of them". |

### A2. Site elements the Topic_Template does not have

| Element | Static site (line) | Pages | Source | Status against the rules doc |
|---|---|---|---|---|
| "What this page does." callout above Direction | 2296 | 23 of 23 | Live successor page; `topic-template.html` | Conflicts with rules doc (Rule 1: anything labelled "What this is" goes after the analysis). It also reads the same on every topic, which `topic-template.html` itself gives as the reason it bans "Key insight" boxes. Next.js does the same with its "What This Page Is For" heading (`page.tsx`:81) and an "Audit lock" box (71-78), both above the Position Spectrum. (checked) |
| "Positive means:" axis line | 2309-2310 | 23 of 23 | `topic-template.html`; the related export's "Belief Positivity Towards Topic" | No conflict. (checked) |
| Continuum 2: Claim Strength (Modest ↔ Total) | 2344-2356 | 23 of 23 | Live page; `check_templates.py` requires its bands | No conflict. Page cells carry a truth score; belief cells carry none. (checked) |
| The Engagement Landscape | 2444-2456 | 19 drawn, 4 unfilled | Live page | No conflict. (checked) |
| Best Objective Criteria | 2495-2510 | 19 drawn, 4 unfilled; 14 tables over five rows | Live page | Conflicts with rules doc (Rule 8), if Rule 8 covers topic pages (corrected). Rows print in authored order (`crit = section_rows('criteria')`, 2500, no sort). 17 of the 19 tables have no Criteria Score at all, because their criteria are typed words with no page; on the other 2 (caitlin-clark, online-life) blank scores sit above or between real ones. Next.js has `ObjectiveCriteriaTable.tsx` but never imports it. |
| "Sub-topics" table | 2197-2203 | 3 of 23; 28 of 81 | Site only | Out of template order on axis pages, where it sits above Topic Metrics. Rows print in `topic_children` order, not by a score. (checked) |
| "Beliefs filed beneath this topic" (directory) | 2255-2263 | 0 of 23; 81 of 81 | CLAUDE.md owner direction | No conflict. Sorted by belief score. (checked) |
| Top-five fold on ranked tables | Not applied: 4565 skips `collapse_tables` (defined 395; its regex at 419 matches only `class="scored"` and `class="plain"`, not `class="tpl"`) | 113 tables over 5 rows on 58 pages, none folded. By section: Best Media 35, Beliefs filed beneath 22, General to Specific 19, Evidence Ledger 17, Objective Criteria 14, Sub-topics 3, Direction 3 | Rule 8 | Conflicts with rules doc (Rule 8), if Rule 8 covers topic pages (corrected: line and breakdown). The 113 includes 22 fixed-band or tree tables the fix below leaves unfolded. |
| Revision stamp | `stamp` 2524 | 104 of 104 | `topic-template.html` | No conflict. (checked) |

## B. Section order

Template order: Header (breadcrumb, H1, Definition and Scope, Topic Metrics), Spectrum 1, Foundational Assumptions,
Spectrum 2 Abstraction Ladder, Core Values Conflict, Common Ground, Evidence Ledger, Best Media, Related Topics,
Contribute.

Static site (axis pages): Header, [What this page does], Continuum 1, [Continuum 2], Continuum 3 (the ladder), Assumption
Stack, Core Values, [Engagement], Common Ground, Evidence Ledger, [Objective Criteria], Best Media, Related Topics,
Contribute.

Out of order:
- **Continuum 3 (the Abstraction Ladder) comes before the Assumption Stack.** The template puts the ladder after the
  assumptions. The site follows the live successor page, which made this swap, so this is drift between export and
  live page that the site has followed. (checked: the crawled live page runs "└─ Specific" rows straight into "Assumption Stack Behind Each Position")
- **Sub-topics table** (3 axis pages): printed between Definition and Topic Metrics. In the template, children appear
  only in Related Topics, at the end.
- Every other template section keeps its relative order. The bracketed site-only sections are insertions, not swaps.

Subject pages (81) have no template order to keep: H1, Definition, Sub-topics, Beliefs filed beneath, Best Media (22),
Related Topics (66), Contribute.

Next.js: Position Spectrum, **Evidence Ledger** (moved from seventh to second), Claim Strength, Engagement, Assumptions,
Ladder, Values, Common Ground, Media, Related, Contribute. The Evidence Ledger is out of order. Assumptions and Ladder
are in template order. (checked)

## C. The related export (Beliefs_on_topic_organized_by_Spectrum_Positions) against the Topic_Template

The export is a belief-page skeleton with "Belief: Home › Topics › [Category] > [Topic Name]" as its H1. None of its
analysis tables are topic tables. Where it adds something a topic page could carry:

| Export element | Topic_Template has it? | Static site | Next.js | Status |
|---|---|---|---|---|
| "Topic IDs: Dewey: [Number]" | No | Not printed; `TOPIC_COLS` (ise_tables.py:77) has no field | `ExternalReferences.tsx` prints `deweyDecimal` | Missing (checked) |
| "Belief Positivity Towards Topic: [Scale -100% to +100%]" | No (implicit in Spectrum 1) | The "Positive means" line, and each belief's band | Position column | Complies differently (checked) |
| "Topic: Evidence Depth > Controversy Rating" | Yes, as metrics | Rows 8-9 | Yes | Complies differently (checked) |
| Argument Trees with "Argument Score", "Linkage Score", "Impact" columns and "Total Pro" / "Total Con" rows | No | Topic pages have no linkage column and no totals row. Direction carries one signed Belief Score. | No | Complies differently. "Argument Score" is a retired column name under `check_templates.py`, not under BELIEF_PAGE_RULES.md. (checked) |
| Magnitude rows "Weak (20%)" ... "Extreme (100%)" | No ("strong vs weak" in the intro only) | Modest, Moderate, Strong, Total (2148) | Claim Strength | Complies differently. `check_templates.py` retires Weak and Extreme. (checked) |
| Evidence tables with "Evidence Score", "Linkage Score", "Type", "Contributing Amount" | No (Quality only) | Truth plus source type | Quality, Linkage, Standing | Complies differently ("Evidence Score" is also retired) (checked) |
| Objective Criteria (If True, Value Supporters / If False, Value Opponents) | No | Proposed Criterion / Criteria Score / four typed labels | Not rendered | Complies differently (checked) |
| Core Values as four columns (Supporters, Opponents, Shared, Conflicting Interests) | Two columns | Two columns | Two columns | Matches Topic_Template, not the export (checked) |
| Conflict Resolution Framework, Obstacles, Biases | No | Not on topic pages | No | Not a topic element (checked) |
| Media as Supporting / Opposing | Five-column table | Seven-column table | Seven columns | Matches Topic_Template (checked) |
| General to Specific as Upstream / Downstream tables | Ladder | Continuum 3 | Ladder | Matches Topic_Template's idea in the live form (checked) |
| Similar Beliefs (More Extreme / More Moderate) | No | Not on topic pages | No | Not a topic element. The export is truncated here. (checked) |

## D. Fixes, most important first

- [ ] **Add the Skeptical and Supportive assumption bands** (work) (checked). In `render_site.py` `STACK_BANDS` (2152), add
  `('skeptical', '-50% to -20%', 'Skeptical', 'b-n50', ...)` and `('supportive', '+20% to +50%', 'Supportive', 'b-p50', ...)`
  in template order. Update the `stack` entry in `ise_tables.TOPIC_SECTIONS` (ise_tables.py:66) and the stack table in
  `templates/topic-template.html` (213-221) to match. Every axis page would then print five "To Hold Position" rows, as the
  template does. An empty band prints "Nothing here yet."
- [ ] **Print the "See:" link under each of four tables** (work) (corrected: the evidence target). In `render_topic`,
  append a "See:" line after the Direction table (2341), the General to Specific table (2392), the Evidence Ledger (2491)
  and, inside `media_section`, the Media table (2222). The links are "See: Full Positivity Framework" to
  `../grouping.html#direction`, "See: General to Specific Framework" to `../grouping.html#specificity`, "See: Evidence
  Scoring Methodology" to `../method.html#starts` and "See: Media Framework" to `../method.html#media`. All four targets
  exist, so Rule 5 is met. Not `method.html#evs`: that section explains the EVS column, which the topic ledger does not
  print and which "no score reads".
- [ ] **Add the split line to the assumptions** (work) (corrected: the label). In `render_topic` (2395-2397), read a
  `stack` row with `category = split` and print "<strong>Core split:</strong> ..." at the end of the caption, as
  `topic-template.html`:204 and the live page already do. Print nothing when no row exists. Document the category in
  `TOPIC_SECTIONS['stack']`. Use "Core split:" rather than the export's "Key Insight:", because `topic-template.html`:38
  bans "Key insight" boxes; if the owner wants the export's label, change that rule first.
- [ ] **Add the Media column to Direction** (work) (checked). In `render_topic`'s Direction loop (2318-2340), add a fifth column
  "Media". It would show the highest-impact media page cited for or against the band's beliefs (`media_for` or
  `media_against`, as `media_section` collects them), linked, or nothing. Add the header at 2311 and the same column to
  `topic-template.html`.
- [ ] **Decide what Importance shows in Topic Metrics** (owner decision) (checked). The template asks for a 0-100 number,
  and Rule 6 forbids printing one that nothing computes. Choose between printing "Importance: not computed yet" (which
  Rule 6 permits as "[pending]") and defining a computation, such as the ReasonRank weight of the topic's beliefs. The
  second would add a published number.
- [ ] **Add the Political/Ethical and This Topic rungs** (work) (checked). In `render_topic`'s typed-rung branch (2367-2379),
  accept `category = political` and `category = topic` rows. Print them between "Most General" and the subcategories,
  with a "↓" row between rungs. Add both to `TOPIC_SECTIONS['rung']` (ise_tables.py:65), and add a "5. Most specific"
  field to the outer `STACK_BANDS` entries so row 28 can be filled.
- [ ] **Fold ranked topic tables to their top five** (work) (corrected: line and count). At 4565, wrap `render_topic`
  output in `collapse_tables`. Widen its regex (419) to `class="tpl"` for the Evidence Ledger, Best Media and "Beliefs
  filed beneath" tables only. Leave the fixed-band and tree tables (Direction, Claim Strength, General to Specific,
  Assumption Stack, Engagement) unfolded. That would fold 74 tables on 52 pages (Media 35, Beliefs filed beneath 22,
  Evidence Ledger 17), not 113 on 58: the 113 counts every table over five rows. Objective Criteria (14 tables over five
  rows) waits on the next fix, since folding an unsorted table hides rows by authored position.
- [ ] **Sort Objective Criteria by Criteria Score** (work) (added). At 2500, sort `crit` by the criterion page's truth,
  descending, with unscored rows last, as Rule 8 asks. It changes order on 2 of 19 tables today (caitlin-clark,
  online-life); the other 17 have no scored criterion.
- [ ] **Make the Contribute caption true** (work) (added). The caption at 2520 and `topic-template.html`:43 say every
  table has a form under it; the Evidence Ledger and Best Media have none. Either add `add_form` after 2491 (filing a
  finding needs a belief to attach to, so it would open the propose-a-row form for a chosen belief) and after the media
  table, or change both sentences to name the tables that take rows.
- [ ] **Allow more than one parent topic** (work) (added). In `related_section` (2241), list `related` rows with
  `category = parent` beside the `topics.csv` parent, and add `parent` to the categories at ise_tables.py:72. The
  template's Parents cell holds "[Link to Parent 1], [Link to Parent 2]"; the site can hold one.
- [ ] **Give directory pages Related Topics** (work) (corrected: what it would show). In `render_topic`'s directory
  branch (2264-2268), call `related_section(False)` when `has_content` is false as well. Of the 15 directory-only pages,
  14 are top-level, so they would gain only a Children column that repeats their Sub-topics table; 1
  (government-ethics) would gain a parent and siblings. Low value.
- [ ] **Move the Sub-topics table to the foot on axis pages** (work) (checked). In `render_topic` (2197-2203), print the
  Sub-topics table only on directory pages. On axis pages, Related Topics' Children column already lists them
  (`named('child', kids)`, 2241). It affects 3 axis pages.
- [ ] **Fill the Scope column** (work) (checked). `content/topics.csv` has a scope for 4 of 104 topics. Add the missing
  scopes, then run `sync_content.py --to-workbook` and then `--check`.
- [ ] **Fill Bias/Tone and Positivity on media rows** (work) (checked). Only 167 and 166 of 569 media rows carry them;
  `content/edges.csv` has 167 `topic_media` rows. Add `topic_media` rows for the works already cited.
- [ ] **Type the missing source lines in the Evidence Ledger** (work) (corrected: the site already prints them).
  `ev_cell` prints each finding's typed `source` line, with its year where the author typed one: 338 of 364 findings
  carry a source line and 294 a year. Add the source on the 26 findings that lack one and the year on the 44 more that
  lack it, in `content/edges.csv`, then run `sync_content.py --to-workbook` and `--check`. No code change.
- [ ] **Add a Dewey field** (work; it comes from the related export only) (checked). Add `dewey` to `TOPIC_COLS`
  (ise_tables.py:77) and print it in the metrics line at 2288 when typed.
- [ ] **Decide the Media sort order** (owner decision) (checked). The template and the live page both say to sort by
  positivity. Rule 8 says to rank by score. The site sorts by impact (2217). Either change the template or keep the
  Rule 8 order.
- [ ] **Decide the Evidence Ledger's score label** (owner decision) (checked). The template and live page say "Quality".
  The site prints "Truth", the finding page's truth. Relabelling it "Quality" would change what the published number
  claims.
- [ ] **Decide where "What this page does" goes** (owner decision) (checked). The live page and `topic-template.html`
  put it above Direction. Rule 1 puts any "what this is" text after the analysis. If moved, it would print under
  Contribute (render_site.py:2296). The same question covers Next.js's "What This Page Is For" (`page.tsx`:81).
- [ ] **Decide the ladder's order** (owner decision) (checked). The Topic_Template puts the Abstraction Ladder after
  Foundational Assumptions. The live page, `topic-template.html` and the site put it before. Pick one and change the
  other two to match.
- [ ] **Put the Next.js Evidence Ledger back in template order** (work) (checked). In `src/app/debate-topics/[slug]/page.tsx`,
  move the `EvidenceLedger` block (114-120) to after `CommonGround` (164-170), and render `ObjectiveCriteriaTable`.
