/**
 * Arena tank stats — derives a diep.io-style tank's eight stats from the
 * properties of a single belief. The "champion" belief becomes the player's
 * tank; its philosophical character translates into combat capabilities.
 *
 * Settled, well-supported beliefs become tankier. Bold claims hit harder
 * but maneuver less. Specific, sharply-stated beliefs fire faster bullets.
 *
 * All functions are pure: stats in, numbers out.
 */
import type { BeliefUnitInput } from './battlefield';

export interface TankStats {
  maxHealth: number;
  healthRegen: number;
  bodyDamage: number;
  bulletDamage: number;
  bulletPenetration: number;
  bulletSpeed: number;
  reload: number;
  movementSpeed: number;
}

export type TankStatKey = keyof TankStats;

export const TANK_STAT_KEYS: TankStatKey[] = [
  'maxHealth',
  'healthRegen',
  'bodyDamage',
  'bulletDamage',
  'bulletPenetration',
  'bulletSpeed',
  'reload',
  'movementSpeed',
];

export const TANK_STAT_LABELS: Record<TankStatKey, string> = {
  maxHealth: 'Max Health',
  healthRegen: 'Health Regen',
  bodyDamage: 'Body Damage',
  bulletDamage: 'Bullet Damage',
  bulletPenetration: 'Bullet Penetration',
  bulletSpeed: 'Bullet Speed',
  reload: 'Reload',
  movementSpeed: 'Movement Speed',
};

export const MAX_RANK = 7;

/**
 * Derive a "specificity" signal from belief inputs. Beliefs with explicit
 * objective criteria are crisper than vague position statements; beliefs
 * with abundant evidence are typically sharper too. Returns 0..1.
 */
export function deriveSpecificity(input: BeliefUnitInput): number {
  const criteriaSignal = Math.min(1, input.criteriaCount / 4);
  const evidenceSignal = Math.min(1, Math.log2(input.evidenceCount + 1) / 5);
  return clamp01(criteriaSignal * 0.65 + evidenceSignal * 0.35);
}

/**
 * Compute the eight base tank stats for a champion belief, before any
 * rank upgrades have been applied.
 */
export function computeTankBaseStats(input: BeliefUnitInput): TankStats {
  const stability = clamp01(input.stabilityScore);
  const claim = clamp01(input.claimStrength);
  const specificity = deriveSpecificity(input);
  const content = input.argumentCount + input.evidenceCount;

  const maxHealth =
    60 + stability * 100 + Math.min(input.agreeArgumentCount, 30) * 2;

  const healthRegen =
    0.2 + input.upstreamSupportCount * 0.4 + input.supportingLawsCount * 0.2;

  const bodyDamage = 6 + claim * 22;

  const bulletDamage =
    5 + claim * 15 + Math.log2(input.evidenceCount + 1) * 5;

  const bulletPenetration = clamp(
    1 + input.supportingLawsCount * 0.5 + input.mediaCount * 0.3,
    1,
    5,
  );

  const bulletSpeed = 320 + specificity * 200 + claim * 150;

  const reload = Math.max(0.10, 0.40 - Math.log2(content + 1) * 0.04);

  const movementSpeed =
    160 + (1 - claim) * 120 + Math.max(0, input.positivity) * 0.4;

  return {
    maxHealth,
    healthRegen,
    bodyDamage,
    bulletDamage,
    bulletPenetration,
    bulletSpeed,
    reload,
    movementSpeed,
  };
}

/**
 * Apply rank upgrades on top of a base stat block.
 *
 * Most stats use a multiplier per rank. Two are special:
 *   - bulletPenetration: additive +1 per rank (cap at 5 + 7 ranks = 12).
 *   - reload: ranks make it FASTER, so we use a sub-1 multiplier.
 */
export function applyTankRanks(
  base: TankStats,
  ranks: Record<TankStatKey, number>,
): TankStats {
  const r = (k: TankStatKey) => clamp(Math.floor(ranks[k] ?? 0), 0, MAX_RANK);
  return {
    maxHealth: base.maxHealth * Math.pow(1.20, r('maxHealth')),
    healthRegen: base.healthRegen * Math.pow(1.30, r('healthRegen')),
    bodyDamage: base.bodyDamage * Math.pow(1.15, r('bodyDamage')),
    bulletDamage: base.bulletDamage * Math.pow(1.18, r('bulletDamage')),
    bulletPenetration: base.bulletPenetration + r('bulletPenetration'),
    bulletSpeed: base.bulletSpeed * Math.pow(1.10, r('bulletSpeed')),
    reload: base.reload * Math.pow(0.88, r('reload')),
    movementSpeed: base.movementSpeed * Math.pow(1.08, r('movementSpeed')),
  };
}

export function emptyRanks(): Record<TankStatKey, number> {
  return {
    maxHealth: 0,
    healthRegen: 0,
    bodyDamage: 0,
    bulletDamage: 0,
    bulletPenetration: 0,
    bulletSpeed: 0,
    reload: 0,
    movementSpeed: 0,
  };
}

/**
 * XP needed to reach the NEXT level from the given level. Cost grows ×1.5
 * per level — diep.io-style geometric progression. Level 1 → 2 costs 5 XP,
 * level 2 → 3 costs 8, then 12, 18, 27...
 */
export function xpForLevel(level: number): number {
  return Math.ceil(5 * Math.pow(1.5, Math.max(0, level - 1)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}
