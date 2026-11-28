import { NextResponse } from 'next/server'
import { fetchAllTopics } from '@/features/topics/data/fetch-topics'

/**
 * GET /api/topics
 *
 * The topic-hub index (One Page Per Topic): every topic with its belief count
 * and the positivity range its beliefs span.
 */
export async function GET() {
  const topics = await fetchAllTopics()
  return NextResponse.json({
    topics: topics.map(t => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      question: t.question,
      description: t.description,
      belief_count: t.beliefCount,
      positivity_range:
        t.minPositivity !== null && t.maxPositivity !== null
          ? { min: t.minPositivity, max: t.maxPositivity }
          : null,
    })),
  })
}
