import { CENTRALITY_WEIGHTS, ReachMetrics, QualityFactors } from '../types/book'

/**
 * Calculate weighted logical validity score based on claims
 * Formula: Σ(Claim Validity × Centrality Weight) ÷ Total Claims
 */
export function calculateWeightedValidity(
  claims: Array<{
    validityScore: number
    centralityWeight: number
  }>
): number {
  if (claims.length === 0) return 0

  const weightedSum = claims.reduce((sum, claim) => {
    return sum + claim.validityScore * claim.centralityWeight
  }, 0)

  const totalWeight = claims.reduce((sum, claim) => sum + claim.centralityWeight, 0)

  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

/**
 * Calculate final claim validity using AI + Crowd + Expert weighting
 * Formula: (AI × 0.3) + (Crowd × 0.5) + (Expert × 0.2) × 100
 */
export function calculateFinalValidity(
  aiConfidence: number,     // 0-1
  crowdConsensus: number,   // 0-1
  expertWeighting: number   // 0-1
): number {
  return (aiConfidence * 0.3 + crowdConsensus * 0.5 + expertWeighting * 0.2) * 100
}

/**
 * Calculate Belief Impact Weight (Belief R₀)
 * Formula: log(Sales + Citations + Social Shares)
 */
export function calculateBeliefImpact(metrics: ReachMetrics): number {
  const totalReach = metrics.sales + metrics.citations + metrics.socialShares
  if (totalReach <= 0) return 0

  return Math.log10(totalReach)
}

/**
 * Calculate Book Quality Score
 * Multi-factor assessment with weighted components
 */
export function calculateQualityScore(factors: QualityFactors): number {
  return (
    factors.writingClarity * 0.2 +
    factors.goalAchievement * 0.3 +
    factors.readerEngagement * 0.2 +
    factors.originality * 0.15 +
    factors.historicalImportance * 0.15
  )
}

/**
 * Calculate total impact on a specific belief
 * Formula: Logical Validity × Quality × Topic Overlap × log(Reach)
 */
export function calculateTotalImpact(
  logicalValidity: number,    // 0-100
  quality: number,            // 0-100
  topicOverlap: number,       // 0-1 (percentage as decimal)
  beliefImpact: number        // log(reach)
): number {
  return logicalValidity * quality * topicOverlap * beliefImpact
}

/**
 * Calculate time decay for evidence
 * Older claims may lose validity if not re-verified
 */
export function calculateTimeDecay(
  publishedDate: Date,
  lastVerified: Date | null,
  baseValidity: number
): number {
  const now = new Date()
  const yearsSincePublished = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 365)

  // If recently verified, no decay
  if (lastVerified) {
    const monthsSinceVerified = (now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24 * 30)
    if (monthsSinceVerified < 12) return baseValidity
  }

  // Apply decay: 5% per year after 5 years, capped at 50% reduction
  if (yearsSincePublished > 5) {
    const decayFactor = Math.min(0.5, (yearsSincePublished - 5) * 0.05)
    return baseValidity * (1 - decayFactor)
  }

  return baseValidity
}

/**
 * Calculate Author Truth Equity
 * Historical accuracy across all works
 */
export function calculateTruthEquity(
  totalBooks: number,
  avgBookValidity: number,
  accuratePredictions: number,
  totalPredictions: number
): number {
  if (totalBooks === 0) return 50 // Neutral starting point

  const bookScore = avgBookValidity
  const predictionScore = totalPredictions > 0
    ? (accuratePredictions / totalPredictions) * 100
    : 50

  // Weight books more heavily than predictions
  return bookScore * 0.7 + predictionScore * 0.3
}

/**
 * Get centrality weight from centrality type
 */
export function getCentralityWeight(centralityType: string): number {
  return CENTRALITY_WEIGHTS[centralityType as keyof typeof CENTRALITY_WEIGHTS] ?? 0.5
}

/**
 * Calculate validity distribution for claims
 */
export function getValidityDistribution(claims: Array<{ validityScore: number }>) {
  const distribution = {
    strong: 0,    // 80-100
    moderate: 0,  // 60-79
    weak: 0       // 0-59
  }

  claims.forEach(claim => {
    if (claim.validityScore >= 80) {
      distribution.strong++
    } else if (claim.validityScore >= 60) {
      distribution.moderate++
    } else {
      distribution.weak++
    }
  })

  return distribution
}

/**
 * Calculate average validity across multiple claims
 */
export function calculateAverageValidity(claims: Array<{ validityScore: number }>): number {
  if (claims.length === 0) return 0

  const sum = claims.reduce((acc, claim) => acc + claim.validityScore, 0)
  return sum / claims.length
}
