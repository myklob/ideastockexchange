/**
 * Seed script: Marriage debate topic page (from the ISE spec example)
 * Run with: npx tsx prisma/seed-debate-topics.ts
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Marriage debate topic...');

  // Delete existing if present
  const db = prisma as unknown as {
    debateTopic: {
      deleteMany: (args: unknown) => Promise<unknown>;
      create: (args: unknown) => Promise<{ id: number; slug: string }>;
    };
  };

  await db.debateTopic.deleteMany({ where: { slug: 'marriage' } } as unknown as never);

  const topic = await db.debateTopic.create({
    data: {
      slug: 'marriage',
      title: 'Marriage',
      categoryPath: JSON.stringify(['Society & Culture', 'Family']),
      wikipediaUrl: 'https://en.wikipedia.org/wiki/Marriage',
      deweyDecimal: '306.81 (Marriage & Marital Status) | 392.5 (Marriage Customs & Traditions)',
      locSubjectHeading: 'Marriage (HQ 503–1064)',
      locUrl: 'https://id.loc.gov/authorities/subjects/sh85081596.html',
      stanfordUrl: 'https://plato.stanford.edu/entries/marriage/',
      definition:
        'A legally and/or socially recognized union between individuals, historically between a man and a woman, now including same-sex partnerships in many jurisdictions, typically conferring legal rights and responsibilities related to property, inheritance, taxation, and child-rearing.',
      scope:
        'This page covers beliefs about marriage as a social institution — its value, definition, legal status, and policy treatment. Sub-topics including Same-Sex Marriage, Divorce, and Cohabitation have their own pages.',
      assumptionKeyInsight:
        'Most disagreements about marriage policy are really disagreements about whether marriage is primarily an institution for adults (and therefore subject to equal rights claims) or primarily an institution for children (and therefore subject to social engineering for child welfare). Those two starting assumptions lead to almost entirely different conclusions.',
      positions: {
        create: [
          {
            positionScore: -100,
            positionLabel: 'Strongly Oppose',
            coreBelief: 'Marriage is a fundamentally oppressive institution that should be abolished.',
            topArgument:
              'Marriage historically enforced patriarchal property rights over women and children.',
            beliefScore: '[-XX]',
          },
          {
            positionScore: -50,
            positionLabel: 'Skeptical',
            coreBelief:
              'Marriage is an outdated institution that does more harm than good in modern society.',
            topArgument:
              'Divorce rates and cohabitation trends suggest marriage no longer fits how most people actually live.',
            beliefScore: '[-XX]',
          },
          {
            positionScore: 0,
            positionLabel: 'Neutral/Nuanced',
            coreBelief:
              'Marriage is valuable for some but not universally superior to other relationship structures.',
            topArgument:
              'Outcomes depend heavily on individual circumstances, socioeconomic factors, and cultural context.',
            beliefScore: '[0]',
          },
          {
            positionScore: 50,
            positionLabel: 'Supportive',
            coreBelief: 'Marriage is the best anti-poverty program.',
            topArgument:
              'Longitudinal data shows married individuals report higher life satisfaction, better health, and greater financial stability.',
            beliefScore: '[+XX]',
          },
          {
            positionScore: 100,
            positionLabel: 'Strongly Support',
            coreBelief:
              'Marriage between a man and a woman is the foundational institution of civilization and must be legally protected and culturally promoted.',
            topArgument:
              'All successful civilizations have been built on the two-parent family unit; weakening marriage weakens society\'s capacity to raise children and transmit culture.',
            beliefScore: '[+XX]',
          },
        ],
      },
      escalationLevels: {
        create: [
          {
            level: 1,
            levelLabel: 'Preference',
            description: 'Personally prefers marriage but does not advocate publicly.',
            example: 'Someone who is married and happy but indifferent to policy.',
            principles: 'All other principles intact.',
          },
          {
            level: 2,
            levelLabel: 'Active Advocacy',
            description:
              'Votes, donates, campaigns for or against marriage-related legislation.',
            example:
              'Supporting or opposing same-sex marriage ballot measures; advocating for divorce reform.',
            principles: 'Works fully within legal and social norms.',
          },
          {
            level: 3,
            levelLabel: 'Principled Non-Compliance',
            description:
              'Refuses to personally participate in what they view as unjust — but does not obstruct others.',
            example:
              'A clerk who resigns rather than issue marriage licenses she disagrees with; a minister who refuses to perform certain ceremonies.',
            principles:
              'Willing to sacrifice self. Will not obstruct others\' legal rights.',
          },
          {
            level: 4,
            levelLabel: 'Civil Disobedience',
            description:
              'Openly defies laws or rulings, accepts legal consequences as moral leverage.',
            example:
              'County officials who issued same-sex marriage licenses before Obergefell; activists who disrupted hearings on DOMA.',
            principles:
              'Violates specific laws. Accepts the legal system\'s authority to respond.',
          },
          {
            level: 5,
            levelLabel: 'Resistance',
            description:
              'Defies rulings and does not accept consequences as legitimate.',
            example:
              'Officials who refused to comply with Obergefell while denying the Court\'s authority entirely.',
            principles:
              'Rejects specific institutional authority. Still avoids harm to individuals.',
          },
          {
            level: 6,
            levelLabel: 'Any Means Necessary',
            description:
              'Willing to harm others or destroy institutions to enforce or abolish marriage norms.',
            example:
              'Historical: forced marriages enforced through violence; extremist attempts to target LGBTQ families.',
            principles: 'No other principle outranks this belief.',
          },
        ],
      },
      assumptions: {
        create: [
          {
            positionRange: '-100 to -50',
            positionLabel: 'Strongly Oppose',
            assumptions: JSON.stringify([
              '[Worldview]: Social institutions are constructed to serve power, not human flourishing, and must be evaluated for who they benefit and harm.',
              '[Political philosophy]: Individual autonomy and equality of outcome should override inherited social structures.',
              '[Causal]: Marriage as historically practiced has systematically harmed women and marginalized groups through legal and economic dependency.',
              '[Topic-specific]: The harms of the institution outweigh the benefits even when reformed, because the underlying power structure remains.',
              '[Most specific]: Society would produce better outcomes for adults and children through alternative arrangements with equivalent or greater legal protections.',
            ]),
          },
          {
            positionRange: '-50 to -20',
            positionLabel: 'Skeptical',
            assumptions: JSON.stringify([
              '[Worldview]: Social institutions should be judged empirically by outcomes, not tradition.',
              '[Values]: Personal autonomy and diverse family structures deserve equal legal status and social respect.',
              '[Causal]: Observed marriage benefits are largely explained by selection effects and socioeconomic factors rather than marriage itself.',
              '[Topic-specific]: Policy should be neutral between relationship structures rather than privileging marriage.',
            ]),
          },
          {
            positionRange: '-20 to +20',
            positionLabel: 'Nuanced/Mixed',
            assumptions: JSON.stringify([
              '[Acknowledges complexity]: Marriage produces real benefits for many people but those benefits are unevenly distributed across populations.',
              '[Both sides have valid points]: Both the evidence for marriage benefits and the critique of selection effects have merit and are difficult to fully disentangle.',
              '[Context matters]: Marriage quality varies enormously; a bad marriage may be worse than no marriage.',
              '[Implementation determines outcome]: Policy support for marriage should be evidence-based and non-coercive, focused on removing barriers rather than penalizing alternatives.',
            ]),
          },
          {
            positionRange: '+20 to +50',
            positionLabel: 'Supportive',
            assumptions: JSON.stringify([
              '[Worldview]: Social institutions that have persisted across diverse cultures likely encode accumulated wisdom worth taking seriously.',
              '[Values]: Stable long-term commitment structures serve children\'s developmental interests as well as adults\' wellbeing.',
              '[Causal]: Even controlling for selection effects, marriage produces measurable independent benefits in health, wealth, and life satisfaction.',
              '[Topic-specific]: Public policy should remove disincentives to marriage, particularly in low-income communities where marriage rates have declined most sharply.',
            ]),
          },
          {
            positionRange: '+50 to +100',
            positionLabel: 'Strongly Support',
            assumptions: JSON.stringify([
              '[Worldview]: Human nature and the requirements of child development make the two-parent family the optimal unit for social organization.',
              '[Political philosophy]: Society has a legitimate interest in promoting marriage because the costs of family breakdown are borne collectively.',
              '[Causal]: The decline of marriage is the primary driver of poverty, crime, educational underperformance, and social dysfunction.',
              '[Topic-specific]: Marriage should be legally privileged over other arrangements because it uniquely serves children\'s need for a mother and a father.',
              '[Most specific]: Redefining marriage to include same-sex couples or treating alternatives as equivalent harms children and erodes the institution itself.',
            ]),
          },
        ],
      },
      abstractionRungs: {
        create: [
          {
            sortOrder: 0,
            rungLabel: 'Most General (Worldview)',
            proChain:
              'Human beings are social and sexual creatures who flourish best within stable, committed, complementary partnerships.',
            conChain:
              'Social institutions reflect historical power arrangements and must be continuously re-evaluated against contemporary values and evidence.',
          },
          {
            sortOrder: 1,
            rungLabel: 'Political/Ethical Philosophy',
            proChain:
              'Society has a legitimate interest in structuring family formation to protect children and reduce dependence on the state.',
            conChain:
              'Individual autonomy and equality before the law require the state to be neutral between consensual relationship structures chosen by adults.',
          },
          {
            sortOrder: 2,
            rungLabel: 'This Topic',
            proChain:
              'Marriage between committed partners is the best available structure for raising children and should be culturally promoted and legally supported.',
            conChain:
              'Marriage should be available to all who want it, but policy should not privilege it over other stable family structures.',
          },
          {
            sortOrder: 3,
            rungLabel: 'Most Specific (Policy/Action)',
            proChain:
              'Eliminate the marriage penalty in the tax code; fund relationship skills programs; restore marriage rates in low-income communities as a poverty-reduction strategy.',
            conChain:
              'Extend all marriage legal benefits to domestic partnerships; reform child custody law to be structure-neutral; end abstinence-only education funding.',
          },
        ],
      },
      coreValues: {
        create: {
          supportingAdvertised: JSON.stringify([
            'Child welfare — stable two-parent homes produce better outcomes',
            'Social stability — marriage reduces poverty and state dependency',
            'Religious and cultural tradition — marriage encodes accumulated wisdom',
          ]),
          supportingActual: JSON.stringify([
            'In-group normativity — preference for familiar arrangements that reflect one\'s own experience',
            'Patriarchal continuity — traditional marriage historically served male property and inheritance interests',
          ]),
          opposingAdvertised: JSON.stringify([
            'Individual autonomy — adults should choose relationship structures without state preference',
            'Equality — all stable families deserve equal legal recognition and social respect',
            'Evidence-based policy — marriage benefits are overstated and confounded by selection',
          ]),
          opposingActual: JSON.stringify([
            'Anti-natalism — implicit hostility to child-centered family norms',
            'Cultural deconstruction — opposition to religious and traditional institutions as such',
          ]),
        },
      },
      commonGround: {
        create: {
          agreements: JSON.stringify([
            'Children benefit from stable, committed caregiving relationships',
            'Economic barriers to family formation — housing costs, student debt, wage stagnation — should be reduced',
            'Relationship skills and conflict resolution improve outcomes regardless of legal structure',
            'High-conflict marriages are worse for children than stable single-parent households',
          ]),
          compromises: JSON.stringify([
            'Extend marriage legal benefits to all registered domestic partnerships while maintaining marriage as a distinct cultural category',
            'Focus public investment on relationship quality programs rather than marriage promotion per se',
            'Eliminate the marriage penalty in tax and benefit structures so the system stops actively discouraging legal union',
            'Fund longitudinal research on diverse family structures to replace ideology with evidence',
          ]),
        },
      },
      evidenceItems: {
        create: [
          {
            side: 'supporting',
            title: 'Waite & Gallagher, "The Case for Marriage" (2000)',
            source: 'Linda Waite, University of Chicago',
            finding:
              'Married individuals report better health, wealth, and life satisfaction across longitudinal data.',
            qualityScore: 80,
            qualityLabel: 'Peer Reviewed',
          },
          {
            side: 'supporting',
            title: 'McLanahan & Sandefur, "Growing Up with a Single Parent" (1994)',
            source: 'Harvard University Press',
            finding:
              'Children raised by single parents face significantly worse outcomes on education, income, and family stability.',
            qualityScore: 85,
            qualityLabel: 'Longitudinal',
          },
          {
            side: 'weakening',
            title: 'Musick & Bumpass, "Reexamining the Case for Marriage" (2012)',
            source: 'Journal of Marriage and Family',
            finding:
              'Much of the marriage benefit disappears when controlling for pre-existing wellbeing and selection effects.',
            qualityScore: 85,
            qualityLabel: 'Peer Reviewed',
          },
          {
            side: 'weakening',
            title: 'Kalmijn, "Marriage Rituals as Reinforcers of Role Transitions" (2004)',
            source: 'Journal of Marriage and Family',
            finding:
              'Legal marriage adds little independent benefit over stable cohabitation in countries with strong cohabitation norms.',
            qualityScore: 75,
            qualityLabel: 'Cross-national',
          },
        ],
      },
      objectiveCriteria: {
        create: [
          {
            name: 'Long-term life satisfaction at 50, 65, and 80',
            description:
              'Longitudinal survey data across relationship structures — not snapshot happiness measures',
            criteriaScore: 90,
            validity: 'High',
            reliability: 'High',
            linkage: 'High',
            importance: 'High',
          },
          {
            name: 'Child outcomes by family structure',
            description:
              'Educational attainment, income at 30, incarceration rates, and family formation patterns of adult children',
            criteriaScore: 88,
            validity: 'High',
            reliability: 'High',
            linkage: 'High',
            importance: 'High',
          },
          {
            name: 'Health outcomes controlling for socioeconomic status',
            description:
              'Mortality rates, cardiovascular health, and mental health outcomes across relationship structures, adjusted for income and selection',
            criteriaScore: 82,
            validity: 'High',
            reliability: 'High',
            linkage: 'Med',
            importance: 'High',
          },
          {
            name: '30-year wealth accumulation and bankruptcy rates',
            description:
              'Comparative financial outcomes across marriage, cohabitation, and single-person households',
            criteriaScore: 78,
            validity: 'High',
            reliability: 'High',
            linkage: 'Med',
            importance: 'Med',
          },
          {
            name: 'Divorce and dissolution rates',
            description:
              'Measures stability of the institution itself — but not quality of intact marriages',
            criteriaScore: 55,
            validity: 'High',
            reliability: 'High',
            linkage: 'Low',
            importance: 'Med',
          },
          {
            name: 'Marriage rates and trends over time',
            description:
              'Measures popularity, not quality — high marriage rates in a society do not indicate good outcomes',
            criteriaScore: 40,
            validity: 'Low',
            reliability: 'High',
            linkage: 'Low',
            importance: 'Low',
          },
          {
            name: 'Alignment with religious teaching',
            description:
              'Not independently verifiable or universally applicable; functions as a values claim, not an empirical criterion',
            criteriaScore: 20,
            validity: 'Low',
            reliability: 'Low',
            linkage: 'Low',
            importance: 'Low',
          },
        ],
      },
      mediaResources: {
        create: [
          {
            title: 'The Case for Marriage — Waite & Gallagher',
            medium: 'Book',
            biasOrTone: 'Academic/Advocacy',
            positivity: 80,
            magnitude: 70,
            escalation: 2,
            keyInsight:
              'Comprehensive longitudinal evidence that marriage produces independent health and wealth benefits.',
          },
          {
            title: 'Marriage, a History — Stephanie Coontz',
            medium: 'Book',
            biasOrTone: 'Historical/Critical',
            positivity: 0,
            magnitude: 50,
            escalation: 2,
            keyInsight:
              'Shows how marriage has continuously evolved across cultures — undermining claims of a single timeless form.',
          },
          {
            title: 'Growing Up with a Single Parent — McLanahan & Sandefur',
            medium: 'Academic',
            biasOrTone: 'Empirical',
            positivity: 60,
            magnitude: 60,
            escalation: 1,
            keyInsight:
              'Landmark longitudinal study on child outcomes by family structure; widely cited on both sides.',
          },
          {
            title: 'All the Rage — documentary',
            medium: 'Documentary',
            biasOrTone: 'Critical',
            positivity: -50,
            magnitude: 60,
            escalation: 2,
            keyInsight:
              'Examines how traditional marriage norms contribute to suppressed anger and poor mental health, particularly in women.',
          },
        ],
      },
      relatedTopics: {
        create: [
          {
            relationType: 'parent',
            relatedTitle: 'Family',
            relatedSlug: 'family',
          },
          {
            relationType: 'parent',
            relatedTitle: 'Society & Culture',
            relatedSlug: 'society-and-culture',
          },
          {
            relationType: 'child',
            relatedTitle: 'Same-Sex Marriage',
            relatedSlug: 'same-sex-marriage',
          },
          {
            relationType: 'child',
            relatedTitle: 'Divorce Law Reform',
            relatedSlug: 'divorce-law-reform',
          },
          {
            relationType: 'child',
            relatedTitle: 'Cohabitation Rights',
            relatedSlug: 'cohabitation-rights',
          },
          {
            relationType: 'child',
            relatedTitle: 'Marriage Penalty in Tax Code',
            relatedSlug: 'marriage-penalty',
          },
          {
            relationType: 'sibling',
            relatedTitle: 'Child Development',
            relatedSlug: 'child-development',
          },
          {
            relationType: 'sibling',
            relatedTitle: 'Poverty & Family Structure',
            relatedSlug: 'poverty-family-structure',
          },
          {
            relationType: 'sibling',
            relatedTitle: 'Gender Roles',
            relatedSlug: 'gender-roles',
          },
        ],
      },
    } as unknown as never,
  });

  console.log(`✅ Created debate topic: Marriage (id=${topic.id}, slug=${topic.slug})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
