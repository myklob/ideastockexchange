import Link from 'next/link'
import type { ProductReviewScores } from '../types'

interface ProductScoreHeaderProps {
  productName: string
  brand: string
  claim: string
  categoryType: string
  categorySubtype: string | null
  scores: ProductReviewScores
}

export default function ProductScoreHeader({
  productName,
  brand,
  claim,
  categoryType,
  categorySubtype,
  scores,
}: ProductScoreHeaderProps) {
  const scoreColor = scores.overallScore >= 20 ? '#22c55e' :
    scores.overallScore >= 0 ? '#84cc16' :
    scores.overallScore >= -20 ? '#eab308' :
    '#ef4444'

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
        You should Buy This Product: {productName}
      </h1>
      <p className="text-gray-600 mb-4 italic">{claim}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-semibold">Score:</span>{' '}
            <span style={{ color: scoreColor }} className="font-bold text-lg">
              {scores.overallScore >= 0 ? '+' : ''}{scores.overallScore.toFixed(1)}
            </span>
            {' '}
            <Link
              href="/Argument%20scores%20from%20sub-argument%20scores"
              className="text-xs text-[var(--accent)] hover:underline"
            >
              (based on argument scores)
            </Link>
          </p>
          <p className="text-sm">
            <Link href="/One%20Page%20Per%20Topic" className="text-[var(--accent)] hover:underline font-semibold">
              Category
            </Link>:{' '}
            <Link href={`/product-reviews/categories?type=${encodeURIComponent(categoryType)}`} className="text-[var(--accent)] hover:underline">
              {categoryType}
            </Link>
            {categorySubtype && <> &gt; {categorySubtype}</>}
            {' '}&gt; {brand} / {productName}
          </p>
        </div>

        <div className="space-y-2 text-right">
          {scores.categoryRank != null && (
            <p className="text-sm">
              <span className="font-semibold">Category Rank:</span>{' '}
              <span className="font-bold text-lg">
                #{scores.categoryRank}
              </span>
              {scores.totalInCategory > 0 && (
                <span className="text-gray-500"> of {scores.totalInCategory}</span>
              )}
            </p>
          )}
          <p className="text-sm">
            <span className="font-semibold">Avg Evidence Tier:</span>{' '}
            {scores.avgEvidenceTier.toFixed(1)}
            <span className="text-gray-500 text-xs ml-1">(lower is better)</span>
          </p>
          <p className="text-sm">
            <span className="text-green-600">{scores.performanceBetterCount} better</span>
            {' / '}
            <span className="text-gray-600">{scores.performanceSameCount} same</span>
            {' / '}
            <span className="text-red-600">{scores.performanceWorseCount} worse</span>
            <span className="text-gray-500 text-xs ml-1"> vs category avg</span>
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        This template structures every product review in the Idea Stock Exchange. Each section helps build
        a complete analysis from multiple angles.{' '}
        <a
          href="https://github.com/myklob/ideastockexchange"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] hover:underline"
        >
          View the full technical documentation on GitHub
        </a>.
      </p>
    </div>
  )
}
