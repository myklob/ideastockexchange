/**
 * Seeds the corpus's worked Decision Leverage example.
 *
 * A fresh seed leaves every leaf belief in the UBI tree with zero evidence and
 * an undebated linkage, so Decision Leverage honestly reports that every edge
 * is a crux — true, but it shows nothing about how the ranking behaves once
 * support arrives. This script gives three leaves real support so the table on
 * /beliefs/universal-basic-income-should-be-implemented separates the three
 * states a reader needs to tell apart:
 *
 *   poverty-reduction-improves-society   — several studies, both directions,
 *     a voted linkage: high weight, little open range → load-bearing.
 *   automation-will-displace-workers     — contested evidence base (the Frey
 *     and Osborne estimate against the OECD re-estimate) and a voted linkage
 *     → weight intact, range partly closed.
 *   ubi-fiscally-unsustainable           — one survey-grade source, linkage
 *     barely voted → still a crux, but a cheaper one to finish.
 *
 * Everything else in the tree stays bare, which is the point: the contrast is
 * what makes the ranking readable.
 *
 * Sources are named studies with their authors and years, not invented
 * citations. Tiers follow the engine's scale (T1 peer-reviewed/official,
 * T2 expert/institutional, T3 journalism/surveys, T4 opinion/anecdote) and
 * every row is born UNVERIFIED: seeded evidence has not earned standing.
 *
 * Idempotent: this script owns all evidence and linkage votes on the three
 * leaves above, and clears them before reseeding.
 */

import { prisma } from '../src/lib/prisma'

interface EvidenceSeed {
  side: 'supporting' | 'weakening'
  description: string
  evidenceType: 'T1' | 'T2' | 'T3' | 'T4'
  author: string
  publicationDate: string
  sourceUrl?: string
  sourceIndependenceWeight: number
  replicationQuantity: number
  conclusionRelevance: number
  replicationPercentage: number
  linkageScore: number
}

interface LeafSeed {
  slug: string
  /** Votes to record in the linkage sub-debate of every edge using this leaf. */
  linkageVotes: number
  evidence: EvidenceSeed[]
}

const LEAVES: LeafSeed[] = [
  {
    slug: 'poverty-reduction-improves-society',
    linkageVotes: 14,
    evidence: [
      {
        side: 'supporting',
        description:
          'GiveDirectly long-term follow-up in Kenya: unconditional cash transfers produced sustained gains in assets, earnings and food security years after the transfer ended.',
        evidenceType: 'T1',
        author: 'Egger, Haushofer, Miguel, Niehaus, Walker',
        publicationDate: '2022',
        sourceUrl: 'https://www.givedirectly.org/research-on-cash-transfers/',
        sourceIndependenceWeight: 0.9,
        replicationQuantity: 3,
        conclusionRelevance: 0.85,
        replicationPercentage: 0.9,
        linkageScore: 0.85,
      },
      {
        side: 'supporting',
        description:
          'Reviews of US safety-net expansions find childhood poverty reduction followed by measurable adult gains in health, educational attainment and earnings.',
        evidenceType: 'T1',
        author: 'Hoynes, Schanzenbach',
        publicationDate: '2018',
        sourceIndependenceWeight: 0.85,
        replicationQuantity: 4,
        conclusionRelevance: 0.7,
        replicationPercentage: 0.8,
        linkageScore: 0.7,
      },
      {
        side: 'weakening',
        description:
          'Alaska Permanent Fund Dividend: four decades of universal payments with no measurable reduction in the state poverty rate, which bounds how much a cash floor alone achieves.',
        evidenceType: 'T2',
        author: 'Alaska Department of Revenue, and subsequent academic analyses',
        publicationDate: '2019',
        sourceIndependenceWeight: 0.7,
        replicationQuantity: 1,
        conclusionRelevance: 0.6,
        replicationPercentage: 1.0,
        linkageScore: 0.6,
      },
    ],
  },
  {
    slug: 'automation-will-displace-workers',
    linkageVotes: 9,
    evidence: [
      {
        side: 'supporting',
        description:
          'Robots and jobs in US local labour markets: each additional robot per thousand workers is estimated to reduce the employment-to-population ratio, with wage effects concentrated in routine occupations.',
        evidenceType: 'T1',
        author: 'Acemoglu, Restrepo',
        publicationDate: '2020',
        sourceIndependenceWeight: 0.9,
        replicationQuantity: 2,
        conclusionRelevance: 0.8,
        replicationPercentage: 0.8,
        linkageScore: 0.8,
      },
      {
        side: 'supporting',
        description:
          'The Future of Employment: roughly 47% of US employment estimated to be in occupations at high risk of computerisation over one to two decades.',
        evidenceType: 'T2',
        author: 'Frey, Osborne',
        publicationDate: '2013',
        sourceIndependenceWeight: 0.7,
        replicationQuantity: 1,
        conclusionRelevance: 0.75,
        replicationPercentage: 1.0,
        linkageScore: 0.7,
      },
      {
        side: 'weakening',
        description:
          'OECD re-estimate using task-level rather than occupation-level data: about 9% of jobs across member countries face high automatability, an order of magnitude below the occupation-level figure.',
        evidenceType: 'T1',
        author: 'Arntz, Gregory, Zierahn (OECD)',
        publicationDate: '2016',
        sourceIndependenceWeight: 0.85,
        replicationQuantity: 2,
        conclusionRelevance: 0.8,
        replicationPercentage: 0.85,
        linkageScore: 0.8,
      },
    ],
  },
  {
    slug: 'ubi-fiscally-unsustainable',
    linkageVotes: 2,
    evidence: [
      {
        side: 'supporting',
        description:
          'Costings of a poverty-line universal payment in large developed economies put gross cost in the range of 10-20% of GDP before offsets, which is the figure every funding proposal has to answer.',
        evidenceType: 'T3',
        author: 'Published think-tank and budget-office costings',
        publicationDate: '2020',
        sourceIndependenceWeight: 0.5,
        replicationQuantity: 2,
        conclusionRelevance: 0.7,
        replicationPercentage: 0.7,
        linkageScore: 0.65,
      },
    ],
  },
]

async function main() {
  for (const leaf of LEAVES) {
    const belief = await prisma.belief.findUnique({
      where: { slug: leaf.slug },
      select: { id: true, statement: true },
    })
    if (!belief) {
      console.log(`  ${leaf.slug} not found — run seed-beliefs first. Skipping.`)
      continue
    }

    // This script owns the evidence on these leaves; clear before reseeding.
    await prisma.evidence.deleteMany({ where: { beliefId: belief.id } })
    await prisma.evidence.createMany({
      data: leaf.evidence.map(e => ({
        beliefId: belief.id,
        side: e.side,
        description: e.description,
        evidenceType: e.evidenceType,
        author: e.author,
        publicationDate: e.publicationDate,
        sourceUrl: e.sourceUrl ?? null,
        sourceIndependenceWeight: e.sourceIndependenceWeight,
        replicationQuantity: e.replicationQuantity,
        conclusionRelevance: e.conclusionRelevance,
        replicationPercentage: e.replicationPercentage,
        linkageScore: e.linkageScore,
        verificationStatus: 'UNVERIFIED',
      })),
    })

    // Linkage votes on every edge that uses this leaf as a reason. The votes
    // close the linkage gap; their values are deliberately not unanimous, so
    // the resulting ratio is a finding rather than a rubber stamp.
    const edges = await prisma.argument.findMany({
      where: { beliefId: belief.id, status: 'published' },
      select: { id: true },
    })
    for (const edge of edges) {
      await prisma.linkageVote.deleteMany({ where: { argumentId: edge.id } })
      if (leaf.linkageVotes <= 0) continue
      await prisma.linkageVote.createMany({
        data: Array.from({ length: leaf.linkageVotes }, (_, i) => ({
          argumentId: edge.id,
          userId: `seed-linkage-voter-${i + 1}`,
          // A spread around a clear majority: 0.6-0.9 for most, a dissenter or
          // two low, so "voted" never means "agreed".
          score: i % 5 === 0 ? 0.3 : 0.6 + ((i % 4) * 0.1),
          weight: 1.0,
          direction: 'supports',
          isRelevant: i % 5 !== 0,
        })),
      })
    }

    console.log(
      `  ${leaf.slug}: ${leaf.evidence.length} evidence row(s), ` +
        `${leaf.linkageVotes} linkage vote(s) on ${edges.length} edge(s).`,
    )
  }

  console.log(
    'Leverage example seeded. Run seed-propagate (or npm run epoch:run) so grounding and ' +
      'truth scores pick up the new evidence.',
  )
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
