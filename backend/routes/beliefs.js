import express from 'express';
import {
  getBeliefs,
  getBelief,
  createBelief,
  updateBelief,
  deleteBelief,
  getBeliefArguments,
  calculateBeliefScore,
  getScoreBreakdown,
  checkDuplicate,
  getSimilarBeliefs,
  linkSimilarBelief,
  mergeBelief,
  updateBeliefDimensions,
  searchByDimensions,
} from '../controllers/beliefController.js';
import {
  getBeliefContributors,
  createContributor,
} from '../controllers/contributorController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Belief CRUD
router.get('/', optionalAuth, getBeliefs);
router.get('/:id', optionalAuth, getBelief);
router.post('/', protect, createBelief);
router.put('/:id', protect, updateBelief);
router.delete('/:id', protect, deleteBelief);

// Arguments and scores
router.get('/:id/arguments', optionalAuth, getBeliefArguments);
router.get('/:id/score-breakdown', optionalAuth, getScoreBreakdown);
router.post('/:id/calculate-score', protect, authorize('admin', 'moderator'), calculateBeliefScore);

// Semantic clustering and similarity
router.post('/check-duplicate', checkDuplicate);
router.get('/search/dimensions', searchByDimensions);
router.get('/:id/similar', getSimilarBeliefs);
router.post('/:id/link-similar', protect, linkSimilarBelief);
router.post('/:id/merge', protect, authorize('admin', 'moderator'), mergeBelief);
router.post('/:id/update-dimensions', updateBeliefDimensions);

// Contributors (People Evaluation)
router.get('/:beliefId/contributors', optionalAuth, getBeliefContributors);
router.post('/:beliefId/contributors', protect, createContributor);

export default router;
