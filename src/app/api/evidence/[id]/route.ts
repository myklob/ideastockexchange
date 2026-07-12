/**
 * Evidence verification lifecycle: the retraction flow.
 *
 * PATCH sets an engine Evidence node's verificationStatus (UNVERIFIED /
 * VERIFIED / DISPUTED / FALSIFIED). FALSIFIED zeroes the node's contribution
 * in computeBeliefScores and the change propagates to every score built on
 * it — including any topic-page ledger row bridged via
 * DebateEvidence.engineEvidenceId, which derives its standing from this
 * node at render time.
 *
 * Audit lock: the status is a lifecycle state, not a score; scores stay
 * engine-computed. Every transition is audit-logged with a mandatory
 * rationale, and the graph freeze applies (a retraction is a score-moving
 * graph edit like any other).
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { propagateBeliefScores } from '@/lib/propagate-belief-scores'
import { isGraphFrozen, GRAPH_FREEZE_MESSAGE } from '@/lib/markets/epoch'

const VALID_STATUSES = ['UNVERIFIED', 'VERIFIED', 'DISPUTED', 'FALSIFIED'] as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const evidenceId = Number(id)
  if (!Number.isInteger(evidenceId)) {
    return NextResponse.json({ error: 'Invalid evidence id.' }, { status: 400 })
  }
  const evidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    select: {
      id: true,
      beliefId: true,
      side: true,
      description: true,
      verificationStatus: true,
      evsScore: true,
      linkageScore: true,
    },
  })
  if (!evidence) return NextResponse.json({ error: 'Evidence not found.' }, { status: 404 })
  return NextResponse.json({
    evidence,
    lifecycle: {
      states: VALID_STATUSES,
      weights: { VERIFIED: 1, DISPUTED: 0.5, UNVERIFIED: 0.5, FALSIFIED: 0 },
      note: 'Null status = legacy row predating the lifecycle; counts at full weight.',
    },
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const evidenceId = Number(id)
  if (!Number.isInteger(evidenceId)) {
    return NextResponse.json({ error: 'Invalid evidence id.' }, { status: 400 })
  }

  if (isGraphFrozen(new Date())) {
    return NextResponse.json({ error: GRAPH_FREEZE_MESSAGE }, { status: 423 })
  }

  let body: { verificationStatus?: string; rationale?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON.' }, { status: 400 })
  }

  const status = body.verificationStatus
  if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json(
      { error: `verificationStatus must be one of ${VALID_STATUSES.join(', ')}.` },
      { status: 422 },
    )
  }
  const rationale = body.rationale?.trim()
  if (!rationale || rationale.length < 10) {
    return NextResponse.json(
      { error: 'rationale is required (min 10 chars) — every lifecycle transition is audited.' },
      { status: 422 },
    )
  }

  const evidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    select: { id: true, beliefId: true, verificationStatus: true, description: true },
  })
  if (!evidence) return NextResponse.json({ error: 'Evidence not found.' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.evidence.update({
      where: { id: evidenceId },
      data: { verificationStatus: status },
    })
    await tx.auditLog.create({
      data: {
        action: 'evidence_status_change',
        targetType: 'Evidence',
        targetId: String(evidenceId),
        rationale,
        payload: JSON.stringify({
          from: evidence.verificationStatus,
          to: status,
          beliefId: evidence.beliefId,
        }),
      },
    })
  })

  // The retraction (or confirmation) changes this belief's evidence weight,
  // so recompute it and everything upstream.
  const propagation = await propagateBeliefScores(
    evidence.beliefId,
    new Set(),
    0,
    `evidence #${evidenceId} marked ${status}`,
  )

  return NextResponse.json({
    evidenceId,
    verificationStatus: status,
    propagated: {
      beliefsUpdated: propagation.updatedBeliefIds.length,
      argumentsUpdated: propagation.updatedArgumentIds.length,
    },
  })
}
