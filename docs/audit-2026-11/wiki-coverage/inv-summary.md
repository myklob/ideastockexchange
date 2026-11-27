# Does the GitHub wiki explain the repository? Completeness review of the five inventories

Sources: inv-static-engine.md (77 rows), inv-static-pages.md (74), inv-static-contribute.md (45), inv-next-app.md
(103), inv-other.md (66), checked against `git ls-files` (1,235 tracked files), the built site in
`scratchpad/site/` (7,123 pages under `p/`: 245 beliefs, 5,794 claims, 625 interests, 361 media, 50 importance,
34 linkage, 9 driver, 3 equivalence, 2 uniqueness; 104 topic pages; 1 contributor page; 13 data files), the 13
live wiki pages and the 39 drafts in `docs/wiki/`. No repository file was changed.

## 1. Features the sweep missed

Each was searched for in all five reports by file name and plain name before being listed here.

| # | Feature | Where | Wired? | Live wiki explains it? | Draft covers it? | Priority |
|---|---|---|---|---|---|---|
| A1 | **The published front door.** The repository's root `index.html` is copied to the root of the GitHub Pages site (`.github/workflows/pages.yml:77`, `cp index.html _site/index.html`); the belief site sits under `/beliefs/`. It is the first page a reader sees, and it is stale: it says "five beliefs on government ethics across 261 pages" (the build has 245 beliefs and 7,123 pages), that "each page opens by saying what it supports doing, and all five currently say not yet" (the verdict module was removed; pages print numbers and no verdict), describes ReasonRank as "each argument inherits strength" (the site's ReasonRank measures reliance and scores no truth), and leads with a "prediction market for ideas" and a "constant-product market maker" that the site does not run. Six of its links are absolute `https://myklob.github.io/ideastockexchange/method.html...` URLs, which do not exist on the deployed site (method.html is under `beliefs/`), and the build's broken-link check (`render_site.py` over `_site/beliefs`) never sees this page | index.html; pages.yml:77 | published site | No | No | High |
| A2 | Interest pages' five-step **Check table** (if true the measure should show; if false; latest reading with source; basic test "do the two sides expect different readings?"; computed validity; typed bottom line) plus **Validity Arguments**, on all 625 interest pages | render_site.py (render_special, kind interest); site/p/*.html with `<h2>Check table` | published site | No (Automated Conflict Resolution Platform names IVS only) | Partly: Template:-Interest-Validity-Debate.md has the alibi and mirror tests, not this table | Medium |
| A3 | Importance pages' **"Interests at stake in this row"** table: Interest, Validity, Bears, Effective, Relative Value, with the strongest interest setting importance (50 pages). The reports state the rule (max of Validity x Bears) but no row names the table readers see | site/p/*.html (kind importance); score_reference.py:246-249 | published site | No | Likely-Interests-of-Those-Who-Agree-and-Disagree.md (rule only) | Medium |
| A4 | **Driver pages**: "how much an interest drives a position", argued separately from validity, with Driver Arguments (9 pages); interest pages say "Power never" counts | site/p/*.html (kind driver) | published site | No | No | Low |
| A5 | **The authoring table format** in `ise_tables.py`: the `pages`, `edges` and `topics` columns, the `extra` long-tail field ("name: value \| name: value"), and `specs_to_tables` / `tables_to_specs` as checked inverses. Anyone filing a row by pull request needs this; the reports name the CSVs but never their columns | tools/static-site/ise_tables.py:1-30; README.md:111 | published site (authoring) | No | Evidence-based-policy.md:112 names the workbook only | Medium |
| A6 | `build_example.py`: the formatted Excel workbook with live formulas, recalculated in LibreOffice and checked cell by cell against score_reference | tools/static-site/build_example.py:1-30; README.md:13, 115 | maintainer tool | No | No | Low |
| A7 | `make_artifact.py`: a variant of the built site with the stylesheet inlined, for hosted previews | tools/static-site/make_artifact.py:1-3; README.md:124 | maintainer tool | No | No | Low |
| A8 | `test_gates.py`: controls that break each CI gate (workbook sync, cycle check, conformance, link check) and check the gate fires | tools/static-site/test_gates.py:1-15 | CI | No | No | Low |
| A9 | `tools/ise-dev` CLI: `score`, `analyze`, `seed`, `dev`, `api-check` against the app's equivalency endpoint | tools/ise-dev/src/cli.js:1-20 | maintainer CLI (app) | No | No | Low |
| A10 | Posting drift guard: a new human-posted reason is compared with its siblings; moderate overlap is stored as an EquivalenceCandidate, near-identical overlap trips a "restatement speed bump" the poster must acknowledge | src/lib/posting/drift-guard.ts:1-40; src/app/api/beliefs/[id]/arguments/route.ts:32 | app | No | No | Medium |
| A11 | Evidence-store bridge: a topic-page ledger row linked to an engine Evidence node reads quality, linkage and standing at read time, so falsifying the node flips the row to FALSIFIED and zeroes its contribution | tests/integration/evidence-bridge.test.ts:1-8 | app | No | No | Low |
| A12 | Seed-corpus pins: the numbers docs and wiki pages quote from the seeded corpus (the Finland UBI pilot falsified, retraction propagating) are pinned so a change fails loudly; not run in CI | tests/integration/seed-corpus-pins.test.ts:1-12 | app (tests) | No | No | Low |
| A13 | Market price forecast feed (score drifts as Normal(current, sigma^2 t); display only, never settlement or scoring) and the order-matching engine | src/lib/markets/forecast.ts:1-10; src/lib/markets/matching.ts | app | No | No | Low |
| A14 | Public `spectrum_coordinates` shape in the belief API (valence -5..+5, specificity 1..10, intensity 1..5) converted from stored scales | src/features/belief-analysis/spectrum-coordinates.ts:1-15 | app (API) | No | No | Low |
| A15 | LLM helpers outside the scoring half of `src/core/ai/`: `belief_analyzer.py` sorts beliefs into Purpose / Function / Form; `src/features/debate-topics/ai-generator.ts` writes every section of a debate topic page from a configured provider | src/core/ai/belief_analyzer.py; src/features/debate-topics/ai-generator.ts | app (generator API) / unwired | No | No | Low |
| A16 | Orphaned root folders: `components/` (a mock arbitrage TradePanel, belief dashboard) and `lib/` (fake belief, trade and user data) sit outside tsconfig's `include` and are imported by nothing; `generated/belief-pages/` holds sample output of `html:sample` | components/arbitrage/TradePanel.tsx; lib/data.ts; tsconfig.json:31-37; generated/belief-pages/index.html | unwired | No | No | Low |
| A17 | Documentation the sweep never weighed: `_archive/wiki-2026-10/` (dev-docs: API-Reference, Data-Models, Installation-Guide, Scoring-System, Algorithms; pbworks-originals; repo-drafts) and `_archive/wiki-updates/` (wikiLaw, Database-Schema, Deployment-Guide, API-Documentation); root `FEATURES.md` and `ObjectiveCriteriaScoringAlgorithm.md`, the latter still pointing at `/backend/algorithms/scoring.py`, which exists only in `_archive`; `docs/WIKI_AUDIT.md` (the October audit, 351 rows); 50 other files in `docs/`. Readers browsing the repository on GitHub meet these before the wiki | _archive/; FEATURES.md; ObjectiveCriteriaScoringAlgorithm.md:357-360; docs/ | docs | n/a | n/a | Medium |

## 2. Corrections to the reports

**Spot-check of "Explained correctly: Yes".** The five reports contain only six Yes rows (four distinct features), so
all six were checked, and nine other load-bearing claims were checked to make fifteen.

| # | Row checked | Result |
|---|---|---|
| 1 | Engine: ESIW tier weights match EVS 2.1 | Confirmed. All sixteen weights in order (evidence.py:79-98 against the live table) |
| 2 | Engine: ERQ and ERP as inputs | Confirmed as definitions. The use differs (the wiki multiplies by ERQ unbounded), which the report records in a separate row |
| 3 | Pages: evidence tiers | Confirmed (same evidence as 1) |
| 4 | Next app: automatic upward propagation, Yes as a concept | Confirmed. Evidence-based-policy 1.3 "Scores dynamically recalculate" and ACRP line 16 match `propagateBeliefScores` (propagate-belief-scores.ts:282), called from ten write routes. On the published site the same promise holds only at build time, on each push |
| 5 | Next app: why pro and con media | Confirmed for the reasons given. Caveat the report missed: the app page (src/app/media/why-pro-con-media/page.tsx) still uses "directness" as a dimension, the same retired v4 dimension inv-other flags in the template |
| 6 | Other: why_pro_con_media_per_belief.html | Confirmed, with the report's own directness caveat |
| 7 | Engine: replication bounded at 2k | Confirmed (REP_CAP 2.0, evidence.py:101, 109-113) |
| 8 | Engine and pages: wiki ECLS returns 0 when nothing is argued; site starts at 1 | Confirmed (ECLS sample line 109; FACTOR_START evidence.py:106). Nuance: the app's linkage also returns 0 when unargued (scoring-engine.ts:174-176), so on this one point the wiki agrees with the app and not with the site |
| 9 | Next app: linkage (A - D)/(A + D) in [-1, 1] | Confirmed (scoring-engine.ts:165-182) |
| 10 | Contribute: ACRP promises anonymization | Confirmed (ACRP line 57) |
| 11 | Next app: stability = min(1, n/10) x (0.4 + 0.6 x dominance) | Confirmed (all-scores.ts:515-524) |
| 12 | Other: pipeline engine (Impact - CounterImpact) x Relevance x Evidence x Uniqueness | Confirmed (pipeline/models/belief_node.py:155-176) |
| 13 | Next app: CI runs no vitest | Confirmed (check.yml:30-48 runs only static-site steps) |
| 14 | Contribute: the form has 36 sections; drafts say 35 | Confirmed (contribute.yml section options: 36) |
| 15 | Other: iOS has four tabs, CLAUDE.md says two | Confirmed (RootView.swift:17-40, four `.tabItem`) |

None of the six Yes verdicts is overturned. Corrections found while checking:

- **inv-static-pages is wrong on confidence.** Its row 72 and its gap item say confidence has five components
  (grounding, two sided, scrutiny, breadth, depth). It has seven: sourcing 0.05 and testability 0.05 as well
  (confidence.py:30-38; method.html#confidence lists all seven). inv-static-engine is right. The merged checklist
  uses seven.
- **inv-static-engine's side finding about method.html#notrun needs softening.** The "wiki" citations are not
  invented: three of the four rules it says the live wiki lacks are in `_archive/`: evidence start values by kind
  (meta-analysis 1.0) in `_archive/wiki-2026-10/repo-drafts/ReasonRank-Google's-PageRank-for-Arguments.md`, lifecycle
  multipliers in `_archive/wiki-2026-10/dev-docs/Scoring-System.md:85`, and the corroboration rule in
  `_archive/wiki-2026-10/pbworks-originals/Redundancy-Problem.md:138-141`. The -1 to +1 Truth Score was not found
  there. The fix is to cite the archive path, not to drop the rows.
- **inv-other's count.** It says the live wiki touches 14 of its 66 features. Its own rows give 15 (1 Yes,
  5 contradicted, 9 outdated).
- **inv-next-app's count of correct rows.** It counts 2 Yes, but one of them ("Edge impact and recursive upward
  propagation") is marked "Yes, as a concept; no formula given". Neither row is a formula the wiki states
  correctly, so for the code's numbers the app's correct count is zero.

## 3. Wiki gaps: one merged checklist

Merged from the 87 gap items in the five reports plus the additions above, de-duplicated by the wiki page that
would carry them. Ordered: first what misleads a reader of the published site today, then pages for published
features nobody has written up, then pages for maintainers and the unpublished app. "Draft" names the
`docs/wiki/` file that already holds most of the text; publishing a draft is the cheapest fix for that item.

### Priority 1: the wiki or the front page says something false about the published site

- [ ] **Fix the site's front door** (correct root `index.html`; not a wiki page, but it is the page readers land on).
  Covers A1: replace the 5-beliefs / 261-pages count, the "says what it supports doing" claim, the inheritance
  description of ReasonRank and the market-first pitch; change the six absolute `myklob.github.io/ideastockexchange/method.html`
  links to `beliefs/method.html`; and make the build's link check cover `_site/index.html`.
- [ ] **Home: say which engine is which and where the numbers are explained** (correct Home). Draft: Home.md
  ("Where the numbers come from"). Covers: published site vs unpublished app (README.md:9-12); the engines table
  with all of them named, including the unrecorded `pipeline/` engine and the unwired `src/lib/truth-score.ts` and
  `src/lib/reason-rank.ts`; method.html and #notrun as the place every rule is computed; replace the two dead
  links and the chatgpt.com See Also links on the ReasonRank pages; fix "Impact Algorithm" linking to the
  stability page. (engine, pages, next-app, other)
- [ ] **Votes and flags never move a score** (new page "Votes Are Shown, Never Scored", linked from Home; correct
  ReasonRank, ReasonRank: PageRank, Equivalency Score, Confidence Stability Scores, Media, EVS "debated with voting",
  ECRS "collective judgment"). Covers: the two vote kinds (true / "Bears on this"), content/votes.csv latest-wins,
  counts until MIN_VOTERS 3 then a share, the Recently voted and Votes vs the analysis cards, NO_MOVE
  (intake.py:145) and test_no_vote_moves_any_score (test_render.py:2505); and the other "moves nothing"
  guarantees: fallacy flags, computed similarity, the second strength rule, a post's tag, who added a row
  (README.md:47-71). Eight live pages say the opposite. (all five)
- [ ] **Rewrite Truth Score and Quantifying Reason around the rule that runs** (correct both). Draft: Truth-Score.md.
  Covers: the row rule sign x (2 x Truth - 1) x Conf x Link x Imp x Uniq; page truth (POS + w x p0)/(POS + NEG + w)
  on 0 to 1; the neutral fixed point (unargued adds 0, an unsourced graph reads 0.50 forever); the load-bearing cap;
  a claim listed twice counts once; the labelled constants; fallacy flags as questions from nine published
  patterns with forms to argue them, and the Structural Checks panel (nine checks, none scoring); for the app, the
  three truth formulas, the 16-entry fallacy catalog, six-field fallacy claims and the 0.95/0.75/0.45/0.25 ladder,
  60% weighted consensus with quorum 3, caller credibility 0.3 to 1.4, and the ingest detector that changes no
  score. (engine, pages, next-app)
- [ ] **Split ReasonRank into reliance and strength** (correct ReasonRank and ReasonRank: Google's PageRank). Drafts:
  both ReasonRank files. Covers: the site's damped walk (0.85) from the beliefs stepping by Link x Imp x Uniq,
  reading no truth and no votes; work value = rank x (1 - confidence); Most relied on and What to argue next;
  belief score POS - NEG; the app's recursion RR = 0.15 x baseTruth + 0.85 x (0.5 + 0.5 x net/n) and its
  Pro/(Pro + Con) belief score; the founding workbook (m = 0.7) and the page/edge model as labelled references;
  drop the matrices, TF-IDF, sentiment and vote feedback as live inputs. (all five)
- [ ] **EVS: evidence sets where a page starts; the EVS sum is printed, not read** (correct EVS). Draft: EVS.md.
  Covers: p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1), weight k x 2n/(n + 1) bounded at 2k, starts 0.05 to 0.95; the
  rct/meta split, the `record` tier, no type = ESIW 0; the starting-point label on each finding; Overall EVS in
  every ledger read by nothing; the tally rule's uncapped ESIW x ERQ x ERP/100; "evidence filed above its premise"
  (open decision 2); for the app, ESIW x log2(ERQ + 1) x ECRS x ERP with tiers T0 to T4, row impact EVS x linkage x 10,
  the verification lifecycle and retraction exposure (unrecorded rows carry the largest exposure, deliberately).
  (engine, pages, next-app)
- [ ] **Linkage: an unargued link reads 1 on the site** (correct Evidence-to-Conclusion Relevance Score; fix drafts
  Linkage-Scores.md:227, :361 and Evidence-to-Conclusion-Relevance-Score.md:111 first, which still say 0.50).
  Covers: DEFLINK 1 and FACTOR_START; factor pages argued by the truth rule; the "Bears on this" vote shown only;
  for the app, (A - D)/(A + D) in [-1, 1], 0 when unargued, debate then votes then stored value, 0.5^depth
  attenuation, the diagnostic wizard, bands and non-sequitur flags, `/arguments/[id]/linkage`. (engine, pages,
  contribute, next-app, other)
- [ ] **Replace stability with the confidence the site computes** (correct Confidence Stability Scores and Home
  "Belief Stability Confidence Score"). Draft: Confidence-Stability-Scores.md, with its scrutiny and testability
  wording fixed to "a page with something argued on it". Covers: seven components (grounding 0.30, two sided
  0.20, scrutiny 0.20, breadth 0.15, depth 0.05, sourcing 0.05, testability 0.05), renormalised; bands 0.75 /
  0.45 / 0.15; confidence gates what a page passes up and never caps truth; behavioural signals reported as no
  data at weight 0; for the app, min(1, n/10) x (0.4 + 0.6 x dominance) and the protocol confidence interval.
  (engine, pages, next-app)
- [ ] **Equivalency: similarity flags, the argued page decides** (correct Equivalency Score; add to Home "Redundancy
  Reduction"). Drafts: Equivalency-Score:.md, The-Redundancy-Problem.md. Covers: lexical CES (IDF-weighted Jaccard
  plus character 4-grams), FLAG 0.45, MERGE 0.70, weight 0 until a VCA page argues it; UES as the argued
  equivalence page with no votes; the negation, reversal and antonym guard; near-duplicates count twice until a
  uniqueness page argues it; grouping.html; Similar Beliefs and Ways of Saying; for the app, the 0.4/0.6 blend,
  uniqueness against earlier same-side siblings, `/equivalence`, the posting drift guard (A10); the
  sentence-transformer code in src/core/ai is unwired. (all five)
- [ ] **Media: five yardsticks and argued work pages** (correct Media; add to Electronic Democracy). Draft: Media.md.
  Covers: media.html's Most accurate / Most important / Best made / Most entertaining / Most cited here and reader
  yardsticks, never one ranking; work pages arguing quality and influence separately; belief-page media rows shown
  and not counted; the v4 scorecard; for the app, Media Truth Score on -1 to +1 with a genre prior and epistemic
  impact; books and BAS/BAQS retired; fix "directness" in the template and the app page. (pages, next-app, other)
- [ ] **Conflict resolution: what the site prints** (correct Automated Conflict Resolution Platform). Draft: same name.
  Covers: drop the anonymization promise (every row shows its login, intake.py:20-23); Interests, Not Positions
  (Validity x Drives, mirror test, headcount and power never count); interest pages' Check table and driver pages
  (A2, A4); the four kinds of dispute and Hardest to resolve; Who has a stake; Objective Criteria (four typed labels
  read by nothing, Latest Reading blank until sourced); mark the NLP steps, IACI and IVS as not built; for the app,
  the derived conflict outputs, the interests dashboard and Resolution Floor, objective criteria (v + r + i + l)/4.
  (pages, contribute, next-app, other)
- [ ] **Costs, benefits and importance stay outside the belief score** (correct Electronic Democracy and Home "Impact
  Algorithm" / "Belief Impact Score"). Draft: Likelihood-of-Costs-and-Benefits.md. Covers: cost and benefit rows
  with their own pages, Likelihood = row truth, Exp. value, single figures flagged (open decision 3); importance =
  max over interests of Validity x Bears, and the "Interests at stake in this row" table (A3); the Belief Impact
  Score is computed nowhere; for the app, CBA likelihood pro/(pro + con) with 0.5^(d-1), impact-level
  de-duplication, sensitivity, scenarios, and the unwired applyArgumentDeduplication (open decision 4).
  (engine, pages, next-app, other)
- [ ] **Data and downloads** (new page, or fill Evidence-based policy 1.5 "open to public review"). Draft:
  Evidence-based-policy.md "Open to review". Covers: ise.json, ise.xml, schema.sql, ise_data.sql, ise.sqlite and
  its seven views; p/<key>.json fields; pages_index, claims_index, drafts, vocab, outline-spec, ise-context.jsonld,
  conformance_corpus and conformance_expected; scores never stored; the build's link check. (engine, pages, contribute)

### Priority 2: published features with no wiki page

- [ ] **A tour of the published site** (new page). Draft: the "Getting around the site" table in
  Belief-Web-Navigation.md. Covers: index, about, lists, topics, all, method, grouping, vocab, outline,
  contributors, u/<login>.html, search with its no-script fallback; the draft mark, CORE_BAR and the rule that
  every belief is published and ranked rather than gated (data/drafts.json, `--complete-only`); the footer
  provenance stamp; fix publish.py:3-8, which says drafts stay out. (engine, pages, contribute)
- [ ] **Every ranked list** (new page mirroring lists.html). Covers: Highest belief scores, Most argued over, Hardest
  to resolve (a kind leads by 0.1), Most relied on, What to argue next, Where the two rules disagree (compare.html,
  in no draft), Predictions coming due, Who has a stake, the best-works yardsticks, Votes vs the analysis, Recently
  voted, topic metrics. (engine, pages)
- [ ] **Reading a belief page, section by section** (new page: publish Template:-Belief-Analysis.md and extend it;
  state the eight rules of docs/BELIEF_PAGE_RULES.md). Covers: heading line and invitation block; Argument Trees;
  What Would Change the Answer (Move vs If settled, flip point by bisection, joint worst case of the three widest,
  depth 6 disclosed); Evidence Ledger; Falsifiability Test and Testable Predictions; Objective Criteria; Logical
  Anatomy and the cap; costs and benefits; Interests; Media; Legal; General to Specific; Similar Beliefs; Ways of
  Saying; Where This Page Is Used; Definitions; People on the Record; Related Beliefs (placed before What this
  page needs, as rendered); Not filled in yet; What this page needs; What the numbers are made of with the
  count-every-reason share; Share this argument; Structural Checks; Scoring Engine table; Cite this page; claim
  pages using the same layout. For the app: its sixteen sections, top-5 fold with nulls last, Contrast Class,
  Decision Leverage (1c), Score History. (engine, pages, next-app, other)
- [ ] **Predictions and how they turned out** (new page, or add to Truth Score under falsifiability). Covers:
  predictions.html's five groups and 90-day window, "today" as the build revision's date, an outcome filed as a
  finding on the prediction's page, came true at 0.55 or more and did not at 0.45 or less, the deadline reading.
  The word "predict" is on no live page. (engine, pages)
- [ ] **Taking part** (new page). Draft: Evidence-based-policy.md "The hub, without a server", corrected to 36
  sections and four forms. Covers: per-table and propose-a-belief forms as prefilled GitHub issues (contribute,
  belief, vote, outline), the as-you-type duplicate check and intake's re-check, Copy as text, a duplicate placed
  where the reader put it, Kind of post and Row fields, topic-cell categories, cost and benefit estimate fields,
  provenance under each row, editing an issue re-runs intake and takes back the earlier vote, typed text made inert,
  the maintainer merges once check.yml passes; who takes part (u/<login>.html, contributors.html, users.csv and
  user_links.csv, the maintainer credit, none of it scored); the authoring columns (A5) for a pull request.
  Also fix the drafts' stale details: NO_MOVE "line 90" (now 145) and "votes, not a score". (contribute, pages, other)
- [ ] **The Reason Outline** (new page, linking outline.html). Covers: + and - lines, two-space nesting, labels,
  [key] names; read whole and filed all or nothing with every stop listed; the reply in a reasons fence; loose vs
  strict; p/<key>.txt and t/<key>.txt printouts that read back to exactly their rows; outline_print.py CLI;
  data/outline-spec.json. No draft covers it. (contribute, pages)
- [ ] **What a post can be** (new page). Covers: 197 kinds in 14 families, where each files and what it can move once
  argued, the "argue about this row" link; AIF, ASPIC+, Walton schemes with 65 critical questions, schema.org; JSON-LD
  on every claim page, ise-context.jsonld, vocab.json; a tag moves nothing. No draft covers it. (contribute, pages)
- [ ] **How rows are fact-checked** (new page). Covers: "checked <date>" under a row; a correction filed as a sourced
  reason to disagree (challenge.misquoted, truth.premise-false) weighted by its source's etype, never an edit;
  batches.py, factcheck.js's three stages, verdicts.py, apply.py, judged.json (3,156 rows), calibration (Opus 26 of
  28, Sonnet 14). No draft covers it. (contribute)
- [ ] **Topic pages** (new page: publish One-Page-per-Debate-Topic.md and Template:-Topic.md). Covers: positional
  topics (three continua, assumption stack, values conflict, engagement as a section, common ground, evidence,
  criteria, media, related topics) vs directory topics (sub-topics and beliefs beneath, no continuum); the `axis`,
  `hook`, `question`, `ask` columns; cells filled from beliefs beneath or left empty; t/<key>.txt. (pages, other)
- [ ] **Templates** (new pages: publish Templates.md, the 16 Template:-*.md pages and _Sidebar.md, which
  tools/wiki_templates.py generates and CI checks). Covers fifteen templates in one push, plus check_templates.py's
  currency rules. (other, contribute)
- [ ] **Guarantees and the conformance contract** (new page for porters). Covers: the README guarantees table with
  each pinning test; the eight contract rules, five constants, eighteen tiers, 1e-9 comparison; `--check`,
  `--write`, `--print`; the published contract files; fix "sixteen tiers" in evidence.py:61 and method.py:230.
  (engine, pages)

### Priority 3: maintainers, references and the unpublished app

- [ ] **Maintaining the site** (new page). Covers: the workbook and the CSVs, sync_content.py and its overwrite hazard
  with no flag or `--help`; ise_tables.py's format (A5); build_example.py (A6); make_artifact.py (A7); pages.yml's
  gates in order and check.yml; test_gates.py (A8) and check_assertions.py; the three repository settings the
  workflows need; check_templates.py and wiki_templates.py; fix the docstring paths in integrity.py:3,
  similarity.py:3 and export_db.py:1 ("data.sql"). (contribute, engine, additions)
- [ ] **Make method.html#notrun's "wiki" citations resolve** (correct method.py and evidence.py:15-19). Cite the
  `_archive/wiki-2026-10/` files that hold three of the four rules, or publish them; find the source of the -1 to +1
  Truth Score. (engine, corrections)
- [ ] **The Next.js app** (new page, saying first that none of it is published). Covers: every page route and API
  family; Decision Leverage, `/leverage` and Evidence Grounding; agent ingestion (score fields rejected, /audit,
  batches, API keys, create-agent and ingest-batch scripts); the market layer (LMSR, epochs, settlement, oracle
  export, daily cron, forecast feed and matching (A13), the market firewall, the retired IdeaCredits generation
  the README still describes); conversations and the agent forum; battlefield and arena; wikiLaw; product reviews;
  candidate evaluation; the contrast-class denominator (docs/THE_DENOMINATOR.md); the evidence-store bridge (A11);
  spectrum coordinates (A14); the AI debate-topic generator (A15); the five firewall tests and that no CI runs
  vitest, tsc or eslint; npm scripts and the seed-corpus pins (A12); Prisma model groups; the mobile shells (four
  tabs, fake-money game), PWA and .well-known placeholders. (next-app, other, additions)
- [ ] **Reference implementations** (new page). Covers: src/lib/ise-pages and the zoning example (131 pages, 612
  edges, `npm run ise:score -- --card 1`); the workbook process with its SQL and PHP twins (PHP refuses to render on
  disagreement); the MariaDB linkage schema and the data-ise / JSON-LD layers; the `pipeline/` engine and CLI;
  tests that run only by hand. (other)
- [ ] **The AI framework and developer CLIs** (add to the app page or a new page). Covers: src/core/ai asks a model for
  importance 0 to 100 and computes embedding overlap, scores nothing published; main.py and services.py do not
  parse; its README names a missing directory; belief_analyzer.py (A15); tools/ise-dev (A9). (other, additions)
- [ ] **Contributing and setup for developers** (new page). Covers: SETUP.md quick start (fix "~64 tables", now 112
  models, and the implicit-any note), Vercel and Postgres (docs/DEPLOYMENT.md). (other)
- [ ] **Say what is retired** (add to Home or the maintainer page). Covers A16 and A17: `_archive/` and its earlier
  wiki drafts, the orphaned root `components/`, `lib/` and `generated/`, and root FEATURES.md and
  ObjectiveCriteriaScoringAlgorithm.md, which describe the archived Python backend; either mark them retired where
  they sit or move them into `_archive/`. Readers browsing the repository meet them before the wiki.

## 4. Verdict

The GitHub wiki does not explain the repository. The five reports inventory 365 features (with overlap where two
areas meet, such as votes and ReasonRank), and this review adds 17, for 382. The live wiki's 13 pages, unedited
since 2025-08-09, touch 109 of the 365: 6 rows (4 distinct features) explained correctly, 53 outdated and 50
contradicted. The other 256 are not mentioned. All six correct rows survive a spot-check, but they are definitions
(the sixteen tier weights, what ERQ and ERP mean) or motives (why pro and con media sit side by side, that scores
should recalculate). The wiki states no formula the published site runs. It names no page, list, form, export or
workflow. On the published site's central rules it says the opposite: votes, fallacy deductions and computed
similarity enter scores on eight live pages, and none does on the site. None of the 17 additions is on the live
wiki. The most visible is the site's own front page, which is stale and links six URLs that do not exist. The
`docs/wiki/` drafts are the remedy for about two thirds of this. They cover roughly 270 of the 365 features at
least in part, mostly correctly, with about eight stale details listed above. Nothing at all covers the Reason
Outline, the post vocabulary, fact-checking, contributor pages, the compare and predictions pages, or most of the
Next.js app outside the belief page. Publishing the corrected drafts would close most of Priority 1 and much of
Priority 2. Priority 2's no-draft pages and all of Priority 3 still need writing.
