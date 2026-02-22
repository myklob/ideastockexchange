/**
 * Unit tests for the Duplication Scoring module
 *
 * Tests cover:
 * - Layer 1: Mechanical equivalence (synonym normalization, negated antonyms)
 * - Layer blending (weighted combination of layers 1–3)
 * - Uniqueness score derivation
 * - Contribution factor formula
 * - Novelty premium decay
 * - Full pipeline (scoreArgumentsForDuplication)
 * - Cluster generation
 * - Evidence corroboration boost
 *
 * Design philosophy: all inputs and outputs are deterministic pure functions
 * (no ML, no network).  The semantic Layer 2 is exercised by passing
 * pre-computed similarity scores as if they came from the Python backend.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeClaim,
  jaccardSimilarity,
  mechanicalSimilarity,
  isMechanicalDuplicate,
  blendSimilarityLayers,
  uniquenessFromSimilarities,
  contributionFactor,
  noveltyMultiplier,
  effectiveContribution,
  scoreArgumentsForDuplication,
  clusterArguments,
  corroborationBoost,
  MECHANICAL_EQUIVALENCE_THRESHOLD,
  DEFAULT_LAYER_WEIGHTS,
  NOVELTY_DEFAULTS,
  MAX_CORROBORATION_BOOST,
} from '../../../../src/core/scoring/duplication-scoring'
import type { ArgumentInput, EvidenceSource } from '../../../../src/core/scoring/duplication-scoring'

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Build an ArgumentInput with sensible defaults. */
function makeArg(overrides: Partial<ArgumentInput> & { id: string; claim: string }): ArgumentInput {
  return {
    baseScore: 80,
    submittedAt: new Date('2024-01-01T12:00:00Z'),
    ...overrides,
  }
}

/** A fixed "now" for novelty tests so decay is deterministic. */
const NOW = new Date('2024-01-02T12:00:00Z')  // 24 h after the default submittedAt

// ─── Layer 1: normalizeClaim ──────────────────────────────────────────────

describe('normalizeClaim', () => {
  it('lowercases and removes punctuation', () => {
    const tokens = normalizeClaim('Taxes Should Be LOWER!')
    expect(tokens).not.toContain('LOWER')
    expect(tokens).not.toContain('!')
  })

  it('removes stopwords', () => {
    const tokens = normalizeClaim('the taxes should be lower')
    expect(tokens).not.toContain('the')
    expect(tokens).not.toContain('be')
    expect(tokens).not.toContain('should')
  })

  it('canonicalizes synonyms so "reduce" and "lower" match', () => {
    // "lower" and "reduce" → same canonical form ('decrease').
    // "taxes" and "tax" → same canonical form ('tax').
    // Use present-tense verb forms that exist directly in the synonym group.
    const tokensA = normalizeClaim('taxes should lower')
    const tokensB = normalizeClaim('taxes should reduce')
    // After canonicalization both produce the identical token set
    expect(tokensA).toEqual(tokensB)
    expect(tokensA).toContain('decrease') // the canonical for lower/reduce/decrease
    expect(tokensA).toContain('tax')      // the canonical for tax/taxes/taxation
  })

  it('collapses "not unintelligent" → positive form of antonym', () => {
    const tokens = normalizeClaim('he is not unintelligent')
    // "not unintelligent" should resolve to the positive token (antonym of unintelligent)
    expect(tokens).not.toContain('unintelligent')
    expect(tokens).not.toContain('not')
  })

  it('returns a sorted array (word order does not matter)', () => {
    const tokensA = normalizeClaim('lower taxes')
    const tokensB = normalizeClaim('taxes lower')
    expect(tokensA).toEqual(tokensB)
  })
})

// ─── Layer 1: jaccardSimilarity ───────────────────────────────────────────

describe('jaccardSimilarity', () => {
  it('returns 1.0 for identical token arrays', () => {
    expect(jaccardSimilarity(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(1.0)
  })

  it('returns 0.0 for disjoint token arrays', () => {
    expect(jaccardSimilarity(['a', 'b'], ['c', 'd'])).toBe(0.0)
  })

  it('returns 1.0 for two empty arrays', () => {
    expect(jaccardSimilarity([], [])).toBe(1.0)
  })

  it('returns 0.0 when one array is empty', () => {
    expect(jaccardSimilarity(['a'], [])).toBe(0.0)
    expect(jaccardSimilarity([], ['b'])).toBe(0.0)
  })

  it('computes correct partial overlap', () => {
    // {a,b,c} ∩ {b,c,d} = {b,c}, union = {a,b,c,d} → 2/4 = 0.5
    expect(jaccardSimilarity(['a', 'b', 'c'], ['b', 'c', 'd'])).toBeCloseTo(0.5)
  })
})

// ─── Layer 1: mechanicalSimilarity ───────────────────────────────────────

describe('mechanicalSimilarity', () => {
  it('scores synonym substitutions as near-identical', () => {
    // "taxes"/"tax" → same canonical; "lower"/"reduce" → same canonical.
    // Present-tense forms map directly; both texts produce the same token set.
    const score = mechanicalSimilarity(
      'taxes should lower',
      'taxes should reduce',
    )
    expect(score).toBeGreaterThan(0.9)
  })

  it('scores unrelated claims near 0', () => {
    const score = mechanicalSimilarity(
      'Smoking causes cancer',
      'Interest rates should rise',
    )
    expect(score).toBeLessThan(0.3)
  })
})

// ─── Layer 1: isMechanicalDuplicate ──────────────────────────────────────

describe('isMechanicalDuplicate', () => {
  it('flags synonym-substituted claims as duplicates', () => {
    // "taxes"/"tax" → same canonical; "lower"/"reduce" → same canonical.
    // Present-tense forms are used so the canonical lookup applies directly.
    expect(
      isMechanicalDuplicate('taxes should lower', 'taxes should reduce'),
    ).toBe(true)
  })

  it('does not flag genuinely distinct claims', () => {
    expect(
      isMechanicalDuplicate(
        'Donald Trump is unintelligent',
        'Climate policy is too expensive',
      ),
    ).toBe(false)
  })

  it('respects a custom threshold', () => {
    // Force a very low threshold → almost everything is a "duplicate"
    expect(
      isMechanicalDuplicate('apple orange', 'apple banana', 0.1),
    ).toBe(true)
    // Force a very high threshold → only perfect matches count
    expect(
      isMechanicalDuplicate('Tax rates should be lower', 'Taxes should be reduced', 0.999),
    ).toBe(false)
  })
})

// ─── Layer blending ───────────────────────────────────────────────────────

describe('blendSimilarityLayers', () => {
  it('returns 1.0 immediately when Layer 1 hits mechanical threshold', () => {
    const result = blendSimilarityLayers(
      MECHANICAL_EQUIVALENCE_THRESHOLD, // L1 at threshold
      0.3,  // L2 low
      null, // no L3
    )
    expect(result).toBe(1.0)
  })

  it('blends L1 and L2 with correct weights when L3 is null', () => {
    // L1 = 0.4, L2 = 0.6, weights L1:0.4 L2:0.6 → (0.4×0.4 + 0.6×0.6) / 1.0 = 0.52
    const result = blendSimilarityLayers(0.4, 0.6, null, { layer1: 0.4, layer2: 0.6, layer3: 0.0 })
    expect(result).toBeCloseTo((0.4 * 0.4 + 0.6 * 0.6) / (0.4 + 0.6))
  })

  it('incorporates L3 when provided', () => {
    const result = blendSimilarityLayers(
      0.5, // L1
      0.7, // L2
      0.9, // L3 — high community agreement
      { layer1: 0.2, layer2: 0.5, layer3: 0.3 },
    )
    // Should be weighted toward L3's high score
    expect(result).toBeGreaterThan(0.7)
  })

  it('clamps output to [0, 1]', () => {
    expect(blendSimilarityLayers(1.5, 1.5, 1.5)).toBeLessThanOrEqual(1.0)
    expect(blendSimilarityLayers(-1, -1, null)).toBeGreaterThanOrEqual(0.0)
  })
})

// ─── uniquenessFromSimilarities ───────────────────────────────────────────

describe('uniquenessFromSimilarities', () => {
  it('returns 1.0 for the first argument (no prior comparisons)', () => {
    expect(uniquenessFromSimilarities([])).toBe(1.0)
  })

  it('returns 1 − maxSimilarity', () => {
    expect(uniquenessFromSimilarities([0.3, 0.7, 0.5])).toBeCloseTo(0.3)
  })

  it('returns 0.0 when a prior argument is identical', () => {
    expect(uniquenessFromSimilarities([0.8, 1.0, 0.6])).toBe(0.0)
  })

  it('clamps to [0, 1]', () => {
    expect(uniquenessFromSimilarities([1.5])).toBeGreaterThanOrEqual(0.0)
    expect(uniquenessFromSimilarities([-0.5])).toBeLessThanOrEqual(1.0)
  })
})

// ─── contributionFactor ───────────────────────────────────────────────────

describe('contributionFactor', () => {
  it('90% similar → 10% contribution', () => {
    expect(contributionFactor(0.9)).toBeCloseTo(0.1)
  })

  it('70% similar → 30% contribution', () => {
    expect(contributionFactor(0.7)).toBeCloseTo(0.3)
  })

  it('0% similar (novel) → 100% contribution', () => {
    expect(contributionFactor(0.0)).toBeCloseTo(1.0)
  })

  it('100% similar → 0% contribution (duplicate adds nothing)', () => {
    expect(contributionFactor(1.0)).toBeCloseTo(0.0)
  })
})

// ─── noveltyMultiplier ────────────────────────────────────────────────────

describe('noveltyMultiplier', () => {
  const submittedAt = new Date('2024-01-01T12:00:00Z')

  it('applies peak multiplier immediately after submission', () => {
    const mul = noveltyMultiplier(submittedAt, 1.0, { now: submittedAt })
    expect(mul).toBeCloseTo(NOVELTY_DEFAULTS.peakMultiplier)
  })

  it('decays to halfway between peak and floor after one half-life', () => {
    const oneHalfLifeLater = new Date(
      submittedAt.getTime() + NOVELTY_DEFAULTS.halflifeHours * 60 * 60 * 1000,
    )
    const mul = noveltyMultiplier(submittedAt, 1.0, { now: oneHalfLifeLater })
    const expected =
      NOVELTY_DEFAULTS.floor +
      (NOVELTY_DEFAULTS.peakMultiplier - NOVELTY_DEFAULTS.floor) * 0.5
    expect(mul).toBeCloseTo(expected, 5)
  })

  it('approaches floor asymptotically for old arguments', () => {
    const veryOld = new Date(submittedAt.getTime() + 1000 * 60 * 60 * 1000) // 1000h
    const mul = noveltyMultiplier(submittedAt, 1.0, { now: veryOld })
    expect(mul).toBeCloseTo(NOVELTY_DEFAULTS.floor, 3)
  })

  it('applies no boost to arguments below novelty threshold (detected duplicates)', () => {
    const mul = noveltyMultiplier(submittedAt, 0.1, { now: submittedAt })
    expect(mul).toBe(NOVELTY_DEFAULTS.floor)
  })

  it('returns floor when uniqueness is exactly at the threshold boundary', () => {
    const mul = noveltyMultiplier(submittedAt, NOVELTY_DEFAULTS.noveltyThreshold - 0.01, {
      now: submittedAt,
    })
    expect(mul).toBe(NOVELTY_DEFAULTS.floor)
  })
})

// ─── effectiveContribution ────────────────────────────────────────────────

describe('effectiveContribution', () => {
  it('returns baseScore when argument is fully unique and has no novelty', () => {
    expect(effectiveContribution(80, 1.0, 1.0)).toBe(80)
  })

  it('halves contribution when uniqueness is 0.5', () => {
    expect(effectiveContribution(80, 0.5, 1.0)).toBeCloseTo(40)
  })

  it('returns 0 when argument is a complete duplicate', () => {
    expect(effectiveContribution(80, 0.0, 1.0)).toBe(0)
  })

  it('amplifies contribution via novelty premium', () => {
    expect(effectiveContribution(80, 1.0, 1.25)).toBeCloseTo(100)
  })
})

// ─── scoreArgumentsForDuplication ────────────────────────────────────────

describe('scoreArgumentsForDuplication', () => {
  it('gives the first argument uniqueness = 1.0', () => {
    const args = [makeArg({ id: 'a1', claim: 'Taxes should be lower' })]
    const [result] = scoreArgumentsForDuplication(args)
    expect(result.uniquenessScore).toBe(1.0)
  })

  it('penalises a mechanical duplicate (Layer 1)', () => {
    // "taxes should lower" and "taxes should reduce" normalize to the same token
    // set → L1 = 1.0 → combined = 1.0 → uniqueness = 0 for the second.
    const args = [
      makeArg({ id: 'a1', claim: 'taxes should lower', submittedAt: new Date('2024-01-01T10:00:00Z') }),
      makeArg({ id: 'a2', claim: 'taxes should reduce', submittedAt: new Date('2024-01-01T11:00:00Z') }),
    ]
    const results = scoreArgumentsForDuplication(args, DEFAULT_LAYER_WEIGHTS, { now: NOW })
    const [first, second] = results

    expect(first.uniquenessScore).toBe(1.0)
    // Second is a mechanical duplicate → L1 hits threshold → combined = 1.0 → uniqueness = 0
    expect(second.uniquenessScore).toBe(0)
    expect(second.effectiveContribution).toBe(0)
  })

  it('applies semantic overlap penalty when pre-computed L2 scores are provided', () => {
    // "Trump is unintelligent" and "Trump has a short attention span" share only
    // "trump" as a token after normalization → L1 ≈ 0.
    // With DEFAULT_LAYER_WEIGHTS (l1: 0.4, l2: 0.6):
    //   combined ≈ (0 × 0.4 + 0.70 × 0.6) / 1.0 = 0.42
    //   uniqueness = 1 − 0.42 = 0.58
    // The semantic score meaningfully reduces uniqueness from 1.0 to ~0.58.
    const args = [
      makeArg({ id: 'a1', claim: 'Trump is unintelligent', submittedAt: new Date('2024-01-01T10:00:00Z') }),
      makeArg({
        id: 'a2',
        claim: 'Trump has a short attention span',
        submittedAt: new Date('2024-01-01T11:00:00Z'),
        semanticSimilarities: { a1: 0.70 }, // 70% semantically similar (from Python backend)
      }),
    ]
    const results = scoreArgumentsForDuplication(args, DEFAULT_LAYER_WEIGHTS, { now: NOW })
    // Second argument should be less unique than the first
    expect(results[1].uniquenessScore).toBeLessThan(results[0].uniquenessScore)
    // Combined score is pulled toward L2=0.70 → uniqueness noticeably below 1.0
    expect(results[1].uniquenessScore).toBeLessThan(0.7)
    // But it should NOT be zero — these are related, not identical
    expect(results[1].uniquenessScore).toBeGreaterThan(0.0)
  })

  it('preserves original argument order in the output', () => {
    const args = [
      makeArg({ id: 'newer', claim: 'Claim B', submittedAt: new Date('2024-01-02T00:00:00Z') }),
      makeArg({ id: 'older', claim: 'Claim A', submittedAt: new Date('2024-01-01T00:00:00Z') }),
    ]
    const results = scoreArgumentsForDuplication(args)
    // Output should follow input order (newer, older) despite oldest-first processing
    expect(results[0].id).toBe('newer')
    expect(results[1].id).toBe('older')
  })

  it('applies community (Layer 3) score when provided', () => {
    // L1 ≈ 0.5 ("claim" shared but "reworded" extra token); L2 = 0.60; L3 = 0.95.
    // With weights l1:0.2, l2:0.4, l3:0.4:
    //   combined ≈ (0.5×0.2 + 0.60×0.4 + 0.95×0.4) / 1.0 = 0.10 + 0.24 + 0.38 = 0.72
    //   uniqueness = 1 − 0.72 = 0.28
    // The community's strong 95% verdict raises the combined score significantly.
    const args = [
      makeArg({ id: 'a1', claim: 'Claim A', submittedAt: new Date('2024-01-01T10:00:00Z') }),
      makeArg({
        id: 'a2',
        claim: 'Claim A (reworded)',
        submittedAt: new Date('2024-01-01T11:00:00Z'),
        semanticSimilarities: { a1: 0.60 },
        communityScores: { a1: 0.95 }, // community says 95% the same
      }),
    ]
    const results = scoreArgumentsForDuplication(args, { layer1: 0.2, layer2: 0.4, layer3: 0.4 }, { now: NOW })
    // High L3 brings combined well above L2-alone → uniqueness substantially reduced
    expect(results[1].uniquenessScore).toBeLessThan(results[0].uniquenessScore)
    // Combined ≈ 0.72 → uniqueness ≈ 0.28
    expect(results[1].uniquenessScore).toBeLessThan(0.35)
  })

  it('novel arguments receive an effective contribution above baseScore (novelty premium)', () => {
    const submittedAt = new Date('2024-01-01T12:00:00Z')
    const justNow = new Date(submittedAt.getTime() + 1) // practically no decay
    const args = [makeArg({ id: 'a1', claim: 'Completely novel point', submittedAt })]
    const [result] = scoreArgumentsForDuplication(args, DEFAULT_LAYER_WEIGHTS, { now: justNow })
    expect(result.effectiveContribution).toBeGreaterThan(result.baseScore)
  })
})

// ─── clusterArguments ────────────────────────────────────────────────────

describe('clusterArguments', () => {
  it('puts highly similar arguments in the same cluster', () => {
    // Mechanical duplicates (L1 hits threshold → combined = 1.0) are guaranteed
    // to exceed the 0.70 cluster threshold.
    const args = [
      makeArg({ id: 'a1', claim: 'taxes should lower', submittedAt: new Date('2024-01-01T10:00:00Z') }),
      makeArg({
        id: 'a2',
        claim: 'taxes should reduce',
        submittedAt: new Date('2024-01-01T11:00:00Z'),
      }),
    ]
    const scored = scoreArgumentsForDuplication(args, DEFAULT_LAYER_WEIGHTS, { now: NOW })
    const clusters = clusterArguments(scored, 0.70)

    expect(clusters).toHaveLength(1)
    expect(clusters[0].memberIds).toContain('a1')
    expect(clusters[0].memberIds).toContain('a2')
  })

  it('puts genuinely distinct arguments in separate clusters', () => {
    const args = [
      makeArg({ id: 'a1', claim: 'Smoking causes cancer', submittedAt: new Date('2024-01-01T10:00:00Z') }),
      makeArg({
        id: 'a2',
        claim: 'Interest rates should rise',
        submittedAt: new Date('2024-01-01T11:00:00Z'),
        semanticSimilarities: { a1: 0.05 }, // nearly zero overlap
      }),
    ]
    const scored = scoreArgumentsForDuplication(args, DEFAULT_LAYER_WEIGHTS, { now: NOW })
    const clusters = clusterArguments(scored, 0.70)

    expect(clusters).toHaveLength(2)
  })

  it('selects the highest-baseScore argument as cluster representative', () => {
    // Mechanical duplicates → combined = 1.0 → same cluster guaranteed.
    // a2 has the higher baseScore so it should be chosen as representative.
    const args = [
      makeArg({ id: 'a1', claim: 'taxes should lower', baseScore: 60, submittedAt: new Date('2024-01-01T10:00:00Z') }),
      makeArg({
        id: 'a2',
        claim: 'taxes should reduce',
        baseScore: 90,
        submittedAt: new Date('2024-01-01T11:00:00Z'),
      }),
    ]
    const scored = scoreArgumentsForDuplication(args, DEFAULT_LAYER_WEIGHTS, { now: NOW })
    const clusters = clusterArguments(scored, 0.70)

    // a2 has higher baseScore → should be representative
    expect(clusters[0].representativeId).toBe('a2')
  })

  it('cluster score is sum of effective contributions (duplication-adjusted)', () => {
    const args = [
      makeArg({ id: 'a1', claim: 'Taxes should be lower', baseScore: 80, submittedAt: new Date('2024-01-01T10:00:00Z') }),
      makeArg({
        id: 'a2',
        claim: 'Tax rates should be reduced',
        baseScore: 80,
        submittedAt: new Date('2024-01-01T11:00:00Z'),
        semanticSimilarities: { a1: 0.90 }, // 90% similar → a2 contributes ~10% of 80 = ~8
      }),
    ]
    const scored = scoreArgumentsForDuplication(args, DEFAULT_LAYER_WEIGHTS, { now: NOW })
    const clusters = clusterArguments(scored, 0.70)

    const clusterScore = clusters[0].clusterScore
    // Should be roughly: a1 full contribution + a2 penalised contribution
    // a1 ≈ 80×1.0 (+ small novelty at 24h ≈ floor); a2 ≈ 80×0.10 = 8
    // Total ≈ 88, definitely less than 160 (no dedup) and more than 80 (some a2 value)
    expect(clusterScore).toBeGreaterThan(80)
    expect(clusterScore).toBeLessThan(160)
  })
})

// ─── corroborationBoost ───────────────────────────────────────────────────

describe('corroborationBoost', () => {
  it('returns 0 for an empty source list', () => {
    expect(corroborationBoost([])).toBe(0)
  })

  it('increases with more sources', () => {
    const oneSource: EvidenceSource[] = [{ id: 'e1', qualityTier: 'T1' }]
    const threeSources: EvidenceSource[] = [
      { id: 'e1', qualityTier: 'T1' },
      { id: 'e2', qualityTier: 'T1' },
      { id: 'e3', qualityTier: 'T1' },
    ]
    expect(corroborationBoost(threeSources)).toBeGreaterThan(corroborationBoost(oneSource))
  })

  it('never exceeds MAX_CORROBORATION_BOOST', () => {
    const manySources: EvidenceSource[] = Array.from({ length: 100 }, (_, i) => ({
      id: `e${i}`,
      qualityTier: 'T1' as const,
    }))
    expect(corroborationBoost(manySources)).toBeLessThanOrEqual(MAX_CORROBORATION_BOOST)
  })

  it('weights T1 sources more than T4 sources', () => {
    const t1: EvidenceSource[] = [{ id: 'e1', qualityTier: 'T1' }]
    const t4: EvidenceSource[] = [{ id: 'e2', qualityTier: 'T4' }]
    expect(corroborationBoost(t1)).toBeGreaterThan(corroborationBoost(t4))
  })

  it('uses diminishing returns so the 10th source adds less than the 1st', () => {
    const buildSources = (n: number): EvidenceSource[] =>
      Array.from({ length: n }, (_, i) => ({ id: `e${i}`, qualityTier: 'T2' as const }))

    const delta1 = corroborationBoost(buildSources(1)) - corroborationBoost([])
    const delta10 = corroborationBoost(buildSources(10)) - corroborationBoost(buildSources(9))

    expect(delta10).toBeLessThan(delta1)
  })
})
