/**
 * Evidence Quality Scoring System Tests
 *
 * Tests the implementation of the principle:
 * "Arguments matter more than credentials"
 *
 * Tests 4 Patterns of Argument Strength:
 * 1. Transparent Measurement with Controls
 * 2. Replication Across Contexts
 * 3. Falsifiable Predictions
 * 4. Explicit Assumptions
 */

import mongoose from 'mongoose';
import Evidence from '../models/Evidence.js';
import MethodologyChallenge from '../models/MethodologyChallenge.js';
import User from '../models/User.js';

describe('Evidence Quality Scoring System', () => {
  let testUser;
  let testEvidence;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/ise_test');

    // Create test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  afterAll(async () => {
    // Clean up
    await User.deleteMany({});
    await Evidence.deleteMany({});
    await MethodologyChallenge.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create fresh test evidence before each test
    testEvidence = await Evidence.create({
      title: 'Test Study on Climate Change',
      description: 'A test study',
      type: 'study',
      submittedBy: testUser._id,
    });
  });

  afterEach(async () => {
    await Evidence.deleteMany({});
    await MethodologyChallenge.deleteMany({});
  });

  describe('Pattern 1: Transparent Measurement with Controls', () => {
    test('should score 0 when no transparency indicators present', () => {
      const score = testEvidence.calculateTransparencyScore();
      expect(score).toBe(0);
    });

    test('should score 25 for disclosed method only', () => {
      testEvidence.methodologyTransparency.hasDisclosedMethod = true;
      const score = testEvidence.calculateTransparencyScore();
      expect(score).toBe(25);
    });

    test('should score 100 when all transparency indicators present', () => {
      testEvidence.methodologyTransparency = {
        hasDisclosedMethod: true,
        hasControlVariables: true,
        hasRawData: true,
        hasPeerReview: true,
      };
      const score = testEvidence.calculateTransparencyScore();
      expect(score).toBe(100);
    });
  });

  describe('Pattern 2: Replication Across Contexts', () => {
    test('should score 0 when no replications exist', () => {
      const score = testEvidence.calculateReplicationScore();
      expect(score).toBe(0);
    });

    test('should score 30 base points for having replications', () => {
      testEvidence.replication.hasIndependentReplications = true;
      const score = testEvidence.calculateReplicationScore();
      expect(score).toBe(30);
    });

    test('should add 14 points per successful replication', () => {
      testEvidence.replication = {
        hasIndependentReplications: true,
        replicationContexts: [
          { description: 'Lab 1', source: 'University A', successful: true },
          { description: 'Lab 2', source: 'University B', successful: true },
        ],
      };
      const score = testEvidence.calculateReplicationScore();
      expect(score).toBe(30 + 14 * 2); // 58
    });

    test('should max out at 100 for 5+ successful replications', () => {
      testEvidence.replication = {
        hasIndependentReplications: true,
        replicationContexts: Array(6).fill({
          description: 'Lab',
          source: 'University',
          successful: true,
        }),
      };
      const score = testEvidence.calculateReplicationScore();
      expect(score).toBe(100);
    });
  });

  describe('Pattern 3: Falsifiable Predictions', () => {
    test('should score 0 when no falsifiable predictions', () => {
      const score = testEvidence.calculateFalsifiabilityScore();
      expect(score).toBe(0);
    });

    test('should score 40 for having predictions but not yet tested', () => {
      testEvidence.falsifiability.hasFalsifiablePredictions = true;
      const score = testEvidence.calculateFalsifiabilityScore();
      expect(score).toBe(40);
    });

    test('should score 100 when all predictions validated', () => {
      testEvidence.falsifiability = {
        hasFalsifiablePredictions: true,
        validatedPredictionCount: 5,
        falsifiedPredictionCount: 0,
      };
      const score = testEvidence.calculateFalsifiabilityScore();
      expect(score).toBe(100);
    });

    test('should penalize 20 points per falsified prediction', () => {
      testEvidence.falsifiability = {
        hasFalsifiablePredictions: true,
        validatedPredictionCount: 3,
        falsifiedPredictionCount: 1,
      };
      const score = testEvidence.calculateFalsifiabilityScore();
      expect(score).toBe(75 - 20); // 55
    });
  });

  describe('Pattern 4: Explicit Assumptions', () => {
    test('should score 50 when no explicit assumptions', () => {
      const score = testEvidence.calculateAssumptionsScore();
      expect(score).toBe(50);
    });

    test('should penalize for hidden assumptions exposed', () => {
      testEvidence.assumptions.hiddenAssumptionsExposed = 2;
      const score = testEvidence.calculateAssumptionsScore();
      expect(score).toBe(50 - 2 * 15); // 20
    });

    test('should score 70 base for having explicit assumptions', () => {
      testEvidence.assumptions.hasExplicitAssumptions = true;
      testEvidence.assumptions.assumptionsList = [
        { assumption: 'Assumes X', justification: '' },
      ];
      const score = testEvidence.calculateAssumptionsScore();
      expect(score).toBe(70);
    });

    test('should add bonus for justified assumptions', () => {
      testEvidence.assumptions = {
        hasExplicitAssumptions: true,
        assumptionsList: [
          { assumption: 'Assumes X', justification: 'Because Y' },
          { assumption: 'Assumes A', justification: 'Because B' },
        ],
      };
      const score = testEvidence.calculateAssumptionsScore();
      expect(score).toBe(70 + 30); // 100
    });

    test('should penalize for challenged assumptions', () => {
      testEvidence.assumptions = {
        hasExplicitAssumptions: true,
        assumptionsList: [
          { assumption: 'Assumes X', justification: 'Because Y', challenged: true },
          { assumption: 'Assumes A', justification: 'Because B', challenged: false },
        ],
      };
      const score = testEvidence.calculateAssumptionsScore();
      expect(score).toBe(100 - 10); // 90
    });
  });

  describe('Overall Quality Score Calculation', () => {
    test('should calculate weighted average of 4 patterns', async () => {
      // Set up each pattern
      testEvidence.methodologyTransparency = {
        hasDisclosedMethod: true,
        hasControlVariables: true,
        hasRawData: true,
        hasPeerReview: true,
      }; // 100 * 0.40 = 40

      testEvidence.replication = {
        hasIndependentReplications: true,
        replicationContexts: [
          { description: 'Lab 1', source: 'University A', successful: true },
        ],
      }; // 44 * 0.20 = 8.8

      testEvidence.falsifiability = {
        hasFalsifiablePredictions: true,
        validatedPredictionCount: 3,
        falsifiedPredictionCount: 0,
      }; // 100 * 0.15 = 15

      testEvidence.assumptions = {
        hasExplicitAssumptions: true,
        assumptionsList: [
          { assumption: 'Assumes X', justification: 'Because Y' },
          { assumption: 'Assumes A', justification: 'Because B' },
        ],
      }; // 100 * 0.25 = 25

      const qualityScore = await testEvidence.calculateQualityScore();
      expect(qualityScore).toBeCloseTo(88.8, 0);
    });
  });

  describe('Methodology Challenges Impact', () => {
    test('should reduce quality score when challenges are accepted', async () => {
      // Set up good evidence
      testEvidence.methodologyTransparency = {
        hasDisclosedMethod: true,
        hasControlVariables: true,
        hasRawData: true,
        hasPeerReview: true,
      };

      // Initial quality score
      let qualityScore = await testEvidence.calculateQualityScore();
      const initialScore = qualityScore;

      // Create a valid challenge
      const challenge = await MethodologyChallenge.create({
        evidenceId: testEvidence._id,
        challenger: testUser._id,
        challengeType: 'control_variables',
        claim: 'Claims to control for income',
        challenge: 'Income data is self-reported and unreliable',
        affectedPattern: 'transparent_measurement',
        status: 'accepted',
        evaluation: {
          isValid: true,
          breaksInference: true,
          weightedImpact: 20,
          consensusVerdict: 'valid',
        },
      });

      testEvidence.methodologyChallenges.push(challenge._id);
      await testEvidence.save();

      // Recalculate quality score
      qualityScore = await testEvidence.calculateQualityScore();

      expect(qualityScore).toBe(initialScore - 20);
      expect(testEvidence.challengeImpact.acceptedChallenges).toBe(1);
      expect(testEvidence.challengeImpact.totalQualityReduction).toBe(20);
    });
  });

  describe('Evidence Impact (Quality × Linkage)', () => {
    test('should calculate evidence impact as Quality × Linkage', async () => {
      // Set up quality score
      testEvidence.methodologyTransparency = {
        hasDisclosedMethod: true,
        hasControlVariables: true,
        hasRawData: true,
        hasPeerReview: true,
      };
      await testEvidence.calculateQualityScore();
      expect(testEvidence.qualityScore).toBe(40); // Only transparency contributes

      // Set linkage score
      const argumentId = new mongoose.Types.ObjectId();
      testEvidence.setLinkageScore(argumentId, 0.8, 'strongly_supports');

      // Calculate evidence impact
      const impact = await testEvidence.calculateEvidenceImpact(argumentId);

      expect(impact.qualityScore).toBe(40);
      expect(impact.linkageScore).toBe(0.8);
      expect(impact.evidenceImpact).toBe(32); // 40 * 0.8
    });

    test('should reduce linkage score when linkage challenges are valid', async () => {
      // Set up evidence
      await testEvidence.calculateQualityScore();

      const argumentId = new mongoose.Types.ObjectId();
      testEvidence.setLinkageScore(argumentId, 0.9, 'directly_proves');

      // Add linkage challenge
      await testEvidence.addLinkageChallenge(
        argumentId,
        testUser._id,
        'This evidence is about X but the argument is about Y'
      );

      // Mark challenge as valid with 30% impact
      const linkage = testEvidence.linkageScores.find(
        ls => ls.argumentId.toString() === argumentId.toString()
      );
      linkage.linkageChallenges[0].isValid = true;
      linkage.linkageChallenges[0].impact = 30;

      await testEvidence.save();

      // Calculate impact
      const impact = await testEvidence.calculateEvidenceImpact(argumentId);

      expect(impact.linkageScore).toBeCloseTo(0.6, 1); // 0.9 - 0.3
    });
  });

  describe('ReasonRank Updates', () => {
    test('should increase ReasonRank when challenge is validated', async () => {
      const challenger = await User.create({
        username: 'challenger',
        email: 'challenger@example.com',
        password: 'password123',
      });

      const initialRR = challenger.reasonRank.overall;

      await challenger.updateMethodologyFromChallenge('challenge123', true);

      expect(challenger.reasonRank.methodologyAssessment.challengesSubmitted).toBe(1);
      expect(challenger.reasonRank.methodologyAssessment.validChallenges).toBe(1);

      challenger.calculateReasonRank();
      expect(challenger.reasonRank.overall).toBeGreaterThan(initialRR);

      await User.findByIdAndDelete(challenger._id);
    });

    test('should decrease ReasonRank when challenge is refuted', async () => {
      const challenger = await User.create({
        username: 'challenger2',
        email: 'challenger2@example.com',
        password: 'password123',
      });

      // Give them some initial valid challenges
      challenger.reasonRank.methodologyAssessment.challengesSubmitted = 5;
      challenger.reasonRank.methodologyAssessment.validChallenges = 5;
      challenger.calculateReasonRank();
      const initialRR = challenger.reasonRank.overall;

      await challenger.updateMethodologyFromChallenge('challenge456', false);

      expect(challenger.reasonRank.methodologyAssessment.invalidChallenges).toBe(1);

      challenger.calculateReasonRank();
      expect(challenger.reasonRank.overall).toBeLessThan(initialRR);

      await User.findByIdAndDelete(challenger._id);
    });

    test('should reward accurate evaluations aligned with consensus', async () => {
      const evaluator = await User.create({
        username: 'evaluator',
        email: 'evaluator@example.com',
        password: 'password123',
      });

      await evaluator.updateMethodologyFromEvaluation('eval123', true);

      expect(evaluator.reasonRank.methodologyAssessment.evaluationsSubmitted).toBe(1);
      expect(evaluator.reasonRank.methodologyAssessment.accurateEvaluations).toBe(1);

      evaluator.calculateReasonRank();
      expect(evaluator.reasonRank.overall).toBeGreaterThan(0);

      await User.findByIdAndDelete(evaluator._id);
    });
  });

  describe('Linkage Type Classification', () => {
    test('should correctly classify linkage types', () => {
      expect(testEvidence.getLinkageType(0.95)).toBe('directly_proves');
      expect(testEvidence.getLinkageType(0.8)).toBe('strongly_supports');
      expect(testEvidence.getLinkageType(0.6)).toBe('moderately_supports');
      expect(testEvidence.getLinkageType(0.4)).toBe('weakly_supports');
      expect(testEvidence.getLinkageType(0.2)).toBe('barely_relevant');
      expect(testEvidence.getLinkageType(0.05)).toBe('irrelevant');
    });
  });

  describe('Principle: Arguments Over Credentials', () => {
    test('should track credentials but not use them in scoring', () => {
      const user = new User({
        username: 'phd_user',
        email: 'phd@example.com',
        password: 'password123',
      });

      // Add credentials
      user.reasonRank.credentials.push({
        type: 'PhD',
        field: 'Climate Science',
        institution: 'MIT',
        verified: true,
      });

      // Credentials should NOT affect ReasonRank
      const rrWithoutCredentials = user.calculateReasonRank();

      user.reasonRank.credentials.push({
        type: 'Nobel Prize',
        field: 'Physics',
        institution: 'Nobel Committee',
        verified: true,
      });

      const rrWithCredentials = user.calculateReasonRank();

      // ReasonRank should be identical
      expect(rrWithCredentials).toBe(rrWithoutCredentials);

      // But credentials should be tracked
      expect(user.reasonRank.credentials.length).toBe(2);
      expect(user.reasonRank.credentials[0].note).toContain(
        'do not affect ReasonRank'
      );
    });
  });
});
