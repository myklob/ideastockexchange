/**
 * Analytics API Routes
 * Provides analytics and insights about claim detections
 */

const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');

/**
 * GET /api/analytics/detections
 * Get detection statistics
 */
router.get('/detections', (req, res, next) => {
  try {
    const db = getDatabase();

    // Total detections
    const total = db.prepare('SELECT COUNT(*) as count FROM detections').get().count;

    // Detections today
    const today = db.prepare(`
      SELECT COUNT(*) as count FROM detections
      WHERE DATE(detected_at) = DATE('now')
    `).get().count;

    // Detections this week
    const thisWeek = db.prepare(`
      SELECT COUNT(*) as count FROM detections
      WHERE detected_at >= DATE('now', '-7 days')
    `).get().count;

    // Detections this month
    const thisMonth = db.prepare(`
      SELECT COUNT(*) as count FROM detections
      WHERE detected_at >= DATE('now', 'start of month')
    `).get().count;

    // Top detected claims
    const topClaims = db.prepare(`
      SELECT c.id, c.title, COUNT(d.id) as detection_count
      FROM claims c
      LEFT JOIN detections d ON c.id = d.claim_id
      GROUP BY c.id
      ORDER BY detection_count DESC
      LIMIT 10
    `).all();

    res.json({
      success: true,
      analytics: {
        total,
        today,
        thisWeek,
        thisMonth,
        topClaims
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/trends
 * Get detection trends over time
 */
router.get('/trends', (req, res, next) => {
  try {
    const db = getDatabase();

    const dailyTrends = db.prepare(`
      SELECT DATE(detected_at) as date, COUNT(*) as count
      FROM detections
      WHERE detected_at >= DATE('now', '-30 days')
      GROUP BY DATE(detected_at)
      ORDER BY date ASC
    `).all();

    res.json({
      success: true,
      trends: dailyTrends
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/categories
 * Get analytics by category
 */
router.get('/categories', (req, res, next) => {
  try {
    const db = getDatabase();

    const categoryStats = db.prepare(`
      SELECT
        c.category,
        COUNT(DISTINCT c.id) as claim_count,
        COUNT(d.id) as detection_count,
        AVG(c.evidence_score) as avg_evidence_score
      FROM claims c
      LEFT JOIN detections d ON c.id = d.claim_id
      GROUP BY c.category
      ORDER BY detection_count DESC
    `).all();

    res.json({
      success: true,
      categories: categoryStats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
