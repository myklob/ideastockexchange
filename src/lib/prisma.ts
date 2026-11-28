import { createRequire } from 'module'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const DEFAULT_SQLITE_URL = 'file:./prisma/dev.db'
const DATABASE_URL = process.env.DATABASE_URL || DEFAULT_SQLITE_URL

/** Production (Vercel + Neon/Supabase) runs on Postgres; local dev on SQLite. */
export const isPostgres = /^postgres(ql)?:\/\//.test(DATABASE_URL)

function poolMax(): number {
  const configured = parseInt(process.env.DATABASE_POOL_MAX ?? '', 10)
  if (Number.isFinite(configured) && configured > 0) return configured
  // DATABASE_URL is the pooled (PgBouncer) string in production, so this cap
  // only bounds concurrent queries per instance; keep it roomy enough that
  // a burst queues briefly instead of timing out.
  return process.env.VERCEL ? 5 : 10
}

function createPrismaClient() {
  if (isPostgres) {
    const adapter = new PrismaPg({
      connectionString: DATABASE_URL,
      max: poolMax(),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
    })
    return new PrismaClient({ adapter })
  }

  if (process.env.VERCEL) {
    throw new Error(
      'DATABASE_URL must be a postgres:// URL on Vercel. Set it for the Production and Preview environments (see docs/DEPLOYMENT.md).',
    )
  }

  // Loaded lazily so the native SQLite addon is never required on a
  // Postgres deployment.
  const require = createRequire(import.meta.url)
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3') as typeof import('@prisma/adapter-better-sqlite3')
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: DATABASE_URL }) })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Case-insensitive substring filter that works on both dialects: Postgres
 * needs `mode: 'insensitive'` (SQLite's LIKE is already case-insensitive and
 * its generated client has no `mode`).
 */
export function ciContains(q: string): { contains: string } {
  const filter = isPostgres ? { contains: q, mode: 'insensitive' } : { contains: q }
  return filter as { contains: string }
}
