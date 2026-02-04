/**
 * Unified Scoring Engine for the Idea Stock Exchange
 *
 * This module is the single source of truth for all scoring calculations.
 * It bridges the master formula (src/lib/scoring.ts), the CBA scoring
 * (lib/cba-scoring.ts), and the Protocol scoring into one coherent system.
 *
 * Score Types (from the ReasonRank system):
 *   1. ReasonRank     - Foundation: argument tree strength after adversarial scrutiny
 *   2. Truth Score    - ReasonRank applied to logical validity + empirical verification
 *   3. Linkage Score  - ReasonRank applied to evidence-to-conclusion relevance
 *   4. Evidence Score  - ReasonRank applied to evidence quality (EVS)
 *   5. Importance Weight - How much this argument moves the probability (0-1)
 *   6. Objective Criteria - Highest-scoring standards for measuring belief strength
 *   7. Likelihood Score   - ReasonRank applied to cost/benefit predictions
 *
 * All scores flow through the same recursive engine.
 */

import { SchilchtArgument, SchilchtEvidence, SchilchtBelief } from './types/schlicht'
import { LikelihoodEstimate, LikelihoodBelief, LikelihoodStatus } from './types/cba'

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
  proArgumentStrength: number  // total pro argument impact
  conArgumentStrength: number  // total con argument impact
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
  truthScore: number
  linkageScore: number
  importanceWeight: number
  rawImpact: number          // truth * linkage * importance (adjusted by sub-arguments)
  signedImpact: number       // positive for pro, negative for con
  certifiedBy: string[]
  fallacyPenalty: number     // total penalty from detected fallacies
  subArgumentCount: number   // number of recursive sub-arguments
  subArgumentNetStrength: number // net strength from sub-argument tree
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
 * Calculate linkage score from linkage arguments.
 * Linkage arguments are meta-arguments about whether the linkage
 * between an argument and its conclusion is valid.
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

// ─── Argument Scoring ───────────────────────────────────────────

/**
 * Calculate the full impact of a single argument, recursively scoring
 * its sub-argument tree.
 *
 * Impact = truthScore * linkageScore * importanceWeight
 *
 * Three recursive metrics (from ReasonRank):
 *   1. Truth:      Is the evidence factually accurate? (0-1)
 *   2. Linkage:    How strongly does this connect to the specific prediction? (0-1)
 *   3. Importance: How much does this argument move the probability? (0-1)
 *
 * Sub-arguments modify the parent's effective truth score:
 *   - Pro sub-arguments strengthen the parent (evidence supports the claim)
 *   - Con sub-arguments weaken it (evidence undermines the claim)
 *   - Net sub-argument strength adjusts truth by up to ±30%
 *
 * Fallacy penalties reduce the truth score multiplicatively.
 * The result is signed: positive for pro, negative for con.
 */
export function scoreArgument(arg: SchilchtArgument): ArgumentScoreBreakdown {
  // Apply fallacy penalties to truth score
  const fallacyPenalty = arg.fallaciesDetected.reduce(
    (sum, f) => sum + Math.abs(f.impact) / 100,
    0
  )
  let adjustedTruth = Math.max(0, arg.truthScore * (1 - fallacyPenalty))

  // Recursively score sub-arguments if they exist
  let subArgumentCount = 0
  let subArgumentNetStrength = 0

  if (arg.subArguments && arg.subArguments.length > 0) {
    const subBreakdowns = arg.subArguments.map(scoreArgument)
    subArgumentCount = arg.subArguments.length

    const proSubStrength = subBreakdowns
      .filter(b => b.side === 'pro')
      .reduce((sum, b) => sum + b.rawImpact, 0)
    const conSubStrength = subBreakdowns
      .filter(b => b.side === 'con')
      .reduce((sum, b) => sum + b.rawImpact, 0)

    subArgumentNetStrength = proSubStrength - conSubStrength

    // Sub-arguments adjust the parent's effective truth by up to ±30%
    const maxSubStrength = Math.max(subArgumentCount, 1)
    const subFactor = 1 + (subArgumentNetStrength / maxSubStrength) * 0.3
    adjustedTruth = Math.max(0, Math.min(1, adjustedTruth * subFactor))
  }

  // Importance weight: how much this argument moves the probability
  // Defaults to 1.0 if not specified
  const importanceWeight = arg.importanceScore ?? 1.0

  const rawImpact = adjustedTruth * arg.linkageScore * importanceWeight
  const direction = arg.side === 'pro' ? 1 : -1
  const signedImpact = rawImpact * direction

  return {
    id: arg.id,
    claim: arg.claim,
    side: arg.side,
    truthScore: adjustedTruth,
    linkageScore: arg.linkageScore,
    importanceWeight,
    rawImpact,
    signedImpact,
    certifiedBy: arg.certifiedBy,
    fallacyPenalty,
    subArgumentCount,
    subArgumentNetStrength,
  }
}

// ─── Belief Scoring (Protocol) ──────────────────────────────────

/**
 * Calculate the full score breakdown for a Schlicht Protocol belief.
 *
 * This implements the master formula:
 *   CS = (ProArgumentScore - ConArgumentScore) + (SupportingEvidence - WeakeningEvidence)
 *
 * Each argument's contribution is weighted by its truth, linkage, and importance.
 * Evidence is weighted by its verification score and tier.
 *
 * The truth score is normalized to 0-1 where 0.5 = maximum uncertainty.
 */
export function scoreProtocolBelief(belief: SchilchtBelief): ScoreBreakdown {
  // Score all arguments
  const proBreakdowns = belief.proTree.map(scoreArgument)
  const conBreakdowns = belief.conTree.map(scoreArgument)
  const allBreakdowns = [...proBreakdowns, ...conBreakdowns]

  const proStrength = proBreakdowns.reduce((sum, b) => sum + b.rawImpact, 0)
  const conStrength = conBreakdowns.reduce((sum, b) => sum + b.rawImpact, 0)

  // Score evidence
  let supportingEvidenceScore = 0
  let weakeningEvidenceScore = 0

  for (const ev of belief.evidence) {
    const tierWeight = getEvidenceTypeWeight(ev.tier)
    const evidenceImpact = tierWeight * ev.linkageScore
    // Evidence in Protocol format doesn't have side, so we treat all as supporting
    // (counter-evidence would be in the con tree as arguments)
    supportingEvidenceScore += evidenceImpact
  }

  // Calculate net scores
  const argumentNet = proStrength - conStrength
  const evidenceNet = supportingEvidenceScore - weakeningEvidenceScore

  // Calculate weighted average linkage across all arguments
  const totalArgs = belief.proTree.length + belief.conTree.length
  const avgLinkage = totalArgs > 0
    ? allBreakdowns.reduce((sum, b) => sum + b.linkageScore, 0) / totalArgs
    : 0.5

  // Normalize truth score to 0-1
  // Total possible strength = number of arguments (each maxes at 1.0 impact)
  const maxStrength = Math.max(totalArgs, 1)
  const normalizedNet = argumentNet / maxStrength

  // Add evidence contribution (scaled to not dominate)
  const evidenceContribution = belief.evidence.length > 0
    ? evidenceNet / (belief.evidence.length * 1.0) * 0.2 // evidence contributes up to 20%
    : 0

  const truthScore = Math.max(0.01, Math.min(0.99, 0.5 + (normalizedNet + evidenceContribution) * 0.5))

  // Calculate confidence interval
  // Narrows with more arguments, widens with more disagreement
  const argBalance = totalArgs > 0 ? Math.abs(proStrength - conStrength) / (proStrength + conStrength || 1) : 0
  const baseCI = 0.15
  const argFactor = Math.max(0.3, 1 - totalArgs * 0.03) // more args = tighter
  const balanceFactor = 1 - argBalance * 0.5 // higher imbalance = tighter (clearer winner)
  const confidenceInterval = Math.max(0.02, Math.min(0.2, baseCI * argFactor * balanceFactor))

  return {
    truthScore,
    confidenceInterval,
    argumentScore: argumentNet,
    evidenceScore: evidenceNet,
    linkageScore: avgLinkage,
    importanceWeight: 1.0,
    proArgumentStrength: proStrength,
    conArgumentStrength: conStrength,
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

// ─── CBA / Likelihood Scoring ───────────────────────────────────

/**
 * Calculate ReasonRank score for a likelihood estimate.
 *
 * This uses the same argument scoring as the Protocol,
 * but applied to competing probability estimates.
 *
 * Score = (proStrength - conStrength) / maxPossibleStrength, normalized to 0-1
 */
export function calculateReasonRankScore(estimate: LikelihoodEstimate): number {
  const proBreakdowns = estimate.proArguments.map(scoreArgument)
  const conBreakdowns = estimate.conArguments.map(scoreArgument)

  const proStrength = proBreakdowns.reduce((sum, b) => sum + b.rawImpact, 0)
  const conStrength = conBreakdowns.reduce((sum, b) => sum + b.rawImpact, 0)

  const totalArgs = estimate.proArguments.length + estimate.conArguments.length
  if (totalArgs === 0) return 0.5 // No arguments = maximum uncertainty

  // Net strength normalized to 0-1
  const maxStrength = totalArgs // theoretical max if all scores were 1.0
  const netStrength = proStrength - conStrength
  const normalized = 0.5 + (netStrength / (maxStrength * 2))

  return Math.max(0.01, Math.min(0.99, normalized))
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
 * Impact = truth * linkage * importance * 100, signed by side.
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
