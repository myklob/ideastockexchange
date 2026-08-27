import { describe, it, expect } from 'vitest'
import { validateConversationImport } from '@/lib/conversations/contract'

const valid = {
  platform: 'discord',
  title: 'Rent control debate',
  messages: [{ author: 'ada', body: 'Rent control reduces supply.' }],
}

function issuePaths(raw: unknown): string[] {
  const result = validateConversationImport(raw)
  return result.ok ? [] : result.issues.map(i => i.path)
}

describe('validateConversationImport optional fields', () => {
  it('accepts a payload with well-formed optional fields', () => {
    const result = validateConversationImport({
      ...valid,
      sourceUrl: 'https://example.com/t/1',
      beliefSlug: 'rent-control-reduces-supply',
      messages: [{ author: 'ada', body: 'x', postedAt: '2026-08-01T12:00:00Z' }],
    })
    expect(result.ok).toBe(true)
  })

  it('rejects a non-string beliefSlug instead of crashing the import', () => {
    expect(issuePaths({ ...valid, beliefSlug: 42 })).toContain('beliefSlug')
  })

  it('rejects a non-string sourceUrl', () => {
    expect(issuePaths({ ...valid, sourceUrl: 123 })).toContain('sourceUrl')
  })

  it('rejects an unparseable postedAt so the transaction never sees an Invalid Date', () => {
    expect(
      issuePaths({ ...valid, messages: [{ author: 'ada', body: 'x', postedAt: 'yesterday' }] }),
    ).toContain('messages[0].postedAt')
    expect(
      issuePaths({ ...valid, messages: [{ author: 'ada', body: 'x', postedAt: 1690000000 }] }),
    ).toContain('messages[0].postedAt')
  })
})
