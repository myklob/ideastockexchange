import mongoose from 'mongoose';

/**
 * Contributor Schema
 *
 * Represents a public figure, expert, or contributor to a belief.
 * Can be linked to a User account or represent external/historical figures.
 *
 * Two-Factor Rating System:
 * 1. Influence Score (I): 0-100 - measures reach/influence
 * 2. Linkage Score (L): -100 to +100 - measures stance strength and direction
 *
 * Combined Score: C = I × (L/100)
 * - Positive C = Supporter
 * - Negative C = Opponent
 */
const contributorSchema = new mongoose.Schema({
  // Core Identity
  name: {
    type: String,
    required: [true, 'Contributor name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [200, 'Name cannot exceed 200 characters']
  },

  // Optional link to User account (for platform users)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Belief this contribution relates to
  belief: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Belief',
    required: [true, 'Belief reference is required']
  },

  // INFLUENCE SCORE (I)
  // "How far their voice carries"
  // Range: 0-100
  influenceScore: {
    type: Number,
    required: true,
    min: [0, 'Influence score cannot be negative'],
    max: [100, 'Influence score cannot exceed 100'],
    default: 50
  },

  // Influence sources and justification
  influenceSources: [{
    type: {
      type: String,
      enum: [
        'academic_citations',
        'media_exposure',
        'social_followers',
        'cultural_significance',
        'historical_impact',
        'expert_recognition',
        'publication_reach',
        'other'
      ]
    },
    description: String,
    url: String,
    metric: Number, // e.g., citation count, follower count
    dateVerified: Date
  }],

  // LINKAGE SCORE (L)
  // "How strongly and in what direction they take a stance"
  // Range: -100 (strong opposition) to +100 (strong support)
  linkageScore: {
    type: Number,
    required: true,
    min: [-100, 'Linkage score cannot be less than -100'],
    max: [100, 'Linkage score cannot exceed 100'],
    default: 0
  },

  // Linkage sources and justification
  linkageSources: [{
    type: {
      type: String,
      enum: [
        'direct_statement',
        'published_work',
        'speech',
        'interview',
        'social_media',
        'voting_record',
        'policy_position',
        'other'
      ]
    },
    description: String,
    quote: String, // Direct quote or excerpt
    url: String,
    date: Date,
    relevance: {
      type: Number,
      min: 0,
      max: 1,
      default: 1 // How relevant to this specific belief
    }
  }],

  // METADATA
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },

  expertise: [{
    type: String,
    trim: true
  }],

  credentials: [{
    type: String,
    trim: true
  }],

  externalLinks: [{
    type: {
      type: String,
      enum: ['website', 'wikipedia', 'twitter', 'linkedin', 'google_scholar', 'other']
    },
    url: String
  }],

  // Contribution tracking
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  verified: {
    type: Boolean,
    default: false
  },

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  verifiedAt: Date,

  // Notes and discussion
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },

  // Flags for moderation
  flagged: {
    type: Boolean,
    default: false
  },

  flagReason: String,

  // Timestamps
  timestamps: true
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// INDEXES
contributorSchema.index({ belief: 1, name: 1 });
contributorSchema.index({ user: 1 });
contributorSchema.index({ influenceScore: -1 });
contributorSchema.index({ linkageScore: -1 });
contributorSchema.index({ addedBy: 1 });

// VIRTUAL: Combined Contributor Score (C = I × L/100)
contributorSchema.virtual('combinedScore').get(function() {
  return this.influenceScore * (this.linkageScore / 100);
});

// VIRTUAL: Role classification
contributorSchema.virtual('role').get(function() {
  const C = this.combinedScore;
  if (C > 50) return 'Strong Supporter';
  if (C > 0) return 'Supporter';
  if (C === 0) return 'Neutral';
  if (C > -50) return 'Opponent';
  return 'Strong Opponent';
});

// VIRTUAL: Stance strength (absolute value of linkage)
contributorSchema.virtual('stanceStrength').get(function() {
  return Math.abs(this.linkageScore);
});

// INSTANCE METHODS

/**
 * Get a comprehensive score breakdown for display
 */
contributorSchema.methods.getScoreBreakdown = function() {
  const C = this.combinedScore;
  return {
    influenceScore: this.influenceScore,
    linkageScore: this.linkageScore,
    combinedScore: C,
    role: this.role,
    stanceStrength: this.stanceStrength,
    interpretation: this.getScoreInterpretation()
  };
};

/**
 * Get human-readable interpretation of scores
 */
contributorSchema.methods.getScoreInterpretation = function() {
  const I = this.influenceScore;
  const L = this.linkageScore;
  const C = this.combinedScore;

  let influence = 'moderate';
  if (I >= 80) influence = 'very high';
  else if (I >= 60) influence = 'high';
  else if (I >= 40) influence = 'moderate';
  else if (I >= 20) influence = 'low';
  else influence = 'very low';

  let stance = 'neutral';
  if (Math.abs(L) >= 80) stance = 'very strong';
  else if (Math.abs(L) >= 60) stance = 'strong';
  else if (Math.abs(L) >= 40) stance = 'moderate';
  else if (Math.abs(L) >= 20) stance = 'weak';
  else stance = 'minimal';

  let direction = 'neutral';
  if (L > 0) direction = 'supportive';
  else if (L < 0) direction = 'opposing';

  return {
    influence,
    stance,
    direction,
    summary: `${this.name} has ${influence} influence and takes a ${stance} ${direction} stance (C=${C.toFixed(1)})`
  };
};

/**
 * Update influence score based on new sources
 */
contributorSchema.methods.recalculateInfluenceScore = function() {
  if (!this.influenceSources || this.influenceSources.length === 0) {
    return this.influenceScore;
  }

  // Weighted calculation based on source types
  const weights = {
    academic_citations: 1.0,
    expert_recognition: 0.9,
    cultural_significance: 0.8,
    publication_reach: 0.7,
    media_exposure: 0.6,
    social_followers: 0.4,
    historical_impact: 0.9,
    other: 0.3
  };

  let totalWeight = 0;
  let weightedSum = 0;

  this.influenceSources.forEach(source => {
    const weight = weights[source.type] || 0.5;
    // Normalize metric to 0-100 scale (simplified)
    const normalizedMetric = source.metric ? Math.min(100, Math.log10(source.metric + 1) * 20) : 50;
    weightedSum += normalizedMetric * weight;
    totalWeight += weight;
  });

  if (totalWeight > 0) {
    this.influenceScore = Math.round(Math.min(100, weightedSum / totalWeight));
  }

  return this.influenceScore;
};

/**
 * Update linkage score based on new sources
 */
contributorSchema.methods.recalculateLinkageScore = function() {
  if (!this.linkageSources || this.linkageSources.length === 0) {
    return this.linkageScore;
  }

  // Average linkage from sources, weighted by relevance
  let totalRelevance = 0;
  let weightedSum = 0;

  this.linkageSources.forEach(source => {
    const relevance = source.relevance || 1;
    // Manual linkage scores should be stored in source metadata
    // For now, we keep the current linkageScore as authoritative
    totalRelevance += relevance;
  });

  // This is a placeholder - actual linkage should be determined by human review
  // or NLP analysis of the source materials
  return this.linkageScore;
};

// STATIC METHODS

/**
 * Get ranked contributors for a belief
 * @param {ObjectId} beliefId - The belief to get contributors for
 * @param {String} sortBy - Sort criteria: 'combined' (default), 'influence', 'stance'
 * @param {String} filterRole - Optional role filter: 'supporter', 'opponent', 'all' (default)
 */
contributorSchema.statics.getRankedContributors = async function(beliefId, sortBy = 'combined', filterRole = 'all') {
  let contributors = await this.find({ belief: beliefId, flagged: false })
    .populate('addedBy', 'username')
    .populate('user', 'username reputation')
    .lean();

  // Calculate combined scores
  contributors = contributors.map(c => ({
    ...c,
    combinedScore: c.influenceScore * (c.linkageScore / 100),
    stanceStrength: Math.abs(c.linkageScore)
  }));

  // Filter by role
  if (filterRole === 'supporter') {
    contributors = contributors.filter(c => c.linkageScore > 0);
  } else if (filterRole === 'opponent') {
    contributors = contributors.filter(c => c.linkageScore < 0);
  }

  // Sort
  switch (sortBy) {
    case 'influence':
      contributors.sort((a, b) => b.influenceScore - a.influenceScore);
      break;
    case 'stance':
      contributors.sort((a, b) => b.stanceStrength - a.stanceStrength);
      break;
    case 'combined':
    default:
      contributors.sort((a, b) => b.combinedScore - a.combinedScore);
      break;
  }

  return contributors;
};

/**
 * Get top supporters and opponents for a belief
 */
contributorSchema.statics.getTopContributors = async function(beliefId, limit = 5) {
  const allContributors = await this.getRankedContributors(beliefId, 'combined', 'all');

  const supporters = allContributors
    .filter(c => c.combinedScore > 0)
    .slice(0, limit);

  const opponents = allContributors
    .filter(c => c.combinedScore < 0)
    .sort((a, b) => a.combinedScore - b.combinedScore) // Most negative first
    .slice(0, limit);

  return {
    topSupporters: supporters,
    topOpponents: opponents,
    totalSupporters: allContributors.filter(c => c.linkageScore > 0).length,
    totalOpponents: allContributors.filter(c => c.linkageScore < 0).length,
    totalNeutral: allContributors.filter(c => c.linkageScore === 0).length
  };
};

/**
 * Search contributors by name or expertise
 */
contributorSchema.statics.searchContributors = async function(query, beliefId = null) {
  const searchCriteria = {
    $or: [
      { name: new RegExp(query, 'i') },
      { expertise: new RegExp(query, 'i') },
      { bio: new RegExp(query, 'i') }
    ],
    flagged: false
  };

  if (beliefId) {
    searchCriteria.belief = beliefId;
  }

  return await this.find(searchCriteria)
    .populate('user', 'username reputation')
    .limit(20);
};

export default mongoose.model('Contributor', contributorSchema);
