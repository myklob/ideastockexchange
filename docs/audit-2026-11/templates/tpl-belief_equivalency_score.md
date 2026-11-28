# Belief Equivalency Score template compliance

**Template:** PBWorks "Belief_equivalency_Score" (page 163582959), titled on the page "Belief Equivalence Scorecard",
a 17-step scorecard for deciding whether two beliefs are merged, linked or kept separate.

**Source used.** No Drive export of this page exists. I searched Drive by title (`quivalen`, `Belief_equivalency`,
`Equivalence_Scorecard`, `equivalence`) and full text (`Belief Equivalence Scorecard`, `Fast Path Collapse`,
`Synonym Convergence`, `Network Position Adjustment`, `Non-Equivalence Triggers`), and listed the PBWorks export
folder that holds `Topic_Template.html` and `Belief_Template.html` (exported 2026-03-12). Page id 163582959 is newer
than that export. So the matrix follows the **live crawl**
(`pb/b3-redundancy-equivalence-sorting/04-belief-equivalency-score.txt`, "last edited 8 months ago"). The column
"Export / live differ?" therefore compares this page with the sister page "Belief Equivalency Scores" (163411203),
which describes the same engine. Its live text is the 12-step "Belief Equivalence Engine" explainer (crawl file 05).
Everything I read is saved in
`scratchpad/tpl/belief_equivalency_score-export.txt`.

**The Drive file "Belief Equivalency Scores.html"** (`1DtWGUjI_kzjTay1HR1CozbjF3y8BWurR`, with a duplicate
`1f_I3AXoWZY6p5WQbxNIrNbZZnST0XLZU`, exported 2026-03-01) **is a different page**. It is page 163411203 as it stood
in March: the old belief template filled in under the heading "Belief: Identifying redundant arguments is
required...". It contains no equivalency formula, weight, threshold or step. Its only bearing on equivalency is
its "Similar Beliefs (Extreme & Moderate Versions)" table, with the columns More Extreme Versions and More
Moderate Versions. That table is the display side of this score, so it is covered in section B below.

**Repository counterparts.**
- `templates/belief-equivalence-scorecard-template.html` (October 2026). It opens with the equivalence page the
  static site builds. It then copies all 17 PBWorks steps under the label "Software design ... not run by the built
  site: none of the weights, bands or verdicts below feeds a published number". `tools/check_templates.py`
  passes it ("all 15 templates current").
- Static site: equivalence pages come from `render_special` (`render_site.py:1318`). On belief pages the score
  shows in Similar Beliefs (`render_belief`, `:1048-1052`) and Ways of Saying the Same Thing (`wordings`,
  `:1198-1216`). `tools/static-site/similarity.py` provides the computed wording similarity, and `grouping.html` and
  `method.html#equivalency` explain it.
- Next.js app: `src/app/equivalence/[slug]/page.tsx` renders the 17-step scorecard from the Prisma
  `EquivalenceAnalysis` model, and `src/app/api/equivalence/[slug]/score/route.ts` computes it. No seed script
  creates an `EquivalenceAnalysis` row, and no belief page links to `/equivalence`. Separately,
  `src/app/algorithms/belief-equivalency` and `/api/beliefs/equivalency` use a different two-layer formula
  (`all-scores.ts:700`). `SimilarBeliefsSection.tsx` reads a stored `SimilarBelief.equivalencyScore` (default 0).
  The app was not measured because it has no build or database here.

**Measured on** the built site: 3 equivalence pages, 245 belief pages, 5,794 claim pages. The script is
`scratchpad/tplscripts/measure_equiv.py`
and its output is `measure_equiv.out.json` beside it. It strips forms and scripts first and matches tags by
attribute. For scorecard rows, N = 3 equivalence pages. For section B, N = 245 belief pages.

**Skeptic re-check (2026-11-22).** Every page count was re-measured with an independent script,
`scratchpad/skeptic/equiv_check.py`,
over the same build (revision 3276ea1; HEAD is one commit later and changes no static-site file). All counts held:
245 / 3 / 5,794 pages; Similar Beliefs drawn on 91 and carried as unfilled on 154; 168 extreme and 174 moderate rows;
342 Equiv cells, 3 linked (on 2 pages) and 339 constant; Ways of Saying on 2 belief and 3 claim pages; wording
overlap on 33; 94 with either. Every cited `render_site.py` line was re-opened; two were off by one (rows 2 and 21) and the
`similarity.py` cites in rows 5 and 10 pointed at the wrong lines. Rows are marked (checked) or (corrected) in the Status column.

**Empty sections.** On a belief page, an empty Similar Beliefs section is carried as unfilled: it is named under
"Not filled in yet" with a first-row form (`render_site.py:1052`, `:1069-1074`). This happens on 154 of 245
belief pages, and the other 91 draw the table. The equivalence page has no such block. Its one optional section,
Hidden assumptions and bias risks, is left out silently when empty (`:1416`, 0 of 3 pages carry it). The PBWorks
scorecard is a fill-in form: it draws every table with blank cells but nowhere says an empty table must be
published. The 163411203 export draws Similar Beliefs as an empty "1. 2." table in the same way.

## A. Compliance matrix (scorecard elements, in the template's order)

| # | Template element (template wording) | Export / live differ? | Static site: where (render_site.py:line) | Pages carrying it (of 3 equivalence pages) | Next.js app | Status | Gap |
|---|---|---|---|---|---|---|---|
| 1 | Title "Belief Equivalence Scorecard" with the purpose line "Comparing two beliefs to determine if they should be merged, linked, or kept separate." | No export. The Engine page (05) calls the same thing the "Belief Equivalence Engine". | The H1 is the claim being argued, "The belief: X / makes the same claim as: Y", with the score badge and votes (`:167`, `:1330`). The kind line reads "Equivalence". | 3 of 3 | The H1 is "Belief Equivalence Scorecard" with the purpose line (`page.tsx:61-65`). | Complies differently (the title is the question, as on every argued page) (checked) | None needed. |
| 2 | Header fields (score, topic path, Dewey, positivity, related) | The template has none. They exist only on the 163411203 export (belief template header). | The site adds a breadcrumb topic path, the score badge and a "Used on" line (`:1334`). There is no Dewey or positivity, correctly, since this is not a belief. | 3 of 3 (breadcrumb, badge, Used on) | Breadcrumb to /equivalence only. | Complies differently (template has none; site adds path and score) (corrected) | None. |
| 3 | Index listing Steps 1 to 17 | No export. | None. The page has no step index. | 0 of 3 | None. The h2s are numbered instead. | Missing (checked) | Low value until the steps exist. |
| 4 | Step 1 table: Label / Raw Belief Statement / Source Page, rows Belief X and Belief Y | No export. The Engine page has no Step 1 table. | A connected-pages card shows Belief X and Belief Y, each linked to its page with its Truth (`:1343-1344`). Check table rows 1-2 repeat the wording verbatim (`:1403-1404`). | 3 of 3 | Step 1 table (`page.tsx:77-101`). | Complies differently (the link is the source page; each belief's truth is added) (checked) | None. |
| 5 | Step 2 Fast Path rule: identical after lowercasing and stripping punctuation means skip to MERGE | The Engine page's fast path is wider: synonym swap, negated antonym or filler removal, auto-merge at "90%+". | Not on the equivalence page. At intake, the duplicate check counts a submission that reads 0.70 or more alike as the existing claim and records a vote, never merging pages. It refuses denials, reversals and substitutions (`similarity.py:52` MERGE, `intake.py:1092-1094`, `contribute.js:10`). | 0 of 3 (intake check on every form: 245 of 245 belief pages carry the similar-belief form with the index check) | "Fast Path: Passed/Failed" and "Auto-Merge" badges (`page.tsx:103-114`). | Complies differently (lexical 0.70 at intake, a vote not a merge) (corrected) | No fast-path result is printed for the X/Y pair. |
| 6 | Step 2 table: Check / Result / Auto-Merge?, rows "Exact match after normalization", "Fast path passed?" | No export. | None. | 0 of 3 | Badges, not a table. | Missing (checked) | See fix 7. |
| 7 | Step 3 Normalized Core Claims: Label / Normalized Statement / Normalization Notes | The Engine page adds a "What Was Stripped" column. | None. The site argues the two wordings as typed. | 0 of 3 | Raw / Normalized Core table, shown when either is filled (`page.tsx:116-158`). | Missing (checked) | No normalized form of either belief anywhere in `content/*.csv`. |
| 8 | Step 3 Normalization Argument Battle: "Normalization is correct because..." / "...wrong because..." / Score | Not on the Engine page. | None. | 0 of 3 | Agree and disagree statement lists with no Score column. | Missing (checked) | Next.js: Partly (no score). |
| 9 | Step 4 Semantic Transformation Map: X Element / Y Element / Relationship (identical / synonym / antonym / different) / Notes | The Engine page adds a "Transformation Score" (the share of terms that convert). | None. `similarity.reverses()` and `substitutes()` detect antonyms and swapped words at intake only, unprinted. | 0 of 3 | Table, shown when entries exist (`page.tsx:160-185`). | Missing (checked) | No per-term map. |
| 10 | Step 5 Synonym Convergence: Term X / Term Y / Merriam-Webster / Oxford / WordNet / Embedding Model / Agreement Rate (/4); score = average agreement | The Engine page says "five independent sources" score higher than one, and gives no fixed four. | None. The nearest is `Similarity.between` (`similarity.py:283-285`): half IDF-weighted word Jaccard plus half IDF-weighted character-4-gram cosine, which reads spelling rather than dictionaries. The module-level `ces()` (`:226`) is the same blend unweighted. It is printed only for flagged pairs on grouping.html and method.html. | 0 of 3 | Four-source table plus the score (`page.tsx:187-220`). | Missing (corrected) | The site has no dictionary or embedding source and no network access by design. |
| 11 | Step 6 Strength Delta: Dimension / Belief X / Belief Y / Delta (0 to 1), rows Certainty, Scope, Causal Force, then "Overall Strength Delta" | The Engine page names the third dimension "Force" and maps the dimensions to topic spectrums. | Partly. Each belief carries one typed strength band (Modest / Moderate / Strong / Total, on topic pages and grouping.html), and Similar Beliefs files versions as more extreme or more moderate. "Different scope" and "Different magnitude" are disagree patterns (`build_subpages.py:93`). There is no per-pair delta. | 0 of 3 (patterns used as rows on 3 of 3) | Overall delta only (`page.tsx:222-226`). Per-dimension fields exist in the schema but are not rendered. | Partly (checked) | No three-dimension table. |
| 12 | Step 7 Structural Relationship: Same claim / Same topic, different claim / Subset-superset / Different topic, then "Selected Classification" | Same four classes on the Engine page. | The verdict's three bands stand in for it (`:1405`). The disagree pattern "One-way implication" covers subset and superset. No class is selected. | 0 of 3 | Selected class printed (`page.tsx:228-250`). | Partly (checked) | No classification field. |
| 13 | Step 7 Structural Argument Battle: correct because / wrong because / Score | Not on the Engine page. | None. | 0 of 3 | Statement lists with no Score. | Missing (checked) | Next.js: Partly. |
| 14 | Step 8 Overlap Score formula: (Subject x 0.25) + (Predicate x 0.35) + (Context x 0.20) + (Mechanism x 0.20) | Same weights on the Engine page. | Not run. The repo template marks it "software design" (template lines 18-20). | 0 of 3 | Computed (`score/route.ts:33-36`) and shown (`page.tsx:252-284`). | Missing (deliberately not run) (checked) | No subject, predicate, context or mechanism inputs exist in the tables. |
| 15 | Step 8 table: Dimension / Belief X / Belief Y / Overlap (0 to 1), then "Weighted Overlap Score" | No export. | None. | 0 of 3 | Yes. | Missing (checked) | As row 14. |
| 16 | Step 9 Non-Equivalence Triggers: different causal chains, different supporting evidence, different foundational assumptions, different policy implications, each with Present? / Penalty Applied, then "Total Penalty" | The Engine page calls them "fail fast" and words them "Different required evidence" and "Different policy implication". | Partly, as reasons rather than penalties. The disagree starter patterns are Different scope, Different mechanism, One-way implication and Different magnitude (`build_subpages.py:93`). "Hidden assumptions and bias risks" takes what must hold for the two to be the same or to differ (`:1416-1419`). There is no policy-implication pattern and no penalty arithmetic. | Patterns: 3 of 3 (9 typed rows in all, 3 per page). Assumptions section: 0 of 3. | Four penalties and their total (`page.tsx:286-318`). | Partly (corrected) | Only one trigger has a disagree pattern (different causal chains, as Different mechanism). Different assumptions has only the assumptions section's "Required for them to differ" column. Different evidence (faced only by the agree pattern "Same evidence settles both") and different policy implications have no disagree pattern. An empty assumptions section is dropped, not carried as unfilled. |
| 17 | Step 9 Trigger Argument Battle: correct / incorrect / Score | Not on the Engine page. | None. | 0 of 3 | Not rendered. No `trigger` reasons are read. | Missing (checked) | None. |
| 18 | Step 10 Argument Battle: "Pro-Equivalence Arguments" and "Anti-Equivalence Arguments" tables | The Engine page runs this step only for "borderline" cases (70-80%). | "Equivalence Arguments": two tables, "Reasons to agree that X and Y are the same claim" and "Reasons to disagree (X and Y differ)" (`:1376-1378`), each with a form. | 3 of 3 | Pro and anti lists (`page.tsx:320-356`). | Complies (checked) | On the site this step is the whole score, not 20% of it (see row 24). |
| 19 | Step 10 per-row columns: Truth / Linkage / Importance / Contribution | No export. | # / Reason (pattern) / Truth / Conf / Link / Imp / Uniq / Score. Score = sign x (2 x Truth - 1) x Conf x Link x Imp x Uniq (`:1352-1363`). | 3 of 3 | Truth, linkage and importance inline as "T: L: I:" with no Contribution (`page.tsx:341`, `:350`). | Complies differently (adds Confidence and Uniqueness; "Contribution" is named Score) (checked) | Next.js: Partly. |
| 20 | Step 10 totals: Pro-Equivalence Score, Anti-Equivalence Score, Argument Balance = Pro / (Pro + Anti) | No export. | "Total agree / total disagree / equivalence score" (`:1379`). The balance is shrunk toward 0.50 by weight k (Scoring Engine row). | 3 of 3 (all read 0.00 / 0.00 / 0.50) | Pro, Anti and Balance printed. | Complies differently (Pro/(Pro+Anti) with a 0.50 prior) (checked) | None. |
| 21 | Step 10 prompts: the four-per-side starter wording | No export. | Pattern labels are set on each typed row (`.patl`). "Nothing here yet. Starter patterns: ..." shows when a side is empty (`:1361`; 0 of 3 pages, since every side has a row). The pattern note (`build_subpages.py:93` `pattern_note`) is printed in the workbook but not on the HTML page. | Row labels: 3 of 3. Pattern note: 0 of 3. | None. | Partly (corrected) | The repo template prints the Pattern note under the totals and the built page does not. |
| 22 | Step 11 Shared vs Distinct Evidence and Arguments: Shared / Unique to X / Unique to Y, then "Evidence / Argument Overlap Rate" | Not on the Engine page. | None. "Same evidence settles both" is an agree pattern, not a computed table. | 0 of 3 | Not rendered. `evidenceArgumentOverlapRate` is stored only (`schema.prisma:1634`). | Missing (checked) | Both beliefs' rows are in the tables, so this is computable without typing. |
| 23 | Step 12 formula: Equivalence = (0.40 x Synonym) + (0.40 x Overlap) + (0.20 x Argument Balance) - Penalties, plus or minus Network | The same formula on the Engine page, which adds that "these weights are themselves scorable claims". | Not run. The score is the equivalence page's argued truth: (agree + k x 0.50) / (agree + disagree + k), shown in the Scoring Engine row. `similarity.blend()` implements a separate wiki blend, ES = w_ces x CES + w_ues x UES with w_ces = 0, and is called only by `test_similarity.py:102`. | 0 of 3 (argued score on 3 of 3) | Computed (`score/route.ts:38-43`), formula line printed (`page.tsx:358-368`). | Complies differently (the argued score replaces the weighted blend) (checked) | Two published engines give the same score different meanings. Owner decision (fix 1). |
| 24 | Step 12 component table: Component / Weight / Score (0 to 1) / Weighted, then "Final Equivalence Score" | Rationale table on the Engine page. | The Scoring Engine table lists agree total, disagree total and the equivalence score with how it was worked out (`engine_table`, `:1259`). | 3 of 3 | A formula line, not a table. | Complies differently (a derivation of the argued score) (checked) | None. |
| 25 | Step 13 verdict bands: 90-100% MERGE, 75-89% MERGE with note, 50-74% LINK only, below 50% SEPARATE | Same bands on the Engine page, which calls 50-74 "intentionally wide". | Three bands: 0.90 or more "Merge candidate", 0.50 to 0.90 "Overlapping: keep both, name the difference", below 0.50 "Distinct claims: keep both, cross-link" (`:1405`, `:1211`, `EQUIV_MERGE` `:40`). | 3 of 3 (all "Overlapping") | Four bands (`score/route.ts:45-53`, `page.tsx:370-395`). But `/api/beliefs/equivalency` and `/algorithms/belief-equivalency` use five other bands, 0.90 / 0.70 / 0.45 / 0.20 (`api/beliefs/equivalency/route.ts:81-85`). | Partly (checked) | The 75-89 "merge with note" band is missing. The Next.js app publishes two band sets. |
| 25a | Step 13 verdict colour key: red MERGE, orange MERGE with note, yellow LINK only, green SEPARATE | Not on the Engine page. | None. The verdict is plain text in check-table row 5 (`:1405`), and the heading badge (`score_badge`, `:1673`) is uncoloured. | 0 of 3 | The selected band row is highlighted blue; no per-verdict colour (`page.tsx:388`). | Missing (added by skeptic) (corrected) | Low value: a colour says nothing the verdict text does not. No fix listed. |
| 26 | Step 13 actions: redirect one page and combine arguments / footnote / similar-belief link / no action | Same on the Engine page. | At 0.90 or more the shortest wording stands in for the page in breadcrumbs and index columns (`brief`, `:142-147`). Nothing is redirected or merged, and the rows stay separate. | 3 of 3 (verdict text) | Text only. | Complies differently (stand-in wording, never a merge) (checked) | None. Merging pages would break "no drafted argument is ever deleted". |
| 27 | Step 13 row: Final Verdict / Canonical Page (if merge) / Linkage Score | No export. | Verdict: yes. Canonical page: only as the "most succinct" or "used" mark under Ways of Saying the Same Thing (`:1212`). No linkage score. | Verdict 3 of 3, canonical 0 of 3 | Verdict and canonical page in the banner. Linkage score in the JSON only (`page.tsx:459`). | Partly (checked) | No canonical-page cell in the check table. |
| 28 | Step 13 Verdict Argument Battle | Not on the Engine page. | None as a separate battle: the page's single argument table decides the verdict. | 0 of 3 | Rendered (`page.tsx:396-410`). | Complies differently (one battle decides score and verdict) (checked) | None. |
| 29 | Step 14 Network Position: Network Layer / X Items / Y Items / Overlap % / Same Cluster?, rows Upstream, Downstream, Evidence, then "Network Position Adjustment" | The Engine page makes this the last step, with an example of 65% becoming 80% after the network is traced. | None on the equivalence page. `similarity.shared_parent()` and `scored_parent()` find shared parent pages for flagged pairs, which method.html prints as a "Same page" column. | 0 of 3 | `networkPositions` is loaded but not rendered. The adjustment shows only in the formula line when it is nonzero. | Missing (checked) | Computable from `edges.csv` without typing. |
| 30 | Step 15 Audit Trail: Analyst Type, Analyst ID, Confidence (high / medium / low), Review Date, Reviewed By, Trigger Reason, Revised From, Revision Notes | Not on the Engine page. | Partly. "Cite this page" carries the revision and date and the maintainer. Confidence is numeric in the Scoring Engine. Row authors are credited through `added_by` and u/ pages. There is no analyst type, reviewer or trigger reason. | 3 of 3 (cite line and confidence) | Audit table (`page.tsx:414-436`). | Partly (checked) | No analyst type or reviewer fields. |
| 31 | Step 16 Related Pages: Belief X source, Belief Y source, Canonical page, Related equivalence analyses | Its "Related Pages" table links method pages instead. | Belief X and Y are linked (row 4), and "Where This Page Is Used" lists the pages that read this one (`used_on`, `:1228`). There is no list of the other equivalence pages for X or Y. | 3 of 3 | None. Only a back link to all analyses. | Partly (checked) | Next.js: Missing. |
| 32 | Step 17 Machine-Readable Output: JSON with schema_version, beliefs x/y raw/normalized/source, fast_path, component scores, verdict, canonical_page, linkage_score, audit | Not on the Engine page. | `p/<key>.json` for every page, linked from the foot (`page_json`, `:3701`, written at `:4547`). It holds key, kind, text, truth, confidence, starts_at, reasonrank, used_on, reads, cite, weight_for, weight_against and built_from. It has no x/y and no verdict; its only components are weight_for and weight_against (the Step 10 totals). | 3 of 3 | JSON block plus `/api/equivalence/[slug]` (`page.tsx:438-460`). | Complies differently (per-page JSON in the site's own schema) (corrected) | X, Y and the verdict are missing from the JSON. |
| 33 | Footer "View the full codebase and technical documentation on GitHub." | The Engine page ends with "Contact Me". | Contribute section: forms under each table, a GitHub note naming the page key and tables (`:1425`), and the site footer. | 3 of 3 | No GitHub or contribute link. | Complies (checked) | Next.js: Missing. |

## B. Where the score is shown on belief pages (163411203 export's Similar Beliefs, rules doc items 11 and 11a)

| # | Template element (template wording) | Export / live differ? | Static site: where (render_site.py:line) | Pages carrying it (of 245 belief pages) | Next.js app | Status | Gap |
|---|---|---|---|---|---|---|---|
| B1 | "Similar Beliefs (Extreme & Moderate Versions)": More Extreme Versions / More Moderate Versions | The export draws an empty two-column table. The live 163411203 page no longer has the section. | "Similar Beliefs", two-sided: More extreme / More moderate (`:1048-1051`). | Drawn on 91. Carried as unfilled on 154. Total 245 of 245. 168 extreme and 174 moderate rows. | `SimilarBeliefsSection.tsx`. | Complies (carried as unfilled where empty) (checked) | The template does not require an empty table to be shown. |
| B2 | An Equiv column per side (rules doc item 11: More Extreme / Equiv / More Moderate / Equiv) | Not in the export, which has no score column. | Columns Wording / Same claim? (an "Equiv" cell) / Its truth (`:1050`, `simple_rows` `:698`). | 91 of 245 have the column. Of 342 Equiv cells, 3 link an equivalence page and 339 read the labelled constant 0.50 ("Nobody has argued this factor"). | Blank when the stored score is 0 (`SimilarBeliefsSection.tsx:18-20`). | Conflicts with rules doc (Rule 6: "Score Columns Stay Empty Until Content Exists", BELIEF_PAGE_RULES.md:143) (corrected) | 339 cells print 0.50 for an equivalence nobody has opened. The conflict is narrower than it reads: BELIEF_PAGE_RULES.md:88 lets Linkage, Importance and Uniqueness read a labelled constant until argued, and this cell is labelled the same way ("Nobody has argued this factor"). Equiv is not in that list, and here no equivalence page exists at all, so Rule 6 still governs. |
| B3 | Rows ranked by Equiv, the top five shown and the rest folded (Rule 8, BELIEF_PAGE_RULES.md:178) | n/a | `simple_rows` keeps the file order and does not sort (`:704`). There is no fold. | 0 of 91 sorted by code. No side has more than 2 rows today, so nothing is visibly out of order. | `rankByScore` plus `TABLE_TOP_LIMIT` (`SimilarBeliefsSection.tsx:34-38`). | Partly (checked) | Sort by Equiv descending, constants last. |
| B4 | Same-strength paraphrases near 100% shown as prose merge candidates above the table (BELIEF_PAGE_RULES.md:447-449) | n/a | Replaced by "Ways of Saying the Same Thing" (Wording / Chars / Equiv / Verdict). Its line is 0.90 (`wordings`, `:1198-1216`). | 2 of 245 (also 3 claim pages) | Prose above the table at 0.95 or more (`PARAPHRASE_THRESHOLD`). | Complies differently (a ranked table, not prose) (checked) | The rules doc says "near 100%", the static site uses 0.90 and Next.js 0.95. |
| B5 | Any equivalency score on a belief page | n/a | An argued equivalence score: 2. An Equiv cell of any kind: 91. A computed wording-overlap number between two rows ("Wording overlap, unargued", `:832-837`), which compares reasons rather than beliefs: 33. | 2 of 245 argued. 94 of 245 carry an Equiv cell or a computed overlap. | Stored float, never argued. | Partly (checked) | 243 of 245 belief pages carry no argued equivalency score. |
| B6 | The Equiv cell links to the page that argues it | n/a | `H.num(..., d.get('equiv'))` links when an `equiv_id` exists (`:1050`). | 3 cells on 2 pages | Not linked to `/equivalence/[slug]`. | Partly (checked) | An unargued cell offers no way to open the equivalence page from where it is read. |

### Status counts

Sections A and B together have 40 elements (39 from the author plus row 25a, added on re-reading the template), tallied from the Status column:

| Status | Section A (34) | Section B (6) | Total (40) |
|---|---|---|---|
| Complies | 2 (rows 18, 33) | 1 (B1) | 3 |
| Complies differently | 11 (1, 2, 4, 5, 19, 20, 23, 24, 26, 28, 32) | 1 (B4) | 12 |
| Partly | 8 (11, 12, 16, 21, 25, 27, 30, 31) | 3 (B3, B5, B6) | 11 |
| Missing | 13 (3, 6, 7, 8, 9, 10, 13, 14, 15, 17, 22, 25a, 29) | 0 | 13 |
| Conflicts with rules doc | 0 | 1 (B2, Rule 6) | 1 |

Nine of the 13 Missing rows are scorecard steps the static site deliberately does not run, as the repo template
says: Steps 2 to 5, Step 7's battle, Step 8 and Step 9's battle. They need typed inputs that no table has. Two
more are computable from the graph today: Step 11 (shared evidence) and Step 14 (network position). The last two
are the step index and the verdict colour key.

## C. Order

The template's order is Steps 1 to 17. The static equivalence page renders: header (question, score, Used on),
Belief X and Y (Step 1), Equivalence Arguments (Step 10), Check table (wording again, then the Step 13 verdict),
Hidden assumptions and bias risks (about Step 9, only when filled), Definitions (no template counterpart), Where
This Page Is Used (Step 16), Scoring Engine (the Step 12 derivation and the Step 15 cite line), Contribute
(footer).

Out of order on the static site:
- Hidden assumptions and bias risks, the nearest thing to the Step 9 triggers, comes after the Step 13 verdict.
- The Scoring Engine, which holds the Step 12 derivation and the Step 15 audit line, comes after Step 16. This
  follows rules doc Rule 1 (BELIEF_PAGE_RULES.md:26-28: the readout goes at the back, and no number but the heading
  score comes before the arguments). It is a rules-doc choice, not a mistake.
- Definitions is inserted before Step 16, also by Rule 1.
- Steps 2-8, 11 and 14 are absent, so they cannot be placed.

Out of order in Next.js: the "Final Equivalence Score" and "Verdict" banner (`page.tsx:66-75`) comes before Step 1.
The template puts them at Steps 12 and 13, and Rule 1 puts no verdict before the arguments. The steps it renders
otherwise run in order (1-10, 12, 13, 15, 17).

On belief pages Similar Beliefs comes after General to Specific, as in the 163411203 export. (corrected) Of the 91 pages
that draw it, it directly follows General to Specific on only 4; General to Specific is empty and dropped on the
rest, so it follows Media Resources on 83 and Interests, Not Positions on 4. The relative order holds.

## D. Fixes, most important first

- [ ] **Decide whether the published equivalence score is the argued page truth or the scorecard's weighted
  blend, and print the other one beside it** (owner decision). The static site publishes (agree + k x 0.50) /
  (agree + disagree + k), and the repo template calls the 0.40 / 0.40 / 0.20 scorecard a design that is not run.
  Next.js `/equivalence/[slug]` publishes the scorecard. The owner's October 2026 direction is to publish a rule
  beside the current one and compare them on real pages. Concretely, in `render_special`'s equivalence branch
  (`render_site.py:1403-1405`), add a check-table row "Scorecard rule (not used): 0.40 x synonym + 0.40 x overlap +
  0.20 x balance - penalties". It would read the balance from the page and the other components from new typed
  page columns, and print "inputs not filled in" until they exist.
- [ ] **Settle one set of verdict bands** (owner decision). PBWorks and Next.js `/equivalence` use 90 / 75 / 50.
  The static site and the repo template use 0.90 / 0.50 with no "merge with note" band. Next.js
  `/api/beliefs/equivalency` and `/algorithms/belief-equivalency` use 0.90 / 0.70 / 0.45 / 0.20. The paraphrase
  line is 0.90 on the static site, 0.95 in `SimilarBeliefsSection.tsx` and "near 100%" in the rules doc. If
  75-89 is adopted, the change is the verdict expressions in `render_special` (`:1405`) and `wordings` (`:1211`),
  which would print "Overlapping: merge with a note naming the difference" for 0.75 to 0.90.
- [ ] **Stop printing 0.50 in Similar Beliefs' Equiv cell when no equivalence page exists** (work). In
  `render_belief` (`render_site.py:1050`), change the `eq` lambda to print a blank or "[pending]" cell with an
  "argue it" link to the equivalence form when `d.get('equiv')` is empty. Today 339 of 342 cells show a constant,
  against Rule 6. The alternative is a rules-doc change: add Equiv to the labelled-constant list at
  BELIEF_PAGE_RULES.md:88 (an owner choice, since it would also have to say what a cell means when no page exists).
- [ ] **Sort Similar Beliefs rows by Equiv and fold past five** (work). Give `simple_rows` (`:698`) an optional
  `key` argument and pass the equivalence truth from `render_belief` (`:1051`), descending with unargued rows
  last, as `scored_table` folds. This is Rule 8's rank key "Equiv for similar beliefs".
- [ ] **Add the Step 14 network readout and the Step 11 shared-evidence table to equivalence pages** (work). In
  `render_special`'s equivalence branch, add a helper `network_overlap(c, x, y)`. It would print Network Layer /
  Belief X items / Belief Y items / Overlap % for upstream pages (what reads each), downstream rows (what each
  reads) and evidence rows. A second table, Shared / Unique to X / Unique to Y, would come from
  `c.specs[x]['args']` and the evidence rows. Label both "moves no score". Everything comes from `edges.csv`, so
  nothing is typed.
- [ ] **Print the computed wording similarity of X and Y in the check table** (work). Add a row "How alike the two
  wordings read (spelling, not meaning)" with `c.sim.between(x, y)` (`similarity.py:283`) and the negation, reversal and substitution
  flags (`similarity.opposite`, `reverses`, `substitutes`) in `render_special` (`:1403`). This is the site's honest
  stand-in for the Step 2 fast path and the Step 5 synonym score, and it moves no score (w_ces = 0, as
  `similarity.blend` documents).
- [ ] **Carry unfilled parts on equivalence pages** (work). In `render_special`, when `assume_hold`, `assume_fail`,
  `bias_up` and `bias_down` are all empty, list "Hidden assumptions and bias risks" under a "Not filled in yet"
  block with its first-row form, as `render_belief` does (`:1069-1074`), instead of dropping the section (`:1416`).
- [ ] **Print the pattern note under the Equivalence Arguments totals** (work). In `render_special` (`:1379`),
  append `KD['pattern_note']` as the repo template shows. Today the workbook prints it (`build_subpages.py:163`)
  and the HTML does not (0 of 3).
- [ ] **Name the canonical wording in the check table** (work). Add a row "Wording that stands in (0.90 or
  more)" from `c.brief(x)` and `c.brief(y)` in `render_special`. This is the site's form of Step 13's "Canonical
  Page".
- [ ] **Put X, Y and the verdict in the per-page JSON** (work). In `page_json` (`:3701`), add `x`, `y` and
  `verdict` for equivalence pages, so Step 17's machine-readable output carries the pair and the decision.
- [ ] **Next.js: render the stored steps it drops, and move the verdict banner down** (work). In
  `src/app/equivalence/[slug]/page.tsx`: render Step 6 per dimension (`certaintyDelta`, `scopeDelta`,
  `forceDelta`), Step 11 (`evidenceArgumentOverlapRate`), Step 14 (`networkPositions`), Step 16 Related Pages and a
  Contribution column in Step 10. Move the Final Score and Verdict banner (`:66-75`) to after Step 10. Link
  `SimilarBeliefsSection` Equiv cells to `/equivalence/[slug]` when an analysis exists. Add one seeded
  `EquivalenceAnalysis` so the route has a page to show.
- [ ] **Add missing trigger patterns** (work, corrected). In `build_subpages.py:93` (`equivalence.patterns`), add
  "Different evidence", "Different assumptions" and "Different policy implication" to the disagree starters, so all
  four Step 9 triggers have a reason pattern (today only "Different mechanism" maps to one). The triggers are
  reasons the two differ, so they belong on the disagree side, not as agree patterns. A pattern is a prompt and
  moves no score.
