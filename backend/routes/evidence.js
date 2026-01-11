import express from 'express';
import {
  createEvidence,
  getEvidence,
  getEvidenceById,
  verifyEvidence,
  updateEvidence,
  deleteEvidence,
} from '../controllers/evidenceController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getEvidence);
router.get('/:id', optionalAuth, getEvidenceById);
router.post('/', protect, createEvidence);
router.put('/:id', protect, updateEvidence);
router.delete('/:id', protect, deleteEvidence);
router.post('/:id/verify', protect, verifyEvidence);

export default router;
