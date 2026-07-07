/**
 * Criterion-quality provenance: the yardstick's own debate.
 *
 * A criterion's quality score is not an editor's constant — it is the score
 * of a dedicated sub-belief ("X is a good measure for this question"), argued
 * across the four quality dimensions: validity, reliability, independence,
 * linkage. This route makes that operational:
 *
 *   GET  — where the criterion's quality comes from (hand-set dimensions, or
 *          the linked sub-belief and its derived score).
 *   POST — attach the dedicated criterion sub-belief. From then on the
 *          quality tracks the sub-debate, and every evidence row measured by
 *          this yardstick re-weighs when the debate moves.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { propagateBeliefScores } from '@/lib/propagate-belief-scores'
import { deriveImportanceFromBeliefScore } from '@/core/scoring/scoring-engine'
import { slugify } from '@/lib/agent-ingest/slug'
import { isGraphFrozen, GRAPH_FREEZE_MESSAGE } from '@/lib/markets/epoch'

/** The four quality dimensions, phrased as the sub-debate's falsifiability tests. */
const ANCHOR_CONFIRM =
  'Evidence that this metric measures what it claims to (validity), can be measured ' +
  'consistently by different people (reliability), comes from neutral sources ' +
  '(independence), and correlates strongly with the ultimate goal (linkage).'
const ANCHOR_FALSIFY =
  'Evidence that the metric measures something else, varies by observer, is produced ' +
  'by interested parties, or barely correlates with the outcome the debate is about.'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const criterionId = Number(id)
  if (!Number.isInteger(criterionId)) {
    return NextResponse.json({ error: 'Invalid criterion id.' }, { status: 400 })
  }

  const criterion = await prisma.objectiveCriteria.findUnique({
    where: { id: criterionId },
    include: {
      belief: { select: { id: true, slug: true, statement: true } },
      criterionBelief: { select: { id: true, slug: true, statement: true, positivity: true } },
    },
  })
  if (!criterion) return NextResponse.json({ error: 'Criterion not found.' }, { status: 404 })

  return NextResponse.json({
    criterionId,
    description: criterion.description,
    totalScore: criterion.totalScore,
    source: criterion.criterionBelief
      ? {
          kind: 'sub-belief',
          belief: criterion.criterionBelief,
          derived: deriveImportanceFromBeliefScore(criterion.criterionBelief.positivity),
          note:
            'Quality tracks this sub-debate; evidence measured by this yardstick re-weighs ' +
            'when it moves.',
        }
      : {
          kind: 'dimensions',
          validityScore: criterion.validityScore,
          reliabilityScore: criterion.reliabilityScore,
          independenceScore: criterion.independenceScore,
          linkageScore: criterion.linkageScore,
          note:
            'Hand-set dimension scores; not yet debatable. POST here to attach the dedicated ' +
            'criterion sub-belief and turn the quality into a live sub-debate.',
        },
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const criterionId = Number(id)
  if (!Number.isInteger(criterionId)) {
    return NextResponse.json({ error: 'Invalid criterion id.' }, { status: 400 })
  }

  if (isGraphFrozen(new Date())) {
    return NextResponse.json({ error: GRAPH_FREEZE_MESSAGE }, { status: 423 })
  }

  let body: { statement?: string; rationale?: string }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const criterion = await prisma.objectiveCriteria.findUnique({
    where: { id: criterionId },
    include: { belief: { select: { id: true, statement: true, category: true } } },
  })
  if (!criterion) return NextResponse.json({ error: 'Criterion not found.' }, { status: 404 })
  if (criterion.criterionBeliefId != null) {
    return NextResponse.json(
      { error: 'This criterion already has a quality sub-belief. Argue there to move the score.' },
      { status: 409 },
    )
  }

  const statement =
    body.statement?.trim() ||
    `"${criterion.description}" is a good measure for "${criterion.belief.statement}"`
  const slug = slugify(statement).slice(0, 120)

  const created = await prisma.$transaction(async (tx) => {
    const criterionBelief =
      (await tx.belief.findUnique({ where: { slug } })) ??
      (await tx.belief.create({
        data: {
          slug,
          statement,
          category: criterion.belief.category,
          falsifiabilityConfirm: ANCHOR_CONFIRM,
          falsifiabilityFalsify: ANCHOR_FALSIFY,
        },
      }))

    await tx.objectiveCriteria.update({
      where: { id: criterionId },
      data: { criterionBeliefId: criterionBelief.id },
    })

    await tx.auditLog.create({
      data: {
        action: 'attach_criterion_debate',
        targetType: 'ObjectiveCriteria',
        targetId: String(criterionId),
        rationale:
          body.rationale?.trim() ||
          'Criterion quality made debatable: score now tracks the dedicated sub-belief.',
        payload: JSON.stringify({ criterionBeliefId: criterionBelief.id, statement }),
      },
    })

    return criterionBelief
  })

  // Recompute the page that uses this yardstick (criterion quality, measured
  // evidence, net) and everything upstream.
  await propagateBeliefScores(created.id)

  const fresh = await prisma.objectiveCriteria.findUnique({
    where: { id: criterionId },
    select: { totalScore: true },
  })

  return NextResponse.json(
    {
      criterionBelief: { id: created.id, slug: created.slug, statement: created.statement },
      criterion: { id: criterionId, ...fresh },
      note:
        'The quality score now tracks this sub-debate, starting neutral (0.5) until reasons ' +
        'land. Evidence measured by this yardstick re-weighs as the debate moves.',
    },
    { status: 201 },
  )
}
