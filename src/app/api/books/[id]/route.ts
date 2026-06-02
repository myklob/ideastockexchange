import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Note: These routes depend on the Book model which requires PostgreSQL schema.
// Typed as an extended client until the Book schema is migrated.
interface BookModelClient {
  findUnique(args: Record<string, unknown>): Promise<Record<string, unknown> | null>
  update(args: Record<string, unknown>): Promise<Record<string, unknown>>
  delete(args: Record<string, unknown>): Promise<void>
}
type BookPrismaClient = typeof prisma & { book: BookModelClient }
const db = prisma as unknown as BookPrismaClient

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
