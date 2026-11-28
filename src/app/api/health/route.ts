import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health — deployment check for the public site: database
 * reachable, schema present, and the worked-example content loaded.
 * Reveals counts only, never configuration.
 */
export async function GET() {
  try {
    const [beliefs, argumentEdges, topics, threads, demoPage] = await Promise.all([
      prisma.belief.count(),
      prisma.argument.count(),
      prisma.topic.count(),
      prisma.conversationThread.count(),
      prisma.belief.findUnique({ where: { slug: 'accept-certified-election-results' }, select: { id: true } }),
    ])
    const seeded = beliefs > 0 && argumentEdges > 0
    return NextResponse.json(
      {
        ok: true,
        database: 'reachable',
        seeded,
        workedExampleLoaded: demoPage !== null,
        counts: { beliefs, argumentEdges, topics, conversationThreads: threads },
      },
      { status: seeded ? 200 : 503 },
    )
  } catch {
    return NextResponse.json(
      { ok: false, database: 'unreachable', hint: 'Set DATABASE_URL and run npm run db:bootstrap.' },
      { status: 503 },
    )
  }
}
