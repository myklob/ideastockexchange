import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const FULL_INCLUDE = {
  synonymClaims: true,
  semanticMapEntries: { orderBy: { sortOrder: 'asc' as const } },
  normalizationReasons: true,
  structuralReasons: true,
  triggerReasons: true,
  verdictReasons: true,
  argumentBattleItems: true,
  networkPositions: true,
} as const

/**
 * GET /api/equivalence/[slug]
 * Fetch a single equivalence analysis by slug.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const analysis = await prisma.equivalenceAnalysis.findUnique({
    where: { slug },
    include: FULL_INCLUDE,
  })

  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
  }

  return NextResponse.json({ analysis })
}

/**
 * PUT /api/equivalence/[slug]
 * Update an existing equivalence analysis.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const body = await request.json()

    // Remove read-only fields before update
    const { id: _id, slug: _slug, createdAt: _c, updatedAt: _u, ...updateData } = body

    const analysis = await prisma.equivalenceAnalysis.update({
      where: { slug },
      data: updateData,
      include: FULL_INCLUDE,
    })

    return NextResponse.json({ analysis })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }
    console.error('PUT /api/equivalence/[slug] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/equivalence/[slug]
 * Delete an equivalence analysis and all related records.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    await prisma.equivalenceAnalysis.delete({ where: { slug } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }
    console.error('DELETE /api/equivalence/[slug] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
