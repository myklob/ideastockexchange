// Matching mined candidates into the belief graph. Pure functions over
// caller-supplied rows: pick the permanent page a conversation plugs into,
// and run the redundancy scan against the arguments already on that page so
// review sees "extends the outline" vs "restates row #N" at a glance. The
// similarity bands route; nothing here merges, writes, or scores.

import { textSimilarity, similarityBand, type SimilarityBand } from '@/lib/agent-ingest/similarity'
import type { ExtractedCandidate } from './extract'

export interface BeliefRow {
  id: number
  slug: string
  statement: string
}

export interface SiblingArgumentRow {
  id: number
  side: 'agree' | 'disagree' | string
  /** The argument's label or its belief's statement — whatever text stands for it. */
  statement: string
}

/** Minimum similarity between a conversation and a belief statement before
 *  the conversation is considered to be "about" that belief. Below this, the
 *  thread gets no focal page and every candidate proposes a new belief. */
export const FOCAL_MATCH_THRESHOLD = 0.3

export interface FocalMatch {
  belief: BeliefRow
  similarity: number
}

/**
 * Resolve which permanent page a conversation plugs into: the belief whose
 * statement best matches the thread title and the mined claims themselves.
 * Title similarity counts double — people name threads after the position
 * under debate.
 */
export function pickFocalBelief(
  title: string,
  candidates: ExtractedCandidate[],
  beliefs: BeliefRow[],
): FocalMatch | null {
  let best: FocalMatch | null = null
  for (const belief of beliefs) {
    const titleSim = textSimilarity(title, belief.statement)
    let candidateSim = 0
    for (const c of candidates) {
      const s = textSimilarity(c.statement, belief.statement)
      if (s > candidateSim) candidateSim = s
    }
    const combined = (2 * titleSim + candidateSim) / 3
    if (combined >= FOCAL_MATCH_THRESHOLD && (best === null || combined > best.similarity)) {
      best = { belief, similarity: combined }
    }
  }
  return best
}

export interface NearestArgument {
  argumentId: number
  similarity: number
  band: SimilarityBand
}

/**
 * Redundancy scan for one candidate against the same-side arguments already
 * under the focal belief. "same-claim" folds into the existing row at review
 * (combine); "probable-group"/"related-link" integrate with the cluster
 * recorded; "distinct" extends the outline.
 */
export function scanNearestArgument(
  statement: string,
  direction: 'pro' | 'con',
  siblings: SiblingArgumentRow[],
): NearestArgument | null {
  const side = direction === 'pro' ? 'agree' : 'disagree'
  let best: NearestArgument | null = null
  for (const sibling of siblings) {
    if (sibling.side !== side) continue
    const similarity = textSimilarity(statement, sibling.statement)
    if (best === null || similarity > best.similarity) {
      best = { argumentId: sibling.id, similarity, band: similarityBand(similarity) }
    }
  }
  return best
}
