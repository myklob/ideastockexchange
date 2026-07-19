/**
 * Unit tests for the Evidence Grounding Score.
 *
 * Anchors verified here (and mirrored in the XML/SQL database examples):
 * - No evidence anywhere → 0 (Unfounded); assertion volume never moves it.
 * - One T1 study at linkage 0.9 → 0.9/1.9 ≈ 0.4737 (Grounded).
 * - Three such studies → 2.7/3.7 ≈ 0.7297 (Well-grounded).
 * - A T0 (retracted) source contributes almost nothing.
 * - A ring of claims citing each other grounds nothing (cycle → 0).
 * - Distance from evidence attenuates through argument edges.
 */

import { describe, it, expect } from 'vitest'
import {
  computeGroundingScore,
  directGroundingWeight,
  saturateGrounding,
  scoreGroundingTree,
  getGroundingBand,
  type GroundingNode,
} from '@/core/scoring/grounding'

describe('directGroundingWeight', () => {
  it('weights by tier and linkage magnitude', () => {
    expect(directGroundingWeight({ tier: 'T1', linkageScore: 0.9 })).toBeCloseTo(0.9)
    expect(directGroundingWeight({ tier: 'T4', linkageScore: 0.5 })).toBeCloseTo(0.125)
  })

  it('collapses for retracted (T0) sources', () => {
    expect(directGroundingWeight({ tier: 'T0', linkageScore: 0.6 })).toBeCloseTo(0.03)
  })

  it('counts weakening evidence by magnitude — grounding is direction-blind', () => {
    expect(directGroundingWeight({ tier: 'T1', linkageScore: -0.9 })).toBeCloseTo(0.9)
  })
})

describe('saturateGrounding', () => {
  it('is 0 at 0 and approaches 1 monotonically', () => {
    expect(saturateGrounding(0)).toBe(0)
    expect(saturateGrounding(0.9)).toBeCloseTo(0.9 / 1.9)
    expect(saturateGrounding(2.7)).toBeCloseTo(2.7 / 3.7)
    expect(saturateGrounding(100)).toBeGreaterThan(0.99)
    expect(saturateGrounding(2)).toBeGreaterThan(saturateGrounding(1))
  })
})

describe('computeGroundingScore', () => {
  it('is exactly 0 with no evidence and no grounded children', () => {
    expect(computeGroundingScore([], [])).toBe(0)
    expect(
      computeGroundingScore([], [{ linkageScore: 0.9, childGrounding: 0 }]),
    ).toBe(0)
  })

  it('matches the single-T1-study anchor', () => {
    const score = computeGroundingScore([{ tier: 'T1', linkageScore: 0.9 }], [])
    expect(score).toBeCloseTo(0.4737, 4)
  })

  it('reaches well-grounded with three independent T1 chains', () => {
    const score = computeGroundingScore(
      [
        { tier: 'T1', linkageScore: 0.9 },
        { tier: 'T1', linkageScore: 0.9 },
        { tier: 'T1', linkageScore: 0.9 },
      ],
      [],
    )
    expect(score).toBeCloseTo(0.7297, 4)
    expect(getGroundingBand(score).key).toBe('well-grounded')
  })

  it('a stack of opinions stays below one directly-linked T1 study', () => {
    const opinions = Array.from({ length: 3 }, () => ({ tier: 'T4', linkageScore: 0.5 }))
    const opinionScore = computeGroundingScore(opinions, [])
    const t1Score = computeGroundingScore([{ tier: 'T1', linkageScore: 0.9 }], [])
    expect(opinionScore).toBeLessThan(t1Score)
  })

  it('inherits grounding through argument edges, attenuated by linkage', () => {
    const childGrounding = 0.4737
    const score = computeGroundingScore([], [
      { linkageScore: 0.9, childGrounding },
    ])
    expect(score).toBeCloseTo((0.9 * childGrounding) / (0.9 * childGrounding + 1), 4)
    expect(score).toBeLessThan(childGrounding) // distance from evidence attenuates
  })

  it('retraction collapses grounding (T1 → T0 on the same edge)', () => {
    const before = computeGroundingScore([{ tier: 'T1', linkageScore: 0.6 }], [])
    const after = computeGroundingScore([{ tier: 'T0', linkageScore: 0.6 }], [])
    expect(before).toBeCloseTo(0.375, 4)
    expect(after).toBeCloseTo(0.0291, 4)
    expect(getGroundingBand(after).key).toBe('thin')
  })
})

describe('scoreGroundingTree', () => {
  const leafWithT1: GroundingNode = {
    id: 'leaf',
    evidence: [{ tier: 'T1', linkageScore: 0.9 }],
    argumentEdges: [],
  }

  it('walks evidence up through the tree', () => {
    const root: GroundingNode = {
      id: 'root',
      evidence: [],
      argumentEdges: [{ linkageScore: 0.85, child: leafWithT1 }],
    }
    const leafScore = 0.4737
    expect(scoreGroundingTree(root)).toBeCloseTo(
      (0.85 * leafScore) / (0.85 * leafScore + 1),
      3,
    )
  })

  it('scores a citation ring as zero — a ring of claims has no foundation', () => {
    const a: GroundingNode = { id: 'a', evidence: [], argumentEdges: [] }
    const b: GroundingNode = { id: 'b', evidence: [], argumentEdges: [] }
    a.argumentEdges.push({ linkageScore: 1, child: b })
    b.argumentEdges.push({ linkageScore: 1, child: a })
    expect(scoreGroundingTree(a)).toBe(0)
    expect(getGroundingBand(0).key).toBe('unfounded')
  })

  it('a ring still grounds if one member holds real evidence', () => {
    const a: GroundingNode = { id: 'a', evidence: [], argumentEdges: [] }
    const b: GroundingNode = {
      id: 'b',
      evidence: [{ tier: 'T2', linkageScore: 0.8 }],
      argumentEdges: [],
    }
    a.argumentEdges.push({ linkageScore: 1, child: b })
    b.argumentEdges.push({ linkageScore: 1, child: a })
    expect(scoreGroundingTree(a)).toBeGreaterThan(0)
  })

  it('ring scores are independent of which member is walked first', () => {
    const build = () => {
      const a: GroundingNode = {
        id: 'a',
        evidence: [{ tier: 'T1', linkageScore: 0.9 }],
        argumentEdges: [],
      }
      const b: GroundingNode = {
        id: 'b',
        evidence: [{ tier: 'T2', linkageScore: 0.8 }],
        argumentEdges: [],
      }
      a.argumentEdges.push({ linkageScore: 1, child: b })
      b.argumentEdges.push({ linkageScore: 1, child: a })
      return { a, b }
    }

    const first = build()
    const memoAFirst = new Map<string, number>()
    const aFirstA = scoreGroundingTree(first.a, memoAFirst)
    const aFirstB = scoreGroundingTree(first.b, memoAFirst)

    const second = build()
    const memoBFirst = new Map<string, number>()
    const bFirstB = scoreGroundingTree(second.b, memoBFirst)
    const bFirstA = scoreGroundingTree(second.a, memoBFirst)

    expect(aFirstA).toBe(bFirstA)
    expect(aFirstB).toBe(bFirstB)
  })
})

describe('getGroundingBand', () => {
  it('maps the thresholds', () => {
    expect(getGroundingBand(0).key).toBe('unfounded')
    expect(getGroundingBand(0.1).key).toBe('thin')
    expect(getGroundingBand(0.3499).key).toBe('thin')
    expect(getGroundingBand(0.35).key).toBe('grounded')
    expect(getGroundingBand(0.6999).key).toBe('grounded')
    expect(getGroundingBand(0.7).key).toBe('well-grounded')
  })
})
