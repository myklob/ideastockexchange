/**
 * Seeds the new product-review template data for the Ford F-150 review:
 * scoped title fields, scorecard verdicts, category criteria for Trucks
 * (criteria before brands), performance benchmarks and impacts, trade-off
 * divergence, recommender interests with hidden-interest candidates,
 * ownership costs, value delivered, decision rules, and decision obstacles.
 * Idempotent: clears and recreates the rows it owns.
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  const review = await prisma.productReview.findUnique({
    where: { slug: 'ford-f-150' },
    include: { performanceData: true },
  })
  if (!review) {
    console.log('Ford F-150 review not found — run seed-product-reviews first. Skipping extras.')
    return
  }

  await prisma.categoryCriterion.deleteMany({ where: { categoryType: review.categoryType } })
  await prisma.productRecommenderInterest.deleteMany({ where: { productReviewId: review.id } })
  await prisma.productOwnershipCost.deleteMany({ where: { productReviewId: review.id } })
  await prisma.productValueItem.deleteMany({ where: { productReviewId: review.id } })
  await prisma.productDecisionRule.deleteMany({ where: { productReviewId: review.id } })
  await prisma.productDecisionObstacle.deleteMany({ where: { productReviewId: review.id } })

  await prisma.categoryCriterion.createMany({
    data: [
      {
        categoryType: review.categoryType,
        criterion: 'Towing and payload capacity',
        howToMeasure: 'SAE J2807-certified tow rating; manufacturer payload with the certification named',
        importance: 90,
        score: 82,
        sortOrder: 0,
      },
      {
        categoryType: review.categoryType,
        criterion: 'Reliability over 5+ years',
        howToMeasure: 'J.D. Power dependability, repair-frequency data, warranty claim rates',
        importance: 85,
        score: 78,
        sortOrder: 1,
      },
      {
        categoryType: review.categoryType,
        criterion: 'Total cost of ownership per mile',
        howToMeasure: 'Purchase price + fuel + maintenance + insurance − resale, divided by miles',
        importance: 80,
        score: 74,
        sortOrder: 2,
      },
      {
        categoryType: review.categoryType,
        criterion: 'Crash safety',
        howToMeasure: 'NHTSA overall stars and IIHS ratings',
        importance: 75,
        score: 70,
        sortOrder: 3,
      },
    ],
  })

  const perfUpdates: Record<string, { benchmark: string; source: string; impact: number }> = {
    'Max Towing Capacity': { benchmark: 'Best rival (Silverado 1500): 13,300 lbs', source: 'SAE J2807 ratings', impact: 68 },
    'Max Payload Capacity': { benchmark: 'Category average: 2,000 lbs', source: 'Manufacturer specs, third-party verified', impact: 55 },
    'J.D. Power Reliability': { benchmark: 'Category average: 77/100', source: 'J.D. Power 2024 dependability study', impact: 40 },
    'Combined Fuel Economy': { benchmark: 'Best rival (Ram 1500 diesel): 26 MPG', source: 'EPA ratings', impact: 35 },
    '5-Year Maintenance Cost': { benchmark: 'Category average: $8,600', source: 'RepairPal aggregate', impact: 30 },
    'NHTSA Safety Rating': { benchmark: 'Category norm: 4-5 stars', source: 'NHTSA', impact: 28 },
  }
  for (const p of review.performanceData) {
    const u = perfUpdates[p.criterion]
    if (u) {
      await prisma.productPerformance.update({
        where: { id: p.id },
        data: { benchmark: u.benchmark, source: u.source, impact: u.impact },
      })
    }
  }

  await prisma.productReview.update({
    where: { id: review.id },
    data: {
      useCase: 'mixed work and family use',
      priceSegment: 'Mid-range',
      bottomLine:
        'For buyers who split time between job-site towing and family driving, the F-150 wins on capability per dollar; single-purpose buyers can do better on either extreme.',
      verdictChanger:
        'A rival matching the 14,000 lb tow rating at a lower 5-year total cost of ownership, or F-150 maintenance costs rising above $10,000/5-year.',
      divergenceNote:
        'Marketing sells maximum capability; the volume trims actually optimize daily comfort and financing accessibility, and the halo numbers require specific packages most buyers do not order.',
      divergenceScore: 46,
      recommenderInterests: {
        create: [
          {
            side: 'product',
            description: 'Fleet managers optimizing uptime and resale, who buy on total cost of ownership data.',
            score: 62,
            sortOrder: 0,
          },
          {
            side: 'alternatives',
            description: 'Off-road enthusiasts optimizing trail capability, where rivals aim their halo trims.',
            score: 48,
            sortOrder: 0,
          },
          {
            side: 'product',
            hidden: true,
            description: 'Dealer and affiliate networks earn more on high-margin F-150 packages.',
            evidence: 'Affiliate disclosure pages on the top ten "best truck" listicles; trim-mix incentive data.',
            score: 38,
            sortOrder: 1,
          },
          {
            side: 'alternatives',
            hidden: true,
            description: 'Rival-sponsored review channels time "F-150 killer" videos to competitor launch windows.',
            evidence: 'Sponsorship disclosures and launch-date clustering of head-to-head videos.',
            score: 33,
            sortOrder: 1,
          },
        ],
      },
      ownershipCosts: {
        create: [
          { item: 'Purchase price (XLT, typical options)', estimate: '$48,500', costType: 'initial', source: 'KBB transaction data', evidenceTier: 2, score: 70, sortOrder: 0 },
          { item: 'Maintenance and repairs', estimate: '$1,840 per year', costType: 'ongoing', source: 'RepairPal', evidenceTier: 2, score: 55, sortOrder: 1 },
          { item: 'Fuel at 12,000 miles per year', estimate: '$2,300 per year', costType: 'ongoing', source: 'EPA + AAA fuel averages', evidenceTier: 1, score: 50, sortOrder: 2 },
          { item: 'Aluminum-body repair premium after collisions', estimate: '$500-$1,200 per incident', costType: 'hidden', source: 'IIHS repair-cost study', evidenceTier: 2, score: 42, sortOrder: 3 },
          { item: 'Same money buys a mid-size truck plus a used sedan', estimate: '$48,500', costType: 'opportunity', source: 'Configurator comparison', evidenceTier: 3, score: 25, sortOrder: 4 },
        ],
      },
      valueItems: {
        create: [
          { item: 'Class-leading towing on the certified test', measure: '14,000 lbs (SAE J2807)', timeframe: 'short', source: 'SAE ratings', evidenceTier: 1, score: 72, sortOrder: 0 },
          { item: 'Resale value retained after 5 years', measure: '58% of purchase price', timeframe: 'long', source: 'KBB resale data', evidenceTier: 2, score: 60, sortOrder: 1 },
          { item: 'Owner satisfaction', measure: '4.2/5 across 11,000 aggregated reviews', timeframe: 'both', source: 'Aggregated dealer and forum reviews', evidenceTier: 3, score: 41, sortOrder: 2 },
        ],
      },
      decisionRules: {
        create: [
          {
            condition: 'If you prioritize certified towing capacity',
            advice: 'buy the F-150 with the 3.5L EcoBoost tow package, because it holds the SAE-certified class lead at 14,000 lbs.',
            score: 66,
            sortOrder: 0,
          },
          {
            condition: 'If you prioritize lowest running costs',
            advice: 'buy the Ram 1500 diesel, because its 26 MPG combined beats the F-150 by 4 MPG at equal payload.',
            score: 54,
            sortOrder: 1,
          },
          {
            condition: 'If you need both towing and daily comfort',
            advice: 'consider the F-150 hybrid, because it keeps 12,700 lbs of towing while adding the onboard generator and better city economy.',
            score: 49,
            sortOrder: 2,
          },
          {
            condition: 'If budget is the primary concern',
            advice: 'a two-year-old F-150 XL sacrifices warranty coverage but delivers the same frame and drivetrain for about 70% of the price.',
            score: 45,
            sortOrder: 3,
          },
        ],
      },
      decisionObstacles: {
        create: [
          { side: 'overpay', description: 'Brand loyalty and trim-ladder anchoring push buyers two trims above their measured needs.', score: 58, sortOrder: 0 },
          { side: 'overpay', description: 'Halo-number marketing sells capability most owners never use (median owner tows under 5,000 lbs).', score: 52, sortOrder: 1 },
          { side: 'underinvest', description: 'Shopping on sticker price while ignoring resale and maintenance, which dominate 5-year cost.', score: 56, sortOrder: 0 },
        ],
      },
    },
  })

  console.log(`Seeded product template extras for ${review.productName}: 4 category criteria, 4 recommender interests, 5 costs, 3 values, 4 decision rules, 3 obstacles.`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
