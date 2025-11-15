import mongoose from 'mongoose';

const ArgumentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please provide argument content'],
    trim: true,
    minlength: [10, 'Argument must be at least 10 characters'],
    maxlength: [2000, 'Argument cannot exceed 2000 characters'],
  },
  type: {
    type: String,
    enum: ['supporting', 'opposing'],
    required: [true, 'Please specify argument type'],
  },
  beliefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Belief',
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scores: {
    overall: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    logical: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    linkage: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    importance: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    evidenceStrength: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    logicalCoherence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    verificationCredibility: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    linkageRelevance: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    uniqueness: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    argumentImportance: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
  },
  evidence: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evidence',
  }],
  subArguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument',
  }],
  parentArgument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument',
  },
  votes: {
    up: {
      type: Number,
      default: 0,
    },
    down: {
      type: Number,
      default: 0,
    },
  },
  reasonRankScore: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'flagged', 'removed'],
    default: 'active',
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

// Calculate overall score based on component scores
ArgumentSchema.methods.calculateOverallScore = function() {
  const { logical, linkage, importance } = this.scores;
  this.scores.overall = Math.round((logical + linkage + importance) / 3);
  return this.scores.overall;
};

// Update ReasonRank score
ArgumentSchema.methods.updateReasonRankScore = function(score) {
  this.reasonRankScore = score;
  return this.save();
};

export default mongoose.model('Argument', ArgumentSchema);
