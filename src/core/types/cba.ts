// Cost-Benefit Analysis Types
// Crowd-sourced CBA where likelihood scores are derived from argument competition

import { SchilchtArgument, ProtocolLogEntry } from './schlicht'

export type CBAStatus = 'active' | 'concluded' | 'archived'
export type LineItemType = 'benefit' | 'cost'
export type LikelihoodStatus = 'calibrated' | 'contested' | 'emerging'

/**
 * A competing probability estimate for a line item's likelihood.
 * Multiple estimates can coexist (e.g., "30%", "50-60%", "90%+").
 * The one backed by the strongest argument tree wins.
 */
export interface LikelihoodEstimate {
  id: string
  probability: number        // 0-1 (e.g., 0.7 for 70%)
  label: string              // Human-readable (e.g., "70%", "50-60%", "90%+")
  reasoning: string          // Why this probability was proposed
  proArguments: SchilchtArgument[]  // Arguments supporting this estimate
  conArguments: SchilchtArgument[]  // Arguments attacking this estimate
  reasonRankScore: number    // Computed composite score from argument trees (0-1)
  isActive: boolean          // Whether this is the currently winning estimate
  contributor: {
    type: 'human' | 'ai'
    name: string
    submittedAt: string      // ISO 8601
  }
}

/**
 * A nested belief node representing the likelihood of a line item.
 * The probability is not voted on — it is argued for.
 * "There is an X% chance this will happen" is itself a claim
 * that must survive adversarial scrutiny.
 */
export interface LikelihoodBelief {
  id: string
  statement: string          // e.g., "What is the probability this benefit materializes?"
  estimates: LikelihoodEstimate[]
  activeLikelihood: number   // The winning probability (0-1), from strongest argument tree
  status: LikelihoodStatus
  adversarialCycles: number
  confidenceInterval: number // Uncertainty margin on the active likelihood
  protocolLog: ProtocolLogEntry[]
}

/**
 * A single line item in a cost-benefit analysis.
 * Each item has a predicted impact (dollar value) and a likelihood
 * that is derived from competitive argument trees, not simple voting.
 *
 * Expected Value = Predicted Impact × Active Likelihood
 */
export interface CBALineItem {
  id: string
  type: LineItemType
  title: string              // Short description
  description: string        // Detailed explanation
  category: string           // e.g., "Economic", "Social", "Environmental", "Political"
  predictedImpact: number    // Dollar value (positive for benefits, negative for costs)
  likelihoodBelief: LikelihoodBelief  // Nested belief node for probability
  expectedValue: number      // Computed: predictedImpact × activeLikelihood
  contributor: {
    type: 'human' | 'ai'
    name: string
    submittedAt: string      // ISO 8601
  }
}

/**
 * A complete Cost-Benefit Analysis.
 * Contains benefits and costs, each with argument-backed likelihood scores.
 * The net expected value is the decision score.
 */
export interface CostBenefitAnalysis {
  id: string
  title: string              // e.g., "Build New Highway Bridge"
  description: string
  status: CBAStatus
  items: CBALineItem[]
  // Computed summary
  totalExpectedBenefits: number
  totalExpectedCosts: number
  netExpectedValue: number
  // Metadata
  createdAt: string          // ISO 8601
  updatedAt: string          // ISO 8601
  protocolLog: ProtocolLogEntry[]
}
