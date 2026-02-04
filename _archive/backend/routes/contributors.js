import express from 'express';
import {
  getBeliefContributors,
  getContributor,
  createContributor,
  updateContributor,
  deleteContributor,
  searchContributors,
  flagContributor,
  recalculateScores,
  getContributorStats,
} from '../controllers/contributorController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// General contributor routes
router.get('/search', searchContributors);
router.get('/stats', getContributorStats);
router.get('/:id', getContributor);
router.put('/:id', protect, updateContributor);
router.delete('/:id', protect, deleteContributor);
router.post('/:id/flag', protect, flagContributor);
router.post('/:id/recalculate', protect, authorize('admin'), recalculateScores);

export default router;
