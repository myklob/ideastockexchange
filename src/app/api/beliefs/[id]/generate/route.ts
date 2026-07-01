/**
 * AI section generation for a belief page.
 *
 * POST /api/beliefs/[id]/generate
 *   Body (optional): {
 *     "sections": ["objective-criteria", "arguments"],   // default: both
 *     "maxArgumentsPerSide": 3
 *   }
 *
 * Generates objective criteria (with quality-dimension scores) and/or
 * steel-manned arguments for both sides. Arguments are created as child
 * beliefs joined by Argument edges and scored through the same ReasonRank
 * propagation as human submissions.
 *
 * Requires a configured AI provider (AI_PROVIDER / AI_API_KEY / AI_MODEL);
 * responds 503 with setup instructions when unconfigured.
 *
 * GET returns configuration status without generating anything.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  isAIConfigured,
  generateObjectiveCriteria,
  generateArguments,
} from '@/features/belief-analysis/ai-belief-generator'

export const dynamic = 'force-dynamic'

const VALID_SECTIONS = ['objective-criteria', 'arguments'] as const
type Section = (typeof VALID_SECTIONS)[number]

export async function GET() {
  const status = isAIConfigured()
  return NextResponse.json({
    aiConfigured: status.configured,
    ...(status.reason ? { reason: status.reason } : {}),
    provider: process.env.AI_PROVIDER || 'ollama',
    model: process.env.AI_MODEL || 'llama3',
    note: 'POST to this endpoint to generate objective criteria and/or arguments.',
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const beliefId = parseInt(id, 10)
  if (isNaN(beliefId)) {
    return NextResponse.json({ error: 'Invalid belief ID' }, { status: 400 })
  }

  const status = isAIConfigured()
  if (!status.configured) {
    return NextResponse.json(
      { error: 'AI provider not configured', detail: status.reason },
      { status: 503 },
    )
  }

  const belief = await prisma.belief.findUnique({
    where: { id: beliefId },
    select: { id: true, slug: true },
  })
  if (!belief) {
    return NextResponse.json({ error: 'Belief not found' }, { status: 404 })
  }

  let sections: Section[] = [...VALID_SECTIONS]
  let maxArgumentsPerSide = 3
  try {
    const body = await request.json()
    if (Array.isArray(body?.sections)) {
      const requested = body.sections.filter((s: unknown): s is Section =>
        VALID_SECTIONS.includes(s as Section),
      )
      if (requested.length > 0) sections = requested
    }
    if (
      typeof body?.maxArgumentsPerSide === 'number' &&
      body.maxArgumentsPerSide >= 1 &&
      body.maxArgumentsPerSide <= 10
    ) {
      maxArgumentsPerSide = Math.floor(body.maxArgumentsPerSide)
    }
  } catch {
    // No/invalid JSON body — generate both sections with defaults.
  }

  try {
    const result: Record<string, unknown> = { beliefId, slug: belief.slug }
    if (sections.includes('objective-criteria')) {
      result.objectiveCriteria = await generateObjectiveCriteria(beliefId)
    }
    if (sections.includes('arguments')) {
      result.arguments = await generateArguments(beliefId, maxArgumentsPerSide)
    }
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[POST /api/beliefs/[id]/generate]', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Generation failed', detail: msg },
      { status: 502 },
    )
  }
}
