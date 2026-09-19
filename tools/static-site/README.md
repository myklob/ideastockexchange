# Static site generator: belief pages from two tables

`ISE_Data_Entry.xlsx` is the content: a `pages` sheet (one row per page) and an `edges` sheet (one row per row of
every table on every page). Nothing typed in it is a score. Everything else here is generated from those two tables.

    python3 render_site.py ISE_Data_Entry.xlsx site/        the website (index, one page per claim, ise.css, data/ise.json)
    python3 export_db.py  ISE_Data_Entry.xlsx db/           schema.sql, data.sql, JSON and XML of the same two tables
    python3 build_example.py ISE_Data_Entry.xlsx            the formatted Excel workbook (needs LibreOffice for the recalc step)

`score_reference.py` is the scorer all three share. It computes every number from the tables:

    row score           = Truth x Link x Imp x Uniq
    prediction          = sign x (2 x Truth - 1) x Link x Imp x Uniq
    page truth (argued) = (POS + k x 0.5) / (POS + NEG + k), k = 1
    page truth          = min(argued, weakest load-bearing component that has its own page)
    belief score        = POS - NEG, open ended
    importance page     = max over listed interests of Validity x Bears

A multiplier with no page reads a labelled constant (UNARG 0.5, DEFLINK 1, DEFIMP 0.5, DEFUNIQ 1), and the site shows
those in grey so the reader can see which factors nobody has argued yet.

## Files

    render_site.py       the site generator; prints an internal link check (must be 0 broken) and each belief's truth
    make_artifact.py     variant of the built site with the stylesheet inlined (for hosted previews); GitHub Pages does not need it
    ise_tables.py        the two-table format: specs_to_tables / tables_to_specs, write_entry / read_entry
    score_reference.py   the scorer and normalize() (specs -> pages + edges)
    export_db.py         SQL, JSON and XML exports
    build_pages.py       the Excel belief-page renderer (also supplies the constants and wiki link map to the site)
    build_subpages.py    the Excel renderer for linkage, importance, interest, uniqueness, equivalence, driver and media pages
    build_example.py     builds the workbook, recalculates it, checks every engine cell against score_reference and exports
    requirements.txt     openpyxl

## How it publishes

`.github/workflows/pages.yml` runs `render_site.py` on every push to `master` that touches this folder or the root
`index.html`, then deploys: the root `index.html` becomes the site front page and the generated pages sit under
`beliefs/`. The repository's Pages source must be set to "GitHub Actions" (Settings, Pages, Build and deployment).

To change the content, edit `ISE_Data_Entry.xlsx` (the how-to-use sheet inside it explains the columns) and push.
To add a page, add a row to `pages` with a new key, then refer to that key from `edges`; keys are slugs, never
numbers, so nothing renumbers.
