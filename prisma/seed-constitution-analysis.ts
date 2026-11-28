/**
 * Populate every canonical belief-page section for the two Protecting the
 * Constitution pages seeded by seed-constitution-topic.ts — election
 * acceptance and court compliance — so the live /beliefs/[slug] pages show
 * the whole template with real content: scorecard text, objective criteria,
 * falsifiability, predictions, logical anatomy, assumptions, cost-benefit,
 * conflict resolution, media, legal, general-to-specific mapping, similar
 * beliefs, and definitions.
 *
 * Rule 6 throughout: every relationship `score` column stays null. Rows
 * enter and rank only by their own sub-debates once the engine scores them.
 * Idempotent: per-belief child tables are cleared and recreated; beliefs and
 * one-to-one analysis rows upsert.
 */
import { prisma } from '../src/lib/prisma'

const CATEGORY = 'Governance'
const SUBCATEGORY = 'Protecting the Constitution'

const ELECTION = 'accept-certified-election-results'
const COURT = 'comply-with-final-court-rulings'

interface BeliefStub {
  slug: string
  statement: string
  positivity: number
  claimStrength: number
  specificity: number
}

// Endpoints for the mapping and similar-belief tables (every link must
// resolve to a real page — Rule 5 — so each gets its own belief row).
const STUBS: BeliefStub[] = [
  { slug: 'legitimacy-flows-from-process', statement: 'Legitimacy flows from process, not from any particular outcome.', positivity: 80, claimStrength: 0.8, specificity: 0.1 },
  { slug: 'no-side-judges-own-case', statement: 'No side can be trusted to judge its own case.', positivity: 80, claimStrength: 0.8, specificity: 0.1 },
  { slug: 'important-outcomes-override-process', statement: 'Outcomes of sufficient importance justify overriding process.', positivity: -70, claimStrength: 0.8, specificity: 0.1 },
  { slug: 'officials-work-without-threats', statement: 'Election officials of both parties should be able to do their jobs without threats.', positivity: 85, claimStrength: 0.8, specificity: 0.85 },
  { slug: 'routine-risk-limiting-audits', statement: 'Risk-limiting audits should be routine before certification, not a concession to doubt.', positivity: 60, claimStrength: 0.5, specificity: 0.9 },
  { slug: 'certified-results-valid-even-if-captured', statement: 'Certified results are valid even if the adjudication system itself is captured.', positivity: 70, claimStrength: 1.0, specificity: 0.6 },
  { slug: 'certified-results-bind-while-independent', statement: 'Certified results bind while the adjudication process retains measurable independence.', positivity: 65, claimStrength: 0.5, specificity: 0.7 },
  { slug: 'judicial-independence-deserves-defense', statement: 'Judicial independence deserves defense even when the courts rule against your side.', positivity: 70, claimStrength: 0.8, specificity: 0.7 },
  { slug: 'attacking-judges-undermines-compliance', statement: 'Attacking judges personally for rulings undermines the compliance the system runs on; disputes with rulings belong in appeals, not threats.', positivity: 70, claimStrength: 0.8, specificity: 0.8 },
  { slug: 'every-ruling-beyond-criticism', statement: 'Every judicial ruling is beyond criticism and courts are the sole authority on constitutional meaning.', positivity: 60, claimStrength: 1.0, specificity: 0.5 },
  { slug: 'branches-may-ignore-any-ruling', statement: 'Branches may ignore any ruling their own reading deems wrong.', positivity: -80, claimStrength: 1.0, specificity: 0.5 },
  { slug: 'final-rulings-bind-criticism-open', statement: 'Final rulings bind while criticism, appeal, and legislative reversal stay fully open.', positivity: 70, claimStrength: 0.5, specificity: 0.7 },
  { slug: 'interim-orders-contestable-final-obeyed', statement: 'Interim orders may be contested through stays, but operative final rulings are obeyed.', positivity: 65, claimStrength: 0.5, specificity: 0.8 },
]

async function clearChildren(beliefIds: number[]) {
  const where = { beliefId: { in: beliefIds } }
  await prisma.objectiveCriteria.deleteMany({ where })
  await prisma.falsifiabilityItem.deleteMany({ where })
  await prisma.testablePrediction.deleteMany({ where })
  await prisma.componentClaim.deleteMany({ where })
  await prisma.assumption.deleteMany({ where })
  await prisma.costBenefitItem.deleteMany({ where })
  await prisma.impactEntry.deleteMany({ where })
  await prisma.valueRanking.deleteMany({ where })
  await prisma.interestSatisfaction.deleteMany({ where: { interest: { beliefId: { in: beliefIds } } } })
  await prisma.interestEntry.deleteMany({ where })
  await prisma.sharedInterest.deleteMany({ where })
  await prisma.compromise.deleteMany({ where })
  await prisma.disputeType.deleteMany({ where })
  await prisma.obstacle.deleteMany({ where })
  await prisma.biasEntry.deleteMany({ where })
  await prisma.mediaResource.deleteMany({ where })
  await prisma.legalEntry.deleteMany({ where })
  await prisma.definition.deleteMany({ where })
  await prisma.beliefMapping.deleteMany({
    where: { OR: [{ parentBeliefId: { in: beliefIds } }, { childBeliefId: { in: beliefIds } }] },
  })
}

async function seedElection(id: number, ids: Map<string, number>) {
  const ref = (slug: string): number => {
    const v = ids.get(slug)
    if (v === undefined) throw new Error(`Missing belief "${slug}"`)
    return v
  }

  await prisma.belief.update({
    where: { id },
    data: {
      deweyNumber: '324.6',
      bottomLine:
        "Loser's consent is the load-bearing wall of peaceful power transfer. The obligation runs through the " +
        'process, not through the loser’s satisfaction: a certified outcome binds after adjudication under rules ' +
        'fixed before the outcome was known, which is different from pretending any given election was flawless. ' +
        'And it binds winners too: a narrow win confers office, not exemption from checks.',
      scoreMover: 'Evidence on whether election adjudication stays independent enough to deserve deference.',
      netInterpretation:
        'The pro side carries the reciprocity mechanism and the existence of the dispute channel; the con side ' +
        'is strongest where it attacks the independence of the referees rather than the norm itself.',
      logicalForm:
        '[Accept certified results even when losing] = [Certification follows adjudication under rules fixed in advance] ' +
        'AND [Those processes stay independent enough to deserve deference] AND [Accepting adverse verdicts beats each side judging its own case]',
      relatedBeliefs: 'Court Compliance and Judicial Independence | Election Administration',
      supportsBeliefs: 'We should defend our Constitution | We should uphold the rule of law | The peaceful transfer of power must stay unbroken',
    },
  })

  await prisma.objectiveCriteria.createMany({
    data: [
      { beliefId: id, description: "Loser's-consent behavior", howToMeasure: 'Share of losing candidates in major races who concede and comply with certification deadlines, tracked by party', strengthenReading: 'Concession and compliance stay the norm for both parties', weakenReading: 'Refusing to concede becomes a routine strategy for either party', criteriaType: 'empirical measurement' },
      { beliefId: id, description: 'Adjudication finality', howToMeasure: 'Share of election lawsuits whose final rulings all parties comply with', strengthenReading: 'Rulings end disputes in practice, not just on paper', weakenReading: 'Losing litigants relitigate through pressure on officials', criteriaType: 'empirical measurement' },
      { beliefId: id, description: 'Adjudicator independence', howToMeasure: 'Election rulings tracked against the appointing party of the judges issuing them', strengthenReading: 'Rulings cut against appointing party at normal rates', weakenReading: 'Rulings align with appointing party regardless of evidence', criteriaType: 'empirical measurement' },
      { beliefId: id, description: 'Election-worker safety', howToMeasure: 'Threat reports and turnover among election officials', strengthenReading: 'Officials can certify against their own side without fear', weakenReading: 'Threats make certification an act of courage', criteriaType: 'empirical measurement' },
    ],
  })

  await prisma.falsifiabilityItem.createMany({
    data: [
      { beliefId: id, side: 'strengthen', description: 'A maximally contested transfer of power resolved cleanly through adjudication, with the losing side conceding and both parties’ officials certifying', sortOrder: 0 },
      { beliefId: id, side: 'strengthen', description: 'Officials of both parties repeatedly certifying results their side lost, at personal political cost, with the system protecting them', sortOrder: 1 },
      { beliefId: id, side: 'weaken', description: 'A certified result later overturned as fraudulent by the adjudication system itself, showing deference was misplaced while the fraud stood', sortOrder: 0 },
      { beliefId: id, side: 'weaken', description: 'Certification refusal spreading as a routine strategy with no institutional consequence for the refusers', sortOrder: 1 },
    ],
  })

  await prisma.testablePrediction.createMany({
    data: [
      { beliefId: id, prediction: 'Jurisdictions that adopt pre-committed challenge standards and routine audits resolve disputes faster and with higher loser acceptance', followsIf: 'true', timeframe: 'Ongoing', verificationMethod: 'Dispute-duration and concession tracking across states', sortOrder: 0 },
      { beliefId: id, prediction: 'Sustained loser-consent collapse in consecutive cycles produces escalating extra-constitutional conflict rather than stable competition', followsIf: 'true', timeframe: '10-20 years', verificationMethod: 'Acceptance polling plus incident tracking', sortOrder: 1 },
    ],
  })

  await prisma.componentClaim.createMany({
    data: [
      { beliefId: id, claim: 'Certification follows adjudication under rules fixed before the outcome was known', claimType: 'Empirical', stated: true, survivesWithout: false, unstatedAssumptions: 'The rules were not rewritten mid-count to produce the result', sortOrder: 0 },
      { beliefId: id, claim: 'Adjudication processes stay independent enough to deserve deference', claimType: 'Empirical', stated: false, survivesWithout: false, unstatedAssumptions: 'Capture would be visible in the Adjudicator Independence criterion, not just alleged by losers', sortOrder: 1 },
      { beliefId: id, claim: 'No side can be the judge of its own defeat', claimType: 'Normative', stated: false, survivesWithout: false, unstatedAssumptions: 'Self-judged fairness collapses into “fair means my side won”', sortOrder: 2 },
      { beliefId: id, claim: 'The obligation binds winners too: a narrow win confers office, not exemption from checks', claimType: 'Normative', stated: false, survivesWithout: true, unstatedAssumptions: 'Mandate claims are scored like any other claim', sortOrder: 3 },
    ],
  })

  await prisma.assumption.createMany({
    data: [
      { beliefId: id, side: 'accept', statement: 'Election fairness can be established by processes external to the contestants (courts, bipartisan certification, audits, observers), and those verdicts bind the loser', strength: 'CRITICAL' },
      { beliefId: id, side: 'accept', statement: 'The long-run value of the acceptance equilibrium exceeds the stakes of any single election', strength: 'STRONG' },
      { beliefId: id, side: 'accept', statement: 'Courts remain independent enough that election adjudication is not just politics in robes', strength: 'STRONG' },
      { beliefId: id, side: 'reject', statement: "A loser's sincere belief that an election was unfair can justify rejecting the certified result", strength: 'CRITICAL' },
      { beliefId: id, side: 'reject', statement: 'Some single elections carry stakes that outweigh the equilibrium itself', strength: 'STRONG' },
      { beliefId: id, side: 'reject', statement: 'The adjudicators are captured, so deference to their verdicts is surrender', strength: 'STRONG' },
    ],
  })

  await prisma.costBenefitItem.createMany({
    data: [
      { beliefId: id, side: 'benefit', claim: 'Peaceful transfers of power avoid the human and economic losses of violent succession', category: 'lives / dollars', sortOrder: 0 },
      { beliefId: id, side: 'benefit', claim: 'Losers retain full standing to compete and win next time, keeping conflict inside elections', category: 'freedom', sortOrder: 1 },
      { beliefId: id, side: 'benefit', claim: 'Predictable transitions preserve long-horizon planning, investment, and alliances', category: 'dollars', sortOrder: 2 },
      { beliefId: id, side: 'cost', claim: 'A fraudulent result stands until the adjudication system catches it, and some never get caught', category: 'freedom', sortOrder: 0 },
      { beliefId: id, side: 'cost', claim: 'Unilateral scruple is exploitable: one side conceding while the other contests everything shifts outcomes over time', category: 'freedom', sortOrder: 1 },
      { beliefId: id, side: 'cost', claim: 'Acceptance rhetoric can chill legitimate scrutiny of real administrative failures', category: 'freedom', sortOrder: 2 },
    ],
  })

  await prisma.impactEntry.createMany({
    data: [
      { beliefId: id, term: 'short', description: 'Conceding always costs the loser now: office, agenda, and the story that the loss was deserved', sortOrder: 0 },
      { beliefId: id, term: 'long', description: 'Every faction eventually collects on the insurance it paid into, because every faction eventually loses', sortOrder: 0 },
    ],
  })

  await prisma.valueRanking.createMany({
    data: [
      { beliefId: id, value: 'Stability / Rule of Law', supporterRank: 1, opponentRank: 2, whyDiffer: "Supporters see finality as the wall between ballots and bullets; skeptics see premature finality as fraud's best friend", sortOrder: 0 },
      { beliefId: id, value: 'Justice / Fair Play', supporterRank: 2, opponentRank: 1, whyDiffer: 'Skeptics weight the horror of a stolen election standing; supporters weight the horror of every loss becoming a coup attempt', sortOrder: 1 },
    ],
  })

  const valuesData = {
    supportingAdvertised: 'Preserving democracy and the peaceful transfer of power',
    supportingActual: 'Sometimes: complacency about administrative failure when their side wins',
    supportingDivergenceEvidence: 'The one-question test: did you apply the same evidence standard to elections your side won and lost? Consistency across outcomes is the observable.',
    opposingAdvertised: 'Vigilance against fraud and a corrupted process',
    opposingActual: 'Sometimes: unwillingness to lose, dressed as vigilance',
    opposingDivergenceEvidence: 'The same one-question test, applied to the other side: fraud claims that appear only after losses and dissolve under adjudication.',
    whatWouldShift: 'Audit results, chain-of-custody records, and rulings from judges across appointing parties would move the empirical dispute; the values ranking moves only when the cost-benefit rows carry real likelihoods.',
  }
  await prisma.valuesAnalysis.upsert({ where: { beliefId: id }, update: valuesData, create: { beliefId: id, ...valuesData } })

  await prisma.interestEntry.createMany({
    data: [
      { beliefId: id, side: 'supporter', interest: 'A country where losing power is survivable and transitions stay peaceful', prevalence: 'High', linkageConfidence: 'High', validity: '85', evidenceBasis: 'Cross-party alarm at succession violence; consistent support for concession norms when out of power', connectedValue: 'Safety, Stability', prevalenceScore: 60, linkageAccuracy: 80, validityScore: 85, sortOrder: 0 },
      { beliefId: id, side: 'supporter', interest: 'Pretextual: demanding losers’ consent while working to degrade the conditions that make consent reasonable', prevalence: 'Low', linkageConfidence: 'Med', validity: '10', evidenceBasis: 'The demand appears only when their side wins; scrutiny language returns when it loses', connectedValue: '—', pretextual: true, prevalenceScore: 15, validityScore: 10, sortOrder: 1 },
      { beliefId: id, side: 'opponent', interest: 'Not being cheated: real remedies when fraud or administrative failure actually occurs', prevalence: 'High', linkageConfidence: 'High', validity: '80', evidenceBasis: 'Sustained engagement with audit, recount, and transparency mechanisms', connectedValue: 'Justice, Fair Play', prevalenceScore: 55, linkageAccuracy: 75, validityScore: 80, sortOrder: 0 },
      { beliefId: id, side: 'opponent', interest: 'Pretextual: keeping power, or denying legitimacy to the winner, despite losing under the agreed rules', prevalence: 'Low', linkageConfidence: 'Med', validity: '10', evidenceBasis: 'Fraud claims that appear only after losses and dissolve under adjudication', connectedValue: '—', pretextual: true, prevalenceScore: 15, validityScore: 10, sortOrder: 1 },
    ],
  })

  await prisma.sharedInterest.createMany({
    data: [
      { beliefId: id, interest: 'Neither side wants the other to steal an election', validity: '90', validityScore: 90, compromiseDirection: 'Verification both sides trust: routine risk-limiting audits and transparent counting, run before certification, so finality gets easier to accept', sortOrder: 0 },
      { beliefId: id, interest: 'Both sides want their next win recognized as legitimate', validity: '85', validityScore: 85, compromiseDirection: 'Reciprocal concession norms: the acceptance you show losing is the acceptance you receive winning', sortOrder: 1 },
    ],
  })

  const interestsData = {
    primaryPairSupporter: 'Finality of adjudicated outcomes',
    primaryPairSupporterDrives: 'Without a point where disputes end, every election extends indefinitely and the transfer never completes',
    primaryPairOpponent: 'Remedy for suspected fraud',
    primaryPairOpponentDrives: 'A remedy that closes before the evidence can surface is not a remedy; historical fraud was real',
  }
  await prisma.interestsAnalysis.upsert({ where: { beliefId: id }, update: interestsData, create: { beliefId: id, ...interestsData } })

  await prisma.compromise.createMany({
    data: [
      { beliefId: id, description: 'Routine pre-certification verification paired with hard finality once adjudication completes', sharedPremise: 'Neither side wants the other to steal an election', synthesis: 'Routine pre-certification verification (risk-limiting audits, transparent chain of custody) paired with hard finality once adjudication completes', whyDifficult: 'Verification is boring and finality is painful; each side funds the half that helps it this cycle' },
      { beliefId: id, description: 'Pre-commitment pledges on challenge evidence and final adjudication', sharedPremise: 'Elections must be decided by rules fixed before the outcome is known', synthesis: 'Pre-commitment pledges: candidates state before the election what evidence would justify a challenge and which adjudication they will accept as final', whyDifficult: 'Pledges are cheap talk unless voters, donors, and media price defection after the fact' },
    ],
  })

  await prisma.disputeType.createMany({
    data: [
      { beliefId: id, disputeType: 'Empirical', disagreement: 'Was this particular election administered and adjudicated fairly?', evidenceThatMoves: 'Audit results, chain-of-custody records, and rulings from judges across appointing parties', sortOrder: 0 },
      { beliefId: id, disputeType: 'Definitional', disagreement: 'What “free and fair” means: certified by process, or satisfying to the loser', evidenceThatMoves: 'Adopting the operational definition below; disputes that survive it are real', sortOrder: 1 },
      { beliefId: id, disputeType: 'Values', disagreement: 'When finality and fraud-remedy directly conflict, which yields', evidenceThatMoves: 'The cost-benefit rows above with likelihoods filled: a real trade-off, not a misunderstanding', sortOrder: 2 },
    ],
  })

  await prisma.obstacle.createMany({
    data: [
      { beliefId: id, side: 'supporter', description: 'Dismissing every fraud concern as bad faith alienates the persuadable and hands skeptics their best exhibit' },
      { beliefId: id, side: 'opposition', description: 'Unfalsifiable fraud claims, where every loss is itself the proof, foreclose the adjudication they demand' },
    ],
  })

  await prisma.biasEntry.createMany({
    data: [
      { beliefId: id, side: 'supporter', biasType: 'normalcy_bias', description: 'The norm held before, so it will hold again without maintenance' },
      { beliefId: id, side: 'opponent', biasType: 'motivated_reasoning', description: 'Fraud beliefs track which side lost, not where the evidence points' },
    ],
  })

  await prisma.mediaResource.createMany({
    data: [
      { beliefId: id, side: 'supporting', mediaType: 'speech', title: "Gore's concession speech: loser's consent performed on live television after a 5-4 ruling against him", author: 'Al Gore', year: 2000, reliabilityTier: 'T2' },
      { beliefId: id, side: 'supporting', mediaType: 'book', title: "How Democracies Die: losers' consent and mutual toleration as the norms that keep constitutions alive", author: 'Steven Levitsky and Daniel Ziblatt', year: 2018, reliabilityTier: 'T2', genreType: 'academic_popular' },
      { beliefId: id, side: 'opposing', mediaType: 'book', title: 'Deliver the Vote: American election fraud is a real historical tradition, not a paranoid invention', author: 'Tracy Campbell', year: 2005, reliabilityTier: 'T2', genreType: 'academic_popular' },
      { beliefId: id, side: 'opposing', mediaType: 'book', title: 'Histories of the 1876 Hayes-Tilden dispute: what a truly failed adjudication looks like', reliabilityTier: 'T2', genreType: 'academic_popular' },
    ],
  })

  await prisma.legalEntry.createMany({
    data: [
      { beliefId: id, side: 'supporting', description: "Electoral Count Reform Act (2022): the vice president's role is ministerial and objection thresholds are raised, closing the pressure points exploited by challenge campaigns", jurisdiction: 'federal' },
      { beliefId: id, side: 'supporting', description: 'Moore v. Harper (2023): state courts can review election rules, rejecting the strongest independent-state-legislature theory', jurisdiction: 'federal' },
      { beliefId: id, side: 'contradicting', description: 'Certification duties vary by state, and some officials retain discretion in practice until courts order otherwise', jurisdiction: 'state' },
      { beliefId: id, side: 'contradicting', description: 'The pardon power can nullify accountability for election interference after the fact', jurisdiction: 'federal' },
    ],
  })

  await prisma.beliefMapping.createMany({
    data: [
      { parentBeliefId: ref('legitimacy-flows-from-process'), childBeliefId: id, direction: 'upstream', side: 'support' },
      { parentBeliefId: ref('no-side-judges-own-case'), childBeliefId: id, direction: 'upstream', side: 'support' },
      { parentBeliefId: ref('important-outcomes-override-process'), childBeliefId: id, direction: 'upstream', side: 'oppose' },
      { parentBeliefId: id, childBeliefId: ref('certification-is-ministerial'), direction: 'downstream', side: 'support' },
      { parentBeliefId: id, childBeliefId: ref('pre-commit-challenge-standards'), direction: 'downstream', side: 'support' },
      { parentBeliefId: id, childBeliefId: ref('officials-work-without-threats'), direction: 'downstream', side: 'support' },
      { parentBeliefId: id, childBeliefId: ref('routine-risk-limiting-audits'), direction: 'downstream', side: 'support' },
      { parentBeliefId: id, childBeliefId: ref('certifiers-should-have-discretion'), direction: 'downstream', side: 'oppose' },
    ],
  })

  await ensureSimilar(id, ref('certified-results-valid-even-if-captured'), 'extreme')
  await ensureSimilar(id, ref('certified-results-bind-while-independent'), 'moderate')

  await prisma.definition.createMany({
    data: [
      { beliefId: id, term: 'Certified', definition: 'The statutory process is complete: counts, any recounts and audits the rules provide, and final rulings on any challenges filed. A result is not “certified” in this page’s sense while lawful challenges are still pending.', sortOrder: 0 },
      { beliefId: id, term: 'Free and fair', definition: 'An election whose conduct and disputes are governed by rules fixed in advance and adjudicated by processes independent of the contestants. Fairness is a property certified by process, not by the loser’s satisfaction.', sortOrder: 1 },
      { beliefId: id, term: 'Accept', definition: 'Concede formally, comply with the transfer, and pursue every future goal inside the system. Acceptance is not agreement and not silence: you can accept the result, criticize the administration, and organize to win next time, all at once.', sortOrder: 2 },
    ],
  })
}

async function seedCourt(id: number, ids: Map<string, number>) {
  const ref = (slug: string): number => {
    const v = ids.get(slug)
    if (v === undefined) throw new Error(`Missing belief "${slug}"`)
    return v
  }

  await prisma.belief.update({
    where: { id },
    data: {
      deweyNumber: '347.012',
      bottomLine:
        'Appeal is respect; defiance is exit. Courts command no army and no treasury, so judicial review runs ' +
        'entirely on compliance, and a system where each branch picks which final rulings to obey is not a legal ' +
        'system but a suggestion box. The claim covers final rulings after appeal, and compliance is fully ' +
        'compatible with loud criticism, vigorous appeal, and legislative reversal.',
      scoreMover: 'Whether open defiance of a final ruling draws institutional consequence or becomes routine.',
      netInterpretation:
        'The pro side rests on the enforcement premise (review has force only through compliance); the con side ' +
        'is strongest on irreversible harms and on rulings that track the appointing party.',
      logicalForm:
        '[Comply while appealing] = [Final rulings bind every party before them] AND [Appeal channels provide real remedies in realistic time] ' +
        'AND [A compliance equilibrium beats case-by-case defiance even when particular rulings are wrong]',
      relatedBeliefs: 'Election Acceptance | Judicial Independence',
      supportsBeliefs: 'We should defend our Constitution | We should uphold the rule of law | We should accept certified election results even when our side loses',
    },
  })

  // The one famous quote the page carries, on the argument it belongs to.
  await prisma.argument.updateMany({
    where: { parentBeliefId: id, beliefId: ref('court-orders-bind-or-decorative') },
    data: { famousQuote: 'The judiciary has neither force nor will, but merely judgment.', quoteAuthor: 'Alexander Hamilton, Federalist No. 78', quoteAuthorUrl: null },
  })

  await prisma.objectiveCriteria.createMany({
    data: [
      { beliefId: id, description: 'Compliance with final rulings', howToMeasure: "Instances of a branch or state openly refusing a final ruling's operative terms, per decade, with outcomes", strengthenReading: 'Defiance stays rare and draws real consequence', weakenReading: 'Defiance becomes a routine tool with no consequence', criteriaType: 'empirical measurement' },
      { beliefId: id, description: 'Max-cost compliance', howToMeasure: 'Cases where officials obeyed rulings that ended careers or agendas', strengthenReading: 'The Nixon pattern recurs across parties', weakenReading: 'Compliance appears only when cheap', criteriaType: 'empirical measurement' },
      { beliefId: id, description: 'Cross-party ruling patterns', howToMeasure: 'High-stakes rulings tracked against the appointing party of the deciding judges', strengthenReading: 'Judges regularly rule against their appointing side', weakenReading: 'Outcomes predictable from appointment alone', criteriaType: 'empirical measurement' },
    ],
  })

  await prisma.falsifiabilityItem.createMany({
    data: [
      { beliefId: id, side: 'strengthen', description: 'An administration of either party complying with a final ruling that costs it a defining priority, and surviving politically', sortOrder: 0 },
      { beliefId: id, side: 'strengthen', description: 'Expedited-appeal reforms measurably shrinking the window where compliance can moot irreversible harms', sortOrder: 1 },
      { beliefId: id, side: 'weaken', description: 'A branch of government openly defying a final ruling with no institutional consequence, then repeating it', sortOrder: 0 },
      { beliefId: id, side: 'weaken', description: 'Ruling outcomes in separation-of-powers cases becoming fully predictable from the appointing party', sortOrder: 1 },
    ],
  })

  await prisma.componentClaim.createMany({
    data: [
      { beliefId: id, claim: 'Final rulings bind every party before them, including the government', claimType: 'Definitional', stated: true, survivesWithout: false, unstatedAssumptions: '“Final” is identifiable: appeals exhausted or forgone, mandate issued', sortOrder: 0 },
      { beliefId: id, claim: 'Appeal channels deliver real remedies in realistic time', claimType: 'Empirical', stated: false, survivesWithout: true, unstatedAssumptions: 'Stays and expedited review exist for the cases that cannot wait', sortOrder: 1 },
      { beliefId: id, claim: 'The compliance equilibrium beats case-by-case defiance even when particular rulings are wrong', claimType: 'Normative', stated: false, survivesWithout: false, unstatedAssumptions: 'Wrong rulings get corrected faster inside the system than the defiance precedent gets contained once set', sortOrder: 2 },
    ],
  })

  await prisma.assumption.createMany({
    data: [
      { beliefId: id, side: 'accept', statement: 'Courts retain enough independence that their final word deserves deference even from the branches they rule against', strength: 'CRITICAL' },
      { beliefId: id, side: 'accept', statement: 'The damage a wrong ruling does while awaiting correction is smaller than the damage a defiance precedent does forever', strength: 'STRONG' },
      { beliefId: id, side: 'reject', statement: "Each branch's own constitutional reading can legitimately override a final ruling it deems lawless", strength: 'CRITICAL' },
      { beliefId: id, side: 'reject', statement: 'Some rulings do harm so great and so irreversible that no equilibrium argument outweighs refusing them', strength: 'STRONG' },
    ],
  })

  await prisma.costBenefitItem.createMany({
    data: [
      { beliefId: id, side: 'benefit', claim: 'Every right stays enforceable, including for the weakest parties, because government obedience is the enforcement', category: 'freedom', sortOrder: 0 },
      { beliefId: id, side: 'benefit', claim: 'Predictable law preserves contracts, investment, and planning horizons', category: 'dollars', sortOrder: 1 },
      { beliefId: id, side: 'cost', claim: 'Wrong rulings govern until reversed, and reversal can take a generation', category: 'freedom / life-years', sortOrder: 0 },
      { beliefId: id, side: 'cost', claim: 'In genuine emergencies, compliance with a mistaken injunction can cost outcomes no appeal restores', category: 'lives / dollars', sortOrder: 1 },
    ],
  })

  await prisma.impactEntry.createMany({
    data: [
      { beliefId: id, term: 'short', description: 'Complying with an adverse ruling always costs the loser now: the policy stops, the tapes come out, the mills go back', sortOrder: 0 },
      { beliefId: id, term: 'long', description: 'The branch that obeys while losing keeps a judiciary worth winning in, and every branch eventually needs one', sortOrder: 0 },
    ],
  })

  const interestsData = {
    primaryPairSupporter: 'Judicial finality',
    primaryPairSupporterDrives: 'Somebody must have the last word or disputes never end, and the branch with no army is the safest holder of it',
    primaryPairOpponent: 'Departmental conscience',
    primaryPairOpponentDrives: "An oath to the Constitution is not an oath to the judiciary's reading of it, and courts have been badly wrong",
  }
  await prisma.interestsAnalysis.upsert({ where: { beliefId: id }, update: interestsData, create: { beliefId: id, ...interestsData } })

  await prisma.compromise.createMany({
    data: [
      { beliefId: id, description: 'Comply plus fast-track: expedited review and stay practice for high-stakes constitutional clashes', sharedPremise: 'Wrong rulings should be correctable fast, and defiance precedents are dangerous', synthesis: 'Comply plus fast-track: expedited review and stay practice for high-stakes constitutional clashes, so the cost of compliance while appealing shrinks toward zero', whyDifficult: 'Expedited dockets are scarce, and the side benefiting from delay always wants the slow lane' },
    ],
  })

  await prisma.obstacle.createMany({
    data: [
      { beliefId: id, side: 'supporter', description: 'Treating every ruling as sacred conflates the compliance norm with agreement, handing critics a straw man' },
      { beliefId: id, side: 'opposition', description: 'The exception swallows the rule: every administration finds its own emergency lawless enough to justify defiance' },
    ],
  })

  await prisma.biasEntry.createMany({
    data: [
      { beliefId: id, side: 'supporter', biasType: 'authority_bias', description: 'Robes do not make rulings right, only final' },
      { beliefId: id, side: 'opponent', biasType: 'motivated_reasoning', description: 'Rulings feel lawless in proportion to how much they cost your side' },
    ],
  })

  await prisma.mediaResource.createMany({
    data: [
      { beliefId: id, side: 'supporting', mediaType: 'essay', title: 'Federalist No. 78: the least dangerous branch holds judgment only, which is why obedience to it is safe', author: 'Alexander Hamilton', year: 1788, reliabilityTier: 'T2' },
      { beliefId: id, side: 'supporting', mediaType: 'case_record', title: 'United States v. Nixon and the tapes chronology: what maximum-cost compliance looks like', year: 1974, reliabilityTier: 'T1' },
      { beliefId: id, side: 'opposing', mediaType: 'book', title: 'The People Themselves: the historical case for popular constitutionalism against judicial supremacy', author: 'Larry Kramer', year: 2004, reliabilityTier: 'T2', genreType: 'academic_popular' },
      { beliefId: id, side: 'opposing', mediaType: 'history', title: "Accounts of Ex parte Merryman and Lincoln's wartime habeas policy: the emergency-defiance precedent at its most sympathetic", reliabilityTier: 'T2' },
    ],
  })

  await prisma.legalEntry.createMany({
    data: [
      { beliefId: id, side: 'supporting', description: 'Marbury v. Madison (1803) and Cooper v. Aaron (1958): judicial review and its bindingness on the states; Article VI oaths run to the Constitution', jurisdiction: 'federal' },
      { beliefId: id, side: 'supporting', description: 'Contempt power and fee-shifting give final rulings teeth against ordinary parties', jurisdiction: 'federal' },
      { beliefId: id, side: 'contradicting', description: 'Enforcement depends on the executive it may rule against: marshals and contempt power sit downstream of the very branch being checked', jurisdiction: 'federal' },
      { beliefId: id, side: 'contradicting', description: 'The political-question doctrine leaves some constitutional violations with no judicial remedy at all', jurisdiction: 'federal' },
    ],
  })

  await prisma.beliefMapping.createMany({
    data: [
      { parentBeliefId: ref('no-side-judges-own-case'), childBeliefId: id, direction: 'upstream', side: 'support' },
      { parentBeliefId: ref('legitimacy-flows-from-process'), childBeliefId: id, direction: 'upstream', side: 'support' },
      { parentBeliefId: id, childBeliefId: ref('judicial-independence-deserves-defense'), direction: 'downstream', side: 'support' },
      { parentBeliefId: id, childBeliefId: ref('attacking-judges-undermines-compliance'), direction: 'downstream', side: 'support' },
    ],
  })

  await ensureSimilar(id, ref('every-ruling-beyond-criticism'), 'extreme')
  await ensureSimilar(id, ref('branches-may-ignore-any-ruling'), 'extreme')
  await ensureSimilar(id, ref('final-rulings-bind-criticism-open'), 'moderate')
  await ensureSimilar(id, ref('interim-orders-contestable-final-obeyed'), 'moderate')

  await prisma.definition.createMany({
    data: [
      { beliefId: id, term: 'Final ruling', definition: 'Appeals exhausted or forgone and the mandate issued. Seeking a stay or expedited review is inside the system; the clock on “final” does not run while lawful review is pending.', sortOrder: 0 },
      { beliefId: id, term: 'Comply', definition: 'Execute the operative terms of the order. Compliance is measured by conduct, not tone: an official can obey loudly, appeal aggressively, and campaign to change the law, all while complying.', sortOrder: 1 },
      { beliefId: id, term: 'Defiance', definition: 'Refusing or evading the operative terms of a final order. Distinct from seeking a stay, appealing, slow-walking within lawful discretion, or criticizing the ruling.', sortOrder: 2 },
    ],
  })
}

async function ensureSimilar(fromBeliefId: number, toBeliefId: number, variant: 'extreme' | 'moderate') {
  const existing = await prisma.similarBelief.findFirst({ where: { fromBeliefId, toBeliefId } })
  if (!existing) {
    await prisma.similarBelief.create({ data: { fromBeliefId, toBeliefId, variant } })
  }
}

async function main() {
  const ids = new Map<string, number>()
  for (const stub of STUBS) {
    const belief = await prisma.belief.upsert({
      where: { slug: stub.slug },
      update: {},
      create: {
        slug: stub.slug,
        statement: stub.statement,
        category: CATEGORY,
        subcategory: SUBCATEGORY,
        positivity: stub.positivity,
        claimStrength: stub.claimStrength,
        specificity: stub.specificity,
      },
    })
    ids.set(stub.slug, belief.id)
  }

  const needed = [
    ELECTION, COURT,
    'certification-is-ministerial', 'pre-commit-challenge-standards', 'certifiers-should-have-discretion',
    'court-orders-bind-or-decorative',
  ]
  for (const slug of needed) {
    const belief = await prisma.belief.findUnique({ where: { slug }, select: { id: true } })
    if (!belief) {
      throw new Error(`Belief "${slug}" is missing — run prisma/seed-constitution-topic.ts first.`)
    }
    ids.set(slug, belief.id)
  }

  const electionId = ids.get(ELECTION)!
  const courtId = ids.get(COURT)!

  await clearChildren([electionId, courtId])
  await seedElection(electionId, ids)
  await seedCourt(courtId, ids)

  console.log('Seeded every template section for the election-acceptance and court-compliance belief pages.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
