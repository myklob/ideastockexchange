# Idea Stock Exchange - Monetization Features Documentation

This document describes the monetization features implemented in the Idea Stock Exchange platform, including subscription management, virtual currency investing, gamification, and matching services.

## Table of Contents

- [Overview](#overview)
- [Revenue Models](#revenue-models)
- [Setup & Configuration](#setup--configuration)
- [API Documentation](#api-documentation)
- [Database Models](#database-models)
- [Frontend Integration](#frontend-integration)
- [Testing](#testing)

## Overview

The Idea Stock Exchange implements five complementary revenue models:

1. **Subscription Tiers** (Free/Premium/Enterprise)
2. **Virtual Currency Investing** (Idea Stock Market)
3. **Gamification** (Character stats, achievements, leaderboards)
4. **Matching Services** (Dating/networking based on beliefs)
5. **API Access** (For institutions and developers)

All features are built on a solid foundation that aligns profit motives with quality discourse.

## Revenue Models

### 1. Subscription Management

Three tiers with progressive features:

#### Free Plan ($0/month)
- Basic platform access
- 1,000 virtual currency starting bonus
- 100 API requests/hour
- Ad-supported

#### Premium Plan ($9.99/month)
- Ad-free experience
- Advanced matching algorithm
- Premium analytics dashboard
- 10,000 virtual currency monthly bonus
- 1,000 API requests/hour
- Priority support

#### Enterprise Plan ($99.99/month)
- All Premium features
- Custom branding
- 100,000 virtual currency monthly bonus
- 10,000 API requests/hour
- Dedicated support
- White-label options

### 2. Virtual Currency System ("ISE Coins")

Users invest virtual currency in beliefs:

- **Long Position**: Bet that a belief's score will increase
- **Short Position**: Bet that a belief's score will decrease
- **Price Calculation**: Score × 10 virtual coins per share
- **Auto-Close**: Stop-loss and take-profit limits
- **Leaderboards**: Track top investors

**Profit Incentive Alignment**: Users profit by:
- Finding undervalued beliefs with strong arguments
- Adding quality evidence to beliefs they've invested in
- Identifying weak arguments on overvalued beliefs

### 3. Gamification System

Character stats derived from platform contribution quality:

#### Character Attributes
- **Logical Prowess**: Based on argument quality scores
- **Research Skill**: Based on evidence quality and verification
- **Strategic Thinking**: Based on investment success rate
- **Persuasion**: Based on conflict resolution success

#### Achievements
- Bronze/Silver/Gold/Platinum/Diamond tiers
- Categories: Contribution, Investment, Debate, Community, Learning
- Rewards: Virtual currency, character strength, reputation points

#### Leaderboards
- Overall (by character strength)
- Contribution (by argument quality)
- Investment (by total profit)
- Debate (by resolutions)

### 4. Matching Services

Find compatible users based on belief alignment:

- **Compatibility Score**: Calculated from shared beliefs and votes
- **Deal-Breaker Beliefs**: Filter incompatible matches
- **Important Beliefs**: Weighted compatibility matching
- **Privacy Controls**: Opt-in/opt-out of matching
- **Use Cases**: Dating, friendship, networking, debate partners

### 5. API Access Tiers

Rate-limited API access based on subscription:
- Free: 100 requests/hour
- Premium: 1,000 requests/hour
- Enterprise: 10,000 requests/hour

## Setup & Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Stripe Configuration (required for paid subscriptions)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# Feature Flags
ENABLE_PAYMENTS=true
ENABLE_MATCHING=true
ENABLE_GAMIFICATION=true
ENABLE_REAL_MONEY_INVESTING=false  # Future feature
```

### Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get API keys from https://dashboard.stripe.com/apikeys
3. Create subscription products:
   - Premium: $9.99/month recurring
   - Enterprise: $99.99/month recurring
4. Copy Price IDs to .env file
5. Set up webhook endpoint for `/api/webhooks/stripe`

### Database Initialization

Run the initialization script to set up achievements and user stats:

```bash
npm run init-monetization
```

This will:
- Initialize default achievements
- Create UserStats for existing users
- Create free subscriptions for all users
- Update leaderboards

### Installation

```bash
# Install dependencies
cd backend
npm install

# Run initialization
npm run init-monetization

# Start server
npm run dev
```

## API Documentation

### Authentication

All monetization endpoints require JWT authentication:

```
Authorization: Bearer <token>
```

### Subscriptions API

#### Get Current Subscription
```http
GET /api/subscriptions/current
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user": "...",
    "plan": "premium",
    "status": "active",
    "features": {
      "adFree": true,
      "advancedMatching": true,
      "premiumAnalytics": true,
      "apiAccess": true,
      "apiRateLimit": 1000,
      "virtualCurrencyBonus": 10000
    },
    "currentPeriodEnd": "2024-02-01T00:00:00.000Z"
  }
}
```

#### Get Available Plans
```http
GET /api/subscriptions/plans
```

#### Subscribe to Plan
```http
POST /api/subscriptions/subscribe
Content-Type: application/json

{
  "planId": "premium",
  "paymentMethodId": "pm_..." // Stripe payment method ID
}
```

#### Cancel Subscription
```http
POST /api/subscriptions/cancel
Content-Type: application/json

{
  "cancelAtPeriodEnd": true // or false for immediate cancellation
}
```

### Portfolio API (Virtual Currency Investing)

#### Get Portfolio
```http
GET /api/portfolio?status=open&limit=50&sortBy=profitLoss&sortOrder=-1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "investments": [...],
    "stats": {
      "totalInvestments": 10,
      "totalInvested": 50000,
      "currentValue": 65000,
      "totalProfitLoss": 15000,
      "totalReturn": 30.0,
      "openPositions": 5,
      "closedPositions": 5
    },
    "pagination": { ... }
  }
}
```

#### Get Virtual Currency Balance
```http
GET /api/portfolio/balance
```

#### Open Investment Position
```http
POST /api/portfolio/open
Content-Type: application/json

{
  "beliefId": "...",
  "position": "long",  // or "short"
  "shares": 100,
  "stopLoss": 1000,    // optional: auto-close if loss exceeds
  "takeProfit": 5000,  // optional: auto-close if profit reaches
  "notes": "Optional notes about this investment"
}
```

#### Close Investment Position
```http
POST /api/portfolio/close/:investmentId
```

#### Get Investment Leaderboard
```http
GET /api/portfolio/leaderboard?timeframe=month&limit=100
```

Timeframes: `all`, `month`, `week`, `day`

#### Get Trending Investments
```http
GET /api/portfolio/trending?limit=10
```

#### Get Transaction History
```http
GET /api/portfolio/transactions?limit=50&type=idea_investment_buy
```

### Achievements API

#### Get All Achievements
```http
GET /api/achievements?category=investment&tier=gold
```

#### Get User's Achievements
```http
GET /api/achievements/my-achievements
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unlocked": [
      {
        "achievement": {
          "name": "First Steps",
          "description": "Create your first belief",
          "tier": "bronze",
          "icon": "🌱",
          "rewards": {
            "virtualCurrency": 100,
            "characterStrength": 5,
            "reputation": 10
          }
        },
        "isUnlocked": true,
        "unlockedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "locked": [...],
    "totalUnlocked": 5,
    "totalAchievements": 15
  }
}
```

#### Check for New Achievements
```http
POST /api/achievements/check
```

This checks the user's current stats against all achievement criteria and unlocks any newly met achievements.

#### Pin/Unpin Achievement
```http
POST /api/achievements/:achievementId/toggle-pin
```

### Gamification API

#### Get Gamification Dashboard
```http
GET /api/gamification/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "character": {
      "level": 12,
      "experience": 145000,
      "strength": 75,
      "intelligence": 80,
      "wisdom": 70,
      "charisma": 65,
      "logicalProwess": 85,
      "researchSkill": 78,
      "strategicThinking": 72,
      "persuasion": 68
    },
    "progressToNextLevel": 45.2,
    "contributions": { ... },
    "investing": { ... },
    "community": { ... },
    "engagement": { ... },
    "currency": {
      "balance": 15750,
      "lifetime_earned": 50000,
      "lifetime_spent": 34250
    },
    "rankings": {
      "overall_rank": 42,
      "contribution_rank": 15,
      "investment_rank": 30,
      "debate_rank": 25
    },
    "recentAchievements": [...]
  }
}
```

#### Get Character Stats
```http
GET /api/gamification/character
GET /api/gamification/character/:userId
```

#### Get Full User Stats
```http
GET /api/gamification/stats
GET /api/gamification/stats/:userId
```

#### Get Leaderboards
```http
GET /api/gamification/leaderboards?category=overall&limit=100
```

Categories: `overall`, `contribution`, `investment`, `debate`, `level`

#### Record Login (for streak tracking)
```http
POST /api/gamification/login
```

Returns updated login streak and any daily bonuses earned.

### Matching API

#### Get/Update Matching Profile
```http
GET /api/matching/profile
GET /api/matching/profile/:userId

PUT /api/matching/profile
Content-Type: application/json

{
  "enabled": true,
  "bio": "Looking for debate partners on policy topics",
  "age": 28,
  "location": {
    "city": "San Francisco",
    "state": "CA",
    "country": "USA"
  },
  "interests": ["politics", "economics", "philosophy"],
  "lookingFor": "debate_partner",  // or "dating", "friendship", "networking"
  "showInMatching": true,
  "allowMessages": true
}
```

#### Find Matches
```http
GET /api/matching/find?minCompatibility=70&lookingFor=debate_partner&minAge=25&maxAge=40&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "user": {
          "id": "...",
          "username": "JohnDoe",
          "reputation": 250,
          "bio": "...",
          "age": 30,
          "location": { ... },
          "interests": [...]
        },
        "compatibility": {
          "score": 85,
          "agreement": 17,
          "disagreement": 3,
          "total": 20,
          "dealBreakerViolations": 0,
          "hasDealBreakers": false,
          "commonBeliefs": 20
        }
      }
    ],
    "total": 15
  }
}
```

#### Get Compatibility with User
```http
GET /api/matching/compatibility/:userId
```

#### Add Deal-Breaker Belief
```http
POST /api/matching/deal-breaker
Content-Type: application/json

{
  "beliefId": "..."
}
```

#### Add Important Belief
```http
POST /api/matching/important-belief
Content-Type: application/json

{
  "beliefId": "...",
  "importance": 9  // 1-10 scale
}
```

## Database Models

### Subscription
```javascript
{
  user: ObjectId,
  plan: "free" | "premium" | "enterprise",
  status: "active" | "cancelled" | "expired" | "past_due" | "trialing",
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean,
  amount: Number,
  features: {
    adFree: Boolean,
    advancedMatching: Boolean,
    premiumAnalytics: Boolean,
    apiAccess: Boolean,
    apiRateLimit: Number,
    virtualCurrencyBonus: Number,
    prioritySupport: Boolean,
    customBranding: Boolean
  }
}
```

### Transaction
```javascript
{
  user: ObjectId,
  type: "subscription_payment" | "virtual_currency_purchase" |
        "idea_investment_buy" | "idea_investment_sell" |
        "achievement_reward" | "daily_login_bonus" | etc.,
  amount: Number,
  currency: "usd" | "eur" | "virtual",
  balanceAfter: Number,
  status: "pending" | "completed" | "failed" | "refunded",
  description: String,
  relatedBelief: ObjectId,
  relatedSubscription: ObjectId,
  relatedInvestment: ObjectId,
  metadata: Object
}
```

### Portfolio
```javascript
{
  user: ObjectId,
  belief: ObjectId,
  position: "long" | "short",
  shares: Number,
  purchasePrice: Number,
  purchaseScore: Number,
  currentPrice: Number,
  currentScore: Number,
  totalInvested: Number,
  currentValue: Number,
  profitLoss: Number,
  profitLossPercentage: Number,
  status: "open" | "closed" | "liquidated",
  stopLoss: Number,
  takeProfit: Number,
  closedAt: Date,
  closePrice: Number,
  closingProfitLoss: Number
}
```

### UserStats
```javascript
{
  user: ObjectId,
  character: {
    level: Number,
    experience: Number,
    strength: Number,
    intelligence: Number,
    wisdom: Number,
    charisma: Number,
    logicalProwess: Number,
    researchSkill: Number,
    strategicThinking: Number,
    persuasion: Number
  },
  contributions: {
    beliefs_created: Number,
    arguments_created: Number,
    evidence_submitted: Number,
    average_argument_score: Number,
    highest_argument_score: Number
  },
  investing: {
    investments_made: Number,
    total_investment_profit: Number,
    win_rate: Number,
    best_trade_percentage: Number
  },
  community: {
    debates_participated: Number,
    conflicts_resolved: Number,
    resolution_success_rate: Number
  },
  engagement: {
    login_streak: Number,
    best_login_streak: Number,
    total_logins: Number
  },
  currency: {
    balance: Number,
    lifetime_earned: Number,
    lifetime_spent: Number
  },
  rankings: {
    overall_rank: Number,
    contribution_rank: Number,
    investment_rank: Number,
    debate_rank: Number
  }
}
```

### Achievement
```javascript
{
  name: String,
  slug: String,
  description: String,
  category: "contribution" | "investment" | "debate" | "community" | "learning",
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond",
  icon: String,
  rewards: {
    virtualCurrency: Number,
    characterStrength: Number,
    reputation: Number
  },
  criteria: {
    type: "count" | "quality" | "streak" | "milestone" | "combo",
    metric: String,
    threshold: Number,
    conditions: Array
  }
}
```

## Frontend Integration

### React/Vite Example

```javascript
import axios from 'axios';

// Configure API client
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Get user's portfolio
const getPortfolio = async () => {
  const response = await api.get('/portfolio');
  return response.data;
};

// Open investment position
const openPosition = async (beliefId, position, shares) => {
  const response = await api.post('/portfolio/open', {
    beliefId,
    position,
    shares
  });
  return response.data;
};

// Get gamification dashboard
const getDashboard = async () => {
  const response = await api.get('/gamification/dashboard');
  return response.data;
};

// Find matches
const findMatches = async (filters) => {
  const response = await api.get('/matching/find', { params: filters });
  return response.data;
};
```

### Stripe Integration (Frontend)

```javascript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_...');

function SubscriptionForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubscribe = async (planId) => {
    // Create subscription on backend
    const { data } = await api.post('/subscriptions/subscribe', {
      planId
    });

    // Confirm payment with Stripe
    if (data.requiresPayment) {
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)
        }
      });

      if (result.error) {
        console.error(result.error);
      } else {
        console.log('Subscription successful!');
      }
    }
  };

  return (
    <Elements stripe={stripePromise}>
      {/* Your subscription form UI */}
    </Elements>
  );
}
```

## Testing

### Manual Testing Checklist

#### Subscriptions
- [ ] Create free subscription
- [ ] Upgrade to premium
- [ ] Downgrade to free
- [ ] Cancel subscription
- [ ] Reactivate subscription
- [ ] Verify feature access per plan

#### Virtual Currency
- [ ] Receive starting bonus
- [ ] Open long position
- [ ] Open short position
- [ ] Close position with profit
- [ ] Close position with loss
- [ ] Test stop-loss trigger
- [ ] Test take-profit trigger
- [ ] View transaction history
- [ ] Check leaderboard

#### Gamification
- [ ] View character stats
- [ ] Level up through contributions
- [ ] Unlock achievement
- [ ] Daily login bonus
- [ ] Streak tracking
- [ ] View leaderboards

#### Matching
- [ ] Create matching profile
- [ ] Add deal-breaker beliefs
- [ ] Add important beliefs
- [ ] Find matches
- [ ] View compatibility score
- [ ] Test privacy settings

### Automated Testing

```bash
# Run tests (when implemented)
npm test

# Test specific features
npm test -- subscriptions
npm test -- portfolio
npm test -- gamification
```

## Revenue Projections

Based on the freemium model:

### Assumptions
- 10,000 monthly active users
- 5% conversion to Premium ($9.99/month)
- 0.5% conversion to Enterprise ($99.99/month)

### Monthly Revenue
- Premium: 500 users × $9.99 = $4,995
- Enterprise: 50 users × $99.99 = $4,999.50
- **Total: $9,994.50/month**

### Annual Revenue Projection
- **$119,934/year** from subscriptions alone

Additional revenue from:
- API access licensing
- Corporate implementations
- Consulting services
- Anonymous data products

## Support & Documentation

- **API Documentation**: See above
- **Stripe Documentation**: https://stripe.com/docs
- **GitHub Issues**: https://github.com/myklob/ideastockexchange/issues
- **Contact**: See /w/page/160433328/Contact%20Me

## License

MIT License - See LICENSE file for details

---

**Built with ❤️ for better public discourse**

*The Idea Stock Exchange: Where profit and progress align*
