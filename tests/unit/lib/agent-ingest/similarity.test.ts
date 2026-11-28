import { describe, it, expect } from 'vitest'
import {
  textSimilarity,
  normalizeTokens,
  similarityBand,
  EQUIVALENCE_CANDIDATE_THRESHOLD,
  RESTATEMENT_SPEEDBUMP_THRESHOLD,
  SAME_CLAIM_THRESHOLD,
} from '@/lib/agent-ingest/similarity'

describe('textSimilarity (redundancy scan, stored not scored)', () => {
  it('scores a paraphrase above the candidate threshold', () => {
    const a = 'A negative income tax reduces administrative overhead relative to categorical welfare programs'
    const b = 'Categorical welfare programs have higher administrative overhead than a negative income tax'
    expect(textSimilarity(a, b)).toBeGreaterThanOrEqual(EQUIVALENCE_CANDIDATE_THRESHOLD)
  })

  it('scores an identical statement at 1', () => {
    const a = 'Ranked-choice voting eliminates the spoiler effect'
    expect(textSimilarity(a, a)).toBe(1)
  })

  it('scores unrelated claims below the threshold', () => {
    const a = 'A negative income tax reduces administrative overhead'
    const b = 'The moon landing was filmed in a studio in Nevada'
    expect(textSimilarity(a, b)).toBeLessThan(EQUIVALENCE_CANDIDATE_THRESHOLD)
  })

  it('normalizes inflections so reworded verbs still collide', () => {
    expect(normalizeTokens('reduces reducing reduced')).toEqual(['reduc', 'reduc', 'reduc'])
  })
})

describe('similarityBand (routes pairs; the community vote decides)', () => {
  it('maps each threshold to its band', () => {
    expect(similarityBand(1)).toBe('same-claim')
    expect(similarityBand(SAME_CLAIM_THRESHOLD)).toBe('same-claim')
    expect(similarityBand(RESTATEMENT_SPEEDBUMP_THRESHOLD)).toBe('probable-group')
    expect(similarityBand(EQUIVALENCE_CANDIDATE_THRESHOLD)).toBe('related-link')
    expect(similarityBand(0.49)).toBe('distinct')
    expect(similarityBand(0)).toBe('distinct')
  })

  it('keeps the bands ordered: same-claim ⊂ probable-group ⊂ related-link', () => {
    expect(SAME_CLAIM_THRESHOLD).toBeGreaterThan(RESTATEMENT_SPEEDBUMP_THRESHOLD)
    expect(RESTATEMENT_SPEEDBUMP_THRESHOLD).toBeGreaterThan(EQUIVALENCE_CANDIDATE_THRESHOLD)
  })
})
