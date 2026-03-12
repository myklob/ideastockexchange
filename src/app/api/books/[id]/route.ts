import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Note: These routes depend on the Book model which requires PostgreSQL schema.
// Using 'any' cast for now until schema is fully migrated.
const db = prisma as any

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const book = await db.book.findUnique({
      where: { id },
      include: {
        claims: true,
        topicOverlaps: true,
        fallacies: true,
        contradictions: true,
        evidenceItems: true,
        metaphors: true,
        predictions: true,
        authorProfile: true,
      },
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error('Error fetching book:', error)
    return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const book = await db.book.update({
      where: { id },
      data: {
        title: body.title,
        author: body.author,
        isbn: body.isbn,
        publishYear: body.publishYear,
        description: body.description,
        coverImage: body.coverImage,
        logicalValidityScore: body.logicalValidityScore,
        qualityScore: body.qualityScore,
        salesCount: body.salesCount,
        citationCount: body.citationCount,
        socialShares: body.socialShares,
      },
    })

    return NextResponse.json(book)
  } catch (error) {
    console.error('Error updating book:', error)
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.book.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting book:', error)
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 })
  }
}
