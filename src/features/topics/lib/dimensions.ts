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

export type TopicSortKey = 'direction' | 'magnitude' | 'abstraction' | 'score' | 'grounding'
export type SortDir = 'asc' | 'desc'

export interface DirectionBand {
  label: string
  /** Tailwind classes for the position cell, matching the /beliefs palette. */
  className: string
}

/** Same five buckets the /beliefs index uses for its valence filter. */
export function getDirectionBand(positivity: number): DirectionBand {
  if (positivity >= 60) return { label: 'Strongly Positive', className: 'bg-green-200 text-green-900' }
  if (positivity >= 20) return { label: 'Moderately Positive', className: 'bg-green-100 text-green-800' }
  if (positivity > -20) return { label: 'Neutral / Mixed', className: 'bg-yellow-100 text-yellow-900' }
  if (positivity > -60) return { label: 'Moderately Negative', className: 'bg-red-100 text-red-800' }
  return { label: 'Strongly Negative', className: 'bg-red-200 text-red-900' }
}

/** Same three buckets the /beliefs index uses for its specificity filter. */
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
 */
export function sortTopicBeliefs(
  rows: TopicBeliefRow[],
  key: TopicSortKey,
  dir?: SortDir,
): TopicBeliefRow[] {
  const naturalDesc = key === 'score' || key === 'grounding'
  const flip = dir === undefined ? false : (dir === 'desc') !== naturalDesc

  const value = (row: TopicBeliefRow): number => {
    switch (key) {
      case 'direction':
        return row.positivity
      case 'magnitude':
        return row.claimStrength
      case 'abstraction':
        return row.specificity
      case 'score':
        return row.positivity
      case 'grounding':
        return row.groundingScore
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const diff = naturalDesc ? value(b) - value(a) : value(a) - value(b)
    if (diff !== 0) return diff
    return a.statement.localeCompare(b.statement)
  })
  return flip ? sorted.reverse() : sorted
}
