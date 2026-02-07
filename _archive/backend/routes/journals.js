import express from 'express';
import * as journalController from '../controllers/journalController.js';
import { protect } from '../middleware/auth.js';

/**
 * Journal Routes
 * All routes for managing journals and journal stances
 */

const router = express.Router();

// Public routes (no authentication required)
router.get('/', journalController.getJournals);
router.get('/search', journalController.searchJournals);
router.get('/top', journalController.getTopJournalsByField);
router.get('/:id', journalController.getJournalById);
router.get('/:id/score-breakdown', journalController.getJournalScoreBreakdown);
router.get('/:id/stances', journalController.getJournalStances);
router.get('/by-belief/:beliefId', journalController.getJournalsByBelief);

// Protected routes (authentication required)
router.post('/', protect, journalController.createJournal);
router.put('/:id', protect, journalController.updateJournal);
router.delete('/:id', protect, journalController.deleteJournal);
router.post('/:id/recalculate', protect, journalController.recalculateJournalScore);
router.post('/:id/verify', protect, journalController.verifyJournal);

// Journal stance routes
router.post('/stances', protect, journalController.createOrUpdateJournalStance);
router.post('/stances/add-study', protect, journalController.addStudyToJournalStance);

export default router;
