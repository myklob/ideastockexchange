import { describe, it, expect } from 'vitest'
import { scanForRestatements } from '@/lib/posting/drift-guard'
import {
  EQUIVALENCE_CANDIDATE_THRESHOLD,
  RESTATEMENT_SPEEDBUMP_THRESHOLD,
} from '@/lib/agent-ingest/similarity'

describe('drift guard: restating stops counting as contributing', () => {
  it('the speed-bump threshold sits above the candidate threshold', () => {
    expect(RESTATEMENT_SPEEDBUMP_THRESHOLD).toBeGreaterThan(EQUIVALENCE_CANDIDATE_THRESHOLD)
  })

  it('an unrelated statement produces no candidates and no bump', () => {
    const scan = scanForRestatements('Carbon taxes reduce emissions at lower cost than mandates.', [
      { id: 1, text: 'School choice improves outcomes for low-income students.' },
    ])
    expect(scan.candidates).toEqual([])
    expect(scan.nearDuplicate).toBeNull()
  })

  it('a verbatim restatement trips the near-duplicate bump', () => {
    const text = 'Married individuals report better health and life satisfaction.'
    const scan = scanForRestatements(text, [{ id: 7, text }])
    expect(scan.nearDuplicate).not.toBeNull()
    expect(scan.nearDuplicate!.existingArgumentId).toBe(7)
    expect(scan.nearDuplicate!.similarity).toBe(1)
  })

  it('a reordering of the same words still trips the bump', () => {
    const scan = scanForRestatements(
      'Married individuals report better life satisfaction and health.',
      [{ id: 7, text: 'Married individuals report better health and life satisfaction.' }],
    )
    expect(scan.nearDuplicate).not.toBeNull()
    expect(scan.nearDuplicate!.existingArgumentId).toBe(7)
  })

  it('moderate overlap becomes a candidate without tripping the bump', () => {
    const scan = scanForRestatements(
      'Marriage improves long-term health outcomes for both partners across income levels.',
      [{ id: 3, text: 'Married individuals report better health, wealth, and life satisfaction.' }],
    )
    for (const c of scan.candidates) {
      expect(c.similarity).toBeGreaterThanOrEqual(EQUIVALENCE_CANDIDATE_THRESHOLD)
      expect(c.similarity).toBeLessThan(RESTATEMENT_SPEEDBUMP_THRESHOLD)
    }
    expect(scan.nearDuplicate).toBeNull()
  })

  it('candidates come back strongest overlap first', () => {
    const target = 'A carbon tax cuts emissions faster than regulation.'
    const scan = scanForRestatements(target, [
      { id: 1, text: 'A carbon tax cuts overall emissions faster than direct regulation.' },
      { id: 2, text: 'A carbon tax cuts emissions faster than regulation.' },
    ])
    expect(scan.candidates.length).toBeGreaterThanOrEqual(2)
    expect(scan.candidates[0].existingArgumentId).toBe(2)
    const sims = scan.candidates.map((c) => c.similarity)
    expect([...sims].sort((a, b) => b - a)).toEqual(sims)
  })
})
