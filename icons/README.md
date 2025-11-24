# Extension Icons

## Current Status

The extension uses placeholder icons. The browsers will display a generic icon until proper PNG icons are generated.

## Generating Icons

### Option 1: Using ImageMagick (Recommended)

```bash
# Install ImageMagick
# Ubuntu/Debian:
sudo apt-get install imagemagick

# macOS:
brew install imagemagick

# Then run:
./generate-icons.sh
```

### Option 2: Online Conversion

1. Open icon.svg in a browser
2. Take a screenshot
3. Use an online tool like:
   - https://cloudconvert.com/svg-to-png
   - https://www.adobe.com/express/feature/image/convert/svg-to-png
4. Generate 16x16, 48x48, and 128x128 PNG versions
5. Save as icon16.png, icon48.png, icon128.png

### Option 3: Design Tools

Use any design tool:
- Figma: Import SVG, export as PNG
- Inkscape: File > Export PNG Image
- GIMP: Open SVG, export as PNG
- Photoshop: Open SVG, save for web

## Icon Sizes

The extension needs three sizes:
- **16x16**: Browser toolbar (default)
- **48x48**: Extension management page
- **128x128**: Chrome Web Store

## Design Guidelines

Current design features:
- Light bulb (representing ideas)
- Gradient background (purple to blue)
- Check mark (representing verification)
- Clean, modern look

Feel free to improve the design! Just ensure:
- All three sizes are provided
- PNG format with transparency
- Clear and recognizable at 16x16
- Follows browser extension guidelines

## Without Icons

The extension works perfectly without PNG icons - browsers just show a placeholder. Icons are purely cosmetic.

## Future Improvements

Potential enhancements:
- [ ] Different icon states (active/inactive)
- [ ] Badge showing detection count
- [ ] Animated icon for active scanning
- [ ] Dark mode variant
