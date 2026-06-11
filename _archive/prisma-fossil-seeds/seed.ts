import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create Authors
  const shakespeare = await prisma.author.upsert({
    where: { name: 'William Shakespeare' },
    update: {},
    create: {
      name: 'William Shakespeare',
      bio: 'English playwright, poet, and actor, widely regarded as the greatest writer in the English language.',
      truthEquityScore: 98,
      totalBooks: 1,
      avgBookValidity: 98,
    },
  })

  const kahneman = await prisma.author.upsert({
    where: { name: 'Daniel Kahneman' },
    update: {},
    create: {
      name: 'Daniel Kahneman',
      bio: 'Nobel Prize-winning psychologist and economist, known for work on judgment, decision-making, and behavioral economics.',
      truthEquityScore: 88,
      totalBooks: 1,
      avgBookValidity: 88,
      totalPredictions: 5,
      accuratePredictions: 4,
    },
  })

  const gladwell = await prisma.author.upsert({
    where: { name: 'Malcolm Gladwell' },
    update: {},
    create: {
      name: 'Malcolm Gladwell',
      bio: 'Canadian journalist and author, known for books exploring social psychology, sociology, and behavioral economics.',
      truthEquityScore: 72,
      totalBooks: 1,
      avgBookValidity: 72,
    },
  })

  const marxEngels = await prisma.author.upsert({
    where: { name: 'Karl Marx & Friedrich Engels' },
    update: {},
    create: {
      name: 'Karl Marx & Friedrich Engels',
      bio: 'Philosophers, economists, and political theorists who co-authored The Communist Manifesto.',
      truthEquityScore: 65,
      totalBooks: 1,
      avgBookValidity: 65,
      totalPredictions: 8,
      accuratePredictions: 3,
    },
  })

  // Create Book 1: Hamlet
  console.log('Creating Hamlet...')
  const hamlet = await prisma.book.create({
    data: {
      title: 'Hamlet',
      author: 'William Shakespeare',
      publishYear: 1603,
      description:
        'A tragedy about Prince Hamlet\'s quest to avenge his father\'s murder, exploring themes of revenge, mortality, madness, and political corruption.',
      logicalValidityScore: 98,
      qualityScore: 98,
      beliefImpactWeight: 8.5,
      salesCount: 100000000,
      citationCount: 5000000,
      socialShares: 2000000,
      authorId: shakespeare.id,
    },
  })

  await prisma.topicOverlap.createMany({
    data: [
      { bookId: hamlet.id, topicName: 'Revenge', overlapScore: 95, pagesDevoted: 120 },
      { bookId: hamlet.id, topicName: 'Mortality', overlapScore: 90, pagesDevoted: 80 },
      { bookId: hamlet.id, topicName: 'Madness', overlapScore: 85, pagesDevoted: 70 },
      { bookId: hamlet.id, topicName: 'Political Corruption', overlapScore: 80, pagesDevoted: 60 },
    ],
  })

  // Create Book 2: Thinking, Fast and Slow
  console.log('Creating Thinking, Fast and Slow...')
  const thinkingFastSlow = await prisma.book.create({
    data: {
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      publishYear: 2011,
      description:
        'A synthesis of Kahneman\'s research on cognitive biases, heuristics, and two modes of thought: fast, intuitive thinking and slow, deliberate thinking.',
      logicalValidityScore: 88,
      qualityScore: 92,
      beliefImpactWeight: 6.85,
      salesCount: 5000000,
      citationCount: 50000,
      socialShares: 2000000,
      authorId: kahneman.id,
    },
  })

  await prisma.topicOverlap.createMany({
    data: [
      { bookId: thinkingFastSlow.id, topicName: 'Cognitive Biases', overlapScore: 95 },
      { bookId: thinkingFastSlow.id, topicName: 'Decision Making', overlapScore: 92 },
      { bookId: thinkingFastSlow.id, topicName: 'Statistical Reasoning', overlapScore: 88 },
      { bookId: thinkingFastSlow.id, topicName: 'Psychology', overlapScore: 85 },
    ],
  })

  // Add claims for Thinking, Fast and Slow
  const claim1 = await prisma.claim.create({
    data: {
      bookId: thinkingFastSlow.id,
      content: 'Cognitive biases systematically affect human judgment and decision-making',
      pageNumber: 25,
      centralityWeight: 1.0,
      centralityType: 'thesis',
      validityScore: 92,
      aiConfidence: 0.95,
      crowdConsensus: 0.9,
      expertWeighting: 0.95,
    },
  })

  const claim2 = await prisma.claim.create({
    data: {
      bookId: thinkingFastSlow.id,
      content: 'Priming effects significantly influence behavior',
      pageNumber: 52,
      centralityWeight: 0.7,
      centralityType: 'major',
      validityScore: 60,
      aiConfidence: 0.7,
      crowdConsensus: 0.55,
      expertWeighting: 0.5,
    },
  })

  // Add evidence with replication issues
  await prisma.evidence.create({
    data: {
      bookId: thinkingFastSlow.id,
      claimId: claim2.id,
      evidenceType: 'peer_reviewed',
      description: 'Original priming studies from 1990s',
      qualityTier: 'tier1_peer_reviewed',
      replicationStatus: 'failed_replication',
      validityScore: 60,
      publishedDate: new Date('1996-01-01'),
      lastVerified: new Date('2015-01-01'),
    },
  })

  // Add fallacy example
  await prisma.fallacy.create({
    data: {
      bookId: thinkingFastSlow.id,
      fallacyType: 'cherry_picking',
      description: 'Some anecdotal examples may not represent broader patterns',
      flaggedBy: 'crowd',
      confidence: 0.7,
      impactOnValidity: -2,
    },
  })

  // Create Book 3: Outliers
  console.log('Creating Outliers...')
  const outliers = await prisma.book.create({
    data: {
      title: 'Outliers',
      author: 'Malcolm Gladwell',
      publishYear: 2008,
      description:
        'Explores the factors that contribute to high levels of success, including the 10,000-hour rule, cultural legacy, and environmental advantages.',
      logicalValidityScore: 72,
      qualityScore: 85,
      beliefImpactWeight: 6.7,
      salesCount: 4000000,
      citationCount: 30000,
      socialShares: 1000000,
      authorId: gladwell.id,
    },
  })

  await prisma.topicOverlap.createMany({
    data: [
      { bookId: outliers.id, topicName: 'Success', overlapScore: 95 },
      { bookId: outliers.id, topicName: 'Practice and Mastery', overlapScore: 85 },
      { bookId: outliers.id, topicName: 'Cultural Legacy', overlapScore: 70 },
      { bookId: outliers.id, topicName: 'Environmental Factors', overlapScore: 75 },
    ],
  })

  // Add fallacies for Outliers
  await prisma.fallacy.createMany({
    data: [
      {
        bookId: outliers.id,
        fallacyType: 'post_hoc',
        description: 'Assumes causation from correlation in birth month analysis',
        quote: 'Hockey players born in early months are more successful',
        pageNumber: 20,
        flaggedBy: 'crowd',
        confidence: 0.8,
        impactOnValidity: -12,
      },
      {
        bookId: outliers.id,
        fallacyType: 'cherry_picking',
        description: 'Selective use of success stories without counter-examples',
        flaggedBy: 'expert',
        confidence: 0.75,
        impactOnValidity: -8,
      },
    ],
  })

  // Add metaphor
  await prisma.metaphor.create({
    data: {
      bookId: outliers.id,
      metaphorText: 'Success is like a plant that needs the right soil, water, and sunlight',
      targetConcept: 'Success factors',
      sourceConcept: 'Plant growth',
      structuralSimilarity: 0.7,
      clarityScore: 0.8,
      isMisleading: false,
      impactOnValidity: 4,
    },
  })

  // Create Book 4: The Communist Manifesto
  console.log('Creating The Communist Manifesto...')
  const manifesto = await prisma.book.create({
    data: {
      title: 'The Communist Manifesto',
      author: 'Karl Marx & Friedrich Engels',
      publishYear: 1848,
      description:
        'A political pamphlet that analyzes class struggle and the problems of capitalism, advocating for a communist revolution.',
      logicalValidityScore: 65,
      qualityScore: 78,
      beliefImpactWeight: 9.2,
      salesCount: 500000000,
      citationCount: 10000000,
      socialShares: 5000000,
      authorId: marxEngels.id,
    },
  })

  await prisma.topicOverlap.createMany({
    data: [
      { bookId: manifesto.id, topicName: 'Class Struggle', overlapScore: 98 },
      { bookId: manifesto.id, topicName: 'Economic Systems', overlapScore: 95 },
      { bookId: manifesto.id, topicName: 'Revolution', overlapScore: 92 },
      { bookId: manifesto.id, topicName: 'Labor Rights', overlapScore: 88 },
    ],
  })

  // Add predictions for The Communist Manifesto
  await prisma.prediction.createMany({
    data: [
      {
        bookId: manifesto.id,
        predictionText: 'Capitalism will lead to increasing wealth inequality',
        targetDate: new Date('2000-01-01'),
        status: 'verified',
        actualOutcome: 'Wealth inequality has increased in many capitalist countries',
        accuracyScore: 85,
        impactOnCredibility: 5,
        evaluatedAt: new Date('2020-01-01'),
      },
      {
        bookId: manifesto.id,
        predictionText: 'The proletariat will overthrow the bourgeoisie globally',
        targetDate: new Date('1950-01-01'),
        status: 'partially_correct',
        actualOutcome:
          'Communist revolutions occurred in some countries but not globally as predicted',
        accuracyScore: 40,
        impactOnCredibility: -10,
        evaluatedAt: new Date('2000-01-01'),
      },
    ],
  })

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
