/**
 * Importance provenance for one argument edge.
 *
 * Importance is not a dial an editor turns — it is the score of a dedicated
 * sub-belief ("this consideration matters to this question"), and the
 * multiplier is whatever that sub-debate earns. This route makes that
 * operational:
 *
 *   GET  — where the edge's importance comes from (manual weight, or the
 *          linked sub-belief and its current derived value).
 *   POST — attach the dedicated importance sub-belief. From then on the
 *          multiplier tracks the sub-debate: think a point is overweighted?
 *          Post the counter-argument there and the multiplier falls.
 *
 * The created sub-belief starts unargued, so the derived importance starts
 * neutral (0.5) and moves only as reasons land — no manual scoring, no score
 * that survives without scrutiny (audit lock).
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { propagateBeliefScores } from '@/lib/propagate-belief-scores'
import { deriveImportanceFromBeliefScore } from '@/core/scoring/scoring-engine'
import { slugify } from '@/lib/agent-ingest/slug'
import { isGraphFrozen, GRAPH_FREEZE_MESSAGE } from '@/lib/markets/epoch'

/** The four criteria that anchor every importance sub-debate. */
const ANCHOR_CONFIRM =
  'Evidence that this consideration affects many people or severe/irreversible outcomes ' +
  '(scale of impact), changes what action should be taken (decision relevance), or ' +
  'addresses a root cause rather than an edge case (causal proximity).'
const ANCHOR_FALSIFY =
  'Evidence that its effect is marginal in scale, leaves the decision unchanged either way, ' +
  'addresses only rare edge cases, or rests on untestable speculation about hypotheticals.'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const argumentId = Number(id)
  if (!Number.isInteger(argumentId)) {
    return NextResponse.json({ error: 'Invalid argument id.' }, { status: 400 })
  }

  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      parentBelief: { select: { id: true, slug: true, statement: true } },
      belief: { select: { id: true, slug: true, statement: true } },
      importanceBelief: { select: { id: true, slug: true, statement: true, positivity: true } },
    },
  })
  if (!argument) return NextResponse.json({ error: 'Argument not found.' }, { status: 404 })

  return NextResponse.json({
    argumentId,
    importanceScore: argument.importanceScore,
    source: argument.importanceBelief
      ? {
          kind: 'sub-belief',
          belief: argument.importanceBelief,
          derived: deriveImportanceFromBeliefScore(argument.importanceBelief.positivity),
          note: 'The multiplier tracks this sub-debate. Argue there to move it.',
        }
      : {
          kind: 'manual',
          note:
            'Placement-time weight; not yet debatable. POST here to attach the dedicated ' +
            'importance sub-belief and turn it into a live sub-debate.',
        },
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const argumentId = Number(id)
  if (!Number.isInteger(argumentId)) {
    return NextResponse.json({ error: 'Invalid argument id.' }, { status: 400 })
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

  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      parentBelief: { select: { id: true, statement: true, category: true } },
      belief: { select: { id: true, statement: true } },
    },
  })
  if (!argument) return NextResponse.json({ error: 'Argument not found.' }, { status: 404 })
  if (argument.importanceBeliefId != null) {
    return NextResponse.json(
      { error: 'This edge already has an importance sub-belief. Argue there to move the multiplier.' },
      { status: 409 },
    )
  }

  const label = argument.claim ?? argument.belief.statement
  const statement =
    body.statement?.trim() ||
    `"${label}" is an important consideration for "${argument.parentBelief.statement}"`
  const slug = slugify(statement).slice(0, 120)

  const created = await prisma.$transaction(async (tx) => {
    const importanceBelief =
      (await tx.belief.findUnique({ where: { slug } })) ??
      (await tx.belief.create({
        data: {
          slug,
          statement,
          category: argument.parentBelief.category,
          // The four anchor criteria, phrased as this sub-debate's
          // falsifiability tests: what evidence would move the multiplier.
          falsifiabilityConfirm: ANCHOR_CONFIRM,
          falsifiabilityFalsify: ANCHOR_FALSIFY,
        },
      }))

    await tx.argument.update({
      where: { id: argumentId },
      data: { importanceBeliefId: importanceBelief.id },
    })

    await tx.auditLog.create({
      data: {
        action: 'attach_importance',
        targetType: 'Argument',
        targetId: String(argumentId),
        rationale:
          body.rationale?.trim() ||
          'Importance made debatable: multiplier now tracks the dedicated sub-belief.',
        payload: JSON.stringify({ importanceBeliefId: importanceBelief.id, statement }),
      },
    })

    return importanceBelief
  })

  // Recompute the edge with the derived importance (neutral until argued)
  // and ripple upward.
  await propagateBeliefScores(argument.beliefId)

  const fresh = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: { importanceScore: true, impactScore: true },
  })

  return NextResponse.json(
    {
      importanceBelief: { id: created.id, slug: created.slug, statement: created.statement },
      argument: { id: argumentId, ...fresh },
      note:
        'The importance multiplier now tracks this sub-debate, starting neutral (0.5) until ' +
        'reasons land. Post arguments on the sub-belief page to move it.',
    },
    { status: 201 },
  )
}
