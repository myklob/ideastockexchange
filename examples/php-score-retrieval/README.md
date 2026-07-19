# Conclusion-score retrieval: PHP + SQL demo

A runnable implementation of the original Idea Stock Exchange scoring
process — the one from the founding Excel workbook, where every conclusion
has a page with reasons to agree and disagree in separate columns and

```
score = (nAgree − nDisagree) + m · ( Σ agree childScore·LS − Σ disagree childScore·LS )
LS    = (linkAgree − linkDisagree) / (linkAgree + linkDisagree),  1 when undebated
```

Scores are retrieved from SQL two independent ways — a recursive CTE inside
the database, and PHP recursion over plain edge rows — and the pages refuse
to render if the two disagree.

## Run it

Requires PHP 8+ with `pdo_sqlite` (bundled in most distributions).

```bash
cd examples/php-score-retrieval
php -S localhost:8080
```

Open <http://localhost:8080/>. On first request a `demo.sqlite` database is
created from `schema.sqlite.sql`, seeded with two example sets:

- **church** — the belief-46 subtree from the founding workbook. At m = 1
  the scores must equal the workbook's cached values (46 → 16, 47 → 8,
  45 → 6, 48 → 2, 30/296/297 → 1); at the default m = 0.7,
  46 → 10.699, 47 → 5.57, 45 → 5.1.
- **trees** — a synthetic tree with real linkage sub-debates
  (LS = 1.0 and 0.5), scoring 2.05 at m = 0.7 and 2.5 at m = 1.

Use the `?m=` switcher on any page to change the sub-argument multiplier.

## Pages

- `index.php` — the scoreboard (the workbook's Index sheet): every
  conclusion ranked by score, plus the exact SQL used.
- `belief.php?id=46` — one conclusion's page: two-column reasons, per-edge
  linkage scores, and the full derivation with numbers substituted.

## MySQL / MariaDB instead of SQLite

Load `../../sql/conclusion_score_process.sql` into a database, then:

```bash
ISE_DB_DSN="mysql:host=localhost;dbname=ise;charset=utf8mb4" \
ISE_DB_USER=you ISE_DB_PASS=secret php -S localhost:8080
```

The queries are dialect-portable; only the schema files differ.

## The same process, elsewhere

- `src/lib/conclusion-score.ts` — the TypeScript engine (unit-tested in
  `tests/unit/lib/conclusion-score.test.ts`).
- `sql/conclusion_score_process.sql` — the MySQL/MariaDB schema + views.
- `docs/conclusion-score-calculations.xlsx` — the workbook showing every
  calculation with live formulas.

All implementations are verified against the same example numbers.
