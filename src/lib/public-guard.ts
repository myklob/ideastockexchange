// Guards for the public, keyless write routes. The site ships with no user
// accounts, so every human write is an anonymous write; these keep an
// anonymous write from becoming a firehose without turning the product into
// a read-only brochure. Three postures:
//   guardPublicWrite     — per-client per-minute limiter + PUBLIC_WRITES_DISABLED kill switch
//   requireOperatorSecret — operator-only routes (recompute, settlement, destructive edits)
//   guardMarketWrite     — play-money market writes, off in production until identity exists

import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

export { parseHttpUrl } from './http-url'

const RATE_WINDOW_MS = 60_000
const RATE_MAP_SWEEP_AT = 1000
export const PUBLIC_WRITE_LIMIT_PER_MINUTE = 20

const windows = new Map<string, { start: number; count: number }>()

function sweepExpired(now: number) {
  if (windows.size < RATE_MAP_SWEEP_AT) return
  for (const [key, entry] of windows) {
    if (now - entry.start >= RATE_WINDOW_MS) windows.delete(key)
  }
}

/**
 * Fixed-window limiter held in process memory. On serverless this is per
 * instance, so it bounds burst rate rather than daily volume; durable caps
 * (daily counts in the audit log, the kill switch) are the backstop.
 */
export function rateLimit(bucket: string, limit: number, now = Date.now()): boolean {
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

/** First hop of x-forwarded-for, else a shared anonymous bucket. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  return first && first.length > 0 ? first.slice(0, 64) : 'anon'
}

export function inProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function publicWritesDisabled(): boolean {
  return process.env.PUBLIC_WRITES_DISABLED === '1'
}

export function guardPublicWrite(
  request: Request,
  route: string,
  limit: number = PUBLIC_WRITE_LIMIT_PER_MINUTE,
): NextResponse | null {
  if (publicWritesDisabled()) {
    return NextResponse.json(
      { error: 'Public writes are paused on this deployment. Agents can still post through the authenticated /api/v1 routes.' },
      { status: 503 },
    )
  }
  if (!rateLimit(`${route}:${clientKey(request)}`, limit)) {
    return NextResponse.json(
      { error: `Too many requests: this route accepts ${limit} writes per minute per client. Try again shortly.` },
      { status: 429 },
    )
  }
  return null
}

function bearerMatches(header: string | null, secret: string): boolean {
  if (!header) return false
  const given = Buffer.from(header)
  const expected = Buffer.from(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/**
 * Operator-only routes share the cron bearer (CRON_SECRET). Open in local
 * development when no secret is set; fail closed in production.
 */
export function requireOperatorSecret(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    if (inProduction()) {
      return NextResponse.json(
        { error: 'CRON_SECRET is not configured; operator routes are disabled until it is set.' },
        { status: 503 },
      )
    }
    return null
  }
  if (!bearerMatches(request.headers.get('authorization'), secret)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  return null
}

/** Play-money market writes trust a client-supplied username, so they stay
 *  read-only in production until MARKET_WRITES_ENABLED=1 is set deliberately. */
export function marketWritesEnabled(): boolean {
  return process.env.MARKET_WRITES_ENABLED === '1' || !inProduction()
}

export function guardMarketWrite(request: Request, route: string): NextResponse | null {
  if (!marketWritesEnabled()) {
    return NextResponse.json(
      { error: 'Market writes are disabled on this deployment (read-only markets). Set MARKET_WRITES_ENABLED=1 to open trading.' },
      { status: 503 },
    )
  }
  return guardPublicWrite(request, route)
}

/** Paid LLM generation is opt-in in production. */
export function aiGenerationEnabled(): boolean {
  return process.env.AI_GENERATION_ENABLED === '1' || !inProduction()
}

export function aiProviderConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY || process.env.AI_API_BASE)
}
