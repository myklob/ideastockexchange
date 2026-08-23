// The plug-in moment. Chat platforms reset discussion to zero; the fix is
// that the instant someone states a belief, the statement resolves to its
// permanent page — the organized pro/con outline, the gaps still open, and
// the conversations already plugged in — so the new conversation starts
// where the last one left off. Read-only: a lookup never writes anything.

import { prisma } from '@/lib/prisma'
import { textSimilarity, similarityBand, type SimilarityBand } from '@/lib/agent-ingest/similarity'
import { validateStandaloneClaim } from '@/lib/agent-ingest/validate-claim'
import { slugify } from '@/lib/agent-ingest/slug'
import { FOCAL_MATCH_THRESHOLD } from './match'
import { buildBeliefOutline, type BeliefOutline } from './outline'

export interface LookupBeliefRow {
  id: number
  slug: string
  statement: string
}

export interface LookupMatch {
  belief: LookupBeliefRow
  similarity: number
  band: SimilarityBand
}

export const LOOKUP_MATCH_LIMIT = 5

/**
 * Pure ranker: which permanent pages could this statement be about?
 * Below FOCAL_MATCH_THRESHOLD a belief is not a plausible home, so it never
 * appears — an empty result means "no page yet", the caller's cue to offer
 * a new one rather than force a bad match.
 */
export function rankBeliefMatches(
  statement: string,
  beliefs: LookupBeliefRow[],
  limit: number = LOOKUP_MATCH_LIMIT,
): LookupMatch[] {
  return beliefs
    .map(belief => ({ belief, similarity: textSimilarity(statement, belief.statement) }))
    .filter(m => m.similarity >= FOCAL_MATCH_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(m => ({ ...m, band: similarityBand(m.similarity) }))
}

export interface RecentThreadRow {
  id: string
  platform: string
  title: string
  sourceUrl: string | null
  createdAt: Date
}

export interface StatementLookup {
  statement: string
  /** Advisory only: notes when the statement is a fragment or a bare topic
   *  label, quoting the same failure vocabulary ingestion uses. A lookup
   *  still runs — people type topics into chat all the time. */
  claimNotes: string[]
  matches: (LookupMatch & { url: string })[]
  /** The best-matching permanent page, unfolded: what a chat client shows so
   *  nobody restarts from zero. Null when nothing matched. */
  best: {
    belief: LookupBeliefRow
    url: string
    outline: BeliefOutline
    recentThreads: RecentThreadRow[]
  } | null
  /** When no page matched: the statement can seed one. */
  newPage: { suggestedSlug: string; hint: string } | null
}

/**
 * Resolve a statement someone just made in a chatroom or forum to the
 * structured analysis that already exists.
 */
export async function lookupStatement(statement: string): Promise<StatementLookup> {
  const trimmed = statement.trim()
  const claimNotes = validateStandaloneClaim(trimmed).map(i => i.message)

  const beliefs = await prisma.belief.findMany({ select: { id: true, slug: true, statement: true } })
  const ranked = rankBeliefMatches(trimmed, beliefs)
  const matches = ranked.map(m => ({ ...m, url: `/beliefs/${m.belief.slug}` }))

  if (ranked.length === 0) {
    return {
      statement: trimmed,
      claimNotes,
      matches,
      best: null,
      newPage: {
        suggestedSlug: slugify(trimmed),
        hint:
          'No permanent page holds this claim yet. Import the conversation via ' +
          'POST /api/v1/conversations with beliefSlug to give it a home, or submit ' +
          'the claim through POST /api/v1/ingest.',
      },
    }
  }

  const top = ranked[0]
  const [outline, recentThreads] = await Promise.all([
    buildBeliefOutline(top.belief.id),
    prisma.conversationThread.findMany({
      where: { beliefId: top.belief.id },
      select: { id: true, platform: true, title: true, sourceUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return {
    statement: trimmed,
    claimNotes,
    matches,
    best: outline
      ? { belief: top.belief, url: `/beliefs/${top.belief.slug}`, outline, recentThreads }
      : null,
    newPage: null,
  }
}
