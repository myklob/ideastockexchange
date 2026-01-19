import mongoose from 'mongoose';

/**
 * MethodologyClaim Model
 *
 * Represents a claim about the methodology used in evidence.
 * These are the building blocks for Evidence Quality Scores.
 *
 * Examples:
 * - "This used random assignment"
 * - "Sample size was N=5000"
 * - "We controlled for income, age, geography"
 * - "Measurement instrument was validated in prior studies"
 *
 * Each claim can be challenged by any user, regardless of credentials.
 * The strength of challenges determines the claim's credibility.
 */
const MethodologyClaimSchema = new mongoose.Schema({
  evidenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evidence',
    required: true,
    index: true,
  },

  // The methodology claim being made
  claim: {
    type: String,
    required: [true, 'Methodology claim text is required'],
    trim: true,
    minlength: [10, 'Claim must be at least 10 characters'],
    maxlength: [500, 'Claim cannot exceed 500 characters'],
  },

  // Type of methodology claim
  claimType: {
    type: String,
    enum: [
      'measurement-method',      // "We used double-blind trials"
      'sample-size',             // "N=5000 participants"
      'control-variables',       // "Controlled for age, income, geography"
      'random-assignment',       // "Participants were randomly assigned"
      'replication',             // "Replicated across 3 independent studies"
      'validation',              // "Instrument validated in prior research"
      'transparency',            // "Data and code publicly available"
      'peer-review',             // "Published in peer-reviewed journal"
      'pre-registration',        // "Study pre-registered before data collection"
      'conflict-disclosure',     // "No conflicts of interest"
      'falsifiable-prediction',  // "Made specific testable predictions"
      'explicit-assumptions',    // "Clearly stated our assumptions"
      'other',
    ],
    required: true,
  },

  // Supporting details for the claim
  details: {
    type: String,
    trim: true,
    maxlength: [1000, 'Details cannot exceed 1000 characters'],
    description: 'Additional context, data, or evidence supporting this methodology claim',
  },

  // Reference to where this claim is documented
  sourceReference: {
    section: {
      type: String,
      description: 'Where in the source document this is documented (e.g., "Methods section, page 3")',
    },
    url: {
      type: String,
      description: 'Direct link to the methodology documentation',
    },
    quote: {
      type: String,
      maxlength: [500, 'Quote cannot exceed 500 characters'],
      description: 'Direct quote from source supporting this claim',
    },
  },

  // Who submitted this methodology claim
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Credibility score for this specific methodology claim
  // Calculated based on challenges and network evaluation
  credibilityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
    description: 'How credible is this methodology claim? (Based on challenges and network evaluation)',
  },

  // Pattern strength indicators (from the 4 patterns in the manifesto)
  patternStrengths: {
    transparentMeasurement: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      description: 'Pattern 1: Transparent measurement with controls',
    },
    replicationAcrossContexts: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      description: 'Pattern 2: Replication across different contexts/methods',
    },
    falsifiablePredictions: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      description: 'Pattern 3: Makes falsifiable predictions',
    },
    explicitAssumptions: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      description: 'Pattern 4: Explicitly states assumptions',
    },
  },

  // Challenges to this methodology claim
  challenges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MethodologyChallenge',
  }],

  // Network evaluation
  networkEvaluation: {
    validChallengeCount: {
      type: Number,
      default: 0,
      description: 'Number of challenges deemed valid by the network',
    },
    invalidChallengeCount: {
      type: Number,
      default: 0,
      description: 'Number of challenges deemed invalid by the network',
    },
    strengthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      description: 'Overall strength after network evaluation',
    },
  },

  // Status tracking
  status: {
    type: String,
    enum: ['active', 'challenged', 'validated', 'refuted'],
    default: 'active',
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
 * Calculate credibility score based on challenges
 *
 * Logic:
 * - Starts at 50 (neutral)
 * - Each valid challenge reduces score
 * - Each invalid challenge increases confidence
 * - Score reflects how well claim survives scrutiny
 */
MethodologyClaimSchema.methods.calculateCredibilityScore = async function() {
  await this.populate({
    path: 'challenges',
    populate: {
      path: 'evaluations.evaluator',
      select: 'reasonRank',
    },
  });

  if (!this.challenges || this.challenges.length === 0) {
    // No challenges = neutral credibility
    this.credibilityScore = 50;
    this.status = 'active';
    return this.credibilityScore;
  }

  // Evaluate each challenge based on network consensus
  let validChallenges = 0;
  let invalidChallenges = 0;
  let totalChallengeStrength = 0;

  for (const challenge of this.challenges) {
    if (challenge.networkConsensus && challenge.networkConsensus.isValid) {
      validChallenges++;
      totalChallengeStrength += challenge.networkConsensus.confidenceScore || 50;
    } else if (challenge.networkConsensus && !challenge.networkConsensus.isValid) {
      invalidChallenges++;
    }
  }

  // Update network evaluation
  this.networkEvaluation.validChallengeCount = validChallenges;
  this.networkEvaluation.invalidChallengeCount = invalidChallenges;

  // Calculate score
  // Valid challenges reduce score based on their strength
  // Invalid challenges increase confidence slightly
  let score = 50;

  if (validChallenges > 0) {
    const avgChallengeStrength = totalChallengeStrength / validChallenges;
    const challengePenalty = (validChallenges * 15 * (avgChallengeStrength / 100));
    score = Math.max(0, score - challengePenalty);
  }

  if (invalidChallenges > 0) {
    // Surviving invalid challenges builds confidence
    score = Math.min(100, score + (invalidChallenges * 5));
  }

  this.credibilityScore = Math.round(score);
  this.networkEvaluation.strengthScore = this.credibilityScore;

  // Update status
  if (validChallenges > 0 && this.credibilityScore < 30) {
    this.status = 'refuted';
  } else if (validChallenges > 0) {
    this.status = 'challenged';
  } else if (invalidChallenges >= 3) {
    this.status = 'validated';
  } else {
    this.status = 'active';
  }

  return this.credibilityScore;
};

/**
 * Evaluate pattern strengths for this claim
 *
 * Maps claim types to the 4 methodology patterns
 * This helps calculate Evidence Quality Score
 */
MethodologyClaimSchema.methods.evaluatePatternStrengths = function() {
  // Reset pattern strengths
  this.patternStrengths = {
    transparentMeasurement: 0,
    replicationAcrossContexts: 0,
    falsifiablePredictions: 0,
    explicitAssumptions: 0,
  };

  // Map claim types to patterns
  switch (this.claimType) {
    case 'measurement-method':
    case 'control-variables':
    case 'transparency':
    case 'random-assignment':
      this.patternStrengths.transparentMeasurement = this.credibilityScore;
      break;

    case 'replication':
    case 'validation':
      this.patternStrengths.replicationAcrossContexts = this.credibilityScore;
      break;

    case 'falsifiable-prediction':
    case 'pre-registration':
      this.patternStrengths.falsifiablePredictions = this.credibilityScore;
      break;

    case 'explicit-assumptions':
    case 'conflict-disclosure':
      this.patternStrengths.explicitAssumptions = this.credibilityScore;
      break;

    case 'sample-size':
      // Sample size contributes to transparent measurement
      this.patternStrengths.transparentMeasurement = Math.min(this.credibilityScore, 70);
      break;

    case 'peer-review':
      // Peer review contributes modestly to replication
      this.patternStrengths.replicationAcrossContexts = Math.min(this.credibilityScore, 60);
      break;

    default:
      // Other claims contribute modestly to explicit assumptions
      this.patternStrengths.explicitAssumptions = Math.min(this.credibilityScore, 50);
  }

  return this.patternStrengths;
};

// Indexes for efficient queries
MethodologyClaimSchema.index({ evidenceId: 1, status: 1 });
MethodologyClaimSchema.index({ claimType: 1 });
MethodologyClaimSchema.index({ submittedBy: 1 });
MethodologyClaimSchema.index({ credibilityScore: -1 });

export default mongoose.model('MethodologyClaim', MethodologyClaimSchema);
