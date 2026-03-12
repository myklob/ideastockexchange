# Backend Scripts

This directory contains utility scripts for the Idea Stock Exchange backend.

## Available Scripts

### combineHtmlToText.js

Combines all HTML files from a specified directory into a single text file.

**Features:**
- Strips all HTML tags while preserving text content
- Removes script and style tags completely
- Decodes common HTML entities (e.g., `&amp;`, `&copy;`, `&nbsp;`)
- Adds clear file separators between each HTML file
- Maintains readable formatting with proper line breaks

**Usage:**

```bash
node backend/scripts/combineHtmlToText.js <input-directory> [output-file]
```

**Arguments:**
- `input-directory` (required): Directory containing HTML files to combine
- `output-file` (optional): Path to output text file (default: `combined-output.txt` in current directory)

**Examples:**

```bash
# Combine HTML files with default output
node backend/scripts/combineHtmlToText.js ./html-files

# Combine HTML files with custom output path
node backend/scripts/combineHtmlToText.js ./html-files ./output/combined.txt

# From project root
node backend/scripts/combineHtmlToText.js ~/Documents/html-content ./processed.txt
```

**Output Format:**

The output text file will contain all HTML files separated by headers:

```
================================================================================
FILE: sample1.html
================================================================================
[text content from sample1.html]

================================================================================
FILE: sample2.html
================================================================================
[text content from sample2.html]
```

**Use Cases:**
- Converting documentation from HTML to plain text
- Preparing HTML content for text analysis
- Creating text archives of HTML pages
- Extracting content for natural language processing

### Other Scripts

- `generateBeliefs.js` - Generates beliefs for the system
- `seedDatabase.js` - Seeds the database with initial data
- `testBeliefGenerator.js` - Tests the belief generator functionality
- `initializeMonetization.js` - Initializes monetization features

For more information about these scripts, refer to the main project documentation.
