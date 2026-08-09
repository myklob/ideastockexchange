import { NextResponse } from 'next/server'
import { fetchTopicBySlug } from '@/features/topics/data/fetch-topics'
import {
  parseSortDir,
  parseTopicSortKey,
  sortTopicBeliefs,
} from '@/features/topics/lib/dimensions'

/**
 * GET /api/topics/[slug]
 *
 * One topic hub with its full belief set. Each belief carries its coordinates
 * on the three dimensions (direction / magnitude / abstraction) plus the
 * engine-computed score and evidence grounding.
 *
 * Query params:
 *   sortBy  — 'direction' | 'magnitude' | 'abstraction' | 'score' | 'grounding'
 *             (default 'score': best-supported first, ranked by |score| so a
 *             strongly supported negative claim outranks a weakly supported
 *             positive one; the signed value is the direction axis)
 *   sortDir — 'asc' | 'desc' (default: the dimension's natural reading order)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const topic = await fetchTopicBySlug(slug)
  if (!topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
  }

  const sp = new URL(request.url).searchParams
  const sortBy = parseTopicSortKey(sp.get('sortBy'))
  const sortDir = parseSortDir(sp.get('sortDir'))

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
