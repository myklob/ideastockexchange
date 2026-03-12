import Contributor from '../models/Contributor.js';
import Belief from '../models/Belief.js';

// @desc    Get ranked contributors for a belief
// @route   GET /api/beliefs/:beliefId/contributors
// @access  Public
export const getBeliefContributors = async (req, res) => {
  try {
    const { sortBy = 'combined', filterRole = 'all', limit = 50 } = req.query;
    const { beliefId } = req.params;

    // Verify belief exists
    const belief = await Belief.findById(beliefId);
    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    // Get ranked contributors using static method
    const contributors = await Contributor.getRankedContributors(
      beliefId,
      sortBy,
      filterRole
    );

    // Apply limit
    const limitedContributors = contributors.slice(0, parseInt(limit));

    // Get top supporters and opponents
    const topContributors = await Contributor.getTopContributors(beliefId, 5);

    res.json({
      success: true,
      data: {
        contributors: limitedContributors,
        summary: {
          total: contributors.length,
          topSupporters: topContributors.topSupporters,
          topOpponents: topContributors.topOpponents,
          totalSupporters: topContributors.totalSupporters,
          totalOpponents: topContributors.totalOpponents,
          totalNeutral: topContributors.totalNeutral,
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

// @desc    Get single contributor
// @route   GET /api/contributors/:id
// @access  Public
export const getContributor = async (req, res) => {
  try {
    const contributor = await Contributor.findById(req.params.id)
      .populate('belief', 'statement category')
      .populate('addedBy', 'username')
      .populate('user', 'username reputation');

    if (!contributor) {
      return res.status(404).json({
        success: false,
        error: 'Contributor not found',
      });
    }

    res.json({
      success: true,
      data: {
        contributor,
        scoreBreakdown: contributor.getScoreBreakdown(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create new contributor
// @route   POST /api/beliefs/:beliefId/contributors
// @access  Private
export const createContributor = async (req, res) => {
  try {
    const { beliefId } = req.params;
    const {
      name,
      influenceScore,
      linkageScore,
      influenceSources,
      linkageSources,
      bio,
      expertise,
      credentials,
      externalLinks,
      notes,
    } = req.body;

    // Verify belief exists
    const belief = await Belief.findById(beliefId);
    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    // Check if contributor already exists for this belief
    const existingContributor = await Contributor.findOne({
      belief: beliefId,
      name: name.trim(),
    });

    if (existingContributor) {
      return res.status(400).json({
        success: false,
        error: 'This contributor has already been added to this belief',
      });
    }

    // Create contributor
    const contributor = await Contributor.create({
      name,
      belief: beliefId,
      influenceScore,
      linkageScore,
      influenceSources,
      linkageSources,
      bio,
      expertise,
      credentials,
      externalLinks,
      notes,
      addedBy: req.user.id,
    });

    // Add contributor to belief
    belief.contributors.push(contributor._id);
    await belief.updateStatistics();

    // Populate relations
    await contributor.populate('addedBy', 'username');
    await contributor.populate('belief', 'statement');

    res.status(201).json({
      success: true,
      data: {
        contributor,
        scoreBreakdown: contributor.getScoreBreakdown(),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update contributor
// @route   PUT /api/contributors/:id
// @access  Private
export const updateContributor = async (req, res) => {
  try {
    let contributor = await Contributor.findById(req.params.id);

    if (!contributor) {
      return res.status(404).json({
        success: false,
        error: 'Contributor not found',
      });
    }

    // Check authorization - only addedBy user, belief author, or admin can update
    const belief = await Belief.findById(contributor.belief);
    const isAuthorized =
      contributor.addedBy.toString() === req.user.id ||
      belief.author.toString() === req.user.id ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this contributor',
      });
    }

    // Update fields
    const allowedFields = [
      'name',
      'influenceScore',
      'linkageScore',
      'influenceSources',
      'linkageSources',
      'bio',
      'expertise',
      'credentials',
      'externalLinks',
      'notes',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        contributor[field] = req.body[field];
      }
    });

    // If verified by admin
    if (req.user.role === 'admin' && req.body.verified !== undefined) {
      contributor.verified = req.body.verified;
      if (req.body.verified) {
        contributor.verifiedBy = req.user.id;
        contributor.verifiedAt = new Date();
      }
    }

    await contributor.save();

    // Populate relations
    await contributor.populate('addedBy', 'username');
    await contributor.populate('user', 'username reputation');
    await contributor.populate('belief', 'statement');

    res.json({
      success: true,
      data: {
        contributor,
        scoreBreakdown: contributor.getScoreBreakdown(),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete contributor
// @route   DELETE /api/contributors/:id
// @access  Private
export const deleteContributor = async (req, res) => {
  try {
    const contributor = await Contributor.findById(req.params.id);

    if (!contributor) {
      return res.status(404).json({
        success: false,
        error: 'Contributor not found',
      });
    }

    // Check authorization - only addedBy user, belief author, or admin can delete
    const belief = await Belief.findById(contributor.belief);
    const isAuthorized =
      contributor.addedBy.toString() === req.user.id ||
      belief.author.toString() === req.user.id ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this contributor',
      });
    }

    // Remove contributor from belief
    belief.contributors = belief.contributors.filter(
      c => c.toString() !== contributor._id.toString()
    );
    await belief.updateStatistics();

    // Delete contributor
    await contributor.deleteOne();

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Search contributors
// @route   GET /api/contributors/search
// @access  Public
export const searchContributors = async (req, res) => {
  try {
    const { query, beliefId } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const contributors = await Contributor.searchContributors(query, beliefId);

    res.json({
      success: true,
      data: contributors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Flag contributor for moderation
// @route   POST /api/contributors/:id/flag
// @access  Private
export const flagContributor = async (req, res) => {
  try {
    const { reason } = req.body;
    const contributor = await Contributor.findById(req.params.id);

    if (!contributor) {
      return res.status(404).json({
        success: false,
        error: 'Contributor not found',
      });
    }

    contributor.flagged = true;
    contributor.flagReason = reason || 'No reason provided';
    await contributor.save();

    res.json({
      success: true,
      data: contributor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Recalculate contributor scores
// @route   POST /api/contributors/:id/recalculate
// @access  Private (Admin only)
export const recalculateScores = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can recalculate scores',
      });
    }

    const contributor = await Contributor.findById(req.params.id);

    if (!contributor) {
      return res.status(404).json({
        success: false,
        error: 'Contributor not found',
      });
    }

    contributor.recalculateInfluenceScore();
    contributor.recalculateLinkageScore();
    await contributor.save();

    await contributor.populate('addedBy', 'username');
    await contributor.populate('belief', 'statement');

    res.json({
      success: true,
      data: {
        contributor,
        scoreBreakdown: contributor.getScoreBreakdown(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get contributor statistics
// @route   GET /api/contributors/stats
// @access  Public
export const getContributorStats = async (req, res) => {
  try {
    const totalContributors = await Contributor.countDocuments({ flagged: false });
    const verifiedContributors = await Contributor.countDocuments({
      verified: true,
      flagged: false,
    });

    // Get top contributors by influence across all beliefs
    const topInfluencers = await Contributor.find({ flagged: false })
      .sort({ influenceScore: -1 })
      .limit(10)
      .populate('belief', 'statement')
      .populate('user', 'username');

    // Get most polarizing contributors (highest |L|)
    const allContributors = await Contributor.find({ flagged: false }).lean();
    const mostPolarizing = allContributors
      .map(c => ({
        ...c,
        stanceStrength: Math.abs(c.linkageScore),
      }))
      .sort((a, b) => b.stanceStrength - a.stanceStrength)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        totalContributors,
        verifiedContributors,
        topInfluencers,
        mostPolarizing,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
