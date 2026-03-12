/**
 * CBA Scoring Module
 *
 * Delegates all scoring to the unified scoring engine (scoring-engine.ts)
 * to ensure consistent calculations across Protocol and CBA systems.
 *
 * This module re-exports the relevant functions and adds CBA-specific
 * orchestration (recalculateCBA) that ties everything together.
 */

import {
  CBALineItem,
  CostBenefitAnalysis,
  LikelihoodEstimate,
  LikelihoodBelief,
} from '../types/cba'
import {
  calculateReasonRankScore as engineCalculateReasonRankScore,
  determineActiveLikelihood as engineDetermineActiveLikelihood,
  calculateLikelihoodCI as engineCalculateLikelihoodCI,
  calculateArgumentImpact as engineCalculateArgumentImpact,
  calculateExpectedValue as engineCalculateExpectedValue,
  scoreLikelihoodEstimate,
  formatDollars as engineFormatDollars,
} from './scoring-engine'

// ─── Re-exports from unified engine ────────────────────────────

export const calculateReasonRankScore = engineCalculateReasonRankScore
export const determineActiveLikelihood = engineDetermineActiveLikelihood
export const calculateLikelihoodCI = engineCalculateLikelihoodCI
export const formatDollars = engineFormatDollars

/**
 * Calculate the impact score for a new argument being added to a likelihood estimate.
 * Impact = truth × linkage × 100, signed by side.
 */
export function calculateArgumentImpact(
  truthScore: number,
  linkageScore: number,
  side: 'pro' | 'con'
): number {
  return engineCalculateArgumentImpact(truthScore, linkageScore, side)
}

/**
 * Calculate expected value for a line item.
 * Expected Value = Predicted Impact × Active Likelihood
 */
export function calculateExpectedValue(item: CBALineItem): number {
  return engineCalculateExpectedValue(item.predictedImpact, item.likelihoodBelief.activeLikelihood)
}

/**
 * Recalculate all computed fields for a CBA.
 * Call this after any mutation (new item, new argument, etc.)
 *
 * Uses the unified scoring engine for all score calculations,
 * ensuring Protocol and CBA use identical scoring logic.
 */
export function recalculateCBA(cba: CostBenefitAnalysis): CostBenefitAnalysis {
  const updatedItems = cba.items.map((item) => {
    // Recalculate each estimate's ReasonRank score using the unified engine
    const updatedEstimates = item.likelihoodBelief.estimates.map((est) => {
      const breakdown = scoreLikelihoodEstimate(est)
      return {
        ...est,
        reasonRankScore: breakdown.reasonRankScore,
      }
    })

    // Determine winning likelihood using the unified engine
    const { activeProbability, activeEstimateId, status } =
      engineDetermineActiveLikelihood(updatedEstimates)

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
      confidenceInterval: engineCalculateLikelihoodCI({
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
