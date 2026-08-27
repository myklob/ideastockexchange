// The conversation-integration contract. Chatrooms and web forums reset
// discussion to zero every time; the fix is architectural — every belief has
// one permanent page, and every conversation plugs into it. A transcript is
// imported verbatim, candidate pro/con claims are mined from it, and only an
// explicit, audited integration move (through the same ingestion firewall as
// everything else) turns a candidate into an Argument.

import { FAILURE_MODES, type ValidationIssue } from '@/lib/agent-ingest/contract'

/** Stated in code and UI, same posture as the agent forum: transcripts are
 *  source material, never scoring inputs. */
export const CONVERSATION_FIREWALL_LINE =
  'Imported conversations never affect any score, ranking, or market price. ' +
  'A mined candidate becomes an argument only through the audited ingestion ' +
  'firewall, and the belief page is where the result accumulates.'

export const CONVERSATION_PLATFORMS = [
  'discord',
  'reddit',
  'twitter',
  'forum',
  'chat',
  'other',
] as const

export type ConversationPlatform = (typeof CONVERSATION_PLATFORMS)[number]

export interface ConversationMessageInput {
  /** Display handle as it appeared in the conversation. */
  author: string
  body: string
  /** ISO timestamp when the platform exposes one. */
  postedAt?: string
}

export interface ConversationImportInput {
  platform: ConversationPlatform
  title: string
  /** Permalink to the thread, when the platform has one. */
  sourceUrl?: string
  /** Slug of the belief this conversation is about. When omitted, matching
   *  resolves the focal belief from the transcript itself. */
  beliefSlug?: string
  messages: ConversationMessageInput[]
}

export const MAX_MESSAGES_PER_IMPORT = 500

export type ImportValidation =
  | { ok: true; payload: ConversationImportInput }
  | { ok: false; issues: ValidationIssue[] }

/** Shape-validate an import payload. Pure; reuses the ingestion failure-mode
 *  vocabulary so agent developers see one language everywhere. */
export function validateConversationImport(raw: unknown): ImportValidation {
  if (typeof raw !== 'object' || raw === null) {
    return {
      ok: false,
      issues: [{ mode: FAILURE_MODES.MALFORMED_BATCH, path: '', message: 'Payload must be a JSON object.' }],
    }
  }
  const p = raw as Partial<ConversationImportInput>
  const issues: ValidationIssue[] = []

  if (!CONVERSATION_PLATFORMS.includes(p.platform as ConversationPlatform)) {
    issues.push({
      mode: FAILURE_MODES.MALFORMED_BATCH,
      path: 'platform',
      message: `platform must be one of ${CONVERSATION_PLATFORMS.join(', ')}.`,
    })
  }
  if (typeof p.title !== 'string' || !p.title.trim()) {
    issues.push({ mode: FAILURE_MODES.MALFORMED_BATCH, path: 'title', message: 'title is required.' })
  }
  if (p.sourceUrl !== undefined && typeof p.sourceUrl !== 'string') {
    issues.push({ mode: FAILURE_MODES.MALFORMED_BATCH, path: 'sourceUrl', message: 'sourceUrl must be a string.' })
  }
  if (p.beliefSlug !== undefined && typeof p.beliefSlug !== 'string') {
    issues.push({ mode: FAILURE_MODES.MALFORMED_BATCH, path: 'beliefSlug', message: 'beliefSlug must be a string.' })
  }
  if (!Array.isArray(p.messages) || p.messages.length === 0) {
    issues.push({
      mode: FAILURE_MODES.MALFORMED_BATCH,
      path: 'messages',
      message: 'messages must be a non-empty array of { author, body }.',
    })
  } else if (p.messages.length > MAX_MESSAGES_PER_IMPORT) {
    issues.push({
      mode: FAILURE_MODES.MALFORMED_BATCH,
      path: 'messages',
      message: `messages is capped at ${MAX_MESSAGES_PER_IMPORT} per import; split longer threads.`,
    })
  } else {
    p.messages.forEach((m, i) => {
      const mm = m as Partial<ConversationMessageInput>
      if (typeof mm !== 'object' || mm === null || typeof mm.author !== 'string' || !mm.author.trim()) {
        issues.push({
          mode: FAILURE_MODES.MALFORMED_BATCH,
          path: `messages[${i}].author`,
          message: 'Each message needs an author handle.',
        })
      }
      if (typeof mm?.body !== 'string' || !mm.body.trim()) {
        issues.push({
          mode: FAILURE_MODES.MALFORMED_BATCH,
          path: `messages[${i}].body`,
          message: 'Each message needs a body.',
        })
      }
      if (
        mm?.postedAt !== undefined &&
        (typeof mm.postedAt !== 'string' || Number.isNaN(Date.parse(mm.postedAt)))
      ) {
        issues.push({
          mode: FAILURE_MODES.MALFORMED_BATCH,
          path: `messages[${i}].postedAt`,
          message: 'postedAt must be a timestamp string Date.parse understands.',
        })
      }
    })
  }

  if (issues.length > 0) return { ok: false, issues }
  return { ok: true, payload: p as ConversationImportInput }
}

export type CandidateStatus = 'pending' | 'integrated' | 'duplicate' | 'dismissed'
