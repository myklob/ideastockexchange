import Belief from '../models/Belief.js';
import Argument from '../models/Argument.js';
import {
  findSimilarBeliefs,
  detectDuplicate,
  clusterBeliefs,
} from '../utils/semanticClustering.js';

// @desc    Get all beliefs
// @route   GET /api/beliefs
// @access  Public
export const getBeliefs = async (req, res) => {
  try {
    const { category, trending, search, limit = 20, page = 1 } = req.query;

    const query = { status: 'active' };

    if (category) query.category = category;
    if (trending) query.trending = trending === 'true';
    if (search) {
      query.$text = { $search: search };
    }

    const beliefs = await Belief.find(query)
      .populate('author', 'username reputation')
      .sort({ 'statistics.views': -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Belief.countDocuments(query);

    res.json({
      success: true,
      data: beliefs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single belief
// @route   GET /api/beliefs/:id
// @access  Public
export const getBelief = async (req, res) => {
  try {
    const belief = await Belief.findById(req.params.id)
      .populate('author', 'username reputation')
      .populate({
        path: 'supportingArguments',
        populate: { path: 'author', select: 'username reputation' },
      })
      .populate({
        path: 'opposingArguments',
        populate: { path: 'author', select: 'username reputation' },
      });

    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    // Increment view count
    await belief.incrementViews();

    res.json({
      success: true,
      data: belief,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create new belief
// @route   POST /api/beliefs
// @access  Private
export const createBelief = async (req, res) => {
  try {
    const { statement, description, category, tags } = req.body;

    const belief = await Belief.create({
      statement,
      description,
      category,
      tags,
      author: req.user.id,
    });

    // Add to user's created beliefs
    req.user.createdBeliefs.push(belief._id);
    await req.user.save();

    res.status(201).json({
      success: true,
      data: belief,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update belief
// @route   PUT /api/beliefs/:id
// @access  Private
export const updateBelief = async (req, res) => {
  try {
    let belief = await Belief.findById(req.params.id);

    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    // Check ownership
    if (belief.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this belief',
      });
    }

    const { statement, description, category, tags, status } = req.body;

    if (statement) belief.statement = statement;
    if (description) belief.description = description;
    if (category) belief.category = category;
    if (tags) belief.tags = tags;
    if (status && req.user.role === 'admin') belief.status = status;

    await belief.save();

    res.json({
      success: true,
      data: belief,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete belief
// @route   DELETE /api/beliefs/:id
// @access  Private
export const deleteBelief = async (req, res) => {
  try {
    const belief = await Belief.findById(req.params.id);

    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    // Check ownership
    if (belief.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this belief',
      });
    }

    await belief.deleteOne();

    res.json({
      success: true,
      message: 'Belief deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get arguments for a belief
// @route   GET /api/beliefs/:id/arguments
// @access  Public
export const getBeliefArguments = async (req, res) => {
  try {
    const belief = await Belief.findById(req.params.id)
      .populate({
        path: 'supportingArguments',
        populate: [
          { path: 'author', select: 'username reputation' },
          { path: 'evidence' },
        ],
      })
      .populate({
        path: 'opposingArguments',
        populate: [
          { path: 'author', select: 'username reputation' },
          { path: 'evidence' },
        ],
      });

    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    res.json({
      success: true,
      data: {
        supporting: belief.supportingArguments,
        opposing: belief.opposingArguments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Calculate and update belief score
// @route   POST /api/beliefs/:id/calculate-score
// @access  Private (Admin/Moderator)
export const calculateBeliefScore = async (req, res) => {
  try {
    const belief = await Belief.findById(req.params.id);

    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    await belief.calculateConclusionScore();
    await belief.save();

    res.json({
      success: true,
      data: {
        conclusionScore: belief.conclusionScore,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get detailed score breakdown
// @route   GET /api/beliefs/:id/score-breakdown
// @access  Public
export const getScoreBreakdown = async (req, res) => {
  try {
    const belief = await Belief.findById(req.params.id);

    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    const breakdown = await belief.getScoreBreakdown();

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Check for duplicate beliefs before creating
// @route   POST /api/beliefs/check-duplicate
// @access  Public
export const checkDuplicate = async (req, res) => {
  try {
    const { statement } = req.body;

    if (!statement) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a statement',
      });
    }

    // Get all active beliefs
    const allBeliefs = await Belief.find({ status: 'active' })
      .populate('author', 'username')
      .select('statement description statistics');

    // Check for duplicates
    const result = detectDuplicate(statement, allBeliefs);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Find similar beliefs
// @route   GET /api/beliefs/:id/similar
// @access  Public
export const getSimilarBeliefs = async (req, res) => {
  try {
    const { threshold = 0.7 } = req.query;

    const belief = await Belief.findById(req.params.id);

    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    // Get all other active beliefs
    const allBeliefs = await Belief.find({
      status: 'active',
      _id: { $ne: belief._id },
    })
      .populate('author', 'username')
      .select('statement description statistics dimensions');

    // Find similar beliefs
    const similar = findSimilarBeliefs(belief.statement, allBeliefs, parseFloat(threshold));

    res.json({
      success: true,
      data: similar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Link similar beliefs
// @route   POST /api/beliefs/:id/link-similar
// @access  Private
export const linkSimilarBelief = async (req, res) => {
  try {
    const { similarBeliefId, similarityScore } = req.body;

    const belief = await Belief.findById(req.params.id);

    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    // Add to similarBeliefs
    await belief.addSimilarBelief(similarBeliefId, similarityScore);

    // Also add the reverse link
    const similarBelief = await Belief.findById(similarBeliefId);
    if (similarBelief) {
      await similarBelief.addSimilarBelief(belief._id, similarityScore);
    }

    res.json({
      success: true,
      message: 'Similar belief linked successfully',
      data: belief,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Merge similar belief into this one
// @route   POST /api/beliefs/:id/merge
// @access  Private (Admin)
export const mergeBelief = async (req, res) => {
  try {
    const { beliefIdToMerge } = req.body;

    const mainBelief = await Belief.findById(req.params.id);
    const beliefToMerge = await Belief.findById(beliefIdToMerge);

    if (!mainBelief || !beliefToMerge) {
      return res.status(404).json({
        success: false,
        error: 'One or both beliefs not found',
      });
    }

    // Transfer arguments from merged belief to main belief
    mainBelief.supportingArguments.push(...beliefToMerge.supportingArguments);
    mainBelief.opposingArguments.push(...beliefToMerge.opposingArguments);

    // Update argument references
    await Argument.updateMany(
      { beliefId: beliefIdToMerge },
      { beliefId: mainBelief._id }
    );

    // Mark as merged
    await mainBelief.mergeSimilarBelief(beliefIdToMerge);

    // Archive the merged belief
    beliefToMerge.status = 'archived';
    await beliefToMerge.save();

    // Recalculate scores
    await mainBelief.updateStatistics();
    await mainBelief.calculateConclusionScore();
    await mainBelief.save();

    res.json({
      success: true,
      message: 'Belief merged successfully',
      data: mainBelief,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update belief dimensions (specificity, sentiment, strength)
// @route   POST /api/beliefs/:id/update-dimensions
// @access  Public
export const updateBeliefDimensions = async (req, res) => {
  try {
    const belief = await Belief.findById(req.params.id);

    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    await belief.updateDimensions();

    res.json({
      success: true,
      data: {
        dimensions: belief.dimensions,
        position3D: belief.get3DPosition(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get beliefs with dimensional filters
// @route   GET /api/beliefs/search/dimensions
// @access  Public
export const searchByDimensions = async (req, res) => {
  try {
    const {
      minSpecificity,
      maxSpecificity,
      minStrength,
      maxStrength,
      minSentiment,
      maxSentiment,
      category,
      topicId,
      limit = 20,
      page = 1,
    } = req.query;

    const query = { status: 'active' };

    // Apply dimensional filters
    if (minSpecificity !== undefined || maxSpecificity !== undefined) {
      query['dimensions.specificity'] = {};
      if (minSpecificity !== undefined) {
        query['dimensions.specificity'].$gte = parseFloat(minSpecificity);
      }
      if (maxSpecificity !== undefined) {
        query['dimensions.specificity'].$lte = parseFloat(maxSpecificity);
      }
    }

    if (minStrength !== undefined || maxStrength !== undefined) {
      query.conclusionScore = {};
      if (minStrength !== undefined) {
        query.conclusionScore.$gte = parseFloat(minStrength);
      }
      if (maxStrength !== undefined) {
        query.conclusionScore.$lte = parseFloat(maxStrength);
      }
    }

    if (minSentiment !== undefined || maxSentiment !== undefined) {
      query['dimensions.sentimentPolarity'] = {};
      if (minSentiment !== undefined) {
        query['dimensions.sentimentPolarity'].$gte = parseFloat(minSentiment);
      }
      if (maxSentiment !== undefined) {
        query['dimensions.sentimentPolarity'].$lte = parseFloat(maxSentiment);
      }
    }

    if (category) query.category = category;
    if (topicId) query.topicId = topicId;

    const beliefs = await Belief.find(query)
      .populate('author', 'username reputation')
      .populate('topicId', 'name slug')
      .sort({ 'statistics.views': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Belief.countDocuments(query);

    res.json({
      success: true,
      data: beliefs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
