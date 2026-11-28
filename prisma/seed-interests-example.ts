/**
 * Seeds a fully worked interests-and-motivation dashboard for the UBI belief:
 * ranked interest hypotheses per side with prevalence / linkage accuracy /
 * validity, unstated-interest candidates (one promoted), Resolution Floor
 * validity scores on shared interests, and candidate solutions mapped to the
 * valid interests they satisfy per side. Idempotent: clears and recreates the
 * rows it owns.
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  const belief = await prisma.belief.findUnique({
    where: { slug: 'universal-basic-income-should-be-implemented' },
    select: { id: true },
  })
  if (!belief) {
    console.log('UBI belief not found — run seed-beliefs first. Skipping interests example.')
    return
  }
  const beliefId = belief.id

  await prisma.interestSatisfaction.deleteMany({ where: { solution: { beliefId } } })
  await prisma.interestSolution.deleteMany({ where: { beliefId } })
  await prisma.unstatedInterestCandidate.deleteMany({ where: { beliefId } })
  await prisma.interestEntry.deleteMany({ where: { beliefId } })
  await prisma.sharedInterest.deleteMany({ where: { beliefId } })

  const mk = (
    side: string,
    interest: string,
    prevalenceScore: number,
    linkageAccuracy: number,
    validityScore: number,
    evidenceBasis: string,
  ) =>
    prisma.interestEntry.create({
      data: { beliefId, side, interest, prevalenceScore, linkageAccuracy, validityScore, evidenceBasis },
    })

  const [secFloor, dignity, automation, taxBurden, workEthic, targeting] = await Promise.all([
    mk('supporter', 'Economic security floor for volatile work lives', 55, 78, 88,
      'Supporters keep backing pilots even when framed as taxpayer costs; gig-work districts overindex in support.'),
    mk('supporter', 'Dignity: aid without means-testing bureaucracy', 30, 64, 81,
      'Supporters also back administrative simplification bills that pay them nothing.'),
    mk('supporter', 'Hedge against automation-driven job loss', 25, 52, 74,
      'Support correlates with automation exposure, but so does general economic anxiety.'),
    mk('opponent', 'Keeping the tax burden from growing', 50, 74, 76,
      'Opposition tracks the financing plan, not the payment: flat opposition to tax-funded versions, softer on dividend-funded.'),
    mk('opponent', 'Preserving the work-conditional social contract', 40, 66, 72,
      'Opponents accept equally costly programs when work-conditioned (EITC expansions pass with the same voters).'),
    mk('opponent', 'Keeping aid targeted at the neediest', 25, 48, 84,
      'Stated often, but the same voters back universal programs like Social Security — words and votes diverge.'),
  ])

  // A genuinely shared interest, stated by each side in its own words. The
  // conflict-resolution pipeline pairs these by cross-side similarity — both
  // clear the Resolution Floor, so compromise gets built on them.
  await Promise.all([
    mk('supporter', 'Ending extreme poverty and homelessness', 35, 56, 90,
      'Supporters fund anti-poverty pilots even in designs with no universal payment.'),
    mk('opponent', 'Ending extreme poverty and homelessness', 30, 50, 82,
      'Opponents back targeted anti-poverty spending at similar rates; the fight is the mechanism, not the goal.'),
  ])

  await prisma.unstatedInterestCandidate.createMany({
    data: [
      {
        beliefId,
        side: 'opponent',
        interest: 'Status anxiety: universal payments erase the earned/unearned distinction',
        behaviorExplained:
          'Opposition softens when the same cash is renamed a "dividend" for stakeholders — targeting and cost stay identical, only the status frame changes.',
        evidence:
          'Framing experiments show label-driven swings; opposition to equally untargeted but "earned" programs is absent.',
        score: 58,
        promoted: true,
        sortOrder: 0,
      },
      {
        beliefId,
        side: 'supporter',
        interest: 'Institutional distrust: bypassing agencies seen as hostile',
        behaviorExplained:
          'Supporters oppose expanding the same safety net through existing agencies, which stated interests (security, dignity) predict they would accept.',
        evidence: 'Survey gap between cash support and equivalent in-kind expansion; distrust of caseworker discretion cited.',
        score: 44,
        promoted: false,
        sortOrder: 1,
      },
    ],
  })

  const [floor1, floor2] = await Promise.all([
    prisma.sharedInterest.create({
      data: {
        beliefId,
        interest: 'No one who works full-time should live in poverty',
        validityScore: 86,
        compromiseDirection: 'Opens income-floor designs both sides can fund: wage subsidies, dividends, or negative income tax.',
      },
    }),
    prisma.sharedInterest.create({
      data: {
        beliefId,
        interest: 'Administrative overhead should not eat aid budgets',
        validityScore: 78,
        compromiseDirection: 'Opens simplification: fewer programs, automatic enrollment, cash over vouchers.',
      },
    }),
  ])
  void floor1
  void floor2

  await prisma.interestSolution.create({
    data: {
      beliefId,
      solution: 'Negative income tax phased in by pilot results',
      description: 'A cash floor that tapers with earnings, financed by consolidating overlapping programs.',
      sortOrder: 0,
      satisfactions: {
        create: [
          { interestId: secFloor.id, satisfaction: 0.9 },
          { interestId: dignity.id, satisfaction: 0.7 },
          { interestId: taxBurden.id, satisfaction: 0.6 },
          { interestId: workEthic.id, satisfaction: 0.8 },
        ],
      },
    },
  })

  await prisma.interestSolution.create({
    data: {
      beliefId,
      solution: 'Full universal payment at subsistence level',
      description: 'Unconditional monthly payment to every adult, tax-financed.',
      sortOrder: 1,
      satisfactions: {
        create: [
          { interestId: secFloor.id, satisfaction: 1 },
          { interestId: dignity.id, satisfaction: 1 },
          { interestId: automation.id, satisfaction: 0.9 },
          { interestId: taxBurden.id, satisfaction: 0.1 },
        ],
      },
    },
  })

  await prisma.interestSolution.create({
    data: {
      beliefId,
      solution: 'Expand the Earned Income Tax Credit only',
      description: 'Larger work-conditioned credit, no unconditional payment.',
      sortOrder: 2,
      satisfactions: {
        create: [
          { interestId: workEthic.id, satisfaction: 0.9 },
          { interestId: taxBurden.id, satisfaction: 0.7 },
          { interestId: targeting.id, satisfaction: 0.8 },
          { interestId: secFloor.id, satisfaction: 0.4 },
        ],
      },
    },
  })

  console.log(`Seeded interests dashboard for belief #${beliefId}: 6 ranked interests, 2 unstated candidates, 2 floor interests, 3 solutions.`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
