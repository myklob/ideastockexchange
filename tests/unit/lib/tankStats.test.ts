import { describe, it, expect } from 'vitest'
import {
  computeTankStats,
  applyRanks,
  emptyRanks,
  xpForLevel,
  specificityFromInputs,
  PER_RANK_MULTIPLIER,
  RANK_CAP,
  type TankStatInput,
} from '../../../src/lib/tankStats'

const baseInput = (): TankStatInput => ({
  positivity: 0,
  stabilityScore: 0.5,
  claimStrength: 0.5,
  agreeArguments: 0,
  evidence: 0,
  supportingLaws: 0,
  media: 0,
  contentVolume: 0,
  upstreamSupport: 0,
  specificity: 0,
})

describe('computeTankStats', () => {
  it('produces sensible stats for a baseline belief', () => {
    const s = computeTankStats(baseInput())
    expect(s.maxHealth).toBeCloseTo(110, 0)
    expect(s.healthRegen).toBeCloseTo(0.2, 2)
    expect(s.bodyDamage).toBeCloseTo(17, 0)
    expect(s.bulletDamage).toBeCloseTo(12.5, 1)
    expect(s.bulletPenetration).toBe(1)
    expect(s.bulletSpeed).toBeCloseTo(395, 0)
    expect(s.reload).toBeCloseTo(0.4, 2)
    expect(s.movementSpeed).toBeCloseTo(220, 0)
  })

  it('Max Health scales with stability and saturates agree-arguments at 30', () => {
    const low = computeTankStats({ ...baseInput(), stabilityScore: 0 })
    const high = computeTankStats({ ...baseInput(), stabilityScore: 1 })
    expect(high.maxHealth).toBeGreaterThan(low.maxHealth)

    const fifty = computeTankStats({ ...baseInput(), agreeArguments: 50 })
    const thirty = computeTankStats({ ...baseInput(), agreeArguments: 30 })
    expect(fifty.maxHealth).toBe(thirty.maxHealth)
  })

  it('Bullet Penetration is clamped to 1..5', () => {
    const bare = computeTankStats(baseInput())
    expect(bare.bulletPenetration).toBeGreaterThanOrEqual(1)
    const fortified = computeTankStats({
      ...baseInput(),
      supportingLaws: 100,
      media: 100,
    })
    expect(fortified.bulletPenetration).toBeLessThanOrEqual(5)
  })

  it('Reload bottoms out at 0.10 even for very rich beliefs', () => {
    const huge = computeTankStats({ ...baseInput(), contentVolume: 10_000 })
    expect(huge.reload).toBeGreaterThanOrEqual(0.10)
  })

  it('higher claimStrength makes you slower; positivity nudges you faster', () => {
    const meek = computeTankStats({ ...baseInput(), claimStrength: 0 })
    const bold = computeTankStats({ ...baseInput(), claimStrength: 1 })
    expect(meek.movementSpeed).toBeGreaterThan(bold.movementSpeed)

    const negative = computeTankStats({ ...baseInput(), positivity: -50 })
    const positive = computeTankStats({ ...baseInput(), positivity: 50 })
    expect(positive.movementSpeed).toBeGreaterThan(negative.movementSpeed)
  })

  it('upstream support and laws drive health regen', () => {
    const orphan = computeTankStats(baseInput())
    const rooted = computeTankStats({
      ...baseInput(),
      upstreamSupport: 3,
      supportingLaws: 2,
    })
    expect(rooted.healthRegen).toBeGreaterThan(orphan.healthRegen)
  })
})

describe('applyRanks', () => {
  it('rank 0 returns the base unchanged (modulo rounding)', () => {
    const base = computeTankStats(baseInput())
    const out = applyRanks(base, emptyRanks())
    expect(out).toEqual(base)
  })

  it('rank-7 maxHealth applies the documented multiplier', () => {
    const base = computeTankStats(baseInput())
    const ranks = { ...emptyRanks(), maxHealth: RANK_CAP }
    const out = applyRanks(base, ranks)
    const expected = base.maxHealth * (1 + PER_RANK_MULTIPLIER.maxHealth * RANK_CAP)
    expect(out.maxHealth).toBeCloseTo(expected, 1)
  })

  it('penetration is additive +1 per rank', () => {
    const base = computeTankStats(baseInput())
    const out = applyRanks(base, { ...emptyRanks(), bulletPenetration: 4 })
    expect(out.bulletPenetration).toBeCloseTo(base.bulletPenetration + 4, 2)
  })

  it('reload gets faster (smaller) with each rank', () => {
    const base = computeTankStats({ ...baseInput(), contentVolume: 16 })
    const r0 = applyRanks(base, emptyRanks())
    const r7 = applyRanks(base, { ...emptyRanks(), reload: RANK_CAP })
    expect(r7.reload).toBeLessThan(r0.reload)
  })

  it('reload never drops below 0.06s no matter how stacked the build', () => {
    const tiny = computeTankStats({ ...baseInput(), contentVolume: 10_000 })
    const stacked = applyRanks(tiny, { ...emptyRanks(), reload: RANK_CAP })
    expect(stacked.reload).toBeGreaterThanOrEqual(0.06)
  })
})

describe('xpForLevel', () => {
  it('starts at the base value and grows by 1.5 per level', () => {
    expect(xpForLevel(1, 5)).toBe(5)
    expect(xpForLevel(2, 5)).toBe(Math.ceil(5 * 1.5))
    expect(xpForLevel(3, 5)).toBe(Math.ceil(5 * 1.5 * 1.5))
  })
})

describe('specificityFromInputs', () => {
  it('returns 0 for a belief with no criteria or laws', () => {
    expect(specificityFromInputs(0, 0)).toBe(0)
  })

  it('saturates within 0..1', () => {
    expect(specificityFromInputs(100, 100)).toBeLessThanOrEqual(1)
    expect(specificityFromInputs(0, 0)).toBeGreaterThanOrEqual(0)
  })
})
