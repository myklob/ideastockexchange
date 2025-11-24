# Testing Guide

This guide helps you test the IdeaStockExchange Fact Checker extension.

## Quick Test

### 1. Install and Verify

```bash
# Check extension is loaded
1. Open chrome://extensions/
2. Verify "IdeaStockExchange Fact Checker" is enabled
3. Click extension icon - popup should open
```

### 2. Test on Sample Text

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Extension Test Page</title>
</head>
<body>
  <h1>Test Claims</h1>

  <p>Some people believe that vaccines cause autism, but this has been thoroughly debunked.</p>

  <p>There are also those who think climate change is a hoax, despite overwhelming scientific evidence.</p>

  <p>Interestingly, some still believe the Earth is flat, even though we have satellite images.</p>

  <p>The moon landing was faked according to conspiracy theorists, but this ignores physical evidence.</p>

  <p>Many worry that 5G causes health problems, though studies show no evidence of harm.</p>

  <p>Some avoid GMOs because they think GMO foods are unsafe, despite scientific consensus.</p>
</body>
</html>
```

Save as `test.html` and open in browser. You should see:
- 6 claims highlighted in yellow
- Tooltips on hover
- Links to analysis pages

## Detailed Testing

### Content Script Tests

**Test 1: Basic Detection**
- Open test.html
- Verify claims are highlighted
- Check console: should show "Loaded X claims"

**Test 2: Dynamic Content**
- Open Twitter or Reddit
- Scroll through feed
- Verify new content is scanned
- Claims should be highlighted as they load

**Test 3: Tooltip Display**
- Hover over highlighted text
- Tooltip should appear
- Should show:
  - Claim title
  - Description
  - Reasons for/against
  - Confidence score
  - Link to analysis

**Test 4: Tooltip Positioning**
- Hover near top of page (tooltip below)
- Hover near bottom (tooltip above)
- Hover near right edge (tooltip left-aligned)
- Should never go off-screen

**Test 5: Multiple Claims**
- Find page with multiple claims
- Each should have independent tooltip
- No overlapping or conflicts

### Background Script Tests

**Test 1: Database Loading**
```javascript
// Open extension background page console
// Chrome: chrome://extensions/ > Details > Inspect views: background page

// Check database loaded
chrome.runtime.sendMessage({action: 'getClaimsDatabase'}, console.log);
// Should return {claims: [...]} with multiple entries
```

**Test 2: Claim Search**
```javascript
chrome.runtime.sendMessage({
  action: 'searchClaims',
  query: 'vaccine'
}, console.log);
// Should return matching claims
```

**Test 3: Database Update**
```javascript
chrome.runtime.sendMessage({action: 'updateDatabase'}, console.log);
// Should return {success: true}
```

### Popup Tests

**Test 1: Toggle Functionality**
- Click extension icon
- Toggle detection off
- Refresh page - no highlights
- Toggle back on
- Refresh page - highlights return

**Test 2: Statistics**
- Popup should show:
  - Total claims (8 initially)
  - Detections today (starts at 0)

**Test 3: Search**
- Type "vaccine" in search box
- Should show matching claim
- Click result - opens analysis page

**Test 4: Refresh Button**
- Click "Refresh Database"
- Should see "Updating..."
- Should complete with success message

### Browser Compatibility

Test on multiple browsers:

- [ ] Chrome (latest)
- [ ] Chrome (1-2 versions old)
- [ ] Edge (latest)
- [ ] Brave (latest)
- [ ] Firefox (latest)

Check for:
- Extension loads without errors
- Detection works correctly
- UI displays properly
- No console errors

### Performance Tests

**Test 1: Large Pages**
- Open Wikipedia article (long page)
- Check CPU usage (should be minimal)
- Scroll through page (should be smooth)

**Test 2: Dynamic Sites**
- Open Twitter/Reddit feed
- Scroll continuously for 1 minute
- Check memory usage (should be stable)

**Test 3: Multiple Tabs**
- Open 10+ tabs with different sites
- Extension should work in all tabs
- No performance degradation

### Edge Cases

**Test 1: Special Characters**
Text with: "vaccines cause autism?"
- Should still detect despite punctuation

**Test 2: Case Variations**
- "Vaccines Cause Autism"
- "VACCINES CAUSE AUTISM"
- "vaccines cause autism"
All should be detected

**Test 3: Partial Matches**
- "some vaccines cause autism" ✓ should match
- "vaccines can cause autism" ✓ should match
- "vaccines autism link" ✗ should not match (too vague)

**Test 4: Nested HTML**
```html
<p>Some <strong>vaccines</strong> cause <em>autism</em></p>
```
Should detect across inline elements

**Test 5: No Content**
- Blank page
- Should not crash
- No errors in console

## Automated Testing (Future)

When we add automated tests, they'll cover:

```javascript
// Example test structure
describe('ClaimDetector', () => {
  it('detects vaccine-autism claim', () => {
    const text = 'vaccines cause autism';
    const matches = detector.findClaimsInText(text);
    expect(matches.length).toBe(1);
    expect(matches[0].claim.id).toBe('vaccines-autism');
  });

  it('does not false positive', () => {
    const text = 'vaccines prevent diseases';
    const matches = detector.findClaimsInText(text);
    expect(matches.length).toBe(0);
  });
});
```

## Regression Testing

Before each release, verify:

1. **All existing claims still detect**
   - Run through test.html
   - All 8 sample claims highlighted

2. **No new console errors**
   - Check background page console
   - Check content script console
   - No red errors

3. **Settings persist**
   - Toggle off detection
   - Close browser
   - Reopen - should stay off

4. **Database updates work**
   - Click refresh
   - Verify no errors
   - Check stats update

## Reporting Bugs

When filing a bug report, include:

1. **Browser and version**
   - Chrome 120.0.6099.109

2. **Steps to reproduce**
   1. Open extension
   2. Click X
   3. See error

3. **Expected behavior**
   - Should show Y

4. **Actual behavior**
   - Shows Z instead

5. **Console output**
   - Copy any errors from console

6. **Screenshots**
   - If UI issue, include screenshot

## Performance Benchmarks

Target metrics:
- Initial page scan: < 100ms
- Tooltip display: < 16ms (60fps)
- Memory usage: < 50MB
- CPU usage: < 5% during scroll

Use Chrome DevTools:
- Performance tab for profiling
- Memory tab for leak detection
- Network tab (should be no requests for detection)

## Security Testing

Verify:
- No external requests during detection
- No data sent to servers
- localStorage only stores non-sensitive data
- No eval() or dangerous code execution

## Accessibility Testing

Check:
- Tooltips have proper ARIA labels
- Extension works with screen readers
- Keyboard navigation functional
- Sufficient color contrast

## Test Coverage Goals

- Unit tests: 80%+
- Integration tests: Key user flows
- E2E tests: Critical paths
- Manual tests: Edge cases

---

**Happy Testing!** 🧪

If you find issues, please report them on GitHub.
