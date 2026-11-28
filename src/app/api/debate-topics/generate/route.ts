import { NextRequest, NextResponse } from 'next/server';
import { createDebateTopic } from '@/features/debate-topics/db';
import { generateDebateTopicData } from '@/features/debate-topics/ai-generator';
import type { GenerateDebateTopicRequest } from '@/core/types/debate-topic';
import { aiGenerationEnabled, aiProviderConfigured, guardPublicWrite } from '@/lib/public-guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_TOPIC_NAME_CHARS = 200;
const GENERATIONS_PER_MINUTE = 3;

/** GET — whether this deployment generates topics, so the UI can say so up front. */
export async function GET() {
  return NextResponse.json({ enabled: aiGenerationEnabled() && aiProviderConfigured() });
}

export async function POST(request: NextRequest) {
  if (!aiGenerationEnabled()) {
    return NextResponse.json(
      { error: 'AI topic generation is disabled on this deployment. Set AI_GENERATION_ENABLED=1 to enable it.' },
      { status: 503 },
    );
  }
  if (!aiProviderConfigured()) {
    return NextResponse.json({ error: 'No AI provider is configured on this deployment.' }, { status: 503 });
  }
  const blocked = guardPublicWrite(request, 'debate-topics-generate', GENERATIONS_PER_MINUTE);
  if (blocked) return blocked;

  try {
    const body: GenerateDebateTopicRequest = await request.json();
    const topicName = body.topicName?.trim();
    if (!topicName) {
      return NextResponse.json({ error: 'topicName is required' }, { status: 400 });
    }
    if (topicName.length > MAX_TOPIC_NAME_CHARS) {
      return NextResponse.json({ error: `topicName is capped at ${MAX_TOPIC_NAME_CHARS} characters` }, { status: 422 });
    }

    const topicData = await generateDebateTopicData(topicName, body.categoryPath);
    const saved = await createDebateTopic(topicData);

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('[POST /api/debate-topics/generate]', error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'A topic with that slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to generate debate topic.' }, { status: 500 });
  }
}
