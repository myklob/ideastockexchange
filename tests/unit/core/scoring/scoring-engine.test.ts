/**
 * Unit tests for the ReasonRank Scoring Engine
 *
 * Tests verify the PageRank-inspired scoring logic:
 * - Bottom-up recursive propagation (no depth penalty)
 * - Damping factor blends base truth with sub-argument evidence
 * - Pro sub-arguments increase score, con sub-arguments decrease it
 * - Linkage, importance, and uniqueness weight each contribution
 * - Belief-level scoring uses ProRank / (ProRank + ConRank)
 */

import { describe, it, expect } from 'vitest'
import {
  scoreArgument,
  scoreProtocolBelief,
  calculateReasonRankScore,
  calculateEVS,
  calculateLinkageFromArguments,
  calculateArgumentImpact,
  getEvidenceTypeWeight,
  determineActiveLikelihood,
  calculateLikelihoodCI,
  recalculateProtocolBelief,
} from '../../../../src/core/scoring/scoring-engine'
import { SchilchtArgument, SchilchtBelief } from '../../../../src/core/types/schlicht'
import { LikelihoodEstimate, LikelihoodBelief } from '../../../../src/core/types/cba'

// ─── Test Helpers ─────────────────────────────────────────────────

function makeArg(overrides: Partial<SchilchtArgument> = {}): SchilchtArgument {
  return {
    id: 'arg-1',
    claim: 'Test argument',
    description: 'Test description',
    side: 'pro',
    truthScore: 0.8,
    linkageScore: 0.7,
    importanceScore: 1.0,
    impactScore: 0,
    certifiedBy: ['test-agent'],
    fallaciesDetected: [],
    ...overrides,
  }
}

function makeBelief(overrides: Partial<SchilchtBelief> = {}): SchilchtBelief {
  return {
    beliefId: 'belief-1',
    statement: 'Test belief',
    status: 'emerging',
    metrics: {
      truthScore: 0.5,
      confidenceInterval: 0.15,
      volatility: 'low',
      adversarialCycles: 0,
      lastUpdated: new Date().toISOString(),
    },
    agents: {},
    proTree: [],
    conTree: [],
    evidence: [],
    protocolLog: [],
    protocolStatus: { claimsPendingLogicCheck: 0, activeRedTeams: 0 },
    ...overrides,
  }
}

// ─── scoreArgument Tests ──────────────────────────────────────────

describe('scoreArgument', () => {
  describe('leaf arguments (no sub-arguments)', () => {
    it('should return truthScore as reasonRank for leaf arguments', () => {
      const arg = makeArg({ truthScore: 0.8 })
      const result = scoreArgument(arg)

      // Leaf: ReasonRank = baseTruth
      expect(result.reasonRank).toBe(0.8)
      expect(result.truthScore).toBe(0.8)
    })

    it('should compute rawImpact as reasonRank × linkage × importance × uniqueness', () => {
      const arg = makeArg({
        truthScore: 0.8,
        linkageScore: 0.7,
        importanceScore: 0.9,
        uniquenessScore: 0.5,
      })
      const result = scoreArgument(arg)

      expect(result.reasonRank).toBe(0.8)
      expect(result.rawImpact).toBeCloseTo(0.8 * 0.7 * 0.9 * 0.5)
    })

    it('should default uniquenessScore to 1.0 when not specified', () => {
      const arg = makeArg({ truthScore: 0.6, linkageScore: 0.5, importanceScore: 1.0 })
      const result = scoreArgument(arg)

      expect(result.uniquenessScore).toBe(1.0)
      expect(result.rawImpact).toBeCloseTo(0.6 * 0.5 * 1.0 * 1.0)
    })

    it('should apply fallacy penalties to baseTruth', () => {
      const arg = makeArg({
        truthScore: 0.8,
        fallaciesDetected: [
          { type: 'straw-man', description: 'Misrepresents opponent', impact: -20 },
        ],
      })
      const result = scoreArgument(arg)

      // baseTruth = 0.8 * (1 - 0.2) = 0.64
      expect(result.truthScore).toBeCloseTo(0.64)
      expect(result.reasonRank).toBeCloseTo(0.64)
      expect(result.fallacyPenalty).toBeCloseTo(0.2)
    })

    it('should sign impact negatively for con arguments', () => {
      const arg = makeArg({ side: 'con', truthScore: 0.7, linkageScore: 1.0 })
      const result = scoreArgument(arg)

      expect(result.rawImpact).toBeCloseTo(0.7)
      expect(result.signedImpact).toBeCloseTo(-0.7)
    })
  })

  describe('arguments with sub-arguments (PageRank propagation)', () => {
    it('should use damping factor to blend baseTruth and sub-argument evidence', () => {
      const arg = makeArg({
        truthScore: 0.6,
        linkageScore: 1.0,
        importanceScore: 1.0,
        subArguments: [
          makeArg({ id: 'sub-1', side: 'pro', truthScore: 1.0, linkageScore: 1.0 }),
        ],
      })
      const result = scoreArgument(arg)

      // Single pro sub with RR=1.0, rawImpact=1.0
      // normalizedNet = 1.0 / 1 = 1.0
      // subArgScore = 0.5 + 1.0 * 0.5 = 1.0
      // RR = 0.15 * 0.6 + 0.85 * 1.0 = 0.09 + 0.85 = 0.94
      expect(result.reasonRank).toBeCloseTo(0.94)
    })

    it('should reduce score when con sub-arguments dominate', () => {
      const arg = makeArg({
        truthScore: 0.8,
        linkageScore: 1.0,
        importanceScore: 1.0,
        subArguments: [
          makeArg({ id: 'sub-1', side: 'con', truthScore: 0.9, linkageScore: 1.0 }),
        ],
      })
      const result = scoreArgument(arg)

      // Single con sub with RR=0.9, rawImpact=0.9
      // normalizedNet = (0 - 0.9) / 1 = -0.9
      // subArgScore = 0.5 + (-0.9) * 0.5 = 0.05
      // RR = 0.15 * 0.8 + 0.85 * 0.05 = 0.12 + 0.0425 = 0.1625
      expect(result.reasonRank).toBeCloseTo(0.1625)
    })

    it('should balance when pro and con sub-arguments are equal', () => {
      const arg = makeArg({
        truthScore: 0.7,
        linkageScore: 1.0,
        importanceScore: 1.0,
        subArguments: [
          makeArg({ id: 'sub-1', side: 'pro', truthScore: 0.8, linkageScore: 1.0 }),
          makeArg({ id: 'sub-2', side: 'con', truthScore: 0.8, linkageScore: 1.0 }),
        ],
      })
      const result = scoreArgument(arg)

      // Pro rawImpact = 0.8, Con rawImpact = 0.8
      // normalizedNet = (0.8 - 0.8) / 2 = 0
      // subArgScore = 0.5 + 0 = 0.5
      // RR = 0.15 * 0.7 + 0.85 * 0.5 = 0.105 + 0.425 = 0.53
      expect(result.reasonRank).toBeCloseTo(0.53)
    })

    it('should propagate through multiple levels of nesting', () => {
      // Deep argument: arg -> sub -> sub-sub
      const deepArg = makeArg({
        id: 'top',
        truthScore: 0.5,
        linkageScore: 1.0,
        importanceScore: 1.0,
        subArguments: [
          makeArg({
            id: 'mid',
            side: 'pro',
            truthScore: 0.5,
            linkageScore: 1.0,
            importanceScore: 1.0,
            subArguments: [
              makeArg({
                id: 'leaf',
                side: 'pro',
                truthScore: 0.9,
                linkageScore: 1.0,
                importanceScore: 1.0,
              }),
            ],
          }),
        ],
      })
      const result = scoreArgument(deepArg)

      // Leaf: RR = 0.9, rawImpact = 0.9
      // Mid:  normalizedNet = 0.9/1 = 0.9, subArgScore = 0.5 + 0.45 = 0.95
      //       RR = 0.15 * 0.5 + 0.85 * 0.95 = 0.075 + 0.8075 = 0.8825
      //       rawImpact = 0.8825
      // Top:  normalizedNet = 0.8825/1 = 0.8825, subArgScore = 0.5 + 0.44125 = 0.94125
      //       RR = 0.15 * 0.5 + 0.85 * 0.94125 = 0.075 + 0.8000625 = 0.8750625
      expect(result.reasonRank).toBeCloseTo(0.875, 2)
    })

    it('should not penalize depth — deep strong evidence propagates', () => {
      // A strong leaf argument 3 levels deep should still have meaningful impact
      const deepArg = makeArg({
        id: 'top',
        truthScore: 0.5,
        linkageScore: 1.0,
        subArguments: [
          makeArg({
            id: 'L1',
            side: 'pro',
            truthScore: 0.5,
            linkageScore: 1.0,
            subArguments: [
              makeArg({
                id: 'L2',
                side: 'pro',
                truthScore: 0.5,
                linkageScore: 1.0,
                subArguments: [
                  makeArg({
                    id: 'L3',
                    side: 'pro',
                    truthScore: 0.95,
                    linkageScore: 1.0,
                  }),
                ],
              }),
            ],
          }),
        ],
      })

      const result = scoreArgument(deepArg)

      // The deep strong evidence (0.95) should propagate up and significantly
      // boost the top-level argument beyond its base truth of 0.5
      expect(result.reasonRank).toBeGreaterThan(0.7)
    })

    it('should weight sub-arguments by linkage, importance, and uniqueness', () => {
      const argWithWeights = makeArg({
        truthScore: 0.5,
        linkageScore: 1.0,
        subArguments: [
          makeArg({
            id: 'sub-strong',
            side: 'pro',
            truthScore: 0.9,
            linkageScore: 1.0,
            importanceScore: 1.0,
            uniquenessScore: 1.0,
          }),
          makeArg({
            id: 'sub-weak',
            side: 'pro',
            truthScore: 0.9,
            linkageScore: 0.2,  // low linkage
            importanceScore: 0.3,  // low importance
            uniquenessScore: 0.5,  // redundant
          }),
        ],
      })

      const argAllStrong = makeArg({
        truthScore: 0.5,
        linkageScore: 1.0,
        subArguments: [
          makeArg({
            id: 'sub-1',
            side: 'pro',
            truthScore: 0.9,
            linkageScore: 1.0,
            importanceScore: 1.0,
            uniquenessScore: 1.0,
          }),
          makeArg({
            id: 'sub-2',
            side: 'pro',
            truthScore: 0.9,
            linkageScore: 1.0,
            importanceScore: 1.0,
            uniquenessScore: 1.0,
          }),
        ],
      })

      const resultWeighted = scoreArgument(argWithWeights)
      const resultAllStrong = scoreArgument(argAllStrong)

      // The argument with one weakly-linked/unimportant/redundant sub-arg
      // should score lower than one with all strong sub-args
      expect(resultWeighted.reasonRank).toBeLessThan(resultAllStrong.reasonRank)
    })
  })
})

// ─── scoreProtocolBelief Tests ──────────────────────────────────

describe('scoreProtocolBelief', () => {
  it('should return 0.5 (maximum uncertainty) for belief with no arguments', () => {
    const belief = makeBelief()
    const result = scoreProtocolBelief(belief)

    expect(result.truthScore).toBeCloseTo(0.5)
    expect(result.proArgumentStrength).toBe(0)
    expect(result.conArgumentStrength).toBe(0)
  })

  it('should score > 0.5 when pro arguments dominate', () => {
    const belief = makeBelief({
      proTree: [
        makeArg({ id: 'pro-1', side: 'pro', truthScore: 0.9, linkageScore: 0.8 }),
        makeArg({ id: 'pro-2', side: 'pro', truthScore: 0.85, linkageScore: 0.7 }),
      ],
      conTree: [
        makeArg({ id: 'con-1', side: 'con', truthScore: 0.5, linkageScore: 0.4 }),
      ],
    })
    const result = scoreProtocolBelief(belief)

    expect(result.truthScore).toBeGreaterThan(0.5)
    expect(result.proArgumentStrength).toBeGreaterThan(result.conArgumentStrength)
  })

  it('should score < 0.5 when con arguments dominate', () => {
    const belief = makeBelief({
      proTree: [
        makeArg({ id: 'pro-1', side: 'pro', truthScore: 0.3, linkageScore: 0.3 }),
      ],
      conTree: [
        makeArg({ id: 'con-1', side: 'con', truthScore: 0.9, linkageScore: 0.9 }),
        makeArg({ id: 'con-2', side: 'con', truthScore: 0.85, linkageScore: 0.8 }),
      ],
    })
    const result = scoreProtocolBelief(belief)

    expect(result.truthScore).toBeLessThan(0.5)
    expect(result.conArgumentStrength).toBeGreaterThan(result.proArgumentStrength)
  })

  it('should use ProRank / (ProRank + ConRank) formula', () => {
    const belief = makeBelief({
      proTree: [
        makeArg({ id: 'pro-1', side: 'pro', truthScore: 0.8, linkageScore: 1.0, importanceScore: 1.0 }),
      ],
      conTree: [
        makeArg({ id: 'con-1', side: 'con', truthScore: 0.8, linkageScore: 1.0, importanceScore: 1.0 }),
      ],
    })
    const result = scoreProtocolBelief(belief)

    // Equal pro and con: ProRank / (ProRank + ConRank) = 0.5
    expect(result.truthScore).toBeCloseTo(0.5, 1)
  })

  it('should include evidence contribution', () => {
    const beliefWithEvidence = makeBelief({
      proTree: [
        makeArg({ id: 'pro-1', side: 'pro', truthScore: 0.7, linkageScore: 0.7 }),
      ],
      conTree: [
        makeArg({ id: 'con-1', side: 'con', truthScore: 0.7, linkageScore: 0.7 }),
      ],
      evidence: [
        { id: 'ev-1', tier: 'T1', tierLabel: 'Peer-reviewed', title: 'Study', linkageScore: 0.9 },
      ],
    })
    const result = scoreProtocolBelief(beliefWithEvidence)

    // Evidence should push the score slightly above 0.5
    expect(result.truthScore).toBeGreaterThan(0.5)
    expect(result.supportingEvidenceScore).toBeGreaterThan(0)
  })

  it('should clamp truth score between 0.01 and 0.99', () => {
    const extreme = makeBelief({
      proTree: Array.from({ length: 10 }, (_, i) =>
        makeArg({ id: `pro-${i}`, side: 'pro', truthScore: 1.0, linkageScore: 1.0 })
      ),
    })
    const result = scoreProtocolBelief(extreme)

    expect(result.truthScore).toBeLessThanOrEqual(0.99)
    expect(result.truthScore).toBeGreaterThanOrEqual(0.01)
  })
})

// ─── calculateReasonRankScore Tests ──────────────────────────────

describe('calculateReasonRankScore', () => {
  function makeEstimate(overrides: Partial<LikelihoodEstimate> = {}): LikelihoodEstimate {
    return {
      id: 'est-1',
      probability: 0.7,
      label: '70%',
      reasoning: 'Test reasoning',
      proArguments: [],
      conArguments: [],
      reasonRankScore: 0.5,
      isActive: false,
      contributor: { type: 'human', name: 'Test', submittedAt: new Date().toISOString() },
      ...overrides,
    }
  }

  it('should return 0.5 for estimate with no arguments', () => {
    const est = makeEstimate()
    expect(calculateReasonRankScore(est)).toBe(0.5)
  })

  it('should return > 0.5 when pro arguments dominate', () => {
    const est = makeEstimate({
      proArguments: [
        makeArg({ id: 'p1', side: 'pro', truthScore: 0.9, linkageScore: 0.8 }),
      ],
      conArguments: [
        makeArg({ id: 'c1', side: 'con', truthScore: 0.3, linkageScore: 0.4 }),
      ],
    })
    expect(calculateReasonRankScore(est)).toBeGreaterThan(0.5)
  })

  it('should return < 0.5 when con arguments dominate', () => {
    const est = makeEstimate({
      proArguments: [
        makeArg({ id: 'p1', side: 'pro', truthScore: 0.3, linkageScore: 0.3 }),
      ],
      conArguments: [
        makeArg({ id: 'c1', side: 'con', truthScore: 0.9, linkageScore: 0.9 }),
      ],
    })
    expect(calculateReasonRankScore(est)).toBeLessThan(0.5)
  })

  it('should use ProRank / (ProRank + ConRank) formula', () => {
    const est = makeEstimate({
      proArguments: [
        makeArg({ id: 'p1', side: 'pro', truthScore: 0.8, linkageScore: 1.0 }),
      ],
      conArguments: [
        makeArg({ id: 'c1', side: 'con', truthScore: 0.8, linkageScore: 1.0 }),
      ],
    })
    // Equal: should be ~0.5
    expect(calculateReasonRankScore(est)).toBeCloseTo(0.5, 1)
  })
})

// ─── Evidence and Linkage Tests ─────────────────────────────────

describe('calculateEVS', () => {
  it('should compute EVS = ESIW * log2(ERQ+1) * ECRS * ERP', () => {
    const result = calculateEVS({
      sourceIndependenceWeight: 1.0,
      replicationQuantity: 3,
      conclusionRelevance: 0.8,
      replicationPercentage: 0.9,
    })
    expect(result).toBeCloseTo(1.0 * Math.log2(4) * 0.8 * 0.9)
  })

  it('should return 0 when any factor is 0', () => {
    expect(calculateEVS({
      sourceIndependenceWeight: 0,
      replicationQuantity: 5,
      conclusionRelevance: 0.8,
      replicationPercentage: 0.9,
    })).toBe(0)
  })
})

describe('calculateLinkageFromArguments', () => {
  it('should return 0.5 for empty arguments', () => {
    expect(calculateLinkageFromArguments([])).toBe(0.5)
  })

  it('should return 1.0 when all arguments agree', () => {
    expect(calculateLinkageFromArguments([
      { side: 'agree', strength: 0.8 },
      { side: 'agree', strength: 0.6 },
    ])).toBeCloseTo(1.0)
  })

  it('should return 0 when no arguments agree', () => {
    expect(calculateLinkageFromArguments([
      { side: 'disagree', strength: 0.8 },
    ])).toBeCloseTo(0)
  })
})

describe('getEvidenceTypeWeight', () => {
  it('should return correct tier weights', () => {
    expect(getEvidenceTypeWeight('T1')).toBe(1.0)
    expect(getEvidenceTypeWeight('T2')).toBe(0.75)
    expect(getEvidenceTypeWeight('T3')).toBe(0.5)
    expect(getEvidenceTypeWeight('T4')).toBe(0.25)
  })

  it('should default to 0.5 for unknown tiers', () => {
    expect(getEvidenceTypeWeight('unknown')).toBe(0.5)
  })
})

// ─── calculateArgumentImpact Tests ──────────────────────────────

describe('calculateArgumentImpact', () => {
  it('should compute truth × linkage × importance × 100 for pro', () => {
    expect(calculateArgumentImpact(0.8, 0.7, 'pro', 0.9)).toBe(Math.round(0.8 * 0.7 * 0.9 * 100))
  })

  it('should negate for con arguments', () => {
    expect(calculateArgumentImpact(0.8, 0.7, 'con', 1.0)).toBe(-Math.round(0.8 * 0.7 * 1.0 * 100))
  })
})

// ─── determineActiveLikelihood Tests ────────────────────────────

describe('determineActiveLikelihood', () => {
  it('should return 0.5 and emerging for empty estimates', () => {
    const result = determineActiveLikelihood([])
    expect(result.activeProbability).toBe(0.5)
    expect(result.status).toBe('emerging')
  })

  it('should select the estimate with highest ReasonRank', () => {
    const estimates: LikelihoodEstimate[] = [
      {
        id: 'est-1',
        probability: 0.3,
        label: '30%',
        reasoning: 'Weak',
        proArguments: [makeArg({ id: 'p1', side: 'pro', truthScore: 0.4, linkageScore: 0.4 })],
        conArguments: [makeArg({ id: 'c1', side: 'con', truthScore: 0.8, linkageScore: 0.8 })],
        reasonRankScore: 0,
        isActive: false,
        contributor: { type: 'human', name: 'A', submittedAt: '' },
      },
      {
        id: 'est-2',
        probability: 0.7,
        label: '70%',
        reasoning: 'Strong',
        proArguments: [makeArg({ id: 'p2', side: 'pro', truthScore: 0.9, linkageScore: 0.9 })],
        conArguments: [],
        reasonRankScore: 0,
        isActive: false,
        contributor: { type: 'human', name: 'B', submittedAt: '' },
      },
    ]
    const result = determineActiveLikelihood(estimates)
    expect(result.activeEstimateId).toBe('est-2')
    expect(result.activeProbability).toBe(0.7)
  })
})

// ─── recalculateProtocolBelief Tests ────────────────────────────

describe('recalculateProtocolBelief', () => {
  it('should update metrics based on scoring', () => {
    const belief = makeBelief({
      proTree: [
        makeArg({ id: 'pro-1', side: 'pro', truthScore: 0.9, linkageScore: 0.8 }),
        makeArg({ id: 'pro-2', side: 'pro', truthScore: 0.85, linkageScore: 0.7 }),
      ],
      conTree: [
        makeArg({ id: 'con-1', side: 'con', truthScore: 0.5, linkageScore: 0.5 }),
      ],
    })
    const result = recalculateProtocolBelief(belief)

    expect(result.metrics.truthScore).toBeGreaterThan(0.5)
    expect(result.metrics.confidenceInterval).toBeGreaterThan(0)
  })

  it('should set status to contested when few args and wide CI', () => {
    const belief = makeBelief({
      proTree: [
        makeArg({ id: 'pro-1', side: 'pro', truthScore: 0.6, linkageScore: 0.5 }),
      ],
      conTree: [
        makeArg({ id: 'con-1', side: 'con', truthScore: 0.6, linkageScore: 0.5 }),
      ],
    })
    const result = recalculateProtocolBelief(belief)

    expect(result.status).toBe('contested')
  })
})

// ─── Uniqueness / Redundancy Tests ──────────────────────────────

describe('uniqueness score impact', () => {
  it('should reduce impact of redundant arguments via low uniqueness', () => {
    const unique = makeArg({
      id: 'unique',
      truthScore: 0.8,
      linkageScore: 0.8,
      uniquenessScore: 1.0,
    })
    const redundant = makeArg({
      id: 'redundant',
      truthScore: 0.8,
      linkageScore: 0.8,
      uniquenessScore: 0.3,
    })

    const uniqueResult = scoreArgument(unique)
    const redundantResult = scoreArgument(redundant)

    // Same truth, linkage, but lower uniqueness should mean lower impact
    expect(redundantResult.rawImpact).toBeLessThan(uniqueResult.rawImpact)
    expect(redundantResult.rawImpact).toBeCloseTo(uniqueResult.rawImpact * 0.3)
  })

  it('should allow redundant arguments to have less influence on parent', () => {
    const argWithUniqueChildren = makeArg({
      truthScore: 0.5,
      linkageScore: 1.0,
      subArguments: [
        makeArg({ id: 's1', side: 'pro', truthScore: 0.8, linkageScore: 1.0, uniquenessScore: 1.0 }),
        makeArg({ id: 's2', side: 'pro', truthScore: 0.8, linkageScore: 1.0, uniquenessScore: 1.0 }),
      ],
    })

    const argWithRedundantChildren = makeArg({
      truthScore: 0.5,
      linkageScore: 1.0,
      subArguments: [
        makeArg({ id: 's1', side: 'pro', truthScore: 0.8, linkageScore: 1.0, uniquenessScore: 1.0 }),
        makeArg({ id: 's2', side: 'pro', truthScore: 0.8, linkageScore: 1.0, uniquenessScore: 0.2 }),
      ],
    })

    const uniqueResult = scoreArgument(argWithUniqueChildren)
    const redundantResult = scoreArgument(argWithRedundantChildren)

    // Two unique sub-args should result in higher parent score
    // than one unique + one redundant
    expect(redundantResult.reasonRank).toBeLessThan(uniqueResult.reasonRank)
  })
})
