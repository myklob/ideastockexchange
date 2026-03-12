import mongoose from 'mongoose';

/**
 * MethodologyChallenge Model
 *
 * Tracks challenges to evidence methodology, allowing anyone to question:
 * - Measurement methods
 * - Control variables
 * - Assumptions
 * - Data collection procedures
 * - Analysis methods
 *
 * This implements the principle: "Arguments matter more than credentials"
 * Challenges are evaluated based on their validity, not the challenger's authority.
 */

const MethodologyChallengeSchema = new mongoose.Schema({
  evidenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evidence',
    required: true,
    index: true,
  },
  challenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Type of methodology challenge
  challengeType: {
    type: String,
    enum: [
      'measurement_method',      // "Your measurement instrument is unreliable"
      'control_variables',       // "You didn't control for X confounding variable"
      'sample_issues',           // "Sample size too small / biased selection"
      'assumption_unjustified',  // "Your assumption Y is doing all the work and isn't justified"
      'data_quality',            // "Your data source is unreliable"
      'analysis_method',         // "Your statistical/analytical method is inappropriate"
      'replication_failure',     // "This hasn't been independently replicated"
      'conflicts_of_interest',   // "Financial/institutional incentives bias this"
      'cherry_picking',          // "You selected data to support conclusion"
      'outdated',                // "Methodology or data is outdated"
      'other',
    ],
    required: true,
  },

  // The specific methodological claim being challenged
  claim: {
    type: String,
    required: [true, 'Please specify what methodological claim you are challenging'],
    trim: true,
    maxlength: [500, 'Claim cannot exceed 500 characters'],
  },

  // The challenge argument
  challenge: {
    type: String,
    required: [true, 'Please provide your challenge argument'],
    trim: true,
    minlength: [20, 'Challenge must be at least 20 characters'],
    maxlength: [2000, 'Challenge cannot exceed 2000 characters'],
  },

  // Supporting evidence for the challenge
  supportingEvidence: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evidence',
  }],

  // Which of the 4 Patterns of Argument Strength does this challenge affect?
  affectedPattern: {
    type: String,
    enum: [
      'transparent_measurement',  // Challenges measurement transparency/controls
      'replication',             // Challenges replication claims
      'falsifiable_predictions', // Challenges prediction specificity/validation
      'explicit_assumptions',    // Challenges hidden/unjustified assumptions
      'multiple',                // Affects multiple patterns
    ],
  },

  // Evaluation of this challenge
  evaluation: {
    // Is this a valid methodological concern?
    isValid: {
      type: Boolean,
      default: null, // null = not yet evaluated
    },

    // Does it actually break the inference chain?
    breaksInference: {
      type: Boolean,
      default: null,
    },

    // Strength of the challenge if valid
    impactScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      description: 'How much this challenge reduces evidence quality if valid',
    },

    // Community evaluation
    evaluations: [{
      evaluator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      verdict: {
        type: String,
        enum: ['valid', 'invalid', 'partially_valid'],
      },
      reasoning: {
        type: String,
        maxlength: [1000, 'Reasoning cannot exceed 1000 characters'],
      },
      impactScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      evaluatedAt: {
        type: Date,
        default: Date.now,
      },
      // Track evaluator's ReasonRank at time of evaluation
      evaluatorReasonRank: {
        type: Number,
        default: 0,
      },
    }],

    // Aggregated evaluation from community
    consensusVerdict: {
      type: String,
      enum: ['valid', 'invalid', 'partially_valid', 'contested', 'pending'],
      default: 'pending',
    },

    // Weighted average impact (weighted by evaluator ReasonRank)
    weightedImpact: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },

  // Response from evidence submitter
  response: {
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    text: {
      type: String,
      maxlength: [2000, 'Response cannot exceed 2000 characters'],
    },
    respondedAt: {
      type: Date,
    },
    // Did the response adequately address the challenge?
    adequacy: [{
      evaluator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      isAdequate: Boolean,
      reasoning: String,
      evaluatedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },

  // Resolution status
  status: {
    type: String,
    enum: [
      'pending',           // Awaiting evaluation
      'under_review',      // Being evaluated
      'accepted',          // Challenge deemed valid, evidence quality reduced
      'refuted',           // Challenge deemed invalid
      'partially_accepted', // Some validity, moderate impact
      'addressed',         // Response adequately addressed the challenge
    ],
    default: 'pending',
  },

  // Metadata
  votes: {
    helpful: {
      type: Number,
      default: 0,
    },
    notHelpful: {
      type: Number,
      default: 0,
    },
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

// Calculate consensus on challenge validity
MethodologyChallengeSchema.methods.calculateConsensus = async function() {
  const evaluations = this.evaluation.evaluations || [];

  if (evaluations.length === 0) {
    this.evaluation.consensusVerdict = 'pending';
    this.evaluation.weightedImpact = 0;
    return;
  }

  // Weight evaluations by evaluator's ReasonRank
  let totalWeight = 0;
  let validWeight = 0;
  let invalidWeight = 0;
  let partialWeight = 0;
  let weightedImpactSum = 0;

  for (const eval of evaluations) {
    // Use ReasonRank as weight (minimum 1 to give everyone some voice)
    const weight = Math.max(1, eval.evaluatorReasonRank || 1);
    totalWeight += weight;

    if (eval.verdict === 'valid') {
      validWeight += weight;
      weightedImpactSum += (eval.impactScore || 50) * weight;
    } else if (eval.verdict === 'invalid') {
      invalidWeight += weight;
    } else if (eval.verdict === 'partially_valid') {
      partialWeight += weight;
      weightedImpactSum += (eval.impactScore || 25) * weight;
    }
  }

  // Determine consensus
  const validRatio = validWeight / totalWeight;
  const invalidRatio = invalidWeight / totalWeight;
  const partialRatio = partialWeight / totalWeight;

  if (validRatio > 0.6) {
    this.evaluation.consensusVerdict = 'valid';
    this.evaluation.isValid = true;
    this.evaluation.breaksInference = true;
  } else if (invalidRatio > 0.6) {
    this.evaluation.consensusVerdict = 'invalid';
    this.evaluation.isValid = false;
    this.evaluation.breaksInference = false;
  } else if (partialRatio > 0.4 || (validRatio > 0.3 && validRatio < 0.6)) {
    this.evaluation.consensusVerdict = 'partially_valid';
    this.evaluation.isValid = true;
    this.evaluation.breaksInference = false;
  } else {
    this.evaluation.consensusVerdict = 'contested';
  }

  // Calculate weighted impact score
  if (totalWeight > 0 && (validWeight + partialWeight) > 0) {
    this.evaluation.weightedImpact = Math.round(weightedImpactSum / totalWeight);
    this.evaluation.impactScore = this.evaluation.weightedImpact;
  }

  // Update status based on consensus
  if (this.evaluation.consensusVerdict === 'valid') {
    this.status = 'accepted';
  } else if (this.evaluation.consensusVerdict === 'invalid') {
    this.status = 'refuted';
  } else if (this.evaluation.consensusVerdict === 'partially_valid') {
    this.status = 'partially_accepted';
  }

  return this.evaluation;
};

// Add an evaluation for this challenge
MethodologyChallengeSchema.methods.addEvaluation = async function(evaluatorId, verdict, reasoning, impactScore, evaluatorReasonRank = 0) {
  // Check if user already evaluated
  const existingEvalIndex = this.evaluation.evaluations.findIndex(
    e => e.evaluator.toString() === evaluatorId.toString()
  );

  const evaluation = {
    evaluator: evaluatorId,
    verdict,
    reasoning,
    impactScore: impactScore || (verdict === 'valid' ? 50 : verdict === 'partially_valid' ? 25 : 0),
    evaluatedAt: new Date(),
    evaluatorReasonRank,
  };

  if (existingEvalIndex >= 0) {
    // Update existing evaluation
    this.evaluation.evaluations[existingEvalIndex] = evaluation;
  } else {
    // Add new evaluation
    this.evaluation.evaluations.push(evaluation);
  }

  // Recalculate consensus
  await this.calculateConsensus();

  return this.save();
};

// Add a response to the challenge
MethodologyChallengeSchema.methods.addResponse = function(responderId, text) {
  this.response = {
    responder: responderId,
    text,
    respondedAt: new Date(),
    adequacy: this.response?.adequacy || [],
  };

  this.status = 'under_review';

  return this.save();
};

// Evaluate response adequacy
MethodologyChallengeSchema.methods.evaluateResponse = function(evaluatorId, isAdequate, reasoning) {
  if (!this.response || !this.response.text) {
    throw new Error('No response to evaluate');
  }

  const existingEvalIndex = this.response.adequacy.findIndex(
    e => e.evaluator.toString() === evaluatorId.toString()
  );

  const evaluation = {
    evaluator: evaluatorId,
    isAdequate,
    reasoning,
    evaluatedAt: new Date(),
  };

  if (existingEvalIndex >= 0) {
    this.response.adequacy[existingEvalIndex] = evaluation;
  } else {
    this.response.adequacy.push(evaluation);
  }

  // If majority says response is adequate, mark as addressed
  const adequateCount = this.response.adequacy.filter(e => e.isAdequate).length;
  const inadequateCount = this.response.adequacy.filter(e => !e.isAdequate).length;

  if (adequateCount >= 3 && adequateCount > inadequateCount) {
    this.status = 'addressed';
  }

  return this.save();
};

// Indexes
MethodologyChallengeSchema.index({ evidenceId: 1, status: 1 });
MethodologyChallengeSchema.index({ challenger: 1 });
MethodologyChallengeSchema.index({ challengeType: 1 });
MethodologyChallengeSchema.index({ 'evaluation.consensusVerdict': 1 });

export default mongoose.model('MethodologyChallenge', MethodologyChallengeSchema);
