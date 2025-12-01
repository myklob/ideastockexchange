import mongoose from 'mongoose';
import Argument from '../models/Argument.js';
import Belief from '../models/Belief.js';
import argumentExtractionService from '../services/argumentExtractionService.js';
import argumentDecomposerService from '../services/argumentDecomposerService.js';
import argumentClassifierService from '../services/argumentClassifierService.js';

// @desc    Create new argument
// @route   POST /api/arguments
// @access  Private
export const createArgument = async (req, res) => {
  try {
    const { content, type, beliefId, scores, evidence } = req.body;

    // Check if belief exists
    const belief = await Belief.findById(beliefId);
    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    const argument = await Argument.create({
      content,
      type,
      beliefId,
      author: req.user.id,
      scores: scores || {},
      evidence: evidence || [],
    });

    // Calculate overall score
    argument.calculateOverallScore();
    await argument.save();

    // Add to belief's arguments
    if (type === 'supporting') {
      belief.supportingArguments.push(argument._id);
    } else {
      belief.opposingArguments.push(argument._id);
    }

    await belief.updateStatistics();
    await belief.calculateConclusionScore();

    // Add to user's created arguments
    req.user.createdArguments.push(argument._id);
    await req.user.save();

    res.status(201).json({
      success: true,
      data: argument,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update argument
// @route   PUT /api/arguments/:id
// @access  Private
export const updateArgument = async (req, res) => {
  try {
    let argument = await Argument.findById(req.params.id);

    if (!argument) {
      return res.status(404).json({
        success: false,
        error: 'Argument not found',
      });
    }

    // Check ownership
    if (argument.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this argument',
      });
    }

    const { content, scores, status } = req.body;

    if (content) argument.content = content;
    if (scores) {
      argument.scores = { ...argument.scores, ...scores };
      argument.calculateOverallScore();
    }
    if (status && req.user.role === 'admin') argument.status = status;

    await argument.save();

    // Recalculate belief score
    const belief = await Belief.findById(argument.beliefId);
    if (belief) {
      await belief.calculateConclusionScore();
    }

    res.json({
      success: true,
      data: argument,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete argument
// @route   DELETE /api/arguments/:id
// @access  Private
export const deleteArgument = async (req, res) => {
  try {
    const argument = await Argument.findById(req.params.id);

    if (!argument) {
      return res.status(404).json({
        success: false,
        error: 'Argument not found',
      });
    }

    // Check ownership
    if (argument.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this argument',
      });
    }

    // Remove from belief
    const belief = await Belief.findById(argument.beliefId);
    if (belief) {
      if (argument.type === 'supporting') {
        belief.supportingArguments.pull(argument._id);
      } else {
        belief.opposingArguments.pull(argument._id);
      }
      await belief.updateStatistics();
      await belief.calculateConclusionScore();
    }

    await argument.deleteOne();

    res.json({
      success: true,
      message: 'Argument deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Vote on argument
// @route   POST /api/arguments/:id/vote
// @access  Private
export const voteArgument = async (req, res) => {
  try {
    const { vote } = req.body; // 'up' or 'down'

    if (!['up', 'down'].includes(vote)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type',
      });
    }

    const argument = await Argument.findById(req.params.id);

    if (!argument) {
      return res.status(404).json({
        success: false,
        error: 'Argument not found',
      });
    }

    // Check if user already voted
    const existingVote = req.user.votedArguments.find(
      v => v.argumentId.toString() === argument._id.toString()
    );

    if (existingVote) {
      if (existingVote.vote === vote) {
        // Remove vote
        if (vote === 'up') argument.votes.up -= 1;
        else argument.votes.down -= 1;

        req.user.votedArguments = req.user.votedArguments.filter(
          v => v.argumentId.toString() !== argument._id.toString()
        );
      } else {
        // Change vote
        if (vote === 'up') {
          argument.votes.up += 1;
          argument.votes.down -= 1;
        } else {
          argument.votes.down += 1;
          argument.votes.up -= 1;
        }
        existingVote.vote = vote;
      }
    } else {
      // New vote
      if (vote === 'up') argument.votes.up += 1;
      else argument.votes.down += 1;

      req.user.votedArguments.push({
        argumentId: argument._id,
        vote,
      });
    }

    await argument.save();
    await req.user.save();

    res.json({
      success: true,
      data: {
        votes: argument.votes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== ARGUMENT EXTRACTION SYSTEM ENDPOINTS =====
// Based on docs/ARGUMENT_EXTRACTION_SPEC.md

// @desc    Extract arguments from natural language text
// @route   POST /api/arguments/extract
// @access  Public
export const extractFromText = async (req, res) => {
  try {
    const { text, options = {} } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please provide text to extract arguments from',
      });
    }

    // Extract arguments using the service
    const extractedArguments = argumentExtractionService.extractArguments(text, options);

    // Get extraction statistics
    const stats = argumentExtractionService.getExtractionStats(extractedArguments);

    res.json({
      success: true,
      data: {
        arguments: extractedArguments,
        stats,
        sourceText: text
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Decompose argument into formal logic notation
// @route   POST /api/arguments/decompose
// @access  Public
export const decomposeArgument = async (req, res) => {
  try {
    const { argument, options = {} } = req.body;

    if (!argument || !argument.conclusion || !argument.premises) {
      return res.status(400).json({
        success: false,
        error: 'Argument must have conclusion and premises',
      });
    }

    // Decompose using the service
    const decomposed = argumentDecomposerService.decompose(argument, options);

    res.json({
      success: true,
      data: decomposed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Classify argument (type, evidence tier, valence)
// @route   POST /api/arguments/classify
// @access  Public
export const classifyArgument = async (req, res) => {
  try {
    const { argument, belief = null, source = null } = req.body;

    if (!argument) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an argument to classify',
      });
    }

    // Classify using the service
    const classified = argumentClassifierService.classifyArgument(argument, {
      belief,
      source
    });

    // Get suggestions for improvement
    const suggestions = argumentClassifierService.suggestImprovements(classified);

    res.json({
      success: true,
      data: {
        argument: classified,
        suggestions
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Complete pipeline: Extract, decompose, classify, and save
// @route   POST /api/arguments/extract-and-save
// @access  Private
export const extractAndSave = async (req, res) => {
  try {
    const { text, beliefId, source = null, options = {} } = req.body;

    if (!text || !beliefId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide text and beliefId',
      });
    }

    // Check if belief exists
    const belief = await Belief.findById(beliefId);
    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    // Step 1: Extract arguments from text
    const extractedArguments = argumentExtractionService.extractArguments(text, options);

    if (extractedArguments.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No arguments found in the provided text',
      });
    }

    // Step 2: Process each extracted argument
    const savedArguments = [];

    for (const extracted of extractedArguments) {
      try {
        // Decompose into formal logic
        const decomposed = argumentDecomposerService.decompose(extracted, {
          includeTypes: true,
          includeRoles: true,
          validateLogic: true
        });

        // Skip if validation fails
        if (!decomposed.validation.valid) {
          console.log(`Skipping invalid argument: ${decomposed.validation.issues.map(i => i.message).join(', ')}`);
          continue;
        }

        // Classify the argument
        const classified = argumentClassifierService.classifyArgument(decomposed, {
          belief: belief.content,
          source
        });

        // Determine if supporting or opposing based on valence
        const type = classified.valence >= 0 ? 'supporting' : 'opposing';

        // Create and save the argument
        const argument = await Argument.create({
          content: extracted.sourceText,
          type,
          beliefId,
          author: req.user.id,
          conclusion: classified.conclusion,
          premises: classified.premises,
          argumentType: classified.argumentType,
          mainRole: extracted.premises[0]?.role || 'linkage',
          evidenceTier: classified.evidenceTier,
          valence: classified.valence,
          formalNotation: decomposed.formalNotation,
          extractedFrom: text,
          extractionConfidence: extracted.confidence,
          extractionMethod: extracted.extractionMethod || 'pattern-based'
        });

        // Calculate scores
        argument.calculateOverallScore();
        await argument.save();

        // Add to belief
        if (type === 'supporting') {
          belief.supportingArguments.push(argument._id);
        } else {
          belief.opposingArguments.push(argument._id);
        }

        // Add to user's created arguments
        req.user.createdArguments.push(argument._id);

        savedArguments.push(argument);

      } catch (argError) {
        console.error('Error processing argument:', argError);
        // Continue with next argument
      }
    }

    // Update belief statistics
    await belief.updateStatistics();
    await belief.calculateConclusionScore();
    await req.user.save();

    res.status(201).json({
      success: true,
      data: {
        extracted: extractedArguments.length,
        saved: savedArguments.length,
        arguments: savedArguments
      },
      message: `Successfully extracted and saved ${savedArguments.length} of ${extractedArguments.length} arguments`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Batch extract arguments from multiple texts
// @route   POST /api/arguments/batch-extract
// @access  Public
export const batchExtract = async (req, res) => {
  try {
    const { texts, options = {} } = req.body;

    if (!Array.isArray(texts)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of texts',
      });
    }

    // Batch extract using the service
    const results = argumentExtractionService.batchExtract(texts, options);

    // Calculate overall statistics
    const allArguments = results.flatMap(r => r.arguments);
    const stats = argumentExtractionService.getExtractionStats(allArguments);

    res.json({
      success: true,
      data: {
        results,
        overallStats: stats,
        totalTexts: texts.length,
        totalArguments: allArguments.length
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get argument with full decomposition and classification
// @route   GET /api/arguments/:id/analysis
// @access  Public
export const getArgumentAnalysis = async (req, res) => {
  try {
    const argument = await Argument.findById(req.params.id)
      .populate('beliefId')
      .populate('evidence')
      .populate('author', 'name');

    if (!argument) {
      return res.status(404).json({
        success: false,
        error: 'Argument not found',
      });
    }

    // If not already decomposed/classified, do it now
    let analysis = {
      argument,
      decomposition: null,
      classification: null
    };

    if (argument.conclusion && argument.premises) {
      // Decompose
      const decomposed = argumentDecomposerService.decompose({
        conclusion: argument.conclusion,
        premises: argument.premises
      });

      analysis.decomposition = decomposed;

      // Classify
      const classified = argumentClassifierService.classifyArgument({
        content: argument.content,
        conclusion: argument.conclusion,
        premises: argument.premises
      }, {
        belief: argument.beliefId?.content
      });

      analysis.classification = classified.classification;
    }

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Rate a specific aspect of an argument
 * Allows users to provide dimensional feedback
 *
 * @route POST /api/arguments/:id/rate-aspect
 * @access Protected
 */
export const rateAspect = async (req, res) => {
  try {
    const { id } = req.params;
    const { aspect, rating } = req.body;
    const userId = req.user._id;

    // Validate inputs
    const validAspects = ['clarity', 'truth', 'usefulness', 'evidence', 'logic'];
    if (!validAspects.includes(aspect)) {
      return res.status(400).json({
        success: false,
        message: `Invalid aspect. Must be one of: ${validAspects.join(', ')}`,
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Find argument
    const argument = await Argument.findById(id);
    if (!argument) {
      return res.status(404).json({
        success: false,
        message: 'Argument not found',
      });
    }

    // Rate the aspect
    argument.rateAspect(userId, aspect, rating);

    // Save argument
    await argument.save();

    // Update related belief links if they exist
    const BeliefLink = mongoose.model('BeliefLink');
    const link = await BeliefLink.findOne({ argumentId: id });
    if (link) {
      await link.calculateLinkStrength();
      await link.save();
    }

    res.json({
      success: true,
      message: 'Aspect rated successfully',
      data: {
        aspect,
        rating,
        aspectRatings: argument.aspectRatings,
        aspectStats: argument.getAspectStats(),
      },
    });
  } catch (error) {
    console.error('Error rating aspect:', error);
    res.status(500).json({
      success: false,
      message: 'Error rating aspect',
      error: error.message,
    });
  }
};

/**
 * Get aspect rating statistics for an argument
 *
 * @route GET /api/arguments/:id/aspect-stats
 * @access Public
 */
export const getAspectStats = async (req, res) => {
  try {
    const { id } = req.params;

    const argument = await Argument.findById(id);
    if (!argument) {
      return res.status(404).json({
        success: false,
        message: 'Argument not found',
      });
    }

    const stats = argument.getAspectStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting aspect stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving aspect statistics',
      error: error.message,
    });
  }
};

/**
 * Get user's aspect ratings for an argument
 *
 * @route GET /api/arguments/:id/my-aspect-ratings
 * @access Protected
 */
export const getMyAspectRatings = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const argument = await Argument.findById(id);
    if (!argument) {
      return res.status(404).json({
        success: false,
        message: 'Argument not found',
      });
    }

    const aspects = ['clarity', 'truth', 'usefulness', 'evidence', 'logic'];
    const userRatings = {};

    aspects.forEach(aspect => {
      const ratings = argument.aspectRatings?.[aspect] || [];
      const userRating = ratings.find(r => r.userId.toString() === userId.toString());
      userRatings[aspect] = userRating ? userRating.rating : null;
    });

    res.json({
      success: true,
      data: userRatings,
    });
  } catch (error) {
    console.error('Error getting user aspect ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user aspect ratings',
      error: error.message,
    });
  }
};
