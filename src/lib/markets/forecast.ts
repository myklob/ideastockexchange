/**
 * Probabilistic score forecasts → the continuous price feed.
 *
 * Models the belief score as drifting randomly between now and the
 * resolution boundary: final ~ Normal(currentScore, sigma² × t), with t in
 * 30-day units. The YES probability is the mass on the winning side of the
 * threshold. Display and feed only — the forecast never touches settlement
 * (settlement is the snapshot) and never touches scoring.
 */

export interface ForecastParams {
  currentScore: number
  threshold: number
  direction: 'ABOVE' | 'BELOW'
  /** Days until the resolution boundary; clamped at 0. */
  daysToResolution: number
  /** Score volatility per sqrt(30 days). Default calibrated loose on purpose. */
  sigmaPer30d?: number
}

const DEFAULT_SIGMA_PER_30D = 0.08

/** Standard normal CDF via the Abramowitz–Stegun erf approximation. */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2)
  const poly =
    t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  const p = 1 - d * poly
  return z >= 0 ? p : 1 - p
}

export function forecastYesProbability({
  currentScore,
  threshold,
  direction,
  daysToResolution,
  sigmaPer30d = DEFAULT_SIGMA_PER_30D,
}: ForecastParams): number {
  const days = Math.max(0, daysToResolution)
  const sigma = sigmaPer30d * Math.sqrt(days / 30)

  if (sigma === 0) {
    // At the boundary the forecast is a step function. Strict inequality:
    // score exactly at the threshold resolves NO.
    if (direction === 'ABOVE') return currentScore > threshold ? 1 : 0
    return currentScore < threshold ? 1 : 0
  }

  const z = (threshold - currentScore) / sigma
  const pAbove = 1 - normalCdf(z)
  const p = direction === 'ABOVE' ? pAbove : 1 - pAbove
  return Math.min(1, Math.max(0, p))
}
