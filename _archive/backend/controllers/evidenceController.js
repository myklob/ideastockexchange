import Evidence from '../models/Evidence.js';
import Argument from '../models/Argument.js';

// @desc    Create new evidence
// @route   POST /api/evidence
// @access  Private
export const createEvidence = async (req, res) => {
  try {
    const { title, description, type, source, metadata, tags, argumentIds } = req.body;

    const evidence = await Evidence.create({
      title,
      description,
      type,
      source: source || {},
      metadata: metadata || {},
      tags: tags || [],
      submittedBy: req.user.id,
      arguments: argumentIds || [],
    });

    // Add evidence to arguments
    if (argumentIds && argumentIds.length > 0) {
      await Argument.updateMany(
        { _id: { $in: argumentIds } },
        { $push: { evidence: evidence._id } }
      );
    }

    res.status(201).json({
      success: true,
      data: evidence,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get all evidence
// @route   GET /api/evidence
// @access  Public
export const getEvidence = async (req, res) => {
  try {
    const { type, verificationStatus, limit = 20, page = 1 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (verificationStatus) query.verificationStatus = verificationStatus;

    const evidence = await Evidence.find(query)
      .populate('submittedBy', 'username reputation')
      .populate('arguments', 'content type')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Evidence.countDocuments(query);

    res.json({
      success: true,
      data: evidence,
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

// @desc    Get single evidence
// @route   GET /api/evidence/:id
// @access  Public
export const getEvidenceById = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id)
      .populate('submittedBy', 'username reputation')
      .populate('arguments')
      .populate('verifiedBy.user', 'username reputation');

    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: 'Evidence not found',
      });
    }

    res.json({
      success: true,
      data: evidence,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Verify evidence
// @route   POST /api/evidence/:id/verify
// @access  Private
export const verifyEvidence = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['verified', 'disputed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification status',
      });
    }

    const evidence = await Evidence.findById(req.params.id);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: 'Evidence not found',
      });
    }

    // Check if user already verified this evidence
    const existingVerification = evidence.verifiedBy.find(
      v => v.user.toString() === req.user.id
    );

    if (existingVerification) {
      return res.status(400).json({
        success: false,
        error: 'You have already verified this evidence',
      });
    }

    await evidence.addVerification(req.user.id, status, notes);

    res.json({
      success: true,
      data: evidence,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update evidence
// @route   PUT /api/evidence/:id
// @access  Private
export const updateEvidence = async (req, res) => {
  try {
    let evidence = await Evidence.findById(req.params.id);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: 'Evidence not found',
      });
    }

    // Check ownership
    if (evidence.submittedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this evidence',
      });
    }

    const { title, description, source, metadata, tags } = req.body;

    if (title) evidence.title = title;
    if (description) evidence.description = description;
    if (source) evidence.source = { ...evidence.source, ...source };
    if (metadata) evidence.metadata = { ...evidence.metadata, ...metadata };
    if (tags) evidence.tags = tags;

    await evidence.save();

    res.json({
      success: true,
      data: evidence,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete evidence
// @route   DELETE /api/evidence/:id
// @access  Private
export const deleteEvidence = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: 'Evidence not found',
      });
    }

    // Check ownership
    if (evidence.submittedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this evidence',
      });
    }

    // Remove from arguments
    await Argument.updateMany(
      { evidence: evidence._id },
      { $pull: { evidence: evidence._id } }
    );

    await evidence.deleteOne();

    res.json({
      success: true,
      message: 'Evidence deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
