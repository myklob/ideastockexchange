import { NextResponse } from 'next/server';
import { arbitrageRows } from '@/lib/data';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const minDivergence = parseFloat(searchParams.get('minDiv') ?? '0');
  const rows = arbitrageRows.filter(r => Math.abs(r.reasonRank - r.marketPrice) >= minDivergence);
  return NextResponse.json(rows);
}
