// @ts-nocheck
// Book models depend on a schema that is not active in the current SQLite setup.
// This file is retained for future migration to the full schema.
import { prisma } from '@/lib/prisma'
import {
  calculateWeightedValidity,
  calculateBeliefImpact,
  calculateAverageValidity,
  getValidityDistribution,
  calculateTruthEquity,
} from '@/core/scoring/book-scoring'
import { BookAnalysisReport } from '@/core/types/book'

/**
 * Get comprehensive book analysis report
 */
export async function getBookAnalysisReport(bookId: string): Promise<BookAnalysisReport | null> {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      claims: true,
      topicOverlaps: true,
      fallacies: true,
      contradictions: true,
      evidenceItems: true,
      metaphors: true,
      predictions: true,
      authorProfile: true,
    },
  })

  if (!book) return null

  // Calculate claim analysis
  const validityDistribution = getValidityDistribution(book.claims)
  const averageValidity = calculateAverageValidity(book.claims)

  // Calculate evidence quality breakdown
  const evidenceQuality = {
    tier1: book.evidenceItems.filter(e => e.qualityTier === 'tier1_peer_reviewed').length,
    tier2: book.evidenceItems.filter(e => e.qualityTier === 'tier2_statistical').length,
    tier3: book.evidenceItems.filter(e => e.qualityTier === 'tier3_anecdotal').length,
    tier4: book.evidenceItems.filter(e => e.qualityTier === 'tier4_speculation').length,
  }

  // Calculate metaphor accuracy
  const metaphorAccuracy =
    book.metaphors.length > 0
      ? book.metaphors.reduce((sum, m) => sum + m.structuralSimilarity, 0) / book.metaphors.length
      : 0

  // Calculate prediction accuracy
  const completedPredictions = book.predictions.filter(p => p.accuracyScore !== null)
  const predictionAccuracy =
    completedPredictions.length > 0
      ? completedPredictions.reduce((sum, p) => sum + (p.accuracyScore || 0), 0) / completedPredictions.length
      : null

  // Get author credibility
  const authorCredibility = book.authorProfile
    ? {
        truthEquityScore: book.authorProfile.truthEquityScore,
        predictionTrackRecord:
          book.authorProfile.totalPredictions > 0
            ? (book.authorProfile.accuratePredictions / book.authorProfile.totalPredictions) * 100
            : 0,
      }
    : {
        truthEquityScore: 50,
        predictionTrackRecord: 0,
      }

  return {
    book: {
      id: book.id,
      title: book.title,
      author: book.author,
      publishYear: book.publishYear || undefined,
    },
    scores: {
      logicalValidityScore: book.logicalValidityScore,
      qualityScore: book.qualityScore,
      topicOverlapScore: 0, // This is per-belief, so we don't have a single value
      beliefImpactWeight: book.beliefImpactWeight,
    },
    claimAnalysis: {
      totalClaims: book.claims.length,
      averageValidity,
      validityDistribution,
    },
    logicBattlegrounds: {
      fallacyCount: book.fallacies.length,
      contradictionCount: book.contradictions.length,
      evidenceQuality,
      metaphorAccuracy,
      predictionAccuracy,
    },
    topicBreakdown: book.topicOverlaps.map(t => ({
      topic: t.topicName,
      overlapScore: t.overlapScore,
    })),
    authorCredibility,
  }
}

/**
 * Recalculate book's logical validity score based on all claims
 */
export async function recalculateBookValidity(bookId: string): Promise<number> {
  const claims = await prisma.claim.findMany({
    where: { bookId },
    select: {
      validityScore: true,
      centralityWeight: true,
    },
  })

  const weightedValidity = calculateWeightedValidity(claims)

  await prisma.book.update({
    where: { id: bookId },
    data: { logicalValidityScore: weightedValidity },
  })

  return weightedValidity
}

/**
 * Update book's belief impact weight based on reach metrics
 */
export async function updateBeliefImpact(
  bookId: string,
  sales: number,
  citations: number,
  socialShares: number
): Promise<number> {
  const beliefImpact = calculateBeliefImpact({ sales, citations, socialShares })

  await prisma.book.update({
    where: { id: bookId },
    data: {
      salesCount: sales,
      citationCount: citations,
      socialShares: socialShares,
      beliefImpactWeight: beliefImpact,
    },
  })

  return beliefImpact
}

/**
 * Update author's truth equity score
 */
export async function updateAuthorTruthEquity(authorId: string): Promise<number> {
  const author = await prisma.author.findUnique({
    where: { id: authorId },
    include: {
      books: {
        select: {
          logicalValidityScore: true,
        },
      },
    },
  })

  if (!author) return 0

  const totalBooks = author.books.length
  const avgBookValidity =
    totalBooks > 0
      ? author.books.reduce((sum, b) => sum + b.logicalValidityScore, 0) / totalBooks
      : 0

  const truthEquity = calculateTruthEquity(
    totalBooks,
    avgBookValidity,
    author.accuratePredictions,
    author.totalPredictions
  )

  await prisma.author.update({
    where: { id: authorId },
    data: {
      truthEquityScore: truthEquity,
      totalBooks,
      avgBookValidity,
    },
  })

  return truthEquity
}

/**
 * Get all books with their analysis scores
 */
export async function getAllBooksWithScores() {
  return prisma.book.findMany({
    include: {
      topicOverlaps: true,
      authorProfile: true,
      _count: {
        select: {
          claims: true,
          fallacies: true,
          contradictions: true,
        },
      },
    },
    orderBy: {
      logicalValidityScore: 'desc',
    },
  })
}

/**
 * Get books by topic overlap
 */
export async function getBooksByTopic(topicName: string, minOverlap: number = 50) {
  return prisma.book.findMany({
    where: {
      topicOverlaps: {
        some: {
          topicName,
          overlapScore: {
            gte: minOverlap,
          },
        },
      },
    },
    include: {
      topicOverlaps: {
        where: {
          topicName,
        },
      },
      authorProfile: true,
    },
    orderBy: {
      logicalValidityScore: 'desc',
    },
  })
}
