/**
 * Groups battlefield units by topic so same-topic beliefs can be set
 * against each other. A topic is the belief's subcategory, falling back to
 * its category, then to UNCATEGORISED for orphans.
 *
 * Within a topic, units are sorted by positivity (most-supported first) so
 * the two ends of a group are its natural adversaries. Groups are sorted by
 * size, with UNCATEGORISED always last.
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

export interface TopicGroup {
  topic: string
  units: BattlefieldUnit[]
}

export const UNCATEGORISED = 'Uncategorised'

export function topicKey(u: Pick<BattlefieldUnit, 'category' | 'subcategory'>): string {
  if (u.subcategory && u.subcategory.trim()) return u.subcategory.trim()
  if (u.category && u.category.trim()) return u.category.trim()
  return UNCATEGORISED
}

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
    groups.push({ topic, units: [...list].sort((a, b) => b.positivity - a.positivity) })
  }

  groups.sort((a, b) => {
    if (a.topic === UNCATEGORISED) return 1
    if (b.topic === UNCATEGORISED) return -1
    return b.units.length - a.units.length
  })
  return groups
}
