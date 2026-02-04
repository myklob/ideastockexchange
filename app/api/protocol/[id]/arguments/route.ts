import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSchilchtBelief, addArgumentToBelief } from '@/lib/data/schlicht-data'
import { SchilchtArgument } from '@/lib/types/schlicht'
import { calculateArgumentImpact } from '@/lib/scoring-engine'

const argumentSchema = z.object({
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
    .max(200, 'Contributor name must be 200 characters or fewer'),
  contributor_type: z.enum(['human', 'ai'], {
    errorMap: () => ({
      message: 'Contributor type must be "human" or "ai"',
    }),
  }),
  truth_score: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .default(50),
  linkage_score: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .default(50),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify belief exists
  const belief = getSchilchtBelief(id)
  if (!belief) {
    return NextResponse.json(
      { error: 'Belief not found', beliefId: id },
      { status: 404 }
    )
  }

  // Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const parsed = argumentSchema.safeParse(body)
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
  const argId = `arg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

  // Use the unified scoring engine for impact calculation
  const truthNormalized = data.truth_score / 100
  const linkageNormalized = data.linkage_score / 100
  const impactScore = calculateArgumentImpact(truthNormalized, linkageNormalized, data.side)

  const argument: SchilchtArgument = {
    id: argId,
    claim: data.claim,
    description: data.description,
    side: data.side,
    truthScore: truthNormalized,
    linkageScore: linkageNormalized,
    impactScore,
    certifiedBy: ['Pending-Review'],
    fallaciesDetected: [],
    contributor: {
      type: data.contributor_type,
      name: data.contributor_name,
      submittedAt: now,
    },
  }

  // Add to in-memory store — triggers recalculation via the unified scoring engine
  const result = addArgumentToBelief(id, argument)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Failed to add argument' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      success: true,
      argument,
      protocol_log_entry: result.logEntry
        ? {
            id: result.logEntry.id,
            timestamp: result.logEntry.timestamp,
            agent: result.logEntry.agentName,
            content: result.logEntry.content,
          }
        : null,
      // Return updated belief metrics (computed by the unified scoring engine)
      updated_metrics: result.belief
        ? {
            truthScore: result.belief.metrics.truthScore,
            confidenceInterval: result.belief.metrics.confidenceInterval,
            volatility: result.belief.metrics.volatility,
            status: result.belief.status,
            adversarialCycles: result.belief.metrics.adversarialCycles,
          }
        : null,
      // Return the full score breakdown so clients can inspect the math
      score_breakdown: result.breakdown
        ? {
            proArgumentStrength: result.breakdown.proArgumentStrength,
            conArgumentStrength: result.breakdown.conArgumentStrength,
            evidenceScore: result.breakdown.evidenceScore,
            linkageScore: result.breakdown.linkageScore,
            proArgumentCount: result.breakdown.proArgumentCount,
            conArgumentCount: result.breakdown.conArgumentCount,
          }
        : null,
    },
    {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'X-Protocol': 'schlicht-v1',
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
      endpoint: `POST /api/protocol/${id}/arguments`,
      description:
        'Submit a new argument to this belief. Both humans and AIs can participate.',
      schema: {
        claim: 'string (required, max 500) - Short title for the argument',
        description:
          'string (required, max 5000) - Full reasoning with evidence',
        side: '"pro" | "con" (required) - Whether this supports or opposes the belief',
        contributor_name:
          'string (required, max 200) - Name of the human or AI submitting',
        contributor_type:
          '"human" | "ai" (required) - Type of contributor',
        truth_score:
          'number 0-100 (optional, default 50) - Self-assessed truth confidence',
        linkage_score:
          'number 0-100 (optional, default 50) - How directly this relates to the belief',
      },
      example: {
        claim: 'Federated Learning Enables Privacy-Preserving Verification',
        description:
          'Recent advances in federated learning allow multiple AI agents to collaboratively verify claims without sharing underlying training data.',
        side: 'pro',
        contributor_name: 'Claude-3.5-Sonnet',
        contributor_type: 'ai',
        truth_score: 78,
        linkage_score: 72,
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Protocol': 'schlicht-v1',
      },
    }
  )
}
