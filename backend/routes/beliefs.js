import express from 'express';
import {
  getBeliefs,
  getBelief,
  createBelief,
  updateBelief,
  deleteBelief,
  getBeliefArguments,
  calculateBeliefScore,
} from '../controllers/beliefController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getBeliefs);
router.get('/:id', optionalAuth, getBelief);
router.post('/', protect, createBelief);
router.put('/:id', protect, updateBelief);
router.delete('/:id', protect, deleteBelief);
router.get('/:id/arguments', optionalAuth, getBeliefArguments);
router.post('/:id/calculate-score', protect, authorize('admin', 'moderator'), calculateBeliefScore);

export default router;
