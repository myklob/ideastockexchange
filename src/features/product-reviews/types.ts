// Types for the Product Review system
// Product reviews are beliefs with product-specific analysis layers

import type { BeliefWithRelations, BeliefScores } from '../belief-analysis/types'

export interface ProductReviewWithRelations {
  id: number
  slug: string
  productName: string
  brand: string
  claim: string
  /** Title scope: "[Product] is the best [Product Type] for [useCase]". */
  useCase?: string | null
  /** "Budget" | "Mid-range" | "Premium" */
  priceSegment?: string | null
  /** Scorecard: one-sentence verdict scoped to the use case in the title. */
  bottomLine?: string | null
  /** Scorecard: the measurement or price change that would flip the net score. */
  verdictChanger?: string | null
  /** Design Trade-offs: how far the advertised optimization differs from the actual one. */
  divergenceNote?: string | null
  divergenceScore?: number | null
  categoryType: string
  categorySubtype: string | null
  overallScore: number
  categoryRank: number | null
  createdAt: Date
  updatedAt: Date
  beliefId: number | null
  belief: BeliefWithRelations | null
  performanceData: PerformanceItem[]
  tradeoffs: TradeoffItem[]
  alternatives: AlternativeItem[]
  userProfiles: UserProfileItem[]
  awards: AwardItem[]
  ecosystemItems: EcosystemItem[]
  recommenderInterests?: RecommenderInterestItem[]
  ownershipCosts?: OwnershipCostItem[]
  valueItems?: ValueItem[]
  decisionRules?: DecisionRuleItem[]
  decisionObstacles?: DecisionObstacleItem[]
}

/** CRITERIA BEFORE BRANDS: category-level yardstick, shared by every product in the category. */
export interface CategoryCriterionItem {
  id: number
  categoryType: string
  criterion: string
  howToMeasure: string | null
  importance: number | null
  score: number | null
  sortOrder: number
}

export interface PerformanceItem {
  id: number
  criterion: string
  measurement: string
  evidenceTier: number // 1-4
  comparisonToAvg: string // "Better", "Worse", "Same"
  sourceUrl: string | null
  /** Category average or best rival, with units. */
  benchmark?: string | null
  /** Named evidence source. */
  source?: string | null
  impact?: number | null
}

export interface TradeoffItem {
  id: number
  side: string // "optimizes" or "sacrifices"
  category: string // "advertised" or "actual"
  description: string
  score?: number | null
}

export interface AlternativeItem {
  id: number
  alternativeName: string
  tier: string // "premium", "budget", or "lateral"
  keyAdvantage: string
  linkSlug: string | null
  score?: number | null
}

export interface UserProfileItem {
  id: number
  side: string // "ideal" or "not_ideal"
  description: string
  score?: number | null
}

export interface AwardItem {
  id: number
  side: string // "independent" or "manufacturer"
  title: string
  details: string | null
  score?: number | null
}

export interface EcosystemItem {
  id: number
  category: string // "upstream", "downstream", or "lockin"
  description: string
  cost?: string | null
  score?: number | null
}

export interface RecommenderInterestItem {
  id: number
  side: string // "product" or "alternatives"
  description: string
  /** Candidate hidden interest (italic row); a scored claim requiring evidence. */
  hidden: boolean
  evidence: string | null
  score: number | null
}

export interface OwnershipCostItem {
  id: number
  item: string
  estimate: string | null
  costType: string // "initial" | "ongoing" | "hidden" | "opportunity"
  source: string | null
  evidenceTier: number | null
  score: number | null
}

export interface ValueItem {
  id: number
  item: string
  measure: string | null
  timeframe: string // "short" | "long" | "both"
  source: string | null
  evidenceTier: number | null
  score: number | null
}

export interface DecisionRuleItem {
  id: number
  condition: string
  advice: string
  score: number | null
}

export interface DecisionObstacleItem {
  id: number
  side: string // "overpay" or "underinvest"
  description: string
  score: number | null
}

// Computed scores for a product review
export interface ProductReviewScores extends BeliefScores {
  // From belief scoring
  overallScore: number

  // Category ranking data
  categoryRank: number | null
  totalInCategory: number

  // Evidence quality aggregate
  avgEvidenceTier: number // average across all performance metrics
  performanceBetterCount: number
  performanceWorseCount: number
  performanceSameCount: number
}

// Category with ranked products
export interface CategoryRanking {
  categoryType: string
  products: CategoryProduct[]
}

export interface CategoryProduct {
  id: number
  slug: string
  productName: string
  brand: string
  categorySubtype: string | null
  overallScore: number
  categoryRank: number
  performanceSummary: {
    betterCount: number
    worseCount: number
    sameCount: number
    avgEvidenceTier: number
  }
}

// Evidence tier labels
export const EVIDENCE_TIER_LABELS: Record<number, string> = {
  1: 'Independent lab testing, certified ratings, peer-reviewed studies',
  2: 'Professional reviewer consensus, manufacturer data verified by third parties',
  3: 'Aggregated user reviews, investigative journalism, Consumer Reports',
  4: 'Individual testimonials, manufacturer claims, anecdotal evidence',
}

export function getEvidenceTierLabel(tier: number): string {
  return EVIDENCE_TIER_LABELS[tier] ?? EVIDENCE_TIER_LABELS[4]
}

export function getEvidenceTierColor(tier: number): string {
  switch (tier) {
    case 1: return '#22c55e' // green
    case 2: return '#84cc16' // lime
    case 3: return '#eab308' // yellow
    case 4: return '#f97316' // orange
    default: return '#9ca3af' // gray
  }
}
