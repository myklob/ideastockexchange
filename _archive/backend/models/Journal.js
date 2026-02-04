import mongoose from 'mongoose';

/**
 * Journal Model - Tracks peer-reviewed journals with ReasonRank scoring
 *
 * ReasonRank for journals is based on:
 * 1. Impact Factor (30%) - Citation metrics and influence
 * 2. Peer Review Quality (25%) - Rigor of review process
 * 3. Publication Consistency (20%) - Track record and reliability
 * 4. Citation Network Position (15%) - How well-connected in academic network
 * 5. Replication Rate (10%) - How often studies are successfully replicated
 */

const journalSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 200
  },

  abbreviation: {
    type: String,
    trim: true,
    maxlength: 50
  },

  publisher: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  issn: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple nulls
    match: /^\d{4}-\d{3}[\dX]$/
  },

  eissn: {
    type: String,
    unique: true,
    sparse: true,
    match: /^\d{4}-\d{3}[\dX]$/
  },

  // Academic Classification
  field: {
    type: String,
    required: true,
    enum: [
      'medicine',
      'biology',
      'chemistry',
      'physics',
      'psychology',
      'sociology',
      'economics',
      'political-science',
      'computer-science',
      'engineering',
      'environmental-science',
      'mathematics',
      'neuroscience',
      'public-health',
      'multidisciplinary',
      'other'
    ]
  },

  subfields: [{
    type: String,
    maxlength: 100
  }],

  // Journal Metrics
  metrics: {
    impactFactor: {
      type: Number,
      min: 0,
      default: 0
    },

    fiveYearImpactFactor: {
      type: Number,
      min: 0,
      default: 0
    },

    hIndex: {
      type: Number,
      min: 0,
      default: 0
    },

    citationCount: {
      type: Number,
      min: 0,
      default: 0
    },

    acceptanceRate: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },

    averageReviewTime: {
      type: Number, // in days
      min: 0,
      default: null
    },

    retractionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    replicationRate: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    }
  },

  // ReasonRank Scoring
  reasonRankScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },

  scoreComponents: {
    impactFactorScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },

    peerReviewQualityScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },

    publicationConsistencyScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },

    citationNetworkScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },

    replicationScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    }
  },

  // Publication Information
  website: {
    type: String,
    trim: true,
    maxlength: 500
  },

  yearFounded: {
    type: Number,
    min: 1000,
    max: new Date().getFullYear()
  },

  openAccess: {
    type: Boolean,
    default: false
  },

  publicationFrequency: {
    type: String,
    enum: ['weekly', 'monthly', 'bimonthly', 'quarterly', 'biannual', 'annual', 'irregular'],
    default: 'monthly'
  },

  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'disputed', 'predatory'],
    default: 'unverified'
  },

  verifiedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['verified', 'disputed', 'predatory']
    },
    notes: String,
    verifiedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Network Metrics
  networkMetrics: {
    centrality: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },

    citedByJournalsCount: {
      type: Number,
      min: 0,
      default: 0
    },

    citesJournalsCount: {
      type: Number,
      min: 0,
      default: 0
    },

    influenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    }
  },

  // Relationships
  studies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Study'
  }],

  stances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalStance'
  }],

  // Statistics
  statistics: {
    totalStudies: {
      type: Number,
      min: 0,
      default: 0
    },

    totalStances: {
      type: Number,
      min: 0,
      default: 0
    },

    supportingStances: {
      type: Number,
      min: 0,
      default: 0
    },

    opposingStances: {
      type: Number,
      min: 0,
      default: 0
    },

    neutralStances: {
      type: Number,
      min: 0,
      default: 0
    }
  },

  // Metadata
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
journalSchema.index({ name: 1 });
journalSchema.index({ field: 1 });
journalSchema.index({ reasonRankScore: -1 });
journalSchema.index({ 'metrics.impactFactor': -1 });
journalSchema.index({ verificationStatus: 1 });

/**
 * Calculate ReasonRank score for the journal
 *
 * Formula:
 * ReasonRankScore = (
 *   ImpactFactorScore × 0.30 +
 *   PeerReviewQualityScore × 0.25 +
 *   PublicationConsistencyScore × 0.20 +
 *   CitationNetworkScore × 0.15 +
 *   ReplicationScore × 0.10
 * ) × 100
 */
journalSchema.methods.calculateReasonRankScore = function() {
  // 1. Impact Factor Score (30% weight)
  // Normalize impact factor to 0-1 scale
  // Top journals have impact factors around 50-100, most are 0-10
  const impactFactorScore = Math.min(
    (this.metrics.impactFactor || 0) / 20,
    1.0
  );

  // Consider 5-year impact factor for stability
  const fiveYearScore = Math.min(
    (this.metrics.fiveYearImpactFactor || 0) / 20,
    1.0
  );

  this.scoreComponents.impactFactorScore = (impactFactorScore * 0.6) + (fiveYearScore * 0.4);

  // 2. Peer Review Quality Score (25% weight)
  // Based on acceptance rate (lower is more selective)
  // and retraction rate (lower is better)
  let peerReviewQuality = 0.5;

  if (this.metrics.acceptanceRate !== null) {
    // Lower acceptance rate = higher quality
    // 5% acceptance = 1.0 score, 50% acceptance = 0.5 score
    const acceptanceScore = Math.max(0, 1 - (this.metrics.acceptanceRate / 50));
    peerReviewQuality += acceptanceScore * 0.3;
  }

  // Lower retraction rate = higher quality
  // 0% retraction = 1.0, 5% retraction = 0.5
  const retractionScore = Math.max(0, 1 - (this.metrics.retractionRate / 5));
  peerReviewQuality += retractionScore * 0.2;

  // Normalize to 0-1
  this.scoreComponents.peerReviewQualityScore = Math.min(peerReviewQuality, 1.0);

  // 3. Publication Consistency Score (20% weight)
  // Based on years of operation and citation count
  const currentYear = new Date().getFullYear();
  const yearsInOperation = this.yearFounded ? currentYear - this.yearFounded : 0;

  // Longer operation = more established
  // 50+ years = 1.0, 0 years = 0
  const longevityScore = Math.min(yearsInOperation / 50, 1.0);

  // Citation count indicates consistent quality
  // 10,000+ citations = 1.0
  const citationScore = Math.min((this.metrics.citationCount || 0) / 10000, 1.0);

  this.scoreComponents.publicationConsistencyScore = (longevityScore * 0.4) + (citationScore * 0.6);

  // 4. Citation Network Score (15% weight)
  // Based on h-index and network centrality
  // h-index: 100+ = 1.0
  const hIndexScore = Math.min((this.metrics.hIndex || 0) / 100, 1.0);

  const centralityScore = this.networkMetrics.centrality || 0.5;

  this.scoreComponents.citationNetworkScore = (hIndexScore * 0.6) + (centralityScore * 0.4);

  // 5. Replication Score (10% weight)
  // Based on replication rate (if available)
  if (this.metrics.replicationRate !== null) {
    // 70%+ replication rate = 1.0
    this.scoreComponents.replicationScore = Math.min(this.metrics.replicationRate / 70, 1.0);
  } else {
    // Default to field average if not available
    this.scoreComponents.replicationScore = 0.5;
  }

  // Calculate final ReasonRank score
  this.reasonRankScore = (
    this.scoreComponents.impactFactorScore * 0.30 +
    this.scoreComponents.peerReviewQualityScore * 0.25 +
    this.scoreComponents.publicationConsistencyScore * 0.20 +
    this.scoreComponents.citationNetworkScore * 0.15 +
    this.scoreComponents.replicationScore * 0.10
  ) * 100;

  // Apply penalties for verification status
  if (this.verificationStatus === 'disputed') {
    this.reasonRankScore *= 0.7;
  } else if (this.verificationStatus === 'predatory') {
    this.reasonRankScore *= 0.1;
  }

  // Clamp to 0-100
  this.reasonRankScore = Math.max(0, Math.min(100, this.reasonRankScore));

  return this.reasonRankScore;
};

/**
 * Get detailed score breakdown for transparency
 */
journalSchema.methods.getScoreBreakdown = function() {
  return {
    reasonRankScore: this.reasonRankScore,
    components: {
      impactFactor: {
        score: this.scoreComponents.impactFactorScore,
        weight: 0.30,
        contribution: this.scoreComponents.impactFactorScore * 30
      },
      peerReviewQuality: {
        score: this.scoreComponents.peerReviewQualityScore,
        weight: 0.25,
        contribution: this.scoreComponents.peerReviewQualityScore * 25
      },
      publicationConsistency: {
        score: this.scoreComponents.publicationConsistencyScore,
        weight: 0.20,
        contribution: this.scoreComponents.publicationConsistencyScore * 20
      },
      citationNetwork: {
        score: this.scoreComponents.citationNetworkScore,
        weight: 0.15,
        contribution: this.scoreComponents.citationNetworkScore * 15
      },
      replication: {
        score: this.scoreComponents.replicationScore,
        weight: 0.10,
        contribution: this.scoreComponents.replicationScore * 10
      }
    },
    metrics: {
      impactFactor: this.metrics.impactFactor,
      hIndex: this.metrics.hIndex,
      acceptanceRate: this.metrics.acceptanceRate,
      retractionRate: this.metrics.retractionRate,
      citationCount: this.metrics.citationCount
    },
    verificationStatus: this.verificationStatus
  };
};

/**
 * Get score interpretation
 */
journalSchema.methods.getScoreInterpretation = function() {
  const score = this.reasonRankScore;

  if (score >= 80) {
    return {
      level: 'Tier 1 - Elite',
      description: 'Top-tier journal with exceptional impact, rigorous peer review, and outstanding reputation',
      confidence: 'Very High'
    };
  } else if (score >= 65) {
    return {
      level: 'Tier 2 - Highly Reputable',
      description: 'Well-established journal with strong impact and reliable peer review',
      confidence: 'High'
    };
  } else if (score >= 50) {
    return {
      level: 'Tier 3 - Reputable',
      description: 'Solid journal with reasonable impact and peer review standards',
      confidence: 'Moderate'
    };
  } else if (score >= 35) {
    return {
      level: 'Tier 4 - Emerging',
      description: 'Developing journal with limited track record or moderate impact',
      confidence: 'Moderate'
    };
  } else {
    return {
      level: 'Tier 5 - Low Quality',
      description: 'Journal with poor metrics, questionable peer review, or predatory practices',
      confidence: 'Low'
    };
  }
};

/**
 * Update statistics when stances or studies change
 */
journalSchema.methods.updateStatistics = async function() {
  const JournalStance = mongoose.model('JournalStance');

  // Count stances by position
  const stances = await JournalStance.find({ journal: this._id });

  this.statistics.totalStances = stances.length;
  this.statistics.supportingStances = stances.filter(s => s.position === 'supporting').length;
  this.statistics.opposingStances = stances.filter(s => s.position === 'opposing').length;
  this.statistics.neutralStances = stances.filter(s => s.position === 'neutral').length;
  this.statistics.totalStudies = this.studies.length;

  this.lastUpdated = new Date();
};

// Update lastUpdated on save
journalSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const Journal = mongoose.model('Journal', journalSchema);

export default Journal;
