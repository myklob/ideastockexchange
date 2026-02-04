/**
 * Test/Example file for Belief Generator
 * Demonstrates how to use the belief generation system
 */

import {
  generateBeliefsFromWikipedia,
  generateBeliefsFromBatch,
} from '../services/beliefGenerator.js';
import { searchWikipedia } from '../services/wikipediaService.js';
import { classifyTopicType } from '../services/topicTypeClassifier.js';
import { fetchWikipediaPage } from '../services/wikipediaService.js';

console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
console.log('║          Belief Generator Test Suite                                     ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

/**
 * Test 1: Topic Type Classification
 */
async function testTopicClassification() {
  console.log('TEST 1: Topic Type Classification');
  console.log('─'.repeat(80));

  const testTopics = [
    'Abraham Lincoln',
    'World War II',
    'COVID-19 pandemic',
    'Wolf',
    'Electric car',
    'Moby-Dick',
    'Capitalism',
    'Paris',
    'Apple Inc.',
    'Climate change',
  ];

  for (const topic of testTopics) {
    try {
      const pageData = await fetchWikipediaPage(topic);
      const classification = classifyTopicType(pageData);
      const primaryType = classification[0];

      console.log(`✓ ${topic.padEnd(25)} → ${primaryType.type.padEnd(25)} (${primaryType.confidence.toFixed(1)}%)`);
    } catch (error) {
      console.log(`✗ ${topic.padEnd(25)} → Error: ${error.message}`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n');
}

/**
 * Test 2: Single Topic Belief Generation
 */
async function testSingleTopicGeneration() {
  console.log('TEST 2: Single Topic Belief Generation');
  console.log('─'.repeat(80));

  const topic = 'Abraham Lincoln';

  try {
    console.log(`Generating beliefs for: ${topic}\n`);

    const result = await generateBeliefsFromWikipedia(topic, {
      maxBeliefs: 5,
      includeArguments: true,
    });

    console.log(`Topic: ${result.source.title}`);
    console.log(`Type: ${result.primaryType} (${result.topicTypes[0]?.confidence.toFixed(1)}% confidence)`);
    console.log(`Generated ${result.beliefs.length} beliefs:\n`);

    result.beliefs.forEach((belief, index) => {
      console.log(`${index + 1}. ${belief.statement}`);
      console.log(`   Category: ${belief.category}`);
      console.log(`   Polarity: ${belief.polarity}`);
      console.log(`   Confidence: ${belief.confidence}%`);

      if (belief.arguments) {
        console.log(`   Supporting args: ${belief.arguments.supporting.length}`);
        console.log(`   Opposing args: ${belief.arguments.opposing.length}`);

        // Show first supporting argument
        if (belief.arguments.supporting.length > 0) {
          const arg = belief.arguments.supporting[0];
          console.log(`   Example: ${arg.content.slice(0, 100)}...`);
        }
      }

      console.log();
    });
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }

  console.log('\n');
}

/**
 * Test 3: Batch Topic Generation
 */
async function testBatchGeneration() {
  console.log('TEST 3: Batch Topic Generation');
  console.log('─'.repeat(80));

  const topics = [
    'Electric car',
    'Wolf',
    'World War II',
  ];

  try {
    console.log(`Generating beliefs for ${topics.length} topics:\n`);

    const results = await generateBeliefsFromBatch(topics, {
      maxBeliefs: 3,
      includeArguments: false,
    });

    results.forEach((result, index) => {
      if (result.error) {
        console.log(`${index + 1}. ${result.source.title} - Error: ${result.error}`);
      } else {
        console.log(`${index + 1}. ${result.source.title} (${result.primaryType})`);
        console.log(`   Generated ${result.beliefs.length} beliefs:`);
        result.beliefs.forEach(belief => {
          console.log(`   • ${belief.statement}`);
        });
      }
      console.log();
    });

    const totalBeliefs = results.reduce((sum, r) => sum + (r.beliefs?.length || 0), 0);
    console.log(`Total beliefs generated: ${totalBeliefs}`);
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }

  console.log('\n');
}

/**
 * Test 4: Wikipedia Search Integration
 */
async function testWikipediaSearch() {
  console.log('TEST 4: Wikipedia Search Integration');
  console.log('─'.repeat(80));

  const query = 'renewable energy';

  try {
    console.log(`Searching for: ${query}\n`);

    const results = await searchWikipedia(query, 5);

    console.log('Top results:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   ${result.description}`);
    });
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }

  console.log('\n');
}

/**
 * Test 5: Belief Template Coverage
 */
async function testTemplateUsage() {
  console.log('TEST 5: Belief Template Coverage');
  console.log('─'.repeat(80));

  const testCases = [
    { topic: 'Abraham Lincoln', expectedType: 'people' },
    { topic: 'World War II', expectedType: 'historical_events' },
    { topic: 'COVID-19 pandemic', expectedType: 'tragedies_disasters' },
    { topic: 'Wolf', expectedType: 'animals_species' },
    { topic: 'Electric car', expectedType: 'technology_products' },
  ];

  console.log('Testing template coverage for different topic types:\n');

  for (const testCase of testCases) {
    try {
      const result = await generateBeliefsFromWikipedia(testCase.topic, {
        maxBeliefs: 3,
        includeArguments: false,
      });

      const actualType = result.primaryType;
      const match = actualType === testCase.expectedType ? '✓' : '⚠';

      console.log(`${match} ${testCase.topic}`);
      console.log(`  Expected: ${testCase.expectedType}, Got: ${actualType}`);
      console.log(`  Beliefs generated: ${result.beliefs.length}`);

      if (result.beliefs.length > 0) {
        console.log(`  Example: ${result.beliefs[0].statement}`);
      }

      console.log();
    } catch (error) {
      console.log(`✗ ${testCase.topic} - Error: ${error.message}\n`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n');
}

/**
 * Run all tests
 */
async function runAllTests() {
  try {
    await testTopicClassification();
    await testSingleTopicGeneration();
    await testBatchGeneration();
    await testWikipediaSearch();
    await testTemplateUsage();

    console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    All Tests Complete!                                   ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export {
  testTopicClassification,
  testSingleTopicGeneration,
  testBatchGeneration,
  testWikipediaSearch,
  testTemplateUsage,
};
