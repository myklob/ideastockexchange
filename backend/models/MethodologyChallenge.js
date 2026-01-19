import mongoose from 'mongoose';

/**
 * MethodologyChallenge Model
 *
 * Represents a challenge to a methodology claim.
 * This is the core of the credential-agnostic evaluation system.
 *
 * Examples from the manifesto:
 * - "Your multipliers are from 2010 data, but labor markets changed significantly"
 * - "You assumed Z% implementation rate, but the text of the law shows that's voluntary"
 * - "Your Table 3 shows the treatment group was already social distancing more - that's a confounding variable"
 *
 * The challenge doesn't care about who you are - it cares about whether
 * your methodological argument survives scrutiny.
 *
 * ReasonRank Integration:
 * - Valid challenges earn RR for the challenger
 * - Invalid challenges lose RR for the challenger
 * - Accurate evaluations earn RR for evaluators
 */
const MethodologyChallengeSchema = new mongoose.Schema({
  methodologyClaimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MethodologyClaim',
    required: true,
    index: true,
  },

  evidenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evidence',
    required: true,
    index: true,
    description: 'Link to evidence for easier querying',
  },

  // The challenger (credentials don't matter)
  challenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // The challenge itself
  challenge: {
    type: String,
    required: [true, 'Challenge text is required'],
    trim: true,
    minlength: [20, 'Challenge must be at least 20 characters to be substantive'],
    maxlength: [1000, 'Challenge cannot exceed 1000 characters'],
  },

  // Type of methodological challenge
  challengeType: {
    type: String,
    enum: [
      'confounding-variable',       // "You didn't control for X, which affects results"
      'outdated-data',              // "Your data is from 2010, context has changed"
      'small-sample',               // "N=50 is too small for this claim"
      'selection-bias',             // "Your sample isn't representative"
      'measurement-error',          // "Your instrument doesn't measure what you claim"
      'unjustified-assumption',     // "You assume X without evidence"
      'lack-of-replication',        // "No independent verification"
      'conflicts-of-interest',      // "Undisclosed financial incentives"
      'p-hacking',                  // "Looks like data was cherry-picked"
      'circular-reasoning',         // "Your evidence assumes your conclusion"
      'lack-of-transparency',       // "Data/methods not available for verification"
      'falsification',              // "This claim contradicts the source data"
      'misrepresentation',          // "This quote is taken out of context"
      'other',
    ],
    required: true,
  },

  // Supporting evidence for the challenge
  supportingEvidence: {
    description: {
      type: String,
      maxlength: [500, 'Evidence description cannot exceed 500 characters'],
    },
    sources: [{
      url: String,
      title: String,
      author: String,
      quote: {
        type: String,
        maxlength: [500, 'Quote cannot exceed 500 characters'],
      },
    }],
  },

  // Sub-arguments defending or refuting this challenge
  subArguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument',
    description: 'Arguments for/against this challenge',
  }],

  // Network evaluation of this challenge
  evaluations: [{
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isValid: {
      type: Boolean,
      required: true,
      description: 'Does this evaluator think the challenge is methodologically sound?',
    },
    reasoning: {
      type: String,
      maxlength: [500, 'Reasoning cannot exceed 500 characters'],
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      description: 'How confident is this evaluator in their assessment?',
    },
    evaluatorReasonRank: {
      type: Number,
      description: 'Evaluator ReasonRank at time of evaluation (cached for historical record)',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],

  // Network consensus (calculated from evaluations)
  networkConsensus: {
    isValid: {
      type: Boolean,
      description: 'Does the network think this challenge is valid?',
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'How strong is the network consensus?',
    },
    evaluationCount: {
      type: Number,
      default: 0,
    },
    validCount: {
      type: Number,
      default: 0,
    },
    invalidCount: {
      type: Number,
      default: 0,
    },
    lastCalculated: {
      type: Date,
    },
  },

  // ReasonRank impact tracking
  reasonRankImpact: {
    challengerReward: {
      type: Number,
      default: 0,
      description: 'ReasonRank gained/lost by challenger based on challenge validity',
    },
    evaluatorRewards: [{
      evaluator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reward: {
        type: Number,
        description: 'ReasonRank gained/lost for accurate evaluation',
      },
    }],
    lastUpdated: {
      type: Date,
    },
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'evaluated', 'accepted', 'rejected'],
    default: 'pending',
  },

  // Timestamps
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

/**
 * Calculate network consensus on whether this challenge is valid
 *
 * Logic:
 * - Weight evaluations by evaluator's ReasonRank
 * - High RR evaluators have more influence (they've proven accuracy)
 * - But anyone can evaluate - RR just weights their input
 */
MethodologyChallengeSchema.methods.calculateNetworkConsensus = async function() {
  await this.populate({
    path: 'evaluations.evaluator',
    select: 'reasonRank username',
  });

  if (!this.evaluations || this.evaluations.length === 0) {
    this.networkConsensus = {
      isValid: null,
      confidenceScore: 0,
      evaluationCount: 0,
      validCount: 0,
      invalidCount: 0,
      lastCalculated: new Date(),
    };
    this.status = 'pending';
    return this.networkConsensus;
  }

  // Count evaluations
  let validCount = 0;
  let invalidCount = 0;
  let weightedValidScore = 0;
  let totalWeight = 0;

  for (const evaluation of this.evaluations) {
    // Weight by ReasonRank (higher RR = more influence)
    // But everyone starts with some base weight (10)
    // This ensures new users can participate, but proven evaluators have more impact
    const evaluatorRR = evaluation.evaluator?.reasonRank || 0;
    const weight = 10 + (evaluatorRR / 10); // Scale: 10-20 for RR 0-100

    if (evaluation.isValid) {
      validCount++;
      weightedValidScore += weight * (evaluation.confidence / 100);
    } else {
      invalidCount++;
    }

    totalWeight += weight;
  }

  // Calculate consensus
  const validRatio = totalWeight > 0 ? weightedValidScore / totalWeight : 0;
  const isValid = validRatio > 0.5;
  const confidenceScore = Math.round(validRatio * 100);

  // Update consensus
  this.networkConsensus = {
    isValid,
    confidenceScore,
    evaluationCount: this.evaluations.length,
    validCount,
    invalidCount,
    lastCalculated: new Date(),
  };

  // Update status
  if (this.evaluations.length >= 3) {
    this.status = isValid ? 'accepted' : 'rejected';
  } else {
    this.status = 'evaluated';
  }

  return this.networkConsensus;
};

/**
 * Calculate ReasonRank rewards/penalties
 *
 * Logic from manifesto:
 * - Valid challenges earn ReasonRank
 * - Invalid challenges lose ReasonRank
 * - Accurate evaluators earn ReasonRank
 * - Inaccurate evaluators lose ReasonRank
 *
 * This is how the system becomes meritocratic based on argument quality,
 * not credentials.
 */
MethodologyChallengeSchema.methods.calculateReasonRankImpacts = async function() {
  // Need network consensus first
  if (!this.networkConsensus || this.networkConsensus.evaluationCount < 3) {
    // Not enough evaluations yet
    return this.reasonRankImpact;
  }

  await this.calculateNetworkConsensus();

  const isValidChallenge = this.networkConsensus.isValid;
  const consensusStrength = this.networkConsensus.confidenceScore;

  // 1. CHALLENGER REWARD/PENALTY
  // Valid challenge: +5 to +15 RR based on consensus strength
  // Invalid challenge: -3 to -10 RR based on consensus strength
  if (isValidChallenge) {
    this.reasonRankImpact.challengerReward = Math.round(5 + (consensusStrength / 100) * 10);
  } else {
    this.reasonRankImpact.challengerReward = -Math.round(3 + (consensusStrength / 100) * 7);
  }

  // 2. EVALUATOR REWARDS/PENALTIES
  this.reasonRankImpact.evaluatorRewards = [];

  for (const evaluation of this.evaluations) {
    const evaluatorAgreeWithConsensus = evaluation.isValid === isValidChallenge;
    const evaluatorConfidence = evaluation.confidence / 100;

    let reward;
    if (evaluatorAgreeWithConsensus) {
      // Accurate evaluation: +2 to +8 RR based on confidence and consensus strength
      reward = Math.round(2 + evaluatorConfidence * (consensusStrength / 100) * 6);
    } else {
      // Inaccurate evaluation: -1 to -5 RR based on confidence
      reward = -Math.round(1 + evaluatorConfidence * 4);
    }

    this.reasonRankImpact.evaluatorRewards.push({
      evaluator: evaluation.evaluator,
      reward,
    });
  }

  this.reasonRankImpact.lastUpdated = new Date();

  return this.reasonRankImpact;
};

/**
 * Apply ReasonRank rewards to users
 *
 * This should be called after network consensus is established
 * and should update User models directly
 */
MethodologyChallengeSchema.methods.applyReasonRankRewards = async function() {
  await this.calculateReasonRankImpacts();

  const User = mongoose.model('User');

  // Apply challenger reward
  if (this.reasonRankImpact.challengerReward !== 0) {
    await User.findByIdAndUpdate(
      this.challenger,
      {
        $inc: { reasonRank: this.reasonRankImpact.challengerReward },
      }
    );
  }

  // Apply evaluator rewards
  for (const reward of this.reasonRankImpact.evaluatorRewards) {
    if (reward.reward !== 0) {
      await User.findByIdAndUpdate(
        reward.evaluator,
        {
          $inc: { reasonRank: reward.reward },
        }
      );
    }
  }

  return this.reasonRankImpact;
};

/**
 * Add an evaluation to this challenge
 *
 * Anyone can evaluate - credentials don't matter
 * What matters is whether your evaluation aligns with network consensus
 */
MethodologyChallengeSchema.methods.addEvaluation = async function(evaluatorId, isValid, reasoning, confidence = 50) {
  // Check if user already evaluated
  const existingIndex = this.evaluations.findIndex(
    e => e.evaluator.toString() === evaluatorId.toString()
  );

  // Get evaluator's current ReasonRank
  const User = mongoose.model('User');
  const evaluator = await User.findById(evaluatorId).select('reasonRank');

  const newEvaluation = {
    evaluator: evaluatorId,
    isValid,
    reasoning,
    confidence,
    evaluatorReasonRank: evaluator?.reasonRank || 0,
    timestamp: new Date(),
  };

  if (existingIndex >= 0) {
    // Update existing evaluation
    this.evaluations[existingIndex] = newEvaluation;
  } else {
    // Add new evaluation
    this.evaluations.push(newEvaluation);
  }

  // Recalculate consensus
  await this.calculateNetworkConsensus();

  // If we have enough evaluations, calculate and apply RR rewards
  if (this.evaluations.length >= 3) {
    await this.applyReasonRankRewards();
  }

  return this.save();
};

// Indexes for efficient queries
MethodologyChallengeSchema.index({ methodologyClaimId: 1, status: 1 });
MethodologyChallengeSchema.index({ evidenceId: 1 });
MethodologyChallengeSchema.index({ challenger: 1 });
MethodologyChallengeSchema.index({ status: 1, createdAt: -1 });
MethodologyChallengeSchema.index({ 'networkConsensus.isValid': 1 });

export default mongoose.model('MethodologyChallenge', MethodologyChallengeSchema);
