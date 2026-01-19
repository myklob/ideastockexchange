import mongoose from 'mongoose';

const EvidenceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide evidence title'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  type: {
    type: String,
    enum: ['study', 'article', 'book', 'video', 'image', 'data', 'expert-opinion', 'other'],
    required: true,
  },
  source: {
    url: {
      type: String,
      trim: true,
    },
    author: {
      type: String,
      trim: true,
    },
    publication: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
    },
  },
  credibilityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
    description: 'Simple verification-based score (legacy)',
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'disputed', 'debunked'],
    default: 'unverified',
  },
  // ===== EVIDENCE QUALITY SCORE SYSTEM =====
  // Based on "Evidence Scores: When Arguments Break Under Pressure"
  //
  // Evidence Impact = Quality Score × Linkage Score
  //
  // Quality Score: How well does the methodology hold up when challenged?
  // - NOT based on credentials or institutional prestige
  // - Based on 4 patterns of argument strength
  // - Calculated from methodology claims and their challenges
  //
  qualityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
    description: 'How well does the methodology survive scrutiny? (Independent of who produced it)',
  },
  // The 4 Patterns of Argument Strength (from manifesto)
  methodologyPatternScores: {
    transparentMeasurement: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      description: 'Pattern 1: Transparent measurement with controls - showed methodology, controlled for alternatives',
    },
    replicationAcrossContexts: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      description: 'Pattern 2: Replication across contexts - multiple independent groups, different methods, similar conclusions',
    },
    falsifiablePredictions: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      description: 'Pattern 3: Falsifiable predictions - made specific testable predictions that were validated',
    },
    explicitAssumptions: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      description: 'Pattern 4: Explicit assumptions - clearly stated assumptions so they can be challenged',
    },
  },
  // Linkage score (how relevant is this evidence to specific claims)
  // This will be calculated per-argument, stored in Argument model
  // But we track a default/average here
  linkageScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
    description: 'How directly does this evidence prove the claims it\'s cited for?',
  },
  // Evidence Impact = Quality × Linkage (the actual weight this evidence carries)
  evidenceImpact: {
    type: Number,
    default: 25, // 50 × 50 = 2500, normalized to 0-100 = 25
    min: 0,
    max: 100,
    description: 'Final evidence weight: Quality Score × Linkage Score (normalized)',
  },
  // Methodology claims for this evidence
  methodologyClaims: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MethodologyClaim',
  }],
  // ===== END EVIDENCE QUALITY SCORE SYSTEM =====
  verifiedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['verified', 'disputed'],
    },
    notes: String,
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  arguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument',
  }],
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  metadata: {
    doi: String,
    isbn: String,
    pmid: String,
    citations: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Calculate credibility score based on verifications
EvidenceSchema.methods.calculateCredibilityScore = function() {
  if (this.verifiedBy.length === 0) {
    this.credibilityScore = 50;
    return this.credibilityScore;
  }

  const verifiedCount = this.verifiedBy.filter(v => v.status === 'verified').length;
  const disputedCount = this.verifiedBy.filter(v => v.status === 'disputed').length;

  const score = 50 + (verifiedCount * 10) - (disputedCount * 10);
  this.credibilityScore = Math.max(0, Math.min(100, score));

  // Update verification status
  if (verifiedCount >= 3) {
    this.verificationStatus = 'verified';
  } else if (disputedCount >= 3) {
    this.verificationStatus = 'disputed';
  }

  return this.credibilityScore;
};

// Add verification
EvidenceSchema.methods.addVerification = function(userId, status, notes) {
  this.verifiedBy.push({
    user: userId,
    status,
    notes,
    verifiedAt: new Date(),
  });

  this.calculateCredibilityScore();
  return this.save();
};

/**
 * Calculate Quality Score based on methodology claims and their challenges
 *
 * Formula from "Evidence Scores: When Arguments Break Under Pressure":
 *
 * Quality Score = weighted average of 4 methodology patterns:
 * - Pattern 1: Transparent Measurement (30%)
 * - Pattern 2: Replication Across Contexts (30%)
 * - Pattern 3: Falsifiable Predictions (20%)
 * - Pattern 4: Explicit Assumptions (20%)
 *
 * Each pattern score comes from methodology claims that have survived challenges.
 *
 * This score is independent of credentials - it's based purely on whether
 * the methodology survives scrutiny.
 */
EvidenceSchema.methods.calculateQualityScore = async function() {
  // Populate methodology claims with their challenges
  await this.populate({
    path: 'methodologyClaims',
    populate: {
      path: 'challenges',
    },
  });

  if (!this.methodologyClaims || this.methodologyClaims.length === 0) {
    // No methodology claims = default neutral score
    this.qualityScore = 50;
    this.methodologyPatternScores = {
      transparentMeasurement: 0,
      replicationAcrossContexts: 0,
      falsifiablePredictions: 0,
      explicitAssumptions: 0,
    };
    return this.qualityScore;
  }

  // Calculate each claim's credibility and pattern contributions
  const patternScores = {
    transparentMeasurement: [],
    replicationAcrossContexts: [],
    falsifiablePredictions: [],
    explicitAssumptions: [],
  };

  for (const claim of this.methodologyClaims) {
    // Recalculate claim credibility based on challenges
    await claim.calculateCredibilityScore();

    // Get pattern strengths from this claim
    const patterns = claim.evaluatePatternStrengths();

    // Accumulate pattern scores
    if (patterns.transparentMeasurement > 0) {
      patternScores.transparentMeasurement.push(patterns.transparentMeasurement);
    }
    if (patterns.replicationAcrossContexts > 0) {
      patternScores.replicationAcrossContexts.push(patterns.replicationAcrossContexts);
    }
    if (patterns.falsifiablePredictions > 0) {
      patternScores.falsifiablePredictions.push(patterns.falsifiablePredictions);
    }
    if (patterns.explicitAssumptions > 0) {
      patternScores.explicitAssumptions.push(patterns.explicitAssumptions);
    }
  }

  // Calculate average score for each pattern
  const avgPatternScores = {};
  for (const [pattern, scores] of Object.entries(patternScores)) {
    if (scores.length > 0) {
      avgPatternScores[pattern] = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    } else {
      avgPatternScores[pattern] = 0;
    }
  }

  // Update pattern scores
  this.methodologyPatternScores = {
    transparentMeasurement: Math.round(avgPatternScores.transparentMeasurement),
    replicationAcrossContexts: Math.round(avgPatternScores.replicationAcrossContexts),
    falsifiablePredictions: Math.round(avgPatternScores.falsifiablePredictions),
    explicitAssumptions: Math.round(avgPatternScores.explicitAssumptions),
  };

  // Calculate overall quality score (weighted average of patterns)
  this.qualityScore = Math.round(
    this.methodologyPatternScores.transparentMeasurement * 0.30 +
    this.methodologyPatternScores.replicationAcrossContexts * 0.30 +
    this.methodologyPatternScores.falsifiablePredictions * 0.20 +
    this.methodologyPatternScores.explicitAssumptions * 0.20
  );

  return this.qualityScore;
};

/**
 * Calculate Evidence Impact
 *
 * Formula: Evidence Impact = Quality Score × Linkage Score
 *
 * - Quality Score: How well does methodology survive challenges? (0-100)
 * - Linkage Score: How directly does this prove the claim? (0-100)
 * - Result: Normalized to 0-100 scale
 *
 * This prevents two common forms of BS:
 * 1. Strong methodology, irrelevant sources (data dumping)
 * 2. Weak methodology, directly relevant claims (anecdotes)
 */
EvidenceSchema.methods.calculateEvidenceImpact = async function() {
  // Ensure quality score is calculated
  await this.calculateQualityScore();

  // Evidence Impact = Quality × Linkage
  // Both are 0-100, multiply and normalize
  // 100 × 100 = 10000 → 100
  // 50 × 50 = 2500 → 25
  // 0 × anything = 0
  const impact = (this.qualityScore * this.linkageScore) / 100;
  this.evidenceImpact = Math.round(impact);

  return this.evidenceImpact;
};

/**
 * Get detailed methodology breakdown
 *
 * Returns a comprehensive view of:
 * - All methodology claims
 * - Challenges to each claim
 * - Network consensus on challenges
 * - Pattern strengths
 * - Overall quality score
 */
EvidenceSchema.methods.getMethodologyBreakdown = async function() {
  await this.populate({
    path: 'methodologyClaims',
    populate: {
      path: 'challenges',
      populate: {
        path: 'challenger evaluations.evaluator',
        select: 'username reasonRank',
      },
    },
  });

  await this.calculateQualityScore();

  return {
    qualityScore: this.qualityScore,
    linkageScore: this.linkageScore,
    evidenceImpact: this.evidenceImpact,
    patternScores: this.methodologyPatternScores,
    claims: this.methodologyClaims.map(claim => ({
      id: claim._id,
      claim: claim.claim,
      type: claim.claimType,
      credibilityScore: claim.credibilityScore,
      status: claim.status,
      challengeCount: claim.challenges?.length || 0,
      validChallenges: claim.networkEvaluation?.validChallengeCount || 0,
      invalidChallenges: claim.networkEvaluation?.invalidChallengeCount || 0,
      challenges: claim.challenges?.map(challenge => ({
        id: challenge._id,
        challenge: challenge.challenge,
        type: challenge.challengeType,
        challenger: challenge.challenger?.username,
        isValid: challenge.networkConsensus?.isValid,
        consensusStrength: challenge.networkConsensus?.confidenceScore,
        evaluationCount: challenge.networkConsensus?.evaluationCount || 0,
      })) || [],
    })),
  };
};

/**
 * Add a methodology claim to this evidence
 *
 * Anyone can submit methodology claims
 * The claims will be evaluated through challenges
 */
EvidenceSchema.methods.addMethodologyClaim = async function(claimData, userId) {
  const MethodologyClaim = mongoose.model('MethodologyClaim');

  const claim = new MethodologyClaim({
    evidenceId: this._id,
    claim: claimData.claim,
    claimType: claimData.claimType,
    details: claimData.details,
    sourceReference: claimData.sourceReference,
    submittedBy: userId,
  });

  await claim.save();

  this.methodologyClaims.push(claim._id);
  await this.save();

  // Recalculate quality score
  await this.calculateQualityScore();
  await this.calculateEvidenceImpact();
  await this.save();

  return claim;
};

// Index for searching
EvidenceSchema.index({ title: 'text', description: 'text' });
EvidenceSchema.index({ type: 1, verificationStatus: 1 });
EvidenceSchema.index({ qualityScore: -1, evidenceImpact: -1 });

export default mongoose.model('Evidence', EvidenceSchema);
