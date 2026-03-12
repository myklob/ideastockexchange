const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router  = express.Router();
const db      = require('../services/db');
const { computeTotalInfluence } = require('../services/scoring');

// GET /api/stakeholders  — list all, optional ?type= filter
router.get('/', async (req, res) => {
  try {
    let items = await db.findAll('stakeholders');
    if (req.query.type) {
      items = items.filter(s => s.type === req.query.type);
    }
    items.sort((a, b) => (b.power?.totalInfluence || 0) - (a.power?.totalInfluence || 0));
    res.json({ stakeholders: items, count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stakeholders/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await db.findById('stakeholders', 'stakeholderId', req.params.id);
    if (!item) return res.status(404).json({ error: 'Stakeholder not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stakeholders
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    if (!body.name) return res.status(400).json({ error: 'name is required' });

    const power = body.power || {};
    power.totalInfluence = computeTotalInfluence(power);

    const item = {
      stakeholderId:            `STK-${uuidv4().slice(0, 8).toUpperCase()}`,
      name:                     body.name,
      type:                     body.type || 'Population',
      description:              body.description || '',
      populationEstimate:       body.populationEstimate || 0,
      populationFraction:       body.populationFraction || 0,
      representationConfidence: body.representationConfidence || 50,
      power,
      powerDescription:         body.powerDescription || '',
      linkedConflictIds:        body.linkedConflictIds || [],
      createdAt:                new Date().toISOString(),
      updatedAt:                new Date().toISOString(),
      createdBy:                body.createdBy || 'user',
    };

    await db.insert('stakeholders', 'stakeholderId', item);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/stakeholders/:id
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    if (updates.power) {
      updates.power.totalInfluence = computeTotalInfluence(updates.power);
    }
    const updated = await db.update('stakeholders', 'stakeholderId', req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'Stakeholder not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/stakeholders/:id
router.delete('/:id', async (req, res) => {
  try {
    const ok = await db.remove('stakeholders', 'stakeholderId', req.params.id);
    if (!ok) return res.status(404).json({ error: 'Stakeholder not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
