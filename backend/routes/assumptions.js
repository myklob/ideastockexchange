import express from 'express';
import {
  createAssumption,
  getAssumptionsForBelief,
  getCriticalAssumptions,
  getAssumption,
  updateAssumption,
  deleteAssumption,
  addDependentArgument,
  removeDependentArgument,
  updateIntegralityScore,
  linkToBelief,
  markAsMustAccept,
  markAsMustReject,
  voteOnAssumption,
  recalculateScore,
  getAssumptionsByStatus
} from '../controllers/assumptionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/belief/:beliefId', getAssumptionsForBelief);
router.get('/belief/:beliefId/critical', getCriticalAssumptions);
router.get('/status/:status', getAssumptionsByStatus);
router.get('/:id', getAssumption);

// Protected routes (require authentication)
router.post('/', protect, createAssumption);
router.put('/:id', protect, updateAssumption);
router.delete('/:id', protect, deleteAssumption);

// Argument management
router.post('/:id/arguments', protect, addDependentArgument);
router.delete('/:id/arguments/:argumentId', protect, removeDependentArgument);
router.put('/:id/arguments/:argumentId', protect, updateIntegralityScore);

// Belief linking
router.post('/:id/link-belief', protect, linkToBelief);

// Critical assumption marking
router.post('/:id/mark-accept', protect, markAsMustAccept);
router.post('/:id/mark-reject', protect, markAsMustReject);

// Voting
router.post('/:id/vote', protect, voteOnAssumption);

// Admin/calculation routes
router.post('/:id/recalculate', protect, recalculateScore);

export default router;
