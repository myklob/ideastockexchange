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
