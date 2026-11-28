import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Evidence Scores — Idea Stock Exchange',
  description:
    'How the Evidence Verification Score (EVS) weighs source tier, replication, and relevance — and why evidence is not an argument.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms</Link>
      {' > '}
      <strong>Evidence Scores</strong>
    </p>
  )
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'

export default function EvidenceScoresPage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">Evidence Scores (EVS)</h1>
      <p className="text-lg text-gray-600 mb-6">
        Evidence is data that can fail empirically. A reason that can only fail logically is an
        argument and belongs in the tree — evidence anchors the tree to the world.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The inputs</h2>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={TH}>Input</th>
              <th className={TH}>What it measures</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}>Source tier weight</td>
              <td className={TD}>
                T1 peer-reviewed/official &gt; T2 expert/institutional &gt; T3 journalism/surveys
                &gt; T4 opinion/anecdote. A submitter&apos;s tier is a <em>claim</em>, recorded as
                such until verified — the two are displayed separately.
              </td>
            </tr>
            <tr>
              <td className={TD}>Replication quantity &amp; percentage</td>
              <td className={TD}>
                How many independent attempts exist and what share of them reproduced the finding.
                One dramatic study is weaker than three boring confirmations.
              </td>
            </tr>
            <tr>
              <td className={TD}>Conclusion relevance</td>
              <td className={TD}>
                Whether the data actually bears on this belief — the evidence-side twin of the{' '}
                <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
                  linkage score
                </Link>
                . A rock-solid finding about the wrong question scores near zero here.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mb-4">
        These combine into a per-item EVS in [0, 1]. On the belief page, the evidence dimension
        is the supporting share of total EVS weight: supporting &divide; (supporting +
        weakening).
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Falsified evidence collapses what rests on it</h2>
      <p className="mb-4">
        The reasoning graph is a dependency graph, not a citation graph. In a citation graph,
        removing a source leaves the citing page standing; here, evidence that fails —
        retracted, falsified, misread — should pull the score of every argument anchored to it
        down with it, and propagation carries that collapse upward through every conclusion
        that depended on the branch.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Standing: what is counted, and at what weight</h2>
      <p className="mb-4">
        Filing a source is not the same as establishing it, so every evidence row carries a
        standing, and the standing decides how much of the row&apos;s impact the engine counts:
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm my-4">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left w-[18%]">Standing</th>
              <th className="border border-gray-300 px-3 py-2 text-left w-[14%]">Counts at</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Verified</td>
              <td className="border border-gray-300 px-3 py-2">100%</td>
              <td className="border border-gray-300 px-3 py-2">Checked and standing.</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Unverified</td>
              <td className="border border-gray-300 px-3 py-2">50%</td>
              <td className="border border-gray-300 px-3 py-2">
                Filed but unchecked. New rows are born here and earn the rest.
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Disputed</td>
              <td className="border border-gray-300 px-3 py-2">50%</td>
              <td className="border border-gray-300 px-3 py-2">
                Contested on the record while the dispute is open.
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Falsified</td>
              <td className="border border-gray-300 px-3 py-2">0%</td>
              <td className="border border-gray-300 px-3 py-2">
                Retracted or refuted, and the collapse above has already propagated.
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Unrecorded</td>
              <td className="border border-gray-300 px-3 py-2">100%</td>
              <td className="border border-gray-300 px-3 py-2">
                No standing on the row at all — rows that predate the lifecycle. Counted in full,
                which is why they carry the largest exposure below.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-2">Retraction exposure</h2>
      <p className="mb-4">
        Standing per row answers &ldquo;is this one checked?&rdquo; Exposure answers the question a
        reader actually has: <em>how much of this belief&apos;s score is not yet earned?</em> Each
        belief page reports it under the Evidence Ledger — the points drawn from evidence that
        rest on standing nobody has established, measured as the distance from where a row counts
        today to the furthest it could move on standing alone.
      </p>
      <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-mono my-4 rounded">
        exposure(row) = |impact| &times; (how far its weight could still move)
      </div>
      <p className="mb-4">
        An unverified row counted at half its impact can fall to zero or rise to full, so half of
        it is exposed either way. A row with no standing on record is counted in full and could
        fall to nothing, so all of it is exposed — the largest kind. Verified and falsified rows
        are settled and expose nothing. Exposure is a magnitude, not a direction: verifying an
        unverified supporting study <em>raises</em> the score it sits under. Above half the
        evidence-derived score, the page says plainly that the verdict should be read as
        provisional.
      </p>
      <p className="mb-4">
        It is the evidence-side complement to{' '}
        <Link href="/algorithms/decision-leverage" className="text-blue-700 hover:underline">
          Decision Leverage
        </Link>
        : leverage ranks the arguments worth settling, exposure measures the evidence worth
        verifying. Neither is a judgment about whether the evidence is any good — that is what
        tier, replication and relevance above are for.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Provenance is mandatory</h2>
      <p className="mb-4">
        Evidence enters with a source URL, DOI, PMID, or ISBN — no orphan claims. Agent-submitted
        evidence carries a full audit trail (who retrieved it, when, with what rationale),
        displayed in the argument&apos;s &ldquo;show the work&rdquo; trace. Provenance is display
        and audit only; it never feeds a score directly.
      </p>

      <p className="mb-4">
        One gap the arithmetic deliberately leaves open: an agent-submitted row whose claimed tier
        has not been confirmed by the provenance job is being weighted by a tier nobody checked.
        How much its weight would change is unknown until someone checks, so the page reports the
        gap and invents no number for it.
      </p>

      <p className="mt-8 text-sm text-gray-600">
        Related: <Link href="/algorithms/decision-leverage" className="text-blue-700 hover:underline">Decision Leverage</Link> ·{' '}
        <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">Truth Scores</Link> ·{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">Linkage Scores</Link> ·{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">ReasonRank</Link>
      </p>
    </div>
  )
}
