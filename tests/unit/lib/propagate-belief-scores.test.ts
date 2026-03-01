/**
 * Unit tests for the recursive belief score propagation engine.
 *
 * Tests verify the computeArgumentImpactScore function in isolation
 * (the only pure function in the propagation module). The full
 * propagateBeliefScores function requires a live database and is
 * covered by integration tests.
 *
 * Key properties under test:
 * - 'agree' arguments produce positive impactScores
 * - 'disagree' arguments produce negative impactScores
 * - Higher childTruthScore → larger |impactScore|
 * - Higher linkageScore → larger |impactScore|
 * - linkageScore sign is irrelevant (abs is taken; direction is from 'side')
 * - importanceScore scales the output proportionally
 * - Output is rounded to one decimal place
 * - Edge cases: zero linkage, zero truth, full-strength values
 */

import { describe, it, expect } from 'vitest'
import { computeArgumentImpactScore } from '../../../src/core/scoring/scoring-engine'

describe('computeArgumentImpactScore', () => {
  // ── Sign from side ──────────────────────────────────────────────

  describe('side determines sign', () => {
    it('should return positive score for agree side', () => {
      const score = computeArgumentImpactScore('agree', 0.8, 0.7, 1.0)
      expect(score).toBeGreaterThan(0)
    })

    it('should return negative score for disagree side', () => {
      const score = computeArgumentImpactScore('disagree', 0.8, 0.7, 1.0)
      expect(score).toBeLessThan(0)
    })

    it('should return equal magnitudes for agree and disagree with the same inputs', () => {
      const agree = computeArgumentImpactScore('agree', 0.8, 0.7, 1.0)
      const disagree = computeArgumentImpactScore('disagree', 0.8, 0.7, 1.0)
      expect(Math.abs(agree)).toBe(Math.abs(disagree))
    })
  })

  // ── Formula correctness ─────────────────────────────────────────

  describe('formula: sign × childTruth × |linkage| × importance × 100', () => {
    it('should compute the correct value for a standard case', () => {
      // 1.0 × 0.8 × 0.7 × 1.0 × 100 = 56.0
      const score = computeArgumentImpactScore('agree', 0.8, 0.7, 1.0)
      expect(score).toBe(56.0)
    })

    it('should compute correct value with non-unit importance', () => {
      // 1.0 × 0.6 × 0.5 × 0.8 × 100 = 24.0
      const score = computeArgumentImpactScore('agree', 0.6, 0.5, 0.8)
      expect(score).toBe(24.0)
    })

    it('should handle a disagree case correctly', () => {
      // -1.0 × 0.5 × 0.9 × 1.0 × 100 = -45.0
      const score = computeArgumentImpactScore('disagree', 0.5, 0.9, 1.0)
      expect(score).toBe(-45.0)
    })

    it('should take the absolute value of linkageScore regardless of sign', () => {
      // linkageScore = -0.7 should behave the same as +0.7
      const positive = computeArgumentImpactScore('agree', 0.8, 0.7, 1.0)
      const negative = computeArgumentImpactScore('agree', 0.8, -0.7, 1.0)
      expect(positive).toBe(negative)
    })
  })

  // ── Monotonicity ────────────────────────────────────────────────

  describe('monotonicity', () => {
    it('higher childTruthScore should produce larger impactScore magnitude', () => {
      const low = computeArgumentImpactScore('agree', 0.3, 0.7, 1.0)
      const high = computeArgumentImpactScore('agree', 0.9, 0.7, 1.0)
      expect(high).toBeGreaterThan(low)
    })

    it('higher linkageScore should produce larger impactScore magnitude', () => {
      const weak = computeArgumentImpactScore('agree', 0.8, 0.2, 1.0)
      const strong = computeArgumentImpactScore('agree', 0.8, 0.9, 1.0)
      expect(strong).toBeGreaterThan(weak)
    })

    it('higher importanceScore should produce larger impactScore magnitude', () => {
      const unimportant = computeArgumentImpactScore('agree', 0.8, 0.7, 0.3)
      const important = computeArgumentImpactScore('agree', 0.8, 0.7, 1.0)
      expect(important).toBeGreaterThan(unimportant)
    })
  })

  // ── Edge cases ──────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should return 0 when childTruthScore is 0', () => {
      const score = computeArgumentImpactScore('agree', 0, 0.7, 1.0)
      expect(score).toBe(0)
    })

    it('should return 0 when linkageScore is 0', () => {
      const score = computeArgumentImpactScore('agree', 0.8, 0, 1.0)
      expect(score).toBe(0)
    })

    it('should return 0 when importanceScore is 0', () => {
      const score = computeArgumentImpactScore('agree', 0.8, 0.7, 0)
      expect(score).toBe(0)
    })

    it('should return 100 for maximum agree case', () => {
      // 1.0 × 1.0 × 1.0 × 1.0 × 100 = 100.0
      const score = computeArgumentImpactScore('agree', 1.0, 1.0, 1.0)
      expect(score).toBe(100.0)
    })

    it('should return -100 for maximum disagree case', () => {
      // -1.0 × 1.0 × 1.0 × 1.0 × 100 = -100.0
      const score = computeArgumentImpactScore('disagree', 1.0, 1.0, 1.0)
      expect(score).toBe(-100.0)
    })
  })

  // ── Rounding ────────────────────────────────────────────────────

  describe('rounding to one decimal place', () => {
    it('should round to one decimal place', () => {
      // 1.0 × 0.333 × 0.333 × 1.0 × 100 = 11.0889 → 11.1
      const score = computeArgumentImpactScore('agree', 0.333, 0.333, 1.0)
      expect(score).toBe(11.1)
    })

    it('should not accumulate floating-point errors beyond one decimal', () => {
      const score = computeArgumentImpactScore('agree', 0.7, 0.7, 0.7)
      // 0.7 × 0.7 × 0.7 × 100 = 34.3
      expect(score).toBe(34.3)
    })
  })

  // ── Propagation semantics ───────────────────────────────────────

  describe('propagation semantics', () => {
    it('a stronger child belief should increase a pro-argument impact', () => {
      const weak = computeArgumentImpactScore('agree', 0.2, 0.8, 1.0)
      const strong = computeArgumentImpactScore('agree', 0.9, 0.8, 1.0)
      // When the child belief becomes better-supported, its contribution grows
      expect(strong).toBeGreaterThan(weak)
    })

    it('a stronger child belief should increase a con-argument magnitude', () => {
      const weak = computeArgumentImpactScore('disagree', 0.2, 0.8, 1.0)
      const strong = computeArgumentImpactScore('disagree', 0.9, 0.8, 1.0)
      // When a counter-argument's child belief becomes better-supported, |impact| grows
      expect(Math.abs(strong)).toBeGreaterThan(Math.abs(weak))
    })

    it('increasing linkage after a debate vote should increase impact', () => {
      // Simulates: a linkage debate concludes the argument IS strongly linked
      const lowLinkage = computeArgumentImpactScore('agree', 0.7, 0.2, 1.0)
      const highLinkage = computeArgumentImpactScore('agree', 0.7, 0.9, 1.0)
      expect(highLinkage).toBeGreaterThan(lowLinkage)
    })
  })
})
