// Cross-partisan calibration: how much weight a user's fallacy work carries.
//
// The tribal failure mode is selective vision — seeing fallacies fluently in
// the other side's arguments and never in your own. The countermeasure is a
// track record: accuracy (did the community uphold your past claims?) and
// balance (do you flag both sides of debates, or only one?). The product of
// those two factors, clamped, is the credibility multiplier applied to this
// user's fallacy-claim votes. Filing volume never raises it; only being
// right and being even-handed do.

export interface CallerRecord {
  /** Resolved claims the community confirmed. */
  upheld: number
  /** Resolved claims the community rejected. */
  rejected: number
  /** Claims filed against agree-side arguments (any status). */
  flaggedAgreeSide: number
  /** Claims filed against disagree-side arguments (any status). */
  flaggedDisagreeSide: number
}

export const CREDIBILITY_FLOOR = 0.3
export const CREDIBILITY_CEILING = 1.4

/** Below these sample sizes a factor stays neutral (1.0): no penalty and no
 *  boost until there is enough history to mean anything. */
export const MIN_RESOLVED_FOR_ACCURACY = 3
export const MIN_FLAGGED_FOR_BALANCE = 5

// Balance factor is linear in the side ratio: fully one-sided → 0.4, evenly
// split → 1.3, neutral (1.0) at a ratio of 2:3. +1 smoothing keeps a single
// early claim from reading as proof of tribalism.
const BALANCE_FLOOR = 0.4
const BALANCE_SLOPE = 0.9

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value))
}

/** min/max ratio of the two side counts, smoothed; 1 = perfectly balanced. */
export function sideBalance(record: CallerRecord): number {
  const a = Math.max(0, record.flaggedAgreeSide)
  const b = Math.max(0, record.flaggedDisagreeSide)
  return (Math.min(a, b) + 1) / (Math.max(a, b) + 1)
}

/** Share of resolved claims the community upheld; null with no history. */
export function accuracyRate(record: CallerRecord): number | null {
  const resolved = record.upheld + record.rejected
  return resolved > 0 ? record.upheld / resolved : null
}

/**
 * The credibility multiplier in [0.3, 1.4].
 *
 *   multiplier = clamp(accuracyFactor × balanceFactor)
 *   accuracyFactor = 2 × accuracy   (0.5 accuracy is neutral)
 *   balanceFactor  = 0.4 + 0.9 × sideBalance
 *
 * Anchors from the design essay: a caller with 40% accuracy who flags one
 * side almost exclusively lands at the floor (severe tribal bias, influence
 * reduced); a caller with 82% accuracy who flags both sides lands well above
 * 1 (impartiality raises influence). A new user with no history is exactly
 * 1.0 — no information, no adjustment.
 */
export function callerCredibility(record: CallerRecord): number {
  const accuracy = accuracyRate(record)
  const resolved = record.upheld + record.rejected
  const accuracyFactor =
    accuracy !== null && resolved >= MIN_RESOLVED_FOR_ACCURACY ? 2 * accuracy : 1

  const totalFlagged = record.flaggedAgreeSide + record.flaggedDisagreeSide
  const balanceFactor =
    totalFlagged >= MIN_FLAGGED_FOR_BALANCE
      ? BALANCE_FLOOR + BALANCE_SLOPE * sideBalance(record)
      : 1

  return clamp(accuracyFactor * balanceFactor, CREDIBILITY_FLOOR, CREDIBILITY_CEILING)
}
