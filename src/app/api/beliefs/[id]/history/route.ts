/**
 * Score history for one belief: the accumulation ledger, latest first.
 * Read-only. Events are written exclusively by score propagation — the
 * audit lock means there is no write path to offer here.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const beliefId = Number(id)
  if (!Number.isInteger(beliefId)) {
    return NextResponse.json({ error: 'Invalid belief id.' }, { status: 400 })
  }

  const belief = await prisma.belief.findUnique({
    where: { id: beliefId },
    select: { id: true, slug: true, statement: true, positivity: true, stabilityScore: true },
  })
  if (!belief) return NextResponse.json({ error: 'Belief not found.' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 200)

  const events = await prisma.beliefScoreEvent.findMany({
    where: { beliefId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({
    belief,
    events,
    note:
      'Every event is an engine-computed movement with the move that caused it. ' +
      'Nothing here is hand-entered; the debate accumulates instead of restarting.',
  })
}
