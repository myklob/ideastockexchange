import Study from '../models/Study.js';
import StudyStance from '../models/StudyStance.js';
import Journal from '../models/Journal.js';
import Belief from '../models/Belief.js';

/**
 * Study Controller
 * Handles all study-related API endpoints
 * Similar to Google Scholar but with ReasonRank algorithms
 */

// Create a new study
export const createStudy = async (req, res) => {
  try {
    const studyData = {
      ...req.body,
      addedBy: req.user._id
    };

    const study = new Study(studyData);

    // Calculate initial ReasonRank score
    await study.calculateReasonRankScore();

    await study.save();

    // Add study to journal
    if (study.journal) {
      const journal = await Journal.findById(study.journal);
      if (journal) {
        journal.studies.push(study._id);
        await journal.updateStatistics();
        await journal.save();
      }
    }

    res.status(201).json({
      success: true,
      data: study
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all studies with filtering and pagination
export const getStudies = async (req, res) => {
  try {
    const {
      field,
      studyType,
      journalId,
      verificationStatus,
      minReasonRank,
      maxReasonRank,
      minCitations,
      startDate,
      endDate,
      search,
      keywords,
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

    if (studyType) {
      query.studyType = studyType;
    }

    if (journalId) {
      query.journal = journalId;
    }

    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    if (minReasonRank || maxReasonRank) {
      query.reasonRankScore = {};
      if (minReasonRank) query.reasonRankScore.$gte = parseFloat(minReasonRank);
      if (maxReasonRank) query.reasonRankScore.$lte = parseFloat(maxReasonRank);
    }

    if (minCitations) {
      query['citationMetrics.citationCount'] = { $gte: parseInt(minCitations) };
    }

    if (startDate || endDate) {
      query.publicationDate = {};
      if (startDate) query.publicationDate.$gte = new Date(startDate);
      if (endDate) query.publicationDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { abstract: { $regex: search, $options: 'i' } },
        { 'authors.name': { $regex: search, $options: 'i' } }
      ];
    }

    if (keywords) {
      const keywordArray = keywords.split(',').map(k => k.trim());
      query.keywords = { $in: keywordArray };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const studies = await Study.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('journal', 'name reasonRankScore')
      .populate('addedBy', 'username');

    const total = await Study.countDocuments(query);

    res.json({
      success: true,
      data: studies,
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

// Get a single study by ID
export const getStudyById = async (req, res) => {
  try {
    const study = await Study.findById(req.params.id)
      .populate('journal')
      .populate('addedBy', 'username')
      .populate({
        path: 'citationMetrics.citedByStudies',
        select: 'title authors publicationDate reasonRankScore'
      })
      .populate({
        path: 'citationMetrics.references',
        select: 'title authors publicationDate reasonRankScore'
      })
      .populate({
        path: 'replicationInfo.replicationStudies.study',
        select: 'title authors publicationDate reasonRankScore'
      });

    if (!study) {
      return res.status(404).json({
        success: false,
        error: 'Study not found'
      });
    }

    // Increment view count
    study.statistics.views += 1;
    await study.save();

    res.json({
      success: true,
      data: study
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update a study
export const updateStudy = async (req, res) => {
  try {
    const study = await Study.findById(req.params.id);

    if (!study) {
      return res.status(404).json({
        success: false,
        error: 'Study not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'addedBy') {
        study[key] = req.body[key];
      }
    });

    // Recalculate ReasonRank score
    await study.calculateReasonRankScore();

    await study.save();

    res.json({
      success: true,
      data: study
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete a study
export const deleteStudy = async (req, res) => {
  try {
    const study = await Study.findById(req.params.id);

    if (!study) {
      return res.status(404).json({
        success: false,
        error: 'Study not found'
      });
    }

    await study.deleteOne();

    res.json({
      success: true,
      message: 'Study deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get study score breakdown
export const getStudyScoreBreakdown = async (req, res) => {
  try {
    const study = await Study.findById(req.params.id);

    if (!study) {
      return res.status(404).json({
        success: false,
        error: 'Study not found'
      });
    }

    const breakdown = study.getScoreBreakdown();
    const interpretation = study.getScoreInterpretation();

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

// Recalculate study ReasonRank score
export const recalculateStudyScore = async (req, res) => {
  try {
    const study = await Study.findById(req.params.id);

    if (!study) {
      return res.status(404).json({
        success: false,
        error: 'Study not found'
      });
    }

    await study.calculateReasonRankScore();
    await study.save();

    res.json({
      success: true,
      data: study
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Calculate PageRank for study
export const calculatePageRank = async (req, res) => {
  try {
    const study = await Study.findById(req.params.id);

    if (!study) {
      return res.status(404).json({
        success: false,
        error: 'Study not found'
      });
    }

    const { dampingFactor = 0.85, iterations = 10 } = req.query;

    await study.calculatePageRank(
      parseFloat(dampingFactor),
      parseInt(iterations)
    );

    await study.save();

    res.json({
      success: true,
      data: {
        pageRankScore: study.networkMetrics.pageRankScore
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get study stances (positions on beliefs)
export const getStudyStances = async (req, res) => {
  try {
    const { position, minStrength, beliefId } = req.query;

    const query = { study: req.params.id };

    if (position) {
      query.position = position;
    }

    if (minStrength) {
      query.stanceStrength = { $gte: parseFloat(minStrength) };
    }

    if (beliefId) {
      query.belief = beliefId;
    }

    const stances = await StudyStance.find(query)
      .populate('belief', 'statement conclusionScore')
      .populate({
        path: 'linkedArguments.argument',
        select: 'content reasonRankScore type'
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

// Get studies by belief (similar to journal two-column view)
export const getStudiesByBelief = async (req, res) => {
  try {
    const { beliefId } = req.params;
    const { minStrength = 0, limit = 50 } = req.query;

    const belief = await Belief.findById(beliefId);

    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found'
      });
    }

    // Get all study stances for this belief
    const stances = await StudyStance.find({
      belief: beliefId,
      stanceStrength: { $gte: parseFloat(minStrength) }
    })
      .populate({
        path: 'study',
        populate: { path: 'journal', select: 'name reasonRankScore' }
      })
      .sort({ stanceStrength: -1 })
      .limit(parseInt(limit));

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

    const inconclusive = stances
      .filter(s => s.position === 'inconclusive')
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
        inconclusive: await Promise.all(inconclusive),
        summary: {
          totalStudies: stances.length,
          supportingCount: supporting.length,
          opposingCount: opposing.length,
          neutralCount: neutral.length,
          inconclusiveCount: inconclusive.length
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

// Create or update a study stance
export const createOrUpdateStudyStance = async (req, res) => {
  try {
    const {
      studyId,
      beliefId,
      position,
      extractedClaim,
      directQuote,
      citationLocation,
      context,
      statisticalFindings,
      interpretation
    } = req.body;

    // Check if stance already exists
    let stance = await StudyStance.findOne({
      study: studyId,
      belief: beliefId
    });

    if (stance) {
      // Update existing stance
      Object.keys(req.body).forEach(key => {
        if (key !== '_id' && key !== 'createdBy' && key !== 'study' && key !== 'belief') {
          stance[key] = req.body[key];
        }
      });
    } else {
      // Create new stance
      stance = new StudyStance({
        study: studyId,
        belief: beliefId,
        position: position || 'neutral',
        extractedClaim: extractedClaim,
        directQuote: directQuote,
        citationLocation: citationLocation,
        context: context,
        statisticalFindings: statisticalFindings,
        interpretation: interpretation,
        createdBy: req.user._id
      });
    }

    // Calculate scores
    await stance.calculateRelevance();
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

// Add user rating to study stance
export const rateStudyStance = async (req, res) => {
  try {
    const { stanceId, helpful, comment } = req.body;

    const stance = await StudyStance.findById(stanceId);

    if (!stance) {
      return res.status(404).json({
        success: false,
        error: 'Study stance not found'
      });
    }

    stance.addUserRating(req.user._id, helpful, comment);

    // Recalculate stance strength with new ratings
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

// Verify a study
export const verifyStudy = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const study = await Study.findById(req.params.id);

    if (!study) {
      return res.status(404).json({
        success: false,
        error: 'Study not found'
      });
    }

    study.verifiedBy.push({
      user: req.user._id,
      status: status,
      notes: notes
    });

    study.verificationStatus = status;

    // Recalculate score with new verification status
    await study.calculateReasonRankScore();
    await study.save();

    res.json({
      success: true,
      data: study
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Add citation (one study cites another)
export const addCitation = async (req, res) => {
  try {
    const { citingStudyId, citedStudyId } = req.body;

    const citingStudy = await Study.findById(citingStudyId);
    const citedStudy = await Study.findById(citedStudyId);

    if (!citingStudy || !citedStudy) {
      return res.status(404).json({
        success: false,
        error: 'Study not found'
      });
    }

    // Add to citing study's references
    if (!citingStudy.citationMetrics.references.includes(citedStudyId)) {
      citingStudy.citationMetrics.references.push(citedStudyId);
    }

    // Add to cited study's citedBy
    if (!citedStudy.citationMetrics.citedByStudies.includes(citingStudyId)) {
      citedStudy.citationMetrics.citedByStudies.push(citingStudyId);
      citedStudy.citationMetrics.citationCount += 1;
    }

    // Recalculate scores
    await citingStudy.calculateReasonRankScore();
    await citedStudy.calculateReasonRankScore();

    await citingStudy.save();
    await citedStudy.save();

    res.json({
      success: true,
      data: {
        citingStudy: citingStudy,
        citedStudy: citedStudy
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Add replication information
export const addReplication = async (req, res) => {
  try {
    const { originalStudyId, replicationStudyId, outcome } = req.body;

    const originalStudy = await Study.findById(originalStudyId);
    const replicationStudy = await Study.findById(replicationStudyId);

    if (!originalStudy || !replicationStudy) {
      return res.status(404).json({
        success: false,
        error: 'Study not found'
      });
    }

    // Update original study
    originalStudy.replicationInfo.replicationAttempts += 1;
    originalStudy.replicationInfo.hasBeenReplicated = true;

    if (outcome === 'successful') {
      originalStudy.replicationInfo.successfulReplications += 1;
    } else if (outcome === 'failed') {
      originalStudy.replicationInfo.failedReplications += 1;
    }

    originalStudy.replicationInfo.replicationStudies.push({
      study: replicationStudyId,
      outcome: outcome
    });

    // Update replication study
    replicationStudy.replicationInfo.isReplicationOf = originalStudyId;

    // Recalculate scores
    await originalStudy.calculateReasonRankScore();
    await replicationStudy.calculateReasonRankScore();

    await originalStudy.save();
    await replicationStudy.save();

    res.json({
      success: true,
      data: {
        originalStudy: originalStudy,
        replicationStudy: replicationStudy
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Search studies (like Google Scholar)
export const searchStudies = async (req, res) => {
  try {
    const { q, limit = 20, page = 1 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query required'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const studies = await Study.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { abstract: { $regex: q, $options: 'i' } },
        { keywords: { $in: [new RegExp(q, 'i')] } },
        { 'authors.name': { $regex: q, $options: 'i' } }
      ]
    })
      .sort({ reasonRankScore: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('journal', 'name reasonRankScore')
      .select('title authors abstract publicationDate reasonRankScore citationMetrics journal doi');

    const total = await Study.countDocuments({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { abstract: { $regex: q, $options: 'i' } },
        { keywords: { $in: [new RegExp(q, 'i')] } }
      ]
    });

    res.json({
      success: true,
      data: studies,
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

// Get most cited studies
export const getMostCitedStudies = async (req, res) => {
  try {
    const { field, limit = 20, timeframe } = req.query;

    const query = {};

    if (field) {
      query.field = field;
    }

    if (timeframe) {
      const date = new Date();
      const years = parseInt(timeframe);
      date.setFullYear(date.getFullYear() - years);
      query.publicationDate = { $gte: date };
    }

    const studies = await Study.find(query)
      .sort({ 'citationMetrics.citationCount': -1 })
      .limit(parseInt(limit))
      .populate('journal', 'name reasonRankScore')
      .select('title authors publicationDate reasonRankScore citationMetrics journal doi');

    res.json({
      success: true,
      data: studies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get highest ReasonRank studies
export const getTopStudies = async (req, res) => {
  try {
    const { field, limit = 20, timeframe } = req.query;

    const query = {};

    if (field) {
      query.field = field;
    }

    if (timeframe) {
      const date = new Date();
      const years = parseInt(timeframe);
      date.setFullYear(date.getFullYear() - years);
      query.publicationDate = { $gte: date };
    }

    const studies = await Study.find(query)
      .sort({ reasonRankScore: -1 })
      .limit(parseInt(limit))
      .populate('journal', 'name reasonRankScore')
      .select('title authors publicationDate reasonRankScore citationMetrics journal doi');

    res.json({
      success: true,
      data: studies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


