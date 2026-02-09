import { NextResponse } from 'next/server'
import { fetchProductReviewById } from '@/features/product-reviews/data/fetch-product-reviews'
import { scoreProductReview } from '@/core/scoring/product-review-scoring'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const reviewId = parseInt(id, 10)

  if (isNaN(reviewId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const review = await fetchProductReviewById(reviewId)

  if (!review) {
    return NextResponse.json({ error: 'Product review not found' }, { status: 404 })
  }

  const scores = scoreProductReview(review)

  return NextResponse.json({
    review,
    scores,
  })
}
