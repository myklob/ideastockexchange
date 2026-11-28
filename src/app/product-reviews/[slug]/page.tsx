/**
 * Product Review Page — the consumer-market sibling of the belief page. This
 * IS a belief page for one product claim, and the title carries a scope:
 * "[Product] is the best [Product Type] for [use case]" — bare "best" fails
 * the costability test (compared to what, measured in what, for whom).
 *
 * CRITERIA BEFORE BRANDS: the Category Criteria table renders before
 * performance or arguments; the criteria apply to every product in the
 * category and are the yardstick the rest of the page measures against.
 *
 * Route: /product-reviews/[slug]
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchProductReviewBySlug, fetchCategoryCriteria } from '@/features/product-reviews/data/fetch-product-reviews'
import { scoreProductReview } from '@/core/scoring/product-review-scoring'
import ProductScoreHeader from '@/features/product-reviews/components/ProductScoreHeader'
import ProductScorecardSection from '@/features/product-reviews/components/ProductScorecardSection'
import CategoryCriteriaSection from '@/features/product-reviews/components/CategoryCriteriaSection'
import PerformanceSection from '@/features/product-reviews/components/PerformanceSection'
import TradeoffsSection from '@/features/product-reviews/components/TradeoffsSection'
import RecommenderInterestsSection from '@/features/product-reviews/components/RecommenderInterestsSection'
import AlternativesSection from '@/features/product-reviews/components/AlternativesSection'
import OwnershipSection from '@/features/product-reviews/components/OwnershipSection'
import UserProfilesSection from '@/features/product-reviews/components/UserProfilesSection'
import DecisionObstaclesSection from '@/features/product-reviews/components/DecisionObstaclesSection'
import AwardsSection from '@/features/product-reviews/components/AwardsSection'
import EcosystemSection from '@/features/product-reviews/components/EcosystemSection'
// Reuse belief analysis components for shared sections
import ArgumentTreesSection from '@/features/belief-analysis/components/ArgumentTreesSection'
import AssumptionsSection from '@/features/belief-analysis/components/AssumptionsSection'
import BiasesSection from '@/features/belief-analysis/components/BiasesSection'
import MediaResourcesSection from '@/features/belief-analysis/components/MediaResourcesSection'

interface ProductReviewPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductReviewPage({ params }: ProductReviewPageProps) {
  const { slug } = await params
  const review = await fetchProductReviewBySlug(decodeURIComponent(slug))

  if (!review) {
    notFound()
  }

  const [scores, categoryCriteria] = await Promise.all([
    Promise.resolve(scoreProductReview(review)),
    fetchCategoryCriteria(review.categoryType),
  ])
  const belief = review.belief

  let totalPro = 0
  let totalCon = 0
  if (belief) {
    totalPro = belief.arguments.filter(a => a.side === 'agree').reduce((s, a) => s + Math.abs(a.impactScore), 0)
    totalCon = belief.arguments.filter(a => a.side === 'disagree').reduce((s, a) => s + Math.abs(a.impactScore), 0)
  }

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
            <span className="text-sm text-[var(--muted-foreground)] truncate max-w-[300px]">{review.productName}</span>
          </div>
          <Link
            href={`/api/product-reviews/${review.id}`}
            className="text-xs font-mono text-[var(--muted-foreground)] hover:text-[var(--accent)] border border-[var(--border)] px-2 py-1 rounded"
          >
            View JSON
          </Link>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]">
        {/* Header: scoped title, net belief score, category, price segment */}
        <ProductScoreHeader
          productName={review.productName}
          brand={review.brand}
          claim={review.claim}
          useCase={review.useCase ?? null}
          priceSegment={review.priceSegment ?? null}
          categoryType={review.categoryType}
          categorySubtype={review.categorySubtype}
          scores={scores}
        />

        <div className="space-y-12">
          {/* 1. Scorecard — auto-derived from the tables below */}
          <ProductScorecardSection review={review} />
          <hr className="border-gray-200" />

          {/* 2. Category Criteria — CRITERIA BEFORE BRANDS */}
          <CategoryCriteriaSection categoryType={review.categoryType} criteria={categoryCriteria} />
          <hr className="border-gray-200" />

          {/* 3. Argument Trees */}
          {belief && (
            <>
              <ArgumentTreesSection
                arguments={belief.arguments}
                totalPro={totalPro}
                totalCon={totalCon}
                netInterpretation={belief.netInterpretation}
              />
              <hr className="border-gray-200" />
            </>
          )}

          {/* 4. Performance Against the Criteria */}
          <PerformanceSection performance={review.performanceData} />
          <hr className="border-gray-200" />

          {/* 5. Design Trade-offs (advertised vs. actual, with Divergence Score) */}
          <TradeoffsSection
            tradeoffs={review.tradeoffs}
            divergenceNote={review.divergenceNote}
            divergenceScore={review.divergenceScore}
          />
          <hr className="border-gray-200" />

          {/* 6. Interests Behind the Recommendations */}
          <RecommenderInterestsSection interests={review.recommenderInterests ?? []} />
          <hr className="border-gray-200" />

          {/* 7. Assumptions Required */}
          {belief && (
            <>
              <AssumptionsSection assumptions={belief.assumptions} />
              <hr className="border-gray-200" />
            </>
          )}

          {/* 8. Alternatives */}
          <AlternativesSection alternatives={review.alternatives} />
          <hr className="border-gray-200" />

          {/* 9. Cost-Benefit: total cost of ownership + total value delivered */}
          <OwnershipSection costs={review.ownershipCosts ?? []} values={review.valueItems ?? []} />
          <hr className="border-gray-200" />

          {/* 10. Who Should Buy This + Decision rules */}
          <UserProfilesSection profiles={review.userProfiles} decisionRules={review.decisionRules ?? []} />
          <hr className="border-gray-200" />

          {/* 11. Decision Obstacles */}
          <DecisionObstaclesSection obstacles={review.decisionObstacles ?? []} />
          <hr className="border-gray-200" />

          {/* 12. Biases in the Reviews */}
          {belief && (
            <>
              <BiasesSection
                biases={belief.biases}
                leftHeader="Distorting the positive reviews"
                rightHeader="Distorting the negative reviews"
              />
              <hr className="border-gray-200" />
            </>
          )}

          {/* 13. Media */}
          {belief && (
            <>
              <MediaResourcesSection
                media={belief.mediaResources}
                leftHeader="Reviews supporting the verdict"
                rightHeader="Reviews challenging the verdict"
              />
              <hr className="border-gray-200" />
            </>
          )}

          {/* 14. Recognition */}
          <AwardsSection awards={review.awards} />
          <hr className="border-gray-200" />

          {/* 15. Ecosystem and Lock-in */}
          <EcosystemSection items={review.ecosystemItems} />
          <hr className="border-gray-200" />

          {/* 16. Contribute */}
          <p className="text-xs text-[#555]">
            Contribute reviews, evidence, criteria, or alternatives:{' '}
            <Link href="/contact" className="text-[var(--accent)] hover:underline">Contact me</Link>
            {' '}·{' '}
            <a
              href="https://github.com/myklob/ideastockexchange"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              GitHub
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
