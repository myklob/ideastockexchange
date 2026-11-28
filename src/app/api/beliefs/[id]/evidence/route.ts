/**
 * Evidence endpoint: link a piece of evidence to a conclusion.
 *
 * This is the other half of "add a row" — where the arguments route adds a
 * reason edge, this one adds an evidence row to the belief's Evidence Ledger.
 * The link is what makes automatic updating possible: when the evidence later
 * changes (tier reclassification, retraction, failed replication — see
 * PATCH /api/evidence/[id]), every conclusion resting on it recalculates.
 *
 * Audit lock: `evsScore` and `impactScore` are never accepted; the engine
 * computes EVS = ESIW × log2(ERQ+1) × ECRS × ERP and the impact from it, then
 * propagates upward. The tier (`evidenceType`) is a CLASSIFICATION input, not
 * a score — it is community-correctable after the fact, which is exactly how
 * a retraction lands (T1 → T0).
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

interface PostBody {
  side?: string
  description?: string
  sourceUrl?: string
  /** Tier classification: T1 peer-reviewed … T4 opinion, T0 retracted. */
  evidenceType?: string
  replicationQuantity?: number
  conclusionRelevance?: number
  replicationPercentage?: number
  linkageScore?: number
  doi?: string
  pmid?: string
  isbn?: string
  author?: string
  publicationDate?: string
}

function inRange01(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const beliefId = Number(id)
  if (!Number.isInteger(beliefId)) {
    return NextResponse.json({ error: 'Invalid belief id.' }, { status: 400 })
  }

  const belief = await prisma.belief.findUnique({
    where: { id: beliefId },
    select: { id: true, slug: true, statement: true },
  })
  if (!belief) return NextResponse.json({ error: 'Belief not found.' }, { status: 404 })

  const evidence = await prisma.evidence.findMany({
    where: { beliefId },
    orderBy: { impactScore: 'desc' },
  })

  return NextResponse.json({
    belief,
    evidence,
    tiers: 'T1 peer-reviewed/official, T2 expert/institutional, T3 journalism/surveys, T4 opinion/anecdote, T0 retracted/fraudulent.',
    auditLock:
      'evsScore and impactScore are computed by the engine, never submitted. When evidence ' +
      'changes, PATCH /api/evidence/[id] recomputes them and propagates to every dependent conclusion.',
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const beliefId = Number(id)
  if (!Number.isInteger(beliefId)) {
    return NextResponse.json({ error: 'Invalid belief id.' }, { status: 400 })
  }

  if (isGraphFrozen(new Date())) {
    return NextResponse.json({ error: GRAPH_FREEZE_MESSAGE }, { status: 423 })
  }

  let body: PostBody
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

  const side = body.side === 'supporting' || body.side === 'weakening' ? body.side : null
  if (!side) {
    return NextResponse.json({ error: "side must be 'supporting' or 'weakening'." }, { status: 422 })
  }

  const description = body.description?.trim()
  if (!description || description.length < 10) {
    return NextResponse.json(
      { error: 'description must identify the evidence (min 10 chars).' },
      { status: 422 },
    )
  }

  const evidenceType = body.evidenceType ?? 'T3'
  if (!VALID_TIERS.includes(evidenceType as (typeof VALID_TIERS)[number])) {
    return NextResponse.json(
      { error: `evidenceType must be one of ${VALID_TIERS.join(', ')}.` },
      { status: 422 },
    )
  }

  const replicationQuantity = body.replicationQuantity ?? 1
  if (!Number.isInteger(replicationQuantity) || replicationQuantity < 0) {
    return NextResponse.json(
      { error: 'replicationQuantity must be a non-negative integer.' },
      { status: 422 },
    )
  }

  const conclusionRelevance = body.conclusionRelevance ?? 0.5
  const replicationPercentage = body.replicationPercentage ?? 1.0
  const linkageScore = body.linkageScore ?? 0.5
  for (const [name, value] of [
    ['conclusionRelevance', conclusionRelevance],
    ['replicationPercentage', replicationPercentage],
    ['linkageScore', linkageScore],
  ] as const) {
    if (!inRange01(value)) {
      return NextResponse.json({ error: `${name} must be between 0 and 1.` }, { status: 422 })
    }
  }

  const belief = await prisma.belief.findUnique({
    where: { id: beliefId },
    select: { id: true, slug: true },
  })
  if (!belief) return NextResponse.json({ error: 'Belief not found.' }, { status: 404 })

  // The engine's numbers: tier weight drives ESIW, EVS drives impact.
  const sourceIndependenceWeight = getEvidenceTypeWeight(evidenceType)
  const evsScore = calculateEVS({
    sourceIndependenceWeight,
    replicationQuantity,
    conclusionRelevance,
    replicationPercentage,
  })
  const impactScore = computeEvidenceImpactScore(evsScore, linkageScore)

  const evidence = await prisma.$transaction(async (tx) => {
    const created = await tx.evidence.create({
      data: {
        beliefId: belief.id,
        side,
        description,
        sourceUrl: body.sourceUrl?.trim() || null,
        evidenceType,
        sourceIndependenceWeight,
        replicationQuantity,
        conclusionRelevance,
        replicationPercentage,
        linkageScore,
        evsScore,
        impactScore,
        doi: body.doi?.trim() || null,
        pmid: body.pmid?.trim() || null,
        isbn: body.isbn?.trim() || null,
        author: body.author?.trim() || null,
        publicationDate: body.publicationDate?.trim() || null,
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'add_evidence',
        targetType: 'Evidence',
        targetId: String(created.id),
        rationale: `Evidence linked to belief #${belief.id} (${side}, ${evidenceType}).`,
        payload: JSON.stringify({ beliefId: belief.id, side, evidenceType, description }),
      },
    })

    return created
  })

  // The link is live: recompute this belief and everything that rests on it.
  await propagateBeliefScores(belief.id, new Set(), 0, `evidence #${evidence.id} added`)

  return NextResponse.json(
    {
      evidenceId: evidence.id,
      evsScore,
      impactScore,
      note:
        'Evidence is now linked to this conclusion. If it is later retracted or reclassified ' +
        '(PATCH /api/evidence/[id]), every dependent score updates automatically.',
    },
    { status: 201 },
  )
}
