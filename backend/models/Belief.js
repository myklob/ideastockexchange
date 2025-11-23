import mongoose from 'mongoose';

const BeliefSchema = new mongoose.Schema({
  statement: {
    type: String,
    required: [true, 'Please provide a belief statement'],
    trim: true,
    minlength: [10, 'Statement must be at least 10 characters'],
    maxlength: [500, 'Statement cannot exceed 500 characters'],
    unique: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['politics', 'science', 'technology', 'philosophy', 'economics', 'social', 'other'],
    default: 'other',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  conclusionScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
  },
  supportingArguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument',
  }],
  opposingArguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument',
  }],
  relatedBeliefs: [{
    beliefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Belief',
    },
    relationship: {
      type: String,
      enum: ['supports', 'opposes', 'related'],
    },
    linkageStrength: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },
  }],
  statistics: {
    views: {
      type: Number,
      default: 0,
    },
    supportingCount: {
      type: Number,
      default: 0,
    },
    opposingCount: {
      type: Number,
      default: 0,
    },
    totalArguments: {
      type: Number,
      default: 0,
    },
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'flagged'],
    default: 'active',
  },
  trending: {
    type: Boolean,
    default: false,
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

// Calculate conclusion score based on arguments using ReasonRank algorithm
// Implements the manifesto's pro/con ratio approach with sophisticated weighting
BeliefSchema.methods.calculateConclusionScore = async function() {
  await this.populate(['supportingArguments', 'opposingArguments']);

  // Calculate each argument's enhanced scores
  for (const arg of this.supportingArguments) {
    if (typeof arg.calculateReasonRankScore === 'function') {
      await arg.calculateReasonRankScore();
      await arg.updateLifecycleStatus();
    }
  }

  for (const arg of this.opposingArguments) {
    if (typeof arg.calculateReasonRankScore === 'function') {
      await arg.calculateReasonRankScore();
      await arg.updateLifecycleStatus();
    }
  }

  // Filter out refuted and outdated arguments (they contribute less)
  const activeSupporting = this.supportingArguments.filter(
    arg => arg.lifecycleStatus !== 'refuted' && arg.lifecycleStatus !== 'outdated'
  );
  const activeOpposing = this.opposingArguments.filter(
    arg => arg.lifecycleStatus !== 'refuted' && arg.lifecycleStatus !== 'outdated'
  );

  // Calculate weighted scores using ReasonRank
  const calculateWeightedScore = (args) => {
    if (args.length === 0) return 0;

    return args.reduce((sum, arg) => {
      const reasonRank = arg.reasonRankScore || 50;
      const lifecycleMultiplier = {
        active: 1.0,
        weakened: 0.7,
        conditional: 0.8,
        outdated: 0.3,
        refuted: 0.1,
      }[arg.lifecycleStatus || 'active'];

      return sum + (reasonRank * lifecycleMultiplier);
    }, 0);
  };

  const supportingWeightedScore = calculateWeightedScore(activeSupporting);
  const opposingWeightedScore = calculateWeightedScore(activeOpposing);

  // Calculate averages
  const supportingAvg = activeSupporting.length > 0
    ? supportingWeightedScore / activeSupporting.length
    : 50;

  const opposingAvg = activeOpposing.length > 0
    ? opposingWeightedScore / activeOpposing.length
    : 50;

  // Total score calculation (manifesto approach)
  // High supporting score + Low opposing score = High conclusion score
  // Low supporting score + High opposing score = Low conclusion score
  const totalArgs = activeSupporting.length + activeOpposing.length;

  if (totalArgs === 0) {
    this.conclusionScore = 50; // Neutral if no arguments
  } else {
    // Weight by both quality (avg score) and quantity (count)
    const supportWeight = activeSupporting.length / totalArgs;
    const opposeWeight = activeOpposing.length / totalArgs;

    // Manifesto formula: weighted combination of pro and con arguments
    // Supporting arguments push score up, opposing arguments push it down
    this.conclusionScore = Math.round(
      (supportingAvg * supportWeight * 100 + (100 - opposingAvg) * opposeWeight * 100) / 100
    );

    // Ensure score is in valid range
    this.conclusionScore = Math.max(0, Math.min(100, this.conclusionScore));
  }

  return this.conclusionScore;
};

// Calculate detailed score breakdown for transparency (manifesto requirement)
BeliefSchema.methods.getScoreBreakdown = async function() {
  await this.populate(['supportingArguments', 'opposingArguments']);

  const analyzeArguments = (args) => {
    if (args.length === 0) {
      return {
        count: 0,
        avgOverall: 50,
        avgReasonRank: 50,
        avgHealthMetrics: {
          strength: 50,
          integrity: 50,
          freshness: 50,
          relevance: 50,
          impact: 50,
        },
        lifecycleDistribution: {},
      };
    }

    const lifecycleDistribution = {};
    args.forEach(arg => {
      const status = arg.lifecycleStatus || 'active';
      lifecycleDistribution[status] = (lifecycleDistribution[status] || 0) + 1;
    });

    return {
      count: args.length,
      avgOverall: args.reduce((sum, arg) => sum + (arg.scores?.overall || 50), 0) / args.length,
      avgReasonRank: args.reduce((sum, arg) => sum + (arg.reasonRankScore || 50), 0) / args.length,
      avgHealthMetrics: {
        strength: args.reduce((sum, arg) => sum + (arg.healthMetrics?.strength || 50), 0) / args.length,
        integrity: args.reduce((sum, arg) => sum + (arg.healthMetrics?.integrity || 50), 0) / args.length,
        freshness: args.reduce((sum, arg) => sum + (arg.healthMetrics?.freshness || 50), 0) / args.length,
        relevance: args.reduce((sum, arg) => sum + (arg.healthMetrics?.relevance || 50), 0) / args.length,
        impact: args.reduce((sum, arg) => sum + (arg.healthMetrics?.impact || 50), 0) / args.length,
      },
      lifecycleDistribution,
    };
  };

  return {
    conclusionScore: this.conclusionScore,
    supporting: analyzeArguments(this.supportingArguments),
    opposing: analyzeArguments(this.opposingArguments),
    interpretation: this.getScoreInterpretation(),
  };
};

// Get human-readable interpretation of score (manifesto requirement)
BeliefSchema.methods.getScoreInterpretation = function() {
  const score = this.conclusionScore;

  if (score >= 80) {
    return {
      level: 'Strongly Supported',
      description: 'Well-evidenced with strong arguments and minimal valid opposition',
      color: 'green',
      confidence: 'high',
    };
  } else if (score >= 60) {
    return {
      level: 'Moderately Supported',
      description: 'Good evidence but some valid concerns or counterarguments exist',
      color: 'green',
      confidence: 'moderate',
    };
  } else if (score >= 40) {
    return {
      level: 'Contested',
      description: 'Balanced arguments on both sides, unclear which position is stronger',
      color: 'yellow',
      confidence: 'low',
    };
  } else if (score >= 20) {
    return {
      level: 'Weakly Supported',
      description: 'Strong opposition with limited supporting evidence',
      color: 'red',
      confidence: 'moderate',
    };
  } else {
    return {
      level: 'Likely False',
      description: 'Overwhelming opposition with little to no valid support',
      color: 'red',
      confidence: 'high',
    };
  }
};

// Update statistics
BeliefSchema.methods.updateStatistics = function() {
  this.statistics.supportingCount = this.supportingArguments.length;
  this.statistics.opposingCount = this.opposingArguments.length;
  this.statistics.totalArguments = this.supportingArguments.length + this.opposingArguments.length;
  return this.save();
};

// Increment view count
BeliefSchema.methods.incrementViews = function() {
  this.statistics.views += 1;
  return this.save();
};

// Index for better query performance
BeliefSchema.index({ statement: 'text', description: 'text' });
BeliefSchema.index({ category: 1, status: 1 });
BeliefSchema.index({ trending: 1, 'statistics.views': -1 });

export default mongoose.model('Belief', BeliefSchema);
