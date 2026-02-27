# ise-dev — Idea Stock Exchange Developer CLI

A zero-dependency Node.js CLI toolkit for working with the Idea Stock Exchange codebase.
Test Belief Equivalency Scores, scan belief lists for near-duplicates, seed the database,
and manage the development server — all from the terminal.

---

## Install

```bash
# From the repository root:
cd tools/ise-dev
npm link

# ise-dev is now available globally:
ise-dev help
```

To uninstall:

```bash
npm unlink -g ise-dev
```

---

## Commands

### `ise-dev score <beliefA> <beliefB>`

Compute the Belief Equivalency Score between two statements using Layer 1 mechanical
analysis (synonym canonicalization + Jaccard token overlap).

```
$ ise-dev score "We should reduce carbon emissions." "We should lower carbon emissions."

  Belief Equivalency Score
  ─────────────────────────────────────────────────

  Belief A: We should reduce carbon emissions.
  Belief B: We should lower carbon emissions.

  Score    ██████████████████████████████  100.0%
  Mech.    ██████████████████████████████  100.0%

  Relationship: identical

  Action: Merge into one canonical page. Route all variants here.
```

**Score bands:**

| Score | Relationship | Action |
|-------|-------------|--------|
| ≥ 90% | identical | Merge into one canonical page |
| 70–89% | near-identical | Link pages; cross-reference argument trees |
| 45–69% | overlapping | Show on spectrum as stronger/weaker variants |
| 20–44% | related | Separate pages; show as related |
| < 20% | distinct | Separate pages; no connection |

> **Note:** The CLI implements Layer 1 (mechanical similarity). The website also
> uses Layer 2 (semantic embeddings via the Python backend), which brings
> paraphrases like "ban assault weapons" / "prohibit military-style rifles" from
> ~17% mechanical to ~85% combined. Use `ise-dev api-check` to test the full
> blended score when the server is running.

---

### `ise-dev analyze <file>`

Scan a newline-delimited list of belief statements and report all pairs above the 45%
threshold. Useful for auditing a seed data file before importing.

```bash
ise-dev analyze sample-beliefs.txt
ise-dev analyze beliefs.csv   # one belief per line
```

Lines beginning with `#` are treated as comments and ignored.

---

### `ise-dev seed`

Push the Prisma schema to the local SQLite database and run the seed file if one exists.

```bash
ise-dev seed
```

Equivalent to:
```bash
npx prisma db push --skip-generate
npx prisma db seed
```

---

### `ise-dev dev`

Start the Next.js development server (`npm run dev`) from the repository root.

```bash
ise-dev dev
# Then open http://localhost:3000
```

---

### `ise-dev api-check [baseUrl]`

Verify that the belief equivalency API endpoint is reachable and returns correct responses.

```bash
ise-dev api-check                         # checks http://localhost:3000
ise-dev api-check https://your-site.com  # checks a deployed instance
```

---

## How Belief Equivalency Scoring Works

The algorithm runs in up to three layers:

**Layer 1 — Mechanical Similarity (implemented in this CLI)**

Each belief is reduced to a canonical token set:
1. Lowercase and strip punctuation
2. Tokenize on whitespace
3. Remove stopwords (common words with no logical content)
4. Resolve `not X` → antonym of X where possible
5. Canonicalize synonyms (e.g. `prohibit → ban`, `lower → decrease`)
6. Sort tokens (word-order invariant)

Similarity is computed as Jaccard coefficient: `|A ∩ B| / |A ∪ B|`.

**Layer 2 — Semantic Similarity (server-side)**

Cosine distance of sentence embeddings from the Python backend. Catches paraphrases
that mechanical similarity misses. Blended as: `score = 0.4 × L1 + 0.6 × L2`.

**Layer 3 — Community Verification (future)**

Sub-debates where users argue whether a proposed equivalency is valid. The community
score overrides algorithmic scores when available.

---

## API Reference

The website exposes `POST /api/beliefs/equivalency`:

```bash
curl -X POST http://localhost:3000/api/beliefs/equivalency \
  -H "Content-Type: application/json" \
  -d '{
    "statementA": "We should ban assault weapons.",
    "statementB": "We should prohibit military-style rifles.",
    "semanticScore": 0.91
  }'
```

Response:
```json
{
  "equivalencyScore": 0.866,
  "mechanicalSimilarity": 0.167,
  "isMechanicalEquivalent": false,
  "relationship": "near-identical",
  "recommendation": "Link the pages and cross-reference their argument trees.",
  "layersUsed": ["mechanical", "semantic"]
}
```

See `GET /api/beliefs/equivalency` for full endpoint documentation.

---

## Files

```
tools/ise-dev/
├── src/cli.js           Main CLI source (pure Node, no dependencies)
├── dist/cli.js          Built output (identical to src for this tool)
├── build.js             Build script (copies src → dist, marks executable)
├── package.json         Package metadata and bin entry
├── sample-beliefs.txt   Example belief list for ise-dev analyze
└── README.md            This file
```

---

## License

MIT
