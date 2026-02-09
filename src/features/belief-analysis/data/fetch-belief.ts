import { prisma } from '@/lib/prisma'
import type { BeliefWithRelations, BeliefScores } from '../types'

/** Fetch a complete belief with all analysis sections */
export async function fetchBeliefBySlug(slug: string): Promise<BeliefWithRelations | null> {
  const belief = await prisma.belief.findUnique({
    where: { slug },
    include: {
      arguments: {
        include: {
          belief: {
            select: { id: true, slug: true, statement: true, positivity: true },
          },
        },
        orderBy: { impactScore: 'desc' },
      },
      evidence: { orderBy: { impactScore: 'desc' } },
      objectiveCriteria: { orderBy: { totalScore: 'desc' } },
      valuesAnalysis: true,
      interestsAnalysis: true,
      assumptions: true,
      costBenefitAnalysis: true,
      impactAnalysis: true,
      compromises: true,
      obstacles: true,
      biases: true,
      mediaResources: true,
      legalEntries: true,
      upstreamMappings: {
        include: {
          parentBelief: { select: { id: true, slug: true, statement: true } },
          childBelief: { select: { id: true, slug: true, statement: true } },
        },
      },
      downstreamMappings: {
        include: {
          parentBelief: { select: { id: true, slug: true, statement: true } },
          childBelief: { select: { id: true, slug: true, statement: true } },
        },
      },
      similarTo: {
        include: {
          fromBelief: { select: { id: true, slug: true, statement: true } },
          toBelief: { select: { id: true, slug: true, statement: true } },
        },
      },
      similarFrom: {
        include: {
          fromBelief: { select: { id: true, slug: true, statement: true } },
          toBelief: { select: { id: true, slug: true, statement: true } },
        },
      },
    },
  })

  return belief as BeliefWithRelations | null
}

/** Fetch a belief by numeric ID */
export async function fetchBeliefById(id: number): Promise<BeliefWithRelations | null> {
  const belief = await prisma.belief.findUnique({
    where: { id },
    include: {
      arguments: {
        include: {
          belief: {
            select: { id: true, slug: true, statement: true, positivity: true },
          },
        },
        orderBy: { impactScore: 'desc' },
      },
      evidence: { orderBy: { impactScore: 'desc' } },
      objectiveCriteria: { orderBy: { totalScore: 'desc' } },
      valuesAnalysis: true,
      interestsAnalysis: true,
      assumptions: true,
      costBenefitAnalysis: true,
      impactAnalysis: true,
      compromises: true,
      obstacles: true,
      biases: true,
      mediaResources: true,
      legalEntries: true,
      upstreamMappings: {
        include: {
          parentBelief: { select: { id: true, slug: true, statement: true } },
          childBelief: { select: { id: true, slug: true, statement: true } },
        },
      },
      downstreamMappings: {
        include: {
          parentBelief: { select: { id: true, slug: true, statement: true } },
          childBelief: { select: { id: true, slug: true, statement: true } },
        },
      },
      similarTo: {
        include: {
          fromBelief: { select: { id: true, slug: true, statement: true } },
          toBelief: { select: { id: true, slug: true, statement: true } },
        },
      },
      similarFrom: {
        include: {
          fromBelief: { select: { id: true, slug: true, statement: true } },
          toBelief: { select: { id: true, slug: true, statement: true } },
        },
      },
    },
  })

  return belief as BeliefWithRelations | null
}

/** List all beliefs (for the /beliefs index page) */
export async function fetchAllBeliefs() {
  return prisma.belief.findMany({
    select: {
      id: true,
      slug: true,
      statement: true,
      category: true,
      subcategory: true,
      positivity: true,
    },
    orderBy: { updatedAt: 'desc' },
  })
}

/** Compute aggregate scores for a belief */
export function computeBeliefScores(belief: BeliefWithRelations): BeliefScores {
  const proArgs = belief.arguments.filter(a => a.side === 'agree')
  const conArgs = belief.arguments.filter(a => a.side === 'disagree')

  const totalPro = proArgs.reduce((sum, a) => sum + Math.abs(a.impactScore), 0)
  const totalCon = conArgs.reduce((sum, a) => sum + Math.abs(a.impactScore), 0)

  const supportingEvidence = belief.evidence.filter(e => e.side === 'supporting')
  const weakeningEvidence = belief.evidence.filter(e => e.side === 'weakening')

  const totalSupportingEvidence = supportingEvidence.reduce((sum, e) => sum + Math.abs(e.impactScore), 0)
  const totalWeakeningEvidence = weakeningEvidence.reduce((sum, e) => sum + Math.abs(e.impactScore), 0)

  const totalPositive = totalPro + totalSupportingEvidence
  const totalNegative = totalCon + totalWeakeningEvidence
  const total = totalPositive + totalNegative
  const overallScore = total > 0 ? ((totalPositive - totalNegative) / total) * 100 : 0

  return { totalPro, totalCon, totalSupportingEvidence, totalWeakeningEvidence, overallScore }
}
