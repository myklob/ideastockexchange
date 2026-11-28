import { describe, it, expect } from 'vitest'
import { detectFallacies } from '@/lib/agent-ingest/fallacy-detector'

describe('detectFallacies (an argument, never a penalty)', () => {
  it('drafts a relevance counter for ad hominem', () => {
    const detections = detectFallacies('The senator is a liar, so his tax plan will fail')
    const adHominem = detections.find(d => d.fallacyType === 'ad-hominem')
    expect(adHominem).toBeDefined()
    expect(adHominem?.targetFactor).toBe('relevance')
    expect(adHominem?.counterStatement.length).toBeGreaterThan(20)
  })

  it('drafts a logical-validity counter for false cause', () => {
    const detections = detectFallacies('Ice cream sales correlate with crime, which proves ice cream causes crime')
    const falseCause = detections.find(d => d.fallacyType === 'false-cause')
    expect(falseCause).toBeDefined()
    expect(falseCause?.targetFactor).toBe('logical-validity')
  })

  it('drafts an evidence-quality counter for cherry-picking', () => {
    const detections = detectFallacies('One study shows the policy worked perfectly')
    const cherryPicking = detections.find(d => d.fallacyType === 'cherry-picking')
    expect(cherryPicking).toBeDefined()
    expect(cherryPicking?.targetFactor).toBe('evidence-quality')
  })

  it('returns nothing for clean argument text', () => {
    expect(
      detectFallacies('A negative income tax reduces administrative overhead relative to categorical welfare programs'),
    ).toEqual([])
  })

  it('never returns numeric fields — detections carry no scores by construction', () => {
    const detections = detectFallacies('Everyone knows this is true and the critics are corrupt liars')
    expect(detections.length).toBeGreaterThan(0)
    for (const d of detections) {
      for (const value of Object.values(d)) {
        expect(typeof value).toBe('string')
      }
    }
  })
})
