const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router  = express.Router();
const db      = require('../services/db');
const { rankInterests, conflictSummaryStats, compositeScore } = require('../services/scoring');
const { findSharedHighValueInterests, maximumSharedValidity, identifyTradeoffs } = require('../services/compromise');
const { clusterSubmissions, findDuplicates } = require('../services/clustering');

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function enrichConflict(conflict, interestRegistry) {
  // Recompute compositeScore on every stakeholder mapping's interests
  conflict.stakeholderMappings = (conflict.stakeholderMappings || []).map(sm => ({
    ...sm,
    appliedInterests: (sm.appliedInterests || []).map(ai => ({
      ...ai,
      compositeScore: compositeScore(ai.contextualValidityScore, ai.linkageAccuracy),
    })),
  }));

  // Recompute shared interests
  const shared = findSharedHighValueInterests(
    conflict.stakeholderMappings,
    interestRegistry
  );
  // Merge with any human-authored bridging proposals
  conflict.sharedInterests = shared.map(s => {
    const existing = (conflict.sharedInterests || []).find(e => e.interestId === s.interestId);
    return {
      ...s,
      bridgingProposals: [
        ...s.bridgingProposals,
        ...(existing ? existing.bridgingProposals : []),
      ],
    };
  });

  conflict.summaryStats = conflictSummaryStats(conflict.stakeholderMappings);
  conflict.tradeoffs    = identifyTradeoffs(conflict.stakeholderMappings);
  conflict.resolutionScore = maximumSharedValidity(conflict.sharedInterests);

  return conflict;
}

// ---------------------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------------------

// GET /api/conflicts
router.get('/', (req, res) => {
  const interestRegistry = db.findAll('interests');
  let items = db.findAll('conflicts');

  if (req.query.parentTopic) {
    items = items.filter(c => c.parentTopic === req.query.parentTopic);
  }

  items = items.map(c => enrichConflict(c, interestRegistry));
  res.json({ conflicts: items, count: items.length });
});

// GET /api/conflicts/:id
router.get('/:id', (req, res) => {
  const interestRegistry = db.findAll('interests');
  const item = db.findById('conflicts', 'conflictId', req.params.id);
  if (!item) return res.status(404).json({ error: 'Conflict not found' });
  res.json(enrichConflict(item, interestRegistry));
});

// GET /api/conflicts/:id/interests?sort=validity|linkage|composite&position=Supporter|Opponent
// Returns ranked interest profile for a specific conflict
router.get('/:id/interests', (req, res) => {
  const interestRegistry = db.findAll('interests');
  const conflict = db.findById('conflicts', 'conflictId', req.params.id);
  if (!conflict) return res.status(404).json({ error: 'Conflict not found' });

  const sortBy   = req.query.sort     || 'composite';
  const position = req.query.position || null;

  let mappings = conflict.stakeholderMappings || [];
  if (position) mappings = mappings.filter(sm => sm.position === position);

  const result = mappings.map(sm => {
    const stakeholder = db.findById('stakeholders', 'stakeholderId', sm.stakeholderId);
    const ranked = rankInterests(sm.appliedInterests || [], sortBy).map(ai => {
      const interest = interestRegistry.find(i => i.interestId === ai.interestId);
      return {
        ...ai,
        compositeScore: compositeScore(ai.contextualValidityScore, ai.linkageAccuracy),
        interestName:   interest ? interest.name : ai.interestId,
        maslowLevel:    interest ? interest.maslowLevel : 'SAFETY',
        description:    interest ? interest.description : '',
      };
    });
    return {
      stakeholderId:   sm.stakeholderId,
      stakeholderName: stakeholder ? stakeholder.name : sm.stakeholderId,
      position:        sm.position,
      role:            sm.role,
      interests:       ranked,
    };
  });

  res.json({ conflictId: req.params.id, sortBy, mappings: result });
});

// POST /api/conflicts
router.post('/', (req, res) => {
  const body = req.body;
  if (!body.name) return res.status(400).json({ error: 'name is required' });

  const item = {
    conflictId:          `CFL-${uuidv4().slice(0, 8).toUpperCase()}`,
    name:                body.name,
    description:         body.description || '',
    parentTopic:         body.parentTopic || '',
    spectrumMin:         body.spectrumMin ?? -100,
    spectrumMax:         body.spectrumMax ?? 100,
    importanceScore:     body.importanceScore || 0,
    controversyScore:    body.controversyScore || 0,
    evidenceDepth:       body.evidenceDepth || 'Low',
    stakeholderMappings: body.stakeholderMappings || [],
    sharedInterests:     [],
    rawBrainstorm:       [],
    evidenceLedger:      [],
    createdAt:           new Date().toISOString(),
    updatedAt:           new Date().toISOString(),
    createdBy:           body.createdBy || 'user',
  };

  db.insert('conflicts', 'conflictId', item);
  res.status(201).json(item);
});

// POST /api/conflicts/:id/brainstorm  — submit a raw interest idea
router.post('/:id/brainstorm', (req, res) => {
  const conflict = db.findById('conflicts', 'conflictId', req.params.id);
  if (!conflict) return res.status(404).json({ error: 'Conflict not found' });

  const { rawText, submittedBy } = req.body;
  if (!rawText) return res.status(400).json({ error: 'rawText is required' });

  const interestRegistry = db.findAll('interests');
  const submission = {
    submissionId: `SUB-${uuidv4().slice(0, 8).toUpperCase()}`,
    rawText,
    submittedBy:  submittedBy || 'anonymous',
    submittedAt:  new Date().toISOString(),
    clusteredTo:  null,
    similarityScore: 0,
    status:       'pending',
  };

  // Attempt auto-clustering
  const [clustered] = clusterSubmissions([submission], interestRegistry, 45);
  submission.clusteredTo    = clustered.clusteredTo;
  submission.similarityScore = clustered.similarityScore;
  submission.status         = clustered.status;

  const brainstorm = [...(conflict.rawBrainstorm || []), submission];
  db.update('conflicts', 'conflictId', req.params.id, { rawBrainstorm: brainstorm });

  res.status(201).json(submission);
});

// GET /api/conflicts/:id/brainstorm  — view queue, check for duplicates
router.get('/:id/brainstorm', (req, res) => {
  const conflict = db.findById('conflicts', 'conflictId', req.params.id);
  if (!conflict) return res.status(404).json({ error: 'Conflict not found' });

  const submissions = conflict.rawBrainstorm || [];
  const duplicates  = findDuplicates(submissions);

  res.json({ submissions, duplicates, count: submissions.length });
});

// POST /api/conflicts/:id/stakeholder-mapping  — add stakeholder + interests to conflict
router.post('/:id/stakeholder-mapping', (req, res) => {
  const conflict = db.findById('conflicts', 'conflictId', req.params.id);
  if (!conflict) return res.status(404).json({ error: 'Conflict not found' });

  const body = req.body;
  if (!body.stakeholderId) return res.status(400).json({ error: 'stakeholderId required' });

  const mapping = {
    stakeholderId:   body.stakeholderId,
    position:        body.position || 'Neutral',
    role:            body.role || '',
    appliedInterests: (body.appliedInterests || []).map(ai => ({
      ...ai,
      compositeScore: compositeScore(ai.contextualValidityScore || 50, ai.linkageAccuracy || 50),
    })),
  };

  const mappings = [...(conflict.stakeholderMappings || [])];
  const existingIdx = mappings.findIndex(m => m.stakeholderId === body.stakeholderId);
  if (existingIdx >= 0) {
    mappings[existingIdx] = mapping;  // replace
  } else {
    mappings.push(mapping);
  }

  db.update('conflicts', 'conflictId', req.params.id, { stakeholderMappings: mappings });

  // Re-fetch and enrich
  const updated = db.findById('conflicts', 'conflictId', req.params.id);
  const interestRegistry = db.findAll('interests');
  res.json(enrichConflict(updated, interestRegistry));
});

// POST /api/conflicts/:id/evidence  — add an evidence entry to the ledger
router.post('/:id/evidence', (req, res) => {
  const conflict = db.findById('conflicts', 'conflictId', req.params.id);
  if (!conflict) return res.status(404).json({ error: 'Conflict not found' });

  const body = req.body;
  if (!body.claim) return res.status(400).json({ error: 'claim is required' });

  const entry = {
    evidenceId:   `EVD-${uuidv4().slice(0, 8).toUpperCase()}`,
    claim:        body.claim,
    side:         body.side || 'neutral',
    source:       body.source || '',
    tier:         body.tier || 'T6',
    year:         body.year || new Date().getFullYear(),
    qualityScore: body.qualityScore || 50,
    url:          body.url || '',
    finding:      body.finding || '',
  };

  const ledger = [...(conflict.evidenceLedger || []), entry];
  db.update('conflicts', 'conflictId', req.params.id, { evidenceLedger: ledger });
  res.status(201).json(entry);
});

module.exports = router;
