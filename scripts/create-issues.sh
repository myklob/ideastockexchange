#!/bin/bash
# Create GitHub Issues from documented TODOs
# Requires: gh CLI authenticated (gh auth login)

set -e

# Check if gh is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Install with: brew install gh (macOS) or see https://cli.github.com/"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "Creating GitHub Issues from documented TODOs..."

# Issue 1: HTML Parsing for Topic Updates
echo "Creating Issue 1: HTML Parsing for Topic Updates..."
gh issue create \
  --title "feat(ai): Implement HTML parsing for topic updates" \
  --body "**Location**: \`src/core/ai/generator.py:166\`

When updating an existing topic, parse the existing HTML to extract data rather than always regenerating with new beliefs. This will preserve existing content while allowing incremental updates.

**Acceptance Criteria**:
- [ ] Parse existing HTML file to extract belief data
- [ ] Merge new beliefs with existing data
- [ ] Preserve manually edited content where appropriate" \
  --label "enhancement"

# Issue 2: Sub-Argument Scoring Implementation
echo "Creating Issue 2: Sub-Argument Scoring Implementation..."
gh issue create \
  --title "feat(scoring): Implement evidence-based sub-argument scoring" \
  --body "**Reference**: \`docs/wiki/Truth-Score.md:46\`

Implement the scoring logic for sub-arguments that uses evidence quality and relevance to compute scores.

**Acceptance Criteria**:
- [ ] Integrate evidence verification scores (EVS)
- [ ] Apply fallacy penalties to sub-arguments
- [ ] Recursive scoring for nested sub-arguments
- [ ] Unit tests for scoring edge cases" \
  --label "enhancement"

# Issue 3: ML Fallacy Detection
echo "Creating Issue 3: ML Fallacy Detection..."
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
  --label "enhancement"

echo ""
echo "Done! Created 3 issues."
echo "View issues at: gh issue list"
