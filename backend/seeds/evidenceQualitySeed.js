/**
 * Evidence Quality Scoring System - Seed Data
 *
 * Creates sample data to demonstrate the Evidence Quality Scoring system:
 * - Users with varying ReasonRanks
 * - Evidence with different quality patterns
 * - Methodology challenges
 * - Evaluations and consensus
 *
 * Run with: node backend/seeds/evidenceQualitySeed.js
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

// Clean existing seed data
const cleanSeedData = async () => {
  console.log('\n🧹 Cleaning existing seed data...');

  await User.deleteMany({ username: { $in: [
    'seed_phd_researcher',
    'seed_data_analyst',
    'seed_independent_researcher',
    'seed_blogger',
    'seed_evaluator1',
    'seed_evaluator2',
  ]}});

  await Evidence.deleteMany({ title: { $regex: /^SEED:/ } });
  await MethodologyChallenge.deleteMany({ claim: { $regex: /^SEED:/ } });
  await Argument.deleteMany({ content: { $regex: /^SEED:/ } });
  await Belief.deleteMany({ title: { $regex: /^SEED:/ } });

  console.log('✅ Cleaned seed data');
};

// Create seed users
const createSeedUsers = async () => {
  console.log('\n👥 Creating seed users...');

  // PhD Researcher (with credentials, but low ReasonRank initially)
  const phdResearcher = await User.create({
    username: 'seed_phd_researcher',
    email: 'seed.phd@example.com',
    password: 'password123',
    reasonRank: {
      credentials: [{
        type: 'PhD',
        field: 'Environmental Science',
        institution: 'Stanford University',
        verified: true,
      }],
    },
  });

  // Data Analyst (no credentials, but high ReasonRank from valid challenges)
  const dataAnalyst = await User.create({
    username: 'seed_data_analyst',
    email: 'seed.analyst@example.com',
    password: 'password123',
  });
  dataAnalyst.reasonRank.methodologyAssessment.challengesSubmitted = 15;
  dataAnalyst.reasonRank.methodologyAssessment.validChallenges = 13;
  dataAnalyst.reasonRank.methodologyAssessment.invalidChallenges = 2;
  dataAnalyst.calculateReasonRank();
  await dataAnalyst.save();

  // Independent Researcher
  const independentResearcher = await User.create({
    username: 'seed_independent_researcher',
    email: 'seed.independent@example.com',
    password: 'password123',
  });

  // Blogger (no credentials)
  const blogger = await User.create({
    username: 'seed_blogger',
    email: 'seed.blogger@example.com',
    password: 'password123',
  });

  // Evaluators
  const evaluator1 = await User.create({
    username: 'seed_evaluator1',
    email: 'seed.eval1@example.com',
    password: 'password123',
  });
  evaluator1.reasonRank.methodologyAssessment.evaluationsSubmitted = 30;
  evaluator1.reasonRank.methodologyAssessment.accurateEvaluations = 27;
  evaluator1.calculateReasonRank();
  await evaluator1.save();

  const evaluator2 = await User.create({
    username: 'seed_evaluator2',
    email: 'seed.eval2@example.com',
    password: 'password123',
  });
  evaluator2.reasonRank.methodologyAssessment.evaluationsSubmitted = 40;
  evaluator2.reasonRank.methodologyAssessment.accurateEvaluations = 38;
  evaluator2.calculateReasonRank();
  await evaluator2.save();

  console.log(`✅ Created ${phdResearcher.username} (PhD, RR: ${phdResearcher.reasonRank.overall})`);
  console.log(`✅ Created ${dataAnalyst.username} (No credentials, RR: ${dataAnalyst.reasonRank.overall})`);
  console.log(`✅ Created ${independentResearcher.username}`);
  console.log(`✅ Created ${blogger.username}`);
  console.log(`✅ Created ${evaluator1.username} (RR: ${evaluator1.reasonRank.overall})`);
  console.log(`✅ Created ${evaluator2.username} (RR: ${evaluator2.reasonRank.overall})`);

  return { phdResearcher, dataAnalyst, independentResearcher, blogger, evaluator1, evaluator2 };
};

// Create beliefs and arguments
const createBeliefsAndArguments = async (users) => {
  console.log('\n💭 Creating beliefs and arguments...');

  const belief1 = await Belief.create({
    title: 'SEED: Renewable Energy is Economically Viable',
    description: 'Renewable energy sources are cost-competitive with fossil fuels',
    createdBy: users.phdResearcher._id,
  });

  const arg1 = await Argument.create({
    content: 'SEED: Solar panel costs have dropped 90% since 2010, making solar competitive with coal',
    type: 'supporting',
    beliefId: belief1._id,
    author: users.phdResearcher._id,
  });

  const belief2 = await Belief.create({
    title: 'SEED: Electric Vehicles Reduce Carbon Emissions',
    description: 'EVs have lower lifetime emissions than gas cars',
    createdBy: users.independentResearcher._id,
  });

  const arg2 = await Argument.create({
    content: 'SEED: When accounting for manufacturing and electricity generation, EVs produce 50% less CO2 over their lifetime',
    type: 'supporting',
    beliefId: belief2._id,
    author: users.independentResearcher._id,
  });

  console.log(`✅ Created belief: "${belief1.title}"`);
  console.log(`✅ Created argument for belief 1`);
  console.log(`✅ Created belief: "${belief2.title}"`);
  console.log(`✅ Created argument for belief 2`);

  return { belief1, arg1, belief2, arg2 };
};

// Create evidence samples
const createEvidenceSamples = async (users, beliefs) => {
  console.log('\n📚 Creating evidence samples...');

  // Example 1: High-quality evidence (all 4 patterns strong)
  const highQualityEvidence = await Evidence.create({
    title: 'SEED: NREL Solar Cost Analysis 2024',
    description: 'Comprehensive analysis of utility-scale solar costs with 10-year projection',
    type: 'study',
    submittedBy: users.phdResearcher._id,
    methodologyTransparency: {
      hasDisclosedMethod: true,
      hasControlVariables: true,
      hasRawData: true,
      hasPeerReview: true,
    },
    replication: {
      hasIndependentReplications: true,
      replicationCount: 3,
      replicationContexts: [
        { description: 'IRENA Analysis', source: 'International Renewable Energy Agency', successful: true },
        { description: 'Lazard LCOE Study', source: 'Lazard', successful: true },
        { description: 'BloombergNEF Report', source: 'Bloomberg New Energy Finance', successful: true },
      ],
    },
    falsifiability: {
      hasFalsifiablePredictions: true,
      predictions: [
        { prediction: 'Solar LCOE below $30/MWh by 2024', outcome: 'validated', evidence: 'Achieved $28/MWh' },
        { prediction: 'Installation capacity >200 GW/year by 2024', outcome: 'validated', evidence: 'Reached 240 GW' },
      ],
      validatedPredictionCount: 2,
      falsifiedPredictionCount: 0,
    },
    assumptions: {
      hasExplicitAssumptions: true,
      assumptionsList: [
        {
          assumption: 'Assumes 25-year panel lifespan',
          justification: 'Based on manufacturer warranties and degradation studies',
        },
        {
          assumption: 'Uses 2023 commodity prices for materials',
          justification: 'Indexed to actual market prices with volatility adjustment',
        },
      ],
    },
  });

  await highQualityEvidence.calculateQualityScore();
  highQualityEvidence.setLinkageScore(beliefs.arg1._id, 0.95, 'directly_proves');
  await highQualityEvidence.calculateEvidenceImpact(beliefs.arg1._id);
  await highQualityEvidence.save();

  // Example 2: Medium-quality evidence (some gaps)
  const mediumQualityEvidence = await Evidence.create({
    title: 'SEED: EV Lifecycle Emissions Study',
    description: 'Analysis of EV vs gasoline vehicle emissions over 150,000 miles',
    type: 'study',
    submittedBy: users.independentResearcher._id,
    methodologyTransparency: {
      hasDisclosedMethod: true,
      hasControlVariables: true,
      hasRawData: false,  // No raw data
      hasPeerReview: true,
    },
    replication: {
      hasIndependentReplications: true,
      replicationCount: 1,
      replicationContexts: [
        { description: 'MIT Study', source: 'MIT Energy Initiative', successful: true },
      ],
    },
    falsifiability: {
      hasFalsifiablePredictions: false,  // No predictions
    },
    assumptions: {
      hasExplicitAssumptions: true,
      assumptionsList: [
        {
          assumption: 'Assumes average US electricity grid mix',
          justification: 'Based on EPA data',
        },
      ],
    },
  });

  await mediumQualityEvidence.calculateQualityScore();
  mediumQualityEvidence.setLinkageScore(beliefs.arg2._id, 0.8, 'strongly_supports');
  await mediumQualityEvidence.calculateEvidenceImpact(beliefs.arg2._id);
  await mediumQualityEvidence.save();

  // Example 3: Low-quality evidence (blog post, no methodology)
  const lowQualityEvidence = await Evidence.create({
    title: 'SEED: Personal Blog - My Experience with Solar Panels',
    description: 'Observations about solar panel performance on my roof',
    type: 'article',
    submittedBy: users.blogger._id,
    methodologyTransparency: {
      hasDisclosedMethod: false,
      hasControlVariables: false,
      hasRawData: false,
      hasPeerReview: false,
    },
    replication: {
      hasIndependentReplications: false,
    },
    falsifiability: {
      hasFalsifiablePredictions: false,
    },
    assumptions: {
      hasExplicitAssumptions: false,
    },
  });

  await lowQualityEvidence.calculateQualityScore();
  lowQualityEvidence.setLinkageScore(beliefs.arg1._id, 0.3, 'weakly_supports');
  await lowQualityEvidence.calculateEvidenceImpact(beliefs.arg1._id);
  await lowQualityEvidence.save();

  // Example 4: High-quality evidence from independent researcher (no credentials)
  const independentHighQuality = await Evidence.create({
    title: 'SEED: Open-Source Battery Degradation Analysis',
    description: 'Community-driven analysis of 10,000 EV battery degradation curves',
    type: 'data',
    submittedBy: users.independentResearcher._id,
    methodologyTransparency: {
      hasDisclosedMethod: true,
      hasControlVariables: true,
      hasRawData: true,
      hasPeerReview: false,  // Not peer-reviewed, but transparent
    },
    replication: {
      hasIndependentReplications: true,
      replicationCount: 2,
      replicationContexts: [
        { description: 'Tesla Owner Community Analysis', source: 'TMC Forums', successful: true },
        { description: 'Geotab Fleet Study', source: 'Geotab', successful: true },
      ],
    },
    falsifiability: {
      hasFalsifiablePredictions: true,
      predictions: [
        { prediction: 'Battery degradation <10% after 100k miles', outcome: 'validated', evidence: 'Observed 8% average' },
      ],
      validatedPredictionCount: 1,
      falsifiedPredictionCount: 0,
    },
    assumptions: {
      hasExplicitAssumptions: true,
      assumptionsList: [
        {
          assumption: 'Assumes self-reported data is accurate',
          justification: 'Cross-validated with official service records where available',
        },
        {
          assumption: 'Assumes degradation is linear',
          justification: 'Observed pattern in first 5 years, extrapolated',
          challenged: false,
        },
      ],
    },
  });

  await independentHighQuality.calculateQualityScore();
  independentHighQuality.setLinkageScore(beliefs.arg2._id, 0.85, 'strongly_supports');
  await independentHighQuality.calculateEvidenceImpact(beliefs.arg2._id);
  await independentHighQuality.save();

  console.log(`✅ Created high-quality evidence (Score: ${highQualityEvidence.qualityScore})`);
  console.log(`   Source: PhD researcher with credentials`);
  console.log(`✅ Created medium-quality evidence (Score: ${mediumQualityEvidence.qualityScore})`);
  console.log(`   Source: Independent researcher`);
  console.log(`✅ Created low-quality evidence (Score: ${lowQualityEvidence.qualityScore})`);
  console.log(`   Source: Blogger with no credentials`);
  console.log(`✅ Created high-quality evidence from independent source (Score: ${independentHighQuality.qualityScore})`);
  console.log(`   Source: Independent researcher (no credentials, but transparent methodology)`);

  return { highQualityEvidence, mediumQualityEvidence, lowQualityEvidence, independentHighQuality };
};

// Create methodology challenges
const createChallenges = async (users, evidence) => {
  console.log('\n⚔️  Creating methodology challenges...');

  // Challenge 1: Valid challenge to high-quality evidence
  const challenge1 = await MethodologyChallenge.create({
    evidenceId: evidence.highQualityEvidence._id,
    challenger: users.dataAnalyst._id,
    challengeType: 'assumption_unjustified',
    claim: 'SEED: Study assumes 2023 commodity prices remain stable',
    challenge: 'Using 2023 prices without volatility analysis ignores recent supply chain disruptions. Material costs have spiked 40% in Q1 2024.',
    affectedPattern: 'explicit_assumptions',
  });

  // Add evaluations
  await challenge1.addEvaluation(
    users.evaluator1._id,
    'valid',
    'This is a legitimate concern. The assumption needs better justification.',
    12,
    users.evaluator1.reasonRank.overall
  );

  await challenge1.addEvaluation(
    users.evaluator2._id,
    'valid',
    'Commodity price volatility is a known issue. Should use price ranges.',
    15,
    users.evaluator2.reasonRank.overall
  );

  await challenge1.calculateConsensus();
  challenge1.status = 'accepted';
  await challenge1.save();

  // Challenge 2: Invalid challenge
  const challenge2 = await MethodologyChallenge.create({
    evidenceId: evidence.mediumQualityEvidence._id,
    challenger: users.blogger._id,
    challengeType: 'conflicts_of_interest',
    claim: 'SEED: Researchers may have EV stock',
    challenge: 'The authors might own Tesla stock, biasing their conclusions.',
    affectedPattern: 'transparent_measurement',
  });

  await challenge2.addEvaluation(
    users.evaluator1._id,
    'invalid',
    'No evidence of conflicts. This is speculation without basis.',
    0,
    users.evaluator1.reasonRank.overall
  );

  await challenge2.addEvaluation(
    users.evaluator2._id,
    'invalid',
    'Conflicts of interest must be demonstrated, not assumed.',
    0,
    users.evaluator2.reasonRank.overall
  );

  await challenge2.calculateConsensus();
  challenge2.status = 'refuted';
  await challenge2.save();

  // Challenge 3: Partially valid challenge
  const challenge3 = await MethodologyChallenge.create({
    evidenceId: evidence.independentHighQuality._id,
    challenger: users.phdResearcher._id,
    challengeType: 'sample_issues',
    claim: 'SEED: Self-reported data may be biased',
    challenge: 'EV owners who report battery health may be self-selecting for better outcomes. Owners with degraded batteries might not participate.',
    affectedPattern: 'transparent_measurement',
  });

  await challenge3.addEvaluation(
    users.evaluator1._id,
    'partially_valid',
    'Valid concern about self-selection, but the cross-validation with service records mitigates this somewhat.',
    8,
    users.evaluator1.reasonRank.overall
  );

  await challenge3.addEvaluation(
    users.dataAnalyst._id,
    'partially_valid',
    'Selection bias is possible, but sample size is large enough that outliers would be visible.',
    7,
    users.dataAnalyst.reasonRank.overall
  );

  await challenge3.calculateConsensus();
  challenge3.status = 'partially_accepted';
  await challenge3.save();

  console.log(`✅ Created valid challenge (Status: ${challenge1.status})`);
  console.log(`   Challenger: ${users.dataAnalyst.username} (high ReasonRank, no credentials)`);
  console.log(`✅ Created invalid challenge (Status: ${challenge2.status})`);
  console.log(`   Challenger: ${users.blogger.username}`);
  console.log(`✅ Created partially valid challenge (Status: ${challenge3.status})`);
  console.log(`   Challenger: ${users.phdResearcher.username} (PhD, but challenge quality matters)`);

  return { challenge1, challenge2, challenge3 };
};

// Update evidence quality after challenges
const updateEvidenceQuality = async (evidence, challenges) => {
  console.log('\n🔄 Updating evidence quality after challenges...');

  const before1 = evidence.highQualityEvidence.qualityScore;
  await evidence.highQualityEvidence.calculateQualityScore();
  await evidence.highQualityEvidence.save();
  console.log(`✅ High-quality evidence: ${before1} → ${evidence.highQualityEvidence.qualityScore}`);

  const before2 = evidence.mediumQualityEvidence.qualityScore;
  await evidence.mediumQualityEvidence.calculateQualityScore();
  await evidence.mediumQualityEvidence.save();
  console.log(`✅ Medium-quality evidence: ${before2} → ${evidence.mediumQualityEvidence.qualityScore} (no change - challenge refuted)`);

  const before3 = evidence.independentHighQuality.qualityScore;
  await evidence.independentHighQuality.calculateQualityScore();
  await evidence.independentHighQuality.save();
  console.log(`✅ Independent high-quality evidence: ${before3} → ${evidence.independentHighQuality.qualityScore}`);
};

// Update user ReasonRanks
const updateReasonRanks = async (users, challenges) => {
  console.log('\n📊 Updating ReasonRanks...');

  // Data analyst earned points for valid challenge
  await users.dataAnalyst.updateMethodologyFromChallenge(challenges.challenge1._id, true);
  console.log(`✅ ${users.dataAnalyst.username}: RR ${users.dataAnalyst.reasonRank.overall} (valid challenge)`);

  // Blogger lost points for invalid challenge
  await users.blogger.updateMethodologyFromChallenge(challenges.challenge2._id, false);
  console.log(`✅ ${users.blogger.username}: RR ${users.blogger.reasonRank.overall} (invalid challenge)`);

  // PhD researcher got partial credit
  await users.phdResearcher.updateMethodologyFromChallenge(challenges.challenge3._id, true);
  console.log(`✅ ${users.phdResearcher.username}: RR ${users.phdResearcher.reasonRank.overall} (partially valid)`);
};

// Main seed function
const seedEvidenceQualityData = async () => {
  console.log('\n' + '='.repeat(80));
  console.log('🌱 SEEDING EVIDENCE QUALITY SCORING DATA');
  console.log('='.repeat(80));

  await cleanSeedData();

  const users = await createSeedUsers();
  const beliefs = await createBeliefsAndArguments(users);
  const evidence = await createEvidenceSamples(users, beliefs);
  const challenges = await createChallenges(users, evidence);

  await updateEvidenceQuality(evidence, challenges);
  await updateReasonRanks(users, challenges);

  console.log('\n' + '='.repeat(80));
  console.log('✅ SEED DATA CREATED SUCCESSFULLY');
  console.log('='.repeat(80));
  console.log('\n📊 Summary:');
  console.log('  - 6 users (varied credentials and ReasonRanks)');
  console.log('  - 2 beliefs with arguments');
  console.log('  - 4 evidence items (varying quality)');
  console.log('  - 3 methodology challenges (valid, invalid, partial)');
  console.log('\n💡 Key Demonstrations:');
  console.log('  - High-quality evidence from PhD researcher (Score: 90+)');
  console.log('  - High-quality evidence from independent researcher with NO credentials (Score: 85+)');
  console.log('  - Low-quality evidence from blogger (Score: <30)');
  console.log('  - Valid challenge from non-credentialed analyst reduced PhD evidence score');
  console.log('  - Invalid challenge from blogger reduced their ReasonRank');
  console.log('  - ReasonRank determined by argument quality, NOT credentials');
  console.log('\n🔗 Test the API:');
  console.log('  GET  /api/evidence - See all evidence with quality scores');
  console.log('  GET  /api/methodology-challenges - See all challenges');
  console.log('  GET  /api/methodology-challenges/evidence/:evidenceId - Challenges for specific evidence');
  console.log('\n' + '='.repeat(80));
};

// Run the seed
const main = async () => {
  await connectDB();

  try {
    await seedEvidenceQualityData();
    console.log('\n✅ Seeding completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Execute
main();
