/**
 * Dimension helpers for topic hub pages (One Page Per Topic).
 *
 * Every belief is a coordinate on three axes it already carries:
 *   Direction    — positivity, -100..+100 (negative ↔ positive)
 *   Magnitude    — claimStrength, 0..1 (weak ↔ extreme phrasing)
 *   Abstraction  — specificity, 0..1 (general principle ↔ concrete instance)
 * The topic page sorts one shared belief set along each axis in turn, and by
 * the engine-computed score, so the best-supported version of a claim rises
 * to the top of any view.
 */

export interface TopicBeliefRow {
  id: number
  slug: string
  statement: string
  positivity: number
  claimStrength: number
  specificity: number
  groundingScore: number
}

export const TOPIC_SORT_KEYS = ['direction', 'magnitude', 'abstraction', 'score', 'grounding'] as const
export type TopicSortKey = (typeof TOPIC_SORT_KEYS)[number]
export type SortDir = 'asc' | 'desc'

export function parseTopicSortKey(raw: string | null | undefined): TopicSortKey {
  return TOPIC_SORT_KEYS.includes(raw as TopicSortKey) ? (raw as TopicSortKey) : 'score'
}

export function parseSortDir(raw: string | null | undefined): SortDir | undefined {
  return raw === 'asc' || raw === 'desc' ? raw : undefined
}

export interface DirectionBand {
  label: string
  /** Tailwind classes for the position cell, matching the /beliefs palette. */
  className: string
}

/** Thresholds match the /beliefs index valence filter buckets (±60 / ±20). */
export function getDirectionBand(positivity: number): DirectionBand {
  if (positivity >= 60) return { label: 'Strongly Positive', className: 'bg-green-200 text-green-900' }
  if (positivity >= 20) return { label: 'Moderately Positive', className: 'bg-green-100 text-green-800' }
  if (positivity > -20) return { label: 'Neutral / Mixed', className: 'bg-yellow-100 text-yellow-900' }
  if (positivity > -60) return { label: 'Moderately Negative', className: 'bg-red-100 text-red-800' }
  return { label: 'Strongly Negative', className: 'bg-red-200 text-red-900' }
}

/** Thresholds match the /beliefs index specificity filter buckets (0.33 / 0.66). */
export function getAbstractionLabel(specificity: number): string {
  if (specificity < 0.33) return 'General Principle'
  if (specificity < 0.66) return 'Case-Level'
  return 'Specific Instance'
}

export function formatSignedScore(positivity: number): string {
  const rounded = Math.round(positivity)
  return rounded >= 0 ? `+${rounded}` : `${rounded}`
}

/**
 * Sort along one axis. Each dimension has a natural reading direction —
 * direction and abstraction read low → high (negative → positive, general →
 * specific), magnitude reads weak → extreme, and the two score sorts read
 * best-first. `dir` flips the natural order when set.
 *
 * 'score' ranks by |positivity|: support strength independent of stance, so
 * on a negative-direction topic the strongest-supported (most negative)
 * claim still rises to the top. The signed value stays the direction axis.
 */
export function sortTopicBeliefs(
  rows: TopicBeliefRow[],
  key: TopicSortKey,
  dir?: SortDir,
): TopicBeliefRow[] {
  const naturalDesc = key === 'score' || key === 'grounding'
  const desc = dir === undefined ? naturalDesc : dir === 'desc'

  const value = (row: TopicBeliefRow): number => {
    switch (key) {
      case 'direction':
        return row.positivity
      case 'magnitude':
        return row.claimStrength
      case 'abstraction':
        return row.specificity
      case 'score':
        return Math.abs(row.positivity)
      case 'grounding':
        return row.groundingScore
    }
  }

  // Flip applies to the axis only; the statement tie-break stays A→Z.
  return [...rows].sort((a, b) => {
    const diff = desc ? value(b) - value(a) : value(a) - value(b)
    if (diff !== 0) return diff
    return a.statement.localeCompare(b.statement)
  })
}
