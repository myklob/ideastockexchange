/**
 * CBA Scoring Module
 *
 * Implements the automated-cba.skill scoring engine (docs/automated-cba/SKILL.md).
 * Core formula: argument_score = truth_score × linkage_score × importance_score
 * Likelihood: pro_total / (pro_total + con_total)
 * Depth attenuation: 0.5^(depth - 1) for recursive sub-arguments
 * De-duplication: semantic overlap discount at impact and argument levels
 */

import {
  CBALineItem,
  CostBenefitAnalysis,
  LikelihoodEstimate,
  LikelihoodBelief,
  SensitivityItem,
  ScenarioResult,
  DeduplicationEntry,
  EVIDENCE_TIER_MAX,
  CBAEvidenceTier as EvidenceTier,
  CBACategory,
  CBA_CATEGORY_UNITS,
} from '../types/cba'
import { SchilchtArgument } from '../types/schlicht'
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

// ─── Skill-based scoring functions ────────────────────────────

/**
 * Calculate a single argument's score.
 * argument_score = truth_score × linkage_score × importance_score
 * Truth score is on 0-10 scale; linkage and importance are 0-1.
 */
export function calculateArgumentScore(
  truthScore: number,
  linkageScore: number,
  importanceScore: number
): number {
  return truthScore * linkageScore * importanceScore
}

/**
 * Depth attenuation factor for recursive sub-arguments.
 * depth_attenuation(d) = 0.5^(d - 1)
 * Depth 1 = 1.0, Depth 2 = 0.5, Depth 3 = 0.25, etc.
 */
export function depthAttenuation(depth: number): number {
  return Math.pow(0.5, Math.max(depth - 1, 0))
}

/**
 * Recursively calculate the effective score for an argument including all sub-arguments.
 * effective_score(arg) = base_score(arg) + sum(effective_score(sub) × linkage(sub→arg) × depth_attenuation(depth))
 */
export function calculateRecursiveArgumentScore(
  arg: SchilchtArgument,
  depth: number = 1
): number {
  const importance = arg.importanceScore ?? 1.0
  // Truth score in skill is 0-10; existing system stores 0-1. Normalize:
  const truth = arg.truthScore > 1 ? arg.truthScore : arg.truthScore * 10
  const base = calculateArgumentScore(truth, arg.linkageScore, importance)

  if (!arg.subArguments || arg.subArguments.length === 0) {
    return base
  }

  const subContribution = arg.subArguments.reduce((sum, sub) => {
    const subScore = calculateRecursiveArgumentScore(sub, depth + 1)
    return sum + subScore * depthAttenuation(depth + 1)
  }, 0)

  return base + subContribution
}

/**
 * Derive likelihood directly from pro/con argument trees.
 * likelihood = pro_total / (pro_total + con_total)
 * Returns 0.5 if no arguments exist (maximum uncertainty).
 */
export function calculateLikelihoodFromTree(
  proArgs: SchilchtArgument[],
  conArgs: SchilchtArgument[]
): number {
  const proTotal = proArgs.reduce((s, a) => s + calculateRecursiveArgumentScore(a), 0)
  const conTotal = conArgs.reduce((s, a) => s + calculateRecursiveArgumentScore(a), 0)
  const total = proTotal + conTotal
  if (total === 0) return 0.5
  return proTotal / total
}

/**
 * Calculate confidence for a single argument based on its evidence tier.
 * Returns the tier's max score normalized to 0-1 scale.
 */
export function argumentConfidence(evidenceTier?: EvidenceTier): number {
  if (!evidenceTier) return 0.3 // default: T4-ish if no tier specified
  return EVIDENCE_TIER_MAX[evidenceTier] / 10
}

/**
 * Calculate overall confidence for an impact item.
 * confidence = mean(evidence tier scores across all argument trees)
 */
export function calculateItemConfidence(item: CBALineItem): number {
  const allArgs = [
    ...item.likelihoodBelief.estimates.flatMap((e) => [
      ...e.proArguments,
      ...e.conArguments,
    ]),
  ]
  if (allArgs.length === 0) return 0.3
  const tierScores = allArgs.map((a) => {
    const tier = (a as SchilchtArgument & { evidenceTier?: EvidenceTier }).evidenceTier
    return argumentConfidence(tier)
  })
  return tierScores.reduce((s, v) => s + v, 0) / tierScores.length
}

/**
 * Calculate overall analysis confidence: mean of all item confidences.
 */
export function calculateAnalysisConfidence(items: CBALineItem[]): number {
  if (items.length === 0) return 0.3
  const scores = items.map(calculateItemConfidence)
  return scores.reduce((s, v) => s + v, 0) / scores.length
}

// ─── De-duplication ────────────────────────────────────────────

/**
 * Naive semantic overlap estimation based on word overlap.
 * In production this would use embeddings; here we use a heuristic
 * based on shared significant words.
 */
function semanticOverlap(a: string, b: string): number {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'will', 'of', 'in', 'to', 'and', 'or', 'for', 'this', 'that', 'be', 'it', 'by', 'on', 'at', 'with'])
  const words = (s: string) =>
    s.toLowerCase().split(/\W+/).filter((w) => w.length > 3 && !stopWords.has(w))
  const wa = new Set(words(a))
  const wb = new Set(words(b))
  if (wa.size === 0 && wb.size === 0) return 0
  const intersection = new Set([...wa].filter((w) => wb.has(w)))
  const union = new Set([...wa, ...wb])
  return intersection.size / union.size
}

/**
 * Apply argument-level de-duplication within a single argument list.
 * Returns adjusted arguments with redundancyDiscount applied to weaker duplicates.
 */
export function applyArgumentDeduplication(
  args: SchilchtArgument[]
): { args: SchilchtArgument[]; log: DeduplicationEntry[] } {
  const log: DeduplicationEntry[] = []
  // Track effective score multipliers; start at 1.0 for each
  const multipliers: number[] = args.map(() => 1.0)

  for (let i = 0; i < args.length; i++) {
    for (let j = i + 1; j < args.length; j++) {
      const overlap = semanticOverlap(
        args[i].claim + ' ' + args[i].description,
        args[j].claim + ' ' + args[j].description
      )

      if (overlap > 0.7) {
        // Substantially similar: weaker gets only its unique portion
        const iScore = calculateRecursiveArgumentScore(args[i])
        const jScore = calculateRecursiveArgumentScore(args[j])
        const weakerIdx = iScore >= jScore ? j : i
        const discount = 1 - overlap
        multipliers[weakerIdx] = Math.min(multipliers[weakerIdx], discount)
        log.push({
          action: 'discounted',
          items: [args[i].claim, args[j].claim],
          similarity: overlap,
          adjustment: `Argument "${args[weakerIdx].claim}" discounted to ${(discount * 100).toFixed(0)}% (shares ${(overlap * 100).toFixed(0)}% with "${args[weakerIdx === i ? j : i].claim}")`,
        })
      } else if (overlap > 0.4) {
        // Moderate overlap: partial discount on weaker
        const iScore = calculateRecursiveArgumentScore(args[i])
        const jScore = calculateRecursiveArgumentScore(args[j])
        const weakerIdx = iScore >= jScore ? j : i
        const discount = 1 - overlap * 0.5
        multipliers[weakerIdx] = Math.min(multipliers[weakerIdx], discount)
        log.push({
          action: 'discounted',
          items: [args[i].claim, args[j].claim],
          similarity: overlap,
          adjustment: `Argument "${args[weakerIdx].claim}" partially discounted to ${(discount * 100).toFixed(0)}% (partial overlap ${(overlap * 100).toFixed(0)}%)`,
        })
      }
    }
  }

  // Apply multipliers as redundancyDiscount on each argument
  const adjustedArgs = args.map((arg, idx) => ({
    ...arg,
    redundancyDiscount: multipliers[idx] < 1.0 ? multipliers[idx] : undefined,
  }))

  return { args: adjustedArgs, log }
}

/**
 * Apply impact-level de-duplication across all line items.
 * Items with >80% similarity are candidates for merging (flagged);
 * items with 30-80% similarity get their magnitude adjusted.
 */
export function applyImpactDeduplication(
  items: CBALineItem[]
): { items: CBALineItem[]; log: DeduplicationEntry[] } {
  const log: DeduplicationEntry[] = []
  const adjustedItems = items.map((item) => ({
    ...item,
    overlapAdjustments: [...(item.overlapAdjustments ?? [])],
  }))

  for (let i = 0; i < adjustedItems.length; i++) {
    for (let j = i + 1; j < adjustedItems.length; j++) {
      // Only compare items in the same direction and category
      if (
        adjustedItems[i].type !== adjustedItems[j].type ||
        adjustedItems[i].canonicalCategory !== adjustedItems[j].canonicalCategory
      ) {
        continue
      }

      const similarity = semanticOverlap(
        adjustedItems[i].title + ' ' + adjustedItems[i].description,
        adjustedItems[j].title + ' ' + adjustedItems[j].description
      )

      if (similarity > 0.8) {
        log.push({
          action: 'merged',
          items: [adjustedItems[i].id, adjustedItems[j].id],
          similarity,
          adjustment: `"${adjustedItems[j].title}" flagged as near-duplicate of "${adjustedItems[i].title}" (${(similarity * 100).toFixed(0)}% overlap). Keep the better-developed item.`,
        })
        adjustedItems[j].overlapAdjustments.push({
          overlapsWith: adjustedItems[i].id,
          similarity,
          adjustmentApplied: 0, // flag for review; not automatically zeroed
        })
      } else if (similarity > 0.3) {
        const weaker = adjustedItems[i].predictedImpact <= adjustedItems[j].predictedImpact ? i : j
        const adjustmentFactor = 1 - similarity
        adjustedItems[weaker].predictedImpact *= adjustmentFactor
        adjustedItems[weaker].overlapAdjustments.push({
          overlapsWith: adjustedItems[weaker === i ? j : i].id,
          similarity,
          adjustmentApplied: adjustmentFactor,
        })
        log.push({
          action: 'discounted',
          items: [adjustedItems[i].id, adjustedItems[j].id],
          similarity,
          adjustment: `"${adjustedItems[weaker].title}" magnitude adjusted to ${(adjustmentFactor * 100).toFixed(0)}% due to ${(similarity * 100).toFixed(0)}% overlap`,
        })
      }
    }
  }

  return { items: adjustedItems, log }
}

// ─── Sensitivity Analysis ──────────────────────────────────────

/**
 * Calculate sensitivity (swing) for each impact item.
 * swing_i = |magnitude_i × (likelihood_high − likelihood_low)|
 * Returns top 5 items sorted by swing descending.
 */
export function calculateSensitivity(items: CBALineItem[]): SensitivityItem[] {
  const results: SensitivityItem[] = items.map((item) => {
    const belief = item.likelihoodBelief
    const likelihood = belief.activeLikelihood
    const ci = belief.confidenceInterval ?? 0.15

    // Estimate uncertainty from argument tree disagreement
    const estimates = belief.estimates
    let uncertainty = ci
    if (estimates.length >= 2) {
      const scores = estimates.map((e) => e.reasonRankScore)
      const maxScore = Math.max(...scores)
      const minScore = Math.min(...scores)
      const argAgreement = maxScore > 0 ? 1 - minScore / maxScore : 0
      uncertainty = (1 - argAgreement) * 0.5
    }

    const likelihoodHigh = Math.min(1.0, likelihood + uncertainty)
    const likelihoodLow = Math.max(0.0, likelihood - uncertainty)
    const swing = Math.abs(item.predictedImpact * (likelihoodHigh - likelihoodLow))

    return {
      impactId: item.id,
      impactTitle: item.title,
      swing,
      likelihoodLow,
      likelihoodHigh,
    }
  })

  return results.sort((a, b) => b.swing - a.swing).slice(0, 5)
}

// ─── Scenario Simulation ───────────────────────────────────────

const CBA_CATEGORIES: CBACategory[] = ['Financial', 'HumanLife', 'Freedom', 'Time']

function computeScenarioResult(items: CBALineItem[], shift: number): ScenarioResult {
  const adjustedItems = items.map((item) => ({
    ...item,
    adjustedLikelihood: Math.min(1.0, Math.max(0.0, item.likelihoodBelief.activeLikelihood + shift)),
  }))

  const benefits = adjustedItems.filter((i) => i.type === 'benefit')
  const costs = adjustedItems.filter((i) => i.type === 'cost')

  const totalBenefits = benefits.reduce((s, i) => s + i.predictedImpact * i.adjustedLikelihood, 0)
  const totalCosts = costs.reduce((s, i) => s + Math.abs(i.predictedImpact) * i.adjustedLikelihood, 0)

  const categoryEvs = CBA_CATEGORIES.map((cat) => {
    const catBenefits = benefits
      .filter((i) => i.canonicalCategory === cat)
      .reduce((s, i) => s + i.predictedImpact * i.adjustedLikelihood, 0)
    const catCosts = costs
      .filter((i) => i.canonicalCategory === cat)
      .reduce((s, i) => s + Math.abs(i.predictedImpact) * i.adjustedLikelihood, 0)
    return {
      category: cat,
      benefitsEv: catBenefits,
      costsEv: catCosts,
      netEv: catBenefits - catCosts,
    }
  })

  return {
    totalEv: totalBenefits - totalCosts,
    totalBenefits,
    totalCosts,
    categoryEvs,
  }
}

export function generateScenarios(items: CBALineItem[]) {
  return {
    optimistic: computeScenarioResult(items, 0.15),
    base: computeScenarioResult(items, 0),
    pessimistic: computeScenarioResult(items, -0.15),
  }
}

// ─── Main Orchestrator ─────────────────────────────────────────

/**
 * Recalculate all computed fields for a CBA.
 * Call this after any mutation (new item, new argument, etc.)
 *
 * Uses the unified scoring engine for all score calculations,
 * ensuring Protocol and CBA use identical scoring logic.
 */
export function recalculateCBA(cba: CostBenefitAnalysis): CostBenefitAnalysis {
  // Step 1: Score each estimate's arguments
  const updatedItems = cba.items.map((item) => {
    const updatedEstimates = item.likelihoodBelief.estimates.map((est) => {
      const breakdown = scoreLikelihoodEstimate(est)
      return {
        ...est,
        reasonRankScore: breakdown.reasonRankScore,
      }
    })

    const { activeProbability, activeEstimateId, status } =
      engineDetermineActiveLikelihood(updatedEstimates)

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
      confidence: calculateItemConfidence({ ...item, likelihoodBelief: updatedBelief }),
    }
  })

  // Step 2: Apply impact-level de-duplication
  const { items: dedupedItems, log: deduplicationLog } = applyImpactDeduplication(updatedItems)

  // Step 3: Recompute EVs after deduplication adjustments
  const finalItems = dedupedItems.map((item) => ({
    ...item,
    expectedValue: item.predictedImpact * item.likelihoodBelief.activeLikelihood,
  }))

  // Step 4: Aggregate
  const benefits = finalItems.filter((i) => i.type === 'benefit')
  const costs = finalItems.filter((i) => i.type === 'cost')

  const totalExpectedBenefits = benefits.reduce((s, i) => s + i.expectedValue, 0)
  const totalExpectedCosts = costs.reduce((s, i) => s + Math.abs(i.expectedValue), 0)
  const netExpectedValue = totalExpectedBenefits - totalExpectedCosts

  // Step 5: Verdict
  const verdict: CostBenefitAnalysis['verdict'] =
    Math.abs(netExpectedValue) < totalExpectedBenefits * 0.1
      ? 'uncertain'
      : netExpectedValue >= 0
      ? 'net_positive'
      : 'net_negative'

  // Step 6: Per-category breakdown
  const categoryBreakdown = CBA_CATEGORIES.map((cat) => {
    const catBenefits = benefits
      .filter((i) => i.canonicalCategory === cat)
      .reduce((s, i) => s + i.expectedValue, 0)
    const catCosts = costs
      .filter((i) => i.canonicalCategory === cat)
      .reduce((s, i) => s + Math.abs(i.expectedValue), 0)
    return {
      category: cat,
      unit: CBA_CATEGORY_UNITS[cat],
      benefitsEv: catBenefits,
      costsEv: catCosts,
      netEv: catBenefits - catCosts,
    }
  })

  // Step 7: Sensitivity analysis
  const sensitivity = calculateSensitivity(finalItems)

  // Step 8: Scenarios
  const scenarios = generateScenarios(finalItems)

  // Step 9: Confidence
  const confidence = calculateAnalysisConfidence(finalItems)

  return {
    ...cba,
    items: finalItems,
    totalExpectedBenefits,
    totalExpectedCosts,
    netExpectedValue,
    verdict,
    confidence,
    categoryBreakdown,
    sensitivity,
    scenarios,
    deduplicationLog: [...(cba.deduplicationLog ?? []), ...deduplicationLog],
    updatedAt: new Date().toISOString(),
  }
}
