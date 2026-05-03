import { describe, it, expect } from 'vitest'
import {
  computeTankBaseStats,
  applyTankRanks,
  emptyRanks,
  xpForLevel,
  deriveSpecificity,
  MAX_RANK,
} from '../../../src/lib/arena-tank'
import type { BeliefUnitInput } from '../../../src/lib/battlefield'

const baseInput = (): BeliefUnitInput => ({
  positivity: 0,
  stabilityScore: 0,
  claimStrength: 0,
  argumentCount: 0,
  agreeArgumentCount: 0,
  disagreeArgumentCount: 0,
  evidenceCount: 0,
  supportingLawsCount: 0,
  downstreamCount: 0,
  upstreamSupportCount: 0,
  mediaCount: 0,
  criteriaCount: 0,
})

describe('computeTankBaseStats', () => {
  it('returns the documented baseline for a zero-input belief', () => {
    const s = computeTankBaseStats(baseInput())
    expect(s.maxHealth).toBe(60)
    expect(s.healthRegen).toBeCloseTo(0.2)
    expect(s.bodyDamage).toBe(6)
    expect(s.bulletDamage).toBe(5)
    expect(s.bulletPenetration).toBe(1)
    expect(s.bulletSpeed).toBe(320)
    expect(s.reload).toBeCloseTo(0.4)
    expect(s.movementSpeed).toBe(160 + 120)
  })

  it('caps agreeArguments contribution to maxHealth at 30', () => {
    const a = computeTankBaseStats({ ...baseInput(), agreeArgumentCount: 30 })
    const b = computeTankBaseStats({ ...baseInput(), agreeArgumentCount: 9999 })
    expect(a.maxHealth).toBe(b.maxHealth)
  })

  it('keeps reload at the 0.10 floor for huge content piles', () => {
    const s = computeTankBaseStats({
      ...baseInput(),
      argumentCount: 9999,
      evidenceCount: 9999,
    })
    expect(s.reload).toBeCloseTo(0.10)
  })

  it('clamps bullet penetration to 5', () => {
    const s = computeTankBaseStats({
      ...baseInput(),
      supportingLawsCount: 50,
      mediaCount: 50,
    })
    expect(s.bulletPenetration).toBe(5)
  })

  it('extreme claims trade movement for body damage', () => {
    const mild = computeTankBaseStats({ ...baseInput(), claimStrength: 0 })
    const extreme = computeTankBaseStats({ ...baseInput(), claimStrength: 1 })
    expect(extreme.bodyDamage).toBeGreaterThan(mild.bodyDamage)
    expect(extreme.movementSpeed).toBeLessThan(mild.movementSpeed)
  })
})

describe('deriveSpecificity', () => {
  it('rises with objective criteria', () => {
    const none = deriveSpecificity(baseInput())
    const some = deriveSpecificity({ ...baseInput(), criteriaCount: 4 })
    expect(some).toBeGreaterThan(none)
    expect(some).toBeLessThanOrEqual(1)
  })
})

describe('applyTankRanks', () => {
  it('is the identity at zero ranks', () => {
    const base = computeTankBaseStats(baseInput())
    const upgraded = applyTankRanks(base, emptyRanks())
    expect(upgraded).toEqual(base)
  })

  it('increases bullet penetration additively (+1 per rank)', () => {
    const base = computeTankBaseStats(baseInput())
    const r = { ...emptyRanks(), bulletPenetration: 3 }
    const upgraded = applyTankRanks(base, r)
    expect(upgraded.bulletPenetration).toBe(base.bulletPenetration + 3)
  })

  it('reduces reload time as rank increases (faster fire)', () => {
    const base = computeTankBaseStats(baseInput())
    const fast = applyTankRanks(base, { ...emptyRanks(), reload: MAX_RANK })
    expect(fast.reload).toBeLessThan(base.reload)
  })

  it('caps each rank input at MAX_RANK', () => {
    const base = computeTankBaseStats(baseInput())
    const capped = applyTankRanks(base, { ...emptyRanks(), maxHealth: MAX_RANK })
    const overflow = applyTankRanks(base, { ...emptyRanks(), maxHealth: 999 })
    expect(overflow.maxHealth).toBe(capped.maxHealth)
  })
})

describe('xpForLevel', () => {
  it('grows ~1.5x per level', () => {
    const a = xpForLevel(1)
    const b = xpForLevel(2)
    const c = xpForLevel(3)
    expect(b / a).toBeGreaterThan(1.4)
    expect(b / a).toBeLessThanOrEqual(1.7)
    expect(c / b).toBeGreaterThan(1.4)
    expect(c / b).toBeLessThanOrEqual(1.7)
  })

  it('starts at 5 XP for the first level-up', () => {
    expect(xpForLevel(1)).toBe(5)
  })
})
