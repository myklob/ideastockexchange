# 💡 Idea Stock Exchange

A marketplace where ideas are traded like stocks! Invest in concepts, innovations, and creative thinking through a virtual stock exchange mechanism.

## 🎯 Features

- **Trade Ideas**: Buy and sell idea shares with real-time price discovery
- **Dynamic Pricing**: Prices change based on supply and demand
- **Portfolio Management**: Track your investments and performance
- **Leaderboards**: See top investors and trending ideas
- **IPO System**: Launch your own ideas as tradeable stocks
- **Real-time Updates**: Live price feeds using Server-Sent Events

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ideastockexchange
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
npm run init-db
```

4. Start the server:
```bash
npm start
```

5. Open your browser to:
```
http://localhost:3000
```

### Demo Account

- Username: `demo`
- Password: `demo123`

## 📖 How to Play

1. **Sign Up**: Create a free account and receive $10,000 in virtual currency
2. **Browse Ideas**: Explore the marketplace to find interesting ideas
3. **Trade**: Buy shares in ideas you believe in, sell when you think they've peaked
4. **Create**: Launch your own ideas with a unique ticker symbol
5. **Compete**: Climb the leaderboard and become the top investor!

## 🏗️ Architecture

### Technology Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Frontend**: Vanilla JavaScript (no framework)
- **Real-time**: Server-Sent Events for price updates

### Project Structure

```
ideastockexchange/
├── server.js                 # Main Express server
├── package.json              # Dependencies
├── db/
│   ├── database.js           # Database connection
│   └── models.js             # Data models (User, Idea, Holding, Transaction)
├── lib/
│   └── trading-engine.js     # Trading logic and price discovery
├── public/
│   ├── index.html            # Landing page
│   ├── market.html           # Idea marketplace
│   ├── idea.html             # Idea detail & trading page
│   ├── portfolio.html        # User portfolio
│   ├── create.html           # Create new idea
│   ├── leaderboard.html      # Top investors & ideas
│   ├── common.js             # Shared JavaScript utilities
│   └── style.css             # Styles
├── scripts/
│   └── init-db.js            # Database initialization script
└── test/
    └── test.js               # Basic tests
```

## 🎮 Pricing Algorithm

The price discovery mechanism adjusts prices based on trading activity:

```javascript
// Price movement based on trade size
impactFactor = shares_traded / shares_outstanding
baseMovement = impactFactor * 0.5  // 50% movement for 100% of shares
totalMovement = baseMovement + volatility

// Buy orders increase price, sell orders decrease price
newPrice = currentPrice * (1 ± totalMovement)
```

**Key Features:**
- Larger trades have bigger impact on price
- Market volatility adds randomness
- Minimum price floor of $1.00
- Real-time price updates

## 🧪 Testing

Run the test suite:

```bash
npm test
```

## 📝 API Documentation

### Authentication

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Ideas

- `GET /api/ideas` - List all ideas
- `GET /api/ideas/:ticker` - Get idea details
- `POST /api/ideas` - Create new idea (IPO)

### Trading

- `POST /api/trade/buy` - Buy shares
- `POST /api/trade/sell` - Sell shares

### Portfolio

- `GET /api/portfolio` - Get portfolio summary
- `GET /api/portfolio/transactions` - Get transaction history

### Market Data

- `GET /api/market/top` - Top performing ideas
- `GET /api/market/recent` - Recent trades
- `GET /api/leaderboard` - Top investors
- `GET /api/stream/prices` - SSE price stream

## 🎯 Ralph Wiggum Loop Validation

This project follows the "Ralph Wiggum Loop" methodology for validation:

✅ **Simplicity**: Can a 5-year-old understand it?
✅ **Functionality**: Does it work immediately?
✅ **Fun**: Is it engaging and enjoyable?
✅ **Feedback**: Do users see results right away?

See [RALPH_WIGGUM_VALIDATION.md](RALPH_WIGGUM_VALIDATION.md) for details.

## 📋 Project Goals

See [GOALS.md](GOALS.md) for the full list of project objectives.

## 🎨 Design Specifications

See [DESIGN.md](DESIGN.md) for detailed technical specifications.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🎉 Have Fun!

Remember, this is a game! The goal is to have fun, be creative, and enjoy the experience of trading ideas. The virtual currency has no real value, so take risks and experiment!

---

*"I'm learnding!" - Ralph Wiggum*
