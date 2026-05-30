/**
 * Unit tests for sourcing an argument's Importance Score from a sub-belief.
 *
 * `deriveImportanceFromBeliefScore` maps a belief's net score (the [-100, +100]
 * valence axis returned by computeBeliefScores().overallScore) onto the [0, 1]
 * importance weight that feeds impact = Truth × Importance × Linkage.
 *
 * These are pure-function tests; the end-to-end DB propagation of the same
 * derivation is covered in tests/integration/propagate-three-way.test.ts.
 */

import { describe, it, expect } from 'vitest'
import {
  deriveImportanceFromBeliefScore,
  computeArgumentImpactScore,
} from '../../../../src/core/scoring/scoring-engine'

describe('deriveImportanceFromBeliefScore', () => {
  it('maps a fully-supported importance belief (+100) to importance 1.0', () => {
    expect(deriveImportanceFromBeliefScore(100)).toBe(1.0)
  })

  it('maps a neutral / unargued importance belief (0) to importance 0.5', () => {
    expect(deriveImportanceFromBeliefScore(0)).toBe(0.5)
  })

  it('maps a refuted importance belief (-100) to importance 0.0', () => {
    expect(deriveImportanceFromBeliefScore(-100)).toBe(0.0)
  })

  it('is linear across the valence axis', () => {
    expect(deriveImportanceFromBeliefScore(50)).toBe(0.75)
    expect(deriveImportanceFromBeliefScore(-50)).toBe(0.25)
  })

  it('is monotonic: a better-argued importance belief yields more importance', () => {
    const weak = deriveImportanceFromBeliefScore(-20)
    const strong = deriveImportanceFromBeliefScore(60)
    expect(strong).toBeGreaterThan(weak)
  })

  it('clamps out-of-range scores to [0, 1]', () => {
    expect(deriveImportanceFromBeliefScore(250)).toBe(1.0)
    expect(deriveImportanceFromBeliefScore(-250)).toBe(0.0)
  })
})

describe('impact = Truth × Importance × Linkage with derived importance', () => {
  it('feeds a derived importance straight into the impact formula', () => {
    // Importance belief sits at +50 → importance 0.75.
    const importance = deriveImportanceFromBeliefScore(50)
    expect(importance).toBe(0.75)

    // Truth 0.8, linkage 0.5, derived importance 0.75 → 0.8 × 0.5 × 0.75 × 100 = 30.
    const impact = computeArgumentImpactScore('agree', 0.8, 0.5, importance)
    expect(impact).toBe(30.0)
  })

  it('a stronger importance belief raises the argument impact', () => {
    const truth = 0.7
    const linkage = 0.6
    const weakImportance = deriveImportanceFromBeliefScore(-40) // 0.3
    const strongImportance = deriveImportanceFromBeliefScore(80) // 0.9

    const weakImpact = computeArgumentImpactScore('agree', truth, linkage, weakImportance)
    const strongImpact = computeArgumentImpactScore('agree', truth, linkage, strongImportance)

    expect(strongImpact).toBeGreaterThan(weakImpact)
  })

  it('a refuted importance belief zeroes the argument impact', () => {
    const importance = deriveImportanceFromBeliefScore(-100) // 0.0
    const impact = computeArgumentImpactScore('agree', 0.9, 0.9, importance)
    expect(impact).toBe(0)
  })

  it('the three channels multiply: doubling none changes nothing, importance scales linearly', () => {
    const base = computeArgumentImpactScore('agree', 0.5, 0.5, deriveImportanceFromBeliefScore(0)) // imp 0.5
    const doubled = computeArgumentImpactScore('agree', 0.5, 0.5, deriveImportanceFromBeliefScore(100)) // imp 1.0
    expect(doubled).toBeCloseTo(base * 2, 5)
  })
})
