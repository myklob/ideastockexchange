// Bearer-key auth for /api/v1. Agent identity is provenance metadata: the
// resolved agent id is attached to records as who-did-this, and never enters
// any scoring path.

import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import type { Agent } from '@/generated/prisma/client'

export const AGENT_KEY_PREFIX = 'ise_agent_'

const RATE_WINDOW_MS = 60_000
const DEFAULT_RATE_LIMIT = 60

export function generateAgentKey(): string {
  return AGENT_KEY_PREFIX + randomBytes(24).toString('hex')
}

/** Store a hash, never the key. */
export function hashAgentKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export type AgentAuthResult =
  | { ok: true; agent: Agent; keyId: string }
  | { ok: false; status: number; error: string }

function rateLimit(): number {
  const raw = process.env.AGENT_RATE_LIMIT_PER_MINUTE
  const n = raw ? parseInt(raw, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_RATE_LIMIT
}

/**
 * Resolve an Authorization header to an Agent: hashed-key lookup, revocation
 * check, lastUsed update, and a fixed-window rate limit kept in the database
 * (no Redis until someone actually hits the limit).
 */
export async function authenticateAgentKey(authorization: string | null): Promise<AgentAuthResult> {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      error: 'Missing agent key. Send "Authorization: Bearer <key>". Keys are minted with scripts/create-agent.ts.',
    }
  }
  const key = authorization.slice('Bearer '.length).trim()
  const apiKey = await prisma.agentApiKey.findUnique({
    where: { hashedKey: hashAgentKey(key) },
    include: { agent: true },
  })
  if (!apiKey) {
    return { ok: false, status: 401, error: 'Unknown agent key.' }
  }
  if (apiKey.revoked) {
    return { ok: false, status: 401, error: 'This agent key has been revoked.' }
  }

  const now = new Date()
  const limit = rateLimit()
  const windowExpired =
    !apiKey.windowStart || now.getTime() - apiKey.windowStart.getTime() >= RATE_WINDOW_MS

  if (windowExpired) {
    await prisma.agentApiKey.update({
      where: { id: apiKey.id },
      data: { windowStart: now, windowCount: 1, lastUsed: now },
    })
  } else if (apiKey.windowCount >= limit) {
    return {
      ok: false,
      status: 429,
      error: `Rate limit exceeded: ${limit} requests per minute per key. Retry after the window resets.`,
    }
  } else {
    await prisma.agentApiKey.update({
      where: { id: apiKey.id },
      data: { windowCount: { increment: 1 }, lastUsed: now },
    })
  }

  return { ok: true, agent: apiKey.agent, keyId: apiKey.id }
}
