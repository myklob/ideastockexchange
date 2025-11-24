/**
 * Migration Script: Classify All Existing Beliefs
 *
 * This script processes all existing beliefs in the database and assigns
 * hierarchical classifications based on their content and scores.
 *
 * Usage: node backend/scripts/migrateBeliefClassifications.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Belief from '../models/Belief.js';
import { classifyBelief } from '../services/beliefClassificationService.js';

dotenv.config();

// Connect to database
const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ideastockexchange';
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Main migration function
async function migrateBeliefs() {
  console.log('\n=== Belief Classification Migration ===\n');

  try {
    // Get all beliefs
    const beliefs = await Belief.find({})
      .populate('supportingArguments')
      .populate('opposingArguments');

    console.log(`Found ${beliefs.length} beliefs to classify\n`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < beliefs.length; i++) {
      const belief = beliefs[i];
      const progress = ((i + 1) / beliefs.length * 100).toFixed(1);

      process.stdout.write(`\rProcessing: ${i + 1}/${beliefs.length} (${progress}%) - ${belief.statement.substring(0, 50)}...`);

      try {
        // Check if already classified recently (within last 30 days)
        if (belief.hierarchicalClassification?.lastClassified) {
          const lastClassified = new Date(belief.hierarchicalClassification.lastClassified);
          const daysSince = (Date.now() - lastClassified.getTime()) / (1000 * 60 * 60 * 24);

          if (daysSince < 30) {
            skippedCount++;
            continue; // Skip recently classified beliefs
          }
        }

        // Ensure dimensions are calculated
        if (!belief.dimensions.specificity) {
          belief.calculateSpecificity();
        }
        if (!belief.dimensions.sentimentPolarity) {
          belief.calculateSentimentPolarity();
        }
        if (!belief.conclusionScore || belief.conclusionScore === 50) {
          await belief.calculateConclusionScore();
        }

        // Classify the belief
        const classification = await classifyBelief(belief);

        // Update belief with classifications
        belief.hierarchicalClassification.sentiment = {
          levelId: classification.sentiment.levelId,
          levelName: classification.sentiment.levelName,
          confidence: classification.sentiment.confidence,
          autoClassified: true,
        };

        belief.hierarchicalClassification.specificity = {
          levelId: classification.specificity.levelId,
          levelName: classification.specificity.levelName,
          confidence: classification.specificity.confidence,
          autoClassified: true,
        };

        belief.hierarchicalClassification.strength = {
          levelId: classification.strength.levelId,
          levelName: classification.strength.levelName,
          confidence: classification.strength.confidence,
          autoClassified: true,
        };

        belief.hierarchicalClassification.lastClassified = new Date();

        // Save the belief
        await belief.save();
        successCount++;
      } catch (error) {
        console.error(`\n✗ Error processing belief ${belief._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n\n=== Migration Complete ===\n');
    console.log(`✓ Successfully classified: ${successCount}`);
    console.log(`⊘ Skipped (recently classified): ${skippedCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${beliefs.length}\n`);

    // Generate summary statistics
    await generateStatistics();
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Generate statistics about classifications
async function generateStatistics() {
  console.log('=== Classification Statistics ===\n');

  try {
    // Sentiment distribution
    const sentimentDist = await Belief.aggregate([
      {
        $match: {
          'hierarchicalClassification.sentiment.levelId': { $exists: true },
        },
      },
      {
        $group: {
          _id: '$hierarchicalClassification.sentiment.levelId',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$hierarchicalClassification.sentiment.confidence' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    console.log('Sentiment Distribution:');
    sentimentDist.forEach(item => {
      console.log(`  ${item._id}: ${item.count} beliefs (avg confidence: ${(item.avgConfidence * 100).toFixed(1)}%)`);
    });

    // Specificity distribution
    const specificityDist = await Belief.aggregate([
      {
        $match: {
          'hierarchicalClassification.specificity.levelId': { $exists: true },
        },
      },
      {
        $group: {
          _id: '$hierarchicalClassification.specificity.levelId',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$hierarchicalClassification.specificity.confidence' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    console.log('\nSpecificity Distribution:');
    specificityDist.forEach(item => {
      console.log(`  ${item._id}: ${item.count} beliefs (avg confidence: ${(item.avgConfidence * 100).toFixed(1)}%)`);
    });

    // Strength distribution
    const strengthDist = await Belief.aggregate([
      {
        $match: {
          'hierarchicalClassification.strength.levelId': { $exists: true },
        },
      },
      {
        $group: {
          _id: '$hierarchicalClassification.strength.levelId',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$hierarchicalClassification.strength.confidence' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    console.log('\nStrength Distribution:');
    strengthDist.forEach(item => {
      console.log(`  ${item._id}: ${item.count} beliefs (avg confidence: ${(item.avgConfidence * 100).toFixed(1)}%)`);
    });

    // Overall confidence
    const avgConfidence = await Belief.aggregate([
      {
        $match: {
          'hierarchicalClassification.lastClassified': { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          avgSentimentConfidence: { $avg: '$hierarchicalClassification.sentiment.confidence' },
          avgSpecificityConfidence: { $avg: '$hierarchicalClassification.specificity.confidence' },
          avgStrengthConfidence: { $avg: '$hierarchicalClassification.strength.confidence' },
        },
      },
    ]);

    if (avgConfidence.length > 0) {
      console.log('\nOverall Average Confidence:');
      console.log(`  Sentiment: ${(avgConfidence[0].avgSentimentConfidence * 100).toFixed(1)}%`);
      console.log(`  Specificity: ${(avgConfidence[0].avgSpecificityConfidence * 100).toFixed(1)}%`);
      console.log(`  Strength: ${(avgConfidence[0].avgStrengthConfidence * 100).toFixed(1)}%`);
    }

    console.log('');
  } catch (error) {
    console.error('Error generating statistics:', error);
  }
}

// Run migration with error handling
(async () => {
  try {
    await connectDatabase();
    await migrateBeliefs();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
