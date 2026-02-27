import Link from 'next/link'
import type { Metadata } from 'next'
import { StrengthBandLegend } from '@/components/StrengthSpectrumBar'
import { STRENGTH_BANDS, applyStrengthPenalty } from '@/core/scoring/claim-strength'

export const metadata: Metadata = {
  title: 'Strong-to-Weak Spectrum — Idea Stock Exchange',
  description:
    'How the Idea Stock Exchange separates valid concerns from extreme claims using the strong-to-weak spectrum — the second coordinate axis alongside positive-to-negative.',
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>Strong-to-Weak Spectrum</strong>
    </p>
  )
}

function CalloutBox({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`px-4 py-4 mb-5 rounded ${
      accent
        ? 'bg-[#fff0f0] border-l-4 border-red-600'
        : 'bg-[#f9f9f9] border-l-4 border-[#3366cc]'
    }`}>
      {children}
    </div>
  )
}

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-mono text-base my-4 rounded text-center">
      {children}
    </div>
  )
}

// ─── Strength table data ─────────────────────────────────────────────────────

const strengthRows = STRENGTH_BANDS.map((band) => ({
  band,
  example: {
    'Weak':     '"Immigration policy could be improved."',
    'Moderate': '"Current enforcement has documented, measurable failures."',
    'Strong':   '"Current levels are causing serious net harm to the country."',
    'Extreme':  '"Immigration is destroying the country and must be stopped entirely."',
  }[band.label] ?? '',
  sampleRawScore: 0.9,
}))

// ─── Transmission table data ─────────────────────────────────────────────────

const transmissionRows = [
  { strength: 0.2, label: 'Weak',     pct: '20%', factor: '85%', example: '0.90 → 0.77' },
  { strength: 0.5, label: 'Moderate', pct: '50%', factor: '63%', example: '0.90 → 0.56' },
  { strength: 0.8, label: 'Strong',   pct: '80%', factor: '40%', example: '0.90 → 0.36' },
  { strength: 1.0, label: 'Extreme',  pct: '100%', factor: '25%', example: '0.90 → 0.23' },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function StrongToWeakPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222]">
      <Breadcrumb />

      {/* ── Title ─────────────────────────────────────────────────── */}
      <h1 className="text-3xl font-bold mb-4 leading-tight">
        The Strong-to-Weak Spectrum: Separating Valid Concerns from Extreme Claims
      </h1>

      <CalloutBox>
        <p className="text-[1.05rem] mb-3">
          You can believe immigration policy needs reform without believing immigrants are
          destroying civilization. You can believe social media harms teenagers without believing
          it should be banned. You can believe a drug carries real risks without believing it is
          a government bioweapon.
        </p>
        <p className="text-[1.05rem]">
          In each case, the <strong>weak version</strong> of the concern is reasonable and
          well-supported by evidence. The <strong>extreme version</strong> requires proof that
          doesn&apos;t exist. The strong-to-weak spectrum separates them — and in doing so,
          rescues valid concerns from the company they&apos;ve been forced to keep.
        </p>
      </CalloutBox>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 1: The Problem ──────────────────────────────── */}
      <h2 className="text-2xl font-bold mt-6 mb-3">
        🚨 The Problem: Binary Systems Force an Impossible Choice
      </h2>

      <p className="mb-3">
        Here is how extremism hijacks legitimate debate, every time. A real concern exists — say,
        that government surveillance poses genuine risks in a democratic society. That concern is
        historically grounded, well-evidenced, and held by reasonable people across the political
        spectrum. Then someone makes the <em>strongest possible version</em> of that claim: the
        government is secretly controlled by a global cabal monitoring our every thought. Both
        positions are &ldquo;anti-surveillance.&rdquo; A binary system puts them in the same bucket.
      </p>

      <p className="mb-3">
        The moderate person now faces an impossible choice. Click &ldquo;agree&rdquo; and be
        associated with a conspiracy theory they find embarrassing. Click &ldquo;disagree&rdquo; and
        abandon a legitimate concern they actually hold. Neither option represents their view.
        The platform has either pushed them out of the debate or forced them to misrepresent
        themselves to participate in it.
      </p>

      <p className="mb-3">
        The damage runs in both directions. Extremists get to claim that everyone who agrees with
        the <em>weak</em> version of their concern also endorses the <em>strong</em> version — a
        form of manufactured consensus that binary systems make structurally inevitable. And critics
        of a position can dismiss the entire concern by pointing to its most indefensible
        formulation.
      </p>

      <p className="mb-4">
        The result is a society that <em>looks</em> far more polarized than it actually is. What
        appears to be a nation of extremists is largely a nation of moderates whose calibrated
        positions have nowhere to land.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 2: The Solution ──────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">
        ✅ The Solution: The Strength of Your Claim Must Match the Strength of Your Evidence
      </h2>

      <p className="mb-3">
        The strong-to-weak spectrum maps every belief on a topic by how much its specific phrasing
        demands from the evidence. A weak claim requires modest support to be defensible. A strong
        claim requires correspondingly stronger evidence — and if that evidence doesn&apos;t exist,
        the claim scores poorly regardless of how many people assert it. This is not a bias toward
        moderation. It is a bias toward proportionality.
      </p>

      <p className="mb-4">
        The ISE never deletes extreme claims. Instead, it subjects them to math. A claim that
        cannot produce the extraordinary evidence it requires sees its{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">ReasonRank</Link>{' '}
        fall accordingly, moving it to the bottom of the argument hierarchy while well-evidenced
        moderate versions rise to the top. Extremism isn&apos;t censored — it&apos;s defeated by
        the standard it can&apos;t meet.
      </p>

      {/* Strength table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-center w-[18%]">Claim Strength</th>
              <th className="border border-gray-300 px-3 py-2 text-left w-[37%]">Example (Immigration)</th>
              <th className="border border-gray-300 px-3 py-2 text-left w-[30%]">Evidence Required</th>
              <th className="border border-gray-300 px-3 py-2 text-center w-[15%]">Typical Score</th>
            </tr>
          </thead>
          <tbody>
            {strengthRows.map(({ band, example }) => (
              <tr key={band.value}>
                <td
                  className="border border-gray-300 px-3 py-3 text-center"
                  style={{ backgroundColor: band.hexColor }}
                >
                  <strong>{band.label} ({band.percentage})</strong>
                  <br />
                  <span className="text-xs">{band.descriptor}</span>
                </td>
                <td className="border border-gray-300 px-3 py-3">{example}</td>
                <td className="border border-gray-300 px-3 py-3 text-xs text-gray-600">
                  {band.evidenceRequired}
                </td>
                <td
                  className="border border-gray-300 px-3 py-3 text-center"
                  style={{ backgroundColor: band.hexColor }}
                >
                  <span className="font-semibold">
                    {(band.typicalScoreRange.min * 100).toFixed(0)}–
                    {(band.typicalScoreRange.max * 100).toFixed(0)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-500 italic mb-6">
        If overwhelming evidence for an extreme claim exists, it will score accordingly. But it
        has to earn it. The system does not assume extreme claims are false — it simply requires
        them to meet the evidentiary bar their own phrasing demands.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 3: Two Axes ──────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">🌡️ Two Axes, Not One</h2>

      <p className="mb-3">
        The strong-to-weak spectrum works alongside the{' '}
        <Link href="/algorithms/belief-equivalency" className="text-blue-700 hover:underline">
          positive-to-negative spectrum
        </Link>{' '}
        as a second coordinate axis. These are independent dimensions and must not be confused.
      </p>

      <div className="grid grid-cols-2 gap-0 border border-gray-300 rounded mb-5 overflow-hidden text-sm">
        <div className="bg-[#f0f7ff] px-4 py-4 border-r border-gray-300">
          <p className="font-bold mb-1">Positive ↔ Negative</p>
          <p className="italic text-xs text-gray-500 mb-2">What side are you on?</p>
          <p>Direction of the claim relative to the topic. Pro vs. con. Support vs. oppose.</p>
        </div>
        <div className="bg-[#fff7f0] px-4 py-4">
          <p className="font-bold mb-1">Strong ↔ Weak</p>
          <p className="italic text-xs text-gray-500 mb-2">How much are you claiming?</p>
          <p>
            Intensity of the claim. How much it asserts, and therefore how much evidence it
            requires to be defensible.
          </p>
        </div>
      </div>

      <p className="mb-4">
        &ldquo;Immigration policy needs improvement&rdquo; and &ldquo;immigration is destroying
        the country&rdquo; are both <em>negative</em> toward current immigration policy. They share
        a direction. But they sit at opposite ends of the strength axis, require completely different
        evidence, and belong on different rows of the topic page. Treating them as the same position
        is where binary systems go fatally wrong.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 4: The Mathematics ────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">The Mathematics: Burden-of-Proof Scaler</h2>

      <p className="mb-3">
        The system applies a <strong>burden-of-proof transmission factor</strong> that scales the
        raw evidence quality (ReasonRank score) by how much the claim&apos;s own phrasing demands.
      </p>

      <FormulaBox>
        Strength-Adjusted Score = Raw Score × (1.0 − 0.75 × Claim Strength)
      </FormulaBox>

      <p className="mb-4">
        The factor <code className="bg-gray-100 px-1 rounded">(1.0 − 0.75 × claimStrength)</code>{' '}
        is the &ldquo;burden of proof transmission rate&rdquo; — what fraction of the raw evidence
        strength survives the evidentiary bar set by the claim&apos;s own intensity. The stronger
        the claim, the less of the raw score reaches the final output:
      </p>

      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2">Strength Band</th>
              <th className="border border-gray-300 px-3 py-2">Claim Strength</th>
              <th className="border border-gray-300 px-3 py-2">Transmission Factor</th>
              <th className="border border-gray-300 px-3 py-2">
                If Raw Score = 0.90 → Adjusted
              </th>
            </tr>
          </thead>
          <tbody>
            {transmissionRows.map((row) => {
              const band = STRENGTH_BANDS.find(b => b.value === row.strength)!
              const adjusted = applyStrengthPenalty(0.90, row.strength)
              return (
                <tr key={row.strength}>
                  <td
                    className="border border-gray-300 px-3 py-2 font-semibold"
                    style={{ backgroundColor: band.hexColor }}
                  >
                    {row.label}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                    {row.pct}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                    {row.factor}
                  </td>
                  <td
                    className="border border-gray-300 px-3 py-2 text-center font-mono font-bold"
                    style={{ backgroundColor: band.hexColor }}
                  >
                    {(adjusted * 100).toFixed(0)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mb-4">
        An extreme claim must produce <strong>4× better raw evidence</strong> to match a weak
        claim&apos;s adjusted score. This is not a penalty for having a strong opinion — it is the
        mathematical expression of the principle that extraordinary claims require extraordinary evidence.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 5: Climate change example ─────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">What This Does for Real Debates</h2>

      <p className="mb-3">
        Climate change illustrates the pattern cleanly, and symmetrically. The weak claim —
        &ldquo;human activity is influencing the climate&rdquo; — is backed by an enormous body of
        evidence and scores near the top of its strength tier. The moderate claim — &ldquo;climate
        change poses serious economic and humanitarian risks this century&rdquo; — is well-supported,
        with some contested magnitude. The strong claim — &ldquo;climate change will end civilization
        within 50 years without immediate radical action&rdquo; — faces a much higher evidentiary
        bar and scores accordingly. And the extreme claims on both ends — &ldquo;climate change is
        entirely fabricated&rdquo; and &ldquo;we have already passed the point of no return&rdquo;
        — both face argument trees that collapse under scrutiny, and both score near zero.
      </p>

      <p className="mb-4">
        A person who accepts the weak and moderate claims but is skeptical of the strongest version
        now has a precise place to stand. They are not a climate denier for declining to endorse
        the catastrophist formulation. Their position is visible, scoreable, and fully separable
        from the denialist. That distinction is invisible in every system that organizes debate
        by side alone.
      </p>

      <CalloutBox accent>
        <p>
          <strong>The core function:</strong> The strong-to-weak spectrum rescues valid concerns
          from their most extreme formulations. It lets someone say &ldquo;I take this
          seriously&rdquo; without saying &ldquo;I endorse every claim ever made in the name of
          this concern.&rdquo; It makes moderation visible, measurable, and rewarded by the
          evidence — not just aspired to.
        </p>
      </CalloutBox>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 6: How it connects ───────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">How It Connects to the Rest of the System</h2>

      <h3 className="text-lg font-bold mt-4 mb-2">
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
          Linkage Scores
        </Link>
      </h3>
      <p className="mb-4">
        Evidence supporting a weak claim does not automatically support a stronger version of
        the same claim. A study showing social media correlates with increased anxiety in teenagers
        strongly supports &ldquo;social media has some mental health costs.&rdquo; It provides
        almost no linkage to &ldquo;social media is destroying an entire generation.&rdquo; The
        algorithm captures that distinction automatically — stretching evidence to support a
        stronger claim than it can bear is penalized, not rewarded.
      </p>

      <p className="mb-3 text-sm text-gray-600">
        Formally: the linkage transmission between evidence at strength <em>s₁</em> and a target
        claim at strength <em>s₂</em> is:
      </p>
      <FormulaBox>
        Strength Linkage = max(0, 1.0 − (s₂ − s₁) × 2.0)
      </FormulaBox>
      <p className="mb-4 text-sm text-gray-600">
        Evidence for a stronger claim carries fully to weaker versions. Evidence for a claim that
        is 0.5 strength below the target provides zero transmission.
      </p>

      <h3 className="text-lg font-bold mt-4 mb-2">
        <Link href="/algorithms/belief-equivalency" className="text-blue-700 hover:underline">
          Belief Equivalency Scores
        </Link>
      </h3>
      <p className="mb-4">
        Both axes serve as a coordinate system to detect when two differently-worded beliefs are
        making the same underlying claim. Two beliefs at very different strength levels — even if
        pointing in the same direction — are distinct claims requiring separate analysis. The system
        won&apos;t merge &ldquo;policy X needs improvement&rdquo; with &ldquo;policy X is tyranny&rdquo;
        just because both are critical of policy X.
      </p>

      <h3 className="text-lg font-bold mt-4 mb-2">
        <Link href="/beliefs" className="text-blue-700 hover:underline">
          One Page Per Belief
        </Link>
      </h3>
      <p className="mb-4">
        Each position on the strength spectrum gets its own full analysis — its own argument tree,
        its own evidence evaluation, its own truth score — rather than being lumped together with
        stronger or weaker versions of the same concern. The strength field on each belief page
        shows exactly where it sits on the spectrum, what evidence it requires, and how the
        burden-of-proof scaler has adjusted its raw score.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 7: Spectrum legend ──────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Strength Band Reference</h2>

      <StrengthBandLegend />

      <div className="mt-4 space-y-3">
        {STRENGTH_BANDS.map((band) => (
          <div
            key={band.value}
            className="border border-gray-200 rounded p-3"
            style={{ borderLeftWidth: 4, borderLeftColor: band.hexColor }}
          >
            <div className="flex items-center gap-3 mb-1">
              <span
                className="font-bold text-sm px-2 py-0.5 rounded"
                style={{ backgroundColor: band.hexColor }}
              >
                {band.label} ({band.percentage})
              </span>
              <span className="text-sm text-gray-500">{band.descriptor}</span>
              <span className="ml-auto text-xs text-gray-500 font-mono">
                Typical: {(band.typicalScoreRange.min * 100).toFixed(0)}–
                {(band.typicalScoreRange.max * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-sm text-gray-600">{band.evidenceRequired}</p>
          </div>
        ))}
      </div>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 8: Developer API ─────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Developer Reference</h2>

      <p className="mb-3 text-gray-600 text-sm italic">
        The following describes the data model and algorithm for developers building on this system.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Database field</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
          {`model Belief {
  // ...
  claimStrength Float @default(0.5)
  // 0.2 = Weak, 0.5 = Moderate, 0.8 = Strong, 1.0 = Extreme
}`}
        </pre>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Core scoring function</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
          {`import { applyStrengthPenalty } from '@/core/scoring/claim-strength'

// Apply burden-of-proof scaler
const adjustedScore = applyStrengthPenalty(rawScore, claimStrength)
// Formula: rawScore × (1.0 − 0.75 × claimStrength)`}
        </pre>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm">
        <p className="font-bold mb-2">Linkage strength transmission</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
          {`import { strengthLinkageTransmission } from '@/core/scoring/claim-strength'

// Does evidence for a weak claim (s=0.2) support a strong claim (s=0.8)?
const linkage = strengthLinkageTransmission(0.2, 0.8)
// → 0.2 (only 20% transmission — the evidence is not calibrated for this strength)`}
        </pre>
      </div>

      <hr className="my-6 border-gray-300" />

      {/* ── Related pages ────────────────────────────────────────── */}
      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
              Linkage Scores
            </Link>{' '}
            — why evidence that supports a weak claim may not support a strong one
          </li>
          <li>
            <Link href="/algorithms/belief-equivalency" className="text-blue-700 hover:underline">
              Belief Equivalency Scores
            </Link>{' '}
            — how both spectrums combine to detect synonymous claims
          </li>
          <li>
            <Link href="/beliefs" className="text-blue-700 hover:underline">
              Belief Pages
            </Link>{' '}
            — each strength level gets its own full analysis
          </li>
          <li>
            <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
              ReasonRank Algorithm
            </Link>{' '}
            — the scoring system that rewards proportionality
          </li>
          <li>
            <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
              Argument Scores from Sub-Argument Scores
            </Link>{' '}
            — how extreme claims earn their scores the hard way
          </li>
        </ul>
      </div>
    </main>
  )
}
