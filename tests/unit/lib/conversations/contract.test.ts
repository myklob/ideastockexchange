import { describe, it, expect } from 'vitest'
import { validateConversationImport } from '@/lib/conversations/contract'

const base = {
  platform: 'discord',
  title: 'Dogs and stress',
  messages: [{ author: 'a', body: 'Dogs reduce stress in owners.' }],
}

describe('validateConversationImport', () => {
  it('accepts a minimal valid payload', () => {
    expect(validateConversationImport(base).ok).toBe(true)
  })

  it('accepts a parseable ISO postedAt and an omitted one', () => {
    const withTimestamp = {
      ...base,
      messages: [{ author: 'a', body: 'Dogs reduce stress in owners.', postedAt: '2026-08-01T12:00:00Z' }],
    }
    expect(validateConversationImport(withTimestamp).ok).toBe(true)
  })

  it('rejects an unparseable postedAt with a 422 issue instead of crashing the import', () => {
    const bad = {
      ...base,
      messages: [{ author: 'a', body: 'Dogs reduce stress in owners.', postedAt: 'yesterday' }],
    }
    const result = validateConversationImport(bad)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some(i => i.path === 'messages[0].postedAt')).toBe(true)
    }
  })

  it('rejects a non-string postedAt', () => {
    const bad = {
      ...base,
      messages: [{ author: 'a', body: 'Dogs reduce stress in owners.', postedAt: {} }],
    }
    expect(validateConversationImport(bad).ok).toBe(false)
  })
})
