import { describe, it, expect } from 'vitest'
import {
  findSharedInterests,
  derivePrimaryConflictPair,
  findValueConflicts,
  categoryNets,
  findCompromiseCandidates,
  analyzeConflict,
  type InterestInput,
  type CbaItemInput,
} from '../../../../src/core/scoring/conflict-resolution'

const interest = (
  id: number,
  side: 'supporter' | 'opponent',
  text: string,
  validity: number | null,
  linkage: number | null = null,
  prevalence: number | null = null,
): InterestInput => ({
  id,
  side,
  interest: text,
  validityScore: validity,
  linkageAccuracy: linkage,
  prevalenceScore: prevalence,
})

describe('findSharedInterests', () => {
  it('pairs similar cross-side interests when both clear the floor', () => {
    const shared = findSharedInterests([
      interest(1, 'supporter', 'Economic security for families', 90),
      interest(2, 'opponent', 'Economic security for working families', 85),
    ])
    expect(shared).toHaveLength(1)
    expect(shared[0].supporterId).toBe(1)
    expect(shared[0].opponentId).toBe(2)
    expect(shared[0].similarity).toBeGreaterThanOrEqual(0.5)
  })

  it('excludes pairs where either side is below the Resolution Floor', () => {
    const shared = findSharedInterests([
      interest(1, 'supporter', 'Economic security for families', 90),
      interest(2, 'opponent', 'Economic security for families', 40),
    ])
    expect(shared).toHaveLength(0)
  })

  it('excludes unscored interests (null validity is not floor-clearing)', () => {
    const shared = findSharedInterests([
      interest(1, 'supporter', 'Economic security for families', null),
      interest(2, 'opponent', 'Economic security for families', 90),
    ])
    expect(shared).toHaveLength(0)
  })

  it('excludes dissimilar interests even at high validity', () => {
    const shared = findSharedInterests([
      interest(1, 'supporter', 'Reducing childhood poverty nationwide', 95),
      interest(2, 'opponent', 'Protecting constitutional gun rights', 95),
    ])
    expect(shared).toHaveLength(0)
  })

  it('scores pairs by harmonic validity so lopsided pairs sink', () => {
    const shared = findSharedInterests([
      interest(1, 'supporter', 'Fiscal responsibility in budgets', 95),
      interest(2, 'opponent', 'Fiscal responsibility in budgets', 95),
      interest(3, 'supporter', 'Dignity of honest work', 100),
      interest(4, 'opponent', 'Dignity of honest work', 71),
    ])
    expect(shared.length).toBe(2)
    expect(shared[0].pairedValidity).toBeGreaterThan(shared[1].pairedValidity)
    expect(shared[0].supporterInterest).toContain('Fiscal')
  })
})

describe('derivePrimaryConflictPair', () => {
  const pool = [
    interest(1, 'supporter', 'End extreme poverty', 90, 80, 60),
    interest(2, 'supporter', 'Look generous to donors', 20, 95, 20),
    interest(3, 'opponent', 'Keep taxes low', 85, 90, 70),
    interest(4, 'opponent', 'Punish outgroup', 10, 40, 10),
  ]

  it('picks the highest validity-weighted-linkage interest per side', () => {
    const pair = derivePrimaryConflictPair(pool)
    expect(pair).not.toBeNull()
    // supporter: end-poverty drive 80×0.9=72 beats pretext 95×0.2=19
    expect(pair!.supporter.id).toBe(1)
    // opponent: low-taxes drive 90×0.85=76.5 beats 40×0.1=4
    expect(pair!.opponent.id).toBe(3)
    expect(pair!.supporterDrive).toBeCloseTo(72, 5)
    expect(pair!.opponentDrive).toBeCloseTo(76.5, 5)
  })

  it('excludes interests already identified as shared', () => {
    const pair = derivePrimaryConflictPair(pool, [
      {
        supporterId: 1,
        opponentId: 3,
        supporterInterest: '',
        opponentInterest: '',
        similarity: 1,
        pairedValidity: 87,
      },
    ])
    expect(pair).not.toBeNull()
    expect(pair!.supporter.id).toBe(2)
    expect(pair!.opponent.id).toBe(4)
  })

  it('returns null when a side has no linkage-scored interests', () => {
    const pair = derivePrimaryConflictPair([
      interest(1, 'supporter', 'End extreme poverty', 90, 80),
      interest(2, 'opponent', 'Keep taxes low', 85, null),
    ])
    expect(pair).toBeNull()
  })
})

describe('findValueConflicts', () => {
  it('returns values ranked far apart, biggest gap first', () => {
    const conflicts = findValueConflicts([
      { id: 1, value: 'Freedom', supporterRank: 5, opponentRank: 1 },
      { id: 2, value: 'Safety', supporterRank: 1, opponentRank: 4 },
      { id: 3, value: 'Honesty', supporterRank: 2, opponentRank: 2 },
    ])
    expect(conflicts.map((c) => c.value)).toEqual(['Freedom', 'Safety'])
    expect(conflicts[0].gap).toBe(4)
  })

  it('ignores rows missing a rank on either side', () => {
    const conflicts = findValueConflicts([
      { id: 1, value: 'Freedom', supporterRank: 5, opponentRank: null },
    ])
    expect(conflicts).toHaveLength(0)
  })

  it('respects the minimum gap', () => {
    const conflicts = findValueConflicts(
      [{ id: 1, value: 'Freedom', supporterRank: 2, opponentRank: 1 }],
      { minGap: 2 },
    )
    expect(conflicts).toHaveLength(0)
  })
})

const cbaItem = (
  id: number,
  side: 'benefit' | 'cost',
  category: string,
  magnitude: number,
  likelihood: number,
): CbaItemInput => ({ id, side, claim: `claim ${id}`, category, magnitude, likelihood })

describe('categoryNets', () => {
  it('subtotals expected value within a category only', () => {
    const nets = categoryNets([
      cbaItem(1, 'benefit', 'dollars', 100, 0.8), // +80
      cbaItem(2, 'cost', 'dollars', 50, 0.6), // -30
      cbaItem(3, 'benefit', 'hours', 10, 0.5), // +5
    ])
    const dollars = nets.find((n) => n.category === 'dollars')!
    expect(dollars.net).toBeCloseTo(50, 5)
    const hours = nets.find((n) => n.category === 'hours')!
    expect(hours.net).toBeCloseTo(5, 5)
  })

  it('skips rows with missing category, magnitude, or likelihood', () => {
    const nets = categoryNets([
      { id: 1, side: 'benefit', claim: 'x', category: null, magnitude: 100, likelihood: 0.5 },
      { id: 2, side: 'cost', claim: 'y', category: 'dollars', magnitude: null, likelihood: 0.5 },
      { id: 3, side: 'cost', claim: 'z', category: 'dollars', magnitude: 10, likelihood: null },
    ])
    expect(nets).toHaveLength(0)
  })
})

describe('findCompromiseCandidates', () => {
  it('finds the item whose small likelihood shift flips its category net', () => {
    // dollars: +80 benefit, -70 cost → net +10. The cost item (magnitude 100)
    // flips the net with a shift of 0.10 ≤ 0.15.
    const candidates = findCompromiseCandidates([
      cbaItem(1, 'benefit', 'dollars', 100, 0.8),
      cbaItem(2, 'cost', 'dollars', 100, 0.7),
    ])
    expect(candidates.length).toBeGreaterThan(0)
    const byId = new Map(candidates.map((c) => [c.itemId, c]))
    expect(byId.get(2)!.direction).toBe('raise')
    expect(byId.get(2)!.requiredShift).toBeCloseTo(0.1, 5)
    expect(byId.get(1)!.direction).toBe('lower')
  })

  it('rejects shifts larger than the achievable threshold', () => {
    // net +50 with magnitudes 100 → required shift 0.5 > 0.15.
    const candidates = findCompromiseCandidates([
      cbaItem(1, 'benefit', 'dollars', 100, 0.8),
      cbaItem(2, 'cost', 'dollars', 100, 0.3),
    ])
    expect(candidates).toHaveLength(0)
  })

  it('rejects shifts that would push likelihood outside [0, 1]', () => {
    // net +1 in dollars; the benefit at likelihood 0.005 cannot be lowered by 0.01.
    const candidates = findCompromiseCandidates([
      cbaItem(1, 'benefit', 'dollars', 100, 0.005),
      { id: 2, side: 'benefit', claim: 'b', category: 'dollars', magnitude: 1000, likelihood: 0.0495 },
      cbaItem(3, 'cost', 'dollars', 100, 0.49),
    ])
    expect(candidates.find((c) => c.itemId === 1)).toBeUndefined()
  })

  it('orders candidates by the smallest required shift', () => {
    const candidates = findCompromiseCandidates([
      cbaItem(1, 'benefit', 'dollars', 100, 0.6), // shift 0.10
      cbaItem(2, 'cost', 'dollars', 200, 0.25), // shift 0.05
    ])
    expect(candidates[0].itemId).toBe(2)
    expect(candidates[0].requiredShift).toBeCloseTo(0.05, 5)
  })
})

describe('analyzeConflict', () => {
  it('assembles all four outputs from scored rows', () => {
    const readout = analyzeConflict(
      [
        interest(1, 'supporter', 'Economic security for families', 90, 80),
        interest(2, 'opponent', 'Economic security for families', 85, 60),
        interest(3, 'supporter', 'End extreme poverty', 88, 85),
        interest(4, 'opponent', 'Keep taxes low', 82, 90),
      ],
      [{ id: 1, value: 'Freedom', supporterRank: 5, opponentRank: 1 }],
      [cbaItem(1, 'benefit', 'dollars', 100, 0.8), cbaItem(2, 'cost', 'dollars', 100, 0.7)],
    )
    expect(readout.sharedInterests.length).toBeGreaterThan(0)
    expect(readout.primaryConflictPair).not.toBeNull()
    expect(readout.primaryConflictPair!.supporter.id).toBe(3)
    expect(readout.primaryConflictPair!.opponent.id).toBe(4)
    expect(readout.valueConflicts).toHaveLength(1)
    expect(readout.compromiseCandidates.length).toBeGreaterThan(0)
  })
})
