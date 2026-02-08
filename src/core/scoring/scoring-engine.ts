/**
 * Unified Scoring Engine for the Idea Stock Exchange
 *
 * ReasonRank — a PageRank-inspired algorithm for epistemic scoring.
 *
 * Like Google's PageRank, ReasonRank propagates scores bottom-up through a
 * directed graph. But where PageRank has one score per node and only positive
 * links, ReasonRank has TWO score channels (pro and con) and subtracts
 * "reasons to disagree" from "reasons to agree."
 *
 * Core analogy:
 *   PageRank:   PR(A) = (1−d)/N + d × Σ PR(Tᵢ)/C(Tᵢ)
 *   ReasonRank: RR(A) = (1−d) × baseTruth + d × f(proSubRank − conSubRank)
 *
 * Where:
 *   d          = damping factor (0.85, same as PageRank)
 *   baseTruth  = argument's own truth score after fallacy penalties
 *   proSubRank = Σ RR(sub) × linkage × importance × uniqueness  (for pro subs)
 *   conSubRank = Σ RR(sub) × linkage × importance × uniqueness  (for con subs)
 *   f(net)     = normalize net sub-argument support to [0, 1]
 *
 * Key properties:
 *   1. Bottom-up recursive: each node's score is fully determined by its
 *      immediate children — no need to look at distant ancestors or depth.
 *   2. No depth penalty: a deep argument contributes naturally through its
 *      parent's recursion, exactly like PageRank propagation.
 *   3. Two-sided: pro sub-arguments increase support, con sub-arguments
 *      decrease it (PageRank only has positive in-links).
 *   4. Weighted edges: linkage × importance × uniqueness act as edge weights,
 *      analogous to PageRank's 1/C(T) outlink normalization.
 *   5. Redundancy control: uniqueness scores (0-1) penalize arguments that
 *      are merely restating the same point, preventing score inflation.
 *
 * Belief-level scoring:
 *   ProRank  = Σ RR(arg) × linkage × importance × uniqueness  (for pro args)
 *   ConRank  = Σ RR(arg) × linkage × importance × uniqueness  (for con args)
 *   TruthScore = ProRank / (ProRank + ConRank)
 *
 * This mirrors PageRank's probability interpretation: the "probability" that
 * a random walker following the argument graph lands on a pro-conclusion.
 */

import { SchilchtArgument, SchilchtEvidence, SchilchtBelief, LinkageDebate, LinkageType } from '../types/schlicht'
import { LikelihoodEstimate, LikelihoodBelief, LikelihoodStatus } from '../types/cba'

// ─── ReasonRank Constants ───────────────────────────────────────

/**
 * Damping factor, analogous to PageRank's d = 0.85.
 * 85% of an argument's score comes from its sub-argument evidence.
 * 15% comes from the argument's own base truth (the "teleportation" term).
 * For leaf arguments with no sub-arguments, 100% comes from base truth.
 */
const DAMPING_FACTOR = 0.85

// ─── Score Breakdown Types ──────────────────────────────────────

/** Full breakdown of how a score was computed */
export interface ScoreBreakdown {
  // Final composite scores
  truthScore: number           // 0-1: overall belief truth score
  confidenceInterval: number   // uncertainty margin

  // Component scores
  argumentScore: number        // net argument strength (pro - con)
  evidenceScore: number        // net evidence strength
  linkageScore: number         // weighted average linkage
  importanceWeight: number     // importance-weighted contribution

  // Detailed sub-scores
  proArgumentStrength: number  // total pro argument ReasonRank contribution
  conArgumentStrength: number  // total con argument ReasonRank contribution
  proArgumentCount: number
  conArgumentCount: number

  // Evidence details
  supportingEvidenceScore: number
  weakeningEvidenceScore: number
  evidenceCount: number

  // Per-argument breakdowns
  argumentBreakdowns: ArgumentScoreBreakdown[]
}

export interface ArgumentScoreBreakdown {
  id: string
  claim: string
  side: 'pro' | 'con'
  truthScore: number           // base truth after fallacy penalties (before sub-arg propagation)
  reasonRank: number           // PageRank-style score after sub-argument propagation
  linkageScore: number         // 0-1: relevance to parent claim
  importanceWeight: number     // 0-1: how much this moves the needle
  uniquenessScore: number      // 0-1: redundancy penalty (1 = fully unique)
  rawImpact: number            // reasonRank × linkage × importance × uniqueness (unsigned)
  signedImpact: number         // positive for pro, negative for con
  certifiedBy: string[]
  fallacyPenalty: number       // total penalty from detected fallacies
  subArgumentCount: number     // number of direct sub-arguments
  subArgumentNetStrength: number // proSubRank − conSubRank (before normalization)
}

// ─── Evidence Verification Score ────────────────────────────────

const EVIDENCE_TYPE_WEIGHTS: Record<string, number> = {
  T1: 1.0,   // Peer-reviewed / Official
  T2: 0.75,  // Expert / Institutional
  T3: 0.5,   // Journalism / Surveys
  T4: 0.25,  // Opinion / Anecdote
}

export function getEvidenceTypeWeight(tier: string): number {
  return EVIDENCE_TYPE_WEIGHTS[tier] ?? 0.5
}

/**
 * Calculate Evidence Verification Score (EVS)
 * EVS = ESIW * log2(ERQ + 1) * ECRS * ERP
 */
export function calculateEVS(input: {
  sourceIndependenceWeight: number  // ESIW: tier-based weight (0-1)
  replicationQuantity: number       // ERQ: number of replications
  conclusionRelevance: number       // ECRS: relevance to conclusion (0-1)
  replicationPercentage: number     // ERP: consistency of replications (0-1)
}): number {
  return (
    input.sourceIndependenceWeight *
    Math.log2(input.replicationQuantity + 1) *
    input.conclusionRelevance *
    input.replicationPercentage
  )
}

// ─── Linkage Score ──────────────────────────────────────────────

/**
 * Score a LinkageDebate to determine the Linkage Score (LS).
 *
 * A LinkageDebate is a sub-claim ("Does Evidence A support Claim B?")
 * with its own pro/con argument trees. The LS is derived from the
 * ReasonRank of this sub-debate, using the same PageRank-style scoring
 * as any other belief.
 *
 * This replaces the old static formula:
 *   LS_old = (DR × 0.40) + (CS × 0.30) + (NC × 0.20) + (SC × 0.10)
 *
 * New logic:
 *   LS = ReasonRank of the claim "Evidence A supports Claim B"
 *   LS = ProRank / (ProRank + ConRank), or 0.5 if no arguments.
 */
export function scoreLinkageDebate(debate: LinkageDebate): number {
  if (debate.proArguments.length === 0 && debate.conArguments.length === 0) {
    return 0.5 // No arguments = neutral default
  }

  // Score pro and con arguments using the same recursive ReasonRank
  const proBreakdowns = debate.proArguments.map(scoreArgument)
  const conBreakdowns = debate.conArguments.map(scoreArgument)

  const proRank = proBreakdowns.reduce((sum, b) => sum + b.rawImpact, 0)
  const conRank = conBreakdowns.reduce((sum, b) => sum + b.rawImpact, 0)

  const totalRank = proRank + conRank
  if (totalRank === 0) return 0.5

  // PageRank probability interpretation: pro / (pro + con)
  return Math.max(0.01, Math.min(0.99, proRank / totalRank))
}

/**
 * Resolve the linkage score for an argument.
 * If the argument has a LinkageDebate attached, derive the score from it.
 * Otherwise, fall back to the static linkageScore field.
 */
export function resolveLinkageScore(arg: SchilchtArgument): number {
  if (arg.linkageDebate) {
    return scoreLinkageDebate(arg.linkageDebate)
  }
  return arg.linkageScore
}

/**
 * Create the sub-claim text for a linkage debate.
 * This is the statement that pro/con arguments will argue for/against.
 */
export function generateLinkageSubClaim(
  evidenceClaim: string,
  parentClaim: string,
  linkageType: LinkageType
): string {
  const typeLabels: Record<LinkageType, string> = {
    causal: 'is a direct cause supporting',
    necessary_condition: 'is a necessary condition for',
    sufficient_condition: 'is sufficient to prove',
    strengthener: 'strengthens the case for',
  }
  return `"${evidenceClaim}" ${typeLabels[linkageType]} "${parentClaim}"`
}

/**
 * Calculate linkage score from simple linkage arguments (legacy support).
 * Maintained for backward compatibility with existing data.
 *
 * ECLS = SUM(agree strengths) / SUM(all strengths)
 * Returns 0.5 if no linkage arguments exist (neutral).
 */
export function calculateLinkageFromArguments(
  linkageArguments: { side: string; strength: number }[]
): number {
  if (linkageArguments.length === 0) return 0.5

  let agreeSum = 0
  let totalSum = 0

  for (const arg of linkageArguments) {
    totalSum += arg.strength
    if (arg.side === 'agree') {
      agreeSum += arg.strength
    }
  }

  return totalSum === 0 ? 0.5 : agreeSum / totalSum
}

// ─── ReasonRank: Argument Scoring ───────────────────────────────

/**
 * Calculate the ReasonRank score for a single argument, recursively
 * propagating scores from its sub-argument tree (PageRank-style).
 *
 * Like PageRank, each argument's score is determined by the scores
 * flowing in from its sub-arguments. Unlike PageRank, we have two
 * channels: pro sub-arguments add support, con sub-arguments subtract.
 *
 * For leaf arguments (no sub-arguments):
 *   ReasonRank = baseTruth
 *   (Like a PageRank node with no incoming links — gets only the
 *   teleportation/damping term, which here is the base truth.)
 *
 * For arguments with sub-arguments:
 *   proSubRank = Σ (RR(sub) × sub.linkage × sub.importance × sub.uniqueness) for pro subs
 *   conSubRank = Σ (RR(sub) × sub.linkage × sub.importance × sub.uniqueness) for con subs
 *   netNormalized = (proSubRank − conSubRank) / numSubArgs
 *   subArgScore = 0.5 + netNormalized × 0.5     (maps [-1,1] → [0,1])
 *   ReasonRank = (1 − d) × baseTruth + d × subArgScore
 *
 * The rawImpact is this argument's weighted contribution to its parent:
 *   rawImpact = ReasonRank × linkage × importance × uniqueness
 */
export function scoreArgument(arg: SchilchtArgument): ArgumentScoreBreakdown {
  // Apply fallacy penalties to truth score (multiplicative reduction)
  const fallacyPenalty = arg.fallaciesDetected.reduce(
    (sum, f) => sum + Math.abs(f.impact) / 100,
    0
  )
  const baseTruth = Math.max(0, arg.truthScore * (1 - fallacyPenalty))

  // Edge weights for this argument's contribution to its parent
  const importanceWeight = arg.importanceScore ?? 1.0
  const uniquenessScore = arg.uniquenessScore ?? 1.0

  // Resolve linkage score: use linkage debate if available, otherwise static value
  const effectiveLinkageScore = resolveLinkageScore(arg)

  let reasonRank: number
  let subArgumentCount = 0
  let subArgumentNetStrength = 0

  if (!arg.subArguments || arg.subArguments.length === 0) {
    // Leaf node: ReasonRank is just the base truth.
    // Like a PageRank node with no incoming links.
    reasonRank = baseTruth
  } else {
    // Recursively compute ReasonRank for all sub-arguments.
    // Each sub-argument's rawImpact already incorporates its own
    // ReasonRank × linkage × importance × uniqueness.
    const subBreakdowns = arg.subArguments.map(scoreArgument)
    subArgumentCount = subBreakdowns.length

    // Sum weighted contributions from pro and con sub-arguments.
    // This is analogous to summing incoming PageRank contributions,
    // but with pro adding and con subtracting.
    const proSubRank = subBreakdowns
      .filter(b => b.side === 'pro')
      .reduce((sum, b) => sum + b.rawImpact, 0)
    const conSubRank = subBreakdowns
      .filter(b => b.side === 'con')
      .reduce((sum, b) => sum + b.rawImpact, 0)

    subArgumentNetStrength = proSubRank - conSubRank

    // Normalize by number of sub-arguments.
    // Each sub can contribute at most 1.0 (RR=1 × linkage=1 × importance=1 × uniqueness=1),
    // so dividing by count keeps the normalized value in [-1, 1].
    const normalizedNet = subArgumentNetStrength / subArgumentCount

    // Map [-1, 1] → [0, 1] so we can blend with base truth.
    // +1 (all pro, max strength) → 1.0
    //  0 (balanced or no net)    → 0.5
    // -1 (all con, max strength) → 0.0
    const subArgScore = Math.max(0, Math.min(1, 0.5 + normalizedNet * 0.5))

    // PageRank-style damped combination:
    // 15% from base truth (the "teleportation" term)
    // 85% from sub-argument evidence (the "link" term)
    reasonRank = (1 - DAMPING_FACTOR) * baseTruth + DAMPING_FACTOR * subArgScore
  }

  // This argument's weighted contribution to its parent.
  // Incorporates ReasonRank (recursive quality) × linkage (relevance) ×
  // importance (how much it moves the needle) × uniqueness (redundancy penalty).
  // Linkage is now derived from its own sub-debate when available.
  const rawImpact = reasonRank * effectiveLinkageScore * importanceWeight * uniquenessScore
  const direction = arg.side === 'pro' ? 1 : -1
  const signedImpact = rawImpact * direction

  return {
    id: arg.id,
    claim: arg.claim,
    side: arg.side,
    truthScore: baseTruth,
    reasonRank,
    linkageScore: effectiveLinkageScore,
    importanceWeight,
    uniquenessScore,
    rawImpact,
    signedImpact,
    certifiedBy: arg.certifiedBy,
    fallacyPenalty,
    subArgumentCount,
    subArgumentNetStrength,
  }
}

// ─── ReasonRank: Belief Scoring (Protocol) ──────────────────────

/**
 * Calculate the full score breakdown for a Schlicht Protocol belief.
 *
 * Uses PageRank-style scoring:
 *   ProRank  = Σ rawImpact for pro arguments
 *   ConRank  = Σ rawImpact for con arguments
 *   TruthScore = ProRank / (ProRank + ConRank)
 *
 * This is the PageRank probability interpretation: the "probability"
 * that a random walker following the argument graph lands on a
 * pro-conclusion node.
 *
 * Evidence provides a supplementary signal (up to 20% contribution)
 * that can shift the score when argument trees are sparse.
 */
export function scoreProtocolBelief(belief: SchilchtBelief): ScoreBreakdown {
  // Score all arguments using recursive ReasonRank
  const proBreakdowns = belief.proTree.map(scoreArgument)
  const conBreakdowns = belief.conTree.map(scoreArgument)
  const allBreakdowns = [...proBreakdowns, ...conBreakdowns]

  // Sum ReasonRank-weighted contributions (rawImpact = RR × linkage × importance × uniqueness)
  const proRank = proBreakdowns.reduce((sum, b) => sum + b.rawImpact, 0)
  const conRank = conBreakdowns.reduce((sum, b) => sum + b.rawImpact, 0)

  // Score evidence
  let supportingEvidenceScore = 0
  let weakeningEvidenceScore = 0

  for (const ev of belief.evidence) {
    const tierWeight = getEvidenceTypeWeight(ev.tier)
    const evidenceImpact = tierWeight * ev.linkageScore
    supportingEvidenceScore += evidenceImpact
  }

  // PageRank-style belief score: ProRank / (ProRank + ConRank)
  // When all arguments favor pro → 1.0, when all favor con → 0.0,
  // when balanced → 0.5 (maximum uncertainty).
  const totalRank = proRank + conRank
  let baseTruthScore: number
  if (totalRank > 0) {
    baseTruthScore = proRank / totalRank
  } else {
    baseTruthScore = 0.5 // No arguments = maximum uncertainty
  }

  // Evidence contribution (scaled to not dominate arguments)
  const evidenceNet = supportingEvidenceScore - weakeningEvidenceScore
  const evidenceContribution = belief.evidence.length > 0
    ? (evidenceNet / (belief.evidence.length * 1.0)) * 0.2
    : 0

  const truthScore = Math.max(0.01, Math.min(0.99, baseTruthScore + evidenceContribution))

  // Calculate weighted average linkage across all arguments
  const totalArgs = belief.proTree.length + belief.conTree.length
  const avgLinkage = totalArgs > 0
    ? allBreakdowns.reduce((sum, b) => sum + b.linkageScore, 0) / totalArgs
    : 0.5

  // Confidence interval narrows with more arguments, widens with disagreement
  const argBalance = totalRank > 0 ? Math.abs(proRank - conRank) / totalRank : 0
  const baseCI = 0.15
  const argFactor = Math.max(0.3, 1 - totalArgs * 0.03) // more args = tighter
  const balanceFactor = 1 - argBalance * 0.5 // higher imbalance = tighter
  const confidenceInterval = Math.max(0.02, Math.min(0.2, baseCI * argFactor * balanceFactor))

  return {
    truthScore,
    confidenceInterval,
    argumentScore: proRank - conRank,
    evidenceScore: evidenceNet,
    linkageScore: avgLinkage,
    importanceWeight: 1.0,
    proArgumentStrength: proRank,
    conArgumentStrength: conRank,
    proArgumentCount: belief.proTree.length,
    conArgumentCount: belief.conTree.length,
    supportingEvidenceScore,
    weakeningEvidenceScore,
    evidenceCount: belief.evidence.length,
    argumentBreakdowns: allBreakdowns,
  }
}

/**
 * Recalculate all metrics for a Protocol belief after a mutation.
 * Returns a new belief object with updated metrics.
 */
export function recalculateProtocolBelief(belief: SchilchtBelief): SchilchtBelief {
  const breakdown = scoreProtocolBelief(belief)

  const totalArgs = belief.proTree.length + belief.conTree.length
  let volatility: 'low' | 'medium' | 'high' = 'low'
  if (breakdown.confidenceInterval > 0.12) volatility = 'high'
  else if (breakdown.confidenceInterval > 0.06) volatility = 'medium'

  let status: 'calibrated' | 'contested' | 'emerging' | 'archived' = 'emerging'
  if (totalArgs >= 4 && breakdown.confidenceInterval < 0.08) {
    status = 'calibrated'
  } else if (totalArgs >= 2 && breakdown.confidenceInterval >= 0.08) {
    status = 'contested'
  }

  return {
    ...belief,
    status,
    metrics: {
      ...belief.metrics,
      truthScore: breakdown.truthScore,
      confidenceInterval: breakdown.confidenceInterval,
      volatility,
      lastUpdated: new Date().toISOString(),
    },
  }
}

// ─── ReasonRank: CBA / Likelihood Scoring ───────────────────────

/**
 * Calculate ReasonRank score for a likelihood estimate.
 *
 * Uses the same PageRank-style argument scoring as Protocol beliefs,
 * applied to competing probability estimates.
 *
 * Score = ProRank / (ProRank + ConRank), or 0.5 if no arguments.
 */
export function calculateReasonRankScore(estimate: LikelihoodEstimate): number {
  const proBreakdowns = estimate.proArguments.map(scoreArgument)
  const conBreakdowns = estimate.conArguments.map(scoreArgument)

  const proRank = proBreakdowns.reduce((sum, b) => sum + b.rawImpact, 0)
  const conRank = conBreakdowns.reduce((sum, b) => sum + b.rawImpact, 0)

  const totalArgs = estimate.proArguments.length + estimate.conArguments.length
  if (totalArgs === 0) return 0.5 // No arguments = maximum uncertainty

  // PageRank probability: pro / (pro + con)
  const totalRank = proRank + conRank
  if (totalRank === 0) return 0.5

  return Math.max(0.01, Math.min(0.99, proRank / totalRank))
}

/**
 * Determine which probability estimate wins based on ReasonRank.
 * The active likelihood is the probability from the estimate
 * with the highest ReasonRank score.
 */
export function determineActiveLikelihood(
  estimates: LikelihoodEstimate[]
): { activeProbability: number; activeEstimateId: string; status: LikelihoodStatus } {
  if (estimates.length === 0) {
    return { activeProbability: 0.5, activeEstimateId: '', status: 'emerging' }
  }

  const scored = estimates.map((est) => ({
    ...est,
    reasonRankScore: calculateReasonRankScore(est),
  }))

  const winner = scored.reduce((best, current) =>
    current.reasonRankScore > best.reasonRankScore ? current : best
  )

  const sortedScores = scored
    .map((e) => e.reasonRankScore)
    .sort((a, b) => b - a)

  let status: LikelihoodStatus = 'emerging'
  if (sortedScores.length >= 2) {
    const gap = sortedScores[0] - sortedScores[1]
    if (gap > 0.2) {
      status = 'calibrated'
    } else {
      status = 'contested'
    }
  } else if (sortedScores.length === 1 && winner.proArguments.length >= 2) {
    status = 'calibrated'
  }

  return {
    activeProbability: winner.probability,
    activeEstimateId: winner.id,
    status,
  }
}

/**
 * Calculate confidence interval for a likelihood belief.
 */
export function calculateLikelihoodCI(belief: LikelihoodBelief): number {
  if (belief.estimates.length <= 1) return 0.15

  const probabilities = belief.estimates.map((e) => e.probability)
  const mean = probabilities.reduce((s, p) => s + p, 0) / probabilities.length
  const variance =
    probabilities.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / probabilities.length
  const stdDev = Math.sqrt(variance)

  const totalArgs = belief.estimates.reduce(
    (s, e) => s + e.proArguments.length + e.conArguments.length,
    0
  )
  const argFactor = Math.max(0.5, 1 - totalArgs * 0.03)

  return Math.min(0.3, Math.max(0.02, stdDev * argFactor))
}

/**
 * Calculate expected value for a CBA line item.
 */
export function calculateExpectedValue(predictedImpact: number, activeLikelihood: number): number {
  return predictedImpact * activeLikelihood
}

/**
 * Calculate impact score for an argument.
 * Impact = truth × linkage × importance × 100, signed by side.
 */
export function calculateArgumentImpact(
  truthScore: number,
  linkageScore: number,
  side: 'pro' | 'con',
  importanceScore: number = 1.0
): number {
  const raw = Math.round(truthScore * linkageScore * importanceScore * 100)
  return side === 'pro' ? raw : -raw
}

/**
 * Get score breakdown for a likelihood estimate.
 */
export function scoreLikelihoodEstimate(estimate: LikelihoodEstimate): {
  reasonRankScore: number
  proStrength: number
  conStrength: number
  argumentBreakdowns: ArgumentScoreBreakdown[]
} {
  const proBreakdowns = estimate.proArguments.map(scoreArgument)
  const conBreakdowns = estimate.conArguments.map(scoreArgument)

  return {
    reasonRankScore: calculateReasonRankScore(estimate),
    proStrength: proBreakdowns.reduce((sum, b) => sum + b.rawImpact, 0),
    conStrength: conBreakdowns.reduce((sum, b) => sum + b.rawImpact, 0),
    argumentBreakdowns: [...proBreakdowns, ...conBreakdowns],
  }
}

// ─── Format helpers ─────────────────────────────────────────────

export function formatScore(score: number): string {
  const sign = score >= 0 ? '+' : ''
  return `${sign}${score.toFixed(1)}`
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(0)}%`
}

export function formatDollars(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`
  return `${sign}$${abs.toFixed(0)}`
}

export function getPositivityLabel(score: number): string {
  if (score >= 0.9) return 'Very High Confidence'
  if (score >= 0.75) return 'High Confidence'
  if (score >= 0.6) return 'Moderate Confidence'
  if (score >= 0.4) return 'Uncertain'
  if (score >= 0.25) return 'Low Confidence'
  return 'Very Low Confidence'
}

export function getScoreColor(score: number): string {
  if (score >= 0.75) return '#22c55e' // green
  if (score >= 0.6) return '#84cc16'  // lime
  if (score >= 0.4) return '#eab308'  // yellow
  if (score >= 0.25) return '#f97316' // orange
  return '#ef4444'                     // red
}
