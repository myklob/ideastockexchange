/**
 * Media Truth Score — the end of the scoring pipeline.
 *
 * A work of media (book, film, article, podcast) makes claims; each claim is
 * evaluated at its own belief page, across ALL sources that make it. This
 * module aggregates those claim-level verdicts into one signed score for the
 * work:
 *
 *   Media Truth Score = Σ(signed truth × linkage) / Σ(linkage)
 *
 * on a -1.0 (built on debunked central claims) to +1.0 (central claims well
 * supported) scale. Linkage here is centrality: how central the claim is to
 * THIS work's message. Central-and-false is a major negative contribution;
 * peripheral-and-true barely registers. Genre never protects a work — a
 * peer-reviewed paper full of debunked central claims falls from its prior,
 * and fiction whose central claims survive scrutiny climbs above its genre's
 * starting line.
 *
 * Until claims are extracted, a work's score sits at its genre prior
 * (GENRE_BASE_TRUTH_SCORES via calculateMediaScores) — the prior is where the
 * score starts; the claim pipeline is how it earns a real one.
 *
 * The explainer at /algorithms/media-truth-score narrates this module. When
 * that page and this code disagree, this code wins.
 */

import { calculateMediaScores, inferGenreFromMediaType, type MediaGenreType } from './all-scores'

/** One extracted claim, ready to aggregate. */
export interface MediaClaimScoreInput {
  /**
   * The claim's signed truth (-1..+1), from the linked belief's own
   * engine-computed net (positivity / 100). Null when the claim has no linked
   * belief yet — it then contributes nothing (Rule 6), regardless of
   * centrality.
   */
  signedTruth: number | null
  /** Centrality (0-1): how central the claim is to this work's message. */
  linkage: number
}

export interface MediaTruthResult {
  /** The signed Media Truth Score (-1..+1). */
  score: number
  /**
   * Where the number comes from: 'claims' = computed from the extracted-claim
   * ledger; 'genre-prior' = no scoreable claims yet, sitting at the genre's
   * starting value.
   */
  basis: 'claims' | 'genre-prior'
  /** How many claims actually entered the aggregate. */
  scoredClaimCount: number
  /** Σ linkage over the scored claims — the denominator (centrality mass). */
  linkageMass: number
}

const clamp = (value: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, value))

/**
 * A belief's engine-computed net (positivity, -100..+100) expressed on the
 * signed truth scale (-1..+1). The signed form is what lets a work built on
 * debunked central claims earn a negative score rather than merely a low one.
 */
export function signedTruthFromPositivity(positivity: number): number {
  return clamp(positivity / 100, -1, 1)
}

const CANONICAL_GENRES: ReadonlySet<string> = new Set<MediaGenreType>([
  'peer_reviewed',
  'institutional',
  'investigative',
  'news_report',
  'editorial',
  'opinion',
  'social_media',
  'unknown',
])

/**
 * Resolve a work's genre for the prior: the stored classification when it is
 * one of the canonical genres, else inferred from the coarse media type
 * ("book", "podcast", ...). Legacy rows carry free-form genre strings
 * ("academic_popular"), which must never reach the prior lookup uncast.
 */
export function resolveGenreType(genreType: string, mediaType: string): MediaGenreType {
  if (genreType && genreType !== 'unknown' && CANONICAL_GENRES.has(genreType)) {
    return genreType as MediaGenreType
  }
  return inferGenreFromMediaType(mediaType)
}

/** The genre's starting value for a work with no scored claims yet. */
export function genrePrior(genreType: MediaGenreType): number {
  return calculateMediaScores(genreType).truthScore
}

/**
 * The canonical aggregation: centrality-weighted average of the scored
 * claims' signed truths, falling back to the genre prior when nothing is
 * scoreable yet. Claims with no linked belief (signedTruth null) or no
 * centrality (linkage <= 0) are excluded — an unlinked or irrelevant claim
 * moves nothing.
 */
export function mediaTruthScore(
  claims: MediaClaimScoreInput[],
  genreType: MediaGenreType,
): MediaTruthResult {
  const scored = claims.filter(c => c.signedTruth != null && c.linkage > 0)

  if (scored.length === 0) {
    return {
      score: genrePrior(genreType),
      basis: 'genre-prior',
      scoredClaimCount: 0,
      linkageMass: 0,
    }
  }

  let weightedSum = 0
  let linkageMass = 0
  for (const c of scored) {
    const truth = clamp(c.signedTruth as number, -1, 1)
    const linkage = clamp(c.linkage, 0, 1)
    weightedSum += truth * linkage
    linkageMass += linkage
  }

  return {
    score: clamp(weightedSum / linkageMass, -1, 1),
    basis: 'claims',
    scoredClaimCount: scored.length,
    linkageMass,
  }
}

/**
 * Epistemic Impact = Media Truth Score × Media Influence Score (reach).
 * Signed: a compelling work built on debunked claims reaching billions is a
 * massive NEGATIVE impact on collective understanding, not a neutral one.
 */
export function epistemicImpact(signedTruthScore: number, reach: number): number {
  const impact = signedTruthScore * reach
  // Normalize -0 (e.g. negative truth × zero reach) so displays never show "-0".
  return impact === 0 ? 0 : impact
}
