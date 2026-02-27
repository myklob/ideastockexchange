/**
 * Product Review Scoring Engine
 *
 * Computes product review scores by combining:
 * 1. The linked belief's ReasonRank truth score (argument tree analysis)
 * 2. Evidence quality assessment (performance data tier weighting)
 * 3. Performance comparison metrics
 *
 * Category rankings are determined by sorting products within
 * the same categoryType by their overall score.
 */

import type { ProductReviewWithRelations, ProductReviewScores, CategoryRanking, CategoryProduct } from '@/features/product-reviews/types'
import { applyStrengthPenalty } from '@/core/scoring/claim-strength'

// Evidence tier weights (higher tier = higher quality = higher weight)
const TIER_WEIGHTS: Record<number, number> = {
  1: 1.0,   // Lab tested / peer-reviewed
  2: 0.75,  // Professional reviewer consensus
  3: 0.5,   // Aggregated user reviews
  4: 0.25,  // Anecdotal / manufacturer claims
}

/**
 * Calculate the overall score for a product review.
 *
 * The score combines:
 * - Belief truth score (from argument trees): 70% weight
 * - Evidence quality factor (average tier weight): 15% weight
 * - Performance comparison factor: 15% weight
 *
 * All factors are normalized to [0, 1] before combining.
 */
export function scoreProductReview(review: ProductReviewWithRelations): ProductReviewScores {
  // Compute belief-level scores if a linked belief exists
  let totalPro = 0
  let totalCon = 0
  let totalSupportingEvidence = 0
  let totalWeakeningEvidence = 0
  let beliefTruthScore = 0.5 // default: uncertain

  if (review.belief) {
    const proArgs = review.belief.arguments.filter(a => a.side === 'agree')
    const conArgs = review.belief.arguments.filter(a => a.side === 'disagree')
    totalPro = proArgs.reduce((sum, a) => sum + Math.abs(a.impactScore), 0)
    totalCon = conArgs.reduce((sum, a) => sum + Math.abs(a.impactScore), 0)

    const supportingEvidence = review.belief.evidence.filter(e => e.side === 'supporting')
    const weakeningEvidence = review.belief.evidence.filter(e => e.side === 'weakening')
    totalSupportingEvidence = supportingEvidence.reduce((sum, e) => sum + Math.abs(e.impactScore), 0)
    totalWeakeningEvidence = weakeningEvidence.reduce((sum, e) => sum + Math.abs(e.impactScore), 0)

    const totalPositive = totalPro + totalSupportingEvidence
    const totalNegative = totalCon + totalWeakeningEvidence
    const total = totalPositive + totalNegative
    beliefTruthScore = total > 0 ? totalPositive / total : 0.5
  }

  // Compute evidence quality factor from performance data
  const performanceMetrics = review.performanceData
  let avgEvidenceTier = 3 // default to Tier 3
  let avgTierWeight = 0.5

  if (performanceMetrics.length > 0) {
    avgEvidenceTier = performanceMetrics.reduce((sum, p) => sum + p.evidenceTier, 0) / performanceMetrics.length
    avgTierWeight = performanceMetrics.reduce((sum, p) => sum + (TIER_WEIGHTS[p.evidenceTier] ?? 0.25), 0) / performanceMetrics.length
  }

  // Compute performance comparison factor
  const betterCount = performanceMetrics.filter(p => p.comparisonToAvg === 'Better').length
  const worseCount = performanceMetrics.filter(p => p.comparisonToAvg === 'Worse').length
  const sameCount = performanceMetrics.filter(p => p.comparisonToAvg === 'Same').length
  const totalPerf = performanceMetrics.length

  // Performance factor: ratio of better vs worse metrics
  // Better = +1, Same = 0, Worse = -1, normalized to [0, 1]
  let performanceFactor = 0.5
  if (totalPerf > 0) {
    const netPerformance = (betterCount - worseCount) / totalPerf
    performanceFactor = 0.5 + netPerformance * 0.5 // map [-1, 1] to [0, 1]
  }

  // Combined score:
  // 70% belief truth score (from argument trees)
  // 15% evidence quality (average tier weight)
  // 15% performance comparison factor
  const overallScore = (
    beliefTruthScore * 0.70 +
    avgTierWeight * 0.15 +
    performanceFactor * 0.15
  )

  // Scale to [-100, +100] for display consistency with belief scores
  const scaledScore = (overallScore - 0.5) * 200

  // Claim strength defaults: use linked belief's value or 0.5 if no belief
  const claimStrength = review.belief?.claimStrength ?? 0.5
  const strengthAdjustedScore = applyStrengthPenalty(beliefTruthScore, claimStrength)

  return {
    totalPro,
    totalCon,
    totalSupportingEvidence,
    totalWeakeningEvidence,
    overallScore: scaledScore,
    // BeliefScores fields not computed in product review context — use defaults
    logicalValidityScore: beliefTruthScore,
    verificationTruthScore: beliefTruthScore,
    avgLinkageScore: 0.5,
    importanceWeightedScore: beliefTruthScore,
    aggregateEvidenceScore: avgTierWeight,
    cbaLikelihoodScore: null,
    objectiveCriteriaScore: 0.5,
    stabilityScore: 0.5,
    stabilityStatus: 'developing',
    mediaTruthScore: 0.5,
    mediaGenreScore: 0.5,
    topicOverlapScore: 1.0,
    beliefEquivalencyScore: null,
    claimStrength,
    strengthAdjustedScore,
    // Product-specific fields
    categoryRank: review.categoryRank,
    totalInCategory: 0, // computed during ranking
    avgEvidenceTier,
    performanceBetterCount: betterCount,
    performanceWorseCount: worseCount,
    performanceSameCount: sameCount,
  }
}

/**
 * Rank all products within a category by their overall score.
 * Returns ranked category data with position assignments.
 */
export function rankProductsInCategory(
  reviews: ProductReviewWithRelations[]
): CategoryRanking[] {
  // Group by categoryType
  const categoryMap = new Map<string, ProductReviewWithRelations[]>()
  for (const review of reviews) {
    const existing = categoryMap.get(review.categoryType) ?? []
    existing.push(review)
    categoryMap.set(review.categoryType, existing)
  }

  const rankings: CategoryRanking[] = []

  for (const [categoryType, categoryReviews] of categoryMap) {
    // Score each product
    const scored = categoryReviews.map(review => ({
      review,
      scores: scoreProductReview(review),
    }))

    // Sort by overall score descending (highest = best)
    scored.sort((a, b) => b.scores.overallScore - a.scores.overallScore)

    const products: CategoryProduct[] = scored.map((item, index) => ({
      id: item.review.id,
      slug: item.review.slug,
      productName: item.review.productName,
      brand: item.review.brand,
      categorySubtype: item.review.categorySubtype,
      overallScore: item.scores.overallScore,
      categoryRank: index + 1,
      performanceSummary: {
        betterCount: item.scores.performanceBetterCount,
        worseCount: item.scores.performanceWorseCount,
        sameCount: item.scores.performanceSameCount,
        avgEvidenceTier: item.scores.avgEvidenceTier,
      },
    }))

    rankings.push({ categoryType, products })
  }

  // Sort categories alphabetically
  rankings.sort((a, b) => a.categoryType.localeCompare(b.categoryType))

  return rankings
}

/**
 * Find the best product in a specific category.
 * Returns the #1 ranked product or null if no products exist.
 */
export function findBestInCategory(
  reviews: ProductReviewWithRelations[],
  categoryType: string
): CategoryProduct | null {
  const categoryReviews = reviews.filter(r => r.categoryType === categoryType)
  if (categoryReviews.length === 0) return null

  const rankings = rankProductsInCategory(categoryReviews)
  const category = rankings.find(r => r.categoryType === categoryType)
  return category?.products[0] ?? null
}
