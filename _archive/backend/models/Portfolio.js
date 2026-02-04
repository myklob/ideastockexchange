import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  belief: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Belief',
    required: true,
    index: true
  },
  // Investment position
  position: {
    type: String,
    enum: ['long', 'short'], // long = betting score will increase, short = betting it will decrease
    required: true
  },
  // Number of shares
  shares: {
    type: Number,
    required: true,
    min: 1
  },
  // Price per share when purchased (based on belief score)
  purchasePrice: {
    type: Number,
    required: true
  },
  // Belief score at time of purchase
  purchaseScore: {
    type: Number,
    required: true
  },
  // Current value (updated periodically)
  currentPrice: {
    type: Number
  },
  currentScore: {
    type: Number
  },
  // Investment tracking
  totalInvested: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number
  },
  profitLoss: {
    type: Number,
    default: 0
  },
  profitLossPercentage: {
    type: Number,
    default: 0
  },
  // Status
  status: {
    type: String,
    enum: ['open', 'closed', 'liquidated'],
    default: 'open',
    required: true,
    index: true
  },
  // Closing details (when sold)
  closedAt: {
    type: Date
  },
  closePrice: {
    type: Number
  },
  closeScore: {
    type: Number
  },
  closingProfitLoss: {
    type: Number
  },
  // Risk metrics
  stopLoss: {
    type: Number // Auto-sell if score drops/rises to this level
  },
  takeProfit: {
    type: Number // Auto-sell if profit reaches this level
  },
  // Related transactions
  openTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  closeTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  // Metadata
  notes: {
    type: String,
    maxlength: 500
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Compound indexes
portfolioSchema.index({ user: 1, status: 1 });
portfolioSchema.index({ belief: 1, status: 1 });
portfolioSchema.index({ user: 1, belief: 1 });
portfolioSchema.index({ profitLoss: -1 });
portfolioSchema.index({ createdAt: -1 });

// Virtual for investment duration
portfolioSchema.virtual('durationDays').get(function() {
  const endDate = this.closedAt || new Date();
  return Math.floor((endDate - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Methods
portfolioSchema.methods.updateCurrentValue = async function(currentBeliefScore) {
  this.currentScore = currentBeliefScore;
  this.currentPrice = this.calculatePriceFromScore(currentBeliefScore);

  // Calculate profit/loss based on position
  if (this.position === 'long') {
    // Long position: profit when score increases
    this.currentValue = this.shares * this.currentPrice;
    this.profitLoss = this.currentValue - this.totalInvested;
  } else {
    // Short position: profit when score decreases
    const scoreChange = this.purchaseScore - currentBeliefScore;
    const priceChange = scoreChange * 10; // Each point = 10 virtual currency
    this.currentValue = this.totalInvested + (this.shares * priceChange);
    this.profitLoss = this.currentValue - this.totalInvested;
  }

  this.profitLossPercentage = (this.profitLoss / this.totalInvested) * 100;

  await this.save();
  return this;
};

portfolioSchema.methods.calculatePriceFromScore = function(score) {
  // Simple formula: each score point = 10 virtual currency
  return score * 10;
};

portfolioSchema.methods.closePosition = async function(currentBeliefScore, Transaction) {
  if (this.status !== 'open') {
    throw new Error('Position is already closed');
  }

  await this.updateCurrentValue(currentBeliefScore);

  this.status = 'closed';
  this.closedAt = new Date();
  this.closePrice = this.currentPrice;
  this.closeScore = currentBeliefScore;
  this.closingProfitLoss = this.profitLoss;

  // Create transaction for the sale
  const transaction = await Transaction.createTransaction({
    userId: this.user,
    type: this.profitLoss >= 0 ? 'idea_investment_profit' : 'idea_investment_loss',
    amount: this.currentValue, // Return the current value
    currency: 'virtual',
    description: `Closed ${this.position} position on belief with ${this.profitLoss >= 0 ? 'profit' : 'loss'}`,
    relatedBelief: this.belief,
    relatedInvestment: this._id,
    metadata: {
      shares: this.shares,
      purchasePrice: this.purchasePrice,
      closePrice: this.closePrice,
      profitLoss: this.profitLoss,
      profitLossPercentage: this.profitLossPercentage,
      investmentDuration: this.durationDays
    }
  });

  this.closeTransaction = transaction._id;
  await this.save();

  return { investment: this, transaction };
};

portfolioSchema.methods.checkAutoClose = async function(currentBeliefScore, Transaction) {
  if (this.status !== 'open') return null;

  await this.updateCurrentValue(currentBeliefScore);

  // Check stop loss
  if (this.stopLoss && this.profitLoss <= -Math.abs(this.stopLoss)) {
    return await this.closePosition(currentBeliefScore, Transaction);
  }

  // Check take profit
  if (this.takeProfit && this.profitLoss >= this.takeProfit) {
    return await this.closePosition(currentBeliefScore, Transaction);
  }

  return null;
};

// Static methods
portfolioSchema.statics.createInvestment = async function(data, Transaction) {
  const {
    userId,
    beliefId,
    belief, // Belief document
    position,
    shares,
    notes = '',
    stopLoss = null,
    takeProfit = null
  } = data;

  const purchaseScore = belief.conclusionScore;
  const purchasePrice = shares * purchaseScore * 10; // Each score point = 10 virtual currency per share
  const totalInvested = purchasePrice;

  // Create debit transaction
  const transaction = await Transaction.createTransaction({
    userId,
    type: 'idea_investment_buy',
    amount: -totalInvested, // Negative because spending
    currency: 'virtual',
    description: `Opened ${position} position on: ${belief.statement.substring(0, 50)}...`,
    relatedBelief: beliefId,
    metadata: {
      shares,
      pricePerShare: purchasePrice / shares,
      beliefScore: purchaseScore
    }
  });

  // Create portfolio entry
  const investment = await this.create({
    user: userId,
    belief: beliefId,
    position,
    shares,
    purchasePrice: purchasePrice / shares,
    purchaseScore,
    totalInvested,
    currentPrice: purchasePrice / shares,
    currentScore: purchaseScore,
    currentValue: totalInvested,
    stopLoss,
    takeProfit,
    notes,
    openTransaction: transaction._id,
    status: 'open'
  });

  return { investment, transaction };
};

portfolioSchema.statics.getUserPortfolio = async function(userId, options = {}) {
  const {
    status = 'open',
    limit = 50,
    skip = 0,
    sortBy = 'profitLoss',
    sortOrder = -1
  } = options;

  const query = { user: userId };
  if (status) query.status = status;

  const sort = {};
  sort[sortBy] = sortOrder;

  const investments = await this.find(query)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .populate('belief', 'statement conclusionScore category')
    .populate('openTransaction')
    .populate('closeTransaction');

  const total = await this.countDocuments(query);

  // Calculate portfolio statistics
  const stats = {
    totalInvestments: investments.length,
    totalInvested: investments.reduce((sum, inv) => sum + inv.totalInvested, 0),
    currentValue: investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0),
    totalProfitLoss: investments.reduce((sum, inv) => sum + inv.profitLoss, 0),
    openPositions: investments.filter(inv => inv.status === 'open').length,
    closedPositions: investments.filter(inv => inv.status === 'closed').length
  };

  stats.totalReturn = stats.totalInvested > 0
    ? ((stats.currentValue - stats.totalInvested) / stats.totalInvested) * 100
    : 0;

  return {
    investments,
    stats,
    pagination: {
      total,
      limit,
      skip,
      pages: Math.ceil(total / limit)
    }
  };
};

portfolioSchema.statics.getBeliefInvestments = async function(beliefId) {
  const investments = await this.find({
    belief: beliefId,
    status: 'open'
  })
    .populate('user', 'username reputation');

  const stats = {
    totalInvestors: investments.length,
    longPositions: investments.filter(inv => inv.position === 'long').length,
    shortPositions: investments.filter(inv => inv.position === 'short').length,
    totalInvested: investments.reduce((sum, inv) => sum + inv.totalInvested, 0),
    averageInvestment: 0
  };

  if (stats.totalInvestors > 0) {
    stats.averageInvestment = stats.totalInvested / stats.totalInvestors;
  }

  stats.sentiment = stats.longPositions / (stats.totalInvestors || 1);

  return { investments, stats };
};

portfolioSchema.statics.updateAllPositions = async function(beliefId, newScore) {
  const openPositions = await this.find({
    belief: beliefId,
    status: 'open'
  });

  const results = [];
  for (const position of openPositions) {
    await position.updateCurrentValue(newScore);

    // Check for auto-close conditions
    const Transaction = mongoose.model('Transaction');
    const closeResult = await position.checkAutoClose(newScore, Transaction);

    if (closeResult) {
      results.push({
        ...closeResult,
        autoClosed: true
      });
    }
  }

  return results;
};

portfolioSchema.statics.getLeaderboard = async function(options = {}) {
  const {
    timeframe = 'all', // all, month, week, day
    limit = 100
  } = options;

  const match = { status: 'closed' };

  // Add date filter if needed
  if (timeframe !== 'all') {
    const now = new Date();
    const startDate = new Date();

    switch(timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    match.closedAt = { $gte: startDate };
  }

  const leaderboard = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$user',
        totalProfit: { $sum: '$closingProfitLoss' },
        totalTrades: { $sum: 1 },
        successfulTrades: {
          $sum: { $cond: [{ $gt: ['$closingProfitLoss', 0] }, 1, 0] }
        },
        avgProfit: { $avg: '$closingProfitLoss' },
        bestTrade: { $max: '$closingProfitLoss' },
        worstTrade: { $min: '$closingProfitLoss' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        username: '$user.username',
        reputation: '$user.reputation',
        totalProfit,
        totalTrades,
        successfulTrades,
        successRate: {
          $multiply: [
            { $divide: ['$successfulTrades', '$totalTrades'] },
            100
          ]
        },
        avgProfit: 1,
        bestTrade: 1,
        worstTrade: 1
      }
    },
    { $sort: { totalProfit: -1 } },
    { $limit: limit }
  ]);

  return leaderboard;
};

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

export default Portfolio;
