import { NextResponse } from 'next/server'
import { getBookAnalysisReport } from '@/lib/services/bookService'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const report = await getBookAnalysisReport(params.id)

    if (!report) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error generating analysis report:', error)
    return NextResponse.json({ error: 'Failed to generate analysis report' }, { status: 500 })
  }
}
