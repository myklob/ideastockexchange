const db = require('./database');
const bcrypt = require('bcryptjs');

// User Model
class User {
  static create(username, email, password) {
    const passwordHash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(username, email, passwordHash);
    return result.lastInsertRowid;
  }

  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT id, username, email, balance, created_at FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static authenticate(username, password) {
    const user = this.findByUsername(username);
    if (!user) return null;

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return null;

    delete user.password_hash;
    return user;
  }

  static updateBalance(userId, newBalance) {
    const stmt = db.prepare('UPDATE users SET balance = ? WHERE id = ?');
    stmt.run(newBalance, userId);
  }

  static getBalance(userId) {
    const user = this.findById(userId);
    return user ? user.balance : 0;
  }
}

// Idea Model
class Idea {
  static create(ticker, title, description, creatorId) {
    const stmt = db.prepare(`
      INSERT INTO ideas (ticker, title, description, creator_id, current_price, shares_outstanding)
      VALUES (?, ?, ?, ?, 100.0, 1000)
    `);
    const result = stmt.run(ticker.toUpperCase(), title, description, creatorId);
    const ideaId = result.lastInsertRowid;

    // Give creator 10% of shares (100 shares)
    const holdingStmt = db.prepare(`
      INSERT INTO holdings (user_id, idea_id, shares, avg_cost)
      VALUES (?, ?, 100, 100.0)
    `);
    holdingStmt.run(creatorId, ideaId);

    // Record IPO transaction
    Transaction.create(creatorId, null, ideaId, 100, 100.0, 'IPO');

    return ideaId;
  }

  static findAll() {
    const stmt = db.prepare(`
      SELECT i.*, u.username as creator_name
      FROM ideas i
      JOIN users u ON i.creator_id = u.id
      ORDER BY i.created_at DESC
    `);
    return stmt.all();
  }

  static findByTicker(ticker) {
    const stmt = db.prepare(`
      SELECT i.*, u.username as creator_name
      FROM ideas i
      JOIN users u ON i.creator_id = u.id
      WHERE i.ticker = ?
    `);
    return stmt.get(ticker.toUpperCase());
  }

  static findById(id) {
    const stmt = db.prepare(`
      SELECT i.*, u.username as creator_name
      FROM ideas i
      JOIN users u ON i.creator_id = u.id
      WHERE i.id = ?
    `);
    return stmt.get(id);
  }

  static updatePrice(ideaId, newPrice) {
    const stmt = db.prepare('UPDATE ideas SET current_price = ? WHERE id = ?');
    stmt.run(newPrice, ideaId);
  }

  static getTopPerformers(limit = 10) {
    const stmt = db.prepare(`
      SELECT i.*, u.username as creator_name,
             (SELECT COUNT(*) FROM transactions WHERE idea_id = i.id) as trade_count
      FROM ideas i
      JOIN users u ON i.creator_id = u.id
      ORDER BY i.current_price DESC, trade_count DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }
}

// Holding Model
class Holding {
  static findByUser(userId) {
    const stmt = db.prepare(`
      SELECT h.*, i.ticker, i.title, i.current_price,
             (h.shares * i.current_price) as current_value,
             ((i.current_price - h.avg_cost) / h.avg_cost * 100) as percent_change
      FROM holdings h
      JOIN ideas i ON h.idea_id = i.id
      WHERE h.user_id = ? AND h.shares > 0
      ORDER BY current_value DESC
    `);
    return stmt.all(userId);
  }

  static findByUserAndIdea(userId, ideaId) {
    const stmt = db.prepare(`
      SELECT * FROM holdings
      WHERE user_id = ? AND idea_id = ?
    `);
    return stmt.get(userId, ideaId);
  }

  static upsert(userId, ideaId, shares, avgCost) {
    const existing = this.findByUserAndIdea(userId, ideaId);

    if (existing) {
      const newShares = existing.shares + shares;
      const newAvgCost = ((existing.shares * existing.avg_cost) + (shares * avgCost)) / newShares;

      const stmt = db.prepare(`
        UPDATE holdings
        SET shares = ?, avg_cost = ?
        WHERE user_id = ? AND idea_id = ?
      `);
      stmt.run(newShares, newAvgCost, userId, ideaId);
    } else {
      const stmt = db.prepare(`
        INSERT INTO holdings (user_id, idea_id, shares, avg_cost)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(userId, ideaId, shares, avgCost);
    }
  }

  static reduceShares(userId, ideaId, shares) {
    const holding = this.findByUserAndIdea(userId, ideaId);
    if (!holding || holding.shares < shares) {
      throw new Error('Insufficient shares');
    }

    const newShares = holding.shares - shares;
    const stmt = db.prepare(`
      UPDATE holdings
      SET shares = ?
      WHERE user_id = ? AND idea_id = ?
    `);
    stmt.run(newShares, userId, ideaId);
  }
}

// Transaction Model
class Transaction {
  static create(buyerId, sellerId, ideaId, shares, price, type) {
    const stmt = db.prepare(`
      INSERT INTO transactions (buyer_id, seller_id, idea_id, shares, price, transaction_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(buyerId, sellerId, ideaId, shares, price, type).lastInsertRowid;
  }

  static findByIdea(ideaId, limit = 20) {
    const stmt = db.prepare(`
      SELECT t.*,
             ub.username as buyer_name,
             us.username as seller_name,
             i.ticker
      FROM transactions t
      LEFT JOIN users ub ON t.buyer_id = ub.id
      LEFT JOIN users us ON t.seller_id = us.id
      JOIN ideas i ON t.idea_id = i.id
      WHERE t.idea_id = ?
      ORDER BY t.created_at DESC
      LIMIT ?
    `);
    return stmt.all(ideaId, limit);
  }

  static findByUser(userId, limit = 20) {
    const stmt = db.prepare(`
      SELECT t.*, i.ticker, i.title
      FROM transactions t
      JOIN ideas i ON t.idea_id = i.id
      WHERE t.buyer_id = ? OR t.seller_id = ?
      ORDER BY t.created_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, userId, limit);
  }

  static getRecentTrades(limit = 50) {
    const stmt = db.prepare(`
      SELECT t.*,
             i.ticker, i.title,
             ub.username as buyer_name,
             us.username as seller_name
      FROM transactions t
      JOIN ideas i ON t.idea_id = i.id
      LEFT JOIN users ub ON t.buyer_id = ub.id
      LEFT JOIN users us ON t.seller_id = us.id
      ORDER BY t.created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }
}

module.exports = {
  User,
  Idea,
  Holding,
  Transaction
};
