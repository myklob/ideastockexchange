/**
 * Evidence Grounding Score — does this belief bottom out in evidence?
 *
 * The manipulation-era failure this counters: rankings driven by engagement
 * (clicks, outrage, virality) instead of evidence quality. The ISE ranking
 * input is grounding: how much of a belief's support ultimately rests on
 * tiered evidence records, rather than on free-floating assertion or a ring
 * of claims propping each other up.
 *
 * The score is engine-computed from the graph (audit-locked, like every
 * other score) and deliberately simple enough to verify by hand:
 *
 *   direct    = Σ over own evidence:      tierWeight(tier) × |linkage|
 *   inherited = Σ over argument edges:    |linkage| × grounding(child)
 *   raw       = direct + inherited
 *   grounding = raw / (raw + 1)                     — saturating, in [0, 1)
 *
 * Properties that matter:
 *   - Zero evidence anywhere in the subtree → grounding 0 ("Unfounded").
 *     Assertion volume cannot move it; only evidence can.
 *   - A circular chain (A cites B cites A) contributes exactly zero: the
 *     walk treats a back-edge as groundless, so a ring of claims has no
 *     foundation — the structural twin of the circular-citation guard.
 *   - Tier ordering is explicit: one T1 study at linkage 0.9 (raw 0.90 →
 *     0.47) outranks any number of restated opinions, and a retraction
 *     (T1 → T0) collapses grounding the same way it collapses EVS.
 *   - Distance from evidence attenuates: a conclusion two hops from its
 *     sources is less grounded than the finding itself, which is the honest
 *     reading of a long inferential chain.
 *
 * Both supporting and weakening evidence count: grounding measures whether
 * the debate is in contact with evidence at all, not which way it points.
 * Direction is Truth's job.
 */

import { getEvidenceTypeWeight } from './scoring-engine'

// ─── Inputs ───────────────────────────────────────────────────────

export interface GroundingEvidenceInput {
  /** Evidence tier: T0 (retracted) … T4 (opinion). */
  tier: string
  /** Evidence-to-conclusion linkage, [-1, 1]; magnitude is what grounds. */
  linkageScore: number
}

export interface GroundingArgumentInput {
  /** Argument-to-conclusion linkage, [-1, 1]. */
  linkageScore: number
  /** The child belief's own grounding score (0–1). */
  childGrounding: number
}

/** Saturation constant: grounding = raw / (raw + K). K = 1 puts a single
 *  solid T1 chain near 0.47 and three of them near 0.73. */
export const GROUNDING_SATURATION = 1

// ─── Core math ────────────────────────────────────────────────────

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/** One evidence row's grounding contribution: tierWeight × |linkage|. */
export function directGroundingWeight(evidence: GroundingEvidenceInput): number {
  return getEvidenceTypeWeight(evidence.tier) * Math.abs(evidence.linkageScore)
}

/** Map an unbounded raw grounding mass onto [0, 1). */
export function saturateGrounding(raw: number): number {
  if (raw <= 0) return 0
  return raw / (raw + GROUNDING_SATURATION)
}

/**
 * The Evidence Grounding Score for one belief, given its own evidence rows
 * and the grounding already computed for each argument edge's child.
 * Rounded to 4 decimals to keep stored values stable across recomputes.
 */
export function computeGroundingScore(
  evidence: GroundingEvidenceInput[],
  argumentEdges: GroundingArgumentInput[],
): number {
  const direct = evidence.reduce((sum, e) => sum + directGroundingWeight(e), 0)
  const inherited = argumentEdges.reduce(
    (sum, a) => sum + Math.abs(a.linkageScore) * clamp01(a.childGrounding),
    0,
  )
  return Math.round(saturateGrounding(direct + inherited) * 10000) / 10000
}

// ─── Tree walker (pure; the DB twin lives in src/lib/grounding.ts) ─

export interface GroundingNode {
  id: string
  evidence: GroundingEvidenceInput[]
  argumentEdges: { linkageScore: number; child: GroundingNode }[]
}

/**
 * Score a whole in-memory belief tree. A node re-entered while still on the
 * walk stack is a citation ring and contributes zero grounding. Scores
 * computed while a ring edge was cut are context-dependent, so they are
 * never memoized — every node's stored score is its score as a root,
 * independent of evaluation order.
 */
export function scoreGroundingTree(
  node: GroundingNode,
  memo: Map<string, number> = new Map(),
  walking: Set<string> = new Set(),
): number {
  return walkGroundingTree(node, memo, walking).score
}

function walkGroundingTree(
  node: GroundingNode,
  memo: Map<string, number>,
  walking: Set<string>,
): { score: number; tainted: boolean } {
  const cached = memo.get(node.id)
  if (cached !== undefined) return { score: cached, tainted: false }
  if (walking.has(node.id)) return { score: 0, tainted: true } // ring of claims: no foundation

  walking.add(node.id)
  let tainted = false
  const edges = node.argumentEdges.map((edge) => {
    const child = walkGroundingTree(edge.child, memo, walking)
    tainted = tainted || child.tainted
    return { linkageScore: edge.linkageScore, childGrounding: child.score }
  })
  walking.delete(node.id)

  const score = computeGroundingScore(node.evidence, edges)
  if (!tainted) memo.set(node.id, score)
  return { score, tainted }
}

// ─── Bands ────────────────────────────────────────────────────────

export interface GroundingBand {
  key: 'unfounded' | 'thin' | 'grounded' | 'well-grounded'
  label: string
  /** One-line meaning, phrased for the ranking UI. */
  descriptor: string
  /** Hex background for non-Tailwind contexts (chips, XSLT render). */
  hexColor: string
}

export const GROUNDING_BANDS: GroundingBand[] = [
  {
    key: 'unfounded',
    label: 'Unfounded',
    descriptor: 'No evidence anywhere in the argument tree — assertion only.',
    hexColor: '#f8d7da',
  },
  {
    key: 'thin',
    label: 'Thinly sourced',
    descriptor: 'Touches evidence, but weakly: low tiers or long inferential chains.',
    hexColor: '#fff3cd',
  },
  {
    key: 'grounded',
    label: 'Grounded',
    descriptor: 'Rests on at least one solid, directly-linked evidence chain.',
    hexColor: '#d9f0d1',
  },
  {
    key: 'well-grounded',
    label: 'Well-grounded',
    descriptor: 'Multiple independent high-tier chains support the tree.',
    hexColor: '#d4edda',
  },
]

const UNFOUNDED_EPSILON = 1e-9
export const THIN_GROUNDING_MAX = 0.35
export const GROUNDED_MAX = 0.7

export function getGroundingBand(score: number): GroundingBand {
  if (score <= UNFOUNDED_EPSILON) return GROUNDING_BANDS[0]
  if (score < THIN_GROUNDING_MAX) return GROUNDING_BANDS[1]
  if (score < GROUNDED_MAX) return GROUNDING_BANDS[2]
  return GROUNDING_BANDS[3]
}

export function formatGrounding(score: number): string {
  return score.toFixed(2)
}
