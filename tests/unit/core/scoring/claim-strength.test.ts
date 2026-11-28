/**
 * The strong-to-weak spectrum. 298 lines that decide what a belief's score is
 * allowed to be, imported by the belief index, topic pages, the strength bar
 * component and the /algorithms/strong-to-weak explainer, and tested by nothing
 * until this file.
 *
 * The rules here are all assertions about proportionality, and each of them can
 * be got backwards without anything looking obviously wrong on a page. So the
 * tests state the direction, not just the arithmetic.
 */
import { describe, it, expect } from 'vitest'
import {
  STRENGTH_BANDS,
  getStrengthLabel,
  getExpectedScoreRange,
  applyStrengthPenalty,
  requiredRawScore,
  strengthLinkageTransmission,
  coordinateDistance,
  isSameCoordinate,
  formatStrength,
} from '@/core/scoring/claim-strength'

describe('the bands', () => {
  it('runs weak to extreme and every band is inside [0,1]', () => {
    expect(STRENGTH_BANDS.map((b) => b.label)).toEqual(['Weak', 'Moderate', 'Strong', 'Extreme'])
    const values = STRENGTH_BANDS.map((b) => b.value)
    expect(values).toEqual([...values].sort((a, b) => a - b))
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('picks the nearest band and clamps outside the range', () => {
    expect(getStrengthLabel(0.2)).toBe('Weak')
    expect(getStrengthLabel(0.5)).toBe('Moderate')
    expect(getStrengthLabel(0.8)).toBe('Strong')
    expect(getStrengthLabel(1.0)).toBe('Extreme')
    expect(getStrengthLabel(-5)).toBe('Weak')
    expect(getStrengthLabel(99)).toBe('Extreme')
  })

  it('expects a stronger claim to score lower than a weaker one', () => {
    const weak = getExpectedScoreRange(0.2)
    const extreme = getExpectedScoreRange(1.0)
    expect(extreme.max).toBeLessThan(weak.max)
  })
})

describe('the burden of proof', () => {
  it('is the documented transmission rate at each band', () => {
    // adjusted = raw x (1 - 0.75 x strength)
    expect(applyStrengthPenalty(1, 0.2)).toBeCloseTo(0.85, 10)
    expect(applyStrengthPenalty(1, 0.5)).toBeCloseTo(0.625, 10)
    expect(applyStrengthPenalty(1, 0.8)).toBeCloseTo(0.4, 10)
    expect(applyStrengthPenalty(1, 1.0)).toBeCloseTo(0.25, 10)
  })

  it('costs a stronger claim more, which is the whole point', () => {
    const raw = 0.9
    const rates = [0, 0.2, 0.5, 0.8, 1].map((s) => applyStrengthPenalty(raw, s))
    for (let i = 1; i < rates.length; i++) expect(rates[i]).toBeLessThan(rates[i - 1])
  })

  it('never invents score and never goes below zero', () => {
    for (const raw of [0, 0.25, 0.5, 1]) {
      for (const s of [0, 0.5, 1]) {
        const out = applyStrengthPenalty(raw, s)
        expect(out).toBeLessThanOrEqual(raw + 1e-12)
        expect(out).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('and requiredRawScore is its inverse wherever the target is reachable', () => {
    for (const s of [0, 0.2, 0.5, 0.8]) {
      const ceiling = 1.0 - 0.75 * s     // the best an adjusted score can be at this strength
      for (const target of [0.1, 0.3, 0.6]) {
        if (target > ceiling) continue
        const raw = requiredRawScore(target, s)
        expect(applyStrengthPenalty(raw, s)).toBeCloseTo(target, 10)
      }
    }
  })

  it('answers a target nobody can reach with "everything there is", not with the target', () => {
    // At strength 0.8 only 40% transmits, so no evidence produces an adjusted 0.6. The function clamps to 1
    // and the round trip lands on the ceiling. Worth pinning because the docstring offers this as
    // "evidence quality needed", and for an unreachable target the honest answer is that there is none.
    expect(requiredRawScore(0.6, 0.8)).toBe(1)
    expect(applyStrengthPenalty(requiredRawScore(0.6, 0.8), 0.8)).toBeCloseTo(0.4, 10)
    expect(requiredRawScore(0.9, 1.0)).toBe(1)
  })
})

describe('evidence for one claim reaching a different one', () => {
  it('carries fully downward: evidence for a stronger claim supports the weaker version', () => {
    expect(strengthLinkageTransmission(0.8, 0.2)).toBe(1)
    expect(strengthLinkageTransmission(0.5, 0.5)).toBe(1)
  })

  it('decays upward and reaches nothing half a band up', () => {
    expect(strengthLinkageTransmission(0.2, 0.45)).toBeCloseTo(0.5, 10)
    expect(strengthLinkageTransmission(0.2, 0.7)).toBeCloseTo(0, 12)
    expect(strengthLinkageTransmission(0, 1)).toBeCloseTo(0, 12)
  })

  it('never returns more than full or less than none', () => {
    for (let e = 0; e <= 1; e += 0.1) {
      for (let t = 0; t <= 1; t += 0.1) {
        const v = strengthLinkageTransmission(e, t)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('the two-axis position', () => {
  it('is zero for the same place and largest across the diagonal', () => {
    const a = { positivity: 0, claimStrength: 0.5 }
    expect(coordinateDistance(a, a)).toBe(0)
    expect(
      coordinateDistance({ positivity: -100, claimStrength: 0 }, { positivity: 100, claimStrength: 1 })
    ).toBeCloseTo(Math.SQRT2, 10)
  })

  it('separates two beliefs pointing the same way at different intensities', () => {
    const mild = { positivity: -60, claimStrength: 0.2 }
    const extreme = { positivity: -60, claimStrength: 1.0 }
    expect(coordinateDistance(mild, extreme)).toBeCloseTo(0.8, 10)
    expect(isSameCoordinate(mild, extreme)).toBe(false)
  })

  it('treats a small difference in both axes as the same position', () => {
    expect(isSameCoordinate({ positivity: 50, claimStrength: 0.5 }, { positivity: 60, claimStrength: 0.55 })).toBe(true)
  })

  it('is symmetric', () => {
    const a = { positivity: -30, claimStrength: 0.3 }
    const b = { positivity: 70, claimStrength: 0.9 }
    expect(coordinateDistance(a, b)).toBeCloseTo(coordinateDistance(b, a), 12)
  })
})

describe('display', () => {
  it('formats strength as a whole percentage', () => {
    expect(formatStrength(0.2)).toBe('20%')
    expect(formatStrength(1)).toBe('100%')
  })
})
