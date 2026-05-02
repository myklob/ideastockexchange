# ISE Linkage Pages: Three-Layer Architecture

This folder contains the SQL schema and notes that pair with the HTML template at `templates/linkage-evaluation-template.html`. Together they let a linkage page be machine-readable from day one, without requiring a database to exist yet.

## The three layers

**Layer 1: HTML scaffolding with `data-*` attributes** (`templates/linkage-evaluation-template.html`)

Every dynamic content slot in the visible HTML carries `data-ise-*` attributes that name what it is, where it comes from, and how it should be treated. A parser reading the HTML can find every score, every argument, every rephrasing without parsing prose. The attributes are invisible to humans; the page renders normally in any browser or wiki.

The conventions are documented in the header comment of the template. The most important ones:

- `data-ise-field="path.to.value"` names the canonical JSON path
- `data-ise-source="database|computed|generated"` says where the value originates
- `data-ise-audit-locked="true"` flags fields that must never be hand-edited
- `data-ise-pattern="mechanism|missing-step|..."` classifies argument rows
- `data-ise-section="section_name"` tags container elements

**Layer 2: JSON-LD block at the top of the page** (embedded in template)

A single `<script type="application/ld+json">` block at the top of every page contains the canonical machine-readable copy of every dynamic field. Anything reading the page (AI assistants, scoring engines, search indexes, migration scripts) reads this block, not the HTML below.

If the JSON block and the HTML disagree, the JSON wins. The HTML below is a render of the JSON, not the other way around.

The JSON schema is `https://ideastockexchange.org/schemas/v1` (placeholder URL; the real schema lives in this repo). Schema version is included in every page so a parser knows which version it's reading.

**Layer 3: SQL schema** (`sql/linkage_pages_schema.sql`)

The database tables that back the JSON-LD when the platform graduates from "wiki pages with embedded JSON" to "database-generated pages." Field names match the JSON paths exactly, so migration is mechanical.

The schema enforces the audit-lock principle: scores have read-only-from-application semantics, with all changes logged to `score_audit_log`. The five-step check is its own table because the check IS the audit trail.

## How they interact today

Right now, you're a human (or AI assistant) editing PBworks pages. The flow is:

1. Open the template, fill in the JSON-LD block with the canonical content
2. Manually mirror the JSON values into the HTML below (or use a small script)
3. Save the page on PBworks

A reader (human or machine) visits the page and:

- A human reads the rendered HTML
- An AI assistant or migration script reads the JSON-LD block

## How they interact tomorrow

Once the database exists, the flow becomes:

1. A user submits an edit through a form
2. The form writes to the database (subject to audit-lock, the engine recomputes scores)
3. The page renderer queries `v_linkage_page` plus the supporting tables
4. The renderer emits the HTML template with the JSON-LD block populated from the query result
5. The page is served, with the same data-attribute markup it has today

The migration is cheap because:

- Field names already match between JSON-LD and SQL columns
- The `data-*` attributes in the HTML are redundant with the JSON-LD, so the renderer doesn't need to maintain two systems
- Pages built today using the template will be readable by the future renderer because the JSON-LD block is the contract

## Why this is worth doing now, even though the database doesn't exist

Without the structured layers, every page built today is a hand-crafted HTML artifact. Migrating a thousand of them later means writing a parser that reads prose and tries to extract structure. That's a worse problem than writing the structure correctly the first time.

With the structured layers, every page built today carries its own machine-readable copy of itself. Migration is `INSERT INTO linkages SELECT ... FROM parsed_json_ld`. A thousand pages migrate in an afternoon.

The `data-*` attributes alone are also worth the cost: they let an AI assistant know what fields it's allowed to edit (anything with `data-ise-source="database"` is database-sourced and shouldn't be hand-edited from the wiki). They let a search index find scores by name. They let an automated audit script verify that every page has a five-step check filled in.

## What to do if you want to evolve the schema

1. Update the canonical methodology page on PBworks first
2. Update the JSON schema (bump `schema_version`)
3. Update the SQL schema (add columns; never rename)
4. Update the HTML template to match
5. Migrate existing pages incrementally; old pages should still validate against their original schema_version

Don't fork the schema by editing only one layer. The propagation rule from the methodology applies to the schema too.

## Related files

- `sql/linkage_pages_schema.sql` — the canonical SQL DDL for linkage pages
- `templates/linkage-evaluation-template.html` — the HTML scaffold humans see
- `templates/belief-analysis-template.html` — companion template for belief pages
- `docs/wiki/LinkageScores.md` — methodology summary mirrored into this repo
- `src/app/arguments/[id]/linkage/page.tsx` — live React implementation of the linkage debate page
- `src/core/scoring/scoring-engine.ts` — the recursive engine that computes the audit-locked scores
