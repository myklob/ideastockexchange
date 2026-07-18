/**
 * Evidence update endpoint: when the evidence changes, everything built on
 * it changes too.
 *
 * This is the zombie-argument kill switch. A retraction, a failed
 * replication, or a tier reclassification is submitted here as a change to
 * the evidence row's CLASSIFICATION inputs (never its scores); the engine
 * recomputes EVS and impact, then propagates through every argument and
 * conclusion that rests on this evidence. Each belief the cascade touches
 * gets a BeliefScoreEvent naming this change as the trigger, so readers see
 * WHY a score moved, not just that it did.
 *
 * The canonical example: a fraudulent study is retracted → evidenceType
 * T1 → T0 → EVS collapses → the belief it propped up drops → every
 * conclusion citing that belief drops. No manual cleanup, no persistent myth.
 *
 * A `reason` is required on every change: reclassifying evidence without
 * saying why is how zombie arguments get made in the other direction.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { propagateBeliefScores } from '@/lib/propagate-belief-scores'
import {
  calculateEVS,
  computeEvidenceImpactScore,
  getEvidenceTypeWeight,
} from '@/core/scoring/scoring-engine'
import { isGraphFrozen, GRAPH_FREEZE_MESSAGE } from '@/lib/markets/epoch'

const VALID_TIERS = ['T0', 'T1', 'T2', 'T3', 'T4'] as const

interface PatchBody {
  /** Why this change is being made (retraction notice, critique, correction). Required. */
  reason?: string
  /** Reclassify the tier — 'T0' marks the source retracted/fraudulent. */
  evidenceType?: string
  side?: string
  description?: string
  sourceUrl?: string
  replicationQuantity?: number
  conclusionRelevance?: number
  replicationPercentage?: number
  linkageScore?: number
}

function inRange01(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1
}

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

  const tierWeight = getEvidenceTypeWeight(evidence.evidenceType)
  return NextResponse.json({
    evidence,
    derivation: {
      formula: 'EVS = ESIW × log2(ERQ + 1) × ECRS × ERP; impact = EVS × linkage × 10',
      tierWeight,
      evsScore: evidence.evsScore,
      impactScore: evidence.impactScore,
    },
    changeLog: await prisma.auditLog.findMany({
      where: { targetType: 'Evidence', targetId: String(evidenceId) },
      orderBy: { createdAt: 'desc' },
      select: { action: true, rationale: true, payload: true, createdAt: true },
    }),
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

  let body: PatchBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON.' }, { status: 400 })
  }

  const forbidden = ['evsScore', 'impactScore', 'sourceIndependenceWeight']
  const submitted = Object.keys(body as Record<string, unknown>).filter((k) => forbidden.includes(k))
  if (submitted.length > 0) {
    return NextResponse.json(
      { error: `Score fields are never accepted (${submitted.join(', ')}). The engine computes scores.` },
      { status: 422 },
    )
  }

  const reason = body.reason?.trim()
  if (!reason || reason.length < 10) {
    return NextResponse.json(
      {
        error:
          'reason is required (min 10 chars): cite the retraction notice, critique, or ' +
          'correction that justifies changing this evidence.',
      },
      { status: 422 },
    )
  }

  const existing = await prisma.evidence.findUnique({ where: { id: evidenceId } })
  if (!existing) return NextResponse.json({ error: 'Evidence not found.' }, { status: 404 })

  if (body.evidenceType !== undefined && !VALID_TIERS.includes(body.evidenceType as (typeof VALID_TIERS)[number])) {
    return NextResponse.json(
      { error: `evidenceType must be one of ${VALID_TIERS.join(', ')}.` },
      { status: 422 },
    )
  }
  if (body.side !== undefined && body.side !== 'supporting' && body.side !== 'weakening') {
    return NextResponse.json({ error: "side must be 'supporting' or 'weakening'." }, { status: 422 })
  }
  if (
    body.replicationQuantity !== undefined &&
    (!Number.isInteger(body.replicationQuantity) || body.replicationQuantity < 0)
  ) {
    return NextResponse.json(
      { error: 'replicationQuantity must be a non-negative integer.' },
      { status: 422 },
    )
  }
  for (const name of ['conclusionRelevance', 'replicationPercentage', 'linkageScore'] as const) {
    const value = body[name]
    if (value !== undefined && !inRange01(value)) {
      return NextResponse.json({ error: `${name} must be between 0 and 1.` }, { status: 422 })
    }
  }

  // Merge the classification inputs, then let the engine recompute the scores.
  const next = {
    evidenceType: body.evidenceType ?? existing.evidenceType,
    side: body.side ?? existing.side,
    description: body.description?.trim() || existing.description,
    sourceUrl: body.sourceUrl !== undefined ? body.sourceUrl.trim() || null : existing.sourceUrl,
    replicationQuantity: body.replicationQuantity ?? existing.replicationQuantity,
    conclusionRelevance: body.conclusionRelevance ?? existing.conclusionRelevance,
    replicationPercentage: body.replicationPercentage ?? existing.replicationPercentage,
    linkageScore: body.linkageScore ?? existing.linkageScore,
  }

  const sourceIndependenceWeight = getEvidenceTypeWeight(next.evidenceType)
  const evsScore = calculateEVS({
    sourceIndependenceWeight,
    replicationQuantity: next.replicationQuantity,
    conclusionRelevance: next.conclusionRelevance,
    replicationPercentage: next.replicationPercentage,
  })
  const impactScore = computeEvidenceImpactScore(evsScore, next.linkageScore)

  const tierChanged = next.evidenceType !== existing.evidenceType
  const changeSummary = tierChanged
    ? `retier ${existing.evidenceType} → ${next.evidenceType}`
    : 'reclassified'

  await prisma.$transaction(async (tx) => {
    await tx.evidence.update({
      where: { id: evidenceId },
      data: { ...next, sourceIndependenceWeight, evsScore, impactScore },
    })

    await tx.auditLog.create({
      data: {
        action: 'update_evidence',
        targetType: 'Evidence',
        targetId: String(evidenceId),
        rationale: reason,
        payload: JSON.stringify({
          before: {
            evidenceType: existing.evidenceType,
            side: existing.side,
            replicationQuantity: existing.replicationQuantity,
            conclusionRelevance: existing.conclusionRelevance,
            replicationPercentage: existing.replicationPercentage,
            linkageScore: existing.linkageScore,
            evsScore: existing.evsScore,
            impactScore: existing.impactScore,
          },
          after: { ...next, evsScore, impactScore },
        }),
      },
    })
  })

  // The cascade: this belief, then every argument and conclusion above it.
  // Each score movement lands as a BeliefScoreEvent naming this change.
  const propagation = await propagateBeliefScores(
    existing.beliefId,
    new Set(),
    0,
    `evidence #${evidenceId} ${changeSummary}: ${reason}`,
  )

  return NextResponse.json({
    evidenceId,
    evsScore: { before: existing.evsScore, after: evsScore },
    impactScore: { before: existing.impactScore, after: impactScore },
    cascade: {
      updatedBeliefs: propagation.updatedBeliefIds.length,
      updatedArguments: propagation.updatedArgumentIds.length,
      depth: propagation.depth,
    },
    note: tierChanged
      ? `Tier ${existing.evidenceType} → ${next.evidenceType}. Every conclusion resting on this ` +
        'evidence has been recalculated; score histories name this change as the trigger.'
      : 'Evidence reclassified and all dependent scores recalculated.',
  })
}
