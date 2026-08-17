import { describe, it, expect } from 'vitest'
import { validateConversationImport } from '@/lib/conversations/contract'

const base = {
  platform: 'forum',
  title: 'Nuclear thread',
  messages: [{ author: 'ada', body: 'Nuclear power has the lowest deaths per terawatt hour' }],
}

describe('validateConversationImport (shape contract)', () => {
  it('accepts a minimal valid payload', () => {
    expect(validateConversationImport(base).ok).toBe(true)
  })

  it('rejects a non-string beliefSlug instead of crashing downstream', () => {
    const out = validateConversationImport({ ...base, beliefSlug: 42 })
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.issues.some(i => i.path === 'beliefSlug')).toBe(true)
  })

  it('rejects a non-string sourceUrl', () => {
    const out = validateConversationImport({ ...base, sourceUrl: ['https://a'] })
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.issues.some(i => i.path === 'sourceUrl')).toBe(true)
  })

  it('rejects an unparseable postedAt', () => {
    const out = validateConversationImport({
      ...base,
      messages: [{ author: 'ada', body: 'A claim that stands alone quite well', postedAt: 'yesterday' }],
    })
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.issues.some(i => i.path === 'messages[0].postedAt')).toBe(true)
  })

  it('accepts an ISO postedAt', () => {
    const out = validateConversationImport({
      ...base,
      messages: [{ author: 'ada', body: 'A claim that stands alone quite well', postedAt: '2026-07-01T12:00:00Z' }],
    })
    expect(out.ok).toBe(true)
  })
})
