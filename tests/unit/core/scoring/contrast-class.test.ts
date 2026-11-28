/**
 * Unit tests for the denominator / contrast-class engine.
 *
 * Two layers: Layer 1 (justification, internal denominator — a belief vs its
 * own rebuttals) and Layer 2 (opportunity cost, external denominator — a belief
 * vs its best rival). The worked example throughout is the sanctions page from
 * the spec (docs/THE_DENOMINATOR.md): Pro 35.08, Con 25.87.
 */

import { describe, it, expect } from 'vitest'
import {
  justificationScore,
  truthShare,
  argumentMass,
  pairwiseMargin,
  opportunityCostValue,
  comparativeScores,
  normalizeCriterion,
  weightedCriteriaScores,
  fieldShares,
  sortArguments,
  analyzeContrastClass,
  type ContrastOption,
  type Criterion,
} from '../../../../src/core/scoring/contrast-class'

describe('justificationScore (Layer 1)', () => {
  it('turns the sanctions +9.2 numerator into a +15.1% margin', () => {
    const j = justificationScore(35.08, 25.87)
    expect(j).toBeCloseTo(0.151, 3)
  })

  it('is the affine twin of the truth share: J = 2p − 1', () => {
    const pro = 35.08
    const con = 25.87
    const p = truthShare(pro, con)!
    expect(justificationScore(pro, con)).toBeCloseTo(2 * p - 1, 10)
  })

  it('washes out volume: [9,1] and [90,10] both score +0.8', () => {
    expect(justificationScore(9, 1)).toBeCloseTo(0.8, 10)
    expect(justificationScore(90, 10)).toBeCloseTo(0.8, 10)
  })

  it('goes negative when cons outweigh pros (the Rule 9 trigger)', () => {
    expect(justificationScore(10, 30)).toBeLessThan(0)
  })

  it('returns 0 (undefined, not refuted) with no argument weight', () => {
    expect(justificationScore(0, 0)).toBe(0)
  })
})

describe('truthShare', () => {
  it('reports the sanctions harm-case at ~57.6%', () => {
    expect(truthShare(35.08, 25.87)).toBeCloseTo(0.576, 3)
  })

  it('returns null (not 0.5) when there is no weight', () => {
    expect(truthShare(0, 0)).toBeNull()
  })
})

describe('argumentMass', () => {
  it('reports total mass to pair beside the ratio', () => {
    expect(argumentMass(35.08, 25.87)).toBeCloseTo(60.95, 2)
  })
})

describe('pairwiseMargin', () => {
  it('is a simple difference S(oi) − S(oj)', () => {
    expect(pairwiseMargin(0.7, 0.5)).toBeCloseTo(0.2, 10)
    expect(pairwiseMargin(0.5, 0.7)).toBeCloseTo(-0.2, 10)
  })
})

describe('opportunityCostValue (Layer 2)', () => {
  it('subtracts the best rival, not nothing', () => {
    expect(opportunityCostValue(0.6, [0.8, 0.4, 0.2])).toBeCloseTo(-0.2, 10)
  })

  it('is positive only for the field winner', () => {
    expect(opportunityCostValue(0.9, [0.8, 0.4])).toBeCloseTo(0.1, 10)
  })

  it('is undefined (null) with no rivals — no denominator', () => {
    expect(opportunityCostValue(0.9, [])).toBeNull()
  })
})

describe('comparativeScores — the sanctions contrast class', () => {
  // Stylized scores standing in for the argument-tree S(o) of each lever.
  const options: ContrastOption[] = [
    { id: 'military', label: 'Military force', score: 0.30 },
    { id: 'broad', label: 'Broad sanctions', score: 0.50 },
    { id: 'targeted', label: 'Targeted sanctions', score: 0.62 },
    { id: 'engagement', label: 'Conditional engagement', score: 0.45 },
    { id: 'integration', label: 'Full integration', score: 0.25 },
  ]

  it('finds exactly one winner (targeted) with positive OCV', () => {
    const results = comparativeScores(options)
    const winners = results.filter((r) => r.isWinner)
    expect(winners).toHaveLength(1)
    expect(winners[0].id).toBe('targeted')
    expect(winners[0].ocv!).toBeGreaterThan(0)
  })

  it('shows broad sanctions LOSING to their best rival (targeted)', () => {
    const broad = comparativeScores(options).find((r) => r.id === 'broad')!
    expect(broad.bestRivalId).toBe('targeted')
    expect(broad.ocv!).toBeCloseTo(0.5 - 0.62, 10)
    expect(broad.ocv!).toBeLessThan(0)
  })

  it('produces no strict winner on a tie', () => {
    const tied: ContrastOption[] = [
      { id: 'a', label: 'A', score: 0.5 },
      { id: 'b', label: 'B', score: 0.5 },
    ]
    expect(comparativeScores(tied).some((r) => r.isWinner)).toBe(false)
  })
})

describe('normalizeCriterion', () => {
  it('min-max normalizes against the spread of rivals', () => {
    const [lo, mid, hi] = normalizeCriterion([0.1, 0.4, 0.7])
    expect(lo).toBeCloseTo(0, 10)
    expect(mid).toBeCloseTo(0.5, 10)
    expect(hi).toBeCloseTo(1, 10)
  })

  it('returns neutral 0.5 when the field is flat (no division by zero)', () => {
    expect(normalizeCriterion([0.6, 0.6, 0.6])).toEqual([0.5, 0.5, 0.5])
  })
})

describe('weightedCriteriaScores', () => {
  const options: ContrastOption[] = [
    { id: 'broad', label: 'Broad sanctions', score: 0.5 },
    { id: 'integration', label: 'Full integration', score: 0.25 },
  ]
  // Mike's argument: integration scores worst on C1 (coercive capacity). That
  // low C1 is precisely why broad sanctions look good against integration.
  const criteria: Criterion[] = [
    { key: 'C1-capacity', importance: 1.0, raw: { broad: 0.8, integration: 0.1 } },
    { key: 'C2-welfare', importance: 0.6, raw: { broad: 0.3, integration: 0.9 } },
  ]

  it('weights normalized criteria by topic-level importance', () => {
    const results = weightedCriteriaScores(options, criteria)
    const broad = results.find((r) => r.optionId === 'broad')!
    // C1 normalized: broad=1, integration=0 → broad contributes 1.0×1.0.
    // C2 normalized: broad=0, integration=1 → broad contributes 0.6×0.
    expect(broad.weighted).toBeCloseTo(1.0, 10)
  })

  it('decomposes the score per criterion to explain the win', () => {
    const broad = weightedCriteriaScores(options, criteria)
      .find((r) => r.optionId === 'broad')!
    const c1 = broad.perCriterion.find((p) => p.key === 'C1-capacity')!
    expect(c1.normalized).toBe(1)
    expect(c1.contribution).toBeCloseTo(1.0, 10)
  })
})

describe('fieldShares (signed-score edge case)', () => {
  it('returns real shares when all scores are non-negative', () => {
    const result = fieldShares([
      { id: 'a', label: 'A', score: 0.6 },
      { id: 'b', label: 'B', score: 0.4 },
    ])
    expect(result.status).toBe('ok')
    expect(result.shares!.a).toBeCloseTo(0.6, 10)
    expect(result.shares!.b).toBeCloseTo(0.4, 10)
  })

  it('refuses to fake a probability for signed scores by default', () => {
    const result = fieldShares([
      { id: 'a', label: 'A', score: 0.6 },
      { id: 'b', label: 'B', score: -0.2 },
    ])
    expect(result.status).toBe('signed')
    expect(result.shares).toBeNull()
  })

  it('rank-shifts and flags it when explicitly allowed', () => {
    const result = fieldShares(
      [
        { id: 'a', label: 'A', score: 0.6 },
        { id: 'b', label: 'B', score: -0.2 },
      ],
      { allowShift: true },
    )
    expect(result.status).toBe('shifted')
    expect(result.shifted).toBe(true)
    const sum = result.shares!.a + result.shares!.b
    expect(sum).toBeCloseTo(1, 10)
    expect(result.shares!.a).toBeGreaterThan(result.shares!.b)
  })
})

describe('sortArguments — intrinsic vs comparative dedup', () => {
  it('pulls "rival beats X" out of the con tally, cleaning Layer 1', () => {
    // "only non-military lever" is comparative, not a strike against the belief.
    const result = sortArguments([
      { kind: 'intrinsic', side: 'pro', weight: 20 },
      { kind: 'intrinsic', side: 'con', weight: 10 },
      { kind: 'comparative', side: 'con', weight: 15 },
    ])
    expect(result.intrinsicPro).toBe(20)
    expect(result.intrinsicCon).toBe(10)
    expect(result.comparativeWeight).toBe(15)
    // Cleaned justification is 20 vs 10, not 20 vs 25.
    expect(result.justification).toBeCloseTo(justificationScore(20, 10), 10)
    expect(result.justification).toBeGreaterThan(justificationScore(20, 25))
  })
})

describe('analyzeContrastClass — combined readout', () => {
  const options: ContrastOption[] = [
    { id: 'military', label: 'Military force', score: 0.30 },
    { id: 'broad', label: 'Broad sanctions', score: 0.50 },
    { id: 'targeted', label: 'Targeted sanctions', score: 0.62 },
  ]

  it('states the denominator next to the verdict for the focal option', () => {
    const readout = analyzeContrastClass('broad', options)
    expect(readout.focalBestRivalId).toBe('targeted')
    expect(readout.focalOcv!).toBeCloseTo(-0.12, 10)
    // Pairwise margins against every rival, both signs present.
    const vsMilitary = readout.focalMargins.find((m) => m.rivalId === 'military')!
    const vsTargeted = readout.focalMargins.find((m) => m.rivalId === 'targeted')!
    expect(vsMilitary.margin).toBeCloseTo(0.20, 10) // wins vs military
    expect(vsTargeted.margin).toBeCloseTo(-0.12, 10) // loses vs targeted
  })

  it('omits criteria when none are supplied', () => {
    expect(analyzeContrastClass('broad', options).criteria).toBeNull()
  })
})
