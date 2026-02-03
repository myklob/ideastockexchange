import { NextResponse } from 'next/server'
import { getCBA } from '@/lib/data/cba-data'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cba = getCBA(id)

  if (!cba) {
    return NextResponse.json(
      { error: 'Cost-benefit analysis not found', id },
      { status: 404 }
    )
  }

  return NextResponse.json(cba, {
    headers: {
      'Content-Type': 'application/json',
      'X-Protocol': 'cba-v1',
    },
  })
}
