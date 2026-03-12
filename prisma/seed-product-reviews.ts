import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding product reviews...')

  // ─── Create Beliefs for the product claims ──────────────────────

  const fordBelief = await prisma.belief.upsert({
    where: { slug: 'ford-makes-the-best-trucks' },
    update: {},
    create: {
      slug: 'ford-makes-the-best-trucks',
      statement: 'Ford makes the best trucks',
      category: 'Trucks',
      subcategory: 'Full-size Pickup',
      positivity: 65,

      objectiveCriteria: {
        create: [
          { description: 'Towing capacity (lbs)', independenceScore: 0.9, linkageScore: 0.8, criteriaType: 'performance', totalScore: 0.85 },
          { description: 'Payload capacity (lbs)', independenceScore: 0.9, linkageScore: 0.7, criteriaType: 'performance', totalScore: 0.8 },
          { description: 'Reliability ratings (J.D. Power / Consumer Reports)', independenceScore: 0.85, linkageScore: 0.9, criteriaType: 'reliability', totalScore: 0.87 },
          { description: 'Fuel economy (MPG combined)', independenceScore: 0.9, linkageScore: 0.6, criteriaType: 'efficiency', totalScore: 0.75 },
          { description: '5-year maintenance costs', independenceScore: 0.8, linkageScore: 0.7, criteriaType: 'cost', totalScore: 0.75 },
          { description: 'NHTSA safety scores', independenceScore: 0.95, linkageScore: 0.8, criteriaType: 'safety', totalScore: 0.87 },
        ],
      },

      arguments: {
        create: [], // Will be created separately via linked beliefs
      },

      evidence: {
        create: [
          {
            side: 'supporting',
            description: 'F-Series has been America\'s best-selling truck for 47 consecutive years',
            sourceUrl: 'https://media.ford.com',
            evidenceType: 'T2',
            sourceIndependenceWeight: 0.6,
            replicationQuantity: 47,
            conclusionRelevance: 0.7,
            replicationPercentage: 1.0,
            linkageScore: 0.7,
            impactScore: 8,
          },
          {
            side: 'supporting',
            description: 'Ford F-150 received IIHS Top Safety Pick+ in 2024',
            evidenceType: 'T1',
            sourceIndependenceWeight: 0.95,
            replicationQuantity: 3,
            conclusionRelevance: 0.8,
            replicationPercentage: 1.0,
            linkageScore: 0.8,
            impactScore: 12,
          },
          {
            side: 'weakening',
            description: 'Consumer Reports ranks RAM 1500 higher in overall reliability',
            evidenceType: 'T1',
            sourceIndependenceWeight: 0.9,
            replicationQuantity: 5,
            conclusionRelevance: 0.85,
            replicationPercentage: 0.8,
            linkageScore: 0.85,
            impactScore: -10,
          },
        ],
      },

      valuesAnalysis: {
        create: {
          supportingAdvertised: 'Built Ford Tough - durability, work capability, American manufacturing heritage',
          supportingActual: 'Strong towing capacity, extensive dealer network, high resale value',
          opposingAdvertised: 'Competitors offer better fuel economy and interior quality',
          opposingActual: 'RAM 1500 has a more refined ride, Toyota Tundra has better long-term reliability',
        },
      },

      interestsAnalysis: {
        create: {
          supporterInterests: 'Ford brand loyalists, commercial fleet operators, towing-heavy users',
          opponentInterests: 'Users prioritizing interior luxury (RAM), long-term reliability (Toyota), resale (all competitors)',
          sharedInterests: 'All truck buyers want capability, reliability, and value retention',
          conflictingInterests: 'Work truck users prioritize payload; lifestyle users prioritize comfort and tech',
        },
      },

      assumptions: {
        create: [
          { side: 'accept', statement: 'Towing and payload capacity are the primary metrics for truck quality', strength: 'STRONG' },
          { side: 'accept', statement: 'Sales volume correlates with product quality', strength: 'WEAK' },
          { side: 'reject', statement: 'Interior refinement matters more than work capability in trucks', strength: 'MODERATE' },
          { side: 'reject', statement: 'Long-term reliability is more important than peak performance', strength: 'STRONG' },
        ],
      },

      costBenefitAnalysis: {
        create: {
          benefits: 'Best-in-class towing, extensive dealer and parts network, high resale value, PowerBoost hybrid option',
          benefitLikelihood: 0.85,
          costs: 'Higher MSRP than some competitors, mixed reliability track record, premium features require expensive trims',
          costLikelihood: 0.75,
        },
      },

      impactAnalysis: {
        create: {
          shortTermEffects: 'Immediate access to highest towing capacity and most powertrain options in the segment',
          shortTermCosts: 'Higher purchase price, especially for well-equipped models',
          longTermEffects: 'Strong resale value, extensive aftermarket support, widespread dealer network for service',
          longTermChanges: 'Some model years have had recalls; long-term reliability varies by powertrain choice',
        },
      },

      obstacles: {
        create: [
          { side: 'supporter', description: 'Brand loyalty ignoring better value alternatives (RAM offers comparable capability at lower price)' },
          { side: 'supporter', description: 'Marketing hype around "best-selling" conflating popularity with quality' },
          { side: 'opposition', description: 'Focus only on upfront cost, ignoring strong Ford resale value' },
          { side: 'opposition', description: 'Underestimating the value of Ford\'s extensive dealer and service network' },
        ],
      },

      biases: {
        create: [
          { side: 'supporting', biasType: 'Post-purchase rationalization', description: 'Ford truck owners justifying their expensive purchase by emphasizing capability metrics' },
          { side: 'supporting', biasType: 'Brand loyalty halo effect', description: '"Built Ford Tough" creates emotional attachment beyond objective metrics' },
          { side: 'opposing', biasType: 'Negativity bias', description: 'Single reliability issues dominating perception despite overall solid performance' },
          { side: 'opposing', biasType: 'Unrealistic expectations', description: 'Expecting luxury sedan refinement from a work truck platform' },
        ],
      },

      mediaResources: {
        create: [
          { side: 'supporting', mediaType: 'article', title: 'Ford F-150 vs RAM 1500 vs Chevy Silverado Comparison', author: 'MotorTrend', url: 'https://www.motortrend.com' },
          { side: 'supporting', mediaType: 'article', title: '2024 F-150 IIHS Crash Test Results', author: 'IIHS', url: 'https://www.iihs.org' },
          { side: 'opposing', mediaType: 'article', title: 'Most Reliable Trucks - Consumer Reports Rankings', author: 'Consumer Reports' },
        ],
      },
    },
  })

  const appleBelief = await prisma.belief.upsert({
    where: { slug: 'apple-makes-the-best-phones' },
    update: {},
    create: {
      slug: 'apple-makes-the-best-phones',
      statement: 'Apple makes the best phones',
      category: 'Phones',
      subcategory: 'Smartphone',
      positivity: 55,

      objectiveCriteria: {
        create: [
          { description: 'Processor benchmark scores (single-core / multi-core)', independenceScore: 0.95, linkageScore: 0.8, criteriaType: 'performance', totalScore: 0.87 },
          { description: 'Camera quality (DxOMark scores)', independenceScore: 0.9, linkageScore: 0.75, criteriaType: 'performance', totalScore: 0.82 },
          { description: 'Software update longevity (years of OS support)', independenceScore: 0.85, linkageScore: 0.9, criteriaType: 'reliability', totalScore: 0.87 },
          { description: 'Battery life (screen-on time hours)', independenceScore: 0.9, linkageScore: 0.7, criteriaType: 'performance', totalScore: 0.8 },
          { description: 'Build quality and water resistance rating', independenceScore: 0.85, linkageScore: 0.65, criteriaType: 'durability', totalScore: 0.75 },
        ],
      },

      evidence: {
        create: [
          {
            side: 'supporting',
            description: 'Apple A-series chips consistently lead single-core Geekbench scores',
            evidenceType: 'T1',
            sourceIndependenceWeight: 0.9,
            replicationQuantity: 10,
            conclusionRelevance: 0.75,
            replicationPercentage: 0.95,
            linkageScore: 0.75,
            impactScore: 10,
          },
          {
            side: 'supporting',
            description: 'iPhones receive 6+ years of iOS updates vs 3-4 years for most Android phones',
            evidenceType: 'T2',
            sourceIndependenceWeight: 0.8,
            replicationQuantity: 6,
            conclusionRelevance: 0.9,
            replicationPercentage: 1.0,
            linkageScore: 0.85,
            impactScore: 14,
          },
          {
            side: 'weakening',
            description: 'Samsung Galaxy S24 Ultra has higher DxOMark camera score than iPhone 15 Pro Max',
            evidenceType: 'T1',
            sourceIndependenceWeight: 0.9,
            replicationQuantity: 3,
            conclusionRelevance: 0.7,
            replicationPercentage: 0.8,
            linkageScore: 0.7,
            impactScore: -8,
          },
          {
            side: 'weakening',
            description: 'iPhones cost significantly more than Android alternatives with similar specs',
            evidenceType: 'T2',
            sourceIndependenceWeight: 0.8,
            replicationQuantity: 5,
            conclusionRelevance: 0.8,
            replicationPercentage: 0.9,
            linkageScore: 0.75,
            impactScore: -9,
          },
        ],
      },

      valuesAnalysis: {
        create: {
          supportingAdvertised: 'Privacy-first design, seamless ecosystem integration, premium build quality',
          supportingActual: 'Best-in-class processor performance, longest software support, highest resale value',
          opposingAdvertised: 'Android offers more customization and better value per dollar',
          opposingActual: 'Samsung and Google Pixel match or exceed camera quality; Android flagships offer more features for less',
        },
      },

      interestsAnalysis: {
        create: {
          supporterInterests: 'Apple ecosystem users (Mac, iPad, Watch), privacy-conscious users, long-term value seekers',
          opponentInterests: 'Power users wanting customization, budget-conscious buyers, users preferring open ecosystems',
          sharedInterests: 'All smartphone users want reliability, good cameras, and regular updates',
          conflictingInterests: 'Ecosystem lock-in benefits Apple users but restricts switching; premium pricing excludes budget buyers',
        },
      },

      assumptions: {
        create: [
          { side: 'accept', statement: 'Processor performance and software longevity define phone quality', strength: 'STRONG' },
          { side: 'accept', statement: 'Ecosystem integration adds measurable value', strength: 'MODERATE' },
          { side: 'reject', statement: 'Customizability and open-source are more important than polished UX', strength: 'MODERATE' },
          { side: 'reject', statement: 'Value per dollar is the primary metric for phone quality', strength: 'STRONG' },
        ],
      },

      costBenefitAnalysis: {
        create: {
          benefits: 'Industry-leading performance, 6+ years of updates, best resale value, tight ecosystem integration, strong privacy protections',
          benefitLikelihood: 0.9,
          costs: 'Premium pricing ($999+), ecosystem lock-in, limited customization, no sideloading on older versions',
          costLikelihood: 0.85,
        },
      },

      impactAnalysis: {
        create: {
          shortTermEffects: 'Fastest processor, smooth daily experience, best app optimization',
          shortTermCosts: 'Significantly higher purchase price than Android alternatives',
          longTermEffects: '6+ years of updates extends useful life; high resale value reduces effective cost',
          longTermChanges: 'Ecosystem lock-in increases switching costs over time',
        },
      },

      obstacles: {
        create: [
          { side: 'supporter', description: 'Apple ecosystem lock-in creating bias toward staying with iPhone' },
          { side: 'supporter', description: 'Brand prestige driving purchases beyond rational cost-benefit analysis' },
          { side: 'opposition', description: 'Underestimating the value of long software support and resale value' },
          { side: 'opposition', description: 'Comparing spec sheets without accounting for software optimization' },
        ],
      },

      biases: {
        create: [
          { side: 'supporting', biasType: 'Post-purchase rationalization', description: 'Justifying $1000+ purchase by emphasizing ecosystem benefits' },
          { side: 'supporting', biasType: 'Brand loyalty halo effect', description: 'Apple brand prestige inflating perceived quality beyond measurements' },
          { side: 'opposing', biasType: 'Spec-sheet bias', description: 'Judging phones purely by spec numbers without real-world testing' },
          { side: 'opposing', biasType: 'Price anchoring', description: 'Assuming higher price means worse value without considering longevity' },
        ],
      },

      mediaResources: {
        create: [
          { side: 'supporting', mediaType: 'article', title: 'iPhone vs Samsung Galaxy Comparison 2024', author: 'Tom\'s Guide' },
          { side: 'supporting', mediaType: 'article', title: 'Geekbench Processor Benchmark Results', author: 'Geekbench' },
          { side: 'opposing', mediaType: 'article', title: 'Best Camera Phones Ranked by DxOMark', author: 'DxOMark' },
        ],
      },
    },
  })

  // ─── Create Product Reviews linked to beliefs ──────────────────

  const fordReview = await prisma.productReview.upsert({
    where: { slug: 'ford-f-150' },
    update: {},
    create: {
      slug: 'ford-f-150',
      productName: 'Ford F-150',
      brand: 'Ford',
      claim: 'Ford makes the best trucks',
      categoryType: 'Trucks',
      categorySubtype: 'Full-size Pickup',
      overallScore: 0,
      beliefId: fordBelief.id,

      performanceData: {
        create: [
          { criterion: 'Max Towing Capacity', measurement: '14,000 lbs', evidenceTier: 1, comparisonToAvg: 'Better', sourceUrl: 'https://www.ford.com/trucks/f-150/features/capability/' },
          { criterion: 'Max Payload Capacity', measurement: '2,455 lbs', evidenceTier: 1, comparisonToAvg: 'Better' },
          { criterion: 'J.D. Power Reliability', measurement: '76/100', evidenceTier: 1, comparisonToAvg: 'Same' },
          { criterion: 'Combined Fuel Economy', measurement: '22 MPG (2.7L EcoBoost)', evidenceTier: 1, comparisonToAvg: 'Same' },
          { criterion: '5-Year Maintenance Cost', measurement: '$9,200 estimated', evidenceTier: 2, comparisonToAvg: 'Worse' },
          { criterion: 'NHTSA Safety Rating', measurement: '5 stars overall', evidenceTier: 1, comparisonToAvg: 'Same' },
        ],
      },

      tradeoffs: {
        create: [
          { side: 'optimizes', category: 'advertised', description: 'Best-in-class towing and payload capability' },
          { side: 'optimizes', category: 'advertised', description: 'Most powertrain options (6 engines including hybrid)' },
          { side: 'sacrifices', category: 'advertised', description: 'Higher starting MSRP than base Silverado' },
          { side: 'optimizes', category: 'actual', description: 'Strongest towing numbers with Pro Power Onboard generator' },
          { side: 'optimizes', category: 'actual', description: 'Highest resale value in full-size truck segment' },
          { side: 'sacrifices', category: 'actual', description: 'Interior quality trails RAM 1500' },
          { side: 'sacrifices', category: 'actual', description: 'Mixed reliability history across model years' },
        ],
      },

      alternatives: {
        create: [
          { alternativeName: 'RAM 1500 Limited', tier: 'premium', keyAdvantage: 'Best-in-class interior luxury and ride quality' },
          { alternativeName: 'GMC Sierra Denali', tier: 'premium', keyAdvantage: 'MultiPro tailgate and premium positioning' },
          { alternativeName: 'Chevrolet Silverado 1500 WT', tier: 'budget', keyAdvantage: 'Lower MSRP for similar capability' },
          { alternativeName: 'Toyota Tundra SR', tier: 'budget', keyAdvantage: 'Better long-term reliability at lower trims' },
          { alternativeName: 'Toyota Tundra', tier: 'lateral', keyAdvantage: 'Superior long-term reliability and resale' },
          { alternativeName: 'RAM 1500', tier: 'lateral', keyAdvantage: 'Better ride comfort and interior refinement' },
        ],
      },

      userProfiles: {
        create: [
          { side: 'ideal', description: 'Commercial fleet operators needing maximum towing capacity' },
          { side: 'ideal', description: 'Buyers wanting the widest range of powertrain options (including hybrid)' },
          { side: 'ideal', description: 'Users who value extensive dealer and service network coverage' },
          { side: 'not_ideal', description: 'Buyers prioritizing interior luxury and ride comfort (consider RAM 1500)' },
          { side: 'not_ideal', description: 'Users prioritizing long-term reliability above all else (consider Toyota Tundra)' },
          { side: 'not_ideal', description: 'Budget-conscious buyers (consider Silverado WT)' },
        ],
      },

      awards: {
        create: [
          { side: 'independent', title: 'IIHS Top Safety Pick+', details: '2024 model year' },
          { side: 'independent', title: 'MotorTrend Truck of the Year', details: 'Multiple years including 2021' },
          { side: 'manufacturer', title: 'Best-selling truck in America', details: '47 consecutive years' },
          { side: 'manufacturer', title: 'Highest towing in its class', details: 'When properly equipped with 3.5L EcoBoost' },
        ],
      },

      ecosystemItems: {
        create: [
          { category: 'upstream', description: 'Compatible truck bed accessories and tonneau covers (brand-specific fitment)' },
          { category: 'downstream', description: 'Ford Pro Power Onboard accessories and job-site tools' },
          { category: 'downstream', description: 'FordPass app for remote start, fuel tracking, and maintenance scheduling' },
          { category: 'lockin', description: 'Ford-specific parts and dealer service network' },
          { category: 'lockin', description: 'Aftermarket parts and accessories are widely available, reducing lock-in vs competitors' },
        ],
      },
    },
  })

  const appleReview = await prisma.productReview.upsert({
    where: { slug: 'apple-iphone-15-pro' },
    update: {},
    create: {
      slug: 'apple-iphone-15-pro',
      productName: 'Apple iPhone 15 Pro',
      brand: 'Apple',
      claim: 'Apple makes the best phones',
      categoryType: 'Phones',
      categorySubtype: 'Smartphone',
      overallScore: 0,
      beliefId: appleBelief.id,

      performanceData: {
        create: [
          { criterion: 'Single-Core Geekbench 6', measurement: '2,908', evidenceTier: 1, comparisonToAvg: 'Better' },
          { criterion: 'Multi-Core Geekbench 6', measurement: '7,274', evidenceTier: 1, comparisonToAvg: 'Better' },
          { criterion: 'DxOMark Camera Score', measurement: '154', evidenceTier: 1, comparisonToAvg: 'Same' },
          { criterion: 'Software Update Longevity', measurement: '6+ years', evidenceTier: 2, comparisonToAvg: 'Better' },
          { criterion: 'Battery Life (Screen-on)', measurement: '12.5 hours', evidenceTier: 2, comparisonToAvg: 'Same' },
          { criterion: 'Water Resistance', measurement: 'IP68 (6m, 30 min)', evidenceTier: 1, comparisonToAvg: 'Same' },
        ],
      },

      tradeoffs: {
        create: [
          { side: 'optimizes', category: 'advertised', description: 'Privacy-first architecture with on-device processing' },
          { side: 'optimizes', category: 'advertised', description: 'Seamless integration across Apple ecosystem devices' },
          { side: 'sacrifices', category: 'advertised', description: 'Limited customization compared to Android' },
          { side: 'optimizes', category: 'actual', description: 'Industry-leading processor performance and software optimization' },
          { side: 'optimizes', category: 'actual', description: 'Longest software support lifecycle in the industry' },
          { side: 'sacrifices', category: 'actual', description: 'Ecosystem lock-in increases switching costs significantly' },
          { side: 'sacrifices', category: 'actual', description: 'Premium pricing 30-50% higher than comparable Android flagships' },
        ],
      },

      alternatives: {
        create: [
          { alternativeName: 'Samsung Galaxy S24 Ultra', tier: 'premium', keyAdvantage: 'Higher camera scores and S-Pen integration' },
          { alternativeName: 'Google Pixel 8 Pro', tier: 'lateral', keyAdvantage: 'Best computational photography and pure Android experience' },
          { alternativeName: 'Samsung Galaxy A54', tier: 'budget', keyAdvantage: '80% of flagship features at 40% of the price' },
          { alternativeName: 'Google Pixel 8a', tier: 'budget', keyAdvantage: 'Clean Android with excellent camera at half the price' },
          { alternativeName: 'Samsung Galaxy S24', tier: 'lateral', keyAdvantage: 'Comparable performance with more customization options' },
        ],
      },

      userProfiles: {
        create: [
          { side: 'ideal', description: 'Users already invested in Apple ecosystem (Mac, iPad, Apple Watch, AirPods)' },
          { side: 'ideal', description: 'Privacy-conscious users who value on-device processing' },
          { side: 'ideal', description: 'Users who keep phones for 4+ years and value long software support' },
          { side: 'not_ideal', description: 'Power users who want deep OS customization (consider Android)' },
          { side: 'not_ideal', description: 'Budget-conscious buyers (consider Pixel 8a or Galaxy A54)' },
          { side: 'not_ideal', description: 'Users who prioritize camera zoom and stylus input (consider Galaxy S24 Ultra)' },
        ],
      },

      awards: {
        create: [
          { side: 'independent', title: 'Tom\'s Guide Editor\'s Choice', details: 'Best overall smartphone 2024' },
          { side: 'independent', title: 'MKBHD Smartphone Awards - Best Small Phone', details: '2023' },
          { side: 'manufacturer', title: 'Fastest mobile chip ever made', details: 'A17 Pro chip marketing claim' },
          { side: 'manufacturer', title: 'Most advanced camera system', details: 'Apple marketing for 48MP main sensor' },
        ],
      },

      ecosystemItems: {
        create: [
          { category: 'upstream', description: 'Apple ID account and iCloud subscription for full functionality' },
          { category: 'downstream', description: 'AirPods for spatial audio and seamless switching between Apple devices' },
          { category: 'downstream', description: 'Apple Watch for health tracking and iPhone notifications' },
          { category: 'downstream', description: 'MagSafe accessories (cases, chargers, wallets)' },
          { category: 'lockin', description: 'iMessage creates social pressure to stay on iPhone in many social groups' },
          { category: 'lockin', description: 'Purchased apps, iCloud storage, and Apple subscriptions do not transfer to Android' },
        ],
      },
    },
  })

  // ─── Now compute and update scores ──────────────────────────────
  // Import the scoring engine dynamically
  const { scoreProductReview, rankProductsInCategory } = await import('../src/core/scoring/product-review-scoring')
  const { fetchAllProductReviewsFull } = await import('../src/features/product-reviews/data/fetch-product-reviews')

  // Fetch all reviews with full relations to compute scores
  const allReviews = await fetchAllProductReviewsFull()
  const rankings = rankProductsInCategory(allReviews)

  // Update scores and ranks in the database
  for (const category of rankings) {
    for (const product of category.products) {
      await prisma.productReview.update({
        where: { id: product.id },
        data: {
          overallScore: product.overallScore,
          categoryRank: product.categoryRank,
        },
      })
      console.log(`  ${product.productName}: score=${product.overallScore.toFixed(1)}, rank=#${product.categoryRank} in ${category.categoryType}`)
    }
  }

  console.log(`\nSeeded ${allReviews.length} product reviews across ${rankings.length} categories.`)
  console.log('Product review seed completed!')
}

main()
  .catch((e) => {
    console.error('Error during product review seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
