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
  // Contributors (public figures, experts, historical figures)
  // Links to Contributor model for People Evaluation ranking system
  contributors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contributor',
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
  // Three-Dimensional Belief Sorting (One Page Per Belief framework)
  dimensions: {
    // Dimension 1: General → Specific (0-100)
    specificity: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
      description: 'How specific vs general the belief is (0=very general, 100=very specific)',
    },
    // Dimension 2: Weaker → Stronger (0-100) - uses conclusionScore
    // conclusionScore represents argument strength

    // Dimension 3: Negative → Positive (-100 to 100)
    sentimentPolarity: {
      type: Number,
      default: 0,
      min: -100,
      max: 100,
      description: 'Sentiment toward the topic (-100=very negative, 0=neutral, 100=very positive)',
    },
  },
  // Semantic Clustering: Similar belief statements grouped together
  similarBeliefs: [{
    beliefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Belief',
    },
    similarityScore: {
      type: Number,
      min: 0,
      max: 1,
      description: 'Semantic similarity score (0-1)',
    },
    mergedInto: {
      type: Boolean,
      default: false,
      description: 'Whether this similar belief was merged into the current one',
    },
  }],
  // Topic reference for aggregation
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    description: 'Main topic this belief belongs to',
  },
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
    contributorCount: {
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

// Calculate conclusion score based on arguments using ReasonRank PageRank algorithm
// Implements PageRank-style scoring: ADD supporting arguments, SUBTRACT con/weakening arguments
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

  // Filter out refuted and outdated arguments (they contribute minimally)
  const activeSupporting = this.supportingArguments.filter(
    arg => arg.lifecycleStatus !== 'refuted' && arg.lifecycleStatus !== 'outdated'
  );
  const activeOpposing = this.opposingArguments.filter(
    arg => arg.lifecycleStatus !== 'refuted' && arg.lifecycleStatus !== 'outdated'
  );

  // Calculate weighted scores using ReasonRank
  // Each argument contributes its reasonRankScore weighted by lifecycle status
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

  // PageRank-style calculation:
  // Start with neutral base (50) + ADD supporting scores - SUBTRACT opposing scores
  // This promotes beliefs with strong supporting arguments and weak opposing arguments
  const totalArgs = activeSupporting.length + activeOpposing.length;

  if (totalArgs === 0) {
    this.conclusionScore = 50; // Neutral if no arguments
  } else {
    // Calculate average scores
    const supportingAvg = activeSupporting.length > 0
      ? supportingWeightedScore / activeSupporting.length
      : 0;

    const opposingAvg = activeOpposing.length > 0
      ? opposingWeightedScore / activeOpposing.length
      : 0;

    // PageRank formula: Base + Σ(supporting scores) - Σ(opposing scores)
    // Normalize by argument count to prevent score inflation with many arguments
    const baseScore = 50;
    const supportingContribution = supportingAvg * (activeSupporting.length / totalArgs);
    const opposingContribution = opposingAvg * (activeOpposing.length / totalArgs);

    // Supporting arguments ADD to score, opposing arguments SUBTRACT from score
    this.conclusionScore = Math.round(
      baseScore + supportingContribution - opposingContribution
    );

    // Ensure score is in valid range [0, 100]
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
  this.statistics.contributorCount = this.contributors.length;
  return this.save();
};

// Increment view count
BeliefSchema.methods.incrementViews = function() {
  this.statistics.views += 1;
  return this.save();
};

// Calculate specificity score (General → Specific)
// More specific beliefs have concrete terms, numbers, names, dates, etc.
BeliefSchema.methods.calculateSpecificity = function() {
  const statement = this.statement.toLowerCase();

  let specificityScore = 50; // Start neutral

  // Indicators of SPECIFICITY (+points)
  // Has numbers or dates
  if (/\d/.test(statement)) specificityScore += 15;

  // Has proper nouns (capitalized words that aren't at sentence start)
  const words = this.statement.split(' ');
  const properNouns = words.slice(1).filter(w => /^[A-Z]/.test(w)).length;
  specificityScore += Math.min(properNouns * 5, 20);

  // Has specific time references
  if (/(yesterday|today|tomorrow|january|february|march|april|may|june|july|august|september|october|november|december|\d{4})/i.test(statement)) {
    specificityScore += 10;
  }

  // Has specific quantifiers
  if (/(exactly|precisely|specifically|particularly|especially)/i.test(statement)) {
    specificityScore += 10;
  }

  // Indicators of GENERALITY (-points)
  // Has general quantifiers
  if (/(all|every|always|never|generally|usually|most|some|many|few)/i.test(statement)) {
    specificityScore -= 10;
  }

  // Has abstract concepts
  if (/(concept|idea|theory|principle|generally|typically)/i.test(statement)) {
    specificityScore -= 10;
  }

  // Ensure score is in valid range
  this.dimensions.specificity = Math.max(0, Math.min(100, specificityScore));
  return this.dimensions.specificity;
};

// Calculate sentiment polarity (Negative → Positive)
// Analyzes the sentiment/tone toward the subject
BeliefSchema.methods.calculateSentimentPolarity = function() {
  const statement = this.statement.toLowerCase();

  let polarityScore = 0; // Start neutral

  // Positive sentiment words
  const positiveWords = [
    'good', 'great', 'excellent', 'outstanding', 'effective', 'successful',
    'beneficial', 'positive', 'strong', 'smart', 'intelligent', 'capable',
    'competent', 'skilled', 'talented', 'superior', 'better', 'best',
    'improve', 'increase', 'enhance', 'benefit', 'help', 'support',
    'right', 'correct', 'true', 'valid', 'sound', 'reasonable'
  ];

  // Negative sentiment words
  const negativeWords = [
    'bad', 'poor', 'terrible', 'awful', 'ineffective', 'unsuccessful',
    'harmful', 'negative', 'weak', 'dumb', 'unintelligent', 'incapable',
    'incompetent', 'unskilled', 'inferior', 'worse', 'worst',
    'damage', 'decrease', 'harm', 'hurt', 'undermine',
    'wrong', 'incorrect', 'false', 'invalid', 'unsound', 'unreasonable',
    'lacking', 'lacks', 'not'
  ];

  // Negation words that flip sentiment
  const negationWords = ['not', 'no', 'never', 'neither', 'nor', "n't"];

  // Count positive and negative words
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = statement.match(regex);
    if (matches) polarityScore += matches.length * 10;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = statement.match(regex);
    if (matches) polarityScore -= matches.length * 10;
  });

  // Adjust for negations (they typically flip sentiment)
  negationWords.forEach(word => {
    if (statement.includes(word)) {
      // Negation present - might flip sentiment slightly
      polarityScore = polarityScore * 0.8; // Dampen the polarity
    }
  });

  // Ensure score is in valid range
  this.dimensions.sentimentPolarity = Math.max(-100, Math.min(100, Math.round(polarityScore)));
  return this.dimensions.sentimentPolarity;
};

// Update all dimensional scores
BeliefSchema.methods.updateDimensions = async function() {
  this.calculateSpecificity();
  this.calculateSentimentPolarity();
  // Strength is already calculated via calculateConclusionScore
  return this.save();
};

// Add a similar belief
BeliefSchema.methods.addSimilarBelief = function(beliefId, similarityScore) {
  // Check if already exists
  const exists = this.similarBeliefs.some(
    sb => sb.beliefId.toString() === beliefId.toString()
  );

  if (!exists) {
    this.similarBeliefs.push({
      beliefId,
      similarityScore,
      mergedInto: false,
    });
  }

  return this.save();
};

// Merge a similar belief into this one
BeliefSchema.methods.mergeSimilarBelief = async function(beliefId) {
  const similarBelief = this.similarBeliefs.find(
    sb => sb.beliefId.toString() === beliefId.toString()
  );

  if (similarBelief) {
    similarBelief.mergedInto = true;
  }

  return this.save();
};

// Get position in 3D space for visualization
BeliefSchema.methods.get3DPosition = function() {
  return {
    specificity: this.dimensions.specificity,
    strength: this.conclusionScore,
    sentiment: this.dimensions.sentimentPolarity,
  };
};

// Index for better query performance
BeliefSchema.index({ statement: 'text', description: 'text' });
BeliefSchema.index({ category: 1, status: 1 });
BeliefSchema.index({ trending: 1, 'statistics.views': -1 });
BeliefSchema.index({ 'dimensions.specificity': 1 });
BeliefSchema.index({ 'dimensions.sentimentPolarity': 1 });
BeliefSchema.index({ conclusionScore: 1 });
BeliefSchema.index({ topicId: 1 });

// Post-save hook to update portfolio positions when belief score changes
BeliefSchema.post('save', async function(doc) {
  // Only update if conclusionScore was modified
  if (this.isModified('conclusionScore')) {
    try {
      // Dynamically import to avoid circular dependency
      const { updateBeliefPositions } = await import('../controllers/portfolioController.js');
      await updateBeliefPositions(doc._id, doc.conclusionScore);
    } catch (error) {
      console.error('Error updating portfolio positions:', error);
      // Don't throw - we don't want to fail belief updates if portfolio update fails
    }
  }
});

export default mongoose.model('Belief', BeliefSchema);
