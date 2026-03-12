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
// The single endpoint powering the main Stakeholder Analysis Template page.
// Returns everything needed to render the full ISE analysis view.
// ---------------------------------------------------------------------------
router.get('/conflict/:id/full-profile', (req, res) => {
  const conflictId = req.params.id;
  const sortBy     = req.query.sort || 'composite';  // validity|linkage|composite

  const conflict         = db.findById('conflicts',    'conflictId',    conflictId);
  const stakeholderData  = db.findAll('stakeholders');
  const interestRegistry = db.findAll('interests');

  if (!conflict) return res.status(404).json({ error: 'Conflict not found' });

  // --- Build stakeholder lookup map ---
  const stkMap = Object.fromEntries(stakeholderData.map(s => [s.stakeholderId, s]));
  const intMap = Object.fromEntries(interestRegistry.map(i => [i.interestId, i]));

  // --- Enrich each stakeholder mapping ---
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
      stakeholderId:          sm.stakeholderId,
      stakeholderName:        stk.name || sm.stakeholderId,
      type:                   stk.type || '',
      description:            stk.description || '',
      populationEstimate:     stk.populationEstimate || 0,
      populationFraction:     stk.populationFraction || 0,
      representationConfidence: stk.representationConfidence || 50,
      power:                  stk.power || {},
      powerDescription:       stk.powerDescription || '',
      position:               sm.position,
      role:                   sm.role,
      interests:              rankedInterests,
    };
  });

  // --- Shared interests ---
  const sharedInterests = findSharedHighValueInterests(
    conflict.stakeholderMappings || [],
    interestRegistry
  );
  // Merge human-authored bridging proposals
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

  // --- Tradeoffs ---
  const tradeoffs = identifyTradeoffs(conflict.stakeholderMappings || []).map(t => ({
    ...t,
    interestAName: intMap[t.interestA]?.name || t.interestA,
    interestBName: intMap[t.interestB]?.name || t.interestB,
  }));

  // --- Brainstorm queue stats ---
  const brainstorm      = conflict.rawBrainstorm || [];
  const pendingCount    = brainstorm.filter(b => b.status === 'pending').length;
  const clusteredCount  = brainstorm.filter(b => b.status === 'clustered').length;
  const duplicates      = findDuplicates(brainstorm);

  // --- Summary stats ---
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
});

// ---------------------------------------------------------------------------
// GET /api/analysis/interests/maslow-distribution
// How interests are distributed across Maslow levels for a conflict.
// ---------------------------------------------------------------------------
router.get('/interests/maslow-distribution', (req, res) => {
  const interestRegistry = db.findAll('interests');
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
});

// ---------------------------------------------------------------------------
// POST /api/analysis/cluster-batch
// Run clustering on a batch of raw text submissions against the interest registry.
// ---------------------------------------------------------------------------
router.post('/cluster-batch', (req, res) => {
  const { submissions } = req.body;
  if (!Array.isArray(submissions)) return res.status(400).json({ error: 'submissions array required' });

  const interestRegistry = db.findAll('interests');
  const threshold        = req.body.threshold || 45;

  const results    = clusterSubmissions(submissions, interestRegistry, threshold);
  const duplicates = findDuplicates(submissions, req.body.dupThreshold || 70);

  // For unclustered groups, suggest a canonical name
  const unclustered = results.filter(r => r.status === 'pending');
  const suggestion  = unclustered.length
    ? suggestCanonicalName(unclustered.map(r => r.rawText))
    : null;

  res.json({ results, duplicates, suggestedCanonicalName: suggestion });
});

// ---------------------------------------------------------------------------
// GET /api/analysis/stakeholders/power-comparison
// Compare power profiles of all stakeholders for a given conflict.
// ---------------------------------------------------------------------------
router.get('/conflict/:id/power-comparison', (req, res) => {
  const conflict = db.findById('conflicts', 'conflictId', req.params.id);
  if (!conflict) return res.status(404).json({ error: 'Conflict not found' });

  const stakeholderData = db.findAll('stakeholders');
  const stkMap = Object.fromEntries(stakeholderData.map(s => [s.stakeholderId, s]));

  const comparison = (conflict.stakeholderMappings || []).map(sm => {
    const stk = stkMap[sm.stakeholderId] || {};
    return {
      stakeholderId:   sm.stakeholderId,
      name:            stk.name || sm.stakeholderId,
      position:        sm.position,
      power:           stk.power || {},
      populationFraction: stk.populationFraction || 0,
      representationConfidence: stk.representationConfidence || 50,
    };
  });

  comparison.sort((a, b) => (b.power.totalInfluence || 0) - (a.power.totalInfluence || 0));
  res.json({ conflictId: req.params.id, comparison });
});

module.exports = router;
