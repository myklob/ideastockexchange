/**
 * Belief Generator Routes
 * Routes for automated belief generation from Wikipedia
 */

import express from 'express';
import {
  generateBeliefs,
  generateAndSaveBeliefs,
  batchGenerate,
  searchWikipediaTopics,
  getRandomTopics,
  classifyTopic,
} from '../controllers/beliefGeneratorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/generate', generateBeliefs);
router.post('/batch-generate', batchGenerate);
router.get('/search', searchWikipediaTopics);
router.get('/random', getRandomTopics);
router.post('/classify', classifyTopic);

// Protected routes (require authentication)
router.post('/generate-and-save', protect, generateAndSaveBeliefs);

export default router;
