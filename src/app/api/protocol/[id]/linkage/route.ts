import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSchilchtBelief } from '@/features/epistemology/data/schlicht-data'
import {
  calculateLinkageFromDiagnostic,
  aggregateLinkageVotes,
  classifyLinkageScore,
  detectNonSequitur,
  shouldPromptForAssumption,
  resolveLinkageScore,
  scoreProtocolBelief,
} from '@/core/scoring/scoring-engine'
import { LinkageDiagnostic, LinkageVote } from '@/core/types/schlicht'

// ─── Schemas ──────────────────────────────────────────────────────

const linkageVoteSchema = z.object({
  argument_id: z.string().min(1, 'Argument ID is required'),
  user_id: z.string().min(1, 'User ID is required'),
  // Diagnostic wizard answers
  direction: z.enum(['support', 'oppose']),
  is_relevant: z.boolean(),
  strength: z.enum(['proof', 'strong', 'context', 'weak']).optional(),
  // Optional direct score override (for AI agents)
  score_override: z.number().min(-1).max(1).optional(),
  weight: z.number().min(0).max(10).optional().default(1.0),
})

const linkageQuerySchema = z.object({
  argument_id: z.string().min(1, 'Argument ID is required'),
})

// ─── POST: Submit a linkage vote via diagnostic wizard ──────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const belief = getSchilchtBelief(id)
  if (!belief) {
    return NextResponse.json(
      { error: 'Belief not found', beliefId: id },
      { status: 404 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const parsed = linkageVoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Find the argument in the belief tree
  const allArgs = [...belief.proTree, ...belief.conTree]
  const argument = findArgumentById(allArgs, data.argument_id)
  if (!argument) {
    return NextResponse.json(
      { error: 'Argument not found', argumentId: data.argument_id },
      { status: 404 }
    )
  }

  // Calculate score from diagnostic wizard
  const diagnostic: LinkageDiagnostic = {
    direction: data.direction,
    isRelevant: data.is_relevant,
    strength: data.strength,
  }

  const { score: diagnosticScore, classification } =
    calculateLinkageFromDiagnostic(diagnostic)

  // Use override score if provided (for AI agents), otherwise use diagnostic
  const finalScore = data.score_override ?? diagnosticScore

  // Create the vote
  const vote: LinkageVote = {
    userId: data.user_id,
    score: finalScore,
    weight: data.weight,
    diagnostic,
    createdAt: new Date().toISOString(),
  }

  // Add vote to argument (initialize array if needed)
  if (!argument.linkageVotes) {
    argument.linkageVotes = []
  }

  // Replace existing vote from same user, or add new
  const existingIdx = argument.linkageVotes.findIndex(
    (v) => v.userId === data.user_id
  )
  if (existingIdx >= 0) {
    argument.linkageVotes[existingIdx] = vote
  } else {
    argument.linkageVotes.push(vote)
  }

  // Update the classification
  argument.linkageClassification = classification

  // Recalculate the aggregate linkage score
  const aggregated = aggregateLinkageVotes(argument.linkageVotes)
  if (aggregated !== null) {
    argument.linkageScore = aggregated
  }

  // Check for warnings
  const warnings = detectNonSequitur(argument)
  const needsAssumption = shouldPromptForAssumption(argument)

  // Recalculate belief scores
  const breakdown = scoreProtocolBelief(belief)

  return NextResponse.json(
    {
      success: true,
      argument_id: data.argument_id,
      linkage: {
        score: resolveLinkageScore(argument),
        classification,
        voteCount: argument.linkageVotes.length,
        aggregatedScore: aggregated,
      },
      warnings: {
        isNonSequitur: warnings.isNonSequitur,
        isTrueButIrrelevant: warnings.isTrueButIrrelevant,
        message: warnings.warningMessage,
        needsAssumption,
        assumptionPrompt: needsAssumption
          ? 'Is there a missing Assumption that would connect these two ideas? You can insert an intermediate Belief to repair the linkage chain.'
          : null,
      },
      updated_metrics: {
        truthScore: breakdown.truthScore,
        confidenceInterval: breakdown.confidenceInterval,
      },
    },
    { status: 200 }
  )
}

// ─── GET: Get linkage details for an argument ───────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const belief = getSchilchtBelief(id)
  if (!belief) {
    return NextResponse.json(
      { error: 'Belief not found', beliefId: id },
      { status: 404 }
    )
  }

  const url = new URL(request.url)
  const argumentId = url.searchParams.get('argument_id')

  if (!argumentId) {
    // Return linkage overview for all arguments
    const allArgs = [...belief.proTree, ...belief.conTree]
    const linkageOverview = allArgs.map((arg) => {
      const resolvedScore = resolveLinkageScore(arg)
      const classification =
        arg.linkageClassification ?? classifyLinkageScore(resolvedScore)
      const warnings = detectNonSequitur(arg)
      const needsAssumption = shouldPromptForAssumption(arg)

      return {
        argumentId: arg.id,
        claim: arg.claim,
        side: arg.side,
        linkage: {
          score: resolvedScore,
          classification,
          voteCount: arg.linkageVotes?.length ?? 0,
        },
        truthScore: arg.truthScore,
        warnings: {
          isNonSequitur: warnings.isNonSequitur,
          isTrueButIrrelevant: warnings.isTrueButIrrelevant,
          message: warnings.warningMessage,
          needsAssumption,
        },
      }
    })

    return NextResponse.json({
      beliefId: id,
      arguments: linkageOverview,
    })
  }

  // Return detailed linkage info for a specific argument
  const allArgs = [...belief.proTree, ...belief.conTree]
  const argument = findArgumentById(allArgs, argumentId)
  if (!argument) {
    return NextResponse.json(
      { error: 'Argument not found', argumentId },
      { status: 404 }
    )
  }

  const resolvedScore = resolveLinkageScore(argument)
  const classification =
    argument.linkageClassification ?? classifyLinkageScore(resolvedScore)
  const warnings = detectNonSequitur(argument)
  const needsAssumption = shouldPromptForAssumption(argument)

  return NextResponse.json({
    argumentId: argument.id,
    claim: argument.claim,
    side: argument.side,
    truthScore: argument.truthScore,
    linkage: {
      score: resolvedScore,
      classification,
      votes: argument.linkageVotes ?? [],
      voteCount: argument.linkageVotes?.length ?? 0,
      hasDebate: !!argument.linkageDebate,
    },
    warnings: {
      isNonSequitur: warnings.isNonSequitur,
      isTrueButIrrelevant: warnings.isTrueButIrrelevant,
      message: warnings.warningMessage,
      needsAssumption,
      assumptionPrompt: needsAssumption
        ? 'Is there a missing Assumption that would connect these two ideas? You can insert an intermediate Belief to repair the linkage chain.'
        : null,
    },
    formula: {
      description: 'Net Weight = Truth Score x Linkage Score x Importance',
      truthScore: argument.truthScore,
      linkageScore: resolvedScore,
      importanceScore: argument.importanceScore ?? 1.0,
      netWeight:
        argument.truthScore *
        resolvedScore *
        (argument.importanceScore ?? 1.0),
    },
  })
}

// ─── Helpers ────────────────────────────────────────────────────

/** Recursively find an argument by ID in the argument tree */
function findArgumentById(
  args: import('@/core/types/schlicht').SchilchtArgument[],
  id: string
): import('@/core/types/schlicht').SchilchtArgument | undefined {
  for (const arg of args) {
    if (arg.id === id) return arg
    if (arg.subArguments) {
      const found = findArgumentById(arg.subArguments, id)
      if (found) return found
    }
  }
  return undefined
}
