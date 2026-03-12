import express from 'express';
import {
  getUserPortfolio,
  getBalance,
  openPosition,
  closePosition,
  getLeaderboard,
  getBeliefInvestments,
  getTransactionHistory,
  getTrendingInvestments
} from '../controllers/portfolioController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Portfolio
router.get('/', getUserPortfolio);
router.get('/balance', getBalance);
router.post('/open', openPosition);
router.post('/close/:investmentId', closePosition);

// Leaderboard
router.get('/leaderboard', getLeaderboard);

// Trending
router.get('/trending', getTrendingInvestments);

// Belief-specific
router.get('/belief/:beliefId', getBeliefInvestments);

// Transactions
router.get('/transactions', getTransactionHistory);

export default router;
