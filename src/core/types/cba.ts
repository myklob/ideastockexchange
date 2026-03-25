// Cost-Benefit Analysis Types
// Crowd-sourced CBA where likelihood scores are derived from argument competition
// Implements the automated-cba.skill specification (docs/automated-cba/SKILL.md)

import { SchilchtArgument, ProtocolLogEntry } from './schlicht'

export type CBAStatus = 'active' | 'concluded' | 'archived'
export type LineItemType = 'benefit' | 'cost'
export type LikelihoodStatus = 'calibrated' | 'contested' | 'emerging'

/**
 * The four canonical impact categories from the automated-cba skill.
 * These capture the dimensions people actually care about.
 */
export type CBACategory = 'Financial' | 'HumanLife' | 'Freedom' | 'Time'

export const CBA_CATEGORY_UNITS: Record<CBACategory, string> = {
  Financial: '$ (USD)',
  HumanLife: 'lives',
  Freedom: 'Liberty Index %',
  Time: 'person-hours',
}

/**
 * CBA Evidence tier system (T1–T4) that caps maximum truth contribution.
 * T1 = peer-reviewed/official (max 10), T2 = expert/institutional (max 7),
 * T3 = journalism/surveys (max 5), T4 = opinion/anecdote (max 3).
 * Named CBAEvidenceTier to avoid conflict with book.ts EvidenceTier.
 */
export type CBAEvidenceTier = 'T1' | 'T2' | 'T3' | 'T4'
/** @deprecated Use CBAEvidenceTier */
export type EvidenceTier = CBAEvidenceTier

export const EVIDENCE_TIER_MAX: Record<CBAEvidenceTier, number> = {
  T1: 10,
  T2: 7,
  T3: 5,
  T4: 3,
}

export const EVIDENCE_TIER_LABELS: Record<CBAEvidenceTier, string> = {
  T1: 'Peer-reviewed / Official',
  T2: 'Expert / Institutional',
  T3: 'Journalism / Surveys',
  T4: 'Opinion / Anecdote',
}

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
 * Overlap adjustment applied to an impact when it partially duplicates another.
 * Recorded for full audit transparency (skill principle: "Transparency over elegance").
 */
export interface OverlapAdjustment {
  overlapsWith: string       // id of the impact this overlaps with
  similarity: number         // 0-1 semantic overlap score
  adjustmentApplied: number  // multiplier applied (e.g., 0.6 = discounted 40%)
}

/**
 * A single line item in a cost-benefit analysis.
 * Each item has a predicted impact (in category units) and a likelihood
 * that is derived from competitive argument trees, not simple voting.
 *
 * Expected Value = Predicted Impact × Active Likelihood
 */
export interface CBALineItem {
  id: string
  type: LineItemType
  title: string              // Short description
  description: string        // Detailed explanation
  category: string           // Legacy: freeform category string
  canonicalCategory: CBACategory  // Skill-compliant: Financial | HumanLife | Freedom | Time
  predictedImpact: number    // Value in category units (positive for benefits, negative for costs)
  magnitudeJustification?: string  // Why this magnitude, what it's based on
  likelihoodBelief: LikelihoodBelief  // Nested belief node for probability
  expectedValue: number      // Computed: predictedImpact × activeLikelihood
  confidence: number         // 0-1: mean evidence tier quality across argument trees
  overlapAdjustments: OverlapAdjustment[]  // De-duplication log for this item
  contributor: {
    type: 'human' | 'ai'
    name: string
    submittedAt: string      // ISO 8601
  }
}

/**
 * Sensitivity analysis item showing which impacts most change the conclusion
 * if their likelihoods shift (swing = magnitude × (likelihood_high − likelihood_low)).
 */
export interface SensitivityItem {
  impactId: string
  impactTitle: string
  swing: number              // Absolute change in EV across plausible likelihood range
  likelihoodLow: number
  likelihoodHigh: number
}

/**
 * A single scenario (optimistic / base / pessimistic) with total and per-category EVs.
 */
export interface ScenarioResult {
  totalEv: number
  totalBenefits: number
  totalCosts: number
  categoryEvs: Array<{
    category: CBACategory
    benefitsEv: number
    costsEv: number
    netEv: number
  }>
}

/**
 * Log entry recording what de-duplication action was taken.
 */
export interface DeduplicationEntry {
  action: 'merged' | 'discounted'
  items: string[]            // impact IDs or argument descriptions
  similarity: number
  adjustment: string         // Human-readable description of what changed
}

/**
 * A complete Cost-Benefit Analysis.
 * Contains benefits and costs, each with argument-backed likelihood scores.
 * The net expected value is the decision score.
 *
 * Implements the full automated-cba.skill output data structure.
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
  verdict: 'net_positive' | 'net_negative' | 'uncertain'
  confidence: number         // 0-1 overall: mean evidence depth across all argument trees

  // Per-category breakdown (Financial / HumanLife / Freedom / Time)
  categoryBreakdown: Array<{
    category: CBACategory
    unit: string
    benefitsEv: number
    costsEv: number
    netEv: number
  }>

  // Sensitivity analysis: top items whose likelihood uncertainty most changes the conclusion
  sensitivity: SensitivityItem[]

  // Scenario simulation: optimistic (+0.15), base, pessimistic (-0.15)
  scenarios: {
    optimistic: ScenarioResult
    base: ScenarioResult
    pessimistic: ScenarioResult
  }

  // De-duplication transparency log
  deduplicationLog: DeduplicationEntry[]

  // Metadata
  createdAt: string          // ISO 8601
  updatedAt: string          // ISO 8601
  protocolLog: ProtocolLogEntry[]
}
