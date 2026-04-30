import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computePlayerStats, type PlayerCharacterInput } from '@/lib/battlefield'

/**
 * GET /api/battlefield/players
 *
 * Returns one record per User, projected as a Battlefield-of-Ideas
 * character (Prowess, Research, Persuasion, Wisdom, Level, class).
 *
 * Stats are derived from the only authored data the schema currently
 * tracks per user: LinkageVote rows and Trade rows.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const sp = url.searchParams

  const limitRaw = parseInt(sp.get('limit') ?? '', 10)
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 100

  const sortBy = (sp.get('sortBy') ?? 'overall') as
    | 'overall' | 'prowess' | 'research' | 'persuasion' | 'wisdom' | 'experience' | 'level'
  const sortDir = sp.get('sortDir') === 'asc' ? 'asc' : 'desc'

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      realizedPnl: true,
      roi: true,
      trades: { select: { id: true } },
    },
  })

  const players = await Promise.all(
    users.map(async u => ({
      user: u,
      votes: await prisma.linkageVote.findMany({
        where: { userId: u.id },
        select: {
          argumentId: true,
          score: true,
          direction: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    })),
  )

  const projected = players.map(({ user, votes }) => {
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

    return {
      user_id: user.id,
      username: user.username,
      stats: computePlayerStats(input),
      raw: input,
    }
  })

  projected.sort((a, b) => {
    const av = a.stats[sortBy]
    const bv = b.stats[sortBy]
    return sortDir === 'asc' ? av - bv : bv - av
  })

  return NextResponse.json({ players: projected.slice(0, limit), count: projected.length })
}
