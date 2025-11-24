# Contributing to IdeaStockExchange Fact Checker

Thank you for your interest in contributing! This extension aims to improve online discourse by making discussions cumulative rather than repetitive.

## Ways to Contribute

### 1. Add New Claims to Detect

The easiest way to contribute is adding more beliefs/claims to the database.

**Process:**
1. Identify a common claim or belief worth tracking
2. Write clear title and description
3. Create regex patterns to detect it
4. Add supporting data (reasons for/against, evidence score)
5. Submit via Pull Request

**Example:**

```javascript
{
  id: 'drinking-8-glasses-water',
  title: 'You need to drink 8 glasses of water daily',
  description: 'The "8 glasses a day" rule lacks scientific basis. Hydration needs vary by person, activity, and climate.',
  url: 'https://ideastockexchange.com/w/page/hydration-myth',
  patterns: [
    'drink (?:8|eight) (?:glasses|cups) (?:of )?water (?:a|per|each) day',
    '8 glasses (?:of )?water (?:is|are) (?:necessary|required|needed)',
    'everyone (?:needs|should drink) (?:8|eight) glasses'
  ],
  confidence: 0.82,
  reasonsFor: 8,
  reasonsAgainst: 23,
  evidenceScore: 0.65,
  category: 'health'
}
```

### 2. Improve Pattern Matching

Make detection more accurate by:
- Reducing false positives
- Catching more variations
- Improving regex efficiency
- Adding contextual filters

### 3. Enhance UI/UX

Help make the extension more user-friendly:
- Better tooltip designs
- Improved popup interface
- Settings page implementation
- Accessibility features
- Dark mode support

### 4. Performance Optimization

Speed up the extension:
- Optimize text scanning algorithms
- Reduce memory usage
- Improve caching strategies
- Minimize DOM manipulation

### 5. Write Tests

Help ensure quality:
- Unit tests for detection logic
- Integration tests for UI
- Performance benchmarks
- Cross-browser compatibility tests

### 6. Documentation

Improve project docs:
- Fix typos and unclear explanations
- Add examples and screenshots
- Create video tutorials
- Translate to other languages

## Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/ideastockexchange.git
   cd ideastockexchange
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes**
   - Edit code in your preferred editor
   - Test in browser (load unpacked extension)

4. **Test thoroughly**
   - Test on multiple websites
   - Check console for errors
   - Verify existing claims still work

5. **Commit and push**
   ```bash
   git add .
   git commit -m "Add: description of your changes"
   git push origin feature/your-feature-name
   ```

6. **Open Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Describe your changes
   - Wait for review

## Coding Standards

### JavaScript Style

- Use modern ES6+ syntax
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

```javascript
// Good
const detectClaimsInText = (text, patterns) => {
  const matches = [];
  // Detection logic...
  return matches;
};

// Avoid
var x = function(t, p) {
  var m = [];
  // ...
  return m;
};
```

### CSS Style

- Use clear, descriptive class names
- Prefix extension classes with `ise-`
- Keep specificity low
- Group related properties

```css
/* Good */
.ise-claim-detected {
  background-color: #fff3cd;
  border-bottom: 2px dotted #ff9800;
}

/* Avoid */
div.detected {
  background: yellow;
}
```

### Commit Messages

Follow this format:
- `Add: new feature or file`
- `Update: modification to existing feature`
- `Fix: bug fix`
- `Refactor: code restructuring`
- `Docs: documentation changes`

```bash
# Good
git commit -m "Add: detection for climate change claims"
git commit -m "Fix: tooltip positioning on mobile devices"

# Avoid
git commit -m "changes"
git commit -m "wip"
```

## Claim Submission Guidelines

When adding new claims:

### 1. Verify It's Worth Detecting

Ask:
- Is this a common belief people discuss online?
- Does it have substantial evidence on both sides?
- Would analysis help improve understanding?
- Is it not too niche or too broad?

### 2. Research Thoroughly

- Find authoritative sources
- Count actual arguments for/against
- Assess evidence quality
- Check existing analysis pages

### 3. Write Clear Descriptions

```javascript
// Good
description: 'Scientific studies show no link between vaccines and autism. The original study was retracted due to fraud.'

// Avoid
description: 'This is wrong and debunked.'
```

### 4. Create Robust Patterns

Test patterns against:
- Expected matches (should match)
- Similar phrases (should/shouldn't match)
- Edge cases (punctuation, capitalization)

Use [regex101.com](https://regex101.com) to test.

### 5. Set Realistic Confidence

- 0.9-1.0: Exact phrase, very specific
- 0.8-0.89: Close match, minor variations
- 0.7-0.79: Good match, some ambiguity
- Below 0.7: Consider refining pattern

### 6. Include Analysis URL

- Link to detailed analysis page
- Ensure URL is permanent
- Verify page exists and is comprehensive

## Pull Request Checklist

Before submitting:

- [ ] Code follows style guidelines
- [ ] All existing tests still pass
- [ ] New tests added for new features
- [ ] Documentation updated if needed
- [ ] Tested in at least one browser
- [ ] No console errors
- [ ] Commit messages are clear
- [ ] PR description explains changes

## Review Process

1. **Automated checks** run first
2. **Maintainer review** within 1-3 days
3. **Feedback** provided if changes needed
4. **Approval** and merge when ready

## Community Guidelines

- Be respectful and constructive
- Focus on ideas, not people
- Welcome newcomers
- Assume good intentions
- Help others learn

## Questions?

- Open a GitHub Discussion
- Comment on related issues
- Check existing documentation
- Ask in pull request comments

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Thanked in community updates

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for helping make online discussions better!** 🎉
