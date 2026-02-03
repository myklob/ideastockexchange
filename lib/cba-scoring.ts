import { SchilchtArgument } from './types/schlicht'
import {
  CBALineItem,
  CostBenefitAnalysis,
  LikelihoodEstimate,
  LikelihoodBelief,
  LikelihoodStatus,
} from './types/cba'

/**
 * Calculate ReasonRank score for a likelihood estimate based on its argument trees.
 *
 * The score is NOT an average of votes. It reflects the strength of the
 * strongest surviving argument tree after adversarial scrutiny.
 *
 * Score = (proStrength - conStrength) / maxPossibleStrength, normalized to 0-1
 *
 * Each argument's contribution = truthScore × linkageScore × importanceWeight
 * where importanceWeight is derived from the argument's absolute impactScore.
 */
export function calculateReasonRankScore(estimate: LikelihoodEstimate): number {
  const proStrength = estimate.proArguments.reduce((sum, arg) => {
    return sum + arg.truthScore * arg.linkageScore * (Math.abs(arg.impactScore) / 100)
  }, 0)

  const conStrength = estimate.conArguments.reduce((sum, arg) => {
    return sum + arg.truthScore * arg.linkageScore * (Math.abs(arg.impactScore) / 100)
  }, 0)

  const totalArgs = estimate.proArguments.length + estimate.conArguments.length
  if (totalArgs === 0) return 0.5 // No arguments = maximum uncertainty

  // Net strength normalized to 0-1
  const maxStrength = totalArgs // theoretical max if all scores were 1.0
  const netStrength = proStrength - conStrength
  const normalized = 0.5 + (netStrength / (maxStrength * 2))

  return Math.max(0.01, Math.min(0.99, normalized))
}

/**
 * Determine the active (winning) likelihood from competing estimates.
 *
 * The active likelihood is the probability from the estimate with
 * the highest ReasonRank score — i.e., the estimate whose argument
 * tree is strongest after adversarial evaluation.
 *
 * This is NOT an average. It is winner-take-all based on argument strength.
 */
export function determineActiveLikelihood(
  estimates: LikelihoodEstimate[]
): { activeProbability: number; activeEstimateId: string; status: LikelihoodStatus } {
  if (estimates.length === 0) {
    return { activeProbability: 0.5, activeEstimateId: '', status: 'emerging' }
  }

  // Recalculate all scores
  const scored = estimates.map((est) => ({
    ...est,
    reasonRankScore: calculateReasonRankScore(est),
  }))

  // Find the winner
  const winner = scored.reduce((best, current) =>
    current.reasonRankScore > best.reasonRankScore ? current : best
  )

  // Determine status based on score separation
  const sortedScores = scored
    .map((e) => e.reasonRankScore)
    .sort((a, b) => b - a)

  let status: LikelihoodStatus = 'emerging'
  if (sortedScores.length >= 2) {
    const gap = sortedScores[0] - sortedScores[1]
    if (gap > 0.2) {
      status = 'calibrated' // Clear winner
    } else {
      status = 'contested'  // Close competition
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
 * Calculate expected value for a line item.
 * Expected Value = Predicted Impact × Active Likelihood
 */
export function calculateExpectedValue(item: CBALineItem): number {
  return item.predictedImpact * item.likelihoodBelief.activeLikelihood
}

/**
 * Calculate confidence interval for a likelihood belief.
 * Wider when estimates are contested, narrower when one dominates.
 */
export function calculateLikelihoodCI(belief: LikelihoodBelief): number {
  if (belief.estimates.length <= 1) return 0.15 // High uncertainty with few estimates

  const probabilities = belief.estimates.map((e) => e.probability)
  const mean = probabilities.reduce((s, p) => s + p, 0) / probabilities.length
  const variance =
    probabilities.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / probabilities.length
  const stdDev = Math.sqrt(variance)

  // CI narrows with more arguments total
  const totalArgs = belief.estimates.reduce(
    (s, e) => s + e.proArguments.length + e.conArguments.length,
    0
  )
  const argFactor = Math.max(0.5, 1 - totalArgs * 0.03) // More args = tighter CI

  return Math.min(0.3, Math.max(0.02, stdDev * argFactor))
}

/**
 * Recalculate all computed fields for a CBA.
 * Call this after any mutation (new item, new argument, etc.)
 */
export function recalculateCBA(cba: CostBenefitAnalysis): CostBenefitAnalysis {
  const updatedItems = cba.items.map((item) => {
    // Recalculate each estimate's ReasonRank score
    const updatedEstimates = item.likelihoodBelief.estimates.map((est) => ({
      ...est,
      reasonRankScore: calculateReasonRankScore(est),
    }))

    // Determine winning likelihood
    const { activeProbability, activeEstimateId, status } =
      determineActiveLikelihood(updatedEstimates)

    // Mark the active estimate
    const finalEstimates = updatedEstimates.map((est) => ({
      ...est,
      isActive: est.id === activeEstimateId,
    }))

    const updatedBelief: LikelihoodBelief = {
      ...item.likelihoodBelief,
      estimates: finalEstimates,
      activeLikelihood: activeProbability,
      status,
      confidenceInterval: calculateLikelihoodCI({
        ...item.likelihoodBelief,
        estimates: finalEstimates,
        activeLikelihood: activeProbability,
      }),
    }

    const expectedValue = item.predictedImpact * activeProbability

    return {
      ...item,
      likelihoodBelief: updatedBelief,
      expectedValue,
    }
  })

  const benefits = updatedItems.filter((i) => i.type === 'benefit')
  const costs = updatedItems.filter((i) => i.type === 'cost')

  const totalExpectedBenefits = benefits.reduce((s, i) => s + i.expectedValue, 0)
  const totalExpectedCosts = costs.reduce((s, i) => s + Math.abs(i.expectedValue), 0)
  const netExpectedValue = totalExpectedBenefits - totalExpectedCosts

  return {
    ...cba,
    items: updatedItems,
    totalExpectedBenefits,
    totalExpectedCosts,
    netExpectedValue,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Calculate the impact score for a new argument being added to a likelihood estimate.
 * Impact = truth × linkage × 100, signed by side.
 */
export function calculateArgumentImpact(
  truthScore: number,
  linkageScore: number,
  side: 'pro' | 'con'
): number {
  const raw = Math.round(truthScore * linkageScore * 100)
  return side === 'pro' ? raw : -raw
}

/**
 * Format a dollar amount for display.
 */
export function formatDollars(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(0)}K`
  }
  return `${sign}$${abs.toFixed(0)}`
}
