/**
 * ISE Scoring Engine
 *
 * Implements the two-score system:
 *   1. Linkage Accuracy (0-100): How confident are we this interest motivates this group?
 *   2. Interest Validity (0-100): How legitimate is this interest ethically/practically?
 *
 * Composite Score = (Validity * 0.6) + (Linkage * 0.4)
 * This weights legitimacy slightly over confidence, ensuring high-validity shared
 * interests rise to the top of the compromise-building surface.
 */

const { MASLOW } = require('../models/schemas');

// ---------------------------------------------------------------------------
// VALIDITY SCORING
// ---------------------------------------------------------------------------

/**
 * Compute a baseline validity score from Maslow level.
 * @param {string} maslowLevel - key of MASLOW constant
 * @returns {number} midpoint of the Maslow band
 */
function baselineValidity(maslowLevel) {
  const band = MASLOW[maslowLevel];
  if (!band) return 0;
  return Math.round((band.min + band.max) / 2);
}

/**
 * Adjust baseline validity score using within-band criteria.
 *
 * Adjustment factors (each ±0 to ±10 points):
 *   +impact scope:       how many people, how severely
 *   +reversibility:      irreversible harms rank higher
 *   -alternative:        substitutes available → lower priority
 *   +universal test:     universal pursuit benefits society
 *   +reciprocity:        group would accept same treatment
 *
 * @param {number} baseline
 * @param {object} adjustments - { impactScope, reversibility, alternativeAvail, universalTest, reciprocity }
 *        each is a number -10 to +10
 * @returns {number} adjusted score clamped to Maslow band [min, max]
 */
function adjustedValidity(maslowLevel, adjustments = {}) {
  const band = MASLOW[maslowLevel];
  if (!band) return 0;

  const {
    impactScope = 0,
    reversibility = 0,
    alternativeAvail = 0,
    universalTest = 0,
    reciprocity = 0,
  } = adjustments;

  const raw = baselineValidity(maslowLevel)
    + impactScope
    + reversibility
    + alternativeAvail
    + universalTest
    + reciprocity;

  return Math.max(band.min, Math.min(band.max, Math.round(raw)));
}

// ---------------------------------------------------------------------------
// LINKAGE ACCURACY SCORING
// ---------------------------------------------------------------------------

/**
 * Evidence tier weights — higher tier = stronger evidence → higher linkage impact.
 */
const TIER_WEIGHTS = {
  T1: 1.0,   // peer-reviewed empirical
  T2: 0.92,  // government/IGO report
  T3: 0.85,  // nationally representative survey
  T4: 0.75,  // expert consensus / think-tank
  T5: 0.70,  // behavioral / revealed preference
  T6: 0.55,  // journalism
  T7: 0.30,  // anecdotal / speculative
};

/**
 * Compute Linkage Accuracy from an array of evidence items.
 * Uses weighted average of (qualityScore * tierWeight) for all evidence,
 * then adjusts based on whether arguments affirming or challenging are present.
 *
 * @param {Array} evidence - array of { tier, qualityScore }
 * @param {object} linkageArguments - { affirming: [string], challenging: [string] }
 * @returns {number} 0-100
 */
function computeLinkageAccuracy(evidence = [], linkageArguments = {}) {
  if (!evidence.length) return 30; // default: speculative

  const weightedSum = evidence.reduce((sum, e) => {
    const tw = TIER_WEIGHTS[e.tier] || 0.3;
    return sum + (e.qualityScore * tw);
  }, 0);

  const totalWeight = evidence.reduce((sum, e) => {
    return sum + (TIER_WEIGHTS[e.tier] || 0.3);
  }, 0);

  let score = totalWeight > 0 ? weightedSum / totalWeight : 30;

  // Affirming arguments boost confidence slightly
  const affirming = (linkageArguments.affirming || []).length;
  const challenging = (linkageArguments.challenging || []).length;
  score += affirming * 1.5;
  score -= challenging * 2.0;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ---------------------------------------------------------------------------
// COMPOSITE SCORE
// ---------------------------------------------------------------------------

/**
 * Compute the composite sort score.
 * Used for default "most valid interest first" ordering.
 *
 * @param {number} validityScore
 * @param {number} linkageAccuracy
 * @returns {number}
 */
function compositeScore(validityScore, linkageAccuracy) {
  return Math.round(validityScore * 0.6 + linkageAccuracy * 0.4);
}

// ---------------------------------------------------------------------------
// POWER INFLUENCE
// ---------------------------------------------------------------------------

/**
 * Compute total influence from power dimension scores.
 * Currently a simple average; can be weighted by conflict type later.
 *
 * @param {object} power - { political, economic, military, narrative, institutional }
 * @returns {number}
 */
function computeTotalInfluence(power) {
  const dims = ['political', 'economic', 'military', 'narrative', 'institutional'];
  const valid = dims.filter(d => typeof power[d] === 'number');
  if (!valid.length) return 0;
  const sum = valid.reduce((s, d) => s + power[d], 0);
  return Math.round(sum / valid.length);
}

// ---------------------------------------------------------------------------
// INTEREST RANKING
// ---------------------------------------------------------------------------

/**
 * Sort an array of applied interests.
 *
 * @param {Array} appliedInterests - each has { contextualValidityScore, linkageAccuracy, compositeScore }
 * @param {string} sortBy - 'validity' | 'linkage' | 'composite'
 * @returns {Array} sorted descending
 */
function rankInterests(appliedInterests, sortBy = 'composite') {
  return [...appliedInterests].sort((a, b) => {
    if (sortBy === 'validity')  return b.contextualValidityScore - a.contextualValidityScore;
    if (sortBy === 'linkage')   return b.linkageAccuracy - a.linkageAccuracy;
    return b.compositeScore - a.compositeScore;
  });
}

// ---------------------------------------------------------------------------
// SHARED INTEREST DETECTION
// ---------------------------------------------------------------------------

/**
 * Given a conflict's stakeholder mappings, find interests that appear
 * on *both* supporter and opponent sides with high average validity.
 *
 * @param {Array} stakeholderMappings
 * @param {number} minValidityThreshold - only return shared interests above this
 * @returns {Array} [{ interestId, stakeholderIds, avgValidityScore }]
 */
function detectSharedInterests(stakeholderMappings, minValidityThreshold = 70) {
  const byInterest = {};

  for (const sm of stakeholderMappings) {
    for (const ai of sm.appliedInterests) {
      if (!byInterest[ai.interestId]) {
        byInterest[ai.interestId] = { stakeholderIds: [], scores: [], positions: new Set() };
      }
      byInterest[ai.interestId].stakeholderIds.push(sm.stakeholderId);
      byInterest[ai.interestId].scores.push(ai.contextualValidityScore);
      byInterest[ai.interestId].positions.add(sm.position);
    }
  }

  const shared = [];
  for (const [interestId, data] of Object.entries(byInterest)) {
    const avg = Math.round(data.scores.reduce((s, x) => s + x, 0) / data.scores.length);
    const crossSide = data.positions.has('Supporter') && data.positions.has('Opponent');
    if (avg >= minValidityThreshold && crossSide) {
      shared.push({
        interestId,
        stakeholderIds: data.stakeholderIds,
        avgValidityScore: avg,
        bridgingProposals: [],
      });
    }
  }

  return shared.sort((a, b) => b.avgValidityScore - a.avgValidityScore);
}

// ---------------------------------------------------------------------------
// SUMMARY STATS
// ---------------------------------------------------------------------------

/**
 * Generate a summary of the interest profile for a conflict.
 * Returns counts and averages useful for the UI dashboard.
 *
 * @param {Array} stakeholderMappings
 * @returns {object}
 */
function conflictSummaryStats(stakeholderMappings) {
  const allInterests = stakeholderMappings.flatMap(sm => sm.appliedInterests);
  if (!allInterests.length) return {};

  const avgValidity = Math.round(
    allInterests.reduce((s, i) => s + i.contextualValidityScore, 0) / allInterests.length
  );
  const avgLinkage = Math.round(
    allInterests.reduce((s, i) => s + i.linkageAccuracy, 0) / allInterests.length
  );
  const highValidityCount = allInterests.filter(i => i.contextualValidityScore >= 80).length;
  const lowValidityCount  = allInterests.filter(i => i.contextualValidityScore < 30).length;

  return { avgValidity, avgLinkage, highValidityCount, lowValidityCount, totalMappings: allInterests.length };
}

module.exports = {
  baselineValidity,
  adjustedValidity,
  computeLinkageAccuracy,
  compositeScore,
  computeTotalInfluence,
  rankInterests,
  detectSharedInterests,
  conflictSummaryStats,
};
