/**
 * Unit tests for Decision Leverage.
 *
 * Anchors verified here:
 * - weight is the engine's impact formula with truth factored out, so
 *   weight × 100 = ∂impact/∂truth for the same edge.
 * - A fully-unsupported edge has its whole range open (openRange 1.0); a
 *   fully-supported one approaches 0.
 * - Leverage is points of conclusion score at stake: weight × openRange × 100.
 * - Depth attenuates by 0.5 per level, matching Argument.depth.
 * - Quadrants: load-bearing + open = crux; weightless + open is not a crux.
 * - A ranked belief summary puts the largest gap first and flags the case
 *   where one edge holds most of what is unsettled.
 */

import { describe, it, expect } from 'vitest'
import {
  computeTransmissionWeight,
  computeResolutionGaps,
  computeOpenRange,
  widestGap,
  classifyEdge,
  computeEdgeLeverage,
  computeBeliefLeverage,
  computeCorpusLeverage,
  summarizeLeverage,
  DEPTH_ATTENUATION,
  GAP_WEIGHTS,
  LOAD_BEARING_WEIGHT,
  OPEN_RANGE_THRESHOLD,
  LEVERAGE_CLASSES,
  GAP_LABELS,
  FRAGILE_CONCENTRATION,
  type LeverageEdgeInput,
} from '@/core/scoring/decision-leverage'
import { computeArgumentImpactScore } from '@/core/scoring/scoring-engine'

/** A well-supported, well-examined edge: every gap closed as far as the data can. */
function settledEdge(overrides: Partial<LeverageEdgeInput> = {}): LeverageEdgeInput {
  return {
    id: 1,
    label: 'Settled reason',
    side: 'agree',
    linkageScore: 0.9,
    importanceScore: 0.9,
    uniquenessScore: 1,
    depth: 0,
    groundingScore: 0.95,
    linkageVotes: 400,
    argumentScore: 72,
    subAgreeCount: 6,
    subDisagreeCount: 4,
    supportingEvidenceCount: 3,
    weakeningEvidenceCount: 1,
    ...overrides,
  }
}

/** A bare edge: nothing about it has been established. */
function bareEdge(overrides: Partial<LeverageEdgeInput> = {}): LeverageEdgeInput {
  return {
    id: 2,
    label: 'Unsupported reason',
    side: 'agree',
    linkageScore: 0.9,
    importanceScore: 0.9,
    ...overrides,
  }
}

describe('computeTransmissionWeight', () => {
  it('multiplies linkage, importance and uniqueness', () => {
    const weight = computeTransmissionWeight(
      bareEdge({ linkageScore: 0.8, importanceScore: 0.5, uniquenessScore: 0.5 }),
    )
    expect(weight).toBeCloseTo(0.2)
  })

  it('treats an uncomputed uniqueness as no discount, not as zero', () => {
    const withNull = computeTransmissionWeight(bareEdge({ uniquenessScore: null }))
    const withOne = computeTransmissionWeight(bareEdge({ uniquenessScore: 1 }))
    expect(withNull).toBeCloseTo(withOne)
    expect(withNull).toBeCloseTo(0.81)
  })

  it('uses linkage magnitude — the side carries direction', () => {
    expect(computeTransmissionWeight(bareEdge({ linkageScore: -0.6 }))).toBeCloseTo(
      computeTransmissionWeight(bareEdge({ linkageScore: 0.6 })),
    )
  })

  it('attenuates by 0.5 per level of depth', () => {
    const direct = computeTransmissionWeight(bareEdge({ depth: 0 }))
    const oneDown = computeTransmissionWeight(bareEdge({ depth: 1 }))
    const twoDown = computeTransmissionWeight(bareEdge({ depth: 2 }))
    expect(oneDown).toBeCloseTo(direct * DEPTH_ATTENUATION)
    expect(twoDown).toBeCloseTo(direct * DEPTH_ATTENUATION ** 2)
  })

  it('is zero when linkage or importance is zero', () => {
    expect(computeTransmissionWeight(bareEdge({ linkageScore: 0 }))).toBe(0)
    expect(computeTransmissionWeight(bareEdge({ importanceScore: 0 }))).toBe(0)
  })

  it('clamps out-of-range inputs instead of propagating them', () => {
    expect(computeTransmissionWeight(bareEdge({ linkageScore: 5, importanceScore: 3 }))).toBe(1)
    expect(computeTransmissionWeight(bareEdge({ importanceScore: -2 }))).toBe(0)
    expect(computeTransmissionWeight(bareEdge({ linkageScore: NaN }))).toBe(0)
  })

  it('matches the live engine: weight × 100 is the impact change per unit of truth', () => {
    const edge = bareEdge({ linkageScore: 0.8, importanceScore: 0.6, uniquenessScore: 0.9 })
    const weight = computeTransmissionWeight(edge)
    const impactAt = (truth: number) =>
      computeArgumentImpactScore(
        'agree',
        truth,
        edge.linkageScore,
        edge.importanceScore,
        edge.uniquenessScore ?? 1,
      )
    const atTruthOne = impactAt(1)
    const atTruthZero = impactAt(0)
    expect(atTruthOne - atTruthZero).toBeCloseTo(weight * 100, 4)
  })
})

describe('computeResolutionGaps', () => {
  it('opens every gap when nothing has been established', () => {
    expect(computeResolutionGaps(bareEdge())).toEqual({
      evidence: 1,
      linkage: 1,
      scoring: 1,
      examination: 1,
    })
  })

  it('treats absent grounding as ungrounded, not as grounded', () => {
    expect(computeResolutionGaps(bareEdge({ groundingScore: null })).evidence).toBe(1)
    expect(computeResolutionGaps(bareEdge({ groundingScore: 0.6 })).evidence).toBeCloseTo(0.4)
  })

  it('closes the linkage gap with diminishing returns as votes arrive', () => {
    expect(computeResolutionGaps(bareEdge({ linkageVotes: 0 })).linkage).toBe(1)
    expect(computeResolutionGaps(bareEdge({ linkageVotes: 3 })).linkage).toBeCloseTo(0.5)
    expect(computeResolutionGaps(bareEdge({ linkageVotes: 15 })).linkage).toBeCloseTo(0.25)
    expect(computeResolutionGaps(bareEdge({ linkageVotes: 400 })).linkage).toBeLessThan(0.05)
  })

  it('closes the scoring gap only once a score exists', () => {
    expect(computeResolutionGaps(bareEdge({ argumentScore: null })).scoring).toBe(1)
    expect(computeResolutionGaps(bareEdge({ argumentScore: 0 })).scoring).toBe(0)
    expect(computeResolutionGaps(bareEdge({ argumentScore: 72 })).scoring).toBe(0)
  })

  it('counts opposition, not volume, as examination', () => {
    const onesided = computeResolutionGaps(bareEdge({ subAgreeCount: 12, subDisagreeCount: 0 }))
    const twosided = computeResolutionGaps(bareEdge({ subAgreeCount: 3, subDisagreeCount: 3 }))
    expect(onesided.examination).toBe(1)
    expect(twosided.examination).toBeCloseTo(0.5)
    expect(twosided.examination).toBeLessThan(onesided.examination)
  })

  it('counts a contradicting study as pushback, like a counter-argument', () => {
    const studiesOneWay = computeResolutionGaps(
      bareEdge({ supportingEvidenceCount: 4, weakeningEvidenceCount: 0 }),
    )
    const contested = computeResolutionGaps(
      bareEdge({ supportingEvidenceCount: 4, weakeningEvidenceCount: 1 }),
    )
    expect(studiesOneWay.examination).toBe(1)
    expect(contested.examination).toBeCloseTo(1 / Math.sqrt(2))
  })

  it('pools sub-arguments and evidence on each side', () => {
    // Two supporters (one argument, one study) against two opponents.
    const pooled = computeResolutionGaps(
      bareEdge({
        subAgreeCount: 1,
        supportingEvidenceCount: 1,
        subDisagreeCount: 1,
        weakeningEvidenceCount: 1,
      }),
    )
    expect(pooled.examination).toBeCloseTo(1 / Math.sqrt(3))
  })

  it('treats a child with nothing attached at all as unexamined', () => {
    expect(
      computeResolutionGaps(
        bareEdge({
          subAgreeCount: 0,
          subDisagreeCount: 0,
          supportingEvidenceCount: 0,
          weakeningEvidenceCount: 0,
        }),
      ).examination,
    ).toBe(1)
  })
})

describe('computeOpenRange', () => {
  it('is 1 when every gap is open and 0 when every gap is closed', () => {
    expect(computeOpenRange({ evidence: 1, linkage: 1, scoring: 1, examination: 1 })).toBe(1)
    expect(computeOpenRange({ evidence: 0, linkage: 0, scoring: 0, examination: 0 })).toBe(0)
  })

  it('weights the evidence gap heaviest', () => {
    const evidenceOnly = computeOpenRange({ evidence: 1, linkage: 0, scoring: 0, examination: 0 })
    const linkageOnly = computeOpenRange({ evidence: 0, linkage: 1, scoring: 0, examination: 0 })
    expect(evidenceOnly).toBeCloseTo(GAP_WEIGHTS.evidence)
    expect(evidenceOnly).toBeGreaterThan(linkageOnly)
  })

  it('falls as a settled edge closes its gaps', () => {
    const settled = computeOpenRange(computeResolutionGaps(settledEdge()))
    const bare = computeOpenRange(computeResolutionGaps(bareEdge()))
    expect(bare).toBe(1)
    expect(settled).toBeLessThan(0.2)
  })
})

describe('widestGap', () => {
  it('reports the weighted largest gap, not the largest raw shortfall', () => {
    // linkage shortfall is larger raw (1.0 vs 0.9) but weighted lower (0.25 vs 0.36).
    expect(widestGap({ evidence: 0.9, linkage: 1, scoring: 0, examination: 0 })).toBe('evidence')
    expect(widestGap({ evidence: 0.1, linkage: 1, scoring: 0, examination: 0 })).toBe('linkage')
    expect(widestGap({ evidence: 0, linkage: 0, scoring: 1, examination: 0 })).toBe('scoring')
    expect(widestGap({ evidence: 0, linkage: 0, scoring: 0, examination: 1 })).toBe('examination')
  })

  it('has a label for every gap it can name', () => {
    const gaps = { evidence: 1, linkage: 1, scoring: 1, examination: 1 }
    expect(GAP_LABELS[widestGap(gaps)]).toBeTruthy()
  })
})

describe('classifyEdge', () => {
  it('calls a weighty, open edge a crux', () => {
    expect(classifyEdge(0.8, 0.9, 72)).toBe('crux')
  })

  it('calls a weighty, settled edge load-bearing', () => {
    expect(classifyEdge(0.8, 0.1, 8)).toBe('load-bearing')
  })

  it('refuses to call a weightless edge a crux however open it is', () => {
    expect(classifyEdge(0.05, 1, 5)).toBe('open-minor')
    expect(classifyEdge(0.001, 1, 0.1)).toBe('settled-minor')
  })

  it('treats the thresholds as inclusive', () => {
    expect(classifyEdge(LOAD_BEARING_WEIGHT, OPEN_RANGE_THRESHOLD, 14)).toBe('crux')
    expect(classifyEdge(LOAD_BEARING_WEIGHT - 0.01, OPEN_RANGE_THRESHOLD, 13.6)).toBe('open-minor')
  })

  it('has guidance text for every class it can return', () => {
    for (const key of ['crux', 'load-bearing', 'open-minor', 'settled-minor'] as const) {
      expect(LEVERAGE_CLASSES[key].guidance).toBeTruthy()
    }
  })
})

describe('computeEdgeLeverage', () => {
  it('reports leverage as points of conclusion score at stake', () => {
    const result = computeEdgeLeverage(bareEdge())
    // weight 0.81, whole range open → 81 points in play.
    expect(result.weight).toBeCloseTo(0.81)
    expect(result.openRange).toBe(1)
    expect(result.leverage).toBeCloseTo(81)
    expect(result.classification).toBe('crux')
    expect(result.widestGap).toBe('evidence')
  })

  it('drops leverage to near zero once an edge is settled', () => {
    const result = computeEdgeLeverage(settledEdge())
    expect(result.leverage).toBeLessThan(15)
    expect(result.classification).toBe('load-bearing')
  })

  it('discounts the same gap by depth', () => {
    const direct = computeEdgeLeverage(bareEdge({ depth: 0 })).leverage
    const twoDown = computeEdgeLeverage(bareEdge({ depth: 2 })).leverage
    // 81 → 20.25, which the 1-decimal rounding reports as 20.3.
    expect(direct).toBeCloseTo(81)
    expect(twoDown).toBeCloseTo(direct * 0.25, 0)
  })

  it('keeps side and href for the page, and omits href when there is no route', () => {
    const linked = computeEdgeLeverage(bareEdge({ side: 'disagree', href: '/arguments/2/linkage' }))
    expect(linked.side).toBe('disagree')
    expect(linked.href).toBe('/arguments/2/linkage')
    expect(computeEdgeLeverage(bareEdge()).href).toBeUndefined()
  })

  it('scores an edge that transmits nothing at zero, whatever its gaps', () => {
    const result = computeEdgeLeverage(bareEdge({ linkageScore: 0 }))
    expect(result.leverage).toBe(0)
    expect(result.classification).toBe('settled-minor')
  })
})

describe('computeBeliefLeverage', () => {
  const edges: LeverageEdgeInput[] = [
    settledEdge({ id: 'settled', label: 'Replicated finding' }),
    bareEdge({ id: 'bare', label: 'Bare assertion' }),
    bareEdge({ id: 'minor', label: 'Minor quibble', linkageScore: 0.1, importanceScore: 0.1 }),
  ]

  it('ranks by leverage, highest first', () => {
    const summary = computeBeliefLeverage(edges)
    expect(summary.edges.map(e => e.id)).toEqual(['bare', 'settled', 'minor'])
  })

  it('totals the points at stake and reports concentration', () => {
    const summary = computeBeliefLeverage(edges)
    const expectedTotal = summary.edges.reduce((sum, e) => sum + e.leverage, 0)
    expect(summary.totalAtStake).toBeCloseTo(expectedTotal, 1)
    expect(summary.concentration).toBeCloseTo(summary.edges[0].leverage / summary.totalAtStake, 3)
  })

  it('separates cruxes from load-bearing edges', () => {
    const summary = computeBeliefLeverage(edges)
    expect(summary.cruxes.map(e => e.id)).toEqual(['bare'])
    expect(summary.loadBearing.map(e => e.id)).toEqual(['settled'])
  })

  it('handles a belief with no argument edges', () => {
    const summary = computeBeliefLeverage([])
    expect(summary.edges).toEqual([])
    expect(summary.totalAtStake).toBe(0)
    expect(summary.concentration).toBe(0)
    expect(summarizeLeverage(summary)).toMatch(/nothing to rank/)
  })
})

describe('summarizeLeverage', () => {
  it('names the largest gap and counts the cruxes', () => {
    const summary = computeBeliefLeverage([
      bareEdge({ id: 'a', label: 'Bare assertion' }),
      bareEdge({ id: 'b', label: 'Second assertion' }),
    ])
    const text = summarizeLeverage(summary)
    expect(text).toMatch(/2 cruxes/)
    expect(text).toContain('Bare assertion')
  })

  it('warns when one edge holds most of what is unsettled', () => {
    const summary = computeBeliefLeverage([
      bareEdge({ id: 'a', label: 'Bare assertion' }),
      settledEdge({ id: 'b', label: 'Replicated finding' }),
    ])
    expect(summary.concentration).toBeGreaterThan(0.5)
    expect(summarizeLeverage(summary)).toMatch(/fragile/)
  })

  it('says so plainly when nothing is left at stake', () => {
    const summary = computeBeliefLeverage([
      settledEdge({ id: 'a', linkageScore: 0.01, importanceScore: 0.01 }),
    ])
    expect(summarizeLeverage(summary)).toMatch(/settled/)
  })

  it('reports unsettled points without calling anything a crux when nothing carries weight', () => {
    const summary = computeBeliefLeverage([
      bareEdge({ id: 'a', label: 'Weak but open', linkageScore: 0.2, importanceScore: 0.5 }),
    ])
    expect(summary.cruxes).toEqual([])
    expect(summarizeLeverage(summary)).toMatch(/no single edge both carries weight/)
  })
})

describe('computeCorpusLeverage', () => {
  const corpus = [
    {
      belief: { id: 'thin', label: 'A belief resting on assertions' },
      edges: [
        bareEdge({ id: 'thin-a', label: 'First assertion' }),
        bareEdge({ id: 'thin-b', label: 'Second assertion' }),
        // A third crux, so no single edge holds half the unsettled score.
        bareEdge({ id: 'thin-c', label: 'Third assertion', linkageScore: 0.5 }),
      ],
    },
    {
      belief: { id: 'solid', label: 'A belief resting on evidence' },
      edges: [
        settledEdge({ id: 'solid-a', label: 'Replicated finding' }),
        // Transmits nothing: a settled-minor edge, which the queue drops.
        bareEdge({ id: 'solid-b', label: 'Irrelevant aside', linkageScore: 0 }),
      ],
    },
  ]

  it('ranks beliefs by how much of their score is unsettled', () => {
    const result = computeCorpusLeverage(corpus)
    expect(result.beliefs.map(b => b.belief.id)).toEqual(['thin', 'solid'])
    expect(result.beliefs[0].totalAtStake).toBeGreaterThan(result.beliefs[1].totalAtStake)
  })

  it('totals the whole corpus', () => {
    const result = computeCorpusLeverage(corpus)
    const expected = result.beliefs.reduce((sum, b) => sum + b.totalAtStake, 0)
    expect(result.totalAtStake).toBeCloseTo(expected, 1)
  })

  it('queues every open edge, highest stakes first, and drops settled ones', () => {
    const result = computeCorpusLeverage(corpus)
    expect(result.openQuestions.map(q => q.id)).toEqual([
      'thin-a',
      'thin-b',
      'thin-c',
      'solid-a',
    ])
    const stakes = result.openQuestions.map(q => q.leverage)
    expect([...stakes].sort((a, b) => b - a)).toEqual(stakes)
  })

  it('carries the belief each queued edge belongs to', () => {
    const result = computeCorpusLeverage(corpus)
    expect(result.openQuestions[0].belief.label).toBe('A belief resting on assertions')
  })

  it('flags a belief whose verdict rests on one unresolved edge', () => {
    const result = computeCorpusLeverage([
      {
        belief: { id: 'fragile', label: 'One crux holds it up' },
        edges: [bareEdge({ id: 'f1' }), settledEdge({ id: 'f2' })],
      },
      ...corpus,
    ])
    expect(result.fragileBeliefs.map(b => b.belief.id)).toEqual(['fragile'])
    expect(result.fragileBeliefs[0].concentration).toBeGreaterThanOrEqual(FRAGILE_CONCENTRATION)
  })

  it('never flags a belief with nothing at stake as fragile', () => {
    // One edge, so concentration would be 1.0, but it transmits nothing.
    const result = computeCorpusLeverage([
      {
        belief: { id: 'empty', label: 'Nothing at stake' },
        edges: [bareEdge({ id: 'e1', linkageScore: 0 })],
      },
    ])
    expect(result.beliefs[0].concentration).toBe(0)
    expect(result.fragileBeliefs).toEqual([])
  })

  it('never flags a belief whose one open edge is already supported', () => {
    // Concentration is 1.0 — the settled edge holds every remaining point —
    // but a supported edge carrying the verdict is finished, not fragile.
    const result = computeCorpusLeverage([
      {
        belief: { id: 'done', label: 'Resting on a replicated finding' },
        edges: [settledEdge({ id: 'd1' }), bareEdge({ id: 'd2', linkageScore: 0 })],
      },
    ])
    expect(result.beliefs[0].concentration).toBe(1)
    expect(result.fragileBeliefs).toEqual([])
  })

  it('handles an empty corpus', () => {
    const result = computeCorpusLeverage([])
    expect(result).toMatchObject({
      beliefs: [],
      openQuestions: [],
      totalAtStake: 0,
      fragileBeliefs: [],
    })
  })

  it('handles a belief with no edges without inventing stakes', () => {
    const result = computeCorpusLeverage([
      { belief: { id: 'bare', label: 'No arguments yet' }, edges: [] },
    ])
    expect(result.beliefs[0].totalAtStake).toBe(0)
    expect(result.openQuestions).toEqual([])
  })
})
