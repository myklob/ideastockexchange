// Pure transcript parser for pasted chat logs: one "Author: message" per
// line, continuation lines folded into the previous message, optional
// leading "[timestamp]" stripped. Shared by the demo UI and the demo route
// so both sides agree on what a pasted thread means.

import type { ConversationMessageInput } from './contract'

const TIMESTAMP_PREFIX = /^\[[^\]]{1,40}\]\s*/
const AUTHOR_LINE = /^([^:]{1,60}?):\s*(.+)$/

export function parseTranscript(text: string): ConversationMessageInput[] {
  const messages: ConversationMessageInput[] = []
  for (const raw of text.split('\n')) {
    const line = raw.replace(TIMESTAMP_PREFIX, '').trim()
    if (!line) continue
    const match = AUTHOR_LINE.exec(line)
    if (match) {
      messages.push({ author: match[1].trim(), body: match[2].trim() })
    } else if (messages.length > 0) {
      messages[messages.length - 1].body += `\n${line}`
    } else {
      messages.push({ author: 'anon', body: line })
    }
  }
  return messages
}
