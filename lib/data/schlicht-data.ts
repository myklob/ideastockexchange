import { SchilchtBelief, SchilchtArgument, ProtocolLogEntry } from '@/lib/types/schlicht'
import { recalculateProtocolBelief, scoreProtocolBelief, ScoreBreakdown } from '@/lib/scoring-engine'

export const schlichtBeliefs: Record<string, SchilchtBelief> = {
  'b-0063-swarm-truth': {
    beliefId: 'b-0063-swarm-truth',
    statement:
      'We need specialized AI swarms to build a "Truth Machine" via adversarial protocol.',
    status: 'calibrated',
    metrics: {
      truthScore: 0.924,
      confidenceInterval: 0.031,
      volatility: 'low',
      adversarialCycles: 1402,
      lastUpdated: new Date().toISOString(),
    },
    agents: {
      logic_check: {
        id: 'agent-lc-v4',
        name: 'Logic-Core-v4',
        role: 'logic_check',
        version: '4.2.1',
      },
      evidence_curation: {
        id: 'agent-ss-v2',
        name: 'Scholar-Search-v2',
        role: 'evidence_curation',
        version: '2.8.0',
      },
      adversary: {
        id: 'agent-rt-beta',
        name: 'Red-Team-Beta',
        role: 'adversary',
        version: '3.1.0',
      },
      calibration: {
        id: 'agent-cal-1',
        name: 'Calibration-AI',
        role: 'calibration',
        version: '1.5.2',
      },
      compression: {
        id: 'agent-comp-1',
        name: 'Compress-Bot',
        role: 'compression',
        version: '2.0.0',
      },
    },
    proTree: [
      {
        id: 'arg-a892',
        claim: 'Adversarial Error Correction (Digital Jury)',
        description:
          'One AI hallucinates; a swarm fact-checks in real-time. Ensemble methods reduce error rates by 40% compared to single-shot GPT-4 inference.',
        side: 'pro',
        truthScore: 0.95,
        linkageScore: 0.98,
        impactScore: 93,
        certifiedBy: ['Evidence-Bot-9', 'Logic-Core-Alpha'],
        fallaciesDetected: [],
      },
      {
        id: 'arg-a441',
        claim: 'Recursive Scoring > Linear Editing',
        description:
          'Wikipedia relies on social consensus (edit wars). A recursive score tree creates measurable confidence intervals, allowing users to inspect the "shakiness" of a claim.',
        side: 'pro',
        truthScore: 0.88,
        linkageScore: 0.9,
        impactScore: 79,
        certifiedBy: ['Logic-Core-Beta', 'Compress-Bot'],
        fallaciesDetected: [],
      },
      {
        id: 'arg-a217',
        claim: 'Specialization Enables Depth',
        description:
          'A single general-purpose LLM cannot simultaneously optimize for logical rigor, evidence quality, and adversarial robustness. Specialized agents outperform generalists on domain-specific benchmarks by 25-60%.',
        side: 'pro',
        truthScore: 0.82,
        linkageScore: 0.85,
        impactScore: 65,
        certifiedBy: ['Evidence-Bot-9'],
        fallaciesDetected: [],
      },
    ],
    conTree: [
      {
        id: 'arg-c102',
        claim: 'Algorithmic Bias Amplification',
        description:
          'If the swarm\'s underlying training data shares the same blind spots, they will reach a "false consensus" with high confidence (Garbage In, Calibrated Garbage Out).',
        side: 'con',
        truthScore: 0.85,
        linkageScore: 0.7,
        impactScore: -59,
        certifiedBy: ['Red-Team-6'],
        fallaciesDetected: [],
        rebuttal: {
          id: 'r-55',
          statement:
            'Diversity of architecture (LLM vs Symbolic vs Bayesian) mitigates this significantly compared to homogeneous swarms.',
          confidence: 0.65,
        },
      },
      {
        id: 'arg-c203',
        claim: 'Coordination Overhead',
        description:
          'Multi-agent systems introduce latency, communication failures, and emergent behaviors that can degrade rather than improve output quality at scale.',
        side: 'con',
        truthScore: 0.72,
        linkageScore: 0.65,
        impactScore: -42,
        certifiedBy: ['Red-Team-Beta'],
        fallaciesDetected: [],
      },
      {
        id: 'arg-c089',
        claim: 'Compute Cost Prohibitive',
        description:
          'Running 14+ specialized agents per belief evaluation is orders of magnitude more expensive than single-model inference, limiting scalability to well-funded organizations.',
        side: 'con',
        truthScore: 0.78,
        linkageScore: 0.55,
        impactScore: -35,
        certifiedBy: ['Red-Team-Beta'],
        fallaciesDetected: [],
        rebuttal: {
          id: 'r-71',
          statement:
            'Inference costs are dropping 10x per year. What costs $100 today will cost $1 within 24 months.',
          confidence: 0.7,
        },
      },
    ],
    evidence: [
      {
        id: 'ev-001',
        tier: 'T1',
        tierLabel: 'Peer-Reviewed',
        title: '"Ensemble Models in Fact Verification" (MIT, 2024)',
        linkageScore: 0.95,
      },
      {
        id: 'ev-002',
        tier: 'T1',
        tierLabel: 'Data Analysis',
        title: 'Wikipedia Edit War Analysis (Dataset: 4M Edits)',
        linkageScore: 0.8,
      },
      {
        id: 'ev-003',
        tier: 'T2',
        tierLabel: 'Expert Analysis',
        title: '"Multi-Agent Debate Improves LLM Factuality" (Google DeepMind, 2024)',
        linkageScore: 0.88,
      },
    ],
    protocolLog: [
      {
        id: 'log-1',
        timestamp: 'Now',
        agentName: 'Red-Team-Beta',
        content: 'Attacking claim #A892 on basis of "Compute Cost".',
      },
      {
        id: 'log-2',
        timestamp: '2s',
        agentName: 'Logic-Core',
        content:
          'Flagged Fallacy: Ad Hominem in submission #X99. Linkage penalized to 0%.',
      },
      {
        id: 'log-3',
        timestamp: '5s',
        agentName: 'Compress-Bot',
        content: 'Merged "AIs are smarter together" into "Ensemble Intelligence".',
      },
      {
        id: 'log-4',
        timestamp: '12s',
        agentName: 'Calibration-AI',
        content:
          'Adjusted Confidence Interval from \u00B12.8% to \u00B13.1% based on new Con-Reason #C102.',
      },
      {
        id: 'log-5',
        timestamp: '45s',
        agentName: 'Evidence-Bot',
        content:
          'Rejected source "Blogspot" for Claim #A441 (Quality threshold not met).',
      },
      {
        id: 'log-6',
        timestamp: '1m',
        agentName: 'System',
        content:
          'Recalculated Global Truth Score: Belief #006.3 propagated +0.02 to Parent Belief #000 (Computer Science).',
      },
      {
        id: 'log-7',
        timestamp: '2m',
        agentName: 'Base-Rate-Core',
        content:
          'Applied prior: AI collaboration claims historically overshoot by 15%. Adjusting expectations.',
      },
      {
        id: 'log-8',
        timestamp: '3m',
        agentName: 'Evidence-Bot-9',
        content:
          'New source verified: DeepMind multi-agent debate paper. Quality: T1. Linkage: 88%.',
      },
    ],
    protocolStatus: {
      claimsPendingLogicCheck: 2,
      activeRedTeams: 4,
    },
  },

  'bridge-cost-b2024': {
    beliefId: 'bridge-cost-b2024',
    statement: 'The proposed bridge construction will cost $18.7M.',
    status: 'contested',
    metrics: {
      truthScore: 0.68,
      confidenceInterval: 0.12,
      volatility: 'medium',
      adversarialCycles: 847,
      lastUpdated: new Date().toISOString(),
    },
    agents: {
      logic_check: {
        id: 'agent-lc-v4',
        name: 'Logic-Core-v4',
        role: 'logic_check',
        version: '4.2.1',
      },
      evidence_curation: {
        id: 'agent-eb-9',
        name: 'Evidence-Bot-9',
        role: 'evidence_curation',
        version: '9.0.3',
      },
      adversary: {
        id: 'agent-rt-6',
        name: 'Red-Team-6',
        role: 'adversary',
        version: '6.1.0',
      },
      base_rate: {
        id: 'agent-br-1',
        name: 'Base-Rate-Core',
        role: 'base_rate',
        version: '1.2.0',
      },
    },
    proTree: [
      {
        id: 'arg-a441',
        claim: 'Base rate: similar bridges averaged $23M',
        description:
          'Analysis of the last 10 bridges of similar scope and length in comparable regions shows an average cost of $23M, suggesting $18.7M may actually be an underestimate.',
        side: 'pro',
        truthScore: 0.85,
        linkageScore: 0.88,
        impactScore: 72,
        certifiedBy: ['Evidence-Bot-9', 'Base-Rate-Core'],
        fallaciesDetected: [],
      },
      {
        id: 'arg-a330',
        claim: 'Engineering estimates from three independent firms converge',
        description:
          'Three independent engineering assessments produced estimates within 8% of each other ($17.2M, $18.7M, $19.1M), suggesting the estimate is methodologically sound.',
        side: 'pro',
        truthScore: 0.9,
        linkageScore: 0.82,
        impactScore: 68,
        certifiedBy: ['Evidence-Bot-9'],
        fallaciesDetected: [],
      },
    ],
    conTree: [
      {
        id: 'arg-c102',
        claim: 'Sample size insufficient (n=10)',
        description:
          'The base rate comparison relies on only 10 similar bridges. Regional variation, material cost fluctuations, and regulatory differences make this sample unreliable for prediction.',
        side: 'con',
        truthScore: 0.75,
        linkageScore: 0.7,
        impactScore: -48,
        certifiedBy: ['Red-Team-6'],
        fallaciesDetected: [],
      },
      {
        id: 'arg-c155',
        claim: 'Historical cost overruns in this region average 23%',
        description:
          'Projects in this specific region have historically overshot initial estimates by an average of 23%, primarily due to regulatory delays and soil condition surprises.',
        side: 'con',
        truthScore: 0.82,
        linkageScore: 0.78,
        impactScore: -55,
        certifiedBy: ['Base-Rate-Core', 'Red-Team-6'],
        fallaciesDetected: [],
      },
      {
        id: 'arg-c201',
        claim: 'Linear scaling assumption is flawed',
        description:
          'The original estimate assumed "twice the length = twice the cost." Construction economics literature shows cost scales at length^1.4, not linearly.',
        side: 'con',
        truthScore: 0.88,
        linkageScore: 0.85,
        impactScore: -62,
        certifiedBy: ['Logic-Core-v4', 'Evidence-Bot-9'],
        fallaciesDetected: [
          {
            type: 'False Proportionality',
            description:
              'Assumes linear scaling where nonlinear relationship is established',
            impact: -15,
          },
        ],
      },
    ],
    evidence: [
      {
        id: 'ev-b001',
        tier: 'T1',
        tierLabel: 'Peer-Reviewed',
        title:
          '"Cost Scaling in Bridge Construction" (Journal of Infrastructure, 2023)',
        linkageScore: 0.92,
      },
      {
        id: 'ev-b002',
        tier: 'T1',
        tierLabel: 'Data Analysis',
        title: 'Regional Infrastructure Cost Overrun Database (n=847 projects)',
        linkageScore: 0.85,
      },
      {
        id: 'ev-b003',
        tier: 'T2',
        tierLabel: 'Expert Estimate',
        title: 'Independent Engineering Assessment (Firms: Arup, AECOM, WSP)',
        linkageScore: 0.82,
      },
    ],
    protocolLog: [
      {
        id: 'log-b1',
        timestamp: 'Now',
        agentName: 'Logic-Core-v4',
        content:
          'Flagged linear scaling assumption in original estimate. Fallacy: False Proportionality.',
      },
      {
        id: 'log-b2',
        timestamp: '8s',
        agentName: 'Base-Rate-Core',
        content:
          'Applied regional overrun prior: +23% adjustment. New estimate range: $21-26M.',
      },
      {
        id: 'log-b3',
        timestamp: '15s',
        agentName: 'Red-Team-6',
        content:
          'Attacking base-rate: sample size n=10 may not capture rare cost events.',
      },
      {
        id: 'log-b4',
        timestamp: '30s',
        agentName: 'Calibration-AI',
        content:
          'Widened CI from \u00B18% to \u00B112% based on conflicting engineering estimates.',
      },
      {
        id: 'log-b5',
        timestamp: '1m',
        agentName: 'Evidence-Bot-9',
        content:
          'Verified: Journal of Infrastructure paper (2023). Quality: T1. Directly supports nonlinear scaling.',
      },
      {
        id: 'log-b6',
        timestamp: '2m',
        agentName: 'Compress-Bot',
        content:
          'Merged 3 "materials cost" arguments into single "supply chain volatility" argument.',
      },
    ],
    protocolStatus: {
      claimsPendingLogicCheck: 5,
      activeRedTeams: 3,
    },
  },
}

export function getSchilchtBelief(id: string): SchilchtBelief | undefined {
  return schlichtBeliefs[id]
}

export function getAllSchilchtBeliefs(): SchilchtBelief[] {
  return Object.values(schlichtBeliefs)
}

export function addArgumentToBelief(
  beliefId: string,
  argument: SchilchtArgument
): { success: boolean; belief?: SchilchtBelief; logEntry?: ProtocolLogEntry; breakdown?: ScoreBreakdown } {
  const belief = schlichtBeliefs[beliefId]
  if (!belief) return { success: false }

  if (argument.side === 'pro') {
    belief.proTree.push(argument)
  } else {
    belief.conTree.push(argument)
  }

  // Recalculate all metrics using the unified scoring engine
  const recalculated = recalculateProtocolBelief(belief)
  recalculated.metrics.adversarialCycles = belief.metrics.adversarialCycles + 1

  // Get the full score breakdown for the response
  const breakdown = scoreProtocolBelief(recalculated)

  const logEntry: ProtocolLogEntry = {
    id: `log-${Date.now()}`,
    timestamp: 'Now',
    agentName: argument.contributor?.name ?? 'Unknown',
    content: `Submitted new ${argument.side} argument: "${argument.claim}". Truth Score updated to ${(recalculated.metrics.truthScore * 100).toFixed(1)}%.`,
  }
  recalculated.protocolLog = [logEntry, ...belief.protocolLog].slice(0, 20)

  // Update the store
  schlichtBeliefs[beliefId] = recalculated

  return { success: true, belief: recalculated, logEntry, breakdown }
}

/**
 * Get the full score breakdown for a belief.
 * This shows how all sub-scores contribute to the final truth score.
 */
export function getBeliefScoreBreakdown(beliefId: string): ScoreBreakdown | undefined {
  const belief = schlichtBeliefs[beliefId]
  if (!belief) return undefined
  return scoreProtocolBelief(belief)
}

/**
 * Recalculate and update a belief in the store.
 * Call this when you need to refresh scores without adding an argument.
 */
export function refreshBeliefScores(beliefId: string): SchilchtBelief | undefined {
  const belief = schlichtBeliefs[beliefId]
  if (!belief) return undefined

  const recalculated = recalculateProtocolBelief(belief)
  schlichtBeliefs[beliefId] = recalculated
  return recalculated
}
