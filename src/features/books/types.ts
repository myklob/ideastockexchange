// Centrality weight types
export type CentralityType =
  | 'thesis'       // 1.0 - Core thesis claims
  | 'major'        // 0.7 - Major supporting arguments
  | 'supporting'   // 0.4 - Examples and illustrations
  | 'tangential'   // 0.2 - Tangential points
  | 'footnote'     // 0.1 - Footnotes and citations

export const CENTRALITY_WEIGHTS: Record<CentralityType, number> = {
  thesis: 1.0,
  major: 0.7,
  supporting: 0.4,
  tangential: 0.2,
  footnote: 0.1,
}

// Fallacy types for Fallacy Autopsy Theater
export type FallacyType =
  | 'ad_hominem'
  | 'strawman'
  | 'slippery_slope'
  | 'post_hoc'
  | 'false_equivalence'
  | 'appeal_to_authority'
  | 'false_dilemma'
  | 'bandwagon'
  | 'cherry_picking'
  | 'circular_reasoning'

// Evidence quality tiers
export type EvidenceTier =
  | 'tier1_peer_reviewed'
  | 'tier2_statistical'
  | 'tier3_anecdotal'
  | 'tier4_speculation'

// Four-Dimensional Scoring Framework
export interface BookScores {
  logicalValidityScore: number  // 0-100
  qualityScore: number          // 0-100
  topicOverlapScore: number     // 0-100 (per belief)
  beliefImpactWeight: number    // log(reach)
}

export interface QualityFactors {
  writingClarity: number        // 0-100, weighted 20%
  goalAchievement: number       // 0-100, weighted 30%
  readerEngagement: number      // 0-100, weighted 20%
  originality: number           // 0-100, weighted 15%
  historicalImportance: number  // 0-100, weighted 15%
}

export interface ReachMetrics {
  sales: number
  citations: number
  socialShares: number
}

// Book analysis report structure
export interface BookAnalysisReport {
  book: {
    id: string
    title: string
    author: string
    publishYear?: number
  }
  scores: BookScores
  claimAnalysis: {
    totalClaims: number
    averageValidity: number
    validityDistribution: {
      strong: number      // 80-100
      moderate: number    // 60-79
      weak: number        // 0-59
    }
  }
  logicBattlegrounds: {
    fallacyCount: number
    contradictionCount: number
    evidenceQuality: {
      tier1: number
      tier2: number
      tier3: number
      tier4: number
    }
    metaphorAccuracy: number
    predictionAccuracy: number | null
  }
  topicBreakdown: Array<{
    topic: string
    overlapScore: number
  }>
  authorCredibility: {
    truthEquityScore: number
    predictionTrackRecord: number
  }
}
