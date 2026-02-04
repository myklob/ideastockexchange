import express from 'express';
import {
  updateMatchingProfile,
  getMatchingProfile,
  findMatches,
  getCompatibilityWith,
  addDealBreaker,
  addImportantBelief
} from '../controllers/matchingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile management
router.get('/profile', getMatchingProfile);
router.get('/profile/:userId', getMatchingProfile);
router.put('/profile', updateMatchingProfile);

// Matching
router.get('/find', findMatches);
router.get('/compatibility/:userId', getCompatibilityWith);

// Preferences
router.post('/deal-breaker', addDealBreaker);
router.post('/important-belief', addImportantBelief);

export default router;
