import mongoose from 'mongoose';

/**
 * JournalStance Model - Links journals to beliefs and tracks their position
 *
 * This model represents the stance that a journal takes on a belief,
 * inferred from the studies it publishes and the arguments made in those studies.
 *
 * The strength of the stance is weighted by:
 * 1. Journal's ReasonRank score
 * 2. Number and quality of supporting studies
 * 3. Consistency of the journal's position over time
 */

const journalStanceSchema = new mongoose.Schema({
  // Core Relationships
  journal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journal',
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
    enum: ['supporting', 'opposing', 'neutral', 'mixed']
  },

  // Strength of the stance (0-100)
  // Combines journal quality, number of studies, and consistency
  stanceStrength: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },

  // Confidence in the stance classification (0-1)
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },

  // Supporting Evidence
  supportingStudies: [{
    study: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Study'
    },
    relevanceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0
    }
  }],

  opposingStudies: [{
    study: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Study'
    },
    relevanceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0
    }
  }],

  neutralStudies: [{
    study: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Study'
    },
    relevanceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0
    }
  }],

  // Metrics
  metrics: {
    totalStudies: {
      type: Number,
      min: 0,
      default: 0
    },

    supportingCount: {
      type: Number,
      min: 0,
      default: 0
    },

    opposingCount: {
      type: Number,
      min: 0,
      default: 0
    },

    neutralCount: {
      type: Number,
      min: 0,
      default: 0
    },

    averageStudyQuality: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },

    consistencyScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    }
  },

  // Temporal Information
  firstPublicationDate: {
    type: Date
  },

  lastPublicationDate: {
    type: Date
  },

  // Linkage to arguments
  // Which specific arguments in the debate does this journal support/oppose?
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
    supportType: {
      type: String,
      enum: ['direct', 'indirect', 'methodological', 'theoretical']
    }
  }],

  // Description of how the journal's publications relate to the belief
  description: {
    type: String,
    maxlength: 2000
  },

  // Key claims made by studies in this journal
  keyClaims: [{
    claim: String,
    studyCount: Number,
    averageSupport: Number
  }],

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  verificationStatus: {
    type: String,
    enum: ['unverified', 'verified', 'disputed'],
    default: 'unverified'
  },

  verifiedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: String,
    notes: String,
    verifiedAt: {
      type: Date,
      default: Date.now
    }
  }],

  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
journalStanceSchema.index({ journal: 1, belief: 1 }, { unique: true });
journalStanceSchema.index({ belief: 1 });
journalStanceSchema.index({ journal: 1 });
journalStanceSchema.index({ position: 1 });
journalStanceSchema.index({ stanceStrength: -1 });

/**
 * Calculate the stance strength based on journal quality and study evidence
 *
 * Formula:
 * StanceStrength = (
 *   JournalReasonRankScore × 0.40 +
 *   AverageStudyQuality × 0.30 +
 *   StudyCountScore × 0.20 +
 *   ConsistencyScore × 0.10
 * )
 */
journalStanceSchema.methods.calculateStanceStrength = async function() {
  const Journal = mongoose.model('Journal');
  const Study = mongoose.model('Study');

  // 1. Get journal's ReasonRank score (40% weight)
  const journal = await Journal.findById(this.journal);
  const journalScore = journal ? journal.reasonRankScore : 50;

  // 2. Calculate average study quality (30% weight)
  const allStudies = [
    ...this.supportingStudies.map(s => s.study),
    ...this.opposingStudies.map(s => s.study),
    ...this.neutralStudies.map(s => s.study)
  ];

  if (allStudies.length > 0) {
    const studies = await Study.find({ _id: { $in: allStudies } });
    const avgQuality = studies.reduce((sum, s) => sum + s.reasonRankScore, 0) / studies.length;
    this.metrics.averageStudyQuality = avgQuality;
  }

  // 3. Study count score (20% weight)
  // More studies = stronger evidence (10+ studies = 1.0)
  const studyCountScore = Math.min(allStudies.length / 10, 1.0) * 100;

  // 4. Consistency score (10% weight)
  // How consistent is the journal's position?
  const supportingCount = this.supportingStudies.length;
  const opposingCount = this.opposingStudies.length;
  const neutralCount = this.neutralStudies.length;
  const total = supportingCount + opposingCount + neutralCount;

  let consistencyScore = 0.5;
  if (total > 0) {
    // Calculate entropy-based consistency
    // All studies agree = high consistency = 1.0
    // Studies evenly split = low consistency = 0.0
    const supportingRatio = supportingCount / total;
    const opposingRatio = opposingCount / total;
    const neutralRatio = neutralCount / total;

    // Maximum entropy for 3 categories is log2(3) ≈ 1.585
    let entropy = 0;
    if (supportingRatio > 0) entropy -= supportingRatio * Math.log2(supportingRatio);
    if (opposingRatio > 0) entropy -= opposingRatio * Math.log2(opposingRatio);
    if (neutralRatio > 0) entropy -= neutralRatio * Math.log2(neutralRatio);

    // Convert entropy to consistency (0 entropy = 1.0 consistency)
    consistencyScore = 1 - (entropy / 1.585);
  }

  this.metrics.consistencyScore = consistencyScore;

  // Calculate final stance strength
  this.stanceStrength = (
    journalScore * 0.40 +
    this.metrics.averageStudyQuality * 0.30 +
    studyCountScore * 0.20 +
    consistencyScore * 100 * 0.10
  );

  // Adjust based on position
  // Supporting and opposing get full strength
  // Neutral gets reduced strength
  // Mixed gets significantly reduced strength
  if (this.position === 'neutral') {
    this.stanceStrength *= 0.7;
  } else if (this.position === 'mixed') {
    this.stanceStrength *= 0.5;
  }

  // Clamp to 0-100
  this.stanceStrength = Math.max(0, Math.min(100, this.stanceStrength));

  return this.stanceStrength;
};

/**
 * Automatically determine the journal's position based on published studies
 */
journalStanceSchema.methods.determinePosition = function() {
  const supportingCount = this.supportingStudies.length;
  const opposingCount = this.opposingStudies.length;
  const neutralCount = this.neutralStudies.length;
  const total = supportingCount + opposingCount + neutralCount;

  if (total === 0) {
    this.position = 'neutral';
    this.confidence = 0;
    return;
  }

  const supportingRatio = supportingCount / total;
  const opposingRatio = opposingCount / total;

  // Determine position based on ratios
  if (supportingRatio >= 0.7) {
    this.position = 'supporting';
    this.confidence = supportingRatio;
  } else if (opposingRatio >= 0.7) {
    this.position = 'opposing';
    this.confidence = opposingRatio;
  } else if (supportingRatio < 0.3 && opposingRatio < 0.3) {
    this.position = 'neutral';
    this.confidence = neutralCount / total;
  } else {
    this.position = 'mixed';
    this.confidence = 1 - Math.max(supportingRatio, opposingRatio);
  }

  // Update metrics
  this.metrics.totalStudies = total;
  this.metrics.supportingCount = supportingCount;
  this.metrics.opposingCount = opposingCount;
  this.metrics.neutralCount = neutralCount;
};

/**
 * Add a study to this stance
 */
journalStanceSchema.methods.addStudy = function(studyId, position, relevanceScore = 1.0) {
  const studyEntry = {
    study: studyId,
    relevanceScore: relevanceScore
  };

  if (position === 'supporting') {
    this.supportingStudies.push(studyEntry);
  } else if (position === 'opposing') {
    this.opposingStudies.push(studyEntry);
  } else {
    this.neutralStudies.push(studyEntry);
  }

  // Recalculate position
  this.determinePosition();
};

/**
 * Get stance breakdown for display
 */
journalStanceSchema.methods.getStanceBreakdown = async function() {
  const Journal = mongoose.model('Journal');
  const journal = await Journal.findById(this.journal);

  return {
    journal: {
      name: journal?.name,
      reasonRankScore: journal?.reasonRankScore,
      impactFactor: journal?.metrics.impactFactor
    },
    position: this.position,
    stanceStrength: this.stanceStrength,
    confidence: this.confidence,
    metrics: {
      totalStudies: this.metrics.totalStudies,
      supporting: this.metrics.supportingCount,
      opposing: this.metrics.opposingCount,
      neutral: this.metrics.neutralCount,
      averageQuality: this.metrics.averageStudyQuality,
      consistency: this.metrics.consistencyScore
    },
    timeRange: {
      first: this.firstPublicationDate,
      last: this.lastPublicationDate
    }
  };
};

/**
 * Calculate contribution to belief score
 * Similar to argument contribution in the main ReasonRank algorithm
 */
journalStanceSchema.methods.getBeliefContribution = function() {
  // Contribution = StanceStrength × Confidence × Direction
  const direction = this.position === 'supporting' ? 1 :
                    this.position === 'opposing' ? -1 : 0;

  return (this.stanceStrength / 100) * this.confidence * direction * 100;
};

// Update lastUpdated on save
journalStanceSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const JournalStance = mongoose.model('JournalStance', journalStanceSchema);

export default JournalStance;
