import Journal from '../models/Journal.js';
import JournalStance from '../models/JournalStance.js';
import Study from '../models/Study.js';
import Belief from '../models/Belief.js';

/**
 * Journal Controller
 * Handles all journal-related API endpoints
 */

// Create a new journal
export const createJournal = async (req, res) => {
  try {
    const journalData = {
      ...req.body,
      addedBy: req.user._id
    };

    const journal = new Journal(journalData);

    // Calculate initial ReasonRank score
    await journal.calculateReasonRankScore();

    await journal.save();

    res.status(201).json({
      success: true,
      data: journal
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all journals with filtering and pagination
export const getJournals = async (req, res) => {
  try {
    const {
      field,
      verificationStatus,
      minReasonRank,
      maxReasonRank,
      search,
      page = 1,
      limit = 20,
      sortBy = 'reasonRankScore',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (field) {
      query.field = field;
    }

    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    if (minReasonRank || maxReasonRank) {
      query.reasonRankScore = {};
      if (minReasonRank) query.reasonRankScore.$gte = parseFloat(minReasonRank);
      if (maxReasonRank) query.reasonRankScore.$lte = parseFloat(maxReasonRank);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { abbreviation: { $regex: search, $options: 'i' } },
        { publisher: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const journals = await Journal.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('addedBy', 'username');

    const total = await Journal.countDocuments(query);

    res.json({
      success: true,
      data: journals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get a single journal by ID
export const getJournalById = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id)
      .populate('addedBy', 'username')
      .populate({
        path: 'studies',
        select: 'title authors publicationDate reasonRankScore citationMetrics'
      });

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: 'Journal not found'
      });
    }

    res.json({
      success: true,
      data: journal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update a journal
export const updateJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: 'Journal not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'addedBy') {
        journal[key] = req.body[key];
      }
    });

    // Recalculate ReasonRank score
    await journal.calculateReasonRankScore();

    await journal.save();

    res.json({
      success: true,
      data: journal
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete a journal
export const deleteJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: 'Journal not found'
      });
    }

    await journal.deleteOne();

    res.json({
      success: true,
      message: 'Journal deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get journal score breakdown
export const getJournalScoreBreakdown = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: 'Journal not found'
      });
    }

    const breakdown = journal.getScoreBreakdown();
    const interpretation = journal.getScoreInterpretation();

    res.json({
      success: true,
      data: {
        breakdown,
        interpretation
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Recalculate journal ReasonRank score
export const recalculateJournalScore = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: 'Journal not found'
      });
    }

    await journal.calculateReasonRankScore();
    await journal.updateStatistics();
    await journal.save();

    res.json({
      success: true,
      data: journal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get journal stances (positions on beliefs)
export const getJournalStances = async (req, res) => {
  try {
    const { position, minStrength, beliefId } = req.query;

    const query = { journal: req.params.id };

    if (position) {
      query.position = position;
    }

    if (minStrength) {
      query.stanceStrength = { $gte: parseFloat(minStrength) };
    }

    if (beliefId) {
      query.belief = beliefId;
    }

    const stances = await JournalStance.find(query)
      .populate('belief', 'statement conclusionScore')
      .populate({
        path: 'supportingStudies.study',
        select: 'title reasonRankScore publicationDate'
      })
      .populate({
        path: 'opposingStudies.study',
        select: 'title reasonRankScore publicationDate'
      })
      .sort({ stanceStrength: -1 });

    res.json({
      success: true,
      data: stances
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get journals by belief (for two-column view)
export const getJournalsByBelief = async (req, res) => {
  try {
    const { beliefId } = req.params;
    const { minStrength = 0 } = req.query;

    const belief = await Belief.findById(beliefId);

    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found'
      });
    }

    // Get all journal stances for this belief
    const stances = await JournalStance.find({
      belief: beliefId,
      stanceStrength: { $gte: parseFloat(minStrength) }
    })
      .populate('journal')
      .sort({ stanceStrength: -1 });

    // Organize by position
    const supporting = stances
      .filter(s => s.position === 'supporting')
      .map(async s => {
        const breakdown = await s.getStanceBreakdown();
        return breakdown;
      });

    const opposing = stances
      .filter(s => s.position === 'opposing')
      .map(async s => {
        const breakdown = await s.getStanceBreakdown();
        return breakdown;
      });

    const neutral = stances
      .filter(s => s.position === 'neutral')
      .map(async s => {
        const breakdown = await s.getStanceBreakdown();
        return breakdown;
      });

    const mixed = stances
      .filter(s => s.position === 'mixed')
      .map(async s => {
        const breakdown = await s.getStanceBreakdown();
        return breakdown;
      });

    res.json({
      success: true,
      data: {
        belief: {
          id: belief._id,
          statement: belief.statement,
          conclusionScore: belief.conclusionScore
        },
        supporting: await Promise.all(supporting),
        opposing: await Promise.all(opposing),
        neutral: await Promise.all(neutral),
        mixed: await Promise.all(mixed),
        summary: {
          totalJournals: stances.length,
          supportingCount: supporting.length,
          opposingCount: opposing.length,
          neutralCount: neutral.length,
          mixedCount: mixed.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create or update a journal stance
export const createOrUpdateJournalStance = async (req, res) => {
  try {
    const { journalId, beliefId, position, description } = req.body;

    // Check if stance already exists
    let stance = await JournalStance.findOne({
      journal: journalId,
      belief: beliefId
    });

    if (stance) {
      // Update existing stance
      if (position) stance.position = position;
      if (description) stance.description = description;
    } else {
      // Create new stance
      stance = new JournalStance({
        journal: journalId,
        belief: beliefId,
        position: position || 'neutral',
        description: description || '',
        createdBy: req.user._id
      });
    }

    // Calculate stance strength
    await stance.calculateStanceStrength();
    await stance.save();

    // Update journal statistics
    const journal = await Journal.findById(journalId);
    if (journal) {
      await journal.updateStatistics();
      await journal.save();
    }

    res.json({
      success: true,
      data: stance
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Add a study to a journal stance
export const addStudyToJournalStance = async (req, res) => {
  try {
    const { stanceId, studyId, position, relevanceScore = 1.0 } = req.body;

    const stance = await JournalStance.findById(stanceId);

    if (!stance) {
      return res.status(404).json({
        success: false,
        error: 'Journal stance not found'
      });
    }

    stance.addStudy(studyId, position, relevanceScore);

    // Recalculate stance strength
    await stance.calculateStanceStrength();
    await stance.save();

    res.json({
      success: true,
      data: stance
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Verify a journal
export const verifyJournal = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: 'Journal not found'
      });
    }

    journal.verifiedBy.push({
      user: req.user._id,
      status: status,
      notes: notes
    });

    journal.verificationStatus = status;

    // Recalculate score with new verification status
    await journal.calculateReasonRankScore();
    await journal.save();

    res.json({
      success: true,
      data: journal
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get top journals by field
export const getTopJournalsByField = async (req, res) => {
  try {
    const { field, limit = 10 } = req.query;

    const query = field ? { field } : {};

    const journals = await Journal.find(query)
      .sort({ reasonRankScore: -1 })
      .limit(parseInt(limit))
      .select('name reasonRankScore metrics field publisher');

    res.json({
      success: true,
      data: journals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Search journals by name or ISSN
export const searchJournals = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query required'
      });
    }

    const journals = await Journal.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { abbreviation: { $regex: q, $options: 'i' } },
        { issn: q },
        { eissn: q }
      ]
    })
      .sort({ reasonRankScore: -1 })
      .limit(parseInt(limit))
      .select('name abbreviation issn reasonRankScore metrics field');

    res.json({
      success: true,
      data: journals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

