import { NextResponse } from 'next/server'
import { getSchilchtBelief, getBeliefScoreBreakdown } from '@/features/epistemology/data/schlicht-data'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const belief = getSchilchtBelief(id)

  if (!belief) {
    return NextResponse.json(
      { error: 'Belief not found', beliefId: id },
      { status: 404 }
    )
  }

  // Return the Schlicht Protocol JSON format as specified in the design
  const schlichtJson = {
    belief_id: belief.beliefId,
    statement: belief.statement,
    status: belief.status,
    metrics: {
      truth_score: belief.metrics.truthScore,
      confidence_interval: belief.metrics.confidenceInterval,
      volatility: belief.metrics.volatility,
      adversarial_cycles: belief.metrics.adversarialCycles,
      last_updated: belief.metrics.lastUpdated,
    },
    agents: Object.fromEntries(
      Object.entries(belief.agents).map(([role, agent]) => [
        role,
        agent.name,
      ])
    ),
    graph: {
      pro_tree: belief.proTree.map((arg) => ({
        id: arg.id,
        claim: arg.claim,
        linkage_score: arg.linkageScore,
        truth_score: arg.truthScore,
        impact_score: arg.impactScore,
        certified_by: arg.certifiedBy,
        fallacies_detected: arg.fallaciesDetected.map((f) => ({
          type: f.type,
          description: f.description,
          impact: f.impact,
        })),
      })),
      con_tree: belief.conTree.map((arg) => ({
        id: arg.id,
        claim: arg.claim,
        linkage_score: arg.linkageScore,
        truth_score: arg.truthScore,
        impact_score: arg.impactScore,
        certified_by: arg.certifiedBy,
        fallacies_detected: arg.fallaciesDetected.map((f) => ({
          type: f.type,
          description: f.description,
          impact: f.impact,
        })),
        ...(arg.rebuttal
          ? {
              rebuttal: {
                id: arg.rebuttal.id,
                statement: arg.rebuttal.statement,
                confidence: arg.rebuttal.confidence,
              },
            }
          : {}),
      })),
    },
    evidence: belief.evidence.map((ev) => ({
      id: ev.id,
      tier: ev.tier,
      tier_label: ev.tierLabel,
      title: ev.title,
      linkage_score: ev.linkageScore,
    })),
    protocol_log: belief.protocolLog.map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      agent: entry.agentName,
      content: entry.content,
    })),
    // Score breakdown from the unified scoring engine — shows exactly how the truth score is computed
    score_breakdown: (() => {
      const bd = getBeliefScoreBreakdown(id)
      if (!bd) return null
      return {
        truth_score: bd.truthScore,
        confidence_interval: bd.confidenceInterval,
        pro_argument_strength: bd.proArgumentStrength,
        con_argument_strength: bd.conArgumentStrength,
        evidence_score: bd.evidenceScore,
        average_linkage: bd.linkageScore,
        pro_argument_count: bd.proArgumentCount,
        con_argument_count: bd.conArgumentCount,
        evidence_count: bd.evidenceCount,
        per_argument: bd.argumentBreakdowns.map((ab) => ({
          id: ab.id,
          claim: ab.claim,
          side: ab.side,
          truth_score: ab.truthScore,
          reason_rank: ab.reasonRank,
          linkage_score: ab.linkageScore,
          importance_weight: ab.importanceWeight,
          uniqueness_score: ab.uniquenessScore,
          raw_impact: ab.rawImpact,
          signed_impact: ab.signedImpact,
          fallacy_penalty: ab.fallacyPenalty,
          sub_argument_count: ab.subArgumentCount,
          sub_argument_net_strength: ab.subArgumentNetStrength,
        })),
      }
    })(),
  }

  return NextResponse.json(schlichtJson, {
    headers: {
      'Content-Type': 'application/json',
      'X-Protocol': 'schlicht-v1',
    },
  })
}
