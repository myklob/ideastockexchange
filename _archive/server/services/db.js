/**
 * ISE Database Layer — PostgreSQL via node-postgres (pg)
 *
 * Exposes the same findAll / findById / insert / update / remove API as the
 * previous file-based implementation so existing route handlers work unchanged
 * (except they now use async/await).
 *
 * Connection:
 *   Set DATABASE_URL env variable, e.g.:
 *   DATABASE_URL=postgresql://user:pass@localhost:5432/ise
 *   Falls back to postgresql://localhost:5432/ise for local dev.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ise',
});

// ─────────────────────────────────────────────────────────────────────────────
// ROW MAPPERS  (pg snake_case → application camelCase)
// ─────────────────────────────────────────────────────────────────────────────

function rowToStakeholder(row, linkedConflictIds = []) {
  return {
    stakeholderId:             row.stakeholder_id,
    name:                      row.name,
    type:                      row.type,
    description:               row.description || '',
    populationEstimate:        Number(row.population_estimate) || 0,
    populationFraction:        parseFloat(row.population_fraction) || 0,
    representationConfidence:  row.representation_confidence || 50,
    power: {
      political:     row.power_political     || 0,
      economic:      row.power_economic      || 0,
      military:      row.power_military      || 0,
      narrative:     row.power_narrative     || 0,
      institutional: row.power_institutional || 0,
      totalInfluence:row.power_total_influence || 0,
    },
    powerDescription:  row.power_description || '',
    linkedConflictIds,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    createdBy: row.created_by,
  };
}

function rowToInterest(row, clusters = []) {
  return {
    interestId:         row.interest_id,
    name:               row.name,
    description:        row.description || '',
    maslowLevel:        row.maslow_level,
    baseValidityScore:  row.base_validity_score || 0,
    semanticClusters:   clusters,
    tags:               row.tags || [],
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    createdBy: row.created_by,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAKEHOLDERS
// ─────────────────────────────────────────────────────────────────────────────

async function findAllStakeholders() {
  const { rows } = await pool.query('SELECT * FROM stakeholders ORDER BY power_total_influence DESC NULLS LAST');

  const linkRows = await pool.query('SELECT stakeholder_id, conflict_id FROM stakeholder_conflict_links');
  const linkMap  = {};
  for (const r of linkRows.rows) {
    if (!linkMap[r.stakeholder_id]) linkMap[r.stakeholder_id] = [];
    linkMap[r.stakeholder_id].push(r.conflict_id);
  }

  return rows.map(r => rowToStakeholder(r, linkMap[r.stakeholder_id] || []));
}

async function findStakeholderById(id) {
  const { rows } = await pool.query('SELECT * FROM stakeholders WHERE stakeholder_id = $1', [id]);
  if (!rows.length) return null;

  const links = await pool.query(
    'SELECT conflict_id FROM stakeholder_conflict_links WHERE stakeholder_id = $1',
    [id]
  );
  return rowToStakeholder(rows[0], links.rows.map(r => r.conflict_id));
}

async function insertStakeholder(item) {
  const p = item.power || {};
  await pool.query(`
    INSERT INTO stakeholders (
      stakeholder_id, name, type, description,
      population_estimate, population_fraction, representation_confidence,
      power_political, power_economic, power_military, power_narrative, power_institutional,
      power_total_influence, power_description,
      created_at, updated_at, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
  `, [
    item.stakeholderId, item.name, item.type, item.description || null,
    item.populationEstimate || null, item.populationFraction || null,
    item.representationConfidence || null,
    p.political || null, p.economic || null, p.military || null,
    p.narrative || null, p.institutional || null,
    p.totalInfluence || null, item.powerDescription || null,
    item.createdAt, item.updatedAt, item.createdBy,
  ]);

  for (const cid of (item.linkedConflictIds || [])) {
    await pool.query(
      'INSERT INTO stakeholder_conflict_links (stakeholder_id, conflict_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [item.stakeholderId, cid]
    );
  }
  return item;
}

async function updateStakeholder(id, updates) {
  const existing = await findStakeholderById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };
  const p      = merged.power || {};

  await pool.query(`
    UPDATE stakeholders SET
      name = $2, type = $3, description = $4,
      population_estimate = $5, population_fraction = $6, representation_confidence = $7,
      power_political = $8, power_economic = $9, power_military = $10,
      power_narrative = $11, power_institutional = $12, power_total_influence = $13,
      power_description = $14, updated_at = NOW()
    WHERE stakeholder_id = $1
  `, [
    id, merged.name, merged.type, merged.description || null,
    merged.populationEstimate || null, merged.populationFraction || null,
    merged.representationConfidence || null,
    p.political || null, p.economic || null, p.military || null,
    p.narrative || null, p.institutional || null, p.totalInfluence || null,
    merged.powerDescription || null,
  ]);

  return findStakeholderById(id);
}

async function removeStakeholder(id) {
  const { rowCount } = await pool.query('DELETE FROM stakeholders WHERE stakeholder_id = $1', [id]);
  return rowCount > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERESTS
// ─────────────────────────────────────────────────────────────────────────────

async function findAllInterests() {
  const { rows } = await pool.query('SELECT * FROM interests ORDER BY base_validity_score DESC NULLS LAST');
  const { rows: clusterRows } = await pool.query('SELECT * FROM interest_semantic_clusters');

  const clusterMap = {};
  for (const r of clusterRows) {
    if (!clusterMap[r.interest_id]) clusterMap[r.interest_id] = [];
    clusterMap[r.interest_id].push(r.phrase);
  }

  return rows.map(r => rowToInterest(r, clusterMap[r.interest_id] || []));
}

async function findInterestById(id) {
  const { rows } = await pool.query('SELECT * FROM interests WHERE interest_id = $1', [id]);
  if (!rows.length) return null;

  const { rows: clusters } = await pool.query(
    'SELECT phrase FROM interest_semantic_clusters WHERE interest_id = $1',
    [id]
  );
  return rowToInterest(rows[0], clusters.map(r => r.phrase));
}

async function insertInterest(item) {
  await pool.query(`
    INSERT INTO interests (interest_id, name, description, maslow_level, base_validity_score, tags, created_at, updated_at, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
  `, [
    item.interestId, item.name, item.description || null,
    item.maslowLevel, item.baseValidityScore || null,
    item.tags || [], item.createdAt, item.updatedAt, item.createdBy,
  ]);

  for (const phrase of (item.semanticClusters || [])) {
    await pool.query(
      'INSERT INTO interest_semantic_clusters (interest_id, phrase) VALUES ($1,$2)',
      [item.interestId, phrase]
    );
  }
  return item;
}

async function updateInterest(id, updates) {
  const existing = await findInterestById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };

  await pool.query(`
    UPDATE interests SET
      name = $2, description = $3, maslow_level = $4,
      base_validity_score = $5, tags = $6, updated_at = NOW()
    WHERE interest_id = $1
  `, [id, merged.name, merged.description || null, merged.maslowLevel,
      merged.baseValidityScore || null, merged.tags || []]);

  // Re-sync semantic clusters if provided
  if (updates.semanticClusters) {
    await pool.query('DELETE FROM interest_semantic_clusters WHERE interest_id = $1', [id]);
    for (const phrase of updates.semanticClusters) {
      await pool.query(
        'INSERT INTO interest_semantic_clusters (interest_id, phrase) VALUES ($1,$2)',
        [id, phrase]
      );
    }
  }

  return findInterestById(id);
}

async function removeInterest(id) {
  const { rowCount } = await pool.query('DELETE FROM interests WHERE interest_id = $1', [id]);
  return rowCount > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFLICTS — assembly helpers
// ─────────────────────────────────────────────────────────────────────────────

async function assembleAppliedInterest(aiRow) {
  const [evRows, laRows, vaRows] = await Promise.all([
    pool.query('SELECT * FROM evidence WHERE applied_interest_id = $1', [aiRow.id]),
    pool.query('SELECT * FROM linkage_arguments WHERE applied_interest_id = $1', [aiRow.id]),
    pool.query('SELECT * FROM validity_arguments WHERE applied_interest_id = $1', [aiRow.id]),
  ]);

  return {
    interestId:               aiRow.interest_id,
    linkageAccuracy:          aiRow.linkage_accuracy,
    percentMotivated:         parseFloat(aiRow.percent_motivated) || 0,
    contextualValidityScore:  aiRow.contextual_validity_score,
    compositeScore:           aiRow.composite_score,
    evidence: evRows.rows.map(e => ({
      evidenceId:   e.evidence_id,
      tier:         e.tier,
      description:  e.description,
      url:          e.url || '',
      year:         e.year,
      qualityScore: e.quality_score,
    })),
    linkageArguments: {
      affirming:   laRows.rows.filter(r => r.direction === 'affirming').map(r => r.argument),
      challenging: laRows.rows.filter(r => r.direction === 'challenging').map(r => r.argument),
    },
    validityArguments: {
      forHighValidity: vaRows.rows.filter(r => r.direction === 'for_high_validity').map(r => r.argument),
      forLowValidity:  vaRows.rows.filter(r => r.direction === 'for_low_validity').map(r => r.argument),
    },
  };
}

async function assembleConflict(conflictRow) {
  const conflictId = conflictRow.conflict_id;

  // Fetch all child data in parallel
  const [mappingRows, siRows, elRows, rbRows] = await Promise.all([
    pool.query('SELECT * FROM conflict_stakeholder_mappings WHERE conflict_id = $1', [conflictId]),
    pool.query('SELECT * FROM shared_interests WHERE conflict_id = $1', [conflictId]),
    pool.query('SELECT * FROM evidence_ledger WHERE conflict_id = $1', [conflictId]),
    pool.query('SELECT * FROM raw_brainstorm WHERE conflict_id = $1', [conflictId]),
  ]);

  // Build stakeholder mappings with applied interests
  const stakeholderMappings = await Promise.all(mappingRows.rows.map(async (sm) => {
    const aiRows = await pool.query('SELECT * FROM applied_interests WHERE mapping_id = $1', [sm.id]);
    const appliedInterests = await Promise.all(aiRows.rows.map(assembleAppliedInterest));

    return {
      stakeholderId:    sm.stakeholder_id,
      position:         sm.position,
      role:             sm.role || '',
      appliedInterests,
    };
  }));

  // Build shared interests
  const sharedInterests = await Promise.all(siRows.rows.map(async (si) => {
    const [sisRows, bpRows] = await Promise.all([
      pool.query('SELECT stakeholder_id FROM shared_interest_stakeholders WHERE shared_interest_id = $1', [si.id]),
      pool.query('SELECT proposal FROM bridging_proposals WHERE shared_interest_id = $1', [si.id]),
    ]);
    return {
      interestId:       si.interest_id,
      stakeholderIds:   sisRows.rows.map(r => r.stakeholder_id),
      avgValidityScore: si.avg_validity_score,
      bridgingProposals:bpRows.rows.map(r => r.proposal),
    };
  }));

  return {
    conflictId:       conflictRow.conflict_id,
    name:             conflictRow.name,
    description:      conflictRow.description || '',
    parentTopic:      conflictRow.parent_topic || '',
    spectrumMin:      conflictRow.spectrum_min,
    spectrumMax:      conflictRow.spectrum_max,
    importanceScore:  conflictRow.importance_score,
    controversyScore: conflictRow.controversy_score,
    evidenceDepth:    conflictRow.evidence_depth || '',
    stakeholderMappings,
    sharedInterests,
    rawBrainstorm: rbRows.rows.map(r => ({
      submissionId:  r.submission_id,
      rawText:       r.raw_text,
      submittedBy:   r.submitted_by,
      submittedAt:   r.submitted_at instanceof Date ? r.submitted_at.toISOString() : r.submitted_at,
      clusteredTo:   r.clustered_to || null,
      similarityScore: r.similarity_score,
      status:        r.status,
    })),
    evidenceLedger: elRows.rows.map(r => ({
      evidenceId:   r.evidence_id,
      claim:        r.claim,
      side:         r.side,
      source:       r.source || '',
      tier:         r.tier,
      year:         r.year,
      qualityScore: r.quality_score,
      url:          r.url || '',
      finding:      r.finding || '',
    })),
    createdAt: conflictRow.created_at instanceof Date ? conflictRow.created_at.toISOString() : conflictRow.created_at,
    updatedAt: conflictRow.updated_at instanceof Date ? conflictRow.updated_at.toISOString() : conflictRow.updated_at,
    createdBy: conflictRow.created_by,
  };
}

async function findAllConflicts() {
  const { rows } = await pool.query('SELECT * FROM conflicts ORDER BY created_at DESC');
  return Promise.all(rows.map(assembleConflict));
}

async function findConflictById(id) {
  const { rows } = await pool.query('SELECT * FROM conflicts WHERE conflict_id = $1', [id]);
  if (!rows.length) return null;
  return assembleConflict(rows[0]);
}

async function insertConflict(item) {
  await pool.query(`
    INSERT INTO conflicts (
      conflict_id, name, description, parent_topic,
      spectrum_min, spectrum_max, importance_score, controversy_score,
      evidence_depth, created_at, updated_at, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
  `, [
    item.conflictId, item.name, item.description || null, item.parentTopic || null,
    item.spectrumMin ?? -100, item.spectrumMax ?? 100,
    item.importanceScore || null, item.controversyScore || null,
    item.evidenceDepth || null, item.createdAt, item.updatedAt, item.createdBy,
  ]);
  return item;
}

/**
 * Update conflict top-level fields or re-sync nested arrays.
 * Recognised nested keys: stakeholderMappings, rawBrainstorm, evidenceLedger
 * All others are treated as top-level column updates.
 */
async function updateConflict(id, updates) {
  const { stakeholderMappings, rawBrainstorm, evidenceLedger, ...topLevel } = updates;

  // Top-level field updates
  if (Object.keys(topLevel).length) {
    const existing = await pool.query('SELECT * FROM conflicts WHERE conflict_id = $1', [id]);
    if (!existing.rows.length) return null;
    const cur = existing.rows[0];

    await pool.query(`
      UPDATE conflicts SET
        name = $2, description = $3, parent_topic = $4,
        spectrum_min = $5, spectrum_max = $6,
        importance_score = $7, controversy_score = $8,
        evidence_depth = $9, updated_at = NOW()
      WHERE conflict_id = $1
    `, [
      id,
      topLevel.name             ?? cur.name,
      topLevel.description      ?? cur.description,
      topLevel.parentTopic      ?? cur.parent_topic,
      topLevel.spectrumMin      ?? cur.spectrum_min,
      topLevel.spectrumMax      ?? cur.spectrum_max,
      topLevel.importanceScore  ?? cur.importance_score,
      topLevel.controversyScore ?? cur.controversy_score,
      topLevel.evidenceDepth    ?? cur.evidence_depth,
    ]);
  }

  // Re-sync stakeholder mappings if provided
  if (stakeholderMappings !== undefined) {
    // Delete cascade removes applied_interests, evidence, arguments
    await pool.query('DELETE FROM conflict_stakeholder_mappings WHERE conflict_id = $1', [id]);

    for (const sm of stakeholderMappings) {
      const mappingRes = await pool.query(`
        INSERT INTO conflict_stakeholder_mappings (conflict_id, stakeholder_id, position, role)
        VALUES ($1,$2,$3,$4) RETURNING id
      `, [id, sm.stakeholderId, sm.position, sm.role || null]);

      const mappingId = mappingRes.rows[0].id;

      for (const ai of (sm.appliedInterests || [])) {
        const aiRes = await pool.query(`
          INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
          VALUES ($1,$2,$3,$4,$5,$6) RETURNING id
        `, [
          mappingId, ai.interestId,
          ai.linkageAccuracy || null, ai.percentMotivated || null,
          ai.contextualValidityScore || null, ai.compositeScore || null,
        ]);

        const aiId = aiRes.rows[0].id;

        for (const ev of (ai.evidence || [])) {
          await pool.query(`
            INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
          `, [ev.evidenceId || null, aiId, ev.tier, ev.description,
              ev.url || null, ev.year || null, ev.qualityScore || null]);
        }

        const la = ai.linkageArguments || {};
        for (const arg of (la.affirming   || [])) await pool.query(`INSERT INTO linkage_arguments (applied_interest_id, direction, argument) VALUES ($1,'affirming',$2)`,   [aiId, arg]);
        for (const arg of (la.challenging || [])) await pool.query(`INSERT INTO linkage_arguments (applied_interest_id, direction, argument) VALUES ($1,'challenging',$2)`, [aiId, arg]);

        const va = ai.validityArguments || {};
        for (const arg of (va.forHighValidity || [])) await pool.query(`INSERT INTO validity_arguments (applied_interest_id, direction, argument) VALUES ($1,'for_high_validity',$2)`, [aiId, arg]);
        for (const arg of (va.forLowValidity  || [])) await pool.query(`INSERT INTO validity_arguments (applied_interest_id, direction, argument) VALUES ($1,'for_low_validity',$2)`,  [aiId, arg]);
      }
    }
  }

  // Re-sync raw brainstorm if provided
  if (rawBrainstorm !== undefined) {
    await pool.query('DELETE FROM raw_brainstorm WHERE conflict_id = $1', [id]);
    for (const rb of rawBrainstorm) {
      await pool.query(`
        INSERT INTO raw_brainstorm (submission_id, conflict_id, raw_text, submitted_by, submitted_at, clustered_to, similarity_score, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `, [
        rb.submissionId || null, id, rb.rawText,
        rb.submittedBy || 'anonymous', rb.submittedAt || new Date().toISOString(),
        rb.clusteredTo || null, rb.similarityScore || null,
        rb.status || 'pending',
      ]);
    }
  }

  // Re-sync evidence ledger if provided
  if (evidenceLedger !== undefined) {
    await pool.query('DELETE FROM evidence_ledger WHERE conflict_id = $1', [id]);
    for (const el of evidenceLedger) {
      await pool.query(`
        INSERT INTO evidence_ledger (evidence_id, conflict_id, claim, side, source, tier, year, quality_score, url, finding)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `, [
        el.evidenceId || null, id, el.claim,
        el.side || null, el.source || null, el.tier || null,
        el.year || null, el.qualityScore || null,
        el.url || null, el.finding || null,
      ]);
    }
  }

  await pool.query('UPDATE conflicts SET updated_at = NOW() WHERE conflict_id = $1', [id]);
  return findConflictById(id);
}

async function removeConflict(id) {
  const { rowCount } = await pool.query('DELETE FROM conflicts WHERE conflict_id = $1', [id]);
  return rowCount > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC API  (mirrors the old file-based API, now async)
// ─────────────────────────────────────────────────────────────────────────────

const HANDLERS = {
  stakeholders: {
    findAll:  () => findAllStakeholders(),
    findById: (_, id) => findStakeholderById(id),
    insert:   (__, ___, item) => insertStakeholder(item),
    update:   (__, ___, id, updates) => updateStakeholder(id, updates),
    remove:   (__, ___, id) => removeStakeholder(id),
  },
  interests: {
    findAll:  () => findAllInterests(),
    findById: (_, id) => findInterestById(id),
    insert:   (__, ___, item) => insertInterest(item),
    update:   (__, ___, id, updates) => updateInterest(id, updates),
    remove:   (__, ___, id) => removeInterest(id),
  },
  conflicts: {
    findAll:  () => findAllConflicts(),
    findById: (_, id) => findConflictById(id),
    insert:   (__, ___, item) => insertConflict(item),
    update:   (__, ___, id, updates) => updateConflict(id, updates),
    remove:   (__, ___, id) => removeConflict(id),
  },
};

function findAll(collection) {
  return HANDLERS[collection].findAll();
}

function findById(collection, idField, id) {
  return HANDLERS[collection].findById(idField, id);
}

function insert(collection, idField, item) {
  return HANDLERS[collection].insert(collection, idField, item);
}

function update(collection, idField, id, updates) {
  return HANDLERS[collection].update(collection, idField, id, updates);
}

function remove(collection, idField, id) {
  return HANDLERS[collection].remove(collection, idField, id);
}

module.exports = { findAll, findById, insert, update, remove, pool };
