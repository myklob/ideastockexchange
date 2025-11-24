#!/bin/bash

# Generate PNG icons from SVG
# Requires: imagemagick (install with: apt-get install imagemagick or brew install imagemagick)

echo "Generating extension icons from icon.svg..."

# Check if imagemagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed."
    echo "Install it with:"
    echo "  - Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  - macOS: brew install imagemagick"
    echo "  - Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Generate icons
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png

echo "✓ Generated icon16.png"
echo "✓ Generated icon48.png"
echo "✓ Generated icon128.png"
echo ""
echo "Icons created successfully!"
