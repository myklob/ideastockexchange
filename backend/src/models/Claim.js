/**
 * Claim Model
 * Handles all database operations for claims
 */

const { getDatabase } = require('../config/database');

class Claim {
  /**
   * Get all claims with their patterns
   */
  static getAll() {
    const db = getDatabase();

    const claims = db.prepare(`
      SELECT * FROM claims ORDER BY created_at DESC
    `).all();

    // Attach patterns to each claim
    const patternsStmt = db.prepare('SELECT pattern FROM patterns WHERE claim_id = ?');

    return claims.map(claim => ({
      ...claim,
      patterns: patternsStmt.all(claim.id).map(p => p.pattern),
      reasonsFor: claim.reasons_for,
      reasonsAgainst: claim.reasons_against,
      evidenceScore: claim.evidence_score
    }));
  }

  /**
   * Get a single claim by ID
   */
  static getById(id) {
    const db = getDatabase();

    const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(id);
    if (!claim) return null;

    const patterns = db.prepare('SELECT pattern FROM patterns WHERE claim_id = ?')
      .all(id)
      .map(p => p.pattern);

    return {
      ...claim,
      patterns,
      reasonsFor: claim.reasons_for,
      reasonsAgainst: claim.reasons_against,
      evidenceScore: claim.evidence_score
    };
  }

  /**
   * Search claims by query
   */
  static search(query) {
    const db = getDatabase();
    const searchTerm = `%${query.toLowerCase()}%`;

    const claims = db.prepare(`
      SELECT * FROM claims
      WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ?
      ORDER BY evidence_score DESC, created_at DESC
    `).all(searchTerm, searchTerm);

    const patternsStmt = db.prepare('SELECT pattern FROM patterns WHERE claim_id = ?');

    return claims.map(claim => ({
      ...claim,
      patterns: patternsStmt.all(claim.id).map(p => p.pattern),
      reasonsFor: claim.reasons_for,
      reasonsAgainst: claim.reasons_against,
      evidenceScore: claim.evidence_score
    }));
  }

  /**
   * Get claims by category
   */
  static getByCategory(category) {
    const db = getDatabase();

    const claims = db.prepare(`
      SELECT * FROM claims WHERE category = ? ORDER BY created_at DESC
    `).all(category);

    const patternsStmt = db.prepare('SELECT pattern FROM patterns WHERE claim_id = ?');

    return claims.map(claim => ({
      ...claim,
      patterns: patternsStmt.all(claim.id).map(p => p.pattern),
      reasonsFor: claim.reasons_for,
      reasonsAgainst: claim.reasons_against,
      evidenceScore: claim.evidence_score
    }));
  }

  /**
   * Create a new claim
   */
  static create(claimData) {
    const db = getDatabase();

    const { id, title, description, url, patterns, confidence, reasonsFor, reasonsAgainst, evidenceScore, category } = claimData;

    const transaction = db.transaction(() => {
      // Insert claim
      db.prepare(`
        INSERT INTO claims (id, title, description, url, confidence, reasons_for, reasons_against, evidence_score, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, title, description, url, confidence, reasonsFor || 0, reasonsAgainst || 0, evidenceScore, category);

      // Insert patterns
      const patternStmt = db.prepare('INSERT INTO patterns (claim_id, pattern) VALUES (?, ?)');
      patterns.forEach(pattern => {
        patternStmt.run(id, pattern);
      });
    });

    transaction();
    return this.getById(id);
  }

  /**
   * Update a claim
   */
  static update(id, claimData) {
    const db = getDatabase();

    const { title, description, url, patterns, confidence, reasonsFor, reasonsAgainst, evidenceScore, category } = claimData;

    const transaction = db.transaction(() => {
      // Update claim
      db.prepare(`
        UPDATE claims
        SET title = ?, description = ?, url = ?, confidence = ?,
            reasons_for = ?, reasons_against = ?, evidence_score = ?, category = ?
        WHERE id = ?
      `).run(title, description, url, confidence, reasonsFor, reasonsAgainst, evidenceScore, category, id);

      // Delete old patterns and insert new ones
      if (patterns) {
        db.prepare('DELETE FROM patterns WHERE claim_id = ?').run(id);
        const patternStmt = db.prepare('INSERT INTO patterns (claim_id, pattern) VALUES (?, ?)');
        patterns.forEach(pattern => {
          patternStmt.run(id, pattern);
        });
      }
    });

    transaction();
    return this.getById(id);
  }

  /**
   * Delete a claim
   */
  static delete(id) {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM claims WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * Get all categories
   */
  static getCategories() {
    const db = getDatabase();
    return db.prepare('SELECT DISTINCT category FROM claims ORDER BY category').all();
  }

  /**
   * Get statistics
   */
  static getStats() {
    const db = getDatabase();

    const totalClaims = db.prepare('SELECT COUNT(*) as count FROM claims').get().count;
    const totalDetections = db.prepare('SELECT COUNT(*) as count FROM detections').get().count;
    const categoryCounts = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM claims
      GROUP BY category
      ORDER BY count DESC
    `).all();

    const avgEvidenceScore = db.prepare('SELECT AVG(evidence_score) as avg FROM claims').get().avg;

    return {
      totalClaims,
      totalDetections,
      categoryCounts,
      avgEvidenceScore: avgEvidenceScore ? parseFloat(avgEvidenceScore.toFixed(2)) : 0
    };
  }

  /**
   * Record a detection
   */
  static recordDetection(claimId, url, userAgent) {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO detections (claim_id, url, user_agent)
      VALUES (?, ?, ?)
    `).run(claimId, url, userAgent);
  }
}

module.exports = Claim;
