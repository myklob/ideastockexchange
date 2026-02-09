import { NextResponse } from 'next/server'
import { fetchAllProductReviewsFull } from '@/features/product-reviews/data/fetch-product-reviews'
import { rankProductsInCategory } from '@/core/scoring/product-review-scoring'

export async function GET() {
  const reviews = await fetchAllProductReviewsFull()
  const rankings = rankProductsInCategory(reviews)

  return NextResponse.json({
    totalReviews: reviews.length,
    categories: rankings,
  })
}
