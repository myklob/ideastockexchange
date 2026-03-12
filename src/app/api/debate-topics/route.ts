import { NextRequest, NextResponse } from 'next/server';
import { listDebateTopics, createDebateTopic } from '@/features/debate-topics/db';
import type { DebateTopic } from '@/core/types/debate-topic';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const topics = await listDebateTopics();
    return NextResponse.json(topics);
  } catch (error) {
    console.error('[GET /api/debate-topics]', error);
    return NextResponse.json({ error: 'Failed to fetch debate topics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DebateTopic = await request.json();

    if (!body.slug || !body.title || !body.definition) {
      return NextResponse.json({ error: 'slug, title, and definition are required' }, { status: 400 });
    }

    const topic = await createDebateTopic(body);
    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error('[POST /api/debate-topics]', error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'A topic with that slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create debate topic' }, { status: 500 });
  }
}
