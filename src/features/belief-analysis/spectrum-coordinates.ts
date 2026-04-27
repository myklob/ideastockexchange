/**
 * Conversion helpers between internal storage scales and the public
 * &ldquo;spectrum_coordinates&rdquo; shape from the One-Page-Per-Belief technical spec.
 *
 * Internal (Prisma):
 *   positivity      Float (-100..+100)
 *   specificity     Float (0..1)
 *   claimStrength   Float (0..1)
 *
 * Public (spec &sect;1):
 *   valence         Integer (-5..+5)
 *   specificity     Integer (1..10)
 *   intensity       Integer (1..5)
 *
 * The internal scales are kept as floats so propagation math stays continuous;
 * the public scales are coarse buckets meant for navigation and URL filters.
 */

export interface InternalSpectrum {
  positivity: number
  specificity: number
  claimStrength: number
}

export interface SpectrumCoordinates {
  valence: number
  specificity: number
  intensity: number
}

const clampInt = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, Math.round(value)))

/** -100..+100 → -5..+5 (rounded). */
export function toValenceCoord(positivity: number): number {
  return clampInt(positivity / 20, -5, 5)
}

/** 0..1 → 1..10 (rounded; 0 maps to 1, 1 maps to 10). */
export function toSpecificityCoord(specificity: number): number {
  return clampInt(specificity * 9 + 1, 1, 10)
}

/** 0..1 → 1..5 (rounded; 0 maps to 1, 1 maps to 5). */
export function toIntensityCoord(claimStrength: number): number {
  return clampInt(claimStrength * 4 + 1, 1, 5)
}

export function toSpectrumCoordinates(belief: InternalSpectrum): SpectrumCoordinates {
  return {
    valence: toValenceCoord(belief.positivity),
    specificity: toSpecificityCoord(belief.specificity),
    intensity: toIntensityCoord(belief.claimStrength),
  }
}

/** Inverse of {@link toValenceCoord}: spec valence (-5..+5) back to positivity (-100..+100). */
export function fromValenceCoord(valence: number): number {
  return clampInt(valence, -5, 5) * 20
}

/** Inverse of {@link toSpecificityCoord}: spec spec (1..10) back to internal 0..1. */
export function fromSpecificityCoord(spec: number): number {
  return (clampInt(spec, 1, 10) - 1) / 9
}

/** Inverse of {@link toIntensityCoord}: spec intensity (1..5) back to claimStrength 0..1. */
export function fromIntensityCoord(intensity: number): number {
  return (clampInt(intensity, 1, 5) - 1) / 4
}
