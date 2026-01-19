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
    description: 'Legacy verification-based score',
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'disputed', 'debunked'],
    default: 'unverified',
  },

  // ===== EVIDENCE QUALITY SCORING (METHODOLOGY-BASED) =====
  // Principle: Arguments matter more than credentials
  // Quality assessed via 4 Patterns of Argument Strength

  qualityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
    description: 'Methodology quality score based on 4 patterns',
  },

  // Pattern 1: Transparent Measurement with Controls
  methodologyTransparency: {
    hasDisclosedMethod: {
      type: Boolean,
      default: false,
      description: 'Methodology is explicitly described',
    },
    hasControlVariables: {
      type: Boolean,
      default: false,
      description: 'Controlled for alternative explanations',
    },
    hasRawData: {
      type: Boolean,
      default: false,
      description: 'Raw data is available for inspection',
    },
    hasPeerReview: {
      type: Boolean,
      default: false,
      description: 'Has been peer reviewed (not just published)',
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Transparency pattern score',
    },
  },

  // Pattern 2: Replication Across Contexts
  replication: {
    hasIndependentReplications: {
      type: Boolean,
      default: false,
      description: 'Independently replicated by different groups',
    },
    replicationCount: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of independent replications',
    },
    replicationContexts: [{
      description: String,
      source: String,
      successful: Boolean,
    }],
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Replication pattern score',
    },
  },

  // Pattern 3: Falsifiable Predictions
  falsifiability: {
    hasFalsifiablePredictions: {
      type: Boolean,
      default: false,
      description: 'Makes specific, testable predictions',
    },
    predictions: [{
      prediction: String,
      outcome: {
        type: String,
        enum: ['validated', 'falsified', 'pending', 'unclear'],
      },
      evidence: String,
    }],
    validatedPredictionCount: {
      type: Number,
      default: 0,
    },
    falsifiedPredictionCount: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Falsifiability pattern score',
    },
  },

  // Pattern 4: Explicit Assumptions
  assumptions: {
    hasExplicitAssumptions: {
      type: Boolean,
      default: false,
      description: 'Assumptions are clearly stated',
    },
    assumptionsList: [{
      assumption: String,
      justification: String,
      challenged: Boolean,
      challengeIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MethodologyChallenge',
      }],
    }],
    hiddenAssumptionsExposed: {
      type: Number,
      default: 0,
      description: 'Number of hidden assumptions exposed by challenges',
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Assumption explicitness score',
    },
  },

  // Methodology challenges (tracks all challenges to this evidence)
  methodologyChallenges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MethodologyChallenge',
  }],

  // Aggregate impact of accepted challenges on quality
  challengeImpact: {
    totalChallenges: {
      type: Number,
      default: 0,
    },
    acceptedChallenges: {
      type: Number,
      default: 0,
    },
    totalQualityReduction: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Total points reduced due to valid challenges',
    },
  },

  // ===== LINKAGE SCORING =====
  // Does this evidence actually prove the specific claim being made?

  linkageScores: [{
    // Each evidence can be linked to multiple arguments with different linkage strengths
    argumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Argument',
    },
    linkageScore: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
      description: 'How directly this evidence supports this specific argument (0-1)',
    },
    linkageType: {
      type: String,
      enum: [
        'directly_proves',      // 0.9-1.0: Evidence directly demonstrates the claim
        'strongly_supports',    // 0.7-0.9: Strong support but not definitive
        'moderately_supports',  // 0.5-0.7: Provides support with caveats
        'weakly_supports',      // 0.3-0.5: Tangentially related
        'barely_relevant',      // 0.1-0.3: Weak connection
        'irrelevant',          // 0.0-0.1: Does not support claim
      ],
    },
    // Challenges to linkage (separate from methodology challenges)
    linkageChallenges: [{
      challenger: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      challenge: String,
      isValid: Boolean,
      impact: Number, // How much this reduces linkage score
    }],
  }],

  // ===== EVIDENCE IMPACT (Quality × Linkage) =====
  // This is calculated per argument
  evidenceImpacts: [{
    argumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Argument',
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    linkageScore: {
      type: Number,
      min: 0,
      max: 1,
    },
    evidenceImpact: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Quality × Linkage = final weight this evidence carries',
    },
  }],
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

// ===== QUALITY SCORE CALCULATION METHODS =====

// Pattern 1: Calculate Transparency Score
EvidenceSchema.methods.calculateTransparencyScore = function() {
  const { methodologyTransparency } = this;

  let score = 0;

  // Each component worth 25 points
  if (methodologyTransparency.hasDisclosedMethod) score += 25;
  if (methodologyTransparency.hasControlVariables) score += 25;
  if (methodologyTransparency.hasRawData) score += 25;
  if (methodologyTransparency.hasPeerReview) score += 25;

  this.methodologyTransparency.score = score;
  return score;
};

// Pattern 2: Calculate Replication Score
EvidenceSchema.methods.calculateReplicationScore = function() {
  const { replication } = this;

  if (!replication.hasIndependentReplications) {
    this.replication.score = 0;
    return 0;
  }

  // Base score for having replications
  let score = 30;

  // Add points for each successful replication (up to 5)
  const successfulReplications = replication.replicationContexts.filter(r => r.successful).length;
  score += Math.min(successfulReplications * 14, 70);

  this.replication.score = Math.min(score, 100);
  return this.replication.score;
};

// Pattern 3: Calculate Falsifiability Score
EvidenceSchema.methods.calculateFalsifiabilityScore = function() {
  const { falsifiability } = this;

  if (!falsifiability.hasFalsifiablePredictions) {
    this.falsifiability.score = 0;
    return 0;
  }

  const totalPredictions = falsifiability.validatedPredictionCount + falsifiability.falsifiedPredictionCount;

  if (totalPredictions === 0) {
    // Has predictions but not yet tested
    this.falsifiability.score = 40;
    return 40;
  }

  // Score based on ratio of validated to total tested predictions
  const validationRatio = falsifiability.validatedPredictionCount / totalPredictions;

  // High score requires high validation ratio
  const score = Math.round(validationRatio * 100);

  // Penalty for any falsified predictions
  const falsifiedPenalty = falsifiability.falsifiedPredictionCount * 20;

  this.falsifiability.score = Math.max(0, Math.min(100, score - falsifiedPenalty));
  return this.falsifiability.score;
};

// Pattern 4: Calculate Assumptions Score
EvidenceSchema.methods.calculateAssumptionsScore = function() {
  const { assumptions } = this;

  if (!assumptions.hasExplicitAssumptions) {
    // No explicit assumptions = unclear methodology
    // Penalty for hidden assumptions that were exposed
    const penalty = assumptions.hiddenAssumptionsExposed * 15;
    this.assumptions.score = Math.max(0, 50 - penalty);
    return this.assumptions.score;
  }

  // Base score for having explicit assumptions
  let score = 70;

  // Check if assumptions have justifications
  const justifiedAssumptions = assumptions.assumptionsList.filter(a => a.justification).length;
  const totalAssumptions = assumptions.assumptionsList.length;

  if (totalAssumptions > 0) {
    const justificationBonus = (justifiedAssumptions / totalAssumptions) * 30;
    score += justificationBonus;
  }

  // Penalty for challenged assumptions
  const challengedAssumptions = assumptions.assumptionsList.filter(a => a.challenged).length;
  const challengePenalty = challengedAssumptions * 10;

  this.assumptions.score = Math.max(0, Math.min(100, score - challengePenalty));
  return this.assumptions.score;
};

// Calculate overall Quality Score from 4 patterns
EvidenceSchema.methods.calculateQualityScore = async function() {
  // Calculate each pattern score
  const transparencyScore = this.calculateTransparencyScore();
  const replicationScore = this.calculateReplicationScore();
  const falsifiabilityScore = this.calculateFalsifiabilityScore();
  const assumptionsScore = this.calculateAssumptionsScore();

  // Weighted average of the 4 patterns
  // Transparency is most important (40%), then assumptions (25%), replication (20%), falsifiability (15%)
  let baseQuality = (
    transparencyScore * 0.40 +
    assumptionsScore * 0.25 +
    replicationScore * 0.20 +
    falsifiabilityScore * 0.15
  );

  // Apply impact of methodology challenges
  await this.populate('methodologyChallenges');

  const MethodologyChallenge = mongoose.model('MethodologyChallenge');
  const challenges = await MethodologyChallenge.find({ evidenceId: this._id });

  let totalReduction = 0;
  let acceptedChallengeCount = 0;

  for (const challenge of challenges) {
    if (challenge.status === 'accepted' || challenge.status === 'partially_accepted') {
      const reduction = challenge.evaluation.weightedImpact || 0;
      totalReduction += reduction;
      acceptedChallengeCount++;
    }
  }

  // Update challenge impact tracking
  this.challengeImpact.totalChallenges = challenges.length;
  this.challengeImpact.acceptedChallenges = acceptedChallengeCount;
  this.challengeImpact.totalQualityReduction = Math.min(totalReduction, baseQuality);

  // Final quality score = base quality - challenge impact
  // Each accepted challenge reduces quality by its impact score
  this.qualityScore = Math.max(0, Math.round(baseQuality - totalReduction));

  return this.qualityScore;
};

// Calculate Evidence Impact for a specific argument (Quality × Linkage)
EvidenceSchema.methods.calculateEvidenceImpact = async function(argumentId) {
  // Ensure quality score is up to date
  await this.calculateQualityScore();

  // Find linkage score for this argument
  const linkage = this.linkageScores.find(
    ls => ls.argumentId.toString() === argumentId.toString()
  );

  if (!linkage) {
    // No linkage defined yet, use default
    return {
      qualityScore: this.qualityScore,
      linkageScore: 0.5,
      evidenceImpact: this.qualityScore * 0.5,
    };
  }

  // Calculate impact from linkage challenges
  let linkageScore = linkage.linkageScore;
  if (linkage.linkageChallenges && linkage.linkageChallenges.length > 0) {
    const validChallenges = linkage.linkageChallenges.filter(c => c.isValid);
    const totalReduction = validChallenges.reduce((sum, c) => sum + (c.impact || 0), 0);
    linkageScore = Math.max(0, linkageScore - (totalReduction / 100));
  }

  // Evidence Impact = Quality × Linkage
  const evidenceImpact = this.qualityScore * linkageScore;

  // Update or add impact record
  const impactIndex = this.evidenceImpacts.findIndex(
    ei => ei.argumentId.toString() === argumentId.toString()
  );

  const impactRecord = {
    argumentId,
    qualityScore: this.qualityScore,
    linkageScore,
    evidenceImpact,
  };

  if (impactIndex >= 0) {
    this.evidenceImpacts[impactIndex] = impactRecord;
  } else {
    this.evidenceImpacts.push(impactRecord);
  }

  return impactRecord;
};

// Set linkage score for an argument
EvidenceSchema.methods.setLinkageScore = function(argumentId, linkageScore, linkageType) {
  const linkageIndex = this.linkageScores.findIndex(
    ls => ls.argumentId.toString() === argumentId.toString()
  );

  const linkageRecord = {
    argumentId,
    linkageScore: Math.max(0, Math.min(1, linkageScore)),
    linkageType: linkageType || this.getLinkageType(linkageScore),
    linkageChallenges: linkageIndex >= 0 ? this.linkageScores[linkageIndex].linkageChallenges : [],
  };

  if (linkageIndex >= 0) {
    this.linkageScores[linkageIndex] = linkageRecord;
  } else {
    this.linkageScores.push(linkageRecord);
  }

  return linkageRecord;
};

// Helper to determine linkage type from score
EvidenceSchema.methods.getLinkageType = function(score) {
  if (score >= 0.9) return 'directly_proves';
  if (score >= 0.7) return 'strongly_supports';
  if (score >= 0.5) return 'moderately_supports';
  if (score >= 0.3) return 'weakly_supports';
  if (score >= 0.1) return 'barely_relevant';
  return 'irrelevant';
};

// Add a linkage challenge
EvidenceSchema.methods.addLinkageChallenge = function(argumentId, challengerId, challenge) {
  const linkageIndex = this.linkageScores.findIndex(
    ls => ls.argumentId.toString() === argumentId.toString()
  );

  if (linkageIndex < 0) {
    throw new Error('Linkage not found for this argument');
  }

  this.linkageScores[linkageIndex].linkageChallenges.push({
    challenger: challengerId,
    challenge,
    isValid: null, // To be evaluated
    impact: 0,
  });

  return this.save();
};

// ===== LEGACY CREDIBILITY SCORE (kept for backwards compatibility) =====

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

// Index for searching
EvidenceSchema.index({ title: 'text', description: 'text' });
EvidenceSchema.index({ type: 1, verificationStatus: 1 });

export default mongoose.model('Evidence', EvidenceSchema);
