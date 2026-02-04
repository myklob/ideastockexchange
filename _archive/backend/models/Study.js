import mongoose from 'mongoose';

/**
 * Study Model - Tracks published studies/papers with ReasonRank scoring
 *
 * Similar to Google Scholar but with actual PageRank-style algorithms
 *
 * ReasonRank for studies is based on:
 * 1. Citation Impact (30%) - Number and quality of citations
 * 2. Journal Quality (25%) - ReasonRank score of publishing journal
 * 3. Methodological Rigor (20%) - Quality of research methodology
 * 4. Replication Status (15%) - Whether findings have been replicated
 * 5. Network Position (10%) - Position in citation network
 */

const studySchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 500
  },

  authors: [{
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    affiliation: {
      type: String,
      maxlength: 200
    },
    orcid: {
      type: String,
      match: /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/
    }
  }],

  abstract: {
    type: String,
    maxlength: 5000
  },

  // Publication Details
  journal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journal',
    required: true
  },

  publicationDate: {
    type: Date,
    required: true
  },

  doi: {
    type: String,
    unique: true,
    sparse: true,
    match: /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/
  },

  pmid: {
    type: String,
    unique: true,
    sparse: true,
    match: /^\d+$/
  },

  url: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  pdfUrl: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Study Categorization
  studyType: {
    type: String,
    required: true,
    enum: [
      'randomized-controlled-trial',
      'cohort-study',
      'case-control-study',
      'cross-sectional-study',
      'systematic-review',
      'meta-analysis',
      'observational-study',
      'experimental-study',
      'theoretical-paper',
      'review-paper',
      'case-report',
      'other'
    ]
  },

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

  keywords: [{
    type: String,
    maxlength: 50
  }],

  // Citation Metrics
  citationMetrics: {
    citationCount: {
      type: Number,
      min: 0,
      default: 0
    },

    citedByStudies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Study'
    }],

    references: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Study'
    }],

    citationsPerYear: {
      type: Number,
      min: 0,
      default: 0
    },

    hIndexContribution: {
      type: Number,
      min: 0,
      default: 0
    }
  },

  // Methodological Quality
  methodologyMetrics: {
    sampleSize: {
      type: Number,
      min: 0,
      default: null
    },

    controlGroup: {
      type: Boolean,
      default: null
    },

    randomization: {
      type: Boolean,
      default: null
    },

    blinding: {
      type: String,
      enum: ['none', 'single-blind', 'double-blind', 'triple-blind', null],
      default: null
    },

    pValue: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },

    confidenceInterval: {
      lower: Number,
      upper: Number
    },

    effectSize: {
      type: Number,
      default: null
    },

    statisticalPower: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },

    preregistered: {
      type: Boolean,
      default: false
    },

    dataAvailable: {
      type: Boolean,
      default: false
    },

    codeAvailable: {
      type: Boolean,
      default: false
    }
  },

  // Replication Information
  replicationInfo: {
    hasBeenReplicated: {
      type: Boolean,
      default: false
    },

    replicationAttempts: {
      type: Number,
      min: 0,
      default: 0
    },

    successfulReplications: {
      type: Number,
      min: 0,
      default: 0
    },

    failedReplications: {
      type: Number,
      min: 0,
      default: 0
    },

    replicationStudies: [{
      study: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Study'
      },
      outcome: {
        type: String,
        enum: ['successful', 'failed', 'partial', 'inconclusive']
      }
    }],

    isReplicationOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Study'
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
    citationImpactScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },

    journalQualityScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },

    methodologicalRigorScore: {
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
    },

    networkPositionScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    }
  },

  // Network Metrics
  networkMetrics: {
    centrality: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },

    influenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },

    pageRankScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    }
  },

  // Verification and Quality Control
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'disputed', 'retracted'],
    default: 'unverified'
  },

  verifiedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['verified', 'disputed', 'retracted']
    },
    notes: String,
    verifiedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Relationships to beliefs and arguments
  stances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyStance'
  }],

  linkedArguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument'
  }],

  // Statistics
  statistics: {
    views: {
      type: Number,
      min: 0,
      default: 0
    },

    downloads: {
      type: Number,
      min: 0,
      default: 0
    },

    totalStances: {
      type: Number,
      min: 0,
      default: 0
    }
  },

  // Funding and Conflicts of Interest
  funding: [{
    source: String,
    grantNumber: String
  }],

  conflictsOfInterest: {
    type: String,
    maxlength: 2000
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
studySchema.index({ title: 1 });
studySchema.index({ doi: 1 });
studySchema.index({ journal: 1 });
studySchema.index({ field: 1 });
studySchema.index({ reasonRankScore: -1 });
studySchema.index({ 'citationMetrics.citationCount': -1 });
studySchema.index({ publicationDate: -1 });
studySchema.index({ verificationStatus: 1 });
studySchema.index({ keywords: 1 });

/**
 * Calculate ReasonRank score for the study
 *
 * Formula:
 * ReasonRankScore = (
 *   CitationImpactScore × 0.30 +
 *   JournalQualityScore × 0.25 +
 *   MethodologicalRigorScore × 0.20 +
 *   ReplicationScore × 0.15 +
 *   NetworkPositionScore × 0.10
 * ) × 100
 */
studySchema.methods.calculateReasonRankScore = async function() {
  const Journal = mongoose.model('Journal');

  // 1. Citation Impact Score (30% weight)
  const yearsSincePublication = (Date.now() - this.publicationDate) / (1000 * 60 * 60 * 24 * 365);

  // Citations per year (adjusted for age)
  this.citationMetrics.citationsPerYear = yearsSincePublication > 0
    ? this.citationMetrics.citationCount / yearsSincePublication
    : 0;

  // Normalize citation count (100+ citations = 1.0)
  const citationScore = Math.min(this.citationMetrics.citationCount / 100, 1.0);

  // Citations per year (10+ per year = 1.0)
  const citationsPerYearScore = Math.min(this.citationMetrics.citationsPerYear / 10, 1.0);

  this.scoreComponents.citationImpactScore = (citationScore * 0.6) + (citationsPerYearScore * 0.4);

  // 2. Journal Quality Score (25% weight)
  // Use the journal's ReasonRank score
  if (this.journal) {
    const journal = await Journal.findById(this.journal);
    if (journal) {
      // Journal scores are 0-100, normalize to 0-1
      this.scoreComponents.journalQualityScore = journal.reasonRankScore / 100;
    }
  }

  // 3. Methodological Rigor Score (20% weight)
  let rigorScore = 0;
  let rigorFactors = 0;

  // Sample size
  if (this.methodologyMetrics.sampleSize !== null) {
    rigorFactors++;
    // 1000+ participants = 1.0
    rigorScore += Math.min(this.methodologyMetrics.sampleSize / 1000, 1.0);
  }

  // Control group
  if (this.methodologyMetrics.controlGroup !== null) {
    rigorFactors++;
    rigorScore += this.methodologyMetrics.controlGroup ? 1.0 : 0.3;
  }

  // Randomization
  if (this.methodologyMetrics.randomization !== null) {
    rigorFactors++;
    rigorScore += this.methodologyMetrics.randomization ? 1.0 : 0.3;
  }

  // Blinding
  if (this.methodologyMetrics.blinding) {
    rigorFactors++;
    const blindingScores = {
      'none': 0.2,
      'single-blind': 0.6,
      'double-blind': 0.9,
      'triple-blind': 1.0
    };
    rigorScore += blindingScores[this.methodologyMetrics.blinding] || 0.2;
  }

  // P-value (< 0.05 = 1.0, >= 0.05 = 0.3)
  if (this.methodologyMetrics.pValue !== null) {
    rigorFactors++;
    rigorScore += this.methodologyMetrics.pValue < 0.05 ? 1.0 : 0.3;
  }

  // Statistical power (0.8+ = 1.0)
  if (this.methodologyMetrics.statisticalPower !== null) {
    rigorFactors++;
    rigorScore += this.methodologyMetrics.statisticalPower >= 0.8 ? 1.0 : this.methodologyMetrics.statisticalPower;
  }

  // Preregistration
  if (this.methodologyMetrics.preregistered) {
    rigorFactors++;
    rigorScore += 1.0;
  }

  // Data availability
  if (this.methodologyMetrics.dataAvailable) {
    rigorFactors++;
    rigorScore += 1.0;
  }

  // Code availability
  if (this.methodologyMetrics.codeAvailable) {
    rigorFactors++;
    rigorScore += 1.0;
  }

  // Study type quality (RCTs are gold standard)
  rigorFactors++;
  const studyTypeScores = {
    'randomized-controlled-trial': 1.0,
    'meta-analysis': 0.95,
    'systematic-review': 0.9,
    'cohort-study': 0.7,
    'case-control-study': 0.65,
    'cross-sectional-study': 0.6,
    'observational-study': 0.55,
    'experimental-study': 0.75,
    'theoretical-paper': 0.5,
    'review-paper': 0.6,
    'case-report': 0.4,
    'other': 0.5
  };
  rigorScore += studyTypeScores[this.studyType] || 0.5;

  this.scoreComponents.methodologicalRigorScore = rigorFactors > 0 ? rigorScore / rigorFactors : 0.5;

  // 4. Replication Score (15% weight)
  const totalAttempts = this.replicationInfo.replicationAttempts || 0;
  const successful = this.replicationInfo.successfulReplications || 0;

  if (totalAttempts > 0) {
    const replicationRate = successful / totalAttempts;
    // 70%+ success rate = 1.0
    this.scoreComponents.replicationScore = Math.min(replicationRate / 0.7, 1.0);
  } else if (this.replicationInfo.hasBeenReplicated) {
    // At least one successful replication
    this.scoreComponents.replicationScore = 0.7;
  } else {
    // No replication data - use neutral score
    this.scoreComponents.replicationScore = 0.5;
  }

  // Bonus for being a successful replication
  if (this.replicationInfo.isReplicationOf) {
    this.scoreComponents.replicationScore = Math.min(this.scoreComponents.replicationScore + 0.1, 1.0);
  }

  // 5. Network Position Score (10% weight)
  // Based on citation network centrality and PageRank
  const centralityScore = this.networkMetrics.centrality || 0;
  const pageRankScore = this.networkMetrics.pageRankScore || 0;

  this.scoreComponents.networkPositionScore = (centralityScore * 0.6) + (pageRankScore * 0.4);

  // Calculate final ReasonRank score
  this.reasonRankScore = (
    this.scoreComponents.citationImpactScore * 0.30 +
    this.scoreComponents.journalQualityScore * 0.25 +
    this.scoreComponents.methodologicalRigorScore * 0.20 +
    this.scoreComponents.replicationScore * 0.15 +
    this.scoreComponents.networkPositionScore * 0.10
  ) * 100;

  // Apply penalties for verification status
  if (this.verificationStatus === 'disputed') {
    this.reasonRankScore *= 0.5;
  } else if (this.verificationStatus === 'retracted') {
    this.reasonRankScore *= 0.1;
  }

  // Apply recency bonus for recent studies (< 2 years old)
  if (yearsSincePublication < 2) {
    const recencyBonus = (2 - yearsSincePublication) * 0.05; // Up to 10% bonus
    this.reasonRankScore *= (1 + recencyBonus);
  }

  // Clamp to 0-100
  this.reasonRankScore = Math.max(0, Math.min(100, this.reasonRankScore));

  return this.reasonRankScore;
};

/**
 * Calculate PageRank score using citation network
 * This is a simplified PageRank algorithm
 */
studySchema.methods.calculatePageRank = async function(dampingFactor = 0.85, iterations = 10) {
  const Study = mongoose.model('Study');

  // Get all studies in the network
  const allStudies = await Study.find({});
  const studyMap = new Map(allStudies.map(s => [s._id.toString(), s]));

  // Initialize PageRank scores
  let pageRanks = new Map();
  const initialScore = 1 / allStudies.length;
  allStudies.forEach(s => pageRanks.set(s._id.toString(), initialScore));

  // Iterative PageRank calculation
  for (let i = 0; i < iterations; i++) {
    const newPageRanks = new Map();

    for (const study of allStudies) {
      const studyId = study._id.toString();

      // Calculate contribution from citing papers
      let rank = (1 - dampingFactor) / allStudies.length;

      for (const citingStudyId of study.citationMetrics.citedByStudies) {
        const citingStudy = studyMap.get(citingStudyId.toString());
        if (citingStudy) {
          const outlinks = citingStudy.citationMetrics.references.length || 1;
          rank += dampingFactor * (pageRanks.get(citingStudyId.toString()) / outlinks);
        }
      }

      newPageRanks.set(studyId, rank);
    }

    pageRanks = newPageRanks;
  }

  // Update this study's PageRank score
  this.networkMetrics.pageRankScore = pageRanks.get(this._id.toString()) || 0;

  return this.networkMetrics.pageRankScore;
};

/**
 * Get detailed score breakdown for transparency
 */
studySchema.methods.getScoreBreakdown = function() {
  return {
    reasonRankScore: this.reasonRankScore,
    components: {
      citationImpact: {
        score: this.scoreComponents.citationImpactScore,
        weight: 0.30,
        contribution: this.scoreComponents.citationImpactScore * 30
      },
      journalQuality: {
        score: this.scoreComponents.journalQualityScore,
        weight: 0.25,
        contribution: this.scoreComponents.journalQualityScore * 25
      },
      methodologicalRigor: {
        score: this.scoreComponents.methodologicalRigorScore,
        weight: 0.20,
        contribution: this.scoreComponents.methodologicalRigorScore * 20
      },
      replication: {
        score: this.scoreComponents.replicationScore,
        weight: 0.15,
        contribution: this.scoreComponents.replicationScore * 15
      },
      networkPosition: {
        score: this.scoreComponents.networkPositionScore,
        weight: 0.10,
        contribution: this.scoreComponents.networkPositionScore * 10
      }
    },
    metrics: {
      citationCount: this.citationMetrics.citationCount,
      citationsPerYear: this.citationMetrics.citationsPerYear,
      sampleSize: this.methodologyMetrics.sampleSize,
      pValue: this.methodologyMetrics.pValue,
      replicationAttempts: this.replicationInfo.replicationAttempts,
      successfulReplications: this.replicationInfo.successfulReplications
    },
    verificationStatus: this.verificationStatus,
    studyType: this.studyType
  };
};

/**
 * Get score interpretation
 */
studySchema.methods.getScoreInterpretation = function() {
  const score = this.reasonRankScore;

  if (score >= 80) {
    return {
      level: 'Landmark Study',
      description: 'Highly influential study with exceptional methodology, strong replication, and massive citation impact',
      confidence: 'Very High'
    };
  } else if (score >= 65) {
    return {
      level: 'High-Quality Study',
      description: 'Well-designed study with strong evidence, good methodology, and significant impact',
      confidence: 'High'
    };
  } else if (score >= 50) {
    return {
      level: 'Solid Study',
      description: 'Decent study with reasonable methodology and moderate impact',
      confidence: 'Moderate'
    };
  } else if (score >= 35) {
    return {
      level: 'Preliminary Study',
      description: 'Early-stage research with limited validation or methodological concerns',
      confidence: 'Low'
    };
  } else {
    return {
      level: 'Weak Study',
      description: 'Poor methodology, failed replication, or retracted findings',
      confidence: 'Very Low'
    };
  }
};

// Update lastUpdated on save
studySchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const Study = mongoose.model('Study', studySchema);

export default Study;
