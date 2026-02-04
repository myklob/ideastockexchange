/**
 * Conflict Resolution API Routes
 *
 * Provides endpoints for automated conflict resolution between
 * supporters and opponents of beliefs.
 */

import express from 'express';
import ConflictResolution from '../models/ConflictResolution.js';
import User from '../models/User.js';
import {
  analyzeBeliefForConflicts,
  autoDetectAndCreateConflict,
  scanAllBeliefsForConflicts,
  getResolutionSuggestions
} from '../utils/conflictDetector.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/conflicts
 * Get all active conflicts
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      minEscalation,
      beliefId,
      limit = 50,
      page = 1
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    } else {
      // Default: only active conflicts
      query.status = { $nin: ['resolved', 'stalemate'] };
    }

    if (minEscalation) {
      query['intensity.escalationLevel'] = { $gte: parseInt(minEscalation) };
    }

    if (beliefId) {
      query.beliefId = beliefId;
    }

    const conflicts = await ConflictResolution.find(query)
      .populate('beliefId', 'statement category conclusionScore')
      .populate('supporters.userId', 'username reputation')
      .populate('opponents.userId', 'username reputation')
      .populate('deescalation.moderator', 'username')
      .sort({ 'intensity.escalationLevel': -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await ConflictResolution.countDocuments(query);

    res.json({
      conflicts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching conflicts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/conflicts/:id
 * Get specific conflict details
 */
router.get('/:id', async (req, res) => {
  try {
    const conflict = await ConflictResolution.findById(req.params.id)
      .populate('beliefId')
      .populate('supportingArguments')
      .populate('opposingArguments')
      .populate('supporters.userId', 'username reputation')
      .populate('opponents.userId', 'username reputation')
      .populate('deescalation.moderator', 'username')
      .populate('interventions.by', 'username role')
      .populate('communications.from', 'username')
      .populate('communications.to', 'username');

    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' });
    }

    res.json(conflict);
  } catch (error) {
    console.error('Error fetching conflict:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conflicts/detect/:beliefId
 * Manually trigger conflict detection for a belief
 */
router.post('/detect/:beliefId', async (req, res) => {
  try {
    const analysis = await analyzeBeliefForConflicts(req.params.beliefId);

    res.json({
      analysis,
      message: analysis.hasConflict
        ? 'Conflict detected'
        : 'No significant conflict detected'
    });
  } catch (error) {
    console.error('Error detecting conflict:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conflicts/create/:beliefId
 * Create conflict resolution workflow for a belief
 */
router.post('/create/:beliefId', auth, async (req, res) => {
  try {
    const conflict = await autoDetectAndCreateConflict(req.params.beliefId);

    if (!conflict) {
      return res.status(400).json({
        error: 'No significant conflict detected for this belief'
      });
    }

    res.status(201).json({
      conflict,
      message: 'Conflict resolution workflow created'
    });
  } catch (error) {
    console.error('Error creating conflict:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conflicts/scan
 * Scan all beliefs for conflicts (admin only)
 */
router.post('/scan', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.userId);

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { category } = req.body;

    const conflicts = await scanAllBeliefsForConflicts({ category });

    res.json({
      message: `Scanned beliefs and detected ${conflicts.length} conflicts`,
      conflicts
    });
  } catch (error) {
    console.error('Error scanning for conflicts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/conflicts/:id/suggestions
 * Get resolution suggestions for a conflict
 */
router.get('/:id/suggestions', async (req, res) => {
  try {
    const suggestions = await getResolutionSuggestions(req.params.id);
    res.json(suggestions);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/conflicts/:id/advance
 * Advance to next step in resolution workflow
 */
router.put('/:id/advance', auth, async (req, res) => {
  try {
    const { outcome } = req.body;

    const conflict = await ConflictResolution.findById(req.params.id);
    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' });
    }

    const nextStep = conflict.advanceWorkflow(req.user.userId, outcome);

    await conflict.save();

    res.json({
      conflict,
      nextStep,
      message: nextStep > conflict.workflow.totalSteps
        ? 'Workflow completed'
        : `Advanced to step ${nextStep}`
    });
  } catch (error) {
    console.error('Error advancing workflow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conflicts/:id/communicate
 * Add communication to conflict (regulated dialogue)
 */
router.post('/:id/communicate', auth, async (req, res) => {
  try {
    const { message, to, communicationType, emotionalTone } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const conflict = await ConflictResolution.findById(req.params.id);
    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' });
    }

    // Check if cooling off period is active
    if (!conflict.isCoolingOffOver()) {
      return res.status(403).json({
        error: 'Cooling-off period is active',
        endsAt: conflict.deescalation.coolingOffPeriod.endsAt
      });
    }

    conflict.communications.push({
      from: req.user.userId,
      to: to || [],
      message,
      communicationType: communicationType || 'normal',
      emotionalTone: emotionalTone || 'constructive'
    });

    conflict.metrics.messagesExchanged++;

    await conflict.save();

    res.json({
      conflict,
      message: 'Communication added'
    });
  } catch (error) {
    console.error('Error adding communication:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conflicts/:id/propose-solution
 * Propose a solution (IBR or Collaboration workflow)
 */
router.post('/:id/propose-solution', auth, async (req, res) => {
  try {
    const { description, meetsInterestsOf, benefitsSupporters, benefitsOpponents } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Solution description is required' });
    }

    const conflict = await ConflictResolution.findById(req.params.id);
    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' });
    }

    if (conflict.resolutionTemplate === 'ibr') {
      // IBR workflow
      conflict.ibrData.proposedSolutions.push({
        description,
        proposedBy: req.user.userId,
        meetsInterestsOf: meetsInterestsOf || []
      });
    } else if (conflict.resolutionTemplate === 'collaborating') {
      // Collaboration workflow
      conflict.collaborationData.brainstormedSolutions.push({
        solution: description,
        createdBy: req.user.userId,
        benefitsSupporters,
        benefitsOpponents
      });
    } else {
      return res.status(400).json({
        error: `Solution proposals not applicable for ${conflict.resolutionTemplate} template`
      });
    }

    conflict.metrics.solutionsProposed++;

    await conflict.save();

    res.json({
      conflict,
      message: 'Solution proposed'
    });
  } catch (error) {
    console.error('Error proposing solution:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conflicts/:id/vote-solution
 * Vote on a proposed solution
 */
router.post('/:id/vote-solution/:solutionId', auth, async (req, res) => {
  try {
    const { vote } = req.body; // 'for' or 'against'

    const conflict = await ConflictResolution.findById(req.params.id);
    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' });
    }

    let solution;

    if (conflict.resolutionTemplate === 'ibr') {
      solution = conflict.ibrData.proposedSolutions.id(req.params.solutionId);
      if (!solution) {
        return res.status(404).json({ error: 'Solution not found' });
      }

      if (vote === 'for') {
        if (!solution.supportedBy.includes(req.user.userId)) {
          solution.supportedBy.push(req.user.userId);
          solution.score++;
        }
      } else {
        if (!solution.opposedBy.includes(req.user.userId)) {
          solution.opposedBy.push(req.user.userId);
          solution.score--;
        }
      }
    } else if (conflict.resolutionTemplate === 'collaborating') {
      solution = conflict.collaborationData.brainstormedSolutions.id(req.params.solutionId);
      if (!solution) {
        return res.status(404).json({ error: 'Solution not found' });
      }

      if (vote === 'for') {
        solution.votesFor++;
      } else {
        solution.votesAgainst++;
      }
    }

    await conflict.save();

    res.json({
      conflict,
      message: 'Vote recorded'
    });
  } catch (error) {
    console.error('Error voting on solution:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conflicts/:id/concession
 * Propose a concession (Compromise workflow)
 */
router.post('/:id/concession', auth, async (req, res) => {
  try {
    const { concession, party } = req.body;

    if (!concession || !party) {
      return res.status(400).json({ error: 'Concession and party are required' });
    }

    const conflict = await ConflictResolution.findById(req.params.id);
    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' });
    }

    if (conflict.resolutionTemplate !== 'compromising') {
      return res.status(400).json({
        error: 'Concessions only applicable for compromising template'
      });
    }

    conflict.compromiseData.concessions.push({
      party,
      concession,
      acceptedBy: []
    });

    await conflict.save();

    res.json({
      conflict,
      message: 'Concession proposed'
    });
  } catch (error) {
    console.error('Error proposing concession:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conflicts/:id/accept-concession
 * Accept a proposed concession
 */
router.post('/:id/accept-concession/:concessionIndex', auth, async (req, res) => {
  try {
    const conflict = await ConflictResolution.findById(req.params.id);
    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' });
    }

    const concessionIndex = parseInt(req.params.concessionIndex);
    const concession = conflict.compromiseData.concessions[concessionIndex];

    if (!concession) {
      return res.status(404).json({ error: 'Concession not found' });
    }

    if (!concession.acceptedBy.includes(req.user.userId)) {
      concession.acceptedBy.push(req.user.userId);
    }

    await conflict.save();

    res.json({
      conflict,
      message: 'Concession accepted'
    });
  } catch (error) {
    console.error('Error accepting concession:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conflicts/:id/cooling-off
 * Start cooling-off period (moderator only)
 */
router.post('/:id/cooling-off', auth, async (req, res) => {
  try {
    const { hours = 24 } = req.body;

    // Check if user is moderator or admin
    const user = await User.findById(req.user.userId);

    if (!['moderator', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Moderator access required' });
    }

    const conflict = await ConflictResolution.findById(req.params.id);
    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' });
    }

    conflict.startCoolingOff(hours);
    conflict.deescalation.moderator = req.user.userId;

    conflict.interventions.push({
      by: req.user.userId,
      role: user.role,
      action: 'Started cooling-off period',
      reason: `${hours}-hour pause to de-escalate conflict`
    });

    await conflict.save();

    res.json({
      conflict,
      message: `Cooling-off period started for ${hours} hours`
    });
  } catch (error) {
    console.error('Error starting cooling-off:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/conflicts/:id/resolve
 * Mark conflict as resolved
 */
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const {
      resolutionType,
      finalAgreement,
      satisfactionLevel,
      feedback
    } = req.body;

    const conflict = await ConflictResolution.findById(req.params.id)
      .populate('beliefId');

    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' });
    }

    conflict.status = 'resolved';
    conflict.resolution.achieved = true;
    conflict.resolution.resolutionType = resolutionType;
    conflict.resolution.finalAgreement = finalAgreement;
    conflict.resolution.resolvedAt = new Date();
    conflict.resolution.believabilityAfterResolution = conflict.beliefId.conclusionScore;

    if (satisfactionLevel) {
      conflict.resolution.participantSatisfaction.push({
        userId: req.user.userId,
        satisfactionLevel,
        feedback
      });
    }

    // Calculate metrics
    const timeToResolution = (new Date() - conflict.createdAt) / (1000 * 60 * 60); // hours
    conflict.metrics.timeToResolution = timeToResolution;
    conflict.metrics.consensusReached = resolutionType === 'consensus';

    conflict.logAutomatedAction(
      'Conflict resolved',
      `User ${req.user.userId}`,
      `Resolution type: ${resolutionType}`
    );

    await conflict.save();

    res.json({
      conflict,
      message: 'Conflict marked as resolved'
    });
  } catch (error) {
    console.error('Error resolving conflict:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/conflicts/stats/summary
 * Get conflict resolution statistics
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await ConflictResolution.countDocuments();
    const active = await ConflictResolution.countDocuments({
      status: { $nin: ['resolved', 'stalemate'] }
    });
    const resolved = await ConflictResolution.countDocuments({ status: 'resolved' });

    const avgResolutionTime = await ConflictResolution.aggregate([
      { $match: { 'metrics.timeToResolution': { $exists: true } } },
      { $group: { _id: null, avgTime: { $avg: '$metrics.timeToResolution' } } }
    ]);

    const byTemplate = await ConflictResolution.aggregate([
      { $group: { _id: '$resolutionTemplate', count: { $sum: 1 } } }
    ]);

    const byEscalation = await ConflictResolution.aggregate([
      {
        $group: {
          _id: '$intensity.escalationLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      total,
      active,
      resolved,
      avgResolutionTimeHours: avgResolutionTime[0]?.avgTime || 0,
      byTemplate,
      byEscalation
    });
  } catch (error) {
    console.error('Error getting conflict stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
