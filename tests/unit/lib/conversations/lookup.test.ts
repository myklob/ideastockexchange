import { describe, it, expect } from 'vitest'
import { rankBeliefMatches, LOOKUP_MATCH_LIMIT } from '@/lib/conversations/lookup'
import { FOCAL_MATCH_THRESHOLD } from '@/lib/conversations/match'
import { textSimilarity } from '@/lib/agent-ingest/similarity'

const beliefs = [
  {
    id: 1,
    slug: 'accept-certified-results',
    statement: 'We should accept certified election results even when our side loses',
  },
  {
    id: 2,
    slug: 'comply-with-final-rulings',
    statement: 'Officials should comply with final court rulings while appealing the ones they believe are wrong',
  },
  {
    id: 3,
    slug: 'carbon-tax-efficient',
    statement: 'A carbon tax reduces emissions more efficiently than regulation',
  },
]

describe('rankBeliefMatches (which permanent page is this statement about)', () => {
  it('resolves a chat statement to the belief page it restates', () => {
    const matches = rankBeliefMatches(
      'we should accept the certified election results even when our side loses',
      beliefs,
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].belief.slug).toBe('accept-certified-results')
    expect(matches[0].band).toBe('same-claim')
  })

  it('ranks pages by similarity, best first', () => {
    const withVariant = [
      ...beliefs,
      { id: 4, slug: 'accept-results-variant', statement: 'We should accept certified election results without exception' },
    ]
    const matches = rankBeliefMatches(
      'We should accept certified election results even when our side loses',
      withVariant,
    )
    expect(matches.length).toBeGreaterThanOrEqual(2)
    expect(matches[0].belief.slug).toBe('accept-certified-results')
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].similarity).toBeGreaterThanOrEqual(matches[i].similarity)
    }
  })

  it('returns nothing when no page is a plausible home (the cue to seed a new page)', () => {
    const matches = rankBeliefMatches('Pineapple belongs on pizza in every circumstance', beliefs)
    expect(matches).toEqual([])
  })

  it('never surfaces a match below the focal threshold', () => {
    const statement = 'Certified election deadlines matter'
    for (const m of rankBeliefMatches(statement, beliefs)) {
      expect(m.similarity).toBeGreaterThanOrEqual(FOCAL_MATCH_THRESHOLD)
      expect(m.similarity).toBeCloseTo(textSimilarity(statement, m.belief.statement), 10)
    }
  })

  it('caps the match list', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      slug: `belief-${i}`,
      statement: 'We should accept certified election results without exception',
    }))
    expect(rankBeliefMatches('We should accept certified election results', many)).toHaveLength(
      LOOKUP_MATCH_LIMIT,
    )
  })
})
