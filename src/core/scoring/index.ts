/**
 * Unified Scoring Module
 *
 * Single source of truth for all scoring calculations.
 * Import from '@/core/scoring' instead of individual files.
 */

// Main scoring engine
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

// Duplication scoring — solves the Redundancy Problem
export * from './duplication-scoring';
