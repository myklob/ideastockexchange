import { describe, it, expect } from 'vitest'
import {
  RESOLUTION_FLOOR_VALIDITY,
  meetsResolutionFloor,
  rankByLinkageAccuracy,
  resolutionFloor,
  scoreSolution,
  type RankableInterest,
} from '@/features/belief-analysis/lib/interests'

const interest = (
  id: number,
  side: string,
  validityScore: number | null,
  linkageAccuracy: number | null = null,
): RankableInterest => ({ id, side, interest: `interest-${id}`, validityScore, linkageAccuracy })

describe('Resolution Floor', () => {
  it('matches the legacy CompromiseEngine threshold', () => {
    expect(RESOLUTION_FLOOR_VALIDITY).toBe(70)
  })

  it('admits validity at or above 70 and rejects below or unscored', () => {
    expect(meetsResolutionFloor(70)).toBe(true)
    expect(meetsResolutionFloor(90)).toBe(true)
    expect(meetsResolutionFloor(69.9)).toBe(false)
    expect(meetsResolutionFloor(null)).toBe(false)
    expect(meetsResolutionFloor(undefined)).toBe(false)
  })

  it('filters shared interests to those clearing the floor', () => {
    const shared = [{ validityScore: 85 }, { validityScore: 40 }, { validityScore: null }]
    expect(resolutionFloor(shared)).toHaveLength(1)
  })
})

describe('rankByLinkageAccuracy', () => {
  it('ranks by how well the interest explains behavior, unscored last', () => {
    const rows = [
      interest(1, 'supporter', 80, 40),
      interest(2, 'supporter', 80, null),
      interest(3, 'supporter', 80, 90),
    ]
    expect(rankByLinkageAccuracy(rows).map(r => r.id)).toEqual([3, 1, 2])
  })
})

describe('scoreSolution', () => {
  it('earns nothing for interests that failed validity', () => {
    const result = scoreSolution([
      { satisfaction: 1, interest: interest(1, 'supporter', 40) },
      { satisfaction: 1, interest: interest(2, 'opponent', 60) },
    ])
    expect(result.supporterScore).toBe(0)
    expect(result.opponentScore).toBe(0)
    expect(result.total).toBe(0)
    expect(result.excluded).toHaveLength(2)
  })

  it('scores satisfaction weighted by validity for valid interests', () => {
    const result = scoreSolution([
      { satisfaction: 1, interest: interest(1, 'supporter', 80) },
      { satisfaction: 0.5, interest: interest(2, 'opponent', 90) },
    ])
    expect(result.supporterScore).toBeCloseTo(0.8)
    expect(result.opponentScore).toBeCloseTo(0.45)
    expect(result.total).toBeGreaterThan(0)
    expect(result.excluded).toHaveLength(0)
  })

  it('gives zero total to solutions that satisfy only one side', () => {
    const result = scoreSolution([
      { satisfaction: 1, interest: interest(1, 'supporter', 95) },
      { satisfaction: 1, interest: interest(2, 'supporter', 95) },
    ])
    expect(result.supporterScore).toBeGreaterThan(0)
    expect(result.total).toBe(0)
  })

  it('ranks balanced solutions above lopsided ones with the same sum', () => {
    const balanced = scoreSolution([
      { satisfaction: 1, interest: interest(1, 'supporter', 80) },
      { satisfaction: 1, interest: interest(2, 'opponent', 80) },
    ])
    const lopsided = scoreSolution([
      { satisfaction: 1, interest: interest(1, 'supporter', 80) },
      { satisfaction: 1, interest: interest(2, 'supporter', 80) },
      { satisfaction: 0.25, interest: interest(3, 'opponent', 80) },
    ])
    expect(balanced.total).toBeGreaterThan(lopsided.total)
  })

  it('validity is the only weight — identical interests from different holders score identically', () => {
    const a = scoreSolution([{ satisfaction: 1, interest: interest(1, 'supporter', 75) }, { satisfaction: 1, interest: interest(2, 'opponent', 75) }])
    const b = scoreSolution([{ satisfaction: 1, interest: interest(3, 'supporter', 75) }, { satisfaction: 1, interest: interest(4, 'opponent', 75) }])
    expect(a.total).toBe(b.total)
  })
})
