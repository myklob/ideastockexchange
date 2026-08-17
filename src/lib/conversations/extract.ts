// Claim mining for imported conversations. Chat is noisy and chronological;
// the belief graph wants standalone pro/con claims. This module is the pure
// half of the bridge: strip the chat noise, split into sentences, keep only
// sentences that could stand as claims (same standalone-claim rule the
// ingestion firewall enforces), read each message's stance, and carry shared
// URLs along as evidence provenance. Heuristics throughout — every output is
// a *candidate*, pending review, never a direct graph write.

import { validateStandaloneClaim } from '@/lib/agent-ingest/validate-claim'
import { textSimilarity, SAME_CLAIM_THRESHOLD } from '@/lib/agent-ingest/similarity'
import type { ConversationMessageInput } from './contract'

export interface ExtractedCandidate {
  /** Zero-based index of the source message in the transcript. */
  messageIndex: number
  /** The mined standalone claim, cleaned of chat noise. */
  statement: string
  /** Stance relative to the conversation's focal position. Heuristic. */
  direction: 'pro' | 'con'
  /** The claim in its surrounding message text, for reviewers. */
  contextQuote: string
  /** URLs shared in the same message, offered as evidence provenance. */
  evidenceUrls: string[]
  /** Argumentative signals that fired ("because", "studies show", ...). */
  markers: string[]
}

export interface ExtractionResult {
  candidates: ExtractedCandidate[]
  /** Sentences considered and dropped, with the reason — extraction shows its
   *  work the same way ingestion does. */
  skipped: { messageIndex: number; text: string; reason: SkipReason }[]
}

export type SkipReason =
  | 'question'
  | 'fragment-or-label'
  | 'social-noise'
  | 'quoted-text'
  | 'restates-focal-belief'
  | 'duplicate-in-thread'

const URL_PATTERN = /https?:\/\/[^\s<>()"']+/g

/** Pure chat filler: a sentence that is only these carries no claim. */
const SOCIAL_NOISE = new Set([
  'lol', 'lmao', 'rofl', 'haha', 'hahaha', 'omg', 'wow', 'nice', 'cool',
  'thanks', 'thx', 'ty', 'welcome', 'ok', 'okay', 'k', 'yeah', 'yes', 'no',
  'nah', 'yep', 'nope', 'same', 'this', '+1', '-1', 'agreed', 'disagree',
  'true', 'false', 'facts', 'based', 'bump', 'hi', 'hello', 'hey', 'bye',
])

/** Openers that signal the message pushes AGAINST the position it replies to. */
const DISAGREEMENT_OPENERS = [
  /^(no|nah|nope|wrong|false|incorrect)\b/i,
  /^(i\s+)?(strongly\s+)?disagree\b/i,
  /^that('|’)?s\s+(just\s+)?(not\s+true|wrong|false|nonsense|a\s+myth)\b/i,
  /^(but|however|actually|except)\b/i,
  /^not\s+(really|quite|true)\b/i,
  /^counterpoint\b/i,
]

/** Openers that signal the message pushes WITH the position it replies to. */
const AGREEMENT_OPENERS = [
  /^(yes|yeah|yep|exactly|right|agreed|true)\b/i,
  /^(i\s+)?(completely\s+|totally\s+|strongly\s+)?agree\b/i,
  /^this\s+is\s+(right|correct|true)\b/i,
  /^(\+1|well\s+said|good\s+point)\b/i,
]

/** First-person hedges stripped so the claim underneath can stand alone. */
const HEDGE_PREFIX =
  /^(i\s+(think|believe|feel|reckon|guess|mean|would\s+say)|imo|imho|in\s+my\s+(honest\s+)?opinion|personally|honestly|tbh|to\s+be\s+honest|fwiw|afaik|iirc)[,:]?\s+(that\s+)?/i

/** Signals that a sentence argues rather than just chats. Recorded on the
 *  candidate so reviewers and the integrate flow can rank by signal. */
const ARGUMENT_MARKERS: { marker: string; pattern: RegExp }[] = [
  { marker: 'because', pattern: /\bbecause\b/i },
  { marker: 'since', pattern: /\bsince\b/i },
  { marker: 'therefore', pattern: /\b(therefore|thus|hence|so\s+that)\b/i },
  { marker: 'evidence', pattern: /\b(evidence|data|research|study|studies|meta-analysis|survey|statistics)\b/i },
  { marker: 'shows', pattern: /\b(shows?|proves?|demonstrates?|confirms?|indicates?|found\s+that)\b/i },
  { marker: 'causal', pattern: /\b(causes?|leads?\s+to|results?\s+in|reduces?|increases?|improves?|prevents?|harms?|kills?|saves?)\b/i },
  { marker: 'comparison', pattern: /\b(more|less|fewer|better|worse|safer|cheaper|higher|lower)\s+than\b/i },
  { marker: 'example', pattern: /\b(for\s+(example|instance)|e\.g\.|case\s+in\s+point|look\s+at)\b/i },
]

function stripNoise(body: string): { text: string; urls: string[] } {
  const urls = body.match(URL_PATTERN) ?? []
  const text = body
    // Quoted reply lines ("> someone else's words") are someone else's words.
    .split('\n')
    .filter(line => !line.trimStart().startsWith('>'))
    .join('\n')
    .replace(URL_PATTERN, ' ')
    .replace(/@[a-zA-Z0-9_-]+/g, ' ')
    .replace(/:[a-z0-9_+-]+:/gi, ' ') // :emoji_codes:
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return { text, urls: [...new Set(urls)] }
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean)
}

function isSocialNoise(sentence: string): boolean {
  const tokens = sentence
    .toLowerCase()
    .replace(/[^a-z0-9+\-\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
  return tokens.length === 0 || tokens.every(t => SOCIAL_NOISE.has(t))
}

function matchedMarkers(sentence: string): string[] {
  return ARGUMENT_MARKERS.filter(m => m.pattern.test(sentence)).map(m => m.marker)
}

/** A message's stance relative to the focal position: disagreement openers
 *  flip it to con, agreement openers keep it pro. Sentence-level negation of
 *  the focal statement flips too (handled per sentence). */
function messageStance(body: string): 'pro' | 'con' {
  const head = body.trimStart()
  if (DISAGREEMENT_OPENERS.some(p => p.test(head))) return 'con'
  if (AGREEMENT_OPENERS.some(p => p.test(head))) return 'pro'
  return 'pro'
}

const NEGATORS = /\b(not|never|no|isn'?t|aren'?t|doesn'?t|don'?t|won'?t|can'?t|cannot|wouldn'?t|shouldn'?t|fails?\s+to|myth|false)\b/i

/** When a sentence largely restates the focal claim but negates it, the
 *  sentence opposes the focal claim regardless of the message opener. */
function sentenceStance(sentence: string, focalStatement: string | null, base: 'pro' | 'con'): 'pro' | 'con' {
  if (!focalStatement) return base
  const overlap = textSimilarity(sentence, focalStatement)
  if (overlap >= 0.4 && NEGATORS.test(sentence) && !NEGATORS.test(focalStatement)) return 'con'
  return base
}

function normalizeStatement(sentence: string): string {
  let s = sentence.trim()
  for (let i = 0; i < 3; i++) {
    const next = s.replace(HEDGE_PREFIX, '')
    if (next === s) break
    s = next
  }
  s = s.replace(/[.!]+$/, '').trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Mine candidate pro/con claims from a conversation transcript.
 *
 * `focalStatement` is the statement of the belief the conversation is about
 * (null when unknown at extraction time): restatements of it are skipped —
 * the topic itself is not an argument for itself — and near-duplicates within
 * the thread are folded so one voice saying it thrice yields one candidate.
 */
export function extractCandidates(
  messages: ConversationMessageInput[],
  focalStatement: string | null,
): ExtractionResult {
  const candidates: ExtractedCandidate[] = []
  const skipped: ExtractionResult['skipped'] = []

  messages.forEach((message, messageIndex) => {
    const { text, urls } = stripNoise(message.body)
    if (!text) {
      if (message.body.trim()) {
        skipped.push({ messageIndex, text: message.body.trim(), reason: 'quoted-text' })
      }
      return
    }
    const base = messageStance(text)

    for (const sentence of splitSentences(text)) {
      if (sentence.endsWith('?')) {
        skipped.push({ messageIndex, text: sentence, reason: 'question' })
        continue
      }
      if (isSocialNoise(sentence)) {
        skipped.push({ messageIndex, text: sentence, reason: 'social-noise' })
        continue
      }

      const statement = normalizeStatement(sentence)
      if (validateStandaloneClaim(statement).length > 0) {
        skipped.push({ messageIndex, text: sentence, reason: 'fragment-or-label' })
        continue
      }
      if (focalStatement && textSimilarity(statement, focalStatement) >= SAME_CLAIM_THRESHOLD) {
        skipped.push({ messageIndex, text: sentence, reason: 'restates-focal-belief' })
        continue
      }
      // Fold near-duplicates within the thread: the first voicing keeps the
      // candidacy; later restatements are the exact repetition problem this
      // pipeline exists to end. Same side only — similarity is stance-blind
      // (negators are stopwords), so a denial of an earlier claim scores as
      // its duplicate but is a distinct con candidate, not a repetition.
      const direction = sentenceStance(statement, focalStatement, base)
      if (
        candidates.some(
          c => c.direction === direction && textSimilarity(statement, c.statement) >= SAME_CLAIM_THRESHOLD,
        )
      ) {
        skipped.push({ messageIndex, text: sentence, reason: 'duplicate-in-thread' })
        continue
      }

      candidates.push({
        messageIndex,
        statement,
        direction,
        contextQuote: text.length <= 280 ? text : sentence,
        evidenceUrls: urls,
        markers: matchedMarkers(sentence),
      })
    }
  })

  return { candidates, skipped }
}
