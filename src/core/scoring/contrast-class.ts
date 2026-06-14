/**
 * The Denominator — Scoring a Belief Against Its Counterclaims
 *
 * A bare pro-minus-con score is a numerator with nothing under the line:
 * "+9.2" relative to what? This module supplies the denominator. There are
 * two layers, and they stack rather than compete:
 *
 *   Layer 1 (internal denominator) — the JUSTIFICATION score. Divide the net
 *   by the belief's OWN total argument weight: (Pro − Con) / (Pro + Con).
 *   Answers "how lopsided is this claim versus its own rebuttals?" Range −1..+1.
 *   Doubles as the Rule 9 inversion trigger (negative ⇒ net-refuted).
 *
 *   Layer 2 (external denominator) — the COMPARATIVE score. Divide against the
 *   best RIVAL in the contrast class: OCV(oi) = S(oi) − max_{j≠i} S(oj).
 *   Answers "does this claim beat the alternatives?" Exactly one option in a
 *   contrast class has OCV > 0 (the winner); every other option's negative
 *   magnitude is what you give up by choosing it instead of the best rival.
 *
 * Layer 1 produces the quantity Layer 2 compares: Layer 1 runs inside each
 * node, Layer 2 across the siblings. Nothing here introduces a new scoring
 * primitive — every term under the line is itself an audited, scored value, so
 * the engine's traceability invariant holds end to end. These are OUTPUTS
 * (read-only readouts); they must never feed back into any argument's score.
 *
 * Spec: docs/THE_DENOMINATOR.md
 */

// ─── Layer 1: internal denominator (justification) ────────────────────────

/**
 * Justification score J(X) = (Pro − Con) / (Pro + Con), range −1..+1.
 *
 * The net-margin view of how decisively a belief's own arguments favor it over
 * its own rebuttals. Negative means the belief is net-refuted (Rule 9 trigger).
 * Returns 0 when there is no argument weight at all (undefined, not refuted).
 *
 * Identity worth knowing: J = 2·share − 1, where share = Pro/(Pro+Con). The two
 * carry identical information on different scales; the margin form is the more
 * useful default because its sign does work.
 */
export function justificationScore(pro: number, con: number): number {
  const total = pro + con
  if (total <= 0) return 0
  return (pro - con) / total
}

/**
 * Truth share p = Pro / (Pro + Con), range 0..1 — the implied-probability /
 * market-share view of a single belief's internal balance. Returns null when
 * there is no argument weight (a share of nothing is undefined, not 0.5).
 */
export function truthShare(pro: number, con: number): number | null {
  const total = pro + con
  if (total <= 0) return null
  return pro / total
}

/**
 * A confidence figure to report ALONGSIDE the ratio, never folded into it.
 * The justification ratio washes out volume — [Pro 9, Con 1] and
 * [Pro 90, Con 10] both score +0.8 — so conviction must track evidence volume
 * separately. This returns the total argument mass (Pro + Con); pair it with a
 * count of independent items at the call site if available.
 */
export function argumentMass(pro: number, con: number): number {
  return pro + con
}

// ─── Layer 2: external denominator (opportunity cost) ─────────────────────

/** A mutually exclusive option in a contrast class, carrying its tree score S. */
export interface ContrastOption {
  id: string
  label: string
  /** S(o): the argument-tree / ReasonRank score. May be signed. */
  score: number
}

/** Pairwise margin M(oi, oj) = S(oi) − S(oj). */
export function pairwiseMargin(a: number, b: number): number {
  return a - b
}

/**
 * Opportunity-cost value OCV(oi) = S(oi) − max_{j≠i} S(oj).
 *
 * The value of an option is what it delivers MINUS what the best alternative
 * would have delivered. Sign tells you win/lose against the field; magnitude
 * tells you by how much. With a single option (no rivals) OCV is undefined —
 * there is no denominator — so this returns null.
 */
export function opportunityCostValue(
  optionScore: number,
  rivalScores: number[],
): number | null {
  if (rivalScores.length === 0) return null
  return optionScore - Math.max(...rivalScores)
}

/** One option's place in the field after the comparative layer is applied. */
export interface ComparativeResult extends ContrastOption {
  /** OCV against the best rival; null only when the class has a single option. */
  ocv: number | null
  /** The rival that set the bar (the best other option); null if none. */
  bestRivalId: string | null
  /** True for the single option with OCV > 0 — the current winner of the field. */
  isWinner: boolean
}

/**
 * Run the comparative layer across a whole contrast class. Returns each option
 * with its OCV against its own best rival, the id of that rival, and a winner
 * flag. Exactly one option wins when scores are distinct; ties produce no
 * strict winner (no option has OCV strictly > 0).
 */
export function comparativeScores(options: ContrastOption[]): ComparativeResult[] {
  return options.map((option) => {
    const rivals = options.filter((o) => o.id !== option.id)
    const ocv = opportunityCostValue(option.score, rivals.map((r) => r.score))

    let bestRivalId: string | null = null
    if (rivals.length > 0) {
      const best = rivals.reduce((a, b) => (b.score > a.score ? b : a))
      bestRivalId = best.id
    }

    return {
      ...option,
      ocv,
      bestRivalId,
      isWinner: ocv !== null && ocv > 0,
    }
  })
}

// ─── Layer 2b: criteria-normalized denominator ────────────────────────────

/**
 * Min-max normalize a criterion's raw scores across the rivals:
 *   n(oi,k) = (r(oi,k) − min_j) / (max_j − min_j)
 *
 * The denominator on each criterion is the SPREAD of the rivals, so a flat 0.6
 * means nothing while a 0.6 in a field running 0.1..0.7 means a lot. This is an
 * affine rescaling of real rival scores, not a sigmoid clamp — the range is set
 * by the actual spread, so a lopsided field stays lopsided. When every option
 * scores identically (zero spread) the criterion can't discriminate; we return
 * a neutral 0.5 for each rather than dividing by zero.
 */
export function normalizeCriterion(values: number[]): number[] {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = max - min
  if (spread === 0) return values.map(() => 0.5)
  return values.map((v) => (v - min) / spread)
}

/** A shared yardstick scored across every option in the contrast class. */
export interface Criterion {
  key: string
  /**
   * Importance weight (≥ 0), itself a debatable/scored quantity that lives on
   * the TOPIC, not the belief — "how much does civilian welfare matter relative
   * to deterrence" is the same question for every option. This is the real home
   * for the otherwise-blank Importance column.
   */
  importance: number
  /** Raw score per option id, on any common scale (normalized internally). */
  raw: Record<string, number>
}

/** A criteria-decomposed weighted score for one option. */
export interface WeightedCriteriaResult {
  optionId: string
  /** W(oi) = Σ_k importance_k · n(oi,k). */
  weighted: number
  /** Per-criterion normalized contribution, for decomposing the margin. */
  perCriterion: { key: string; normalized: number; contribution: number }[]
}

/**
 * Score every option on the shared criteria and weight by per-criterion
 * importance: W(oi) = Σ_k importance_k · n(oi,k). Use W to DECOMPOSE a margin —
 * it shows which criterion drove a win or loss — not as a second headline.
 */
export function weightedCriteriaScores(
  options: ContrastOption[],
  criteria: Criterion[],
): WeightedCriteriaResult[] {
  // Pre-normalize each criterion once across the whole field.
  const normalizedByKey = new Map<string, Map<string, number>>()
  for (const c of criteria) {
    const ids = options.map((o) => o.id)
    const rawValues = ids.map((id) => c.raw[id] ?? 0)
    const normValues = normalizeCriterion(rawValues)
    normalizedByKey.set(c.key, new Map(ids.map((id, i) => [id, normValues[i]])))
  }

  return options.map((option) => {
    const perCriterion = criteria.map((c) => {
      const normalized = normalizedByKey.get(c.key)?.get(option.id) ?? 0
      return { key: c.key, normalized, contribution: c.importance * normalized }
    })
    const weighted = perCriterion.reduce((s, p) => s + p.contribution, 0)
    return { optionId: option.id, weighted, perCriterion }
  })
}

// ─── Field share (optional readout) ───────────────────────────────────────

/** Result of attempting a 0..1 market-share view of the field. */
export interface FieldShareResult {
  /** Share per option id, summing to 1; null when shares are undefined. */
  shares: Record<string, number> | null
  /** True when a rank-shift was applied to make signed scores shareable. */
  shifted: boolean
  /**
   * Why shares are null / shifted, for honest readouts. "ok" | "signed" |
   * "shifted" | "empty".
   */
  status: 'ok' | 'signed' | 'shifted' | 'empty'
}

/**
 * Field share Price(oi) = S(oi) / Σ_j S(oj), a market-share view — but ONLY
 * meaningful for non-negative inputs. ReasonRank scores can go negative, and a
 * share of signed quantities is nonsense (a near-zero denominator blows up, a
 * negative share is meaningless).
 *
 * Default behaviour (preferred per spec): refuse to fake a probability — return
 * shares: null with status 'signed', and let the caller report OCV instead.
 *
 * With { allowShift: true } a rank-shift S'(o) = S(o) − min + ε is applied
 * first and status is 'shifted', so nobody mistakes the result for a real
 * probability.
 */
export function fieldShares(
  options: ContrastOption[],
  opts: { allowShift?: boolean; epsilon?: number } = {},
): FieldShareResult {
  if (options.length === 0) {
    return { shares: null, shifted: false, status: 'empty' }
  }

  const scores = options.map((o) => o.score)
  const hasNegative = scores.some((s) => s < 0)

  if (!hasNegative) {
    const sum = scores.reduce((a, b) => a + b, 0)
    if (sum <= 0) return { shares: null, shifted: false, status: 'empty' }
    const shares: Record<string, number> = {}
    options.forEach((o) => { shares[o.id] = o.score / sum })
    return { shares, shifted: false, status: 'ok' }
  }

  if (!opts.allowShift) {
    return { shares: null, shifted: false, status: 'signed' }
  }

  const epsilon = opts.epsilon ?? 1e-6
  const min = Math.min(...scores)
  const shifted = options.map((o) => o.score - min + epsilon)
  const sum = shifted.reduce((a, b) => a + b, 0)
  const shares: Record<string, number> = {}
  options.forEach((o, i) => { shares[o.id] = shifted[i] / sum })
  return { shares, shifted: true, status: 'shifted' }
}

// ─── Argument sorting: intrinsic vs comparative ───────────────────────────

/**
 * "Intrinsic" arguments ("X is true / good on its own terms") feed Layer 1's
 * (Pro − Con)/(Pro + Con) ratio. "Comparative" arguments ("rival Y beats X")
 * are NOT strikes against the belief — they are statements about the
 * denominator — and must be pulled out of the pro/con tally entirely and moved
 * to Layer 2. Left in the con column, a comparative argument double-counts the
 * rival: it pads Pro + Con AND reappears as a rival option. Sorting first makes
 * the Layer 1 ratio cleaner, not merely rescaled.
 */
export type ArgumentKind = 'intrinsic' | 'comparative'

export interface SortableArgument {
  kind: ArgumentKind
  side: 'pro' | 'con'
  /** Weight this argument contributes (impact / score magnitude). */
  weight: number
}

export interface ArgumentSortResult {
  /** Pro weight from intrinsic arguments only. */
  intrinsicPro: number
  /** Con weight from intrinsic arguments only. */
  intrinsicCon: number
  /** Weight diverted to the comparative layer (excluded from Layer 1). */
  comparativeWeight: number
  /** Layer 1 justification on the cleaned, intrinsic-only totals. */
  justification: number
}

/**
 * Partition arguments into the intrinsic totals that feed Layer 1 and the
 * comparative weight that belongs in Layer 2, then compute the cleaned Layer 1
 * justification score from the intrinsic-only totals.
 */
export function sortArguments(args: SortableArgument[]): ArgumentSortResult {
  let intrinsicPro = 0
  let intrinsicCon = 0
  let comparativeWeight = 0

  for (const arg of args) {
    if (arg.kind === 'comparative') {
      comparativeWeight += arg.weight
      continue
    }
    if (arg.side === 'pro') intrinsicPro += arg.weight
    else intrinsicCon += arg.weight
  }

  return {
    intrinsicPro,
    intrinsicCon,
    comparativeWeight,
    justification: justificationScore(intrinsicPro, intrinsicCon),
  }
}

// ─── Combined readout ─────────────────────────────────────────────────────

/** The full denominator readout for one focal option within its contrast class. */
export interface ContrastClassReadout {
  /** The comparative layer for every option (OCV, winner flag, best rival). */
  comparative: ComparativeResult[]
  /** Pairwise margins of the focal option against each rival. */
  focalMargins: { rivalId: string; rivalLabel: string; margin: number }[]
  /** The focal option's OCV against its best rival (the headline number). */
  focalOcv: number | null
  /** The best rival's id, the named denominator for the headline. */
  focalBestRivalId: string | null
  /** Optional criteria decomposition when criteria are supplied. */
  criteria: WeightedCriteriaResult[] | null
  /** Optional market-share view of the field. */
  fieldShare: FieldShareResult
}

/**
 * Assemble the complete contrast-class readout for a focal option. This is the
 * "state the denominator next to the verdict" payload: the OCV against the
 * named best rival, the full pairwise-margin table, the optional criteria
 * decomposition, and the optional field share.
 */
export function analyzeContrastClass(
  focalId: string,
  options: ContrastOption[],
  criteria: Criterion[] = [],
): ContrastClassReadout {
  const comparative = comparativeScores(options)
  const focal = comparative.find((o) => o.id === focalId)

  const focalMargins = options
    .filter((o) => o.id !== focalId)
    .map((rival) => ({
      rivalId: rival.id,
      rivalLabel: rival.label,
      margin: pairwiseMargin(focal?.score ?? 0, rival.score),
    }))

  return {
    comparative,
    focalMargins,
    focalOcv: focal?.ocv ?? null,
    focalBestRivalId: focal?.bestRivalId ?? null,
    criteria: criteria.length > 0 ? weightedCriteriaScores(options, criteria) : null,
    fieldShare: fieldShares(options),
  }
}
