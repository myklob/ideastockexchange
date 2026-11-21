# Session handoff

Written 2026-11-14 and updated 2026-11-15 at the end of the session on branch `claude/beautiful-volta-kpxvpw`. Replace this file at the end of
each session rather than appending to it.

## Shipped and verified

The fact re-check of every older published row is done. 3,156 rows have a verdict in
`tools/static-site/factcheck/judged.json`: 1,449 opinion, 1,419 ok, 133 wrong, 104 unverifiable and 51 disputed. Each ok row
now carries the source it was checked against and a `checked:` date. Each of the 133 corrections is filed as a sourced
reason to disagree under the row it answers, tagged `challenge.misquoted` or `truth.premise-false`, with an evidence type
read from the source's host. No published word was edited. A further 51 proposed corrections failed the refute check and
were not filed.

The re-check tooling lives in the repo as `tools/static-site/factcheck/`:

- `batches.py` cuts the rows not yet judged.
- `factcheck.js` is the Workflow script. It runs one adversarial check, a primary-source second look and a refute check.
- `verdicts.py` rebuilds every verdict from the run journals.
- `apply.py` files the verdicts.
- `calibrate.py` scores a check-only run against `calibration/`, which holds 209 rows with 28 known corrections.
- `test_factcheck.py` covers batch selection, every verdict path, filing and the ledger.

The calibration settled the model question. Fact-checking stays on Opus. Sonnet caught 14 of 28 corrections at about a
seventh of the cost. The November adversarial pass on Opus caught 26 of 28, and the confirming pass beside it found the
other 2 at the same cost again.

Verified on this commit:

- `sync_content.py --check`, `integrity.py`, `tools/check_templates.py`, `conformance.py` and the build all pass, with 0
  broken links.
- The full static-site suite passes: 805 tests in 20 modules, run four at a time.
- `check_assertions.py` over the whole suite first found 4 of 2,527 assertions that never ran, all in `test_render.py`
  (see Blockers). After the fix, a traced run of `test_render.py` alone runs all 648 of its assertions. The full audit
  takes about 80 minutes and was not repeated end to end. `pages.yml` runs it again before it publishes.
- `npx tsc --noEmit` and ESLint were not rerun. No TypeScript changed on this branch, and ESLint ignores `tools/**`.

Engine invariants, checked against the code:

- **No scorer reads author identity.** Neither `added_by` nor `users.csv` feeds a score.
- **A fallacy flag is a question argued on the page.** It moves no score (`fallacy.py`).
- **No tanh bounding.** There is no `tanh` in `tools/static-site` or `src/core/scoring`.
- **No credit is cut automatically.** A correction is a reason to disagree, argued like any other.
- **No market price or vote feeds ReasonRank or a truth score.**
- **Every score is computed at build from `page` and `edge`.** None is stored in content.
- **The validity and feasibility firewall holds.** Truth scores and the cost-benefit tables stay separate.
- **The passion and evidence firewall holds.** Votes are shown beside the score, never in it.

- **No hardcoded depth limit.** As of 2026-11-15 the scorer scores a chain of pages of any length (see below).

The scorer no longer limits depth. `Model.evaluate` in `score_reference.py` scores everything a page reads before the
page itself, deepest first, with an explicit stack (`_warm`). So a page finds its inputs already scored and recurses
one call. Only the order changes: `conformance.py` conforms, and a loop is still refused by name. A chain of 2,500
pages builds the whole site under the default recursion limit. `MAX_CHAIN`, `E-TOO-DEEP` and the filer's chain check
are gone. `test_engines.py::test_a_chain_of_any_length_is_scored_without_the_stack` scores 3,000 pages against a
page-by-page pass, and it fails without the change. The filer still raises the recursion limit for its own walk of a
post, sized to the post's depth. That is not a ceiling, so it stays.

The 2026 election calls are filed as findings on the forecast pages they settle, typed `news` and checked 2026-11-15:

- The AP story republished by the Inquirer, updated November 4, says Democrats won control of the House. It is
  filed for "AP will project Democrats have won at least 218 House seats" and against its Republican twin.
- Al Jazeera, citing AP projections, says Democrats regained the Senate with at least 54 seats. It is filed for
  "Democrats and the independents who caucus with them hold at least 51 Senate seats".
- The AP's own site refuses automated reading, so these are the best sources reachable.

## Partial, mocked or placeholder

- **1,166 rows on 49 newer beliefs have no verdict.** By section: 431 argument, 233 cba, 166 prediction, 148 evidence, 119
  media and 69 person. `python3 tools/static-site/factcheck/batches.py OUTDIR` cuts them.
- **The `fact-checker` agent type is unmeasured** (`.claude/agents/fact-checker.md`). A session loads agent types only
  when it starts, so it was never used. Its expected saving is a starting context near 38,000 tokens instead of 80,000.
- **Seven topics with beliefs beneath them have no cell rows of their own:** `us-economy`, `crypto`, `ai-progress`,
  `colorado`, `climate-outcomes`, `world-conflicts` and `tech-giants`. Their pages fill from the beliefs beneath, as
  designed, so this is a data gap, not a bug.
- **An election that has happened barely moves its forecast. The cause is attenuation, not the load-bearing cap.**
  - Each filed call lifts its prediction page from 0.50 to 0.507, short of the tracker's 0.55 "came true" line, so all
    three read "recorded, still unclear".
  - On the prediction page, the finding contributes (2 x 0.65 - 1) x 0.10 x 1 x 0.50 x 1 = 0.015. Its `news` type
    starts it at 0.65, a one-row page has confidence 0.10, and an unargued importance reads 0.50.
  - The prediction then passes (2 x 0.507 - 1) x 0.18 x 0.50 = 0.0013 to the belief, so the same attenuation applies
    twice.
  - `democrats-will-win-majority`: the pre-election polls and models filed on both sides still count at full weight and
    roughly cancel, at 0.503 argued. Three load-bearing premises at 0.50 then cap it at 0.500. The cap costs 0.003.
  - `republicans-will-keep-majority` moves from 0.4519 to 0.4515.
  - In my view the open question for the owner is whether a recorded outcome should screen off the evidence that only
    predicted it. Once the result is known, a poll says nothing more about who won. The engine has no such rule. Per
    the owner's direction it would be published beside the current rule and compared, not swapped in.
  - Certified results, typed `record`, arrive as states certify through December.
- **Every cost and benefit is a point estimate.** `mag_low` and `mag_high` are empty (open decision 3 in `CLAUDE.md`).
- **No score in the content tables is a placeholder.** The content holds none: every printed number comes from
  `score_reference.py` at build. The Next.js app's Prisma seed data was not audited this session.

## Known bugs, data gaps and blockers

- **The live site has not been updated since 2026-10-04.** The last successful `Publish site` run was run 74, for PR
  #239. Every run since, for PRs #240 to #251, failed or was cancelled. The latest failure, run 86, was
  `check_assertions.py`, with five assertions in `test_render.py` that never ran. One was fixed earlier on this branch.
  Three never ran because the markup gained `scope="col"` on header cells and an `id` on folded tables, while the tests
  still looked for the bare tags. The fourth checks a build that holds no belief down, which the live tables never are.
  This branch fixes all five. The same stale patterns also left two assertions that ran unable to fail, and two table
  finders skipping every folded table. Those are fixed too. With its pattern fixed, the tied-ranks test found a real fault:
  two books printing +0.05 were ranked 6 and 7. The works lists now rank on the printed value, and no score moves.
  Merging this branch is what republishes the site.
- **The branch is not merged.** `pages.yml` publishes only on a push to `master` that touches `tools/static-site/**`.
  The branch carries 45 commits since `master` was last merged, on 2026-10-10.
- **Three docs named in the wrap-up checklist do not exist:** `REASONRANK_EQUATIONS.md`, `ISE_scores_inventory.md` and
  `CONFLICT_RESOLUTION_SCORING.md`. Scoring is documented in `tools/static-site/README.md`, `CLAUDE.md` and
  `tools/static-site/conformance.py`, and those match the code. The three were not created, because `CLAUDE.md` forbids
  new top-level docs unless asked.
- **The six open decisions in `CLAUDE.md` are unchanged.**

## Next tasks

1. **Measure the small agent type. This is a Workflow run of ten Opus agents, so ask the owner first.**
   - In a session started after `.claude/agents/fact-checker.md` existed, run `tools/static-site/factcheck/factcheck.js`
     with `{dir: <absolute path of factcheck/calibration>, today, checks: [12, 25, 26, 48, 53, 66, 70, 88, 110, 145],
     only: 'check', agentType: 'fact-checker'}` on Opus.
   - Score it with `python3 tools/static-site/factcheck/calibrate.py <run transcript dir>`.
   - Adopt it as the default if it catches at least 26 of 28 and its starting context is under 50,000. Record the
     result in the header of `factcheck.js`.
2. **File the certified results as states certify them (December 2026).**
   - Add each chamber's certified result as a finding (etype `record`, the state or Clerk of the House tallies) on the
     prediction pages that name certification, beside the `news` rows filed on 2026-11-15:
     - `democrats-independents-who-caucus`;
     - `republicans-win-least-four`;
     - `democrats-win-least-two`.
   - Then run `sync_content.py --to-workbook` and `--check`.
3. **Re-check the 1,166 unjudged rows. This is the expensive one, so ask the owner first.**
   - Run the three-stage check in waves of 10 batches.
   - Harvest with `verdicts.py` after each wave, file with `apply.py`, then sync.
