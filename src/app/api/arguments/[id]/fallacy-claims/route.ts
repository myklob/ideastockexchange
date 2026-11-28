/**
 * Structured fallacy claims against an argument edge.
 *
 * GET  /api/arguments/[id]/fallacy-claims
 *   The argument's claims with their consensus state, plus the accusation
 *   template (what filing requires) so a client can render the form.
 *
 * POST /api/arguments/[id]/fallacy-claims
 *   File an accusation. You can't just yell "FALLACY!": every template field
 *   is required (validateFallacyClaimInput), and types whose case needs
 *   exhibits (straw man, false dilemma, cherry-picking, ...) must carry
 *   evidence links. Filing changes NO score: the claim enters the target's
 *   linkage sub-debate as a DRAFT counter-argument and only community
 *   consensus on the votes route publishes it.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isGraphFrozen, GRAPH_FREEZE_MESSAGE } from '@/lib/markets/epoch'
import { catalogEntry, FALLACY_CATALOG } from '@/lib/fallacy/catalog'
import {
  validateFallacyClaimInput,
  counterStatementFor,
  type FallacyClaimInput,
  type FallacyEvidenceLink,
} from '@/lib/fallacy/claims'
import { resolveConsensus, CONSENSUS_THRESHOLD, CONSENSUS_QUORUM } from '@/lib/consensus'

interface PostBody extends Partial<FallacyClaimInput> {
  submittedById?: string
}

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
    select: {
      id: true,
      side: true,
      parentBelief: { select: { slug: true, statement: true } },
      belief: { select: { slug: true, statement: true } },
      fallacyClaims: { include: { votes: true }, orderBy: { createdAt: 'asc' } },
    },
  })
  if (!argument) return NextResponse.json({ error: 'Argument not found.' }, { status: 404 })

  return NextResponse.json({
    argument: {
      id: argument.id,
      side: argument.side,
      parentBelief: argument.parentBelief,
      childBelief: argument.belief,
    },
    claims: argument.fallacyClaims.map(claim => {
      const consensus = resolveConsensus(
        claim.votes.map(v => ({ agree: v.agree, weight: v.weight })),
      )
      return {
        id: claim.id,
        fallacyType: claim.fallacyType,
        targetFactor: claim.targetFactor,
        severity: claim.severity,
        quotedText: claim.quotedText,
        explanation: claim.explanation,
        missingElements: claim.missingElements,
        evidenceLinks: JSON.parse(claim.evidenceLinks) as FallacyEvidenceLink[],
        consequences: claim.consequences,
        status: claim.status,
        consensus: claim.consensus,
        live: {
          agreeShare: consensus.agreeShare,
          voteCount: consensus.voteCount,
          threshold: CONSENSUS_THRESHOLD,
          quorum: CONSENSUS_QUORUM,
        },
      }
    }),
    template: {
      requiredFields: [
        'fallacyType',
        'quotedText',
        'explanation',
        'missingElements',
        'evidenceLinks',
        'consequences',
      ],
      fallacyTypes: [...FALLACY_CATALOG.values()].map(e => ({
        slug: e.slug,
        label: e.label,
        targetFactor: e.targetFactor,
        severity: e.severity,
        evidenceRequirement: e.evidenceRequirement,
      })),
      note:
        'An accusation is an argument. Filing changes no score: the claim enters the ' +
        'linkage sub-debate as a draft counter-argument and takes effect only if the ' +
        `community confirms it (weighted agreement >= ${CONSENSUS_THRESHOLD * 100}%).`,
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

  let body: PostBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON.' }, { status: 400 })
  }

  // Audit lock: an accusation never carries a score.
  const forbidden = ['severity', 'weight', 'consensus', 'status', 'score']
  const submitted = Object.keys(body as Record<string, unknown>).filter(k => forbidden.includes(k))
  if (submitted.length > 0) {
    return NextResponse.json(
      {
        error:
          `Fields never accepted from the accuser (${submitted.join(', ')}): severity comes ` +
          'from the catalog, weight from the track record, status from community consensus.',
      },
      { status: 422 },
    )
  }

  const input: FallacyClaimInput = {
    fallacyType: body.fallacyType ?? '',
    quotedText: body.quotedText ?? '',
    explanation: body.explanation ?? '',
    missingElements: body.missingElements ?? '',
    evidenceLinks: Array.isArray(body.evidenceLinks) ? body.evidenceLinks : [],
    consequences: body.consequences ?? '',
  }
  const issues = validateFallacyClaimInput(input)
  if (issues.length > 0) {
    return NextResponse.json(
      { error: 'Incomplete accusation template. An accusation is an argument; build the case.', issues },
      { status: 422 },
    )
  }
  const entry = catalogEntry(input.fallacyType)!

  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: { id: true },
  })
  if (!argument) return NextResponse.json({ error: 'Argument not found.' }, { status: 404 })

  const created = await prisma.$transaction(async tx => {
    // The claim's counter-argument enters the sub-debate as a DRAFT: visible,
    // reviewable, counted only after confirmation.
    const counter = await tx.linkageArgument.create({
      data: {
        argumentId,
        side: 'disagree',
        statement: counterStatementFor(input, entry),
        pattern: entry.slug,
        status: 'draft',
        targetFactor: entry.targetFactor,
        fallacyType: entry.slug,
        rationale:
          'Structured fallacy claim filed with the full accusation template. ' +
          'Draft until community consensus confirms the claim.',
      },
    })

    const claim = await tx.fallacyClaim.create({
      data: {
        argumentId,
        fallacyType: entry.slug,
        targetFactor: entry.targetFactor,
        severity: entry.severity,
        quotedText: input.quotedText.trim(),
        explanation: input.explanation.trim(),
        missingElements: input.missingElements.trim(),
        evidenceLinks: JSON.stringify(input.evidenceLinks),
        consequences: input.consequences.trim(),
        counterLinkageArgumentId: counter.id,
        submittedById: body.submittedById?.trim() || null,
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'file_fallacy_claim',
        targetType: 'FallacyClaim',
        targetId: String(claim.id),
        rationale: input.explanation.trim(),
        payload: JSON.stringify({ argumentId, ...input }),
      },
    })

    return { claim, counter }
  })

  return NextResponse.json(
    {
      claimId: created.claim.id,
      counterLinkageArgumentId: created.counter.id,
      status: created.claim.status,
      note:
        'Filed. No score changed: the counter-argument is a draft in the linkage sub-debate. ' +
        `The claim takes effect only if weighted community agreement reaches ${CONSENSUS_THRESHOLD * 100}% ` +
        `(minimum ${CONSENSUS_QUORUM} votes) on POST /api/fallacy-claims/${created.claim.id}/votes.`,
    },
    { status: 201 },
  )
}
