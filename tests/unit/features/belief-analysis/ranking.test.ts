import { describe, it, expect } from 'vitest'
import {
  byScoreDesc,
  rankByScore,
  pairBySide,
  TABLE_TOP_LIMIT,
} from '@/features/belief-analysis/lib/ranking'

interface Row {
  id: number
  score: number | null
}

const row = (id: number, score: number | null): Row => ({ id, score })

describe('byScoreDesc', () => {
  it('sorts highest score first', () => {
    const rows = [row(1, 10), row(2, 90), row(3, 40)]
    const sorted = [...rows].sort(byScoreDesc(r => r.score))
    expect(sorted.map(r => r.id)).toEqual([2, 3, 1])
  })

  it('puts unscored rows last, preserving their relative order', () => {
    const rows = [row(1, null), row(2, 5), row(3, null), row(4, 80)]
    const sorted = [...rows].sort(byScoreDesc(r => r.score))
    expect(sorted.map(r => r.id)).toEqual([4, 2, 1, 3])
  })

  it('is stable for equal scores', () => {
    const rows = [row(1, 50), row(2, 50), row(3, 50)]
    const sorted = [...rows].sort(byScoreDesc(r => r.score))
    expect(sorted.map(r => r.id)).toEqual([1, 2, 3])
  })
})

describe('rankByScore', () => {
  it('splits at the default limit with the top rows best-first', () => {
    const rows = Array.from({ length: 8 }, (_, i) => row(i, i * 10))
    const { top, rest } = rankByScore(rows, r => r.score)
    expect(top).toHaveLength(TABLE_TOP_LIMIT)
    expect(top[0].score).toBe(70)
    expect(rest).toHaveLength(8 - TABLE_TOP_LIMIT)
    expect(rest[rest.length - 1].score).toBe(0)
  })

  it('returns everything in top when under the limit', () => {
    const { top, rest } = rankByScore([row(1, 1), row(2, 2)], r => r.score)
    expect(top.map(r => r.id)).toEqual([2, 1])
    expect(rest).toHaveLength(0)
  })

  it('respects a custom limit', () => {
    const rows = [row(1, 3), row(2, 2), row(3, 1)]
    const { top, rest } = rankByScore(rows, r => r.score, 1)
    expect(top.map(r => r.id)).toEqual([1])
    expect(rest.map(r => r.id)).toEqual([2, 3])
  })

  it('does not mutate the input array', () => {
    const rows = [row(1, 1), row(2, 2)]
    rankByScore(rows, r => r.score)
    expect(rows.map(r => r.id)).toEqual([1, 2])
  })
})

describe('pairBySide', () => {
  it('pairs rows index-by-index and pads the shorter side with null', () => {
    const pairs = pairBySide([row(1, 9), row(2, 5)], [row(3, 7)])
    expect(pairs).toHaveLength(2)
    expect(pairs[0]).toEqual([row(1, 9), row(3, 7)])
    expect(pairs[1]).toEqual([row(2, 5), null])
  })

  it('returns empty for two empty sides', () => {
    expect(pairBySide([], [])).toHaveLength(0)
  })
})
