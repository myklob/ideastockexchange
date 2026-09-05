import { prisma } from '@/lib/prisma'
import { agentJson } from '@/lib/agent-api'
import { runConversationImport } from '@/lib/conversations/import'
import { parseTranscript } from '@/lib/conversations/parse-transcript'
import {
  CONVERSATION_FIREWALL_LINE,
  CONVERSATION_PLATFORMS,
  type ConversationPlatform,
} from '@/lib/conversations/contract'
import {
  DEMO_AGENT_NAME,
  DEMO_IMPORTS_PER_MINUTE,
  DEMO_MAX_ACTIONS_PER_REQUEST,
  DEMO_MAX_MESSAGES,
  DEMO_MAX_TRANSCRIPT_CHARS,
  checkDemoRateLimit,
  demoClientKey,
  demoDailyCapReached,
  demoReviewToken,
  demoWritesDisabled,
  ensureDemoAgent,
} from '@/lib/conversations/demo-agent'
import { FAILURE_MODES } from '@/lib/agent-ingest/contract'

const MAX_TITLE_CHARS = 200

/**
 * POST /api/v1/conversations/demo — the keyless playground import.
 *
 * Same pipeline as POST /api/v1/conversations (transcript stored verbatim,
 * candidates mined and matched, nothing written to the graph), with the
 * agent key swapped for the demo system agent plus caps: a known belief
 * page only (no minting stub pages), a transcript string only (parsed here,
 * so every cap applies to it), per-client and global daily limits. The
 * response carries a review token that gates the follow-up review move.
 */
export async function POST(request: Request) {
  if (demoWritesDisabled()) {
    return agentJson({ error: 'The demo playground is paused. Agents can still import via POST /api/v1/conversations.' }, { status: 503 })
  }
  if (!checkDemoRateLimit(`import:${demoClientKey(request)}`, DEMO_IMPORTS_PER_MINUTE)) {
    return agentJson({ error: `Demo imports are limited to ${DEMO_IMPORTS_PER_MINUTE} per minute. Try again shortly.` }, { status: 429 })
  }

  let body: { platform?: unknown; title?: unknown; beliefSlug?: unknown; transcript?: unknown }
  try {
    body = await request.json()
  } catch {
    return agentJson(
      { error: 'Body must be valid JSON.', issues: [{ mode: FAILURE_MODES.MALFORMED_BATCH, path: '', message: 'Body must be valid JSON.' }] },
      { status: 400 },
    )
  }

  const platform = CONVERSATION_PLATFORMS.includes(body.platform as ConversationPlatform)
    ? (body.platform as ConversationPlatform)
    : 'chat'
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, MAX_TITLE_CHARS) : ''
  const beliefSlug = typeof body.beliefSlug === 'string' ? body.beliefSlug.trim() : ''
  if (!title) return agentJson({ error: 'A thread title is required.' }, { status: 422 })
  if (!beliefSlug) return agentJson({ error: 'Pick the belief page this conversation plugs into (beliefSlug).' }, { status: 422 })
  if (typeof body.transcript !== 'string') {
    return agentJson({ error: 'Provide a transcript string ("Author: message" per line).' }, { status: 422 })
  }
  if (body.transcript.length > DEMO_MAX_TRANSCRIPT_CHARS) {
    return agentJson({ error: `Transcripts are capped at ${DEMO_MAX_TRANSCRIPT_CHARS} characters in the demo.` }, { status: 422 })
  }

  // The agent route creates a stub page for an unknown slug; a public demo
  // must not mint pages, so the page has to exist already, by exact slug.
  const belief = await prisma.belief.findUnique({ where: { slug: beliefSlug }, select: { id: true, slug: true, statement: true } })
  if (!belief) {
    return agentJson({ error: `No belief page with slug "${beliefSlug}". The demo only plugs into existing pages.` }, { status: 422 })
  }

  const messages = parseTranscript(body.transcript)
  if (messages.length === 0) {
    return agentJson({ error: 'No messages parsed. Use one "Author: message" per line.' }, { status: 422 })
  }
  if (messages.length > DEMO_MAX_MESSAGES) {
    return agentJson({ error: `The demo imports at most ${DEMO_MAX_MESSAGES} messages per thread.` }, { status: 422 })
  }

  const agent = await ensureDemoAgent()
  if (await demoDailyCapReached(agent.id)) {
    return agentJson({ error: 'The demo has reached its daily import cap. Try again tomorrow, or use an agent key.' }, { status: 429 })
  }

  const result = await runConversationImport(agent.id, { platform, title, beliefSlug: belief.slug, messages })
  if (!result.ok) {
    return agentJson({ error: 'Import rejected. Fix the named issues and resubmit.', issues: result.issues }, { status: result.status })
  }

  return agentJson(
    {
      firewall: CONVERSATION_FIREWALL_LINE,
      agent: DEMO_AGENT_NAME,
      threadId: result.threadId,
      reviewToken: demoReviewToken(result.threadId, agent.id),
      belief: result.belief,
      beliefUrl: result.belief ? `/beliefs/${result.belief.slug}` : null,
      candidates: result.candidates,
      skipped: result.skipped,
    },
    { status: 201 },
  )
}

/** GET — the demo's caps, for tooling and the UI. */
export async function GET() {
  return agentJson({
    agent: DEMO_AGENT_NAME,
    caps: {
      maxMessages: DEMO_MAX_MESSAGES,
      maxTranscriptChars: DEMO_MAX_TRANSCRIPT_CHARS,
      maxActionsPerReviewRequest: DEMO_MAX_ACTIONS_PER_REQUEST,
      importsPerMinute: DEMO_IMPORTS_PER_MINUTE,
    },
    firewall: CONVERSATION_FIREWALL_LINE,
  })
}
