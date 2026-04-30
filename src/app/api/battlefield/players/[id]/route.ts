import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computePlayerStats, type PlayerCharacterInput } from '@/lib/battlefield'

/**
 * GET /api/battlefield/players/[id]
 *
 * `id` may be a User.id (cuid) or a username — tries id first, then username.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const user = await prisma.user.findFirst({
    where: { OR: [{ id }, { username: id }] },
    select: {
      id: true,
      username: true,
      realizedPnl: true,
      roi: true,
      trades: { select: { id: true } },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  const votes = await prisma.linkageVote.findMany({
    where: { userId: user.id },
    select: {
      argumentId: true,
      score: true,
      direction: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const totalVotes = votes.length
  const avg = totalVotes > 0 ? votes.reduce((s, v) => s + v.score, 0) / totalVotes : 0
  const distinctArgs = new Set(votes.map(v => v.argumentId)).size
  const agree = votes.filter(v =>
    v.direction === 'positive' || (v.direction == null && v.score >= 0.5),
  ).length
  const disagree = votes.filter(v =>
    v.direction === 'negative' || (v.direction == null && v.score < 0.5),
  ).length
  const changed = votes.filter(v => v.updatedAt.getTime() - v.createdAt.getTime() > 1000).length

  const input: PlayerCharacterInput = {
    linkageVoteCount: totalVotes,
    avgLinkageScore: avg,
    distinctArgumentsVoted: distinctArgs,
    agreeVotes: agree,
    disagreeVotes: disagree,
    changedVoteCount: changed,
    tradeCount: user.trades.length,
    realizedPnl: user.realizedPnl,
    roi: user.roi,
  }

  return NextResponse.json({
    user_id: user.id,
    username: user.username,
    stats: computePlayerStats(input),
    raw: input,
  })
}
