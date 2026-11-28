import { agentJson } from '@/lib/agent-api'
import { lookupStatement } from '@/lib/conversations/lookup'
import { CONVERSATION_FIREWALL_LINE } from '@/lib/conversations/contract'
import { clientKey, rateLimit } from '@/lib/public-guard'

const MAX_STATEMENT_LENGTH = 500
const LOOKUPS_PER_MINUTE = 30

/**
 * GET /api/v1/conversations/lookup?statement=... — the plug-in moment.
 *
 * Someone states a belief in a chatroom; this resolves the statement to its
 * permanent page and returns the organized pro/con outline, the open gaps,
 * and the conversations already plugged in — so the new conversation starts
 * where the last one left off instead of from zero. Read-only, no auth: a
 * lookup writes nothing and moves no score.
 */
export async function GET(request: Request) {
  const key = clientKey(request)
  if (key && !rateLimit(`lookup:${key}`, LOOKUPS_PER_MINUTE)) {
    return agentJson({ error: `Lookups are limited to ${LOOKUPS_PER_MINUTE} per minute per client.` }, { status: 429 })
  }
  const sp = new URL(request.url).searchParams
  const statement = (sp.get('statement') ?? sp.get('q') ?? '').trim()
  if (!statement) {
    return agentJson(
      {
        error: 'Pass the statement to look up: ?statement=<what was said in the conversation>.',
        example: '/api/v1/conversations/lookup?statement=We should accept certified election results',
      },
      { status: 400 },
    )
  }
  if (statement.length > MAX_STATEMENT_LENGTH) {
    return agentJson(
      { error: `statement is capped at ${MAX_STATEMENT_LENGTH} characters; look up one claim at a time.` },
      { status: 400 },
    )
  }

  const lookup = await lookupStatement(statement)
  return agentJson({ firewall: CONVERSATION_FIREWALL_LINE, ...lookup })
}
