import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      // Real money transactions
      'subscription_payment',
      'subscription_refund',
      'api_payment',
      'one_time_purchase',
      // Virtual currency transactions
      'virtual_currency_purchase',
      'virtual_currency_earned',
      'virtual_currency_spent',
      'idea_investment_buy',
      'idea_investment_sell',
      'idea_investment_profit',
      'idea_investment_loss',
      'bonus_reward',
      'achievement_reward',
      'referral_bonus',
      'daily_login_bonus'
    ],
    required: true,
    index: true
  },
  // Amount (in cents for real money, in virtual currency units for virtual)
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['usd', 'eur', 'gbp', 'virtual'],
    default: 'virtual'
  },
  // Balance after transaction
  balanceAfter: {
    type: Number
  },
  // Payment processor details (for real money)
  stripePaymentIntentId: {
    type: String,
    sparse: true,
    index: true
  },
  stripeChargeId: {
    type: String
  },
  // Related entities
  relatedBelief: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Belief'
  },
  relatedSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  relatedInvestment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio'
  },
  relatedAchievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  },
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    required: true,
    index: true
  },
  // Error tracking
  errorMessage: {
    type: String
  },
  // Description
  description: {
    type: String,
    required: true
  },
  // Metadata
  metadata: {
    shares: Number, // For investment transactions
    pricePerShare: Number,
    beliefScore: Number,
    profitLoss: Number,
    investmentDuration: Number // in days
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ currency: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

// Virtual for determining if this is a real money transaction
transactionSchema.virtual('isRealMoney').get(function() {
  return this.currency !== 'virtual';
});

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  if (this.currency === 'virtual') {
    return `${this.amount.toLocaleString()} ISE Coins`;
  }
  const dollars = this.amount / 100;
  return `$${dollars.toFixed(2)}`;
});

// Methods
transactionSchema.methods.complete = async function() {
  this.status = 'completed';
  return await this.save();
};

transactionSchema.methods.fail = async function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  return await this.save();
};

transactionSchema.methods.refund = async function() {
  this.status = 'refunded';
  return await this.save();
};

// Static methods
transactionSchema.statics.getUserBalance = async function(userId, currency = 'virtual') {
  const result = await this.aggregate([
    {
      $match: {
        user: userId,
        currency: currency,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalBalance: { $sum: '$amount' }
      }
    }
  ]);

  return result.length > 0 ? result[0].totalBalance : 0;
};

transactionSchema.statics.getUserTransactionHistory = async function(userId, options = {}) {
  const {
    limit = 50,
    skip = 0,
    type = null,
    currency = null,
    startDate = null,
    endDate = null
  } = options;

  const query = { user: userId };

  if (type) query.type = type;
  if (currency) query.currency = currency;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const transactions = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('relatedBelief', 'statement conclusionScore')
    .populate('relatedInvestment');

  const total = await this.countDocuments(query);

  return {
    transactions,
    pagination: {
      total,
      limit,
      skip,
      pages: Math.ceil(total / limit)
    }
  };
};

transactionSchema.statics.getRevenueStats = async function(startDate, endDate) {
  const match = {
    status: 'completed',
    currency: { $ne: 'virtual' }
  };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        totalRevenue: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);

  const totalRevenue = stats.reduce((sum, stat) => sum + stat.totalRevenue, 0);

  return {
    stats,
    totalRevenue,
    totalTransactions: stats.reduce((sum, stat) => sum + stat.count, 0)
  };
};

transactionSchema.statics.createTransaction = async function(data) {
  const {
    userId,
    type,
    amount,
    currency = 'virtual',
    description,
    relatedBelief = null,
    relatedSubscription = null,
    relatedInvestment = null,
    relatedAchievement = null,
    metadata = {}
  } = data;

  // Get current balance
  const currentBalance = await this.getUserBalance(userId, currency);
  const balanceAfter = currentBalance + amount;

  // For virtual currency, check if user has sufficient balance for negative amounts
  if (currency === 'virtual' && amount < 0 && balanceAfter < 0) {
    throw new Error('Insufficient virtual currency balance');
  }

  const transaction = await this.create({
    user: userId,
    type,
    amount,
    currency,
    balanceAfter,
    description,
    relatedBelief,
    relatedSubscription,
    relatedInvestment,
    relatedAchievement,
    metadata,
    status: 'completed' // Auto-complete virtual currency transactions
  });

  return transaction;
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
