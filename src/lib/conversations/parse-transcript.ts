// Pure transcript parser for pasted chat logs: one "Author: message" per
// line, continuation lines folded into the previous message, optional
// leading "[timestamp]" stripped. Shared by the demo UI and the demo route
// so both sides agree on what a pasted thread means.

import type { ConversationMessageInput } from './contract'

const TIMESTAMP_PREFIX = /^\[[^\]]{1,40}\]\s*/
// A handle is one token (letters, digits, and the punctuation chat handles
// use). Requiring a single token keeps a continuation line that happens to
// contain a colon ("Second thought: no") from being split into a bogus
// message by an "author" with spaces in it.
const AUTHOR_LINE = /^([A-Za-z0-9_.\/@#~\-]{1,40}):\s*(.+)$/

export function parseTranscript(text: string): ConversationMessageInput[] {
  const messages: ConversationMessageInput[] = []
  for (const raw of text.split('\n')) {
    const line = raw.replace(TIMESTAMP_PREFIX, '').trim()
    if (!line) continue
    const match = AUTHOR_LINE.exec(line)
    if (match) {
      messages.push({ author: match[1], body: match[2].trim() })
    } else if (messages.length > 0) {
      messages[messages.length - 1].body += `\n${line}`
    } else {
      messages.push({ author: 'anon', body: line })
    }
  }
  return messages
}
