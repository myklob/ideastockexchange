import { describe, it, expect } from 'vitest'
import {
  getDirectionBand,
  getAbstractionLabel,
  formatSignedScore,
  parseSortDir,
  parseTopicSortKey,
  sortTopicBeliefs,
  type TopicBeliefRow,
} from '@/features/topics/lib/dimensions'

const belief = (
  id: number,
  overrides: Partial<Omit<TopicBeliefRow, 'id'>> = {},
): TopicBeliefRow => ({
  id,
  slug: `belief-${id}`,
  statement: `Statement ${id}`,
  positivity: 0,
  claimStrength: 0.5,
  specificity: 0.5,
  groundingScore: 0,
  ...overrides,
})

describe('getDirectionBand', () => {
  it('maps the five buckets used by the /beliefs index', () => {
    expect(getDirectionBand(-75).label).toBe('Strongly Negative')
    expect(getDirectionBand(-45).label).toBe('Moderately Negative')
    expect(getDirectionBand(0).label).toBe('Neutral / Mixed')
    expect(getDirectionBand(38).label).toBe('Moderately Positive')
    expect(getDirectionBand(72).label).toBe('Strongly Positive')
  })

  it('treats bucket edges consistently with the index filters', () => {
    expect(getDirectionBand(60).label).toBe('Strongly Positive')
    expect(getDirectionBand(20).label).toBe('Moderately Positive')
    expect(getDirectionBand(-20).label).toBe('Moderately Negative')
    expect(getDirectionBand(-60).label).toBe('Strongly Negative')
  })
})

describe('getAbstractionLabel', () => {
  it('maps the three specificity buckets', () => {
    expect(getAbstractionLabel(0.05)).toBe('General Principle')
    expect(getAbstractionLabel(0.5)).toBe('Case-Level')
    expect(getAbstractionLabel(0.9)).toBe('Specific Instance')
  })
})

describe('formatSignedScore', () => {
  it('prefixes non-negative scores with +', () => {
    expect(formatSignedScore(38)).toBe('+38')
    expect(formatSignedScore(0)).toBe('+0')
    expect(formatSignedScore(-52)).toBe('-52')
  })

  it('rounds fractional engine output', () => {
    expect(formatSignedScore(37.6)).toBe('+38')
    expect(formatSignedScore(-44.5)).toBe('-44')
  })
})

describe('sortTopicBeliefs', () => {
  const rows = [
    belief(1, { positivity: 42, claimStrength: 0.2, specificity: 0.35, groundingScore: 0.6 }),
    belief(2, { positivity: 68, claimStrength: 0.5, specificity: 0.4, groundingScore: 0.1 }),
    belief(3, { positivity: 35, claimStrength: 1.0, specificity: 0.05, groundingScore: 0.9 }),
  ]

  it('direction reads negative → positive', () => {
    expect(sortTopicBeliefs(rows, 'direction').map(b => b.id)).toEqual([3, 1, 2])
  })

  it('magnitude reads weak → extreme', () => {
    expect(sortTopicBeliefs(rows, 'magnitude').map(b => b.id)).toEqual([1, 2, 3])
  })

  it('abstraction reads general → specific', () => {
    expect(sortTopicBeliefs(rows, 'abstraction').map(b => b.id)).toEqual([3, 1, 2])
  })

  it('score reads best-supported first', () => {
    expect(sortTopicBeliefs(rows, 'score').map(b => b.id)).toEqual([2, 1, 3])
  })

  it('score ranks by |positivity| so a negative-direction topic reads strongest-first', () => {
    const negative = [
      belief(1, { positivity: -25 }),
      belief(2, { positivity: -52 }),
      belief(3, { positivity: 10 }),
    ]
    expect(sortTopicBeliefs(negative, 'score').map(b => b.id)).toEqual([2, 1, 3])
  })

  it('grounding reads most-evidence-grounded first', () => {
    expect(sortTopicBeliefs(rows, 'grounding').map(b => b.id)).toEqual([3, 1, 2])
  })

  it('an explicit dir overrides the natural reading order', () => {
    expect(sortTopicBeliefs(rows, 'score', 'asc').map(b => b.id)).toEqual([3, 1, 2])
    expect(sortTopicBeliefs(rows, 'direction', 'desc').map(b => b.id)).toEqual([2, 1, 3])
    expect(sortTopicBeliefs(rows, 'direction', 'asc').map(b => b.id)).toEqual([3, 1, 2])
  })

  it('does not mutate the input array', () => {
    const input = [...rows]
    sortTopicBeliefs(input, 'score')
    expect(input.map(b => b.id)).toEqual(rows.map(b => b.id))
  })

  it('breaks ties by statement for a stable order', () => {
    const tied = [
      belief(2, { positivity: 10 }),
      belief(1, { positivity: 10 }),
    ]
    expect(sortTopicBeliefs(tied, 'score').map(b => b.id)).toEqual([1, 2])
  })
})

describe('parseTopicSortKey', () => {
  it('accepts every valid key and falls back to score otherwise', () => {
    expect(parseTopicSortKey('direction')).toBe('direction')
    expect(parseTopicSortKey('magnitude')).toBe('magnitude')
    expect(parseTopicSortKey('abstraction')).toBe('abstraction')
    expect(parseTopicSortKey('grounding')).toBe('grounding')
    expect(parseTopicSortKey('bogus')).toBe('score')
    expect(parseTopicSortKey(null)).toBe('score')
    expect(parseTopicSortKey(undefined)).toBe('score')
  })
})

describe('parseSortDir', () => {
  it('accepts asc/desc and treats anything else as unset', () => {
    expect(parseSortDir('asc')).toBe('asc')
    expect(parseSortDir('desc')).toBe('desc')
    expect(parseSortDir('sideways')).toBeUndefined()
    expect(parseSortDir(null)).toBeUndefined()
  })
})
