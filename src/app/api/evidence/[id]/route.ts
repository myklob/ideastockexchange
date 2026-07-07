/**
 * Evidence verification lifecycle.
 *
 * PATCH /api/evidence/[id] — update a row's verification status (VERIFIED /
 * UNVERIFIED / DISPUTED / FALSIFIED) with a mandatory rationale, then
 * propagate. This is the zombie-argument killer made operational: mark a
 * retracted study FALSIFIED and its impact drops to zero, its belief's truth
 * recomputes, and every conclusion upstream degrades — automatically, with
 * the change recorded in the audit log.
 *
 * The status is the ONLY mutable field here. Scores stay engine-computed;
 * there is no path to hand-set an impact (audit lock).
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { propagateBeliefScores } from '@/lib/propagate-belief-scores'
import { VERIFICATION_FACTORS, verificationFactorFor } from '@/core/scoring/scoring-engine'
import { isGraphFrozen, GRAPH_FREEZE_MESSAGE } from '@/lib/markets/epoch'

const VALID_STATUSES = Object.keys(VERIFICATION_FACTORS)

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
    include: { belief: { select: { id: true, slug: true, statement: true } } },
  })
  if (!evidence) return NextResponse.json({ error: 'Evidence not found.' }, { status: 404 })

  return NextResponse.json({
    evidence,
    verificationFactor: verificationFactorFor(evidence.verificationStatus),
    validStatuses: VALID_STATUSES,
    note:
      'PATCH { verificationStatus, rationale } to change standing. ' +
      'FALSIFIED zeroes the impact and propagates through every dependent conclusion.',
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
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `verificationStatus must be one of: ${VALID_STATUSES.join(', ')}.` },
      { status: 422 },
    )
  }
  const rationale = body.rationale?.trim()
  if (!rationale) {
    return NextResponse.json(
      { error: 'rationale is mandatory: cite the retraction, replication, or verification.' },
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
      data: { verificationStatus: status as never },
    })
    await tx.auditLog.create({
      data: {
        action: 'verify_evidence',
        targetType: 'Evidence',
        targetId: String(evidenceId),
        rationale,
        payload: JSON.stringify({
          from: evidence.verificationStatus,
          to: status,
          description: evidence.description,
        }),
      },
    })
  })

  // The engine's turn: recompute this belief's evidence impacts and ripple
  // the change through every conclusion that depended on them.
  const propagation = await propagateBeliefScores(evidence.beliefId)

  const fresh = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    select: { verificationStatus: true, evsScore: true, impactScore: true },
  })

  return NextResponse.json({
    evidence: { id: evidenceId, ...fresh },
    verificationFactor: verificationFactorFor(status),
    propagated: {
      updatedArguments: propagation.updatedArgumentIds.length,
      updatedBeliefs: propagation.updatedBeliefIds.length,
    },
  })
}
