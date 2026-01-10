import express from 'express';
import {
  getLaws,
  getLaw,
  createLaw,
  updateLaw,
  deleteLaw,
  getBeliefLaws,
  linkLawToBelief,
  unlinkLawFromBelief,
  verifyLaw,
  calculateLawScores,
  getLawAnalysis,
  searchLaws,
} from '../controllers/lawController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Search route must come before :id routes to avoid conflicts
router.get('/search', searchLaws);

// Law CRUD
router.get('/', optionalAuth, getLaws);
router.get('/:id', optionalAuth, getLaw);
router.post('/', protect, createLaw);
router.put('/:id', protect, updateLaw);
router.delete('/:id', protect, authorize('admin'), deleteLaw);

// Law analysis and scoring
router.get('/:id/analysis', optionalAuth, getLawAnalysis);
router.post('/:id/calculate-scores', calculateLawScores);

// Law-Belief relationships
router.post('/:id/link-belief', protect, linkLawToBelief);
router.delete('/:id/unlink-belief/:beliefId', protect, unlinkLawFromBelief);

// Verification (admin/moderator only)
router.post('/:id/verify', protect, authorize('admin', 'moderator'), verifyLaw);

export default router;
