/**
 * Database Configuration
 * Using better-sqlite3 for simplicity and performance
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/ideastockexchange.db');
const DB_DIR = path.dirname(DB_PATH);

let db = null;

/**
 * Get database instance (singleton)
 */
function getDatabase() {
  if (!db) {
    // Ensure data directory exists
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    db.pragma('foreign_keys = ON');  // Enable foreign key constraints
  }
  return db;
}

/**
 * Initialize database schema
 */
function initializeDatabase() {
  const db = getDatabase();

  // Create claims table
  db.exec(`
    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      url TEXT NOT NULL,
      confidence REAL NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
      reasons_for INTEGER NOT NULL DEFAULT 0,
      reasons_against INTEGER NOT NULL DEFAULT 0,
      evidence_score REAL NOT NULL CHECK(evidence_score >= 0 AND evidence_score <= 1),
      category TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create patterns table (one-to-many with claims)
  db.exec(`
    CREATE TABLE IF NOT EXISTS patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_id TEXT NOT NULL,
      pattern TEXT NOT NULL,
      FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
    );
  `);

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'moderator', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create detections table (tracking when/where claims are detected)
  db.exec(`
    CREATE TABLE IF NOT EXISTS detections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_id TEXT NOT NULL,
      url TEXT,
      user_agent TEXT,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
    );
  `);

  // Create feedback table (user feedback on claims)
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_id TEXT NOT NULL,
      user_id INTEGER,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      helpful_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_patterns_claim_id ON patterns(claim_id);
    CREATE INDEX IF NOT EXISTS idx_claims_category ON claims(category);
    CREATE INDEX IF NOT EXISTS idx_detections_claim_id ON detections(claim_id);
    CREATE INDEX IF NOT EXISTS idx_detections_detected_at ON detections(detected_at);
    CREATE INDEX IF NOT EXISTS idx_feedback_claim_id ON feedback(claim_id);
  `);

  // Create triggers for updated_at
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_claims_timestamp
    AFTER UPDATE ON claims
    BEGIN
      UPDATE claims SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_users_timestamp
    AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  console.log('✓ Database initialized successfully');
  return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('✓ Database connection closed');
  }
}

/**
 * Execute a query with error handling
 */
function executeQuery(queryFn) {
  try {
    const db = getDatabase();
    return queryFn(db);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

module.exports = {
  getDatabase,
  initializeDatabase,
  closeDatabase,
  executeQuery
};
