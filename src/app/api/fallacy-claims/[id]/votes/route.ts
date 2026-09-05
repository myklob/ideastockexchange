/**
 * Community resolution of a structured fallacy claim.
 *
 * POST /api/fallacy-claims/[id]/votes
 *   Body: { userId: string, agree: boolean, reasoning?: string }
 *   One vote per user (re-voting updates). Vote weight is the voter's
 *   caller-credibility multiplier — accuracy plus cross-partisan balance
 *   (src/lib/fallacy/calibration.ts) — frozen at vote time. After each vote
 *   the claim is re-resolved at the 60% weighted threshold:
 *     confirmed → the claim's counter-argument is PUBLISHED into the linkage
 *                 sub-debate (strength by severity) and scores propagate;
 *     rejected  → the counter-argument is retired;
 *     open      → the counter-argument stays (or returns to) draft.
 *   Consensus can move in both directions as votes accumulate; the counter-
 *   argument's status always tracks the current outcome.
 *
 * GET /api/fallacy-claims/[id]/votes
 *   Current tally and consensus state.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isGraphFrozen, GRAPH_FREEZE_MESSAGE } from '@/lib/markets/epoch'
import { propagateFromLinkageChange } from '@/lib/propagate-belief-scores'
import { resolveConsensus, CONSENSUS_THRESHOLD, CONSENSUS_QUORUM } from '@/lib/consensus'
import { counterArgumentStrength } from '@/lib/fallacy/claims'
import { callerCredibilityFor } from '@/lib/fallacy/caller-record'
import type { FallacySeverity } from '@/lib/fallacy/catalog'

const OUTCOME_TO_CLAIM_STATUS = {
  upheld: 'confirmed',
  rejected: 'rejected',
  open: 'open',
} as const

const OUTCOME_TO_COUNTER_STATUS = {
  upheld: 'published',
  rejected: 'rejected',
  open: 'draft',
} as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const claimId = Number(id)
  if (!Number.isInteger(claimId)) {
    return NextResponse.json({ error: 'Invalid fallacy claim id.' }, { status: 400 })
  }

  const claim = await prisma.fallacyClaim.findUnique({
    where: { id: claimId },
    include: { votes: { orderBy: { createdAt: 'asc' } } },
  })
  if (!claim) return NextResponse.json({ error: 'Fallacy claim not found.' }, { status: 404 })

  const consensus = resolveConsensus(claim.votes.map(v => ({ agree: v.agree, weight: v.weight })))
  return NextResponse.json({
    claimId: claim.id,
    status: claim.status,
    consensus: {
      agreeShare: consensus.agreeShare,
      voteCount: consensus.voteCount,
      totalWeight: consensus.totalWeight,
      threshold: CONSENSUS_THRESHOLD,
      quorum: CONSENSUS_QUORUM,
    },
    votes: claim.votes.map(v => ({
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
  const claimId = Number(id)
  if (!Number.isInteger(claimId)) {
    return NextResponse.json({ error: 'Invalid fallacy claim id.' }, { status: 400 })
  }

  if (isGraphFrozen(new Date())) {
    return NextResponse.json({ error: GRAPH_FREEZE_MESSAGE }, { status: 423 })
  }

  let body: { userId?: string; agree?: boolean; reasoning?: string; weight?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON.' }, { status: 400 })
  }

  if (body.weight !== undefined) {
    return NextResponse.json(
      { error: 'weight is never accepted: it is computed from the voter’s track record.' },
      { status: 422 },
    )
  }
  const userId = body.userId?.trim()
  if (!userId) {
    return NextResponse.json({ error: 'userId is required.' }, { status: 422 })
  }
  if (typeof body.agree !== 'boolean') {
    return NextResponse.json({ error: 'agree must be true or false.' }, { status: 422 })
  }

  const claim = await prisma.fallacyClaim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      argumentId: true,
      severity: true,
      status: true,
      counterLinkageArgumentId: true,
    },
  })
  if (!claim) return NextResponse.json({ error: 'Fallacy claim not found.' }, { status: 404 })

  // Credibility is computed BEFORE this vote is stored, so voting on your own
  // pending accusations never lifts your own weight.
  const weight = await callerCredibilityFor(userId)

  const { consensus, statusChanged, newStatus, counterStatusChanged } =
    await prisma.$transaction(async tx => {
      await tx.fallacyClaimVote.upsert({
        where: { fallacyClaimId_userId: { fallacyClaimId: claimId, userId } },
        create: {
          fallacyClaimId: claimId,
          userId,
          agree: body.agree as boolean,
          reasoning: body.reasoning?.trim() || null,
          weight,
        },
        update: { agree: body.agree as boolean, reasoning: body.reasoning?.trim() || null, weight },
      })
      await tx.auditLog.create({
        data: {
          action: 'fallacy_claim_vote',
          targetType: 'FallacyClaim',
          targetId: String(claimId),
          rationale: body.reasoning?.trim() || `${userId} voted ${body.agree ? 'agree' : 'disagree'}.`,
          payload: JSON.stringify({ userId, agree: body.agree, weight }),
        },
      })

      const votes = await tx.fallacyClaimVote.findMany({
        where: { fallacyClaimId: claimId },
        select: { agree: true, weight: true },
      })
      const consensus = resolveConsensus(votes)

      const newStatus = OUTCOME_TO_CLAIM_STATUS[consensus.outcome]
      const statusChanged = newStatus !== claim.status
      if (statusChanged) {
        await tx.fallacyClaim.update({
          where: { id: claimId },
          data: {
            status: newStatus,
            consensus: consensus.agreeShare,
            resolvedAt: newStatus === 'open' ? null : new Date(),
          },
        })
        await tx.auditLog.create({
          data: {
            action: 'resolve_fallacy_claim',
            targetType: 'FallacyClaim',
            targetId: String(claimId),
            rationale:
              `Weighted community agreement ${((consensus.agreeShare ?? 0) * 100).toFixed(0)}% ` +
              `across ${consensus.voteCount} votes moved the claim to "${newStatus}".`,
          },
        })
      } else {
        await tx.fallacyClaim.update({
          where: { id: claimId },
          data: { consensus: consensus.agreeShare },
        })
      }

      // Keep the counter-argument's status in lockstep with the outcome. This
      // is the ONLY path that publishes it — confirmation, never filing.
      let counterStatusChanged = false
      if (claim.counterLinkageArgumentId != null) {
        const counterStatus = OUTCOME_TO_COUNTER_STATUS[consensus.outcome]
        const counter = await tx.linkageArgument.findUnique({
          where: { id: claim.counterLinkageArgumentId },
          select: { status: true },
        })
        if (counter && counter.status !== counterStatus) {
          await tx.linkageArgument.update({
            where: { id: claim.counterLinkageArgumentId },
            data: {
              status: counterStatus,
              strength: counterArgumentStrength(claim.severity as FallacySeverity),
            },
          })
          counterStatusChanged = true
        }
      }

      return { consensus, statusChanged, newStatus, counterStatusChanged }
    })

  // The confirmed counter-argument now counts in the linkage sub-debate (or
  // stopped counting, if consensus moved back). Recompute and ripple upward.
  const propagation = counterStatusChanged
    ? await propagateFromLinkageChange(claim.argumentId)
    : null

  return NextResponse.json({
    claimId,
    status: newStatus,
    agreeShare: consensus.agreeShare,
    voteCount: consensus.voteCount,
    voteWeight: weight,
    resolved: statusChanged,
    propagation: propagation && {
      updatedArgumentIds: propagation.updatedArgumentIds,
      updatedBeliefIds: propagation.updatedBeliefIds,
    },
    note:
      newStatus === 'confirmed'
        ? 'Claim confirmed: the counter-argument is published in the linkage sub-debate and scores propagated.'
        : newStatus === 'rejected'
          ? 'Claim rejected: the accusation failed its own debate. The target is untouched.'
          : `Open: needs ${CONSENSUS_QUORUM}+ votes and ${CONSENSUS_THRESHOLD * 100}% weighted agreement either way.`,
  })
}
