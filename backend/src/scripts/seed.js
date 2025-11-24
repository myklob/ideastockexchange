/**
 * Database Seeding Script
 * Populates the database with initial claims data
 */

const { initializeDatabase, getDatabase, closeDatabase } = require('../config/database');
const Claim = require('../models/Claim');

// Import claims from extension's background.js
const claims = [
  {
    id: 'vaccines-autism',
    title: 'Vaccines cause autism',
    description: 'The claim that vaccines, particularly the MMR vaccine, cause autism has been thoroughly debunked by numerous large-scale studies.',
    url: 'https://ideastockexchange.com/w/page/vaccines-autism',
    patterns: [
      'vaccines? cause autism',
      'vaccines? (?:are|is) linked to autism',
      'MMR (?:vaccine )?causes autism',
      'vaccinations? lead to autism'
    ],
    confidence: 0.9,
    reasonsFor: 3,
    reasonsAgainst: 47,
    evidenceScore: 0.95,
    category: 'health'
  },
  {
    id: 'climate-change-hoax',
    title: 'Climate change is a hoax',
    description: '97% of climate scientists agree that climate change is real and primarily caused by human activities. Multiple independent lines of evidence support this conclusion.',
    url: 'https://ideastockexchange.com/w/page/climate-change',
    patterns: [
      'climate change is (?:a )?(?:hoax|fake|not real)',
      'global warming (?:is|isn\'t) (?:a )?(?:hoax|fake|real)',
      'climate (?:change|warming) (?:isn\'t|is not) happening'
    ],
    confidence: 0.85,
    reasonsFor: 8,
    reasonsAgainst: 92,
    evidenceScore: 0.98,
    category: 'science'
  },
  {
    id: 'flat-earth',
    title: 'The Earth is flat',
    description: 'The spherical shape of Earth has been known for over 2,000 years and confirmed by countless observations, experiments, and satellite imagery.',
    url: 'https://ideastockexchange.com/w/page/flat-earth',
    patterns: [
      'earth is flat',
      'flat earth',
      'earth (?:isn\'t|is not) (?:a )?(?:sphere|globe|round)'
    ],
    confidence: 0.95,
    reasonsFor: 5,
    reasonsAgainst: 78,
    evidenceScore: 0.99,
    category: 'science'
  },
  {
    id: 'covid-just-flu',
    title: 'COVID-19 is just the flu',
    description: 'COVID-19 is significantly more deadly than seasonal flu, with higher hospitalization rates, long-term health effects, and different transmission patterns.',
    url: 'https://ideastockexchange.com/w/page/covid-vs-flu',
    patterns: [
      'COVID (?:is )?(?:just|only) (?:the|a) flu',
      'coronavirus (?:is )?(?:no worse than|just like) (?:the )?flu',
      'COVID (?:isn\'t|is not) any worse than flu'
    ],
    confidence: 0.88,
    reasonsFor: 6,
    reasonsAgainst: 78,
    evidenceScore: 0.95,
    category: 'health'
  },
  {
    id: 'only-use-10-percent-brain',
    title: 'We only use 10% of our brain',
    description: 'Brain imaging shows we use all parts of our brain. While not all neurons fire simultaneously, every region has a known function.',
    url: 'https://ideastockexchange.com/w/page/10-percent-brain',
    patterns: [
      '(?:we|humans|people) (?:only )?use (?:only )?(?:10|ten)(?:%| percent) (?:of )?(?:our|their|the) brain',
      'only (?:10|ten) percent (?:of )?(?:our|the) brain (?:is )?used',
      '(?:we|humans) don\'t use (?:most of|all) (?:our|the) brain'
    ],
    confidence: 0.91,
    reasonsFor: 3,
    reasonsAgainst: 67,
    evidenceScore: 0.97,
    category: 'psychology'
  }
  // Add more claims as needed
];

function seed() {
  console.log('Starting database seeding...\n');

  try {
    // Initialize database
    initializeDatabase();

    // Check if database already has data
    const db = getDatabase();
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM claims').get().count;

    if (existingCount > 0) {
      console.log(`Database already contains ${existingCount} claims.`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('Do you want to clear and reseed? (yes/no): ', (answer) => {
        if (answer.toLowerCase() === 'yes') {
          console.log('\nClearing existing data...');
          db.prepare('DELETE FROM patterns').run();
          db.prepare('DELETE FROM claims').run();
          db.prepare('DELETE FROM detections').run();
          insertClaims();
        } else {
          console.log('Seeding cancelled.');
        }
        readline.close();
        closeDatabase();
      });
    } else {
      insertClaims();
      closeDatabase();
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    closeDatabase();
    process.exit(1);
  }
}

function insertClaims() {
  console.log(`\nInserting ${claims.length} claims...\n`);

  let successCount = 0;
  let errorCount = 0;

  claims.forEach((claimData, index) => {
    try {
      Claim.create(claimData);
      successCount++;
      console.log(`✓ [${index + 1}/${claims.length}] ${claimData.title}`);
    } catch (error) {
      errorCount++;
      console.error(`✗ [${index + 1}/${claims.length}] Failed to insert: ${claimData.title}`);
      console.error(`  Error: ${error.message}`);
    }
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Seeding complete!`);
  console.log(`  ✓ Success: ${successCount}`);
  console.log(`  ✗ Errors: ${errorCount}`);
  console.log(`${'='.repeat(50)}\n`);
}

// Run seeding if called directly
if (require.main === module) {
  seed();
}

module.exports = { seed, claims };
