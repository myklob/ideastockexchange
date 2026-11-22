# Issues Roadmap

This document tracks TODO items that should be converted to GitHub Issues for proper task management.

## How to Convert to GitHub Issues

Once you have GitHub CLI configured, run:

```bash
./scripts/create-issues.sh
```

Or manually create issues using the GitHub web interface.

---

## Active TODOs

Re-checked against the code on 2026-11-22. Items 2 and 3 of the earlier list are done or superseded and are under
Completed TODOs, so `scripts/create-issues.sh` no longer files them.

### Core Implementation

#### 1. HTML Parsing for Topic Updates
- **Location**: `src/core/ai/generator.py:165-178`
- **Priority**: Low
- **Status**: Not done. The code is unwired: nothing outside `src/core/ai/` imports `generator.py`, and the published site
  updates pages from `content/*.csv` through `intake.py`, never by re-parsing HTML. Its fate goes with CLAUDE.md open
  decision 5 (restore or delete `src/core/ai/`). If it is kept, store each topic's input as JSON beside the HTML and
  merge on update rather than parsing HTML.
- **Labels**: `enhancement`, `core`

### Fallacy flags

#### 2. Carry a fallacy accusation to near-duplicate claims
- **Location**: `tools/static-site/fallacy.py`, `tools/static-site/similarity.py`; app: `src/lib/fallacy/claims.ts`
- **Priority**: Medium
- **Status**: Not done (GitHub issue #8, step 4). An accusation is filed on one row's linkage page and argued there;
  nothing shows it on claims `similarity.py` finds to say the same thing. Add it to the flagged claim's "Possible
  fallacy" table as a question that moves no score, the same rule every other flag follows. The app's explainer
  used to say a confirmed fallacy stays confirmed for the whole cluster; it now says what the code does.
- **Labels**: `enhancement`, `fallacy`

### Contributions

#### 3. Issue #252 needs a page
- **Status**: Owner decision. The issue arrived labelled `contribution` with the claim text and none of the form's
  fields, so intake could not tell which belief it belongs to (Intake run 43607873198 failed with "the submitted
  text is empty"). Name the belief page, then edit the issue into the form or file the row by hand. Intake now
  replies on any issue it cannot read (`intake.py` `tell_the_sender`, pinned by
  `test_intake.TestTheCommandLine.test_a_post_it_cannot_read_is_answered_on_the_issue`), so this no longer fails
  silently.

### Issue #8 can be closed

Every step of GitHub issue #8 ("Truth Score", 2023) except step 4 (item 2 above) is done or replaced: a phrase list
of fallacies (`fallacy.py`, 44 named kinds in `vocab.py`), accusations filed as rows (`vocab.py` `fallacy` family,
`intake.py` Row field), a place to argue each one (`render_site.py` "Possible fallacy" table), and the argued
accusation's own truth score in place of a five-band Logical Fallacy Score. The evidence half is `evidence.py`'s
eighteen tiers and prior.

---

## Issue Creation Script

`scripts/create-issues.sh` files item 1 only.

---

## Completed TODOs

- **Evidence-based sub-argument scoring** (was item 2). Done: `tools/static-site/score_reference.py` (one
  contribution formula for reasons, evidence and predictions, recursion through `evaluate`), `evidence.py` (tiers
  and the evidence prior); app: `src/core/scoring/scoring-engine.ts`. A fallacy penalty is refused by design on the
  published site: a flag moves no score (owner direction, October 2026; `fallacy.py`).
- **ML fallacy detection** (was item 3). Replaced: the published site flags possible fallacies by a published phrase
  list, deliberately not a model, so a flag can say why it fired (`fallacy.py`), and the flag is argued like any
  other claim. The app's ingest path uses six regexes (`src/lib/agent-ingest/fallacy-detector.ts`). Nothing returns
  an empty placeholder any more.
