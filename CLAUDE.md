# CLAUDE.md

Project-level guidance for Claude Code working in this repo. Keep this short and current — if something here goes stale, fix it instead of working around it.

## Project Stack

- **TypeScript + Next.js 16** (App Router, RSC by default). React 19. Path alias `@/*` -> `./src/*`.
- **Prisma 7** with SQLite via `@prisma/adapter-better-sqlite3`. Schema lives in `prisma/schema.prisma`. Generated client lives at `src/generated/prisma/client` (run `npm run db:generate` if `@/generated/prisma/client` errors appear).
- **Tailwind v4** with PostCSS. Belief pages are constrained to `max-w-[960px]`.
- **Vitest** for unit tests under `tests/`. ESLint via `eslint-config-next` flat config.
- TypeScript is in `strict` mode. Don't introduce `any` to silence errors — fix the type or narrow with a guard.

## Verification Commands

After multi-file edits, run these before declaring work done:

```bash
npx tsc --noEmit      # typecheck — must be clean for files you touched
npx eslint <files>    # lint files you edited (`npm run lint` runs the whole repo)
npm test              # vitest, only when changing scoring / core logic
```

The global typecheck is currently clean (0 errors) — keep it that way. If `@/generated/prisma/client` import errors appear, run `npm run db:generate` first; that is a missing-artifact problem, not a code problem.

## The Belief Page Is the Crown Jewel

The single most important thing to get right in this codebase is the belief page (`/beliefs/[slug]`). It is the product. Everything else supports it.

- **Canonical rules:** `docs/BELIEF_PAGE_RULES.md`. Read this before generating, restructuring, or refactoring any belief content. The eight hard rules (no top-of-page summary, definitions go last, arguments are atomic propositions, arguments != evidence, no broken links, blank scores until real, symmetric Supporters/Opponents, every table score-ranked with top rows shown and the rest collapsed) are non-negotiable.

Rule 3 changed in the second July 2026 layout update: an argument cell is a complete, atomic proposition ("Postal infrastructure already reaches every zip code"), not a 2-6 word topic fragment ("long-term cost"). Every argument is a belief with its own page, so a cell that cannot headline a page as a claim cannot carry a truth score. The rules doc is authoritative on the current wording.
- **Canonical template:** `templates/belief-analysis-template.html`. This is the source of truth for the canonical section order. The live page is built around it.
- **Live implementation:** `src/app/beliefs/[slug]/page.tsx` plus the section components in `src/features/belief-analysis/components/*`.
- **Types:** `src/features/belief-analysis/types.ts`. New fields on Values/Interests analysis are optional so existing Prisma data still flows; populate via seed scripts as data lands.

If you change the rules doc, update the template and the page. If you change the template or page, update the rules doc. The three must stay in sync.

### Section layout notes (July 2026 template)

Falsifiability Test, Testable Predictions, and Media Resources ARE standalone sections
(reintroduced in the April 2026 redesign; the current components are
`FalsifiabilityTestSection` and `MediaResourcesSection`). Short vs Long-Term still
renders as a sub-table inside Cost-Benefit Analysis. Every per-row table carries a
nullable relationship `score`, sorts by it descending (nulls last), and shows its top
rows with the rest collapsed — see Rule 8 and `src/features/belief-analysis/lib/ranking.ts`.

Retraction exposure rides in the Evidence Ledger: `src/core/scoring/evidence-exposure.ts`
turns the verification lifecycle (`VERIFICATION_SCORES`, the single source of those weights)
into a Standing column plus a readout of how many points rest on unestablished standing.
Rows with no status are counted in full by the engine, so they carry the largest exposure —
that is deliberate, not a bug to "fix" by defaulting them to verified.

Decision Leverage (`DecisionLeverageSection`, section 1c, right after the argument trees)
ranks the belief's argument edges by the conclusion score still at stake on each one:
`src/core/scoring/decision-leverage.ts` is the pure engine,
`src/features/belief-analysis/lib/leverage.ts` the DB adapter, `/api/beliefs/[id]/leverage`
the JSON readout, `/algorithms/decision-leverage` the explainer. It reuses existing scores
(linkage, importance, uniqueness, grounding) and adds no schema — if you change the impact
formula in `scoring-engine.ts`, the transmission weight and its test pin must follow.

The legacy `FalsifiabilitySection`, `TestablePredictionsSection`, `MediaSection`, and `ImpactSection` components remain on disk because `/product-reviews/[slug]` and `/beliefs/set-aside-distractions-for-real-solutions` still import them. Don't delete them without migrating those routes.

## Scoring: which engine is which

The repo carries more than one scoring implementation. Know which one you are
touching before you change a formula.

- **`src/core/scoring/` is what the product runs.** ReasonRank propagation,
  linkage, importance, evidence (EVS), media truth, decision leverage,
  retraction exposure. The belief page, `/algorithms/*`, `/leverage` and
  `/media` all read this. **Default here for any change that affects a page.**
- **`src/lib/ise-pages/` is a proposed successor, not yet wired.** No route or
  component imports it. It is a complete, tested reference implementation of
  the page/edge model plus its worked example; treat it as a design under
  evaluation, not as the engine to build against.
- **`src/lib/conclusion-score.ts`** (with its SQL and PHP twins) preserves the
  founding workbook's original process for reference. Also unwired.

- **`tools/static-site/` is the published site and the most developed engine.**
  It builds `myklob.github.io/ideastockexchange/beliefs/` from two flat sheets. It
  is the page/edge model in production, plus four things none of the others have:
  an evidence prior, a sensitivity sweep, ReasonRank as a network walk, and a
  computed duplicate detector. Read its README before changing any of it, and see
  the note below on the one rule that matters most.

Adding a fifth is the wrong move. If the page/edge model wins, migrate
`src/core/scoring/` onto it and delete the loser; if it doesn't, delete
`src/lib/ise-pages/`. Leaving both indefinitely is the outcome that costs.

### The rule that keeps being rediscovered (`tools/static-site/`)

A row contributes `sign x (2 x Truth - 1) x Conf x Link x Imp x Uniq`. That is
deliberate: listing a claim nobody has argued is worth exactly zero, so a score
cannot be padded. It also means a page with no rows reads 0.50 and contributes
nothing, so its parent reads 0.50, and **by induction every page of an argument
graph in which nothing is cited reads exactly 0.50 forever.** Argument about
argument never touches the world.

The way out is evidence: a page declares `etype`, `erq` and `erp` on the `pages`
sheet and that sets where its truth starts (`evidence.py`). A page that declares
nothing starts at 0.50 with weight k, exactly as before.
`test_engines.py::test_argument_alone_can_never_leave_the_neutral_point` pins
this. If it ever fails, something has been added that lets a score move without
evidence, and that needs a reason, not a fix to the test.

Note that `src/core/scoring/scoring-engine.ts` does **not** share this rule. It
scores `A / (A + D)` over argument strengths, so listing an unargued reason there
does raise the score. The two engines disagree about whether volume counts, and
the disagreement is unresolved, not accidental.

### Open decisions, for the owner rather than for a session

Four things are deliberately unresolved. None is a bug; each is a call somebody has to make.

1. **The two engines disagree about volume.** `src/core/scoring/scoring-engine.ts` scores `A / (A + D)` over
   argument strengths, so listing an unargued reason there raises the score. `tools/static-site/` scores rows
   signed, so it does not. Consolidating means picking one, and the picking is the decision.
2. **Evidence is filed above the premise it bears on.** Beliefs 1 and 4 cite seven and five findings, argue to
   0.61 and 0.59, and read 0.50, because their load-bearing premises cite nothing and a conclusion cannot be
   more settled than a premise it needs. The structural checks say so on the page. Re-filing a finding under
   the premise it supports changes what the argument says, so it is an editorial act, not a refactor.
3. **Every cost and benefit is a point estimate.** `mag_low` and `mag_high` exist and are empty, and every
   belief page says so. Filling them is the owner's estimate to make, not a session's.
4. **The load-bearing cap treats "unargued" as 0.50 and lets it cap.** That is conservative and correct as
   probability, and it is what holds every belief in the corpus at 0.50. Changing it would be a rule change,
   with a conformance diff to review.

### The static site's modules

`score_reference.py` is the scorer; `evidence.py` sets where a page starts;
`confidence.py` how much a page's score counts; `sensitivity.py` which single
input would change the answer; `reasonrank.py` how much of the corpus depends on
a page; `similarity.py` which claims say the same thing; `integrity.py` the
structural faults the graph can show, and a pre-publish cycle check CI runs first;
`verdict.py` the one paragraph at the top of each page; `changes.py` what moved
since the last revision; `method.py` the reader-facing methodology page;
`sync_content.py` keeps the workbook and the reviewable CSVs in step. `conformance.py` holds the cross-implementation
contract: twenty-four pages with their expected numbers, the five constants and
the eighteen evidence tiers checked in, so a port in any language can be held to
the same rules without reading this repository's source. Eight of those pages exist
because the contract stated a rule the corpus did not exercise, and the SQL port of
that same rule passed conformance while returning a truth starting point of 1.40. A
deliberate rule change means `python3 conformance.py --write` and a reviewed diff.
CI runs the whole suite before it will publish anything.

### The page/edge model (`src/lib/ise-pages/`)

One claim per page, one row per edge, and **no stored scores** — every number
is computed on read from `page` and `edge`. A row scores Truth x Link x Imp x
Uniq, where each multiplier is itself an argued page (linkage, importance,
uniqueness) or a labelled constant when no such page exists yet.

- **Worked example:** `examples/ise-zoning/` — the zoning belief argued all the
  way down (131 pages, 612 edges), plus the SQL schema and a Python reference
  scorer. `npm run ise:score -- --card 1` prints every page and the belief
  page's scorecard.
- **Cross-implementation contract:** `tests/unit/lib/ise-pages.test.ts` pins all
  131 page scores to values transcribed from the Python reference's output. It
  catches TypeScript drift, but it does not execute the Python, so it cannot
  catch reference drift — re-run `score_reference.py` by hand and re-transcribe
  whenever a rule changes. Changing a rule means changing the engine, the
  reference and those numbers together.
- **The older process:** `src/lib/conclusion-score.ts`,
  `sql/conclusion_score_process.sql` and `examples/php-score-retrieval/` keep
  the founding workbook's process runnable (one point per listed reason,
  linkage as a ratio of counts). All three share the zoning argument tree as
  their example set; they must produce identical numbers on it.

## Conventions

- **Comments:** default to none. Only write a comment when the *why* is non-obvious. Don't restate what the code does. Don't reference task IDs or PR numbers — those rot.
- **No new top-level docs (*.md, README, etc.) unless explicitly asked.**
- **Edit before Write.** Use `Edit` for changes to existing files. `Write` only for new files or full rewrites.
- **Branch convention:** Claude-driven work goes on `claude/<short-slug>-<id>` branches. Push, but do NOT open a PR unless the user asks for one.
- **JSX entities:** the lint rule `react/no-unescaped-entities` will flag bare apostrophes/quotes inside JSX text. Use `&apos;`, `&ldquo;`, `&rdquo;`.

## Debug Logging

Claude Code does not auto-create `~/.claude/debug/<session-id>.txt`. The `/debug` skill's prompt is stale on this point. To get persistent file logs, restart the CLI with:

```bash
mkdir -p ~/.claude/debug
claude --debug-file ~/.claude/debug/session-$(date +%s).txt
```

Or set `CLAUDE_DEBUG_FILE` before launching. File logging cannot be enabled mid-session.

## Android / PWA

- `public/manifest.webmanifest` makes the web app installable on Android Chrome. Icons live at `public/icons/icon-{192,512}.png` (currently solid-color placeholders generated by `tools/generate-icons.mjs`).
- The roadmap to a Play Store listing is `docs/ANDROID.md` — TWA wrapper via Google's Bubblewrap CLI. The Android project is *not* committed; it's generated against the deployed manifest.
- `public/.well-known/assetlinks.json` is the Digital Asset Links file Android fetches to verify the TWA. The signing-key SHA-256 placeholder must be filled in after generating the keystore. If a future host strips `.well-known/`, add a rewrite.

## iOS app

- `ios/` holds a SwiftUI shell with two tabs: a `WKWebView` over the deployed site, and a native **Browse** tab that calls `/api/beliefs` and `/api/beliefs/[id]` to traverse Reasons-to-Agree / Reasons-to-Disagree with each argument's impact and linkage scores.
- The `.xcodeproj` is **not** committed; run `xcodegen` from `ios/` to materialize it from `ios/project.yml`. Same philosophy as not committing the Bubblewrap-generated Android project — pbxproj files merge-conflict constantly.
- Roadmap: `docs/IOS.md` (mirrors `docs/ANDROID.md`). PWA → WKWebView App Store wrapper → optional full SwiftUI rebuild.
- `public/.well-known/apple-app-site-association` is the Universal Links manifest. The placeholder `TEAMID` must be replaced with a real Apple Team ID before submission. Apple is strict: no `.json` extension, `Content-Type: application/json`, status 200 with no redirect.
- Native tab models only the subset of the API needed for argument traversal (`ios/Sources/Native/Models.swift`). When new fields land server-side, add them here as needed — don't try to mirror the full Prisma payload.
- iOS builds require macOS + Xcode 15.4+. The repo is editable on Linux but the build step is not. Don't try to "fix" Swift errors locally without a Mac to verify.

## Routes Worth Knowing

- `/beliefs` — index of all beliefs.
- `/beliefs/[slug]` — the canonical belief page (this is the one that matters).
- `/beliefs/set-aside-distractions-for-real-solutions` — bespoke route, predates the canonical structure. Don't use as a template.
- `/product-reviews/[slug]` — separate concept that reuses some belief components. Edits to belief sections may affect it; check before refactoring.
- `/algorithms` — index of every score explainer; subpages include `reason-rank`, `linkage-scores`, `importance-score`, `truth-scores`, `evidence-scores`, `unique-scores`, `assumptions`, `topic-overlap`, `objective-criteria`, `strong-to-weak`, `belief-equivalency`, `combine-similar-beliefs`, `fallacy-detection`, `decision-leverage`, `media-truth-score`. Belief-page components link these — if you add a link, verify the target exists or use plain text (Rule 5). Wiki-style space-URL routes (`/Linkage Scores` etc.) do NOT exist; never link them.
- `/leverage` — the work queue: every unsettled argument edge in the corpus ranked by Decision Leverage, the per-belief roll-up, the beliefs resting on one crux, and the evidence rows counted in published scores without being checked (retraction exposure). JSON twin at `/api/leverage`.
- `/media` — index of tracked media works ranked by signed epistemic impact; `/media/[id]` — a work's claim ledger and computed Media Truth Score (engine: `src/core/scoring/media-truth.ts`, canonical over prose).
- `/how-it-works` — the Engine of Reason explainer, with a live engine readout.
- `/arguments/[id]/linkage` — an edge's linkage sub-debate; `/arguments/[id]/score` — the edge's impact-provenance page (factor-by-factor derivation).
- `/contact` — contact/contribution pointers (target for all former Contact Me links).
