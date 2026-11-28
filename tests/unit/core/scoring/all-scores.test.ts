/**
 * Truth score breakdown: logical validity and verification, combined.
 *
 * Live behind /api/scoring and behind fetch-belief.ts, which is what a belief
 * page reads. It had no tests, and it had a defect that inverted the thing the
 * score exists to measure: every argument was averaged in regardless of the side
 * it was filed on, so a well-argued objection raised a belief's logical validity
 * by exactly as much as an equally well-argued reason for it. `side` was declared
 * on the parameter and never read.
 */
import { describe, it, expect } from 'vitest'
import { calculateTruthScoreBreakdown, calculateImportanceScore } from '@/core/scoring/all-scores'

const EV = [{ side: 'supporting', evsScore: 0.5, linkageScore: 1 }]

describe('which way an argument moves the score', () => {
  it('lowers validity when a reason against is added', () => {
    const before = calculateTruthScoreBreakdown([{ side: 'pro', truthScore: 0.6, impactScore: 60 }], EV)
    const after = calculateTruthScoreBreakdown(
      [{ side: 'pro', truthScore: 0.6, impactScore: 60 },
       { side: 'con', truthScore: 0.95, impactScore: -95 }], EV)
    expect(after.logicalValidityScore).toBeLessThan(before.logicalValidityScore)
    expect(after.overallTruthScore).toBeLessThan(before.overallTruthScore)
  })

  it('raises validity when a reason for is added', () => {
    const base = [{ side: 'pro', truthScore: 0.5, impactScore: 50 },
                  { side: 'con', truthScore: 0.5, impactScore: -50 }]
    const before = calculateTruthScoreBreakdown(base, EV)
    const after = calculateTruthScoreBreakdown(
      [...base, { side: 'pro', truthScore: 0.9, impactScore: 90 }], EV)
    expect(after.logicalValidityScore).toBeGreaterThan(before.logicalValidityScore)
  })

  it('is the pro share of argued weight, matching the evidence half of the same function', () => {
    const r = calculateTruthScoreBreakdown(
      [{ side: 'pro', truthScore: 0.6, impactScore: 60 },
       { side: 'con', truthScore: 0.2, impactScore: -20 }], EV)
    expect(r.logicalValidityScore).toBeCloseTo(0.6 / 0.8, 10)
  })

  it('treats the con spellings the other trees use as the same side', () => {
    const one = calculateTruthScoreBreakdown(
      [{ side: 'pro', truthScore: 0.5, impactScore: 50 }, { side: 'con', truthScore: 0.5, impactScore: -50 }], EV)
    for (const spelling of ['against', 'disagree']) {
      const same = calculateTruthScoreBreakdown(
        [{ side: 'pro', truthScore: 0.5, impactScore: 50 },
         { side: spelling, truthScore: 0.5, impactScore: -50 }], EV)
      expect(same.logicalValidityScore).toBeCloseTo(one.logicalValidityScore, 12)
    }
  })

  it('sits at maximum uncertainty when nothing is argued', () => {
    expect(calculateTruthScoreBreakdown([], []).overallTruthScore).toBe(0.5)
    expect(calculateTruthScoreBreakdown([], []).logicalValidityScore).toBe(0.5)
  })

  it('never reaches certainty from argument alone', () => {
    const r = calculateTruthScoreBreakdown([{ side: 'pro', truthScore: 1, impactScore: 100 }], EV)
    expect(r.logicalValidityScore).toBeLessThan(1)
    expect(r.logicalValidityScore).toBeGreaterThan(0)
    const c = calculateTruthScoreBreakdown([{ side: 'con', truthScore: 1, impactScore: -100 }], EV)
    expect(c.logicalValidityScore).toBeGreaterThan(0)
  })

  it('still lets a fallacy drag an argument down', () => {
    const clean = calculateTruthScoreBreakdown(
      [{ side: 'pro', truthScore: 0.8, impactScore: 80 }, { side: 'con', truthScore: 0.4, impactScore: -40 }], EV)
    const fallacious = calculateTruthScoreBreakdown(
      [{ side: 'pro', truthScore: 0.8, fallacyPenalty: 0.5, impactScore: 80 },
       { side: 'con', truthScore: 0.4, impactScore: -40 }], EV)
    expect(fallacious.logicalValidityScore).toBeLessThan(clean.logicalValidityScore)
    expect(fallacious.totalFallacyPenalty).toBeCloseTo(0.5, 10)
  })

  it('counts the evidence side the same way it always did', () => {
    const supported = calculateTruthScoreBreakdown([], [{ side: 'supporting', evsScore: 0.8, linkageScore: 1 }])
    const weakened = calculateTruthScoreBreakdown([], [{ side: 'weakening', evsScore: 0.8, linkageScore: 1 }])
    expect(supported.verificationTruthScore).toBeGreaterThan(weakened.verificationTruthScore)
  })
})

describe('importance', () => {
  it('weights the impact and labels the band', () => {
    expect(calculateImportanceScore(0.9, 10).weightedImpact).toBeCloseTo(9, 10)
    expect(calculateImportanceScore(0.9, 10).label).toBe('decisive')
    expect(calculateImportanceScore(0.7, 10).label).toBe('significant')
    expect(calculateImportanceScore(0.5, 10).label).toBe('moderate')
    expect(calculateImportanceScore(0.2, 10).label).toBe('minor')
    expect(calculateImportanceScore(0.05, 10).label).toBe('negligible')
  })

  it('clamps an out-of-range importance rather than amplifying', () => {
    expect(calculateImportanceScore(5, 10).importanceScore).toBe(1)
    expect(calculateImportanceScore(-5, 10).importanceScore).toBe(0)
    expect(calculateImportanceScore(5, 10).weightedImpact).toBe(10)
  })
})
