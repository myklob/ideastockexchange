# Static site generator: belief pages from two tables

`ISE_Data_Entry.xlsx` is the content: a `pages` sheet (one row per page) and an `edges` sheet (one row per row of
every table on every page). Nothing typed in it is a score. Everything else here is generated from those two tables.

    python3 render_site.py ISE_Data_Entry.xlsx site/   the website (index, one page per claim, ise.css, and data/)
    python3 render_site.py content/ site/              the same site, built from the reviewable CSVs instead
    python3 sync_content.py [--check]                  rewrite content/*.csv from the workbook, or verify
    python3 export_db.py  ISE_Data_Entry.xlsx db/      schema.sql, data.sql, a loaded ise.sqlite, JSON and XML
    python3 conformance.py                             check the engine against the expected numbers
    python3 check_assertions.py                        which assertions in the suite never ran
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
    cost or benefit     = expected value = magnitude x the claim's truth, with the range magnitude_low to
                          magnitude_high carried through where one is stated; the worst case is every benefit
                          low and every cost high
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
    verdict.py           one paragraph saying what a page supports doing, assembled from its own numbers
    changes.py           what moved since the last revision, in claims and in scores
    similarity.py        which claims say the same thing in different words, so padding can be seen
    integrity.py         faults the shape of the graph shows: circularity, question-begging, a page counted twice
    method.py            the reader-facing methodology page, including what the tool cannot do
    conformance.py       the cross-implementation contract: conformance/corpus.json and conformance/expected.json
    check_assertions.py  which assertions in the suite never ran; CI fails if any of them does not
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
  there to show the non-recursive parts port in a few lines, and `test_engines.py::TestTheSqlPortIsTheSameRule`
  holds it to that by running both on the same input. It had to: the view agreed with the scorer on all 261
  rows of this corpus and disagreed the moment it was given anything the corpus does not contain, because the
  corpus exercises none of the three coercions the rule makes. A replication percentage typed as 150 came back
  as a truth starting point of 1.40, which is not a probability. A port checked only against the data that
  happens to exist is not a port, it is a coincidence.
- **Price with a range, not a point.** A cost or benefit row carries `magnitude`, and optionally `mag_low` and
  `mag_high` in the same units. A row that states one figure and no range is marked as such on the page and in
  the structural checks, because a decision cannot be checked against a point estimate: the reader cannot tell
  whether the net survives the estimate being wrong, which is usually the whole question. None of the rows in
  this corpus state a range yet, so every belief page says so.
- **Say what changed.** A published analysis gets revised, and the first question of a revision is what moved.
  Because the content is two tables kept as text in git, the previous revision is one `git show` away, and
  because the engine is a pure function of those tables the old scores can be computed again and subtracted.
  `changes.html` reports both: the rows a person edited, and which pages moved as a result. The second is the
  part an ordinary diff cannot give you, since one edit to a linkage page can move dozens of conclusions. CI
  checks out two commits so the comparison has something to compare against; with no history the page is
  omitted rather than published wrong.
- **Publish numbers two people can get the same answer for.** Nothing published carries more precision than
  the engine's own tolerance of 1e-9, and `test_render.py::TestThePublishedNumbersAreReproducible` fails the
  build if anything does. One field did: the confidence inside each page's verdict went out raw while every
  other number went through `round()`, so it published seventeen significant digits of a quantity compared to
  nine. Two honest builds of one revision, on two machines, then disagreed in the last bit on 133 of 261
  pages, which reads as the site being irreproducible and was not. With it rounded, a local build of the
  deployed revision reproduces all 261 pages of published numbers exactly, fetched from the live site and
  compared field by field.
- **Publish as data, not only as pages.** Every page writes its computed numbers beside it as
  `p/<key>.json`, indexed at `data/pages_index.json`: truth, confidence, starting point, ReasonRank, work value,
  the structural checks and the sensitivity summary. A score somebody has to scrape out of HTML is a score
  nobody checks.
- **Serve** as static HTML today. A PHP, Node or Next front end reading `page` and `edge` is a drop-in replacement
  for the renderer; it does not need permission from this toolchain, it needs to pass conformance.
- **The Excel workbook is an output, not an authority.** It is still built and its formulas still match, but it is
  no longer how the rules are checked. LibreOffice cannot be driven in a build container, so a check that depends on
  it is a check that stops running.

**The conformance suite is what makes any of that safe.** `conformance/corpus.json` is twenty-four pages and
twenty-five rows built to exercise every rule once, plus the five constants and the eighteen evidence tiers, so a
port needs nothing from this repository's source to run it; `conformance/expected.json` is what they score. Any
implementation in any language loads the first, computes, and compares against the second, and both are published beside the site at
`data/conformance_corpus.json` and `data/conformance_expected.json`, because a contract somebody has to clone a
repository to run is a contract that gets read about rather than run. `conformance.py --write`
regenerates them, so a deliberate rule change arrives as a reviewed diff and an accidental one arrives as a failing
test.

Five of those pages are there because of a failure this suite did not catch. The starting-point rule makes three
coercions, and none of them appeared in the corpus, so the SQL port of that rule passed on all 261 pages of the
live corpus and returned a truth starting point of 1.40 the first time it was handed a replication percentage of
150. A rule the conformance corpus does not exercise is a rule nothing enforces, whatever the contract says in
prose. Pages 17 to 21 exercise the three, and a test checks that each of them differs from what a port skipping
the coercion would produce, because a case that agrees either way is testing nothing.

Three more cover the branches where a rule is supposed to do nothing, which is the other way a port goes wrong:
an importance page with nothing listed under it, a load-bearing premise better established than the conclusion
it holds up (the cap is a minimum, not a replacement), and a premise stated in words that nobody has opened a
page for yet (which caps nothing, rather than capping at zero).

## Reading it

The site is proposed for public use, so it has to clear WCAG A, and it did not. Four failures, all now fixed
and all pinned by `test_render.py::TestItCanBeRead`, which checks the rendered output rather than the intent:

- No way past the breadcrumb, on all 261 pages. There is a skip link.
- Table cells whose header a screen reader had to infer from the layout. `ths()` is applied once to each
  finished page, so a column header added anywhere gets its `scope` without the author remembering.
- Links whose entire text was `0.50`. They carry an `aria-label` naming the page the number was argued on.
- The grey that marks an unargued factor was the least readable thing on the page, at 2.5:1 against white. It
  carries information, so it now clears 4.5:1 against every background it sits on, in both themes.

## Scale

Measured on a synthetic corpus of 14,480 pages and as many edges, 55 times the published one:

    corpus load, scoring, confidence and ReasonRank              4.5 s
    every page's stats                                          1.3 s
    every structural check, the duplicate sweep included        9.0 s
    sensitivity, one belief with 361 inputs                     0.4 s
    a full publish, 28,970 files, 207 MB                      107   s

Four things had to change to get there, each of them a rule rather than a tuning. Page ids ran to 10,000 and
then raised a bare `StopIteration`. Every page scanned the whole edge table to list what it reads. Every page
scanned the whole duplicate list to find its own pairs. And a what-if cleared the entire memo, so pinning one
input recomputed a belief's whole subtree; it now invalidates only the pages that read the pinned page, which
took sensitivity from 24 seconds a page to 0.4. `test_engines.py::TestItScales` pins all four as bounds on work
rather than on the clock.

Two of the cheap answers were cheap because they had stopped answering, and both are worth naming because
neither failed loudly. "Does this premise rest on its own conclusion" was a search that gave up after four
thousand steps and returned False, so on the corpus this section is about, the check silently stopped firing;
it is now a strongly-connected-component lookup, which is exact and costs nothing. And the duplicate detector
skipped any word carried by more than sixty pages, which made two pages with identical text invisible to each
other as soon as the words they shared sat on sixty-one. The rule is now the one the score already implies,
that a word is skipped only when it carries no weight in it.

That second one is why the structural checks read 9.0 s here and 1.1 s in an earlier version of this table.
The 1.1 s was fast because the detector was not looking: on this corpus, which is fifty-five near-copies of
every claim, it now examines every pair that shares an informative word, six hundred thousand of them in full,
and finds them all. The cost came back down by paying for each half of the score separately. The word half is
exact for every candidate pair straight out of the inverted index; the character half, which is a hundred
times dearer, is computed only for pairs the word half says are worth it, and from vectors built once per page
rather than once per comparison.

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

## What a green suite does not say

It says how many tests passed. It does not say how much was checked, and the difference is not academic here.
An assertion inside a loop over a collection that turns out to be empty, or in a branch this corpus never
reaches, reads in the file exactly like one that can fail and verifies nothing. `check_assertions.py` runs the
suite under a line tracer and fails the build if any assertion did not execute. CI runs it before publishing.

Two were live the first time it ran, and both were in checks written to catch real defects. The sensitivity
suite asserted that no input is ever reported as flipping a page whose range does not straddle the line; every
belief in this corpus sits on the neutral line with nothing decisive beneath it, so no row carried a flip value
and the assertion never executed. The range readout asserted that the structural check stays silent when every
priced row states a range; no row in this corpus states one. Both now run against a corpus built to reach them,
and each ends by asserting it got there.

That is the same failure as the SQL port agreeing on 261 pages and returning 1.40 on the first typed input, and
the same as the duplicate detector passing a test that it finds what a full sweep finds on a corpus where no
word sat on more than sixty pages. A check that can only pass is not a check, and the corpus you happen to have
is not a test suite.
