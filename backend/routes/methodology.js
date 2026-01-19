import express from 'express';
import {
  createMethodologyClaim,
  getMethodologyClaims,
  getMethodologyClaimById,
  recalculateClaimScore,
  createMethodologyChallenge,
  evaluateMethodologyChallenge,
  getChallengesForClaim,
  getChallengeById,
  getMethodologyBreakdown,
  recalculateEvidenceQuality,
  getUserMethodologyReasonRank,
} from '../controllers/methodologyController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// ===== METHODOLOGY CLAIMS ROUTES =====

// Create methodology claim for evidence
router.post('/evidence/:evidenceId/methodology-claims', protect, createMethodologyClaim);

// Get all methodology claims for evidence
router.get('/evidence/:evidenceId/methodology-claims', optionalAuth, getMethodologyClaims);

// Get single methodology claim
router.get('/methodology-claims/:id', optionalAuth, getMethodologyClaimById);

// Recalculate claim score
router.put('/methodology-claims/:id/calculate-score', recalculateClaimScore);

// ===== METHODOLOGY CHALLENGE ROUTES =====

// Submit challenge to methodology claim
router.post('/methodology-claims/:claimId/challenges', protect, createMethodologyChallenge);

// Get all challenges for a claim
router.get('/methodology-claims/:claimId/challenges', optionalAuth, getChallengesForClaim);

// Evaluate a challenge
router.post('/methodology-challenges/:challengeId/evaluate', protect, evaluateMethodologyChallenge);

// Get single challenge
router.get('/methodology-challenges/:id', optionalAuth, getChallengeById);

// ===== EVIDENCE QUALITY BREAKDOWN ROUTES =====

// Get full methodology breakdown for evidence
router.get('/evidence/:evidenceId/methodology-breakdown', optionalAuth, getMethodologyBreakdown);

// Recalculate evidence quality score
router.put('/evidence/:evidenceId/recalculate-quality', recalculateEvidenceQuality);

// ===== REASONRANK TRACKING ROUTES =====

// Get user's ReasonRank history from methodology activities
router.get('/users/:userId/methodology-reasonrank', optionalAuth, getUserMethodologyReasonRank);

export default router;
