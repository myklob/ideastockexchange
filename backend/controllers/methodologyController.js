import Evidence from '../models/Evidence.js';
import MethodologyClaim from '../models/MethodologyClaim.js';
import MethodologyChallenge from '../models/MethodologyChallenge.js';

// ===== METHODOLOGY CLAIMS =====

// @desc    Add methodology claim to evidence
// @route   POST /api/evidence/:evidenceId/methodology-claims
// @access  Private (anyone can submit)
export const createMethodologyClaim = async (req, res) => {
  try {
    const { claim, claimType, details, sourceReference } = req.body;

    const evidence = await Evidence.findById(req.params.evidenceId);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: 'Evidence not found',
      });
    }

    // Use the Evidence model's method to add the claim
    const methodologyClaim = await evidence.addMethodologyClaim(
      {
        claim,
        claimType,
        details,
        sourceReference,
      },
      req.user.id
    );

    res.status(201).json({
      success: true,
      data: methodologyClaim,
      message: 'Methodology claim submitted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get all methodology claims for evidence
// @route   GET /api/evidence/:evidenceId/methodology-claims
// @access  Public
export const getMethodologyClaims = async (req, res) => {
  try {
    const claims = await MethodologyClaim.find({ evidenceId: req.params.evidenceId })
      .populate('submittedBy', 'username reasonRank')
      .populate({
        path: 'challenges',
        populate: {
          path: 'challenger',
          select: 'username reasonRank',
        },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: claims,
      count: claims.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single methodology claim with full details
// @route   GET /api/methodology-claims/:id
// @access  Public
export const getMethodologyClaimById = async (req, res) => {
  try {
    const claim = await MethodologyClaim.findById(req.params.id)
      .populate('evidenceId', 'title type')
      .populate('submittedBy', 'username reasonRank')
      .populate({
        path: 'challenges',
        populate: [
          {
            path: 'challenger',
            select: 'username reasonRank',
          },
          {
            path: 'evaluations.evaluator',
            select: 'username reasonRank',
          },
        ],
      });

    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Methodology claim not found',
      });
    }

    res.json({
      success: true,
      data: claim,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update methodology claim credibility score
// @route   PUT /api/methodology-claims/:id/calculate-score
// @access  Public (calculation is automatic)
export const recalculateClaimScore = async (req, res) => {
  try {
    const claim = await MethodologyClaim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Methodology claim not found',
      });
    }

    await claim.calculateCredibilityScore();
    await claim.save();

    res.json({
      success: true,
      data: {
        credibilityScore: claim.credibilityScore,
        status: claim.status,
        networkEvaluation: claim.networkEvaluation,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== METHODOLOGY CHALLENGES =====

// @desc    Submit challenge to methodology claim
// @route   POST /api/methodology-claims/:claimId/challenges
// @access  Private (anyone can challenge - credentials don't matter)
export const createMethodologyChallenge = async (req, res) => {
  try {
    const { challenge, challengeType, supportingEvidence } = req.body;

    const claim = await MethodologyClaim.findById(req.params.claimId);

    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Methodology claim not found',
      });
    }

    // Create the challenge
    const methodologyChallenge = new MethodologyChallenge({
      methodologyClaimId: claim._id,
      evidenceId: claim.evidenceId,
      challenger: req.user.id,
      challenge,
      challengeType,
      supportingEvidence,
    });

    await methodologyChallenge.save();

    // Add challenge to claim
    claim.challenges.push(methodologyChallenge._id);
    await claim.save();

    // Recalculate claim credibility
    await claim.calculateCredibilityScore();
    await claim.save();

    // Recalculate evidence quality score
    const evidence = await Evidence.findById(claim.evidenceId);
    if (evidence) {
      await evidence.calculateQualityScore();
      await evidence.calculateEvidenceImpact();
      await evidence.save();
    }

    await methodologyChallenge.populate([
      { path: 'challenger', select: 'username reasonRank' },
      { path: 'methodologyClaimId', select: 'claim claimType' },
    ]);

    res.status(201).json({
      success: true,
      data: methodologyChallenge,
      message: 'Challenge submitted successfully. It will be evaluated by the network.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Evaluate a methodology challenge
// @route   POST /api/methodology-challenges/:challengeId/evaluate
// @access  Private (anyone can evaluate - credentials don't matter)
export const evaluateMethodologyChallenge = async (req, res) => {
  try {
    const { isValid, reasoning, confidence = 50 } = req.body;

    if (typeof isValid !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isValid must be a boolean (true or false)',
      });
    }

    if (confidence < 0 || confidence > 100) {
      return res.status(400).json({
        success: false,
        error: 'Confidence must be between 0 and 100',
      });
    }

    const challenge = await MethodologyChallenge.findById(req.params.challengeId);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found',
      });
    }

    // Can't evaluate your own challenge
    if (challenge.challenger.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot evaluate your own challenge',
      });
    }

    // Add evaluation
    await challenge.addEvaluation(req.user.id, isValid, reasoning, confidence);

    // Update claim credibility
    const claim = await MethodologyClaim.findById(challenge.methodologyClaimId);
    if (claim) {
      await claim.calculateCredibilityScore();
      await claim.save();

      // Update evidence quality score
      const evidence = await Evidence.findById(claim.evidenceId);
      if (evidence) {
        await evidence.calculateQualityScore();
        await evidence.calculateEvidenceImpact();
        await evidence.save();
      }
    }

    await challenge.populate([
      { path: 'challenger', select: 'username reasonRank' },
      { path: 'evaluations.evaluator', select: 'username reasonRank' },
    ]);

    res.json({
      success: true,
      data: {
        challenge,
        networkConsensus: challenge.networkConsensus,
        reasonRankImpact: challenge.reasonRankImpact,
      },
      message: challenge.evaluations.length >= 3
        ? 'Evaluation recorded. Network consensus established and ReasonRank rewards applied.'
        : 'Evaluation recorded. More evaluations needed for network consensus.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get all challenges for a methodology claim
// @route   GET /api/methodology-claims/:claimId/challenges
// @access  Public
export const getChallengesForClaim = async (req, res) => {
  try {
    const challenges = await MethodologyChallenge.find({ methodologyClaimId: req.params.claimId })
      .populate('challenger', 'username reasonRank')
      .populate('evaluations.evaluator', 'username reasonRank')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: challenges,
      count: challenges.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single challenge with full details
// @route   GET /api/methodology-challenges/:id
// @access  Public
export const getChallengeById = async (req, res) => {
  try {
    const challenge = await MethodologyChallenge.findById(req.params.id)
      .populate('methodologyClaimId')
      .populate('evidenceId', 'title type')
      .populate('challenger', 'username reasonRank')
      .populate('evaluations.evaluator', 'username reasonRank')
      .populate({
        path: 'subArguments',
        populate: {
          path: 'author',
          select: 'username reasonRank',
        },
      });

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
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== EVIDENCE QUALITY BREAKDOWN =====

// @desc    Get full methodology breakdown for evidence
// @route   GET /api/evidence/:evidenceId/methodology-breakdown
// @access  Public
export const getMethodologyBreakdown = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.evidenceId);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: 'Evidence not found',
      });
    }

    const breakdown = await evidence.getMethodologyBreakdown();

    res.json({
      success: true,
      data: breakdown,
      explanation: {
        qualityScore: 'How well the methodology survives scrutiny (0-100)',
        linkageScore: 'How directly this proves the claim (0-100)',
        evidenceImpact: 'Quality × Linkage = Final weight (0-100)',
        patternScores: {
          transparentMeasurement: 'Pattern 1: Transparent measurement with controls',
          replicationAcrossContexts: 'Pattern 2: Replication across contexts',
          falsifiablePredictions: 'Pattern 3: Falsifiable predictions',
          explicitAssumptions: 'Pattern 4: Explicit assumptions',
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Recalculate evidence quality score
// @route   PUT /api/evidence/:evidenceId/recalculate-quality
// @access  Public (calculation is automatic)
export const recalculateEvidenceQuality = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.evidenceId);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: 'Evidence not found',
      });
    }

    await evidence.calculateQualityScore();
    await evidence.calculateEvidenceImpact();
    await evidence.save();

    res.json({
      success: true,
      data: {
        qualityScore: evidence.qualityScore,
        linkageScore: evidence.linkageScore,
        evidenceImpact: evidence.evidenceImpact,
        methodologyPatternScores: evidence.methodologyPatternScores,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== REASONRANK TRACKING =====

// @desc    Get ReasonRank history for user's methodology activities
// @route   GET /api/users/:userId/methodology-reasonrank
// @access  Public
export const getUserMethodologyReasonRank = async (req, res) => {
  try {
    // Find all challenges submitted by user
    const challengesSubmitted = await MethodologyChallenge.find({ challenger: req.params.userId })
      .select('challenge challengeType networkConsensus reasonRankImpact createdAt')
      .populate('methodologyClaimId', 'claim')
      .sort({ createdAt: -1 });

    // Find all evaluations by user
    const challengesEvaluated = await MethodologyChallenge.find({
      'evaluations.evaluator': req.params.userId,
    })
      .select('challenge challengeType networkConsensus reasonRankImpact evaluations')
      .populate('methodologyClaimId', 'claim')
      .sort({ createdAt: -1 });

    // Calculate total RR earned from methodology activities
    let totalChallengerRR = 0;
    let totalEvaluatorRR = 0;

    challengesSubmitted.forEach(challenge => {
      totalChallengerRR += challenge.reasonRankImpact?.challengerReward || 0;
    });

    challengesEvaluated.forEach(challenge => {
      const userEvaluation = challenge.reasonRankImpact?.evaluatorRewards?.find(
        r => r.evaluator.toString() === req.params.userId
      );
      if (userEvaluation) {
        totalEvaluatorRR += userEvaluation.reward || 0;
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalMethodologyReasonRank: totalChallengerRR + totalEvaluatorRR,
          challengerReasonRank: totalChallengerRR,
          evaluatorReasonRank: totalEvaluatorRR,
          challengesSubmitted: challengesSubmitted.length,
          challengesEvaluated: challengesEvaluated.length,
        },
        challengesSubmitted,
        challengesEvaluated: challengesEvaluated.map(challenge => {
          const userEvaluation = challenge.evaluations.find(
            e => e.evaluator.toString() === req.params.userId
          );
          const rrReward = challenge.reasonRankImpact?.evaluatorRewards?.find(
            r => r.evaluator.toString() === req.params.userId
          );
          return {
            ...challenge.toObject(),
            userEvaluation,
            userReasonRankReward: rrReward?.reward || 0,
          };
        }),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
