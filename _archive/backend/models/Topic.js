import mongoose from 'mongoose';

const TopicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a topic name'],
    trim: true,
    unique: true,
    maxlength: [200, 'Topic name cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['politics', 'science', 'technology', 'philosophy', 'economics', 'social', 'other'],
    default: 'other',
  },
  // Parent-child topic hierarchy (e.g., "Politics" → "U.S. Politics" → "Trump Administration")
  parentTopic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
  },
  subTopics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
  }],
  // Related topics (topics that often appear together)
  relatedTopics: [{
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
    },
    relevanceScore: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },
  }],
  // External taxonomy mappings (Dewey, LoC, Wikipedia, etc.)
  taxonomyMappings: [{
    system: {
      type: String,
      enum: ['dewey', 'loc', 'wikipedia', 'openalex', 'mesh', 'unesco', 'google-kg'],
      description: 'External taxonomy system'
    },
    code: {
      type: String,
      description: 'External classification code (e.g., "500" for Dewey Science)'
    },
    name: {
      type: String,
      description: 'Human-readable name in external system'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
      description: 'Confidence in this mapping (0-1)'
    },
    source: {
      type: String,
      enum: ['manual', 'automated', 'ai-generated', 'community'],
      default: 'manual'
    }
  }],
  // Aggregated statistics from all beliefs in this topic
  statistics: {
    totalBeliefs: {
      type: Number,
      default: 0,
    },
    totalArguments: {
      type: Number,
      default: 0,
    },
    totalEvidence: {
      type: Number,
      default: 0,
    },
    averageBeliefScore: {
      type: Number,
      default: 50,
    },
    // Dimensional averages across all beliefs in topic
    averageSpecificity: {
      type: Number,
      default: 50,
    },
    averageSentiment: {
      type: Number,
      default: 0,
    },
    // Belief counts by sentiment polarity (for topic page organization)
    positiveBeliefs: {
      type: Number,
      default: 0,
      description: 'Count of beliefs with positive sentiment (>20)'
    },
    neutralBeliefs: {
      type: Number,
      default: 0,
      description: 'Count of beliefs with neutral sentiment (-20 to 20)'
    },
    negativeBeliefs: {
      type: Number,
      default: 0,
      description: 'Count of beliefs with negative sentiment (<-20)'
    },
  },
  tags: [{
    type: String,
    trim: true,
  }],
  featured: {
    type: Boolean,
    default: false,
  },
  trending: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'merged'],
    default: 'active',
  },
  // If this topic was merged into another
  mergedInto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

// Generate slug from name
TopicSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Update topic statistics based on beliefs
TopicSchema.methods.updateStatistics = async function() {
  const Belief = mongoose.model('Belief');

  const beliefs = await Belief.find({ topicId: this._id, status: 'active' });

  this.statistics.totalBeliefs = beliefs.length;

  if (beliefs.length === 0) {
    this.statistics.totalArguments = 0;
    this.statistics.averageBeliefScore = 50;
    this.statistics.averageSpecificity = 50;
    this.statistics.averageSentiment = 0;
    this.statistics.positiveBeliefs = 0;
    this.statistics.neutralBeliefs = 0;
    this.statistics.negativeBeliefs = 0;
  } else {
    // Calculate totals and averages
    let totalArgs = 0;
    let totalScore = 0;
    let totalSpecificity = 0;
    let totalSentiment = 0;
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    beliefs.forEach(belief => {
      totalArgs += belief.statistics?.totalArguments || 0;
      totalScore += belief.conclusionScore || 50;
      totalSpecificity += belief.dimensions?.specificity || 50;
      totalSentiment += belief.dimensions?.sentimentPolarity || 0;

      // Categorize by sentiment polarity
      const sentiment = belief.dimensions?.sentimentPolarity || 0;
      if (sentiment > 20) {
        positiveCount++;
      } else if (sentiment < -20) {
        negativeCount++;
      } else {
        neutralCount++;
      }
    });

    this.statistics.totalArguments = totalArgs;
    this.statistics.averageBeliefScore = Math.round(totalScore / beliefs.length);
    this.statistics.averageSpecificity = Math.round(totalSpecificity / beliefs.length);
    this.statistics.averageSentiment = Math.round(totalSentiment / beliefs.length);
    this.statistics.positiveBeliefs = positiveCount;
    this.statistics.neutralBeliefs = neutralCount;
    this.statistics.negativeBeliefs = negativeCount;
  }

  return this.save();
};

// Get all beliefs for this topic with filters
TopicSchema.methods.getBeliefs = async function(filters = {}) {
  const Belief = mongoose.model('Belief');

  const query = { topicId: this._id, status: 'active' };

  // Apply dimensional filters
  if (filters.minSpecificity !== undefined) {
    query['dimensions.specificity'] = { $gte: filters.minSpecificity };
  }
  if (filters.maxSpecificity !== undefined) {
    query['dimensions.specificity'] = {
      ...query['dimensions.specificity'],
      $lte: filters.maxSpecificity
    };
  }

  if (filters.minStrength !== undefined) {
    query.conclusionScore = { $gte: filters.minStrength };
  }
  if (filters.maxStrength !== undefined) {
    query.conclusionScore = {
      ...query.conclusionScore,
      $lte: filters.maxStrength
    };
  }

  if (filters.minSentiment !== undefined) {
    query['dimensions.sentimentPolarity'] = { $gte: filters.minSentiment };
  }
  if (filters.maxSentiment !== undefined) {
    query['dimensions.sentimentPolarity'] = {
      ...query['dimensions.sentimentPolarity'],
      $lte: filters.maxSentiment
    };
  }

  const beliefs = await Belief.find(query)
    .populate('author', 'username')
    .populate('supportingArguments')
    .populate('opposingArguments')
    .sort(filters.sort || '-createdAt');

  return beliefs;
};

// Get topic hierarchy (breadcrumb trail)
TopicSchema.methods.getHierarchy = async function() {
  const hierarchy = [{ _id: this._id, name: this.name, slug: this.slug }];

  let currentTopic = this;
  while (currentTopic.parentTopic) {
    await currentTopic.populate('parentTopic');
    currentTopic = currentTopic.parentTopic;
    hierarchy.unshift({
      _id: currentTopic._id,
      name: currentTopic.name,
      slug: currentTopic.slug
    });
  }

  return hierarchy;
};

// Get beliefs organized by sentiment polarity (for topic page display)
// Returns: { positive: [...], neutral: [...], negative: [...] }
TopicSchema.methods.getOrganizedBeliefs = async function(options = {}) {
  const Belief = mongoose.model('Belief');

  // Default sort: by strength (conclusionScore) descending
  const sortBy = options.sortBy || 'conclusionScore';
  const sortOrder = options.sortOrder || -1;
  const sortCriteria = {};
  sortCriteria[sortBy] = sortOrder;

  const beliefs = await Belief.find({ topicId: this._id, status: 'active' })
    .populate('author', 'username')
    .sort(sortCriteria);

  // Categorize by sentiment polarity
  const organized = {
    positive: [],
    neutral: [],
    negative: [],
    all: beliefs
  };

  beliefs.forEach(belief => {
    const sentiment = belief.dimensions?.sentimentPolarity || 0;
    if (sentiment > 20) {
      organized.positive.push(belief);
    } else if (sentiment < -20) {
      organized.negative.push(belief);
    } else {
      organized.neutral.push(belief);
    }
  });

  // Sort each category by conclusionScore (strongest first)
  if (sortBy === 'conclusionScore') {
    organized.positive.sort((a, b) => (b.conclusionScore || 50) - (a.conclusionScore || 50));
    organized.neutral.sort((a, b) => (b.conclusionScore || 50) - (a.conclusionScore || 50));
    organized.negative.sort((a, b) => (b.conclusionScore || 50) - (a.conclusionScore || 50));
  }

  return organized;
};

// Index for better query performance
TopicSchema.index({ name: 'text', description: 'text' });
TopicSchema.index({ slug: 1 });
TopicSchema.index({ category: 1, status: 1 });
TopicSchema.index({ featured: 1, trending: 1 });
TopicSchema.index({ parentTopic: 1 });

export default mongoose.model('Topic', TopicSchema);
