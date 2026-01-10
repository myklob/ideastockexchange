import Assumption from '../models/Assumption.js';
import Belief from '../models/Belief.js';
import Argument from '../models/Argument.js';

// @desc    Create a new assumption
// @route   POST /api/assumptions
// @access  Private
export const createAssumption = async (req, res) => {
  try {
    const {
      statement,
      description,
      beliefId,
      dependentArguments,
      mustAccept,
      mustReject,
      criticalityReason,
      tags
    } = req.body;

    // Validate belief exists
    const belief = await Belief.findById(beliefId);
    if (!belief) {
      return res.status(404).json({ message: 'Belief not found' });
    }

    // Create assumption
    const assumption = new Assumption({
      statement,
      description,
      beliefId,
      author: req.user.id,
      mustAccept: mustAccept || false,
      mustReject: mustReject || false,
      criticalityReason,
      tags
    });

    // Add dependent arguments if provided
    if (dependentArguments && Array.isArray(dependentArguments)) {
      for (const dep of dependentArguments) {
        // Validate argument exists
        const argument = await Argument.findById(dep.argumentId);
        if (argument) {
          assumption.dependentArguments.push({
            argumentId: dep.argumentId,
            integralityScore: dep.integralityScore || 50
          });
        }
      }
    }

    // Calculate initial aggregate score
    await assumption.calculateAggregateScore();
    await assumption.save();

    // Populate for response
    await assumption.populate('author', 'username');
    await assumption.populate('dependentArguments.argumentId');

    res.status(201).json(assumption);
  } catch (error) {
    console.error('Error creating assumption:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all assumptions for a belief
// @route   GET /api/assumptions/belief/:beliefId
// @access  Public
export const getAssumptionsForBelief = async (req, res) => {
  try {
    const { beliefId } = req.params;
    const {
      sortBy = 'aggregateScore',
      order = 'desc',
      status,
      mustAccept,
      mustReject,
      limit,
      skip
    } = req.query;

    // Validate belief exists
    const belief = await Belief.findById(beliefId);
    if (!belief) {
      return res.status(404).json({ message: 'Belief not found' });
    }

    const options = {
      sortBy,
      order,
      status,
      mustAccept: mustAccept !== undefined ? mustAccept === 'true' : null,
      mustReject: mustReject !== undefined ? mustReject === 'true' : null,
      limit: limit ? parseInt(limit) : null,
      skip: skip ? parseInt(skip) : 0
    };

    const assumptions = await Assumption.getForBelief(beliefId, options);

    res.json({
      count: assumptions.length,
      assumptions
    });
  } catch (error) {
    console.error('Error getting assumptions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get critical assumptions for a belief
// @route   GET /api/assumptions/belief/:beliefId/critical
// @access  Public
export const getCriticalAssumptions = async (req, res) => {
  try {
    const { beliefId } = req.params;

    // Validate belief exists
    const belief = await Belief.findById(beliefId);
    if (!belief) {
      return res.status(404).json({ message: 'Belief not found' });
    }

    const assumptions = await Assumption.getCriticalForBelief(beliefId);

    res.json({
      count: assumptions.length,
      mustAccept: assumptions.filter(a => a.mustAccept),
      mustReject: assumptions.filter(a => a.mustReject),
      all: assumptions
    });
  } catch (error) {
    console.error('Error getting critical assumptions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single assumption by ID
// @route   GET /api/assumptions/:id
// @access  Public
export const getAssumption = async (req, res) => {
  try {
    const assumption = await Assumption.findById(req.params.id)
      .populate('author', 'username')
      .populate('beliefId', 'statement')
      .populate('dependentArguments.argumentId')
      .populate('linkedBeliefs.beliefId', 'statement');

    if (!assumption) {
      return res.status(404).json({ message: 'Assumption not found' });
    }

    // Increment view count
    assumption.views += 1;
    await assumption.save();

    res.json(assumption);
  } catch (error) {
    console.error('Error getting assumption:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update an assumption
// @route   PUT /api/assumptions/:id
// @access  Private (owner or admin)
export const updateAssumption = async (req, res) => {
  try {
    const assumption = await Assumption.findById(req.params.id);

    if (!assumption) {
      return res.status(404).json({ message: 'Assumption not found' });
    }

    // Check if user is owner or admin
    if (assumption.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this assumption' });
    }

    const {
      statement,
      description,
      mustAccept,
      mustReject,
      criticalityReason,
      status,
      tags
    } = req.body;

    // Update fields
    if (statement) assumption.statement = statement;
    if (description !== undefined) assumption.description = description;
    if (mustAccept !== undefined) assumption.mustAccept = mustAccept;
    if (mustReject !== undefined) assumption.mustReject = mustReject;
    if (criticalityReason !== undefined) assumption.criticalityReason = criticalityReason;
    if (status) assumption.status = status;
    if (tags) assumption.tags = tags;

    await assumption.save();
    await assumption.populate('author', 'username');
    await assumption.populate('dependentArguments.argumentId');

    res.json(assumption);
  } catch (error) {
    console.error('Error updating assumption:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete an assumption
// @route   DELETE /api/assumptions/:id
// @access  Private (owner or admin)
export const deleteAssumption = async (req, res) => {
  try {
    const assumption = await Assumption.findById(req.params.id);

    if (!assumption) {
      return res.status(404).json({ message: 'Assumption not found' });
    }

    // Check if user is owner or admin
    if (assumption.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this assumption' });
    }

    await assumption.deleteOne();

    res.json({ message: 'Assumption deleted successfully' });
  } catch (error) {
    console.error('Error deleting assumption:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a dependent argument to an assumption
// @route   POST /api/assumptions/:id/arguments
// @access  Private
export const addDependentArgument = async (req, res) => {
  try {
    const { argumentId, integralityScore } = req.body;

    const assumption = await Assumption.findById(req.params.id);
    if (!assumption) {
      return res.status(404).json({ message: 'Assumption not found' });
    }

    // Validate argument exists
    const argument = await Argument.findById(argumentId);
    if (!argument) {
      return res.status(404).json({ message: 'Argument not found' });
    }

    await assumption.addDependentArgument(argumentId, integralityScore || 50);
    await assumption.populate('dependentArguments.argumentId');

    res.json(assumption);
  } catch (error) {
    console.error('Error adding dependent argument:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove a dependent argument from an assumption
// @route   DELETE /api/assumptions/:id/arguments/:argumentId
// @access  Private (owner or admin)
export const removeDependentArgument = async (req, res) => {
  try {
    const assumption = await Assumption.findById(req.params.id);
    if (!assumption) {
      return res.status(404).json({ message: 'Assumption not found' });
    }

    // Check if user is owner or admin
    if (assumption.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this assumption' });
    }

    await assumption.removeDependentArgument(req.params.argumentId);
    await assumption.populate('dependentArguments.argumentId');

    res.json(assumption);
  } catch (error) {
    console.error('Error removing dependent argument:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update integrality score for a dependent argument
// @route   PUT /api/assumptions/:id/arguments/:argumentId
// @access  Private
export const updateIntegralityScore = async (req, res) => {
  try {
    const { integralityScore } = req.body;

    if (integralityScore === undefined || integralityScore < 0 || integralityScore > 100) {
      return res.status(400).json({ message: 'Integrality score must be between 0 and 100' });
    }

    const assumption = await Assumption.findById(req.params.id);
    if (!assumption) {
      return res.status(404).json({ message: 'Assumption not found' });
    }

    await assumption.updateIntegralityScore(req.params.argumentId, integralityScore);
    await assumption.populate('dependentArguments.argumentId');

    res.json(assumption);
  } catch (error) {
    console.error('Error updating integrality score:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Link assumption to another belief
// @route   POST /api/assumptions/:id/link-belief
// @access  Private
export const linkToBelief = async (req, res) => {
  try {
    const { beliefId, linkType, linkStrength, description } = req.body;

    const assumption = await Assumption.findById(req.params.id);
    if (!assumption) {
      return res.status(404).json({ message: 'Assumption not found' });
    }

    // Validate belief exists
    const belief = await Belief.findById(beliefId);
    if (!belief) {
      return res.status(404).json({ message: 'Belief not found' });
    }

    // Validate linkType
    const validLinkTypes = ['requires', 'contradicts', 'supports', 'implies'];
    if (linkType && !validLinkTypes.includes(linkType)) {
      return res.status(400).json({
        message: 'Invalid link type',
        validTypes: validLinkTypes
      });
    }

    await assumption.linkToBelief(
      beliefId,
      linkType || 'requires',
      linkStrength || 0.5,
      description || ''
    );
    await assumption.populate('linkedBeliefs.beliefId', 'statement');

    res.json(assumption);
  } catch (error) {
    console.error('Error linking to belief:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark assumption as must-accept
// @route   POST /api/assumptions/:id/mark-accept
// @access  Private
export const markAsMustAccept = async (req, res) => {
  try {
    const { reason } = req.body;

    const assumption = await Assumption.findById(req.params.id);
    if (!assumption) {
      return res.status(404).json({ message: 'Assumption not found' });
    }

    await assumption.markAsMustAccept(reason || '');
    await assumption.populate('author', 'username');

    res.json(assumption);
  } catch (error) {
    console.error('Error marking as must-accept:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark assumption as must-reject
// @route   POST /api/assumptions/:id/mark-reject
// @access  Private
export const markAsMustReject = async (req, res) => {
  try {
    const { reason } = req.body;

    const assumption = await Assumption.findById(req.params.id);
    if (!assumption) {
      return res.status(404).json({ message: 'Assumption not found' });
    }

    await assumption.markAsMustReject(reason || '');
    await assumption.populate('author', 'username');

    res.json(assumption);
  } catch (error) {
    console.error('Error marking as must-reject:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Vote on an assumption
// @route   POST /api/assumptions/:id/vote
// @access  Private
export const voteOnAssumption = async (req, res) => {
  try {
    const { voteType } = req.body; // 'up' or 'down'

    const assumption = await Assumption.findById(req.params.id);
    if (!assumption) {
      return res.status(404).json({ message: 'Assumption not found' });
    }

    if (voteType === 'up') {
      assumption.upvotes += 1;
      assumption.votes += 1;
    } else if (voteType === 'down') {
      assumption.downvotes += 1;
      assumption.votes -= 1;
    } else {
      return res.status(400).json({ message: 'Invalid vote type. Use "up" or "down"' });
    }

    await assumption.save();

    res.json({
      votes: assumption.votes,
      upvotes: assumption.upvotes,
      downvotes: assumption.downvotes,
      netVotes: assumption.netVotes
    });
  } catch (error) {
    console.error('Error voting on assumption:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Recalculate aggregate score for an assumption
// @route   POST /api/assumptions/:id/recalculate
// @access  Private (admin)
export const recalculateScore = async (req, res) => {
  try {
    const assumption = await Assumption.findById(req.params.id);
    if (!assumption) {
      return res.status(404).json({ message: 'Assumption not found' });
    }

    await assumption.calculateAggregateScore();
    await assumption.save();
    await assumption.populate('dependentArguments.argumentId');

    res.json({
      message: 'Score recalculated successfully',
      aggregateScore: assumption.aggregateScore,
      assumption
    });
  } catch (error) {
    console.error('Error recalculating score:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get assumptions by status
// @route   GET /api/assumptions/status/:status
// @access  Public
export const getAssumptionsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const validStatuses = ['proposed', 'accepted', 'rejected', 'debated', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status',
        validStatuses
      });
    }

    const assumptions = await Assumption.find({ status })
      .populate('author', 'username')
      .populate('beliefId', 'statement')
      .sort({ aggregateScore: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Assumption.countDocuments({ status });

    res.json({
      count: assumptions.length,
      total,
      assumptions
    });
  } catch (error) {
    console.error('Error getting assumptions by status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
