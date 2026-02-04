import express from 'express';
import { detectFallacies, getFallacyInfo, analyzeArguments } from '../utils/fallacyDetector.js';
import { findRedundantArguments, calculateUniqueness, suggestMerges } from '../utils/redundancyDetector.js';
import { Argument, Belief } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/analysis/fallacies
 * @desc    Detect logical fallacies in text
 * @access  Public
 */
router.post('/fallacies', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const analysis = detectFallacies(text);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error detecting fallacies:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing text for fallacies'
    });
  }
});

/**
 * @route   POST /api/analysis/fallacies/batch
 * @desc    Analyze multiple arguments for fallacies
 * @access  Public
 */
router.post('/fallacies/batch', async (req, res) => {
  try {
    const { arguments: argumentsList } = req.body;

    if (!argumentsList || !Array.isArray(argumentsList)) {
      return res.status(400).json({
        success: false,
        message: 'Arguments array is required'
      });
    }

    const analysis = analyzeArguments(argumentsList);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error in batch fallacy detection:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing arguments'
    });
  }
});

/**
 * @route   GET /api/analysis/fallacies/:type
 * @desc    Get information about a specific fallacy type
 * @access  Public
 */
router.get('/fallacies/:type', (req, res) => {
  try {
    const { type } = req.params;

    const info = getFallacyInfo(type.toUpperCase());

    if (!info) {
      return res.status(404).json({
        success: false,
        message: 'Fallacy type not found'
      });
    }

    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Error getting fallacy info:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving fallacy information'
    });
  }
});

/**
 * @route   POST /api/analysis/redundancy
 * @desc    Find redundant arguments in a belief
 * @access  Public
 */
router.post('/redundancy', async (req, res) => {
  try {
    const { beliefId, threshold = 0.85 } = req.body;

    if (!beliefId) {
      return res.status(400).json({
        success: false,
        message: 'beliefId is required'
      });
    }

    // Fetch all arguments for the belief
    const arguments = await Argument.find({ beliefId })
      .populate('author', 'username')
      .lean();

    if (arguments.length < 2) {
      return res.json({
        success: true,
        data: {
          redundantGroups: [],
          message: 'Not enough arguments to detect redundancy'
        }
      });
    }

    // Find redundant arguments
    const redundantGroups = findRedundantArguments(arguments, threshold);
    const mergeSuggestions = suggestMerges(redundantGroups);

    res.json({
      success: true,
      data: {
        redundantGroups,
        mergeSuggestions,
        totalArguments: arguments.length,
        redundantCount: redundantGroups.reduce((sum, g) => sum + g.count, 0),
        uniqueCount: arguments.length - redundantGroups.reduce((sum, g) => sum + (g.count - 1), 0)
      }
    });
  } catch (error) {
    console.error('Error detecting redundancy:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing redundancy'
    });
  }
});

/**
 * @route   POST /api/analysis/uniqueness
 * @desc    Calculate uniqueness score for an argument
 * @access  Public
 */
router.post('/uniqueness', async (req, res) => {
  try {
    const { argumentId } = req.body;

    if (!argumentId) {
      return res.status(400).json({
        success: false,
        message: 'argumentId is required'
      });
    }

    const argument = await Argument.findById(argumentId).lean();

    if (!argument) {
      return res.status(404).json({
        success: false,
        message: 'Argument not found'
      });
    }

    // Get all arguments for the same belief
    const allArguments = await Argument.find({ beliefId: argument.beliefId }).lean();

    const uniqueness = calculateUniqueness(argument, allArguments);

    // Update argument's uniqueness score
    await Argument.findByIdAndUpdate(argumentId, {
      'scores.uniqueness': uniqueness
    });

    res.json({
      success: true,
      data: {
        uniqueness,
        argumentId,
        totalArguments: allArguments.length
      }
    });
  } catch (error) {
    console.error('Error calculating uniqueness:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating uniqueness score'
    });
  }
});

/**
 * @route   POST /api/analysis/belief/:id/full-analysis
 * @desc    Perform comprehensive analysis on a belief (fallacies + redundancy)
 * @access  Public
 */
router.post('/belief/:id/full-analysis', async (req, res) => {
  try {
    const { id } = req.params;

    const belief = await Belief.findById(id)
      .populate('supportingArguments')
      .populate('opposingArguments')
      .lean();

    if (!belief) {
      return res.status(404).json({
        success: false,
        message: 'Belief not found'
      });
    }

    const allArguments = [
      ...belief.supportingArguments,
      ...belief.opposingArguments
    ];

    // Fallacy analysis
    const fallacyAnalysis = analyzeArguments(allArguments);
    const argumentsWithFallacies = fallacyAnalysis.filter(a => a.analysis.hasFallacies);

    // Redundancy analysis
    const redundantGroups = findRedundantArguments(allArguments);
    const mergeSuggestions = suggestMerges(redundantGroups);

    // Calculate overall scores
    const avgLogicalCoherence = fallacyAnalysis.reduce(
      (sum, a) => sum + a.analysis.logicalCoherenceScore,
      0
    ) / fallacyAnalysis.length;

    const avgUniqueness = allArguments.reduce(
      (sum, arg) => sum + (arg.scores?.uniqueness || 0),
      0
    ) / allArguments.length;

    res.json({
      success: true,
      data: {
        beliefId: id,
        beliefStatement: belief.statement,
        totalArguments: allArguments.length,
        fallacyAnalysis: {
          argumentsAnalyzed: fallacyAnalysis.length,
          argumentsWithFallacies: argumentsWithFallacies.length,
          avgLogicalCoherence,
          details: fallacyAnalysis
        },
        redundancyAnalysis: {
          redundantGroups: redundantGroups.length,
          mergeSuggestions: mergeSuggestions.length,
          avgUniqueness,
          details: redundantGroups
        },
        recommendations: generateRecommendations(
          fallacyAnalysis,
          redundantGroups,
          allArguments.length
        )
      }
    });
  } catch (error) {
    console.error('Error in full analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing full analysis'
    });
  }
});

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(fallacyAnalysis, redundantGroups, totalArgs) {
  const recommendations = [];

  // Fallacy recommendations
  const highSeverityFallacies = fallacyAnalysis
    .filter(a => a.analysis.fallacies.some(f => f.severity === 'high' && f.confidence >= 70))
    .length;

  if (highSeverityFallacies > 0) {
    recommendations.push({
      type: 'quality',
      priority: 'high',
      message: `${highSeverityFallacies} arguments contain high-confidence logical fallacies`,
      action: 'Review and revise arguments to improve logical coherence'
    });
  }

  // Redundancy recommendations
  if (redundantGroups.length > 0) {
    const redundantCount = redundantGroups.reduce((sum, g) => sum + (g.count - 1), 0);
    const percentRedundant = Math.round((redundantCount / totalArgs) * 100);

    if (percentRedundant > 20) {
      recommendations.push({
        type: 'redundancy',
        priority: 'medium',
        message: `${percentRedundant}% of arguments are redundant`,
        action: 'Consider merging similar arguments to improve clarity'
      });
    }
  }

  // Quality recommendations
  const avgCoherence = fallacyAnalysis.reduce(
    (sum, a) => sum + a.analysis.logicalCoherenceScore,
    0
  ) / fallacyAnalysis.length;

  if (avgCoherence < 0.7) {
    recommendations.push({
      type: 'quality',
      priority: 'high',
      message: 'Average logical coherence is below recommended threshold',
      action: 'Focus on adding well-reasoned, evidence-based arguments'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      priority: 'low',
      message: 'This belief has high-quality, diverse arguments',
      action: 'Continue maintaining high standards for new arguments'
    });
  }

  return recommendations;
}

export default router;
