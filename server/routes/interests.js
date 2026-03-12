const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router  = express.Router();
const db      = require('../services/db');
const { baselineValidity } = require('../services/scoring');
const { similarityScore }  = require('../services/clustering');

// GET /api/interests  — list all, optional ?maslowLevel= or ?tag= filter
router.get('/', (req, res) => {
  let items = db.findAll('interests');

  if (req.query.maslowLevel) {
    items = items.filter(i => i.maslowLevel === req.query.maslowLevel);
  }
  if (req.query.tag) {
    items = items.filter(i => (i.tags || []).includes(req.query.tag));
  }

  // Default sort: validity descending
  items.sort((a, b) => b.baseValidityScore - a.baseValidityScore);
  res.json({ interests: items, count: items.length });
});

// GET /api/interests/:id
router.get('/:id', (req, res) => {
  const item = db.findById('interests', 'interestId', req.params.id);
  if (!item) return res.status(404).json({ error: 'Interest not found' });
  res.json(item);
});

// GET /api/interests/search?q=text  — find similar interests (de-duplication)
router.get('/search/similar', (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'q param required' });

  const all = db.findAll('interests');
  const scored = all.map(interest => ({
    ...interest,
    similarityScore: similarityScore(q, interest.name + ' ' + (interest.semanticClusters || []).join(' ')),
  }));

  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  res.json({ results: scored.slice(0, 10) });
});

// POST /api/interests
router.post('/', (req, res) => {
  const body = req.body;
  if (!body.name)        return res.status(400).json({ error: 'name is required' });
  if (!body.maslowLevel) return res.status(400).json({ error: 'maslowLevel is required' });

  const item = {
    interestId:        `INT-${uuidv4().slice(0, 8).toUpperCase()}`,
    name:              body.name,
    description:       body.description || '',
    maslowLevel:       body.maslowLevel,
    baseValidityScore: body.baseValidityScore ?? baselineValidity(body.maslowLevel),
    semanticClusters:  body.semanticClusters || [],
    tags:              body.tags || [],
    createdAt:         new Date().toISOString(),
    updatedAt:         new Date().toISOString(),
    createdBy:         body.createdBy || 'user',
  };

  db.insert('interests', 'interestId', item);
  res.status(201).json(item);
});

// PATCH /api/interests/:id  — add cluster phrases, update scores
router.patch('/:id', (req, res) => {
  const existing = db.findById('interests', 'interestId', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Interest not found' });

  const updates = { ...req.body };

  // Append cluster phrases rather than replacing
  if (updates.addClusters) {
    updates.semanticClusters = [
      ...new Set([...(existing.semanticClusters || []), ...updates.addClusters])
    ];
    delete updates.addClusters;
  }

  const updated = db.update('interests', 'interestId', req.params.id, updates);
  res.json(updated);
});

// DELETE /api/interests/:id
router.delete('/:id', (req, res) => {
  const ok = db.remove('interests', 'interestId', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Interest not found' });
  res.json({ deleted: req.params.id });
});

module.exports = router;
