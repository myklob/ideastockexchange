import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Seeding belief analysis data...')

  // Create main belief
  const mainBelief = await prisma.belief.upsert({
    where: { slug: 'universal-basic-income-should-be-implemented' },
    update: { highStakes: true },
    create: {
      slug: 'universal-basic-income-should-be-implemented',
      statement: 'Universal Basic Income should be implemented in developed nations',
      category: 'Economics',
      subcategory: 'Social Policy',
      deweyNumber: '362.5',
      positivity: 25,
      specificity: 0.55,
      claimStrength: 0.6,
      // Posting here goes through the speed-bump flow (steelman + principle).
      highStakes: true,
    },
  })

  // Header metadata, Net Belief Score interpretation, and the two-sided
  // Falsifiability Test text (new template). Applied explicitly because the
  // upsert above uses `update: {}` and would otherwise skip existing rows.
  await prisma.belief.update({
    where: { id: mainBelief.id },
    data: {
      netInterpretation: 'Pro arguments modestly outweigh con arguments; the debate turns on the size and funding of the transfer, not the principle.',
      relatedBeliefs: 'Negative income tax is the better instrument | Job guarantee beats cash transfers',
      supportsBeliefs: 'A humane economy guarantees a material floor | Automation gains should be broadly shared',
      falsifiabilityConfirm: 'Large randomized pilots show sustained well-being gains with no material drop in labor-force participation.',
      falsifiabilityFalsify: 'Large pilots show significant, lasting withdrawal from work or net welfare losses once funded at scale.',
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
      specificity: 0.4,
      claimStrength: 0.6,
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
      specificity: 0.15,
      claimStrength: 0.5,
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
      specificity: 0.55,
      claimStrength: 0.5,
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
      specificity: 0.5,
      claimStrength: 0.7,
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
      specificity: 0.5,
      claimStrength: 0.7,
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
      specificity: 0.5,
      claimStrength: 0.7,
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
      specificity: 0.05,
      claimStrength: 0.5,
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
      specificity: 0.1,
      claimStrength: 0.6,
    },
  })

  // Downstream conclusions: more specific beliefs that follow if the main belief is true.
  // These exist so the propagation cascade in src/lib/propagate-belief-scores.ts has
  // something to traverse on the seeded UBI page.
  const ubiFundingBelief = await prisma.belief.upsert({
    where: { slug: 'ubi-should-be-funded-by-vat' },
    update: {},
    create: {
      slug: 'ubi-should-be-funded-by-vat',
      statement: 'UBI should be funded primarily through a value-added tax',
      category: 'Economics',
      subcategory: 'Tax Policy',
      deweyNumber: '336.27',
      positivity: 30,
      specificity: 0.85,
      claimStrength: 0.6,
    },
  })

  const ubiAmountBelief = await prisma.belief.upsert({
    where: { slug: 'ubi-should-equal-poverty-line' },
    update: {},
    create: {
      slug: 'ubi-should-equal-poverty-line',
      statement: 'UBI payments should be set at the federal poverty line, not below',
      category: 'Economics',
      subcategory: 'Social Policy',
      deweyNumber: '362.58',
      positivity: 40,
      specificity: 0.8,
      claimStrength: 0.7,
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
      specificity: 0.5,
      claimStrength: 1.0,
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
      specificity: 0.6,
      claimStrength: 0.5,
    },
  })

  // Create arguments (reasons linking beliefs to the main belief).
  // Skip when edges already exist so re-running never double-counts a side
  // (duplicated rows would silently inflate every net and OCV verdict).
  // A delete-first guard would trip the FK constraints of linkage sub-debate
  // rows seeded later in the chain.
  const existingEdges = await prisma.argument.count({
    where: { parentBeliefId: { in: [mainBelief.id, moderateBelief.id, extremeBelief.id] } },
  })
  if (existingEdges > 0) {
    console.log('Argument edges already seeded; skipping edge creation.')
  } else {
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

  // Argument trees for the RIVAL options in the income-floor contrast class.
  // The denominator framework (docs/THE_DENOMINATOR.md) prices UBI against its
  // rivals, so each rival needs its own scored tree for OCV to be real and
  // traceable rather than a fabricated constant. Negative income tax reuses the
  // shared pro-beliefs (poverty reduction, lower bureaucracy) and is weakened by
  // the same fiscal worry; automated luxury communism shares the automation
  // premise but is dragged down by the fiscal-sustainability and work-incentive cons.
  await prisma.argument.createMany({
    data: [
      // Negative income tax (moderateBelief) — a strong, well-supported rival.
      { parentBeliefId: moderateBelief.id, beliefId: povertyBelief.id, side: 'agree', linkageScore: 0.8, impactScore: 21.0, linkageType: 'STRONG_CAUSAL' },
      { parentBeliefId: moderateBelief.id, beliefId: bureaucracyBelief.id, side: 'agree', linkageScore: 0.6, impactScore: 14.0, linkageType: 'CONTEXTUAL' },
      { parentBeliefId: moderateBelief.id, beliefId: marketFreedomBelief.id, side: 'agree', linkageScore: 0.55, impactScore: 11.0, linkageType: 'CONTEXTUAL' },
      { parentBeliefId: moderateBelief.id, beliefId: fiscalBelief.id, side: 'disagree', linkageScore: 0.5, impactScore: 9.0, linkageType: 'STRONG_CAUSAL' },
      // Fully automated luxury communism (extremeBelief) — a weak rival: shares
      // the automation premise but loses badly on fiscal and work-incentive cons.
      { parentBeliefId: extremeBelief.id, beliefId: automationBelief.id, side: 'agree', linkageScore: 0.7, impactScore: 16.0, linkageType: 'STRONG_CAUSAL' },
      { parentBeliefId: extremeBelief.id, beliefId: fiscalBelief.id, side: 'disagree', linkageScore: 0.8, impactScore: 24.0, linkageType: 'STRONG_CAUSAL' },
      { parentBeliefId: extremeBelief.id, beliefId: workIncentiveBelief.id, side: 'disagree', linkageScore: 0.65, impactScore: 18.0, linkageType: 'STRONG_CAUSAL' },
    ],
  })
  }

  // Create evidence. Wipe this seed's rows first so re-running never
  // duplicates them (duplicates silently multiply the evidence totals).
  await prisma.evidence.deleteMany({ where: { beliefId: mainBelief.id } })
  await prisma.evidence.createMany({
    data: [
      {
        beliefId: mainBelief.id,
        side: 'supporting',
        description: 'Finland UBI pilot (2017-2018): Recipients showed improved well-being and modest employment effects',
        sourceUrl: 'https://julkaisut.valtioneuvosto.fi/handle/10024/161361',
        evidenceType: 'T1',
        verificationStatus: 'VERIFIED',
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
        verificationStatus: 'VERIFIED',
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
  // Criteria quality lives on a 0-1 scale (it multiplies into the impact of
  // evidence measured by the yardstick). Wipe-then-create so re-running never
  // duplicates rows; evidence for this belief was wiped above, so no
  // measured-by references dangle.
  await prisma.objectiveCriteria.deleteMany({ where: { beliefId: mainBelief.id } })
  await prisma.objectiveCriteria.createMany({
    data: [
      {
        beliefId: mainBelief.id,
        description: 'Randomized controlled trial results from UBI pilots in multiple countries',
        validityScore: 0.8,
        reliabilityScore: 0.7,
        independenceScore: 0.9,
        linkageScore: 0.7,
        criteriaType: 'scientific judgment',
        totalScore: 0.78,
      },
      {
        beliefId: mainBelief.id,
        description: 'Cost projections from independent fiscal analysis organizations (CBO, IFS)',
        validityScore: 0.75,
        reliabilityScore: 0.8,
        independenceScore: 0.85,
        linkageScore: 0.8,
        criteriaType: 'market value',
        totalScore: 0.8,
      },
      {
        beliefId: mainBelief.id,
        description: 'Labor market participation data from existing cash transfer programs',
        validityScore: 0.7,
        reliabilityScore: 0.75,
        independenceScore: 0.8,
        linkageScore: 0.65,
        criteriaType: 'scientific judgment',
        totalScore: 0.72,
      },
      // The weak yardstick, on purpose: sentiment measures perception, not
      // outcomes. Its quality sub-debate (seed-criterion-debates.ts) argues it
      // further down, and the survey evidence row linked to it gets filtered.
      {
        beliefId: mainBelief.id,
        description: 'Public opinion surveys on UBI satisfaction',
        validityScore: 0.3,
        reliabilityScore: 0.4,
        independenceScore: 0.5,
        linkageScore: 0.35,
        criteriaType: 'public sentiment',
        totalScore: 0.39,
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

  // Row-based cost/benefit items feeding the conflict-resolution pipeline.
  // Categories keep unlike units apart; the dollars category is deliberately
  // close (net +$20B) so the compromise-candidate detector has a real, small,
  // achievable likelihood shift to surface, while hours is deliberately far
  // apart (a symbolic disagreement no small shift can flip).
  await prisma.costBenefitItem.deleteMany({ where: { beliefId: mainBelief.id } })
  await prisma.costBenefitItem.createMany({
    data: [
      { beliefId: mainBelief.id, side: 'benefit', claim: 'Cuts welfare administration overhead', category: 'dollars ($B/yr)', magnitude: 150, likelihood: 0.8, expectedValue: 120 },
      { beliefId: mainBelief.id, side: 'benefit', claim: 'Consumption boost to local economies', category: 'dollars ($B/yr)', magnitude: 300, likelihood: 0.6, expectedValue: 180 },
      { beliefId: mainBelief.id, side: 'cost', claim: 'Net fiscal outlay after replaced programs', category: 'dollars ($B/yr)', magnitude: 400, likelihood: 0.7, expectedValue: 280 },
      { beliefId: mainBelief.id, side: 'benefit', claim: 'Time returned to caregivers and students', category: 'hours (B/yr)', magnitude: 120, likelihood: 0.75, expectedValue: 90 },
      { beliefId: mainBelief.id, side: 'cost', claim: 'Reduced labor-force participation hours', category: 'hours (B/yr)', magnitude: 500, likelihood: 0.4, expectedValue: 200 },
      { beliefId: mainBelief.id, side: 'benefit', claim: 'Ends means-test surveillance and paperwork', category: 'freedom (index)', magnitude: 80, likelihood: 0.7, expectedValue: 56, claimBeliefId: bureaucracyBelief.id },
    ],
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

  // Create belief mappings (upstream = more general, downstream = more specific).
  // Upstream: foundational principles you must accept to hold mainBelief.
  // Downstream: implementation choices that follow if mainBelief is true.
  await prisma.beliefMapping.createMany({
    data: [
      // Upstream
      { parentBeliefId: humanDignityBelief.id, childBeliefId: mainBelief.id, direction: 'upstream', side: 'support' },
      { parentBeliefId: marketFreedomBelief.id, childBeliefId: mainBelief.id, direction: 'upstream', side: 'oppose' },
      // Downstream
      { parentBeliefId: mainBelief.id, childBeliefId: ubiFundingBelief.id, direction: 'downstream', side: 'support' },
      { parentBeliefId: mainBelief.id, childBeliefId: ubiAmountBelief.id, direction: 'downstream', side: 'support' },
    ],
  })

  // Create similar beliefs
  await prisma.similarBelief.createMany({
    data: [
      { fromBeliefId: mainBelief.id, toBeliefId: extremeBelief.id, variant: 'extreme' },
      { fromBeliefId: mainBelief.id, toBeliefId: moderateBelief.id, variant: 'moderate' },
    ],
  })

  // ── New-template enrichment for the flagship belief ──────────────────────
  // Argument cells: claim label, famous quote inline, submitter, and the
  // argument's own displayed Score (distinct from computed Impact).
  await prisma.argument.updateMany({
    where: { parentBeliefId: mainBelief.id, beliefId: automationBelief.id },
    data: {
      claim: 'Automation will displace workers at scale',
      famousQuote: 'The future is already here — it is just not evenly distributed.',
      quoteAuthor: 'Myclob',
      quoteAuthorUrl: '/Myclob',
      argumentScore: 62,
    },
  })
  await prisma.argument.updateMany({
    where: { parentBeliefId: mainBelief.id, beliefId: povertyBelief.id },
    data: { claim: 'Cash directly reduces poverty', argumentScore: 71 },
  })
  await prisma.argument.updateMany({
    where: { parentBeliefId: mainBelief.id, beliefId: bureaucracyBelief.id },
    data: { claim: 'Cuts welfare bureaucracy', argumentScore: 40 },
  })
  await prisma.argument.updateMany({
    where: { parentBeliefId: mainBelief.id, beliefId: inflationBelief.id },
    data: { claim: 'Risks demand-pull inflation', argumentScore: -48 },
  })
  await prisma.argument.updateMany({
    where: { parentBeliefId: mainBelief.id, beliefId: workIncentiveBelief.id },
    data: { claim: 'Weakens work incentives', argumentScore: -36 },
  })
  await prisma.argument.updateMany({
    where: { parentBeliefId: mainBelief.id, beliefId: fiscalBelief.id },
    data: { claim: 'Fiscally unsustainable at scale', argumentScore: -55 },
  })

  // Advertised-vs-actual divergence + "what would shift rankings".
  await prisma.valuesAnalysis.update({
    where: { beliefId: mainBelief.id },
    data: {
      supportingDivergenceEvidence: 'Support tracks expected personal benefit more than stated concern for displacement.',
      opposingDivergenceEvidence: 'Opposition softens sharply when the transfer is framed as a tax cut / dividend.',
      whatWouldShift: 'Large-scale RCTs showing durable labor-force participation would move opponents; clear evidence of work withdrawal would move supporters.',
    },
  })

  // Primary Conflict Pair.
  await prisma.interestsAnalysis.update({
    where: { beliefId: mainBelief.id },
    data: {
      primaryPairSupporter: 'Security against displacement',
      primaryPairSupporterValidity: 78,
      primaryPairSupporterClaim: 'Strong',
      primaryPairSupporterDrives: 'Accelerating automation raises the perceived likelihood and scale of involuntary job loss.',
      primaryPairOpponent: 'Protecting the tax base / work norm',
      primaryPairOpponentValidity: 64,
      primaryPairOpponentClaim: 'Moderate',
      primaryPairOpponentDrives: 'Fear that an unconditional floor erodes both the funding base and the cultural expectation of work.',
    },
  })

  // Objective Criteria: How to Measure / Current Status / Target.
  const criteriaUpdates: Array<[string, { howToMeasure: string; currentStatus: string; target: string }]> = [
    ['Labor-force participation', { howToMeasure: 'BLS labor-force participation rate among working-age recipients', currentStatus: 'Pilots: flat to slightly positive', target: 'No sustained drop > 1pp at national scale' }],
    ['Poverty rate', { howToMeasure: 'Supplemental Poverty Measure pre/post transfer', currentStatus: 'Falls in every cash-transfer study', target: 'Sustained reduction ≥ 3pp' }],
    ['Well-being', { howToMeasure: 'Validated subjective well-being and mental-health indices', currentStatus: 'Consistent improvement in pilots', target: 'Replicated gains at population scale' }],
  ]
  const existingCriteria = await prisma.objectiveCriteria.findMany({ where: { beliefId: mainBelief.id } })
  for (const c of existingCriteria) {
    const match = criteriaUpdates.find(([k]) => c.description.toLowerCase().includes(k.toLowerCase().split(' ')[0]))
    if (match) await prisma.objectiveCriteria.update({ where: { id: c.id }, data: match[1] })
  }

  // Best Compromise Solutions: 3-column form.
  const compromiseRows = await prisma.compromise.findMany({ where: { beliefId: mainBelief.id }, orderBy: { id: 'asc' } })
  const compromiseData = [
    { sharedPremise: 'A material floor is worth guaranteeing', synthesis: 'Start with a $500/mo supplement on top of existing programs', whyDifficult: 'Both sides dislike a partial measure — too small for advocates, still costly for critics' },
    { sharedPremise: 'The most vulnerable should be reached first', synthesis: 'Phase in by need over 10 years, expanding as evidence accrues', whyDifficult: 'Phase-in reintroduces means-testing the universality is meant to remove' },
    { sharedPremise: 'Funding should not fall on wages alone', synthesis: 'Blend carbon tax, VAT, and an automation levy', whyDifficult: 'Each funding source has its own organized opposition' },
  ]
  for (let i = 0; i < compromiseRows.length && i < compromiseData.length; i++) {
    await prisma.compromise.update({ where: { id: compromiseRows[i].id }, data: compromiseData[i] })
  }

  // New relational models (idempotent: clear then recreate).
  await prisma.valueRanking.deleteMany({ where: { beliefId: mainBelief.id } })
  await prisma.valueRanking.createMany({
    data: [
      { beliefId: mainBelief.id, value: 'Security', supporterRank: 1, opponentRank: 3, whyDiffer: 'Supporters foreground protection against displacement; opponents see security as already provided by markets and existing safety nets.', sortOrder: 0 },
      { beliefId: mainBelief.id, value: 'Liberty', supporterRank: 2, opponentRank: 1, whyDiffer: 'Opponents prize freedom from coercive taxation; supporters frame liberty as freedom from economic precarity.', sortOrder: 1 },
      { beliefId: mainBelief.id, value: 'Fairness', supporterRank: 3, opponentRank: 2, whyDiffer: 'Supporters read fairness as a shared floor; opponents read it as reward proportional to contribution.', sortOrder: 2 },
    ],
  })

  // Clear dependent satisfaction rows first (seeded later in the chain by
  // seed-interests-example.ts) so re-running the chain never FK-fails here.
  await prisma.interestSatisfaction.deleteMany({
    where: { interest: { beliefId: mainBelief.id } },
  })
  await prisma.interestEntry.deleteMany({ where: { beliefId: mainBelief.id } })
  await prisma.interestEntry.createMany({
    data: [
      { beliefId: mainBelief.id, side: 'supporter', interest: 'Security against automation', prevalence: 'High', linkageConfidence: 'High', validity: '75', evidenceBasis: 'Displacement forecasts', connectedValue: 'Security', sortOrder: 0 },
      { beliefId: mainBelief.id, side: 'supporter', interest: 'Reduced poverty', prevalence: 'High', linkageConfidence: 'High', validity: '80', evidenceBasis: 'Cash-transfer RCTs', connectedValue: 'Fairness', sortOrder: 1 },
      { beliefId: mainBelief.id, side: 'supporter', interest: 'Expecting net personal gain', prevalence: 'Med', linkageConfidence: 'Med', validity: '15', evidenceBasis: 'Self-interest', connectedValue: '—', pretextual: true, sortOrder: 2 },
      { beliefId: mainBelief.id, side: 'opponent', interest: 'Protecting the tax base', prevalence: 'High', linkageConfidence: 'High', validity: '70', evidenceBasis: 'Fiscal modeling', connectedValue: 'Liberty', sortOrder: 0 },
      { beliefId: mainBelief.id, side: 'opponent', interest: 'Preserving the work norm', prevalence: 'High', linkageConfidence: 'Med', validity: '55', evidenceBasis: 'Labor-supply theory', connectedValue: 'Fairness', sortOrder: 1 },
      { beliefId: mainBelief.id, side: 'opponent', interest: 'Defending incumbent programs', prevalence: 'Low', linkageConfidence: 'Med', validity: '18', evidenceBasis: 'Institutional interest', connectedValue: '—', pretextual: true, sortOrder: 2 },
    ],
  })

  await prisma.sharedInterest.deleteMany({ where: { beliefId: mainBelief.id } })
  await prisma.sharedInterest.createMany({
    data: [
      { beliefId: mainBelief.id, interest: 'Nobody should fall into destitution', validity: '85', compromiseDirection: 'Agree on a guaranteed floor; negotiate its size and funding', sortOrder: 0 },
      { beliefId: mainBelief.id, interest: 'Spending should be efficient', validity: '80', compromiseDirection: 'Pair cash with administrative-cost transparency and sunset reviews', sortOrder: 1 },
    ],
  })

  await prisma.disputeType.deleteMany({ where: { beliefId: mainBelief.id } })
  await prisma.disputeType.createMany({
    data: [
      { beliefId: mainBelief.id, disputeType: 'Empirical', disagreement: 'Whether a national UBI reduces labor-force participation', evidenceThatMoves: 'Large randomized trials at scale measuring participation over 5+ years', sortOrder: 0 },
      { beliefId: mainBelief.id, disputeType: 'Definitional', disagreement: 'Whether "universal" must mean unconditional and untapered', evidenceThatMoves: 'Agreement on whether a tapered negative income tax counts as UBI', sortOrder: 1 },
      { beliefId: mainBelief.id, disputeType: 'Values', disagreement: 'Whether a floor should be unconditional or tied to contribution', evidenceThatMoves: 'No evidence resolves this — it is a values ranking, surfaced for honesty', sortOrder: 2 },
    ],
  })

  console.log('Belief analysis seed completed!')
  console.log(`Main belief: /beliefs/${mainBelief.slug}`)
  console.log(`Total beliefs created: 13`)
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
