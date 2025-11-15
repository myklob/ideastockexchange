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

// Calculate conclusion score based on arguments
BeliefSchema.methods.calculateConclusionScore = async function() {
  await this.populate(['supportingArguments', 'opposingArguments']);

  const supportingScore = this.supportingArguments.reduce((sum, arg) => {
    return sum + (arg.scores.overall || 50);
  }, 0);

  const opposingScore = this.opposingArguments.reduce((sum, arg) => {
    return sum + (arg.scores.overall || 50);
  }, 0);

  const supportingAvg = this.supportingArguments.length > 0
    ? supportingScore / this.supportingArguments.length
    : 50;

  const opposingAvg = this.opposingArguments.length > 0
    ? opposingScore / this.opposingArguments.length
    : 50;

  // Weighted average based on number of arguments
  const totalArgs = this.supportingArguments.length + this.opposingArguments.length;
  if (totalArgs === 0) {
    this.conclusionScore = 50;
  } else {
    const supportWeight = this.supportingArguments.length / totalArgs;
    const opposeWeight = this.opposingArguments.length / totalArgs;

    this.conclusionScore = Math.round(
      (supportingAvg * supportWeight + (100 - opposingAvg) * opposeWeight)
    );
  }

  return this.conclusionScore;
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
