import { NextRequest, NextResponse } from 'next/server';
import { getDebateTopic } from '@/features/debate-topics/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const topic = await getDebateTopic(slug);
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }
    return NextResponse.json(topic);
  } catch (error) {
    console.error('[GET /api/debate-topics/[slug]]', error);
    return NextResponse.json({ error: 'Failed to fetch debate topic' }, { status: 500 });
  }
}
