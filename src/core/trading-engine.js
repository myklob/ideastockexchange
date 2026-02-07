const { User, Idea, Holding, Transaction } = require('../db/models');
const db = require('../db/database');

class TradingEngine {
  /**
   * Execute a buy order
   * @param {number} userId - ID of the buyer
   * @param {string} ticker - Ticker symbol of the idea
   * @param {number} shares - Number of shares to buy
   * @returns {object} Result with success status and details
   */
  static buy(userId, ticker, shares) {
    // Validate inputs
    if (shares <= 0) {
      throw new Error('Share quantity must be positive');
    }

    const idea = Idea.findByTicker(ticker);
    if (!idea) {
      throw new Error('Idea not found');
    }

    const user = User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const cost = idea.current_price * shares;
    if (user.balance < cost) {
      throw new Error('Oops! Not enough money!');
    }

    // Execute trade in a transaction
    const trade = db.transaction(() => {
      // Deduct from buyer's balance
      User.updateBalance(userId, user.balance - cost);

      // Add shares to buyer's holdings
      Holding.upsert(userId, idea.id, shares, idea.current_price);

      // Record transaction
      const txId = Transaction.create(userId, null, idea.id, shares, idea.current_price, 'BUY');

      // Update price based on demand
      const newPrice = this.calculateNewPrice(idea, shares, 'BUY');
      Idea.updatePrice(idea.id, newPrice);

      return {
        transactionId: txId,
        shares,
        price: idea.current_price,
        cost,
        newPrice,
        newBalance: user.balance - cost
      };
    });

    return trade();
  }

  /**
   * Execute a sell order
   * @param {number} userId - ID of the seller
   * @param {string} ticker - Ticker symbol of the idea
   * @param {number} shares - Number of shares to sell
   * @returns {object} Result with success status and details
   */
  static sell(userId, ticker, shares) {
    // Validate inputs
    if (shares <= 0) {
      throw new Error('Share quantity must be positive');
    }

    const idea = Idea.findByTicker(ticker);
    if (!idea) {
      throw new Error('Idea not found');
    }

    const user = User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const holding = Holding.findByUserAndIdea(userId, idea.id);
    if (!holding || holding.shares < shares) {
      throw new Error('Oops! You don\'t have enough shares!');
    }

    const proceeds = idea.current_price * shares;

    // Execute trade in a transaction
    const trade = db.transaction(() => {
      // Add to seller's balance
      User.updateBalance(userId, user.balance + proceeds);

      // Remove shares from seller's holdings
      Holding.reduceShares(userId, idea.id, shares);

      // Record transaction
      const txId = Transaction.create(null, userId, idea.id, shares, idea.current_price, 'SELL');

      // Update price based on supply
      const newPrice = this.calculateNewPrice(idea, shares, 'SELL');
      Idea.updatePrice(idea.id, newPrice);

      return {
        transactionId: txId,
        shares,
        price: idea.current_price,
        proceeds,
        newPrice,
        newBalance: user.balance + proceeds
      };
    });

    return trade();
  }

  /**
   * Calculate new price based on supply and demand
   * @param {object} idea - The idea being traded
   * @param {number} shares - Number of shares in the trade
   * @param {string} type - 'BUY' or 'SELL'
   * @returns {number} New price
   */
  static calculateNewPrice(idea, shares, type) {
    const currentPrice = idea.current_price;
    const outstandingShares = idea.shares_outstanding;

    // Calculate impact factor (percentage of outstanding shares being traded)
    const impactFactor = shares / outstandingShares;

    // Price movement: 1-5% per 10% of shares traded
    // More shares traded = bigger price movement
    const baseMovement = impactFactor * 0.5; // 50% movement for 100% of shares

    // Add some randomness for market volatility (±10% of base movement)
    const volatility = (Math.random() - 0.5) * 0.2 * baseMovement;
    const totalMovement = baseMovement + volatility;

    let newPrice;
    if (type === 'BUY') {
      // Buying increases price
      newPrice = currentPrice * (1 + totalMovement);
    } else {
      // Selling decreases price
      newPrice = currentPrice * (1 - totalMovement);
    }

    // Ensure price doesn't go below $1
    newPrice = Math.max(1, newPrice);

    // Round to 2 decimal places
    return Math.round(newPrice * 100) / 100;
  }

  /**
   * Get portfolio value for a user
   * @param {number} userId - User ID
   * @returns {object} Portfolio summary
   */
  static getPortfolioValue(userId) {
    const holdings = Holding.findByUser(userId);
    const user = User.findById(userId);

    const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
    const totalCost = holdings.reduce((sum, h) => sum + (h.shares * h.avg_cost), 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      cash: user.balance,
      holdingsValue: totalValue,
      totalValue: user.balance + totalValue,
      gainLoss: totalGainLoss,
      gainLossPercent: totalGainLossPercent,
      holdings: holdings
    };
  }

  /**
   * Get leaderboard of top investors
   * @param {number} limit - Number of top investors to return
   * @returns {array} Top investors
   */
  static getLeaderboard(limit = 10) {
    const stmt = db.prepare(`
      SELECT
        u.id,
        u.username,
        u.balance,
        COALESCE(SUM(h.shares * i.current_price), 0) as holdings_value,
        (u.balance + COALESCE(SUM(h.shares * i.current_price), 0)) as total_value
      FROM users u
      LEFT JOIN holdings h ON u.id = h.user_id AND h.shares > 0
      LEFT JOIN ideas i ON h.idea_id = i.id
      GROUP BY u.id
      ORDER BY total_value DESC
      LIMIT ?
    `);

    return stmt.all(limit);
  }
}

module.exports = TradingEngine;
