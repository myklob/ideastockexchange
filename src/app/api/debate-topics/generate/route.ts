import { NextRequest, NextResponse } from 'next/server';
import { createDebateTopic } from '@/features/debate-topics/db';
import { generateDebateTopicData } from '@/features/debate-topics/ai-generator';
import type { GenerateDebateTopicRequest } from '@/core/types/debate-topic';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateDebateTopicRequest = await request.json();

    if (!body.topicName?.trim()) {
      return NextResponse.json({ error: 'topicName is required' }, { status: 400 });
    }

    const topicData = await generateDebateTopicData(body.topicName, body.categoryPath);
    const saved = await createDebateTopic(topicData);

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('[POST /api/debate-topics/generate]', error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'A topic with that slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: msg || 'Failed to generate debate topic' }, { status: 500 });
  }
}
