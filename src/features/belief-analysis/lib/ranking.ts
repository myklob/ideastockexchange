/**
 * Ranking helpers for score-sorted belief page tables.
 *
 * Every table row on a belief page relates to the belief through a scored
 * relationship (the ReasonRank performance of the row's own pro/con
 * sub-debate). Tables show their highest-scoring rows first and collapse the
 * rest until expanded. Unscored rows (null/undefined) sort last — their score
 * cells render blank per Rule 6 — so real scores are never buried beneath
 * placeholders.
 */

/** How many rows a table shows before collapsing the remainder. */
export const TABLE_TOP_LIMIT = 5

type ScoreGetter<T> = (row: T) => number | null | undefined

/** Comparator: score descending, nulls last. Stable for equal/missing scores. */
export function byScoreDesc<T>(getScore: ScoreGetter<T>): (a: T, b: T) => number {
  return (a, b) => {
    const sa = getScore(a)
    const sb = getScore(b)
    if (sa == null && sb == null) return 0
    if (sa == null) return 1
    if (sb == null) return -1
    return sb - sa
  }
}

export interface RankedRows<T> {
  /** The top-scoring rows, at most `limit` of them, best first. */
  top: T[]
  /** Everything below the fold, still score-ordered. */
  rest: T[]
}

/**
 * Sort rows by relationship score (descending, nulls last) and split them at
 * `limit`. The database already orders most relations this way; sorting again
 * here is cheap and covers callers that merge lists (e.g. similarTo +
 * similarFrom) or receive hand-built data.
 */
export function rankByScore<T>(
  rows: T[],
  getScore: ScoreGetter<T>,
  limit: number = TABLE_TOP_LIMIT,
): RankedRows<T> {
  const sorted = [...rows].sort(byScoreDesc(getScore))
  return { top: sorted.slice(0, limit), rest: sorted.slice(limit) }
}

/**
 * Pair two score-ranked side columns row-by-row for the page's two-sided
 * tables (pro/con, supporter/opponent, short/long). Each side keeps its own
 * ranking; row i holds the i-th best of each side, padded with null.
 */
export function pairBySide<T>(left: T[], right: T[]): Array<[T | null, T | null]> {
  const n = Math.max(left.length, right.length)
  return Array.from({ length: n }, (_, i) => [left[i] ?? null, right[i] ?? null])
}

/** Score cell text: null/undefined renders blank (Rule 6), integers stay bare. */
export function formatScore(score: number | null | undefined): string | null {
  if (score == null) return null
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}
