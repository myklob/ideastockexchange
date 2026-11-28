/**
 * Seed the topic hubs (One Page Per Topic): the four worked examples from the
 * vision doc, two parent topics for the topic-level abstraction ladder, one
 * belief shared across topics, and one equivalency edge so the Grouped
 * Duplicates section renders. Scores are illustrative placeholders on beliefs
 * with no argument tree; the engine pass (seed-propagate) only rewrites
 * beliefs that have arguments, so these coordinates survive the full chain.
 */
import { prisma } from '../src/lib/prisma'

interface BeliefSeed {
  slug: string
  statement: string
  category: string
  subcategory?: string
  positivity: number
  claimStrength: number
  specificity: number
}

interface TopicSeed {
  slug: string
  title: string
  question: string
  description?: string
  beliefs: BeliefSeed[]
}

const TOPICS: TopicSeed[] = [
  {
    slug: 'social-media',
    title: 'Social Media Impact',
    question: 'What is the overall impact of social media on society?',
    description:
      'The full position spectrum on one page: from "destroys mental health" to "essential for democracy", sorted by direction.',
    beliefs: [
      {
        slug: 'social-media-destroys-mental-health',
        statement: 'Social media destroys mental health',
        category: 'Technology',
        subcategory: 'Social Media',
        positivity: -75,
        claimStrength: 0.8,
        specificity: 0.3,
      },
      {
        slug: 'social-media-significant-downsides',
        statement: 'Social media has significant downsides',
        category: 'Technology',
        subcategory: 'Social Media',
        positivity: -45,
        claimStrength: 0.5,
        specificity: 0.3,
      },
      {
        slug: 'social-media-benefits-and-costs',
        statement: 'Social media has both benefits and costs',
        category: 'Technology',
        subcategory: 'Social Media',
        positivity: 0,
        claimStrength: 0.2,
        specificity: 0.3,
      },
      {
        slug: 'social-media-enables-valuable-connections',
        statement: 'Social media enables valuable connections',
        category: 'Technology',
        subcategory: 'Social Media',
        positivity: 38,
        claimStrength: 0.5,
        specificity: 0.4,
      },
      {
        slug: 'social-media-essential-for-democracy',
        statement: 'Social media is essential for modern democracy',
        category: 'Technology',
        subcategory: 'Social Media',
        positivity: 72,
        claimStrength: 1.0,
        specificity: 0.35,
      },
    ],
  },
  {
    slug: 'electric-cars',
    title: 'Electric Cars and Climate Change',
    question: 'How much do electric cars help the climate?',
    description:
      'Same topic, bolder phrasing: magnitude measures a claim’s structural reach, and the boldest claim doesn’t automatically score highest.',
    beliefs: [
      {
        slug: 'electric-cars-some-environmental-benefits',
        statement: 'Electric cars have some environmental benefits',
        category: 'Environment',
        subcategory: 'Transportation',
        positivity: 42,
        claimStrength: 0.2,
        specificity: 0.35,
      },
      {
        slug: 'electric-cars-significantly-reduce-emissions',
        statement: 'Electric cars significantly reduce emissions',
        category: 'Environment',
        subcategory: 'Transportation',
        positivity: 68,
        claimStrength: 0.5,
        specificity: 0.4,
      },
      {
        slug: 'electric-cars-essential-for-climate',
        statement: 'Electric cars are essential for solving climate change',
        category: 'Environment',
        subcategory: 'Transportation',
        positivity: 35,
        claimStrength: 1.0,
        specificity: 0.4,
      },
    ],
  },
  {
    slug: 'term-limits',
    title: 'Congressional Term Limits',
    question: 'Would term limits improve Congress?',
    description:
      'The abstraction ladder: from the broad principle down to a concrete 12-year proposal, each rung debated on its own page.',
    beliefs: [
      {
        slug: 'strong-democratic-institutions-benefit-society',
        statement: 'Strong democratic institutions benefit society',
        category: 'Politics',
        subcategory: 'Government Reform',
        positivity: 78,
        claimStrength: 0.5,
        specificity: 0.05,
      },
      {
        slug: 'term-limits-improve-democratic-institutions',
        statement: 'Term limits improve democratic institutions',
        category: 'Politics',
        subcategory: 'Government Reform',
        positivity: 45,
        claimStrength: 0.5,
        specificity: 0.35,
      },
      {
        slug: 'congressional-term-limits-reduce-corruption',
        statement: 'Congressional term limits would reduce corruption',
        category: 'Politics',
        subcategory: 'Government Reform',
        positivity: 32,
        claimStrength: 0.5,
        specificity: 0.6,
      },
      {
        slug: 'twelve-year-term-limits-reduce-lobbying',
        statement: '12-year term limits for Congress would reduce lobbying influence',
        category: 'Politics',
        subcategory: 'Government Reform',
        positivity: 18,
        claimStrength: 0.5,
        specificity: 0.9,
      },
    ],
  },
  {
    slug: 'trump-capability',
    title: "Trump's Intelligence",
    question: 'How intelligent is Donald Trump?',
    description:
      'Combined navigation: statements about the same attribute of the same entity merge onto one page, sorted by magnitude and scored by evidence quality.',
    beliefs: [
      {
        slug: 'politicians-arent-very-smart',
        statement: "Politicians aren't very smart",
        category: 'Politics',
        subcategory: 'Political Leadership',
        positivity: -25,
        claimStrength: 0.5,
        specificity: 0.1,
      },
      {
        slug: 'trump-isnt-very-smart',
        statement: "Trump isn't very smart",
        category: 'Politics',
        subcategory: 'Political Leadership',
        positivity: -30,
        claimStrength: 0.5,
        specificity: 0.6,
      },
      {
        slug: 'trump-is-extremely-stupid',
        statement: 'Trump is extremely stupid',
        category: 'Politics',
        subcategory: 'Political Leadership',
        positivity: -45,
        claimStrength: 0.8,
        specificity: 0.65,
      },
      {
        slug: 'trump-dumbest-president-ever',
        statement: 'Trump is the dumbest president ever',
        category: 'Politics',
        subcategory: 'Political Leadership',
        positivity: -52,
        claimStrength: 1.0,
        specificity: 0.9,
      },
    ],
  },
  {
    slug: 'democratic-institutions',
    title: 'Democratic Institutions',
    question: 'What makes democratic institutions strong?',
    beliefs: [],
  },
  {
    slug: 'political-leadership',
    title: 'Political Leadership',
    question: 'What should we expect from political leaders?',
    beliefs: [],
  },
  {
    slug: 'technology-and-society',
    title: 'Technology & Society',
    question: 'How is technology reshaping society?',
    beliefs: [],
  },
]

/** parent slug → child slugs: the topic-level abstraction ladder. */
const TOPIC_RELATIONS: Record<string, string[]> = {
  'democratic-institutions': ['term-limits'],
  'political-leadership': ['trump-capability'],
  'technology-and-society': ['social-media', 'electric-cars'],
}

/** belief slug → extra topic slugs (beyond its home topic). */
const EXTRA_MEMBERSHIPS: Record<string, string[]> = {
  'strong-democratic-institutions-benefit-society': ['democratic-institutions'],
  'politicians-arent-very-smart': ['political-leadership'],
}

async function main() {
  console.log('Seeding topic hubs (One Page Per Topic)...')

  const topicIdBySlug = new Map<string, number>()
  const beliefIdBySlug = new Map<string, number>()

  for (const topicSeed of TOPICS) {
    const topic = await prisma.topic.upsert({
      where: { slug: topicSeed.slug },
      update: {
        title: topicSeed.title,
        question: topicSeed.question,
        description: topicSeed.description ?? null,
      },
      create: {
        slug: topicSeed.slug,
        title: topicSeed.title,
        question: topicSeed.question,
        description: topicSeed.description ?? null,
      },
    })
    topicIdBySlug.set(topicSeed.slug, topic.id)

    for (const beliefSeed of topicSeed.beliefs) {
      // Placeholder coordinates only on create: once a belief exists, the
      // engine (or a richer seed) owns its scores.
      const belief = await prisma.belief.upsert({
        where: { slug: beliefSeed.slug },
        update: {},
        create: {
          slug: beliefSeed.slug,
          statement: beliefSeed.statement,
          category: beliefSeed.category,
          subcategory: beliefSeed.subcategory ?? null,
          positivity: beliefSeed.positivity,
          claimStrength: beliefSeed.claimStrength,
          specificity: beliefSeed.specificity,
        },
      })
      beliefIdBySlug.set(beliefSeed.slug, belief.id)

      await prisma.topicBelief.upsert({
        where: { topicId_beliefId: { topicId: topic.id, beliefId: belief.id } },
        update: {},
        create: { topicId: topic.id, beliefId: belief.id },
      })
    }
  }

  for (const [beliefSlug, topicSlugs] of Object.entries(EXTRA_MEMBERSHIPS)) {
    const beliefId = beliefIdBySlug.get(beliefSlug)
    if (!beliefId) continue
    for (const topicSlug of topicSlugs) {
      const topicId = topicIdBySlug.get(topicSlug)
      if (!topicId) continue
      await prisma.topicBelief.upsert({
        where: { topicId_beliefId: { topicId, beliefId } },
        update: {},
        create: { topicId, beliefId },
      })
    }
  }

  for (const [parentSlug, childSlugs] of Object.entries(TOPIC_RELATIONS)) {
    const parentId = topicIdBySlug.get(parentSlug)
    if (!parentId) continue
    for (const childSlug of childSlugs) {
      const childId = topicIdBySlug.get(childSlug)
      if (!childId) continue
      await prisma.topicRelation.upsert({
        where: { parentId_childId: { parentId, childId } },
        update: {},
        create: { parentId, childId },
      })
    }
  }

  // "Trump is extremely stupid" and "Trump is the dumbest president ever" are
  // magnitude variants of the same underlying claim — the Grouped Duplicates
  // demo on the trump-capability page.
  const fromId = beliefIdBySlug.get('trump-is-extremely-stupid')
  const toId = beliefIdBySlug.get('trump-dumbest-president-ever')
  if (fromId && toId) {
    const existing = await prisma.similarBelief.findFirst({
      where: {
        OR: [
          { fromBeliefId: fromId, toBeliefId: toId },
          { fromBeliefId: toId, toBeliefId: fromId },
        ],
      },
    })
    if (!existing) {
      await prisma.similarBelief.create({
        data: {
          fromBeliefId: fromId,
          toBeliefId: toId,
          variant: 'extreme',
          equivalencyScore: 0.72,
        },
      })
    }
  }

  const topicCount = topicIdBySlug.size
  const beliefCount = beliefIdBySlug.size
  console.log(`Seeded ${topicCount} topics with ${beliefCount} beliefs.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
