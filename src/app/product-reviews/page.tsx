import Link from 'next/link'
import { fetchAllProductReviews } from '@/features/product-reviews/data/fetch-product-reviews'

export default async function ProductReviewsPage() {
  const reviews = await fetchAllProductReviews()

  // Group by category
  const categories = new Map<string, typeof reviews>()
  for (const review of reviews) {
    const existing = categories.get(review.categoryType) ?? []
    existing.push(review)
    categories.set(review.categoryType, existing)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <span className="text-sm text-[var(--foreground)] font-medium">Product Reviews</span>
          </div>
          <Link
            href="/product-reviews/categories"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            View Category Rankings
          </Link>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Product Reviews
        </h1>
        <p className="text-gray-600 mb-8">
          Evidence-based product analysis using the Idea Stock Exchange framework.
          Each review is backed by argument trees, evidence quality scoring, and ReasonRank analysis.
        </p>

        {reviews.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">No product reviews have been created yet.</p>
            <p className="text-sm text-gray-500">
              Product reviews use the same argument tree and scoring system as beliefs.
              Each product claim (e.g., &quot;Ford makes the best trucks&quot;) is analyzed through
              pro/con arguments, evidence quality assessment, and category comparisons.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {Array.from(categories.entries()).map(([categoryType, categoryReviews]) => (
              <section key={categoryType}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    {categoryType}
                  </h2>
                  <Link
                    href={`/product-reviews/categories?type=${encodeURIComponent(categoryType)}`}
                    className="text-sm text-[var(--accent)] hover:underline"
                  >
                    View Rankings
                  </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {categoryReviews.map((review) => {
                    const scoreColor = review.overallScore >= 20 ? 'text-green-600' :
                      review.overallScore >= 0 ? 'text-lime-600' :
                      review.overallScore >= -20 ? 'text-yellow-600' :
                      'text-red-600'

                    return (
                      <Link
                        key={review.id}
                        href={`/product-reviews/${review.slug}`}
                        className="block p-5 border border-gray-200 rounded-lg hover:border-[var(--accent)] transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-[var(--accent)]">
                            {review.brand}
                          </span>
                          {review.categoryRank != null && (
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium">
                              #{review.categoryRank} in {review.categoryType}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold mb-1">{review.productName}</h3>
                        <p className="text-sm text-gray-600 mb-3">{review.claim}</p>

                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${scoreColor}`}>
                            Score: {review.overallScore >= 0 ? '+' : ''}{review.overallScore.toFixed(1)}
                          </span>
                          {review.categorySubtype && (
                            <span className="text-xs text-gray-500">{review.categorySubtype}</span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
