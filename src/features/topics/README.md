# Topics Feature

Topic hubs: the "One Page Per Topic" surface. Each topic groups every belief that takes a position on the same underlying question, and the hub page (`/topics/[slug]`) renders that one belief set through three dimension lenses — direction (positivity), claim magnitude (claimStrength), abstraction (specificity) — plus a combined view sortable by any dimension, engine-computed score, or evidence grounding.

## What This Module Does

- `data/fetch-topics.ts` — Prisma queries for the topic index, a single hub (beliefs, parent/child topics, equivalency-grouped duplicates, matching debate-topic template), and a belief's topic memberships.
- `lib/dimensions.ts` — pure dimension helpers: direction/abstraction band labels and the per-axis sort used by both the pages and `/api/topics/[slug]`.
- `data/sample-data.ts` — legacy hardcoded prototype data; the old `/topic/[id]` route that used it now redirects to `/topics/[slug]`.

## Data Model

`Topic` ↔ `TopicBelief` ↔ `Belief` (a belief can appear on many topic pages; its dimension coordinates live on `Belief` so they are identical everywhere), plus `TopicRelation` parent/child edges for the topic-level abstraction ladder. Seeded by `prisma/seed-topics.ts`.
