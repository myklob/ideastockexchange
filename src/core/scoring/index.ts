/**
 * Unified Scoring Module
 *
 * Single source of truth for all scoring calculations.
 * Import from '@/core/scoring' instead of individual files.
 *
 * Covers all 11 ReasonRank score dimensions:
 *   Fundamental: Truth, Linkage, Importance, Evidence, CBA Likelihood,
 *                Objective Criteria, Confidence Stability
 *   Administrative: Media Truth, Media Genre, Topic Overlap, Belief Equivalency
 */

// Main scoring engine (Truth, Linkage, Evidence, Importance, CBA Likelihood)
export * from './scoring-engine';

// Domain-specific scoring
export * from './book-scoring';

// CBA scoring - exclude calculateArgumentImpact which is already in scoring-engine
export {
  calculateReasonRankScore,
  determineActiveLikelihood,
  calculateLikelihoodCI,
  formatDollars,
  calculateExpectedValue,
  recalculateCBA,
} from './cba-scoring';

// Duplication scoring — solves the Redundancy Problem (Topic Overlap Scores)
export * from './duplication-scoring';

// All-scores module — remaining ReasonRank score dimensions:
//   Objective Criteria, Confidence Stability, Media Truth, Media Genre,
//   Topic Overlap helpers, Belief Equivalency, and combined computeAllBeliefScores
export {
  // Score interfaces
  type TruthScoreBreakdown,
  type ImportanceScoreResult,
  type ObjectiveCriteriaScore,
  type ConfidenceStabilityResult,
  type MediaScoreResult,
  type MediaGenreType,
  type TopicOverlapResult,
  type BeliefEquivalencyResult,
  type AllBeliefScores,

  // 1. Truth Scores
  calculateTruthScoreBreakdown,

  // 3. Importance Scores
  calculateImportanceScore,

  // 6. Objective Criteria Scores
  calculateObjectiveCriteriaScore,
  aggregateObjectiveCriteriaScores,

  // 7. Confidence Stability Scores
  calculateConfidenceStabilityScore,

  // 8 & 9. Media Truth and Genre Scores
  calculateMediaScores,
  inferGenreFromMediaType,
  aggregateMediaScores,

  // 10. Topic Overlap Scores
  calculateTopicOverlapScore,

  // 11. Belief Equivalency Scores
  calculateBeliefEquivalencyScore,

  // Combined all-scores computation
  computeAllBeliefScores,
} from './all-scores';
