import mongoose from 'mongoose';

const EvidenceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide evidence title'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  type: {
    type: String,
    enum: ['study', 'article', 'book', 'video', 'image', 'data', 'expert-opinion', 'other'],
    required: true,
  },
  source: {
    url: {
      type: String,
      trim: true,
    },
    author: {
      type: String,
      trim: true,
    },
    publication: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
    },
  },
  credibilityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'disputed', 'debunked'],
    default: 'unverified',
  },
  verifiedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['verified', 'disputed'],
    },
    notes: String,
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  arguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument',
  }],
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  metadata: {
    doi: String,
    isbn: String,
    pmid: String,
    citations: Number,
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

// Calculate credibility score based on verifications
EvidenceSchema.methods.calculateCredibilityScore = function() {
  if (this.verifiedBy.length === 0) {
    this.credibilityScore = 50;
    return this.credibilityScore;
  }

  const verifiedCount = this.verifiedBy.filter(v => v.status === 'verified').length;
  const disputedCount = this.verifiedBy.filter(v => v.status === 'disputed').length;

  const score = 50 + (verifiedCount * 10) - (disputedCount * 10);
  this.credibilityScore = Math.max(0, Math.min(100, score));

  // Update verification status
  if (verifiedCount >= 3) {
    this.verificationStatus = 'verified';
  } else if (disputedCount >= 3) {
    this.verificationStatus = 'disputed';
  }

  return this.credibilityScore;
};

// Add verification
EvidenceSchema.methods.addVerification = function(userId, status, notes) {
  this.verifiedBy.push({
    user: userId,
    status,
    notes,
    verifiedAt: new Date(),
  });

  this.calculateCredibilityScore();
  return this.save();
};

// Index for searching
EvidenceSchema.index({ title: 'text', description: 'text' });
EvidenceSchema.index({ type: 1, verificationStatus: 1 });

export default mongoose.model('Evidence', EvidenceSchema);
