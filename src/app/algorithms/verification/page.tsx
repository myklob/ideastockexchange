import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verification — Idea Stock Exchange',
  description:
    'Verification is the empirical half of the Truth Score. It weighs each piece of evidence by its EVS score and linkage to the belief, then takes the supporting share of total weight as the verification score.',
}

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>Verification</strong>
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

const exampleEvidence = [
  { side: 'supporting', tier: 'T1', evs: 0.92, linkage: 0.85, label: 'Cochrane systematic review' },
  { side: 'supporting', tier: 'T2', evs: 0.65, linkage: 0.70, label: 'Reuters investigative report' },
  { side: 'weakening',  tier: 'T2', evs: 0.60, linkage: 0.80, label: 'Conflicting cohort study' },
  { side: 'supporting', tier: 'T3', evs: 0.30, linkage: 0.55, label: 'Industry survey' },
  { side: 'weakening',  tier: 'T4', evs: 0.10, linkage: 0.45, label: 'Anonymous blog post' },
]

export default function VerificationPage() {
  const supportingWeight = exampleEvidence
    .filter(e => e.side === 'supporting')
    .reduce((s, e) => s + e.evs * e.linkage, 0)
  const weakeningWeight = exampleEvidence
    .filter(e => e.side === 'weakening')
    .reduce((s, e) => s + e.evs * e.linkage, 0)
  const total = supportingWeight + weakeningWeight
  const vts = total > 0 ? supportingWeight / total : 0.5

  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Verification: Do the Underlying Facts Check Out?
      </h1>

      <p className="mb-3 text-[1.05rem]">
        Verification is the empirical half of the{' '}
        <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">
          Truth Score
        </Link>
        . Where{' '}
        <Link href="/algorithms/logical-validity" className="text-blue-700 hover:underline">
          Logical Validity
        </Link>{' '}
        asks &ldquo;does the inference hold?&rdquo;, Verification asks the orthogonal question:
        &ldquo;granting the inference, do the underlying facts actually exist?&rdquo;
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Formula</h2>

      <FormulaBox>
        VTS = supportingWeight / (supportingWeight + weakeningWeight)
      </FormulaBox>

      <p className="mb-3">where each evidence item&apos;s contribution is</p>

      <FormulaBox>
        weight<sub>i</sub> = EVS<sub>i</sub> &times; linkageScore<sub>i</sub>
      </FormulaBox>

      <p className="mb-4">
        High-tier sources whose claim is tightly connected to the belief contribute much more
        than low-tier sources or loosely-connected ones. The output is the share of total weight
        on the supporting side &mdash; the natural &ldquo;how much of the evidence base says this
        is true?&rdquo; question, expressed as a number between 0 and 1.
      </p>

      <p className="mb-4 text-sm text-gray-600">
        With no evidence at all, Verification falls back to 0.5 &mdash; the system does not
        award confidence to a claim no one has bothered to evidence. The score is clamped to
        [0.01, 0.99] before display, mirroring the Truth Score&apos;s rejection of literal
        certainty.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">What Drives the Weight</h2>

      <p className="mb-3">
        Two factors decide how much each evidence item counts:
      </p>

      <ul className="list-disc list-outside ml-6 mb-4 space-y-2">
        <li>
          <strong>EVS (Evidence Verification Score).</strong> A composite of source independence,
          replication count, conclusion relevance, and replication consistency. See{' '}
          <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
            Evidence Scores
          </Link>{' '}
          for the full formula and the T1&ndash;T4 tiers.
        </li>
        <li>
          <strong>Linkage Score.</strong> How tightly this evidence&apos;s specific claim maps to
          the belief in question. A landmark study cited for a claim it does not actually make
          earns a high EVS but a low linkage, and the product collapses. See{' '}
          <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
            Linkage Scores
          </Link>
          .
        </li>
      </ul>

      <p className="mb-4">
        The product structure means an item must clear both bars to count. Excellent sources
        cited for the wrong claim do not contribute. Weakly-sourced items that <em>do</em> bear
        directly on the belief contribute proportionally to their tier.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Worked Example</h2>

      <p className="mb-3">
        Five evidence items on a hypothetical belief. The first three count toward
        verification, the last two reduce it.
      </p>

      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Item</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Tier</th>
              <th className="border border-gray-300 px-3 py-2 text-center">EVS</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Linkage</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Side</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Weight</th>
            </tr>
          </thead>
          <tbody>
            {exampleEvidence.map((row) => (
              <tr key={row.label}>
                <td className="border border-gray-300 px-3 py-2">{row.label}</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono">{row.tier}</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                  {row.evs.toFixed(2)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                  {row.linkage.toFixed(2)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">{row.side}</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                  {(row.evs * row.linkage).toFixed(3)}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold">
              <td className="border border-gray-300 px-3 py-2" colSpan={5}>
                Supporting weight: {supportingWeight.toFixed(3)} &nbsp;·&nbsp; Weakening weight:{' '}
                {weakeningWeight.toFixed(3)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                VTS = {(vts * 100).toFixed(0)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-600 italic mb-4">
        Note that the single T1 supporting source dominates the calculation. One Cochrane review
        carries roughly the same weight as a stack of T3 surveys. This is intentional &mdash;
        replication and methodology asymmetries are not just style preferences, they are the
        whole point of tiering.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">What This Catches That Logical Validity Misses</h2>

      <p className="mb-4">
        An argument can be syllogistically perfect from a false premise. &ldquo;If the climate
        has stopped warming, then policy X is unjustified. The climate has stopped warming.
        Therefore policy X is unjustified.&rdquo; The form is valid; the second premise is
        contradicted by every credible measurement record. Logical Validity has nothing to flag,
        because nothing is structurally wrong. Verification is what catches this case &mdash;
        the supporting evidence for the second premise is non-existent or low-tier, while the
        weakening evidence is overwhelming, and VTS collapses accordingly.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Developer Reference</h2>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Source</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`// src/core/scoring/all-scores.ts → calculateTruthScoreBreakdown()
let supportingWeight = 0
let weakeningWeight = 0
for (const ev of evidence) {
  const weight = ev.evsScore > 0 ? ev.evsScore : 0.1
  const contribution = weight * ev.linkageScore
  if (ev.side === 'supporting') supportingWeight += contribution
  else weakeningWeight += contribution
}
const totalEvidenceWeight = supportingWeight + weakeningWeight
const verificationTruthScore = totalEvidenceWeight > 0
  ? Math.max(0.01, Math.min(0.99, supportingWeight / totalEvidenceWeight))
  : 0.5`}
        </pre>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Items with EVS = 0 are floored to 0.1 so a missing-but-cited source still contributes
        a faint signal &mdash; without that floor, an unscored source would silently disappear
        from the page&apos;s arithmetic.
      </p>

      <hr className="my-6 border-gray-300" />

      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">
              Truth Scores
            </Link>{' '}
            &mdash; how Verification composes with Logical Validity
          </li>
          <li>
            <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
              Evidence Scores
            </Link>{' '}
            &mdash; the EVS formula that drives each item&apos;s weight
          </li>
          <li>
            <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
              Linkage Scores
            </Link>{' '}
            &mdash; the relevance gate that gates each item&apos;s contribution
          </li>
          <li>
            <Link href="/algorithms/media-truth" className="text-blue-700 hover:underline">
              Media Truth
            </Link>{' '}
            &mdash; flags sources whose framing is biased even when facts are accurate
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
