// The public /demo playground writes through the same conversation pipeline
// agents use, under a keyless system Agent resolved by name — the same
// posture as the fallacy detector. No API key is ever minted for it, so it
// can only act through the capped, rate-limited demo routes, and every write
// it makes is inspectable at /audit?agent=system:demo-playground.

import { createHash, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import type { Agent } from '@/generated/prisma/client'
import { DEMO_DAILY_IMPORT_CAP } from './demo-caps'

export * from './demo-caps'

export const DEMO_AGENT_NAME = 'system:demo-playground'

const RATE_WINDOW_MS = 60_000
const RATE_MAP_SWEEP_AT = 1000

export async function ensureDemoAgent(): Promise<Agent> {
  // Upsert on the unique name so concurrent first requests cannot race a
  // find-then-create into a unique-constraint failure.
  return prisma.agent.upsert({
    where: { name: DEMO_AGENT_NAME },
    update: {},
    create: {
      name: DEMO_AGENT_NAME,
      operator: 'Idea Stock Exchange',
      description:
        'Public /demo playground. Imports and integrates only what a visitor pastes; capped and ' +
        'rate-limited; never writes a score.',
      isSystem: true,
    },
  })
}

export function demoWritesDisabled(): boolean {
  return process.env.DEMO_WRITES_DISABLED === '1'
}

/** First hop of x-forwarded-for, else a shared anonymous bucket. Spoofable
 *  by design of the header; the durable backstop is the daily audit-log cap. */
export function demoClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  return first && first.length > 0 ? first.slice(0, 64) : 'anon'
}

const windows = new Map<string, { start: number; count: number }>()

function sweepExpired(now: number) {
  if (windows.size < RATE_MAP_SWEEP_AT) return
  for (const [key, entry] of windows) {
    if (now - entry.start >= RATE_WINDOW_MS) windows.delete(key)
  }
}

/**
 * Fixed-window limiter, same shape as the agent-key limiter but held in
 * process memory: a demo does not need durable rate state, and the daily
 * audit-log cap below is the durable backstop.
 */
export function checkDemoRateLimit(bucket: string, limit: number, now = Date.now()): boolean {
  sweepExpired(now)
  const entry = windows.get(bucket)
  if (!entry || now - entry.start >= RATE_WINDOW_MS) {
    windows.set(bucket, { start: now, count: 1 })
    return true
  }
  if (entry.count >= limit) return false
  entry.count += 1
  return true
}

export async function demoDailyCapReached(agentId: string, now = new Date()): Promise<boolean> {
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const count = await prisma.auditLog.count({
    where: { agentId, action: 'import_conversation', createdAt: { gte: startOfDay } },
  })
  return count >= DEMO_DAILY_IMPORT_CAP
}

/**
 * Review capability token: the visitor who imported a demo thread gets the
 * token back and must present it to review that thread, so one visitor
 * cannot review another visitor's import. Stateless (HMAC-style hash over a
 * server secret and the thread id), so it works across serverless instances.
 */
export function demoReviewToken(threadId: string, agentId: string): string {
  const secret = process.env.DEMO_REVIEW_SECRET || agentId
  return createHash('sha256').update(`${secret}:${threadId}`).digest('hex')
}

export function verifyDemoReviewToken(threadId: string, agentId: string, presented: unknown): boolean {
  if (typeof presented !== 'string') return false
  const expected = Buffer.from(demoReviewToken(threadId, agentId))
  const given = Buffer.from(presented)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
