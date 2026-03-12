/**
 * All Scores — Unified Implementation of the ReasonRank Scoring System
 *
 * This module provides computing functions for every score type described in
 * the ReasonRank documentation. It complements scoring-engine.ts (which handles
 * the recursive ReasonRank propagation) with the remaining score dimensions.
 *
 * Score taxonomy:
 *
 * FUNDAMENTAL SCORES
 * ─────────────────
 * 1. Truth Scores          — Logical Validity + Verification combined
 * 2. Linkage Scores        — Evidence-to-conclusion relevance (in scoring-engine.ts)
 * 3. Importance Scores     — How much an argument moves the probability needle
 * 4. Evidence Scores       — EVS: source quality × replication × relevance (in scoring-engine.ts)
 * 5. Cost/Benefit Likelihood Scores — Probability a CBA outcome occurs (in cba-scoring.ts)
 * 6. Objective Criteria Scores     — Measurement quality against agreed benchmarks
 * 7. Confidence Stability Scores   — How settled a score is under sustained scrutiny
 *
 * ADMINISTRATIVE SCORES
 * ─────────────────────
 * 8.  Media Truth Scores          — Flags editorializing, sensationalism, misleading framing
 * 9.  Media Genre and Style Scores — Source genre reliability weight
 * 10. Topic Overlap Scores        — Prevents the same point from inflating via repetition
 * 11. Belief Equivalency Scores   — Identifies two beliefs making the same underlying claim
 */

// ─── Re-exports from scoring-engine (for consumers who import from here) ─

export {
  calculateEVS,               // Evidence Scores (EVS formula)
  scoreLinkageDebate,         // Linkage Scores (full debate)
  resolveLinkageScore,        // Linkage Scores (priority resolver)
  calculateLinkageFromArguments, // Linkage Scores (simple)
  calculateLinkageFromDiagnostic, // Linkage Scores (wizard)
  scoreProtocolBelief,        // Truth Scores (belief-level)
  scoreArgument,              // Truth + Linkage + Importance composite
  getEvidenceTypeWeight,      // Evidence tier weights
} from './scoring-engine'

// ─── Score interfaces ─────────────────────────────────────────────────────

/**
 * Breakdown of how a Belief's Truth Score was computed.
 * Separates Logical Validity from Verification so both can be displayed.
 */
export interface TruthScoreBreakdown {
  /** Overall truth score (0-1): combined Logical Validity and Verification. */
  overallTruthScore: number
  /**
   * Logical Validity Score (0-1): do the argument structures hold?
   * Computed from fallacy penalties and argument-tree structural quality.
   */
  logicalValidityScore: number
  /**
   * Verification Truth Score (0-1): do the underlying facts check out?
   * Computed from EVS-weighted evidence quality and source independence.
   */
  verificationTruthScore: number
  /** Number of arguments contributing to the logic check. */
  argumentCount: number
  /** Total fallacy penalty deducted across all arguments. */
  totalFallacyPenalty: number
  /** Number of evidence items contributing to the verification check. */
  evidenceCount: number
}

/**
 * Importance Score result for a single argument.
 */
export interface ImportanceScoreResult {
  /** Normalized importance (0-1). */
  importanceScore: number
  /** How much this argument's impact is multiplied by its importance. */
  weightedImpact: number
  /** Label summarizing the importance level. */
  label: 'decisive' | 'significant' | 'moderate' | 'minor' | 'negligible'
}

/**
 * Objective Criteria Score for a single criterion.
 */
export interface ObjectiveCriteriaScore {
  criteriaId: number
  description: string
  criteriaType: string | null
  /** Validity Score (0-1): does this criterion actually measure what we think it measures? */
  validityScore: number
  /** Reliability Score (0-1): can different people measure this consistently? */
  reliabilityScore: number
  /** Independence Score (0-1): is the data source neutral / free of conflicts of interest? */
  independenceScore: number
  /** Linkage Score (0-1): how strongly does this criterion correlate with the ultimate goal? */
  linkageScore: number
  /** Total Score (0-1): average of all four dimensions. */
  totalScore: number
  /** Label for the total score range. */
  label: 'excellent' | 'good' | 'moderate' | 'weak' | 'invalid'
}

/**
 * Confidence Stability Score result.
 */
export interface ConfidenceStabilityResult {
  /**
   * Stability Score (0-1):
   * 1.0 = highly stable (many arguments, strong consensus)
   * 0.5 = medium stability (emerging debate)
   * 0.0 = unstable (few arguments, perfectly balanced, could shift)
   */
  stabilityScore: number
  /** Status label based on the stability level. */
  status: 'robust' | 'established' | 'developing' | 'fragile'
  /** Number of arguments (pro + con) factored into stability. */
  argumentCount: number
  /** Ratio of the winning side's strength to total (0.5 = perfectly balanced). */
  dominanceRatio: number
}

/**
 * Media Truth Score and Genre Score result.
 */
export interface MediaScoreResult {
  /**
   * Media Truth Score (0-1): flags editorializing, sensationalism, or misleading framing.
   * High = neutral/factual, Low = advocacy/opinion.
   */
  truthScore: number
  /**
   * Media Genre Score (0-1): source reliability weight by genre.
   * Mirrors Evidence tiers but applied to media sources.
   */
  genreScore: number
  /** Canonical genre type used to compute the scores. */
  genreType: MediaGenreType
  /** T1–T4 reliability tier. */
  reliabilityTier: 'T1' | 'T2' | 'T3' | 'T4'
  /** Human-readable description of the genre's epistemic implications. */
  genreDescription: string
}

/**
 * Topic Overlap Score for a set of sibling arguments or beliefs.
 * Surfaces how much unique content the argument pool contains.
 */
export interface TopicOverlapResult {
  /** Average uniqueness across all items in the set (0-1). 1 = all unique. */
  averageUniqueness: number
  /** Number of mechanically-equivalent pairs detected. */
  duplicatePairCount: number
  /** The effective contribution multiplier for each item (keyed by id). */
  contributionFactors: Record<string, number>
}

/**
 * Belief Equivalency Score comparing two beliefs.
 */
export interface BeliefEquivalencyResult {
  /**
   * Equivalency Score (0-1): how much the two beliefs make the same underlying claim.
   * 1.0 = identical claims stated differently
   * 0.5 = significantly overlapping
   * 0.0 = unrelated beliefs
   */
  equivalencyScore: number
  /** Mechanical (token-based) similarity from Layer 1. */
  mechanicalSimilarity: number
  /** Whether the mechanical check alone is enough to flag these as equivalent. */
  isMechanicalEquivalent: boolean
  /** Label describing the equivalency relationship. */
  relationship: 'identical' | 'near-identical' | 'overlapping' | 'related' | 'distinct'
}

// ─── Media Genre Types ─────────────────────────────────────────────────────

export type MediaGenreType =
  | 'peer_reviewed'      // Academic journal, systematic review, meta-analysis
  | 'institutional'      // Official government report, regulatory document
  | 'investigative'      // Long-form investigative journalism
  | 'news_report'        // Standard news article with editorial oversight
  | 'editorial'          // Editor opinion / house view
  | 'opinion'            // Op-ed, commentary, personal column
  | 'social_media'       // Tweet, post, thread
  | 'unknown'            // Unclassified

/**
 * Base truth score for each genre type.
 * These scores represent the epistemic reliability of the *genre itself*,
 * not the truth of any individual article.
 *
 * Interpretation:
 *   peer_reviewed = very high bar for publication + peer scrutiny
 *   social_media  = no editorial filter, easily manipulated
 */
const GENRE_BASE_TRUTH_SCORES: Record<MediaGenreType, number> = {
  peer_reviewed:  0.90,
  institutional:  0.80,
  investigative:  0.70,
  news_report:    0.60,
  editorial:      0.40,
  opinion:        0.30,
  social_media:   0.15,
  unknown:        0.50,
}

/**
 * Genre reliability scores (0-1) — mirrors Evidence tier weights.
 *   T1 = 1.00  (peer_reviewed, institutional)
 *   T2 = 0.75  (investigative, news_report)
 *   T3 = 0.50  (editorial)
 *   T4 = 0.25  (opinion, social_media)
 */
const GENRE_RELIABILITY_SCORES: Record<MediaGenreType, number> = {
  peer_reviewed:  1.00,   // T1
  institutional:  1.00,   // T1
  investigative:  0.75,   // T2
  news_report:    0.75,   // T2
  editorial:      0.50,   // T3
  opinion:        0.25,   // T4
  social_media:   0.25,   // T4
  unknown:        0.50,   // default T3
}

/**
 * Infer the reliability tier from a genre type.
 */
const GENRE_TO_TIER: Record<MediaGenreType, 'T1' | 'T2' | 'T3' | 'T4'> = {
  peer_reviewed:  'T1',
  institutional:  'T1',
  investigative:  'T2',
  news_report:    'T2',
  editorial:      'T3',
  opinion:        'T4',
  social_media:   'T4',
  unknown:        'T3',
}

const GENRE_DESCRIPTIONS: Record<MediaGenreType, string> = {
  peer_reviewed:  'Academic peer-reviewed source — high methodological standards, independent scrutiny',
  institutional:  'Official institutional report — authoritative, but may reflect institutional bias',
  investigative:  'Investigative journalism — fact-checked, sourced reporting with editorial oversight',
  news_report:    'Standard news report — subject to editorial standards, but constrained by news cycle',
  editorial:      'Editorial or house opinion — represents a specific viewpoint, not neutral reporting',
  opinion:        'Opinion or commentary — reflects the author\'s perspective, not verified analysis',
  social_media:   'Social media post — no editorial filter, highly susceptible to misinformation',
  unknown:        'Source genre unclassified — treat with standard caution',
}

// ─── 1. Truth Scores ──────────────────────────────────────────────────────

/**
 * Calculate the full Truth Score breakdown for a belief's argument/evidence pool.
 *
 * Truth Score = (Logical Validity + Verification) / 2
 *
 * Logical Validity:
 *   Measures whether arguments hold structurally — fallacy penalties reduce this.
 *   LV = 1 - (totalFallacyPenalty / max(argumentCount, 1))
 *
 * Verification Truth Score:
 *   Measures whether the facts check out — based on evidence tier and EVS scores.
 *   VTS = weighted average of evidence quality × linkage × side (+/-)
 *
 * @param args - Array of arguments with their truth and fallacy data.
 * @param evidence - Array of evidence items with EVS scores.
 */
export function calculateTruthScoreBreakdown(
  args: Array<{
    side: string
    truthScore: number
    fallacyPenalty?: number
    impactScore: number
  }>,
  evidence: Array<{
    side: string
    evsScore: number
    linkageScore: number
  }>,
): TruthScoreBreakdown {
  const argumentCount = args.length
  const evidenceCount = evidence.length

  // ── Logical Validity ───────────────────────────────────────────────────
  // Average truth score across all arguments, penalized by detected fallacies.
  // Arguments with detected fallacies drag validity down.
  let totalFallacyPenalty = 0
  let logicalValiditySum = 0

  for (const arg of args) {
    const penalty = arg.fallacyPenalty ?? 0
    totalFallacyPenalty += penalty
    logicalValiditySum += Math.max(0, arg.truthScore * (1 - penalty))
  }

  const logicalValidityScore = argumentCount > 0
    ? Math.max(0, Math.min(1, logicalValiditySum / argumentCount))
    : 0.5  // No arguments = maximum uncertainty

  // ── Verification Truth Score ───────────────────────────────────────────
  // Weighted average of evidence quality. Supporting evidence increases it,
  // weakening evidence decreases it.
  let supportingWeight = 0
  let weakeningWeight = 0

  for (const ev of evidence) {
    const weight = ev.evsScore > 0 ? ev.evsScore : 0.1  // fall back to 0.1 if EVS not computed
    const contribution = weight * ev.linkageScore
    if (ev.side === 'supporting') {
      supportingWeight += contribution
    } else {
      weakeningWeight += contribution
    }
  }

  const totalEvidenceWeight = supportingWeight + weakeningWeight
  const verificationTruthScore = totalEvidenceWeight > 0
    ? Math.max(0.01, Math.min(0.99, supportingWeight / totalEvidenceWeight))
    : 0.5  // No evidence = maximum uncertainty

  // ── Combined Truth Score ───────────────────────────────────────────────
  // Equal weight to both components unless one is unavailable.
  let overallTruthScore: number
  if (argumentCount > 0 && evidenceCount > 0) {
    overallTruthScore = (logicalValidityScore + verificationTruthScore) / 2
  } else if (argumentCount > 0) {
    overallTruthScore = logicalValidityScore
  } else if (evidenceCount > 0) {
    overallTruthScore = verificationTruthScore
  } else {
    overallTruthScore = 0.5
  }

  return {
    overallTruthScore: Math.max(0.01, Math.min(0.99, overallTruthScore)),
    logicalValidityScore,
    verificationTruthScore,
    argumentCount,
    totalFallacyPenalty,
    evidenceCount,
  }
}

// ─── 3. Importance Scores ─────────────────────────────────────────────────

/**
 * Calculate the Importance Score for an argument and derive its weighted impact.
 *
 * Importance separates truth from relevance: not every true statement matters equally
 * to a given conclusion. A minor correct point should not bury a decisive
 * counterargument simply by outnumbering it.
 *
 * Labels:
 *   decisive   ≥ 0.85 — This argument alone could flip the conclusion
 *   significant ≥ 0.65 — Material contribution to the overall score
 *   moderate   ≥ 0.40 — Relevant but not decisive
 *   minor      ≥ 0.15 — Small contribution
 *   negligible  < 0.15 — Near-zero contribution
 *
 * @param importanceScore - Raw importance score (0-1), from wizard input or editor judgment.
 * @param baseImpact - The argument's base impact score before importance weighting.
 */
export function calculateImportanceScore(
  importanceScore: number,
  baseImpact: number,
): ImportanceScoreResult {
  const clamped = Math.max(0, Math.min(1, importanceScore))
  const weightedImpact = baseImpact * clamped

  let label: ImportanceScoreResult['label']
  if (clamped >= 0.85) label = 'decisive'
  else if (clamped >= 0.65) label = 'significant'
  else if (clamped >= 0.40) label = 'moderate'
  else if (clamped >= 0.15) label = 'minor'
  else label = 'negligible'

  return { importanceScore: clamped, weightedImpact, label }
}

// ─── 6. Objective Criteria Scores ─────────────────────────────────────────

/**
 * Calculate the Objective Criteria Score for a single criterion.
 *
 * Objective criteria measure performance against standards that don't depend
 * on values or ideology — measurable benchmarks both sides can agree to in advance.
 *
 * Each criterion is evaluated across four dimensions:
 *   Validity     — does this actually measure what we think it measures?
 *   Reliability  — can different people measure this consistently?
 *   Independence — is the data source neutral / free of conflicts of interest?
 *   Linkage      — how strongly does this metric correlate with the ultimate goal?
 *
 * Score = (validity + reliability + independence + linkage) / 4
 *
 * Labels map to the ObjectiveCriteriaScoringAlgorithm.md thresholds:
 *   excellent  80-100% (e.g., Glacier Mass Balance for climate change)
 *   good       60-80%
 *   moderate   40-60%
 *   weak        0-40%
 *   invalid    = 0 (criterion explicitly excluded)
 */
export function calculateObjectiveCriteriaScore(criteria: {
  id: number
  description: string
  criteriaType: string | null
  validityScore: number
  reliabilityScore: number
  independenceScore: number
  linkageScore: number
}): ObjectiveCriteriaScore {
  const totalScore = Math.max(
    0,
    Math.min(
      1,
      (criteria.validityScore + criteria.reliabilityScore + criteria.independenceScore + criteria.linkageScore) / 4,
    ),
  )

  let label: ObjectiveCriteriaScore['label']
  if (totalScore >= 0.80) label = 'excellent'
  else if (totalScore >= 0.60) label = 'good'
  else if (totalScore >= 0.40) label = 'moderate'
  else if (totalScore > 0) label = 'weak'
  else label = 'invalid'

  return {
    criteriaId: criteria.id,
    description: criteria.description,
    criteriaType: criteria.criteriaType,
    validityScore: criteria.validityScore,
    reliabilityScore: criteria.reliabilityScore,
    independenceScore: criteria.independenceScore,
    linkageScore: criteria.linkageScore,
    totalScore,
    label,
  }
}

/**
 * Aggregate objective criteria scores for a belief.
 *
 * Returns the ReasonRank-style weighted average:
 *   aggregate = Σ(totalScore × linkageScore) / Σ(linkageScore)
 *
 * Higher-linkage criteria carry more weight in the aggregate,
 * since they are more relevant to the specific belief.
 */
export function aggregateObjectiveCriteriaScores(
  criteriaScores: ObjectiveCriteriaScore[],
): number {
  if (criteriaScores.length === 0) return 0.5

  let weightedSum = 0
  let totalWeight = 0

  for (const c of criteriaScores) {
    const weight = c.linkageScore
    weightedSum += c.totalScore * weight
    totalWeight += weight
  }

  return totalWeight > 0
    ? Math.max(0, Math.min(1, weightedSum / totalWeight))
    : 0.5
}

// ─── 7. Confidence Stability Scores ───────────────────────────────────────

/**
 * Calculate the Confidence Stability Score.
 *
 * Stability tracks how settled a score is under sustained scrutiny.
 * A high score that's been stable under many arguments means something different
 * from one that bounces around with each new arrival.
 *
 * Stability is a function of two factors:
 *   1. Argument depth (argFactor): more arguments = more stress-tested
 *   2. Dominance ratio (balanceFactor): a clearly dominant side = more stable
 *
 * Formula:
 *   argFactor    = min(1, argCount / STABILITY_ARG_THRESHOLD)
 *   dominanceRatio = |proStrength - conStrength| / (proStrength + conStrength)
 *   balanceFactor  = dominanceRatio  (0 = perfectly balanced, 1 = fully dominant)
 *   stabilityScore = argFactor × (0.4 + 0.6 × balanceFactor)
 *
 * The constant 0.4 ensures a stable minimum for well-argued beliefs — we don't
 * want a perfectly balanced but heavily argued belief to score 0.
 *
 * @param proStrength - Total pro-argument ReasonRank contribution.
 * @param conStrength - Total con-argument ReasonRank contribution.
 * @param argumentCount - Total number of arguments (pro + con).
 */
export function calculateConfidenceStabilityScore(
  proStrength: number,
  conStrength: number,
  argumentCount: number,
): ConfidenceStabilityResult {
  // Argument depth factor: 10 arguments = fully stress-tested baseline
  const STABILITY_ARG_THRESHOLD = 10
  const argFactor = Math.min(1, argumentCount / STABILITY_ARG_THRESHOLD)

  const totalStrength = proStrength + conStrength
  const dominanceRatio = totalStrength > 0
    ? Math.abs(proStrength - conStrength) / totalStrength
    : 0  // No arguments → perfectly uncertain

  // Stability: deep debates with one-sided evidence are most stable
  const stabilityScore = argFactor * (0.4 + 0.6 * dominanceRatio)
  const clamped = Math.max(0, Math.min(1, stabilityScore))

  let status: ConfidenceStabilityResult['status']
  if (clamped >= 0.75) status = 'robust'
  else if (clamped >= 0.50) status = 'established'
  else if (clamped >= 0.25) status = 'developing'
  else status = 'fragile'

  return {
    stabilityScore: clamped,
    status,
    argumentCount,
    dominanceRatio,
  }
}

// ─── 8 & 9. Media Truth Scores and Media Genre and Style Scores ───────────

/**
 * Calculate Media Truth Score and Media Genre Score for a media source.
 *
 * Media Truth Scores flag when a source is editorializing, sensationalizing,
 * or misleading — even when the underlying facts are technically accurate.
 *
 * Media Genre and Style Scores classify the source by genre and assign a
 * reliability weight that parallels the Evidence tier system:
 *   T1 (peer_reviewed, institutional) = 1.00
 *   T2 (investigative, news_report)   = 0.75
 *   T3 (editorial)                    = 0.50
 *   T4 (opinion, social_media)        = 0.25
 *
 * @param genreType - The genre classification of the source.
 */
export function calculateMediaScores(genreType: MediaGenreType): MediaScoreResult {
  const truthScore = GENRE_BASE_TRUTH_SCORES[genreType]
  const genreScore = GENRE_RELIABILITY_SCORES[genreType]
  const reliabilityTier = GENRE_TO_TIER[genreType]
  const genreDescription = GENRE_DESCRIPTIONS[genreType]

  return { truthScore, genreScore, genreType, reliabilityTier, genreDescription }
}

/**
 * Infer genre type from a mediaType string if no explicit genre is set.
 *
 * This bridges legacy data (where only "article" / "book" / "podcast" etc.
 * were stored) to the richer genre classification system.
 */
export function inferGenreFromMediaType(mediaType: string): MediaGenreType {
  const normalized = mediaType.toLowerCase().trim()

  const mapping: Record<string, MediaGenreType> = {
    book:          'investigative',   // Books typically have editorial review
    article:       'news_report',     // Default articles = news report tier
    academic:      'peer_reviewed',   // Academic papers = T1
    journal:       'peer_reviewed',
    paper:         'peer_reviewed',
    report:        'institutional',
    podcast:       'opinion',         // Podcasts are mostly opinion/commentary
    video:         'opinion',
    documentary:   'investigative',
    tweet:         'social_media',
    post:          'social_media',
    blog:          'opinion',
    editorial:     'editorial',
    opinion:       'opinion',
    news:          'news_report',
    song:          'opinion',
    movie:         'opinion',
  }

  return mapping[normalized] ?? 'unknown'
}

/**
 * Aggregate media truth scores for a set of media resources.
 *
 * Returns the tier-weighted average, so T1 sources pull the aggregate
 * higher than T4 sources can pull it down.
 */
export function aggregateMediaScores(
  resources: Array<{ truthScore: number; genreScore: number }>,
): { avgTruthScore: number; avgGenreScore: number } {
  if (resources.length === 0) {
    return { avgTruthScore: 0.5, avgGenreScore: 0.5 }
  }

  let weightedTruthSum = 0
  let weightedGenreSum = 0
  let totalWeight = 0

  for (const r of resources) {
    // Weight each resource by its own genre score (high-quality sources count more)
    const weight = r.genreScore
    weightedTruthSum += r.truthScore * weight
    weightedGenreSum += r.genreScore * weight
    totalWeight += weight
  }

  return {
    avgTruthScore: totalWeight > 0 ? weightedTruthSum / totalWeight : 0.5,
    avgGenreScore: totalWeight > 0 ? weightedGenreSum / totalWeight : 0.5,
  }
}

// ─── 10. Topic Overlap Scores ─────────────────────────────────────────────

/**
 * Calculate Topic Overlap Score for a set of beliefs or arguments.
 *
 * Prevents the same basic point from inflating a score because ten people
 * said it slightly differently. Repetition is not confirmation.
 *
 * This is a lightweight wrapper around the duplication-scoring module's
 * Layer 1 (mechanical equivalence) check. The full three-layer pipeline
 * requires semantic embeddings from the backend; this function provides
 * the token-overlap approximation suitable for the frontend.
 *
 * @param items - Items to compare, each with an id and statement/claim text.
 * @returns TopicOverlapResult with uniqueness scores for each item.
 */
export function calculateTopicOverlapScore(
  items: Array<{ id: string; text: string }>,
): TopicOverlapResult {
  const { mechanicalSimilarity } = require('./duplication-scoring') as {
    mechanicalSimilarity: (a: string, b: string) => number
  }

  const MECHANICAL_THRESHOLD = 0.85

  const contributionFactors: Record<string, number> = {}
  let duplicatePairCount = 0
  let uniquenessSum = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const similarities: number[] = []

    for (let j = 0; j < i; j++) {
      const sim = mechanicalSimilarity(item.text, items[j].text)
      similarities.push(sim)
      if (sim >= MECHANICAL_THRESHOLD) {
        duplicatePairCount++
      }
    }

    const maxSim = similarities.length > 0 ? Math.max(...similarities) : 0
    const uniqueness = Math.max(0, Math.min(1, 1 - maxSim))
    contributionFactors[item.id] = uniqueness
    uniquenessSum += uniqueness
  }

  const averageUniqueness = items.length > 0 ? uniquenessSum / items.length : 1.0

  return { averageUniqueness, duplicatePairCount, contributionFactors }
}

// ─── 11. Belief Equivalency Scores ───────────────────────────────────────

/**
 * Calculate the Belief Equivalency Score between two belief statements.
 *
 * Identifies when two differently-worded beliefs are making the same
 * underlying claim, so the platform can link them and surface the
 * better-argued version rather than running parallel redundant debates.
 *
 * Layer 1 (mechanical, implemented here): token overlap after synonym
 * canonicalization and negated-antonym normalization.
 *
 * Layer 2 (semantic, from backend): cosine similarity of embeddings.
 * Pass semanticSimilarity when available for a more accurate score.
 *
 * Blending: when both layers available, score = 0.4 × L1 + 0.6 × L2.
 * When only L1 available, score = L1.
 *
 * @param statementA - First belief statement.
 * @param statementB - Second belief statement.
 * @param semanticSimilarity - Pre-computed semantic similarity (0-1) or null.
 */
export function calculateBeliefEquivalencyScore(
  statementA: string,
  statementB: string,
  semanticSimilarity: number | null = null,
): BeliefEquivalencyResult {
  const { mechanicalSimilarity: mSim } = require('./duplication-scoring') as {
    mechanicalSimilarity: (a: string, b: string) => number
  }

  const MECHANICAL_THRESHOLD = 0.85

  const mechanicalSim = mSim(statementA, statementB)
  const isMechanicalEquivalent = mechanicalSim >= MECHANICAL_THRESHOLD

  let equivalencyScore: number
  if (isMechanicalEquivalent) {
    equivalencyScore = 1.0
  } else if (semanticSimilarity !== null) {
    equivalencyScore = Math.max(0, Math.min(1, 0.4 * mechanicalSim + 0.6 * semanticSimilarity))
  } else {
    equivalencyScore = mechanicalSim
  }

  let relationship: BeliefEquivalencyResult['relationship']
  if (equivalencyScore >= 0.90) relationship = 'identical'
  else if (equivalencyScore >= 0.70) relationship = 'near-identical'
  else if (equivalencyScore >= 0.45) relationship = 'overlapping'
  else if (equivalencyScore >= 0.20) relationship = 'related'
  else relationship = 'distinct'

  return {
    equivalencyScore,
    mechanicalSimilarity: mechanicalSim,
    isMechanicalEquivalent,
    relationship,
  }
}

// ─── Combined Belief Score Summary ────────────────────────────────────────

/**
 * All 11 ReasonRank scores for a single belief.
 */
export interface AllBeliefScores {
  // Fundamental Scores
  /** 1. Truth Score breakdown (Logical Validity + Verification) */
  truthScore: TruthScoreBreakdown
  /** 2. Linkage Score: weighted average across all arguments (pro + con) */
  avgLinkageScore: number
  /** 3. Importance Score: importance-weighted argument contribution */
  importanceWeightedScore: number
  /** 4. Evidence Score: aggregate EVS across all evidence items */
  aggregateEvidenceScore: number
  /** 5. Cost/Benefit Likelihood Score: net expected value (if CBA exists) */
  cbaLikelihoodScore: number | null
  /** 6. Objective Criteria Score: aggregated across all criteria */
  objectiveCriteriaScore: number
  /** 7. Confidence Stability Score */
  confidenceStability: ConfidenceStabilityResult

  // Administrative Scores
  /** 8. Media Truth Score: average across all media resources */
  mediaTruthScore: number
  /** 9. Media Genre Score: average genre reliability weight */
  mediaGenreScore: number
  /** 10. Topic Overlap: average uniqueness across arguments */
  topicOverlapScore: number
  /** 11. Belief Equivalency: score vs. most similar related belief (if any) */
  beliefEquivalencyScore: number | null
}

/**
 * Compute all 11 ReasonRank scores for a belief given its full data.
 *
 * This is the primary integration point: pass a belief's complete data
 * and receive all scores in one call.
 */
export function computeAllBeliefScores(belief: {
  arguments: Array<{
    side: string
    truthScore?: number
    fallacyPenalty?: number
    impactScore: number
    importanceScore: number
    linkageScore: number
  }>
  evidence: Array<{
    side: string
    evsScore: number
    linkageScore: number
  }>
  objectiveCriteria: Array<{
    id: number
    description: string
    criteriaType: string | null
    validityScore: number
    reliabilityScore: number
    independenceScore: number
    linkageScore: number
    totalScore: number
  }>
  mediaResources: Array<{
    truthScore: number
    genreScore: number
  }>
  costBenefitAnalysis: {
    benefitLikelihood: number | null
    costLikelihood: number | null
  } | null
  similarTo: Array<{
    equivalencyScore?: number
  }>
  similarFrom: Array<{
    equivalencyScore?: number
  }>
}): AllBeliefScores {
  const args = belief.arguments
  const evidence = belief.evidence

  // 1. Truth Score
  const truthScore = calculateTruthScoreBreakdown(
    args.map(a => ({
      side: a.side,
      truthScore: a.truthScore ?? 0.5,
      fallacyPenalty: a.fallacyPenalty,
      impactScore: a.impactScore,
    })),
    evidence,
  )

  // 2. Linkage Score (average across all arguments)
  const allArgs = args
  const avgLinkageScore = allArgs.length > 0
    ? allArgs.reduce((sum, a) => sum + a.linkageScore, 0) / allArgs.length
    : 0.5

  // 3. Importance Score (importance-weighted impact contribution)
  const importanceWeightedScore = (() => {
    const proArgs = args.filter(a => a.side === 'agree')
    const conArgs = args.filter(a => a.side === 'disagree')
    const proSum = proArgs.reduce((s, a) => s + Math.abs(a.impactScore) * a.importanceScore, 0)
    const conSum = conArgs.reduce((s, a) => s + Math.abs(a.impactScore) * a.importanceScore, 0)
    const total = proSum + conSum
    return total > 0 ? proSum / total : 0.5
  })()

  // 4. Evidence Score (aggregate EVS)
  const supportingEVS = evidence
    .filter(e => e.side === 'supporting')
    .reduce((s, e) => s + e.evsScore, 0)
  const weakeningEVS = evidence
    .filter(e => e.side === 'weakening')
    .reduce((s, e) => s + e.evsScore, 0)
  const totalEVS = supportingEVS + weakeningEVS
  const aggregateEvidenceScore = totalEVS > 0 ? supportingEVS / totalEVS : 0.5

  // 5. CBA Likelihood Score
  const cbaLikelihoodScore = (() => {
    if (!belief.costBenefitAnalysis) return null
    const bl = belief.costBenefitAnalysis.benefitLikelihood
    const cl = belief.costBenefitAnalysis.costLikelihood
    if (bl === null && cl === null) return null
    const b = bl ?? 0.5
    const c = cl ?? 0.5
    // Net likelihood: if benefits are more likely than costs, score is positive
    return Math.max(0, Math.min(1, (b - c) / 2 + 0.5))
  })()

  // 6. Objective Criteria Score
  const criteriaScores = belief.objectiveCriteria.map(c =>
    calculateObjectiveCriteriaScore(c)
  )
  const objectiveCriteriaScore = aggregateObjectiveCriteriaScores(criteriaScores)

  // 7. Confidence Stability Score
  const proStrength = args
    .filter(a => a.side === 'agree')
    .reduce((s, a) => s + Math.abs(a.impactScore), 0)
  const conStrength = args
    .filter(a => a.side === 'disagree')
    .reduce((s, a) => s + Math.abs(a.impactScore), 0)
  const confidenceStability = calculateConfidenceStabilityScore(
    proStrength, conStrength, args.length
  )

  // 8 & 9. Media Truth and Genre Scores
  const mediaAgg = aggregateMediaScores(belief.mediaResources)
  const mediaTruthScore = mediaAgg.avgTruthScore
  const mediaGenreScore = mediaAgg.avgGenreScore

  // 10. Topic Overlap Score (uniqueness of arguments)
  const argTexts = args.map((a, i) => ({
    id: String(i),
    text: String(a.impactScore) + String(a.side),  // use available fields as proxy
  }))
  // Only compute if we have sibling arguments to compare
  const topicOverlapScore = argTexts.length > 1
    ? calculateTopicOverlapScore(argTexts).averageUniqueness
    : 1.0

  // 11. Belief Equivalency Score (max equivalency with any similar belief)
  const allSimilar = [
    ...belief.similarTo.map(s => s.equivalencyScore ?? 0),
    ...belief.similarFrom.map(s => s.equivalencyScore ?? 0),
  ]
  const beliefEquivalencyScore = allSimilar.length > 0
    ? Math.max(...allSimilar)
    : null

  return {
    truthScore,
    avgLinkageScore,
    importanceWeightedScore,
    aggregateEvidenceScore,
    cbaLikelihoodScore,
    objectiveCriteriaScore,
    confidenceStability,
    mediaTruthScore,
    mediaGenreScore,
    topicOverlapScore,
    beliefEquivalencyScore,
  }
}
