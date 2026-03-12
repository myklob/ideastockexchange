import { prisma } from '@/lib/prisma'
import type { ProductReviewWithRelations } from '../types'

const productReviewInclude = {
  belief: {
    include: {
      arguments: {
        include: {
          belief: {
            select: { id: true, slug: true, statement: true, positivity: true },
          },
        },
        orderBy: { impactScore: 'desc' as const },
      },
      evidence: { orderBy: { impactScore: 'desc' as const } },
      objectiveCriteria: { orderBy: { totalScore: 'desc' as const } },
      valuesAnalysis: true,
      interestsAnalysis: true,
      assumptions: true,
      costBenefitAnalysis: true,
      impactAnalysis: true,
      compromises: true,
      obstacles: true,
      biases: true,
      mediaResources: true,
      legalEntries: true,
      upstreamMappings: {
        include: {
          parentBelief: { select: { id: true, slug: true, statement: true } },
          childBelief: { select: { id: true, slug: true, statement: true } },
        },
      },
      downstreamMappings: {
        include: {
          parentBelief: { select: { id: true, slug: true, statement: true } },
          childBelief: { select: { id: true, slug: true, statement: true } },
        },
      },
      similarTo: {
        include: {
          fromBelief: { select: { id: true, slug: true, statement: true } },
          toBelief: { select: { id: true, slug: true, statement: true } },
        },
      },
      similarFrom: {
        include: {
          fromBelief: { select: { id: true, slug: true, statement: true } },
          toBelief: { select: { id: true, slug: true, statement: true } },
        },
      },
    },
  },
  performanceData: true,
  tradeoffs: true,
  alternatives: true,
  userProfiles: true,
  awards: true,
  ecosystemItems: true,
}

/** Fetch a product review by slug with all relations */
export async function fetchProductReviewBySlug(slug: string): Promise<ProductReviewWithRelations | null> {
  const review = await prisma.productReview.findUnique({
    where: { slug },
    include: productReviewInclude,
  })
  return review as ProductReviewWithRelations | null
}

/** Fetch a product review by ID */
export async function fetchProductReviewById(id: number): Promise<ProductReviewWithRelations | null> {
  const review = await prisma.productReview.findUnique({
    where: { id },
    include: productReviewInclude,
  })
  return review as ProductReviewWithRelations | null
}

/** List all product reviews (for the index page) */
export async function fetchAllProductReviews() {
  return prisma.productReview.findMany({
    select: {
      id: true,
      slug: true,
      productName: true,
      brand: true,
      claim: true,
      categoryType: true,
      categorySubtype: true,
      overallScore: true,
      categoryRank: true,
    },
    orderBy: [
      { categoryType: 'asc' },
      { overallScore: 'desc' },
    ],
  })
}

/** Fetch all product reviews in a specific category with full relations */
export async function fetchProductReviewsByCategory(categoryType: string): Promise<ProductReviewWithRelations[]> {
  const reviews = await prisma.productReview.findMany({
    where: { categoryType },
    include: productReviewInclude,
    orderBy: { overallScore: 'desc' },
  })
  return reviews as ProductReviewWithRelations[]
}

/** Fetch all product reviews with full relations (for scoring) */
export async function fetchAllProductReviewsFull(): Promise<ProductReviewWithRelations[]> {
  const reviews = await prisma.productReview.findMany({
    include: productReviewInclude,
    orderBy: [
      { categoryType: 'asc' },
      { overallScore: 'desc' },
    ],
  })
  return reviews as ProductReviewWithRelations[]
}

/** Get all distinct categories */
export async function fetchCategories() {
  const results = await prisma.productReview.findMany({
    select: {
      categoryType: true,
    },
    distinct: ['categoryType'],
    orderBy: { categoryType: 'asc' },
  })
  return results.map(r => r.categoryType)
}

/** Update a product review's score and rank */
export async function updateProductReviewScore(id: number, overallScore: number, categoryRank: number | null) {
  return prisma.productReview.update({
    where: { id },
    data: { overallScore, categoryRank },
  })
}
