const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router  = express.Router();
const db      = require('../services/db');
const { computeTotalInfluence } = require('../services/scoring');

// GET /api/stakeholders  — list all, optional ?type= filter
router.get('/', (req, res) => {
  let items = db.findAll('stakeholders');
  if (req.query.type) {
    items = items.filter(s => s.type === req.query.type);
  }
  // Sort by totalInfluence desc by default
  items.sort((a, b) => (b.power?.totalInfluence || 0) - (a.power?.totalInfluence || 0));
  res.json({ stakeholders: items, count: items.length });
});

// GET /api/stakeholders/:id
router.get('/:id', (req, res) => {
  const item = db.findById('stakeholders', 'stakeholderId', req.params.id);
  if (!item) return res.status(404).json({ error: 'Stakeholder not found' });
  res.json(item);
});

// POST /api/stakeholders
router.post('/', (req, res) => {
  const body = req.body;
  if (!body.name) return res.status(400).json({ error: 'name is required' });

  const power = body.power || {};
  power.totalInfluence = computeTotalInfluence(power);

  const item = {
    stakeholderId:          `STK-${uuidv4().slice(0, 8).toUpperCase()}`,
    name:                   body.name,
    type:                   body.type || 'Population',
    description:            body.description || '',
    populationEstimate:     body.populationEstimate || 0,
    populationFraction:     body.populationFraction || 0,
    representationConfidence: body.representationConfidence || 50,
    power,
    powerDescription:       body.powerDescription || '',
    linkedConflictIds:      body.linkedConflictIds || [],
    createdAt:              new Date().toISOString(),
    updatedAt:              new Date().toISOString(),
    createdBy:              body.createdBy || 'user',
  };

  db.insert('stakeholders', 'stakeholderId', item);
  res.status(201).json(item);
});

// PATCH /api/stakeholders/:id
router.patch('/:id', (req, res) => {
  const updates = req.body;
  if (updates.power) {
    updates.power.totalInfluence = computeTotalInfluence(updates.power);
  }
  const updated = db.update('stakeholders', 'stakeholderId', req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'Stakeholder not found' });
  res.json(updated);
});

// DELETE /api/stakeholders/:id
router.delete('/:id', (req, res) => {
  const ok = db.remove('stakeholders', 'stakeholderId', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Stakeholder not found' });
  res.json({ deleted: req.params.id });
});

module.exports = router;
