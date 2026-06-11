/**
 * /api/analysis  — cross-cutting analytical endpoints
 *
 * These endpoints power the ISE dashboard view:
 * conflict summary, top shared interests, stakeholder power comparison,
 * and the NLP-powered brainstorm intake.
 */

const express = require('express');
const router  = express.Router();
const db      = require('../services/db');
const { rankInterests, conflictSummaryStats, compositeScore } = require('../services/scoring');
const { findSharedHighValueInterests, maximumSharedValidity, identifyTradeoffs } = require('../services/compromise');
const { clusterSubmissions, findDuplicates, suggestCanonicalName } = require('../services/clustering');

// ---------------------------------------------------------------------------
// GET /api/analysis/conflict/:id/full-profile
// ---------------------------------------------------------------------------
router.get('/conflict/:id/full-profile', async (req, res) => {
  try {
    const conflictId = req.params.id;
    const sortBy     = req.query.sort || 'composite';

    const [conflict, stakeholderData, interestRegistry] = await Promise.all([
      db.findById('conflicts',    'conflictId',    conflictId),
      db.findAll('stakeholders'),
      db.findAll('interests'),
    ]);

    if (!conflict) return res.status(404).json({ error: 'Conflict not found' });

    const stkMap = Object.fromEntries(stakeholderData.map(s => [s.stakeholderId, s]));
    const intMap = Object.fromEntries(interestRegistry.map(i => [i.interestId, i]));

    const enrichedMappings = (conflict.stakeholderMappings || []).map(sm => {
      const stk = stkMap[sm.stakeholderId] || {};
      const rankedInterests = rankInterests(
        (sm.appliedInterests || []).map(ai => ({
          ...ai,
          compositeScore: compositeScore(ai.contextualValidityScore, ai.linkageAccuracy),
          interestName:   intMap[ai.interestId]?.name || ai.interestId,
          maslowLevel:    intMap[ai.interestId]?.maslowLevel || 'SAFETY',
          description:    intMap[ai.interestId]?.description || '',
        })),
        sortBy
      );

      return {
        stakeholderId:            sm.stakeholderId,
        stakeholderName:          stk.name || sm.stakeholderId,
        type:                     stk.type || '',
        description:              stk.description || '',
        populationEstimate:       stk.populationEstimate || 0,
        populationFraction:       stk.populationFraction || 0,
        representationConfidence: stk.representationConfidence || 50,
        power:                    stk.power || {},
        powerDescription:         stk.powerDescription || '',
        position:                 sm.position,
        role:                     sm.role,
        interests:                rankedInterests,
      };
    });

    const sharedInterests = findSharedHighValueInterests(
      conflict.stakeholderMappings || [],
      interestRegistry
    );
    const mergedShared = sharedInterests.map(s => {
      const existing = (conflict.sharedInterests || []).find(e => e.interestId === s.interestId);
      const extra    = existing ? existing.bridgingProposals : [];
      const interest = intMap[s.interestId] || {};
      return {
        ...s,
        interestDescription: interest.description || '',
        maslowLevel:         interest.maslowLevel || 'SAFETY',
        bridgingProposals:   [...new Set([...s.bridgingProposals, ...extra])],
      };
    });

    const tradeoffs = identifyTradeoffs(conflict.stakeholderMappings || []).map(t => ({
      ...t,
      interestAName: intMap[t.interestA]?.name || t.interestA,
      interestBName: intMap[t.interestB]?.name || t.interestB,
    }));

    const brainstorm     = conflict.rawBrainstorm || [];
    const pendingCount   = brainstorm.filter(b => b.status === 'pending').length;
    const clusteredCount = brainstorm.filter(b => b.status === 'clustered').length;
    const duplicates     = findDuplicates(brainstorm);

    const summaryStats = conflictSummaryStats(conflict.stakeholderMappings || []);

    res.json({
      conflictId:        conflict.conflictId,
      name:              conflict.name,
      description:       conflict.description,
      parentTopic:       conflict.parentTopic,
      importanceScore:   conflict.importanceScore,
      controversyScore:  conflict.controversyScore,
      evidenceDepth:     conflict.evidenceDepth,
      summaryStats,
      resolutionScore:   maximumSharedValidity(mergedShared),
      stakeholderMappings: enrichedMappings,
      sharedInterests:   mergedShared,
      tradeoffs,
      evidenceLedger:    conflict.evidenceLedger || [],
      brainstormStats:   { total: brainstorm.length, pending: pendingCount, clustered: clusteredCount, duplicateGroups: duplicates.length },
      sortBy,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/analysis/interests/maslow-distribution
// ---------------------------------------------------------------------------
router.get('/interests/maslow-distribution', async (req, res) => {
  try {
    const interestRegistry = await db.findAll('interests');
    const distribution = {};

    for (const i of interestRegistry) {
      if (!distribution[i.maslowLevel]) {
        distribution[i.maslowLevel] = { count: 0, avgValidity: 0, interests: [] };
      }
      distribution[i.maslowLevel].count++;
      distribution[i.maslowLevel].interests.push({ id: i.interestId, name: i.name, score: i.baseValidityScore });
    }

    for (const level of Object.keys(distribution)) {
      const scores = distribution[level].interests.map(i => i.score);
      distribution[level].avgValidity = Math.round(scores.reduce((s, x) => s + x, 0) / scores.length);
    }

    res.json(distribution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/analysis/cluster-batch
// ---------------------------------------------------------------------------
router.post('/cluster-batch', async (req, res) => {
  try {
    const { submissions } = req.body;
    if (!Array.isArray(submissions)) return res.status(400).json({ error: 'submissions array required' });

    const interestRegistry = await db.findAll('interests');
    const threshold        = req.body.threshold || 45;

    const results    = clusterSubmissions(submissions, interestRegistry, threshold);
    const duplicates = findDuplicates(submissions, req.body.dupThreshold || 70);

    const unclustered = results.filter(r => r.status === 'pending');
    const suggestion  = unclustered.length
      ? suggestCanonicalName(unclustered.map(r => r.rawText))
      : null;

    res.json({ results, duplicates, suggestedCanonicalName: suggestion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/analysis/conflict/:id/power-comparison
// ---------------------------------------------------------------------------
router.get('/conflict/:id/power-comparison', async (req, res) => {
  try {
    const [conflict, stakeholderData] = await Promise.all([
      db.findById('conflicts', 'conflictId', req.params.id),
      db.findAll('stakeholders'),
    ]);
    if (!conflict) return res.status(404).json({ error: 'Conflict not found' });

    const stkMap = Object.fromEntries(stakeholderData.map(s => [s.stakeholderId, s]));

    const comparison = (conflict.stakeholderMappings || []).map(sm => {
      const stk = stkMap[sm.stakeholderId] || {};
      return {
        stakeholderId:            sm.stakeholderId,
        name:                     stk.name || sm.stakeholderId,
        position:                 sm.position,
        power:                    stk.power || {},
        populationFraction:       stk.populationFraction || 0,
        representationConfidence: stk.representationConfidence || 50,
      };
    });

    comparison.sort((a, b) => (b.power.totalInfluence || 0) - (a.power.totalInfluence || 0));
    res.json({ conflictId: req.params.id, comparison });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
