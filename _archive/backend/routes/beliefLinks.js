import express from 'express';
import {
  getIncomingLinks,
  getOutgoingLinks,
  getLinkGraph,
  getLinkSummary,
  updateLinkStatistics,
  getTopInfluentialBeliefs,
  getMostCentralBeliefs,
  getNetworkStatistics,
} from '../controllers/beliefLinksController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Belief-specific link routes
router.get('/:id/links/incoming', getIncomingLinks);
router.get('/:id/links/outgoing', getOutgoingLinks);
router.get('/:id/links/graph', getLinkGraph);
router.get('/:id/links/summary', getLinkSummary);
router.post('/:id/links/update-statistics', protect, authorize('admin'), updateLinkStatistics);

// Network-wide routes
router.get('/links/top-influential', getTopInfluentialBeliefs);
router.get('/links/most-central', getMostCentralBeliefs);
router.get('/links/network-stats', getNetworkStatistics);

export default router;
