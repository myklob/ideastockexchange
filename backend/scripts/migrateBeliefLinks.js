/**
 * Migration Script: Populate BeliefLink Collection
 *
 * This script analyzes existing arguments and creates BeliefLink documents
 * to enable the "What Links Here" feature.
 *
 * It identifies which beliefs are used as arguments for/against other beliefs
 * and creates explicit link relationships.
 *
 * Run with: node backend/scripts/migrateBeliefLinks.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Belief from '../models/Belief.js';
import Argument from '../models/Argument.js';
import BeliefLink from '../models/BeliefLink.js';
import { calculateLinkContribution } from '../services/hybridScoringService.js';

dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ideastockexchange';

/**
 * Extract belief references from argument content
 * This looks for potential belief statements in argument text
 *
 * @param {string} content - Argument content
 * @param {Array} allBeliefs - Array of all belief documents
 * @returns {Array} - Array of belief IDs that might be referenced
 */
function extractBeliefReferences(content, allBeliefs) {
  const references = [];

  // Simple approach: look for exact or partial matches of belief statements
  // You may want to enhance this with fuzzy matching or NLP
  for (const belief of allBeliefs) {
    const statement = belief.statement.toLowerCase();
    const contentLower = content.toLowerCase();

    // Check for exact match
    if (contentLower.includes(statement)) {
      references.push(belief._id);
      continue;
    }

    // Check for partial match (at least 70% of words)
    const statementWords = statement.split(/\s+/).filter(w => w.length > 3);
    const matchedWords = statementWords.filter(word => contentLower.includes(word));

    if (matchedWords.length / statementWords.length >= 0.7) {
      references.push(belief._id);
    }
  }

  return references;
}

/**
 * Create belief links from existing arguments
 */
async function createBeliefLinks() {
  try {
    console.log('🔗 Starting Belief Link Migration...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all active beliefs
    const beliefs = await Belief.find({ status: 'active' });
    console.log(`📊 Found ${beliefs.length} active beliefs\n`);

    // Get all active arguments
    const arguments = await Argument.find({ status: 'active' })
      .populate('beliefId', 'statement conclusionScore reasonRankScore');

    console.log(`📊 Found ${arguments.length} active arguments\n`);

    let linksCreated = 0;
    let linksSkipped = 0;
    let linksUpdated = 0;

    console.log('🔍 Analyzing arguments and creating links...\n');

    for (const argument of arguments) {
      if (!argument.beliefId) {
        linksSkipped++;
        continue;
      }

      // Extract belief references from argument content
      const referencedBeliefs = extractBeliefReferences(argument.content, beliefs);

      // For each referenced belief, create a link
      for (const referencedBeliefId of referencedBeliefs) {
        // Skip if the referenced belief is the same as the target belief
        if (referencedBeliefId.toString() === argument.beliefId._id.toString()) {
          continue;
        }

        try {
          // Check if link already exists
          let link = await BeliefLink.findOne({ argumentId: argument._id });

          if (link) {
            // Update existing link
            link.fromBeliefId = referencedBeliefId;
            link.toBeliefId = argument.beliefId._id;
            link.linkType = argument.type === 'supporting' ? 'SUPPORTS' : 'OPPOSES';

            // Calculate link strength
            await link.calculateLinkStrength();

            await link.save();
            linksUpdated++;
          } else {
            // Get source belief for contribution calculation
            const sourceBelief = beliefs.find(b => b._id.toString() === referencedBeliefId.toString());

            // Calculate contribution
            const contribution = calculateLinkContribution(argument, sourceBelief);

            // Create new link
            link = new BeliefLink({
              fromBeliefId: referencedBeliefId,
              toBeliefId: argument.beliefId._id,
              argumentId: argument._id,
              linkType: argument.type === 'supporting' ? 'SUPPORTS' : 'OPPOSES',
              linkStrength: contribution.linkStrength,
              contribution: {
                argumentScore: contribution.argumentScore,
                reasonRankContribution: contribution.reasonRankContribution,
                voteContribution: contribution.voteContribution,
                aspectContribution: contribution.aspectContribution,
                totalContribution: contribution.totalContribution,
              },
              metadata: {
                createdBy: argument.author,
                isActive: true,
              },
            });

            await link.save();
            linksCreated++;
          }

          if ((linksCreated + linksUpdated) % 10 === 0) {
            process.stdout.write(`\r   Created: ${linksCreated} | Updated: ${linksUpdated} | Skipped: ${linksSkipped}`);
          }
        } catch (error) {
          console.error(`\n❌ Error creating link for argument ${argument._id}:`, error.message);
        }
      }
    }

    console.log(`\n\n✅ Link creation complete!`);
    console.log(`   📈 Created: ${linksCreated}`);
    console.log(`   🔄 Updated: ${linksUpdated}`);
    console.log(`   ⏭️  Skipped: ${linksSkipped}\n`);

    // Update belief link statistics
    console.log('📊 Updating belief link statistics...\n');

    let beliefsUpdated = 0;
    for (const belief of beliefs) {
      try {
        await belief.updateLinkStatistics();
        await belief.save();
        beliefsUpdated++;

        if (beliefsUpdated % 10 === 0) {
          process.stdout.write(`\r   Updated: ${beliefsUpdated}/${beliefs.length}`);
        }
      } catch (error) {
        console.error(`\n❌ Error updating belief ${belief._id}:`, error.message);
      }
    }

    console.log(`\n\n✅ Belief statistics updated: ${beliefsUpdated}/${beliefs.length}\n`);

    // Print summary statistics
    console.log('📊 Migration Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const totalLinks = await BeliefLink.countDocuments({ 'metadata.isActive': true });
    const supportingLinks = await BeliefLink.countDocuments({ linkType: 'SUPPORTS', 'metadata.isActive': true });
    const opposingLinks = await BeliefLink.countDocuments({ linkType: 'OPPOSES', 'metadata.isActive': true });

    console.log(`Total Active Links: ${totalLinks}`);
    console.log(`  - Supporting: ${supportingLinks}`);
    console.log(`  - Opposing: ${opposingLinks}`);
    console.log(`Average Links per Belief: ${(totalLinks / beliefs.length).toFixed(2)}`);

    // Find most connected belief
    const mostConnected = await Belief.findOne({ status: 'active' })
      .sort({ 'linkStatistics.incoming.total': -1, 'linkStatistics.outgoing.total': -1 })
      .select('statement linkStatistics');

    if (mostConnected) {
      const totalConnections =
        mostConnected.linkStatistics.incoming.total +
        mostConnected.linkStatistics.outgoing.total;
      console.log(`\nMost Connected Belief (${totalConnections} connections):`);
      console.log(`  "${mostConnected.statement}"`);
      console.log(`  - Incoming: ${mostConnected.linkStatistics.incoming.total}`);
      console.log(`  - Outgoing: ${mostConnected.linkStatistics.outgoing.total}`);
    }

    console.log('\n✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

// Run migration
createBeliefLinks()
  .then(() => {
    console.log('✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
