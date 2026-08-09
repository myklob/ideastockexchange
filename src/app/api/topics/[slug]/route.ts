import { NextResponse } from 'next/server'
import { fetchTopicBySlug } from '@/features/topics/data/fetch-topics'
import {
  sortTopicBeliefs,
  type SortDir,
  type TopicSortKey,
} from '@/features/topics/lib/dimensions'

const SORT_KEYS: TopicSortKey[] = ['direction', 'magnitude', 'abstraction', 'score', 'grounding']

/**
 * GET /api/topics/[slug]
 *
 * One topic hub with its full belief set. Each belief carries its coordinates
 * on the three dimensions (direction / magnitude / abstraction) plus the
 * engine-computed score and evidence grounding.
 *
 * Query params:
 *   sortBy  — 'direction' | 'magnitude' | 'abstraction' | 'score' | 'grounding'
 *             (default 'score': best-supported first)
 *   sortDir — 'asc' | 'desc' (default: the dimension's natural reading order)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const topic = await fetchTopicBySlug(decodeURIComponent(slug))
  if (!topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
  }

  const sp = new URL(request.url).searchParams
  const rawSort = sp.get('sortBy')
  const sortBy: TopicSortKey = SORT_KEYS.includes(rawSort as TopicSortKey)
    ? (rawSort as TopicSortKey)
    : 'score'
  const rawDir = sp.get('sortDir')
  const sortDir: SortDir | undefined =
    rawDir === 'asc' || rawDir === 'desc' ? rawDir : undefined

  const beliefs = sortTopicBeliefs(topic.beliefs, sortBy, sortDir)

  return NextResponse.json({
    topic: {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      question: topic.question,
      description: topic.description,
      parent_topics: topic.parents,
      child_topics: topic.children,
      debate_topic_slug: topic.debateTopicSlug,
    },
    sort: { by: sortBy, dir: sortDir ?? 'natural' },
    beliefs: beliefs.map(b => ({
      belief_id: b.id,
      slug: b.slug,
      statement: b.statement,
      direction: b.positivity,
      magnitude: b.claimStrength,
      abstraction: b.specificity,
      score: b.positivity,
      grounding: b.groundingScore,
    })),
    grouped_duplicates: topic.similarPairs.map(p => ({
      from_slug: p.fromSlug,
      to_slug: p.toSlug,
      equivalency_score: p.equivalencyScore,
    })),
  })
}
