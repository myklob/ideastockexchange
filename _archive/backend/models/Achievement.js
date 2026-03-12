import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  // Achievement definition
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'contribution', // Creating beliefs, arguments, evidence
      'investment', // Idea investing success
      'debate', // Debate participation
      'community', // Community engagement
      'learning', // Educational progress
      'special' // Special events
    ],
    required: true,
    index: true
  },
  // Difficulty/rarity
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze',
    required: true
  },
  // Icon/visual
  icon: {
    type: String,
    default: '🏆'
  },
  color: {
    type: String,
    default: '#FFD700'
  },
  // Rewards
  rewards: {
    virtualCurrency: {
      type: Number,
      default: 0
    },
    characterStrength: {
      type: Number,
      default: 0
    },
    reputation: {
      type: Number,
      default: 0
    },
    badge: {
      type: String
    }
  },
  // Unlock criteria
  criteria: {
    type: {
      type: String,
      enum: [
        'count', // Simple count (e.g., create 10 beliefs)
        'quality', // Quality threshold (e.g., argument score > 80)
        'streak', // Consecutive days
        'milestone', // Specific milestone
        'combo' // Multiple conditions
      ],
      default: 'count'
    },
    metric: {
      type: String // e.g., 'beliefs_created', 'arguments_created', 'investment_profit'
    },
    threshold: {
      type: Number
    },
    conditions: [{
      metric: String,
      operator: {
        type: String,
        enum: ['gt', 'gte', 'lt', 'lte', 'eq', 'between']
      },
      value: mongoose.Schema.Types.Mixed
    }]
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isSecret: {
    type: Boolean,
    default: false
  },
  // Statistics
  stats: {
    totalUnlocked: {
      type: Number,
      default: 0
    },
    firstUnlockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    firstUnlockedAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Indexes
achievementSchema.index({ category: 1, tier: 1 });
achievementSchema.index({ isActive: 1 });

// User Achievement Progress Schema (subdocument for User model)
const userAchievementSchema = new mongoose.Schema({
  achievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  // Progress tracking
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
  // Unlock status
  isUnlocked: {
    type: Boolean,
    default: false
  },
  unlockedAt: {
    type: Date
  },
  // Display
  displayOnProfile: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Methods
achievementSchema.methods.checkUnlock = function(userStats) {
  const { criteria } = this;

  switch (criteria.type) {
    case 'count':
      return userStats[criteria.metric] >= criteria.threshold;

    case 'quality':
      return userStats[criteria.metric] >= criteria.threshold;

    case 'streak':
      return userStats.currentStreak >= criteria.threshold;

    case 'milestone':
      return userStats[criteria.metric] === criteria.threshold;

    case 'combo':
      return criteria.conditions.every(condition => {
        const value = userStats[condition.metric];
        switch (condition.operator) {
          case 'gt': return value > condition.value;
          case 'gte': return value >= condition.value;
          case 'lt': return value < condition.value;
          case 'lte': return value <= condition.value;
          case 'eq': return value === condition.value;
          case 'between':
            return value >= condition.value[0] && value <= condition.value[1];
          default: return false;
        }
      });

    default:
      return false;
  }
};

achievementSchema.methods.calculateProgress = function(userStats) {
  const { criteria } = this;

  let current = 0;
  let required = criteria.threshold || 100;

  switch (criteria.type) {
    case 'count':
    case 'quality':
    case 'streak':
      current = userStats[criteria.metric] || 0;
      break;

    case 'milestone':
      current = userStats[criteria.metric] === criteria.threshold ? required : 0;
      break;

    case 'combo':
      // For combo, calculate average progress across all conditions
      const progresses = criteria.conditions.map(condition => {
        const value = userStats[condition.metric] || 0;
        const target = Array.isArray(condition.value) ? condition.value[1] : condition.value;
        return Math.min(100, (value / target) * 100);
      });
      current = progresses.reduce((sum, p) => sum + p, 0) / progresses.length;
      required = 100;
      break;
  }

  return {
    current: Math.min(current, required),
    required,
    percentage: Math.min(100, (current / required) * 100)
  };
};

// Static methods
achievementSchema.statics.initializeAchievements = async function() {
  const defaultAchievements = [
    // Contribution achievements
    {
      name: 'First Steps',
      slug: 'first-belief',
      description: 'Create your first belief',
      category: 'contribution',
      tier: 'bronze',
      icon: '🌱',
      rewards: { virtualCurrency: 100, characterStrength: 5, reputation: 10 },
      criteria: { type: 'count', metric: 'beliefs_created', threshold: 1 }
    },
    {
      name: 'Thoughtful Contributor',
      slug: 'ten-beliefs',
      description: 'Create 10 beliefs',
      category: 'contribution',
      tier: 'silver',
      icon: '💭',
      rewards: { virtualCurrency: 1000, characterStrength: 25, reputation: 50 },
      criteria: { type: 'count', metric: 'beliefs_created', threshold: 10 }
    },
    {
      name: 'Idea Factory',
      slug: 'hundred-beliefs',
      description: 'Create 100 beliefs',
      category: 'contribution',
      tier: 'gold',
      icon: '🏭',
      rewards: { virtualCurrency: 10000, characterStrength: 100, reputation: 250 },
      criteria: { type: 'count', metric: 'beliefs_created', threshold: 100 }
    },
    {
      name: 'Master Arguer',
      slug: 'quality-argument',
      description: 'Create an argument with score above 85',
      category: 'contribution',
      tier: 'gold',
      icon: '⚖️',
      rewards: { virtualCurrency: 5000, characterStrength: 50, reputation: 100 },
      criteria: { type: 'quality', metric: 'highest_argument_score', threshold: 85 }
    },
    {
      name: 'Evidence Master',
      slug: 'verified-evidence',
      description: 'Add 10 pieces of verified evidence',
      category: 'contribution',
      tier: 'silver',
      icon: '📚',
      rewards: { virtualCurrency: 2000, characterStrength: 30, reputation: 75 },
      criteria: { type: 'count', metric: 'verified_evidence_count', threshold: 10 }
    },

    // Investment achievements
    {
      name: 'Market Novice',
      slug: 'first-investment',
      description: 'Make your first idea investment',
      category: 'investment',
      tier: 'bronze',
      icon: '💰',
      rewards: { virtualCurrency: 500, characterStrength: 10, reputation: 20 },
      criteria: { type: 'count', metric: 'investments_made', threshold: 1 }
    },
    {
      name: 'Profitable Trader',
      slug: 'profitable-trade',
      description: 'Close a position with 50%+ profit',
      category: 'investment',
      tier: 'silver',
      icon: '📈',
      rewards: { virtualCurrency: 3000, characterStrength: 40, reputation: 100 },
      criteria: { type: 'quality', metric: 'best_trade_percentage', threshold: 50 }
    },
    {
      name: 'Investment Guru',
      slug: 'ten-thousand-profit',
      description: 'Earn 10,000 total profit from investments',
      category: 'investment',
      tier: 'gold',
      icon: '💎',
      rewards: { virtualCurrency: 10000, characterStrength: 100, reputation: 300 },
      criteria: { type: 'count', metric: 'total_investment_profit', threshold: 10000 }
    },
    {
      name: 'Diamond Hands',
      slug: 'diamond-hands',
      description: 'Hold a position for 30+ days and profit',
      category: 'investment',
      tier: 'platinum',
      icon: '💪',
      rewards: { virtualCurrency: 15000, characterStrength: 150, reputation: 500 },
      criteria: {
        type: 'combo',
        conditions: [
          { metric: 'longest_profitable_hold', operator: 'gte', value: 30 },
          { metric: 'longest_hold_profit', operator: 'gt', value: 0 }
        ]
      }
    },

    // Debate achievements
    {
      name: 'Debate Participant',
      slug: 'first-debate',
      description: 'Participate in your first conflict resolution',
      category: 'debate',
      tier: 'bronze',
      icon: '🎤',
      rewards: { virtualCurrency: 200, characterStrength: 15, reputation: 30 },
      criteria: { type: 'count', metric: 'debates_participated', threshold: 1 }
    },
    {
      name: 'Peacemaker',
      slug: 'resolve-conflict',
      description: 'Successfully resolve 5 conflicts',
      category: 'debate',
      tier: 'silver',
      icon: '🕊️',
      rewards: { virtualCurrency: 5000, characterStrength: 60, reputation: 150 },
      criteria: { type: 'count', metric: 'conflicts_resolved', threshold: 5 }
    },

    // Community achievements
    {
      name: 'Team Player',
      slug: 'helpful-votes',
      description: 'Cast 100 helpful votes on arguments',
      category: 'community',
      tier: 'bronze',
      icon: '👍',
      rewards: { virtualCurrency: 500, characterStrength: 20, reputation: 40 },
      criteria: { type: 'count', metric: 'votes_cast', threshold: 100 }
    },
    {
      name: 'Daily Devotee',
      slug: 'seven-day-streak',
      description: 'Log in for 7 consecutive days',
      category: 'community',
      tier: 'silver',
      icon: '🔥',
      rewards: { virtualCurrency: 2000, characterStrength: 35, reputation: 80 },
      criteria: { type: 'streak', metric: 'login_streak', threshold: 7 }
    },
    {
      name: 'Dedicated Scholar',
      slug: 'thirty-day-streak',
      description: 'Log in for 30 consecutive days',
      category: 'community',
      tier: 'gold',
      icon: '🏆',
      rewards: { virtualCurrency: 10000, characterStrength: 80, reputation: 200 },
      criteria: { type: 'streak', metric: 'login_streak', threshold: 30 }
    }
  ];

  for (const achievement of defaultAchievements) {
    await this.findOneAndUpdate(
      { slug: achievement.slug },
      achievement,
      { upsert: true, new: true }
    );
  }

  return await this.find({ isActive: true });
};

achievementSchema.statics.checkUserAchievements = async function(userId, userStats) {
  const User = mongoose.model('User');
  const Transaction = mongoose.model('Transaction');

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const achievements = await this.find({ isActive: true });
  const newUnlocks = [];

  for (const achievement of achievements) {
    // Check if already unlocked
    const existing = user.achievements?.find(
      ua => ua.achievement.toString() === achievement._id.toString() && ua.isUnlocked
    );

    if (existing) continue;

    // Check if criteria met
    if (achievement.checkUnlock(userStats)) {
      // Unlock achievement
      const progress = achievement.calculateProgress(userStats);

      // Add to user achievements
      if (!user.achievements) user.achievements = [];

      const userAchievement = {
        achievement: achievement._id,
        progress: {
          current: progress.required,
          required: progress.required,
          percentage: 100
        },
        isUnlocked: true,
        unlockedAt: new Date()
      };

      user.achievements.push(userAchievement);

      // Award rewards
      if (achievement.rewards.reputation) {
        user.reputation = (user.reputation || 0) + achievement.rewards.reputation;
      }

      if (achievement.rewards.virtualCurrency) {
        await Transaction.createTransaction({
          userId,
          type: 'achievement_reward',
          amount: achievement.rewards.virtualCurrency,
          currency: 'virtual',
          description: `Achievement unlocked: ${achievement.name}`,
          relatedAchievement: achievement._id
        });
      }

      // Update achievement stats
      achievement.stats.totalUnlocked += 1;
      if (!achievement.stats.firstUnlockedBy) {
        achievement.stats.firstUnlockedBy = userId;
        achievement.stats.firstUnlockedAt = new Date();
      }
      await achievement.save();

      newUnlocks.push({
        achievement,
        rewards: achievement.rewards
      });
    }
  }

  if (newUnlocks.length > 0) {
    await user.save();
  }

  return newUnlocks;
};

const Achievement = mongoose.model('Achievement', achievementSchema);

export default Achievement;
export { userAchievementSchema };
