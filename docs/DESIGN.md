# Idea Stock Exchange - Design Specification

## Architecture Overview

### Technology Stack
- **Backend**: Node.js with Express
- **Database**: SQLite (simple, file-based for MVP)
- **Frontend**: HTML/CSS/JavaScript (vanilla, no framework overhead)
- **Real-time**: Server-Sent Events for price updates

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  balance REAL DEFAULT 10000.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Ideas Table
```sql
CREATE TABLE ideas (
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
```

### Holdings Table
```sql
CREATE TABLE holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  idea_id INTEGER NOT NULL,
  shares INTEGER NOT NULL,
  avg_cost REAL NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (idea_id) REFERENCES ideas(id),
  UNIQUE(user_id, idea_id)
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
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
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End session

### Ideas
- `GET /api/ideas` - List all tradeable ideas
- `GET /api/ideas/:ticker` - Get specific idea details
- `POST /api/ideas` - Create new idea (IPO)

### Trading
- `POST /api/trade/buy` - Purchase shares of an idea
- `POST /api/trade/sell` - Sell shares of an idea
- `GET /api/portfolio` - View user's holdings

### Market Data
- `GET /api/market/prices` - Current prices for all ideas
- `GET /api/market/top` - Top performing ideas
- `GET /api/leaderboard` - Top investors

## Pricing Algorithm

### Initial Price Discovery
- IPO price: $100 per share
- 1000 shares issued initially
- Creator receives 10% of shares

### Dynamic Pricing
Price adjustment on each trade:
```
new_price = current_price * (1 + (demand_factor * 0.01))
demand_factor = (buy_volume - sell_volume) / shares_outstanding
```

## Frontend Pages

1. **Landing Page** (`/`) - Marketing, login/register
2. **Marketplace** (`/market`) - Browse all ideas
3. **Idea Detail** (`/idea/:ticker`) - View and trade specific idea
4. **Portfolio** (`/portfolio`) - View holdings and performance
5. **Create Idea** (`/create`) - Submit new idea for trading
6. **Leaderboard** (`/leaderboard`) - Top ideas and investors

## Ralph Wiggum Loop Application

After each feature implementation:
1. **Simplicity Check**: Can Ralph explain it? Keep UI minimal.
2. **Functionality Check**: Does it work immediately? No bugs.
3. **Fun Check**: Is it engaging? Add visual feedback.
4. **Feedback Check**: Do users see results right away? Real-time updates.

If any check fails, iterate until it passes.
