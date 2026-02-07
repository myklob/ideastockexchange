/**
 * Application Constants
 *
 * Centralized configuration constants for the Idea Stock Exchange.
 * Use SCREAMING_SNAKE_CASE for all constants.
 *
 * Environment-specific values should be read from process.env.
 * These constants represent application defaults and magic numbers.
 */

// ─── Scoring Configuration ─────────────────────────────────────

/** Maximum truth score (0-1 scale) */
export const MAX_TRUTH_SCORE = 1.0;

/** Minimum truth score to avoid division by zero */
export const MIN_TRUTH_SCORE = 0.01;

/** Default confidence interval when insufficient data */
export const DEFAULT_CONFIDENCE_INTERVAL = 0.15;

/** Maximum confidence interval */
export const MAX_CONFIDENCE_INTERVAL = 0.30;

/** Minimum confidence interval (very high certainty) */
export const MIN_CONFIDENCE_INTERVAL = 0.02;

/** Evidence contribution weight to total score */
export const EVIDENCE_CONTRIBUTION_WEIGHT = 0.2;

/** Sub-argument adjustment factor (max ±30%) */
export const SUB_ARGUMENT_ADJUSTMENT_FACTOR = 0.3;

// ─── Argument Configuration ────────────────────────────────────

/** Minimum arguments for "calibrated" status */
export const MIN_ARGUMENTS_FOR_CALIBRATED = 4;

/** Confidence threshold for "calibrated" status */
export const CALIBRATED_CI_THRESHOLD = 0.08;

/** ReasonRank gap threshold for clear winner */
export const REASON_RANK_GAP_THRESHOLD = 0.2;

// ─── Pagination Defaults ───────────────────────────────────────

/** Default page size for list queries */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum page size allowed */
export const MAX_PAGE_SIZE = 100;

// ─── UI Configuration ──────────────────────────────────────────

/** Score thresholds for color coding */
export const SCORE_THRESHOLD_HIGH = 0.75;
export const SCORE_THRESHOLD_MODERATE = 0.6;
export const SCORE_THRESHOLD_UNCERTAIN = 0.4;
export const SCORE_THRESHOLD_LOW = 0.25;

/** Volatility thresholds */
export const VOLATILITY_THRESHOLD_HIGH = 0.12;
export const VOLATILITY_THRESHOLD_MEDIUM = 0.06;
