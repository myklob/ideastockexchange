---
name: Taxonomy Integration
about: Propose or implement a new taxonomy system integration
title: "[Taxonomy] "
labels: area:taxonomy, type:integration
assignees: ''
---

## Taxonomy System

**Name:**
**API/Source:**
**Coverage area:** (e.g., general knowledge, medical, academic)

## Current Status

- [ ] Research complete
- [ ] API access confirmed
- [ ] Schema mapping designed

## Requirements

### Classification

- [ ] Beliefs can be classified against this taxonomy
- [ ] Classification has confidence scores (0-1)
- [ ] Mappings stored in `Topic.taxonomyMappings`

### Integration

- [ ] TaxonomyProvider implemented and registered with TaxonomyService
- [ ] Rate limiting / caching handled
- [ ] Existing beliefs backfilled

### UI

- [ ] Taxonomy labels shown on belief pages
- [ ] Taxonomy hierarchy shown on topic pages

### Testing

- [ ] Unit tests for classification logic
- [ ] Integration tests for end-to-end flow

## Example Classification

Given the belief: "..."

Expected taxonomy mapping:
- Code:
- Name:
- Path:
- Confidence:

## References

- API docs:
- Related issues:
