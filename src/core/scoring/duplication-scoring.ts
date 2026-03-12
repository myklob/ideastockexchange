/**
 * Duplication Scoring — TypeScript Implementation
 * =================================================
 *
 * Front-end / Node scoring utilities for the Redundancy Problem solution.
 *
 * This module is the TypeScript counterpart to
 * `backend/algorithms/duplication_scoring.py`.  It operates on the
 * `SchilchtArgument` type already used by the ReasonRank scoring engine and
 * exports pure functions that can be called both in the browser and on the
 * server.
 *
 * Core rule (from the design doc):
 *   contribution(argN) = baseScore × uniquenessScore × noveltyMultiplier
 *
 * Where:
 *   uniquenessScore = 1 − maxSimilarityToAnyPriorArgument
 *
 * This means:
 *   • An argument 90% similar to an existing one contributes 10% of its score.
 *   • A fully novel argument (0% similarity) contributes 100%.
 *   • The first argument in any cluster always contributes 100% — original
 *     claimants are not penalised for being first.
 *
 * Integration with ReasonRank
 * ---------------------------
 * The `uniquenessScore` field on `SchilchtArgument` (see `types/schlicht.ts`)
 * is consumed directly by `scoreArgument()` in `scoring-engine.ts`.  This
 * module provides the functions that *compute* that value before arguments
 * are passed to the ReasonRank engine.
 *
 * The full pipeline is:
 *   1. Raw arguments arrive (from DB or user submission)
 *   2. `computeUniquenessScores()` fills in `uniquenessScore` on each
 *   3. `scoreArgument()` in scoring-engine.ts multiplies ReasonRank × uniqueness
 *   4. `scoreProtocolBelief()` sums weighted contributions to get TruthScore
 *
 * Layer mapping
 * -------------
 * Layer 1 (Mechanical Equivalence) is implemented here as a lightweight
 * token-overlap check — no external dependencies.  It handles synonym and
 * negated-antonym normalization.
 *
 * Layer 2 (Semantic Overlap) accepts a pre-computed similarity score
 * (cosine similarity from the Python backend or any embedding provider).
 * The frontend does not run ML models; it only applies the math.
 *
 * Layer 3 (Community Verification) is represented as an optional input:
 * pass the resolved community score when available.
 */

// ─── Re-export the SchilchtArgument type for convenience ─────────────────
export type { SchilchtArgument } from '../types/schlicht'

// ─── Constants ───────────────────────────────────────────────────────────

/**
 * The minimum Layer 1 Jaccard similarity to declare two arguments
 * mechanically equivalent without needing Layer 2.
 */
export const MECHANICAL_EQUIVALENCE_THRESHOLD = 0.85

/**
 * Default weights for blending the three similarity layers.
 * Layer 3 weight is 0 until a community sub-debate has resolved.
 */
export const DEFAULT_LAYER_WEIGHTS = {
  layer1: 0.4,
  layer2: 0.6,
  layer3: 0.0,
} as const

/**
 * Novelty premium parameters.
 * The multiplier decays from PEAK to FLOOR over time.
 * Half-life is in hours.
 */
export const NOVELTY_DEFAULTS = {
  peakMultiplier: 1.25,
  halflifeHours: 24,
  floor: 1.0,
  /** Only boost arguments whose uniqueness score is above this threshold. */
  noveltyThreshold: 0.5,
} as const

// ─── Synonym / Antonym tables (Layer 1) ──────────────────────────────────

/**
 * Synonym groups.  Every word in a group is considered equivalent; all members
 * are canonicalized to the lexicographically-smallest word in the group.
 *
 * Using groups (not pairs) avoids the inconsistency that arises when a single
 * word belongs to multiple pairs: e.g. if "lower" appears in both
 * ['lower','reduce'] and ['lower','decrease'], a naïve pair-by-pair min scan
 * would produce different canonicals depending on iteration order.
 * Groups guarantee that 'lower', 'reduce', and 'decrease' all map to the same
 * canonical token ('decrease' in this case — alphabetically smallest).
 */
const SYNONYM_GROUPS: string[][] = [
  ['decrease', 'lower', 'reduce'],   // canonical: 'decrease'
  ['hike', 'increase', 'raise'],     // canonical: 'hike'
  ['ban', 'forbid', 'prohibit'],     // canonical: 'ban'
  ['allow', 'enable', 'permit'],     // canonical: 'allow'
  ['build', 'construct'],            // canonical: 'build'
  ['buy', 'purchase'],               // canonical: 'buy'
  ['end', 'stop', 'terminate'],      // canonical: 'end'
  ['fix', 'repair', 'resolve'],      // canonical: 'fix'
  ['beneficial', 'good'],            // canonical: 'beneficial'
  ['bad', 'detrimental', 'harmful'], // canonical: 'bad'
  ['clever', 'intelligent', 'smart'],// canonical: 'clever'
  ['foolish', 'stupid', 'unintelligent'], // canonical: 'foolish'
  ['fast', 'quick', 'rapid'],        // canonical: 'fast'
  ['slow', 'sluggish'],              // canonical: 'slow'
  ['rich', 'wealthy'],               // canonical: 'rich'
  ['impoverished', 'poor'],          // canonical: 'impoverished'
  ['accurate', 'true'],              // canonical: 'accurate'
  ['false', 'inaccurate', 'incorrect'], // canonical: 'false'
  ['tax', 'taxation', 'taxes'],      // canonical: 'tax'
]

/**
 * Build canonical mapping: word → the lexicographically-smallest word in its
 * synonym group.  Words not in any group map to themselves (identity).
 */
const CANONICAL_MAP: Map<string, string> = new Map()
for (const group of SYNONYM_GROUPS) {
  const canonical = [...group].sort()[0]  // smallest member = canonical
  for (const word of group) {
    CANONICAL_MAP.set(word, canonical)
  }
}

/** Common English stopwords stripped before mechanical comparison. */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
  'should', 'may', 'might', 'must', 'can', 'could', 'not', 'no', 'nor',
  'so', 'yet', 'both', 'either', 'neither', 'for', 'and', 'but', 'or',
  'as', 'at', 'by', 'in', 'of', 'on', 'to', 'up', 'it', 'its',
  'this', 'that', 'these', 'those', 'i', 'we', 'you', 'he', 'she', 'they',
  'them', 'their', 'our', 'your', 'my', 'his', 'her',
])

/** Negation prefixes. */
const NEGATION_WORDS = new Set([
  'not', 'no', 'never', 'neither', 'nor', 'without',
])

/** Antonym pairs for negated-antonym detection. */
const ANTONYM_PAIRS: [string, string][] = [
  ['intelligent', 'unintelligent'],
  ['intelligent', 'stupid'],
  ['smart', 'dumb'],
  ['good', 'bad'],
  ['good', 'evil'],
  ['true', 'false'],
  ['correct', 'incorrect'],
  ['honest', 'dishonest'],
  ['legal', 'illegal'],
  ['moral', 'immoral'],
  ['possible', 'impossible'],
  ['responsible', 'irresponsible'],
  ['relevant', 'irrelevant'],
  ['effective', 'ineffective'],
  ['efficient', 'inefficient'],
  ['logical', 'illogical'],
  ['rational', 'irrational'],
  ['agree', 'disagree'],
  ['like', 'dislike'],
  ['trust', 'distrust'],
  ['approve', 'disapprove'],
]

const ANTONYM_MAP: Map<string, string> = new Map()
for (const [word, opposite] of ANTONYM_PAIRS) {
  ANTONYM_MAP.set(word, opposite)
  ANTONYM_MAP.set(opposite, word)
}

// ─── Layer 1: Mechanical Equivalence ─────────────────────────────────────

/**
 * Normalise a claim string into a sorted array of canonical tokens.
 *
 * Steps:
 *   1. Lowercase
 *   2. Strip punctuation
 *   3. Tokenize on whitespace
 *   4. Remove stopwords
 *   5. Canonicalize synonyms ("reduce" → "lower")
 *   6. Collapse negated antonyms ("not unintelligent" → "intelligent")
 *
 * Sorting the result means word-order differences ("taxes lower" vs
 * "lower taxes") do not produce false negatives.
 *
 * @param text - Raw argument claim text.
 * @returns Sorted array of canonical tokens.
 */
export function normalizeClaim(text: string): string[] {
  const lowered = text.toLowerCase().replace(/[^\w\s']/g, ' ')
  const rawTokens = lowered.split(/\s+/).filter(Boolean)

  const cleaned: string[] = []
  let i = 0

  while (i < rawTokens.length) {
    const tok = rawTokens[i]

    // Detect negation + antonym pattern: "not unintelligent" → "intelligent"
    if (NEGATION_WORDS.has(tok) && i + 1 < rawTokens.length) {
      const nextTok = rawTokens[i + 1]
      const antonym = ANTONYM_MAP.get(nextTok)
      if (antonym !== undefined) {
        // "not X" where X has a known antonym → use the antonym's positive form
        const canonical = CANONICAL_MAP.get(antonym) ?? antonym
        cleaned.push(canonical)
        i += 2
        continue
      }
    }

    if (!STOPWORDS.has(tok)) {
      const canonical = CANONICAL_MAP.get(tok) ?? tok
      cleaned.push(canonical)
    }

    i++
  }

  return cleaned.sort()
}

/**
 * Jaccard similarity of two token sets.
 *
 * Jaccard(A, B) = |A ∩ B| / |A ∪ B|
 *
 * Returns 1.0 when both sets are identical, 0.0 when disjoint.
 *
 * @param tokensA - Normalized token array for argument A.
 * @param tokensB - Normalized token array for argument B.
 * @returns Similarity in [0, 1].
 */
export function jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 && tokensB.length === 0) return 1.0
  if (tokensA.length === 0 || tokensB.length === 0) return 0.0

  const setA = new Set(tokensA)
  const setB = new Set(tokensB)

  let intersectionSize = 0
  for (const tok of setA) {
    if (setB.has(tok)) intersectionSize++
  }

  const unionSize = setA.size + setB.size - intersectionSize
  return intersectionSize / unionSize
}

/**
 * Compute the Layer 1 mechanical equivalence score for two claim strings.
 *
 * @param claimA - First argument claim text.
 * @param claimB - Second argument claim text.
 * @returns Mechanical similarity in [0, 1].
 */
export function mechanicalSimilarity(claimA: string, claimB: string): number {
  return jaccardSimilarity(normalizeClaim(claimA), normalizeClaim(claimB))
}

/**
 * Returns true if two claims are mechanically equivalent (Layer 1 alone is
 * sufficient to flag them as duplicates).
 *
 * @param claimA - First claim text.
 * @param claimB - Second claim text.
 * @param threshold - Minimum Jaccard score for equivalence. Default 0.85.
 */
export function isMechanicalDuplicate(
  claimA: string,
  claimB: string,
  threshold = MECHANICAL_EQUIVALENCE_THRESHOLD,
): boolean {
  return mechanicalSimilarity(claimA, claimB) >= threshold
}

// ─── Layer blending ───────────────────────────────────────────────────────

export interface LayerWeights {
  layer1: number
  layer2: number
  /** Layer 3 weight is 0 until a community sub-debate has resolved. */
  layer3: number
}

/**
 * Blend Layer 1, 2, and (optionally) Layer 3 scores into a single combined
 * similarity value.
 *
 * When Layer 1 declares a mechanical duplicate (≥ threshold), the result is
 * immediately 1.0.
 *
 * When Layer 3 is unavailable (null), weights are renormalized across Layers
 * 1 and 2 only.
 *
 * @param layer1Score - Mechanical equivalence score (0–1).
 * @param layer2Score - Semantic overlap score (0–1, from backend embeddings).
 * @param layer3Score - Community verification score (0–1) or null.
 * @param weights - Custom layer weights. Defaults to DEFAULT_LAYER_WEIGHTS.
 * @returns Combined similarity in [0, 1].
 */
export function blendSimilarityLayers(
  layer1Score: number,
  layer2Score: number,
  layer3Score: number | null,
  weights: LayerWeights = DEFAULT_LAYER_WEIGHTS,
): number {
  // A mechanical duplicate is always 1.0 — no need for further analysis
  if (layer1Score >= MECHANICAL_EQUIVALENCE_THRESHOLD) return 1.0

  if (layer3Score !== null) {
    const totalWeight = weights.layer1 + weights.layer2 + weights.layer3
    const blended =
      (layer1Score * weights.layer1 +
        layer2Score * weights.layer2 +
        layer3Score * weights.layer3) /
      totalWeight
    return Math.max(0, Math.min(1, blended))
  }

  // No Layer 3 — normalize across L1 and L2
  const totalWeight = weights.layer1 + weights.layer2
  const blended =
    (layer1Score * weights.layer1 + layer2Score * weights.layer2) / totalWeight
  return Math.max(0, Math.min(1, blended))
}

// ─── Uniqueness Score ─────────────────────────────────────────────────────

/**
 * Derive the uniqueness score for a new argument given its combined similarity
 * to all prior arguments in the same debate.
 *
 * Rule: uniqueness = 1 − maxSimilarity
 *
 * We use the *maximum* (not average) because even one near-identical prior
 * argument is enough to mark the new argument as redundant.  A single
 * devastating counter-argument stated once is not made more valuable by
 * ignoring the fact that 50 other users already made it.
 *
 * @param similarityScores - Combined similarity scores vs. each prior argument.
 *   Pass an empty array for the very first argument (returns 1.0).
 * @returns Uniqueness score in [0, 1]. 1.0 = fully original.
 */
export function uniquenessFromSimilarities(similarityScores: number[]): number {
  if (similarityScores.length === 0) return 1.0
  const maxSim = Math.max(...similarityScores)
  return Math.max(0, Math.min(1, 1 - maxSim))
}

/**
 * Convert a similarity score directly into a contribution multiplier.
 *
 * contribution_factor(similarity) = 1 − similarity
 *
 * This is the formula the doc states explicitly:
 *   "if two arguments are 90% saying the same thing, the second one
 *    contributes 10% of its score, not 100%."
 *
 * @param similarity - Combined similarity in [0, 1].
 * @returns Contribution factor in [0, 1].
 */
export function contributionFactor(similarity: number): number {
  return Math.max(0, Math.min(1, 1 - similarity))
}

// ─── Novelty Premium ─────────────────────────────────────────────────────

export interface NoveltyOptions {
  peakMultiplier?: number
  halflifeHours?: number
  floor?: number
  noveltyThreshold?: number
  /** Override "now" for testing. */
  now?: Date
}

/**
 * Compute the novelty multiplier for an argument.
 *
 * New arguments receive a temporary score boost that decays exponentially.
 * This ensures genuinely fresh evidence gets attention before the community
 * has evaluated its relationship to existing arguments.
 *
 * The boost only applies when the argument's uniqueness score is above
 * `noveltyThreshold` — we do not boost obvious duplicates just because
 * they are new.
 *
 * Formula:
 *   multiplier(t) = floor + (peak − floor) × 0.5^(t / halflife)
 *
 * @param submittedAt - UTC Date when the argument was first submitted.
 * @param uniquenessScore - Current uniqueness score (0–1).
 * @param options - Override defaults for peak, halflife, floor, threshold.
 * @returns Multiplier ≥ 1.0.
 */
export function noveltyMultiplier(
  submittedAt: Date,
  uniquenessScore: number,
  options: NoveltyOptions = {},
): number {
  const {
    peakMultiplier = NOVELTY_DEFAULTS.peakMultiplier,
    halflifeHours = NOVELTY_DEFAULTS.halflifeHours,
    floor = NOVELTY_DEFAULTS.floor,
    noveltyThreshold = NOVELTY_DEFAULTS.noveltyThreshold,
    now = new Date(),
  } = options

  // No boost for arguments already identified as duplicates
  if (uniquenessScore < noveltyThreshold) return floor

  const ageMs = now.getTime() - submittedAt.getTime()
  const ageHours = Math.max(0, ageMs / (1000 * 60 * 60))

  // Exponential decay: multiplier approaches floor as age → ∞
  const decay = Math.pow(0.5, ageHours / halflifeHours)
  return floor + (peakMultiplier - floor) * decay
}

// ─── Effective Contribution ───────────────────────────────────────────────

/**
 * Compute the effective contribution of an argument after applying
 * the duplication penalty and novelty premium.
 *
 * effectiveContribution = baseScore × uniquenessScore × noveltyMultiplier
 *
 * @param baseScore - Raw argument score before penalties (0–100).
 * @param uniqueness - Uniqueness score (0–1).
 * @param novelty - Novelty multiplier (≥ 1.0).
 * @returns Effective contribution (0–(100 × peakMultiplier)).
 */
export function effectiveContribution(
  baseScore: number,
  uniqueness: number,
  novelty: number,
): number {
  return baseScore * uniqueness * novelty
}

// ─── Full Pipeline ────────────────────────────────────────────────────────

export interface ArgumentInput {
  id: string
  claim: string
  baseScore: number
  submittedAt: Date
  /**
   * Pre-computed semantic similarity to each prior argument in the list.
   * Keys are prior argument IDs.  Produced by the Python backend.
   * If absent, only Layer 1 is used.
   */
  semanticSimilarities?: Record<string, number>
  /**
   * Resolved community equivalence sub-debate scores.
   * Keys are prior argument IDs.  Present only for disputed pairs.
   */
  communityScores?: Record<string, number>
}

export interface ScoredArgumentOutput {
  id: string
  claim: string
  baseScore: number
  uniquenessScore: number
  noveltyMultiplier: number
  effectiveContribution: number
  /**
   * The per-prior-argument similarity breakdown that produced uniquenessScore.
   */
  similarityBreakdown: Array<{
    priorId: string
    layer1Score: number
    layer2Score: number | null
    layer3Score: number | null
    combinedScore: number
    isMechanicalDuplicate: boolean
  }>
}

/**
 * Score a list of sibling arguments for duplication and return enriched
 * scoring data for each.
 *
 * Arguments are processed in submission order (oldest first).  The first
 * argument in a cluster receives `uniquenessScore = 1.0`; later arguments
 * pay the duplication penalty relative to what came before.
 *
 * This is the primary entry point for the TypeScript duplication pipeline.
 * The Python backend is responsible for computing semantic similarities
 * (Layer 2); this function accepts them as pre-computed inputs.
 *
 * @param args - Sibling arguments with optional pre-computed similarities.
 * @param layerWeights - Custom blending weights for the three layers.
 * @param noveltyOptions - Custom novelty premium parameters.
 * @returns One ScoredArgumentOutput per input argument, in original order.
 */
export function scoreArgumentsForDuplication(
  args: ArgumentInput[],
  layerWeights: LayerWeights = DEFAULT_LAYER_WEIGHTS,
  noveltyOptions: NoveltyOptions = {},
): ScoredArgumentOutput[] {
  // Process oldest-first so priority goes to original submissions
  const sorted = [...args].sort(
    (a, b) => a.submittedAt.getTime() - b.submittedAt.getTime(),
  )

  const results: Map<string, ScoredArgumentOutput> = new Map()

  for (let i = 0; i < sorted.length; i++) {
    const arg = sorted[i]
    const priors = sorted.slice(0, i)

    const breakdown: ScoredArgumentOutput['similarityBreakdown'] = []

    for (const prior of priors) {
      const l1 = mechanicalSimilarity(arg.claim, prior.claim)
      const l2 = arg.semanticSimilarities?.[prior.id] ?? null
      const l3 = arg.communityScores?.[prior.id] ?? null

      const combined = blendSimilarityLayers(
        l1,
        l2 ?? l1, // fall back to L1 if no semantic score available
        l3,
        layerWeights,
      )

      breakdown.push({
        priorId: prior.id,
        layer1Score: l1,
        layer2Score: l2,
        layer3Score: l3,
        combinedScore: combined,
        isMechanicalDuplicate: l1 >= MECHANICAL_EQUIVALENCE_THRESHOLD,
      })
    }

    const combinedScores = breakdown.map(b => b.combinedScore)
    const uniqueness = uniquenessFromSimilarities(combinedScores)
    const novelty = noveltyMultiplier(arg.submittedAt, uniqueness, noveltyOptions)
    const contribution = effectiveContribution(arg.baseScore, uniqueness, novelty)

    results.set(arg.id, {
      id: arg.id,
      claim: arg.claim,
      baseScore: arg.baseScore,
      uniquenessScore: uniqueness,
      noveltyMultiplier: novelty,
      effectiveContribution: contribution,
      similarityBreakdown: breakdown,
    })
  }

  // Return in original input order
  return args.map(a => results.get(a.id)!)
}

// ─── Cluster Generation ───────────────────────────────────────────────────

export interface ArgumentCluster {
  clusterId: string
  /** ID of the argument chosen as the canonical representative of this cluster. */
  representativeId: string
  memberIds: string[]
  /**
   * Sum of effective contributions across all cluster members.
   * Already accounts for duplication penalties — cannot exceed what a single
   * fully-novel argument would score.
   */
  clusterScore: number
}

/**
 * Group scored arguments into similarity clusters.
 *
 * Each cluster collapses arguments that are substantially similar to one another.
 * In the ISE UI, clusters are displayed as a single canonical summary with a
 * drill-down to individual variants.  Nothing is discarded — the underlying
 * nuances remain accessible to anyone who wants them.
 *
 * The representative is the cluster member with the highest `baseScore`.
 *
 * @param scored - Output of `scoreArgumentsForDuplication`.
 * @param similarityThreshold - Minimum combined similarity to cluster two
 *   arguments together. Default 0.70 (70% overlap).
 * @returns List of clusters, one per distinct logical point in the debate.
 */
export function clusterArguments(
  scored: ScoredArgumentOutput[],
  similarityThreshold = 0.70,
): ArgumentCluster[] {
  // Build a similarity lookup from the breakdown data
  const simLookup: Map<string, number> = new Map()
  for (const s of scored) {
    for (const b of s.similarityBreakdown) {
      simLookup.set(`${s.id}::${b.priorId}`, b.combinedScore)
      simLookup.set(`${b.priorId}::${s.id}`, b.combinedScore)
    }
  }

  const getSim = (idA: string, idB: string): number =>
    simLookup.get(`${idA}::${idB}`) ?? 0

  const assigned = new Set<string>()
  const clusters: string[][] = []

  for (const s of scored) {
    if (assigned.has(s.id)) continue

    const cluster = [s.id]
    assigned.add(s.id)

    for (const other of scored) {
      if (assigned.has(other.id)) continue
      if (getSim(s.id, other.id) >= similarityThreshold) {
        cluster.push(other.id)
        assigned.add(other.id)
      }
    }

    clusters.push(cluster)
  }

  const scoredMap = new Map(scored.map(s => [s.id, s]))

  return clusters.map((memberIds, idx) => {
    // Representative: member with highest baseScore
    const representativeId = memberIds.reduce((best, id) =>
      (scoredMap.get(id)!.baseScore > scoredMap.get(best)!.baseScore ? id : best),
      memberIds[0],
    )

    const clusterScore = memberIds.reduce(
      (sum, id) => sum + scoredMap.get(id)!.effectiveContribution,
      0,
    )

    return {
      clusterId: `cluster-${idx + 1}`,
      representativeId,
      memberIds,
      clusterScore,
    }
  })
}

// ─── Evidence Corroboration Boost ────────────────────────────────────────

export interface EvidenceSource {
  id: string
  /** T1 = peer-reviewed, T2 = reputable, T3 = secondary, T4 = anecdotal */
  qualityTier: 'T1' | 'T2' | 'T3' | 'T4'
  /** Per-source corroboration weight (default 1.0 for independent sources). */
  corroborationWeight?: number
}

const TIER_WEIGHTS: Record<EvidenceSource['qualityTier'], number> = {
  T1: 1.00,
  T2: 0.75,
  T3: 0.50,
  T4: 0.25,
}

/** Maximum additive Truth Score boost from corroborating evidence. */
export const MAX_CORROBORATION_BOOST = 0.20

/**
 * Calculate the Truth Score boost from multiple corroborating evidence sources.
 *
 * The ISE distinguishes:
 *   • Evidence Volume: multiple independent sources corroborating the same fact.
 *     → Each source strengthens the argument node's Truth Score (rewarded).
 *   • Argument Redundancy: multiple posts making the same logical claim.
 *     → Only the first counts; the rest pay the duplication penalty (not rewarded).
 *
 * The boost uses a diminishing-returns formula so that the tenth paper adds
 * much less than the first:
 *
 *   boost = MAX × (1 − e^(−k × weightedN))
 *
 * where k ≈ 0.5 and weightedN is the sum of tier-weighted source contributions.
 *
 * @param sources - Corroborating evidence sources for a single argument node.
 * @returns Additive Truth Score boost in [0, MAX_CORROBORATION_BOOST].
 */
export function corroborationBoost(sources: EvidenceSource[]): number {
  if (sources.length === 0) return 0

  const weightedN = sources.reduce((sum, src) => {
    const tierW = TIER_WEIGHTS[src.qualityTier]
    const srcW = src.corroborationWeight ?? 1.0
    return sum + tierW * srcW
  }, 0)

  const k = 0.5
  const boost = MAX_CORROBORATION_BOOST * (1 - Math.exp(-k * weightedN))
  return Math.min(boost, MAX_CORROBORATION_BOOST)
}
