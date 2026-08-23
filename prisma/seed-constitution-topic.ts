/**
 * Seed the "Protecting the Constitution" topic and two of its belief pages —
 * election acceptance and court compliance — as live data, plus one imported
 * forum conversation showing every candidate outcome (integrated, pending,
 * folded duplicate, dismissed). This is the worked example from the
 * conversation-integration basis: chat resets discussion to zero, so every
 * conversation plugs into a permanent belief page where the pro/con
 * arguments accumulate.
 *
 * Idempotent: beliefs and the topic upsert; argument edges, evidence, and
 * the conversation are skipped when already present. Argument scores stay
 * null here — the engine pass at the end computes them (Rule 6: no stored
 * judgment, only structure).
 */
import { prisma } from '../src/lib/prisma'
import { propagateBeliefScores } from '../src/lib/propagate-belief-scores'
import type { Prisma } from '../src/generated/prisma/client'

const CATEGORY = 'Governance'
const SUBCATEGORY = 'Protecting the Constitution'

interface BeliefSeed {
  slug: string
  statement: string
  positivity: number
  claimStrength: number
  specificity: number
}

// Coordinates are the topic page's three-part address: Direction
// (positivity), Magnitude (claimStrength), General-to-Specific (specificity).
const BELIEFS: BeliefSeed[] = [
  // The two full belief pages
  { slug: 'accept-certified-election-results', statement: 'We should accept certified election results even when our side loses.', positivity: 75, claimStrength: 0.8, specificity: 0.7 },
  { slug: 'comply-with-final-court-rulings', statement: 'Officials should comply with final court rulings while appealing the ones they believe are wrong.', positivity: 70, claimStrength: 0.8, specificity: 0.7 },

  // Election acceptance: pro argument beliefs
  { slug: 'election-acceptance-reciprocal-insurance', statement: "Election acceptance is a reciprocal insurance contract: each side's concession today purchases the other side's concession tomorrow.", positivity: 60, claimStrength: 0.6, specificity: 0.5 },
  { slug: 'election-disputes-belong-in-court', statement: 'Election challenges belong in court under rules fixed before the outcome was known.', positivity: 65, claimStrength: 0.6, specificity: 0.6 },
  { slug: 'refusing-defeat-one-way-ratchet', statement: 'Refusing certified defeat is a one-way ratchet that collapses the concession equilibrium.', positivity: -40, claimStrength: 0.7, specificity: 0.5 },
  { slug: 'elections-are-consent-sensor', statement: 'Elections are the feedback sensor of the constitutional control loop: the only instrument that measures the consent of the governed.', positivity: 55, claimStrength: 0.6, specificity: 0.4 },
  { slug: 'constitutions-make-losing-survivable', statement: 'Constitutional government made losing power survivable, converting wars of succession into election campaigns.', positivity: 70, claimStrength: 0.6, specificity: 0.4 },
  // Election acceptance: con argument beliefs
  { slug: 'consent-demands-ratify-unfairness', statement: 'Demands to respect the outcome can launder a degraded process into legitimacy.', positivity: -45, claimStrength: 0.5, specificity: 0.5 },
  { slug: 'stolen-elections-exist', statement: 'History contains stolen elections, so an unconditional acceptance rule would sometimes command surrender to fraud.', positivity: -50, claimStrength: 0.6, specificity: 0.5 },
  { slug: 'election-referees-are-partisans', statement: 'Certification and adjudication are run by partisans, so deference to their verdicts is not neutral.', positivity: -45, claimStrength: 0.6, specificity: 0.6 },
  { slug: 'acceptance-norms-bind-asymmetrically', statement: 'Acceptance norms bind asymmetrically in practice: the side with more institutional scruple keeps conceding while the other side pockets the wins.', positivity: -50, claimStrength: 0.6, specificity: 0.5 },

  // Election acceptance: sub-argument beliefs
  { slug: 'every-faction-eventually-loses', statement: 'Every faction eventually loses an election it expected to win.', positivity: 10, claimStrength: 0.8, specificity: 0.3 },
  { slug: 'sixty-post-2020-challenges-rejected', statement: 'More than sixty post-2020 election challenges were adjudicated and rejected for lack of proof.', positivity: 20, claimStrength: 0.7, specificity: 0.9 },
  { slug: 'own-judges-rejected-2020-claims', statement: 'Judges appointed by the challenging side rejected the post-2020 election claims.', positivity: 20, claimStrength: 0.7, specificity: 0.9 },
  { slug: 'contested-successions-turn-violent', statement: 'Comparative cases where losers stopped conceding show contested successions turning violent or extra-constitutional.', positivity: -55, claimStrength: 0.6, specificity: 0.6 },
  { slug: 'hayes-tilden-partisan-bargain', statement: 'The disputed 1876 Hayes-Tilden election was settled by a partisan commission and a political bargain, not clean adjudication.', positivity: -30, claimStrength: 0.7, specificity: 0.9 },
  { slug: 'machine-era-ballot-fraud-documented', statement: 'Machine-era ballot fraud is documented in American cities.', positivity: -25, claimStrength: 0.6, specificity: 0.8 },
  { slug: 'election-rulings-cross-party', statement: 'Election rulings regularly cut against the appointing party of the judges issuing them.', positivity: 30, claimStrength: 0.5, specificity: 0.7 },

  // Court compliance: pro argument beliefs
  { slug: 'court-orders-bind-or-decorative', statement: 'Court orders bind the government or judicial review is decorative: the judiciary has neither force nor will, but merely judgment.', positivity: 60, claimStrength: 0.7, specificity: 0.5 },
  { slug: 'wrong-rulings-have-lawful-remedies', statement: 'A wrong ruling has lawful remedies, so defiance does not create a remedy: it skips them all.', positivity: 55, claimStrength: 0.6, specificity: 0.5 },
  { slug: 'defiance-precedent-transfers-whole', statement: 'A precedent of ignoring rulings transfers whole to the next administration, including the ones that will rule against you.', positivity: -40, claimStrength: 0.7, specificity: 0.5 },
  { slug: 'compliance-preserves-the-forum', statement: 'Compliance preserves the forum where winning means anything: obey now, argue on, and a later victory restores the position.', positivity: 55, claimStrength: 0.6, specificity: 0.5 },
  // Court compliance: con argument beliefs
  { slug: 'departmentalist-tradition', statement: 'The departmentalist tradition from Jefferson through Lincoln holds that each branch interprets the Constitution for itself.', positivity: -35, claimStrength: 0.6, specificity: 0.6 },
  { slug: 'some-rulings-are-lawless', statement: 'Some rulings are themselves lawless, and compliance entrenched grave abuses until politics undid the damage.', positivity: -45, claimStrength: 0.5, specificity: 0.5 },
  { slug: 'slow-appeals-moot-remedies', statement: 'Slow appeals let irreversible harm complete before the remedy arrives, so compliance can moot the case that would have vindicated the objector.', positivity: -40, claimStrength: 0.5, specificity: 0.6 },
  { slug: 'compliance-launders-partisan-rulings', statement: 'When rulings track the appointing party, compliance norms launder partisan outcomes as neutral law.', positivity: -45, claimStrength: 0.6, specificity: 0.6 },

  // Court compliance: sub-argument beliefs
  { slug: 'truman-returned-steel-mills', statement: 'Truman returned the steel mills within hours of the Youngstown ruling in 1952.', positivity: 40, claimStrength: 0.8, specificity: 0.95 },
  { slug: 'cooper-v-aaron-binds-states', statement: 'Cooper v. Aaron unanimously held states bound by federal court constitutional interpretation.', positivity: 40, claimStrength: 0.8, specificity: 0.95 },
  { slug: 'nixon-complied-at-maximum-cost', statement: 'Nixon complied with the unanimous tapes ruling and resigned sixteen days later: compliance at maximum personal cost.', positivity: 40, claimStrength: 0.8, specificity: 0.95 },
  { slug: 'worcester-defiance-unenforced', statement: "Georgia's defiance of Worcester v. Georgia went unenforced without immediate institutional collapse.", positivity: -30, claimStrength: 0.7, specificity: 0.95 },
  { slug: 'merryman-habeas-defied', statement: "Lincoln's administration declined to obey Taney's habeas ruling in Ex parte Merryman.", positivity: -30, claimStrength: 0.7, specificity: 0.95 },

  // Topic-address rows (Continuum 3) without argument trees yet
  { slug: 'distributed-power-outperforms', statement: 'Systems that distribute power and correct their own errors outperform systems that concentrate power.', positivity: 90, claimStrength: 0.8, specificity: 0.1 },
  { slug: 'past-rules-cannot-bind-present', statement: 'Rules written by past majorities cannot legitimately bind present ones; process worship entrenches inherited injustice.', positivity: -90, claimStrength: 0.8, specificity: 0.1 },
  { slug: 'certified-outcomes-bind-both-sides', statement: 'Certified election outcomes bind winners and losers alike, regardless of party.', positivity: 75, claimStrength: 0.8, specificity: 0.4 },
  { slug: 'outcomes-bind-only-if-loser-agrees', statement: 'Election outcomes bind only when the loser judges the process fair.', positivity: -75, claimStrength: 0.8, specificity: 0.4 },
  { slug: 'certification-is-ministerial', statement: 'Certification of election results is a ministerial duty, not a discretionary veto.', positivity: 60, claimStrength: 0.5, specificity: 0.8 },
  { slug: 'certifiers-should-have-discretion', statement: 'Certifying officials should have discretion to block results they suspect.', positivity: -60, claimStrength: 0.5, specificity: 0.8 },
  { slug: 'pre-commit-challenge-standards', statement: 'Candidates should state before the election what evidence would justify a challenge and which adjudication is final.', positivity: 50, claimStrength: 0.5, specificity: 0.85 },
  { slug: 'oversight-binds-every-party', statement: 'Congressional oversight deserves support regardless of which party wields it.', positivity: 60, claimStrength: 0.5, specificity: 0.4 },
  { slug: 'change-through-article-v', statement: 'Constitutional change should run through Article V and state experimentation, not around them.', positivity: 65, claimStrength: 0.5, specificity: 0.4 },
  { slug: 'speech-protections-cover-critics', statement: 'Speech and press protections cover your critics, or they protect no one.', positivity: 70, claimStrength: 0.8, specificity: 0.4 },
  { slug: 'same-laws-bind-every-party', statement: 'The same laws bind officials of every party.', positivity: 80, claimStrength: 0.8, specificity: 0.4 },

  // Similar-belief variants for the election page (merge candidates)
  { slug: 'all-election-challenges-illegitimate', statement: 'All election challenges are inherently illegitimate attacks on democracy.', positivity: 85, claimStrength: 1.0, specificity: 0.5 },
  { slug: 'final-rulings-bind-winner-and-loser', statement: 'Election challenges belong in court, and final rulings bind winner and loser alike.', positivity: 65, claimStrength: 0.5, specificity: 0.6 },
]

interface EdgeSeed {
  parent: string
  child: string
  side: 'agree' | 'disagree'
  claim?: string
  linkageScore: number
  linkageType: 'DEDUCTIVE_PROOF' | 'STRONG_CAUSAL' | 'CONTEXTUAL' | 'ANECDOTAL'
}

const EDGES: EdgeSeed[] = [
  // Election acceptance tree
  { parent: 'accept-certified-election-results', child: 'election-acceptance-reciprocal-insurance', side: 'agree', claim: 'reciprocal insurance contract', linkageScore: 0.85, linkageType: 'STRONG_CAUSAL' },
  { parent: 'accept-certified-election-results', child: 'election-disputes-belong-in-court', side: 'agree', claim: 'dispute channel exists', linkageScore: 0.8, linkageType: 'STRONG_CAUSAL' },
  { parent: 'accept-certified-election-results', child: 'refusing-defeat-one-way-ratchet', side: 'agree', claim: 'one-way concession ratchet', linkageScore: 0.8, linkageType: 'STRONG_CAUSAL' },
  { parent: 'accept-certified-election-results', child: 'elections-are-consent-sensor', side: 'agree', claim: 'consent feedback sensor', linkageScore: 0.6, linkageType: 'CONTEXTUAL' },
  { parent: 'accept-certified-election-results', child: 'constitutions-make-losing-survivable', side: 'agree', claim: 'losing made survivable', linkageScore: 0.7, linkageType: 'STRONG_CAUSAL' },
  { parent: 'accept-certified-election-results', child: 'comply-with-final-court-rulings', side: 'agree', claim: 'court compliance norm', linkageScore: 0.6, linkageType: 'CONTEXTUAL' },
  { parent: 'accept-certified-election-results', child: 'consent-demands-ratify-unfairness', side: 'disagree', claim: 'can ratify unfairness', linkageScore: 0.6, linkageType: 'CONTEXTUAL' },
  { parent: 'accept-certified-election-results', child: 'stolen-elections-exist', side: 'disagree', claim: 'stolen elections exist', linkageScore: 0.7, linkageType: 'STRONG_CAUSAL' },
  { parent: 'accept-certified-election-results', child: 'election-referees-are-partisans', side: 'disagree', claim: 'partisan referees', linkageScore: 0.6, linkageType: 'CONTEXTUAL' },
  { parent: 'accept-certified-election-results', child: 'acceptance-norms-bind-asymmetrically', side: 'disagree', claim: 'asymmetric norm binding', linkageScore: 0.65, linkageType: 'CONTEXTUAL' },

  // Election sub-trees
  { parent: 'election-acceptance-reciprocal-insurance', child: 'every-faction-eventually-loses', side: 'agree', linkageScore: 0.8, linkageType: 'STRONG_CAUSAL' },
  { parent: 'election-disputes-belong-in-court', child: 'sixty-post-2020-challenges-rejected', side: 'agree', linkageScore: 0.85, linkageType: 'STRONG_CAUSAL' },
  { parent: 'election-disputes-belong-in-court', child: 'own-judges-rejected-2020-claims', side: 'agree', linkageScore: 0.8, linkageType: 'STRONG_CAUSAL' },
  { parent: 'refusing-defeat-one-way-ratchet', child: 'contested-successions-turn-violent', side: 'agree', linkageScore: 0.75, linkageType: 'STRONG_CAUSAL' },
  { parent: 'stolen-elections-exist', child: 'hayes-tilden-partisan-bargain', side: 'agree', linkageScore: 0.8, linkageType: 'STRONG_CAUSAL' },
  { parent: 'stolen-elections-exist', child: 'machine-era-ballot-fraud-documented', side: 'agree', linkageScore: 0.75, linkageType: 'STRONG_CAUSAL' },
  { parent: 'election-referees-are-partisans', child: 'election-rulings-cross-party', side: 'disagree', linkageScore: 0.7, linkageType: 'CONTEXTUAL' },

  // Court compliance tree
  { parent: 'comply-with-final-court-rulings', child: 'court-orders-bind-or-decorative', side: 'agree', claim: 'orders bind or decorative', linkageScore: 0.85, linkageType: 'STRONG_CAUSAL' },
  { parent: 'comply-with-final-court-rulings', child: 'wrong-rulings-have-lawful-remedies', side: 'agree', claim: 'lawful remedies exist', linkageScore: 0.8, linkageType: 'STRONG_CAUSAL' },
  { parent: 'comply-with-final-court-rulings', child: 'defiance-precedent-transfers-whole', side: 'agree', claim: 'defiance precedent ratchet', linkageScore: 0.8, linkageType: 'STRONG_CAUSAL' },
  { parent: 'comply-with-final-court-rulings', child: 'compliance-preserves-the-forum', side: 'agree', claim: 'preserves the forum', linkageScore: 0.75, linkageType: 'STRONG_CAUSAL' },
  { parent: 'comply-with-final-court-rulings', child: 'departmentalist-tradition', side: 'disagree', claim: 'departmentalist tradition', linkageScore: 0.6, linkageType: 'CONTEXTUAL' },
  { parent: 'comply-with-final-court-rulings', child: 'some-rulings-are-lawless', side: 'disagree', claim: 'some rulings lawless', linkageScore: 0.65, linkageType: 'CONTEXTUAL' },
  { parent: 'comply-with-final-court-rulings', child: 'slow-appeals-moot-remedies', side: 'disagree', claim: 'slow appeals moot remedies', linkageScore: 0.6, linkageType: 'CONTEXTUAL' },
  { parent: 'comply-with-final-court-rulings', child: 'compliance-launders-partisan-rulings', side: 'disagree', claim: 'launders partisan rulings', linkageScore: 0.6, linkageType: 'CONTEXTUAL' },

  // Court sub-trees
  { parent: 'court-orders-bind-or-decorative', child: 'truman-returned-steel-mills', side: 'agree', linkageScore: 0.8, linkageType: 'STRONG_CAUSAL' },
  { parent: 'court-orders-bind-or-decorative', child: 'cooper-v-aaron-binds-states', side: 'agree', linkageScore: 0.85, linkageType: 'STRONG_CAUSAL' },
  { parent: 'compliance-preserves-the-forum', child: 'nixon-complied-at-maximum-cost', side: 'agree', linkageScore: 0.8, linkageType: 'STRONG_CAUSAL' },
  { parent: 'departmentalist-tradition', child: 'worcester-defiance-unenforced', side: 'agree', linkageScore: 0.7, linkageType: 'ANECDOTAL' },
  { parent: 'some-rulings-are-lawless', child: 'merryman-habeas-defied', side: 'agree', linkageScore: 0.7, linkageType: 'ANECDOTAL' },
]

const EVIDENCE: Array<{
  belief: string
  side: 'supporting' | 'weakening'
  description: string
  evidenceType: 'T1' | 'T2' | 'T3'
}> = [
  { belief: 'accept-certified-election-results', side: 'supporting', evidenceType: 'T1', description: 'More than sixty post-2020 election challenges adjudicated and rejected for lack of proof, including by judges the challenging side appointed (court records, 2020-2021)' },
  { belief: 'accept-certified-election-results', side: 'supporting', evidenceType: 'T2', description: "The 1800 Adams-to-Jefferson transfer, Nixon's decision not to contest 1960, and Gore's 2000 concession after a 5-4 ruling against him (historical record)" },
  { belief: 'accept-certified-election-results', side: 'supporting', evidenceType: 'T2', description: 'Comparative cases where losers stopped conceding show contested successions turning violent or extra-constitutional (comparative politics literature)' },
  { belief: 'accept-certified-election-results', side: 'supporting', evidenceType: 'T3', description: 'Surveys of election officials reporting threats, harassment, and early exits (Brennan Center, 2020s)' },
  { belief: 'accept-certified-election-results', side: 'weakening', evidenceType: 'T2', description: 'The disputed 1876 Hayes-Tilden election was settled by a partisan commission and a political bargain, not clean adjudication (historical record)' },
  { belief: 'accept-certified-election-results', side: 'weakening', evidenceType: 'T2', description: 'Documented machine-era ballot fraud in American cities (Campbell, Deliver the Vote, 2005)' },
  { belief: 'accept-certified-election-results', side: 'weakening', evidenceType: 'T3', description: "Rising shares of each party's losers describing recent elections as illegitimate across consecutive cycles (Pew Research Center surveys, 2020s)" },
  { belief: 'accept-certified-election-results', side: 'weakening', evidenceType: 'T3', description: 'Documented cases of county officials refusing or delaying certification of results their side lost (court and news records, 2020s)' },

  { belief: 'comply-with-final-court-rulings', side: 'supporting', evidenceType: 'T1', description: 'Nixon complied with the unanimous tapes ruling in United States v. Nixon (1974) and resigned sixteen days later: compliance at maximum personal cost (court and historical record)' },
  { belief: 'comply-with-final-court-rulings', side: 'supporting', evidenceType: 'T1', description: 'Truman returned the steel mills within hours of Youngstown (1952); Cooper v. Aaron (1958) unanimously held states bound by federal court interpretation (court records)' },
  { belief: 'comply-with-final-court-rulings', side: 'supporting', evidenceType: 'T2', description: 'Bush v. Gore (2000): the losing side complied, conceded, and the transfer completed on schedule (historical record)' },
  { belief: 'comply-with-final-court-rulings', side: 'weakening', evidenceType: 'T2', description: "Georgia's defiance of Worcester v. Georgia (1832) went unenforced, and the republic carried on: defiance without institutional consequence (historical record)" },
  { belief: 'comply-with-final-court-rulings', side: 'weakening', evidenceType: 'T2', description: "Lincoln's administration declined to obey Taney's habeas ruling in Ex parte Merryman (1861) (historical record)" },
  { belief: 'comply-with-final-court-rulings', side: 'weakening', evidenceType: 'T2', description: 'Political-science work finding high-profile constitutional rulings increasingly align with the appointing party (empirical judicial-politics literature)' },
]

const TOPIC_MEMBER_SLUGS = [
  'accept-certified-election-results',
  'comply-with-final-court-rulings',
  'distributed-power-outperforms',
  'past-rules-cannot-bind-present',
  'certified-outcomes-bind-both-sides',
  'outcomes-bind-only-if-loser-agrees',
  'certification-is-ministerial',
  'certifiers-should-have-discretion',
  'pre-commit-challenge-standards',
  'oversight-binds-every-party',
  'change-through-article-v',
  'speech-protections-cover-critics',
  'same-laws-bind-every-party',
]

const DEMO_AGENT_NAME = 'seed:conversation-demo'
const DEMO_THREAD_TITLE = 'Do you actually have to accept election results if you think it was rigged?'

async function main() {
  const idBySlug = new Map<string, number>()
  for (const seed of BELIEFS) {
    const belief = await prisma.belief.upsert({
      where: { slug: seed.slug },
      update: {},
      create: {
        slug: seed.slug,
        statement: seed.statement,
        category: CATEGORY,
        subcategory: SUBCATEGORY,
        positivity: seed.positivity,
        claimStrength: seed.claimStrength,
        specificity: seed.specificity,
      },
    })
    idBySlug.set(seed.slug, belief.id)
  }
  const id = (slug: string): number => {
    const value = idBySlug.get(slug)
    if (value === undefined) throw new Error(`Missing belief seed for slug "${slug}"`)
    return value
  }

  // Argument edges: skip when the roots already have edges so re-running
  // never double-counts a side.
  const rootIds = [id('accept-certified-election-results'), id('comply-with-final-court-rulings')]
  const existingEdges = await prisma.argument.count({ where: { parentBeliefId: { in: rootIds } } })
  if (existingEdges > 0) {
    console.log('Constitution argument edges already seeded; skipping edge creation.')
  } else {
    await prisma.argument.createMany({
      data: EDGES.map((edge): Prisma.ArgumentCreateManyInput => ({
        parentBeliefId: id(edge.parent),
        beliefId: id(edge.child),
        side: edge.side,
        claim: edge.claim ?? null,
        linkageScore: edge.linkageScore,
        linkageType: edge.linkageType,
      })),
    })
  }

  const existingEvidence = await prisma.evidence.count({ where: { beliefId: { in: rootIds } } })
  if (existingEvidence > 0) {
    console.log('Constitution evidence already seeded; skipping.')
  } else {
    await prisma.evidence.createMany({
      data: EVIDENCE.map(ev => ({
        beliefId: id(ev.belief),
        side: ev.side,
        description: ev.description,
        evidenceType: ev.evidenceType,
      })),
    })
  }

  // Similar-belief variants (merge candidates on the election page).
  const variants: Array<{ from: string; to: string; variant: string; equivalencyScore: number }> = [
    { from: 'accept-certified-election-results', to: 'all-election-challenges-illegitimate', variant: 'extreme', equivalencyScore: 0.55 },
    { from: 'accept-certified-election-results', to: 'final-rulings-bind-winner-and-loser', variant: 'moderate', equivalencyScore: 0.78 },
  ]
  for (const v of variants) {
    const existing = await prisma.similarBelief.findFirst({
      where: { fromBeliefId: id(v.from), toBeliefId: id(v.to) },
    })
    if (!existing) {
      await prisma.similarBelief.create({
        data: { fromBeliefId: id(v.from), toBeliefId: id(v.to), variant: v.variant, equivalencyScore: v.equivalencyScore },
      })
    }
  }

  // The topic hub with its general-to-specific membership.
  const topic = await prisma.topic.upsert({
    where: { slug: 'protecting-the-constitution' },
    update: {},
    create: {
      slug: 'protecting-the-constitution',
      title: 'Protecting the Constitution',
      question: 'Whether and how does the constitutional order deserve protection?',
      description:
        "The practices and commitments that keep the Constitution's error-correcting mechanisms operating: " +
        'compliance with final court rulings, acceptance of certified election outcomes, equal application ' +
        'of law to officials of every party, protected dissent, and change pursued through the channels the ' +
        'document itself provides.',
    },
  })
  for (const slug of TOPIC_MEMBER_SLUGS) {
    await prisma.topicBelief.upsert({
      where: { topicId_beliefId: { topicId: topic.id, beliefId: id(slug) } },
      update: {},
      create: { topicId: topic.id, beliefId: id(slug) },
    })
  }

  // The demo conversation: one imported thread, every candidate outcome.
  const existingThread = await prisma.conversationThread.findFirst({ where: { title: DEMO_THREAD_TITLE } })
  if (existingThread) {
    console.log('Demo conversation already seeded; skipping.')
  } else {
    const agent = await prisma.agent.upsert({
      where: { name: DEMO_AGENT_NAME },
      update: {},
      create: {
        name: DEMO_AGENT_NAME,
        operator: 'Idea Stock Exchange',
        description: 'Seed data: imports the worked-example conversation from the integration basis doc.',
        isSystem: true,
      },
    })

    const electionId = id('accept-certified-election-results')
    const thread = await prisma.conversationThread.create({
      data: {
        platform: 'reddit',
        title: DEMO_THREAD_TITLE,
        beliefId: electionId,
        submittedByAgentId: agent.id,
      },
    })

    const bodies: Array<[string, string]> = [
      ['u/ballot_curious', 'Serious question: do you actually have to accept election results if you think it was rigged?'],
      ['u/norms_matter', 'Yes, because the acceptance norm only works if it binds both sides. The side with more institutional scruple keeps conceding while the other side pockets the wins, and then the whole equilibrium is gone.'],
      ['u/audit_hawk', 'The real problem nobody talks about: certification deadlines are so tight that meaningful audits are impossible before results become official.'],
      ['u/history_nerd', 'Elections have literally been stolen before, look at 1876. The Hayes-Tilden mess was settled by a backroom bargain, not by courts.'],
      ['u/norms_matter', 'Courts threw out more than sixty challenges after 2020 for lack of proof. The dispute channel exists and it was used.'],
      ['u/vibes_only', 'lol this thread again'],
      ['u/cynic_prime', 'Everyone knows politicians lie about everything anyway.'],
    ]
    const messages = []
    for (let i = 0; i < bodies.length; i++) {
      messages.push(
        await prisma.conversationMessage.create({
          data: { threadId: thread.id, index: i, authorHandle: bodies[i][0], body: bodies[i][1] },
        }),
      )
    }

    const asymmetricEdge = await prisma.argument.findFirst({
      where: { parentBeliefId: electionId, beliefId: id('acceptance-norms-bind-asymmetrically') },
    })
    const stolenEdge = await prisma.argument.findFirst({
      where: { parentBeliefId: electionId, beliefId: id('stolen-elections-exist') },
    })
    const channelEdge = await prisma.argument.findFirst({
      where: { parentBeliefId: electionId, beliefId: id('election-disputes-belong-in-court') },
    })

    const now = new Date()
    await prisma.argumentCandidate.createMany({
      data: [
        {
          threadId: thread.id,
          messageId: messages[1].id,
          statement: 'The side with more institutional scruple keeps conceding while the other side pockets the wins.',
          direction: 'con',
          contextQuote: 'Yes, because the acceptance norm only works if it binds both sides…',
          beliefId: electionId,
          band: 'distinct',
          status: 'integrated',
          integratedArgumentId: asymmetricEdge?.id ?? null,
          resolvedAt: now,
        },
        {
          threadId: thread.id,
          messageId: messages[2].id,
          statement: 'Certification deadlines are so tight that meaningful audits are impossible before results become official.',
          direction: 'con',
          contextQuote: 'The real problem nobody talks about: certification deadlines are so tight…',
          beliefId: electionId,
          band: 'distinct',
          status: 'pending',
        },
        {
          threadId: thread.id,
          messageId: messages[3].id,
          statement: 'The Hayes-Tilden dispute was settled by a backroom bargain, not by courts.',
          direction: 'con',
          contextQuote: 'Elections have literally been stolen before, look at 1876…',
          beliefId: electionId,
          nearestArgumentId: stolenEdge?.id ?? null,
          similarity: 0.82,
          band: 'probable-group',
          status: 'duplicate',
          resolvedAt: now,
        },
        {
          threadId: thread.id,
          messageId: messages[4].id,
          statement: 'Courts threw out more than sixty challenges after 2020 for lack of proof.',
          direction: 'pro',
          contextQuote: 'Courts threw out more than sixty challenges after 2020 for lack of proof…',
          beliefId: electionId,
          nearestArgumentId: channelEdge?.id ?? null,
          similarity: 0.61,
          band: 'related-link',
          status: 'pending',
        },
        {
          threadId: thread.id,
          messageId: messages[6].id,
          statement: 'Everyone knows politicians lie about everything anyway.',
          direction: 'con',
          contextQuote: 'Everyone knows politicians lie about everything anyway.',
          beliefId: electionId,
          band: 'distinct',
          status: 'dismissed',
          resolvedAt: now,
        },
      ],
    })
  }

  // The engine's turn: recompute every conclusion the new trees touch.
  for (const rootId of rootIds) {
    await propagateBeliefScores(rootId, new Set(), 0, `constitution topic seed on belief #${rootId}`)
  }

  console.log(
    `Seeded topic "protecting-the-constitution": ${BELIEFS.length} beliefs, ` +
      `${EDGES.length} argument edges, ${EVIDENCE.length} evidence rows, and the demo conversation.`,
  )
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
