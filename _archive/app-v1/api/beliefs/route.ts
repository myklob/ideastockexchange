import { NextResponse } from 'next/server';
import { beliefs } from '@/lib/data';

export async function GET() {
  const summary = beliefs.map(b => ({
    slug: b.slug,
    statement: b.statement,
    reasonRank: b.reasonRank,
    marketPrice: b.marketPrice,
    volume: b.volume,
    signal: b.reasonRank > b.marketPrice ? 'UNDER' : 'OVER',
  }));
  return NextResponse.json(summary);
}
