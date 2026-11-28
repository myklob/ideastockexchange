import { describe, it, expect } from 'vitest'
import { organizeOutline, type OutlineArgument } from '@/lib/conversations/outline'

const arg = (id: number, side: string, label: string, score: number | null): OutlineArgument => ({
  id,
  side,
  label,
  slug: `belief-${id}`,
  score,
})

describe('organizeOutline (combine, organize, extend)', () => {
  const args = [
    arg(1, 'agree', 'Lowest deaths per terawatt hour', 80),
    arg(2, 'agree', 'Deaths per terawatt hour are lowest', null),
    arg(3, 'agree', 'Reactors emit no carbon', 60),
    arg(4, 'disagree', 'Waste storage is unsolved', 70),
  ]

  it('combines equivalence-paired same-side arguments into one cluster', () => {
    const { pro } = organizeOutline(args, [{ a: 2, b: 1 }])
    const clusters = [...pro.top, ...pro.rest]
    expect(clusters).toHaveLength(2)
    const merged = clusters.find(c => c.lead.id === 1)
    expect(merged?.members.map(m => m.id)).toEqual([2])
  })

  it('organizes clusters score-descending with null-scored leads last', () => {
    const { pro } = organizeOutline(args, [])
    expect(pro.top.map(c => c.lead.id)).toEqual([1, 3, 2])
  })

  it('never combines across sides, even when a pair claims it', () => {
    const { pro, con } = organizeOutline(args, [{ a: 1, b: 4 }])
    expect([...pro.top, ...pro.rest].every(c => c.lead.side === 'agree')).toBe(true)
    expect([...con.top, ...con.rest]).toHaveLength(1)
  })

  it('extends: an unanswered lead surfaces as a gap for the other side', () => {
    const { gaps } = organizeOutline(args, [{ a: 2, b: 1 }])
    const conGaps = gaps.filter(g => g.side === 'con')
    expect(conGaps.map(g => g.answering)).toContain('Reactors emit no carbon')
    expect(gaps.some(g => g.side === 'pro' && g.answering === 'Waste storage is unsolved')).toBe(true)
  })

  it('a counter that engages the lead closes the gap', () => {
    const engaged = [
      ...args,
      arg(5, 'disagree', 'Deaths per terawatt hour undercount evacuations', null),
    ]
    const { gaps } = organizeOutline(engaged, [{ a: 2, b: 1 }])
    expect(gaps.some(g => g.side === 'con' && g.answering === 'Lowest deaths per terawatt hour')).toBe(false)
    expect(gaps.some(g => g.side === 'con' && g.answering === 'Reactors emit no carbon')).toBe(true)
  })

  it('splits top from rest at the table limit (Rule 8 shape)', () => {
    const many = Array.from({ length: 8 }, (_, i) => arg(i + 1, 'agree', `Distinct pro argument number ${i + 1}`, 90 - i))
    const { pro } = organizeOutline(many, [], 5)
    expect(pro.top).toHaveLength(5)
    expect(pro.rest).toHaveLength(3)
    expect(pro.top[0].lead.score).toBe(90)
  })
})
