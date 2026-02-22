/**
 * Argument Linkage Debate API
 *
 * Manages the nested sub-debate that determines whether Argument X
 * actually supports Conclusion Y (its parent belief).
 *
 * The Linkage Score for an argument edge is computed using:
 *   LS = (A − D) / (A + D)
 * where A = total weight of arguments supporting the link,
 *       D = total weight of arguments opposing the link.
 *
 * GET  /api/arguments/[id]/linkage
 *   Returns the argument, its parent belief, and all LinkageArguments
 *   (the nested debate about whether the link is valid), plus the
 *   computed linkage score.
 *
 * POST /api/arguments/[id]/linkage
 *   Adds a new LinkageArgument (pro or con) to the debate.
 *   Body: { side: "agree" | "disagree", statement: string, strength: number }
 *
 * PATCH /api/arguments/[id]/linkage
 *   Recomputes and persists the linkage score from current LinkageArguments.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateLinkageFromArguments, applyDepthAttenuation } from '@/core/scoring/scoring-engine'

// ─── GET ───────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const argumentId = Number(id)

  if (Number.isNaN(argumentId)) {
    return NextResponse.json({ error: 'Invalid argument id' }, { status: 400 })
  }

  const arg = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      parentBelief: { select: { id: true, slug: true, statement: true } },
      belief: { select: { id: true, slug: true, statement: true } },
      linkageArguments: { orderBy: { createdAt: 'asc' } },
      linkageVotes: true,
    },
  })

  if (!arg) {
    return NextResponse.json({ error: 'Argument not found' }, { status: 404 })
  }

  // Compute current linkage score from stored LinkageArguments
  const computedLinkageScore = calculateLinkageFromArguments(
    arg.linkageArguments.map(la => ({ side: la.side, strength: la.strength }))
  )

  // Apply depth attenuation for display purposes
  const attenuatedScore = applyDepthAttenuation(computedLinkageScore, arg.depth)

  return NextResponse.json({
    argument: {
      id: arg.id,
      side: arg.side,
      linkageScore: arg.linkageScore,
      linkageType: arg.linkageType,
      linkageScoreType: arg.linkageScoreType,
      depth: arg.depth,
    },
    parentBelief: arg.parentBelief,
    childBelief: arg.belief,
    linkageArguments: arg.linkageArguments,
    linkageVotes: arg.linkageVotes,
    computed: {
      linkageScore: computedLinkageScore,
      attenuatedScore,
      depthFactor: Math.pow(0.5, arg.depth),
      formula: `(A − D) / (A + D)  →  depth-attenuated × 0.5^${arg.depth}`,
      proCount: arg.linkageArguments.filter(la => la.side === 'agree').length,
      conCount: arg.linkageArguments.filter(la => la.side === 'disagree').length,
    },
  })
}

// ─── POST ──────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const argumentId = Number(id)

  if (Number.isNaN(argumentId)) {
    return NextResponse.json({ error: 'Invalid argument id' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { side, statement, strength } = body as {
    side?: string
    statement?: string
    strength?: number
  }

  if (!side || !['agree', 'disagree'].includes(side)) {
    return NextResponse.json(
      { error: 'side must be "agree" or "disagree"' },
      { status: 400 }
    )
  }
  if (!statement || typeof statement !== 'string' || statement.trim().length === 0) {
    return NextResponse.json({ error: 'statement is required' }, { status: 400 })
  }
  const strengthVal = typeof strength === 'number' ? Math.max(0, Math.min(1, strength)) : 0.5

  // Verify the argument exists
  const arg = await prisma.argument.findUnique({ where: { id: argumentId } })
  if (!arg) {
    return NextResponse.json({ error: 'Argument not found' }, { status: 404 })
  }

  // Create the new linkage argument
  const newLinkageArg = await prisma.linkageArgument.create({
    data: {
      argumentId,
      side,
      statement: statement.trim(),
      strength: strengthVal,
    },
  })

  // Recompute linkage score and persist it back to the Argument
  const allLinkageArgs = await prisma.linkageArgument.findMany({
    where: { argumentId },
  })
  const newScore = calculateLinkageFromArguments(
    allLinkageArgs.map(la => ({ side: la.side, strength: la.strength }))
  )
  await prisma.argument.update({
    where: { id: argumentId },
    data: { linkageScore: newScore },
  })

  return NextResponse.json(
    {
      linkageArgument: newLinkageArg,
      updatedLinkageScore: newScore,
    },
    { status: 201 }
  )
}

// ─── PATCH ─────────────────────────────────────────────────────────────────

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const argumentId = Number(id)

  if (Number.isNaN(argumentId)) {
    return NextResponse.json({ error: 'Invalid argument id' }, { status: 400 })
  }

  const arg = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: { linkageArguments: true },
  })
  if (!arg) {
    return NextResponse.json({ error: 'Argument not found' }, { status: 404 })
  }

  const newScore = calculateLinkageFromArguments(
    arg.linkageArguments.map(la => ({ side: la.side, strength: la.strength }))
  )

  const updated = await prisma.argument.update({
    where: { id: argumentId },
    data: { linkageScore: newScore },
    select: { id: true, linkageScore: true, linkageType: true, depth: true },
  })

  return NextResponse.json({
    updated,
    attenuatedScore: applyDepthAttenuation(newScore, updated.depth),
  })
}
