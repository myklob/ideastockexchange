import mongoose from 'mongoose';

const LawSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Please provide a law title'],
    trim: true,
    maxlength: [500, 'Title cannot exceed 500 characters'],
  },
  officialName: {
    type: String,
    trim: true,
    maxlength: [500, 'Official name cannot exceed 500 characters'],
    description: 'Official legal name or statute number',
  },
  description: {
    type: String,
    required: [true, 'Please provide a law description'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  fullText: {
    type: String,
    trim: true,
    description: 'Full text of the law (optional)',
  },

  // Jurisdiction Information
  jurisdiction: {
    country: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      description: 'State/Province/Region',
    },
    city: {
      type: String,
      trim: true,
      description: 'City/Municipality (if applicable)',
    },
    level: {
      type: String,
      enum: ['international', 'federal', 'national', 'state', 'provincial', 'local', 'municipal'],
      required: true,
      default: 'national',
    },
    populationCovered: {
      type: Number,
      description: 'Approximate population covered by this law',
    },
  },

  // Temporal Information
  enactedDate: {
    type: Date,
    description: 'Date the law was enacted',
  },
  effectiveDate: {
    type: Date,
    description: 'Date the law became effective',
  },
  repealedDate: {
    type: Date,
    description: 'Date the law was repealed (if applicable)',
  },
  lastAmended: {
    type: Date,
    description: 'Date of last amendment',
  },
  status: {
    type: String,
    enum: ['proposed', 'enacted', 'active', 'amended', 'repealed', 'challenged', 'suspended'],
    default: 'active',
    required: true,
  },

  // Relationship to Beliefs
  relatedBeliefs: [{
    beliefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Belief',
      required: true,
    },
    relationship: {
      type: String,
      enum: ['supports', 'opposes', 'neutral'],
      required: true,
      description: 'Does this law support, oppose, or is neutral toward the belief?',
    },
    strength: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      description: 'How strongly does this law support/oppose the belief? (0-100)',
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      description: 'Explanation of how this law relates to the belief',
    },
  }],

  // Legal Categories
  category: {
    type: String,
    enum: [
      'criminal', 'civil', 'administrative', 'constitutional',
      'environmental', 'labor', 'tax', 'commercial', 'family',
      'property', 'immigration', 'healthcare', 'education',
      'consumer-protection', 'anti-discrimination', 'other'
    ],
    default: 'other',
  },
  tags: [{
    type: String,
    trim: true,
  }],

  // Enforcement and Impact Metrics
  enforcement: {
    // How strongly is this law enforced?
    enforcementLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      description: 'Strength of enforcement (0=never enforced, 100=strictly enforced)',
    },
    convictionRate: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Percentage of violations that result in convictions',
    },
    averageViolationsPerYear: {
      type: Number,
      min: 0,
      description: 'Average number of reported violations per year',
    },
    budgetAllocated: {
      amount: {
        type: Number,
        min: 0,
        description: 'Budget allocated for enforcement',
      },
      currency: {
        type: String,
        default: 'USD',
      },
      year: {
        type: Number,
        description: 'Year of the budget allocation',
      },
    },
  },

  // Penalties and Severity
  penalties: {
    hasCriminalPenalties: {
      type: Boolean,
      default: false,
    },
    hasCivilPenalties: {
      type: Boolean,
      default: false,
    },
    severityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      description: 'Overall severity of penalties (0=minor fines, 100=death penalty)',
    },
    minFine: {
      amount: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },
    maxFine: {
      amount: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },
    minPrisonTime: {
      type: Number,
      min: 0,
      description: 'Minimum prison time in months',
    },
    maxPrisonTime: {
      type: Number,
      min: 0,
      description: 'Maximum prison time in months',
    },
    otherPenalties: {
      type: String,
      maxlength: [1000, 'Other penalties description cannot exceed 1000 characters'],
    },
  },

  // Legal Context
  context: {
    purpose: {
      type: String,
      maxlength: [2000, 'Purpose cannot exceed 2000 characters'],
      description: 'Stated purpose or justification of the law',
    },
    exceptions: {
      type: String,
      maxlength: [2000, 'Exceptions cannot exceed 2000 characters'],
      description: 'Notable exceptions or exemptions',
    },
    relatedLaws: [{
      lawId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Law',
      },
      relationship: {
        type: String,
        enum: ['amends', 'repeals', 'complements', 'contradicts', 'supersedes'],
      },
    }],
    isContested: {
      type: Boolean,
      default: false,
      description: 'Is this law currently being challenged or contested?',
    },
    contestationDetails: {
      type: String,
      maxlength: [2000, 'Contestation details cannot exceed 2000 characters'],
    },
  },

  // Scoring Dimensions
  scores: {
    // Coverage: What percentage of population affected?
    coverage: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      description: 'What percentage of relevant population is covered? (0-100)',
    },
    // Enforcement: Are violations actually prosecuted?
    enforcement: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      description: 'How well is this law enforced? (0-100)',
    },
    // Severity: How strong are the penalties?
    severity: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      description: 'How severe are the penalties? (0-100)',
    },
    // Stability: Long-established or recently contested?
    stability: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      description: 'How stable/established is this law? (0=very contested, 100=well-established)',
    },
    // Overall impact score
    overall: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      description: 'Overall weighted score combining all dimensions',
    },
  },

  // Public Opinion
  publicSupport: {
    supportPercentage: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Percentage of public that supports this law',
    },
    sourceType: {
      type: String,
      enum: ['poll', 'survey', 'referendum', 'election', 'estimated', 'unknown'],
      description: 'How was public support measured?',
    },
    sourceDate: {
      type: Date,
      description: 'When was public support measured?',
    },
    sourceUrl: {
      type: String,
      trim: true,
      description: 'URL to the source of public support data',
    },
  },

  // Evidence and Sources
  sources: [{
    type: {
      type: String,
      enum: ['official-text', 'government-website', 'legal-database', 'news-article', 'academic-paper', 'other'],
      required: true,
    },
    url: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    accessedDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: [500, 'Source notes cannot exceed 500 characters'],
    },
  }],

  // Metadata
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'disputed'],
    default: 'unverified',
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedDate: {
    type: Date,
  },
  flags: {
    needsUpdate: {
      type: Boolean,
      default: false,
    },
    needsVerification: {
      type: Boolean,
      default: true,
    },
    hasDataQualityIssues: {
      type: Boolean,
      default: false,
    },
  },

  // Statistics
  statistics: {
    views: {
      type: Number,
      default: 0,
    },
    citationCount: {
      type: Number,
      default: 0,
      description: 'How many beliefs reference this law',
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

// Calculate overall impact score based on multiple dimensions
LawSchema.methods.calculateOverallScore = function() {
  const { coverage, enforcement, severity, stability } = this.scores;

  // Weighted average: all dimensions are equally important
  // You can adjust weights based on specific needs
  const weights = {
    coverage: 0.3,
    enforcement: 0.3,
    severity: 0.2,
    stability: 0.2,
  };

  this.scores.overall = Math.round(
    (coverage * weights.coverage) +
    (enforcement * weights.enforcement) +
    (severity * weights.severity) +
    (stability * weights.stability)
  );

  return this.scores.overall;
};

// Calculate stability score based on age and contestation
LawSchema.methods.calculateStability = function() {
  let stabilityScore = 50;

  // Older laws are more stable
  if (this.enactedDate) {
    const yearsOld = (Date.now() - this.enactedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (yearsOld > 50) {
      stabilityScore += 30;
    } else if (yearsOld > 20) {
      stabilityScore += 20;
    } else if (yearsOld > 10) {
      stabilityScore += 10;
    } else if (yearsOld < 1) {
      stabilityScore -= 20;
    }
  }

  // Contested laws are less stable
  if (this.context.isContested) {
    stabilityScore -= 30;
  }

  // Status affects stability
  if (this.status === 'challenged') {
    stabilityScore -= 20;
  } else if (this.status === 'suspended') {
    stabilityScore -= 40;
  } else if (this.status === 'repealed') {
    stabilityScore = 0;
  } else if (this.status === 'active' && !this.context.isContested) {
    stabilityScore += 10;
  }

  // Recently amended laws are less stable
  if (this.lastAmended) {
    const monthsSinceAmendment = (Date.now() - this.lastAmended.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSinceAmendment < 12) {
      stabilityScore -= 10;
    }
  }

  // Ensure score is in valid range
  this.scores.stability = Math.max(0, Math.min(100, stabilityScore));
  return this.scores.stability;
};

// Calculate severity score based on penalties
LawSchema.methods.calculateSeverity = function() {
  let severityScore = 0;

  // Prison time is most severe
  if (this.penalties.maxPrisonTime) {
    if (this.penalties.maxPrisonTime >= 240) { // 20+ years
      severityScore = 90;
    } else if (this.penalties.maxPrisonTime >= 120) { // 10-20 years
      severityScore = 75;
    } else if (this.penalties.maxPrisonTime >= 60) { // 5-10 years
      severityScore = 60;
    } else if (this.penalties.maxPrisonTime >= 12) { // 1-5 years
      severityScore = 45;
    } else if (this.penalties.maxPrisonTime >= 1) { // Up to 1 year
      severityScore = 30;
    }
  }

  // Add severity for fines if no prison time
  if (severityScore === 0 && this.penalties.maxFine && this.penalties.maxFine.amount) {
    const maxFine = this.penalties.maxFine.amount;
    if (maxFine >= 1000000) {
      severityScore = 50;
    } else if (maxFine >= 100000) {
      severityScore = 35;
    } else if (maxFine >= 10000) {
      severityScore = 20;
    } else if (maxFine >= 1000) {
      severityScore = 10;
    } else {
      severityScore = 5;
    }
  }

  // Use provided severity score if higher
  if (this.penalties.severityScore > severityScore) {
    severityScore = this.penalties.severityScore;
  }

  this.scores.severity = Math.max(0, Math.min(100, severityScore));
  return this.scores.severity;
};

// Calculate enforcement score
LawSchema.methods.calculateEnforcement = function() {
  // Use the enforcement level if provided
  if (this.enforcement.enforcementLevel) {
    this.scores.enforcement = this.enforcement.enforcementLevel;
  }

  // Adjust based on conviction rate
  if (this.enforcement.convictionRate !== undefined) {
    // High conviction rate suggests strong enforcement
    this.scores.enforcement = Math.round(
      (this.scores.enforcement * 0.6) + (this.enforcement.convictionRate * 0.4)
    );
  }

  // Budget allocation suggests commitment to enforcement
  if (this.enforcement.budgetAllocated && this.enforcement.budgetAllocated.amount > 0) {
    this.scores.enforcement = Math.min(100, this.scores.enforcement + 5);
  }

  return this.scores.enforcement;
};

// Calculate coverage score
LawSchema.methods.calculateCoverage = function() {
  if (this.jurisdiction.populationCovered) {
    // If we know the exact population, use that for coverage estimation
    // This is a simplified calculation - in reality, you'd compare to relevant population
    // For now, we'll estimate based on jurisdiction level
    if (this.jurisdiction.level === 'international') {
      this.scores.coverage = 100;
    } else if (this.jurisdiction.level === 'federal' || this.jurisdiction.level === 'national') {
      this.scores.coverage = 80;
    } else if (this.jurisdiction.level === 'state' || this.jurisdiction.level === 'provincial') {
      this.scores.coverage = 50;
    } else {
      this.scores.coverage = 30;
    }
  } else {
    // Default based on level
    const levelScores = {
      international: 100,
      federal: 80,
      national: 80,
      state: 50,
      provincial: 50,
      local: 30,
      municipal: 20,
    };
    this.scores.coverage = levelScores[this.jurisdiction.level] || 50;
  }

  return this.scores.coverage;
};

// Update all scores
LawSchema.methods.updateAllScores = function() {
  this.calculateCoverage();
  this.calculateEnforcement();
  this.calculateSeverity();
  this.calculateStability();
  this.calculateOverallScore();
  return this.save();
};

// Increment view count
LawSchema.methods.incrementViews = function() {
  this.statistics.views += 1;
  return this.save();
};

// Get a summary of the law for display
LawSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    jurisdiction: `${this.jurisdiction.city || this.jurisdiction.state || this.jurisdiction.country}`,
    level: this.jurisdiction.level,
    status: this.status,
    scores: this.scores,
    enactedDate: this.enactedDate,
  };
};

// Indexes for better query performance
LawSchema.index({ title: 'text', description: 'text' });
LawSchema.index({ 'jurisdiction.country': 1, 'jurisdiction.state': 1 });
LawSchema.index({ category: 1, status: 1 });
LawSchema.index({ 'relatedBeliefs.beliefId': 1 });
LawSchema.index({ status: 1 });
LawSchema.index({ 'scores.overall': -1 });
LawSchema.index({ enactedDate: -1 });
LawSchema.index({ verificationStatus: 1 });

export default mongoose.model('Law', LawSchema);
