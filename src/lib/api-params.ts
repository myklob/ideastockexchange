import { NextResponse } from 'next/server'

/**
 * Request-shaped problems belong in the 4xx range. Without these guards a
 * non-numeric query param or a malformed body reaches Prisma, which throws a
 * validation error and the route answers 500 — a client mistake reported as a
 * server fault.
 */

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

/** A database row id: a positive integer small enough for Prisma to accept. */
export function parseIdParam(raw: string | null | undefined): number | null {
  if (raw == null || raw.trim() === '') return null
  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0 || value > Number.MAX_SAFE_INTEGER) {
    return null
  }
  return value
}

export function parseBoundedInt(
  raw: string | null | undefined,
  { fallback, min, max }: { fallback: number; min: number; max: number }
): number | null {
  if (raw == null || raw.trim() === '') return fallback
  const value = Number(raw)
  if (!Number.isInteger(value) || value < min || value > max) return null
  return value
}

export function parseBoundedFloat(
  raw: string | null | undefined,
  { fallback, min, max }: { fallback: number; min: number; max: number }
): number | null {
  if (raw == null || raw.trim() === '') return fallback
  const value = Number(raw)
  if (!Number.isFinite(value) || value < min || value > max) return null
  return value
}

/** Restricts a sort key to columns the caller is allowed to order by. */
export function parseEnumParam<T extends string>(
  raw: string | null | undefined,
  allowed: readonly T[],
  fallback: T
): T | null {
  if (raw == null || raw.trim() === '') return fallback
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : null
}

export async function readJsonBody(
  request: Request
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false }> {
  try {
    const body = await request.json()
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      return { ok: false }
    }
    return { ok: true, body: body as Record<string, unknown> }
  } catch {
    return { ok: false }
  }
}

/**
 * Prisma rejects unknown or wrongly-typed fields with a validation error. Where
 * a handler passes caller-supplied fields through, that is a bad request rather
 * than a server fault. Only use this on paths whose query shape is fixed and
 * whose data comes from the caller.
 */
export function isPrismaValidationError(error: unknown): boolean {
  return error instanceof Error && error.name === 'PrismaClientValidationError'
}

/** Prisma signals "no row matched" with P2025; the message text is not stable. */
export function isRecordNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2025'
  )
}
