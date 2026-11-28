import { describe, it, expect } from 'vitest'
import { pageGaps, invitationAsk } from '@/features/belief-analysis/lib/gaps'
import type { ArgumentWithBelief, EvidenceItem, ObjectiveCriteriaItem } from '@/features/belief-analysis/types'

function arg(side: string, statement: string, impact: number): ArgumentWithBelief {
  return {
    id: Math.floor(Math.random() * 1e6), side, linkageScore: 1, impactScore: impact, claim: null,
    famousQuote: null, quoteAuthor: null, quoteAuthorUrl: null, argumentScore: null, importanceScore: 1,
    linkageType: 'ACLS', linkageScoreType: 'ACLS', depth: 0,
    belief: { id: 1, slug: 's', statement, positivity: 50 },
  } as unknown as ArgumentWithBelief
}
function ev(side: string): EvidenceItem {
  return {
    id: 1, side, description: 'x', sourceUrl: null, evidenceType: 'T1', sourceIndependenceWeight: 1,
    replicationQuantity: 1, conclusionRelevance: 1, replicationPercentage: 100, evsScore: 1, linkageScore: 1, impactScore: 1,
  } as unknown as EvidenceItem
}
function crit(description: string, currentStatus: string | null): ObjectiveCriteriaItem {
  return { id: 1, description, validityScore: 1, reliabilityScore: 1, independenceScore: 1, linkageScore: 1, criteriaType: null, totalScore: 1, currentStatus } as unknown as ObjectiveCriteriaItem
}

describe('pageGaps', () => {
  it('names the missing counterargument as the shape wanted, answering the strongest reason on the other side', () => {
    const gaps = pageGaps([arg('agree', 'Members trade in industries they oversee.', 0.9), arg('agree', 'Disclosure has failed as a check.', 0.3)], [ev('supporting')], [])
    expect(gaps[0].gap).toContain('A reason to disagree that answers')
    expect(gaps[0].gap).toContain('Members trade in industries they oversee')
    expect(gaps[0].where).toBe('Argument Trees, Reasons to disagree')
  })

  it('does not ask for a counterargument when both sides are argued', () => {
    const gaps = pageGaps([arg('agree', 'a', 1), arg('disagree', 'b', 1)], [ev('supporting'), ev('weakening')], [crit('c', 'read')])
    expect(gaps).toEqual([])
  })

  it('asks for evidence bearing on the belief when nothing is cited, and for the empty side otherwise', () => {
    expect(pageGaps([arg('agree', 'a', 1), arg('disagree', 'b', 1)], [], [crit('c', 'read')])[0].where).toBe('Evidence Ledger')
    const one = pageGaps([arg('agree', 'a', 1), arg('disagree', 'b', 1)], [ev('supporting')], [crit('c', 'read')])
    expect(one[0].where).toBe('Evidence Ledger, Weakening')
  })

  it('asks for a yardstick when none is proposed, and for the first reading when one is', () => {
    expect(pageGaps([arg('agree', 'a', 1), arg('disagree', 'b', 1)], [ev('supporting'), ev('weakening')], [])[0].where).toBe('Objective Criteria')
    const g = pageGaps([arg('agree', 'a', 1), arg('disagree', 'b', 1)], [ev('supporting'), ev('weakening')], [crit('Share of trades pre-cleared.', null)])
    expect(g[0].gap).toContain('The first sourced reading of')
    expect(g[0].gap).toContain('Share of trades pre-cleared')
  })

  it('never names more than three gaps', () => {
    expect(pageGaps([], [], []).length).toBeLessThanOrEqual(3)
  })
})

describe('invitationAsk', () => {
  it('prefers the typed ask, then the first gap, then a general line', () => {
    const gaps = pageGaps([], [], [])
    expect(invitationAsk('Fill the con column.', gaps)).toBe('Fill the con column.')
    expect(invitationAsk('', gaps)).toBe(gaps[0].gap + '.')
    expect(invitationAsk(null, [])).toContain('Any reason, finding or yardstick')
  })
})
