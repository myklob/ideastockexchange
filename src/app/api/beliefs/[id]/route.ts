import { NextResponse } from 'next/server'
import { fetchBeliefById, computeBeliefScores } from '@/features/belief-analysis/data/fetch-belief'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const beliefId = parseInt(id, 10)

  if (isNaN(beliefId)) {
    return NextResponse.json({ error: 'Invalid belief ID' }, { status: 400 })
  }

  const belief = await fetchBeliefById(beliefId)

  if (!belief) {
    return NextResponse.json({ error: 'Belief not found' }, { status: 404 })
  }

  const scores = computeBeliefScores(belief)

  return NextResponse.json({
    belief,
    scores,
  })
}
