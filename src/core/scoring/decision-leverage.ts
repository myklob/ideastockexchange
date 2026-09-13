/**
 * Decision Leverage — where is this belief's score actually fragile?
 *
 * Every other score on a belief page answers "what is the number?" This one
 * answers "which number is worth arguing about next?" A belief page with
 * thirty arguments gives a reader no way to tell the two arguments carrying
 * the conclusion from the twenty-eight decorating it, and no way to tell which
 * of the load-bearing ones rests on nothing. Decision Leverage ranks the
 * argument edges by how much the conclusion could still move if that edge were
 * settled, so scarce attention lands on the cruxes instead of the loudest row.
 *
 * Two factors, multiplied:
 *
 *   weight(e)  = |linkage| × importance × uniqueness × DEPTH_ATTENUATION^depth
 *
 *     The transmission coefficient: the fraction of a change in the child
 *     belief's truth score that reaches this conclusion. It is the existing
 *     engine's own impact formula with truth factored out —
 *     `impact = sign × truth × |linkage| × importance × uniqueness × 100`
 *     (computeArgumentImpactScore in scoring-engine.ts) — so weight × 100 is
 *     literally ∂impact/∂truth. Move the child's truth score ten points and
 *     this belief's net score moves weight × 10 points.
 *
 *   openRange(e) = weighted shortfall across four resolution gaps (below)
 *
 *     How much of the child's truth range is still genuinely open, in [0, 1].
 *     An edge whose child has no evidence, an undebated linkage, no score, and
 *     no opposition has its whole range open (1.0): nothing about it is
 *     settled, so any value it eventually takes is still on the table. An edge
 *     resting on replicated T1 evidence with a voted linkage and a two-sided
 *     sub-debate has almost none (→ 0).
 *
 *   leverage(e) = weight × openRange × 100
 *
 *     Points of conclusion score still at stake on this one edge. This is an
 *     upper bound on movement, not a forecast: it assumes the open part of the
 *     child's range could resolve anywhere within it. Direction is unknown by
 *     construction — that is what makes the edge worth investigating.
 *
 * The four resolution gaps (each in [0, 1], where 1 = nothing resolved):
 *
 *   1. Evidence   (0.40) — 1 − grounding(child). Reuses the Evidence Grounding
 *      Score, so a retraction (T1 → T0) raises leverage the same way it
 *      collapses grounding.
 *   2. Linkage    (0.25) — 1/√(1 + votes) in the edge's linkage sub-debate.
 *      An undebated linkage is an assumption, not a finding: the engine's
 *      default linkage value is doing the work, and nobody has checked it.
 *   3. Scoring    (0.15) — 1 when the child sub-debate has no score at all
 *      (Rule 6 blank), 0 once the engine has scored it.
 *   4. Examination(0.20) — 1/√(1 + min(support, opposition)) over everything
 *      attached to the child, counting both its own sub-arguments and its
 *      evidence rows on each side; 1 when nothing is attached at all. A claim
 *      nobody has pushed back on is untested, however much its supporters
 *      piled on one side — and a contradicting study counts as pushback just
 *      as a counter-argument does.
 *
 * How this differs from the scores it sits next to:
 *   - Confidence Stability (all-scores.ts) grades the whole belief's score as
 *     settled or fragile. Decision Leverage localizes that fragility to
 *     specific edges and weights it by how much each edge matters.
 *   - Grounding asks whether a belief touches evidence. Leverage asks what the
 *     conclusion stands to gain from the next piece of it.
 *
 * Pure math, no I/O. The belief-page adapter lives in
 * src/features/belief-analysis/lib/leverage.ts.
 */

// ─── Constants ────────────────────────────────────────────────────

/**
 * Per-level attenuation for indirect edges, matching the schema's documented
 * rule (`effective weight = base_weight × 0.5^depth`, Argument.depth). Depth 0
 * is a direct child of the belief and keeps its full weight.
 */
export const DEPTH_ATTENUATION = 0.5

/** Weights of the four resolution gaps. Sum to 1 so openRange stays in [0, 1]. */
export const GAP_WEIGHTS = {
  evidence: 0.40,
  linkage: 0.25,
  scoring: 0.15,
  examination: 0.20,
} as const

/** weight ≥ this carries enough of the conclusion to be called load-bearing. */
export const LOAD_BEARING_WEIGHT = 0.35

/** openRange ≥ this counts as an open question rather than a settled one. */
export const OPEN_RANGE_THRESHOLD = 0.40

/**
 * An edge below this leverage is not worth a reader's attention: under half a
 * point of conclusion score is at stake. Reported, but never called a crux.
 */
export const NEGLIGIBLE_LEVERAGE = 0.5

// ─── Inputs ───────────────────────────────────────────────────────

export interface LeverageEdgeInput {
  /** Stable identifier (the Argument row id on live data). */
  id: string | number
  /** The 2-6 word argument label shown on the belief page. */
  label: string
  side: 'agree' | 'disagree'
  /** Argument-to-conclusion linkage, [-1, 1]; magnitude is what transmits. */
  linkageScore: number
  /** Needle-moving weight, [0, 1]. */
  importanceScore: number
  /** Redundancy discount, [0, 1]. Null/undefined means the engine has not
   *  computed one yet, which is treated as no discount (1). */
  uniquenessScore?: number | null
  /** 0 for a direct child of the belief. */
  depth?: number
  /** The child belief's Evidence Grounding Score, [0, 1]. Null when the
   *  engine has not walked it; treated as ungrounded (the honest default —
   *  absent grounding is missing data, not evidence of grounding). */
  groundingScore?: number | null
  /** Votes cast in this edge's own linkage sub-debate. */
  linkageVotes?: number
  /** The child sub-debate's own score, 0-100. Null when unscored (Rule 6). */
  argumentScore?: number | null
  /** Reasons to agree inside the child's own sub-debate. */
  subAgreeCount?: number
  /** Reasons to disagree inside the child's own sub-debate. */
  subDisagreeCount?: number
  /** Evidence rows supporting the child. Counted as examination alongside its
   *  sub-arguments: a study is pushback in the same sense an argument is. */
  supportingEvidenceCount?: number
  /** Evidence rows weakening the child. */
  weakeningEvidenceCount?: number
  /** Internal link for the row, when a real route exists (Rule 5). */
  href?: string
}

// ─── Outputs ──────────────────────────────────────────────────────

export type LeverageClass =
  | 'crux'
  | 'load-bearing'
  | 'open-minor'
  | 'settled-minor'

export interface ResolutionGaps {
  /** 1 − grounding(child): how little of the child bottoms out in evidence. */
  evidence: number
  /** How little the edge's linkage has been voted on. */
  linkage: number
  /** 1 when the child sub-debate carries no score at all. */
  scoring: number
  /** How little opposition the child's own sub-debate has drawn. */
  examination: number
}

export interface EdgeLeverage {
  id: string | number
  label: string
  side: 'agree' | 'disagree'
  href?: string
  /** ∂(this belief's net score)/∂(child truth score), in [0, 1]. */
  weight: number
  /** Fraction of the child's truth range still open, in [0, 1]. */
  openRange: number
  /** weight × openRange × 100: points of conclusion score at stake. */
  leverage: number
  /** Which gaps are driving openRange, so the page can say what is missing. */
  gaps: ResolutionGaps
  /** The single widest gap, for the "what would settle it" column. */
  widestGap: keyof ResolutionGaps
  classification: LeverageClass
}

export interface BeliefLeverage {
  edges: EdgeLeverage[]
  /** Σ leverage: total points of conclusion score still unsettled. */
  totalAtStake: number
  /** Share of totalAtStake held by the single highest-leverage edge, [0, 1].
   *  High concentration means one unresolved edge is carrying the verdict. */
  concentration: number
  /** Edges classified 'crux', highest leverage first. */
  cruxes: EdgeLeverage[]
  /** Edges that carry weight and are already supported. */
  loadBearing: EdgeLeverage[]
}

// ─── Helpers ──────────────────────────────────────────────────────

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function round(value: number, places: number): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

/** Diminishing-returns shortfall: 1 at zero observations, 0.5 at three, → 0. */
function countShortfall(count: number): number {
  const n = Number.isFinite(count) && count > 0 ? count : 0
  return 1 / Math.sqrt(1 + n)
}

// ─── Core math ────────────────────────────────────────────────────

/**
 * The transmission coefficient: the fraction of a change in the child's truth
 * score that reaches this conclusion. Absolute linkage, because the edge's
 * side already carries direction.
 */
export function computeTransmissionWeight(edge: LeverageEdgeInput): number {
  const linkage = clamp01(Math.abs(edge.linkageScore))
  const importance = clamp01(edge.importanceScore)
  const uniqueness = edge.uniquenessScore == null ? 1 : clamp01(edge.uniquenessScore)
  const rawDepth = edge.depth ?? 0
  const depth = Number.isFinite(rawDepth) && rawDepth > 0 ? Math.floor(rawDepth) : 0
  return clamp01(linkage * importance * uniqueness * DEPTH_ATTENUATION ** depth)
}

/** The four resolution gaps for one edge. */
export function computeResolutionGaps(edge: LeverageEdgeInput): ResolutionGaps {
  const grounding = edge.groundingScore == null ? 0 : clamp01(edge.groundingScore)
  const support =
    Math.max(0, edge.subAgreeCount ?? 0) + Math.max(0, edge.supportingEvidenceCount ?? 0)
  const opposition =
    Math.max(0, edge.subDisagreeCount ?? 0) + Math.max(0, edge.weakeningEvidenceCount ?? 0)
  const examination =
    support + opposition === 0 ? 1 : countShortfall(Math.min(support, opposition))

  return {
    evidence: 1 - grounding,
    linkage: countShortfall(edge.linkageVotes ?? 0),
    scoring: edge.argumentScore == null ? 1 : 0,
    examination,
  }
}

/** Weighted mean of the gaps: how much of the child's range is still open. */
export function computeOpenRange(gaps: ResolutionGaps): number {
  return clamp01(
    gaps.evidence * GAP_WEIGHTS.evidence +
      gaps.linkage * GAP_WEIGHTS.linkage +
      gaps.scoring * GAP_WEIGHTS.scoring +
      gaps.examination * GAP_WEIGHTS.examination,
  )
}

/** The gap contributing most to openRange, weights included. */
export function widestGap(gaps: ResolutionGaps): keyof ResolutionGaps {
  const contributions: Array<[keyof ResolutionGaps, number]> = [
    ['evidence', gaps.evidence * GAP_WEIGHTS.evidence],
    ['linkage', gaps.linkage * GAP_WEIGHTS.linkage],
    ['examination', gaps.examination * GAP_WEIGHTS.examination],
    ['scoring', gaps.scoring * GAP_WEIGHTS.scoring],
  ]
  return contributions.reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0]
}

/**
 * Quadrant classification on (weight, openRange). An edge with nothing
 * meaningful at stake is never promoted, however open it is: a wide-open
 * question on an edge that transmits 1% of a change is not a crux. Clearing
 * both thresholds always puts at least 14 points at stake, so a crux is never
 * negligible by construction.
 */
export function classifyEdge(
  weight: number,
  openRange: number,
  leverage: number,
): LeverageClass {
  const carries = weight >= LOAD_BEARING_WEIGHT
  const open = openRange >= OPEN_RANGE_THRESHOLD
  if (leverage < NEGLIGIBLE_LEVERAGE) return carries ? 'load-bearing' : 'settled-minor'
  if (carries && open) return 'crux'
  if (carries) return 'load-bearing'
  return 'open-minor'
}

/** Score one edge. */
export function computeEdgeLeverage(edge: LeverageEdgeInput): EdgeLeverage {
  const weight = computeTransmissionWeight(edge)
  const gaps = computeResolutionGaps(edge)
  const openRange = computeOpenRange(gaps)
  const leverage = weight * openRange * 100

  return {
    id: edge.id,
    label: edge.label,
    side: edge.side,
    ...(edge.href ? { href: edge.href } : {}),
    weight: round(weight, 4),
    openRange: round(openRange, 4),
    leverage: round(leverage, 1),
    gaps: {
      evidence: round(gaps.evidence, 4),
      linkage: round(gaps.linkage, 4),
      scoring: round(gaps.scoring, 4),
      examination: round(gaps.examination, 4),
    },
    widestGap: widestGap(gaps),
    classification: classifyEdge(weight, openRange, round(leverage, 1)),
  }
}

/**
 * Rank every edge of one belief by leverage, highest first, and summarize.
 * Ties keep input order, so a stable upstream sort stays stable here.
 */
export function computeBeliefLeverage(edges: LeverageEdgeInput[]): BeliefLeverage {
  const scored = edges
    .map(computeEdgeLeverage)
    .sort((a, b) => b.leverage - a.leverage)

  const totalAtStake = round(
    scored.reduce((sum, e) => sum + e.leverage, 0),
    1,
  )
  const top = scored[0]?.leverage ?? 0
  const concentration = totalAtStake > 0 ? round(top / totalAtStake, 4) : 0

  return {
    edges: scored,
    totalAtStake,
    concentration,
    cruxes: scored.filter(e => e.classification === 'crux'),
    loadBearing: scored.filter(e => e.classification === 'load-bearing'),
  }
}

// ─── Presentation helpers ─────────────────────────────────────────

export interface LeverageClassMeta {
  key: LeverageClass
  label: string
  /** One line on what the reader should do about an edge in this class. */
  guidance: string
  /** Hex chip background for non-Tailwind contexts (static HTML export). */
  hexColor: string
}

export const LEVERAGE_CLASSES: Record<LeverageClass, LeverageClassMeta> = {
  crux: {
    key: 'crux',
    label: 'Crux',
    guidance: 'Carries the conclusion and rests on little. Settle this one first.',
    hexColor: '#f8d7da',
  },
  'load-bearing': {
    key: 'load-bearing',
    label: 'Load-bearing',
    guidance: 'The conclusion leans on this, and it is already supported. Attack it only with real evidence.',
    hexColor: '#d4edda',
  },
  'open-minor': {
    key: 'open-minor',
    label: 'Open but minor',
    guidance: 'Unsettled, but it barely moves the score either way.',
    hexColor: '#fff3cd',
  },
  'settled-minor': {
    key: 'settled-minor',
    label: 'Settled or minor',
    guidance: 'Nothing meaningful left at stake here.',
    hexColor: '#e9ecef',
  },
}

/** Plain-language name for a resolution gap, for the "what would settle it" cell. */
export const GAP_LABELS: Record<keyof ResolutionGaps, string> = {
  evidence: 'Needs evidence',
  linkage: 'Linkage undebated',
  scoring: 'Sub-debate unscored',
  examination: 'No opposition yet',
}

/**
 * One-line verdict for the belief as a whole. Concentration above this share
 * means a single unresolved edge is carrying the verdict, which is the
 * fragility worth warning about.
 */
export const FRAGILE_CONCENTRATION = 0.5

export function summarizeLeverage(summary: BeliefLeverage): string {
  if (summary.edges.length === 0) {
    return 'No argument edges scored yet, so there is nothing to rank.'
  }
  if (summary.totalAtStake < NEGLIGIBLE_LEVERAGE) {
    return 'Every edge is settled: no argument here has meaningful room left to move the score.'
  }
  const top = summary.edges[0]
  const leader = `The largest single gap is “${top.label}” at ${top.leverage.toFixed(1)} points.`
  if (summary.cruxes.length === 0) {
    return `About ${summary.totalAtStake.toFixed(1)} points of score are still unsettled, but no single edge both carries weight and lacks support. ${leader}`
  }
  const plural = summary.cruxes.length === 1 ? 'crux' : 'cruxes'
  const concentrated =
    summary.concentration >= FRAGILE_CONCENTRATION
      ? ' One edge holds most of what is unsettled, so the verdict here is fragile.'
      : ''
  return `${summary.cruxes.length} ${plural} carry ${summary.totalAtStake.toFixed(1)} points of unsettled score. ${leader}${concentrated}`
}
