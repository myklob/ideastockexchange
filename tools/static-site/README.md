# Static site generator: belief pages from two tables

`ISE_Data_Entry.xlsx` is the content: a `pages` sheet (one row per page) and an `edges` sheet (one row per row of
every table on every page). Nothing typed in it is a score. Everything else here is generated from those two tables.

    python3 render_site.py ISE_Data_Entry.xlsx site/   the website (index, one page per claim, ise.css, and data/)
    python3 render_site.py content/ site/              the same site, built from the reviewable CSVs instead
    python3 sync_content.py [--check]                  rewrite content/*.csv from the workbook, or verify
    python3 export_db.py  ISE_Data_Entry.xlsx db/      schema.sql, data.sql, a loaded ise.sqlite, JSON and XML
    python3 conformance.py                             check the engine against the expected numbers
    python3 -m unittest discover -p 'test_*.py'        the whole suite; CI runs this before it publishes anything
    python3 build_example.py ISE_Data_Entry.xlsx       the formatted Excel workbook (LibreOffice for the recalc step)

## The rules

`score_reference.py` is the scorer of record. It computes every number from the two tables:

    row contribution    = sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq
                          signed, so a claim argued false counts against the side it was filed on and a
                          claim nobody has argued contributes exactly 0
    page start          = p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1),  w = k x 2 x ERQ / (ERQ + 1)
    page truth (argued) = (POS + w x p0) / (POS + NEG + w), k = 1
    page truth          = min(argued, weakest load-bearing component that has its own page)
    belief score        = POS - NEG, open ended, where POS and NEG are the positive and negative
                          contributions as magnitudes (a row lands on the side its sign puts it on)
    importance page     = max over listed interests of Validity x Bears

A multiplier with no page reads a labelled constant (UNARG 0.5, DEFLINK 1, DEFIMP 0.5, DEFUNIQ 1), and the site shows
those in grey so the reader can see which factors nobody has argued yet.

**The starting point is load-bearing, not decoration.** A row contributes `(2 x Truth - 1)`, so a page with no rows
reads 0.50 and contributes nothing, so every page above it also reads 0.50, and by induction every page of any
unsourced argument graph reads exactly 0.50 forever. Argument about argument never touches the world. What touches
the world is evidence, so a page may declare what it rests on (`etype`, `erq`, `erp`) and that sets where its truth
starts. A page that declares nothing starts at 0.50 with weight k, which is the rule as it always was.
`test_engines.py` pins the fixed point, so anything that later lets a score move without evidence has to say why.

## Files

    render_site.py       the site generator; prints an internal link check (must be 0 broken) and each belief's truth
    score_reference.py   the scorer and normalize() (specs -> pages + edges)
    evidence.py          the evidence tiers, and where a claim's truth starts because of what it cites
    confidence.py        how much of the work behind a page has been done, and how much its score therefore counts
    sensitivity.py       which single input, moved, would change the answer, and what it would be worth to settle it
    reasonrank.py        the damped walk from the beliefs: how much of the corpus depends on each page
    similarity.py        which claims say the same thing in different words, so padding can be seen
    integrity.py         faults the shape of the graph shows: circularity, question-begging, a page counted twice
    method.py            the reader-facing methodology page, including what the tool cannot do
    conformance.py       the cross-implementation contract: conformance/corpus.json and conformance/expected.json
    sync_content.py      keeps ISE_Data_Entry.xlsx and content/*.csv in step; --check runs in CI
    ise_tables.py        the two-table format: specs_to_tables / tables_to_specs, and both read surfaces
    export_db.py         SQL schema and data, a loaded SQLite database, JSON and XML, plus the analyst views
    build_pages.py       the Excel belief-page renderer (also supplies the constants and wiki link map to the site)
    build_subpages.py    the Excel renderer for linkage, importance, interest, uniqueness, equivalence, driver, media
    build_example.py     builds the workbook, recalculates it and checks every engine cell against score_reference
    test_scoring.py      the scoring rules, the confidence rules and the workbook formula strings
    test_engines.py      evidence, sensitivity, ReasonRank and the conformance fixture
    test_similarity.py   the duplicate detector: that it finds duplicates and that it does not cry wolf
    test_integrity.py    each structural check, with a case built to trip it and a case built not to
    test_render.py       the rendered HTML: tiles against the engine table, links, and prose that has rotted
    test_content.py      that the workbook and the reviewable CSVs cannot drift apart
    make_artifact.py     variant of the built site with the stylesheet inlined (for hosted previews)
    requirements.txt     openpyxl

## Where each thing belongs

One question keeps coming back: should the rules live in a spreadsheet, in SQL, in PHP, or in code? They have lived
in all four here, and four implementations of a rule is four chances to be wrong in private. The split now is:

- **Author** in the two flat sheets. They are a boring, wide CSV that happens to live in `.xlsx` for the dropdowns
  and the column comments. No formulas, no formatting to maintain, keys instead of numbers so nothing renumbers.
- **Review** in `content/pages.csv` and `content/edges.csv`, the same two tables as text. A spreadsheet is a good
  place to type a hundred claims and a bad place to review one: a change to a belief shows up in git as
  `Bin 98313 -> 98414 bytes`, which is not a record of anything. The CSVs diff line by line, so
  `git log -p content/pages.csv` is the history of the claims themselves. Either surface builds the site, and CI
  fails if they disagree. Neither is the master; `sync_content.py` writes in both directions.
- **Compute** in Python, in `score_reference.py` and the four engines beside it. The recursive part has to live in
  code: a page's truth is a ratio over its children and then a minimum over them, which no recursive query can
  aggregate its way to, and a spreadsheet can only do it by carrying one sheet per page.
- **Store and query** in SQL. `export_db.py` emits the schema, the data, and a loaded `ise.sqlite` with the views an
  analyst actually opens a database for: `page_start`, `page_coverage`, `page_one_sided`, `page_inert`,
  `evidence_ledger`, `page_orphan`, `page_uses`. `page_start` is the starting-point rule written in SQL, which is
  there to show the non-recursive parts port in a few lines.
- **Publish as data, not only as pages.** Every page writes its computed numbers beside it as
  `p/<key>.json`, indexed at `data/pages_index.json`: truth, confidence, starting point, ReasonRank, work value,
  the structural checks and the sensitivity summary. A score somebody has to scrape out of HTML is a score
  nobody checks.
- **Serve** as static HTML today. A PHP, Node or Next front end reading `page` and `edge` is a drop-in replacement
  for the renderer; it does not need permission from this toolchain, it needs to pass conformance.
- **The Excel workbook is an output, not an authority.** It is still built and its formulas still match, but it is
  no longer how the rules are checked. LibreOffice cannot be driven in a build container, so a check that depends on
  it is a check that stops running.

**The conformance suite is what makes any of that safe.** `conformance/corpus.json` is sixteen pages and twenty-two
rows built to exercise every rule once; `conformance/expected.json` is what they score. Any implementation in any
language loads the first, computes, and compares against the second. `conformance.py --write` regenerates them, so a
deliberate rule change arrives as a reviewed diff and an accidental one arrives as a failing test.

## How it publishes

`.github/workflows/pages.yml` runs the test suite and then `render_site.py` on every push to `master` that touches
this folder or the root `index.html`, then deploys: the root `index.html` becomes the site front page and the
generated pages sit under `beliefs/`. The repository's Pages source must be set to "GitHub Actions" (Settings, Pages,
Build and deployment).

To change the content, edit `ISE_Data_Entry.xlsx` (the how-to-use sheet inside it explains the columns), run
`python3 sync_content.py`, and push both. Or edit `content/*.csv` directly and run `sync_content.py --to-workbook`.
To add a page, add a row to `pages` with a new key, then refer to that key from `edges`; keys are slugs, never
numbers, so nothing renumbers. To ground a claim in evidence, fill its `etype` on the `pages` sheet, and `erq` and
`erp` when replications are known.
