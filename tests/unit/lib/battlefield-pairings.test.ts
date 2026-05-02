import { describe, it, expect } from 'vitest'
import {
  buildTopicGroups,
  simulateBout,
  type BattlefieldUnit,
} from '../../../src/lib/battlefield-pairings'

const stats = (over: Partial<BattlefieldUnit['stats']> = {}): BattlefieldUnit['stats'] => ({
  hp: 50,
  attack: 50,
  defense: 30,
  speed: 50,
  aoe: 0,
  overall: 40,
  level: 1,
  unitClass: 'Bulwark',
  breakdown: { contentVolume: 0, withstoodAttacks: false, defenseMultiplier: 1 },
  ...over,
})

const unit = (
  id: number,
  name: string,
  category: string | null,
  positivity: number,
  statOver: Partial<BattlefieldUnit['stats']> = {},
): BattlefieldUnit => ({
  id,
  slug: `b-${id}`,
  name,
  category,
  subcategory: null,
  positivity,
  stats: stats(statOver),
})

describe('buildTopicGroups', () => {
  it('pairs the most-pro and most-anti within a topic', () => {
    const groups = buildTopicGroups([
      unit(1, 'Trump is a genius', 'Trump', 80),
      unit(2, 'Trump is a moron', 'Trump', -70),
      unit(3, 'Trump is mediocre', 'Trump', 5),
    ])
    expect(groups).toHaveLength(1)
    const g = groups[0]
    expect(g.topic).toBe('Trump')
    expect(g.matchups).toHaveLength(1)
    expect(g.matchups[0].pair[0].id).toBe(1)
    expect(g.matchups[0].pair[1]?.id).toBe(2)
    expect(g.ronin?.id).toBe(3)
  })

  it('puts a single-belief topic in matchups with length-1 pair', () => {
    const groups = buildTopicGroups([unit(1, 'Solo idea', 'Loner', 0)])
    expect(groups[0].matchups).toHaveLength(0)
    expect(groups[0].units).toHaveLength(1)
  })

  it('falls back to "Uncategorised" and sorts it last', () => {
    const groups = buildTopicGroups([
      unit(1, 'Orphan A', null, 10),
      unit(2, 'Orphan B', null, -10),
      unit(3, 'Topical', 'Real Topic', 0),
    ])
    const topics = groups.map(g => g.topic)
    expect(topics[topics.length - 1]).toBe('Uncategorised')
  })
})

describe('simulateBout', () => {
  it('the heavier hitter wins', () => {
    const a = unit(1, 'Strong', 'X', 0, { attack: 90, defense: 50, hp: 60 })
    const b = unit(2, 'Weak', 'X', 0, { attack: 20, defense: 10, hp: 60 })
    const result = simulateBout(a, b)
    expect(result.winner?.id).toBe(1)
  })

  it('returns the unit pre-killed if its hp is already zero', () => {
    const a = unit(1, 'Dead', 'X', 0, { hp: 0 })
    const b = unit(2, 'Alive', 'X', 0, { hp: 50 })
    const result = simulateBout(a, b)
    expect(result.winner?.id).toBe(2)
    expect(result.ticks).toBe(0)
  })
})
