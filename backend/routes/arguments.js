import express from 'express';
import {
  createArgument,
  updateArgument,
  deleteArgument,
  voteArgument,
} from '../controllers/argumentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createArgument);
router.put('/:id', protect, updateArgument);
router.delete('/:id', protect, deleteArgument);
router.post('/:id/vote', protect, voteArgument);

export default router;
