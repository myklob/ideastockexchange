import mongoose from 'mongoose';

const userStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // === CHARACTER STATS (for video game integration) ===
  character: {
    level: {
      type: Number,
      default: 1,
      min: 1
    },
    experience: {
      type: Number,
      default: 0,
      min: 0
    },
    strength: {
      type: Number,
      default: 10,
      min: 0
    },
    intelligence: {
      type: Number,
      default: 10,
      min: 0
    },
    wisdom: {
      type: Number,
      default: 10,
      min: 0
    },
    charisma: {
      type: Number,
      default: 10,
      min: 0
    },
    // Derived from argument quality
    logicalProwess: {
      type: Number,
      default: 10,
      min: 0
    },
    // Derived from evidence quality
    researchSkill: {
      type: Number,
      default: 10,
      min: 0
    },
    // Derived from investment success
    strategicThinking: {
      type: Number,
      default: 10,
      min: 0
    },
    // Derived from conflict resolution
    persuasion: {
      type: Number,
      default: 10,
      min: 0
    }
  },

  // === CONTRIBUTION STATS ===
  contributions: {
    beliefs_created: {
      type: Number,
      default: 0
    },
    arguments_created: {
      type: Number,
      default: 0
    },
    evidence_submitted: {
      type: Number,
      default: 0
    },
    verified_evidence_count: {
      type: Number,
      default: 0
    },
    votes_cast: {
      type: Number,
      default: 0
    },
    helpful_votes_received: {
      type: Number,
      default: 0
    },
    // Quality metrics
    average_belief_score: {
      type: Number,
      default: 50
    },
    average_argument_score: {
      type: Number,
      default: 50
    },
    highest_argument_score: {
      type: Number,
      default: 0
    },
    total_argument_strength: {
      type: Number,
      default: 0
    }
  },

  // === INVESTMENT STATS ===
  investing: {
    investments_made: {
      type: Number,
      default: 0
    },
    active_investments: {
      type: Number,
      default: 0
    },
    closed_positions: {
      type: Number,
      default: 0
    },
    total_invested: {
      type: Number,
      default: 0
    },
    total_investment_profit: {
      type: Number,
      default: 0
    },
    best_trade_profit: {
      type: Number,
      default: 0
    },
    best_trade_percentage: {
      type: Number,
      default: 0
    },
    worst_trade_loss: {
      type: Number,
      default: 0
    },
    profitable_trades: {
      type: Number,
      default: 0
    },
    losing_trades: {
      type: Number,
      default: 0
    },
    win_rate: {
      type: Number,
      default: 0
    },
    average_hold_time: {
      type: Number,
      default: 0 // in days
    },
    longest_profitable_hold: {
      type: Number,
      default: 0 // in days
    },
    longest_hold_profit: {
      type: Number,
      default: 0
    },
    current_streak: {
      type: Number,
      default: 0 // consecutive profitable trades
    },
    best_streak: {
      type: Number,
      default: 0
    }
  },

  // === DEBATE & COMMUNITY STATS ===
  community: {
    debates_participated: {
      type: Number,
      default: 0
    },
    conflicts_resolved: {
      type: Number,
      default: 0
    },
    successful_resolutions: {
      type: Number,
      default: 0
    },
    resolution_success_rate: {
      type: Number,
      default: 0
    },
    beliefs_changed: {
      type: Number,
      default: 0 // number of times user changed their position
    },
    open_mindedness_score: {
      type: Number,
      default: 50
    }
  },

  // === ENGAGEMENT STATS ===
  engagement: {
    login_streak: {
      type: Number,
      default: 0
    },
    best_login_streak: {
      type: Number,
      default: 0
    },
    last_login: {
      type: Date
    },
    total_logins: {
      type: Number,
      default: 0
    },
    days_active: {
      type: Number,
      default: 0
    },
    total_time_spent: {
      type: Number,
      default: 0 // in minutes
    },
    average_session_time: {
      type: Number,
      default: 0 // in minutes
    }
  },

  // === VIRTUAL CURRENCY ===
  currency: {
    balance: {
      type: Number,
      default: 1000 // Starting balance
    },
    lifetime_earned: {
      type: Number,
      default: 1000
    },
    lifetime_spent: {
      type: Number,
      default: 0
    },
    last_bonus: {
      type: Date
    }
  },

  // === MATCHING/DATING STATS ===
  matching: {
    profile_views: {
      type: Number,
      default: 0
    },
    profile_likes: {
      type: Number,
      default: 0
    },
    matches_made: {
      type: Number,
      default: 0
    },
    messages_sent: {
      type: Number,
      default: 0
    },
    compatibility_searches: {
      type: Number,
      default: 0
    }
  },

  // === LEADERBOARD RANKINGS ===
  rankings: {
    overall_rank: {
      type: Number,
      default: null
    },
    contribution_rank: {
      type: Number,
      default: null
    },
    investment_rank: {
      type: Number,
      default: null
    },
    debate_rank: {
      type: Number,
      default: null
    },
    last_updated: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Indexes
userStatsSchema.index({ 'character.level': -1 });
userStatsSchema.index({ 'character.strength': -1 });
userStatsSchema.index({ 'investing.total_investment_profit': -1 });
userStatsSchema.index({ 'contributions.beliefs_created': -1 });
userStatsSchema.index({ 'engagement.login_streak': -1 });

// Methods
userStatsSchema.methods.updateCharacterStats = async function() {
  const { contributions, investing, community } = this;

  // Logical Prowess: Based on argument quality
  this.character.logicalProwess = Math.min(100,
    10 + (contributions.average_argument_score * 0.5) + (contributions.arguments_created * 0.1)
  );

  // Research Skill: Based on evidence quality
  this.character.researchSkill = Math.min(100,
    10 + (contributions.verified_evidence_count * 2) + (contributions.evidence_submitted * 0.5)
  );

  // Strategic Thinking: Based on investment success
  this.character.strategicThinking = Math.min(100,
    10 + (investing.win_rate * 0.7) + (investing.profitable_trades * 0.3)
  );

  // Persuasion: Based on conflict resolution
  this.character.persuasion = Math.min(100,
    10 + (community.resolution_success_rate * 0.6) + (community.successful_resolutions * 2)
  );

  // Overall Strength: Average of all skills
  this.character.strength = Math.floor(
    (this.character.logicalProwess +
     this.character.researchSkill +
     this.character.strategicThinking +
     this.character.persuasion) / 4
  );

  // Intelligence: Based on contribution quality
  this.character.intelligence = Math.min(100,
    10 + (contributions.average_argument_score * 0.3) +
         (contributions.average_belief_score * 0.3) +
         (contributions.verified_evidence_count * 0.4)
  );

  // Wisdom: Based on investment success and open-mindedness
  this.character.wisdom = Math.min(100,
    10 + (investing.win_rate * 0.5) +
         (community.open_mindedness_score * 0.4) +
         (community.beliefs_changed * 0.1)
  );

  // Charisma: Based on community engagement
  this.character.charisma = Math.min(100,
    10 + (community.resolution_success_rate * 0.5) +
         (contributions.helpful_votes_received * 0.1) +
         (this.matching.matches_made * 0.4)
  );

  // Experience and Level
  this.character.experience =
    (contributions.beliefs_created * 100) +
    (contributions.arguments_created * 50) +
    (contributions.evidence_submitted * 75) +
    (investing.profitable_trades * 200) +
    (community.successful_resolutions * 150);

  this.character.level = Math.floor(1 + Math.sqrt(this.character.experience / 1000));

  await this.save();
};

userStatsSchema.methods.recordLogin = async function() {
  const now = new Date();
  const lastLogin = this.engagement.last_login;

  this.engagement.total_logins += 1;
  this.engagement.last_login = now;

  // Check if this is a consecutive day
  if (lastLogin) {
    const hoursSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60);

    if (hoursSinceLastLogin <= 24 && hoursSinceLastLogin >= 12) {
      // Consecutive day login
      this.engagement.login_streak += 1;
      this.engagement.best_login_streak = Math.max(
        this.engagement.best_login_streak,
        this.engagement.login_streak
      );
    } else if (hoursSinceLastLogin > 24) {
      // Streak broken
      this.engagement.login_streak = 1;
    }
  } else {
    this.engagement.login_streak = 1;
  }

  await this.save();

  // Check for daily login bonus
  const Transaction = mongoose.model('Transaction');
  const lastBonus = this.currency.last_bonus;
  const shouldGiveBonus = !lastBonus ||
    (now - lastBonus) / (1000 * 60 * 60) >= 24;

  if (shouldGiveBonus) {
    const bonusAmount = 100 * this.engagement.login_streak; // Bonus increases with streak

    await Transaction.createTransaction({
      userId: this.user,
      type: 'daily_login_bonus',
      amount: bonusAmount,
      currency: 'virtual',
      description: `Daily login bonus (${this.engagement.login_streak} day streak)`
    });

    this.currency.last_bonus = now;
    await this.save();
  }
};

userStatsSchema.methods.recordContribution = async function(type, quality = null) {
  switch (type) {
    case 'belief':
      this.contributions.beliefs_created += 1;
      if (quality) {
        this.contributions.average_belief_score =
          (this.contributions.average_belief_score * (this.contributions.beliefs_created - 1) + quality) /
          this.contributions.beliefs_created;
      }
      break;

    case 'argument':
      this.contributions.arguments_created += 1;
      if (quality) {
        this.contributions.total_argument_strength += quality;
        this.contributions.average_argument_score =
          this.contributions.total_argument_strength / this.contributions.arguments_created;
        this.contributions.highest_argument_score = Math.max(
          this.contributions.highest_argument_score,
          quality
        );
      }
      break;

    case 'evidence':
      this.contributions.evidence_submitted += 1;
      break;

    case 'evidence_verified':
      this.contributions.verified_evidence_count += 1;
      break;

    case 'vote':
      this.contributions.votes_cast += 1;
      break;

    case 'vote_received':
      this.contributions.helpful_votes_received += 1;
      break;
  }

  await this.save();
  await this.updateCharacterStats();
};

userStatsSchema.methods.recordInvestment = async function(type, data = {}) {
  switch (type) {
    case 'open':
      this.investing.investments_made += 1;
      this.investing.active_investments += 1;
      this.investing.total_invested += data.amount || 0;
      break;

    case 'close':
      this.investing.active_investments = Math.max(0, this.investing.active_investments - 1);
      this.investing.closed_positions += 1;

      const profit = data.profitLoss || 0;
      const percentage = data.profitLossPercentage || 0;

      this.investing.total_investment_profit += profit;

      if (profit > 0) {
        this.investing.profitable_trades += 1;
        this.investing.current_streak += 1;
        this.investing.best_streak = Math.max(this.investing.best_streak, this.investing.current_streak);

        if (profit > this.investing.best_trade_profit) {
          this.investing.best_trade_profit = profit;
          this.investing.best_trade_percentage = percentage;
        }

        if (data.duration && profit > 0) {
          if (data.duration > this.investing.longest_profitable_hold) {
            this.investing.longest_profitable_hold = data.duration;
            this.investing.longest_hold_profit = profit;
          }
        }
      } else {
        this.investing.losing_trades += 1;
        this.investing.current_streak = 0;

        if (profit < this.investing.worst_trade_loss) {
          this.investing.worst_trade_loss = profit;
        }
      }

      // Update win rate
      const totalTrades = this.investing.profitable_trades + this.investing.losing_trades;
      if (totalTrades > 0) {
        this.investing.win_rate = (this.investing.profitable_trades / totalTrades) * 100;
      }

      break;
  }

  await this.save();
  await this.updateCharacterStats();
};

// Static methods
userStatsSchema.statics.getOrCreate = async function(userId) {
  let stats = await this.findOne({ user: userId });

  if (!stats) {
    stats = await this.create({ user: userId });

    // Give starting bonus
    const Transaction = mongoose.model('Transaction');
    await Transaction.createTransaction({
      userId,
      type: 'bonus_reward',
      amount: 1000,
      currency: 'virtual',
      description: 'Welcome bonus - start your idea investing journey!'
    });
  }

  return stats;
};

userStatsSchema.statics.updateLeaderboards = async function() {
  // Overall ranking (by character strength)
  const overallRankings = await this.find()
    .sort({ 'character.strength': -1 })
    .select('user');

  overallRankings.forEach(async (stats, index) => {
    stats.rankings.overall_rank = index + 1;
    stats.rankings.last_updated = new Date();
    await stats.save();
  });

  // Contribution ranking
  const contributionRankings = await this.find()
    .sort({ 'contributions.total_argument_strength': -1 })
    .select('user');

  contributionRankings.forEach(async (stats, index) => {
    const fullStats = await this.findOne({ user: stats.user });
    fullStats.rankings.contribution_rank = index + 1;
    await fullStats.save();
  });

  // Investment ranking
  const investmentRankings = await this.find()
    .sort({ 'investing.total_investment_profit': -1 })
    .select('user');

  investmentRankings.forEach(async (stats, index) => {
    const fullStats = await this.findOne({ user: stats.user });
    fullStats.rankings.investment_rank = index + 1;
    await fullStats.save();
  });

  // Debate ranking
  const debateRankings = await this.find()
    .sort({ 'community.successful_resolutions': -1 })
    .select('user');

  debateRankings.forEach(async (stats, index) => {
    const fullStats = await this.findOne({ user: stats.user });
    fullStats.rankings.debate_rank = index + 1;
    await fullStats.save();
  });
};

userStatsSchema.statics.getLeaderboard = async function(category = 'overall', limit = 100) {
  const sortFields = {
    overall: { 'character.strength': -1 },
    contribution: { 'contributions.total_argument_strength': -1 },
    investment: { 'investing.total_investment_profit': -1 },
    debate: { 'community.successful_resolutions': -1 },
    level: { 'character.level': -1 }
  };

  const sort = sortFields[category] || sortFields.overall;

  const leaderboard = await this.find()
    .sort(sort)
    .limit(limit)
    .populate('user', 'username email reputation');

  return leaderboard;
};

const UserStats = mongoose.model('UserStats', userStatsSchema);

export default UserStats;
