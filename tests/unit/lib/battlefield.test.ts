/**
 * Unit tests for the Battlefield-of-Ideas stat derivation library.
 *
 * The library is pure: tests pass plain inputs and check the resulting
 * stat block. No DB.
 */

import { describe, it, expect } from 'vitest'
import {
  computeBeliefUnitStats,
  computePlayerStats,
  type BeliefUnitInput,
  type PlayerCharacterInput,
} from '../../../src/lib/battlefield'

const baseUnit = (): BeliefUnitInput => ({
  positivity: 0,
  stabilityScore: 0.5,
  claimStrength: 0.5,
  argumentCount: 0,
  agreeArgumentCount: 0,
  disagreeArgumentCount: 0,
  evidenceCount: 0,
  supportingLawsCount: 0,
  downstreamCount: 0,
  upstreamSupportCount: 0,
  mediaCount: 0,
  criteriaCount: 0,
})

const basePlayer = (): PlayerCharacterInput => ({
  linkageVoteCount: 0,
  avgLinkageScore: 0,
  distinctArgumentsVoted: 0,
  agreeVotes: 0,
  disagreeVotes: 0,
  changedVoteCount: 0,
  tradeCount: 0,
  realizedPnl: 0,
  roi: 0,
})

describe('computeBeliefUnitStats', () => {
  it('produces a valid stat block for a brand-new belief', () => {
    const stats = computeBeliefUnitStats(baseUnit())
    expect(stats.hp).toBe(50)
    expect(stats.attack).toBeGreaterThan(0)
    expect(stats.defense).toBeGreaterThan(0)
    expect(stats.level).toBe(1)
    expect(stats.unitClass).toBe('Recruit')
  })

  it('clamps every stat to the 0-100 range', () => {
    const huge: BeliefUnitInput = {
      ...baseUnit(),
      stabilityScore: 1,
      claimStrength: 1,
      argumentCount: 500,
      agreeArgumentCount: 400,
      disagreeArgumentCount: 100,
      evidenceCount: 1000,
      supportingLawsCount: 50,
      downstreamCount: 100,
      upstreamSupportCount: 50,
      mediaCount: 100,
      criteriaCount: 100,
      positivity: 100,
    }
    const stats = computeBeliefUnitStats(huge)
    for (const key of ['hp', 'attack', 'defense', 'speed', 'aoe', 'overall'] as const) {
      expect(stats[key]).toBeGreaterThanOrEqual(0)
      expect(stats[key]).toBeLessThanOrEqual(100)
    }
  })

  it('HP tracks stabilityScore directly', () => {
    expect(computeBeliefUnitStats({ ...baseUnit(), stabilityScore: 0.0 }).hp).toBe(0)
    expect(computeBeliefUnitStats({ ...baseUnit(), stabilityScore: 0.25 }).hp).toBe(25)
    expect(computeBeliefUnitStats({ ...baseUnit(), stabilityScore: 1.0 }).hp).toBe(100)
  })

  it('AoE scales with downstream dependency count', () => {
    const a = computeBeliefUnitStats({ ...baseUnit(), downstreamCount: 0 })
    const b = computeBeliefUnitStats({ ...baseUnit(), downstreamCount: 5 })
    const c = computeBeliefUnitStats({ ...baseUnit(), downstreamCount: 20 })
    expect(a.aoe).toBe(0)
    expect(b.aoe).toBeGreaterThan(a.aoe)
    expect(c.aoe).toBeGreaterThan(b.aoe)
  })

  it('a belief that survived many opposing arguments gets a defense multiplier', () => {
    const without = computeBeliefUnitStats({
      ...baseUnit(),
      agreeArgumentCount: 5,
      disagreeArgumentCount: 0,
      positivity: 50,
    })
    const survived = computeBeliefUnitStats({
      ...baseUnit(),
      agreeArgumentCount: 5,
      disagreeArgumentCount: 8,
      positivity: 50,
    })
    expect(survived.breakdown.withstoodAttacks).toBe(true)
    expect(without.breakdown.withstoodAttacks).toBe(false)
    expect(survived.breakdown.defenseMultiplier).toBeGreaterThan(without.breakdown.defenseMultiplier)
  })

  it('a heavily fortified belief is classified Fortress', () => {
    const stats = computeBeliefUnitStats({
      ...baseUnit(),
      supportingLawsCount: 10,
      agreeArgumentCount: 20,
      upstreamSupportCount: 10,
    })
    expect(stats.unitClass).toBe('Fortress')
  })

  it('a belief with many downstream dependencies is classified Beacon', () => {
    const stats = computeBeliefUnitStats({ ...baseUnit(), downstreamCount: 9 })
    expect(stats.unitClass).toBe('Beacon')
  })
})

describe('computePlayerStats', () => {
  it('produces a baseline stat block for a brand-new player', () => {
    const stats = computePlayerStats(basePlayer())
    expect(stats.prowess).toBe(10)
    expect(stats.research).toBe(10)
    expect(stats.persuasion).toBe(10)
    expect(stats.wisdom).toBe(10)
    expect(stats.experience).toBe(0)
    expect(stats.level).toBe(1)
    expect(stats.characterClass).toBe('Initiate')
  })

  it('clamps every stat to the 0-100 range', () => {
    const huge: PlayerCharacterInput = {
      linkageVoteCount: 1000,
      avgLinkageScore: 1,
      distinctArgumentsVoted: 1000,
      agreeVotes: 500,
      disagreeVotes: 500,
      changedVoteCount: 500,
      tradeCount: 1000,
      realizedPnl: 1_000_000,
      roi: 10,
    }
    const stats = computePlayerStats(huge)
    for (const key of ['prowess', 'research', 'persuasion', 'wisdom', 'overall'] as const) {
      expect(stats[key]).toBeGreaterThanOrEqual(0)
      expect(stats[key]).toBeLessThanOrEqual(100)
    }
  })

  it('XP is a weighted sum and level is logarithmic', () => {
    const a = computePlayerStats({ ...basePlayer(), linkageVoteCount: 20, tradeCount: 4 })
    expect(a.experience).toBe(20 * 50 + 4 * 25)
    expect(a.level).toBeGreaterThanOrEqual(1)

    const b = computePlayerStats({ ...basePlayer(), linkageVoteCount: 200, tradeCount: 40 })
    expect(b.level).toBeGreaterThan(a.level)
  })

  it('balanced agree/disagree voting raises wisdom; one-sided voting depresses it', () => {
    const balanced = computePlayerStats({
      ...basePlayer(),
      linkageVoteCount: 20,
      agreeVotes: 10,
      disagreeVotes: 10,
    })
    const oneSided = computePlayerStats({
      ...basePlayer(),
      linkageVoteCount: 20,
      agreeVotes: 20,
      disagreeVotes: 0,
    })
    expect(balanced.wisdom).toBeGreaterThan(oneSided.wisdom)
  })

  it('changing one\'s mind on votes contributes to wisdom and XP', () => {
    const stuck = computePlayerStats({ ...basePlayer(), linkageVoteCount: 10 })
    const flexible = computePlayerStats({
      ...basePlayer(),
      linkageVoteCount: 10,
      changedVoteCount: 5,
    })
    expect(flexible.wisdom).toBeGreaterThan(stuck.wisdom)
    expect(flexible.experience).toBeGreaterThan(stuck.experience)
  })

  it('a player whose dominant stat is research is classified Scholar', () => {
    const stats = computePlayerStats({
      ...basePlayer(),
      linkageVoteCount: 10,
      distinctArgumentsVoted: 30,
    })
    expect(stats.characterClass).toBe('Scholar')
  })

  it('positive realized PnL drives persuasion', () => {
    const losing = computePlayerStats({ ...basePlayer(), realizedPnl: -500 })
    const winning = computePlayerStats({ ...basePlayer(), realizedPnl: 5000, roi: 0.5 })
    expect(winning.persuasion).toBeGreaterThan(losing.persuasion)
  })
})
