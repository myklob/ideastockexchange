# Installation Guide

## Quick Start (5 minutes)

### For Chrome, Edge, or Brave

1. **Download the extension**
   - Clone this repository or download as ZIP
   - If ZIP, extract to a folder you'll keep (don't delete it!)

2. **Open Extensions Page**
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`

3. **Enable Developer Mode**
   - Look for a toggle in the top-right corner
   - Turn it ON

4. **Load Extension**
   - Click "Load unpacked" button
   - Select the folder containing `manifest.json`

5. **Done!**
   - Extension icon should appear in toolbar
   - Pin it for easy access
   - Visit any website to see it in action

### For Firefox

1. **Download the extension**
   - Clone or download this repository

2. **Open Debug Page**
   - Type `about:debugging` in the address bar
   - Click "This Firefox" in the sidebar

3. **Load Temporary Add-on**
   - Click "Load Temporary Add-on..."
   - Navigate to folder and select `manifest.json`

4. **Note**: Firefox temporary add-ons are removed when browser closes
   - For permanent install, extension needs Mozilla signing
   - Reload each browser session for development

## Verification

After installation, test it:

1. **Check the icon**
   - Should appear in browser toolbar
   - Click it to open popup

2. **Visit a test page**
   - Go to a news site or Reddit
   - Look for yellow highlighted text

3. **Test detection**
   - Search for text containing: "vaccines cause autism"
   - Should be highlighted if present

4. **Check console**
   - Press F12 to open DevTools
   - Look for "IdeaStockExchange" messages
   - Should see "Loaded X claims from cache"

## Troubleshooting

### Extension icon doesn't appear
- Refresh extensions page
- Make sure you selected the correct folder
- Check that manifest.json is in the root of the folder

### No claims are highlighted
- Click extension icon and verify it's enabled
- Refresh the web page you're viewing
- Check browser console (F12) for errors

### Icons missing (grey square)
- This is normal - placeholder icons are used
- Extension still works perfectly
- Custom icons can be added later

### Permission warnings
- Extension needs access to web pages to detect claims
- This is normal and required for functionality
- No data is sent anywhere - all processing is local

## Updating

When new versions are released:

1. **Pull latest changes**
   ```bash
   cd ideastockexchange
   git pull origin main
   ```

2. **Reload extension**
   - Go to extensions page
   - Click reload icon on the extension card
   - OR disable/enable the extension

## Uninstalling

1. Go to extensions page
2. Find "IdeaStockExchange Fact Checker"
3. Click "Remove"
4. Confirm deletion

## Next Steps

- Read [README.md](README.md) for full documentation
- Browse to your favorite websites to see claims detected
- Check out [CONTRIBUTING.md](CONTRIBUTING.md) to add more claims
- Join our community to discuss improvements

## Platform-Specific Tips

### Chrome
- Works great, no known issues
- Can sync settings across devices (future feature)

### Edge
- Identical to Chrome
- Built on same engine (Chromium)

### Brave
- Works perfectly
- Built on Chromium
- Privacy features don't interfere

### Firefox
- Temporary install only (for now)
- Needs reload each browser session
- Full support coming soon

## Common Questions

**Q: Do I need an account?**
A: No, the extension works immediately without any signup.

**Q: Does this track my browsing?**
A: No, everything runs locally in your browser.

**Q: How often is the database updated?**
A: Currently using local database. API integration coming soon.

**Q: Can I use this at work/school?**
A: Yes, but check your organization's policy on browser extensions.

**Q: Does it slow down my browser?**
A: Minimal impact - only scans visible text, not entire pages.

## Need Help?

- Open an issue on GitHub
- Check existing issues for solutions
- Join our Discord (coming soon)
- Email: support@ideastockexchange.com
