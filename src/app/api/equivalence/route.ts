import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/equivalence
 * List all equivalence analyses, ordered by score descending.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const verdict = searchParams.get('verdict')
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  const where = verdict ? { verdict } : {}

  const [analyses, total] = await Promise.all([
    prisma.equivalenceAnalysis.findMany({
      where,
      orderBy: { finalEquivalenceScore: 'desc' },
      take: Math.min(limit, 200),
      skip: offset,
      select: {
        id: true,
        slug: true,
        beliefXRaw: true,
        beliefYRaw: true,
        finalEquivalenceScore: true,
        verdict: true,
        canonicalPage: true,
        analystType: true,
        confidence: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.equivalenceAnalysis.count({ where }),
  ])

  return NextResponse.json({ analyses, total, limit, offset })
}

/**
 * POST /api/equivalence
 * Create a new equivalence analysis.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      slug,
      beliefXRaw,
      beliefYRaw,
      beliefXNormalized,
      beliefYNormalized,
      beliefXSource,
      beliefYSource,
      analystType = 'human',
      confidence = 'medium',
      triggerReason,
    } = body

    if (!slug || !beliefXRaw || !beliefYRaw) {
      return NextResponse.json(
        { error: 'slug, beliefXRaw, and beliefYRaw are required' },
        { status: 400 }
      )
    }

    const analysis = await prisma.equivalenceAnalysis.create({
      data: {
        slug,
        beliefXRaw,
        beliefYRaw,
        beliefXNormalized: beliefXNormalized ?? null,
        beliefYNormalized: beliefYNormalized ?? null,
        beliefXSource: beliefXSource ?? null,
        beliefYSource: beliefYSource ?? null,
        analystType,
        confidence,
        triggerReason: triggerReason ?? null,
      },
    })

    return NextResponse.json({ analysis }, { status: 201 })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return NextResponse.json(
        { error: 'An analysis with that slug already exists' },
        { status: 409 }
      )
    }
    console.error('POST /api/equivalence error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
