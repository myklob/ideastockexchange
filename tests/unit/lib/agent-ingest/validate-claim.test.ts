import { describe, it, expect } from 'vitest'
import {
  findScoreFields,
  validateStandaloneClaim,
  validateFiveStepCheck,
  validateEvidenceInput,
  validateIngestPayload,
} from '@/lib/agent-ingest/validate-claim'
import { AUDIT_LOCK_MESSAGE, FAILURE_MODES } from '@/lib/agent-ingest/contract'

const validClaim = {
  statement: 'A negative income tax reduces administrative overhead relative to categorical welfare programs',
  direction: 'pro' as const,
  parentBeliefSlug: 'universal-basic-income-should-be-implemented',
  rationale: 'Extracted from section 3; the source argues consolidation cuts caseworker cost',
  fiveStepCheck: {
    parentWording: 'Universal basic income should be implemented',
    claimWording: 'A negative income tax reduces administrative overhead relative to categorical welfare programs',
    howItSupports: 'Lower administrative cost removes a standard objection to implementation',
    provisionalEstimate: 0.8,
    flaggedBelowThreshold: false,
  },
  evidence: [
    {
      title: 'Administrative costs of means-tested transfers',
      sourceUrl: 'https://example.org/study',
      doi: '10.1000/xyz123',
      tierClaim: 'T1',
    },
  ],
}

const validPayload = {
  batchTitle: 'Grokipedia article: Universal Basic Income',
  claims: [validClaim],
}

describe('findScoreFields (the audit lock)', () => {
  it('flags score-shaped keys anywhere in the payload', () => {
    const offender = {
      ...validPayload,
      claims: [{ ...validClaim, truthScore: 0.9, nested: { linkageScore: 1.0 } }],
    }
    const paths = findScoreFields(offender)
    expect(paths).toContain('claims[0].truthScore')
    expect(paths).toContain('claims[0].nested.linkageScore')
  })

  it('allows the five-step provisionalEstimate (the author bracket)', () => {
    expect(findScoreFields(validPayload)).toEqual([])
  })

  it('flags reasonRank, strength, weight, impact, and likelihood', () => {
    for (const key of ['reasonRank', 'strength', 'weight', 'impact', 'likelihood']) {
      expect(findScoreFields({ [key]: 1 })).toEqual([key])
    }
  })
})

describe('validateStandaloneClaim (the standalone-claim rule)', () => {
  it('rejects bare topic labels with the named failure mode', () => {
    const issues = validateStandaloneClaim('Universal Basic Income policy overview')
    expect(issues.some(i => i.mode === FAILURE_MODES.TOPIC_LABEL)).toBe(true)
    expect(issues.find(i => i.mode === FAILURE_MODES.TOPIC_LABEL)?.message).toContain('topic-label cell')
  })

  it('rejects fragments', () => {
    const issues = validateStandaloneClaim('Gun control')
    expect(issues.some(i => i.mode === FAILURE_MODES.FRAGMENT)).toBe(true)
  })

  it('accepts a complete proposition', () => {
    expect(validateStandaloneClaim(validClaim.statement)).toEqual([])
  })

  it('accepts copula claims', () => {
    expect(validateStandaloneClaim('Categorical welfare programs are administratively expensive')).toEqual([])
  })
})

describe('validateFiveStepCheck (linkage is never defaulted)', () => {
  it('rejects a missing check with the named failure mode', () => {
    const issues = validateFiveStepCheck(undefined, 'claims[0].fiveStepCheck')
    expect(issues).toHaveLength(1)
    expect(issues[0].mode).toBe(FAILURE_MODES.MISSING_FIVE_STEP)
  })

  it('rejects an incomplete check and names the missing steps', () => {
    const issues = validateFiveStepCheck(
      { parentWording: 'x', provisionalEstimate: 1.5 },
      'claims[0].fiveStepCheck',
    )
    expect(issues).toHaveLength(1)
    expect(issues[0].mode).toBe(FAILURE_MODES.INCOMPLETE_FIVE_STEP)
    expect(issues[0].message).toContain('claimWording')
    expect(issues[0].message).toContain('provisionalEstimate')
  })

  it('accepts a complete check', () => {
    expect(validateFiveStepCheck(validClaim.fiveStepCheck, 'p')).toEqual([])
  })
})

describe('validateEvidenceInput (provenance capture)', () => {
  it('requires a locator (sourceUrl, doi, pmid, or isbn)', () => {
    const issues = validateEvidenceInput({ title: 'Some study' }, 'e')
    expect(issues.some(i => i.mode === FAILURE_MODES.INVALID_EVIDENCE)).toBe(true)
  })

  it('rejects tier claims outside T1-T4', () => {
    const issues = validateEvidenceInput({ title: 't', doi: '10.1/x', tierClaim: 'T9' }, 'e')
    expect(issues.some(i => i.mode === FAILURE_MODES.INVALID_TIER_CLAIM)).toBe(true)
  })
})

describe('validateIngestPayload (the pipeline, in order)', () => {
  it('round-trips the honest synthesizer payload', () => {
    const result = validateIngestPayload(validPayload)
    expect(result.ok).toBe(true)
  })

  it('rejects the over-claimer with the audit lock quoted, before anything else', () => {
    const result = validateIngestPayload({
      ...validPayload,
      claims: [{ ...validClaim, argumentScore: 95 }],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.auditLock).toBe(true)
      expect(result.issues[0].mode).toBe(FAILURE_MODES.SCORE_FIELD)
      expect(result.issues[0].message).toBe(AUDIT_LOCK_MESSAGE)
    }
  })

  it('rejects the label-poster with the named failure mode', () => {
    const result = validateIngestPayload({
      ...validPayload,
      claims: [{ ...validClaim, statement: 'Universal Basic Income' }],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some(i => i.mode === FAILURE_MODES.TOPIC_LABEL)).toBe(true)
    }
  })

  it('rejects a claim without a rationale', () => {
    const result = validateIngestPayload({
      ...validPayload,
      claims: [{ ...validClaim, rationale: '' }],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some(i => i.mode === FAILURE_MODES.MISSING_RATIONALE)).toBe(true)
    }
  })

  it('rejects an invalid direction', () => {
    const result = validateIngestPayload({
      ...validPayload,
      claims: [{ ...validClaim, direction: 'maybe' }],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some(i => i.mode === FAILURE_MODES.INVALID_DIRECTION)).toBe(true)
    }
  })
})
