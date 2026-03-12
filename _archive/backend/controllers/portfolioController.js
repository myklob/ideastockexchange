import Portfolio from '../models/Portfolio.js';
import Transaction from '../models/Transaction.js';
import Belief from '../models/Belief.js';
import UserStats from '../models/UserStats.js';

// Get user's portfolio
export const getUserPortfolio = async (req, res) => {
  try {
    const {
      status = 'open',
      limit = 50,
      skip = 0,
      sortBy = 'profitLoss',
      sortOrder = -1
    } = req.query;

    const result = await Portfolio.getUserPortfolio(req.user.id, {
      status,
      limit: parseInt(limit),
      skip: parseInt(skip),
      sortBy,
      sortOrder: parseInt(sortOrder)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get virtual currency balance
export const getBalance = async (req, res) => {
  try {
    const balance = await Transaction.getUserBalance(req.user.id, 'virtual');

    res.json({
      success: true,
      data: {
        balance,
        currency: 'ISE Coins'
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Open an investment position
export const openPosition = async (req, res) => {
  try {
    const {
      beliefId,
      position,
      shares,
      stopLoss = null,
      takeProfit = null,
      notes = ''
    } = req.body;

    // Validate input
    if (!beliefId || !position || !shares) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: beliefId, position, shares'
      });
    }

    if (!['long', 'short'].includes(position)) {
      return res.status(400).json({
        success: false,
        error: 'Position must be "long" or "short"'
      });
    }

    if (shares < 1) {
      return res.status(400).json({
        success: false,
        error: 'Shares must be at least 1'
      });
    }

    // Get belief
    const belief = await Belief.findById(beliefId);
    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found'
      });
    }

    // Check user has sufficient balance
    const balance = await Transaction.getUserBalance(req.user.id, 'virtual');
    const cost = shares * belief.conclusionScore * 10;

    if (balance < cost) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient virtual currency balance',
        required: cost,
        available: balance
      });
    }

    // Create investment
    const { investment, transaction } = await Portfolio.createInvestment({
      userId: req.user.id,
      beliefId,
      belief,
      position,
      shares,
      notes,
      stopLoss,
      takeProfit
    }, Transaction);

    // Update user stats
    const userStats = await UserStats.getOrCreate(req.user.id);
    await userStats.recordInvestment('open', { amount: cost });

    res.json({
      success: true,
      data: {
        investment,
        transaction
      },
      message: `Successfully opened ${position} position on belief`
    });
  } catch (error) {
    console.error('Open position error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Close an investment position
export const closePosition = async (req, res) => {
  try {
    const { investmentId } = req.params;

    const investment = await Portfolio.findOne({
      _id: investmentId,
      user: req.user.id
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        error: 'Investment not found'
      });
    }

    if (investment.status !== 'open') {
      return res.status(400).json({
        success: false,
        error: 'Investment is already closed'
      });
    }

    // Get current belief score
    const belief = await Belief.findById(investment.belief);
    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found'
      });
    }

    // Close position
    const result = await investment.closePosition(belief.conclusionScore, Transaction);

    // Update user stats
    const userStats = await UserStats.getOrCreate(req.user.id);
    await userStats.recordInvestment('close', {
      profitLoss: result.investment.closingProfitLoss,
      profitLossPercentage: result.investment.profitLossPercentage,
      duration: result.investment.durationDays
    });

    res.json({
      success: true,
      data: result,
      message: `Position closed with ${result.investment.closingProfitLoss >= 0 ? 'profit' : 'loss'}`
    });
  } catch (error) {
    console.error('Close position error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get investment leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const {
      timeframe = 'all',
      limit = 100
    } = req.query;

    const leaderboard = await Portfolio.getLeaderboard({
      timeframe,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get belief investment stats
export const getBeliefInvestments = async (req, res) => {
  try {
    const { beliefId } = req.params;

    const result = await Portfolio.getBeliefInvestments(beliefId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get belief investments error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get transaction history
export const getTransactionHistory = async (req, res) => {
  try {
    const {
      limit = 50,
      skip = 0,
      type = null,
      currency = null,
      startDate = null,
      endDate = null
    } = req.query;

    const result = await Transaction.getUserTransactionHistory(req.user.id, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      type,
      currency,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update all positions for a belief (called when belief score changes)
export const updateBeliefPositions = async (beliefId, newScore) => {
  try {
    const results = await Portfolio.updateAllPositions(beliefId, newScore);

    // Update user stats for any auto-closed positions
    for (const result of results) {
      if (result.autoClosed) {
        const userStats = await UserStats.getOrCreate(result.investment.user);
        await userStats.recordInvestment('close', {
          profitLoss: result.investment.closingProfitLoss,
          profitLossPercentage: result.investment.profitLossPercentage,
          duration: result.investment.durationDays
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Update belief positions error:', error);
    throw error;
  }
};

// Get trending investments
export const getTrendingInvestments = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get most invested beliefs in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const trending = await Portfolio.aggregate([
      {
        $match: {
          createdAt: { $gte: oneDayAgo },
          status: 'open'
        }
      },
      {
        $group: {
          _id: '$belief',
          totalInvestments: { $sum: 1 },
          totalShares: { $sum: '$shares' },
          totalValue: { $sum: '$totalInvested' },
          longPositions: {
            $sum: { $cond: [{ $eq: ['$position', 'long'] }, 1, 0] }
          },
          shortPositions: {
            $sum: { $cond: [{ $eq: ['$position', 'short'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'beliefs',
          localField: '_id',
          foreignField: '_id',
          as: 'belief'
        }
      },
      { $unwind: '$belief' },
      {
        $project: {
          belief: {
            _id: '$belief._id',
            statement: '$belief.statement',
            conclusionScore: '$belief.conclusionScore'
          },
          totalInvestments: 1,
          totalShares: 1,
          totalValue: 1,
          longPositions: 1,
          shortPositions: 1,
          sentiment: {
            $divide: ['$longPositions', '$totalInvestments']
          }
        }
      },
      { $sort: { totalInvestments: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    console.error('Get trending investments error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
