const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

console.log('Initializing Idea Stock Exchange database...');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    balance REAL DEFAULT 10000.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    creator_id INTEGER NOT NULL,
    current_price REAL DEFAULT 100.0,
    shares_outstanding INTEGER DEFAULT 1000,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    idea_id INTEGER NOT NULL,
    shares INTEGER NOT NULL,
    avg_cost REAL NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (idea_id) REFERENCES ideas(id),
    UNIQUE(user_id, idea_id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER,
    seller_id INTEGER,
    idea_id INTEGER NOT NULL,
    shares INTEGER NOT NULL,
    price REAL NOT NULL,
    transaction_type TEXT CHECK(transaction_type IN ('BUY', 'SELL', 'IPO')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (idea_id) REFERENCES ideas(id)
  );

  CREATE INDEX IF NOT EXISTS idx_holdings_user ON holdings(user_id);
  CREATE INDEX IF NOT EXISTS idx_holdings_idea ON holdings(idea_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_idea ON transactions(idea_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
`);

console.log('✓ Database tables created successfully');

// Insert demo data
const bcrypt = require('bcryptjs');

// Create demo user
const demoPasswordHash = bcrypt.hashSync('demo123', 10);
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, email, password_hash, balance)
  VALUES (?, ?, ?, ?)
`);

insertUser.run('demo', 'demo@ideastockexchange.com', demoPasswordHash, 10000);
console.log('✓ Demo user created (username: demo, password: demo123)');

// Create demo ideas
const demoUser = db.prepare('SELECT id FROM users WHERE username = ?').get('demo');

if (demoUser) {
  const insertIdea = db.prepare(`
    INSERT OR IGNORE INTO ideas (ticker, title, description, creator_id, current_price, shares_outstanding)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const demoIdeas = [
    ['FLCAR', 'Flying Cars', 'Personal flying vehicles for urban transportation', 150.0, 1000],
    ['AIDOG', 'AI Pet Companion', 'Artificial intelligence that acts like the perfect pet', 120.0, 1000],
    ['TLTME', 'Time Travel Tourism', 'Vacation packages to historical events', 200.0, 1000],
    ['MNREAD', 'Mind Reading App', 'Know what people are really thinking', 95.0, 1000],
    ['CLNFUD', 'Clean Fusion Energy', 'Unlimited clean energy from fusion reactors', 180.0, 1000]
  ];

  demoIdeas.forEach(([ticker, title, description, price, shares]) => {
    insertIdea.run(ticker, title, description, demoUser.id, price, shares);
  });

  console.log('✓ Demo ideas created');

  // Give demo user some initial holdings
  const insertHolding = db.prepare(`
    INSERT OR IGNORE INTO holdings (user_id, idea_id, shares, avg_cost)
    VALUES (?, ?, ?, ?)
  `);

  const flyingCarIdea = db.prepare('SELECT id FROM ideas WHERE ticker = ?').get('FLCAR');
  if (flyingCarIdea) {
    insertHolding.run(demoUser.id, flyingCarIdea.id, 10, 150.0);
    console.log('✓ Demo holdings created');
  }
}

db.close();
console.log('\n✅ Database initialization complete!');
console.log('   Database location:', dbPath);
console.log('   Ready to run: npm start\n');
