import { describe, it, expect } from 'vitest'
import { resolveConsensus, CONSENSUS_THRESHOLD, CONSENSUS_QUORUM } from '@/lib/consensus'

const vote = (agree: boolean, weight = 1) => ({ agree, weight })

describe('resolveConsensus (60% weighted, quorum-gated)', () => {
  it('stays open with no votes', () => {
    const r = resolveConsensus([])
    expect(r.outcome).toBe('open')
    expect(r.agreeShare).toBeNull()
  })

  it('stays open below quorum even at 100% agreement', () => {
    const r = resolveConsensus([vote(true), vote(true)])
    expect(r.voteCount).toBeLessThan(CONSENSUS_QUORUM)
    expect(r.outcome).toBe('open')
  })

  it('upholds at the threshold with quorum met', () => {
    // 3 agree, 2 disagree = 60% exactly
    const r = resolveConsensus([vote(true), vote(true), vote(true), vote(false), vote(false)])
    expect(r.agreeShare).toBeCloseTo(CONSENSUS_THRESHOLD)
    expect(r.outcome).toBe('upheld')
  })

  it('rejects when disagreement reaches the threshold', () => {
    const r = resolveConsensus([vote(false), vote(false), vote(false), vote(true), vote(true)])
    expect(r.outcome).toBe('rejected')
  })

  it('stays open in the contested middle band', () => {
    // 5 agree, 4 disagree = 55.6%: neither side reaches 60%
    const votes = [...Array(5).fill(vote(true)), ...Array(4).fill(vote(false))]
    const r = resolveConsensus(votes)
    expect(r.outcome).toBe('open')
  })

  it('weights votes: calibrated voters can outweigh a larger tribal bloc', () => {
    // Three coordinated accusers at reduced weight vs two calibrated voters.
    const votes = [
      vote(true, 0.3),
      vote(true, 0.3),
      vote(true, 0.3),
      vote(false, 1.4),
      vote(false, 1.4),
    ]
    const r = resolveConsensus(votes)
    expect(r.outcome).toBe('rejected')
  })

  it('ignores non-positive and non-finite weights', () => {
    const votes = [vote(true, -5), vote(true, NaN), vote(false, 1), vote(false, 1), vote(false, 1)]
    const r = resolveConsensus(votes)
    expect(r.agreeShare).toBe(0)
    expect(r.outcome).toBe('rejected')
  })
})
