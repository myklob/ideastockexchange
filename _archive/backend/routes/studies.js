import express from 'express';
import * as studyController from '../controllers/studyController.js';
import { protect } from '../middleware/auth.js';

/**
 * Study Routes
 * All routes for managing studies and study stances
 * Similar to Google Scholar but with ReasonRank
 */

const router = express.Router();

// Public routes (no authentication required)
router.get('/', studyController.getStudies);
router.get('/search', studyController.searchStudies);
router.get('/most-cited', studyController.getMostCitedStudies);
router.get('/top', studyController.getTopStudies);
router.get('/:id', studyController.getStudyById);
router.get('/:id/score-breakdown', studyController.getStudyScoreBreakdown);
router.get('/:id/stances', studyController.getStudyStances);
router.get('/by-belief/:beliefId', studyController.getStudiesByBelief);

// Protected routes (authentication required)
router.post('/', protect, studyController.createStudy);
router.put('/:id', protect, studyController.updateStudy);
router.delete('/:id', protect, studyController.deleteStudy);
router.post('/:id/recalculate', protect, studyController.recalculateStudyScore);
router.post('/:id/calculate-pagerank', protect, studyController.calculatePageRank);
router.post('/:id/verify', protect, studyController.verifyStudy);

// Study stance routes
router.post('/stances', protect, studyController.createOrUpdateStudyStance);
router.post('/stances/rate', protect, studyController.rateStudyStance);

// Citation and replication routes
router.post('/citations', protect, studyController.addCitation);
router.post('/replications', protect, studyController.addReplication);

export default router;
