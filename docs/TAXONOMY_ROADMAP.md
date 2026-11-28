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
  - **Status 2026-11-22: Not done.** `src/core/taxonomy/` does not exist (`ls` fails); Next: Decide whether taxonomy belongs in the static site (a `topics.csv` column plus a module) or the app;
  - Plugin architecture for registering taxonomy providers
  - Unified `classifyBelief()` entry point
  - Topic Signature ("idea DNA") generation
  - Location: `src/core/taxonomy/taxonomy-service.ts`

- [ ] **Wikipedia Categories** (Complete existing partial integration)
  - **Status 2026-11-22: Partly done.** App only: `DebateTopic.wikipediaUrl` (`prisma/schema.prisma:1838`) is filled by an LLM prompt (`src/features/debate-topics/ai-generator.ts:66`) and shown on `/debate-topics/[slug]` (`src/components/debate-topic/ExternalReferences.tsx:16`). Next: Add an optional `wikipedia` column to `content/topics.csv`, rendered as a link on `t/<topic>.html`;
  - Already partially integrated via belief generator
  - Broadest "common sense" coverage
  - Fastest path to full topic coverage
  - API: [MediaWiki Categories API](https://www.mediawiki.org/wiki/API:Categories)

### P1 - Critical

- [ ] **Google Knowledge Graph** — Entity relationship discovery
  - **Status 2026-11-22: Not done.** No Knowledge Graph code in `src/` or `tools/static-site/`; related topics are hand-typed `related` rows (`ise_tables.py`). Next: keep in backlog.
  - Automatic cross-linking of related topics
  - "Solar Power" ↔ "Climate Change" ↔ "Renewable Energy"
  - API: [Google KG Search API](https://developers.google.com/knowledge-graph)

- [ ] **Strength Scoring Service** — Claim intensity measurement (0-100)
  - **Status 2026-11-22: Partly done.** Strength is typed, never detected: the `strength` page column (Modest, Moderate, Strong, Total) sorts the topic pages' Claim Strength continuum (`render_site.py`). Next: a detector would suggest a label for a person to confirm, never set it.
  - Intensifier/hedge/superlative/absolute detection
  - Enables sorting beliefs by rhetorical intensity
  - Spec complete in BELIEF_ORGANIZATION_SYSTEM.md Section 4

- [ ] **GitHub Issue Templates & Project Board**
  - **Status 2026-11-22: Partly done.** Templates exist: `.github/ISSUE_TEMPLATE/bug-report.md`, `feature-request.md`, `taxonomy-integration.md` (plus belief/contribute/outline/vote forms). Next: Owner confirms whether a GitHub Projects board exists;
  - Bug report, feature request, taxonomy integration templates
  - Kanban board for tracking progress

### P2 - Important (Specialized)

- [ ] **OpenAlex Topics** — Academic research classification
  - **Status 2026-11-22: Not done.** `grep -ri openalex src tools/static-site` empty Next: Optional: an `openalex` id column on evidence rows linking a finding to its work;
  - 250M+ works with topic classification
  - Free API, no key required for basic use
  - API: [OpenAlex API](https://docs.openalex.org/)

- [ ] **Medical Subject Headings (MeSH)** — Medical/health taxonomy
  - **Status 2026-11-22: Not done.** No MeSH code in wired code. Next: keep in backlog until health beliefs need it.
  - Gold-standard medical classification (NLM/PubMed)
  - Prioritize if platform sees significant health debate
  - API: [MeSH RDF/SPARQL](https://id.nlm.nih.gov/mesh/)

- [ ] **UNESCO Fields of Science** — Scientific discipline classification
  - **Status 2026-11-22: Not done.** `grep -ri unesco` empty Next: Static list as a `field` column on `topics.csv`;
  - Small static dataset (~40 fields + subfields)
  - **Good first issue** — no external API needed
  - Source: [UNESCO ISCED-F](https://uis.unesco.org/en/topic/international-standard-classification-education-isced)

- [x] **Enhanced Topic Page Organization**
  - **Status 2026-11-22: Done.** Static topic pages: Continuum 1 Direction, 2 Claim Strength, 3 General to Specific (`render_site.py:2305,2344,2359`), aggregate counts and Controversy line (`render_site.py:2290-2293`); Next: None (a literal slider is cosmetic)
  - Sort beliefs by polarity (positive → neutral → negative)
  - Sort by strength (mild → extreme)
  - Generality slider (general ↔ specific)
  - Aggregate statistics display

- [ ] **Sentiment Analysis API Integration**
  - **Status 2026-11-22: Not done.** No sentiment or wording-polarity code exists; `similarity.py` counts negations only to tell duplicates from opposites. Next: keep in backlog; any score from it would need its own argued page.
  - Upgrade basic polarity calculation to proper NLP
  - Handle sarcasm, conditionals, comparative claims

- [ ] **Cognitive Bias Detection**
  - **Status 2026-11-22: Partly done.** Bias rows exist and are argued: static "Cognitive biases" sub-table (`render_site.py:1009`; Next: Add bias patterns to `fallacy.py` (or a sibling) that raise a question on the claim's page, moving no score, pinned in `test_fallacy.py`
  - Extend existing fallacy detection to cognitive biases
  - Confirmation bias, anchoring, availability heuristic, etc.

- [x] **Cost-Benefit Quantification** (build on existing CBA feature)
  - **Status 2026-11-22: Done.** Static "What Acting On This Would Cost and Gain" with Likelihood x estimate = Exp. Next: None here;
  - Link CBA module outputs to specific beliefs
  - Display expected value calculations on belief pages

- [x] **Interest/Stakeholder Mapping**
  - **Status 2026-11-22: Done.** Static "Interests, Not Positions": interests of each side, shared interests, advertised vs actual motivations (`render_site.py:980,986,992`), interests page SITE `interests.html`. Next: None
  - "Who benefits?" and "Who is affected?" analysis
  - Transparent incentive structure analysis

### P3 - Backlog

- [ ] **Dewey Decimal System** — General knowledge categorization
  - **Status 2026-11-22: Partly done.** App only, typed: `Belief.deweyNumber` (`prisma/schema.prisma:186`) shown on belief page (`src/app/beliefs/[slug]/page.tsx:154`); Next: If wanted, a `dewey` column on `topics.csv`;
  - Classic library organization, potentially too rigid
  - **Good first issue** — static mapping table
  - Source: [DDC Summaries](https://www.oclc.org/en/dewey/resources/summaries.html)

- [ ] **Library of Congress Subject Headings**
  - **Status 2026-11-22: Partly done.** App only: `locSubjectHeading` displayed on `/debate-topics/[slug]` (`ExternalReferences.tsx:8`). Next: Same as Dewey: one optional typed column, or close
  - Fine-grained academic subject headings
  - Overlaps with OpenAlex; implement if additional coverage needed
  - API: [LOC Linked Data](https://id.loc.gov/)

- [ ] **Evidence Quality Tier Classification**
  - **Status 2026-11-22: Obsolete.** The 4 tiers were retired for source types: static `evidence.py:193` `tiers()` (eighteen tiers, in `conformance.py`) sets where a finding starts; Next: Close;
  - 4-tier system: Gold Standard → Lower Quality
  - Tier badges on evidence cards

- [ ] **Obstacle Identification**
  - **Status 2026-11-22: Partly done.** Belief pages have "Obstacles to resolution" (`render_site.py:1006`; Next: Add an `obstacle` key to `TOPIC_SECTIONS` and a topic section filled from beliefs beneath, like other topic cells;
  - Track barriers preventing debate resolution
  - "Why this debate persists" section on topic pages

---

## Phase 3: Comprehensive Linkage

### P1

- [x] **People/Stakeholder Tracking**
  - **Status 2026-11-22: Done.** Static "People on the Record", score-free by design (`render_site.py:1060`); Next: None
  - Track who agrees/disagrees with each belief
  - Public figures, experts, organizations
  - Source attribution for stance claims

### P2

- [ ] **Values Analysis**
  - **Status 2026-11-22: Partly done.** Values with supporter and opponent ranks and gap (`render_site.py:960-965`); Next: Owner decides whether to tie value names to a published framework;
  - Identify values driving supporters vs. opponents
  - Based on established frameworks (e.g., Schwartz values)

### P3

- [x] **Books & Media Linkage** (Phase 4)
  - **Status 2026-11-22: Done.** Media rows scored on belief pages and `media.html` (`render_site.py` `render_media`); app `MediaResourcesSection`. Next: none.
  - Link books, articles, videos, podcasts to beliefs
  - Build on existing book feature (`src/features/books/`)

- [ ] **Obstacle Identification**
  - **Status 2026-11-22: Partly done.** Same as the Phase 2 obstacle row: per-belief obstacles exist, separate from arguments Next: Merge with the Phase 2 row
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
