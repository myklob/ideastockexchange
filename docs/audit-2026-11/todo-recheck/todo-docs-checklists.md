# Open to-do lists in docs/, re-checked against the code (2026-11-22)

Scope: every unchecked `- [ ]` item in the six files below. Static site first (`tools/static-site/`, fresh build at
`SCRATCH/site/`), the Next.js app second. The sample belief page is `site/p/barring-members-congress-president.html`
(a complete belief, first on `best.html`). `SCRATCH` = `scratchpad`.
Line numbers in `render_site.py` are for `tools/static-site/render_site.py` at commit 3276ea1.

Re-check (skeptic, 2026-11-22): every Done and Obsolete row and 18 others opened against code and the built site. The six docs hold 105 open items (95 rows, the 11 PR checkboxes as one), not 95 and 85. After the re-check: 36 Done, 34 Partly done, 11 Not done, 14 Obsolete, 0 Blocked (the generator CLI path does not import the two files that fail to parse).

Skipped by instruction: `docs/MONETIZATION.md` (33 items: subscriptions, trading, gamification, matching) and
`docs/BELIEF_LINKS_IMPLEMENTATION_SUMMARY.md` (29 items for the BeliefLink API of the archived Express backend).

## docs/BELIEF_PAGE_RULES.md (Pre-Generation Checklist, lines 536-567)

| Item | Status | Evidence | Next step |
|---|---|---|---|
| No summary at top; heading truth score the only number above the arguments | Done (checked) | `render_site.py:817-819` (no readout above the arguments, Rule 1); pinned by `test_render.py:859`. Built page: H1 carries the truth score and vote counts, then meta, invite, Argument Trees. Vote counts on the heading line are the owner's direction (CLAUDE.md). | |
| Breadcrumb Home › Topics › Category › This Belief | Done (checked) | `render_site.py:550`; built page reads Home › Topics › Government › Government ethics › Public office and private gain › parent belief › Belief (deeper than the rule's example, same shape). | |
| Metadata line: Topic / Position on the axis, typed / Used on; Net Belief Score not there | Done (checked) | `render_site.py:724-727` ("Position on the topic axis (typed, not scored)"); built page meta line has Topic, Position +65, Used on. Net score is in What the numbers are made of (`render_site.py:761`). | |
| Belief stated in positive form | Partly done (checked) | Only guidance: `build_pages.py:222` ("stated in positive form"). No check in `integrity.py`, `test_content.py` or `publish.py` reads it. | Add a content test that flags a belief whose text opens with a negation (reuse `similarity.negated`, `similarity.py:68`). |
| Invitation block under H1: hook, question, promise, "If you disagree" naming one slot | Done (checked) | `render_site.py:1721`; built page `div.invite` has hook, q, promise and an ask naming one argument that "rests on argument alone". | |
| Objective Criteria: at least one deliberately failing criterion scored low; Strengthen/Weaken pairs differ | Not done | Sample page: all 3 criteria score 0.50 with Validity Medium/High. `grep -i "deliberately fail"` finds the rule only in `docs/BELIEF_PAGE_RULES.md:376,541`; nothing in `tools/static-site/` or `src/` checks either half. | Add a check in `integrity.py` (or `test_content.py`) that a criterion's strengthen and weaken readings differ, and list "no failing criterion" in the page's What this page needs. |
| What This Page Needs Right Now: gaps, where each goes, who fills it, above Contribute | Done (checked) | `render_site.py:1076`, `:1685`; built table has The gap / Where it goes / Who is best placed. Static has no Contribute section (forms sit under tables). | |
| What the numbers are made of: Net Belief Score, Bottom line, auto-derived strongest pro/con and top mover, How a row counts | Partly done (checked) | Static: agree share `render_site.py:761`, strongest for/against `:777`, what would move this most `:785`, bottom line only when typed `:815`. No "How a row counts" row (0 built pages; 0 hits in `render_site.py`). App has both labels: `ScorecardSection.tsx:108,154`. | Add a "How a row counts" row to the readout at `render_site.py:761-815` (the formula already in the Argument Trees caption, `:825`). |
| Definitions is the last analysis section; only the listed sections follow | Partly done (corrected) | Rule 1 itself (`docs/BELIEF_PAGE_RULES.md:26`) and the template (`templates/belief-analysis-template.html:145-146`) already allow Related Beliefs, Not filled in yet, Structural Checks and Scoring Engine after Definitions. Only Share this argument (`render_site.py:1117`) is in neither list, and the checklist line (`BELIEF_PAGE_RULES.md:544`) lags Rule 1. App follows the list: `page.tsx:319-363`. | Add Share this argument to Rule 1 and the template list, and bring checklist line 544 into line with Rule 1 (CLAUDE.md sync rule). |
| Add to This Page after the numbers: a form per table, Agree/Disagree after the score, vote-never-counts sentence | Done (checked) | Placement differs by design: a form under every table (`render_site.py:1955-1960`, CLAUDE.md "a form under each table"), Agree/Disagree on the heading line after the score badge, and the meta line says votes "never move a score". | Update the checklist wording to the form-under-each-table placement. |
| Argument Trees and Evidence Ledger carry Confidence and Uniqueness; caption prints the signed formula and "reads exactly 0" | Done (checked) | `render_site.py:587,608` (Conf, Uniq columns); caption `:825` ("a reason nobody has argued yet scores exactly 0"); Evidence Ledger caption spells the formula out in full words. | |
| What Would Change the Answer follows Decision Leverage, ranked by Move, with not-shown and sweep line | Partly done | Static has WWCA (`render_site.py:654`) ranked by Move with "Not shown: 105 further inputs" and the one-at-a-time line, but no Decision Leverage section, so it follows Argument Trees. App has Decision Leverage (`page.tsx:207`) and no WWCA (comment `page.tsx:202-205`: no sensitivity engine in `src/core/scoring`). | Port `sensitivity.py` to `src/core/scoring` for the app, and decide whether the static site gets a Decision Leverage section or the rule drops the ordering. |
| Argument cells: atomic propositions, quote inline, ~Name, no citations, percentages or study names | Partly done (checked) | Count over `content/edges.csv` argument rows joined to `pages.csv`: 116 of 2553 argument claims carry a percentage, some cite a study ("Eggers and Hainmueller (2013) found..."). `~` appears on 6 built pages. No lint for Rule 3. | Add a `test_content.py` warning for percent signs and "(Name Year)" in argument claims, then move those numbers into Evidence Ledger rows (editorial, per row). |
| Argument Trees and Evidence Ledger each a single two-sided table | Partly done (corrected) | Argument Trees halves sit side by side (`two_sided`, `render_site.py:686`, used at `:828`). The Evidence Ledger halves are `stacked()` one above the other (`:846`), which CLAUDE.md reserves for wide tables. Neither is a single table. | Reword the item to "two halves, side by side for Argument Trees, stacked for the Evidence Ledger", matching CLAUDE.md. |
| Column headers spelled out, no abbreviations | Partly done | Evidence Ledger spells them out (`render_site.py:608`); Argument Trees, predictions and two other tables print Conf/Link/Imp/Uniq/Contrib. as `<abbr>` (`:587,858,1355,1456`), deliberately for narrow tables (comment `:465-466`). | Owner or doc: either accept abbr-with-expansion in narrow tables and amend the rule, or spell out and test the 540 px fit. |
| All evidence as Finding (Producer, Year), one of 18 Source types, Bears On target | Partly done (checked) | Columns present (Finding, Bears on, "Rests on: <source type>", `render_site.py:845`). Count: 161 of 699 evidence rows point at a page with no `etype`, 16 have no source at all. | Fill `etype` for the 161 evidence pages (list them with a one-off query on `pages.csv`). |
| Every evidence row shows Standing; retraction-exposure line when points at risk | Partly done (checked) | Static: 0 occurrences of "Standing" on the sample page and in `render_site.py`; it shows "checked <date>" from factcheck instead. App only: `EvidenceSection.tsx:84` (Standing cell), `:181` (exposure line), engine `src/core/scoring/evidence-exposure.ts`. | Add a Standing column to the static Evidence Ledger from `factcheck/judged.json` verdicts. |
| Every table sorted by rank key, unscored rows sink, top five shown | Partly done (corrected) | Scored, prediction, CBA and interest tables sort (`render_site.py:572,860,901,1368`) and fold at five (`collapse_tables`, `:395-417`). Objective Criteria rows keep filing order (`:882-886`, no sort) and so does Where This Page Is Used (`used_on`, `:1229-1237`). Over all 7123 built pages, 10 of 1286 multi-row tables with a score column are out of order: 7 Where This Page Is Used, 2 Logical Anatomy, 1 General to Specific. | Sort the criteria and `used_on` rows by truth descending; sort Logical Anatomy or exempt it in Rule 8 (it follows the logical form). |
| Objective Criteria columns, and says the four labels are typed | Done (checked) | `render_site.py:884`; built header: criterion with strengthen/weaken readings under it / Score / Validity / Reliability / Linkage / Importance / Latest reading; caption "These four labels are typed by the author". | |
| Falsifiability rows per-row Scores plus nothing-could-falsify note; Predictions split, Result So Far, At Stake | Partly done | Falsifiability `render_site.py:869` has per-row "Its truth"; no nothing-could-falsify row (0 hits in `render_site.py` and `FalsifiabilityTestSection.tsx`). Predictions `:858,874` split Follows if true / false with At stake; the result-so-far is the Truth column, not a named column. | Add the note row to the falsify table when nothing in it could move the score; rename or document Truth as Result so far. |
| Logical Anatomy: logical form plus components with Load Bearing (typed) | Done (checked) | `render_site.py:942`; built page prints "Logical form (...) AND (...)" and a "Load bearing (typed)" column. | |
| Cost-Benefit: Category (Units) / Magnitude / Range / Likelihood / Expected Value; subtotal within category; conversions out loud | Done (checked) | `render_site.py:916`; built tables Claim / Estimate / Range / Likelihood / Expected value, "Net by category" by units, readout "mixed units, no single net". Every Range is empty (open decision 3). | |
| Conflict Resolution sub-sections in order, Advertised vs Actual with Divergence Score | Partly done (checked) | Static `render_site.py:958-1028` has all sub-sections in order, Primary conflict pair computed `:983`; no Divergence Score (0 hits in `render_site.py`, 0 built pages). App has it: `ConflictResolutionSection.tsx:268`. | Add a Divergence Score to the static Advertised vs Actual table (port the app's rule). |
| Decision Leverage engine-ranked, links resolve, omitted when nothing at stake | Partly done | App only: `page.tsx:207` (`hasLeverageToShow`), engine `src/core/scoring/decision-leverage.ts`. No Decision Leverage section on the static site (0 hits). | Same step as the WWCA row: decide whether the static site carries it. |
| Where Used, Score History, People on the Record, Related Topics render only with rows | Partly done (checked) | Static: Where used `render_site.py:1229-1230` returns '' with no uses; People `:1059` conditional; Related Beliefs `:1064` renders whenever a topic exists even with no siblings; no Score History. App: `page.tsx:303,311,325` conditional. Empty parts listed in "Not filled in yet" `:1070`. | Guard Related Beliefs on `sibs` at `render_site.py:1065`. |
| People on the Record has a Source column with date | Partly done (checked) | Static shows "read the source; checked <date>" under the name, not a Source column with the statement's date; 79 of 286 person rows carry no url. App: `PeopleOnRecordSection.tsx:40` SourceCell. | Add a Source column to `simple_rows` for the person section and source the 79 rows. |
| Prevalence and cost/benefit estimates carry a source or stay blank; typed inputs labelled typed | Partly done (checked) | Labels present (CBA caption "typed by the author", `render_site.py:916`). Count: 119 of 151 typed magnitudes have no source (`edges.csv` section `cba`, no `source`, no `url:` in `extra`, no `where_found`). | Source or blank the 119 magnitudes (owner's estimates, open decision 3). |
| Similar Beliefs: near-100% paraphrases in prose as merge candidates | Partly done | Static puts equivalence wordings in a separate "Ways of Saying the Same Thing" table (`render_site.py:1216`), not prose; Similar Beliefs keeps an Equiv column (`:1049`). App prose: `SimilarBeliefsSection.tsx:77,101`. | Amend the rule to the separate table, or render merge candidates as a sentence. |
| Every link resolves or is plain text | Done (checked) | `SCRATCH/build.log:1` "broken internal links: 0"; CI refuses otherwise (`.github/workflows/check.yml`, grep on render.log). | |
| No `href="#"` | Done (checked) | `grep -l 'href="#"' SCRATCH/site/p/*.html` returns 0 files; 0 in `render_site.py`, 0 in `src/features/belief-analysis`. | |
| Symmetric structure in Interests, Advertised vs Actual, Biases, Obstacles | Done (checked) | All four go through `two_sided` / paired tables (`render_site.py:958-1028`); built page shows Supporters/Opponents halves for each. | |
| Score cells blank for unargued rows; Importance 0.50 means not differentiated | Partly done (corrected) | Not obsolete: Rule 6 is still in force (`docs/BELIEF_PAGE_RULES.md:143-155`, "Never use +0 or -0 as a default") and CLAUDE.md lists blank scores as a hard rule. App follows it (`ArgumentTreesSection.tsx:14,32,38`). Static does the opposite on purpose: grey labelled constants and +0.00 (`render_site.py:41` "A blank cell in a column of numbers reads as a zero", `:484-485`; README.md:34 "the site shows those in grey"). | Owner decision: amend Rule 6 to the built site's grey labelled constants, or blank the static cells. |

## docs/ALGORITHMS.md (Implementation Checklist, lines 602-617)

| Item | Status | Evidence | Next step |
|---|---|---|---|
| Conclusion Score (pro/con aggregation) | Done (checked) | Static `score_reference.py` (truth = (POS + w x p0) / (POS + NEG + w), README.md:17-27); app `src/core/scoring/scoring-engine.ts` A/(A+D). The two disagree on volume (open decision 1). | |
| Evidence Quality (tier-based defaults) | Done (checked) | `tools/static-site/evidence.py:79` (ESIW table, 18 tiers); `scoring-engine.ts:116` `getEvidenceTypeWeight`. | |
| Linkage Debate creation per evidence-claim link | Partly done (corrected) | Nothing auto-generates. The app linkage route loads `prisma.argument` only (`src/app/arguments/[id]/linkage/page.tsx:380`), so evidence rows have no linkage page; `generateLinkageSubClaim` (`scoring-engine.ts:235`) is called by nothing. Static opens a row's linkage page on demand from "argue about this row" (`render_site.py:1932`), starting at DEFLINK 1, which the owner's "start trusting" direction settles. | Give app evidence rows a linkage page, or retire "auto-generate" in ALGORITHMS.md. |
| Simple normalization | Partly done (corrected) | The doc's shape, normalize by total argument count (`ALGORITHMS.md:31`), is implemented nowhere. Static bounds truth as a share (README.md:23), the app as A/(A+D): same purpose, different shape. | Mark the count normalization in ALGORITHMS.md as replaced by the bounded share. |
| Recursive depth-weighted aggregation | Partly done | Recursive everywhere; depth weighting only in app linkage display (`applyDepthAttenuation`, `linkage/page.tsx:86`, 0.5^depth) and the CBA engine (0.5^(d-1)). Static `score_reference.py` has no depth term; the doc says divide by n. | Owner decision: whether depth attenuation enters the scorer of record (a rule change with a conformance diff). |
| Multi-factor evidence quality | Done (checked) | `evidence.py` ESIW x ERQ x ERP start and weight (README.md:21); EVS printed beside, read by nothing. | |
| Linkage Debate scoring via ReasonRank | Done (checked) | Static linkage pages are scored by the same engine as any page (`score_reference.py:173` reads `link_id`); app `calculateLinkageFromArguments` (`linkage/page.tsx:24`). | |
| Linkage type classification (causal, necessary, sufficient, strengthener) | Partly done | The four types exist only in `scoring-engine.ts:238-246` inside an uncalled function. Prisma uses a different 7-value `LinkageClassification` (`prisma/schema.prisma:367,432`). Static has no linkage type (no column in `edges.csv`). | Pick one taxonomy (owner decision if it changes scores); otherwise add a `type` to linkage pages as a label read by nothing. |
| ReasonRank propagation | Done (checked) | `reasonrank.py:49,75` (network walk, damping 0.85), shown as "Relied on" on every page; app `src/core/scoring/` propagation. | |
| Fallacy detection | Done (checked) | `fallacy.py:22,48` flags by a published phrase list; the flag is argued and moves no score (owner's October 2026 direction). App: `/api/fallacy-claims`. | |
| Redundancy detection | Done (checked) | `similarity.py` (computed duplicate detector), "a repeated claim counts once" (README.md:29-30), uniqueness pages; app `duplication-scoring.ts`. | |
| Topic overlap scoring | Partly done | The doc's TO = SEM x 0.40 + TAX x 0.25 + CIT x 0.15 + NAV x 0.10 + GD x 0.10 (ALGORITHMS.md:352) is implemented nowhere. App `calculateTopicOverlapScore` (`all-scores.ts:630`, used by `fetch-belief.ts:9`) is token overlap among sibling arguments; static places beliefs by typed `topics.csv` rows. | Either implement TO from data the site has (taxonomy distance, shared sources, graph use) or mark the doc formula retired. |
| Importance scoring separate from truth | Done (checked) | Importance pages and DEFIMP 0.5 (`score_reference.py:34,173`; importance = max over interests of Validity x Bears, README.md:31). | |

## docs/IMPLEMENTATION.md (Manual Testing Checklist, lines 315-324)

This file documents the Express + MongoDB app now under `_archive/backend` and `_archive/frontend`. Items are read
against today's site.

| Item | Status | Evidence | Next step |
|---|---|---|---|
| User registration works | Obsolete (checked) | No accounts: people take part through GitHub (CLAUDE.md, "there is no server"); a login gets a page at `u/<login>.html` (`render_site.py:370`). | |
| User login works | Obsolete (checked) | Same; GitHub is the identity. | |
| Token persists across refreshes | Obsolete (checked) | No session tokens on the static site. App agent keys only: `src/lib/agent-auth.ts:14`. | |
| Protected routes require authentication | Done (corrected) | App write routes under `/api/v1` require an agent key (`src/lib/agent-auth.ts:38` `authenticateAgentKey`, called at `src/app/api/v1/forum/posts/route.ts:28`). Static has no routes; writes arrive as pull requests gated by `.github/workflows/check.yml`. | |
| Belief creation works | Done (checked) | Propose-a-belief form, `.github/ISSUE_TEMPLATE/belief.yml`; `intake.py:516` `new_page`; `test_intake.py` (93 tests). | |
| Argument creation works | Done (checked) | Form under each table (`render_site.py:1955-1960`), `intake.py:544` `rows_for`; app `POST /api/beliefs/[id]/arguments`. | |
| Evidence submission works | Done (checked) | Evidence form on every belief page; app `POST /api/beliefs/[id]/evidence`. | |
| Score calculation works | Done (checked) | `score_reference.py`; `conformance.py --check` and the test suite run in CI (`check.yml`). | |
| Voting system works | Done (checked) | `vote.yml`, `intake.py:625` `record_vote` into `content/votes.csv`; counts shown, never scored. | |
| Evidence verification works | Done (checked) | `factcheck/judged.json` (3156 verdicts), "checked <date>" on rows; app verification lifecycle (`evidence-exposure.ts`). | |

## docs/ADVANCEMENT_SUMMARY.md (What's Next, lines 386-406)

Also written for the archived Express app (`frontend/src/...`, now `_archive/frontend`).

| Item | Status | Evidence | Next step |
|---|---|---|---|
| Belief Stability Confidence Score tracked over time | Partly done | Static computes confidence and stability now (`confidence.py:1`, "Confidence 69%" on the sample page) but keeps no history. App: Score History (`page.tsx:311`, `/api/beliefs/[id]/history`). | Derive a static score history from the git history of `content/*.csv` at build time. |
| Impact Analysis Dashboard with charts | Partly done | App `/leverage` is a ranked table dashboard; static has ranked lists (`lists.html`, `next.html`). No charts anywhere. | Covered by the charts row below. |
| Conflict Resolution Suggestions algorithm | Partly done | Static computes the Primary conflict pair (`render_site.py:983`); compromises are typed rows. App computes candidates: `conflict-resolution.ts:255` `findCompromiseCandidates`. | Port compromise candidates to the static site as suggestions marked computed. |
| Cost-Benefit Analysis Module | Done (checked) | Static CBA section `render_site.py:916`; app `/cba` with `cba-scoring.ts`. | |
| Testing Suite (Jest, Vitest, Playwright) | Partly done (corrected) | Vitest exists (`package.json:12`) but no workflow runs it (`check.yml`, `pages.yml` run only the Python suite). 19 Python test modules (not 22) run in CI. `tests/e2e/` is empty; no Playwright dependency. | Add `npm test` to `check.yml`, and a browser smoke test or drop Playwright from the item. |
| API Documentation (Swagger/OpenAPI) | Not done (checked) | No openapi or swagger in `src/` (grep); only the two docs mention it. | Write an OpenAPI file for the read routes the iOS app uses (`/api/beliefs`, `/api/beliefs/[id]`). |
| Enhanced Error Handling across all components | Obsolete (checked) | The components meant are the archived React ones (`_archive/frontend`). | |
| Performance Optimization (caching, rate limiting) | Partly done (corrected) | Rate limiting exists in the app (`src/lib/agent-auth.ts:10-11`, 60 a minute by default); no caching layer in `src/` (0 hits for `revalidate`, `unstable_cache`, `use cache`). The static site is files on GitHub Pages. | None needed for the static site; add caching to the app only if its read routes need it. |
| Docker containerization | Obsolete (checked) | No Dockerfile; the site deploys from GitHub Actions (`pages.yml`) and the app from `vercel.json`. | |
| CI/CD pipeline | Done (checked) | `.github/workflows/pages.yml` (tests, conformance, render, link check, publish), `check.yml`, `intake.yml`. | |
| Real-time updates (WebSocket) | Obsolete (checked) | No server; changes publish on merge. | |
| Advanced search with Elasticsearch | Obsolete (checked) | Replaced by client-side search over `data/pages_index.json` (`render_site.py:2852`). | |
| Machine learning for fallacy detection | Not done | `fallacy.py:22` uses a published phrase list; CLAUDE.md: flags move no score, and a model-asserted number is refused. | Owner decision: whether a model may raise flags (as claims to argue, never as numbers). |
| Social features (followers, notifications) | Partly done | Contributor pages `u/<login>.html` (`render_site.py:370,4489`); following and notifications are GitHub's. | None needed beyond GitHub unless the owner wants on-site follows. |
| Mobile app (React Native) | Obsolete (checked) | Chosen route is PWA + TWA (`docs/ANDROID.md`) and a SwiftUI shell (`ios/project.yml`). | |
| Admin dashboard | Obsolete (checked) | Moderation is pull-request review gated by `check.yml`. | |
| Data visualization with D3.js/Recharts | Not done | `recharts` is declared (`package.json:39`) and imported by no file in `src/`; static pages have no charts. | Use it for one chart (Score History) or remove the dependency. |

## docs/TEMPLATES_README.md (Future Enhancements, lines 161-167)

The `template-*.html` mockups this list was written for now sit in `_archive/legacy-root/`.

| Item | Status | Evidence | Next step |
|---|---|---|---|
| Dark mode toggle | Partly done | Static `ise.css` follows the system setting (`@media (prefers-color-scheme:dark)` with `data-theme` overrides); no toggle on any built page (0 hits for `data-theme` or `localStorage` in `index.html`). | Add a small toggle that sets `data-theme` on `<html>`, remembered in `localStorage` in a try/catch. |
| More detailed chart implementations | Obsolete (checked) | Charts belonged to the archived mockups (`_archive/legacy-root/template-*.html`). | |
| Interactive filter demos | Obsolete (checked) | Same archived mockups. | |
| Mobile navigation menu | Obsolete (checked) | The site has no menu by design (breadcrumb plus home cards); layout responds at 600-1000 px (`ise.css` media queries). | |
| Additional page templates (settings, help) | Obsolete (checked) | No accounts, so no settings; help is `about.html`, `method.html`, `outline.html`. | |
| Media sorting/filtering interactivity on the index page | Not done (checked) | `media.html` is ranked at build time by yardstick; its only `<select>`s belong to the add forms. | Add a no-script-safe filter by kind and yardstick to `media.html` (renderer near `render_site.py:3570`). |
| Media contribution forms | Done (checked) | `media.html` has `id="add-media"` (`render_site.py:3570`); every belief page has a media form (`:1031`). `templates/media_index.html` has none (0 `<form>`), so the template lags the site. | |

## docs/CONTRIBUTING.md (Areas for Contribution, lines 81-101; PR template, lines 649-664)

This file is written for the Python topic generator in `src/core/ai/` (it says `python -m src.cli`; the CLI is
`src/core/ai/cli.py`, and the root `requirements.txt` it installs does not exist). `main.py` and `services.py` there
do not parse (`py_compile`: `'(' was never closed`; `IndentationError ... services.py, line 785`), CLAUDE.md open decision 5.

| Item | Status | Evidence | Next step |
|---|---|---|---|
| Add automated tests | Partly done (corrected) | Site and app are tested (CI `check.yml`; Vitest exists but is not in CI); the generator has none: `tests/unit/core/ai/` holds only `.gitkeep`. | Not blocked: the generator CLI path (`cli.py`, `generator.py`, `llm_client.py`, `belief_analyzer.py`, `scorer.py`, `template_engine.py`) compiles and imports neither `main.py` nor `services.py`. Add unit tests for it. |
| Improve error handling and recovery | Not done (corrected) | Not blocked: the CLI path compiles and does not import the two broken files (`py_compile` passes on all but `main.py`, `services.py`). It has plain try/except, no retry or recovery (0 hits for retry or backoff in `src/core/ai/*.py`). | Add retry with backoff around LLM calls in `llm_client.py`. |
| Support more LLM providers | Done (checked) | TS client `src/core/ai/ai-client.ts:49-66`: ollama, lmstudio, openai, anthropic, custom; Python `llm_client.py:21` has three. | |
| Create web UI | Done (checked) | App only: `src/app/debate-topics/new/page.tsx` calls `/api/debate-topics/generate`, which uses `ai-client.ts` via `features/debate-topics/ai-generator.ts:7`. | |
| Optimize for speed | Not done (corrected) | Not blocked (same CLI path). No caching or parallelism: 0 hits for cache, concurrent, asyncio, ThreadPool or multiprocess in `generator.py`, `llm_client.py`, `cli.py`, `belief_analyzer.py`, `scorer.py`. | Cache LLM responses by prompt hash in `llm_client.py`. |
| Database storage for topics | Done (checked) | Static `content/topics.csv`; `topic` and `topic_row` tables in `data/ise.sqlite` (confirmed in the built file). Generated debate topics persist in Prisma `DebateTopic` (`prisma/schema.prisma:1829`, written by `src/features/debate-topics/db.ts:259`). | |
| Version control for topic updates | Done (checked) | Topics live in git as CSV; changes arrive as intake pull requests (`intake.py`). | |
| Topic comparison views | Not done | `compare.html` compares two scoring rules, not topics; no topic-against-topic page in either implementation. | Add a page placing two topics' beliefs side by side by axis position. |
| Export to multiple formats (PDF, Markdown) | Partly done | Static exports JSON, XML, SQL, SQLite, JSON-LD (`SCRATCH/site/data/`) and plain text per page (`p/<key>.txt`, `outline_print.py`); no PDF or Markdown. | Add a Markdown export beside the `.txt` outline. |
| Improve belief extraction from unstructured text | Not done (corrected) | Not blocked: `belief_analyzer.py` compiles and is imported by `generator.py:10`, not by `main.py` or `services.py`. Nothing measures extraction quality. The site's structured plain-text path is the Reason Outline (`outline_read.py`). | Add a small labelled test set for `belief_analyzer.py` before changing it. |
| Multi-language support | Not done (checked) | `lang="en"` hard-coded (`render_site.py:551`); no translation layer. | |
| Collaborative editing | Done (checked) | GitHub issue forms (`.github/ISSUE_TEMPLATE/`) and intake pull requests, duplicate check turns a repeat into a vote (`contribute.js`, `intake.py`). | |
| Topic recommendation system | Partly done | `next.html` ranks what to argue next (`reasonrank.py:162` `work_queue`); nothing recommends by reader. | |
| Visualization of belief networks | Not done | No graph view in `tools/static-site/` or `src/` (only `_archive/frontend/.../ArgumentNetworkGraph.jsx`). | Render an SVG of a belief's tree two levels deep from `edges.csv`. |
| Integration with existing wiki platforms | Partly done | `tools/wiki_templates.py` keeps the GitHub wiki copies of the templates in step (CI step in `check.yml`); no PBWorks sync. | |
| PR template checkboxes (11, lines 649-664) | Obsolete (checked) | They are fill-in fields of a PR description inside a code block, not open work, and they assume the Python generator's PEP 8 workflow. | Point CONTRIBUTING.md at the static site workflow. |

## Still open

- [ ] **Reconcile Rule 6 with the static site's grey constants** (owner decision). The rules doc says blank, never +0; the static site prints labelled constants and +0.00 on purpose (`render_site.py:41`); the app blanks them.
- [ ] **Sort Objective Criteria and Where Used rows** (work). Both keep filing order (`render_site.py:882-886`, `:1229-1237`); 10 built tables are out of order.
- [ ] **Reword the two-sided item for the stacked Evidence Ledger** (work). Argument Trees sit side by side, the Evidence Ledger halves are stacked.
- [ ] **Give app evidence rows a linkage page, or retire auto-generate** (work). The app linkage route covers argument edges only.
- [ ] **Check Objective Criteria readings** (work). Fail a criterion whose strengthen and weaken readings match, and name "no deliberately failing criterion" as a gap.
- [ ] **Add How a row counts to the static readout** (work). The app has it (`ScorecardSection.tsx:154`); the static page's What the numbers are made of does not.
- [ ] **Settle the sections after Definitions** (work). Rule 1 and the template already allow Not filled in yet, Structural Checks and Scoring Engine; add Share this argument to both and bring checklist line 544 into line with Rule 1.
- [ ] **Bring Decision Leverage and What Would Change the Answer to both implementations** (work). Static has only the sweep, the app only leverage.
- [ ] **Lint argument cells for Rule 3** (work). 116 of 2553 argument claims carry a percentage and a study-citation pattern adds 17 more (133 by regex); those belong in the Evidence Ledger.
- [ ] **Decide abbreviated factor headers** (owner decision). Narrow tables print Conf/Link/Imp/Uniq on purpose; the checklist forbids abbreviations.
- [ ] **Fill source types for 161 evidence pages** (work). Their rows name no source type, so they start at the neutral prior.
- [ ] **Add Standing to the static Evidence Ledger** (work). Only the app shows the verification lifecycle and the retraction-exposure line.
- [ ] **Add the nothing-could-falsify note row** (work). Neither implementation renders it.
- [ ] **Add a Divergence Score to the static Advertised vs Actual table** (work). The app computes one.
- [ ] **Guard Related Beliefs on siblings** (work). It renders with an empty list when a topic has one belief.
- [ ] **Give People on the Record a Source column** (work). 79 of 286 person rows have no source at all.
- [ ] **Source or blank 119 typed cost and benefit magnitudes** (owner decision). They are the owner's estimates (open decision 3).
- [ ] **Decide how near-duplicate wordings are shown** (work). Static uses a table, the rule says prose.
- [ ] **Add a positive-form check for beliefs** (work). Only build guidance states the rule.
- [ ] **Decide depth attenuation in the scorer of record** (owner decision). Only the app's linkage page and CBA engine attenuate by depth.
- [ ] **Pick one linkage type taxonomy** (owner decision). The doc's four types live in an uncalled function, Prisma has seven others, the static site has none.
- [ ] **Retire or implement the Topic Overlap formula** (work). The five-weight TO in ALGORITHMS.md exists nowhere; mark its count normalization (line 31) replaced by the bounded share too.
- [ ] **Keep a static score history** (work). Confidence is computed but never tracked over time.
- [ ] **Port compromise candidates to the static site** (work). Only the app computes them.
- [ ] **Add an end-to-end browser test and run Vitest in CI** (work). `tests/e2e/` is empty, and no workflow runs `npm test`.
- [ ] **Write an OpenAPI file for the read API** (work). Nothing documents the routes the iOS app calls.
- [ ] **Decide whether a model may raise fallacy flags** (owner decision). Today only a phrase list does.
- [ ] **Use or remove Recharts** (work). It is a dependency nothing imports.
- [ ] **Add a dark mode toggle** (work). The site follows the system setting only.
- [ ] **Add media filtering on media.html** (work). Ranking is fixed at build time.
- [ ] **Restore or delete src/core/ai main.py and services.py** (owner decision). Open decision 5. No CONTRIBUTING item waits on it: the generator CLI path compiles without those two files.
- [ ] **Add retry, caching and tests to the topic generator** (work). `llm_client.py` has no retry or cache, and `tests/unit/core/ai/` is empty.
- [ ] **Add topic comparison, belief-network graph, Markdown export and multi-language** (work). None exists in either implementation.
- [ ] **Rewrite CONTRIBUTING.md for the static site** (work). It describes a Python generator setup whose paths no longer exist.
