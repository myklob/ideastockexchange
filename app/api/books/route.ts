import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAllBooksWithScores } from '@/lib/services/bookService'

export async function GET() {
  try {
    const books = await getAllBooksWithScores()
    return NextResponse.json(books)
  } catch (error) {
    console.error('Error fetching books:', error)
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const book = await prisma.book.create({
      data: {
        title: body.title,
        author: body.author,
        isbn: body.isbn,
        publishYear: body.publishYear,
        description: body.description,
        coverImage: body.coverImage,
        logicalValidityScore: body.logicalValidityScore || 0,
        qualityScore: body.qualityScore || 0,
        beliefImpactWeight: body.beliefImpactWeight || 0,
        salesCount: body.salesCount || 0,
        citationCount: body.citationCount || 0,
        socialShares: body.socialShares || 0,
      },
    })

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    console.error('Error creating book:', error)
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 })
  }
}
