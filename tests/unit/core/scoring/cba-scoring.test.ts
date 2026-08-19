/**
 * Regression tests for two CBA scoring inversions.
 *
 * - Sensitivity: the contested item is the uncertain one, so it must carry the
 *   wide likelihood band and top the swing ranking. The band was computed from
 *   agreement rather than disagreement, which ranked the settled items first —
 *   backwards for a table whose job is "what should we argue about next".
 * - Impact de-duplication: costs are negative by contract, so choosing the item
 *   to discount by signed value picked the larger cost as the weaker one.
 */

import { describe, it, expect } from 'vitest'
import { calculateSensitivity, applyImpactDeduplication } from '@/core/scoring/cba-scoring'
import type { CBALineItem, LikelihoodEstimate } from '@/core/types/cba'

const contributor = { type: 'human' as const, name: 'test', submittedAt: '2026-01-01T00:00:00Z' }

function estimate(id: string, reasonRankScore: number): LikelihoodEstimate {
  return {
    id,
    probability: 0.5,
    label: '50%',
    reasoning: 'test',
    proArguments: [],
    conArguments: [],
    reasonRankScore,
    isActive: true,
    contributor,
  }
}

function lineItem(
  id: string,
  overrides: Partial<CBALineItem> & { estimateScores?: number[] } = {}
): CBALineItem {
  const { estimateScores = [], ...rest } = overrides
  return {
    id,
    type: 'benefit',
    title: id,
    description: id,
    category: 'test',
    canonicalCategory: 'Financial',
    predictedImpact: 1000,
    likelihoodBelief: {
      id: `${id}-likelihood`,
      statement: 'Will it materialize?',
      estimates: estimateScores.map((s, i) => estimate(`${id}-e${i}`, s)),
      activeLikelihood: 0.5,
      status: 'open',
      adversarialCycles: 0,
      confidenceInterval: 0.15,
      protocolLog: [],
    },
    expectedValue: 500,
    confidence: 0.5,
    overlapAdjustments: [],
    contributor,
    ...rest,
  } as CBALineItem
}

describe('calculateSensitivity', () => {
  it('gives the contested item the wider band and the bigger swing', () => {
    const agreed = lineItem('agreed', { estimateScores: [0.8, 0.8] })
    const contested = lineItem('contested', { estimateScores: [0.9, 0.0] })

    const results = calculateSensitivity([agreed, contested])
    const agreedResult = results.find(r => r.impactId === 'agreed')!
    const contestedResult = results.find(r => r.impactId === 'contested')!

    expect(contestedResult.swing).toBeGreaterThan(agreedResult.swing)
    expect(agreedResult.likelihoodHigh - agreedResult.likelihoodLow).toBe(0)
    expect(contestedResult.likelihoodHigh).toBeGreaterThan(contestedResult.likelihoodLow)
    expect(results[0].impactId).toBe('contested')
  })
})

describe('applyImpactDeduplication', () => {
  it('discounts the smaller cost when two costs overlap', () => {
    const big = lineItem('big', {
      type: 'cost',
      title: 'Compliance cost',
      description: 'Compliance reporting burden operators',
      predictedImpact: -100_000_000,
    })
    const small = lineItem('small', {
      type: 'cost',
      title: 'Compliance cost',
      description: 'Compliance reporting burden operators plus training audit software licensing',
      predictedImpact: -1_000_000,
    })

    const { items } = applyImpactDeduplication([big, small])
    const bigAfter = items.find(i => i.id === 'big')!
    const smallAfter = items.find(i => i.id === 'small')!

    expect(bigAfter.predictedImpact).toBe(-100_000_000)
    expect(Math.abs(smallAfter.predictedImpact)).toBeLessThan(1_000_000)
  })
})
