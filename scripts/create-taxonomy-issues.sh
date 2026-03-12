#!/usr/bin/env bash
#
# Creates GitHub Issues for all planned taxonomy integrations and related work.
# Requires: gh CLI authenticated (run `gh auth login` first)
#
# Usage:
#   ./scripts/create-taxonomy-issues.sh
#   ./scripts/create-taxonomy-issues.sh --dry-run   # Preview without creating
#
set -euo pipefail

REPO="myklob/ideastockexchange"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "=== DRY RUN MODE - No issues will be created ==="
  echo ""
fi

# Verify gh is authenticated (skip for dry-run)
if ! $DRY_RUN && ! gh auth status &>/dev/null; then
  echo "ERROR: gh CLI is not authenticated. Run 'gh auth login' first."
  exit 1
fi

echo "Creating labels..."

create_label() {
  local name="$1" color="$2" description="$3"
  if $DRY_RUN; then
    echo "  [label] $name ($color) - $description"
  else
    gh label create "$name" --color "$color" --description "$description" --repo "$REPO" --force 2>/dev/null || true
  fi
}

create_label "area:taxonomy"        "1d76db" "Taxonomy classification systems"
create_label "area:data-science"    "5319e7" "Data science and ML tasks"
create_label "area:integration"     "006b75" "External API/system integration"
create_label "area:scoring"         "e99695" "Scoring algorithms and calculations"
create_label "area:ui"              "7057ff" "User interface work"
create_label "area:linkage"         "d4c5f9" "Belief/evidence/argument linkage"
create_label "priority:p0-immediate" "b60205" "Must do now - highest priority"
create_label "priority:p1-critical"  "d93f0b" "Critical path - do next"
create_label "priority:p2-important" "fbca04" "Important but not urgent"
create_label "priority:p3-backlog"   "0e8a16" "Backlog - do when capacity allows"
create_label "type:feature"         "a2eeef" "New feature or enhancement"
create_label "type:integration"     "c2e0c6" "External system integration"
create_label "type:infrastructure"  "d4c5f9" "Build, tooling, or project infrastructure"
create_label "good-first-issue"     "7057ff" "Good for newcomers"
create_label "phase:2"              "bfd4f2" "Phase 2 implementation"
create_label "phase:3"              "bfd4f2" "Phase 3 implementation"
create_label "phase:4"              "bfd4f2" "Phase 4 implementation"

echo ""
echo "Creating issues..."

create_issue() {
  local title="$1" labels="$2" body="$3"
  if $DRY_RUN; then
    echo ""
    echo "  [issue] $title"
    echo "  [labels] $labels"
    echo "  [body preview] $(echo "$body" | head -3)..."
  else
    gh issue create \
      --repo "$REPO" \
      --title "$title" \
      --label "$labels" \
      --body "$body"
    echo "  Created: $title"
    sleep 1  # Rate limit courtesy
  fi
}

# ============================================================================
# P0 - IMMEDIATE: Wikipedia Categories (already partial)
# ============================================================================

create_issue \
  "[P0] Complete Wikipedia Categories Integration" \
  "priority:p0-immediate,area:taxonomy,type:integration,phase:2" \
  "$(cat <<'BODY'
## Summary

Complete the **Wikipedia Categories** taxonomy integration. This is partially implemented via the belief generator but needs full coverage.

**Current Status:** ⚠️ Partial (via belief generator)
**Priority:** P0 - Immediate (broadest "common sense" coverage for users)

## Why This Is P0

Wikipedia Categories provide the most accessible, crowdsourced taxonomy available. Since we already have partial integration, completing this gives us the fastest path to full topic coverage with the least effort.

## Requirements

### Definition of Done

- [ ] Wikipedia category fetching is reliable and handles API rate limits
- [ ] Categories map to ISE Topic model's `taxonomyMappings` field
- [ ] New beliefs auto-classify against Wikipedia categories on creation
- [ ] Existing beliefs are backfilled with Wikipedia category mappings
- [ ] Topic pages display Wikipedia category breadcrumbs
- [ ] Unit tests cover the Wikipedia API integration layer
- [ ] Integration tests verify end-to-end belief → category mapping

### Technical Details

- **API:** [Wikipedia API - Categories](https://www.mediawiki.org/wiki/API:Categories)
- **Target field:** `Topic.taxonomyMappings[{ system: 'wikipedia', code, name, confidence }]`
- **Relevant code:**
  - `src/core/ai/generator.py` (existing belief generator with partial Wikipedia integration)
  - `src/features/topics/` (topic management)

### Acceptance Criteria

1. Given a belief like "Electric cars reduce emissions", the system maps it to Wikipedia categories: `Electric vehicles`, `Greenhouse gas emissions`, `Sustainable transport`
2. Given a topic page, Wikipedia category hierarchy is displayed
3. Category mappings have confidence scores (0-1)

## References

- [BELIEF_ORGANIZATION_SYSTEM.md - Taxonomy Table](../docs/BELIEF_ORGANIZATION_SYSTEM.md)
- [Wikipedia Categories API](https://www.mediawiki.org/wiki/API:Categories)
BODY
)"

# ============================================================================
# P1 - CRITICAL: Google Knowledge Graph
# ============================================================================

create_issue \
  "[P1] Integrate Google Knowledge Graph for Entity Relationships" \
  "priority:p1-critical,area:taxonomy,area:data-science,type:integration,phase:2" \
  "$(cat <<'BODY'
## Summary

Integrate **Google Knowledge Graph** to automatically discover entity relationships between beliefs, topics, and arguments.

**Current Status:** 🔄 Planned
**Priority:** P1 - Critical (high value for understanding entity relationships)

## Why This Is P1

The Knowledge Graph provides structured entity relationships that no other taxonomy offers. It lets the AI understand that "Solar Power" relates to "Climate Change", "Renewable Energy", and "Photovoltaic Cells" — enabling automatic cross-linking of beliefs across topics.

## Requirements

### Definition of Done

- [ ] Google Knowledge Graph API client is implemented
- [ ] Entity extraction from belief statements works reliably
- [ ] Entity relationships are stored in Topic model's `relatedTopics` field
- [ ] Belief creation triggers entity lookup and relationship mapping
- [ ] Related entities are surfaced on belief and topic pages
- [ ] API key management and rate limiting are handled properly
- [ ] Tests cover entity extraction and relationship mapping

### Technical Details

- **API:** [Google Knowledge Graph Search API](https://developers.google.com/knowledge-graph)
- **Key capability:** Entity recognition + relationship discovery
- **Target fields:**
  - `Topic.taxonomyMappings[{ system: 'google_kg', code: entityId, name, confidence }]`
  - `Topic.relatedTopics` (auto-populated from entity graph)
  - `Belief.topicSignature` (enriched with entity context)

### Acceptance Criteria

1. Given "Electric cars are good for the environment", the system identifies entities: `Electric car` (mid: /m/02hjhm), `Natural environment` (mid: /m/05kq4)
2. Entity relationships populate `relatedTopics` automatically
3. Topic pages show a "Related Entities" section from the Knowledge Graph

## References

- [BELIEF_ORGANIZATION_SYSTEM.md - Taxonomy Table](../docs/BELIEF_ORGANIZATION_SYSTEM.md)
- [Google KG API Docs](https://developers.google.com/knowledge-graph)
BODY
)"

# ============================================================================
# P2 - SPECIALIZED: OpenAlex Topics
# ============================================================================

create_issue \
  "[P2] Integrate OpenAlex Topics for Academic Research Classification" \
  "priority:p2-important,area:taxonomy,area:data-science,type:integration,phase:2" \
  "$(cat <<'BODY'
## Summary

Integrate **OpenAlex Topics** to classify beliefs using academic research taxonomy, enabling scholarly context for ISE beliefs.

**Current Status:** 🔄 Planned
**Priority:** P2 - Important (deep academic coverage, prioritize if user base is research-heavy)

## Why This Is P2

OpenAlex provides a free, open alternative to proprietary academic databases. It covers 250M+ works with topic classification. Valuable for beliefs that intersect with academic research but not urgent for general-purpose use.

## Requirements

### Definition of Done

- [ ] OpenAlex API client is implemented with proper pagination
- [ ] Belief statements can be matched to OpenAlex topics/concepts
- [ ] Academic topic hierarchy is stored in `taxonomyMappings`
- [ ] Citation counts and research volume are surfaced as context
- [ ] Rate limiting and caching are implemented (OpenAlex is free but has limits)
- [ ] Tests cover API integration and topic matching

### Technical Details

- **API:** [OpenAlex API](https://docs.openalex.org/) (free, no key required for basic use)
- **Key endpoints:** `/concepts`, `/topics`, `/works`
- **Target field:** `Topic.taxonomyMappings[{ system: 'openalex', code: conceptId, name, confidence }]`

### Acceptance Criteria

1. Given a belief about "vaccine efficacy", it maps to OpenAlex concepts: `Vaccination`, `Immunology`, `Public health`
2. Research volume (number of papers) is shown as additional context
3. Academic hierarchy is navigable: `Medicine > Immunology > Vaccination`

## References

- [OpenAlex API Documentation](https://docs.openalex.org/)
- [OpenAlex Concepts](https://docs.openalex.org/api-entities/concepts)
BODY
)"

# ============================================================================
# P2 - SPECIALIZED: Medical Subject Headings (MeSH)
# ============================================================================

create_issue \
  "[P2] Integrate Medical Subject Headings (MeSH) for Health/Medical Classification" \
  "priority:p2-important,area:taxonomy,area:data-science,type:integration,phase:2" \
  "$(cat <<'BODY'
## Summary

Integrate **Medical Subject Headings (MeSH)** from the National Library of Medicine to classify health and medical beliefs using the gold-standard medical taxonomy.

**Current Status:** 🔄 Planned
**Priority:** P2 - Important (critical for medical/health beliefs, not urgent for general use)

## Why This Is P2

MeSH is the definitive taxonomy for medical and health sciences, used by PubMed and the NLM. For any belief touching health topics (vaccines, nutrition, mental health, drug policy), MeSH provides authoritative classification. Prioritize if the platform sees significant health-related debate.

## Requirements

### Definition of Done

- [ ] MeSH API or data file integration is implemented
- [ ] Health-related beliefs auto-classify against MeSH tree
- [ ] MeSH descriptor hierarchy is navigable (e.g., `Diseases > Cardiovascular > Hypertension`)
- [ ] Qualifier/subheading associations are supported
- [ ] MeSH mappings stored in `taxonomyMappings`
- [ ] Tests cover MeSH lookup and classification

### Technical Details

- **API:** [MeSH RDF / SPARQL endpoint](https://id.nlm.nih.gov/mesh/) or [MeSH XML downloads](https://www.nlm.nih.gov/databases/download/mesh.html)
- **Key structure:** Tree numbers (e.g., C14.280.647 = Hypertension under Cardiovascular Diseases)
- **Target field:** `Topic.taxonomyMappings[{ system: 'mesh', code: treeNumber, name: descriptorName, confidence }]`

### Acceptance Criteria

1. Given "Aspirin reduces heart attack risk", maps to MeSH: `Aspirin [D02.065.199]`, `Myocardial Infarction [C14.280.647.500]`
2. MeSH tree hierarchy is displayed on relevant topic pages
3. Medical beliefs show a "Medical Classification" badge

## References

- [MeSH Browser](https://meshb.nlm.nih.gov/)
- [MeSH API Documentation](https://id.nlm.nih.gov/mesh/)
BODY
)"

# ============================================================================
# P2 - SPECIALIZED: UNESCO Fields of Science
# ============================================================================

create_issue \
  "[P2] Integrate UNESCO Fields of Science and Technology Classification" \
  "priority:p2-important,area:taxonomy,type:integration,phase:2,good-first-issue" \
  "$(cat <<'BODY'
## Summary

Integrate **UNESCO International Standard Classification of Education / Fields of Science and Technology** for classifying beliefs by scientific discipline.

**Current Status:** 🔄 Planned
**Priority:** P2 - Important (good for scientific discipline classification)

## Why This Is P2

UNESCO Fields of Science provide a standardized, internationally recognized way to classify scientific disciplines. Simpler than MeSH or OpenAlex but provides a solid "which branch of science is this?" classification.

## Requirements

### Definition of Done

- [ ] UNESCO FOS classification data is imported (it is a static list, ~40 fields + subfields)
- [ ] Beliefs can be mapped to one or more UNESCO fields
- [ ] Field hierarchy is stored in `taxonomyMappings`
- [ ] Mapping logic (keyword-based or AI-assisted) is implemented
- [ ] Tests cover field classification

### Technical Details

- **Source:** [UNESCO ISCED-F / Frascati Manual](https://uis.unesco.org/en/topic/international-standard-classification-education-isced) - static dataset
- **Structure:** 6 major fields, ~40 subfields (e.g., `1. Natural Sciences > 1.1 Mathematics > 1.1.1 Pure Mathematics`)
- **Implementation:** Can be a static JSON file since the taxonomy rarely changes
- **Target field:** `Topic.taxonomyMappings[{ system: 'unesco_fos', code: '1.1', name: 'Mathematics', confidence }]`

### Why Good First Issue

This is a good first issue because:
- The UNESCO taxonomy is a small, static dataset (~40 entries)
- No external API calls needed — just a JSON mapping file
- Clear input/output: belief text → UNESCO field code
- Can start with simple keyword matching

## References

- [UNESCO Fields of Science](https://uis.unesco.org/en/topic/international-standard-classification-education-isced)
- [Frascati Manual 2015 - Field of R&D Classification](https://www.oecd.org/sti/frascati-manual.htm)
BODY
)"

# ============================================================================
# P3 - LEGACY: Dewey Decimal System
# ============================================================================

create_issue \
  "[P3] Integrate Dewey Decimal System for General Knowledge Organization" \
  "priority:p3-backlog,area:taxonomy,type:integration,phase:2,good-first-issue" \
  "$(cat <<'BODY'
## Summary

Integrate the **Dewey Decimal Classification (DDC)** system for broad knowledge categorization of beliefs.

**Current Status:** 🔄 Planned
**Priority:** P3 - Backlog (useful for general categorization but potentially too rigid for fluid idea exchange)

## Why This Is P3

Dewey Decimal is the classic library organization system but its rigid hierarchy may not suit the fluid nature of belief debate. It is most valuable as a "fallback" categorization — if no specialized taxonomy applies, DDC provides a reasonable general bucket.

## Requirements

### Definition of Done

- [ ] DDC top-level classes (000-999) and divisions are available as a mapping table
- [ ] Beliefs can be mapped to DDC codes via keyword/AI matching
- [ ] DDC codes stored in `taxonomyMappings`
- [ ] Topic pages show DDC classification as secondary metadata
- [ ] Tests cover DDC classification logic

### Technical Details

- **Structure:** 10 main classes, 100 divisions, 1000 sections
- **Example:** `500 Science > 530 Physics > 539 Modern Physics`
- **Note:** Full DDC is proprietary (OCLC). Use the freely available summaries (first 3 levels)
- **Target field:** `Topic.taxonomyMappings[{ system: 'dewey', code: '530', name: 'Physics', confidence }]`

### Why Good First Issue

- DDC summaries (3 levels) are freely available
- Small static dataset to map
- Simple keyword-based classification to start

## References

- [DDC Summaries (OCLC)](https://www.oclc.org/en/dewey/resources/summaries.html)
BODY
)"

# ============================================================================
# P3 - LEGACY: Library of Congress Subject Headings
# ============================================================================

create_issue \
  "[P3] Integrate Library of Congress Subject Headings (LCSH)" \
  "priority:p3-backlog,area:taxonomy,type:integration,phase:2" \
  "$(cat <<'BODY'
## Summary

Integrate **Library of Congress Subject Headings (LCSH)** for academic-style classification of beliefs.

**Current Status:** 🔄 Planned
**Priority:** P3 - Backlog (academic classification, useful but overlaps with OpenAlex)

## Why This Is P3

LCSH is the standard for academic library cataloging. It provides fine-grained subject headings but has significant overlap with OpenAlex Topics (which is more modern and API-friendly). Implement after OpenAlex if additional academic coverage is needed.

## Requirements

### Definition of Done

- [ ] LCSH data source is identified (LOC Linked Data or MARC files)
- [ ] Subject heading lookup is implemented
- [ ] Beliefs map to LCSH headings with subdivision support
- [ ] LCSH codes stored in `taxonomyMappings`
- [ ] Tests cover LCSH lookup and mapping

### Technical Details

- **API:** [Library of Congress Linked Data Service](https://id.loc.gov/)
- **Data format:** SKOS/RDF or MARC
- **Example:** `sh85046957` = Electric vehicles
- **Target field:** `Topic.taxonomyMappings[{ system: 'lcsh', code: 'sh85046957', name: 'Electric vehicles', confidence }]`

### Considerations

- LCSH is massive (~340,000 headings) — start with top-level subjects
- LOC Linked Data API is free but can be slow
- Consider caching common lookups locally

## References

- [LOC Linked Data Service](https://id.loc.gov/)
- [LCSH Overview](https://www.loc.gov/aba/cataloging/subject/)
BODY
)"

# ============================================================================
# CROSS-CUTTING: Taxonomy Service Implementation
# ============================================================================

create_issue \
  "[P0] Implement Core TaxonomyService for Multi-Taxonomy Classification" \
  "priority:p0-immediate,area:taxonomy,area:data-science,type:feature,phase:2" \
  "$(cat <<'BODY'
## Summary

Implement the core **TaxonomyService** that orchestrates classification of beliefs across multiple taxonomy systems. This is the foundation that all individual taxonomy integrations depend on.

**Priority:** P0 - Immediate (blocks all taxonomy integration work)

## Why This Is P0

Without a unified TaxonomyService, each taxonomy integration would be ad-hoc. This service provides:
- A single `classifyBelief()` entry point
- Parallel taxonomy lookups
- Confidence scoring across systems
- Topic Signature generation (the "idea DNA" described in BELIEF_ORGANIZATION_SYSTEM.md)

## Requirements

### Definition of Done

- [ ] `TaxonomyService` class is created with the interface defined in BELIEF_ORGANIZATION_SYSTEM.md
- [ ] `classifyBelief(statement, description)` returns combined topic signatures
- [ ] `getTopicHierarchy(topicId)` returns full breadcrumb path
- [ ] Plugin architecture allows registering new taxonomy providers
- [ ] Confidence scoring normalizes across different taxonomy systems
- [ ] Caching layer prevents redundant API calls
- [ ] Tests cover classification pipeline and provider registration

### Technical Details

```typescript
interface TaxonomyProvider {
  name: string;           // 'wikipedia', 'mesh', 'dewey', etc.
  classify(statement: string, description?: string): Promise<TaxonomyMapping[]>;
  getHierarchy(code: string): Promise<string[]>;
}

interface TaxonomyMapping {
  system: string;
  code: string;
  name: string;
  path: string[];
  confidence: number;     // 0-1
}

class TaxonomyService {
  private providers: Map<string, TaxonomyProvider>;
  registerProvider(provider: TaxonomyProvider): void;
  classifyBelief(statement: string, description?: string): Promise<TaxonomyMapping[]>;
  getTopicHierarchy(topicId: string): Promise<string[]>;
}
```

- **Location:** `src/core/taxonomy/taxonomy-service.ts`
- **Dependencies:** None (individual providers are separate issues)

### Architecture Decision

Use a **provider/plugin pattern** so new taxonomies can be added without modifying the core service. Each taxonomy issue creates a provider that registers with this service.

## References

- [BELIEF_ORGANIZATION_SYSTEM.md - Taxonomy Service](../docs/BELIEF_ORGANIZATION_SYSTEM.md)
- [Architecture Docs](../docs/ARCHITECTURE.md)
BODY
)"

# ============================================================================
# CROSS-CUTTING: Strength Scoring Service
# ============================================================================

create_issue \
  "[P1] Implement Strength Scoring Service for Claim Intensity" \
  "priority:p1-critical,area:scoring,type:feature,phase:2" \
  "$(cat <<'BODY'
## Summary

Implement the **Strength Scoring Service** that measures how bold/intense a claim is (0-100 scale), independent of whether the claim is true.

**Current Status:** 🔄 Planned (specification complete in BELIEF_ORGANIZATION_SYSTEM.md)
**Priority:** P1 - Critical (required for proper belief organization on topic pages)

## Why This Is P1

Strength scoring enables:
- Sorting beliefs from mild to extreme on topic pages
- Understanding rhetorical intensity vs. factual content
- Identifying hyperbole, hedging, and absolute claims
- Better duplicate detection (same claim at different intensities)

## Requirements

### Definition of Done

- [ ] `StrengthScoringService` class is implemented per the spec
- [ ] Intensifier detection (very, extremely, incredibly → +10 each)
- [ ] Hedge detection (somewhat, perhaps, maybe → -10 each)
- [ ] Superlative detection (best, worst, greatest → +20)
- [ ] Absolute detection (always, never, completely → +15)
- [ ] API endpoint `POST /api/beliefs/calculate-strength` works
- [ ] Existing beliefs can be batch-scored
- [ ] Strength score is displayed on belief cards
- [ ] Tests cover all detection patterns and edge cases

### Technical Details

See full specification in [BELIEF_ORGANIZATION_SYSTEM.md - Section 4](../docs/BELIEF_ORGANIZATION_SYSTEM.md).

- **Location:** `src/core/scoring/strength-scoring.ts`
- **Integrates with:** `src/core/scoring/scoring-engine.ts`

### Test Cases

| Input | Expected Score | Reason |
|-------|---------------|--------|
| "Trump is not very smart" | ~20 | Mild negation |
| "Trump is dumb" | ~40 | Direct negative |
| "Trump is extremely stupid" | ~75 | Strong intensifier |
| "Trump is the dumbest president ever" | ~100 | Superlative + absolute |

## References

- [BELIEF_ORGANIZATION_SYSTEM.md - Strength Score](../docs/BELIEF_ORGANIZATION_SYSTEM.md)
BODY
)"

# ============================================================================
# LINKAGE: Enhanced Comprehensive Linkage
# ============================================================================

create_issue \
  "[P1] Implement People/Stakeholder Tracking for Beliefs" \
  "priority:p1-critical,area:linkage,type:feature,phase:3" \
  "$(cat <<'BODY'
## Summary

Implement tracking of **who agrees/disagrees** with each belief, including public figures, experts, and organizations.

**Current Status:** 🔄 Planned
**Priority:** P1 - Critical (high user value — people want to know who believes what)

## Requirements

### Definition of Done

- [ ] People/Organization model or extension to existing User model
- [ ] Link people to beliefs with agree/disagree/neutral stance
- [ ] Confidence intervals for stance attribution
- [ ] Display on belief pages: "Notable people who agree/disagree"
- [ ] Search by person to see all their positions
- [ ] Source attribution for stance claims (where did they say this?)
- [ ] Tests cover linkage and display

### Acceptance Criteria

1. A belief page for "Climate change is primarily human-caused" shows:
   - Agrees: NASA, IPCC, 97% of climate scientists
   - Disagrees: [listed with sources]
2. Each stance attribution links to a source (speech, paper, tweet)
BODY
)"

create_issue \
  "[P2] Implement Values Analysis for Belief Supporters/Opponents" \
  "priority:p2-important,area:linkage,type:feature,phase:3" \
  "$(cat <<'BODY'
## Summary

Implement **values analysis** that identifies what values (freedom, equality, safety, prosperity) drive supporters vs. opponents of each belief.

**Current Status:** 🔄 Planned
**Priority:** P2 - Important

## Requirements

### Definition of Done

- [ ] Values taxonomy defined (based on established frameworks like Schwartz values)
- [ ] Beliefs linked to underlying values
- [ ] Topic pages show "Values at stake" section
- [ ] Value conflicts between opposing sides are highlighted
- [ ] Tests cover value classification
BODY
)"

create_issue \
  "[P2] Implement Cost-Benefit Quantification for Beliefs" \
  "priority:p2-important,area:linkage,type:feature,phase:3" \
  "$(cat <<'BODY'
## Summary

Implement **quantified cost-benefit analysis** linked to beliefs, building on the existing CBA feature.

**Current Status:** 🔄 Planned (CBA feature exists at `src/features/cost-benefit-analysis/`)
**Priority:** P2 - Important

## Requirements

### Definition of Done

- [ ] Link CBA module outputs to specific beliefs
- [ ] Display expected value calculations on belief pages
- [ ] Aggregate cost/benefit data across related beliefs in a topic
- [ ] Allow users to submit quantified impacts
- [ ] Tests cover CBA-belief linkage

## References

- Existing CBA code: `src/features/cost-benefit-analysis/`
BODY
)"

create_issue \
  "[P2] Implement Cognitive Bias Detection for Arguments" \
  "priority:p2-important,area:scoring,area:data-science,type:feature,phase:3" \
  "$(cat <<'BODY'
## Summary

Detect **cognitive biases** (confirmation bias, anchoring, availability heuristic, etc.) in arguments and surface them as context for readers.

**Current Status:** 🔄 Planned (fallacy detection exists for logical fallacies; this extends to cognitive biases)
**Priority:** P2 - Important

## Requirements

### Definition of Done

- [ ] Cognitive bias taxonomy defined (based on established literature)
- [ ] Detection algorithm for common biases (at least: confirmation bias, anchoring, availability heuristic, bandwagon effect, sunk cost)
- [ ] Bias indicators displayed on argument cards
- [ ] Bias frequency shown in topic-level analytics
- [ ] Tests cover bias detection patterns

## References

- Existing fallacy detection provides a pattern to follow
- [Wikipedia: List of Cognitive Biases](https://en.wikipedia.org/wiki/List_of_cognitive_biases)
BODY
)"

create_issue \
  "[P3] Implement Obstacle Identification for Belief Resolution" \
  "priority:p3-backlog,area:linkage,type:feature,phase:3" \
  "$(cat <<'BODY'
## Summary

Identify and track **obstacles/barriers** that prevent resolution of debates, separate from arguments themselves.

**Current Status:** 🔄 Planned
**Priority:** P3 - Backlog

## Requirements

### Definition of Done

- [ ] Obstacle model (data access, political will, measurement difficulty, etc.)
- [ ] Link obstacles to specific beliefs/topics
- [ ] Display obstacles on topic pages as "Why this debate persists"
- [ ] Tests cover obstacle CRUD and linkage
BODY
)"

create_issue \
  "[P3] Implement Books & Media Linkage (Phase 4)" \
  "priority:p3-backlog,area:linkage,type:feature,phase:4" \
  "$(cat <<'BODY'
## Summary

Link **books, articles, videos, podcasts, and other media** to beliefs as supporting or opposing evidence.

**Current Status:** 🔄 Planned (Phase 4). Book analysis feature exists at `src/features/books/`.
**Priority:** P3 - Backlog

## Requirements

### Definition of Done

- [ ] Media model supports multiple types (book, article, video, podcast)
- [ ] Integrate with existing book service (`src/features/books/services/`)
- [ ] Link media items to beliefs with support/oppose/reference relationship
- [ ] Display "Further Reading" and "Watch/Listen" sections on belief pages
- [ ] ISBN/DOI/URL lookup for automatic metadata
- [ ] Tests cover media linkage

## References

- Existing book feature: `src/features/books/`
BODY
)"

create_issue \
  "[P2] Implement Interest/Stakeholder Mapping for Beliefs" \
  "priority:p2-important,area:linkage,type:feature,phase:3" \
  "$(cat <<'BODY'
## Summary

Map **stakeholder interests** (who benefits, who is harmed) for each belief to provide transparent analysis of incentive structures.

**Current Status:** 🔄 Planned
**Priority:** P2 - Important

## Requirements

### Definition of Done

- [ ] Stakeholder/Interest model with benefit/harm spectrum
- [ ] Link interests to beliefs
- [ ] Display "Who benefits?" and "Who is affected?" on belief pages
- [ ] Aggregate stakeholder analysis on topic pages
- [ ] Tests cover stakeholder mapping

## References

- Interest type defined in `src/core/types/ise-core.ts`
BODY
)"

# ============================================================================
# UI: Advanced Visualization
# ============================================================================

create_issue \
  "[P2] Implement Enhanced Topic Page Organization (Sort by Polarity, Strength, Generality)" \
  "priority:p2-important,area:ui,area:taxonomy,type:feature,phase:2" \
  "$(cat <<'BODY'
## Summary

Enhance topic pages to sort and organize beliefs by **polarity** (positive/negative), **strength** (mild/extreme), and **generality** (general/specific) as described in the Belief Organization System.

**Current Status:** ⚠️ Partial (basic topic pages exist, enhanced organization planned)
**Priority:** P2 - Important

## Requirements

### Definition of Done

- [ ] Topic page shows beliefs grouped: Positive → Neutral → Negative
- [ ] Within each group, beliefs sorted by strength score
- [ ] Generality slider/filter (general ↔ specific)
- [ ] Aggregate statistics displayed (total beliefs, avg score, sentiment distribution)
- [ ] API endpoint `GET /api/topics/:id/organized` returns sorted data
- [ ] Tests cover sorting and filtering logic

## References

- [BELIEF_ORGANIZATION_SYSTEM.md - Section 2: Topic Pages](../docs/BELIEF_ORGANIZATION_SYSTEM.md)
BODY
)"

create_issue \
  "[P3] Implement Evidence Quality Tier Classification" \
  "priority:p3-backlog,area:scoring,type:feature,phase:2" \
  "$(cat <<'BODY'
## Summary

Implement the **4-tier evidence quality classification** (Gold Standard → Lower Quality) described in the Belief Organization System.

**Current Status:** 🔄 Planned (credibility scoring exists, tier classification planned)
**Priority:** P3 - Backlog

## Requirements

### Definition of Done

- [ ] Evidence automatically classified into Tier 1-4 based on source type
- [ ] Tier badges displayed on evidence cards (⭐ rating)
- [ ] Topic pages show evidence breakdown by tier
- [ ] Evidence quality factors into conclusion score weighting
- [ ] Tests cover tier classification logic

## Tier Definitions

- **Tier 1 (⭐⭐⭐⭐⭐):** Meta-analyses, RCTs, official government data
- **Tier 2 (⭐⭐⭐⭐):** Expert analysis, institutional reports, peer-reviewed studies
- **Tier 3 (⭐⭐⭐):** Investigative journalism, surveys, expert opinions
- **Tier 4 (⭐⭐):** Opinion pieces, anecdotal evidence, blog posts

## References

- [BELIEF_ORGANIZATION_SYSTEM.md - Evidence Quality Tiers](../docs/BELIEF_ORGANIZATION_SYSTEM.md)
- Existing credibility scoring in scoring engine
BODY
)"

create_issue \
  "[P2] Implement Sentiment Analysis API Integration" \
  "priority:p2-important,area:scoring,area:data-science,type:feature,phase:2" \
  "$(cat <<'BODY'
## Summary

Enhance the existing basic sentiment polarity calculation with a proper **sentiment analysis API** or NLP library for more accurate positive/negative/neutral classification.

**Current Status:** ⚠️ Partial (basic calculation exists, enhanced algorithm planned)
**Priority:** P2 - Important

## Requirements

### Definition of Done

- [ ] Evaluate and select sentiment analysis approach (API vs. local NLP library)
- [ ] Implement enhanced sentiment scoring (-100 to +100 scale)
- [ ] Handle nuanced cases: sarcasm detection, conditional statements, comparative claims
- [ ] Batch re-score existing beliefs
- [ ] API endpoint `POST /api/beliefs/:id/update-scores` works
- [ ] Tests cover sentiment edge cases

## References

- [BELIEF_ORGANIZATION_SYSTEM.md - Section 5: Positivity/Negativity](../docs/BELIEF_ORGANIZATION_SYSTEM.md)
- Existing sentiment code in belief model
BODY
)"

# ============================================================================
# INFRASTRUCTURE: Issue Templates
# ============================================================================

create_issue \
  "[P1] Set Up GitHub Issue Templates and Project Board" \
  "priority:p1-critical,type:infrastructure" \
  "$(cat <<'BODY'
## Summary

Set up GitHub Issue Templates for taxonomy/feature work and a GitHub Projects board to track the taxonomy integration roadmap.

**Priority:** P1 - Critical (enables organized contributor workflow)

## Requirements

### Definition of Done

- [ ] Bug report issue template created
- [ ] Feature request issue template created
- [ ] Taxonomy integration issue template created
- [ ] GitHub Projects board created with columns: Backlog, In Progress, Review, Done
- [ ] Existing taxonomy issues are added to the board
- [ ] Labels are created and documented in CONTRIBUTING.md
- [ ] CONTRIBUTING.md updated with issue/PR workflow

## Note

Labels and issue templates have been prepared in `.github/ISSUE_TEMPLATE/`.
Run `scripts/create-taxonomy-issues.sh` to create all planned issues.
BODY
)"

echo ""
echo "============================================"
if $DRY_RUN; then
  echo "DRY RUN COMPLETE - No issues were created"
  echo "Run without --dry-run to create all issues"
else
  echo "All issues created successfully!"
  echo "View at: https://github.com/$REPO/issues"
fi
echo "============================================"
