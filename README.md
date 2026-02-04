# Idea Stock Exchange

A platform for structured disagreement, probabilistic reasoning, and argument-weighted decision analysis.

The Idea Stock Exchange applies computational epistemology to real-world claims. Every belief is treated as a tradeable proposition: its "price" (truth score) rises or falls based on the quality, linkage, and adversarial strength of the arguments behind it.

## Core Concepts

### ReasonRank

A recursive scoring algorithm that evaluates arguments through three dimensions:

- **Truth Score** -- Is the evidence factually accurate? (0-1)
- **Linkage Score** -- Does this evidence actually support the conclusion? (0-1)
- **Importance Weight** -- How much does this argument move the probability? (0-1)

Sub-arguments modify their parent's effective truth score, and fallacy detection applies multiplicative penalties. The result is a single composite score that reflects adversarial scrutiny.

### Likelihood Scores

Competing probability estimates for a given prediction, each scored by ReasonRank. The estimate with the highest ReasonRank score determines the "active likelihood" -- the system's best current assessment.

### Cost-Benefit Analysis

Line items (costs and benefits) are each assigned a likelihood belief. Expected value is computed as `Predicted Impact x Active Likelihood`. The system aggregates these into net expected value with confidence intervals.

### Nested Beliefs

Beliefs are organized along three dimensions:

- **Abstraction** -- General to specific (from "democracy matters" to "12-year term limits reduce lobbying")
- **Intensity** -- Modest to extreme (from "some effect" to "the only solution")
- **Valence** -- Negative to positive sentiment

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Database | SQLite via Prisma + better-sqlite3 |
| Styling | Tailwind CSS 4 |
| AI/ML | Python (sentence-transformers, LLM clients) |
| Charts | Recharts |
| Validation | Zod |

## Local Development

```bash
npm install
npx prisma generate
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Database

```bash
npm run db:migrate   # Run migrations
npm run db:seed      # Seed sample data
npm run db:reset     # Reset and re-migrate
```

### Environment

Copy `.env.example` to `.env` and configure required variables. The `.env` file is gitignored.

## Architecture

The system is organized by **intent** (Domain-Driven Design) rather than by technology layer.

```
src/
  app/              Next.js App Router -- routing, layouts, server actions only
  features/         Domain logic grouped by feature
    reasonrank/       ReasonRank scoring, protocol components, data
    cost-benefit-analysis/  CBA dashboard, likelihood panels, line items
    wikilaw/          Law analysis, diagnostic sections, evidence cards
    books/            Book analysis services
    topics/           Topic data and sample beliefs
  core/             Framework-agnostic logic
    scoring/          Unified scoring engine, CBA scoring, book scoring
    types/            All TypeScript type definitions
    schemas/          XSD and XSLT schema artifacts
    ai/               Python ML models, LLM clients, distributed AI framework
  lib/              Third-party integration wrappers (Prisma)
  shared/           Reusable UI components and utilities
docs/               Design documents and technical specifications
prisma/             Database schema and migrations
_archive/           Legacy code preserved for reference
```

### Key Design Decisions

- **Single scoring engine** (`src/core/scoring/scoring-engine.ts`) ensures Protocol and CBA use identical ReasonRank logic
- **Feature isolation** -- each feature owns its components, data, and services
- **Typed contracts** -- all domain types live in `src/core/types/` and are shared across features
- **No business logic in routes** -- `src/app/` contains only routing and server boundaries

## Documentation

Detailed specifications and design documents are in [`/docs`](./docs/):

- [Algorithms](./docs/ALGORITHMS.md) -- Scoring formulas and mathematical models
- [Architecture](./docs/ARCHITECTURE.md) -- System design and type system
- [Implementation](./docs/IMPLEMENTATION.md) -- Implementation details
- [Contributing](./docs/CONTRIBUTING.md) -- Contribution guidelines
- [Quickstart](./docs/QUICKSTART.md) -- Getting started guide

## License

MIT
