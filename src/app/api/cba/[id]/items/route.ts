import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCBA, addLineItem } from '@/features/cost-benefit-analysis/data/cba-data'
import { CBALineItem, LikelihoodBelief, LikelihoodEstimate } from '@/core/types/cba'

const lineItemSchema = z.object({
  type: z.enum(['benefit', 'cost'], {
    errorMap: () => ({ message: 'Type must be "benefit" or "cost"' }),
  }),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or fewer'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be 5000 characters or fewer'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must be 50 characters or fewer'),
  predicted_impact: z
    .number()
    .positive('Predicted impact must be positive'),
  initial_likelihood: z
    .number()
    .min(1, 'Likelihood must be at least 1%')
    .max(99, 'Likelihood must be at most 99%'),
  likelihood_reasoning: z
    .string()
    .min(1, 'Likelihood reasoning is required')
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const cba = getCBA(id)
  if (!cba) {
    return NextResponse.json(
      { error: 'Cost-benefit analysis not found', id },
      { status: 404 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = lineItemSchema.safeParse(body)
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
  const now = new Date().toISOString()
  const itemId = `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const estimateId = `est-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const beliefId = `lb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

  const probability = data.initial_likelihood / 100
  const impactValue = data.type === 'cost' ? -data.predicted_impact : data.predicted_impact

  // Create the initial likelihood estimate
  const initialEstimate: LikelihoodEstimate = {
    id: estimateId,
    probability,
    label: `${data.initial_likelihood}%`,
    reasoning: data.likelihood_reasoning,
    proArguments: [],
    conArguments: [],
    reasonRankScore: 0.5,
    isActive: true,
    contributor: {
      type: data.contributor_type,
      name: data.contributor_name,
      submittedAt: now,
    },
  }

  // Create the likelihood belief (nested belief node)
  const likelihoodBelief: LikelihoodBelief = {
    id: beliefId,
    statement: `What is the probability that "${data.title}" will materialize as projected?`,
    estimates: [initialEstimate],
    activeLikelihood: probability,
    status: 'emerging',
    adversarialCycles: 0,
    confidenceInterval: 0.15,
    protocolLog: [],
  }

  // Create the line item
  const lineItem: CBALineItem = {
    id: itemId,
    type: data.type,
    title: data.title,
    description: data.description,
    category: data.category,
    predictedImpact: impactValue,
    likelihoodBelief,
    expectedValue: impactValue * probability,
    contributor: {
      type: data.contributor_type,
      name: data.contributor_name,
      submittedAt: now,
    },
  }

  const result = addLineItem(id, lineItem)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Failed to add line item' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      success: true,
      item: lineItem,
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  return NextResponse.json(
    {
      endpoint: `POST /api/cba/${id}/items`,
      description:
        'Add a new cost or benefit line item to this analysis. The initial likelihood estimate becomes the first competing probability claim.',
      schema: {
        type: '"benefit" | "cost" (required)',
        title: 'string (required, max 200)',
        description: 'string (required, max 5000)',
        category: 'string (required) - e.g., "Economic", "Social", "Environmental", "Political"',
        predicted_impact: 'number (required, positive) - Dollar value of the impact',
        initial_likelihood: 'number 1-99 (required) - Your initial probability estimate (%)',
        likelihood_reasoning: 'string (required, max 2000) - Why you believe this probability',
        contributor_name: 'string (required, max 200)',
        contributor_type: '"human" | "ai" (required)',
      },
      example: {
        type: 'benefit',
        title: 'Reduced commute times for daily commuters',
        description: 'New bridge eliminates 15-minute detour. At $25/hr value of time, this produces $4.5M/year in savings.',
        category: 'Economic',
        predicted_impact: 4500000,
        initial_likelihood: 75,
        likelihood_reasoning: 'Three independent traffic models converge on 12-18 minute savings.',
        contributor_name: 'City Planning Department',
        contributor_type: 'human',
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
