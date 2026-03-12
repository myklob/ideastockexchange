#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Strips HTML tags from a string and decodes common HTML entities
 * @param {string} html - HTML content to convert
 * @returns {string} - Plain text content
 */
function htmlToText(html) {
  let text = html;

  // Remove script and style tags and their content
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Replace block-level elements with newlines
  text = text.replace(/<\/?(div|p|br|h[1-6]|li|tr|table|section|article|header|footer|nav)[^>]*>/gi, '\n');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  const entities = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '...',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  };

  for (const [entity, char] of Object.entries(entities)) {
    text = text.replace(new RegExp(entity, 'g'), char);
  }

  // Decode numeric entities
  text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  text = text.replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  // Clean up excessive whitespace
  text = text.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
  text = text.replace(/\n\s+\n/g, '\n\n'); // Clean up lines with only whitespace
  text = text.replace(/\n{3,}/g, '\n\n'); // Maximum 2 consecutive newlines

  return text.trim();
}

/**
 * Reads all HTML files from a directory and combines them into a single text file
 * @param {string} inputDir - Directory containing HTML files
 * @param {string} outputFile - Path to output text file
 */
async function combineHtmlFiles(inputDir, outputFile) {
  try {
    // Check if input directory exists
    const stats = await fs.stat(inputDir);
    if (!stats.isDirectory()) {
      throw new Error(`${inputDir} is not a directory`);
    }

    // Read all files in the directory
    const files = await fs.readdir(inputDir);
    const htmlFiles = files.filter(file => file.toLowerCase().endsWith('.html'));

    if (htmlFiles.length === 0) {
      console.log(`No HTML files found in ${inputDir}`);
      return;
    }

    console.log(`Found ${htmlFiles.length} HTML file(s) in ${inputDir}`);

    // Process each HTML file
    const textContents = [];
    for (const file of htmlFiles.sort()) {
      const filePath = path.join(inputDir, file);
      console.log(`Processing: ${file}`);

      const htmlContent = await fs.readFile(filePath, 'utf-8');
      const textContent = htmlToText(htmlContent);

      // Add file separator
      textContents.push(`\n${'='.repeat(80)}`);
      textContents.push(`FILE: ${file}`);
      textContents.push('='.repeat(80));
      textContents.push(textContent);
    }

    // Combine all text content
    const combinedText = textContents.join('\n\n');

    // Write to output file
    await fs.writeFile(outputFile, combinedText, 'utf-8');

    console.log(`\nSuccessfully combined ${htmlFiles.length} HTML file(s) into: ${outputFile}`);
    console.log(`Output file size: ${(await fs.stat(outputFile)).size} bytes`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Main execution
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node combineHtmlToText.js <input-directory> [output-file]');
    console.log('');
    console.log('Arguments:');
    console.log('  input-directory  Directory containing HTML files to combine');
    console.log('  output-file      Path to output text file (optional, default: combined-output.txt)');
    console.log('');
    console.log('Example:');
    console.log('  node combineHtmlToText.js ./html-files ./output.txt');
    process.exit(1);
  }

  const inputDir = path.resolve(args[0]);
  const outputFile = args[1] ? path.resolve(args[1]) : path.join(process.cwd(), 'combined-output.txt');

  combineHtmlFiles(inputDir, outputFile);
}

export { combineHtmlFiles, htmlToText };
