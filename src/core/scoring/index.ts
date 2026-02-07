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
export * from './cba-scoring';
