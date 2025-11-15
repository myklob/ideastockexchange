import Argument from '../models/Argument.js';
import Belief from '../models/Belief.js';

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
