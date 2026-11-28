import { describe, it, expect } from 'vitest'
import {
  pickFocalBelief,
  scanNearestArgument,
  correctStanceByRestatement,
  FOCAL_MATCH_THRESHOLD,
} from '@/lib/conversations/match'
import type { ExtractedCandidate } from '@/lib/conversations/extract'

const candidate = (statement: string): ExtractedCandidate => ({
  messageIndex: 0,
  statement,
  direction: 'pro',
  contextQuote: statement,
  evidenceUrls: [],
  markers: [],
})

const beliefs = [
  { id: 1, slug: 'nuclear-safest', statement: 'Nuclear power is the safest large-scale energy source' },
  { id: 2, slug: 'carbon-tax', statement: 'A carbon tax reduces emissions more efficiently than regulation' },
]

describe('pickFocalBelief (which permanent page does this conversation plug into)', () => {
  it('matches a thread to the belief its title and claims discuss', () => {
    const match = pickFocalBelief(
      'Nuclear power is the safest energy source — change my mind',
      [candidate('Nuclear power has the lowest deaths per terawatt hour of any large-scale source')],
      beliefs,
    )
    expect(match?.belief.id).toBe(1)
    expect(match!.similarity).toBeGreaterThanOrEqual(FOCAL_MATCH_THRESHOLD)
  })

  it('returns null when no belief page is about the conversation', () => {
    const match = pickFocalBelief(
      'Best pizza toppings ranked',
      [candidate('Pineapple belongs on pizza because sweetness balances the salt')],
      beliefs,
    )
    expect(match).toBeNull()
  })
})

describe('scanNearestArgument (extend the outline vs restate a row)', () => {
  const siblings = [
    { id: 10, side: 'agree', statement: 'Nuclear has the lowest deaths per terawatt hour' },
    { id: 11, side: 'disagree', statement: 'Nuclear waste stays dangerous for millennia' },
  ]

  it('finds the nearest same-side argument and assigns the band', () => {
    const nearest = scanNearestArgument(
      'Nuclear power has the lowest deaths per terawatt hour',
      'pro',
      siblings,
    )
    expect(nearest?.argumentId).toBe(10)
    expect(nearest?.band).toBe('related-link')
  })

  it('never matches across sides — a con candidate ignores pro rows', () => {
    const nearest = scanNearestArgument(
      'Nuclear has the lowest deaths per terawatt hour',
      'con',
      siblings,
    )
    expect(nearest?.argumentId).toBe(11)
  })

  it('returns null when the side has no arguments yet', () => {
    expect(scanNearestArgument('Reactors emit no carbon during operation', 'pro', [])).toBeNull()
  })
})

describe('correctStanceByRestatement (restating the other side IS the other side)', () => {
  const siblings = [
    { id: 10, side: 'agree', statement: 'Nuclear has the lowest deaths per terawatt hour' },
    { id: 11, side: 'disagree', statement: 'Nuclear waste stays dangerous for millennia' },
  ]

  it('flips a mis-read stance when the statement restates an opposite-side argument', () => {
    // Stance heuristics read this as pro (no disagreement opener), but it
    // restates the page's con argument nearly verbatim.
    const correction = correctStanceByRestatement(
      'Nuclear waste stays dangerous for millennia',
      'pro',
      siblings,
    )
    expect(correction).not.toBeNull()
    expect(correction?.direction).toBe('con')
    expect(correction?.nearest.argumentId).toBe(11)
    expect(['probable-group', 'same-claim']).toContain(correction?.nearest.band)
  })

  it('leaves the stance alone when nothing on the other side is a restatement', () => {
    expect(
      correctStanceByRestatement('Reactors emit no carbon during operation', 'pro', siblings),
    ).toBeNull()
  })
})
