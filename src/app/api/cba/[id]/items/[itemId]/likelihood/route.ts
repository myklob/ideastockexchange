import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCBA, addLikelihoodArgument, addLikelihoodEstimate } from '@/features/cost-benefit-analysis/data/cba-data'
import { SchilchtArgument } from '@/core/types/schlicht'
import { LikelihoodEstimate } from '@/core/types/cba'
import { calculateArgumentImpact, scoreLikelihoodEstimate } from '@/core/scoring/scoring-engine'

const argumentSchema = z.object({
  estimate_id: z
    .string()
    .min(1, 'Estimate ID is required'),
  claim: z
    .string()
    .min(1, 'Claim is required')
    .max(500, 'Claim must be 500 characters or fewer'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be 5000 characters or fewer'),
  side: z.enum(['pro', 'con'], {
    errorMap: () => ({ message: 'Side must be "pro" or "con"' }),
  }),
  contributor_name: z
    .string()
    .min(1, 'Contributor name is required')
    .max(200, 'Name must be 200 characters or fewer'),
  contributor_type: z.enum(['human', 'ai'], {
    errorMap: () => ({ message: 'Contributor type must be "human" or "ai"' }),
  }),
  truth_score: z.number().min(0).max(100).optional().default(50),
  linkage_score: z.number().min(0).max(100).optional().default(50),
  importance_score: z.number().min(0).max(100).optional().default(100),
})

const newEstimateSchema = z.object({
  probability: z
    .number()
    .min(1, 'Probability must be at least 1%')
    .max(99, 'Probability must be at most 99%'),
  reasoning: z
    .string()
    .min(1, 'Reasoning is required')
    .max(2000, 'Reasoning must be 2000 characters or fewer'),
  contributor_name: z
    .string()
    .min(1, 'Contributor name is required')
    .max(200, 'Name must be 200 characters or fewer'),
  contributor_type: z.enum(['human', 'ai'], {
    errorMap: () => ({ message: 'Contributor type must be "human" or "ai"' }),
  }),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params

  const cba = getCBA(id)
  if (!cba) {
    return NextResponse.json(
      { error: 'Cost-benefit analysis not found', id },
      { status: 404 }
    )
  }

  const item = cba.items.find((i) => i.id === itemId)
  if (!item) {
    return NextResponse.json(
      { error: 'Line item not found', itemId },
      { status: 404 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Try parsing as argument first
  const argParsed = argumentSchema.safeParse(body)
  if (argParsed.success) {
    const data = argParsed.data
    const now = new Date().toISOString()
    const argId = `arg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

    const truthNormalized = data.truth_score / 100
    const linkageNormalized = data.linkage_score / 100
    const importanceNormalized = data.importance_score / 100
    const impactScore = calculateArgumentImpact(truthNormalized, linkageNormalized, data.side, importanceNormalized)

    const argument: SchilchtArgument = {
      id: argId,
      claim: data.claim,
      description: data.description,
      side: data.side,
      truthScore: truthNormalized,
      linkageScore: linkageNormalized,
      importanceScore: importanceNormalized,
      impactScore,
      certifiedBy: ['Pending-Review'],
      fallaciesDetected: [],
      contributor: {
        type: data.contributor_type,
        name: data.contributor_name,
        submittedAt: now,
      },
    }

    const result = addLikelihoodArgument(id, itemId, data.estimate_id, argument)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to add argument. Check that the estimate ID is valid.' },
        { status: 400 }
      )
    }

    // Find updated item
    const updatedItem = result.cba!.items.find((i) => i.id === itemId)

    return NextResponse.json(
      {
        success: true,
        argument,
        updated_likelihood: updatedItem
          ? {
              activeLikelihood: updatedItem.likelihoodBelief.activeLikelihood,
              status: updatedItem.likelihoodBelief.status,
              expectedValue: updatedItem.expectedValue,
            }
          : null,
        cba_summary: {
          totalExpectedBenefits: result.cba!.totalExpectedBenefits,
          totalExpectedCosts: result.cba!.totalExpectedCosts,
          netExpectedValue: result.cba!.netExpectedValue,
        },
      },
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-Protocol': 'cba-v1',
        },
      }
    )
  }

  // Try parsing as new estimate
  const estParsed = newEstimateSchema.safeParse(body)
  if (estParsed.success) {
    const data = estParsed.data
    const now = new Date().toISOString()
    const estId = `est-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

    const estimate: LikelihoodEstimate = {
      id: estId,
      probability: data.probability / 100,
      label: `${data.probability}%`,
      reasoning: data.reasoning,
      proArguments: [],
      conArguments: [],
      reasonRankScore: 0.5,
      isActive: false,
      contributor: {
        type: data.contributor_type,
        name: data.contributor_name,
        submittedAt: now,
      },
    }

    const result = addLikelihoodEstimate(id, itemId, estimate)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to add estimate' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        estimate,
        message: 'New probability estimate added. Submit arguments to build its ReasonRank score.',
      },
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-Protocol': 'cba-v1',
        },
      }
    )
  }

  // Neither parsed
  return NextResponse.json(
    {
      error: 'Validation failed. Body must be either an argument or a new estimate.',
      argument_schema: {
        estimate_id: 'string (required) - ID of the estimate to argue about',
        claim: 'string (required, max 500)',
        description: 'string (required, max 5000)',
        side: '"pro" | "con"',
        contributor_name: 'string (required)',
        contributor_type: '"human" | "ai"',
        truth_score: 'number 0-100 (optional, default 50) - Is the evidence factually accurate?',
        linkage_score: 'number 0-100 (optional, default 50) - How strongly does this connect to the prediction?',
        importance_score: 'number 0-100 (optional, default 100) - How much does this argument move the probability?',
      },
      estimate_schema: {
        probability: 'number 1-99 (required) - Your probability estimate (%)',
        reasoning: 'string (required, max 2000)',
        contributor_name: 'string (required)',
        contributor_type: '"human" | "ai"',
      },
    },
    { status: 400 }
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params

  return NextResponse.json(
    {
      endpoint: `POST /api/cba/${id}/items/${itemId}/likelihood`,
      description:
        'Submit an argument for/against a likelihood estimate, or propose a new competing probability estimate.',
      usage: {
        submit_argument: {
          description: 'Argue for or against an existing probability estimate. Arguments are scored on three metrics: Truth (factual accuracy), Linkage (relevance to this prediction), and Importance (how much it moves the probability).',
          schema: {
            estimate_id: 'string (required)',
            claim: 'string (required, max 500)',
            description: 'string (required, max 5000)',
            side: '"pro" | "con"',
            contributor_name: 'string (required)',
            contributor_type: '"human" | "ai"',
            truth_score: 'number 0-100 (optional) - Is the evidence factually accurate?',
            linkage_score: 'number 0-100 (optional) - How strongly does this connect to the prediction?',
            importance_score: 'number 0-100 (optional) - How much does this argument move the probability?',
          },
        },
        propose_estimate: {
          description: 'Propose a new competing probability estimate',
          schema: {
            probability: 'number 1-99',
            reasoning: 'string (required)',
            contributor_name: 'string (required)',
            contributor_type: '"human" | "ai"',
          },
        },
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Protocol': 'cba-v1',
      },
    }
  )
}
