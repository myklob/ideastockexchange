/**
 * The versioned snapshot-scoring function the market settles against.
 *
 * Transparency requirements (docs/MARKET_LAYER_SPEC.md):
 *   - every EpochSnapshot records the algorithm version that produced it;
 *   - the exact inputs are archived alongside the score;
 *   - given the archive and the version, any third party reruns this file
 *     and reproduces the score to the decimal. No hidden parameters.
 *
 * This module is pure — no database, no clock. The current version is the
 * provisional engine: importance-weighted argument impact with the
 * claim-strength burden penalty (the same math the belief scorecard uses).
 * When the full ReasonRank engine lands it becomes the next version;
 * existing snapshots keep referencing this one.
 */

import { applyStrengthPenalty } from '@/core/scoring/claim-strength'

export const SCORING_ALGORITHM_VERSION = 'reasonrank-provisional-v0.1'

export interface GraphArgumentInput {
  side: string // "agree" | "disagree"
  impactScore: number
  importanceScore: number
}

export interface GraphInputs {
  beliefId: number
  slug: string
  claimStrength: number
  arguments: GraphArgumentInput[]
}

interface BeliefLike {
  id: number
  slug: string
  claimStrength: number
  arguments: { side: string; impactScore: number; importanceScore: number }[]
}

/** Extract exactly the fields the algorithm reads, for archival. */
export function extractGraphInputs(belief: BeliefLike): GraphInputs {
  return {
    beliefId: belief.id,
    slug: belief.slug,
    claimStrength: belief.claimStrength,
    arguments: belief.arguments.map(a => ({
      side: a.side,
      impactScore: a.impactScore,
      importanceScore: a.importanceScore,
    })),
  }
}

/**
 * truth_score in [0,1]: importance-weighted share of pro impact, put through
 * the claim-strength burden penalty. An argument-free belief scores the
 * uninformative prior 0.5 before the penalty.
 */
export function computeTruthScore(inputs: GraphInputs): number {
  const pro = inputs.arguments
    .filter(a => a.side === 'agree')
    .reduce((s, a) => s + Math.abs(a.impactScore) * a.importanceScore, 0)
  const con = inputs.arguments
    .filter(a => a.side === 'disagree')
    .reduce((s, a) => s + Math.abs(a.impactScore) * a.importanceScore, 0)
  const total = pro + con
  const raw = total > 0 ? pro / total : 0.5
  return applyStrengthPenalty(raw, inputs.claimStrength)
}

export function archiveToJson(inputs: GraphInputs): string {
  return JSON.stringify(inputs)
}

/** Re-run the archived inputs: the reproducibility path for settled epochs. */
export function recomputeFromArchive(graphArchive: string): number {
  return computeTruthScore(JSON.parse(graphArchive) as GraphInputs)
}
