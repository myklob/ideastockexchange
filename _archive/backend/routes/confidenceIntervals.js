import express from 'express';
import {
  getBeliefCI,
  calculateBeliefCI,
  getCIBreakdown,
  getCIRankings,
  markRedundant,
  addExpertReview,
  getCIStatistics,
} from '../controllers/confidenceIntervalController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get CI statistics (aggregate data)
router.get('/statistics', getCIStatistics);

// Get beliefs ranked by CI
router.get('/rankings', getCIRankings);

// Belief-specific CI endpoints
router.get('/beliefs/:beliefId', optionalAuth, getBeliefCI);
router.get('/beliefs/:beliefId/breakdown', optionalAuth, getCIBreakdown);
router.post('/beliefs/:beliefId/calculate', protect, authorize('admin', 'moderator'), calculateBeliefCI);

// Argument-level CI tracking
router.post('/arguments/:argumentId/mark-redundant', protect, markRedundant);
router.post('/arguments/:argumentId/expert-review', protect, addExpertReview);

export default router;
