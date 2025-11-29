import Law from '../models/Law.js';
import Belief from '../models/Belief.js';

/**
 * @desc    Get all laws
 * @route   GET /api/laws
 * @access  Public
 */
export const getLaws = async (req, res) => {
  try {
    const {
      country,
      state,
      level,
      category,
      status,
      verificationStatus,
      beliefId,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    // Build filter
    const filter = {};

    if (country) filter['jurisdiction.country'] = new RegExp(country, 'i');
    if (state) filter['jurisdiction.state'] = new RegExp(state, 'i');
    if (level) filter['jurisdiction.level'] = level;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (beliefId) filter['relatedBeliefs.beliefId'] = beliefId;

    // Execute query with pagination
    const laws = await Law.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('submittedBy', 'name username')
      .populate('verifiedBy', 'name username')
      .populate('relatedBeliefs.beliefId', 'statement conclusionScore');

    // Get total count for pagination
    const count = await Law.countDocuments(filter);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: laws,
    });
  } catch (error) {
    console.error('Error in getLaws:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching laws',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single law by ID
 * @route   GET /api/laws/:id
 * @access  Public
 */
export const getLaw = async (req, res) => {
  try {
    const law = await Law.findById(req.params.id)
      .populate('submittedBy', 'name username email')
      .populate('verifiedBy', 'name username')
      .populate('relatedBeliefs.beliefId', 'statement description conclusionScore category')
      .populate('context.relatedLaws.lawId', 'title jurisdiction status');

    if (!law) {
      return res.status(404).json({
        success: false,
        message: 'Law not found',
      });
    }

    // Increment view count
    await law.incrementViews();

    res.status(200).json({
      success: true,
      data: law,
    });
  } catch (error) {
    console.error('Error in getLaw:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching law',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new law
 * @route   POST /api/laws
 * @access  Private
 */
export const createLaw = async (req, res) => {
  try {
    // Add submitter to law data
    const lawData = {
      ...req.body,
      submittedBy: req.user._id,
    };

    const law = await Law.create(lawData);

    // Calculate initial scores
    await law.updateAllScores();

    // Update related beliefs' citation counts
    if (law.relatedBeliefs && law.relatedBeliefs.length > 0) {
      for (const relation of law.relatedBeliefs) {
        try {
          const belief = await Belief.findById(relation.beliefId);
          if (belief) {
            // Add law reference to belief if not already present
            if (!belief.supportingLaws) belief.supportingLaws = [];
            if (!belief.opposingLaws) belief.opposingLaws = [];

            if (relation.relationship === 'supports' && !belief.supportingLaws.includes(law._id)) {
              belief.supportingLaws.push(law._id);
            } else if (relation.relationship === 'opposes' && !belief.opposingLaws.includes(law._id)) {
              belief.opposingLaws.push(law._id);
            }

            await belief.save();
          }
        } catch (beliefError) {
          console.error('Error updating belief:', beliefError);
        }
      }
    }

    const populatedLaw = await Law.findById(law._id)
      .populate('submittedBy', 'name username')
      .populate('relatedBeliefs.beliefId', 'statement conclusionScore');

    res.status(201).json({
      success: true,
      data: populatedLaw,
    });
  } catch (error) {
    console.error('Error in createLaw:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating law',
      error: error.message,
    });
  }
};

/**
 * @desc    Update law
 * @route   PUT /api/laws/:id
 * @access  Private
 */
export const updateLaw = async (req, res) => {
  try {
    let law = await Law.findById(req.params.id);

    if (!law) {
      return res.status(404).json({
        success: false,
        message: 'Law not found',
      });
    }

    // Check if user is the submitter or an admin
    if (law.submittedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this law',
      });
    }

    // Update the law
    law = await Law.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        'statistics.lastUpdatedBy': req.user._id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // Recalculate scores
    await law.updateAllScores();

    const populatedLaw = await Law.findById(law._id)
      .populate('submittedBy', 'name username')
      .populate('verifiedBy', 'name username')
      .populate('relatedBeliefs.beliefId', 'statement conclusionScore');

    res.status(200).json({
      success: true,
      data: populatedLaw,
    });
  } catch (error) {
    console.error('Error in updateLaw:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating law',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete law
 * @route   DELETE /api/laws/:id
 * @access  Private (Admin only)
 */
export const deleteLaw = async (req, res) => {
  try {
    const law = await Law.findById(req.params.id);

    if (!law) {
      return res.status(404).json({
        success: false,
        message: 'Law not found',
      });
    }

    // Only admins can delete laws
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete laws',
      });
    }

    // Remove law references from related beliefs
    if (law.relatedBeliefs && law.relatedBeliefs.length > 0) {
      for (const relation of law.relatedBeliefs) {
        try {
          const belief = await Belief.findById(relation.beliefId);
          if (belief) {
            if (belief.supportingLaws) {
              belief.supportingLaws = belief.supportingLaws.filter(
                lawId => lawId.toString() !== law._id.toString()
              );
            }
            if (belief.opposingLaws) {
              belief.opposingLaws = belief.opposingLaws.filter(
                lawId => lawId.toString() !== law._id.toString()
              );
            }
            await belief.save();
          }
        } catch (beliefError) {
          console.error('Error updating belief:', beliefError);
        }
      }
    }

    await law.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Law deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error in deleteLaw:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting law',
      error: error.message,
    });
  }
};

/**
 * @desc    Get laws for a specific belief
 * @route   GET /api/beliefs/:beliefId/laws
 * @access  Public
 */
export const getBeliefLaws = async (req, res) => {
  try {
    const { beliefId } = req.params;
    const { relationship } = req.query; // 'supports', 'opposes', or undefined for all

    // Build filter
    const filter = {
      'relatedBeliefs.beliefId': beliefId,
    };

    if (relationship) {
      filter['relatedBeliefs.relationship'] = relationship;
    }

    const laws = await Law.find(filter)
      .sort('-scores.overall')
      .populate('submittedBy', 'name username')
      .populate('verifiedBy', 'name username');

    // Separate laws by relationship
    const supportingLaws = [];
    const opposingLaws = [];
    const neutralLaws = [];

    laws.forEach(law => {
      const relation = law.relatedBeliefs.find(
        rb => rb.beliefId.toString() === beliefId
      );
      if (relation) {
        const lawWithRelation = {
          ...law.toObject(),
          relationshipToThisBelief: relation,
        };
        if (relation.relationship === 'supports') {
          supportingLaws.push(lawWithRelation);
        } else if (relation.relationship === 'opposes') {
          opposingLaws.push(lawWithRelation);
        } else {
          neutralLaws.push(lawWithRelation);
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        supporting: supportingLaws,
        opposing: opposingLaws,
        neutral: neutralLaws,
        totalCount: laws.length,
      },
    });
  } catch (error) {
    console.error('Error in getBeliefLaws:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching belief laws',
      error: error.message,
    });
  }
};

/**
 * @desc    Link a law to a belief
 * @route   POST /api/laws/:id/link-belief
 * @access  Private
 */
export const linkLawToBelief = async (req, res) => {
  try {
    const { beliefId, relationship, strength, notes } = req.body;

    if (!beliefId || !relationship) {
      return res.status(400).json({
        success: false,
        message: 'Please provide beliefId and relationship',
      });
    }

    // Verify belief exists
    const belief = await Belief.findById(beliefId);
    if (!belief) {
      return res.status(404).json({
        success: false,
        message: 'Belief not found',
      });
    }

    const law = await Law.findById(req.params.id);
    if (!law) {
      return res.status(404).json({
        success: false,
        message: 'Law not found',
      });
    }

    // Check if already linked
    const existingLink = law.relatedBeliefs.find(
      rb => rb.beliefId.toString() === beliefId
    );

    if (existingLink) {
      // Update existing link
      existingLink.relationship = relationship;
      existingLink.strength = strength || existingLink.strength;
      existingLink.notes = notes || existingLink.notes;
    } else {
      // Add new link
      law.relatedBeliefs.push({
        beliefId,
        relationship,
        strength: strength || 50,
        notes,
      });
    }

    await law.save();

    // Update belief's law references
    if (!belief.supportingLaws) belief.supportingLaws = [];
    if (!belief.opposingLaws) belief.opposingLaws = [];

    // Remove from both arrays first
    belief.supportingLaws = belief.supportingLaws.filter(
      lawId => lawId.toString() !== law._id.toString()
    );
    belief.opposingLaws = belief.opposingLaws.filter(
      lawId => lawId.toString() !== law._id.toString()
    );

    // Add to appropriate array
    if (relationship === 'supports') {
      belief.supportingLaws.push(law._id);
    } else if (relationship === 'opposes') {
      belief.opposingLaws.push(law._id);
    }

    await belief.save();

    const populatedLaw = await Law.findById(law._id)
      .populate('relatedBeliefs.beliefId', 'statement conclusionScore');

    res.status(200).json({
      success: true,
      data: populatedLaw,
    });
  } catch (error) {
    console.error('Error in linkLawToBelief:', error);
    res.status(400).json({
      success: false,
      message: 'Error linking law to belief',
      error: error.message,
    });
  }
};

/**
 * @desc    Unlink a law from a belief
 * @route   DELETE /api/laws/:id/unlink-belief/:beliefId
 * @access  Private
 */
export const unlinkLawFromBelief = async (req, res) => {
  try {
    const { id, beliefId } = req.params;

    const law = await Law.findById(id);
    if (!law) {
      return res.status(404).json({
        success: false,
        message: 'Law not found',
      });
    }

    // Remove belief from law's relatedBeliefs
    law.relatedBeliefs = law.relatedBeliefs.filter(
      rb => rb.beliefId.toString() !== beliefId
    );

    await law.save();

    // Remove law from belief's law arrays
    const belief = await Belief.findById(beliefId);
    if (belief) {
      if (belief.supportingLaws) {
        belief.supportingLaws = belief.supportingLaws.filter(
          lawId => lawId.toString() !== law._id.toString()
        );
      }
      if (belief.opposingLaws) {
        belief.opposingLaws = belief.opposingLaws.filter(
          lawId => lawId.toString() !== law._id.toString()
        );
      }
      await belief.save();
    }

    res.status(200).json({
      success: true,
      message: 'Law unlinked from belief successfully',
      data: law,
    });
  } catch (error) {
    console.error('Error in unlinkLawFromBelief:', error);
    res.status(500).json({
      success: false,
      message: 'Error unlinking law from belief',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify a law (admin/moderator only)
 * @route   POST /api/laws/:id/verify
 * @access  Private (Admin/Moderator)
 */
export const verifyLaw = async (req, res) => {
  try {
    const law = await Law.findById(req.params.id);

    if (!law) {
      return res.status(404).json({
        success: false,
        message: 'Law not found',
      });
    }

    law.verificationStatus = 'verified';
    law.verifiedBy = req.user._id;
    law.verifiedDate = Date.now();
    law.flags.needsVerification = false;

    await law.save();

    const populatedLaw = await Law.findById(law._id)
      .populate('submittedBy', 'name username')
      .populate('verifiedBy', 'name username');

    res.status(200).json({
      success: true,
      data: populatedLaw,
    });
  } catch (error) {
    console.error('Error in verifyLaw:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying law',
      error: error.message,
    });
  }
};

/**
 * @desc    Calculate scores for a law
 * @route   POST /api/laws/:id/calculate-scores
 * @access  Public
 */
export const calculateLawScores = async (req, res) => {
  try {
    const law = await Law.findById(req.params.id);

    if (!law) {
      return res.status(404).json({
        success: false,
        message: 'Law not found',
      });
    }

    await law.updateAllScores();

    res.status(200).json({
      success: true,
      data: {
        scores: law.scores,
      },
    });
  } catch (error) {
    console.error('Error in calculateLawScores:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating law scores',
      error: error.message,
    });
  }
};

/**
 * @desc    Get law statistics and analysis
 * @route   GET /api/laws/:id/analysis
 * @access  Public
 */
export const getLawAnalysis = async (req, res) => {
  try {
    const law = await Law.findById(req.params.id)
      .populate('relatedBeliefs.beliefId', 'statement conclusionScore category');

    if (!law) {
      return res.status(404).json({
        success: false,
        message: 'Law not found',
      });
    }

    // Calculate age
    const ageInYears = law.enactedDate
      ? (Date.now() - law.enactedDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
      : null;

    // Analyze related beliefs
    const beliefAnalysis = {
      totalBeliefs: law.relatedBeliefs.length,
      supporting: law.relatedBeliefs.filter(rb => rb.relationship === 'supports').length,
      opposing: law.relatedBeliefs.filter(rb => rb.relationship === 'opposes').length,
      neutral: law.relatedBeliefs.filter(rb => rb.relationship === 'neutral').length,
      averageStrength: law.relatedBeliefs.length > 0
        ? law.relatedBeliefs.reduce((sum, rb) => sum + rb.strength, 0) / law.relatedBeliefs.length
        : 0,
    };

    // Generate interpretation
    const interpretation = {
      coverage: getCoverageInterpretation(law.scores.coverage),
      enforcement: getEnforcementInterpretation(law.scores.enforcement),
      severity: getSeverityInterpretation(law.scores.severity),
      stability: getStabilityInterpretation(law.scores.stability),
      overall: getOverallInterpretation(law.scores.overall),
    };

    res.status(200).json({
      success: true,
      data: {
        law: law.getSummary(),
        scores: law.scores,
        interpretation,
        ageInYears: ageInYears ? Math.round(ageInYears * 10) / 10 : null,
        beliefAnalysis,
        publicSupport: law.publicSupport,
      },
    });
  } catch (error) {
    console.error('Error in getLawAnalysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching law analysis',
      error: error.message,
    });
  }
};

/**
 * @desc    Search laws by text
 * @route   GET /api/laws/search
 * @access  Public
 */
export const searchLaws = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query',
      });
    }

    const laws = await Law.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('submittedBy', 'name username')
      .populate('relatedBeliefs.beliefId', 'statement');

    const count = await Law.countDocuments({ $text: { $search: q } });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: laws,
    });
  } catch (error) {
    console.error('Error in searchLaws:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching laws',
      error: error.message,
    });
  }
};

// Helper functions for interpretations
function getCoverageInterpretation(score) {
  if (score >= 80) return 'Very broad coverage - applies to most of the relevant population';
  if (score >= 60) return 'Broad coverage - applies to a significant portion of the population';
  if (score >= 40) return 'Moderate coverage - applies to some of the population';
  if (score >= 20) return 'Limited coverage - applies to a small portion of the population';
  return 'Very limited coverage - applies to very few people';
}

function getEnforcementInterpretation(score) {
  if (score >= 80) return 'Strictly enforced - violations are consistently prosecuted';
  if (score >= 60) return 'Well enforced - most violations are prosecuted';
  if (score >= 40) return 'Moderately enforced - some violations are prosecuted';
  if (score >= 20) return 'Weakly enforced - few violations are prosecuted';
  return 'Rarely enforced - violations are seldom prosecuted';
}

function getSeverityInterpretation(score) {
  if (score >= 80) return 'Very severe penalties - includes significant prison time or major fines';
  if (score >= 60) return 'Severe penalties - includes substantial consequences';
  if (score >= 40) return 'Moderate penalties - includes meaningful but not extreme consequences';
  if (score >= 20) return 'Minor penalties - includes small fines or warnings';
  return 'Minimal penalties - very light consequences';
}

function getStabilityInterpretation(score) {
  if (score >= 80) return 'Very stable - long-established and uncontested';
  if (score >= 60) return 'Stable - well-established with few challenges';
  if (score >= 40) return 'Moderately stable - some challenges or recent changes';
  if (score >= 20) return 'Unstable - frequently challenged or recently enacted';
  return 'Very unstable - highly contested or recently changed';
}

function getOverallInterpretation(score) {
  if (score >= 80) return 'Strong legal framework - comprehensive, well-enforced, and stable';
  if (score >= 60) return 'Solid legal framework - generally effective with some limitations';
  if (score >= 40) return 'Moderate legal framework - has meaningful impact but significant gaps';
  if (score >= 20) return 'Weak legal framework - limited impact or enforcement';
  return 'Very weak legal framework - minimal practical effect';
}
