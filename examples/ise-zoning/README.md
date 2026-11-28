# The zoning example: one belief worked all the way down

One belief, "Ending single-family-only zoning lowers housing costs in the
cities that do it," argued to the bottom: 131 pages and 612 rows, with no score
typed anywhere. Every number on every page is computed from the rows you can
see, and every row's multipliers are read from pages that argue them.

This directory is the data. The engine that reads it is `src/lib/ise-pages/`,
and `tests/unit/lib/ise-pages.test.ts` pins all 131 page scores.

## Files

| File | What it is |
| --- | --- |
| `ise-zoning.json` | The example as `{constants, pages, edges}`. This is what the engine and the tests read. |
| `zoning-data.sql` | The same data as INSERT statements: 5 constants, 131 pages, 612 edges. Load `schema.sql` first. |
| `schema.sql` | Three tables (`constant`, `page`, `edge`) and one view (`page_uses`). PostgreSQL syntax; the comments say what changes for MySQL. |
| `score_reference.py` | The scoring rules in about 60 lines of Python. `python3 score_reference.py ise-zoning.json` prints every page's truth and belief score. |

## The model

One claim, one page. A row on any page is a link to the page that argues it,
and every number in the row is read from a page:

```
row score   = Truth x Link x Imp x Uniq
prediction  = sign x (2 x Truth - 1) x Link x Imp x Uniq
page truth  = (POS + k x 0.5) / (POS + NEG + k), capped by the weakest
              load-bearing component that has its own page
belief score= POS - NEG, open-ended
```

- **Truth** is the row's own page.
- **Link** is a linkage page whose question writes itself from the two pages it
  connects: *If it were true that: "[reason]", it would significantly
  strengthen the conclusion that: "[belief]"*. Its reasons are about relevance
  only, never about whether either end is true.
- **Imp** is an importance page: the largest Validity x Bears over the
  interests the row speaks to, where validity is argued on each interest's own
  page ("[who] need [what]").
- **Uniq** is a uniqueness page: does this reason make a different point from
  that one?

A multiplier with no page yet reads a labelled constant, and the scorecard
counts how many rows still rest on each. Nothing about who wrote a row enters
any formula, and a fallacy accusation is just a reason on a linkage page.

| Constant | Value | What it means |
| --- | --- | --- |
| `K` | 1 | The weight of the neutral start, so an unargued page reads 0.5. |
| `UNARG` | 0.5 | Truth of a row with no page yet: a coin flip. |
| `DEFLINK` | 1 | A reason is presumed relevant until a linkage page argues otherwise. |
| `DEFIMP` | 0.5 | Importance opens neutral, neither trivial nor decisive. |
| `DEFUNIQ` | 1 | A reason is presumed distinct until a uniqueness page shows the overlap. |

## Reading it

```bash
# every page's truth and belief score, and the belief page's scorecard
npm run ise:score -- --card 1

# the same numbers from the Python reference
python3 examples/ise-zoning/score_reference.py examples/ise-zoning/ise-zoning.json
```

In this example the belief page argues to a truth score of 0.58 and is then
capped at 0.50 by a load-bearing component whose own page is thin: a
conjunction cannot be more probable than its least probable necessary part.

## Adding a page

Insert a `page` row (its kind, and either `text` or the two page ids the
question is built from), then insert an `edge` on the parent page pointing at
it with `claim_id`, or with `link_id` / `imp_id` / `uniq_id` when the new page
is a multiplier. That is the whole write path. No score is written, because no
score is stored.

## How the rest of the repo relates

- `src/lib/ise-pages/` — the engine: `score.ts` computes every page,
  `scorecard.ts` the bottom-of-page readout, `questions.ts` the sentence a
  formula-built page asks.
- `src/lib/conclusion-score.ts` and `examples/php-score-retrieval/` — the
  original process this grew out of, where a reason was worth one point and
  linkage was a ratio of counts. Same zoning belief, older rules.
