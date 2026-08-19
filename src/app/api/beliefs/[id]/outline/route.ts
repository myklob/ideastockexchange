import { NextResponse } from 'next/server'
import { parseIdParam } from '@/lib/api-params'
import { buildBeliefOutline } from '@/lib/conversations/outline'

/**
 * GET /api/beliefs/[id]/outline — the organized pro/con outline of a belief
 * page: equivalent arguments clustered (combine), clusters ranked score-desc
 * nulls-last (organize), unanswered leads surfaced as gaps (extend), and
 * pending conversation candidates queued in the incoming lane. This is what
 * a chat client renders so a conversation never starts from zero.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const beliefId = parseIdParam(id)
  if (beliefId === null) {
    return NextResponse.json({ error: 'Invalid belief ID' }, { status: 400 })
  }

  const outline = await buildBeliefOutline(beliefId)
  if (!outline) {
    return NextResponse.json({ error: 'Belief not found' }, { status: 404 })
  }
  return NextResponse.json({ outline })
}
