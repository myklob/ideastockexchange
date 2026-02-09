import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchProductReviewBySlug } from '@/features/product-reviews/data/fetch-product-reviews'
import { scoreProductReview } from '@/core/scoring/product-review-scoring'
import ProductScoreHeader from '@/features/product-reviews/components/ProductScoreHeader'
import PerformanceSection from '@/features/product-reviews/components/PerformanceSection'
import TradeoffsSection from '@/features/product-reviews/components/TradeoffsSection'
import AlternativesSection from '@/features/product-reviews/components/AlternativesSection'
import UserProfilesSection from '@/features/product-reviews/components/UserProfilesSection'
import AwardsSection from '@/features/product-reviews/components/AwardsSection'
import EcosystemSection from '@/features/product-reviews/components/EcosystemSection'
// Reuse belief analysis components for shared sections
import ArgumentTreesSection from '@/features/belief-analysis/components/ArgumentTreesSection'
import EvidenceSection from '@/features/belief-analysis/components/EvidenceSection'
import ObjectiveCriteriaSection from '@/features/belief-analysis/components/ObjectiveCriteriaSection'
import InterestsSection from '@/features/belief-analysis/components/InterestsSection'
import AssumptionsSection from '@/features/belief-analysis/components/AssumptionsSection'
import CostBenefitSection from '@/features/belief-analysis/components/CostBenefitSection'
import ImpactSection from '@/features/belief-analysis/components/ImpactSection'
import ObstaclesSection from '@/features/belief-analysis/components/ObstaclesSection'
import BiasesSection from '@/features/belief-analysis/components/BiasesSection'
import MediaSection from '@/features/belief-analysis/components/MediaSection'
import ContributeSection from '@/features/belief-analysis/components/ContributeSection'

interface ProductReviewPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductReviewPage({ params }: ProductReviewPageProps) {
  const { slug } = await params
  const review = await fetchProductReviewBySlug(decodeURIComponent(slug))

  if (!review) {
    notFound()
  }

  const scores = scoreProductReview(review)
  const belief = review.belief

  // Compute belief-level argument scores for display
  let totalPro = 0
  let totalCon = 0
  let totalSupportingEvidence = 0
  let totalWeakeningEvidence = 0

  if (belief) {
    const proArgs = belief.arguments.filter(a => a.side === 'agree')
    const conArgs = belief.arguments.filter(a => a.side === 'disagree')
    totalPro = proArgs.reduce((sum, a) => sum + Math.abs(a.impactScore), 0)
    totalCon = conArgs.reduce((sum, a) => sum + Math.abs(a.impactScore), 0)
    const supportingEvidence = belief.evidence.filter(e => e.side === 'supporting')
    const weakeningEvidence = belief.evidence.filter(e => e.side === 'weakening')
    totalSupportingEvidence = supportingEvidence.reduce((sum, e) => sum + Math.abs(e.impactScore), 0)
    totalWeakeningEvidence = weakeningEvidence.reduce((sum, e) => sum + Math.abs(e.impactScore), 0)
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

      <main className="max-w-[960px] mx-auto px-4 py-8">
        {/* Score Header */}
        <ProductScoreHeader
          productName={review.productName}
          brand={review.brand}
          claim={review.claim}
          categoryType={review.categoryType}
          categorySubtype={review.categorySubtype}
          scores={scores}
        />

        <div className="space-y-12">
          {/* 1. Category Objective Criteria */}
          {belief && (
            <>
              <ObjectiveCriteriaSection criteria={belief.objectiveCriteria} />
              <hr className="border-gray-200" />
            </>
          )}

          {/* 2. Argument Trees */}
          {belief && (
            <>
              <ArgumentTreesSection
                arguments={belief.arguments}
                totalPro={totalPro}
                totalCon={totalCon}
              />
              <hr className="border-gray-200" />
            </>
          )}

          {/* 3. Product Performance: Evidence Quality Assessment */}
          <PerformanceSection performance={review.performanceData} />
          <hr className="border-gray-200" />

          {/* 4. Core Design Trade-offs */}
          <TradeoffsSection tradeoffs={review.tradeoffs} />
          <hr className="border-gray-200" />

          {/* 5. Interests & Motivations */}
          {belief && (
            <>
              <InterestsSection interests={belief.interestsAnalysis} />
              <hr className="border-gray-200" />
            </>
          )}

          {/* 6. Foundational Assumptions */}
          {belief && (
            <>
              <AssumptionsSection assumptions={belief.assumptions} />
              <hr className="border-gray-200" />
            </>
          )}

          {/* 7. Similar Products & Alternatives */}
          <AlternativesSection alternatives={review.alternatives} />
          <hr className="border-gray-200" />

          {/* 8. Cost-Benefit Analysis */}
          {belief && (
            <>
              <CostBenefitSection cba={belief.costBenefitAnalysis} />
              <hr className="border-gray-200" />
            </>
          )}

          {/* 9. Short vs Long-Term Value */}
          {belief && (
            <>
              <ImpactSection impact={belief.impactAnalysis} />
              <hr className="border-gray-200" />
            </>
          )}

          {/* 10. Best Fit User Profiles */}
          <UserProfilesSection profiles={review.userProfiles} />
          <hr className="border-gray-200" />

          {/* 11. Common Decision Obstacles */}
          {belief && (
            <>
              <ObstaclesSection obstacles={belief.obstacles} />
              <hr className="border-gray-200" />
            </>
          )}

          {/* 12. Cognitive Biases in Reviews */}
          {belief && (
            <>
              <BiasesSection biases={belief.biases} />
              <hr className="border-gray-200" />
            </>
          )}

          {/* 13. Media Resources */}
          {belief && (
            <>
              <MediaSection media={belief.mediaResources} />
              <hr className="border-gray-200" />
            </>
          )}

          {/* 14. Awards & Certifications */}
          <AwardsSection awards={review.awards} />
          <hr className="border-gray-200" />

          {/* 15. Product Ecosystem */}
          <EcosystemSection items={review.ecosystemItems} />
          <hr className="border-gray-200" />

          {/* 16. Evidence (from belief) */}
          {belief && (
            <>
              <EvidenceSection
                evidence={belief.evidence}
                totalSupporting={totalSupportingEvidence}
                totalWeakening={totalWeakeningEvidence}
              />
              <hr className="border-gray-200" />
            </>
          )}

          {/* 17. Contribute */}
          <ContributeSection />

          {/* Overall Score (bottom) */}
          <div className="text-right">
            <p className="text-lg font-bold">
              Score:{' '}
              <Link
                href="/Argument%20scores%20from%20sub-argument%20scores"
                className="text-[var(--accent)] hover:underline"
              >
                {scores.overallScore >= 0 ? '+' : ''}{scores.overallScore.toFixed(1)}
              </Link>
              {' '}
              <span className="text-sm font-normal text-[var(--muted-foreground)]">
                (based on argument scores)
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
