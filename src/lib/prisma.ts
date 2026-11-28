import { PrismaClient } from '@/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const DEFAULT_SQLITE_URL = 'file:./prisma/dev.db'

function createPrismaClient() {
  const url = process.env.DATABASE_URL || DEFAULT_SQLITE_URL
  const isPostgres = /^postgres(ql)?:\/\//.test(url)

  // Production (Vercel/Neon/Supabase) uses Postgres; this path requires the
  // schema datasource provider to be `postgresql`. Local dev uses SQLite.
  const adapter = isPostgres
    ? new PrismaPg({ connectionString: url })
    : new PrismaBetterSqlite3({ url })

  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
