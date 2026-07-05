import { describe, it, expect } from 'vitest'
import {
  computeTruthScore,
  extractGraphInputs,
  archiveToJson,
  recomputeFromArchive,
  SCORING_ALGORITHM_VERSION,
  type GraphInputs,
} from '@/lib/markets/engine'

const inputs: GraphInputs = {
  beliefId: 1,
  slug: 'test-belief',
  claimStrength: 0.5,
  arguments: [
    { side: 'agree', impactScore: 60, importanceScore: 1.0 },
    { side: 'agree', impactScore: 60, importanceScore: 1.0 },
    { side: 'disagree', impactScore: 20, importanceScore: 1.0 },
  ],
}

describe('snapshot scoring engine (versioned, reproducible)', () => {
  it('has a version string snapshots can reference', () => {
    expect(SCORING_ALGORITHM_VERSION).toMatch(/^reasonrank-/)
  })

  it('computes importance-weighted pro share with the burden penalty', () => {
    // raw = 120/140; burden at claimStrength 0.5 = 1 - 0.375 = 0.625
    expect(computeTruthScore(inputs)).toBeCloseTo((120 / 140) * 0.625, 10)
  })

  it('scores the uninformative prior for an argument-free belief', () => {
    const empty = { ...inputs, arguments: [] }
    expect(computeTruthScore(empty)).toBeCloseTo(0.5 * 0.625, 10)
  })

  it('stronger claims need more: same arguments, higher claimStrength, lower score', () => {
    const strong = { ...inputs, claimStrength: 1.0 }
    expect(computeTruthScore(strong)).toBeLessThan(computeTruthScore(inputs))
  })

  it('reproduces the score exactly from the archived inputs', () => {
    const archive = archiveToJson(inputs)
    expect(recomputeFromArchive(archive)).toBe(computeTruthScore(inputs))
  })

  it('extractGraphInputs reads exactly the fields the algorithm uses', () => {
    const extracted = extractGraphInputs({
      id: 7,
      slug: 's',
      claimStrength: 0.8,
      arguments: [{ side: 'agree', impactScore: 10, importanceScore: 0.5 }],
    })
    expect(extracted).toEqual({
      beliefId: 7,
      slug: 's',
      claimStrength: 0.8,
      arguments: [{ side: 'agree', impactScore: 10, importanceScore: 0.5 }],
    })
  })
})
