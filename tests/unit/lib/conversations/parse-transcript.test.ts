import { describe, it, expect } from 'vitest'
import { parseTranscript } from '@/lib/conversations/parse-transcript'

describe('parseTranscript (pasted chat log → messages)', () => {
  it('splits "Author: message" lines', () => {
    const messages = parseTranscript('alice: The norm binds both sides.\nbob: lol')
    expect(messages).toEqual([
      { author: 'alice', body: 'The norm binds both sides.' },
      { author: 'bob', body: 'lol' },
    ])
  })

  it('folds continuation lines into the previous message', () => {
    const messages = parseTranscript('alice: First line.\nStill alice talking.\nbob: Reply')
    expect(messages).toHaveLength(2)
    expect(messages[0].body).toBe('First line.\nStill alice talking.')
  })

  it('does not split a continuation line that merely contains a colon', () => {
    const messages = parseTranscript('alice: First point.\nSecond thought: it also binds winners.\nbob: ok')
    expect(messages).toHaveLength(2)
    expect(messages[0].body).toBe('First point.\nSecond thought: it also binds winners.')
  })

  it('strips leading [timestamps] and ignores blank lines', () => {
    const messages = parseTranscript('[10:42] alice: Hello there\n\n[10:43] bob: Hi')
    expect(messages.map(m => m.author)).toEqual(['alice', 'bob'])
  })

  it('attributes an authorless first line to anon', () => {
    expect(parseTranscript('just some text')).toEqual([{ author: 'anon', body: 'just some text' }])
  })

  it('keeps URLs with colons inside the body', () => {
    const [m] = parseTranscript('audit_hawk: see https://example.org/audit-timelines for details')
    expect(m.author).toBe('audit_hawk')
    expect(m.body).toContain('https://example.org/audit-timelines')
  })
})
