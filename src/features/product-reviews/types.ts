// Types for the Product Review system
// Product reviews are beliefs with product-specific analysis layers

import type { BeliefWithRelations, BeliefScores } from '../belief-analysis/types'

export interface ProductReviewWithRelations {
  id: number
  slug: string
  productName: string
  brand: string
  claim: string
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
}

export interface PerformanceItem {
  id: number
  criterion: string
  measurement: string
  evidenceTier: number // 1-4
  comparisonToAvg: string // "Better", "Worse", "Same"
  sourceUrl: string | null
}

export interface TradeoffItem {
  id: number
  side: string // "optimizes" or "sacrifices"
  category: string // "advertised" or "actual"
  description: string
}

export interface AlternativeItem {
  id: number
  alternativeName: string
  tier: string // "premium", "budget", or "lateral"
  keyAdvantage: string
  linkSlug: string | null
}

export interface UserProfileItem {
  id: number
  side: string // "ideal" or "not_ideal"
  description: string
}

export interface AwardItem {
  id: number
  side: string // "independent" or "manufacturer"
  title: string
  details: string | null
}

export interface EcosystemItem {
  id: number
  category: string // "upstream", "downstream", or "lockin"
  description: string
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
