const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { User, Idea, Transaction } = require('./db/models');
const TradingEngine = require('./lib/trading-engine');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'idea-stock-exchange-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Please log in first!' });
  }
  next();
};

// ============================================================================
// Authentication Routes
// ============================================================================

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required!' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters!' });
    }

    const userId = User.create(username, email, password);
    const user = User.findById(userId);

    req.session.userId = userId;
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username or email already exists!' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required!' });
    }

    const user = User.authenticate(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password!' });
    }

    req.session.userId = user.id;
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  try {
    const user = User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found!' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      balance: user.balance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Idea Routes
// ============================================================================

app.get('/api/ideas', (req, res) => {
  try {
    const ideas = Idea.findAll();
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ideas/:ticker', (req, res) => {
  try {
    const idea = Idea.findByTicker(req.params.ticker);
    if (!idea) {
      return res.status(404).json({ error: 'Idea not found!' });
    }

    // Get recent transactions for this idea
    const transactions = Transaction.findByIdea(idea.id, 10);

    res.json({
      ...idea,
      recentTransactions: transactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ideas', requireAuth, (req, res) => {
  try {
    const { ticker, title, description } = req.body;

    if (!ticker || !title) {
      return res.status(400).json({ error: 'Ticker and title are required!' });
    }

    if (ticker.length > 6) {
      return res.status(400).json({ error: 'Ticker must be 6 characters or less!' });
    }

    const ideaId = Idea.create(ticker, title, description, req.session.userId);
    const idea = Idea.findById(ideaId);

    res.json({
      success: true,
      idea
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Ticker already exists! Choose another.' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ideas/:ticker/transactions', (req, res) => {
  try {
    const idea = Idea.findByTicker(req.params.ticker);
    if (!idea) {
      return res.status(404).json({ error: 'Idea not found!' });
    }

    const transactions = Transaction.findByIdea(idea.id, 50);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Trading Routes
// ============================================================================

app.post('/api/trade/buy', requireAuth, (req, res) => {
  try {
    const { ticker, shares } = req.body;

    if (!ticker || !shares) {
      return res.status(400).json({ error: 'Ticker and shares are required!' });
    }

    const sharesNum = parseInt(shares);
    if (isNaN(sharesNum) || sharesNum <= 0) {
      return res.status(400).json({ error: 'Invalid number of shares!' });
    }

    const result = TradingEngine.buy(req.session.userId, ticker, sharesNum);

    res.json({
      success: true,
      message: `Bought ${shares} shares of ${ticker}!`,
      ...result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/trade/sell', requireAuth, (req, res) => {
  try {
    const { ticker, shares } = req.body;

    if (!ticker || !shares) {
      return res.status(400).json({ error: 'Ticker and shares are required!' });
    }

    const sharesNum = parseInt(shares);
    if (isNaN(sharesNum) || sharesNum <= 0) {
      return res.status(400).json({ error: 'Invalid number of shares!' });
    }

    const result = TradingEngine.sell(req.session.userId, ticker, sharesNum);

    res.json({
      success: true,
      message: `Sold ${shares} shares of ${ticker}!`,
      ...result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// Portfolio Routes
// ============================================================================

app.get('/api/portfolio', requireAuth, (req, res) => {
  try {
    const portfolio = TradingEngine.getPortfolioValue(req.session.userId);
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/portfolio/transactions', requireAuth, (req, res) => {
  try {
    const transactions = Transaction.findByUser(req.session.userId, 50);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Market Data Routes
// ============================================================================

app.get('/api/market/top', (req, res) => {
  try {
    const topIdeas = Idea.getTopPerformers(10);
    res.json(topIdeas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/market/recent', (req, res) => {
  try {
    const recentTrades = Transaction.getRecentTrades(20);
    res.json(recentTrades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leaderboard', (req, res) => {
  try {
    const leaderboard = TradingEngine.getLeaderboard(10);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Server-Sent Events for real-time price updates
// ============================================================================

app.get('/api/stream/prices', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial prices
  const sendPrices = () => {
    const ideas = Idea.findAll();
    const priceData = ideas.map(idea => ({
      ticker: idea.ticker,
      price: idea.current_price
    }));
    res.write(`data: ${JSON.stringify(priceData)}\n\n`);
  };

  sendPrices();

  // Send updates every 5 seconds
  const interval = setInterval(sendPrices, 5000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// ============================================================================
// Serve HTML pages
// ============================================================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/market', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'market.html'));
});

app.get('/portfolio', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portfolio.html'));
});

app.get('/create', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create.html'));
});

app.get('/idea/:ticker', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'idea.html'));
});

app.get('/leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           💡 IDEA STOCK EXCHANGE 💡                        ║
║                                                            ║
║   Server running at: http://localhost:${PORT}               ║
║                                                            ║
║   🚀 Ready to trade ideas!                                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

Demo Account:
  Username: demo
  Password: demo123

Happy trading! 🎉
  `);
});
