// The public /demo playground writes through the same conversation pipeline
// agents use, under a keyless system Agent resolved by name — the same
// posture as the fallacy detector. No API key is ever minted for it, so it
// can only act through the capped, rate-limited demo routes, and every write
// it makes is inspectable at /audit?agent=system:demo-playground.

import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import type { Agent } from '@/generated/prisma/client'
import { DEMO_DAILY_IMPORT_CAP } from './demo-caps'
import { clientKey, inProduction, rateLimit } from '@/lib/public-guard'

export * from './demo-caps'

export const DEMO_AGENT_NAME = 'system:demo-playground'

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

export function demoClientKey(request: Request): string {
  return clientKey(request) ?? 'anon'
}

export function checkDemoRateLimit(bucket: string, limit: number, now = Date.now()): boolean {
  return rateLimit(bucket, limit, now)
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
 * cannot review another visitor's import. Stateless (hash over a server
 * secret and the thread id), so it works across serverless instances.
 * Production requires DEMO_REVIEW_SECRET; development uses a per-process
 * random secret so the flow works out of the box without one.
 */
const devReviewSecret = randomBytes(32).toString('hex')

export function demoReviewSecretMissing(): boolean {
  return inProduction() && !process.env.DEMO_REVIEW_SECRET
}

function reviewSecret(): string {
  return process.env.DEMO_REVIEW_SECRET || devReviewSecret
}

export function demoReviewToken(threadId: string, agentId: string): string {
  return createHash('sha256').update(`${reviewSecret()}:${agentId}:${threadId}`).digest('hex')
}

export function verifyDemoReviewToken(threadId: string, agentId: string, presented: unknown): boolean {
  if (typeof presented !== 'string') return false
  const expected = Buffer.from(demoReviewToken(threadId, agentId))
  const given = Buffer.from(presented)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
