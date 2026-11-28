import { describe, it, expect } from 'vitest'
import { extractCandidates } from '@/lib/conversations/extract'

const msg = (author: string, body: string) => ({ author, body })

describe('extractCandidates (find arguments in chat noise)', () => {
  it('mines a standalone claim and keeps the argumentative markers', () => {
    const { candidates } = extractCandidates(
      [msg('ada', 'Nuclear power has the lowest deaths per terawatt hour because reactors rarely fail')],
      null,
    )
    expect(candidates).toHaveLength(1)
    expect(candidates[0].statement).toBe(
      'Nuclear power has the lowest deaths per terawatt hour because reactors rarely fail',
    )
    expect(candidates[0].direction).toBe('pro')
    expect(candidates[0].markers).toContain('because')
    expect(candidates[0].messageIndex).toBe(0)
  })

  it('reads a disagreement opener as a con stance', () => {
    const { candidates } = extractCandidates(
      [msg('bob', 'No, that is wrong. Nuclear plants take a decade to build while emissions keep rising')],
      null,
    )
    expect(candidates).toHaveLength(1)
    expect(candidates[0].direction).toBe('con')
  })

  it('flips stance when a sentence negates the focal statement', () => {
    const focal = 'Nuclear power is the safest energy source'
    const { candidates } = extractCandidates(
      [msg('cat', 'Nuclear power is not the safest energy source at all')],
      focal,
    )
    expect(candidates).toHaveLength(1)
    expect(candidates[0].direction).toBe('con')
  })

  it('skips questions, fragments, and social noise with named reasons', () => {
    const { candidates, skipped } = extractCandidates(
      [
        msg('dee', 'What about the waste storage problem?'),
        msg('eve', 'lol this'),
        msg('fay', 'Big if true'),
      ],
      null,
    )
    expect(candidates).toHaveLength(0)
    expect(skipped.map(s => s.reason)).toEqual(['question', 'social-noise', 'fragment-or-label'])
  })

  it('strips first-person hedges so the claim underneath stands alone', () => {
    const { candidates } = extractCandidates(
      [msg('gil', 'I think carbon taxes lower household emissions faster than subsidies')],
      null,
    )
    expect(candidates).toHaveLength(1)
    expect(candidates[0].statement).toBe('Carbon taxes lower household emissions faster than subsidies')
  })

  it('captures shared URLs as evidence provenance and removes them from the claim', () => {
    const { candidates } = extractCandidates(
      [msg('hal', 'Deaths per terawatt hour are lowest for nuclear https://ourworldindata.org/safest-sources-of-energy')],
      null,
    )
    expect(candidates).toHaveLength(1)
    expect(candidates[0].statement).not.toContain('http')
    expect(candidates[0].evidenceUrls).toEqual(['https://ourworldindata.org/safest-sources-of-energy'])
  })

  it('ignores quoted reply lines — someone else already said them', () => {
    const { candidates } = extractCandidates(
      [msg('ivy', '> nuclear power is extremely dangerous\nThe danger claim traces to old coverage rather than the recorded death data')],
      null,
    )
    expect(candidates).toHaveLength(1)
    expect(candidates[0].statement).not.toContain('extremely dangerous')
  })

  it('skips restatements of the focal belief — the topic is not an argument for itself', () => {
    const focal = 'Nuclear power is the safest large-scale energy source'
    const { candidates, skipped } = extractCandidates(
      [msg('joe', 'Nuclear power is the safest large-scale energy source')],
      focal,
    )
    expect(candidates).toHaveLength(0)
    expect(skipped[0].reason).toBe('restates-focal-belief')
  })

  it('folds near-duplicate claims within a thread — first voicing keeps the candidacy', () => {
    const { candidates, skipped } = extractCandidates(
      [
        msg('kim', 'Nuclear power has the lowest deaths per terawatt hour of any source'),
        msg('lou', 'Nuclear power has the lowest deaths per terawatt hour of any source'),
      ],
      null,
    )
    expect(candidates).toHaveLength(1)
    expect(candidates[0].messageIndex).toBe(0)
    expect(skipped.some(s => s.reason === 'duplicate-in-thread' && s.messageIndex === 1)).toBe(true)
  })

  it('strips @mentions before judging the sentence', () => {
    const { candidates } = extractCandidates(
      [msg('mia', '@bob renewable storage costs fell ninety percent over the last decade')],
      null,
    )
    expect(candidates).toHaveLength(1)
    expect(candidates[0].statement).not.toContain('@bob')
  })

  it('carries no numeric fields — extraction finds structure, never scores', () => {
    const { candidates } = extractCandidates(
      [msg('ned', 'Grid-scale batteries make intermittent sources reliable because storage smooths demand peaks')],
      null,
    )
    for (const c of candidates) {
      for (const [key, value] of Object.entries(c)) {
        if (key === 'messageIndex') continue
        expect(typeof value === 'number').toBe(false)
      }
    }
  })
})
