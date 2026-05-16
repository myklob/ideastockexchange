export interface StrengthBand {
  value: number
  label: string
  percentage: string
  descriptor: string
  evidenceRequired: string
  typicalScoreRange: { min: number; max: number }
  bgColor: string
  textColor: string
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

export function getStrengthBand(claimStrength: number): StrengthBand {
  const clamped = Math.max(0, Math.min(1, claimStrength))
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

export function getStrengthLabel(claimStrength: number): string {
  return getStrengthBand(claimStrength).label
}

export function formatStrength(claimStrength: number): string {
  return `${Math.round(claimStrength * 100)}%`
}

export function applyStrengthPenalty(rawScore: number, claimStrength: number): number {
  const clamped = Math.max(0, Math.min(1, claimStrength))
  const burdenFactor = 1.0 - 0.75 * clamped
  return Math.max(0, Math.min(1, rawScore * burdenFactor))
}

export function getStrengthRationale(claimStrength: number): string {
  const band = getStrengthBand(claimStrength)
  const factor = Math.round((1.0 - 0.75 * claimStrength) * 100)
  return (
    `${band.label} claim (${band.percentage}): ` +
    `Only ${factor}% of evidence strength transmits to the final score. ` +
    `${band.evidenceRequired}`
  )
}
