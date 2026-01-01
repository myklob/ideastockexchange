import { prisma } from '../db'

/**
 * Logic Battleground 1: Fallacy Autopsy Theater
 * Flag and score logical fallacies in book claims
 */
export async function addFallacy(data: {
  bookId: string
  claimId?: string
  fallacyType: string
  description: string
  quote?: string
  pageNumber?: number
  flaggedBy: 'ai' | 'crowd' | 'expert'
  confidence: number
}) {
  const fallacy = await prisma.fallacy.create({
    data: {
      bookId: data.bookId,
      claimId: data.claimId,
      fallacyType: data.fallacyType,
      description: data.description,
      quote: data.quote,
      pageNumber: data.pageNumber,
      flaggedBy: data.flaggedBy,
      confidence: data.confidence,
      impactOnValidity: -12, // Default penalty
    },
  })

  // Recalculate book validity
  await recalculateAfterFallacy(data.bookId)

  return fallacy
}

async function recalculateAfterFallacy(bookId: string) {
  const fallacies = await prisma.fallacy.findMany({
    where: { bookId },
  })

  const totalImpact = fallacies.reduce((sum, f) => sum + f.impactOnValidity, 0)

  const book = await prisma.book.findUnique({
    where: { id: bookId },
  })

  if (book) {
    const adjustedValidity = Math.max(0, book.logicalValidityScore + totalImpact)
    await prisma.book.update({
      where: { id: bookId },
      data: { logicalValidityScore: adjustedValidity },
    })
  }
}

/**
 * Logic Battleground 2: Contradiction Trials
 * Identify and validate internal contradictions
 */
export async function addContradiction(data: {
  bookId: string
  claim1: string
  claim1Page?: number
  claim2: string
  claim2Page?: number
  contradictionType: 'direct' | 'implicit' | 'context_dependent'
  severity: number
}) {
  const contradiction = await prisma.contradiction.create({
    data: {
      bookId: data.bookId,
      claim1: data.claim1,
      claim1Page: data.claim1Page,
      claim2: data.claim2,
      claim2Page: data.claim2Page,
      contradictionType: data.contradictionType,
      severity: data.severity,
      impactOnIntegrity: -8, // Default penalty
    },
  })

  // Recalculate book validity
  await recalculateAfterContradiction(data.bookId)

  return contradiction
}

async function recalculateAfterContradiction(bookId: string) {
  const contradictions = await prisma.contradiction.findMany({
    where: { bookId },
  })

  const totalImpact = contradictions.reduce((sum, c) => sum + c.impactOnIntegrity, 0)

  const book = await prisma.book.findUnique({
    where: { id: bookId },
  })

  if (book) {
    const adjustedValidity = Math.max(0, book.logicalValidityScore + totalImpact)
    await prisma.book.update({
      where: { id: bookId },
      data: { logicalValidityScore: adjustedValidity },
    })
  }
}

/**
 * Logic Battleground 3: Evidence War Rooms
 * Verify and score evidence quality
 */
export async function addEvidence(data: {
  bookId: string
  claimId?: string
  evidenceType: string
  description: string
  sourceUrl?: string
  qualityTier: string
  replicationStatus?: string
  validityScore: number
  publishedDate?: Date
}) {
  return prisma.evidence.create({
    data: {
      bookId: data.bookId,
      claimId: data.claimId,
      evidenceType: data.evidenceType,
      description: data.description,
      sourceUrl: data.sourceUrl,
      qualityTier: data.qualityTier,
      replicationStatus: data.replicationStatus,
      validityScore: data.validityScore,
      publishedDate: data.publishedDate,
      lastVerified: new Date(),
    },
  })
}

/**
 * Update evidence replication status
 * This is crucial for tracking evidence that fails replication (like priming effects)
 */
export async function updateReplicationStatus(
  evidenceId: string,
  status: 'replicated' | 'failed_replication' | 'not_tested',
  newValidityScore?: number
) {
  const updates: any = {
    replicationStatus: status,
    lastVerified: new Date(),
  }

  if (newValidityScore !== undefined) {
    updates.validityScore = newValidityScore
  }

  return prisma.evidence.update({
    where: { id: evidenceId },
    data: updates,
  })
}

/**
 * Logic Battleground 4: Metaphor MRI Scans
 * Evaluate metaphor and analogy accuracy
 */
export async function addMetaphor(data: {
  bookId: string
  metaphorText: string
  pageNumber?: number
  targetConcept: string
  sourceConcept: string
  structuralSimilarity: number
  clarityScore: number
  isMisleading: boolean
}) {
  const impactOnValidity = data.isMisleading ? -10 : data.clarityScore * 5

  return prisma.metaphor.create({
    data: {
      bookId: data.bookId,
      metaphorText: data.metaphorText,
      pageNumber: data.pageNumber,
      targetConcept: data.targetConcept,
      sourceConcept: data.sourceConcept,
      structuralSimilarity: data.structuralSimilarity,
      clarityScore: data.clarityScore,
      isMisleading: data.isMisleading,
      impactOnValidity,
    },
  })
}

/**
 * Logic Battleground 5: Prediction Mortuaries
 * Track and evaluate book predictions
 */
export async function addPrediction(data: {
  bookId: string
  predictionText: string
  targetDate?: Date
  pageNumber?: number
}) {
  return prisma.prediction.create({
    data: {
      bookId: data.bookId,
      predictionText: data.predictionText,
      targetDate: data.targetDate,
      pageNumber: data.pageNumber,
      status: 'pending',
    },
  })
}

/**
 * Evaluate a prediction after target date
 */
export async function evaluatePrediction(
  predictionId: string,
  actualOutcome: string,
  accuracyScore: number,
  status: 'verified' | 'failed' | 'partially_correct'
) {
  const prediction = await prisma.prediction.update({
    where: { id: predictionId },
    data: {
      actualOutcome,
      accuracyScore,
      status,
      evaluatedAt: new Date(),
      impactOnCredibility: accuracyScore >= 70 ? 5 : -18,
    },
  })

  // Update author's prediction track record
  const book = await prisma.book.findUnique({
    where: { id: prediction.bookId },
    include: { authorProfile: true },
  })

  if (book?.authorProfile) {
    const totalPredictions = book.authorProfile.totalPredictions + 1
    const accuratePredictions =
      book.authorProfile.accuratePredictions + (accuracyScore >= 70 ? 1 : 0)

    await prisma.author.update({
      where: { id: book.authorProfile.id },
      data: {
        totalPredictions,
        accuratePredictions,
      },
    })
  }

  return prediction
}

/**
 * Logic Battleground 6: Belief Transmission Labs
 * Track spread velocity and influence
 */
export async function updateBeliefTransmission(
  bookId: string,
  salesCount: number,
  citationCount: number,
  socialShares: number
) {
  // Calculate Belief R₀ (reproduction rate)
  const totalReach = salesCount + citationCount + socialShares
  const beliefImpact = totalReach > 0 ? Math.log10(totalReach) : 0

  return prisma.book.update({
    where: { id: bookId },
    data: {
      salesCount,
      citationCount,
      socialShares,
      beliefImpactWeight: beliefImpact,
    },
  })
}

/**
 * Get validity/influence gap analysis
 * Reveals cases where weak arguments spread faster than strong ones
 */
export async function getValidityInfluenceGap(topicName: string) {
  const books = await prisma.book.findMany({
    where: {
      topicOverlaps: {
        some: {
          topicName,
          overlapScore: { gte: 50 },
        },
      },
    },
    include: {
      topicOverlaps: {
        where: { topicName },
      },
    },
  })

  return books.map(book => ({
    id: book.id,
    title: book.title,
    author: book.author,
    validityScore: book.logicalValidityScore,
    influenceScore: book.beliefImpactWeight,
    gap: book.beliefImpactWeight - book.logicalValidityScore / 10, // Normalize for comparison
    socialShares: book.socialShares,
  }))
}
