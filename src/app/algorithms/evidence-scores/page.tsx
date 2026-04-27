import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Evidence Scores — Idea Stock Exchange',
  description:
    'The Evidence Verification Score (EVS) combines source independence, replication count, conclusion relevance, and replication consistency into a single per-evidence weight. Backed by the T1–T4 tier system.',
}

const tiers = [
  {
    tier: 'T1',
    weight: '1.00',
    color: '#16a34a',
    label: 'Peer-reviewed / Official',
    examples: 'Cochrane reviews, government statistical releases, registered clinical trials',
  },
  {
    tier: 'T2',
    weight: '0.75',
    color: '#65a30d',
    label: 'Expert / Institutional',
    examples: 'Investigative journalism, think-tank reports, working papers',
  },
  {
    tier: 'T3',
    weight: '0.50',
    color: '#ca8a04',
    label: 'Journalism / Surveys',
    examples: 'Standard news reporting, polling, industry surveys',
  },
  {
    tier: 'T4',
    weight: '0.25',
    color: '#dc2626',
    label: 'Opinion / Anecdote',
    examples: 'Op-eds, podcasts, blog posts, social-media threads',
  },
]

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>Evidence Scores</strong>
    </p>
  )
}

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-mono text-base my-4 rounded text-center">
      {children}
    </div>
  )
}

export default function EvidenceScoresPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Evidence Scores: How a Source Earns Its Weight
      </h1>

      <p className="mb-3 text-[1.05rem]">
        Not all evidence is equal. A peer-reviewed meta-analysis with five independent
        replications carries different epistemic weight from a confident tweet, and the system
        treats them accordingly. The Evidence Verification Score (EVS) is the single number
        that quantifies the difference, then feeds into{' '}
        <Link href="/algorithms/verification" className="text-blue-700 hover:underline">
          Verification
        </Link>{' '}
        and the recursive{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
          ReasonRank
        </Link>{' '}
        propagation.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Formula</h2>

      <FormulaBox>
        EVS = ESIW &times; log<sub>2</sub>(ERQ + 1) &times; ECRS &times; ERP
      </FormulaBox>

      <ul className="list-disc list-outside ml-6 mb-4 space-y-2">
        <li>
          <strong>ESIW</strong> &mdash; Evidence Source Independence Weight. Tier-based weight
          (T1 = 1.0, T4 = 0.25) reflecting the independence and methodological standards of the
          source.
        </li>
        <li>
          <strong>ERQ</strong> &mdash; Evidence Replication Quantity. Number of independent
          replications, including the original. The logarithmic shape means the second
          replication adds the most signal, the tenth far less.
        </li>
        <li>
          <strong>ECRS</strong> &mdash; Evidence&ndash;Conclusion Relevance Score. How directly
          the source&apos;s actual finding bears on the conclusion the page is making. A real
          study cited for a claim it does not make will see this term collapse.
        </li>
        <li>
          <strong>ERP</strong> &mdash; Evidence Replication Percentage. Among the replication
          attempts, what fraction reproduced the original result. A null replication record
          drops this term toward zero even when the original was high-tier.
        </li>
      </ul>

      <p className="mb-4 text-sm text-gray-600">
        All four terms are non-negative. EVS = 0 when any term is 0 &mdash; an irrelevant
        source, a non-replicating finding, an unsourced anecdote with no independence weight,
        or an evidence item with literally zero replications all collapse to zero contribution.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Tier System (ESIW)</h2>

      <div className="space-y-3 mb-6">
        {tiers.map((t) => (
          <div
            key={t.tier}
            className="border border-gray-200 rounded p-3"
            style={{ borderLeftWidth: 4, borderLeftColor: t.color }}
          >
            <div className="flex items-center gap-3 mb-1">
              <span
                className="font-bold text-sm px-2 py-0.5 rounded text-white"
                style={{ backgroundColor: t.color }}
              >
                {t.tier} &middot; {t.label}
              </span>
              <span className="text-sm font-mono text-gray-500">weight = {t.weight}</span>
            </div>
            <p className="text-sm text-gray-700">{t.examples}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-600 italic mb-6">
        Tiers track the institutional process behind the source &mdash; how much filtering,
        peer review, and editorial scrutiny shaped the published claim &mdash; not the
        political identity of the publisher. A right-leaning peer-reviewed study and a
        left-leaning peer-reviewed study sit in the same tier; a right-leaning op-ed and a
        left-leaning op-ed also sit in the same (much lower) tier.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Why Logarithmic Replication</h2>

      <p className="mb-3">
        Replication evidence has decisive returns at first and diminishing returns later.
        Going from one paper to two replications dramatically increases confidence; going
        from twenty replications to twenty-one barely registers. The shape{' '}
        <code className="bg-gray-100 px-1 rounded">log<sub>2</sub>(ERQ + 1)</code> matches that
        intuition exactly:
      </p>

      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2">Replications (ERQ)</th>
              <th className="border border-gray-300 px-3 py-2">log&#8322;(ERQ + 1)</th>
              <th className="border border-gray-300 px-3 py-2">Marginal gain</th>
            </tr>
          </thead>
          <tbody>
            {[
              { erq: 0, log: 0,    gain: '–' },
              { erq: 1, log: 1.00, gain: '+1.00' },
              { erq: 3, log: 2.00, gain: '+1.00' },
              { erq: 7, log: 3.00, gain: '+1.00' },
              { erq: 15, log: 4.00, gain: '+1.00' },
            ].map((r) => (
              <tr key={r.erq}>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono">{r.erq}</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                  {r.log.toFixed(2)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                  {r.gain}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        Each unit of marginal gain takes roughly twice as many replications to achieve as the
        last. The system rewards initial replication strongly; it does not reward stockpiling
        redundant ones.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Worked Example</h2>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="mb-2">
          <strong>Source:</strong> A peer-reviewed clinical trial (T1 &rarr; ESIW = 1.0)
        </p>
        <p className="mb-2">
          <strong>Replications:</strong> 4 independent (1 original + 3 replications &rarr; ERQ = 4)
        </p>
        <p className="mb-2">
          <strong>Replication consistency:</strong> 3 of 4 confirmed the result &rarr; ERP = 0.75
        </p>
        <p className="mb-2">
          <strong>Conclusion relevance:</strong> Source addresses the exact claim being made &rarr;
          ECRS = 0.90
        </p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto mt-3">
{`EVS = 1.0 × log2(4 + 1) × 0.90 × 0.75
    = 1.0 × 2.32 × 0.90 × 0.75
    ≈ 1.57`}
        </pre>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        Compare to a T4 opinion piece (ESIW = 0.25) cited for a tangential point (ECRS = 0.30)
        with no replications and no consistency record (ERQ = 0, ERP = 0):{' '}
        <code className="bg-gray-100 px-1 rounded">EVS = 0.25 × log2(1) × 0.30 × 0 = 0</code>.
        It contributes literally nothing to the verification calculation.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Developer Reference</h2>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Source</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`import { calculateEVS, getEvidenceTypeWeight } from '@/core/scoring'

const evs = calculateEVS({
  sourceIndependenceWeight: getEvidenceTypeWeight('T1'), // 1.0
  replicationQuantity: 4,
  conclusionRelevance: 0.90,
  replicationPercentage: 0.75,
})
// → ≈ 1.57`}
        </pre>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Implementation:{' '}
        <code className="bg-gray-100 px-1 rounded">
          src/core/scoring/scoring-engine.ts → calculateEVS
        </code>
        . Tier weights live in the same file in{' '}
        <code className="bg-gray-100 px-1 rounded">EVIDENCE_TYPE_WEIGHTS</code>.
      </p>

      <hr className="my-6 border-gray-300" />

      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/verification" className="text-blue-700 hover:underline">
              Verification
            </Link>{' '}
            &mdash; how EVS values are aggregated into the empirical truth score
          </li>
          <li>
            <Link href="/algorithms/media-genre-style" className="text-blue-700 hover:underline">
              Media Genre &amp; Style
            </Link>{' '}
            &mdash; the genre classifier that backs the T1&ndash;T4 tier assignment
          </li>
          <li>
            <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
              Linkage Scores
            </Link>{' '}
            &mdash; the relevance score that gates each evidence item&apos;s contribution
          </li>
          <li>
            <Link href="/algorithms" className="text-blue-700 hover:underline">
              Full Algorithms index
            </Link>
          </li>
        </ul>
      </div>
    </main>
  )
}
