import { prisma } from '@/lib/prisma'
import type { TopicBeliefRow } from '../lib/dimensions'

const BELIEF_ROW_SELECT = {
  id: true,
  slug: true,
  statement: true,
  positivity: true,
  claimStrength: true,
  specificity: true,
  groundingScore: true,
} as const

export interface TopicLink {
  slug: string
  title: string
}

export interface TopicSummary {
  id: number
  slug: string
  title: string
  question: string | null
  description: string | null
  beliefCount: number
  /** Direction coverage: the positivity range the topic's beliefs span. */
  minPositivity: number | null
  maxPositivity: number | null
}

/**
 * A pair of beliefs on the same topic page that the equivalency engine has
 * flagged as making the same underlying claim — rendered as a grouping note
 * so the debate happens once instead of in parallel.
 */
export interface SimilarPair {
  fromSlug: string
  fromStatement: string
  toSlug: string
  toStatement: string
  equivalencyScore: number
}

export interface TopicWithBeliefs {
  id: number
  slug: string
  title: string
  question: string | null
  description: string | null
  beliefs: TopicBeliefRow[]
  parents: TopicLink[]
  children: TopicLink[]
  similarPairs: SimilarPair[]
  /** Slug of the matching /debate-topics template page, when one exists. */
  debateTopicSlug: string | null
}

export async function fetchAllTopics(): Promise<TopicSummary[]> {
  const topics = await prisma.topic.findMany({
    include: {
      beliefs: {
        select: { belief: { select: { positivity: true } } },
      },
    },
    orderBy: { title: 'asc' },
  })

  return topics.map(topic => {
    const positivities = topic.beliefs.map(tb => tb.belief.positivity)
    return {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      question: topic.question,
      description: topic.description,
      beliefCount: positivities.length,
      minPositivity: positivities.length ? Math.min(...positivities) : null,
      maxPositivity: positivities.length ? Math.max(...positivities) : null,
    }
  })
}

export async function fetchTopicBySlug(rawSlug: string): Promise<TopicWithBeliefs | null> {
  // Route params arrive percent-encoded; a malformed encoding should read as
  // "no such topic", not throw.
  let slug: string
  try {
    slug = decodeURIComponent(rawSlug)
  } catch {
    return null
  }

  const topic = await prisma.topic.findUnique({
    where: { slug },
    include: {
      beliefs: { select: { belief: { select: BELIEF_ROW_SELECT } } },
      parentLinks: { select: { parent: { select: { slug: true, title: true } } } },
      childLinks: { select: { child: { select: { slug: true, title: true } } } },
    },
  })
  if (!topic) return null

  const beliefs = topic.beliefs.map(tb => tb.belief)
  const beliefIds = beliefs.map(b => b.id)
  const byId = new Map(beliefs.map(b => [b.id, b]))

  // Equivalency edges where both ends sit on this page: the "eliminate
  // duplication" surface. Deduplicate mirrored A→B / B→A rows.
  const similarEdges = beliefIds.length
    ? await prisma.similarBelief.findMany({
        where: {
          fromBeliefId: { in: beliefIds },
          toBeliefId: { in: beliefIds },
          equivalencyScore: { gt: 0 },
        },
        select: {
          fromBeliefId: true,
          toBeliefId: true,
          equivalencyScore: true,
        },
      })
    : []

  const seenPairs = new Set<string>()
  const similarPairs: SimilarPair[] = []
  for (const edge of similarEdges) {
    const key = [edge.fromBeliefId, edge.toBeliefId].sort((a, b) => a - b).join(':')
    if (seenPairs.has(key)) continue
    seenPairs.add(key)
    const from = byId.get(edge.fromBeliefId)
    const to = byId.get(edge.toBeliefId)
    if (!from || !to) continue
    similarPairs.push({
      fromSlug: from.slug,
      fromStatement: from.statement,
      toSlug: to.slug,
      toStatement: to.statement,
      equivalencyScore: edge.equivalencyScore,
    })
  }
  similarPairs.sort((a, b) => b.equivalencyScore - a.equivalencyScore)

  const debateTopic = await prisma.debateTopic.findUnique({
    where: { slug },
    select: { slug: true },
  })

  return {
    id: topic.id,
    slug: topic.slug,
    title: topic.title,
    question: topic.question,
    description: topic.description,
    beliefs,
    parents: topic.parentLinks.map(l => l.parent),
    children: topic.childLinks.map(l => l.child),
    similarPairs,
    debateTopicSlug: debateTopic?.slug ?? null,
  }
}

/** Topic memberships for one belief, for the belief page's header metadata. */
export async function fetchTopicsForBelief(beliefId: number): Promise<TopicLink[]> {
  const rows = await prisma.topicBelief.findMany({
    where: { beliefId },
    select: { topic: { select: { slug: true, title: true } } },
    orderBy: { topic: { title: 'asc' } },
  })
  return rows.map(r => r.topic)
}
