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
