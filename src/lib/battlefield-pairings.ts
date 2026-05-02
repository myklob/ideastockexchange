/**
 * Battlefield-of-Ideas matchups.
 *
 * Pure helpers that take an array of belief-units and group them into
 * same-topic adversaries. A "topic" is the belief's `category` (falling
 * back to `subcategory` when present, then a synthetic "Uncategorised"
 * bucket so orphan beliefs still appear).
 *
 * Inside a topic, units are sorted by `positivity` so the most-supported
 * idea sits opposite the most-opposed one. Every unit is paired with its
 * mirror across the median; an odd unit out becomes a "ronin" awaiting a
 * challenger.
 *
 * The shape returned here is what the /battlefield page renders and what
 * the diep.io-style /arena page consumes to seed its initial fight.
 */
import type { BeliefUnitStats } from './battlefield'

export interface BattlefieldUnit {
  id: number
  slug: string
  name: string
  category: string | null
  subcategory: string | null
  positivity: number
  stats: BeliefUnitStats
}

export interface Matchup {
  topic: string
  /** Sorted high-positivity → low. Length 1 = ronin (no opponent yet). */
  pair: [BattlefieldUnit, BattlefieldUnit] | [BattlefieldUnit]
}

export interface TopicGroup {
  topic: string
  units: BattlefieldUnit[]
  matchups: Matchup[]
  ronin: BattlefieldUnit | null
}

const UNCATEGORISED = 'Uncategorised'

export function topicKey(u: Pick<BattlefieldUnit, 'category' | 'subcategory'>): string {
  if (u.subcategory && u.subcategory.trim()) return u.subcategory.trim()
  if (u.category && u.category.trim()) return u.category.trim()
  return UNCATEGORISED
}

/**
 * Group units by topic and produce VS pairings.
 *
 * Sort order inside a topic: descending positivity. The pairing rule is
 * "extremes attract": index 0 (most-pro) fights the last unit (most-anti),
 * index 1 fights second-to-last, etc. With an odd count the unit nearest
 * the median is parked as `ronin`.
 */
export function buildTopicGroups(units: BattlefieldUnit[]): TopicGroup[] {
  const buckets = new Map<string, BattlefieldUnit[]>()
  for (const u of units) {
    const key = topicKey(u)
    const arr = buckets.get(key) ?? []
    arr.push(u)
    buckets.set(key, arr)
  }

  const groups: TopicGroup[] = []
  for (const [topic, list] of buckets) {
    const sorted = [...list].sort((a, b) => b.positivity - a.positivity)
    const matchups: Matchup[] = []
    let ronin: BattlefieldUnit | null = null

    let i = 0
    let j = sorted.length - 1
    while (i < j) {
      matchups.push({ topic, pair: [sorted[i], sorted[j]] })
      i++
      j--
    }
    if (i === j) ronin = sorted[i]

    groups.push({ topic, units: sorted, matchups, ronin })
  }

  groups.sort((a, b) => {
    if (a.topic === UNCATEGORISED) return 1
    if (b.topic === UNCATEGORISED) return -1
    return b.units.length - a.units.length
  })
  return groups
}

/**
 * Pure simulator for a single one-on-one bout. Used by the battlefield
 * page to label a matchup with a probable winner without running the
 * full arena animation.
 *
 * Per-tick damage = max(1, ATK - DEF/2), softened by speed advantage.
 * Returns the unit that reaches 0 HP last; null on a draw.
 */
export interface BoutResult {
  winner: BattlefieldUnit | null
  ticks: number
  /** Final HP per unit, keyed by slug. */
  remainingHp: Record<string, number>
}

export function simulateBout(
  a: BattlefieldUnit,
  b: BattlefieldUnit,
  maxTicks = 200,
): BoutResult {
  let hpA = a.stats.hp
  let hpB = b.stats.hp
  if (hpA <= 0 && hpB <= 0) {
    return { winner: null, ticks: 0, remainingHp: { [a.slug]: 0, [b.slug]: 0 } }
  }
  if (hpA <= 0) return { winner: b, ticks: 0, remainingHp: { [a.slug]: 0, [b.slug]: hpB } }
  if (hpB <= 0) return { winner: a, ticks: 0, remainingHp: { [a.slug]: hpA, [b.slug]: 0 } }

  const dmg = (attacker: BattlefieldUnit, defender: BattlefieldUnit) => {
    const base = Math.max(1, attacker.stats.attack - defender.stats.defense / 2)
    const speedEdge = (attacker.stats.speed - defender.stats.speed) / 200
    return base * (1 + Math.max(-0.4, Math.min(0.4, speedEdge)))
  }

  let ticks = 0
  while (hpA > 0 && hpB > 0 && ticks < maxTicks) {
    hpB -= dmg(a, b)
    if (hpB <= 0) break
    hpA -= dmg(b, a)
    ticks++
  }

  let winner: BattlefieldUnit | null
  if (hpA <= 0 && hpB <= 0) winner = null
  else if (hpB <= 0) winner = a
  else if (hpA <= 0) winner = b
  else winner = hpA > hpB ? a : hpB > hpA ? b : null

  return {
    winner,
    ticks,
    remainingHp: {
      [a.slug]: Math.max(0, Math.round(hpA)),
      [b.slug]: Math.max(0, Math.round(hpB)),
    },
  }
}
