# Issues Roadmap

This document tracks TODO items that should be converted to GitHub Issues for proper task management.

## How to Convert to GitHub Issues

Once you have GitHub CLI configured, run:

```bash
./scripts/create-issues.sh
```

Or manually create issues using the GitHub web interface.

---

## Active TODOs

### Core Implementation

#### 1. HTML Parsing for Topic Updates
- **Location**: `src/core/ai/generator.py:166`
- **Priority**: Medium
- **Description**: Implement parsing of existing HTML to extract data when updating topics, rather than always regenerating with new beliefs.
- **Labels**: `enhancement`, `core`

### Scoring System

#### 2. Sub-Argument Scoring Logic
- **Location**: `docs/wiki/Truth-Score.md:46` (reference implementation)
- **Priority**: High
- **Description**: Implement the scoring logic for sub-arguments using evidence. This is critical for the Truth Score calculation.
- **Labels**: `enhancement`, `scoring`, `priority-high`

#### 3. ML Fallacy Detection
- **Location**: `docs/wiki/Truth-Score.md:60` (reference implementation)
- **Priority**: Low
- **Description**: Implement machine learning-based fallacy detection for arguments. Currently returns an empty array.
- **Labels**: `enhancement`, `ml`, `future`

---

## Issue Creation Script

The following issues should be created:

```bash
# Issue 1: HTML Parsing for Topic Updates
gh issue create \
  --title "feat(ai): Implement HTML parsing for topic updates" \
  --body "**Location**: \`src/core/ai/generator.py:166\`

When updating an existing topic, parse the existing HTML to extract data rather than always regenerating with new beliefs. This will preserve existing content while allowing incremental updates.

**Acceptance Criteria**:
- [ ] Parse existing HTML file to extract belief data
- [ ] Merge new beliefs with existing data
- [ ] Preserve manually edited content where appropriate" \
  --label "enhancement" \
  --label "core"

# Issue 2: Sub-Argument Scoring Implementation
gh issue create \
  --title "feat(scoring): Implement evidence-based sub-argument scoring" \
  --body "**Reference**: \`docs/wiki/Truth-Score.md:46\`

Implement the scoring logic for sub-arguments that uses evidence quality and relevance to compute scores.

**Acceptance Criteria**:
- [ ] Integrate evidence verification scores (EVS)
- [ ] Apply fallacy penalties to sub-arguments
- [ ] Recursive scoring for nested sub-arguments
- [ ] Unit tests for scoring edge cases" \
  --label "enhancement" \
  --label "scoring" \
  --label "priority-high"

# Issue 3: ML Fallacy Detection
gh issue create \
  --title "feat(ml): Implement ML-based fallacy detection" \
  --body "**Reference**: \`docs/wiki/Truth-Score.md:60\`

Replace the placeholder fallacy detection with an ML-based system that can identify common logical fallacies in arguments.

**Potential Approaches**:
- Fine-tuned LLM for fallacy classification
- Rule-based detection for common patterns
- Hybrid approach with confidence scores

**Acceptance Criteria**:
- [ ] Detect at least 5 common fallacy types
- [ ] Return confidence score for each detection
- [ ] Provide explanation for detected fallacies
- [ ] Integration with scoring engine" \
  --label "enhancement" \
  --label "ml" \
  --label "future"
```

---

## Completed TODOs

_Move items here when corresponding GitHub Issues are created and linked._
