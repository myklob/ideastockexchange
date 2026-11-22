/**
 * The CBA scoring engine: 504 lines behind /cba, the export route and the
 * cost-benefit components, tested by nothing until this file.
 *
 * It implements a different rule from scoring-engine.ts beside it — three
 * factors and a depth attenuation rather than the signed five-factor rule —
 * which is a decision recorded in CLAUDE.md, not an accident. These tests pin
 * what it does, so that if the two are ever reconciled the difference has to be
 * removed deliberately rather than drift.
 */
import { describe, it, expect } from 'vitest'
import {
  calculateArgumentScore,
  depthAttenuation,
  calculateRecursiveArgumentScore,
  calculateLikelihoodFromTree,
  argumentConfidence,
} from '@/core/scoring/cba-scoring'
import type { SchilchtArgument } from '@/core/types/schlicht'

function arg(over: Partial<SchilchtArgument> = {}): SchilchtArgument {
  return {
    id: over.id ?? 'a',
    claim: over.claim ?? 'a claim',
    description: '',
    side: over.side ?? 'pro',
    truthScore: over.truthScore ?? 0.8,
    linkageScore: over.linkageScore ?? 1,
    impactScore: 0,
    ...over,
  } as SchilchtArgument
}

describe('one argument', () => {
  it('is the product of its three factors', () => {
    expect(calculateArgumentScore(8, 0.5, 0.5)).toBeCloseTo(2, 10)
    expect(calculateArgumentScore(10, 1, 1)).toBe(10)
  })

  it('is nothing when any one factor is nothing', () => {
    expect(calculateArgumentScore(0, 1, 1)).toBe(0)
    expect(calculateArgumentScore(10, 0, 1)).toBe(0)
    expect(calculateArgumentScore(10, 1, 0)).toBe(0)
  })

  it('does not read a uniqueness score, unlike the engine beside it', () => {
    // SchilchtArgument declares uniquenessScore ("lower = more redundant") and scoring-engine.ts multiplies
    // by it. This engine does not, and applyArgumentDeduplication, which is the defence it has instead, is
    // exported and called by nothing. Pinned so the difference is visible rather than assumed.
    const plain = calculateRecursiveArgumentScore(arg({ truthScore: 0.8 }))
    const redundant = calculateRecursiveArgumentScore(
      arg({ truthScore: 0.8, uniquenessScore: 0.1 } as Partial<SchilchtArgument>)
    )
    expect(redundant).toBe(plain)
  })
})

describe('depth attenuation', () => {
  it('halves each level and never amplifies', () => {
    expect(depthAttenuation(1)).toBe(1)
    expect(depthAttenuation(2)).toBe(0.5)
    expect(depthAttenuation(3)).toBe(0.25)
    expect(depthAttenuation(4)).toBe(0.125)
  })

  it('treats depth below one as the top level rather than going above one', () => {
    expect(depthAttenuation(0)).toBe(1)
    expect(depthAttenuation(-5)).toBe(1)
  })
})

describe('an argument with sub-arguments', () => {
  it('normalises a 0-1 truth score onto the 0-10 scale the rule expects', () => {
    expect(calculateRecursiveArgumentScore(arg({ truthScore: 0.8, linkageScore: 1 }))).toBeCloseTo(8, 10)
    expect(calculateRecursiveArgumentScore(arg({ truthScore: 1, linkageScore: 1 }))).toBeCloseTo(10, 10)
  })

  it('defaults importance to full rather than to the neutral half', () => {
    // Worth stating: the static-site engine reads an unargued importance as 0.5, this one reads 1.0.
    expect(calculateRecursiveArgumentScore(arg({ truthScore: 0.5, linkageScore: 1 }))).toBeCloseTo(5, 10)
  })

  it('adds each sub-argument at its attenuated depth', () => {
    const parent = arg({
      truthScore: 0.5,
      linkageScore: 1,
      subArguments: [arg({ id: 's', truthScore: 0.4, linkageScore: 1 })],
    } as Partial<SchilchtArgument>)
    // base 5, sub base 4 at depth 2 -> 4 x 0.5 = 2
    expect(calculateRecursiveArgumentScore(parent)).toBeCloseTo(7, 10)
  })

  it('gives a deeper sub-argument less weight than a shallower identical one', () => {
    const leaf = () => arg({ id: 'l', truthScore: 0.6, linkageScore: 1 })
    const shallow = arg({ truthScore: 0.5, subArguments: [leaf()] } as Partial<SchilchtArgument>)
    const deep = arg({
      truthScore: 0.5,
      subArguments: [arg({ id: 'm', truthScore: 0, linkageScore: 1, subArguments: [leaf()] } as Partial<SchilchtArgument>)],
    } as Partial<SchilchtArgument>)
    expect(calculateRecursiveArgumentScore(deep)).toBeLessThan(calculateRecursiveArgumentScore(shallow))
  })
})

describe('likelihood from the tree', () => {
  it('is maximum uncertainty when nothing has been argued', () => {
    expect(calculateLikelihoodFromTree([], [])).toBe(0.5)
  })

  it('is the pro share of the total', () => {
    const pro = [arg({ truthScore: 0.6, linkageScore: 1 })]   // 6
    const con = [arg({ truthScore: 0.2, linkageScore: 1 })]   // 2
    expect(calculateLikelihoodFromTree(pro, con)).toBeCloseTo(6 / 8, 10)
  })

  it('goes to one side entirely when only that side is argued', () => {
    expect(calculateLikelihoodFromTree([arg({ truthScore: 0.5 })], [])).toBe(1)
    expect(calculateLikelihoodFromTree([], [arg({ truthScore: 0.5 })])).toBe(0)
  })

  it('rises when another pro reason is listed, which is the volume rule CLAUDE.md records as unresolved', () => {
    // The static-site engine scores a listed-but-unargued reason at exactly zero. This one counts it.
    // Neither is a bug; the disagreement is the open decision, and it is pinned here so it cannot be
    // resolved by accident in one engine only.
    const one = calculateLikelihoodFromTree([arg({ truthScore: 0.5 })], [arg({ truthScore: 0.5 })])
    const two = calculateLikelihoodFromTree(
      [arg({ id: 'a', truthScore: 0.5 }), arg({ id: 'b', truthScore: 0.5 })],
      [arg({ truthScore: 0.5 })]
    )
    expect(two).toBeGreaterThan(one)
  })

  it('stays inside [0,1]', () => {
    for (const t of [0, 0.3, 1]) {
      const v = calculateLikelihoodFromTree([arg({ truthScore: t })], [arg({ truthScore: 1 - t })])
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
})

describe('confidence from the evidence tier', () => {
  it('is the tier ceiling on a 0-1 scale', () => {
    expect(argumentConfidence('T1')).toBeCloseTo(1, 10)
    expect(argumentConfidence('T2')).toBeCloseTo(0.7, 10)
    expect(argumentConfidence('T3')).toBeCloseTo(0.5, 10)
    expect(argumentConfidence('T4')).toBeCloseTo(0.3, 10)
  })

  it('reads an unstated tier as the weakest one, not as the strongest', () => {
    expect(argumentConfidence(undefined)).toBe(0.3)
    expect(argumentConfidence(undefined)).toBeLessThan(argumentConfidence('T1'))
  })

  it('never ranks a worse tier above a better one', () => {
    const tiers = ['T1', 'T2', 'T3', 'T4'] as const
    for (let i = 1; i < tiers.length; i++) {
      expect(argumentConfidence(tiers[i])).toBeLessThan(argumentConfidence(tiers[i - 1]))
    }
  })
})
