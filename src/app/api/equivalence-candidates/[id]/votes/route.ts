/**
 * Community grouping votes on an EquivalenceCandidate pair — the "this is
 * the same as [existing claim]" flow. The redundancy scan proposes pairs;
 * the community decides. 60% weighted agreement groups the pair
 * (status "grouped"), 60% disagreement keeps it separate. Grouping is a
 * community verdict recorded for the engine and reviewers: the uniqueness
 * discount already prices the overlap, and a grouped verdict is the signal
 * to merge the pages (see /algorithms/combine-similar-beliefs).
 *
 * POST body: { userId: string, agree: boolean, reasoning?: string }
 *   agree = "same claim, group them"; disagree = "genuinely different".
 * GET returns the pair, tally, and current status.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveConsensus, CONSENSUS_THRESHOLD, CONSENSUS_QUORUM } from '@/lib/consensus'
import { similarityBand } from '@/lib/agent-ingest/similarity'

const OUTCOME_TO_STATUS = {
  upheld: 'grouped',
  rejected: 'kept-separate',
  open: 'open',
} as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const candidateId = Number(id)
  if (!Number.isInteger(candidateId)) {
    return NextResponse.json({ error: 'Invalid candidate id.' }, { status: 400 })
  }

  const candidate = await prisma.equivalenceCandidate.findUnique({
    where: { id: candidateId },
    include: {
      argument: { select: { id: true, claim: true, belief: { select: { slug: true, statement: true } } } },
      existingArgument: { select: { id: true, claim: true, belief: { select: { slug: true, statement: true } } } },
      votes: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!candidate) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  const consensus = resolveConsensus(candidate.votes.map(v => ({ agree: v.agree, weight: v.weight })))
  return NextResponse.json({
    candidateId: candidate.id,
    similarity: candidate.similarity,
    band: similarityBand(candidate.similarity),
    status: candidate.status,
    newArgument: {
      id: candidate.argument.id,
      claim: candidate.argument.claim ?? candidate.argument.belief.statement,
      beliefSlug: candidate.argument.belief.slug,
    },
    existingArgument: {
      id: candidate.existingArgument.id,
      claim: candidate.existingArgument.claim ?? candidate.existingArgument.belief.statement,
      beliefSlug: candidate.existingArgument.belief.slug,
    },
    consensus: {
      agreeShare: consensus.agreeShare,
      voteCount: consensus.voteCount,
      threshold: CONSENSUS_THRESHOLD,
      quorum: CONSENSUS_QUORUM,
    },
    votes: candidate.votes.map(v => ({
      userId: v.userId,
      agree: v.agree,
      reasoning: v.reasoning,
      weight: v.weight,
    })),
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const candidateId = Number(id)
  if (!Number.isInteger(candidateId)) {
    return NextResponse.json({ error: 'Invalid candidate id.' }, { status: 400 })
  }

  let body: { userId?: string; agree?: boolean; reasoning?: string; weight?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON.' }, { status: 400 })
  }

  if (body.weight !== undefined) {
    return NextResponse.json({ error: 'weight is never accepted from the voter.' }, { status: 422 })
  }
  const userId = body.userId?.trim()
  if (!userId) return NextResponse.json({ error: 'userId is required.' }, { status: 422 })
  if (typeof body.agree !== 'boolean') {
    return NextResponse.json({ error: 'agree must be true or false.' }, { status: 422 })
  }

  const candidate = await prisma.equivalenceCandidate.findUnique({
    where: { id: candidateId },
    select: { id: true, status: true },
  })
  if (!candidate) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  const result = await prisma.$transaction(async tx => {
    await tx.groupingVote.upsert({
      where: { candidateId_userId: { candidateId, userId } },
      create: {
        candidateId,
        userId,
        agree: body.agree as boolean,
        reasoning: body.reasoning?.trim() || null,
      },
      update: { agree: body.agree as boolean, reasoning: body.reasoning?.trim() || null },
    })
    await tx.auditLog.create({
      data: {
        action: 'grouping_vote',
        targetType: 'EquivalenceCandidate',
        targetId: String(candidateId),
        rationale:
          body.reasoning?.trim() ||
          `${userId} voted the pair ${body.agree ? 'equivalent (group)' : 'distinct (keep separate)'}.`,
        payload: JSON.stringify({ userId, agree: body.agree }),
      },
    })

    const votes = await tx.groupingVote.findMany({
      where: { candidateId },
      select: { agree: true, weight: true },
    })
    const consensus = resolveConsensus(votes)
    const newStatus = OUTCOME_TO_STATUS[consensus.outcome]

    if (newStatus !== candidate.status) {
      await tx.equivalenceCandidate.update({
        where: { id: candidateId },
        data: {
          status: newStatus,
          consensus: consensus.agreeShare,
          resolvedAt: newStatus === 'open' ? null : new Date(),
        },
      })
      await tx.auditLog.create({
        data: {
          action: 'resolve_equivalence_candidate',
          targetType: 'EquivalenceCandidate',
          targetId: String(candidateId),
          rationale:
            `Weighted community agreement ${((consensus.agreeShare ?? 0) * 100).toFixed(0)}% ` +
            `across ${consensus.voteCount} votes moved the pair to "${newStatus}".`,
        },
      })
    } else {
      await tx.equivalenceCandidate.update({
        where: { id: candidateId },
        data: { consensus: consensus.agreeShare },
      })
    }

    return { consensus, newStatus }
  })

  return NextResponse.json({
    candidateId,
    status: result.newStatus,
    agreeShare: result.consensus.agreeShare,
    voteCount: result.consensus.voteCount,
    note:
      result.newStatus === 'grouped'
        ? 'Grouped: the community agreed these are the same claim. One page per claim — the merge flow consolidates their analyses.'
        : result.newStatus === 'kept-separate'
          ? 'Kept separate: the community found a real difference between the claims.'
          : `Open: needs ${CONSENSUS_QUORUM}+ votes and ${CONSENSUS_THRESHOLD * 100}% weighted agreement either way.`,
  })
}
