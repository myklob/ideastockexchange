# Idea Stock Exchange

> A marketplace for ideas where truth is the currency.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./docs/CONTRIBUTING.md)

A platform for structured disagreement, probabilistic reasoning, and argument-weighted decision analysis.

---

## Why This Exists

Public discourse is broken. People argue past each other, cherry-pick evidence, and conflate values with facts. The Idea Stock Exchange provides a framework where:

- **Arguments are investments** --  Every claim has two values: a ReasonRank earned through proof and a market price set by the crowd.
- **Disagreement is structured** -- Identify whether you disagree on facts, values, or the strength of the link between them
- **Uncertainty is explicit** -- All scores include confidence intervals, not false precision
- **Adversarial testing is built-in** -- The best arguments survive scrutiny; weak ones get repriced

The Idea Stock Exchange applies computational epistemology to real-world claims. Every belief is treated as a tradeable proposition: its "price" (truth score) rises or falls based on the quality, linkage, and adversarial strength of the arguments behind it.

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/myklob/ideastockexchange.git
cd ideastockexchange
npm install

# Set up database
cp .env.example .env
npx prisma generate
npm run db:migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore.

---

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

The system is organized by **intent** (Domain-Driven Design) rather than by technology layer. Each folder describes *what it does*, not when it was last touched.

```
src/
  app/                        Next.js App Router -- routing and server boundaries only
  features/                   Domain logic grouped by business purpose
    epistemology/               Schlicht Protocol: belief verification and confidence scoring
    cost-benefit-analysis/      Policy evaluation with adversarial likelihood estimates
    legal-framework/            wikiLaw: law diagnostic dashboards and assumption auditing
    books/                      Book claim analysis and fallacy detection
    topics/                     Topic hubs aggregating related beliefs
  core/                       Framework-agnostic logic shared across all features
    scoring/                    Unified scoring engine (ReasonRank, EVS, truth, likelihood)
    types/                      All TypeScript type definitions by domain
    ai/                         LLM clients, analysis generators, task queue
    schemas/                    XSD and XSLT schema artifacts
  components/                 Global reusable UI (only components used by 3+ features)
  lib/                        Third-party wrappers (Prisma client) and shared utilities
  styles/                     CSS assets
docs/                         Design documents and technical specifications
tests/                        Unit, integration, and e2e tests
prisma/                       Database schema and migrations
scripts/                      Automation and CI/CD scripts
_archive/                     Legacy code preserved for reference
```

Each feature folder contains a `README.md` explaining its purpose, key concepts, and internal structure.

### Key Design Decisions

- **Single scoring engine** (`src/core/scoring/scoring-engine.ts`) ensures Protocol and CBA use identical ReasonRank logic
- **Feature isolation** -- each feature owns its components, data, and services; co-located unless shared by 3+ features
- **Typed contracts** -- all domain types live in `src/core/types/` and are shared across features
- **No business logic in routes** -- `src/app/` contains only routing and server boundaries
- **Rule of Three** -- a component stays co-located in its feature until it is used by three or more features, then it moves to `/src/components/`

## Documentation

Detailed specifications and design documents are in [`/docs`](./docs/):

- [Algorithms](./docs/ALGORITHMS.md) -- Scoring formulas and mathematical models
- [Architecture](./docs/ARCHITECTURE.md) -- System design and type system
- [Implementation](./docs/IMPLEMENTATION.md) -- Implementation details
- [Contributing](./docs/CONTRIBUTING.md) -- Contribution guidelines
- [Quickstart](./docs/QUICKSTART.md) -- Getting started guide

## License

MIT
