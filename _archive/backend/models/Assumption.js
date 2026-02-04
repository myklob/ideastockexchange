import mongoose from 'mongoose';

const assumptionSchema = new mongoose.Schema({
  // Core assumption details
  statement: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },

  // Linkage to belief
  beliefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Belief',
    required: true,
    index: true
  },

  // Author tracking
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Arguments that depend on this assumption
  dependentArguments: [{
    argumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Argument'
    },
    integralityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      description: 'How integral is this assumption to the argument (0-100)'
    }
  }],

  // Calculated score based on ReasonRank of dependent arguments
  aggregateScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    description: 'Weighted average of ReasonRank scores of dependent arguments'
  },

  // Critical assumption flags
  mustAccept: {
    type: Boolean,
    default: false,
    description: 'Must this assumption be accepted for the belief to hold?'
  },
  mustReject: {
    type: Boolean,
    default: false,
    description: 'Must this assumption be rejected for the belief to hold?'
  },
  criticalityReason: {
    type: String,
    maxlength: 500,
    description: 'Explanation of why this assumption is critical'
  },

  // Necessity links to other beliefs
  linkedBeliefs: [{
    beliefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Belief'
    },
    linkType: {
      type: String,
      enum: ['requires', 'contradicts', 'supports', 'implies'],
      default: 'requires'
    },
    linkStrength: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
      description: 'Strength of the logical link (0-1)'
    },
    description: {
      type: String,
      maxlength: 300
    }
  }],

  // Community engagement
  votes: {
    type: Number,
    default: 0
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },

  // Status and lifecycle
  status: {
    type: String,
    enum: ['proposed', 'accepted', 'rejected', 'debated', 'archived'],
    default: 'proposed'
  },

  // Metadata
  views: {
    type: Number,
    default: 0
  },
  tags: [String],

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
assumptionSchema.index({ beliefId: 1, aggregateScore: -1 });
assumptionSchema.index({ beliefId: 1, mustAccept: 1 });
assumptionSchema.index({ beliefId: 1, mustReject: 1 });
assumptionSchema.index({ author: 1 });
assumptionSchema.index({ status: 1 });

// Virtual for net votes
assumptionSchema.virtual('netVotes').get(function() {
  return this.upvotes - this.downvotes;
});

// Method to calculate aggregate score based on dependent arguments
assumptionSchema.methods.calculateAggregateScore = async function() {
  if (this.dependentArguments.length === 0) {
    this.aggregateScore = 0;
    return this.aggregateScore;
  }

  const Argument = mongoose.model('Argument');

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const dep of this.dependentArguments) {
    const argument = await Argument.findById(dep.argumentId);
    if (argument && argument.reasonRankScore !== undefined) {
      // Weight by both the argument's ReasonRank and the integrality score
      const weight = dep.integralityScore / 100;
      totalWeightedScore += argument.reasonRankScore * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight > 0) {
    this.aggregateScore = Math.round(totalWeightedScore / totalWeight);
  } else {
    this.aggregateScore = 0;
  }

  return this.aggregateScore;
};

// Method to add a dependent argument
assumptionSchema.methods.addDependentArgument = async function(argumentId, integralityScore = 50) {
  // Check if argument already exists in the list
  const exists = this.dependentArguments.some(
    dep => dep.argumentId.toString() === argumentId.toString()
  );

  if (!exists) {
    this.dependentArguments.push({
      argumentId,
      integralityScore
    });
    await this.calculateAggregateScore();
    await this.save();
  }

  return this;
};

// Method to remove a dependent argument
assumptionSchema.methods.removeDependentArgument = async function(argumentId) {
  this.dependentArguments = this.dependentArguments.filter(
    dep => dep.argumentId.toString() !== argumentId.toString()
  );
  await this.calculateAggregateScore();
  await this.save();
  return this;
};

// Method to update integrality score for a dependent argument
assumptionSchema.methods.updateIntegralityScore = async function(argumentId, newScore) {
  const dep = this.dependentArguments.find(
    d => d.argumentId.toString() === argumentId.toString()
  );

  if (dep) {
    dep.integralityScore = newScore;
    await this.calculateAggregateScore();
    await this.save();
  }

  return this;
};

// Method to link to another belief
assumptionSchema.methods.linkToBelief = async function(beliefId, linkType, linkStrength = 0.5, description = '') {
  // Check if link already exists
  const exists = this.linkedBeliefs.some(
    link => link.beliefId.toString() === beliefId.toString()
  );

  if (!exists) {
    this.linkedBeliefs.push({
      beliefId,
      linkType,
      linkStrength,
      description
    });
    await this.save();
  }

  return this;
};

// Method to mark as must-accept
assumptionSchema.methods.markAsMustAccept = async function(reason = '') {
  this.mustAccept = true;
  this.mustReject = false; // Can't be both
  this.criticalityReason = reason;
  await this.save();
  return this;
};

// Method to mark as must-reject
assumptionSchema.methods.markAsMustReject = async function(reason = '') {
  this.mustReject = true;
  this.mustAccept = false; // Can't be both
  this.criticalityReason = reason;
  await this.save();
  return this;
};

// Static method to get assumptions for a belief, sorted by aggregate score
assumptionSchema.statics.getForBelief = async function(beliefId, options = {}) {
  const {
    sortBy = 'aggregateScore', // 'aggregateScore', 'votes', 'createdAt'
    order = 'desc',
    status = null,
    mustAccept = null,
    mustReject = null,
    limit = null,
    skip = 0
  } = options;

  const query = { beliefId };

  if (status) query.status = status;
  if (mustAccept !== null) query.mustAccept = mustAccept;
  if (mustReject !== null) query.mustReject = mustReject;

  let queryBuilder = this.find(query)
    .populate('author', 'username')
    .populate('dependentArguments.argumentId')
    .populate('linkedBeliefs.beliefId', 'statement');

  // Sorting
  const sortOrder = order === 'desc' ? -1 : 1;
  if (sortBy === 'votes') {
    queryBuilder = queryBuilder.sort({ upvotes: sortOrder, downvotes: -sortOrder });
  } else if (sortBy === 'createdAt') {
    queryBuilder = queryBuilder.sort({ createdAt: sortOrder });
  } else {
    queryBuilder = queryBuilder.sort({ [sortBy]: sortOrder });
  }

  if (skip) queryBuilder = queryBuilder.skip(skip);
  if (limit) queryBuilder = queryBuilder.limit(limit);

  return await queryBuilder;
};

// Static method to get critical assumptions (must accept or reject)
assumptionSchema.statics.getCriticalForBelief = async function(beliefId) {
  return await this.find({
    beliefId,
    $or: [
      { mustAccept: true },
      { mustReject: true }
    ]
  })
    .populate('author', 'username')
    .populate('dependentArguments.argumentId')
    .sort({ aggregateScore: -1 });
};

// Pre-save middleware to validate
assumptionSchema.pre('save', function(next) {
  // Can't be both mustAccept and mustReject
  if (this.mustAccept && this.mustReject) {
    this.mustReject = false;
  }
  next();
});

// Ensure virtuals are included in JSON
assumptionSchema.set('toJSON', { virtuals: true });
assumptionSchema.set('toObject', { virtuals: true });

const Assumption = mongoose.model('Assumption', assumptionSchema);
export default Assumption;
