import express from 'express';
import MethodologyChallenge from '../models/MethodologyChallenge.js';
import Evidence from '../models/Evidence.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ===== METHODOLOGY CHALLENGE ROUTES =====
// Implements: "Arguments matter more than credentials"

/**
 * POST /api/methodology-challenges
 * Create a new methodology challenge
 * Anyone can challenge any evidence, regardless of credentials
 */
router.post('/', protect, async (req, res) => {
  try {
    const {
      evidenceId,
      challengeType,
      claim,
      challenge,
      supportingEvidence,
      affectedPattern,
    } = req.body;

    // Verify evidence exists
    const evidence = await Evidence.findById(evidenceId);
    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: 'Evidence not found',
      });
    }

    // Create challenge
    const methodologyChallenge = await MethodologyChallenge.create({
      evidenceId,
      challenger: req.user._id,
      challengeType,
      claim,
      challenge,
      supportingEvidence: supportingEvidence || [],
      affectedPattern,
    });

    // Add challenge reference to evidence
    evidence.methodologyChallenges.push(methodologyChallenge._id);
    await evidence.save();

    // Populate challenger info
    await methodologyChallenge.populate('challenger', 'username reasonRank.overall');

    res.status(201).json({
      success: true,
      data: methodologyChallenge,
      message: 'Methodology challenge created. It will be evaluated by the community.',
    });
  } catch (error) {
    console.error('Error creating methodology challenge:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error creating methodology challenge',
    });
  }
});

/**
 * GET /api/methodology-challenges/:id
 * Get a specific methodology challenge
 */
router.get('/:id', async (req, res) => {
  try {
    const challenge = await MethodologyChallenge.findById(req.params.id)
      .populate('challenger', 'username reasonRank.overall')
      .populate('evidenceId', 'title type')
      .populate('supportingEvidence', 'title type')
      .populate('evaluation.evaluations.evaluator', 'username reasonRank.overall')
      .populate('response.responder', 'username reasonRank.overall');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found',
      });
    }

    res.json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    console.error('Error fetching methodology challenge:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error fetching challenge',
    });
  }
});

/**
 * GET /api/methodology-challenges/evidence/:evidenceId
 * Get all challenges for a specific piece of evidence
 */
router.get('/evidence/:evidenceId', async (req, res) => {
  try {
    const challenges = await MethodologyChallenge.find({ evidenceId: req.params.evidenceId })
      .populate('challenger', 'username reasonRank.overall')
      .populate('evaluation.evaluations.evaluator', 'username reasonRank.overall')
      .sort('-createdAt');

    res.json({
      success: true,
      count: challenges.length,
      data: challenges,
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error fetching challenges',
    });
  }
});

/**
 * POST /api/methodology-challenges/:id/evaluate
 * Evaluate a methodology challenge
 * Evaluation weighted by evaluator's ReasonRank, not credentials
 */
router.post('/:id/evaluate', protect, async (req, res) => {
  try {
    const { verdict, reasoning, impactScore } = req.body;

    if (!['valid', 'invalid', 'partially_valid'].includes(verdict)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verdict. Must be: valid, invalid, or partially_valid',
      });
    }

    const challenge = await MethodologyChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found',
      });
    }

    // Get evaluator's current ReasonRank
    const evaluator = await User.findById(req.user._id);
    const evaluatorReasonRank = evaluator.reasonRank?.overall || 0;

    // Add evaluation
    await challenge.addEvaluation(
      req.user._id,
      verdict,
      reasoning,
      impactScore,
      evaluatorReasonRank
    );

    // Update evidence quality score based on new consensus
    const evidence = await Evidence.findById(challenge.evidenceId);
    await evidence.calculateQualityScore();
    await evidence.save();

    // Check if evaluation aligns with consensus (after enough evaluations)
    if (challenge.evaluation.evaluations.length >= 3) {
      const previousConsensus = challenge.evaluation.consensusVerdict;
      await challenge.calculateConsensus();
      const newConsensus = challenge.evaluation.consensusVerdict;

      // If consensus formed and this evaluation aligned, reward evaluator
      if (newConsensus !== 'pending' && newConsensus !== 'contested') {
        const alignedWithConsensus = verdict === newConsensus ||
          (verdict === 'partially_valid' && newConsensus === 'partially_valid');

        await evaluator.updateMethodologyFromEvaluation(
          challenge._id,
          alignedWithConsensus
        );
      }
    }

    await challenge.populate([
      { path: 'evaluation.evaluations.evaluator', select: 'username reasonRank.overall' },
      { path: 'challenger', select: 'username reasonRank.overall' },
    ]);

    res.json({
      success: true,
      data: challenge,
      message: 'Evaluation recorded and weighted by your ReasonRank',
    });
  } catch (error) {
    console.error('Error evaluating challenge:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error evaluating challenge',
    });
  }
});

/**
 * POST /api/methodology-challenges/:id/respond
 * Respond to a methodology challenge
 * Usually done by evidence submitter
 */
router.post('/:id/respond', protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Response must be at least 20 characters',
      });
    }

    const challenge = await MethodologyChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found',
      });
    }

    await challenge.addResponse(req.user._id, text);

    await challenge.populate('response.responder', 'username reasonRank.overall');

    res.json({
      success: true,
      data: challenge,
      message: 'Response submitted. Community can now evaluate if it adequately addresses the challenge.',
    });
  } catch (error) {
    console.error('Error responding to challenge:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error submitting response',
    });
  }
});

/**
 * POST /api/methodology-challenges/:id/evaluate-response
 * Evaluate whether a response adequately addresses the challenge
 */
router.post('/:id/evaluate-response', protect, async (req, res) => {
  try {
    const { isAdequate, reasoning } = req.body;

    const challenge = await MethodologyChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found',
      });
    }

    if (!challenge.response || !challenge.response.text) {
      return res.status(400).json({
        success: false,
        error: 'No response to evaluate',
      });
    }

    await challenge.evaluateResponse(req.user._id, isAdequate, reasoning);

    res.json({
      success: true,
      data: challenge,
      message: 'Response evaluation recorded',
    });
  } catch (error) {
    console.error('Error evaluating response:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error evaluating response',
    });
  }
});

/**
 * GET /api/methodology-challenges/user/:userId
 * Get challenges submitted by a user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const challenges = await MethodologyChallenge.find({ challenger: req.params.userId })
      .populate('evidenceId', 'title type')
      .sort('-createdAt');

    const stats = {
      total: challenges.length,
      accepted: challenges.filter(c => c.status === 'accepted').length,
      refuted: challenges.filter(c => c.status === 'refuted').length,
      pending: challenges.filter(c => c.status === 'pending').length,
      partiallyAccepted: challenges.filter(c => c.status === 'partially_accepted').length,
    };

    res.json({
      success: true,
      stats,
      data: challenges,
    });
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error fetching challenges',
    });
  }
});

/**
 * POST /api/methodology-challenges/:id/vote
 * Vote on challenge helpfulness
 */
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { voteType } = req.body;

    if (!['helpful', 'notHelpful'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type',
      });
    }

    const challenge = await MethodologyChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found',
      });
    }

    if (voteType === 'helpful') {
      challenge.votes.helpful += 1;
    } else {
      challenge.votes.notHelpful += 1;
    }

    await challenge.save();

    res.json({
      success: true,
      data: {
        votes: challenge.votes,
      },
    });
  } catch (error) {
    console.error('Error voting on challenge:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error voting',
    });
  }
});

export default router;
