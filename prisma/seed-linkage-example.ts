/**
 * Seeds one fully worked linkage page: the top pro argument on the UBI belief.
 * Demonstrates every section of the linkage template — scored linkage
 * arguments with named patterns, rephrasings with equivalency and drift,
 * the five-step check, domain failure examples, hidden assumptions, and
 * bias risks. Idempotent: clears and recreates the linkage children.
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  const parent = await prisma.belief.findUnique({
    where: { slug: 'universal-basic-income-should-be-implemented' },
    select: { id: true },
  })
  if (!parent) {
    console.log('UBI belief not found — run seed-beliefs first. Skipping linkage example.')
    return
  }

  const arg = await prisma.argument.findFirst({
    where: { parentBeliefId: parent.id, side: 'agree' },
    orderBy: { impactScore: 'desc' },
    include: { belief: { select: { statement: true } }, parentBelief: { select: { statement: true } } },
  })
  if (!arg) {
    console.log('No pro argument on the UBI belief — skipping linkage example.')
    return
  }

  await prisma.linkageRephrasing.deleteMany({ where: { argumentId: arg.id } })
  await prisma.linkageFiveStepCheck.deleteMany({ where: { argumentId: arg.id } })
  await prisma.linkageAssumption.deleteMany({ where: { argumentId: arg.id } })
  await prisma.linkageBiasRisk.deleteMany({ where: { argumentId: arg.id } })
  await prisma.linkageFailureExample.deleteMany({ where: { argumentId: arg.id } })
  await prisma.linkageArgument.deleteMany({ where: { argumentId: arg.id } })

  await prisma.argument.update({
    where: { id: arg.id },
    data: {
      scopeNote:
        'This edge scores whether the pilot evidence bears on a permanent, universal program — not whether the pilots themselves were well run.',
      linkageArguments: {
        create: [
          {
            side: 'agree',
            pattern: 'Mechanism: X causes Y through a named pathway',
            statement:
              'Cash floors directly remove the failure mode Y predicts UBI fixes: income falling below subsistence between jobs.',
            strength: 0.8,
            score: 62,
            sortOrder: 0,
          },
          {
            side: 'agree',
            pattern: 'Scope fit: X’s domain matches Y’s domain',
            statement:
              'The pilot populations span employed, unemployed, and gig workers — the same populations the policy targets.',
            strength: 0.6,
            score: 41,
            sortOrder: 1,
          },
          {
            side: 'disagree',
            pattern: 'Scope or scale mismatch',
            statement:
              'Pilots are temporary and non-universal; labor-supply responses to a permanent universal payment can differ in kind, not just degree.',
            strength: 0.7,
            score: 55,
            sortOrder: 0,
          },
          {
            side: 'disagree',
            pattern: 'Missing intermediate step',
            statement:
              'Scaling from pilot to national program assumes financing effects (taxes or inflation) leave the measured benefits intact.',
            strength: 0.5,
            score: 38,
            sortOrder: 1,
          },
        ],
      },
      linkageRephrasings: {
        create: [
          {
            target: 'x',
            label: 'Filler-stripped, plain language',
            text: 'Pilot programs paying people cash did not make them stop working.',
            equivalencyScore: 0.94,
            linkageScore: 0.58,
            sortOrder: 1,
          },
          {
            target: 'x',
            label: 'Quantified form',
            text: 'Across pilots, work hours changed by low single-digit percentages while payments were active.',
            equivalencyScore: 0.85,
            linkageScore: 0.61,
            sortOrder: 2,
          },
          {
            target: 'y',
            label: 'Filler-stripped, plain language',
            text: 'The country should adopt a universal cash payment.',
            equivalencyScore: 0.93,
            linkageScore: 0.55,
            sortOrder: 1,
          },
          {
            target: 'y',
            label: 'Scope-narrowed form',
            text: 'A universal cash payment would not collapse labor supply.',
            equivalencyScore: 0.62,
            linkageScore: 0.82,
            sortOrder: 2,
          },
        ],
      },
      linkageFiveStepCheck: {
        create: {
          parentWording: arg.parentBelief.statement,
          sourceWording: arg.belief.statement,
          mechanismSentence:
            'If pilots show cash payments without work collapse, the strongest empirical objection to Y loses force.',
          provisionalEstimate: 0.6,
          dominantFactor: 'contextual fit',
          flagNote:
            'Flagged below 0.7: seek permanent-program evidence (e.g. Alaska dividend labor data) rather than stretching pilot results.',
        },
      },
      linkageAssumptions: {
        create: [
          {
            side: 'hold',
            statement: 'Behavior under a temporary pilot predicts behavior under a permanent entitlement.',
            score: 45,
            sortOrder: 0,
          },
          {
            side: 'hold',
            statement: 'Financing a universal program does not offset the measured income effects.',
            score: 32,
            sortOrder: 1,
          },
          {
            side: 'fail',
            statement: 'Labor supply responds mainly to permanence and universality, which pilots cannot test.',
            score: 51,
            sortOrder: 0,
          },
        ],
      },
      linkageBiasRisks: {
        create: [
          {
            side: 'inflate',
            description: 'Motivated reasoning toward Y: pilot successes are salient and shareable.',
            score: 40,
            sortOrder: 0,
          },
          {
            side: 'deflate',
            description: 'Status-quo bias discounting any evidence for a large structural change.',
            score: 35,
            sortOrder: 0,
          },
        ],
      },
      linkageFailureExamples: {
        create: [
          {
            failureMode: 'Scope mismatch',
            xText: 'A two-year pilot in one city showed no drop in work hours.',
            yText: 'A permanent national program would not reduce work.',
            whyFails:
              'Temporary, non-universal payments cannot reveal responses to a permanent entitlement; extrapolation needs an unstated similarity assumption.',
            sortOrder: 0,
          },
        ],
      },
    },
  })

  console.log(`Seeded linkage example on argument #${arg.id} (${arg.belief.statement} → ${arg.parentBelief.statement})`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
