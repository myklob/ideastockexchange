// Anti-topic-drift scan for the human posting flow. A new reason is compared
// against the arguments already on the parent belief: moderate overlap is
// stored as EquivalenceCandidate rows (priced later by the uniqueness
// discount, never blocked), and near-identical overlap trips a speed bump
// that asks the poster to acknowledge the existing row before posting.
// Pure logic — persistence stays in the API route.

import {
  textSimilarity,
  EQUIVALENCE_CANDIDATE_THRESHOLD,
  RESTATEMENT_SPEEDBUMP_THRESHOLD,
} from '@/lib/agent-ingest/similarity'

export interface SiblingClaim {
  id: number
  text: string
}

export interface RestatementMatch {
  existingArgumentId: number
  similarity: number
  text: string
}

export interface DriftScan {
  /** Siblings above the candidate threshold, strongest overlap first. */
  candidates: RestatementMatch[]
  /** The best match at or above the speed-bump threshold, if any. */
  nearDuplicate: RestatementMatch | null
}

export function scanForRestatements(statement: string, siblings: SiblingClaim[]): DriftScan {
  const candidates = siblings
    .map((s) => ({
      existingArgumentId: s.id,
      similarity: textSimilarity(statement, s.text),
      text: s.text,
    }))
    .filter((m) => m.similarity >= EQUIVALENCE_CANDIDATE_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)

  const best = candidates[0]
  return {
    candidates,
    nearDuplicate: best && best.similarity >= RESTATEMENT_SPEEDBUMP_THRESHOLD ? best : null,
  }
}
