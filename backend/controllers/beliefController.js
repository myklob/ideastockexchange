import Belief from '../models/Belief.js';
import Argument from '../models/Argument.js';

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
