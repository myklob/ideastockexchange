#!/usr/bin/env node
/**
 * CLI Tool for Generating Beliefs from Wikipedia
 *
 * Usage:
 *   node scripts/generateBeliefs.js <wikipedia-page-title> [options]
 *
 * Examples:
 *   node scripts/generateBeliefs.js "Abraham Lincoln"
 *   node scripts/generateBeliefs.js "Electric Car" --max-beliefs 10
 *   node scripts/generateBeliefs.js "World War II" --output beliefs.json
 */

import {
  generateBeliefsFromWikipedia,
  generateBeliefsFromBatch,
} from '../services/beliefGenerator.js';
import { searchWikipedia, getRandomArticles } from '../services/wikipediaService.js';
import fs from 'fs';
import path from 'path';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  const options = {
    pageTitle: null,
    maxBeliefs: 5,
    includeArguments: true,
    output: null,
    batch: false,
    search: null,
    random: null,
  };

  // Parse flags
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--max-beliefs' || arg === '-m') {
      options.maxBeliefs = parseInt(args[++i]);
    } else if (arg === '--no-arguments') {
      options.includeArguments = false;
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--batch' || arg === '-b') {
      options.batch = true;
    } else if (arg === '--search' || arg === '-s') {
      options.search = args[++i];
    } else if (arg === '--random' || arg === '-r') {
      options.random = parseInt(args[++i]) || 5;
    } else if (!arg.startsWith('--') && !options.pageTitle) {
      options.pageTitle = arg;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                   Belief Generator CLI Tool                               ║
║              Generate ISE Beliefs from Wikipedia Pages                    ║
╚═══════════════════════════════════════════════════════════════════════════╝

USAGE:
  node scripts/generateBeliefs.js <page-title> [options]

ARGUMENTS:
  <page-title>              Wikipedia page title (e.g., "Abraham Lincoln")

OPTIONS:
  -m, --max-beliefs <num>   Maximum beliefs to generate (default: 5)
  --no-arguments            Don't generate arguments (faster)
  -o, --output <file>       Save output to JSON file
  -b, --batch               Treat input as comma-separated list of pages
  -s, --search <query>      Search Wikipedia and show results
  -r, --random [count]      Generate beliefs for random articles (default: 5)
  -h, --help                Show this help message

EXAMPLES:
  # Generate beliefs for a single topic
  node scripts/generateBeliefs.js "Abraham Lincoln"

  # Generate more beliefs
  node scripts/generateBeliefs.js "Electric Car" --max-beliefs 10

  # Save to file
  node scripts/generateBeliefs.js "World War II" --output beliefs.json

  # Generate from multiple pages
  node scripts/generateBeliefs.js "Wolf,Electric Car,Napoleon" --batch

  # Search Wikipedia first
  node scripts/generateBeliefs.js --search "climate change"

  # Generate from random articles
  node scripts/generateBeliefs.js --random 10

TOPIC TYPES:
  The system automatically classifies Wikipedia pages into 10 types:
  • People (politicians, scientists, artists, etc.)
  • Historical Events (wars, revolutions, discoveries)
  • Tragedies/Disasters (pandemics, earthquakes, genocides)
  • Animals/Species (wolves, polar bears, oak trees)
  • Technology/Products (smartphones, electric cars, software)
  • Artworks (books, movies, music, paintings)
  • Ideologies/Theories (capitalism, socialism, evolution)
  • Geographical Locations (countries, cities, regions)
  • Companies/Organizations (Apple, NASA, WHO)
  • Scientific Concepts (gravity, CRISPR, climate change)

OUTPUT:
  The tool generates structured beliefs with:
  • Statement: The belief claim
  • Description: Supporting context
  • Category: ISE category (politics, science, etc.)
  • Arguments: Supporting and opposing arguments
  • Confidence: Generation confidence score

For more information: https://github.com/myklob/ideastockexchange
`);
}

async function main() {
  try {
    const options = parseArgs();

    console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
    console.log('║                   ISE Belief Generator                                    ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

    // Handle search mode
    if (options.search) {
      console.log(`🔍 Searching Wikipedia for: "${options.search}"\n`);
      const results = await searchWikipedia(options.search, 10);

      console.log('Search Results:');
      console.log('─'.repeat(80));
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   ${result.description}`);
        console.log(`   ${result.url}\n`);
      });

      console.log('Use any title from above with: node scripts/generateBeliefs.js "<title>"');
      return;
    }

    // Handle random mode
    if (options.random) {
      console.log(`🎲 Generating beliefs from ${options.random} random Wikipedia articles...\n`);
      const randomTitles = await getRandomArticles(options.random);

      console.log('Random Articles:');
      console.log('─'.repeat(80));
      randomTitles.forEach((title, index) => {
        console.log(`${index + 1}. ${title}`);
      });
      console.log();

      const results = await generateBeliefsFromBatch(randomTitles, {
        maxBeliefs: options.maxBeliefs,
        includeArguments: options.includeArguments,
      });

      displayResults(results, options);
      return;
    }

    // Validate page title
    if (!options.pageTitle) {
      console.error('❌ Error: Please provide a Wikipedia page title\n');
      console.log('Usage: node scripts/generateBeliefs.js "<page-title>"\n');
      console.log('Run with --help for more information');
      process.exit(1);
    }

    // Handle batch mode
    if (options.batch) {
      const titles = options.pageTitle.split(',').map(t => t.trim());
      console.log(`📚 Batch mode: Generating beliefs for ${titles.length} pages...\n`);

      const results = await generateBeliefsFromBatch(titles, {
        maxBeliefs: options.maxBeliefs,
        includeArguments: options.includeArguments,
      });

      displayResults(results, options);
      return;
    }

    // Single page mode
    console.log(`📄 Generating beliefs for: "${options.pageTitle}"`);
    console.log(`⚙️  Max beliefs: ${options.maxBeliefs}`);
    console.log(`🔧 Include arguments: ${options.includeArguments}\n`);

    const result = await generateBeliefsFromWikipedia(options.pageTitle, {
      maxBeliefs: options.maxBeliefs,
      includeArguments: options.includeArguments,
    });

    displayResults([result], options);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

function displayResults(results, options) {
  console.log('\n' + '═'.repeat(80));
  console.log('RESULTS');
  console.log('═'.repeat(80) + '\n');

  let totalBeliefs = 0;

  for (const result of results) {
    if (result.error) {
      console.log(`❌ ${result.source.title}: ${result.error}\n`);
      continue;
    }

    totalBeliefs += result.beliefs.length;

    console.log(`\n📌 Topic: ${result.source.title}`);
    console.log(`🔗 URL: ${result.source.url}`);
    console.log(`📊 Type: ${result.primaryType} (${result.topicTypes[0]?.confidence.toFixed(1)}% confidence)`);
    console.log(`💡 Generated ${result.beliefs.length} beliefs\n`);

    result.beliefs.forEach((belief, index) => {
      console.log(`${index + 1}. ${belief.statement}`);
      console.log(`   Category: ${belief.category} | Polarity: ${belief.polarity} | Confidence: ${belief.confidence}%`);

      if (belief.arguments && options.includeArguments) {
        console.log(`   Arguments: ${belief.arguments.supporting.length} supporting, ${belief.arguments.opposing.length} opposing`);
      }

      console.log();
    });

    console.log('─'.repeat(80));
  }

  console.log(`\n✅ Total beliefs generated: ${totalBeliefs}`);

  // Save to file if requested
  if (options.output) {
    const outputPath = path.resolve(options.output);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`💾 Results saved to: ${outputPath}`);
  }

  console.log('\n' + '═'.repeat(80));
  console.log('Done! 🎉');
  console.log('═'.repeat(80) + '\n');
}

// Run the CLI
main();
