import { NextResponse } from 'next/server'
import { getBookAnalysisReport } from '@/features/books/services/book-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const report = await getBookAnalysisReport(id)

    if (!report) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error generating analysis report:', error)
    return NextResponse.json({ error: 'Failed to generate analysis report' }, { status: 500 })
  }
}
