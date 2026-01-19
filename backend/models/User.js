import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password by default
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user',
  },
  reputation: {
    type: Number,
    default: 0,
    description: 'Legacy reputation score',
  },

  // ===== REASONRANK SYSTEM =====
  // Principle: Earn influence through accurate methodology assessment, not credentials
  reasonRank: {
    overall: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Overall ReasonRank score - ability to assess argument quality',
    },

    // Methodology Assessment Track
    methodologyAssessment: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        description: 'Accuracy in evaluating evidence methodology',
      },
      evaluationsSubmitted: {
        type: Number,
        default: 0,
      },
      accurateEvaluations: {
        type: Number,
        default: 0,
        description: 'Evaluations that aligned with consensus',
      },
      challengesSubmitted: {
        type: Number,
        default: 0,
      },
      validChallenges: {
        type: Number,
        default: 0,
        description: 'Challenges deemed valid by community',
      },
      invalidChallenges: {
        type: Number,
        default: 0,
        description: 'Challenges deemed invalid',
      },
    },

    // Argument Assessment Track
    argumentAssessment: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      argumentsCreated: {
        type: Number,
        default: 0,
      },
      highQualityArguments: {
        type: Number,
        default: 0,
        description: 'Arguments that scored > 70',
      },
    },

    // Linkage Assessment Track
    linkageAssessment: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      linkagesEvaluated: {
        type: Number,
        default: 0,
      },
      accurateLinkages: {
        type: Number,
        default: 0,
      },
    },

    // Track history for transparency
    history: [{
      date: {
        type: Date,
        default: Date.now,
      },
      action: {
        type: String,
        enum: [
          'challenge_validated',
          'challenge_refuted',
          'evaluation_aligned',
          'evaluation_contradicted',
          'argument_strengthened',
          'argument_weakened',
        ],
      },
      impact: {
        type: Number,
        description: 'Change to ReasonRank from this action',
      },
      relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'reasonRank.history.relatedType',
      },
      relatedType: {
        type: String,
        enum: ['MethodologyChallenge', 'Argument', 'Evidence'],
      },
    }],

    // Credentials (tracked but NOT used for scoring)
    credentials: [{
      type: {
        type: String,
        description: 'e.g., PhD, MD, Professional Experience',
      },
      field: String,
      institution: String,
      verified: {
        type: Boolean,
        default: false,
      },
      note: {
        type: String,
        default: 'Credentials are tracked for transparency but do not affect ReasonRank',
      },
    }],

    lastCalculated: {
      type: Date,
      default: Date.now,
    },
  },

  createdBeliefs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Belief',
  }],
  createdArguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument',
  }],
  votedArguments: [{
    argumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Argument',
    },
    vote: {
      type: String,
      enum: ['up', 'down'],
    },
  }],

  // === MONETIZATION FIELDS ===
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },

  // === ACHIEVEMENTS ===
  achievements: [{
    achievement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    progress: {
      current: {
        type: Number,
        default: 0
      },
      required: {
        type: Number,
        required: true
      },
      percentage: {
        type: Number,
        default: 0
      }
    },
    isUnlocked: {
      type: Boolean,
      default: false
    },
    unlockedAt: {
      type: Date
    },
    displayOnProfile: {
      type: Boolean,
      default: false
    },
    isPinned: {
      type: Boolean,
      default: false
    }
  }],

  // === MATCHING/DATING PROFILE ===
  matchingProfile: {
    enabled: {
      type: Boolean,
      default: false
    },
    bio: {
      type: String,
      maxlength: 500
    },
    age: {
      type: Number,
      min: 18,
      max: 120
    },
    location: {
      city: String,
      state: String,
      country: String
    },
    interests: [{
      type: String
    }],
    lookingFor: {
      type: String,
      enum: ['friendship', 'dating', 'networking', 'debate_partner'],
      default: 'networking'
    },
    // Belief compatibility preferences
    dealBreakerBeliefs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Belief'
    }],
    importantBeliefs: [{
      belief: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Belief'
      },
      importance: {
        type: Number,
        min: 1,
        max: 10
      }
    }],
    // Privacy
    showInMatching: {
      type: Boolean,
      default: false
    },
    allowMessages: {
      type: Boolean,
      default: true
    }
  },

  // === USER PREFERENCES ===
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    marketingEmails: {
      type: Boolean,
      default: false
    },
    showAds: {
      type: Boolean,
      default: true
    }
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

// ===== REASONRANK CALCULATION METHODS =====

// Calculate Methodology Assessment Score
UserSchema.methods.calculateMethodologyAssessment = function() {
  const { methodologyAssessment } = this.reasonRank;

  if (methodologyAssessment.evaluationsSubmitted === 0 && methodologyAssessment.challengesSubmitted === 0) {
    methodologyAssessment.score = 0;
    return 0;
  }

  // Evaluation accuracy (40%)
  let evaluationScore = 0;
  if (methodologyAssessment.evaluationsSubmitted > 0) {
    const accuracyRatio = methodologyAssessment.accurateEvaluations / methodologyAssessment.evaluationsSubmitted;
    evaluationScore = accuracyRatio * 40;
  }

  // Challenge validity (60% - weighted higher because creating good challenges is harder)
  let challengeScore = 0;
  if (methodologyAssessment.challengesSubmitted > 0) {
    const totalChallenges = methodologyAssessment.validChallenges + methodologyAssessment.invalidChallenges;
    if (totalChallenges > 0) {
      const validityRatio = methodologyAssessment.validChallenges / totalChallenges;
      challengeScore = validityRatio * 60;
    }
  }

  // Bonus for volume (up to 20 points) - rewards active participation
  const activityBonus = Math.min(
    (methodologyAssessment.evaluationsSubmitted + methodologyAssessment.challengesSubmitted * 2) / 5,
    20
  );

  methodologyAssessment.score = Math.min(100, Math.round(evaluationScore + challengeScore + activityBonus));
  return methodologyAssessment.score;
};

// Calculate Argument Assessment Score
UserSchema.methods.calculateArgumentAssessment = function() {
  const { argumentAssessment } = this.reasonRank;

  if (argumentAssessment.argumentsCreated === 0) {
    argumentAssessment.score = 0;
    return 0;
  }

  // Quality ratio
  const qualityRatio = argumentAssessment.highQualityArguments / argumentAssessment.argumentsCreated;

  // Base score from quality ratio (0-80 points)
  let score = qualityRatio * 80;

  // Volume bonus (up to 20 points)
  const volumeBonus = Math.min(argumentAssessment.argumentsCreated * 2, 20);

  argumentAssessment.score = Math.min(100, Math.round(score + volumeBonus));
  return argumentAssessment.score;
};

// Calculate Linkage Assessment Score
UserSchema.methods.calculateLinkageAssessment = function() {
  const { linkageAssessment } = this.reasonRank;

  if (linkageAssessment.linkagesEvaluated === 0) {
    linkageAssessment.score = 0;
    return 0;
  }

  const accuracyRatio = linkageAssessment.accurateLinkages / linkageAssessment.linkagesEvaluated;
  linkageAssessment.score = Math.round(accuracyRatio * 100);
  return linkageAssessment.score;
};

// Calculate Overall ReasonRank
UserSchema.methods.calculateReasonRank = function() {
  // Calculate component scores
  const methodologyScore = this.calculateMethodologyAssessment();
  const argumentScore = this.calculateArgumentAssessment();
  const linkageScore = this.calculateLinkageAssessment();

  // Weighted average
  // Methodology assessment is most important (50%)
  // Argument creation is next (30%)
  // Linkage assessment (20%)
  this.reasonRank.overall = Math.round(
    methodologyScore * 0.50 +
    argumentScore * 0.30 +
    linkageScore * 0.20
  );

  this.reasonRank.lastCalculated = new Date();

  return this.reasonRank.overall;
};

// Record a ReasonRank event (for transparency)
UserSchema.methods.recordReasonRankEvent = function(action, impact, relatedId, relatedType) {
  this.reasonRank.history.push({
    date: new Date(),
    action,
    impact,
    relatedId,
    relatedType,
  });

  // Recalculate ReasonRank
  this.calculateReasonRank();

  return this.save();
};

// Update methodology assessment when a challenge is evaluated
UserSchema.methods.updateMethodologyFromChallenge = async function(challengeId, wasValid) {
  this.reasonRank.methodologyAssessment.challengesSubmitted += 1;

  if (wasValid) {
    this.reasonRank.methodologyAssessment.validChallenges += 1;
    await this.recordReasonRankEvent('challenge_validated', 5, challengeId, 'MethodologyChallenge');
  } else {
    this.reasonRank.methodologyAssessment.invalidChallenges += 1;
    await this.recordReasonRankEvent('challenge_refuted', -3, challengeId, 'MethodologyChallenge');
  }

  return this.save();
};

// Update methodology assessment when an evaluation aligns with consensus
UserSchema.methods.updateMethodologyFromEvaluation = async function(evaluationId, alignedWithConsensus) {
  this.reasonRank.methodologyAssessment.evaluationsSubmitted += 1;

  if (alignedWithConsensus) {
    this.reasonRank.methodologyAssessment.accurateEvaluations += 1;
    await this.recordReasonRankEvent('evaluation_aligned', 2, evaluationId, 'MethodologyChallenge');
  } else {
    await this.recordReasonRankEvent('evaluation_contradicted', -1, evaluationId, 'MethodologyChallenge');
  }

  return this.save();
};

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
UserSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    reputation: this.reputation,
    role: this.role,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', UserSchema);
