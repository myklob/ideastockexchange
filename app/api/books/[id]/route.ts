import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getBookAnalysisReport } from '@/lib/services/bookService'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const book = await prisma.book.findUnique({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const book = await prisma.book.update({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    await prisma.book.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting book:', error)
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 })
  }
}
