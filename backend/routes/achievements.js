import express from 'express';
import {
  getAllAchievements,
  getUserAchievements,
  checkAchievements,
  togglePinAchievement,
  initializeAchievements
} from '../controllers/achievementController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public route - get all achievements
router.get('/', getAllAchievements);

// Protected routes
router.get('/my-achievements', protect, getUserAchievements);
router.post('/check', protect, checkAchievements);
router.post('/:achievementId/toggle-pin', protect, togglePinAchievement);

// Admin only
router.post('/initialize', protect, authorize('admin'), initializeAchievements);

export default router;
