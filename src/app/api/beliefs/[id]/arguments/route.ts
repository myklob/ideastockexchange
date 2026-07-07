/**
 * Human posting endpoint: add a reason to agree or disagree to a belief.
 *
 * The two moves the belief page supports are "add a row" and "challenge a
 * number" — this is the add-a-row move. The new reason becomes a full belief
 * page of its own (the recursive tree has no hardcoded floor), joined to the
 * parent by an Argument edge, and the scoring engine immediately propagates
 * so every dependent conclusion updates.
 *
 * Audit lock: no score field is accepted. Scores are the engine's job.
 *
 * SPEED BUMPS (high-stakes beliefs only): before the API accepts a post it
 * requires (1) acknowledging the strongest current argument on the OTHER
 * side — verified server-side against the live ranking, not the client's
 * word — and (2) a moral-principle consistency statement: name the principle
 * the post rests on and affirm the proposal is consistent with it. GET this
 * route to fetch what the speed bumps currently require.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { propagateBeliefScores } from '@/lib/propagate-belief-scores'
import { slugify } from '@/lib/agent-ingest/slug'
import { isGraphFrozen, GRAPH_FREEZE_MESSAGE } from '@/lib/markets/epoch'

interface PostBody {
  side?: string
  statement?: string
  claim?: string
  rationale?: string
  /** Speed bump 1: the id of the strongest opposing argument, as acknowledgment. */
  steelmanArgumentId?: number
  /** Speed bump 2: the moral principle claimed, plus explicit consistency. */
  principle?: string
  principleConsistent?: boolean
}

/** The strongest published argument on a side, by current impact magnitude. */
async function strongestOnSide(beliefId: number, side: 'agree' | 'disagree') {
  const args = await prisma.argument.findMany({
    where: { parentBeliefId: beliefId, side, status: 'published' },
    include: { belief: { select: { slug: true, statement: true } } },
  })
  if (args.length === 0) return null
  return args.reduce((a, b) => (Math.abs(b.impactScore) > Math.abs(a.impactScore) ? b : a))
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
    select: { id: true, slug: true, statement: true, highStakes: true },
  })
  if (!belief) return NextResponse.json({ error: 'Belief not found.' }, { status: 404 })

  const [strongestAgree, strongestDisagree] = await Promise.all([
    strongestOnSide(beliefId, 'agree'),
    strongestOnSide(beliefId, 'disagree'),
  ])

  return NextResponse.json({
    belief: { id: belief.id, slug: belief.slug, statement: belief.statement },
    highStakes: belief.highStakes,
    speedBumps: belief.highStakes
      ? {
          steelman:
            'Acknowledge the strongest point on the other side: pass its id as steelmanArgumentId.',
          principle:
            'Name the moral principle your post rests on (principle) and affirm the proposal is consistent with it (principleConsistent: true).',
          strongestAgree: strongestAgree && {
            id: strongestAgree.id,
            claim: strongestAgree.claim ?? strongestAgree.belief.statement,
            impactScore: strongestAgree.impactScore,
          },
          strongestDisagree: strongestDisagree && {
            id: strongestDisagree.id,
            claim: strongestDisagree.claim ?? strongestDisagree.belief.statement,
            impactScore: strongestDisagree.impactScore,
          },
        }
      : null,
    auditLock: 'No score field is accepted. Scores are computed by the engine, never submitted.',
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

  // Audit lock, enforced not just documented.
  const forbidden = ['impactScore', 'linkageScore', 'importanceScore', 'argumentScore', 'uniquenessScore']
  const submitted = Object.keys(body as Record<string, unknown>).filter((k) => forbidden.includes(k))
  if (submitted.length > 0) {
    return NextResponse.json(
      { error: `Score fields are never accepted (${submitted.join(', ')}). The engine computes scores.` },
      { status: 422 },
    )
  }

  const side = body.side === 'agree' || body.side === 'disagree' ? body.side : null
  if (!side) {
    return NextResponse.json({ error: "side must be 'agree' or 'disagree'." }, { status: 422 })
  }
  const statement = body.statement?.trim()
  if (!statement || statement.length < 10) {
    return NextResponse.json(
      { error: 'statement must be a standalone claim with a truth value (min 10 chars).' },
      { status: 422 },
    )
  }

  const belief = await prisma.belief.findUnique({
    where: { id: beliefId },
    select: { id: true, slug: true, highStakes: true },
  })
  if (!belief) return NextResponse.json({ error: 'Belief not found.' }, { status: 404 })

  // ── Speed bumps for high-stakes beliefs ─────────────────────────────────
  if (belief.highStakes) {
    const opposingSide = side === 'agree' ? 'disagree' : 'agree'
    const strongest = await strongestOnSide(beliefId, opposingSide)

    if (strongest && body.steelmanArgumentId !== strongest.id) {
      return NextResponse.json(
        {
          error:
            'Speed bump: acknowledge the strongest point on the other side before posting. ' +
            'Pass its id as steelmanArgumentId.',
          strongestOpposing: {
            id: strongest.id,
            claim: strongest.claim ?? strongest.belief.statement,
            impactScore: strongest.impactScore,
          },
        },
        { status: 422 },
      )
    }

    if (!body.principle?.trim() || body.principleConsistent !== true) {
      return NextResponse.json(
        {
          error:
            'Speed bump: name the moral principle your post rests on (principle) and confirm ' +
            'your proposal is consistent with it (principleConsistent: true).',
        },
        { status: 422 },
      )
    }
  }

  // ── Create the child belief + edge (no scores), then let the engine run ─
  const slug = slugify(statement)
  const rationale = [
    body.rationale?.trim() || null,
    belief.highStakes && body.principle
      ? `Speed bumps passed — acknowledged strongest opposing argument #${body.steelmanArgumentId ?? 'none'}; claimed principle: "${body.principle.trim()}"`
      : null,
  ]
    .filter(Boolean)
    .join(' | ')

  const created = await prisma.$transaction(async (tx) => {
    const childBelief =
      (await tx.belief.findUnique({ where: { slug } })) ??
      (await tx.belief.create({ data: { slug, statement } }))

    const argument = await tx.argument.create({
      data: {
        parentBeliefId: belief.id,
        beliefId: childBelief.id,
        side,
        claim: body.claim?.trim() || null,
        rationale: rationale || null,
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'post_argument',
        targetType: 'Argument',
        targetId: String(argument.id),
        rationale: rationale || 'Human submission via belief page.',
        payload: JSON.stringify({ beliefId: belief.id, side, statement }),
      },
    })

    return { argument, childBelief }
  })

  // The engine's turn: the new edge changes the graph, so recompute the new
  // claim's impact and everything upstream of it.
  await propagateBeliefScores(created.childBelief.id)

  return NextResponse.json(
    {
      argumentId: created.argument.id,
      childBeliefSlug: created.childBelief.slug,
      note: 'Scores are computed by the engine and will appear once propagation lands.',
    },
    { status: 201 },
  )
}
