# Session handoff

Written 2026-11-14 at the end of the session on branch `claude/beautiful-volta-kpxvpw`. Replace this file at the end of
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
- The full static-site suite was run in parallel. The result is in the PR.
- `check_assertions.py` was run. The result is in the PR.
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

Hardcoded depth limits are the one exception (see Blockers).

## Partial, mocked or placeholder

- **1,166 rows on 49 newer beliefs have no verdict.** By section: 431 argument, 233 cba, 166 prediction, 148 evidence, 119
  media and 69 person. `python3 tools/static-site/factcheck/batches.py OUTDIR` cuts them.
- **The `fact-checker` agent type is unmeasured** (`.claude/agents/fact-checker.md`). A session loads agent types only
  when it starts, so it was never used. Its expected saving is a starting context near 38,000 tokens instead of 80,000.
- **Seven topics with beliefs beneath them have no cell rows of their own:** `us-economy`, `crypto`, `ai-progress`,
  `colorado`, `climate-outcomes`, `world-conflicts` and `tech-giants`. Their pages fill from the beliefs beneath, as
  designed, so this is a data gap, not a bug.
- **The November 3, 2026 midterms have been held.** `democrats-will-win-majority` and `republicans-will-keep-majority`
  still read as open forecasts, with no result filed as evidence.
- **Every cost and benefit is a point estimate.** `mag_low` and `mag_high` are empty (open decision 3 in `CLAUDE.md`).
- **No score in the content tables is a placeholder.** The content holds none: every printed number comes from
  `score_reference.py` at build. The Next.js app's Prisma seed data was not audited this session.

## Known bugs, data gaps and blockers

- **`MAX_CHAIN = 100` conflicts with "no hardcoded depth limits"** (`tools/static-site/outline_file.py:266`, error
  `E-TOO-DEEP`). It exists because `score_reference.py` walks a chain of pages one recursive call per page (`truth`,
  `evaluate` and `_contrib` from line 145), and a chain of about 200 exceeds Python's recursion limit. The guard is the
  symptom. The recursive scorer is the cause.
- **The branch is not merged, so none of this is live.** `pages.yml` publishes only on a push to `master` that touches
  `tools/static-site/**`. The branch carries 39 commits since `master` was last merged, on 2026-10-10.
- **Three docs named in the wrap-up checklist do not exist:** `REASONRANK_EQUATIONS.md`, `ISE_scores_inventory.md` and
  `CONFLICT_RESOLUTION_SCORING.md`. Scoring is documented in `tools/static-site/README.md`, `CLAUDE.md` and
  `tools/static-site/conformance.py`, and those match the code. The three were not created, because `CLAUDE.md` forbids
  new top-level docs unless asked.
- **The six open decisions in `CLAUDE.md` are unchanged.**

## Next tasks

1. **Make the scorer iterative and remove the depth guard.**
   - In `tools/static-site/score_reference.py`, replace the recursion through `truth`, `evaluate`, `pg` and `_contrib` with
     an explicit work stack: post-order over pages, memoized by page id, keeping the existing cycle refusal.
   - Delete `MAX_CHAIN`, the `E-TOO-DEEP` stop and the recursion-limit raise in `outline_file.py` (lines 144 to 146, 230,
     266, 1608 to 1620 and 1690 to 1694), and their tests.
   - Add a test that builds a 500-page chain and scores it without touching `sys.setrecursionlimit`.
   - Acceptance: `conformance.py` shows no diff, and `test_engines.py` and `test_outline_file.py` pass.
   - Port the same change to `src/lib/ise-pages/` only if it recurses the same way.
2. **Measure the small agent type.**
   - In a session started after `.claude/agents/fact-checker.md` existed, run `tools/static-site/factcheck/factcheck.js`
     with `{dir: <absolute path of factcheck/calibration>, today, checks: [12, 25, 26, 48, 53, 66, 70, 88, 110, 145],
     only: 'check', agentType: 'fact-checker'}` on Opus.
   - Score it with `python3 tools/static-site/factcheck/calibrate.py <run transcript dir>`.
   - Adopt it as the default if it catches at least 26 of 28 and its starting context is under 50,000. Record the
     result in the header of `factcheck.js`.
3. **File the midterm results, then re-check the 1,166 rows.**
   - Add the certified House and Senate results as evidence rows (etype `record`, source the official state or
     Clerk of the House tallies) under the two forecast beliefs.
   - Then run the three-stage check on the unjudged rows in waves of 10 batches, harvesting with `verdicts.py` after each
     wave and filing with `apply.py`.
   - Then run `sync_content.py --to-workbook` and `--check`.
