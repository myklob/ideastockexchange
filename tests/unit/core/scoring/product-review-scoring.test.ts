/**
 * Product review scoring: 198 lines behind /product-reviews, its category pages
 * and both of its API routes, tested by nothing until this file.
 *
 * The first test is the same property that `all-scores.ts` was getting backwards:
 * a reason against has to lower the score. It holds here, because this module
 * filters by side rather than averaging over it. Worth stating anyway, because
 * the property is what the product means, not an implementation detail of one
 * function.
 */
import { describe, it, expect } from 'vitest'
import {
  scoreProductReview,
  rankProductsInCategory,
  findBestInCategory,
} from '@/core/scoring/product-review-scoring'
import type {
  ProductReviewWithRelations,
  PerformanceItem,
  CategoryProduct,
} from '@/features/product-reviews/types'

type Arg = { side: string; impactScore: number }
type Ev = { side: string; impactScore: number }
type Perf = Pick<PerformanceItem, 'evidenceTier' | 'comparisonToAvg'>

/** The scorer reads a small, documented subset of the review; this names exactly that subset. */
type ScorableReview = Pick<ProductReviewWithRelations, 'id' | 'categoryType' | 'categoryRank'> & {
  slug?: string
  productName?: string
  brand?: string
  categorySubtype?: string | null
  performanceData: Perf[]
  belief: { claimStrength: number; arguments: Arg[]; evidence: Ev[] } | null
}

/** What the scorer is declared to take, narrowed to what it reads. */
function asReview(r: ScorableReview): ProductReviewWithRelations {
  return r as unknown as ProductReviewWithRelations
}

function review(over: {
  id?: number
  categoryType?: string
  args?: Arg[]
  evidence?: Ev[]
  perf?: Perf[]
  claimStrength?: number
  withBelief?: boolean
} = {}): ProductReviewWithRelations {
  const withBelief = over.withBelief ?? true
  return asReview({
    id: over.id ?? 1,
    categoryType: over.categoryType ?? 'laptop',
    categoryRank: null,
    performanceData: over.perf ?? [],
    belief: withBelief
      ? {
          claimStrength: over.claimStrength ?? 0.5,
          arguments: over.args ?? [],
          evidence: over.evidence ?? [],
        }
      : null,
  })
}

describe('which way an argument moves a product score', () => {
  it('a reason against lowers it', () => {
    const before = scoreProductReview(review({ args: [{ side: 'agree', impactScore: 80 }] }))
    const after = scoreProductReview(
      review({ args: [{ side: 'agree', impactScore: 80 }, { side: 'disagree', impactScore: -80 }] })
    )
    expect(after.overallScore).toBeLessThan(before.overallScore)
  })

  it('a reason for raises it', () => {
    const base = [{ side: 'agree', impactScore: 40 }, { side: 'disagree', impactScore: -40 }]
    const before = scoreProductReview(review({ args: base }))
    const after = scoreProductReview(review({ args: [...base, { side: 'agree', impactScore: 60 }] }))
    expect(after.overallScore).toBeGreaterThan(before.overallScore)
  })

  it('weakening evidence lowers it and supporting evidence raises it', () => {
    const args = [{ side: 'agree', impactScore: 50 }]
    const plain = scoreProductReview(review({ args }))
    const weakened = scoreProductReview(
      review({ args, evidence: [{ side: 'weakening', impactScore: -50 }] })
    )
    const supported = scoreProductReview(
      review({ args, evidence: [{ side: 'supporting', impactScore: 50 }] })
    )
    expect(weakened.overallScore).toBeLessThan(plain.overallScore)
    expect(supported.overallScore).toBeGreaterThanOrEqual(plain.overallScore)
  })

  it('reads the magnitude of an impact, so a sign typed the wrong way cannot flip a side', () => {
    const a = scoreProductReview(review({ args: [{ side: 'disagree', impactScore: -70 }] }))
    const b = scoreProductReview(review({ args: [{ side: 'disagree', impactScore: 70 }] }))
    expect(a.overallScore).toBeCloseTo(b.overallScore, 12)
  })
})

describe('a review with nothing behind it', () => {
  it('sits at the neutral point rather than at either end', () => {
    const r = scoreProductReview(review({ withBelief: false }))
    expect(r.logicalValidityScore).toBe(0.5)
    expect(r.totalPro).toBe(0)
    expect(r.totalCon).toBe(0)
  })

  it('reports no performance evidence rather than assuming the best tier', () => {
    const r = scoreProductReview(review())
    expect(r.performanceBetterCount).toBe(0)
    expect(r.performanceWorseCount).toBe(0)
    expect(r.avgEvidenceTier).toBe(3)
  })
})

describe('performance data', () => {
  it('moves the score the way the comparison points', () => {
    const better = scoreProductReview(review({ perf: [{ evidenceTier: 1, comparisonToAvg: 'Better' }] }))
    const worse = scoreProductReview(review({ perf: [{ evidenceTier: 1, comparisonToAvg: 'Worse' }] }))
    const same = scoreProductReview(review({ perf: [{ evidenceTier: 1, comparisonToAvg: 'Same' }] }))
    expect(better.overallScore).toBeGreaterThan(same.overallScore)
    expect(worse.overallScore).toBeLessThan(same.overallScore)
  })

  it('counts each comparison', () => {
    const r = scoreProductReview(review({
      perf: [
        { evidenceTier: 1, comparisonToAvg: 'Better' },
        { evidenceTier: 2, comparisonToAvg: 'Better' },
        { evidenceTier: 3, comparisonToAvg: 'Worse' },
        { evidenceTier: 4, comparisonToAvg: 'Same' },
      ],
    }))
    expect(r.performanceBetterCount).toBe(2)
    expect(r.performanceWorseCount).toBe(1)
    expect(r.performanceSameCount).toBe(1)
    expect(r.avgEvidenceTier).toBeCloseTo(2.5, 10)
  })
})

describe('the claim strength penalty reaches the product score', () => {
  it('costs a stronger claim more, as it does everywhere else', () => {
    const args = [{ side: 'agree', impactScore: 90 }]
    const weak = scoreProductReview(review({ args, claimStrength: 0.2 }))
    const extreme = scoreProductReview(review({ args, claimStrength: 1.0 }))
    expect(extreme.strengthAdjustedScore).toBeLessThan(weak.strengthAdjustedScore)
  })
})

describe('ranking within a category', () => {
  it('puts the better-argued product first and numbers from one', () => {
    const strong = review({ id: 1, args: [{ side: 'agree', impactScore: 90 }] })
    const weak = review({ id: 2, args: [{ side: 'disagree', impactScore: -90 }] })
    const [cat] = rankProductsInCategory([weak, strong])
    expect(cat.categoryType).toBe('laptop')
    expect(cat.products[0].id).toBe(1)
    expect(cat.products.map((p: CategoryProduct) => p.categoryRank)).toEqual([1, 2])
  })

  it('keeps categories apart', () => {
    const a = review({ id: 3, categoryType: 'laptop' })
    const b = review({ id: 4, categoryType: 'phone' })
    const cats = rankProductsInCategory([a, b]).map((c) => c.categoryType).sort()
    expect(cats).toEqual(['laptop', 'phone'])
  })

  it('finds the best in a category and nothing in one that has none', () => {
    const strong = review({ id: 1, args: [{ side: 'agree', impactScore: 90 }] })
    const weak = review({ id: 2, args: [{ side: 'disagree', impactScore: -90 }] })
    expect(findBestInCategory([weak, strong], 'laptop')?.id).toBe(1)
    expect(findBestInCategory([weak, strong], 'toaster')).toBeNull()
  })
})
