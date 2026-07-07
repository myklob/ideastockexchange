/**
 * Seeds the framework's own thesis as a belief page: arguments should be
 * ranked by logical support, the way Google ranks pages by links. The seven
 * reasons-to-agree from the wiki page become child beliefs with scored
 * edges, joined by the two standing objections (gaming, garbage-in) so the
 * engine has both sides to weigh. The engine pass at the end of the seed
 * chain computes every score.
 */
import { prisma } from '../src/lib/prisma'

async function main() {
  const main = await prisma.belief.upsert({
    where: { slug: 'arguments-should-be-ranked-by-logical-support' },
    update: {},
    create: {
      slug: 'arguments-should-be-ranked-by-logical-support',
      statement:
        'Arguments should be scored and promoted by their logical support, the way Google ranks pages by links',
      category: 'Epistemology',
      subcategory: 'Collective Reasoning',
      deweyNumber: '121',
      positivity: 60,
      specificity: 0.35,
      claimStrength: 0.6,
      netInterpretation:
        'The transfer of link-analysis to reasoning holds; the live objections are about gaming and corpus quality, not the mechanism.',
      bottomLine:
        'Let the strength of the reasoning set the price of a belief, not the volume of the crowd shouting for it.',
      scoreMover:
        'A deployed argument-ranking system whose scores demonstrably resist coordinated gaming — or demonstrably fail to.',
      falsifiabilityConfirm:
        'Argument networks scored this way surface expert-consensus conclusions from noisy corpora more reliably than vote-based ranking.',
      falsifiabilityFalsify:
        'Scores prove no harder to game than upvotes, or ranking quality fails to beat simple vote counts on real corpora.',
      relatedBeliefs: 'One page per topic is the structural prerequisite',
      supportsBeliefs: 'Structured argumentation can turn scattered opinion into cumulative knowledge',
    },
  })

  const child = (slug: string, statement: string, category: string, positivity: number) =>
    prisma.belief.upsert({
      where: { slug },
      update: {},
      create: { slug, statement, category, positivity, specificity: 0.4, claimStrength: 0.5 },
    })

  const [
    linkAnalysis,
    recursive,
    truthRelevance,
    evidenceQuality,
    zombieUpdates,
    onePage,
    disputeMapping,
    gaming,
    garbageIn,
  ] = await Promise.all([
    child(
      'link-analysis-works-for-arguments',
      "Google's link-analysis insight transfers from web pages to argument networks",
      'Epistemology',
      55,
    ),
    child(
      'recursive-scoring-makes-claims-earn-strength',
      'Recursive scoring makes every claim earn its strength from its sub-arguments down to evidence',
      'Epistemology',
      60,
    ),
    child(
      'truth-and-relevance-are-different-questions',
      'Scoring truth separately from relevance stops true-but-irrelevant facts from winning debates',
      'Epistemology',
      65,
    ),
    child(
      'evidence-quality-weighting-beats-vote-counting',
      'Weighting evidence by verification quality keeps anecdotes from outvoting studies',
      'Epistemology',
      65,
    ),
    child(
      'automatic-updates-kill-zombie-arguments',
      'Automatic score propagation retires debunked arguments when the evidence changes',
      'Epistemology',
      55,
    ),
    child(
      'one-page-per-topic-enables-scoring',
      'One page per topic is the structural prerequisite for systematic argument scoring',
      'Epistemology',
      60,
    ),
    child(
      'dispute-mapping-beats-tribal-shouting',
      'Tracing disagreements to specific factual, linkage, or value disputes beats tribal shouting',
      'Epistemology',
      55,
    ),
    child(
      'argument-scoring-can-be-gamed',
      'Any numeric argument-scoring system invites coordinated gaming and metric-chasing',
      'Epistemology',
      -20,
    ),
    child(
      'scores-inherit-corpus-bias',
      'Argument scores inherit the bias and emptiness of the corpus they are computed over',
      'Epistemology',
      -10,
    ),
  ])

  // Skip when edges already exist so re-running never double-counts a side.
  const existing = await prisma.argument.count({ where: { parentBeliefId: main.id } })
  if (existing > 0) {
    console.log('Ranking-arguments belief already has edges; skipping edge creation.')
  } else {
    await prisma.argument.createMany({
      data: [
        { parentBeliefId: main.id, beliefId: linkAnalysis.id, side: 'agree', claim: 'link analysis transfers', linkageScore: 0.8, linkageType: 'STRONG_CAUSAL' },
        { parentBeliefId: main.id, beliefId: recursive.id, side: 'agree', claim: 'strength earned recursively', linkageScore: 0.85, linkageType: 'STRONG_CAUSAL' },
        { parentBeliefId: main.id, beliefId: truthRelevance.id, side: 'agree', claim: 'truth is not relevance', linkageScore: 0.8, linkageType: 'STRONG_CAUSAL' },
        { parentBeliefId: main.id, beliefId: evidenceQuality.id, side: 'agree', claim: 'quality beats volume', linkageScore: 0.75, linkageType: 'STRONG_CAUSAL' },
        { parentBeliefId: main.id, beliefId: zombieUpdates.id, side: 'agree', claim: 'updates kill zombies', linkageScore: 0.7, linkageType: 'STRONG_CAUSAL' },
        { parentBeliefId: main.id, beliefId: onePage.id, side: 'agree', claim: 'one page per topic', linkageScore: 0.7, linkageType: 'CONTEXTUAL' },
        { parentBeliefId: main.id, beliefId: disputeMapping.id, side: 'agree', claim: 'maps disputes precisely', linkageScore: 0.6, linkageType: 'CONTEXTUAL' },
        { parentBeliefId: main.id, beliefId: gaming.id, side: 'disagree', claim: 'invites metric gaming', linkageScore: 0.6, linkageType: 'CONTEXTUAL' },
        { parentBeliefId: main.id, beliefId: garbageIn.id, side: 'disagree', claim: 'garbage in, garbage out', linkageScore: 0.65, linkageType: 'CONTEXTUAL' },
      ],
    })
  }

  // Evidence with provenance; the engine computes its EVS and impact.
  await prisma.evidence.deleteMany({ where: { beliefId: main.id } })
  await prisma.evidence.createMany({
    data: [
      {
        beliefId: main.id,
        side: 'supporting',
        description:
          'PageRank: link-analysis ranking outperformed keyword-counting search (Brin & Page, 1998)',
        sourceUrl: 'http://infolab.stanford.edu/~backrub/google.html',
        evidenceType: 'T1',
        replicationQuantity: 2,
        conclusionRelevance: 0.7,
        replicationPercentage: 1.0,
        linkageScore: 0.7,
        verificationStatus: 'VERIFIED',
      },
      {
        beliefId: main.id,
        side: 'weakening',
        description:
          'Goodhart-style decay: ranking signals degrade once optimized against (link farms, SEO spam)',
        sourceUrl: 'https://en.wikipedia.org/wiki/Goodhart%27s_law',
        evidenceType: 'T3',
        replicationQuantity: 1,
        conclusionRelevance: 0.6,
        replicationPercentage: 1.0,
        linkageScore: 0.6,
      },
    ],
  })

  console.log(`Seeded ranking-arguments belief #${main.id} with 9 reasons and 2 evidence rows.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
