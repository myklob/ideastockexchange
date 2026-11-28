import Link from 'next/link'
import type { ProductReviewScores } from '../types'

interface ProductScoreHeaderProps {
  productName: string
  brand: string
  claim: string
  /** Title scope: "[Product] is the best [Product Type] for [useCase]". */
  useCase: string | null
  priceSegment: string | null
  categoryType: string
  categorySubtype: string | null
  scores: ProductReviewScores
}

export default function ProductScoreHeader({
  productName,
  brand,
  claim,
  useCase,
  priceSegment,
  categoryType,
  categorySubtype,
  scores,
}: ProductScoreHeaderProps) {
  const scoreColor = scores.overallScore >= 20 ? '#22c55e' :
    scores.overallScore >= 0 ? '#84cc16' :
    scores.overallScore >= -20 ? '#eab308' :
    '#ef4444'

  // THE TITLE MUST CARRY A SCOPE: bare "best" fails the costability test
  // (compared to what, measured in what, for whom).
  const title = useCase
    ? `${productName} is the best ${categoryType.replace(/s$/, '').toLowerCase()} for ${useCase}`
    : claim

  return (
    <div className="mb-8">
      <p className="text-right text-xs text-[var(--muted-foreground)] mb-2">
        <Link href="/" className="text-[var(--accent)] hover:underline">Home</Link> ›{' '}
        <Link href="/product-reviews" className="text-[var(--accent)] hover:underline">Topics</Link> ›{' '}
        {categoryType} › <strong>{productName}</strong>
      </p>

      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3 leading-tight">{title}</h1>

      <p className="text-sm mb-1">
        <strong>Net Belief Score:</strong>{' '}
        <span
          className="px-2.5 py-0.5 bg-[#e8eef5] border border-[#b0b8c1] font-semibold"
          style={{ color: scoreColor }}
        >
          {scores.overallScore >= 0 ? '+' : ''}{scores.overallScore.toFixed(1)}
        </span>{' '}
        <span className="text-xs text-[var(--muted-foreground)]">(computed from argument scores)</span>
        {' '}|{' '}
        <Link href="/how-it-works" className="text-[var(--accent)] hover:underline font-semibold">
          Category
        </Link>:{' '}
        <Link
          href={`/product-reviews/categories?type=${encodeURIComponent(categoryType)}`}
          className="text-[var(--accent)] hover:underline"
        >
          {categoryType}
        </Link>
        {categorySubtype && <> &gt; {categorySubtype}</>}
        {' '}&gt; {brand} / {productName}
        {priceSegment && (
          <>
            {' '}| <strong>Price segment:</strong> {priceSegment}
          </>
        )}
        {scores.categoryRank != null && (
          <>
            {' '}| <strong>Category rank:</strong> #{scores.categoryRank}
            {scores.totalInCategory > 0 && <span className="text-[var(--muted-foreground)]"> of {scores.totalInCategory}</span>}
          </>
        )}
      </p>

      <p className="text-xs text-[#555]">
        Method:{' '}
        <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">Linkage Scores</Link>
        {' '}·{' '}
        <Link href="/algorithms/reason-rank" className="text-[var(--accent)] hover:underline">
          Argument scores from sub-argument scores
        </Link>
        {' '}·{' '}
        <Link href="/cba/about" className="text-[var(--accent)] hover:underline">Cost-Benefit Analysis</Link>
        . Unscored cells stay blank until the engine computes them.
      </p>
    </div>
  )
}
