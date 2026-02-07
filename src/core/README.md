# Core

Framework-agnostic logic that is not specific to any single feature. Contains the type system, scoring engine, AI integration, and schema definitions.

## Subfolders

| Folder | Purpose |
|--------|---------|
| `types/` | All TypeScript type definitions organized by domain (ISE core, Schlicht, CBA, books, wikiLaw). |
| `scoring/` | Unified scoring engine. Single source of truth for ReasonRank, EVS, truth scores, and likelihood. |
| `ai/` | LLM client, analysis generators, and task queue for AI-powered operations. |
| `schemas/` | XSD/XSLT schema artifacts. |

## Scoring Engine

`scoring/scoring-engine.ts` is the central calculation module (~487 lines). All features delegate their score computation here so that Protocol beliefs, CBA estimates, and book analyses use identical logic.

Key functions:
- `calculateEVS()` -- Evidence Verification Score
- `scoreArgument()` -- Individual argument scoring with fallacy penalties
- `scoreProtocolBelief()` -- Full belief scoring with confidence intervals
- `calculateReasonRankScore()` -- Likelihood scoring for CBA
- `determineActiveLikelihood()` -- Selects the winning probability estimate
