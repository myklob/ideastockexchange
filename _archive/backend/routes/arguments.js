import express from 'express';
import {
  createArgument,
  updateArgument,
  deleteArgument,
  voteArgument,
  extractFromText,
  decomposeArgument,
  classifyArgument,
  extractAndSave,
  batchExtract,
  getArgumentAnalysis,
  rateAspect,
  getAspectStats,
  getMyAspectRatings,
  getArgumentNetwork,
  linkArguments,
  getArgumentNetworkContext,
  getRankedArguments,
} from '../controllers/argumentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Original routes
router.post('/', protect, createArgument);
router.put('/:id', protect, updateArgument);
router.delete('/:id', protect, deleteArgument);
router.post('/:id/vote', protect, voteArgument);

// Aspect rating routes (for dimensional feedback)
router.post('/:id/rate-aspect', protect, rateAspect);        // Rate a specific aspect
router.get('/:id/aspect-stats', getAspectStats);             // Get aspect rating statistics
router.get('/:id/my-aspect-ratings', protect, getMyAspectRatings); // Get user's ratings

// Argument extraction system routes (based on docs/ARGUMENT_EXTRACTION_SPEC.md)
router.post('/extract', extractFromText);              // Extract arguments from text
router.post('/decompose', decomposeArgument);          // Decompose into formal logic
router.post('/classify', classifyArgument);            // Classify type/tier/valence
router.post('/extract-and-save', protect, extractAndSave); // Complete pipeline
router.post('/batch-extract', batchExtract);           // Batch process multiple texts
router.get('/:id/analysis', getArgumentAnalysis);      // Get full analysis

// Argument network/map routes (for visualization)
router.get('/network/:beliefId', getArgumentNetwork);  // Get network graph data
router.get('/ranked/:beliefId', getRankedArguments);   // Get ranked arguments for belief
router.post('/link', protect, linkArguments);          // Link two arguments together
router.get('/:id/network-context', getArgumentNetworkContext); // Get argument with context

export default router;
