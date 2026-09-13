import { describe, it, expect } from 'vitest'
import {
  signedTruthFromPositivity,
  resolveGenreType,
  genrePrior,
  mediaTruthScore,
  epistemicImpact,
} from '@/core/scoring/media-truth'

describe('signedTruthFromPositivity', () => {
  it('maps the -100..+100 belief net onto the signed -1..+1 truth scale', () => {
    expect(signedTruthFromPositivity(85)).toBeCloseTo(0.85)
    expect(signedTruthFromPositivity(-70)).toBeCloseTo(-0.7)
    expect(signedTruthFromPositivity(0)).toBe(0)
  })

  it('clamps out-of-range nets instead of overflowing the scale', () => {
    expect(signedTruthFromPositivity(140)).toBe(1)
    expect(signedTruthFromPositivity(-250)).toBe(-1)
  })
})

describe('mediaTruthScore', () => {
  it('is the centrality-weighted average of the scored claims', () => {
    // The Good Earth worked example from the explainer page.
    const claims = [
      { signedTruth: 0.85, linkage: 0.95 }, // women valued for utility
      { signedTruth: 0.78, linkage: 0.9 },  // land = identity/status
      { signedTruth: 0.92, linkage: 0.75 }, // famine drives migration
      { signedTruth: 0.65, linkage: 0.15 }, // architectural detail
    ]
    const result = mediaTruthScore(claims, 'investigative')
    const expected =
      (0.85 * 0.95 + 0.78 * 0.9 + 0.92 * 0.75 + 0.65 * 0.15) /
      (0.95 + 0.9 + 0.75 + 0.15)
    expect(result.score).toBeCloseTo(expected, 10)
    expect(result.basis).toBe('claims')
    expect(result.scoredClaimCount).toBe(4)
    expect(result.linkageMass).toBeCloseTo(2.75)
  })

  it('lets debunked central claims drive the whole score negative', () => {
    const result = mediaTruthScore(
      [
        { signedTruth: -0.9, linkage: 0.95 }, // the thesis, thoroughly debunked
        { signedTruth: 0.8, linkage: 0.1 },   // an accurate peripheral detail
      ],
      'peer_reviewed',
    )
    expect(result.score).toBeLessThan(0)
    // Genre cannot save it: the score fell far below the 0.9 prior.
    expect(result.score).toBeLessThan(genrePrior('peer_reviewed'))
  })

  it('barely moves for peripheral claims, regardless of their truth', () => {
    const central = mediaTruthScore(
      [
        { signedTruth: 0.8, linkage: 0.9 },
        { signedTruth: -0.7, linkage: 0.05 },
      ],
      'unknown',
    )
    expect(central.score).toBeGreaterThan(0.7)
  })

  it('sits at the genre prior until any claim is scoreable', () => {
    expect(mediaTruthScore([], 'peer_reviewed')).toEqual({
      score: 0.9,
      basis: 'genre-prior',
      scoredClaimCount: 0,
      linkageMass: 0,
    })
    expect(mediaTruthScore([], 'social_media').score).toBeCloseTo(0.15)
  })

  it('excludes unlinked claims (null truth) and zero-centrality claims', () => {
    const result = mediaTruthScore(
      [
        { signedTruth: null, linkage: 0.95 }, // extracted, not yet linked
        { signedTruth: 0.9, linkage: 0 },     // linked, but centrality zero
        { signedTruth: 0.6, linkage: 0.5 },
      ],
      'opinion',
    )
    expect(result.scoredClaimCount).toBe(1)
    expect(result.score).toBeCloseTo(0.6)
  })

  it('falls back to the prior when every claim is unlinked', () => {
    const result = mediaTruthScore(
      [{ signedTruth: null, linkage: 0.9 }],
      'opinion',
    )
    expect(result.basis).toBe('genre-prior')
    expect(result.score).toBeCloseTo(0.3)
  })

  it('clamps rogue inputs so the score stays on the -1..+1 scale', () => {
    const result = mediaTruthScore(
      [{ signedTruth: 5, linkage: 3 }],
      'unknown',
    )
    expect(result.score).toBe(1)
  })
})

describe('resolveGenreType', () => {
  it('prefers the stored classification when it is known', () => {
    expect(resolveGenreType('peer_reviewed', 'book')).toBe('peer_reviewed')
  })

  it('infers from the coarse media type when unclassified', () => {
    expect(resolveGenreType('unknown', 'book')).toBe('investigative')
    expect(resolveGenreType('', 'podcast')).toBe('opinion')
  })

  it('never trusts a non-canonical stored genre — legacy strings fall back to inference', () => {
    expect(resolveGenreType('academic_popular', 'book')).toBe('investigative')
    expect(resolveGenreType('institutional_report', 'nonsense-type')).toBe('unknown')
    // The fallback must always land on a genre the prior table knows.
    expect(genrePrior(resolveGenreType('institutional_report', 'nonsense-type'))).toBeTypeOf('number')
  })
})

describe('epistemicImpact', () => {
  it('multiplies signed truth by reach, so wrong-and-viral goes deeply negative', () => {
    expect(epistemicImpact(0.85, 5_000_000)).toBeCloseTo(4_250_000)
    expect(epistemicImpact(-0.6, 50_000_000)).toBeCloseTo(-30_000_000)
    // The blockbuster case: -0.85 × 2B ≈ -1.7B.
    expect(epistemicImpact(-0.85, 2_000_000_000)).toBeCloseTo(-1_700_000_000)
  })

  it('is zero when reach is zero — an unseen claim moves nobody', () => {
    expect(epistemicImpact(-1, 0)).toBe(0)
  })
})
