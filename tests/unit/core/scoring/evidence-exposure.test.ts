/**
 * Unit tests for Retraction Exposure.
 *
 * Anchors verified here:
 * - Counted weight matches the engine's own VERIFICATION_SCORES, so the
 *   "points this belief draws from evidence" figure agrees with the score.
 * - A row counted in full with no lifecycle status on record carries the
 *   largest exposure; a verified row carries none; a falsified row carries
 *   none because the cascade has already fired.
 * - Exposure is a magnitude: a weakening row is exposed exactly like a
 *   supporting one of the same impact.
 * - An unconfirmed tier claim is reported as a flag, never folded into the
 *   arithmetic.
 */

import { describe, it, expect } from 'vitest'
import {
  readStanding,
  countedWeight,
  exposedWeight,
  computeEvidenceExposure,
  computeBeliefEvidenceExposure,
  summarizeExposure,
  STANDINGS,
  HIGH_EXPOSURE_SHARE,
  type ExposureEvidenceInput,
} from '@/core/scoring/evidence-exposure'
import { VERIFICATION_SCORES } from '@/core/reasonrank/types'

function row(overrides: Partial<ExposureEvidenceInput> = {}): ExposureEvidenceInput {
  return {
    id: 1,
    side: 'supporting',
    impactScore: 20,
    verificationStatus: 'UNVERIFIED',
    ...overrides,
  }
}

describe('readStanding', () => {
  it('maps every lifecycle status', () => {
    expect(readStanding('VERIFIED')).toBe('verified')
    expect(readStanding('UNVERIFIED')).toBe('unverified')
    expect(readStanding('DISPUTED')).toBe('disputed')
    expect(readStanding('FALSIFIED')).toBe('falsified')
  })

  it('treats a missing or unknown status as unrecorded, never as verified', () => {
    expect(readStanding(null)).toBe('unrecorded')
    expect(readStanding(undefined)).toBe('unrecorded')
    expect(readStanding('')).toBe('unrecorded')
    expect(readStanding('PROBABLY_FINE')).toBe('unrecorded')
  })

  it('has display metadata for every standing it can return', () => {
    for (const key of ['verified', 'unverified', 'disputed', 'falsified', 'unrecorded'] as const) {
      expect(STANDINGS[key].label).toBeTruthy()
      expect(STANDINGS[key].descriptor).toBeTruthy()
    }
  })
})

describe('countedWeight', () => {
  it('matches the engine lifecycle weights', () => {
    expect(countedWeight('verified')).toBe(VERIFICATION_SCORES.VERIFIED)
    expect(countedWeight('unverified')).toBe(VERIFICATION_SCORES.UNVERIFIED)
    expect(countedWeight('disputed')).toBe(VERIFICATION_SCORES.DISPUTED)
    expect(countedWeight('falsified')).toBe(VERIFICATION_SCORES.FALSIFIED)
  })

  it('counts an unrecorded row in full, as the legacy rule does', () => {
    expect(countedWeight('unrecorded')).toBe(1)
  })
})

describe('exposedWeight', () => {
  it('is zero for settled standings', () => {
    expect(exposedWeight('verified')).toBe(0)
    expect(exposedWeight('falsified')).toBe(0)
  })

  it('is half for a row counted at half weight', () => {
    expect(exposedWeight('unverified')).toBeCloseTo(0.5)
    expect(exposedWeight('disputed')).toBeCloseTo(0.5)
  })

  it('is largest for a row counted in full on no record', () => {
    expect(exposedWeight('unrecorded')).toBe(1)
    expect(exposedWeight('unrecorded')).toBeGreaterThan(exposedWeight('unverified'))
  })
})

describe('computeEvidenceExposure', () => {
  it('splits a half-weighted row into what counts and what is at risk', () => {
    const result = computeEvidenceExposure(row({ impactScore: 20 }))
    expect(result.counted).toBeCloseTo(10)
    expect(result.exposed).toBeCloseTo(10)
    expect(result.standing).toBe('unverified')
  })

  it('exposes a full-weight unrecorded row completely', () => {
    const result = computeEvidenceExposure(row({ verificationStatus: null, impactScore: 18 }))
    expect(result.counted).toBeCloseTo(18)
    expect(result.exposed).toBeCloseTo(18)
  })

  it('exposes nothing on a verified row', () => {
    const result = computeEvidenceExposure(row({ verificationStatus: 'VERIFIED' }))
    expect(result.counted).toBeCloseTo(20)
    expect(result.exposed).toBe(0)
  })

  it('exposes nothing on a falsified row — the cascade already fired', () => {
    const result = computeEvidenceExposure(row({ verificationStatus: 'FALSIFIED' }))
    expect(result.counted).toBe(0)
    expect(result.exposed).toBe(0)
  })

  it('treats exposure as a magnitude, so weakening rows expose like supporting ones', () => {
    const supporting = computeEvidenceExposure(row({ side: 'supporting', impactScore: 14 }))
    const weakening = computeEvidenceExposure(row({ side: 'weakening', impactScore: -14 }))
    expect(weakening.exposed).toBeCloseTo(supporting.exposed)
    expect(weakening.counted).toBeCloseTo(supporting.counted)
  })

  it('flags an unconfirmed tier claim without changing the arithmetic', () => {
    const claimed = computeEvidenceExposure(row({ tierClaim: 'T1' }))
    const confirmed = computeEvidenceExposure(row({ tierClaim: 'T1', tierVerified: 'T2' }))
    expect(claimed.tierUnconfirmed).toBe(true)
    expect(confirmed.tierUnconfirmed).toBe(false)
    expect(claimed.exposed).toBeCloseTo(confirmed.exposed)
  })

  it('survives a non-finite impact score', () => {
    const result = computeEvidenceExposure(row({ impactScore: NaN }))
    expect(result.counted).toBe(0)
    expect(result.exposed).toBe(0)
  })
})

describe('computeBeliefEvidenceExposure', () => {
  const rows: ExposureEvidenceInput[] = [
    row({ id: 'legacy', verificationStatus: null, impactScore: 18 }),
    row({ id: 'unverified', verificationStatus: 'UNVERIFIED', impactScore: 20 }),
    row({ id: 'verified', verificationStatus: 'VERIFIED', impactScore: 12 }),
    row({ id: 'falsified', verificationStatus: 'FALSIFIED', impactScore: 30 }),
  ]

  it('ranks rows by exposure, highest first', () => {
    const result = computeBeliefEvidenceExposure(rows)
    expect(result.rows.map(r => r.id)).toEqual(['legacy', 'unverified', 'verified', 'falsified'])
  })

  it('totals only what the engine actually counts', () => {
    const result = computeBeliefEvidenceExposure(rows)
    // 18 (full) + 10 (half of 20) + 12 (full) + 0 (falsified) = 40
    expect(result.countedFromEvidence).toBeCloseTo(40)
    // 18 (unrecorded) + 10 (half of 20) = 28
    expect(result.exposedPoints).toBeCloseTo(28)
    expect(result.exposedShare).toBeCloseTo(0.7, 3)
  })

  it('counts the rows worth chasing', () => {
    const result = computeBeliefEvidenceExposure([...rows, row({ id: 'tier', tierClaim: 'T1' })])
    expect(result.unrecordedCount).toBe(1)
    expect(result.falsifiedCount).toBe(1)
    expect(result.tierUnconfirmedCount).toBe(1)
  })

  it('handles a belief with no evidence', () => {
    const result = computeBeliefEvidenceExposure([])
    expect(result).toMatchObject({
      rows: [],
      countedFromEvidence: 0,
      exposedPoints: 0,
      exposedShare: 0,
    })
    expect(summarizeExposure(result)).toMatch(/No evidence filed/)
  })

  it('reports a fully falsified ledger without dividing by zero', () => {
    const result = computeBeliefEvidenceExposure([
      row({ id: 'a', verificationStatus: 'FALSIFIED' }),
      row({ id: 'b', verificationStatus: 'FALSIFIED' }),
    ])
    expect(result.countedFromEvidence).toBe(0)
    expect(result.exposedShare).toBe(0)
    expect(summarizeExposure(result)).toMatch(/already cascaded/)
  })
})

describe('summarizeExposure', () => {
  it('states the exposed points, the share, and the unrecorded count', () => {
    const text = summarizeExposure(
      computeBeliefEvidenceExposure([
        row({ id: 'legacy', verificationStatus: null, impactScore: 18 }),
        row({ id: 'verified', verificationStatus: 'VERIFIED', impactScore: 12 }),
      ]),
    )
    expect(text).toContain('18.0')
    expect(text).toContain('30.0')
    expect(text).toMatch(/60%/)
    expect(text).toMatch(/1 row is counted in full with no verification on record/)
  })

  it('warns when more than half the evidence case is unearned', () => {
    const exposure = computeBeliefEvidenceExposure([
      row({ id: 'legacy', verificationStatus: null, impactScore: 18 }),
      row({ id: 'verified', verificationStatus: 'VERIFIED', impactScore: 12 }),
    ])
    expect(exposure.exposedShare).toBeGreaterThan(HIGH_EXPOSURE_SHARE)
    expect(summarizeExposure(exposure)).toMatch(/provisional/)
  })

  it('says so plainly when every row is established', () => {
    const text = summarizeExposure(
      computeBeliefEvidenceExposure([row({ verificationStatus: 'VERIFIED' })]),
    )
    expect(text).toMatch(/standing is established/)
  })

  it('mentions an unconfirmed tier claim', () => {
    const text = summarizeExposure(
      computeBeliefEvidenceExposure([row({ tierClaim: 'T1', impactScore: 20 })]),
    )
    expect(text).toMatch(/unconfirmed tier claim/)
  })
})
