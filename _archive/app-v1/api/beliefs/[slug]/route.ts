import { NextResponse } from 'next/server';
import { getBelief } from '@/lib/data';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const belief = getBelief(params.slug);
  if (!belief) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(belief);
}
