// Redundancy scan support: stored, not scored. Ingestion persists
// EquivalenceCandidate rows above the threshold; the uniqueness discount
// happens at scoring time, canonically (see the equivalence docs).

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for',
  'from', 'by', 'with', 'about', 'as', 'into', 'than', 'that', 'this', 'these',
  'those', 'it', 'its', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  'can', 'could', 'may', 'might', 'must', 'not', 'no', 'nor', 'more', 'most',
  'less', 'least', 'very', 'relative', 'relatively',
])

/** Light suffix strip so "reduces"/"reduced"/"reducing" collide. Not a
 *  stemmer; just enough for a redundancy candidate scan. */
function stem(token: string): string {
  if (token.length <= 4) return token
  return token.replace(/(ing|ed|es|s)$/, '')
}

export function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t))
    .map(stem)
}

function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 0
  let intersection = 0
  for (const item of a) if (b.has(item)) intersection++
  return intersection / (a.size + b.size - intersection)
}

function bigrams(tokens: string[]): Set<string> {
  const out = new Set<string>()
  for (let i = 0; i < tokens.length - 1; i++) out.add(`${tokens[i]} ${tokens[i + 1]}`)
  return out
}

/**
 * Similarity in [0,1] between two claim statements: token-set Jaccard blended
 * with bigram Jaccard (word order matters a little). This feeds the candidate
 * scan only — it is never written to any score column.
 */
export function textSimilarity(a: string, b: string): number {
  const ta = normalizeTokens(a)
  const tb = normalizeTokens(b)
  const tokenSim = jaccard(new Set(ta), new Set(tb))
  const bigramSim = jaccard(bigrams(ta), bigrams(tb))
  return 0.7 * tokenSim + 0.3 * bigramSim
}

/** Above this, ingestion persists an EquivalenceCandidate row for the engine
 *  and human reviewers to see the cluster. */
export const EQUIVALENCE_CANDIDATE_THRESHOLD = 0.5

/** Above this, the human posting flow treats the submission as a restatement
 *  of an existing argument and requires acknowledging that row before it
 *  posts (a speed bump, not a block — the uniqueness discount prices whatever
 *  overlap remains). Anti-topic-drift: restating stops counting as
 *  contributing. */
export const RESTATEMENT_SPEEDBUMP_THRESHOLD = 0.8
