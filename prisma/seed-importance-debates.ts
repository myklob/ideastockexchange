/**
 * Seeds dedicated importance sub-debates for flagship edges, so live pages
 * demonstrate the audit lock on importance: the multiplier is the score of
 * a sub-belief with its own reasons, never a placement-time dial. Each
 * sub-belief is anchored by the four importance criteria (scale of impact,
 * decision relevance, causal proximity, testability) as its falsifiability
 * tests, and seeded with reasons on BOTH sides so the derived value is a
 * real balance, not a one-sided artifact.
 */
import { prisma } from '../src/lib/prisma'

const ANCHOR_CONFIRM =
  'Evidence that this consideration affects many people or severe/irreversible outcomes ' +
  '(scale of impact), changes what action should be taken (decision relevance), or ' +
  'addresses a root cause rather than an edge case (causal proximity).'
const ANCHOR_FALSIFY =
  'Evidence that its effect is marginal in scale, leaves the decision unchanged either way, ' +
  'addresses only rare edge cases, or rests on untestable speculation about hypotheticals.'

async function reasonBelief(slug: string, statement: string) {
  return prisma.belief.upsert({
    where: { slug },
    update: {},
    create: { slug, statement, category: 'Epistemology', specificity: 0.6, claimStrength: 0.5 },
  })
}

/**
 * Create (or reuse) an importance sub-belief, seed its two-sided reasons,
 * and attach it to the argument edge identified by parent+child slugs.
 */
async function seedImportanceDebate(opts: {
  parentSlug: string
  childSlug: string
  importanceSlug: string
  importanceStatement: string
  agree: { slug: string; statement: string; claim: string; linkage: number }
  disagree: { slug: string; statement: string; claim: string; linkage: number }
}) {
  const parent = await prisma.belief.findUnique({ where: { slug: opts.parentSlug } })
  const child = await prisma.belief.findUnique({ where: { slug: opts.childSlug } })
  if (!parent || !child) {
    console.log(`Skipping importance debate for ${opts.childSlug}: beliefs not seeded.`)
    return
  }
  const edge = await prisma.argument.findFirst({
    where: { parentBeliefId: parent.id, beliefId: child.id },
  })
  if (!edge) {
    console.log(`Skipping importance debate for ${opts.childSlug}: edge not found.`)
    return
  }

  const importanceBelief = await prisma.belief.upsert({
    where: { slug: opts.importanceSlug },
    update: {},
    create: {
      slug: opts.importanceSlug,
      statement: opts.importanceStatement,
      category: parent.category,
      falsifiabilityConfirm: ANCHOR_CONFIRM,
      falsifiabilityFalsify: ANCHOR_FALSIFY,
    },
  })

  const [agreeChild, disagreeChild] = await Promise.all([
    reasonBelief(opts.agree.slug, opts.agree.statement),
    reasonBelief(opts.disagree.slug, opts.disagree.statement),
  ])

  const existing = await prisma.argument.count({
    where: { parentBeliefId: importanceBelief.id },
  })
  if (existing === 0) {
    await prisma.argument.createMany({
      data: [
        {
          parentBeliefId: importanceBelief.id,
          beliefId: agreeChild.id,
          side: 'agree',
          claim: opts.agree.claim,
          linkageScore: opts.agree.linkage,
          linkageType: 'STRONG_CAUSAL',
        },
        {
          parentBeliefId: importanceBelief.id,
          beliefId: disagreeChild.id,
          side: 'disagree',
          claim: opts.disagree.claim,
          linkageScore: opts.disagree.linkage,
          linkageType: 'CONTEXTUAL',
        },
      ],
    })
  }

  if (edge.importanceBeliefId == null) {
    await prisma.argument.update({
      where: { id: edge.id },
      data: { importanceBeliefId: importanceBelief.id },
    })
  }
  console.log(`Importance debate attached: ${opts.importanceSlug} → edge #${edge.id}`)
}

async function main() {
  // UBI's bureaucracy argument: does cutting welfare overhead actually
  // matter to whether UBI should be implemented?
  await seedImportanceDebate({
    parentSlug: 'universal-basic-income-should-be-implemented',
    childSlug: 'welfare-bureaucracy-is-inefficient',
    importanceSlug: 'cuts-welfare-bureaucracy-is-an-important-consideration-for-universal-basic',
    importanceStatement:
      '"Cuts welfare bureaucracy" is an important consideration for "Universal Basic Income should be implemented in developed nations"',
    agree: {
      slug: 'administrative-overhead-consumes-a-substantial-share-of-means-tested-welfare',
      statement:
        'Administrative overhead consumes a substantial share of means-tested welfare budgets',
      claim: 'overhead consumes budgets',
      linkage: 0.7,
    },
    disagree: {
      slug: 'administrative-savings-are-small-next-to-universal-payment-costs',
      statement:
        'Administrative savings are small relative to the gross cost of universal payments',
      claim: 'savings dwarfed by cost',
      linkage: 0.65,
    },
  })

  // The framework page's zombie-updates argument: does automatic score
  // propagation actually matter to whether arguments should be ranked?
  await seedImportanceDebate({
    parentSlug: 'arguments-should-be-ranked-by-logical-support',
    childSlug: 'automatic-updates-kill-zombie-arguments',
    importanceSlug: 'updates-kill-zombies-is-an-important-consideration-for-ranking-arguments',
    importanceStatement:
      '"Updates kill zombies" is an important consideration for "Arguments should be scored and promoted by their logical support"',
    agree: {
      slug: 'debunked-claims-recirculating-is-a-primary-failure-of-public-debate',
      statement:
        'Debunked claims recirculating unchanged is a primary failure mode of public debate',
      claim: 'zombie claims recirculate',
      linkage: 0.75,
    },
    disagree: {
      slug: 'most-debate-failures-are-value-conflicts-not-stale-facts',
      statement:
        'Most persistent debate failures are value conflicts, not stale factual claims',
      claim: 'values, not stale facts',
      linkage: 0.55,
    },
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
