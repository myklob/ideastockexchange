import { describe, it, expect } from 'vitest'
import {
  buildTopicGroups,
  topicKey,
  UNCATEGORISED,
  type BattlefieldUnit,
} from '../../../src/lib/battlefield-pairings'

const stats = (): BattlefieldUnit['stats'] => ({
  hp: 50,
  attack: 50,
  defense: 30,
  speed: 50,
  aoe: 0,
  overall: 40,
  level: 1,
  unitClass: 'Bulwark',
  breakdown: { contentVolume: 0, withstoodAttacks: false, defenseMultiplier: 1 },
})

const unit = (
  id: number,
  name: string,
  category: string | null,
  positivity: number,
  subcategory: string | null = null,
): BattlefieldUnit => ({
  id,
  slug: `b-${id}`,
  name,
  category,
  subcategory,
  positivity,
  stats: stats(),
})

describe('topicKey', () => {
  it('prefers subcategory, then category, then the orphan bucket', () => {
    expect(topicKey({ category: 'Trump', subcategory: 'Trump: competence' })).toBe('Trump: competence')
    expect(topicKey({ category: 'Trump', subcategory: '  ' })).toBe('Trump')
    expect(topicKey({ category: null, subcategory: null })).toBe(UNCATEGORISED)
  })
})

describe('buildTopicGroups', () => {
  it('groups same-topic beliefs and orders them most-supported first', () => {
    const groups = buildTopicGroups([
      unit(1, 'Trump is a moron', 'Trump', -70),
      unit(2, 'Trump is a genius', 'Trump', 80),
      unit(3, 'Trump is mediocre', 'Trump', 5),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].topic).toBe('Trump')
    expect(groups[0].units.map(u => u.id)).toEqual([2, 3, 1])
  })

  it('keeps a lone belief in its own group', () => {
    const groups = buildTopicGroups([unit(1, 'Solo idea', 'Loner', 0)])
    expect(groups).toHaveLength(1)
    expect(groups[0].units).toHaveLength(1)
  })

  it('sorts larger topics first and the orphan bucket last', () => {
    const groups = buildTopicGroups([
      unit(1, 'Orphan A', null, 10),
      unit(2, 'Orphan B', null, -10),
      unit(3, 'Orphan C', null, 0),
      unit(4, 'Small topic', 'Small', 0),
      unit(5, 'Big topic A', 'Big', 1),
      unit(6, 'Big topic B', 'Big', 2),
    ])
    expect(groups.map(g => g.topic)).toEqual(['Big', 'Small', UNCATEGORISED])
  })
})
