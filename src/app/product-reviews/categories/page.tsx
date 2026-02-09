import Link from 'next/link'
import { fetchAllProductReviewsFull } from '@/features/product-reviews/data/fetch-product-reviews'
import { rankProductsInCategory } from '@/core/scoring/product-review-scoring'

export default async function CategoryRankingsPage() {
  const reviews = await fetchAllProductReviewsFull()
  const rankings = rankProductsInCategory(reviews)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <Link href="/product-reviews" className="text-sm text-[var(--accent)] hover:underline">Product Reviews</Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <span className="text-sm text-[var(--foreground)] font-medium">Category Rankings</span>
          </div>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Best Product by Category
        </h1>
        <p className="text-gray-600 mb-8">
          Products ranked within each category using ReasonRank scoring. Rankings are determined by
          argument tree analysis, evidence quality assessment, and performance comparison metrics.
        </p>

        {rankings.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">No product reviews have been created yet.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {rankings.map((category) => {
              const bestProduct = category.products[0]
              return (
                <section key={category.categoryType}>
                  <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                    Best {category.categoryType}
                  </h2>

                  {/* Winner highlight */}
                  {bestProduct && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold uppercase text-green-600 tracking-wider">#1 in {category.categoryType}</span>
                          <h3 className="text-xl font-bold mt-1">
                            <Link href={`/product-reviews/${bestProduct.slug}`} className="text-[var(--accent)] hover:underline">
                              {bestProduct.productName}
                            </Link>
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">by {bestProduct.brand}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-green-600">
                            {bestProduct.overallScore >= 0 ? '+' : ''}{bestProduct.overallScore.toFixed(1)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">Overall Score</p>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-4 text-sm text-gray-600">
                        <span>
                          <span className="text-green-600 font-medium">{bestProduct.performanceSummary.betterCount}</span> better
                        </span>
                        <span>
                          <span className="font-medium">{bestProduct.performanceSummary.sameCount}</span> same
                        </span>
                        <span>
                          <span className="text-red-600 font-medium">{bestProduct.performanceSummary.worseCount}</span> worse
                        </span>
                        <span className="text-gray-400">|</span>
                        <span>Avg Evidence Tier: {bestProduct.performanceSummary.avgEvidenceTier.toFixed(1)}</span>
                      </div>
                    </div>
                  )}

                  {/* Full ranking table */}
                  {category.products.length > 1 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold w-12">Rank</th>
                            <th className="text-left px-4 py-3 font-semibold">Product</th>
                            <th className="text-left px-4 py-3 font-semibold">Brand</th>
                            <th className="text-right px-4 py-3 font-semibold">Score</th>
                            <th className="text-right px-4 py-3 font-semibold">Better/Same/Worse</th>
                            <th className="text-right px-4 py-3 font-semibold">Avg Evidence Tier</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.products.map((product) => {
                            const scoreColor = product.overallScore >= 20 ? 'text-green-600' :
                              product.overallScore >= 0 ? 'text-lime-600' :
                              product.overallScore >= -20 ? 'text-yellow-600' :
                              'text-red-600'

                            return (
                              <tr key={product.id} className="border-t border-gray-200">
                                <td className="px-4 py-3 font-bold text-gray-500">
                                  #{product.categoryRank}
                                </td>
                                <td className="px-4 py-3">
                                  <Link href={`/product-reviews/${product.slug}`} className="text-[var(--accent)] hover:underline font-medium">
                                    {product.productName}
                                  </Link>
                                  {product.categorySubtype && (
                                    <span className="text-xs text-gray-500 ml-2">({product.categorySubtype})</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">{product.brand}</td>
                                <td className={`px-4 py-3 text-right font-bold ${scoreColor}`}>
                                  {product.overallScore >= 0 ? '+' : ''}{product.overallScore.toFixed(1)}
                                </td>
                                <td className="px-4 py-3 text-right text-xs">
                                  <span className="text-green-600">{product.performanceSummary.betterCount}</span>
                                  {' / '}
                                  <span>{product.performanceSummary.sameCount}</span>
                                  {' / '}
                                  <span className="text-red-600">{product.performanceSummary.worseCount}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {product.performanceSummary.avgEvidenceTier.toFixed(1)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
