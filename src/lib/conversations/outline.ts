// The organized pro/con outline of a belief page: what a newcomer sees so no
// conversation starts from zero. Three moves, all read-only:
//   combine  — equivalent same-side arguments cluster under one lead row
//              (community-grouped pairs plus high-similarity open candidates)
//   organize — clusters rank by score, descending, nulls last (Rule 8)
//   extend   — leads with no engaging counter-argument surface as gaps, the
//              outline's explicit invitation for the next conversation
// Plus the incoming lane: pending conversation candidates waiting on review.

import { prisma } from '@/lib/prisma'
import { rankByScore, TABLE_TOP_LIMIT } from '@/features/belief-analysis/lib/ranking'
import { textSimilarity, RESTATEMENT_SPEEDBUMP_THRESHOLD } from '@/lib/agent-ingest/similarity'

export interface OutlineArgument {
  id: number
  side: 'agree' | 'disagree' | string
  /** Claim label or the argument-belief's statement. */
  label: string
  /** Slug of the argument's own belief page. */
  slug: string
  score: number | null
}

export interface EquivalencePair {
  a: number
  b: number
}

export interface OutlineCluster {
  lead: OutlineArgument
  /** Combined restatements, score-ordered under the lead. */
  members: OutlineArgument[]
}

export interface OutlineGap {
  /** The side that has no answer yet. */
  side: 'pro' | 'con'
  /** The unanswered opposing lead. */
  answering: string
  prompt: string
}

export interface IncomingCandidate {
  candidateId: string
  statement: string
  direction: string
  band: string | null
  thread: { id: string; title: string; platform: string }
}

export interface BeliefOutline {
  belief: { id: number; slug: string; statement: string }
  pro: { top: OutlineCluster[]; rest: OutlineCluster[] }
  con: { top: OutlineCluster[]; rest: OutlineCluster[] }
  gaps: OutlineGap[]
  incoming: IncomingCandidate[]
}

/** Similarity at which an opposing argument counts as engaging a lead: well
 *  below the equivalence bands — a counter shares content with what it
 *  answers, it does not restate it. */
export const ENGAGEMENT_THRESHOLD = 0.3

function clusterSide(args: OutlineArgument[], pairs: EquivalencePair[]): OutlineCluster[] {
  const parent = new Map<number, number>()
  const find = (x: number): number => {
    let root = x
    while (parent.get(root) !== root) root = parent.get(root)!
    // Path compression keeps repeated finds cheap on long chains.
    let cur = x
    while (parent.get(cur) !== root) {
      const next = parent.get(cur)!
      parent.set(cur, root)
      cur = next
    }
    return root
  }
  for (const a of args) parent.set(a.id, a.id)
  for (const { a, b } of pairs) {
    if (parent.has(a) && parent.has(b)) parent.set(find(a), find(b))
  }

  const groups = new Map<number, OutlineArgument[]>()
  for (const arg of args) {
    const root = find(arg.id)
    const group = groups.get(root)
    if (group) group.push(arg)
    else groups.set(root, [arg])
  }

  return [...groups.values()].map(group => {
    const { top, rest } = rankByScore(group, g => g.score, 1)
    return { lead: top[0], members: rest }
  })
}

/**
 * Pure organizer. `pairs` are equivalence pairs among the given arguments
 * (community-grouped rows and open high-similarity candidates); clustering
 * only ever combines same-side rows because opposite sides never share a
 * pair's meaning in this outline.
 */
export function organizeOutline(
  args: OutlineArgument[],
  pairs: EquivalencePair[],
  limit: number = TABLE_TOP_LIMIT,
): Pick<BeliefOutline, 'pro' | 'con' | 'gaps'> {
  const bySide = (side: string) => args.filter(a => a.side === side)
  const sideOf = new Map(args.map(a => [a.id, a.side]))
  const samesidePairs = pairs.filter(p => sideOf.get(p.a) === sideOf.get(p.b))

  const proClusters = clusterSide(bySide('agree'), samesidePairs)
  const conClusters = clusterSide(bySide('disagree'), samesidePairs)

  const rank = (clusters: OutlineCluster[]) => rankByScore(clusters, c => c.lead.score, limit)

  const gaps: OutlineGap[] = []
  const findGaps = (leads: OutlineCluster[], opponents: OutlineArgument[], side: 'pro' | 'con') => {
    for (const cluster of leads) {
      const engaged = opponents.some(o => textSimilarity(o.label, cluster.lead.label) >= ENGAGEMENT_THRESHOLD)
      if (!engaged) {
        gaps.push({
          side,
          answering: cluster.lead.label,
          prompt: `No ${side} argument yet engages "${cluster.lead.label}". The outline extends here.`,
        })
      }
    }
  }
  findGaps(proClusters, bySide('disagree'), 'con')
  findGaps(conClusters, bySide('agree'), 'pro')

  return { pro: rank(proClusters), con: rank(conClusters), gaps }
}

/**
 * Build the outline for one belief from the live graph: published arguments,
 * their equivalence clusters, and the pending conversation candidates queued
 * against the page.
 */
export async function buildBeliefOutline(beliefId: number): Promise<BeliefOutline | null> {
  const belief = await prisma.belief.findUnique({ where: { id: beliefId } })
  if (!belief) return null

  const rows = await prisma.argument.findMany({
    where: { parentBeliefId: beliefId, status: 'published' },
    include: { belief: { select: { slug: true, statement: true } } },
  })
  const args: OutlineArgument[] = rows.map(r => ({
    id: r.id,
    side: r.side,
    label: r.claim ?? r.belief.statement,
    slug: r.belief.slug,
    score: r.argumentScore,
  }))

  const ids = args.map(a => a.id)
  const pairRows = await prisma.equivalenceCandidate.findMany({
    where: { argumentId: { in: ids }, existingArgumentId: { in: ids } },
  })
  const pairs: EquivalencePair[] = pairRows
    .filter(p => p.status === 'grouped' || (p.status === 'open' && p.similarity >= RESTATEMENT_SPEEDBUMP_THRESHOLD))
    .map(p => ({ a: p.argumentId, b: p.existingArgumentId }))

  const pending = await prisma.argumentCandidate.findMany({
    where: { beliefId, status: 'pending' },
    include: { thread: { select: { id: true, title: true, platform: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return {
    belief: { id: belief.id, slug: belief.slug, statement: belief.statement },
    ...organizeOutline(args, pairs),
    incoming: pending.map(c => ({
      candidateId: c.id,
      statement: c.statement,
      direction: c.direction,
      band: c.band,
      thread: c.thread,
    })),
  }
}
