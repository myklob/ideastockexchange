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

echo ""
echo "Done! Created 1 issue."
echo "View issues at: gh issue list"
