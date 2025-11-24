# IdeaStockExchange Fact Checker Browser Extension

A browser extension that automatically detects beliefs and claims in web content and links them to comprehensive, structured analysis pages. This tool helps combat misinformation by connecting scattered online discussions to a centralized knowledge base where arguments are evaluated systematically.

## 🎯 Purpose

Online discussions today suffer from a fundamental problem: **every conversation starts from zero**. Arguments are repeated endlessly across millions of threads, with no cumulative progress or shared memory.

This extension solves that by:
- Detecting common beliefs/claims as people browse the web
- Providing instant access to structured analysis pages
- Linking evidence, counterarguments, and related beliefs
- Building on existing knowledge instead of restarting each debate

## ✨ Features

- **Automatic Claim Detection**: Identifies beliefs and claims in text across any website
- **Inline Highlighting**: Visually marks detected claims with subtle, non-intrusive highlighting
- **Rich Tooltips**: Hover over highlighted text to see analysis preview with:
  - Claim title and description
  - Number of reasons for/against
  - Confidence score
  - Direct link to full analysis
- **Real-time Updates**: Monitors dynamic content (social media feeds, comments, etc.)
- **Privacy-Focused**: All processing happens locally; no browsing data sent to servers
- **Customizable**: Toggle detection on/off, search claims database

## 🚀 Installation

### Chrome/Edge/Brave (Developer Mode)

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/yourusername/ideastockexchange.git
   cd ideastockexchange
   ```

2. **Open your browser's extension page**
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`
   - Brave: Navigate to `brave://extensions/`

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right

4. **Load the extension**
   - Click "Load unpacked"
   - Select the `ideastockexchange` folder

5. **Verify installation**
   - You should see the IdeaStockExchange icon in your toolbar
   - Click it to open the popup and verify it's working

### Firefox

1. **Clone or download this repository**

2. **Open Firefox's debugging page**
   - Navigate to `about:debugging#/runtime/this-firefox`

3. **Load temporary add-on**
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the extension folder

Note: For permanent installation in Firefox, the extension needs to be signed by Mozilla.

## 📖 How to Use

### Basic Usage

1. **Browse normally** - The extension works automatically on all websites
2. **Look for highlights** - Claims are highlighted with a yellow underline
3. **Hover for details** - Tooltips show analysis previews
4. **Click links** - Open full analysis pages to explore arguments

### Extension Popup

Click the extension icon to access:
- **Status Toggle**: Enable/disable detection
- **Database Stats**: View total claims and daily detections
- **Search**: Look up specific claims
- **Refresh**: Update claims database

### Examples

The extension currently detects claims like:

- "Vaccines cause autism"
- "Climate change is a hoax"
- "The Earth is flat"
- "5G causes health problems"
- "GMO foods are unsafe"
- And many more...

## 🏗️ Architecture

```
┌─────────────────┐
│   Web Page      │
│  (Any Site)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Content Script         │
│  • Scans page text      │
│  • Detects claims       │
│  • Highlights matches   │
│  • Shows tooltips       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Background Service     │
│  • Manages DB           │
│  • Handles API calls    │
│  • Syncs data           │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Claims Database        │
│  • Belief pages         │
│  • Evidence scores      │
│  • Linkage scores       │
└─────────────────────────┘
```

## 🗄️ Claims Database Structure

Each claim in the database includes:

```javascript
{
  id: 'unique-identifier',
  title: 'Human-readable claim',
  description: 'Brief explanation',
  url: 'Link to full analysis page',
  patterns: ['regex patterns for detection'],
  confidence: 0.9,  // 0-1 score
  reasonsFor: 12,
  reasonsAgainst: 64,
  evidenceScore: 0.92,
  category: 'science|health|politics|etc'
}
```

## 🔧 Development

### File Structure

```
ideastockexchange/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (database management)
├── content.js            # Content script (claim detection)
├── content.css           # Styling for highlights/tooltips
├── popup.html            # Extension popup UI
├── popup.css             # Popup styling
├── popup.js              # Popup logic
├── icons/                # Extension icons
└── README.md             # This file
```

### Adding New Claims

To add claims to the database, edit `background.js`:

```javascript
{
  id: 'my-new-claim',
  title: 'The claim title',
  description: 'Brief description of the analysis',
  url: 'https://ideastockexchange.com/w/page/my-claim',
  patterns: [
    'regex pattern 1',
    'regex pattern 2'
  ],
  confidence: 0.85,
  reasonsFor: 5,
  reasonsAgainst: 20,
  evidenceScore: 0.78,
  category: 'science'
}
```

### Pattern Matching

The extension uses regex patterns to detect claims. Tips:

- Use `?:` for non-capturing groups
- Make patterns flexible: `vaccines? cause autism` matches both singular/plural
- Test patterns at [regex101.com](https://regex101.com)
- Be specific enough to avoid false positives

### API Integration

The extension is designed to work with a backend API. To connect:

1. Update `apiEndpoint` in `background.js`
2. Implement API endpoints:
   - `GET /claims` - Return all claims
   - `GET /claims/:id` - Return specific claim
   - `POST /claims/search` - Search claims

## 🎨 Customization

### Change Highlight Color

Edit `content.css`:

```css
.ise-claim-detected {
  background-color: #your-color;
  border-bottom-color: #your-border-color;
}
```

### Adjust Confidence Threshold

Edit `content.js` to filter low-confidence matches:

```javascript
const matches = this.findClaimsInText(text)
  .filter(match => match.confidence >= 0.7);
```

### Modify Tooltip Style

Edit `content.css` and adjust `.ise-tooltip` styles.

## 🌐 Platform-Specific Notes

### Twitter/X
- Works on tweets and replies
- Handles dynamic loading

### Reddit
- Detects claims in posts and comments
- Supports old.reddit.com and new interface

### Facebook
- Requires page reload after initial load
- May need adjustments for infinite scroll

### News Sites
- Works on article text
- Ignores ads and navigation

## 🔒 Privacy

- **No data collection**: The extension doesn't track your browsing
- **Local processing**: Claim detection happens in your browser
- **Optional analytics**: Can be enabled in settings (future feature)
- **Open source**: All code is reviewable

## 🐛 Troubleshooting

### Claims not being detected

1. Check if extension is enabled (click icon, verify toggle is on)
2. Refresh the page after installing
3. Try on a simple text page first
4. Check browser console for errors (F12)

### Tooltips not showing

1. Check if tooltips are enabled in settings
2. Verify CSS is loading (inspect element)
3. Try disabling other extensions that might conflict

### High CPU usage

1. Disable detection on problematic sites
2. Reduce database size in `background.js`
3. Report performance issues on GitHub

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ Basic claim detection
- ✅ Inline highlighting and tooltips
- ✅ Simple claims database
- ✅ Browser extension MVP

### Phase 2 (Next)
- [ ] Backend API integration
- [ ] User accounts and preferences
- [ ] Custom claim submission
- [ ] Confidence threshold settings
- [ ] Category filters

### Phase 3 (Future)
- [ ] AI-powered semantic matching
- [ ] Browser-specific optimizations
- [ ] Mobile browser support
- [ ] Integration with annotation tools
- [ ] Collaborative fact-checking

### Phase 4 (Vision)
- [ ] Real-time claim updates
- [ ] Peer review system
- [ ] Evidence quality scoring
- [ ] Cross-language support
- [ ] API for third-party integration

## 🤝 Contributing

Contributions are welcome! Areas where help is needed:

1. **More claims**: Add beliefs to detect
2. **Better patterns**: Improve regex matching
3. **UI/UX**: Enhance design and usability
4. **Performance**: Optimize detection algorithms
5. **Testing**: Test on different websites and browsers
6. **Documentation**: Improve this README

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

[Add your license here - MIT recommended for open source]

## 🙏 Acknowledgments

- Inspired by the vision of cumulative online discourse
- Built to address the fragmentation of online debates
- Designed to complement, not replace, human critical thinking

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ideastockexchange/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ideastockexchange/discussions)
- **Email**: support@ideastockexchange.com
- **Website**: https://ideastockexchange.com

## 🌟 Vision

This extension is part of a larger project to transform online discourse. Instead of arguments disappearing into dead threads and buried replies, we're building a system where:

- Every belief has one permanent page
- Arguments accumulate over time
- Evidence is scored and weighted
- Related ideas are linked together
- Progress is visible and measurable

The goal: **Make online discussions cumulative instead of repetitive**.

---

**Made with 💡 for better online discourse**
