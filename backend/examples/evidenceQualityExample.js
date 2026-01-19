/**
 * Evidence Quality Scoring System - Example Usage Script
 *
 * This script demonstrates how to use the Evidence Quality Scoring system
 * to submit evidence, challenge methodology, evaluate challenges, and
 * calculate evidence impact scores.
 *
 * Run with: node backend/examples/evidenceQualityExample.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Evidence from '../models/Evidence.js';
import Argument from '../models/Argument.js';
import Belief from '../models/Belief.js';
import MethodologyChallenge from '../models/MethodologyChallenge.js';

dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ideastockexchange');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Helper to display scores with visual indicators
const displayScore = (label, score, maxScore = 100) => {
  const percentage = (score / maxScore) * 100;
  const bars = Math.round(percentage / 5);
  const barChart = '█'.repeat(bars) + '░'.repeat(20 - bars);
  console.log(`  ${label.padEnd(30)} ${score.toString().padStart(3)}/${maxScore} ${barChart}`);
};

// Main demonstration
const demonstrateEvidenceQualityScoring = async () => {
  console.log('\n' + '='.repeat(80));
  console.log('🔬 EVIDENCE QUALITY SCORING SYSTEM DEMONSTRATION');
  console.log('='.repeat(80));
  console.log('\nPrinciple: Arguments matter more than credentials\n');

  try {
    // 1. Create test users
    console.log('\n📋 Step 1: Creating test users...\n');

    const phd = await User.create({
      username: 'dr_scientist',
      email: 'phd@example.com',
      password: 'password123',
    });

    // Add credentials (tracked but NOT used for scoring)
    phd.reasonRank.credentials.push({
      type: 'PhD',
      field: 'Climate Science',
      institution: 'MIT',
      verified: true,
    });
    await phd.save();

    const blogger = await User.create({
      username: 'uncle_blogger',
      email: 'uncle@example.com',
      password: 'password123',
    });

    console.log(`  ✅ Created PhD user: ${phd.username}`);
    console.log(`     Credentials: PhD in Climate Science (MIT)`);
    console.log(`     Initial ReasonRank: ${phd.reasonRank.overall}`);
    console.log(`  ✅ Created blogger user: ${blogger.username}`);
    console.log(`     Credentials: None`);
    console.log(`     Initial ReasonRank: ${blogger.reasonRank.overall}`);

    // 2. Create a belief and argument
    console.log('\n📋 Step 2: Creating belief and argument...\n');

    const belief = await Belief.create({
      title: 'Climate Change is Human-Caused',
      description: 'Human activities are the primary driver of recent climate change',
      createdBy: phd._id,
    });

    const argument = await Argument.create({
      content: 'CO2 levels have risen 40% since pre-industrial times, correlating with industrial activity',
      type: 'supporting',
      beliefId: belief._id,
      author: phd._id,
    });

    console.log(`  ✅ Created belief: "${belief.title}"`);
    console.log(`  ✅ Created supporting argument`);

    // 3. Submit high-quality evidence
    console.log('\n📋 Step 3: Submitting high-quality evidence...\n');

    const goodEvidence = await Evidence.create({
      title: 'NOAA Climate Study 2024',
      description: 'Comprehensive analysis of atmospheric CO2 levels',
      type: 'study',
      submittedBy: phd._id,

      // Pattern 1: Transparent Measurement (100 points)
      methodologyTransparency: {
        hasDisclosedMethod: true,
        hasControlVariables: true,
        hasRawData: true,
        hasPeerReview: true,
      },

      // Pattern 2: Replication (58 points - 2 successful replications)
      replication: {
        hasIndependentReplications: true,
        replicationCount: 2,
        replicationContexts: [
          { description: 'European Climate Center', source: 'ECC', successful: true },
          { description: 'Japan Meteorological Agency', source: 'JMA', successful: true },
        ],
      },

      // Pattern 3: Falsifiable Predictions (100 points)
      falsifiability: {
        hasFalsifiablePredictions: true,
        predictions: [
          { prediction: 'CO2 will exceed 420ppm by 2025', outcome: 'validated', evidence: 'Measured at 421ppm' },
          { prediction: 'Temperature increase >1.2°C by 2024', outcome: 'validated', evidence: 'Measured at 1.26°C' },
        ],
        validatedPredictionCount: 2,
        falsifiedPredictionCount: 0,
      },

      // Pattern 4: Explicit Assumptions (100 points)
      assumptions: {
        hasExplicitAssumptions: true,
        assumptionsList: [
          {
            assumption: 'Assumes ice core samples represent historical atmospheric composition',
            justification: 'Ice traps air bubbles that preserve ancient atmosphere',
          },
          {
            assumption: 'Assumes measurement instruments are calibrated correctly',
            justification: 'Cross-validated with multiple independent instruments',
          },
        ],
      },
    });

    // Calculate quality score
    await goodEvidence.calculateQualityScore();
    await goodEvidence.save();

    console.log(`  ✅ Evidence submitted: "${goodEvidence.title}"`);
    console.log('\n  📊 Quality Score Breakdown:');
    displayScore('Transparency (40%)', goodEvidence.methodologyTransparency.score);
    displayScore('Replication (20%)', goodEvidence.replication.score);
    displayScore('Falsifiability (15%)', goodEvidence.falsifiability.score);
    displayScore('Assumptions (25%)', goodEvidence.assumptions.score);
    console.log('  ' + '-'.repeat(75));
    displayScore('OVERALL QUALITY SCORE', goodEvidence.qualityScore);

    // 4. Set linkage score
    console.log('\n📋 Step 4: Setting linkage to argument...\n');

    goodEvidence.setLinkageScore(argument._id, 0.9, 'directly_proves');
    await goodEvidence.save();

    // Calculate evidence impact
    const impact = await goodEvidence.calculateEvidenceImpact(argument._id);
    await goodEvidence.save();

    console.log(`  ✅ Linkage Score: ${impact.linkageScore} (directly_proves)`);
    console.log(`  📊 Evidence Impact = Quality × Linkage`);
    console.log(`                     = ${impact.qualityScore} × ${impact.linkageScore}`);
    console.log(`                     = ${impact.evidenceImpact.toFixed(1)}`);

    // 5. Submit a methodology challenge from the blogger
    console.log('\n📋 Step 5: Blogger challenges methodology...\n');

    const challenge = await MethodologyChallenge.create({
      evidenceId: goodEvidence._id,
      challenger: blogger._id,
      challengeType: 'control_variables',
      claim: 'Study claims to control for solar variation',
      challenge: 'Solar irradiance data is incomplete before 1978. Pre-1978 measurements may be confounded by unmeasured solar variation.',
      affectedPattern: 'transparent_measurement',
    });

    console.log(`  ✅ Challenge submitted by ${blogger.username}`);
    console.log(`     Type: ${challenge.challengeType}`);
    console.log(`     Challenge: "${challenge.challenge}"`);
    console.log(`     Status: ${challenge.status}`);

    // 6. Multiple users evaluate the challenge
    console.log('\n📋 Step 6: Community evaluates challenge...\n');

    // Create more evaluators
    const evaluator1 = await User.create({
      username: 'climate_analyst',
      email: 'analyst@example.com',
      password: 'password123',
    });

    const evaluator2 = await User.create({
      username: 'data_scientist',
      email: 'datascience@example.com',
      password: 'password123',
    });

    // Give them some ReasonRank history
    evaluator1.reasonRank.methodologyAssessment.evaluationsSubmitted = 20;
    evaluator1.reasonRank.methodologyAssessment.accurateEvaluations = 18;
    evaluator1.calculateReasonRank();
    await evaluator1.save();

    evaluator2.reasonRank.methodologyAssessment.evaluationsSubmitted = 50;
    evaluator2.reasonRank.methodologyAssessment.accurateEvaluations = 45;
    evaluator2.calculateReasonRank();
    await evaluator2.save();

    // Evaluations
    await challenge.addEvaluation(
      evaluator1._id,
      'valid',
      'The challenge correctly identifies a gap in the control variables before 1978.',
      15,
      evaluator1.reasonRank.overall
    );

    await challenge.addEvaluation(
      evaluator2._id,
      'partially_valid',
      'Valid concern, but post-1978 data is still sufficient for the main conclusions.',
      10,
      evaluator2.reasonRank.overall
    );

    await challenge.addEvaluation(
      phd._id,
      'valid',
      'This is a legitimate methodological concern that should reduce the quality score.',
      15,
      phd.reasonRank.overall
    );

    console.log(`  ✅ ${evaluator1.username} evaluated: valid (impact: 15 points)`);
    console.log(`     ReasonRank: ${evaluator1.reasonRank.overall}`);
    console.log(`  ✅ ${evaluator2.username} evaluated: partially_valid (impact: 10 points)`);
    console.log(`     ReasonRank: ${evaluator2.reasonRank.overall}`);
    console.log(`  ✅ ${phd.username} evaluated: valid (impact: 15 points)`);
    console.log(`     ReasonRank: ${phd.reasonRank.overall}`);

    await challenge.calculateConsensus();
    await challenge.save();

    console.log(`\n  📊 Consensus Result: ${challenge.evaluation.consensusVerdict}`);
    console.log(`     Weighted Impact: ${challenge.evaluation.weightedImpact} points`);

    // Update challenge status
    if (challenge.evaluation.consensusVerdict === 'valid') {
      challenge.status = 'accepted';
      await challenge.save();
    }

    // 7. Update blogger's ReasonRank
    console.log('\n📋 Step 7: Updating ReasonRanks...\n');

    await blogger.updateMethodologyFromChallenge(challenge._id, true);
    console.log(`  ✅ ${blogger.username} ReasonRank updated for valid challenge`);
    console.log(`     Methodology Score: ${blogger.reasonRank.methodologyAssessment.score}`);
    console.log(`     Overall ReasonRank: ${blogger.reasonRank.overall}`);

    // 8. Recalculate evidence quality with challenge impact
    console.log('\n📋 Step 8: Recalculating evidence quality...\n');

    const oldQuality = goodEvidence.qualityScore;
    await goodEvidence.calculateQualityScore();
    await goodEvidence.save();

    console.log(`  📊 Quality Score Changed:`);
    console.log(`     Before challenge: ${oldQuality}`);
    console.log(`     After challenge:  ${goodEvidence.qualityScore}`);
    console.log(`     Reduction:        ${oldQuality - goodEvidence.qualityScore} points`);

    // Recalculate evidence impact
    const newImpact = await goodEvidence.calculateEvidenceImpact(argument._id);
    await goodEvidence.save();

    console.log(`\n  📊 Evidence Impact Changed:`);
    console.log(`     Before: ${impact.evidenceImpact.toFixed(1)}`);
    console.log(`     After:  ${newImpact.evidenceImpact.toFixed(1)}`);

    // 9. Compare with low-quality evidence
    console.log('\n📋 Step 9: Comparing with low-quality evidence...\n');

    const badEvidence = await Evidence.create({
      title: 'Blog Post: Climate Change Observations',
      description: 'Personal observations about weather patterns',
      type: 'article',
      submittedBy: blogger._id,

      // No transparency
      methodologyTransparency: {
        hasDisclosedMethod: false,
        hasControlVariables: false,
        hasRawData: false,
        hasPeerReview: false,
      },

      // No replication
      replication: {
        hasIndependentReplications: false,
      },

      // No falsifiable predictions
      falsifiability: {
        hasFalsifiablePredictions: false,
      },

      // No explicit assumptions
      assumptions: {
        hasExplicitAssumptions: false,
      },
    });

    await badEvidence.calculateQualityScore();
    await badEvidence.save();

    console.log('  📊 Comparison:');
    console.log(`\n  High-Quality Evidence (PhD Study):`);
    displayScore('Quality Score', goodEvidence.qualityScore);
    console.log(`     Source: PhD Climate Scientist`);
    console.log(`     Credentials: Tracked but NOT used in score`);

    console.log(`\n  Low-Quality Evidence (Blog Post):`);
    displayScore('Quality Score', badEvidence.qualityScore);
    console.log(`     Source: Blogger with no credentials`);
    console.log(`     Credentials: None (and wouldn't matter anyway)`);

    // 10. Demonstrate: Credentials don't affect ReasonRank
    console.log('\n📋 Step 10: Demonstrating credential independence...\n');

    console.log(`  PhD Scientist:`);
    console.log(`     Credentials: PhD in Climate Science (MIT)`);
    console.log(`     ReasonRank: ${phd.reasonRank.overall}`);
    console.log(`     Score determined by: Accurate challenge evaluations`);

    console.log(`\n  Blogger:`);
    console.log(`     Credentials: None`);
    console.log(`     ReasonRank: ${blogger.reasonRank.overall}`);
    console.log(`     Score determined by: Valid methodology challenge`);

    console.log('\n  💡 Key Insight: The blogger earned ReasonRank by making a valid');
    console.log('     methodological argument, despite having no credentials.');
    console.log('     The PhD\'s credentials are tracked but don\'t automatically');
    console.log('     increase their score. Arguments matter, not authority.');

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log('\n✅ Demonstrated Features:');
    console.log('  1. Evidence quality scored on 4 patterns (not source authority)');
    console.log('  2. Methodology challenges can come from anyone');
    console.log('  3. Challenges evaluated by community (weighted by ReasonRank)');
    console.log('  4. Valid challenges reduce evidence quality scores');
    console.log('  5. ReasonRank earned through accurate assessment, not credentials');
    console.log('  6. Evidence Impact = Quality × Linkage');
    console.log('  7. Credentials tracked but NOT used for scoring');
    console.log('\n💡 Core Principle Validated:');
    console.log('   "Arguments matter more than credentials"');
    console.log('\n   Your uncle\'s blog CAN beat NASA if the methodology is better.');
    console.log('   The system doesn\'t care about credentials. It cares about whether');
    console.log('   the reasoning survives scrutiny.');
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error during demonstration:', error);
    throw error;
  }
};

// Run the demonstration
const main = async () => {
  await connectDB();

  try {
    // Clean up any existing test data
    await User.deleteMany({ email: { $regex: /@example\.com$/ } });
    await Evidence.deleteMany({ title: { $regex: /(NOAA|Blog Post)/ } });
    await MethodologyChallenge.deleteMany({});
    await Argument.deleteMany({});
    await Belief.deleteMany({ title: /Climate Change/ });

    await demonstrateEvidenceQualityScoring();

    console.log('\n✅ Demonstration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Demonstration failed:', error);
    process.exit(1);
  }
};

// Execute
main();
