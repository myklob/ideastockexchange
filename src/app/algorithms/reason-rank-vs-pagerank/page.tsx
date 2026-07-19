import Link from 'next/link'
import type { Metadata } from 'next'
import {
  computeArgumentImpactScore,
  calculateEVS,
  computeEvidenceImpactScore,
  getEvidenceTypeWeight,
} from '@/core/scoring/scoring-engine'
import { uniquenessFromSimilarities } from '@/core/scoring/duplication-scoring'
import {
  computeGroundingScore,
  getGroundingBand,
} from '@/core/scoring/grounding'

export const metadata: Metadata = {
  title: 'ReasonRank vs PageRank: A Direct Comparison — Idea Stock Exchange',
  description:
    'PageRank counts endorsements; ReasonRank counts evidence. A side-by-side comparison, plus a worked example where every score is computed live by the scoring engine: truth, linkage, importance, uniqueness, EVS, impact, and grounding.',
}

// ─── The worked example, computed by the engine at render time ──────────────
// The SCENARIO inputs (truth, linkage, importance, similarity, tiers) are
// illustrative; every DERIVED number below is the output of the same engine
// functions the live propagation cascade calls. Nothing is hand-typed.

// Argument A: "Solar costs decreased 90%" — first statement of the point.
const A = { truth: 0.85, linkage: 0.8, importance: 0.9 }
// Argument B: "Installation is cheaper" — 70% overlap with A.
const B = { truth: 0.75, linkage: 0.7, importance: 0.6, similarityToA: 0.7 }

const uniquenessA = uniquenessFromSimilarities([])
const uniquenessB = uniquenessFromSimilarities([B.similarityToA])

const impactA = computeArgumentImpactScore('agree', A.truth, A.linkage, A.importance, uniquenessA)
const impactB = computeArgumentImpactScore('agree', B.truth, B.linkage, B.importance, uniquenessB)
const totalBefore = Math.round((impactA + impactB) * 10) / 10

// The study under Argument A: a healthy T1 source, then the retraction.
const EVIDENCE_LINKAGE = 0.8
const evsBefore = calculateEVS({
  sourceIndependenceWeight: getEvidenceTypeWeight('T1'),
  replicationQuantity: 3,
  conclusionRelevance: 0.9,
  replicationPercentage: 1.0,
})
const evsAfter = calculateEVS({
  sourceIndependenceWeight: getEvidenceTypeWeight('T0'),
  replicationQuantity: 3,
  conclusionRelevance: 0.9,
  replicationPercentage: 0.25,
})
const evidenceImpactBefore = computeEvidenceImpactScore(evsBefore, EVIDENCE_LINKAGE)
const evidenceImpactAfter = computeEvidenceImpactScore(evsAfter, EVIDENCE_LINKAGE)

// After the retraction, A's child belief has nothing left under it: its tree
// score collapses to 0 and the engine recomputes the edge.
const impactAAfter = computeArgumentImpactScore('agree', 0, A.linkage, A.importance, uniquenessA)
const totalAfter = Math.round((impactAAfter + impactB) * 10) / 10

// Evidence Grounding: does each node bottom out in evidence?
const groundChildABefore = computeGroundingScore(
  [{ tier: 'T1', linkageScore: EVIDENCE_LINKAGE }], [],
)
const groundChildAAfter = computeGroundingScore(
  [{ tier: 'T0', linkageScore: EVIDENCE_LINKAGE }], [],
)
const groundChildB = computeGroundingScore([], [])
const groundConclusionBefore = computeGroundingScore([], [
  { linkageScore: A.linkage, childGrounding: groundChildABefore },
  { linkageScore: B.linkage, childGrounding: groundChildB },
])
const groundConclusionAfter = computeGroundingScore([], [
  { linkageScore: A.linkage, childGrounding: groundChildAAfter },
  { linkageScore: B.linkage, childGrounding: groundChildB },
])

// ─── Sub-components ─────────────────────────────────────────────────────────

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>ReasonRank vs PageRank</strong>
    </p>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left align-top">
      {children}
    </th>
  )
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={`border border-gray-300 px-3 py-2 align-top ${mono ? 'font-mono text-sm' : ''}`}>
      {children}
    </td>
  )
}

function GroundingChip({ score }: { score: number }) {
  const band = getGroundingBand(score)
  return (
    <span
      className="inline-block px-2 py-0.5 rounded border border-gray-400 font-mono text-sm"
      style={{ backgroundColor: band.hexColor }}
      title={band.descriptor}
    >
      {score.toFixed(4)} · {band.label}
    </span>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ReasonRankVsPageRankPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight border-b-2 border-gray-200 pb-3">
        ReasonRank vs PageRank: A Direct Comparison
      </h1>

      <p className="mb-3">
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">ReasonRank</Link>{' '}
        is a network-based scoring algorithm that measures the strength of a belief by the
        quality of its supporting arguments, not its popularity. Just as PageRank revolutionized
        the web by treating hyperlinks as votes for importance, ReasonRank treats scored
        arguments as votes for a belief&apos;s validity.
      </p>

      <p className="mb-6">
        The one-sentence difference: <strong>PageRank counts endorsements; ReasonRank counts
        evidence.</strong> A hyperlink says &ldquo;people point here.&rdquo; A scored argument
        says &ldquo;this claim survives scrutiny.&rdquo; Same recursion, better ballots.
      </p>

      <hr className="my-8 border-gray-300" />

      {/* ── Problem vs Solution ──────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">The Problem vs. The Solution</h2>

      <table className="w-full border-collapse mb-8">
        <thead>
          <tr>
            <Th>Current Online Debates</Th>
            <Th>The ReasonRank Solution</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td><strong>Volume over Quality:</strong> the most frequent or loudest comments win, not the most truthful.</Td>
            <Td><strong>Meritocracy of Ideas:</strong> logic and verified evidence determine the score, not likes or post frequency.</Td>
          </tr>
          <tr>
            <Td><strong>Echo Chambers:</strong> algorithms optimize for engagement and outrage, not understanding.</Td>
            <Td>
              <strong>Trust Graph:</strong> only sound reasoning moves the needle. The schema
              contains no engagement columns at all — no clicks, no shares, no dwell time —
              so there is nothing else to rank by.
            </Td>
          </tr>
          <tr>
            <Td><strong>Information Amnesia:</strong> debates reset constantly; nothing builds on established conclusions.</Td>
            <Td>
              <strong>Institutional Memory:</strong> every topic has{' '}
              <Link href="/beliefs" className="text-blue-700 hover:underline">one permanent page</Link>{' '}
              that accumulates analysis instead of restarting it.
            </Td>
          </tr>
        </tbody>
      </table>

      {/* ── Feature comparison ───────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">How ReasonRank Compares to PageRank</h2>

      <p className="mb-4">
        ReasonRank applies graph theory to logic: every claim is a node, every reason is a
        weighted link.
      </p>

      <table className="w-full border-collapse mb-8">
        <thead>
          <tr>
            <Th>Feature</Th>
            <Th>Google PageRank</Th>
            <Th>ISE ReasonRank</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td><strong>The Node</strong></Td>
            <Td>A webpage</Td>
            <Td>A belief or argument</Td>
          </tr>
          <tr>
            <Td><strong>The Connection</strong></Td>
            <Td>A hyperlink</Td>
            <Td>A &ldquo;reason to agree&rdquo; or &ldquo;reason to disagree&rdquo;</Td>
          </tr>
          <tr>
            <Td><strong>The Vote Measures</strong></Td>
            <Td>Endorsement (someone chose to point here)</Td>
            <Td>
              <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">Evidence</Link>{' '}
              (the claim survives scored scrutiny)
            </Td>
          </tr>
          <tr>
            <Td><strong>The Weight</strong></Td>
            <Td>Domain authority (traffic / trust)</Td>
            <Td>
              <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">Truth score</Link>{' '}
              (verified evidence and logic)
            </Td>
          </tr>
          <tr>
            <Td><strong>Propagation</strong></Td>
            <Td>&ldquo;Link juice&rdquo; flows to important pages</Td>
            <Td>&ldquo;Logic strength&rdquo; flows to valid conclusions</Td>
          </tr>
          <tr>
            <Td><strong>Ranking Output</strong></Td>
            <Td>Search results ordered by authority</Td>
            <Td>
              Beliefs ordered by the Evidence Grounding Score: whether the argument tree
              bottoms out in tiered evidence rather than free-floating claims (
              <Link href="/beliefs?sort=grounding" className="text-blue-700 hover:underline">
                see the live ranking
              </Link>
              )
            </Td>
          </tr>
          <tr>
            <Td><strong>Spam Filter</strong></Td>
            <Td>Filters link farms / spam sites</Td>
            <Td>
              Two guards:{' '}
              <Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">redundancy discounting</Link>{' '}
              (repeating a point is not a new point), and circular-citation detection (a ring
              of claims citing each other grounds nothing — the argument-graph equivalent of a
              link farm)
            </Td>
          </tr>
        </tbody>
      </table>

      {/* ── The four scoring dimensions ──────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">The Four Scoring Dimensions</h2>

      <p className="mb-3">
        ReasonRank updates the score of any conclusion <strong>C</strong> from four metrics per
        argument:
      </p>

      <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-mono text-base my-4 rounded">
        C = &Sigma; [(A &minus; D) &times; L &times; V &times; U]
      </div>

      <ol className="list-decimal pl-6 mb-8 space-y-3">
        <li>
          <strong>
            <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">Truth (V)</Link>:
          </strong>{' '}
          how logically sound is the argument? Recursive — an argument&apos;s score depends on
          the scores of its own sub-arguments and{' '}
          <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
            tiered evidence
          </Link>.
        </li>
        <li>
          <strong>
            <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">Linkage (L)</Link>:
          </strong>{' '}
          does the evidence actually prove the conclusion? Penalizes &ldquo;true but
          irrelevant&rdquo; claims.
        </li>
        <li>
          <strong>
            <Link href="/algorithms/importance-score" className="text-blue-700 hover:underline">Importance (A / D)</Link>:
          </strong>{' '}
          how much weight should the point carry — a core pillar or a triviality?
        </li>
        <li>
          <strong>
            <Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">Uniqueness (U)</Link>:
          </strong>{' '}
          is this a new point? Semantically similar arguments are{' '}
          <Link href="/algorithms/combine-similar-beliefs" className="text-blue-700 hover:underline">
            grouped
          </Link>{' '}
          so a score cannot be inflated by repetition.
        </li>
      </ol>

      <hr className="my-8 border-gray-300" />

      {/* ── The live worked example ──────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Example: The Logic Cascade, Computed Live</h2>

      <p className="mb-3">
        The scenario inputs below (truth, linkage, importance, overlap, tiers) are
        illustrative. <strong>Every derived number is computed as this page renders, by the
        same engine functions the live propagation cascade calls</strong> —{' '}
        <code className="text-sm bg-gray-100 px-1 rounded">computeArgumentImpactScore</code>,{' '}
        <code className="text-sm bg-gray-100 px-1 rounded">uniquenessFromSimilarities</code>,{' '}
        <code className="text-sm bg-gray-100 px-1 rounded">calculateEVS</code>, and{' '}
        <code className="text-sm bg-gray-100 px-1 rounded">computeGroundingScore</code>. There
        are no hand-typed scores on this page.
      </p>

      <p className="mb-4">
        <strong>Conclusion:</strong> &ldquo;Solar energy is cost-competitive with fossil
        fuels&rdquo;
      </p>

      <h3 className="text-xl font-bold mb-2">State 1: Both arguments healthy</h3>

      <table className="w-full border-collapse mb-4">
        <thead>
          <tr>
            <Th>Argument (reason to agree)</Th>
            <Th>Truth V</Th>
            <Th>Linkage L</Th>
            <Th>Importance</Th>
            <Th>Uniqueness U</Th>
            <Th>Impact</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td>
              <strong>A:</strong> &ldquo;Solar costs decreased 90%&rdquo; — first statement of
              the point
            </Td>
            <Td mono>{A.truth.toFixed(2)}</Td>
            <Td mono>{A.linkage.toFixed(2)}</Td>
            <Td mono>{A.importance.toFixed(2)}</Td>
            <Td mono>{uniquenessA.toFixed(2)}</Td>
            <Td mono><strong>+{impactA.toFixed(1)}</strong></Td>
          </tr>
          <tr>
            <Td>
              <strong>B:</strong> &ldquo;Installation is cheaper&rdquo; — {Math.round(B.similarityToA * 100)}%
              overlap with A, so uniqueness = 1 &minus; {B.similarityToA.toFixed(1)}
            </Td>
            <Td mono>{B.truth.toFixed(2)}</Td>
            <Td mono>{B.linkage.toFixed(2)}</Td>
            <Td mono>{B.importance.toFixed(2)}</Td>
            <Td mono>{uniquenessB.toFixed(2)}</Td>
            <Td mono><strong>+{impactB.toFixed(1)}</strong></Td>
          </tr>
          <tr>
            <Td><strong>Conclusion total</strong> (Σ of signed impacts)</Td>
            <Td>{null}</Td>
            <Td>{null}</Td>
            <Td>{null}</Td>
            <Td>{null}</Td>
            <Td mono><strong>+{totalBefore.toFixed(1)}</strong></Td>
          </tr>
        </tbody>
      </table>

      <p className="mb-6 text-sm text-gray-600">
        Impact = truth &times; |linkage| &times; importance &times; uniqueness &times; 100,
        signed by side and stored to one decimal — exactly what the propagation engine writes
        to <code className="bg-gray-100 px-1 rounded">Argument.impactScore</code>. B&apos;s
        redundancy discount means restating A&apos;s point contributes {uniquenessB.toFixed(1)}
        &times; its weight, not double credit.
      </p>

      <h3 className="text-xl font-bold mb-2">The evidence under Argument A</h3>

      <table className="w-full border-collapse mb-4">
        <thead>
          <tr>
            <Th>Source</Th>
            <Th>Tier</Th>
            <Th>ESIW</Th>
            <Th>ERQ</Th>
            <Th>ECRS</Th>
            <Th>ERP</Th>
            <Th>EVS</Th>
            <Th>Evidence impact</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td>Peer-reviewed cost study (healthy)</Td>
            <Td mono>T1</Td>
            <Td mono>{getEvidenceTypeWeight('T1').toFixed(2)}</Td>
            <Td mono>3</Td>
            <Td mono>0.90</Td>
            <Td mono>1.00</Td>
            <Td mono>{evsBefore.toFixed(4)}</Td>
            <Td mono>{evidenceImpactBefore.toFixed(2)}</Td>
          </tr>
          <tr>
            <Td>Same study after retraction (data manipulation; replications fail)</Td>
            <Td mono>T0</Td>
            <Td mono>{getEvidenceTypeWeight('T0').toFixed(2)}</Td>
            <Td mono>3</Td>
            <Td mono>0.90</Td>
            <Td mono>0.25</Td>
            <Td mono>{evsAfter.toFixed(4)}</Td>
            <Td mono>{evidenceImpactAfter.toFixed(2)}</Td>
          </tr>
        </tbody>
      </table>

      <p className="mb-6 text-sm text-gray-600">
        EVS = ESIW &times; log&#8322;(ERQ + 1) &times; ECRS &times; ERP; evidence impact = EVS
        &times; linkage &times; 10. The tier is a classification input the community can
        correct (with a mandatory reason, on a ledger); EVS and impact are engine outputs the
        API rejects if submitted by hand.
      </p>

      <h3 className="text-xl font-bold mb-2">State 2: The retraction cascade</h3>

      <blockquote className="border-l-4 border-blue-700 bg-blue-50 px-4 py-3 mb-4">
        <strong>The power of ReasonRank:</strong> when the study is reclassified T1 &rarr; T0,
        Argument A&apos;s child belief has nothing left under it — its tree score collapses to
        0, and the engine recomputes the edge: impact +{impactA.toFixed(1)} &rarr;{' '}
        {impactAAfter.toFixed(1)}. The conclusion falls from{' '}
        <strong>+{totalBefore.toFixed(1)}</strong> to <strong>+{totalAfter.toFixed(1)}</strong>{' '}
        in the same propagation pass, with a score event naming the retraction as the trigger.
        No manual cleanup, no persistent myth — this is the zombie-argument kill switch.
      </blockquote>

      <h3 className="text-xl font-bold mb-2">Evidence Grounding: the ranking column</h3>

      <p className="mb-3">
        Alongside truth, the engine computes whether each node&apos;s tree bottoms out in
        evidence at all — grounding = raw / (raw + 1), where raw sums tier-weighted evidence
        plus linkage-weighted child grounding. This, not engagement, is what{' '}
        <Link href="/beliefs?sort=grounding" className="text-blue-700 hover:underline">
          ranks the belief index
        </Link>.
      </p>

      <table className="w-full border-collapse mb-4">
        <thead>
          <tr>
            <Th>Node</Th>
            <Th>Grounding before</Th>
            <Th>Grounding after retraction</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td>&ldquo;Solar costs decreased 90%&rdquo; (Argument A&apos;s claim)</Td>
            <Td><GroundingChip score={groundChildABefore} /></Td>
            <Td><GroundingChip score={groundChildAAfter} /></Td>
          </tr>
          <tr>
            <Td>&ldquo;Installation is cheaper&rdquo; (Argument B&apos;s claim — no sources of its own)</Td>
            <Td><GroundingChip score={groundChildB} /></Td>
            <Td><GroundingChip score={groundChildB} /></Td>
          </tr>
          <tr>
            <Td><strong>The conclusion</strong></Td>
            <Td><GroundingChip score={groundConclusionBefore} /></Td>
            <Td><GroundingChip score={groundConclusionAfter} /></Td>
          </tr>
        </tbody>
      </table>

      <p className="mb-8 text-sm text-gray-600">
        Note what the bands say: B survived the cascade, but it is <em>unfounded</em> — it has
        no evidence of its own, only phrasing. An engagement feed would rank it by how
        shareable it sounds; the evidence-based ranking keeps it at the bottom until someone
        links a source.
      </p>

      <hr className="my-8 border-gray-300" />

      {/* ── Every score in one place ─────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Every Score the System Needs</h2>

      <p className="mb-4">
        The complete inventory behind the example above — what each score measures, its range,
        the engine function that computes it, and where it is stored. Classification inputs
        (tiers, similarity votes) are community-correctable; every score below is
        engine-computed and audit-locked.
      </p>

      <div className="overflow-x-auto mb-8">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <Th>Score</Th>
              <Th>Range</Th>
              <Th>Computed by</Th>
              <Th>Stored at</Th>
              <Th>Explainer</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>Truth (V) — net tree score</Td>
              <Td mono>0–1</Td>
              <Td mono>scoreProtocolBelief / computeBeliefScores</Td>
              <Td mono>Belief.positivity</Td>
              <Td><Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">Truth Scores</Link></Td>
            </tr>
            <tr>
              <Td>Linkage (L) — relevance of an edge</Td>
              <Td mono>&minus;1–1</Td>
              <Td mono>calculateLinkageFromArguments</Td>
              <Td mono>Argument.linkageScore</Td>
              <Td><Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">Linkage Scores</Link></Td>
            </tr>
            <tr>
              <Td>Importance — how much the point matters</Td>
              <Td mono>0–1</Td>
              <Td mono>deriveImportanceFromBeliefScore</Td>
              <Td mono>Argument.importanceScore</Td>
              <Td><Link href="/algorithms/importance-score" className="text-blue-700 hover:underline">Importance Score</Link></Td>
            </tr>
            <tr>
              <Td>Uniqueness (U) — redundancy discount</Td>
              <Td mono>0–1</Td>
              <Td mono>uniquenessFromSimilarities</Td>
              <Td mono>Argument.uniquenessScore</Td>
              <Td><Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">Uniqueness</Link></Td>
            </tr>
            <tr>
              <Td>Impact — signed contribution of an edge</Td>
              <Td mono>&minus;100–100</Td>
              <Td mono>computeArgumentImpactScore</Td>
              <Td mono>Argument.impactScore</Td>
              <Td><Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">ReasonRank</Link></Td>
            </tr>
            <tr>
              <Td>Evidence Verification Score (EVS)</Td>
              <Td mono>&ge;0</Td>
              <Td mono>calculateEVS</Td>
              <Td mono>Evidence.evsScore</Td>
              <Td><Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">Evidence Scores</Link></Td>
            </tr>
            <tr>
              <Td>Evidence impact — a source&apos;s pull on its conclusion</Td>
              <Td mono>0–100</Td>
              <Td mono>computeEvidenceImpactScore</Td>
              <Td mono>Evidence.impactScore</Td>
              <Td><Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">Evidence Scores</Link></Td>
            </tr>
            <tr>
              <Td>Evidence Grounding — bottoms out in evidence?</Td>
              <Td mono>0–1</Td>
              <Td mono>computeGroundingScore</Td>
              <Td mono>Belief.groundingScore</Td>
              <Td><Link href="/beliefs?sort=grounding" className="text-blue-700 hover:underline">Live ranking</Link></Td>
            </tr>
            <tr>
              <Td>Confidence Stability — settled under scrutiny?</Td>
              <Td mono>0–1</Td>
              <Td mono>calculateConfidenceStabilityScore</Td>
              <Td mono>Belief.stabilityScore</Td>
              <Td><Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">ReasonRank</Link></Td>
            </tr>
            <tr>
              <Td>Claim Strength — burden of proof scaler</Td>
              <Td mono>0–1</Td>
              <Td mono>applyStrengthPenalty</Td>
              <Td mono>Belief.claimStrength</Td>
              <Td><Link href="/algorithms/strong-to-weak" className="text-blue-700 hover:underline">Strong to Weak</Link></Td>
            </tr>
            <tr>
              <Td>Similarity — same claim, different words</Td>
              <Td mono>0–1</Td>
              <Td mono>mechanicalSimilarity + community vote</Td>
              <Td mono>EquivalenceCandidate.similarity</Td>
              <Td><Link href="/algorithms/combine-similar-beliefs" className="text-blue-700 hover:underline">Combine Similar Beliefs</Link></Td>
            </tr>
            <tr>
              <Td>Caller credibility — vote weight from track record</Td>
              <Td mono>0.3–1.4</Td>
              <Td mono>callerCredibility (accuracy &times; side balance)</Td>
              <Td mono>FallacyClaimVote.weight</Td>
              <Td><Link href="/algorithms/fallacy-detection" className="text-blue-700 hover:underline">Fallacy Detection</Link></Td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Technical integration ────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Technical Integration</h2>

      <ul className="list-disc pl-6 mb-8 space-y-2">
        <li>
          <strong>Linkage propagation:</strong> scores flow through the whole graph. Truth and
          grounding update together, from the same trigger: link a new source and every
          ancestor rises; retract one and everything resting on it falls.
        </li>
        <li>
          <strong>Evidence grounding:</strong> the walk is recursive, attenuates with distance
          from the data, treats citation rings as groundless, and saturates — redundant
          sourcing cannot buy certainty. Grounding, not engagement, is the ranking input.
        </li>
        <li>
          <strong>
            <Link href="/algorithms/objective-criteria" className="text-blue-700 hover:underline">
              Objective criteria
            </Link>
            :
          </strong>{' '}
          measurable standards for evaluation, defined per category before the fight starts.
        </li>
        <li>
          <strong>
            <Link href="/algorithms/fallacy-detection" className="text-blue-700 hover:underline">
              Bias detection
            </Link>
            :
          </strong>{' '}
          contributor track records combine accuracy with side balance into a bounded, fully
          visible multiplier — it scales the weight of a contributor&apos;s evaluations, never
          the validity of an argument itself.
        </li>
      </ul>

      <p className="mb-8">
        See{' '}
        <Link href="/how-it-works" className="text-blue-700 hover:underline">
          How It Works
        </Link>{' '}
        for the engine end to end, or{' '}
        <Link href="/contact" className="text-blue-700 hover:underline">
          get involved
        </Link>
        .
      </p>
    </main>
  )
}
