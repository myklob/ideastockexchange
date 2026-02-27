/**
 * Claim Strength — The Strong-to-Weak Spectrum
 *
 * The strong-to-weak spectrum maps every belief by how much its specific
 * phrasing demands from the evidence. A weak claim requires modest support
 * to be defensible. A strong claim requires correspondingly stronger
 * evidence — and if that evidence doesn't exist, the claim scores poorly
 * regardless of how many people assert it.
 *
 * This is not a bias toward moderation. It is a bias toward proportionality.
 *
 * The spectrum works alongside the positive-to-negative (valence) dimension
 * as a second coordinate axis — independent dimensions that must not be
 * conflated. Direction (pro/con) and intensity (weak/extreme) are separate.
 *
 * The "burden of proof" scaler:
 *   adjustedScore = rawScore × (1.0 − 0.75 × claimStrength)
 *
 * This means:
 *   Weak claim    (0.2) → 85% transmission  (easy to score high)
 *   Moderate claim (0.5) → 62.5% transmission
 *   Strong claim  (0.8) → 40% transmission  (hard to score high)
 *   Extreme claim (1.0) → 25% transmission  (near-total evidence required)
 *
 * An extreme claim must produce 4× better raw evidence to match a weak
 * claim's score. Extremism isn't censored — it's defeated by the standard
 * it can't meet.
 *
 * Reference: /algorithms/strong-to-weak
 */

// ─── Claim Strength Bands ─────────────────────────────────────────

export interface StrengthBand {
  /** Canonical strength value (0–1) for this tier */
  value: number
  /** Short label */
  label: string
  /** Percentage displayed to users */
  percentage: string
  /** One-line description */
  descriptor: string
  /** What kind of evidence this level requires */
  evidenceRequired: string
  /** Expected ReasonRank score range when evidence matches claims */
  typicalScoreRange: { min: number; max: number }
  /** Tailwind background color class for this band */
  bgColor: string
  /** Tailwind text color class for this band */
  textColor: string
  /** Hex color for non-Tailwind contexts */
  hexColor: string
}

export const STRENGTH_BANDS: StrengthBand[] = [
  {
    value: 0.2,
    label: 'Weak',
    percentage: '20%',
    descriptor: 'Highly Defensible',
    evidenceRequired: 'Any credible indication of imperfection. Easy to defend.',
    typicalScoreRange: { min: 0.75, max: 0.95 },
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    hexColor: '#d4edda',
  },
  {
    value: 0.5,
    label: 'Moderate',
    percentage: '50%',
    descriptor: 'Defensible',
    evidenceRequired: 'Specific data showing measurable effects across relevant domains.',
    typicalScoreRange: { min: 0.55, max: 0.80 },
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    hexColor: '#fff3cd',
  },
  {
    value: 0.8,
    label: 'Strong',
    percentage: '80%',
    descriptor: 'Contested',
    evidenceRequired: 'Comprehensive cost-benefit evidence across multiple domains.',
    typicalScoreRange: { min: 0.30, max: 0.60 },
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    hexColor: '#ffd8a8',
  },
  {
    value: 1.0,
    label: 'Extreme',
    percentage: '100%',
    descriptor: 'Indefensible',
    evidenceRequired: 'Near-total evidence dominance. Almost never achieved.',
    typicalScoreRange: { min: 0.00, max: 0.25 },
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    hexColor: '#f8d7da',
  },
]

// ─── Band Lookup ──────────────────────────────────────────────────

/**
 * Return the StrengthBand for a given claimStrength value (0–1).
 * Uses the closest band by distance.
 */
export function getStrengthBand(claimStrength: number): StrengthBand {
  const clamped = Math.max(0, Math.min(1, claimStrength))

  // Find the closest band
  let closest = STRENGTH_BANDS[0]
  let minDist = Math.abs(clamped - STRENGTH_BANDS[0].value)
  for (const band of STRENGTH_BANDS) {
    const dist = Math.abs(clamped - band.value)
    if (dist < minDist) {
      minDist = dist
      closest = band
    }
  }
  return closest
}

/**
 * Return a human-readable label for a claimStrength value.
 */
export function getStrengthLabel(claimStrength: number): string {
  return getStrengthBand(claimStrength).label
}

/**
 * Return the expected ReasonRank score range for a given strength.
 * The range represents realistic achievable scores when evidence
 * quality matches the claim's intensity.
 */
export function getExpectedScoreRange(claimStrength: number): { min: number; max: number } {
  return getStrengthBand(claimStrength).typicalScoreRange
}

// ─── Strength-Adjusted Score ──────────────────────────────────────

/**
 * Apply the burden-of-proof scaler to a raw ReasonRank score.
 *
 * The formula: adjustedScore = rawScore × (1.0 − 0.75 × claimStrength)
 *
 * The factor (1.0 − 0.75 × claimStrength) is the "burden of proof
 * transmission rate" — what fraction of the raw score survives the
 * evidentiary bar set by the claim's own intensity.
 *
 * Transmission rates by band:
 *   Weak    (0.2): 85%   — almost full transmission
 *   Moderate (0.5): 62.5% — moderate damping
 *   Strong  (0.8): 40%   — heavy damping
 *   Extreme (1.0): 25%   — near-total damping
 *
 * A claim that produces extraordinary evidence (raw score near 1.0)
 * will still score near 0.25 at extreme strength — which is exactly
 * what the system intends. Extraordinary claims require extraordinary
 * evidence just to reach the "Very Low" tier.
 *
 * If overwhelming evidence genuinely exists, it will score accordingly.
 * But it has to earn it.
 *
 * @param rawScore      The ReasonRank score before strength adjustment (0–1)
 * @param claimStrength The claim's position on the strong-to-weak spectrum (0–1)
 * @returns Adjusted score (0–1)
 */
export function applyStrengthPenalty(rawScore: number, claimStrength: number): number {
  const clamped = Math.max(0, Math.min(1, claimStrength))
  const burdenFactor = 1.0 - 0.75 * clamped
  return Math.max(0, Math.min(1, rawScore * burdenFactor))
}

/**
 * The inverse: given an adjusted score and a claim strength, recover
 * the raw evidence quality required to produce that adjusted score.
 *
 * Useful for displaying "Evidence quality needed: X" to users.
 *
 * @param targetScore   Desired adjusted score (0–1)
 * @param claimStrength Claim's position on the spectrum (0–1)
 * @returns Required raw ReasonRank score (0–1), clamped to [0, 1]
 */
export function requiredRawScore(targetScore: number, claimStrength: number): number {
  const clamped = Math.max(0, Math.min(1, claimStrength))
  const burdenFactor = 1.0 - 0.75 * clamped
  if (burdenFactor === 0) return 1.0
  return Math.max(0, Math.min(1, targetScore / burdenFactor))
}

// ─── Linkage Strength Compatibility ──────────────────────────────

/**
 * Check whether evidence that supports a weaker version of a claim
 * can be considered to support a stronger version of the same claim.
 *
 * Evidence supporting a weak claim does NOT automatically support a
 * stronger version. A study showing "social media correlates with
 * increased anxiety" strongly supports the weak claim "social media
 * has some mental health costs" but provides almost no linkage to the
 * extreme claim "social media is destroying an entire generation."
 *
 * The linkage transmission is: max(0, 1 − (targetStrength − evidenceStrength) × 2)
 *
 * If evidence targets a claim of equal strength → full transmission (1.0)
 * If evidence is 0.5 strength below target → 0.0 transmission (no linkage)
 *
 * @param evidenceStrength  The claim strength the evidence was gathered for (0–1)
 * @param targetStrength    The claim strength being argued for (0–1)
 * @returns Linkage transmission factor (0–1)
 */
export function strengthLinkageTransmission(
  evidenceStrength: number,
  targetStrength: number
): number {
  const gap = targetStrength - evidenceStrength
  if (gap <= 0) return 1.0 // Evidence for a stronger claim carries to weaker versions
  // Each 0.5 strength gap above the evidence halves transmission to zero
  return Math.max(0, 1.0 - gap * 2.0)
}

// ─── Two-Axis Coordinate System ───────────────────────────────────

/**
 * The full two-axis position of a belief in the ISE coordinate system.
 *
 * Axis 1 — Positive ↔ Negative (valence/positivity): What side are you on?
 * Axis 2 — Weak ↔ Strong (claim strength): How much are you claiming?
 *
 * "Immigration policy needs improvement" and "immigration is destroying
 * the country" share the same direction (negative toward current policy)
 * but sit at opposite ends of the strength axis. Treating them as the
 * same position is where binary systems go fatally wrong.
 */
export interface BeliefCoordinate {
  /** Valence/positivity: -100 to +100 (where the belief points) */
  positivity: number
  /** Claim strength: 0–1 (how much the belief asserts) */
  claimStrength: number
}

/**
 * Compute the "coordinate distance" between two beliefs in the two-axis
 * space. Used by Belief Equivalency Scores to detect when differently-
 * worded beliefs make the same underlying claim at the same intensity.
 *
 * Distance is the Euclidean distance after normalizing both axes to [0,1].
 * Two beliefs at very different strength levels are distinct claims
 * requiring separate analysis — even if pointing in the same direction.
 *
 * @returns Distance in [0, √2] — 0 = identical position, √2 ≈ 1.41 = opposite corners
 */
export function coordinateDistance(a: BeliefCoordinate, b: BeliefCoordinate): number {
  // Normalize positivity from [-100, 100] → [0, 1]
  const posA = (a.positivity + 100) / 200
  const posB = (b.positivity + 100) / 200

  const dPos = posA - posB
  const dStr = a.claimStrength - b.claimStrength

  return Math.sqrt(dPos * dPos + dStr * dStr)
}

/**
 * Whether two beliefs are at effectively the same position in 2D space.
 * The threshold of 0.15 corresponds to beliefs that are within one
 * strength band and within ±30 positivity points of each other.
 */
export function isSameCoordinate(
  a: BeliefCoordinate,
  b: BeliefCoordinate,
  threshold = 0.15
): boolean {
  return coordinateDistance(a, b) < threshold
}

// ─── Display Helpers ──────────────────────────────────────────────

/**
 * Format a claimStrength value as a percentage string.
 */
export function formatStrength(claimStrength: number): string {
  return `${Math.round(claimStrength * 100)}%`
}

/**
 * Return a brief explanation of why a high-strength claim scores lower.
 */
export function getStrengthRationale(claimStrength: number): string {
  const band = getStrengthBand(claimStrength)
  const factor = Math.round((1.0 - 0.75 * claimStrength) * 100)
  return (
    `${band.label} claim (${band.percentage}): ` +
    `Only ${factor}% of evidence strength transmits to the final score. ` +
    `${band.evidenceRequired}`
  )
}
