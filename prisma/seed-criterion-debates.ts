/**
 * Seeds the recursive criteria layer on the flagship UBI page: two criteria
 * get dedicated quality sub-debates (argued on both sides), and the evidence
 * ledger's rows are linked to the yardstick that measured them — so evidence
 * measured by the strong yardstick (randomized pilots) carries and evidence
 * measured by the weak one (opinion surveys) is filtered, permanently,
 * without re-litigating the yardstick per argument.
 */
import { prisma } from '../src/lib/prisma'

const ANCHOR_CONFIRM =
  'Evidence that this metric measures what it claims to (validity), can be measured ' +
  'consistently by different people (reliability), comes from neutral sources ' +
  '(independence), and correlates strongly with the ultimate goal (linkage).'
const ANCHOR_FALSIFY =
  'Evidence that the metric measures something else, varies by observer, is produced ' +
  'by interested parties, or barely correlates with the outcome the debate is about.'

async function reasonBelief(slug: string, statement: string) {
  return prisma.belief.upsert({
    where: { slug },
    update: {},
    create: { slug, statement, category: 'Epistemology', specificity: 0.6, claimStrength: 0.5 },
  })
}

async function attachCriterionDebate(opts: {
  pageSlug: string
  criterionDescription: string
  debateSlug: string
  debateStatement: string
  agree: { slug: string; statement: string; claim: string; linkage: number }
  disagree: { slug: string; statement: string; claim: string; linkage: number }
}) {
  const page = await prisma.belief.findUnique({ where: { slug: opts.pageSlug } })
  if (!page) {
    console.log(`Skipping criterion debate: page ${opts.pageSlug} not seeded.`)
    return
  }
  const criterion = await prisma.objectiveCriteria.findFirst({
    where: { beliefId: page.id, description: opts.criterionDescription },
  })
  if (!criterion) {
    console.log(`Skipping criterion debate: criterion "${opts.criterionDescription}" not found.`)
    return
  }

  const debateBelief = await prisma.belief.upsert({
    where: { slug: opts.debateSlug },
    update: {},
    create: {
      slug: opts.debateSlug,
      statement: opts.debateStatement,
      category: page.category,
      falsifiabilityConfirm: ANCHOR_CONFIRM,
      falsifiabilityFalsify: ANCHOR_FALSIFY,
    },
  })

  const [agreeChild, disagreeChild] = await Promise.all([
    reasonBelief(opts.agree.slug, opts.agree.statement),
    reasonBelief(opts.disagree.slug, opts.disagree.statement),
  ])

  const existing = await prisma.argument.count({ where: { parentBeliefId: debateBelief.id } })
  if (existing === 0) {
    await prisma.argument.createMany({
      data: [
        {
          parentBeliefId: debateBelief.id,
          beliefId: agreeChild.id,
          side: 'agree',
          claim: opts.agree.claim,
          linkageScore: opts.agree.linkage,
          linkageType: 'STRONG_CAUSAL',
        },
        {
          parentBeliefId: debateBelief.id,
          beliefId: disagreeChild.id,
          side: 'disagree',
          claim: opts.disagree.claim,
          linkageScore: opts.disagree.linkage,
          linkageType: 'STRONG_CAUSAL',
        },
      ],
    })
  }

  if (criterion.criterionBeliefId == null) {
    await prisma.objectiveCriteria.update({
      where: { id: criterion.id },
      data: { criterionBeliefId: debateBelief.id },
    })
  }
  console.log(`Criterion debate attached: ${opts.debateSlug} → criterion #${criterion.id}`)
}

/** Link evidence rows to the yardstick that measured them, by description prefix. */
async function linkEvidenceToCriterion(
  pageSlug: string,
  criterionDescription: string,
  evidencePrefixes: string[],
) {
  const page = await prisma.belief.findUnique({ where: { slug: pageSlug } })
  if (!page) return
  const criterion = await prisma.objectiveCriteria.findFirst({
    where: { beliefId: page.id, description: criterionDescription },
  })
  if (!criterion) return

  for (const prefix of evidencePrefixes) {
    await prisma.evidence.updateMany({
      where: { beliefId: page.id, description: { startsWith: prefix } },
      data: { criterionId: criterion.id },
    })
  }
}

async function main() {
  const UBI = 'universal-basic-income-should-be-implemented'

  // The strong yardstick: randomized pilots. Argued on both sides; nets positive.
  await attachCriterionDebate({
    pageSlug: UBI,
    criterionDescription: 'Randomized controlled trial results from UBI pilots in multiple countries',
    debateSlug: 'rct-pilots-are-a-good-measure-of-ubi-success',
    debateStatement:
      '"Randomized controlled trial results from UBI pilots" is a good measure for whether UBI should be implemented',
    agree: {
      slug: 'randomization-isolates-causal-effects-of-cash-transfers',
      statement: 'Randomization isolates the causal effect of cash transfers from confounders',
      claim: 'randomization isolates causation',
      linkage: 0.9,
    },
    disagree: {
      slug: 'pilots-too-small-to-capture-general-equilibrium-effects',
      statement: 'Pilots are too small and short to capture general-equilibrium effects at scale',
      claim: 'pilots miss scale effects',
      linkage: 0.6,
    },
  })

  // The weak yardstick: opinion surveys. Argued on both sides; nets negative.
  await attachCriterionDebate({
    pageSlug: UBI,
    criterionDescription: 'Public opinion surveys on UBI satisfaction',
    debateSlug: 'opinion-surveys-are-a-good-measure-of-ubi-success',
    debateStatement:
      '"Public opinion surveys on UBI satisfaction" is a good measure for whether UBI should be implemented',
    agree: {
      slug: 'surveys-capture-recipient-lived-experience',
      statement: 'Surveys capture the lived experience of recipients directly',
      claim: 'captures lived experience',
      linkage: 0.45,
    },
    disagree: {
      slug: 'sentiment-measures-perception-and-framing-not-outcomes',
      statement: 'Sentiment measures perception and question framing, not material outcomes',
      claim: 'perception, not outcomes',
      linkage: 0.85,
    },
  })

  // Measured-by links: pilots evidence → RCT yardstick; survey evidence → the
  // weak yardstick; labor-market evidence → the participation-data yardstick.
  await linkEvidenceToCriterion(
    UBI,
    'Randomized controlled trial results from UBI pilots in multiple countries',
    ['Finland UBI pilot', 'GiveDirectly long-term study', 'Stockton SEED program'],
  )
  await linkEvidenceToCriterion(
    UBI,
    'Labor market participation data from existing cash transfer programs',
    ['Alaska Permanent Fund Dividend'],
  )
  await linkEvidenceToCriterion(UBI, 'Public opinion surveys on UBI satisfaction', [
    'Survey data suggests',
  ])

  console.log('Evidence rows linked to their yardsticks.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
