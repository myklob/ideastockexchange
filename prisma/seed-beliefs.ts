import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding belief analysis data...')

  // Create main belief
  const mainBelief = await prisma.belief.upsert({
    where: { slug: 'universal-basic-income-should-be-implemented' },
    update: {},
    create: {
      slug: 'universal-basic-income-should-be-implemented',
      statement: 'Universal Basic Income should be implemented in developed nations',
      category: 'Economics',
      subcategory: 'Social Policy',
      deweyNumber: '362.5',
      positivity: 25,
    },
  })

  // Create supporting reason beliefs
  const automationBelief = await prisma.belief.upsert({
    where: { slug: 'automation-will-displace-workers' },
    update: {},
    create: {
      slug: 'automation-will-displace-workers',
      statement: 'Automation and AI will displace a significant portion of the workforce',
      category: 'Technology',
      subcategory: 'Labor Economics',
      deweyNumber: '331.1',
      positivity: 60,
    },
  })

  const povertyBelief = await prisma.belief.upsert({
    where: { slug: 'poverty-reduction-improves-society' },
    update: {},
    create: {
      slug: 'poverty-reduction-improves-society',
      statement: 'Reducing poverty improves societal outcomes across all dimensions',
      category: 'Social Science',
      subcategory: 'Poverty Studies',
      deweyNumber: '362.5',
      positivity: 85,
    },
  })

  const bureaucracyBelief = await prisma.belief.upsert({
    where: { slug: 'welfare-bureaucracy-is-inefficient' },
    update: {},
    create: {
      slug: 'welfare-bureaucracy-is-inefficient',
      statement: 'Current welfare bureaucracy wastes resources on means-testing and administration',
      category: 'Government',
      subcategory: 'Welfare Policy',
      deweyNumber: '353.5',
      positivity: 45,
    },
  })

  // Create opposing reason beliefs
  const inflationBelief = await prisma.belief.upsert({
    where: { slug: 'ubi-causes-inflation' },
    update: {},
    create: {
      slug: 'ubi-causes-inflation',
      statement: 'Universal Basic Income would cause significant inflation, negating its benefits',
      category: 'Economics',
      subcategory: 'Monetary Policy',
      deweyNumber: '332.4',
      positivity: -30,
    },
  })

  const workIncentiveBelief = await prisma.belief.upsert({
    where: { slug: 'ubi-reduces-work-incentive' },
    update: {},
    create: {
      slug: 'ubi-reduces-work-incentive',
      statement: 'Guaranteed income would significantly reduce the incentive to work',
      category: 'Economics',
      subcategory: 'Labor Economics',
      deweyNumber: '331.2',
      positivity: -40,
    },
  })

  const fiscalBelief = await prisma.belief.upsert({
    where: { slug: 'ubi-fiscally-unsustainable' },
    update: {},
    create: {
      slug: 'ubi-fiscally-unsustainable',
      statement: 'UBI at a meaningful level is fiscally unsustainable for most governments',
      category: 'Economics',
      subcategory: 'Fiscal Policy',
      deweyNumber: '336',
      positivity: -50,
    },
  })

  // Create broader/general principles
  const humanDignityBelief = await prisma.belief.upsert({
    where: { slug: 'all-humans-deserve-basic-dignity' },
    update: {},
    create: {
      slug: 'all-humans-deserve-basic-dignity',
      statement: 'All humans deserve a basic level of material dignity regardless of employment status',
      category: 'Philosophy',
      subcategory: 'Ethics',
      deweyNumber: '170',
      positivity: 75,
    },
  })

  const marketFreedomBelief = await prisma.belief.upsert({
    where: { slug: 'free-markets-allocate-best' },
    update: {},
    create: {
      slug: 'free-markets-allocate-best',
      statement: 'Free markets allocate resources more efficiently than government programs',
      category: 'Economics',
      subcategory: 'Market Theory',
      deweyNumber: '330.1',
      positivity: 40,
    },
  })

  // Similar beliefs (more extreme / more moderate)
  const extremeBelief = await prisma.belief.upsert({
    where: { slug: 'fully-automated-luxury-communism' },
    update: {},
    create: {
      slug: 'fully-automated-luxury-communism',
      statement: 'Society should transition to fully automated luxury communism where all labor is automated',
      category: 'Political Philosophy',
      subcategory: 'Post-Capitalism',
      deweyNumber: '335',
      positivity: 15,
    },
  })

  const moderateBelief = await prisma.belief.upsert({
    where: { slug: 'negative-income-tax' },
    update: {},
    create: {
      slug: 'negative-income-tax',
      statement: 'A negative income tax would be a better approach than UBI to ensure a basic income floor',
      category: 'Economics',
      subcategory: 'Tax Policy',
      deweyNumber: '336.2',
      positivity: 35,
    },
  })

  // Create arguments (reasons linking beliefs to the main belief)
  await prisma.argument.createMany({
    data: [
      {
        parentBeliefId: mainBelief.id,
        beliefId: automationBelief.id,
        side: 'agree',
        linkageScore: 0.75,
        impactScore: 18.5,
        linkageType: 'STRONG_CAUSAL',
      },
      {
        parentBeliefId: mainBelief.id,
        beliefId: povertyBelief.id,
        side: 'agree',
        linkageScore: 0.8,
        impactScore: 22.1,
        linkageType: 'STRONG_CAUSAL',
      },
      {
        parentBeliefId: mainBelief.id,
        beliefId: bureaucracyBelief.id,
        side: 'agree',
        linkageScore: 0.5,
        impactScore: 8.3,
        linkageType: 'CONTEXTUAL',
      },
      {
        parentBeliefId: mainBelief.id,
        beliefId: inflationBelief.id,
        side: 'disagree',
        linkageScore: 0.6,
        impactScore: 12.4,
        linkageType: 'STRONG_CAUSAL',
      },
      {
        parentBeliefId: mainBelief.id,
        beliefId: workIncentiveBelief.id,
        side: 'disagree',
        linkageScore: 0.45,
        impactScore: 9.2,
        linkageType: 'CONTEXTUAL',
      },
      {
        parentBeliefId: mainBelief.id,
        beliefId: fiscalBelief.id,
        side: 'disagree',
        linkageScore: 0.7,
        impactScore: 15.8,
        linkageType: 'STRONG_CAUSAL',
      },
    ],
  })

  // Create evidence
  await prisma.evidence.createMany({
    data: [
      {
        beliefId: mainBelief.id,
        side: 'supporting',
        description: 'Finland UBI pilot (2017-2018): Recipients showed improved well-being and modest employment effects',
        sourceUrl: 'https://julkaisut.valtioneuvosto.fi/handle/10024/161361',
        evidenceType: 'T1',
        sourceIndependenceWeight: 1.0,
        replicationQuantity: 3,
        conclusionRelevance: 0.7,
        replicationPercentage: 0.8,
        linkageScore: 0.7,
        impactScore: 8.5,
      },
      {
        beliefId: mainBelief.id,
        side: 'supporting',
        description: 'GiveDirectly long-term study in Kenya: Cash transfers led to sustained economic gains',
        sourceUrl: 'https://www.givedirectly.org/research-on-cash-transfers/',
        evidenceType: 'T1',
        sourceIndependenceWeight: 1.0,
        replicationQuantity: 5,
        conclusionRelevance: 0.6,
        replicationPercentage: 0.85,
        linkageScore: 0.6,
        impactScore: 7.2,
      },
      {
        beliefId: mainBelief.id,
        side: 'supporting',
        description: 'Stockton SEED program: Recipients found full-time employment at twice the rate of control group',
        evidenceType: 'T2',
        sourceIndependenceWeight: 0.75,
        replicationQuantity: 1,
        conclusionRelevance: 0.8,
        replicationPercentage: 1.0,
        linkageScore: 0.65,
        impactScore: 6.1,
      },
      {
        beliefId: mainBelief.id,
        side: 'weakening',
        description: 'Alaska Permanent Fund Dividend: No measurable reduction in poverty rates despite 40+ years of payments',
        evidenceType: 'T2',
        sourceIndependenceWeight: 0.75,
        replicationQuantity: 2,
        conclusionRelevance: 0.5,
        replicationPercentage: 0.6,
        linkageScore: 0.5,
        impactScore: 4.8,
      },
      {
        beliefId: mainBelief.id,
        side: 'weakening',
        description: 'Survey data suggests majority of UBI pilot participants would prefer targeted programs to universal payments',
        evidenceType: 'T3',
        sourceIndependenceWeight: 0.5,
        replicationQuantity: 2,
        conclusionRelevance: 0.4,
        replicationPercentage: 0.5,
        linkageScore: 0.4,
        impactScore: 3.2,
      },
    ],
  })

  // Create objective criteria
  await prisma.objectiveCriteria.createMany({
    data: [
      {
        beliefId: mainBelief.id,
        description: 'Randomized controlled trial results from UBI pilots in multiple countries',
        independenceScore: 0.9,
        linkageScore: 0.7,
        criteriaType: 'scientific judgment',
        totalScore: 6.3,
      },
      {
        beliefId: mainBelief.id,
        description: 'Cost projections from independent fiscal analysis organizations (CBO, IFS)',
        independenceScore: 0.85,
        linkageScore: 0.8,
        criteriaType: 'market value',
        totalScore: 6.8,
      },
      {
        beliefId: mainBelief.id,
        description: 'Labor market participation data from existing cash transfer programs',
        independenceScore: 0.8,
        linkageScore: 0.65,
        criteriaType: 'scientific judgment',
        totalScore: 5.2,
      },
    ],
  })

  // Create values analysis
  await prisma.valuesAnalysis.upsert({
    where: { beliefId: mainBelief.id },
    update: {},
    create: {
      beliefId: mainBelief.id,
      supportingAdvertised: '1. Economic security for all citizens\n2. Freedom from poverty trap\n3. Simplification of welfare state',
      supportingActual: '1. Genuine concern about technological unemployment\n2. Desire for political support from beneficiaries\n3. Ideological commitment to equality of outcomes',
      opposingAdvertised: '1. Fiscal responsibility\n2. Preserving work ethic\n3. Targeted help for those truly in need',
      opposingActual: '1. Concern about tax increases on high earners\n2. Ideological commitment to meritocracy\n3. Skepticism of government competence',
    },
  })

  // Create interests analysis
  await prisma.interestsAnalysis.upsert({
    where: { beliefId: mainBelief.id },
    update: {},
    create: {
      beliefId: mainBelief.id,
      supporterInterests: '1. Workers at risk of automation displacement\n2. People in precarious employment (gig economy)\n3. Anti-poverty advocates and researchers',
      opponentInterests: '1. Fiscal conservatives concerned about government spending\n2. Employers who benefit from labor market pressure\n3. Existing welfare bureaucracy administrators',
      sharedInterests: '1. Desire for economic growth and stability\n2. Reducing extreme poverty and homelessness',
      conflictingInterests: '1. Tax burden distribution\n2. Role of government vs. market in resource allocation',
    },
  })

  // Create assumptions
  await prisma.assumption.createMany({
    data: [
      { beliefId: mainBelief.id, side: 'accept', statement: 'Technological unemployment will accelerate and create structural joblessness', strength: 'CRITICAL' },
      { beliefId: mainBelief.id, side: 'accept', statement: 'Current welfare systems are insufficient for the scale of displacement coming', strength: 'STRONG' },
      { beliefId: mainBelief.id, side: 'accept', statement: 'People will continue to be productive even with guaranteed income', strength: 'MODERATE' },
      { beliefId: mainBelief.id, side: 'reject', statement: 'Market forces will create sufficient new jobs to replace displaced ones', strength: 'CRITICAL' },
      { beliefId: mainBelief.id, side: 'reject', statement: 'Targeted welfare programs are more cost-effective than universal ones', strength: 'STRONG' },
      { beliefId: mainBelief.id, side: 'reject', statement: 'Work incentives are primarily driven by financial necessity', strength: 'MODERATE' },
    ],
  })

  // Create cost-benefit analysis
  await prisma.costBenefitAnalysis.upsert({
    where: { beliefId: mainBelief.id },
    update: {},
    create: {
      beliefId: mainBelief.id,
      benefits: '1. Improvements: Poverty elimination, reduced administrative overhead\n2. Who gains: Low-income workers, gig economy workers, caregivers\n3. Positive externalities: Reduced crime, better health outcomes, more entrepreneurship',
      benefitLikelihood: 0.65,
      costs: '1. Problems created: Massive fiscal cost ($2-4T annually in US), potential inflation\n2. Who loses: High earners via taxation, existing welfare administrators\n3. Negative externalities: Possible reduction in labor supply, dependency concerns',
      costLikelihood: 0.7,
    },
  })

  // Create impact analysis
  await prisma.impactAnalysis.upsert({
    where: { beliefId: mainBelief.id },
    update: {},
    create: {
      beliefId: mainBelief.id,
      shortTermEffects: '1. Immediate poverty reduction for recipients\n2. Boost to consumer spending and local economies',
      shortTermCosts: '1. Massive fiscal cost requiring new revenue sources\n2. Potential inflationary pressure in housing and basic goods',
      longTermEffects: '1. Shift in cultural relationship with work\n2. Enablement of creative and entrepreneurial risk-taking',
      longTermChanges: '1. Potential restructuring of labor markets\n2. Evolution of the social contract between citizens and state',
    },
  })

  // Create compromises
  await prisma.compromise.createMany({
    data: [
      { beliefId: mainBelief.id, description: 'Implement a smaller UBI ($500/month) supplementing existing programs rather than replacing them' },
      { beliefId: mainBelief.id, description: 'Phase in UBI gradually starting with most vulnerable populations, expanding over 10 years' },
      { beliefId: mainBelief.id, description: 'Fund UBI through a combination of carbon tax, VAT, and automation tax rather than income tax alone' },
    ],
  })

  // Create obstacles
  await prisma.obstacle.createMany({
    data: [
      { beliefId: mainBelief.id, side: 'supporter', description: 'Difficulty acknowledging that some recipients may reduce work effort significantly' },
      { beliefId: mainBelief.id, side: 'supporter', description: 'Incentive to overstate automation threat to justify urgency' },
      { beliefId: mainBelief.id, side: 'opposition', description: 'Difficulty acknowledging that current welfare is inadequate and bureaucratic' },
      { beliefId: mainBelief.id, side: 'opposition', description: 'Incentive to defend status quo due to vested interests in existing system' },
    ],
  })

  // Create biases
  await prisma.biasEntry.createMany({
    data: [
      { beliefId: mainBelief.id, side: 'supporter', biasType: 'CONFIRMATION_BIAS', description: 'Selectively citing positive UBI pilot results while ignoring mixed findings' },
      { beliefId: mainBelief.id, side: 'supporter', biasType: 'AVAILABILITY_HEURISTIC', description: 'Overweighting dramatic automation stories (self-driving trucks) vs. gradual adaptation' },
      { beliefId: mainBelief.id, side: 'opponent', biasType: 'CONFIRMATION_BIAS', description: 'Focusing on anecdotal examples of welfare dependency while ignoring structural factors' },
      { beliefId: mainBelief.id, side: 'opponent', biasType: 'STATUS_QUO_BIAS', description: 'Preferring current system despite its demonstrated failures, simply because it exists' },
    ],
  })

  // Create media resources
  await prisma.mediaResource.createMany({
    data: [
      { beliefId: mainBelief.id, side: 'supporting', mediaType: 'book', title: 'Utopia for Realists', author: 'Rutger Bregman' },
      { beliefId: mainBelief.id, side: 'supporting', mediaType: 'book', title: 'Give People Money', author: 'Annie Lowrey' },
      { beliefId: mainBelief.id, side: 'supporting', mediaType: 'article', title: 'The Case for Universal Basic Income', author: 'Stanford Basic Income Lab' },
      { beliefId: mainBelief.id, side: 'supporting', mediaType: 'podcast', title: 'The Ezra Klein Show: Andrew Yang on UBI' },
      { beliefId: mainBelief.id, side: 'opposing', mediaType: 'book', title: 'The War on Normal People (critique sections)', author: 'Andrew Yang' },
      { beliefId: mainBelief.id, side: 'opposing', mediaType: 'article', title: 'Why Universal Basic Income Is a Bad Idea', author: 'Eduardo Porter, NYT' },
      { beliefId: mainBelief.id, side: 'opposing', mediaType: 'podcast', title: 'EconTalk: The Costs of Universal Basic Income' },
    ],
  })

  // Create legal entries
  await prisma.legalEntry.createMany({
    data: [
      { beliefId: mainBelief.id, side: 'supporting', description: 'Alaska Permanent Fund Dividend Act (1982) - precedent for universal cash payments', jurisdiction: 'state' },
      { beliefId: mainBelief.id, side: 'supporting', description: 'Universal Declaration of Human Rights, Article 25 - right to adequate standard of living', jurisdiction: 'international' },
      { beliefId: mainBelief.id, side: 'contradicting', description: 'Personal Responsibility and Work Opportunity Act (1996) - work requirements for benefits', jurisdiction: 'federal' },
      { beliefId: mainBelief.id, side: 'contradicting', description: 'Various state laws requiring work-search for unemployment benefits', jurisdiction: 'state' },
    ],
  })

  // Create belief mappings (upstream = more general, downstream = more specific)
  await prisma.beliefMapping.createMany({
    data: [
      { parentBeliefId: humanDignityBelief.id, childBeliefId: mainBelief.id, direction: 'upstream', side: 'support' },
      { parentBeliefId: marketFreedomBelief.id, childBeliefId: mainBelief.id, direction: 'upstream', side: 'oppose' },
    ],
  })

  // Create similar beliefs
  await prisma.similarBelief.createMany({
    data: [
      { fromBeliefId: mainBelief.id, toBeliefId: extremeBelief.id, variant: 'extreme' },
      { fromBeliefId: mainBelief.id, toBeliefId: moderateBelief.id, variant: 'moderate' },
    ],
  })

  console.log('Belief analysis seed completed!')
  console.log(`Main belief: /beliefs/${mainBelief.slug}`)
  console.log(`Total beliefs created: 11`)
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
