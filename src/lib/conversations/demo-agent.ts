// The public /demo playground writes through the same conversation pipeline
// agents use, under a keyless system Agent resolved by name — the same
// posture as the fallacy detector. No API key is ever minted for it, so it
// can only act through the capped, rate-limited demo routes, and every write
// it makes is inspectable at /audit?agent=system:demo-playground.

import { prisma } from '@/lib/prisma'
import type { Agent } from '@/generated/prisma/client'

export const DEMO_AGENT_NAME = 'system:demo-playground'

/** Caps that keep a public playground from becoming a write firehose. */
export const DEMO_MAX_MESSAGES = 30
export const DEMO_MAX_TRANSCRIPT_CHARS = 6000
export const DEMO_MAX_ACTIONS_PER_REQUEST = 10
export const DEMO_DAILY_IMPORT_CAP = 200
export const DEMO_IMPORTS_PER_MINUTE = 6
export const DEMO_REVIEWS_PER_MINUTE = 20

const RATE_WINDOW_MS = 60_000

export async function ensureDemoAgent(): Promise<Agent> {
  const existing = await prisma.agent.findUnique({ where: { name: DEMO_AGENT_NAME } })
  if (existing) return existing
  return prisma.agent.create({
    data: {
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

/** First hop of x-forwarded-for, else a shared anonymous bucket. */
export function demoClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  return first && first.length > 0 ? first : 'anon'
}

const windows = new Map<string, { start: number; count: number }>()

/**
 * Fixed-window limiter, same shape as the agent-key limiter but held in
 * process memory: a demo does not need durable rate state, and the daily
 * audit-log cap below is the durable backstop.
 */
export function checkDemoRateLimit(bucket: string, limit: number, now = Date.now()): boolean {
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
