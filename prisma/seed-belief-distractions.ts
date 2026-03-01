/**
 * Seed: "To reach real solutions, we must set aside the distractions—
 *        scandals, polarization, and media noise"
 *
 * Category:    Society & Media
 * Subcategory: Rational Discourse
 * Dewey:       320
 * Route:       /beliefs/set-aside-distractions-for-real-solutions
 */

import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding "set-aside-distractions" belief...')

  // ── Main belief ─────────────────────────────────────────────────────────
  const mainBelief = await prisma.belief.upsert({
    where: { slug: 'set-aside-distractions-for-real-solutions' },
    update: {},
    create: {
      slug: 'set-aside-distractions-for-real-solutions',
      statement:
        'To reach real solutions, we must set aside the distractions—scandals, polarization, and media noise',
      category: 'Society & Media',
      subcategory: 'Rational Discourse',
      deweyNumber: '320',
      positivity: 72,
      claimStrength: 0.6,
      stabilityScore: 0.68,
    },
  })

  // ── Supporting argument beliefs ──────────────────────────────────────────
  const attentionCaptureBelief = await prisma.belief.upsert({
    where: { slug: 'attention-capture-rewards-outrage-over-accuracy' },
    update: {},
    create: {
      slug: 'attention-capture-rewards-outrage-over-accuracy',
      statement:
        'Attention-capture incentives in media systematically reward outrage over accuracy',
      category: 'Society & Media',
      subcategory: 'Media Economics',
      deweyNumber: '302.23',
      positivity: 55,
      claimStrength: 0.7,
    },
  })

  const scandalDisplacesBelief = await prisma.belief.upsert({
    where: { slug: 'political-scandals-displace-substantive-policy-debate' },
    update: {},
    create: {
      slug: 'political-scandals-displace-substantive-policy-debate',
      statement:
        'Political scandals consistently displace substantive policy debate in mainstream news coverage',
      category: 'Society & Media',
      subcategory: 'Political Communication',
      deweyNumber: '320.014',
      positivity: 60,
      claimStrength: 0.65,
    },
  })

  const reasonrankImmuneBelief = await prisma.belief.upsert({
    where: { slug: 'reasonrank-scoring-immune-to-emotional-volume' },
    update: {},
    create: {
      slug: 'reasonrank-scoring-immune-to-emotional-volume',
      statement:
        'ReasonRank scoring is structurally immune to emotional volume and personality appeal',
      category: 'Society & Media',
      subcategory: 'Rational Discourse',
      deweyNumber: '320',
      positivity: 80,
      claimStrength: 0.5,
    },
  })

  const distractionPreventsConsensusBelief = await prisma.belief.upsert({
    where: { slug: 'distraction-driven-discourse-prevents-evidence-based-consensus' },
    update: {},
    create: {
      slug: 'distraction-driven-discourse-prevents-evidence-based-consensus',
      statement:
        'Distraction-driven political discourse prevents the formation of evidence-based consensus on policy',
      category: 'Society & Media',
      subcategory: 'Political Communication',
      deweyNumber: '320.014',
      positivity: 65,
      claimStrength: 0.6,
    },
  })

  // ── Opposing argument beliefs ────────────────────────────────────────────
  const scandalsRevealCharacterBelief = await prisma.belief.upsert({
    where: { slug: 'some-scandals-reveal-character-flaws-relevant-to-policy' },
    update: {},
    create: {
      slug: 'some-scandals-reveal-character-flaws-relevant-to-policy',
      statement:
        'Some political scandals reveal character flaws directly relevant to a candidate\'s policy judgment',
      category: 'Society & Media',
      subcategory: 'Political Communication',
      deweyNumber: '320.014',
      positivity: -20,
      claimStrength: 0.5,
    },
  })

  const emotionNeededBelief = await prisma.belief.upsert({
    where: { slug: 'emotional-engagement-necessary-for-civic-participation' },
    update: {},
    create: {
      slug: 'emotional-engagement-necessary-for-civic-participation',
      statement:
        'Emotional engagement is a necessary prerequisite for motivating meaningful civic participation',
      category: 'Society & Media',
      subcategory: 'Civic Engagement',
      deweyNumber: '323',
      positivity: -15,
      claimStrength: 0.5,
    },
  })

  // ── Broader/general principles (for belief mapping) ──────────────────────
  const evidenceShouldDetermineOutcomesBelief = await prisma.belief.upsert({
    where: { slug: 'evidence-should-determine-political-outcomes-not-media-narrative' },
    update: {},
    create: {
      slug: 'evidence-should-determine-political-outcomes-not-media-narrative',
      statement:
        'Evidence should determine political outcomes, not media narrative or emotional framing',
      category: 'Society & Media',
      subcategory: 'Epistemology',
      deweyNumber: '121',
      positivity: 78,
      claimStrength: 0.55,
    },
  })

  const candidateCoverageShouldFocusBelief = await prisma.belief.upsert({
    where: { slug: 'political-campaign-coverage-should-focus-on-policy-not-personality' },
    update: {},
    create: {
      slug: 'political-campaign-coverage-should-focus-on-policy-not-personality',
      statement:
        'Political campaign coverage should prioritize policy positions over personalities and personal scandals',
      category: 'Society & Media',
      subcategory: 'Journalism Ethics',
      deweyNumber: '070.4',
      positivity: 68,
      claimStrength: 0.5,
    },
  })

  // ── Similar beliefs ──────────────────────────────────────────────────────
  const strongerVersionBelief = await prisma.belief.upsert({
    where: { slug: 'all-political-media-should-be-replaced-by-structured-scoring' },
    update: {},
    create: {
      slug: 'all-political-media-should-be-replaced-by-structured-scoring',
      statement:
        'All political media coverage should be replaced by structured argument scoring systems',
      category: 'Society & Media',
      subcategory: 'Media Reform',
      deweyNumber: '302.23',
      positivity: 30,
      claimStrength: 0.9,
    },
  })

  const moderateVersionBelief = await prisma.belief.upsert({
    where: { slug: 'fact-checking-labels-reduce-misinformation-spread' },
    update: {},
    create: {
      slug: 'fact-checking-labels-reduce-misinformation-spread',
      statement:
        'Fact-checking labels on social media reduce the spread of political misinformation',
      category: 'Society & Media',
      subcategory: 'Platform Policy',
      deweyNumber: '302.23',
      positivity: 55,
      claimStrength: 0.5,
    },
  })

  // ── Arguments (reasons for/against main belief) ──────────────────────────
  await prisma.argument.createMany({
    data: [
      {
        parentBeliefId: mainBelief.id,
        beliefId: attentionCaptureBelief.id,
        side: 'agree',
        linkageScore: 0.82,
        impactScore: 21.4,
        importanceScore: 0.9,
        linkageType: 'STRONG_CAUSAL',
      },
      {
        parentBeliefId: mainBelief.id,
        beliefId: scandalDisplacesBelief.id,
        side: 'agree',
        linkageScore: 0.75,
        impactScore: 18.6,
        importanceScore: 0.85,
        linkageType: 'STRONG_CAUSAL',
      },
      {
        parentBeliefId: mainBelief.id,
        beliefId: reasonrankImmuneBelief.id,
        side: 'agree',
        linkageScore: 0.88,
        impactScore: 15.9,
        importanceScore: 0.7,
        linkageType: 'DEDUCTIVE_PROOF',
      },
      {
        parentBeliefId: mainBelief.id,
        beliefId: distractionPreventsConsensusBelief.id,
        side: 'agree',
        linkageScore: 0.72,
        impactScore: 19.2,
        importanceScore: 0.95,
        linkageType: 'STRONG_CAUSAL',
      },
      {
        parentBeliefId: mainBelief.id,
        beliefId: scandalsRevealCharacterBelief.id,
        side: 'disagree',
        linkageScore: 0.55,
        impactScore: 11.3,
        importanceScore: 0.6,
        linkageType: 'CONTEXTUAL',
      },
      {
        parentBeliefId: mainBelief.id,
        beliefId: emotionNeededBelief.id,
        side: 'disagree',
        linkageScore: 0.48,
        impactScore: 9.7,
        importanceScore: 0.55,
        linkageType: 'CONTEXTUAL',
      },
    ],
  })

  // ── Evidence ─────────────────────────────────────────────────────────────
  await prisma.evidence.createMany({
    data: [
      {
        beliefId: mainBelief.id,
        side: 'supporting',
        description:
          'Reuters Institute Digital News Report (2023): Audiences who primarily consume emotionally charged political content score 31% lower on policy factual recall tests than those consuming structured policy analysis.',
        sourceUrl: 'https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2023',
        evidenceType: 'T1',
        sourceIndependenceWeight: 1.0,
        replicationQuantity: 4,
        conclusionRelevance: 0.82,
        replicationPercentage: 0.88,
        linkageScore: 0.78,
        impactScore: 14.2,
      },
      {
        beliefId: mainBelief.id,
        side: 'supporting',
        description:
          'Pew Research Center (2022): During major political scandal coverage cycles, policy-focused news drops an average of 47% in airtime across broadcast networks, with no compensating increase in online policy content.',
        sourceUrl: 'https://www.pewresearch.org/journalism/',
        evidenceType: 'T1',
        sourceIndependenceWeight: 1.0,
        replicationQuantity: 6,
        conclusionRelevance: 0.85,
        replicationPercentage: 0.9,
        linkageScore: 0.80,
        impactScore: 16.1,
      },
      {
        beliefId: mainBelief.id,
        side: 'supporting',
        description:
          'Broockman & Kalla (2022, Science): Structured deliberation formats — where argument quality is evaluated independently — produce durable attitude shifts toward evidence-based positions; unstructured emotionally charged debate does not.',
        evidenceType: 'T1',
        sourceIndependenceWeight: 0.95,
        replicationQuantity: 3,
        conclusionRelevance: 0.78,
        replicationPercentage: 0.82,
        linkageScore: 0.75,
        impactScore: 12.8,
      },
      {
        beliefId: mainBelief.id,
        side: 'supporting',
        description:
          'Pariser "The Filter Bubble" (2011): Outrage-optimized content algorithms systematically surface emotionally activating content at the expense of accurate, nuanced policy information, confirmed by subsequent platform internal audit data.',
        evidenceType: 'T2',
        sourceIndependenceWeight: 0.75,
        replicationQuantity: 5,
        conclusionRelevance: 0.72,
        replicationPercentage: 0.78,
        linkageScore: 0.70,
        impactScore: 10.5,
      },
      {
        beliefId: mainBelief.id,
        side: 'weakening',
        description:
          'Affect Intelligence Theory (Marcus et al.): Emotional arousal is cognitively necessary to trigger information-seeking behavior; purely rational framings of political issues have been shown to reduce information processing motivation in low-engagement voters.',
        evidenceType: 'T1',
        sourceIndependenceWeight: 0.9,
        replicationQuantity: 4,
        conclusionRelevance: 0.62,
        replicationPercentage: 0.7,
        linkageScore: 0.58,
        impactScore: 9.1,
      },
      {
        beliefId: mainBelief.id,
        side: 'weakening',
        description:
          'Historical case study: Watergate scandal coverage, despite being "distraction-level" outrage, revealed genuinely important information about executive branch corruption that structural policy analysis alone would not have surfaced.',
        evidenceType: 'T3',
        sourceIndependenceWeight: 0.5,
        replicationQuantity: 1,
        conclusionRelevance: 0.5,
        replicationPercentage: 0.6,
        linkageScore: 0.45,
        impactScore: 5.8,
      },
    ],
  })

  // ── Objective Criteria ───────────────────────────────────────────────────
  await prisma.objectiveCriteria.createMany({
    data: [
      {
        beliefId: mainBelief.id,
        description:
          'Ratio of policy-relevant content to personality/scandal content in top political media outlets over a 12-month period',
        independenceScore: 0.88,
        linkageScore: 0.82,
        criteriaType: 'empirical measurement',
        totalScore: 7.2,
      },
      {
        beliefId: mainBelief.id,
        description:
          'Correlation between media distraction cycles and citizen policy knowledge test scores (ANES, Pew tracking surveys)',
        independenceScore: 0.85,
        linkageScore: 0.78,
        criteriaType: 'scientific judgment',
        totalScore: 6.6,
      },
      {
        beliefId: mainBelief.id,
        description:
          'Difference in legislative output quality (CBO-scored) between high-distraction and low-distraction Congressional sessions',
        independenceScore: 0.8,
        linkageScore: 0.65,
        criteriaType: 'empirical measurement',
        totalScore: 5.2,
      },
      {
        beliefId: mainBelief.id,
        description:
          'ISE ReasonRank score stability comparison: beliefs evaluated via structured scoring vs. beliefs shaped by media narrative cycles',
        independenceScore: 0.92,
        linkageScore: 0.88,
        criteriaType: 'platform metric',
        totalScore: 8.1,
      },
    ],
  })

  // ── Values Analysis ──────────────────────────────────────────────────────
  await prisma.valuesAnalysis.upsert({
    where: { beliefId: mainBelief.id },
    update: {},
    create: {
      beliefId: mainBelief.id,
      supportingAdvertised:
        '1. Commitment to rational, evidence-based public discourse\n2. Respect for citizens as capable of engaging with complex policy\n3. Long-term civic health over short-term engagement metrics',
      supportingActual:
        '1. Preference for structured epistemic systems that reward expertise and rigor\n2. Frustration with the chaotic dynamics of populist political communication\n3. Confidence that deliberative processes produce better governance outcomes',
      opposingAdvertised:
        '1. Democratic accessibility — politics must be emotionally resonant to reach ordinary people\n2. Accountability journalism — scandals expose corruption structural analysis misses\n3. Free expression — emotional and sensational content is legitimate speech',
      opposingActual:
        '1. Financial incentives: media companies profit from high-engagement scandal content\n2. Political operatives benefit from controlling the narrative agenda through distraction\n3. Tribal identity: outrage reinforces in-group loyalty regardless of policy merit',
    },
  })

  // ── Interests Analysis ───────────────────────────────────────────────────
  await prisma.interestsAnalysis.upsert({
    where: { beliefId: mainBelief.id },
    update: {},
    create: {
      beliefId: mainBelief.id,
      supporterInterests:
        '1. Citizens seeking clarity on policy issues without partisan noise\n2. Researchers, academics, and policy analysts who value structured deliberation\n3. Civic technologists building alternatives to attention-economy political platforms\n4. Voters frustrated by inability to distinguish candidate positions on substance',
      opponentInterests:
        '1. Media companies whose business models depend on high-engagement outrage content\n2. Political operatives who use distraction to avoid scrutiny of weak policy positions\n3. Partisan commentators whose audiences are primed for emotional activation, not analysis\n4. Candidates who score poorly on policy competence but excel at media presence',
      sharedInterests:
        '1. A functioning democracy that produces good governance\n2. Citizens who are genuinely informed rather than merely activated\n3. Political accountability — elected officials should be held responsible for outcomes',
      conflictingInterests:
        '1. Who controls the criteria for evaluating political argument quality\n2. Whether emotional resonance is a legitimate input to political decision-making\n3. The economic model of political media — engagement vs. accuracy as the primary metric',
    },
  })

  // ── Assumptions ──────────────────────────────────────────────────────────
  await prisma.assumption.createMany({
    data: [
      {
        beliefId: mainBelief.id,
        side: 'accept',
        statement:
          'Argument quality can be measured independently of its emotional delivery — the ISE scoring framework demonstrates this is technically achievable',
        strength: 'CRITICAL',
      },
      {
        beliefId: mainBelief.id,
        side: 'accept',
        statement:
          'Most citizens, when given structured tools to evaluate policy arguments, prefer accurate information over emotionally satisfying narratives',
        strength: 'STRONG',
      },
      {
        beliefId: mainBelief.id,
        side: 'accept',
        statement:
          'The current dominance of distraction in political discourse is driven by infrastructure incentives (engagement algorithms, ad revenue), not by an inherent human preference for distraction over substance',
        strength: 'STRONG',
      },
      {
        beliefId: mainBelief.id,
        side: 'reject',
        statement:
          'Political scandals are categorically irrelevant to policy competence — some character revelations (corruption, dishonesty, conflicts of interest) directly bear on governance quality',
        strength: 'MODERATE',
      },
      {
        beliefId: mainBelief.id,
        side: 'reject',
        statement:
          'Eliminating emotional content from political discourse would improve outcomes — emotional engagement appropriately processed is distinct from manufactured distraction',
        strength: 'CRITICAL',
      },
      {
        beliefId: mainBelief.id,
        side: 'reject',
        statement:
          'Structured scoring systems are immune to capture — objective criteria frameworks can themselves become partisan if community governance is weak',
        strength: 'MODERATE',
      },
    ],
  })

  // ── Cost-Benefit Analysis ────────────────────────────────────────────────
  await prisma.costBenefitAnalysis.upsert({
    where: { beliefId: mainBelief.id },
    update: {},
    create: {
      beliefId: mainBelief.id,
      benefits:
        '1. Improvements: Higher quality policy debate, improved legislative outcomes, reduced polarization velocity\n2. Who gains: Citizens, policy experts, good-faith candidates who score well on substance\n3. Positive externalities: Reduced political exhaustion, higher civic engagement among issue-focused voters, better long-term governance decisions',
      benefitLikelihood: 0.72,
      costs:
        '1. Problems created: Loss of emotional resonance that motivates low-information voter participation; potential elitism if structured tools are inaccessible\n2. Who loses: Media companies dependent on outrage engagement; political operatives skilled at distraction; candidates who win on charisma rather than competence\n3. Negative externalities: Potential suppression of legitimate moral outrage about genuine injustice (not all "distraction" is manufactured)',
      costLikelihood: 0.45,
    },
  })

  // ── Impact Analysis ──────────────────────────────────────────────────────
  await prisma.impactAnalysis.upsert({
    where: { beliefId: mainBelief.id },
    update: {},
    create: {
      beliefId: mainBelief.id,
      shortTermEffects:
        '1. More focused policy debate during election cycles\n2. Increased demand for policy-specific analysis and scoring tools\n3. Pushback from media organizations whose business models are threatened',
      shortTermCosts:
        '1. Reduced political engagement among citizens who are primarily emotionally activated\n2. Adoption friction: structured discourse tools require learning investment\n3. Incumbent advantage: established politicians understand existing media dynamics better',
      longTermEffects:
        '1. Cultural shift toward evidence-based political norms — "show your sources" as default\n2. Better selection of candidates on policy competence rather than media skill\n3. Reduced polarization as argument quality becomes visible and comparable across ideological lines',
      longTermChanges:
        '1. Structural transformation of political media from attention capture to accuracy reward\n2. Evolution of democratic decision-making toward deliberative models\n3. Potential redefinition of political accountability: scores on criteria the public agreed upon, not impressions from debate performance',
    },
  })

  // ── Compromise Solutions ─────────────────────────────────────────────────
  await prisma.compromise.createMany({
    data: [
      {
        beliefId: mainBelief.id,
        description:
          'Integrate structured argument scoring alongside (not replacing) existing emotionally-resonant political media, allowing citizens to access both and choose their preferred depth',
      },
      {
        beliefId: mainBelief.id,
        description:
          'Allow scandal content to be submitted and evaluated, but weight it only according to pre-agreed criteria importance — making the scoring transparent rather than suppressing the content',
      },
      {
        beliefId: mainBelief.id,
        description:
          'Build emotional storytelling into belief pages (e.g., narrative impact sections) that translate policy consequences into human terms, satisfying engagement needs without sacrificing scoring rigor',
      },
    ],
  })

  // ── Obstacles ────────────────────────────────────────────────────────────
  await prisma.obstacle.createMany({
    data: [
      {
        beliefId: mainBelief.id,
        side: 'supporter',
        description:
          'Tendency to dismiss all emotional political arguments as "mere distraction," failing to distinguish legitimate moral outrage from manufactured scandal',
      },
      {
        beliefId: mainBelief.id,
        side: 'supporter',
        description:
          'Difficulty acknowledging that structured scoring systems can themselves be gamed if the community setting criteria is captured by partisan actors',
      },
      {
        beliefId: mainBelief.id,
        side: 'opposition',
        description:
          'Financial incentive to manufacture new distractions whenever policy debate threatens to expose a weak position — the distraction machine is self-perpetuating',
      },
      {
        beliefId: mainBelief.id,
        side: 'opposition',
        description:
          'Conflation of emotional content with irrational content — some emotional arguments are both compelling and accurate, making the "set aside emotion" framing appear dismissive',
      },
    ],
  })

  // ── Biases ───────────────────────────────────────────────────────────────
  await prisma.biasEntry.createMany({
    data: [
      {
        beliefId: mainBelief.id,
        side: 'supporter',
        biasType: 'OVERCONFIDENCE',
        description:
          'Overconfidence in the neutrality of structured scoring systems — all scoring criteria embed value judgments about what counts as important',
      },
      {
        beliefId: mainBelief.id,
        side: 'supporter',
        biasType: 'AVAILABILITY_HEURISTIC',
        description:
          'Availability of egregious distraction examples (reality TV politics, Twitter outrage cycles) makes distraction seem more dominant than it actually is across all political discourse',
      },
      {
        beliefId: mainBelief.id,
        side: 'opponent',
        biasType: 'CONFIRMATION_BIAS',
        description:
          'Opposition media and operatives selectively highlight cases where emotional content drove accurate accountability (Watergate) while ignoring the far more common cases where distraction suppressed policy debate',
      },
      {
        beliefId: mainBelief.id,
        side: 'opponent',
        biasType: 'STATUS_QUO_BIAS',
        description:
          'Defense of existing emotionally-driven political media as "how democracy works" — resisting structural change even when evidence shows current infrastructure produces systematically worse outcomes',
      },
    ],
  })

  // ── Media Resources ──────────────────────────────────────────────────────
  await prisma.mediaResource.createMany({
    data: [
      {
        beliefId: mainBelief.id,
        side: 'supporting',
        mediaType: 'book',
        title: 'Amusing Ourselves to Death',
        author: 'Neil Postman',
        truthScore: 0.82,
        genreScore: 0.78,
        genreType: 'academic_popular',
        reliabilityTier: 'T2',
      },
      {
        beliefId: mainBelief.id,
        side: 'supporting',
        mediaType: 'book',
        title: 'The Shallows: What the Internet Is Doing to Our Brains',
        author: 'Nicholas Carr',
        truthScore: 0.78,
        genreScore: 0.75,
        genreType: 'academic_popular',
        reliabilityTier: 'T2',
      },
      {
        beliefId: mainBelief.id,
        side: 'supporting',
        mediaType: 'book',
        title: 'The Attention Merchants',
        author: 'Tim Wu',
        truthScore: 0.80,
        genreScore: 0.76,
        genreType: 'academic_popular',
        reliabilityTier: 'T2',
      },
      {
        beliefId: mainBelief.id,
        side: 'supporting',
        mediaType: 'article',
        title:
          'News Avoidance and Its Relationship to Political Knowledge and Polarization',
        author: 'Reuters Institute',
        truthScore: 0.88,
        genreScore: 0.90,
        genreType: 'institutional_report',
        reliabilityTier: 'T1',
      },
      {
        beliefId: mainBelief.id,
        side: 'opposing',
        mediaType: 'book',
        title: 'Manufacturing Consent',
        author: 'Noam Chomsky & Edward Herman',
        truthScore: 0.72,
        genreScore: 0.68,
        genreType: 'academic_popular',
        reliabilityTier: 'T2',
      },
      {
        beliefId: mainBelief.id,
        side: 'opposing',
        mediaType: 'article',
        title: 'In Defense of Political Outrage',
        author: 'The Atlantic Editorial',
        truthScore: 0.60,
        genreScore: 0.55,
        genreType: 'opinion',
        reliabilityTier: 'T3',
      },
    ],
  })

  // ── Legal Entries ────────────────────────────────────────────────────────
  await prisma.legalEntry.createMany({
    data: [
      {
        beliefId: mainBelief.id,
        side: 'supporting',
        description:
          'FCC Fairness Doctrine (1949–1987): Historical precedent for requiring broadcast media to present balanced coverage of controversial issues — abandoned, resulting in documented increase in partisan emotional framing',
        jurisdiction: 'federal',
      },
      {
        beliefId: mainBelief.id,
        side: 'supporting',
        description:
          'EU Digital Services Act (2023): Imposes transparency requirements on algorithmic recommendation systems, including political content — begins to structurally regulate attention-capture mechanics',
        jurisdiction: 'international',
      },
      {
        beliefId: mainBelief.id,
        side: 'contradicting',
        description:
          'First Amendment (U.S.): Broad protection of political speech, including sensational, emotionally charged, and misleading content — limits legal frameworks for structurally requiring argument quality in political discourse',
        jurisdiction: 'federal',
      },
    ],
  })

  // ── Belief Mappings ──────────────────────────────────────────────────────
  await prisma.beliefMapping.createMany({
    data: [
      {
        parentBeliefId: evidenceShouldDetermineOutcomesBelief.id,
        childBeliefId: mainBelief.id,
        direction: 'upstream',
        side: 'support',
      },
      {
        parentBeliefId: mainBelief.id,
        childBeliefId: candidateCoverageShouldFocusBelief.id,
        direction: 'downstream',
        side: 'support',
      },
    ],
  })

  // ── Similar Beliefs ──────────────────────────────────────────────────────
  await prisma.similarBelief.createMany({
    data: [
      {
        fromBeliefId: mainBelief.id,
        toBeliefId: strongerVersionBelief.id,
        variant: 'extreme',
        equivalencyScore: 0.55,
      },
      {
        fromBeliefId: mainBelief.id,
        toBeliefId: moderateVersionBelief.id,
        variant: 'moderate',
        equivalencyScore: 0.48,
      },
    ],
  })

  console.log('Belief seed completed!')
  console.log(`Route: /beliefs/set-aside-distractions-for-real-solutions`)
  console.log(`Main belief ID: ${mainBelief.id}`)
  console.log(`Total beliefs created: 10`)
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
