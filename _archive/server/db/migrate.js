#!/usr/bin/env node
/**
 * ISE JSON → PostgreSQL Migration
 *
 * Reads the three JSON data files and inserts all records into the
 * normalised PostgreSQL schema defined in schema.sql.
 *
 * Usage:
 *   DATABASE_URL=postgresql://user:pass@localhost:5432/ise node server/db/migrate.js
 *
 * The script is idempotent: each stakeholder/interest/conflict is inserted
 * with ON CONFLICT DO NOTHING so it is safe to re-run.
 */

const path = require('path');
const fs   = require('fs');
const { Pool } = require('pg');

const DATA_DIR = path.join(__dirname, '..', 'data');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ise' });

function load(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'))[name];
}

// ─────────────────────────────────────────────
// STAKEHOLDERS
// ─────────────────────────────────────────────

async function migrateStakeholders(client, stakeholders) {
  for (const s of stakeholders) {
    const p = s.power || {};
    await client.query(`
      INSERT INTO stakeholders (
        stakeholder_id, name, type, description,
        population_estimate, population_fraction, representation_confidence,
        power_political, power_economic, power_military, power_narrative, power_institutional,
        power_total_influence, power_description,
        created_at, updated_at, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      ON CONFLICT (stakeholder_id) DO NOTHING
    `, [
      s.stakeholderId, s.name, s.type, s.description || null,
      s.populationEstimate || null, s.populationFraction || null,
      s.representationConfidence || null,
      p.political || null, p.economic || null, p.military || null,
      p.narrative || null, p.institutional || null,
      p.totalInfluence || null, s.powerDescription || null,
      s.createdAt, s.updatedAt, s.createdBy
    ]);
  }
  console.log(`  ✓ ${stakeholders.length} stakeholders`);
}

// ─────────────────────────────────────────────
// INTERESTS
// ─────────────────────────────────────────────

async function migrateInterests(client, interests) {
  for (const i of interests) {
    await client.query(`
      INSERT INTO interests (
        interest_id, name, description, maslow_level, base_validity_score,
        tags, created_at, updated_at, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (interest_id) DO NOTHING
    `, [
      i.interestId, i.name, i.description || null,
      i.maslowLevel, i.baseValidityScore || null,
      i.tags || [], i.createdAt, i.updatedAt, i.createdBy
    ]);

    // Semantic clusters
    for (const phrase of (i.semanticClusters || [])) {
      await client.query(`
        INSERT INTO interest_semantic_clusters (interest_id, phrase)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [i.interestId, phrase]);
    }
  }
  console.log(`  ✓ ${interests.length} interests`);
}

// ─────────────────────────────────────────────
// CONFLICTS  (including all nested records)
// ─────────────────────────────────────────────

async function migrateConflicts(client, conflicts, stakeholders) {
  // Build stakeholder linkedConflictIds lookup from the stakeholders array
  const linkedMap = {};
  for (const s of stakeholders) {
    for (const cid of (s.linkedConflictIds || [])) {
      if (!linkedMap[s.stakeholderId]) linkedMap[s.stakeholderId] = [];
      linkedMap[s.stakeholderId].push(cid);
    }
  }

  for (const c of conflicts) {
    // Insert conflict
    await client.query(`
      INSERT INTO conflicts (
        conflict_id, name, description, parent_topic,
        spectrum_min, spectrum_max, importance_score, controversy_score,
        evidence_depth, created_at, updated_at, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (conflict_id) DO NOTHING
    `, [
      c.conflictId, c.name, c.description || null, c.parentTopic || null,
      c.spectrumMin ?? -100, c.spectrumMax ?? 100,
      c.importanceScore || null, c.controversyScore || null,
      c.evidenceDepth || null, c.createdAt, c.updatedAt, c.createdBy
    ]);

    // Stakeholder–conflict links (for all stakeholders that list this conflict)
    for (const [stkId, conflictIds] of Object.entries(linkedMap)) {
      for (const cid of conflictIds) {
        if (cid === c.conflictId) {
          await client.query(`
            INSERT INTO stakeholder_conflict_links (stakeholder_id, conflict_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [stkId, cid]);
        }
      }
    }

    // Stakeholder mappings
    for (const sm of (c.stakeholderMappings || [])) {
      const mappingRes = await client.query(`
        INSERT INTO conflict_stakeholder_mappings (conflict_id, stakeholder_id, position, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (conflict_id, stakeholder_id) DO UPDATE SET role = EXCLUDED.role
        RETURNING id
      `, [c.conflictId, sm.stakeholderId, sm.position, sm.role || null]);

      const mappingId = mappingRes.rows[0].id;

      // Applied interests
      for (const ai of (sm.appliedInterests || [])) {
        const aiRes = await client.query(`
          INSERT INTO applied_interests (
            mapping_id, interest_id, linkage_accuracy, percent_motivated,
            contextual_validity_score, composite_score
          ) VALUES ($1,$2,$3,$4,$5,$6)
          ON CONFLICT (mapping_id, interest_id) DO UPDATE
            SET linkage_accuracy = EXCLUDED.linkage_accuracy,
                percent_motivated = EXCLUDED.percent_motivated,
                contextual_validity_score = EXCLUDED.contextual_validity_score,
                composite_score = EXCLUDED.composite_score
          RETURNING id
        `, [
          mappingId, ai.interestId,
          ai.linkageAccuracy || null,
          ai.percentMotivated || null,
          ai.contextualValidityScore || null,
          ai.compositeScore || null
        ]);

        const aiId = aiRes.rows[0].id;

        // Evidence
        for (const ev of (ai.evidence || [])) {
          await client.query(`
            INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            ON CONFLICT (evidence_id) DO NOTHING
          `, [
            ev.evidenceId || null, aiId, ev.tier, ev.description,
            ev.url || null, ev.year || null, ev.qualityScore || null
          ]);
        }

        // Linkage arguments
        const la = ai.linkageArguments || {};
        for (const arg of (la.affirming || [])) {
          await client.query(
            `INSERT INTO linkage_arguments (applied_interest_id, direction, argument) VALUES ($1,'affirming',$2)`,
            [aiId, arg]
          );
        }
        for (const arg of (la.challenging || [])) {
          await client.query(
            `INSERT INTO linkage_arguments (applied_interest_id, direction, argument) VALUES ($1,'challenging',$2)`,
            [aiId, arg]
          );
        }

        // Validity arguments
        const va = ai.validityArguments || {};
        for (const arg of (va.forHighValidity || [])) {
          await client.query(
            `INSERT INTO validity_arguments (applied_interest_id, direction, argument) VALUES ($1,'for_high_validity',$2)`,
            [aiId, arg]
          );
        }
        for (const arg of (va.forLowValidity || [])) {
          await client.query(
            `INSERT INTO validity_arguments (applied_interest_id, direction, argument) VALUES ($1,'for_low_validity',$2)`,
            [aiId, arg]
          );
        }
      }
    }

    // Shared interests
    for (const si of (c.sharedInterests || [])) {
      const siRes = await client.query(`
        INSERT INTO shared_interests (conflict_id, interest_id, avg_validity_score)
        VALUES ($1,$2,$3)
        ON CONFLICT (conflict_id, interest_id) DO UPDATE SET avg_validity_score = EXCLUDED.avg_validity_score
        RETURNING id
      `, [c.conflictId, si.interestId, si.avgValidityScore || null]);

      const siId = siRes.rows[0].id;

      for (const stkId of (si.stakeholderIds || [])) {
        await client.query(`
          INSERT INTO shared_interest_stakeholders (shared_interest_id, stakeholder_id)
          VALUES ($1,$2)
          ON CONFLICT DO NOTHING
        `, [siId, stkId]);
      }

      for (const proposal of (si.bridgingProposals || [])) {
        await client.query(
          `INSERT INTO bridging_proposals (shared_interest_id, proposal, created_by) VALUES ($1,$2,'seed')`,
          [siId, proposal]
        );
      }
    }

    // Evidence ledger
    for (const el of (c.evidenceLedger || [])) {
      await client.query(`
        INSERT INTO evidence_ledger (evidence_id, conflict_id, claim, side, source, tier, year, quality_score, url, finding)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (evidence_id) DO NOTHING
      `, [
        el.evidenceId || null, c.conflictId, el.claim,
        el.side || null, el.source || null, el.tier || null,
        el.year || null, el.qualityScore || null,
        el.url || null, el.finding || null
      ]);
    }

    // Raw brainstorm
    for (const rb of (c.rawBrainstorm || [])) {
      await client.query(`
        INSERT INTO raw_brainstorm (submission_id, conflict_id, raw_text, submitted_by, submitted_at, clustered_to, similarity_score, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (submission_id) DO NOTHING
      `, [
        rb.submissionId || null, c.conflictId, rb.rawText,
        rb.submittedBy || 'anonymous', rb.submittedAt || new Date().toISOString(),
        rb.clusteredTo || null, rb.similarityScore || null,
        rb.status || 'pending'
      ]);
    }
  }
  console.log(`  ✓ ${conflicts.length} conflict(s) with all nested records`);
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  console.log('ISE Migration: JSON → PostgreSQL');
  console.log('─'.repeat(40));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const stakeholders = load('stakeholders');
    const interests    = load('interests');
    const conflicts    = load('conflicts');

    await migrateStakeholders(client, stakeholders);
    await migrateInterests(client, interests);
    await migrateConflicts(client, conflicts, stakeholders);

    await client.query('COMMIT');
    console.log('─'.repeat(40));
    console.log('Migration complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed — rolled back:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
