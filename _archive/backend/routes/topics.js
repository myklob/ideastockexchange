import express from 'express';
import {
  getAllTopics,
  getTopicByIdOrSlug,
  getTopicBeliefs,
  createTopic,
  updateTopic,
  updateTopicStatistics,
  deleteTopic,
} from '../controllers/topicController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllTopics);
router.get('/:idOrSlug', getTopicByIdOrSlug);
router.get('/:idOrSlug/beliefs', getTopicBeliefs);

// Protected routes (require authentication)
router.post('/', protect, createTopic);
router.put('/:id', protect, updateTopic);
router.post('/:id/update-statistics', protect, updateTopicStatistics);
router.delete('/:id', protect, deleteTopic);

export default router;
