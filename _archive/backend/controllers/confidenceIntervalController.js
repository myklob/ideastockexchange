/**
 * Confidence Interval Controller
 *
 * Handles HTTP requests for confidence interval operations
 */

import {
  calculateConfidenceInterval,
  getConfidenceInterval,
  markArgumentRedundant,
  recordExpertReview,
} from '../services/confidenceIntervalService.js';
import ConfidenceInterval from '../models/ConfidenceInterval.js';
import Belief from '../models/Belief.js';

/**
 * Get confidence interval for a belief
 * GET /api/beliefs/:beliefId/confidence-interval
 */
export const getBeliefCI = async (req, res) => {
  try {
    const { beliefId } = req.params;

    const ci = await getConfidenceInterval(beliefId);

    if (!ci) {
      return res.status(404).json({
        success: false,
        error: 'Confidence interval not found',
      });
    }

    res.status(200).json({
      success: true,
      data: ci,
    });
  } catch (error) {
    console.error('Error getting confidence interval:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

/**
 * Calculate/recalculate confidence interval for a belief
 * POST /api/beliefs/:beliefId/confidence-interval/calculate
 */
export const calculateBeliefCI = async (req, res) => {
  try {
    const { beliefId } = req.params;

    // Verify belief exists
    const belief = await Belief.findById(beliefId);
    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    const ci = await calculateConfidenceInterval(beliefId);

    res.status(200).json({
      success: true,
      data: ci,
      message: 'Confidence interval calculated successfully',
    });
  } catch (error) {
    console.error('Error calculating confidence interval:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

/**
 * Get detailed CI breakdown with all four factors
 * GET /api/beliefs/:beliefId/confidence-interval/breakdown
 */
export const getCIBreakdown = async (req, res) => {
  try {
    const { beliefId } = req.params;

    const ci = await getConfidenceInterval(beliefId);

    if (!ci) {
      return res.status(404).json({
        success: false,
        error: 'Confidence interval not found',
      });
    }

    // Build detailed breakdown
    const breakdown = {
      overall: {
        ciScore: ci.ciScore,
        confidenceLevel: ci.confidenceLevel,
        interpretation: ci.getInterpretation(),
        maxCICap: ci.knowability.maxCICap,
      },
      factors: {
        userExamination: {
          score: ci.userExamination.score,
          weight: ci.weights.userExamination,
          weightedContribution: ci.userExamination.score * ci.weights.userExamination,
          metrics: {
            totalReadingTime: ci.userExamination.totalReadingTime,
            uniqueVerifiedReaders: ci.userExamination.uniqueVerifiedReaders,
            argumentsEvaluated: ci.userExamination.uniqueProArgumentsEvaluated + ci.userExamination.uniqueConArgumentsEvaluated,
            expertReviews: ci.userExamination.expertReviews,
            userInteractions: ci.userExamination.userInteractions,
          },
        },
        scoreStability: {
          score: ci.scoreStability.score,
          weight: ci.weights.scoreStability,
          weightedContribution: ci.scoreStability.score * ci.weights.scoreStability,
          metrics: {
            last30DaysStdDev: ci.scoreStability.last30DaysStdDev,
            last30DaysRange: ci.scoreStability.last30DaysRange,
            scoreVolatility: ci.scoreStability.scoreVolatility,
            daysSinceLastMajorChange: ci.scoreStability.daysSinceLastMajorChange,
            scoreHistory: ci.scoreStability.scoreHistory.slice(-10), // Last 10 entries
          },
        },
        knowability: {
          score: ci.knowability.score,
          weight: ci.weights.knowability,
          weightedContribution: ci.knowability.score * ci.weights.knowability,
          metrics: {
            category: ci.knowability.category,
            categoryLabel: ci.knowability.categoryLabel,
            categoryDescription: ci.knowability.categoryDescription,
            maxCICap: ci.knowability.maxCICap,
            evidenceTiers: {
              tier1: ci.knowability.tier1EvidenceCount,
              tier2: ci.knowability.tier2EvidenceCount,
              tier3: ci.knowability.tier3EvidenceCount,
              tier4: ci.knowability.tier4EvidenceCount,
            },
          },
        },
        challengeResistance: {
          score: ci.challengeResistance.score,
          weight: ci.weights.challengeResistance,
          weightedContribution: ci.challengeResistance.score * ci.weights.challengeResistance,
          metrics: {
            totalChallengeAttempts: ci.challengeResistance.totalChallengeAttempts,
            redundancyRatio: ci.challengeResistance.redundancyRatio,
            challengesThatChangedScore: ci.challengeResistance.challengesThatChangedScore,
            daysSinceLastSuccessfulChallenge: ci.challengeResistance.daysSinceLastSuccessfulChallenge,
            unresolvedEvidenceObjections: ci.challengeResistance.unresolvedEvidenceObjections,
          },
        },
      },
      explanations: ci.explanations,
      metadata: {
        lastCalculated: ci.lastCalculated,
        calculationCount: ci.calculationCount,
      },
    };

    res.status(200).json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    console.error('Error getting CI breakdown:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

/**
 * Get beliefs sorted by confidence level
 * GET /api/confidence-intervals/rankings
 */
export const getCIRankings = async (req, res) => {
  try {
    const {
      level, // high, moderate, low
      category, // belief category
      minCI,
      maxCI,
      limit = 50,
      skip = 0,
    } = req.query;

    // Build query
    const query = {};

    if (level) {
      query.confidenceLevel = level;
    }

    if (minCI !== undefined) {
      query.ciScore = { ...query.ciScore, $gte: Number(minCI) };
    }

    if (maxCI !== undefined) {
      query.ciScore = { ...query.ciScore, $lte: Number(maxCI) };
    }

    // Get CIs
    const cis = await ConfidenceInterval.find(query)
      .sort({ ciScore: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .populate({
        path: 'beliefId',
        select: 'statement category conclusionScore statistics',
        match: category ? { category } : {},
      });

    // Filter out null beliefs (if category filter didn't match)
    const filtered = cis.filter(ci => ci.beliefId !== null);

    const total = await ConfidenceInterval.countDocuments(query);

    res.status(200).json({
      success: true,
      count: filtered.length,
      total,
      data: filtered,
    });
  } catch (error) {
    console.error('Error getting CI rankings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

/**
 * Mark an argument as redundant
 * POST /api/arguments/:argumentId/mark-redundant
 */
export const markRedundant = async (req, res) => {
  try {
    const { argumentId } = req.params;
    const { redundancyScore = 0.9 } = req.body;
    const userId = req.user?._id || req.user?.id; // From auth middleware

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    await markArgumentRedundant(argumentId, userId, redundancyScore);

    res.status(200).json({
      success: true,
      message: 'Argument marked as redundant',
    });
  } catch (error) {
    console.error('Error marking argument redundant:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

/**
 * Record expert review
 * POST /api/arguments/:argumentId/expert-review
 */
export const addExpertReview = async (req, res) => {
  try {
    const { argumentId } = req.params;
    const { expertise } = req.body;
    const userId = req.user?._id || req.user?.id; // From auth middleware

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!expertise) {
      return res.status(400).json({
        success: false,
        error: 'Expertise field is required',
      });
    }

    await recordExpertReview(argumentId, userId, expertise);

    res.status(200).json({
      success: true,
      message: 'Expert review recorded',
    });
  } catch (error) {
    console.error('Error recording expert review:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

/**
 * Get CI statistics (aggregate data)
 * GET /api/confidence-intervals/statistics
 */
export const getCIStatistics = async (req, res) => {
  try {
    const stats = await ConfidenceInterval.aggregate([
      {
        $group: {
          _id: null,
          avgCI: { $avg: '$ciScore' },
          minCI: { $min: '$ciScore' },
          maxCI: { $max: '$ciScore' },
          totalBeliefs: { $sum: 1 },
          highConfidence: {
            $sum: {
              $cond: [{ $gte: ['$ciScore', 85] }, 1, 0],
            },
          },
          moderateConfidence: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$ciScore', 50] },
                    { $lt: ['$ciScore', 85] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          lowConfidence: {
            $sum: {
              $cond: [{ $lt: ['$ciScore', 50] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Get knowability category distribution
    const knowabilityDist = await ConfidenceInterval.aggregate([
      {
        $group: {
          _id: '$knowability.category',
          count: { $sum: 1 },
          avgCI: { $avg: '$ciScore' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: stats[0] || {},
        knowabilityDistribution: knowabilityDist,
      },
    });
  } catch (error) {
    console.error('Error getting CI statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

export default {
  getBeliefCI,
  calculateBeliefCI,
  getCIBreakdown,
  getCIRankings,
  markRedundant,
  addExpertReview,
  getCIStatistics,
};
