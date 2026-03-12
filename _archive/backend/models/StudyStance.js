import mongoose from 'mongoose';

/**
 * StudyStance Model - Links individual studies to beliefs and tracks their position
 *
 * This model represents the stance that a specific study takes on a belief,
 * based on the study's findings, conclusions, and methodology.
 *
 * The strength of the stance is weighted by:
 * 1. Study's ReasonRank score (quality and impact)
 * 2. Relevance of the study to the specific belief
 * 3. Clarity and directness of the findings
 * 4. Replication status
 */

const studyStanceSchema = new mongoose.Schema({
  // Core Relationships
  study: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Study',
    required: true
  },

  belief: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Belief',
    required: true
  },

  // Stance Information
  position: {
    type: String,
    required: true,
    enum: ['supporting', 'opposing', 'neutral', 'inconclusive']
  },

  // Strength of the stance (0-100)
  // Combines study quality, relevance, and clarity
  stanceStrength: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },

  // How relevant is this study to the belief? (0-1)
  relevanceScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8
  },

  // How clear and direct are the findings? (0-1)
  clarityScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.7
  },

  // Confidence in the stance classification (0-1)
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.7
  },

  // Extract from the study
  extractedClaim: {
    type: String,
    required: true,
    maxlength: 1000
  },

  // Page numbers or sections where the claim is found
  citationLocation: {
    type: String,
    maxlength: 200
  },

  // Direct quote from the study (if available)
  directQuote: {
    type: String,
    maxlength: 2000
  },

  // Context around the finding
  context: {
    type: String,
    maxlength: 3000
  },

  // How the study relates to specific arguments
  linkedArguments: [{
    argument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Argument'
    },
    linkageStrength: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0
    },
    linkageType: {
      type: String,
      enum: ['direct-evidence', 'supporting-evidence', 'contradicting-evidence', 'methodological', 'theoretical']
    }
  }],

  // Interpretation and analysis
  interpretation: {
    summary: {
      type: String,
      maxlength: 1000
    },

    limitationsAcknowledged: {
      type: String,
      maxlength: 1000
    },

    strengthOfEvidence: {
      type: String,
      enum: ['very-strong', 'strong', 'moderate', 'weak', 'very-weak'],
      default: 'moderate'
    },

    levelOfEvidence: {
      type: String,
      enum: ['1a', '1b', '2a', '2b', '3a', '3b', '4', '5'],
      default: '3a'
    }
  },

  // Statistical findings
  statisticalFindings: {
    primaryOutcome: String,
    effectSize: Number,
    pValue: Number,
    confidenceInterval: {
      lower: Number,
      upper: Number,
      level: Number // e.g., 95 for 95% CI
    }
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  verificationStatus: {
    type: String,
    enum: ['unverified', 'verified', 'disputed', 'expert-reviewed'],
    default: 'unverified'
  },

  verifiedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isExpert: {
      type: Boolean,
      default: false
    },
    expertiseArea: String,
    status: String,
    notes: String,
    verifiedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // How users have rated this linkage
  userRatings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    helpful: {
      type: Boolean,
      required: true
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  helpfulCount: {
    type: Number,
    min: 0,
    default: 0
  },

  notHelpfulCount: {
    type: Number,
    min: 0,
    default: 0
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
studyStanceSchema.index({ study: 1, belief: 1 });
studyStanceSchema.index({ belief: 1 });
studyStanceSchema.index({ study: 1 });
studyStanceSchema.index({ position: 1 });
studyStanceSchema.index({ stanceStrength: -1 });
studyStanceSchema.index({ relevanceScore: -1 });

/**
 * Calculate the stance strength based on study quality, relevance, and clarity
 *
 * Formula:
 * StanceStrength = (
 *   StudyReasonRankScore × 0.40 +
 *   RelevanceScore × 100 × 0.30 +
 *   ClarityScore × 100 × 0.20 +
 *   UserRatingScore × 0.10
 * ) × ConfidenceMultiplier
 */
studyStanceSchema.methods.calculateStanceStrength = async function() {
  const Study = mongoose.model('Study');

  // 1. Get study's ReasonRank score (40% weight)
  const study = await Study.findById(this.study);
  const studyScore = study ? study.reasonRankScore : 50;

  // 2. Relevance score (30% weight)
  const relevanceScore = this.relevanceScore * 100;

  // 3. Clarity score (20% weight)
  const clarityScore = this.clarityScore * 100;

  // 4. User rating score (10% weight)
  const totalRatings = this.helpfulCount + this.notHelpfulCount;
  let userRatingScore = 50; // Neutral default

  if (totalRatings > 0) {
    userRatingScore = (this.helpfulCount / totalRatings) * 100;
  }

  // Calculate base strength
  let strength = (
    studyScore * 0.40 +
    relevanceScore * 0.30 +
    clarityScore * 0.20 +
    userRatingScore * 0.10
  );

  // Apply confidence multiplier
  strength *= this.confidence;

  // Apply replication bonus/penalty
  if (study && study.replicationInfo) {
    if (study.replicationInfo.successfulReplications > 0) {
      // Bonus for successful replications (up to 20%)
      const replicationBonus = Math.min(
        study.replicationInfo.successfulReplications * 0.05,
        0.20
      );
      strength *= (1 + replicationBonus);
    } else if (study.replicationInfo.failedReplications > 0) {
      // Penalty for failed replications
      const replicationPenalty = Math.min(
        study.replicationInfo.failedReplications * 0.1,
        0.5
      );
      strength *= (1 - replicationPenalty);
    }
  }

  // Apply verification status modifiers
  if (this.verificationStatus === 'expert-reviewed') {
    strength *= 1.15; // 15% bonus for expert review
  } else if (this.verificationStatus === 'disputed') {
    strength *= 0.6; // 40% penalty for disputed linkages
  }

  // Clamp to 0-100
  this.stanceStrength = Math.max(0, Math.min(100, strength));

  return this.stanceStrength;
};

/**
 * Calculate relevance score automatically based on keyword overlap and semantic similarity
 */
studyStanceSchema.methods.calculateRelevance = async function() {
  const Study = mongoose.model('Study');
  const Belief = mongoose.model('Belief');

  const study = await Study.findById(this.study);
  const belief = await Belief.findById(this.belief);

  if (!study || !belief) {
    this.relevanceScore = 0.5;
    return;
  }

  // Simple keyword-based relevance (can be enhanced with semantic analysis)
  const beliefWords = belief.statement.toLowerCase().split(/\s+/);
  const studyWords = [
    ...study.title.toLowerCase().split(/\s+/),
    ...(study.abstract ? study.abstract.toLowerCase().split(/\s+/) : []),
    ...study.keywords.map(k => k.toLowerCase())
  ];

  // Calculate Jaccard similarity
  const beliefSet = new Set(beliefWords);
  const studySet = new Set(studyWords);
  const intersection = new Set([...beliefSet].filter(x => studySet.has(x)));
  const union = new Set([...beliefSet, ...studySet]);

  const jaccardSimilarity = intersection.size / union.size;

  // Check for exact matches in key terms (boost relevance)
  const exactMatches = beliefWords.filter(word =>
    word.length > 4 && studySet.has(word)
  ).length;

  const exactMatchBonus = Math.min(exactMatches * 0.1, 0.3);

  this.relevanceScore = Math.min(jaccardSimilarity + exactMatchBonus, 1.0);

  // Minimum relevance if manually created
  if (this.relevanceScore < 0.3 && this.extractedClaim) {
    this.relevanceScore = 0.5;
  }
};

/**
 * Calculate clarity score based on statistical findings and directness
 */
studyStanceSchema.methods.calculateClarity = function() {
  let clarity = 0.5; // Base clarity

  // Direct quote available
  if (this.directQuote && this.directQuote.length > 20) {
    clarity += 0.15;
  }

  // Statistical findings provided
  if (this.statisticalFindings && this.statisticalFindings.pValue !== null) {
    clarity += 0.15;

    // Strong statistical significance
    if (this.statisticalFindings.pValue < 0.01) {
      clarity += 0.1;
    }
  }

  // Effect size reported
  if (this.statisticalFindings && this.statisticalFindings.effectSize !== null) {
    clarity += 0.1;
  }

  // Confidence interval provided
  if (this.statisticalFindings && this.statisticalFindings.confidenceInterval) {
    clarity += 0.1;
  }

  // Citation location specified
  if (this.citationLocation) {
    clarity += 0.05;
  }

  this.clarityScore = Math.min(clarity, 1.0);
};

/**
 * Add a user rating
 */
studyStanceSchema.methods.addUserRating = function(userId, helpful, comment = '') {
  // Check if user already rated
  const existingRating = this.userRatings.find(
    r => r.user.toString() === userId.toString()
  );

  if (existingRating) {
    // Update existing rating
    if (existingRating.helpful !== helpful) {
      if (helpful) {
        this.helpfulCount++;
        this.notHelpfulCount--;
      } else {
        this.helpfulCount--;
        this.notHelpfulCount++;
      }
      existingRating.helpful = helpful;
    }
    existingRating.comment = comment;
  } else {
    // Add new rating
    this.userRatings.push({
      user: userId,
      helpful: helpful,
      comment: comment
    });

    if (helpful) {
      this.helpfulCount++;
    } else {
      this.notHelpfulCount++;
    }
  }
};

/**
 * Get stance breakdown for display
 */
studyStanceSchema.methods.getStanceBreakdown = async function() {
  const Study = mongoose.model('Study');
  const study = await Study.findById(this.study).populate('journal');

  return {
    study: {
      title: study?.title,
      authors: study?.authors,
      journal: study?.journal?.name,
      publicationDate: study?.publicationDate,
      reasonRankScore: study?.reasonRankScore,
      doi: study?.doi,
      citationCount: study?.citationMetrics.citationCount
    },
    position: this.position,
    stanceStrength: this.stanceStrength,
    extractedClaim: this.extractedClaim,
    directQuote: this.directQuote,
    relevanceScore: this.relevanceScore,
    clarityScore: this.clarityScore,
    confidence: this.confidence,
    statisticalFindings: this.statisticalFindings,
    interpretation: this.interpretation,
    userRatings: {
      helpful: this.helpfulCount,
      notHelpful: this.notHelpfulCount,
      total: this.helpfulCount + this.notHelpfulCount
    },
    verificationStatus: this.verificationStatus
  };
};

/**
 * Calculate contribution to belief score
 * Similar to argument contribution in the main ReasonRank algorithm
 */
studyStanceSchema.methods.getBeliefContribution = function() {
  // Contribution = StanceStrength × Relevance × Clarity × Direction
  const direction = this.position === 'supporting' ? 1 :
                    this.position === 'opposing' ? -1 : 0;

  return (this.stanceStrength / 100) * this.relevanceScore * this.clarityScore * direction * 100;
};

/**
 * Get evidence level interpretation
 */
studyStanceSchema.methods.getEvidenceLevelInterpretation = function() {
  const levelDescriptions = {
    '1a': 'Systematic review of RCTs',
    '1b': 'Individual RCT',
    '2a': 'Systematic review of cohort studies',
    '2b': 'Individual cohort study',
    '3a': 'Systematic review of case-control studies',
    '3b': 'Individual case-control study',
    '4': 'Case series',
    '5': 'Expert opinion'
  };

  return {
    level: this.interpretation.levelOfEvidence,
    description: levelDescriptions[this.interpretation.levelOfEvidence] || 'Unknown',
    strength: this.interpretation.strengthOfEvidence
  };
};

// Update lastUpdated on save
studyStanceSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Automatically calculate scores before saving
studyStanceSchema.pre('save', function(next) {
  if (this.isModified('extractedClaim') || this.isNew) {
    this.calculateClarity();
  }
  next();
});

const StudyStance = mongoose.model('StudyStance', studyStanceSchema);

export default StudyStance;
