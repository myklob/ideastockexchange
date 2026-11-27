# Template compliance: Belief Template (PBWorks page 21959883)

Sources, in order of authority:

1. The export: Drive file 1vU2ieshQFiiruBAMIokYqsRGVXwvygCi, `Template.html` from the PBWorks zip (Drive date 2026-03-12; PBWorks save stamp 2026-02-02). Its text is saved at `scratchpad/tpl/belief-template-export.txt`.
2. The later revision: Drive file 1UVQN1H4G08zUhfYPntJfdia7SE7IGMBs (2026-03-30). It is saved in the same file, with a list of what it changed. The reader cut it off inside its Contribute section.
3. The live page as crawled this morning, used only to note drift: `pb/b4-page-design-templates/07-template.txt`.

What was measured: all 245 belief pages (`pages.csv`, kind=belief) in the fresh build at `scratchpad/site/p/`. Of these, 91 are complete and 154 are drafts (`data/drafts.json`). Counts come from `scratchpad/gen/tplb/measure.py`, run with `python3 -I`.

How the counts are written: "112 (c91/d21)" means 112 pages, of which 91 are complete and 21 are drafts. "+ 133 unfilled" means 133 more pages carry the section as unfilled: it is named in the "Not filled in yet" block, or it appears as a first-row form.

Line numbers refer to `tools/static-site/render_site.py`.

The three template sources do not agree with one another, and the export is the oldest of them. The export still uses the vocabulary that `tools/check_templates.py` retires ("Argument Score", "Evidence Score"), and it uses the T1 to T4 tiers that Rule 4 retires. The repo's own template, `templates/belief-analysis-template.html`, follows `BELIEF_PAGE_RULES.md` and passes `check_templates.py` ("all 15 templates current"). In the places where that repo template differs from the export, it is the rules doc's shape and not drift.

## Does the template require an empty table to be shown?

No.

- **The export.** It is a blank form: every table ships with `&nbsp;` rows. It says nothing about what a filled-in instance should do with a section nobody has filled.
- **The rules doc.** The Rule 8 corollary ("Delete empty scaffolding") says an instance drops any section that would ship with nothing but blank cells.
- **The live page.** It says "Omit this section when no notable positions are on record" for People on the Record.

The site's "Not filled in yet" block (line 1070) goes further than any of these: it names the missing section and gives it a first-row form. The matrix reports this as "carried as unfilled".

The site does print empty halves (corrected). When one side of a two-sided section has rows and the other has none, the empty side reads "Nothing here yet." This happens on 40 pages (c34/d6), not only in the Argument Trees: People on the Record 19, Cost and Gain 7, Argument Trees 6 (all drafts: 2 with no reasons to agree, 5 with none to disagree, 1 of them with neither), Testable Predictions 6, Media 4, General to Specific 3, Interests 3, Similar Beliefs 2, Logical Anatomy 2, Falsifiability 2, Evidence Ledger 1. It keeps the two sides symmetric (Rule 7). A section with no rows on either side is not printed, except the Argument Trees on that one draft.

## 1. Compliance matrix

N = 245 (91 complete, 154 drafts). Rows 1 to 60 follow the export in its own order, and rows 61 and 62 are export elements the first pass skipped. Rows L1 to L24 are elements that exist only on the live page (drift); they are listed after the export rows. Rows R1 to R3 follow them.

Skeptic pass (2026-11-22): every page count was re-measured with a separate script (`scratchpad/gen/skeptic/m*.py`, run with `python3 -I`) and every cited line of render_site.py was re-opened. A row marked "(checked)" was confirmed as written; "(corrected)" was changed; "(added)" is new. The Next.js column was spot-checked only (Dewey, Positivity, How to read, Contribute list), not re-verified row by row.

| # | Template element (template wording) | Export / live differ? | Static site: where (render_site.py:line) | Pages carrying it (of 245) | Next.js app | Status | Gap |
|---|---|---|---|---|---|---|---|
| 1 | H1 "Belief: [Insert Belief Statement Here]" | Live same. The 03-30 revision drops "Belief:". | `render_belief` :717. The H1 holds the statement, with "Belief" as a kind label above it. The breadcrumb reads "Belief: ...". | 245 (c91/d154) | "Belief: {statement}" plus the truth score | Complies differently (prefix moved into the kind label and the breadcrumb) (checked) | None. |
| 2 | "Topic: [Category] > [Subcategory]", linked to One Page Per Topic | Live same, and adds a breadcrumb. | Meta line :719 names the leaf topic. The breadcrumb (`head` :537-548) carries the full path. | Meta 245 (c91/d154). Path with 2 or more levels: 245. | Topic: category > subcategory | Complies differently (full path is in the breadcrumb, not the meta line) (checked) | None. |
| 3 | "Topic IDs: Dewey: [Number]" | Live keeps it. The 03-30 revision drops it. | Not rendered. `topics.csv` has no Dewey column. | 0 | Shown when `deweyNumber` is stored | Conflicts with rules doc (canonical header: the metadata line is Topic / Position / Used on, with no Dewey) (checked) | The template asks for it and the rules doc omits it. Owner decision. |
| 4 | "Belief Positivity Towards Topic: [Scale -100% to +100%]" | Live "Positivity [Scale]". The 03-30 revision drops it. | :724-728. Prints "Position on the topic axis (typed, not scored): +N on a -100 to +100 scale". | 75 (c52/d23). 213 beliefs have a typed value. 138 are hidden because their topic has no `axis`, which CLAUDE.md asks for. | "Positivity ±N%", always | Complies differently (relabelled as a typed position, and shown only where the topic has sides) (checked) | None. Hiding it under an axis-less topic is the owner's rule. |
| 5 | Header line "Each section builds a complete analysis... View the full technical documentation on GitHub" | Live drops it. The 03-30 revision replaces it with a Score line and a Sections list. | Not in the header. The repo link sits in `take_part` :2005 under Argument Trees. | Header line: 0. Repo link: 245. | Not in the header. Link is in the Contribute section. | Conflicts with rules doc (Rule 2: nothing but statement, invitation and metadata before the arguments) (checked) | None. The link survives lower on the page. |
| 6 | Section "Argument Trees" | Same in all three. | :825 | 245 (c91/d154) | `ArgumentTreesSection` | Complies (checked) | None. |
| 7 | Intro "Each reason is a belief with its own page. Scoring is recursive based on truth, linkage, and importance." | Live adds the Impact formula and the fallacy rule. | :825 blurb: "Each reason is a claim with its own page. Score = sign x (2 x Truth - 1) x Conf x Link x Imp x Uniq..." | 245 | Same idea, with the formula | Complies (checked) | None. |
| 8 | Table "Top Scoring Reasons to Agree", rows ranked | Live: one two-sided table. The 03-30 revision goes side by side. | `scored_table` :582 inside `two_sided`. Rank column #. `collapse_tables` :395 shows the top 5 rows and folds the rest. | 245 carry the table. 243 have rows; 2 drafts read "Nothing here yet". The Argument Trees fold on 45 (c35/d10); the other 200 have 5 or fewer rows a side, so nothing folds there. Every page folds at least one table somewhere. | Two-sided, top 5 rows plus expand | Complies (corrected) | None. |
| 9 | Column "Argument Score" | Live "Score". The 03-30 revision has an inline [+XX]. | Header "Truth" (`scored_table` :585) | 245 | "Score" | Conflicts with rules doc (`check_templates.py` RETIRED_COLUMNS; item 1 says "Score") (checked) | The site says "Truth" where the rules doc says "Score". |
| 10 | Column "Linkage Score" | Live "Linkage" | `<abbr title="Linkage">Link</abbr>` (`th(..., short=True)` :586) | 245 | "Linkage", spelled out | Partly (abbreviated) (checked) | The Rule 8 corollary forbids "Link" and "Imp". Conf and Uniq are abbreviated the same way. |
| 11 | Column "Impact" | Live "Impact", with Importance added | Header "Score" (:586) | 245 | "Impact" | Complies differently (named Score) (checked) | Rule 8 calls the rank key "Impact". The site calls it Score. |
| 12 | Totals row "Total Pro:" | Live "Pro Total" plus a Net Belief Score line | One line under both tables, :831: "Weight for X · weight against Y · net Z" | 245 | "Pro Total:" row plus the Net Belief Score | Complies differently (one line, not a row in each table) (checked) | None. |
| 13 | Table "Top Scoring Reasons to Disagree", same 4 columns | As row 8 | As row 8 | 245. 240 have rows; 5 drafts are empty. | As row 8 | Complies (checked) | None. |
| 14 | Totals row "Total Con:" | As row 12 | :831 | 245 | "Con Total:" | Complies differently (checked) | None. |
| 15 | Section "Best Evidence" | Live and 03-30 rename it "Evidence Ledger". | `H.section('Evidence Ledger')` :845 | 112 (c91/d21) + 133 unfilled (d133) | `EvidenceSection` | Complies differently (renamed, as all later sources and the rules doc do) (checked) | None. |
| 16 | Key "T1=Peer-reviewed/Official ... T4=Opinion/Anecdote" | Live keeps the tiers. The 03-30 revision moves them into Definitions. | Not printed. The ledger uses 18 source types (`evidence.py`). | 0. One draft carries a legacy T-label as text. | Legacy tiers render as "Tier N" text | Conflicts with rules doc (Rule 4: the four tiers are retired) (checked) | Template and rules doc disagree. Owner decision. |
| 17 | Table "Top Supporting Evidence" | Live: one two-sided table | `evidence_table` :602 inside `stacked` | 112 (c91/d21). 111 have rows. | Two-sided ledger | Complies (checked) | None. |
| 18 | Column "Evidence Score" | Live "Score" | "Starts at" plus "Truth" columns (:606) | 112 | Not shown; Source type sets it | Conflicts with rules doc (`check_templates.py` RETIRED_COLUMNS) (checked) | None on the site. |
| 19 | Column "Linkage Score" (evidence) | Live "Linkage" | "Linkage", spelled out | 112 | "Linkage" | Complies (checked) | None. |
| 20 | Column "Type" (T1 to T4) | Live "Tier" | Not a column. "Rests on: <source type>" sits under the finding (:619), and its weight is shown in Starts at. | Typed source on 91 (c91/d0). 21 drafts have a ledger with no source typed. | "Source type" column | Complies differently (a line under the finding, not a column) (corrected) | Drafts list findings with no source type. That is content to add, not a renderer fault. |
| 21 | Column "Impact" (evidence) | Live "Impact" | "Score" (:607) | 112 | "Impact" | Complies differently (named Score) (checked) | The rules doc's static-site list blesses "Score". |
| 22 | Totals row "Total Contributing:" | Live and 03-30 drop it. | :849 "Weight for X · weight against Y · net", plus the EVS line :850 | 112 | No totals row | Complies differently (checked) | None. |
| 23 | Table "Top Weakening Evidence" | As row 17 | As row 17 | 112 (c91/d21) | As row 17 | Complies (checked) | None. |
| 24 | Totals row "Total Weakening:" | As row 22 | :849 | 112 | None | Complies differently (checked) | None. |
| 25 | Section "Best Scoring Objective Criteria", subtitle "For Measuring the Strength of this Belief" | Live and 03-30: "Objective Criteria", with new columns | :884 "Objective Criteria" | 91 (c91/d0) + 154 unfilled (d154) | `ObjectiveCriteriaSection` | Complies differently (renamed, no subtitle) (checked) | None. |
| 26 | Column "Top Objective Criteria" | Live "Proposed Criterion" | "Proposed criterion, and the reading each side predicts" | 91 | "Criterion" | Complies (checked) | None. |
| 27 | Column "Independence Score" | Live drops it for Validity and Reliability. | Not rendered | 0 | Not rendered | Conflicts with rules doc (item 3 lists Criterion / Score / Validity / Reliability / Linkage / Importance / Latest Reading) (checked) | Owner decision. |
| 28 | Column "Linkage Score" (criteria) | Live "Linkage" | "Linkage", a typed High, Medium or Low label | 91. Labels used: High 121, Medium 109, Low 0. | Absent (older shape) | Complies differently (typed label, not a score; the page says so) (checked) | None. |
| 29 | Column "Criteria Type" | Dropped in both later sources | Not rendered | 0 | Not rendered | Conflicts with rules doc (item 3 has no type column) (checked) | Owner decision. |
| 30 | Column "Total Score" | Live "Score" | "Score", which is the criterion page's truth | 91 | "Score" | Complies differently (named Score) (checked) | None. |
| 31 | "Core Values Conflict": Supporting Values / Opposing Values | Live replaces it with "Shared Values, Different Rankings". The 03-30 revision keeps the export's shape. | "Shared values, different rankings" sub-table :962 (Value / Supporters rank / Opponents rank / Gap / Why) | 91 (c91/d0) + 154 unfilled | Shared Values ranking table | Conflicts with rules doc (7a: both sides hold the same values and rank them differently) (checked) | The template's split into supporting and opposing values is a different model. Owner decision. |
| 32 | "Advertised:" and "Actual:" rows on each side, with the caption "(What supporters claim vs. what actually motivates them)" | Live: its own table with a Divergence Score | "Advertised versus actual motivations" sub-table :992 (Advertised / Actual / Its truth) | 1 (c1) + 244 unfilled | Table with Divergence Score | Complies differently (a 7f sub-table) (checked) | Filled on only 1 page. There is no Divergence Score and no evidence-for-divergence row. |
| 33 | H1 "Conflict Resolution Framework" | Live keeps it, after CBA. | :958 section titled "Interests, Not Positions" | 119 (c91/d28) + 126 unfilled (d126) | `ConflictResolutionSection` | Complies differently (renamed) (checked) | The rules doc item 7 name is "Conflict Resolution Framework". |
| 34 | "Interest & Motivations": Supporters / Opponents, rows 1 to 3 | Live: "Likely Interests of Supporters" and "...of Opponents", 7 columns each | `int_table` :968, stacked, :980 (Interest / Validity / Drives / Score / Value) | 119 carry it. 117 have supporter rows and 118 have opponent rows. | 7-column tables with a Pretextual row | Complies (checked) | None for the export. |
| 35 | "Shared and Conflicting Interests": Shared Interests column | Live: its own table | "Shared interests" sub-table :986 | 24 (c4/d20) + 221 unfilled | Shared Interests table | Complies (checked) | Content: only 4 complete pages have one. |
| 36 | Conflicting Interests column | Live: "Primary Conflict Pair" table | Computed "Primary conflict pair" line :983 | 116 (c88/d28) | Primary pair table | Complies differently (computed line, not a list) (checked) | None. |
| 37 | "Foundational Assumptions": Required to Accept / Required to Reject | Live: "Logical Anatomy & Foundational Assumptions" | Sub-table of "Logical Anatomy" :953 | 91 (c91) + 154 unfilled | `AssumptionsSection` | Complies differently (nested under Logical Anatomy, as rules doc item 5 asks) (checked) | None. |
| 38 | Section "Cost-Benefit Analysis" | Same name in all three | :916 "What Acting On This Would Cost and Gain" | 91 (c91/d0) + 154 unfilled | "Cost-Benefit Analysis" | Complies differently (renamed) (checked) | The rules doc names it "Cost-Benefit Analysis". |
| 39 | "Potential Benefits", prompts "1. Improvements created: 2. Who gains: 3. Positive externalities:" | Live drops the prompts. The 03-30 revision rewords them. | "Benefits" table, `cba_table` :898. "Who gains:" sits under each row. | Table 91. "Who gains" on 88. Externalities: 0. | Benefits table | Partly (checked) | No externalities prompt, either on the rows or in the `FORMS['cba']` hint. |
| 40 | Column "Likelihood" (benefits) | Live "Likelihood %" | "Likelihood" column (claim page truth) | 91 | "Likelihood %" | Complies (checked) | None. |
| 41 | "Potential Costs", prompts "Problems created / Who loses / Negative externalities" | As row 39 | "Costs and risks" table. "Who pays:" sits under each row. | 91. "Who pays" on 87. Externalities: 0. | Costs and Risks | Partly (checked) | As row 39. |
| 42 | Column "Likelihood" (costs) | As row 40 | As row 40 | 91 | As row 40 | Complies (checked) | None. |
| 43 | "Short vs. Long-Term Impacts": Short-Term (0-2 Years) / Long-Term (5+ Years), prompts "Immediate effects, Transition costs / Sustained effects, Structural changes" | Live adds Score and drops the prompts. | Sub-table inside CBA, :937 "Short-term (0 to 2 years) / Long-term (5 years and beyond)" | 91 (c91) + 154 unfilled | Sub-table inside CBA | Complies differently (nested in CBA, as CLAUDE.md and the rules doc ask) (checked) | The prompts are not carried in the form hints. |
| 44 | "Best Compromise Solutions": "Solutions Addressing Core Concerns", 3 prompt questions | Live: Shared Premise / Proposed Synthesis / Why Difficult / Score | "Best compromise" sub-table :989 | 23 (c4/d19) + 222 unfilled | 4-column table | Complies differently (checked) | Content: thin. The prompts are not used. |
| 45 | "Primary Obstacles to Resolution": Barriers to Supporter Honesty / Barriers to Opposition Honesty | Live: "Obstacles for Supporters / Opponents" plus Score | "Obstacles to resolution" :1006, For supporters / For opponents | 4 (c4) + 241 unfilled | Obstacles table with Score | Complies (checked) | Content: 4 pages. |
| 46 | "Biases": Affecting Supporters / Affecting Opponents, prompts "Confirmation bias? Motivated reasoning? Availability heuristic?" | Live adds Score | "Cognitive biases" :1009 | 4 (c4) + 241 unfilled | Biases with Score | Complies (checked) | Content: 4 pages. |
| 47 | "Media Resources": Supporting / Opposing | Live "Supporting the Belief / Challenging or Complicating". The 03-30 revision removes the section. | :1030 Supporting / Weakening, `media_table` :1016 | 87 (c87/d0) + 158 unfilled (c4/d154) | `MediaResourcesSection` | Complies (checked) | None. |
| 48 | Media kinds: Books, Articles, Podcasts, Movies, Songs | Live: a Type column [Book / Article / Podcast / Film] | "Type" column per row | 87. Article on 64, Book 51, Report 47, Study 39, Film 4, Podcast 2, Song 0. | Type column | Complies differently (a column, not grouped headings) (checked) | None. |
| 49 | "Legal Framework": Supporting Laws / Contradicting Laws, with prompts | Live adds Score | :1035 Supporting / Complicating | 4 (c4) + 241 unfilled | `LegalSection` | Complies (checked) | Content: 4 pages. |
| 50 | "General to Specific Belief Mapping" | Same | :1040 "General to Specific" | 5 (c4/d1) + 240 unfilled | `BeliefMappingSection` | Complies (checked) | None. |
| 51 | "Most General (Upstream)": Support / Oppose | Live adds Score | :1042 "Upstream" | 4 (c4) + 241 unfilled | Yes | Complies (checked) | None. |
| 52 | "More Specific (Downstream)": Support / Oppose | Live adds Score | :1044 "Downstream" | 2 (c1/d1) + 243 unfilled | Yes | Complies (checked) | None. |
| 53 | "Similar Beliefs": More Extreme Versions / More Moderate Versions | Live adds an equivalency Score and paraphrase prose | :1049, with Equiv in each row | 91 (c91) + 154 unfilled. 89 have both sides. | `SimilarBeliefsSection` | Complies (checked) | None. |
| 54 | H1 "Contribute" | Live "Contribute" | No such section on a belief page. `take_part` :2005 sits under Argument Trees, and there is a form under every table. Other page kinds do carry one: `render_special` :1425 and `render_media` :1650 print a "Contribute" section. | Take-part paragraph: 245. Belief pages with a Contribute section: 0. (1,084 non-belief pages have one.) | `ContributeSection` | Complies differently (moved to the top and into each table) (corrected) | The rules doc (item 15) and the repo template expect a footer. The section `render_special` :1425 prints is a ready model. |
| 55 | "Contact me to contribute to the Idea Stock Exchange." | Live keeps it ("Posted by ~Myclob. Contact me..."). | No "Contact" wording. The footer credit ("Built and maintained by", `credit` :4497) links every belief page to `u/myklob.html`, which says "If you want to contribute, collaborate, or just argue about it, reach out on any of these platforms" and lists them. | Credit link to the maintainer page: 245. "Contact" wording: 0. | Not rendered | Partly (corrected; was Missing) | The route is one click away, but nothing on the belief page says that is how to get in touch. |
| 56 | "View the full codebase and technical documentation on GitHub..." | Live same | Repo link in `take_part` (`GIT_NOTE`, defined :1739, printed :2013) | 245 | Yes | Complies differently (reworded) (corrected) | None. |
| 57 | "Start by exploring how we:" list (argument scores, truth and evidence, linkage, ReasonRank) | Live drops it. | No list. 14 kinds of section heading carry a method link (`H.section` :500; targets in `build_pages.py` WIKI). Objective Criteria, Definitions, People on the Record and the closing sections carry none (row 61). | List: 0. Argument Trees method link: 245. | The list, with 4 links | Complies differently (corrected) | None for the list. Headings without a link: row 61. |
| 58 | "This template provides the structure. Your contributions provide the content..." | Live drops it. | Not rendered | 0 | Rendered | Missing (checked) | Instruction prose for the template, not for an instance. Low value. |
| 59 | "Score: [To be calculated based on argument scores]", right-aligned at the end | Live moves the score to a Scorecard at the top. The 03-30 revision puts a Score line at the top. | Truth badge in the H1 (:717). "Scoring Engine" table at the end (`engine_table` :1259). | Badge 245. Engine 245. | Truth score in the H1. Readout at the back. | Complies differently (rules doc: the truth score is on the heading line) (checked) | None. |
| 60 | Every table shown, with blank rows | Live: "score cells stay blank"; People "omit when none" | "Not filled in yet" block :1070 and the `forms_grid` first-row forms | Block on 241 (c87/d154). On all 154 drafts the block lists more than 5 parts, and `collapse_tables` folds it after the fifth. | Sections render only with rows | Complies differently (carried as unfilled) (corrected) | The template does not require empty tables. See above. A draft's own list of what it lacks is partly hidden behind "Show all"; it is not a ranked table, so Rule 8 folding does not call for it. |
| 61 | Section and column headings linked to concept pages: Argument Trees (Reasons), Best Evidence (Evidence), Best Scoring Objective Criteria (Objective criteria scores), Core Values Conflict (American values), Conflict Resolution (automate conflict resolution), Interests, Foundational Assumptions, Cost-Benefit Analysis, Compromise, Obstacles to Resolution, Biases, Media Resources, Legal Framework, General to Specific (Belief Sorting), Similar Beliefs (combine similar beliefs); and the column headers "Top Scoring" (Scoring), "Linkage Score" (Linkage Scores), "Likelihood" (Likelihood) | Live keeps the links. The 03-30 revision keeps the section links. | `H.section` :500 prints a method link when a section passes one. 14 section kinds do: Argument Trees, What Would Change, Evidence, Falsifiability, Predictions, Cost and Gain, Logical Anatomy, Interests, Media, Legal, General to Specific, Similar Beliefs, Ways of Saying, Scoring Engine. Objective Criteria (:884) passes none. No sub-table (values, compromise, obstacles, biases) and no column header carries a link. | Argument Trees link: 245. Objective Criteria with no link: 91 of 91. | Not checked | Partly (added) | Objective Criteria is the one export section with no link, and `method.html` has no criteria anchor to point to. Several links land on a generic anchor: `#formula` for Interests, Legal and General to Specific, and `#starts` for Logical Anatomy and Media, although `method.html#media` exists. |
| 62 | Agree tables with a green header, disagree tables with a red one | Live same. The 03-30 revision keeps both colours, side by side. | `.side.agree>h3` and `.side.disagree>h3` in `ise.css` tint each side's heading green (`--agree`) and red (`--dis`), with dark-mode values | 245 (every two-sided table) | Not checked | Complies (added) | None. |
| L1 | Breadcrumb "Home › Topics › [Category] › [This Belief]" | Live only | `head` :537 | 245 | Yes | Complies (checked) | None. |
| L2 | [HOOK], [QUESTION], [PROMISE] invitation | Live only | `invitation` :1712 | Hook 91 (c90/d1). Question 92 (c91/d1). Promise 245. | `InvitationBlock` | Complies (drafts lack a typed hook and question) (checked) | Content gap on drafts. |
| L3 | "If you disagree, this page has a column for you." plus [ASK] | Live only | `invitation`. Derived from `page_gaps` when no ask is typed. | 245 | Yes | Complies (checked) | None. |
| L4 | Meta "Related: [belief 1] / [belief 2]" | Live only | Not in the meta line. "Related Beliefs" section :1066. | Meta: 0. Section: 245. | "Related:" in the meta line | Complies differently (the rules doc's meta line has "Used on" instead) (checked) | None. |
| L5 | "Beliefs this supports: [Belief 1] / [Belief 2]" | Live only | "Used on:" in the meta line :729 | 4 (c4) | "Beliefs this supports" | Complies differently (checked) | None. |
| L6 | Scorecard at the top (Net, Bottom line, Strongest pro/con, What would move it) | Live only | "What the numbers are made of" readout at the back (:1079), with the bottom line marked "typed by the author" | 245. Bottom line on 231. | `ScorecardSection` at the back | Conflicts with rules doc (Rule 2 and item 14 put the readout last) (checked) | The site follows the rules doc. |
| L7 | "How to read this page" box (rank keys, top five collapsed) | Live only | Not rendered | 0 | In `ScorecardSection` | Missing (checked) | Rules doc item 14 and repo template line 951 both ask for it. |
| L8 | Argument cell: claim, "[most famous quote]", ~Name | Live only | `rowtext` with the source and checked date. No quote and no ~Name. | ~Name: 0 | Quote and ~Name | Partly (checked) | The rules doc item 1 asks for the quote and ~Name. |
| L9 | Confirmed fallacy noted inline in the argument cell | Live only | Not inline. `fallacy.py` files a flag as a question on the claim's page. | 0 inline | Inline note | Complies differently (checked) | None. |
| L10 | Evidence columns: Evidence (Producer, Year) / Bears On / Tier / Score / Linkage / Impact | Live only | Finding / Bears on / Starts at / Truth / Confidence / Linkage / Importance / Uniqueness / Score / EVS | Bears on: 112. A "(Name, Year)" parenthetical: 3 of 696 finding rows, on 2 pages (c2). | Has the rules-doc columns | Complies (rules doc item 2, static-site list) (corrected) | Few findings use the Finding (Producer, Year) form. |
| L11 | Deliberately failing criterion, scored low with reasons | Live only | `lowc` (:888-889) marks a row only when Validity or Linkage is typed Low | 7 criteria on 6 pages (c6) are typed Low, all of them on Reliability, so `lowc` marks 0 rows. All 230 criteria score 0.50 (unargued), so none is scored low. | Not enforced | Missing (corrected) | Rules doc item 3 requires one on every page. `lowc` ignores a Low Reliability label. |
| L12 | Falsifiability Test (Strengthen / Score / Weaken / Score), plus a "nothing could falsify" note | Live only | :869 | 87 (c87/d0) + 158 unfilled (c4/d154). Note: 0. | `FalsifiabilityTestSection` | Complies (checked) | Four complete pages rely on predictions instead. |
| L13 | Testable Predictions (Prediction / Follows If / Timeframe / Verification / Result / Score) | Live only | :874, split into true and false tables, with the deadline under each prediction | 99 (c91/d8) + 146 unfilled | Yes | Complies differently (the rules doc item 4 shape) (checked) | None. |
| L14 | Logical form line "[Part 1] AND [Part 2]...", plus the Component Claims table | Live only | :942-951 | Section 91. Form line 4 (c4). | Yes | Partly (checked) | The `form` column is filled for only 4 beliefs. |
| L15 | CBA rows: Category (Units) / Magnitude / Likelihood % / Expected Value, subtotal within category | Live only | Estimate / Range / Likelihood / Expected value, plus "Net by category" :919 | 91 | Yes, with subtotals | Complies differently (checked) | None. |
| L16 | Shared Values row "What would shift these rankings?" | Live only | Not rendered | 0 | Rendered | Missing (checked) | Rules doc 7a lists this row. |
| L17 | Interests: Prevalence, Pretextual / Low-validity row | Live only | No Prevalence line and no Pretextual row | Prevalence 0 inside Interests (the word appears on 2 pages, both in evidence about obesity prevalence). Pretextual 0. | Both rendered | Partly (corrected) | Rules doc 7b asks for Prevalence under each interest, and for the Pretextual row. |
| L18 | Dispute Types (Empirical / Definitional / Values / Linkage) | Live only | :995, with the computed kind marked | 91 (c91) + 154 unfilled | Yes | Complies (checked) | None. |
| L19 | Definitions (Term / Definition / Score) | Live only | :1056 Term / What it means here | 91 (c90/d1) + 154 unfilled | Yes | Partly (no Score column) (checked) | Rules doc item 12 lists Score. |
| L20 | People on the Record; omit when none | Live only | :1060 | 84 (c84) + 161 unfilled | Renders only with rows | Complies differently (named in "Not filled in yet" rather than omitted) (checked) | None. |
| L21 | What This Page Needs Right Now (# / gap / where / who) | Live only | `page_gaps` :1684, rendered :1076 | 245 | `WhatThisPageNeedsSection` | Complies (checked) | None. |
| L22 | "Posted by ~Myclob." | Live only | The maintainer is credited in the footer ("Built and maintained by", `credit` :4497) | 245 credit lines. "Posted by": 0. | Not rendered | Complies differently (checked) | None. |
| L23 | Related Topics, last: hub link plus siblings, with the current page unlinked | Live only | "Related Beliefs" :1066, placed before Not filled in yet and the readout | 245 | `RelatedTopicsSection`, last | Partly (out of order) (checked) | Rules doc item 16 puts it last. |
| L24 | Equivalent phrasings in prose as merge candidates | Live only | "Ways of Saying the Same Thing" (`wordings` :1198) | 2 (c2) | Prose above the table | Complies differently (checked) | None. |

Rows R1 to R3 are elements that only the 2026-03-30 revision has (added in the skeptic pass).

| # | Template element (template wording) | Export / live differ? | Static site: where (render_site.py:line) | Pages carrying it (of 245) | Next.js app | Status | Gap |
|---|---|---|---|---|---|---|---|
| R1 | "Sections: Arguments / Evidence / Values / Interests / Assumptions / Criteria / Cost-Benefit / Resolution / Definitions" jump list under the H1 | 03-30 only | Not rendered. A belief page has no `<nav>` or section index. | 0 | Not checked | Conflicts with rules doc (Rule 2: statement, invitation and metadata, then Argument Trees, and nothing else) (added) | Owner decision. A jump list would need a line in Rule 2. |
| R2 | "Visual and Video Evidence" table (Type / Description / Stance / Source / Tier / Argument It Bears On / Linkage; chart, photo, meme, documentary, book), absorbing Media Resources | 03-30 only | One ledger. A visual finding is typed with the `visual` source type (`evidence.py` :96), as Rule 4 asks. Media Resources stays its own section, as rules doc item 8 asks. | Findings typed `visual`: 0 (pages.csv `etype`) | Not checked | Complies differently (added) | None. |
| R3 | Objective Criteria columns "Criterion / Current Status / Threshold for Agreement" | 03-30 only | "Latest reading" column, with "A reading that would strengthen" and "A reading that would weaken" under each criterion (:889-893) | Both readings: 91 (c91). Criteria with a latest reading: 0 of 230. | Not checked | Complies differently (added) | The threshold is carried as two predicted readings, not one agreed threshold. No criterion has a reading yet. |

Totals for the 62 export rows (corrected: the first pass's totals did not match its own matrix, which counted 20, 27, 3, 2 and 8 over 60 rows; row 55 then moved from Missing to Partly, and rows 61 and 62 were added):

- Complies: 21
- Complies differently: 27
- Partly: 5
- Missing: 1
- Conflicts with rules doc: 8

Totals for the 24 live-only rows (corrected: the matrix counts 7, 8, 5, 3 and 1, not 6, 9, 5, 3 and 1):

- Complies: 7
- Complies differently: 8
- Partly: 5
- Missing: 3
- Conflicts with rules doc: 1

Totals for the 3 rows from the 03-30 revision: Complies differently 2, Conflicts with rules doc 1.

## 2. Order

**Section order on the site** (`render_belief`). This order is the same on every page: across all 245 pages, no two sections ever appear in opposite order.

Argument Trees > What Would Change the Answer > Evidence Ledger > Falsifiability Test > Testable Predictions > Objective Criteria > Cost and Gain (with Short vs Long) > Logical Anatomy (with Assumptions by side) > Interests, Not Positions (values, interests, shared, compromise, advertised and actual, disputes, obstacles, biases) > Media > Legal > General to Specific > Similar Beliefs > Ways of Saying > Where Used > Definitions > People on the Record > Related Beliefs > Not filled in yet > What this page needs > What the numbers are made of > Share > Structural Checks > Scoring Engine.

**Against the export**, these sections are out of order:

- **Core Values Conflict.** The export puts it 4th, before the interests, the assumptions and the CBA. The site puts it inside Interests, after the CBA and Logical Anatomy.
- **Interest & Motivations, and Shared/Conflicting Interests.** The export puts them before Foundational Assumptions and the CBA. The site puts them after both.
- **Foundational Assumptions.** The export puts it before the CBA. The site puts it after.
- **Advertised / Actual.** The export puts it inside Core Values, before the interests. The site puts it after Best Compromise.
- **Contribute.** The export puts it last. The site puts the contribution paragraph first, under Argument Trees.
- **Score.** The export puts it last. The site puts the truth score on the heading line (as the rules doc asks), and puts the readout and engine table at the back.

Compromise, Obstacles, Biases, Media, Legal, General to Specific and Similar Beliefs all keep the export's relative order.

The export's order (values and interests before assumptions and CBA) is itself the reverse of the rules doc's order (5 Assumptions, 6 CBA, 7 Conflict). Those three moves are a template-versus-rules-doc disagreement, not a site defect.

**Against the rules doc and the repo template**, three sections are out of order:

- **Objective Criteria** comes after Falsifiability Test and Testable Predictions. The rules doc has it as item 3, before them.
- **Cost-Benefit** comes before Logical Anatomy. The rules doc has Logical Anatomy as item 5 and CBA as item 6.
- **Related Beliefs** comes before Not filled in yet, What this page needs and the readout. The rules doc puts Related Topics last, as item 16.

The Next.js page follows the rules doc's order. It deviates from the export in the same three ways that the rules doc itself does.

## 3. Fixes, most important first

- [ ] **Put Objective Criteria, Logical Anatomy and Related Beliefs where the rules doc puts them** (work). In `render_belief`:
  - Move the Objective Criteria block (:882-893) above the Falsifiability Test block (:867).
  - Move the Logical Anatomy block (:941-955) above the cost-benefit block (:897-939).
  - Move the Related Beliefs block (:1063-1067) to after `engine_table`.

  Pages would then read Evidence > Criteria > Falsifiability > Predictions > Anatomy > Cost and Gain, matching rules doc items 2 to 6 and `templates/belief-analysis-template.html`. No number changes. Reorder `BELIEF_FORMS` (:1821) to match, since its comment says it lists the forms "in the page's own order"; `test_render.py` compares it only as a set, so no test pins the order either way (checked).
- [ ] **Spell out the factor headers in Argument Trees and Testable Predictions** (work). In `scored_table` (:586) and in `pred_table` inside `render_belief` (:858), call `th(w)` instead of `th(w, short=True)`. The headers would read Confidence, Linkage, Importance, Uniqueness (Rule 8 corollary: "never Link / Imp"). Check that each side still fits the 540 px that `two_sided` needs. If it does not, use `stacked` for these tables.
- [ ] **Print the "How to read this page" box after the readout** (work). In `render_belief`, after `o.append(readout)` (:1080), add one paragraph. It should say that every table ranks by its rank key (Score here, Expected value for costs and benefits, Gap for values, Equiv for similar beliefs), that each table shows its top five rows with the rest folded, and that blank cells stay blank until argued. This is rules doc item 14 and repo template line 951.
- [ ] **Add a Contribute footer with a contact route** (work). Write a new `contribute_footer(c, up)` in render_site.py, called in `render_belief` after `engine_table` (:1084). It would print "Contact the maintainer to contribute", linking to `u/<maintainer>.html` and a blank GitHub issue, plus the repo link. This covers export rows 54 and 55, rules doc item 15, and the "Posted by ... Contact me" line in the repo template (line 994). Today 0 of 245 belief pages have a Contribute section or any "Contact" wording, though all 245 already link `u/myklob.html` through the credit line, and that page invites contact (corrected). `render_special` :1425 already prints a Contribute section on other page kinds and is the model to follow.
- [ ] **Ask for a deliberately failing criterion** (work). In `page_gaps` (:1684), add a gap when a page has criteria but none that fails: no criterion with Validity or Linkage typed Low (the `lowc` test at :888) and none whose page scores below 0.50. Text: "A criterion that looks relevant and fails, scored low with its reason", with Where = "Objective Criteria". A Low Reliability label should not count: 6 pages carry one, and `lowc` rightly ignores it (corrected). `page_gaps` returns only its first three gaps (`out[:3]`), so put this one after the existing three or it can displace them. Mirror it as a Structural Check in `checks_section` (:1124). Today 0 of the 91 pages with criteria have one (rules doc item 3): all 230 criteria score 0.50. Filling the rows is content. Criteria labels are read by nothing, so no score moves.
- [ ] **Add the missing rules-doc rows in Interests** (work). In `render_belief`:
  - In the values table (:962), add the "What would shift these rankings?" row, from a new `shift` field on the value rows.
  - In `int_table` (:968), print Prevalence with its source under each interest, plus a Pretextual / Low-validity row on both sides.
  - In the advertised/actual sub-table (:992), add an "Evidence for divergence" line.

  These are rules doc 7a, 7b and 7f. They are typed inputs labelled typed, so no score moves.
- [ ] **Carry the template's prompts in the first-row forms** (work). In the `FORMS` dict, extend these hints:
  - `cba`: "including effects on people outside the deal (externalities)"
  - `short_term`: "immediate effects or transition costs"
  - `long_term`: "sustained effects or structural changes"
  - `obstacle`: "what stops this side acknowledging the other's costs or benefits"
  - `bias`: "for example confirmation bias, motivated reasoning, availability"
  - `law`: "local, state, federal or international"

  This covers export rows 39, 41, 43, 45, 46 and 49.
- [ ] **Add a Score column to Definitions** (work). In `render_belief` (:1057), render Term / What it means here / Score, with Score blank unless the definition has a page (rules doc item 12, Rule 6).
- [ ] **Give Objective Criteria a method link** (work, added). It is the one export section whose heading links nothing (row 61; 91 of 91 pages). `method.html` has no criteria anchor, so first add a short criteria part to the method page (`method.py`) with an anchor, then pass `('Objective criteria', WIKI[...])` to `H.section` at :884 with a new `WIKI` entry in `build_pages.py`. Linking a missing anchor would break Rule 5.
- [ ] **Stop folding the "Not filled in yet" list** (work, added). On all 154 drafts it lists more than five parts, and `collapse_tables` (:395) folds it after the fifth, so a draft hides part of what it still needs. It is not a ranked table. Exclude it in `collapse_tables` the way the check and engine tables are excluded (for example a `todo` class on its table at :1071).
- [ ] **Decide whether "Cost-Benefit Analysis" and "Conflict Resolution Framework" come back as headings** (work, if wanted). The export, the live page, the 03-30 revision and the rules doc all use those names. The site says "What Acting On This Would Cost and Gain" and "Interests, Not Positions". To rename, change the `H.section` titles (:916, :958) and the matching `FORM_SECTIONS` keys and `todo` names (:1813) together.
- [ ] **Decide on the Dewey number** (owner decision). The export and the live page carry "Dewey [Number]". The rules doc's metadata line (Topic / Position / Used on) and the 03-30 revision drop it. If it is kept, add a `dewey` column to `content/topics.csv` and append "Dewey N" to `meta` in `render_belief` (:719).
- [ ] **Decide on Independence Score and Criteria Type for criteria** (owner decision). The export has both. The rules doc item 3 and the live page replace them with Validity, Reliability, Linkage and Importance.
- [ ] **Decide between "supporting vs opposing values" and "shared values, different rankings"** (owner decision). Export row 31 conflicts with rules doc 7a. The site and the Next.js app follow 7a.
- [ ] **Retire the export's "Argument Score", "Evidence Score" and T1 to T4 on the PBWorks page, or reinstate them** (owner decision). `check_templates.py` and Rule 4 retire them, while the export and the live page still print them. The site uses Truth, Starts at and 18 source types.
- [ ] **Decide the order of values and interests against assumptions and CBA** (owner decision). The export puts Core Values and Interests before Assumptions and CBA. The rules doc (items 5 to 7) and the live page put them after.
- [ ] **Decide on the 03-30 revision's "Sections:" jump list** (owner decision, added). The 03-30 revision puts one under the H1 (row R1). Rule 2 allows only the statement, the invitation and the metadata above Argument Trees, so adopting it means adding a line to Rule 2 first, then to the template and the page.
