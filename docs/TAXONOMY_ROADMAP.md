# Belief Taxonomy System - Roadmap

> Tracking all planned taxonomy integrations, scoring enhancements, and linkage features
> described in [BELIEF_ORGANIZATION_SYSTEM.md](./BELIEF_ORGANIZATION_SYSTEM.md).

**Last updated:** 2026-02-04

---

## Quick Links

- **Create all GitHub Issues:** Run `./scripts/create-taxonomy-issues.sh`
- **Full system design:** [BELIEF_ORGANIZATION_SYSTEM.md](./BELIEF_ORGANIZATION_SYSTEM.md)
- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Existing issues:** [docs/ISSUES.md](./ISSUES.md)

---

## Priority Framework

Tasks are prioritized by **value to users** vs. **implementation effort**:

| Priority | Meaning | Criteria |
|----------|---------|----------|
| **P0** | Immediate | Blocks other work or has highest ROI |
| **P1** | Critical | High value, do next after P0 |
| **P2** | Important | Valuable but not urgent, or specialized audience |
| **P3** | Backlog | Nice-to-have, do when capacity allows |

---

## Phase 2: Taxonomy Integration & Scoring

### P0 - Immediate

- [ ] **Core TaxonomyService** — Foundation for all taxonomy work
  - Plugin architecture for registering taxonomy providers
  - Unified `classifyBelief()` entry point
  - Topic Signature ("idea DNA") generation
  - Location: `src/core/taxonomy/taxonomy-service.ts`

- [ ] **Wikipedia Categories** (Complete existing partial integration)
  - Already partially integrated via belief generator
  - Broadest "common sense" coverage
  - Fastest path to full topic coverage
  - API: [MediaWiki Categories API](https://www.mediawiki.org/wiki/API:Categories)

### P1 - Critical

- [ ] **Google Knowledge Graph** — Entity relationship discovery
  - Automatic cross-linking of related topics
  - "Solar Power" ↔ "Climate Change" ↔ "Renewable Energy"
  - API: [Google KG Search API](https://developers.google.com/knowledge-graph)

- [ ] **Strength Scoring Service** — Claim intensity measurement (0-100)
  - Intensifier/hedge/superlative/absolute detection
  - Enables sorting beliefs by rhetorical intensity
  - Spec complete in BELIEF_ORGANIZATION_SYSTEM.md Section 4

- [ ] **GitHub Issue Templates & Project Board**
  - Bug report, feature request, taxonomy integration templates
  - Kanban board for tracking progress

### P2 - Important (Specialized)

- [ ] **OpenAlex Topics** — Academic research classification
  - 250M+ works with topic classification
  - Free API, no key required for basic use
  - API: [OpenAlex API](https://docs.openalex.org/)

- [ ] **Medical Subject Headings (MeSH)** — Medical/health taxonomy
  - Gold-standard medical classification (NLM/PubMed)
  - Prioritize if platform sees significant health debate
  - API: [MeSH RDF/SPARQL](https://id.nlm.nih.gov/mesh/)

- [ ] **UNESCO Fields of Science** — Scientific discipline classification
  - Small static dataset (~40 fields + subfields)
  - **Good first issue** — no external API needed
  - Source: [UNESCO ISCED-F](https://uis.unesco.org/en/topic/international-standard-classification-education-isced)

- [ ] **Enhanced Topic Page Organization**
  - Sort beliefs by polarity (positive → neutral → negative)
  - Sort by strength (mild → extreme)
  - Generality slider (general ↔ specific)
  - Aggregate statistics display

- [ ] **Sentiment Analysis API Integration**
  - Upgrade basic polarity calculation to proper NLP
  - Handle sarcasm, conditionals, comparative claims

- [ ] **Cognitive Bias Detection**
  - Extend existing fallacy detection to cognitive biases
  - Confirmation bias, anchoring, availability heuristic, etc.

- [ ] **Cost-Benefit Quantification** (build on existing CBA feature)
  - Link CBA module outputs to specific beliefs
  - Display expected value calculations on belief pages

- [ ] **Interest/Stakeholder Mapping**
  - "Who benefits?" and "Who is affected?" analysis
  - Transparent incentive structure analysis

### P3 - Backlog

- [ ] **Dewey Decimal System** — General knowledge categorization
  - Classic library organization, potentially too rigid
  - **Good first issue** — static mapping table
  - Source: [DDC Summaries](https://www.oclc.org/en/dewey/resources/summaries.html)

- [ ] **Library of Congress Subject Headings**
  - Fine-grained academic subject headings
  - Overlaps with OpenAlex; implement if additional coverage needed
  - API: [LOC Linked Data](https://id.loc.gov/)

- [ ] **Evidence Quality Tier Classification**
  - 4-tier system: Gold Standard → Lower Quality
  - Tier badges on evidence cards

- [ ] **Obstacle Identification**
  - Track barriers preventing debate resolution
  - "Why this debate persists" section on topic pages

---

## Phase 3: Comprehensive Linkage

### P1

- [ ] **People/Stakeholder Tracking**
  - Track who agrees/disagrees with each belief
  - Public figures, experts, organizations
  - Source attribution for stance claims

### P2

- [ ] **Values Analysis**
  - Identify values driving supporters vs. opponents
  - Based on established frameworks (e.g., Schwartz values)

### P3

- [ ] **Books & Media Linkage** (Phase 4)
  - Link books, articles, videos, podcasts to beliefs
  - Build on existing book feature (`src/features/books/`)

- [ ] **Obstacle Identification**
  - Barriers to resolution, separate from arguments

---

## Already Implemented

These are done and not tracked here (see [ISSUES.md](./ISSUES.md) for details):

- [x] Core Belief CRUD operations
- [x] Argument creation and voting
- [x] Evidence submission and verification
- [x] Related beliefs linkage
- [x] Conclusion Score (6 components)
- [x] ReasonRank / ArgumentRank
- [x] Fallacy detection (10 types)
- [x] Redundancy detection (4 algorithms)
- [x] Semantic clustering (Jaccard, Cosine, Levenshtein)
- [x] Duplicate detection
- [x] Basic topic system (model, CRUD, associations)
- [x] Basic sentiment polarity calculation
- [x] Specificity calculation
- [x] Conflict resolution model

---

## Definition of Done (DoD)

For any taxonomy integration to be considered "done," it must meet ALL of these criteria:

1. **Schema mapped** — Taxonomy codes stored in `Topic.taxonomyMappings[{ system, code, name, confidence }]`
2. **Classification works** — The AI/algorithm can successfully categorize a new belief using that system
3. **UI displays it** — The category tag/badge appears on the belief page and topic page
4. **Backfill complete** — Existing beliefs have been classified (or a migration script exists)
5. **Tests pass** — Unit tests for classification logic, integration tests for end-to-end flow
6. **Documented** — Provider registered in TaxonomyService, README updated

---

## How to Contribute

1. **Pick an issue** — Look for `good-first-issue` labels or P3 items to start
2. **Discuss first** — Use GitHub Discussions for architectural questions
3. **Follow the provider pattern** — Each taxonomy is a provider that registers with `TaxonomyService`
4. **Meet the DoD** — All 6 criteria above must be satisfied
5. **Submit a PR** — Reference the issue number, include tests

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full guidelines.
