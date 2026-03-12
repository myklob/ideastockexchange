import { NextResponse } from 'next/server'
import { fetchAllProductReviewsFull } from '@/features/product-reviews/data/fetch-product-reviews'
import { rankProductsInCategory } from '@/core/scoring/product-review-scoring'

export async function GET() {
  const reviews = await fetchAllProductReviewsFull()
  const rankings = rankProductsInCategory(reviews)

  // Find the best product in each category
  const bestByCategory = rankings.map(category => ({
    category: category.categoryType,
    bestProduct: category.products[0] ?? null,
    totalProducts: category.products.length,
    allProducts: category.products,
  }))

  return NextResponse.json({
    totalCategories: rankings.length,
    totalProducts: reviews.length,
    bestByCategory,
  })
}
