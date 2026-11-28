import { describe, it, expect } from 'vitest'
import {
  callerCredibility,
  sideBalance,
  accuracyRate,
  CREDIBILITY_FLOOR,
  CREDIBILITY_CEILING,
  type CallerRecord,
} from '@/lib/fallacy/calibration'

// The two worked examples from the design essay.
// User X: 40% consensus accuracy, flags one side almost exclusively.
const tribalCaller: CallerRecord = {
  upheld: 8,
  rejected: 12,
  flaggedAgreeSide: 2,
  flaggedDisagreeSide: 78,
}
// User Y: 82% consensus accuracy, flags both sides.
const calibratedCaller: CallerRecord = {
  upheld: 41,
  rejected: 9,
  flaggedAgreeSide: 22,
  flaggedDisagreeSide: 53,
}

describe('callerCredibility (cross-partisan calibration)', () => {
  it('a new user with no history is exactly neutral', () => {
    expect(
      callerCredibility({ upheld: 0, rejected: 0, flaggedAgreeSide: 0, flaggedDisagreeSide: 0 }),
    ).toBe(1)
  })

  it('severe tribal bias plus low accuracy lands near the floor', () => {
    const m = callerCredibility(tribalCaller)
    expect(m).toBeGreaterThanOrEqual(CREDIBILITY_FLOOR)
    expect(m).toBeLessThanOrEqual(0.4)
  })

  it('balanced, accurate calling raises influence above 1', () => {
    expect(callerCredibility(calibratedCaller)).toBeGreaterThanOrEqual(1.2)
  })

  it('a perfect record clamps at the ceiling', () => {
    const m = callerCredibility({
      upheld: 20,
      rejected: 0,
      flaggedAgreeSide: 10,
      flaggedDisagreeSide: 10,
    })
    expect(m).toBe(CREDIBILITY_CEILING)
  })

  it('an always-wrong caller clamps at the floor, never zero', () => {
    const m = callerCredibility({
      upheld: 0,
      rejected: 20,
      flaggedAgreeSide: 10,
      flaggedDisagreeSide: 10,
    })
    expect(m).toBe(CREDIBILITY_FLOOR)
  })

  it('accuracy alone cannot buy influence for a one-sided caller', () => {
    // Perfect accuracy, purely one-sided: the balance factor still drags the
    // multiplier below neutral. Maintaining influence requires flagging your
    // own side's fallacies too.
    const m = callerCredibility({
      upheld: 10,
      rejected: 0,
      flaggedAgreeSide: 0,
      flaggedDisagreeSide: 10,
    })
    expect(m).toBeLessThan(1)
  })

  it('small samples stay neutral: three one-sided flags are not yet tribalism', () => {
    const m = callerCredibility({
      upheld: 0,
      rejected: 0,
      flaggedAgreeSide: 0,
      flaggedDisagreeSide: 3,
    })
    expect(m).toBe(1)
  })
})

describe('components', () => {
  it('sideBalance is 1 when perfectly even, small when one-sided', () => {
    expect(
      sideBalance({ upheld: 0, rejected: 0, flaggedAgreeSide: 10, flaggedDisagreeSide: 10 }),
    ).toBe(1)
    expect(
      sideBalance({ upheld: 0, rejected: 0, flaggedAgreeSide: 0, flaggedDisagreeSide: 50 }),
    ).toBeLessThan(0.05)
  })

  it('accuracyRate is null with no resolved claims', () => {
    expect(
      accuracyRate({ upheld: 0, rejected: 0, flaggedAgreeSide: 5, flaggedDisagreeSide: 5 }),
    ).toBeNull()
  })
})
