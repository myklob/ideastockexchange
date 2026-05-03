/**
 * Tank-stat derivation for the Idea Arena.
 *
 * Maps belief characteristics onto diep.io-style tank attributes that drive
 * the arena game (max health, regen, body/bullet damage, penetration, bullet
 * speed, reload, movement speed). All functions are pure: callers fetch the
 * underlying data and pass it in. Server-side rendering computes the base
 * stats once; the client applies upgrade ranks on top.
 *
 * The companion library `battlefield.ts` derives a different stat block (HP,
 * Attack, Defense, Speed, AoE, Level + Class) used by `/battlefield`'s card
 * battle. They share belief inputs but produce different game systems.
 */

export interface TankStatInput {
  /** -100..+100; net score across the argument ledger */
  positivity: number
  /** 0..1; how settled the score is under scrutiny */
  stabilityScore: number
  /** 0..1; how strong a claim is being made */
  claimStrength: number
  /** Arguments asserting the belief */
  agreeArguments: number
  /** Evidence rows linked to this belief */
  evidence: number
  /** Legal entries that support this belief */
  supportingLaws: number
  /** Media resources linked to this belief */
  media: number
  /** Total content (arguments + evidence + media + criteria); ammo proxy */
  contentVolume: number
  /** Mappings flowing INTO this belief with side === "support" */
  upstreamSupport: number
  /**
   * 0..1; how concretely the belief is stated. We don't track this directly
   * yet, so the server derives it from objective-criteria density (concrete
   * thresholds make a claim sharper).
   */
  specificity: number
}

export interface TankStats {
  /** Damage the tank can absorb */
  maxHealth: number
  /** HP recovered per second */
  healthRegen: number
  /** Damage dealt on direct contact */
  bodyDamage: number
  /** Damage per bullet on hit */
  bulletDamage: number
  /** Number of enemies a single bullet can punch through (1..5) */
  bulletPenetration: number
  /** Bullet velocity in pixels/sec */
  bulletSpeed: number
  /** Seconds between shots — lower is faster */
  reload: number
  /** Movement speed in pixels/sec */
  movementSpeed: number
}

export const TANK_STAT_KEYS = [
  'maxHealth',
  'healthRegen',
  'bodyDamage',
  'bulletDamage',
  'bulletPenetration',
  'bulletSpeed',
  'reload',
  'movementSpeed',
] as const

export type TankStatKey = (typeof TANK_STAT_KEYS)[number]

export type TankRanks = Record<TankStatKey, number>

export const RANK_CAP = 7

/** Ranks 1..7 modify the belief-derived base. Penetration is additive; reload
 *  uses a negative multiplier so higher ranks shoot faster. Everything else
 *  is a positive multiplier on top of the base.
 */
export const PER_RANK_MULTIPLIER: Record<TankStatKey, number> = {
  maxHealth: 0.15,
  healthRegen: 0.20,
  bodyDamage: 0.15,
  bulletDamage: 0.18,
  bulletPenetration: 0,
  bulletSpeed: 0.10,
  reload: -0.08,
  movementSpeed: 0.06,
}

export const TANK_STAT_LABELS: Record<TankStatKey, string> = {
  maxHealth: 'Max Health',
  healthRegen: 'Health Regen',
  bodyDamage: 'Body Damage',
  bulletDamage: 'Bullet Damage',
  bulletPenetration: 'Bullet Penetration',
  bulletSpeed: 'Bullet Speed',
  reload: 'Reload',
  movementSpeed: 'Movement Speed',
}

export function computeTankStats(input: TankStatInput): TankStats {
  const stability = clamp01(input.stabilityScore)
  const claim = clamp01(input.claimStrength)
  const specificity = clamp01(input.specificity)

  const maxHealth = 60 + stability * 100 + Math.min(input.agreeArguments, 30) * 2
  const healthRegen =
    0.2 + input.upstreamSupport * 0.4 + input.supportingLaws * 0.2
  const bodyDamage = 6 + claim * 22
  const bulletDamage =
    5 + claim * 15 + Math.log2(input.evidence + 1) * 5
  const bulletPenetration = clamp(
    1 + input.supportingLaws * 0.5 + input.media * 0.3,
    1,
    5,
  )
  const bulletSpeed = 320 + specificity * 200 + claim * 150
  const reload = Math.max(
    0.10,
    0.40 - Math.log2(input.contentVolume + 1) * 0.04,
  )
  const positivityBonus = Math.max(0, input.positivity) * 0.4
  const movementSpeed = 160 + (1 - claim) * 120 + positivityBonus

  return {
    maxHealth: round(maxHealth),
    healthRegen: round(healthRegen),
    bodyDamage: round(bodyDamage),
    bulletDamage: round(bulletDamage),
    bulletPenetration: round(bulletPenetration),
    bulletSpeed: round(bulletSpeed),
    reload: round(reload),
    movementSpeed: round(movementSpeed),
  }
}

export function emptyRanks(): TankRanks {
  return {
    maxHealth: 0,
    healthRegen: 0,
    bodyDamage: 0,
    bulletDamage: 0,
    bulletPenetration: 0,
    bulletSpeed: 0,
    reload: 0,
    movementSpeed: 0,
  }
}

export function applyRanks(base: TankStats, ranks: TankRanks): TankStats {
  const factor = (key: TankStatKey, value: number) =>
    value * (1 + PER_RANK_MULTIPLIER[key] * ranks[key])
  return {
    maxHealth: round(factor('maxHealth', base.maxHealth)),
    healthRegen: round(factor('healthRegen', base.healthRegen)),
    bodyDamage: round(factor('bodyDamage', base.bodyDamage)),
    bulletDamage: round(factor('bulletDamage', base.bulletDamage)),
    bulletPenetration: round(base.bulletPenetration + ranks.bulletPenetration),
    bulletSpeed: round(factor('bulletSpeed', base.bulletSpeed)),
    reload: round(Math.max(0.06, factor('reload', base.reload))),
    movementSpeed: round(factor('movementSpeed', base.movementSpeed)),
  }
}

/** Cost in XP to reach the *next* level from the given current level. */
export function xpForLevel(currentLevel: number, base = 5): number {
  return Math.ceil(base * Math.pow(1.5, Math.max(0, currentLevel - 1)))
}

/** Specificity proxy until the schema gains a real specificity field.
 *  More objective criteria + supporting laws make a belief read as sharper.
 */
export function specificityFromInputs(
  criteriaCount: number,
  supportingLawsCount: number,
): number {
  return clamp01((criteriaCount + Math.min(supportingLawsCount, 3)) / 8)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
