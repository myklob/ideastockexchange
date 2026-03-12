import express from 'express';
import {
  getCharacterStats,
  getUserStats,
  getLeaderboards,
  updateLeaderboards,
  recordLogin,
  getUserRankings,
  getDashboard
} from '../controllers/gamificationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protected routes
router.use(protect);

// Dashboard
router.get('/dashboard', getDashboard);

// Character stats
router.get('/character', getCharacterStats);
router.get('/character/:userId', getCharacterStats);

// User stats
router.get('/stats', getUserStats);
router.get('/stats/:userId', getUserStats);

// Rankings
router.get('/rankings', getUserRankings);

// Leaderboards (public)
router.get('/leaderboards', getLeaderboards);

// Login tracking
router.post('/login', recordLogin);

// Admin routes
router.post('/leaderboards/update', authorize('admin'), updateLeaderboards);

export default router;
