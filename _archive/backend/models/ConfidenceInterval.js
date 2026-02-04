import mongoose from 'mongoose';

/**
 * ConfidenceInterval Model
 *
 * Tracks confidence in a belief's score based on four core factors:
 * 1. User Examination Depth - how thoroughly the belief has been reviewed
 * 2. Score Stability - how stable the score remains despite review
 * 3. Knowability - how testable/verifiable the belief is
 * 4. Challenge Resistance - how well the belief resists overturn attempts
 *
 * CI Score: 0-100 measure of reliability (NOT truth)
 * High CI = "We can trust this number"
 * Low CI = "Score may change significantly with new evaluations"
 */

const ConfidenceIntervalSchema = new mongoose.Schema({
  // Reference to the belief this CI applies to
  beliefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Belief',
    required: true,
    unique: true,
    index: true,
  },

  // Overall Confidence Interval Score (0-100)
  ciScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    description: 'Overall confidence in the belief score (0=unreliable, 100=highly reliable)',
  },

  // Confidence level (High/Moderate/Low)
  confidenceLevel: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'low',
    description: 'Low: 0-49, Moderate: 50-84, High: 85-100',
  },

  // ---------- FACTOR 1: USER EXAMINATION DEPTH (30% weight) ----------
  userExamination: {
    // Raw metrics
    totalReadingTime: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Total minutes spent by verified users reading this belief',
    },
    uniqueVerifiedReaders: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of unique verified users who examined this belief',
    },
    uniqueProArgumentsEvaluated: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of unique pro-arguments that have been evaluated',
    },
    uniqueConArgumentsEvaluated: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of unique con-arguments that have been evaluated',
    },
    userInteractions: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Total user interactions (expansions, verifications, etc.)',
    },
    newContestedPoints: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of new contested points raised (lower = better)',
    },
    lowQualityDownvotes: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of downvotes indicating weak argumentation',
    },
    expertReviews: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of reviews by verified experts',
    },

    // Calculated score (0-100)
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'User Examination component score',
    },
  },

  // ---------- FACTOR 2: SCORE STABILITY (30% weight) ----------
  scoreStability: {
    // Historical score tracking
    scoreHistory: [{
      score: Number,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      trigger: {
        type: String,
        enum: ['initial', 'argument_added', 'argument_updated', 'evidence_added', 'verification_changed', 'manual_recalc'],
        default: 'initial',
      },
    }],

    // Rolling 30-day metrics
    last30DaysStdDev: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Standard deviation of score over last 30 days',
    },
    last30DaysRange: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Score range (max - min) over last 30 days',
    },
    last30DaysNewArguments: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of new arguments added in last 30 days',
    },
    daysSinceLastMajorChange: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Days since score changed by more than 10 points',
    },
    scoreVolatility: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
      description: 'Overall score volatility index (0=stable, 1=highly volatile)',
    },

    // Sub-argument stability
    subArgumentScoreChanges: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of sub-arguments whose scores changed meaningfully',
    },

    // Calculated score (0-100)
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Score Stability component score',
    },
  },

  // ---------- FACTOR 3: KNOWABILITY (20% weight) ----------
  knowability: {
    // Knowability category (1-4)
    category: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 3,
      description: '1=Testable facts, 2=Partially testable, 3=Value judgments, 4=Pure philosophy',
    },
    categoryLabel: {
      type: String,
      enum: ['testable_facts', 'partially_testable', 'value_judgments', 'pure_philosophy'],
      default: 'value_judgments',
    },
    categoryDescription: {
      type: String,
      description: 'Description of why this category was assigned',
    },

    // Evidence tier distribution
    tier1EvidenceCount: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of Tier 1 evidence (highest quality)',
    },
    tier2EvidenceCount: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of Tier 2 evidence',
    },
    tier3EvidenceCount: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of Tier 3 evidence',
    },
    tier4EvidenceCount: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of Tier 4 evidence (lowest quality)',
    },

    // Measurability indicators
    hasMeasurableOutcomes: {
      type: Boolean,
      default: false,
      description: 'Whether the belief has measurable outcomes',
    },
    hasHistoricalTests: {
      type: Boolean,
      default: false,
      description: 'Whether historical or scientific tests exist',
    },

    // Maximum CI cap based on category
    maxCICap: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
      description: 'Maximum CI this belief can achieve based on knowability',
    },

    // Calculated score (0-100)
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Knowability component score',
    },
  },

  // ---------- FACTOR 4: CHALLENGE RESISTANCE (20% weight) ----------
  challengeResistance: {
    // Challenge attempt tracking
    totalChallengeAttempts: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Total number of challenge arguments proposed',
    },
    redundantChallenges: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of challenges that repeated already-refuted points',
    },
    redundancyRatio: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
      description: 'Proportion of new arguments that are redundant (higher = better CI)',
    },

    // Impact of challenges
    challengesThatChangedScore: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of challenges that significantly changed the score',
    },
    averageScoreImpact: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Average score change from challenges (lower = better)',
    },

    // Time-based resistance
    challengeFrequencyDecline: {
      type: Boolean,
      default: false,
      description: 'Whether challenge attempts are decreasing over time',
    },
    daysSinceLastSuccessfulChallenge: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Days since a challenge meaningfully changed the score',
    },

    // Unique challenger tracking
    uniqueChallengers: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of unique users who attempted to challenge',
    },

    // Unresolved challenges
    unresolvedEvidenceObjections: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Number of evidence-based objections that remain unresolved',
    },

    // Calculated score (0-100)
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Challenge Resistance component score',
    },
  },

  // ---------- COMPOSITE SCORING ----------
  weights: {
    userExamination: {
      type: Number,
      default: 0.30,
      min: 0,
      max: 1,
      description: 'Weight for User Examination factor',
    },
    scoreStability: {
      type: Number,
      default: 0.30,
      min: 0,
      max: 1,
      description: 'Weight for Score Stability factor',
    },
    knowability: {
      type: Number,
      default: 0.20,
      min: 0,
      max: 1,
      description: 'Weight for Knowability factor',
    },
    challengeResistance: {
      type: Number,
      default: 0.20,
      min: 0,
      max: 1,
      description: 'Weight for Challenge Resistance factor',
    },
  },

  // ---------- METADATA ----------
  lastCalculated: {
    type: Date,
    default: Date.now,
    description: 'When the CI was last recalculated',
  },
  calculationCount: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Number of times CI has been recalculated',
  },

  // Explanation tooltips for users
  explanations: [{
    type: {
      type: String,
      enum: ['score_stable', 'high_redundancy', 'new_objections', 'expert_reviewed', 'low_activity', 'high_volatility'],
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],

}, {
  timestamps: true,
});

// ---------- INDEXES ----------
ConfidenceIntervalSchema.index({ ciScore: 1 });
ConfidenceIntervalSchema.index({ confidenceLevel: 1 });
ConfidenceIntervalSchema.index({ 'knowability.category': 1 });
ConfidenceIntervalSchema.index({ lastCalculated: 1 });

// ---------- METHODS ----------

/**
 * Calculate overall CI score from four components
 * Formula: CI = w1×UE + w2×SS + w3×K + w4×CR
 * Apply knowability cap
 */
ConfidenceIntervalSchema.methods.calculateCIScore = function() {
  const { userExamination, scoreStability, knowability, challengeResistance, weights } = this;

  // Weighted composite score
  let ciScore =
    (userExamination.score * weights.userExamination) +
    (scoreStability.score * weights.scoreStability) +
    (knowability.score * weights.knowability) +
    (challengeResistance.score * weights.challengeResistance);

  // Apply knowability cap
  ciScore = Math.min(ciScore, knowability.maxCICap);

  // Round to 2 decimal places
  ciScore = Math.round(ciScore * 100) / 100;

  this.ciScore = ciScore;

  // Update confidence level
  if (ciScore >= 85) {
    this.confidenceLevel = 'high';
  } else if (ciScore >= 50) {
    this.confidenceLevel = 'moderate';
  } else {
    this.confidenceLevel = 'low';
  }

  return ciScore;
};

/**
 * Get human-readable CI interpretation
 */
ConfidenceIntervalSchema.methods.getInterpretation = function() {
  const { ciScore, confidenceLevel } = this;

  const interpretations = {
    high: `High confidence (${ciScore.toFixed(1)}): This score is likely to remain stable. The belief has been thoroughly reviewed, shows consistent scoring, and has successfully resisted challenges.`,
    moderate: `Moderate confidence (${ciScore.toFixed(1)}): This score may change with additional evaluation. More reviews or evidence could significantly impact the rating.`,
    low: `Low confidence (${ciScore.toFixed(1)}): This score is unreliable and likely to change. The belief needs more thorough examination, has volatile scoring, or is difficult to verify.`,
  };

  return interpretations[confidenceLevel];
};

/**
 * Add explanation tooltip
 */
ConfidenceIntervalSchema.methods.addExplanation = function(type, message) {
  this.explanations.push({ type, message });
  // Keep only last 10 explanations
  if (this.explanations.length > 10) {
    this.explanations = this.explanations.slice(-10);
  }
};

/**
 * Record score change for stability tracking
 */
ConfidenceIntervalSchema.methods.recordScoreChange = function(newScore, trigger = 'manual_recalc') {
  this.scoreStability.scoreHistory.push({
    score: newScore,
    timestamp: new Date(),
    trigger,
  });

  // Keep only last 100 score history entries
  if (this.scoreStability.scoreHistory.length > 100) {
    this.scoreStability.scoreHistory = this.scoreStability.scoreHistory.slice(-100);
  }

  // Calculate rolling 30-day metrics
  this.calculateScoreStabilityMetrics();
};

/**
 * Calculate rolling 30-day score stability metrics
 */
ConfidenceIntervalSchema.methods.calculateScoreStabilityMetrics = function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentScores = this.scoreStability.scoreHistory
    .filter(entry => entry.timestamp >= thirtyDaysAgo)
    .map(entry => entry.score);

  if (recentScores.length === 0) {
    this.scoreStability.last30DaysStdDev = 0;
    this.scoreStability.last30DaysRange = 0;
    this.scoreStability.scoreVolatility = 0;
    return;
  }

  // Calculate standard deviation
  const mean = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
  const variance = recentScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / recentScores.length;
  this.scoreStability.last30DaysStdDev = Math.sqrt(variance);

  // Calculate range
  const minScore = Math.min(...recentScores);
  const maxScore = Math.max(...recentScores);
  this.scoreStability.last30DaysRange = maxScore - minScore;

  // Calculate volatility index (0-1)
  // Based on std dev and range
  this.scoreStability.scoreVolatility = Math.min(1, (this.scoreStability.last30DaysStdDev / 50 + this.scoreStability.last30DaysRange / 100) / 2);

  // Calculate days since last major change (>10 points)
  const sortedHistory = [...this.scoreStability.scoreHistory].sort((a, b) => b.timestamp - a.timestamp);
  let daysSinceLastMajorChange = 0;
  for (let i = 0; i < sortedHistory.length - 1; i++) {
    const scoreDiff = Math.abs(sortedHistory[i].score - sortedHistory[i + 1].score);
    if (scoreDiff >= 10) {
      const daysDiff = (Date.now() - sortedHistory[i].timestamp) / (1000 * 60 * 60 * 24);
      daysSinceLastMajorChange = Math.floor(daysDiff);
      break;
    }
  }
  this.scoreStability.daysSinceLastMajorChange = daysSinceLastMajorChange;
};

/**
 * Set knowability category and max CI cap
 */
ConfidenceIntervalSchema.methods.setKnowabilityCategory = function(category, description = '') {
  this.knowability.category = category;
  this.knowability.categoryDescription = description;

  // Set category label
  const labels = {
    1: 'testable_facts',
    2: 'partially_testable',
    3: 'value_judgments',
    4: 'pure_philosophy',
  };
  this.knowability.categoryLabel = labels[category];

  // Set max CI cap based on category
  const caps = {
    1: 100, // Testable facts can reach 100
    2: 90,  // Partially testable capped at 90
    3: 75,  // Value judgments capped at 75
    4: 60,  // Pure philosophy capped at 60
  };
  this.knowability.maxCICap = caps[category];
};

const ConfidenceInterval = mongoose.model('ConfidenceInterval', ConfidenceIntervalSchema);

export default ConfidenceInterval;
