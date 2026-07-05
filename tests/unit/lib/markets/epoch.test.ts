import { describe, it, expect } from 'vitest'
import {
  epochBoundary,
  epochLabelFor,
  previousEpoch,
  nextEpoch,
  freezeWindow,
  isGraphFrozen,
  isFutureEpoch,
  isValidEpochLabel,
} from '@/lib/markets/epoch'

describe('epoch arithmetic', () => {
  it('boundary is 23:59:59.999 UTC on the last day of the month', () => {
    expect(epochBoundary('2026-07').toISOString()).toBe('2026-07-31T23:59:59.999Z')
    expect(epochBoundary('2026-02').toISOString()).toBe('2026-02-28T23:59:59.999Z')
    expect(epochBoundary('2028-02').toISOString()).toBe('2028-02-29T23:59:59.999Z') // leap year
  })

  it('walks epochs across year boundaries', () => {
    expect(previousEpoch('2026-01')).toBe('2025-12')
    expect(nextEpoch('2026-12')).toBe('2027-01')
    expect(epochLabelFor(new Date('2026-07-05T12:00:00Z'))).toBe('2026-07')
  })

  it('validates labels', () => {
    expect(isValidEpochLabel('2026-07')).toBe(true)
    expect(isValidEpochLabel('2026-13')).toBe(false)
    expect(isValidEpochLabel('2026-7')).toBe(false)
  })

  it('freeze window runs 23:50 boundary day to 00:10 the next day', () => {
    const { start, end } = freezeWindow('2026-07')
    expect(start.toISOString()).toBe('2026-07-31T23:50:00.000Z')
    expect(end.toISOString()).toBe('2026-08-01T00:10:00.000Z')
  })

  it('isGraphFrozen: arguments at 23:49 count, 23:51 are frozen out, 00:05 still frozen, 00:11 open again', () => {
    expect(isGraphFrozen(new Date('2026-07-31T23:49:59Z'))).toBe(false)
    expect(isGraphFrozen(new Date('2026-07-31T23:51:00Z'))).toBe(true)
    expect(isGraphFrozen(new Date('2026-08-01T00:05:00Z'))).toBe(true)
    expect(isGraphFrozen(new Date('2026-08-01T00:11:00Z'))).toBe(false)
    expect(isGraphFrozen(new Date('2026-07-15T12:00:00Z'))).toBe(false)
  })

  it('isFutureEpoch is strict about the boundary', () => {
    expect(isFutureEpoch('2026-07', new Date('2026-07-15T00:00:00Z'))).toBe(true)
    expect(isFutureEpoch('2026-07', new Date('2026-08-01T00:00:00Z'))).toBe(false)
  })
})
