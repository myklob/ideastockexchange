import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Candidate Evaluation Template — ISE',
  description:
    'How the Idea Stock Exchange evaluates political candidates using the same universal belief template applied to every claim on the platform.',
}

/* ─── small shared primitives ─────────────────────────────────────────────── */

function SectionAnchor({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
      {children}
    </h2>
  )
}

function ScorePill({
  value,
  label,
  color = 'blue',
}: {
  value: string
  label: string
  color?: 'blue' | 'green' | 'orange' | 'gray'
}) {
  const ring: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-300 text-blue-800',
    green: 'bg-green-50 border-green-300 text-green-800',
    orange: 'bg-orange-50 border-orange-300 text-orange-800',
    gray: 'bg-gray-50 border-gray-300 text-gray-700',
  }
  return (
    <span className={`inline-flex flex-col items-center border rounded px-3 py-1 text-xs font-mono ${ring[color]}`}>
      <span className="font-bold text-sm">{value}</span>
      <span className="text-[10px] uppercase tracking-wide">{label}</span>
    </span>
  )
}

/* ─── static example data ─────────────────────────────────────────────────── */

const CRITERIA = [
  {
    id: 1,
    criterion: 'Legislative track record & effectiveness',
    importance: 92,
    linkage: 95,
    type: 'Outcome',
  },
  {
    id: 2,
    criterion: 'Relevant policy domain expertise (economy, defense, environment)',
    importance: 88,
    linkage: 90,
    type: 'Competence',
  },
  {
    id: 3,
    criterion: 'Ethical conduct & conflict-of-interest disclosures',
    importance: 80,
    linkage: 85,
    type: 'Ethics',
  },
  {
    id: 4,
    criterion: 'Constituent service quality',
    importance: 74,
    linkage: 78,
    type: 'Service',
  },
  {
    id: 5,
    criterion: 'Public speaking & debate performance',
    importance: 42,
    linkage: 40,
    type: 'Style',
  },
  {
    id: 6,
    criterion: 'Personal lifestyle / tabloid coverage',
    importance: 18,
    linkage: 15,
    type: 'Personal',
  },
]

const ARGUMENTS = [
  {
    id: 'a1',
    side: 'pro' as const,
    statement: 'Sponsored three bipartisan bills that passed into law',
    argScore: +78,
    linkage: 95,
    linkageType: 'Strong Causal',
    impact: +74.1,
  },
  {
    id: 'a2',
    side: 'pro' as const,
    statement: 'Ranked in the top-10% of senators for constituent casework resolution',
    argScore: +65,
    linkage: 78,
    linkageType: 'Strong Causal',
    impact: +50.7,
  },
  {
    id: 'a3',
    side: 'con' as const,
    statement: 'Missed 22% of floor votes in the last session',
    argScore: -55,
    linkage: 88,
    linkageType: 'Strong Causal',
    impact: -48.4,
  },
  {
    id: 'a4',
    side: 'con' as const,
    statement: 'Tabloid reported affair with a staffer',
    argScore: -40,
    linkage: 15,
    linkageType: 'Anecdotal',
    impact: -6.0,
  },
]

/* ─── page ────────────────────────────────────────────────────────────────── */

export default function CandidateEvaluationPage() {
  const proArgs = ARGUMENTS.filter(a => a.side === 'pro')
  const conArgs = ARGUMENTS.filter(a => a.side === 'con')
  const totalPro = proArgs.reduce((s, a) => s + a.impact, 0)
  const totalCon = conArgs.reduce((s, a) => s + a.impact, 0)

  return (
    <div className="min-h-screen bg-white">
      {/* ── nav ─────────────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-2 text-sm">
          <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <Link href="/topics" className="text-[var(--accent)] hover:underline">Topics</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <Link href="/topics" className="text-[var(--accent)] hover:underline">Elections</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-[var(--muted-foreground)] truncate max-w-[260px]">
            Candidate Evaluation Template
          </span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8 space-y-12">

        {/* ── hero ───────────────────────────────────────────────────────────── */}
        <header>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4 leading-tight">
            🏛️ Candidate Evaluation Template
          </h1>
          <p className="text-[var(--muted-foreground)] text-sm mb-6">
            Filed under:{' '}
            <Link href="/topics" className="text-[var(--accent)] hover:underline">
              Elections → United States → [State] → [Office]
            </Link>
          </p>

          {/* Jump-links */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm space-y-1">
            <p className="font-semibold text-[var(--foreground)] mb-2">On this page</p>
            <ul className="space-y-1 list-disc list-inside text-[var(--accent)]">
              <li><a href="#how-it-works" className="hover:underline">How Candidate Evaluation Works Inside the ISE</a></li>
              <li><a href="#criteria" className="hover:underline">Objective Criteria — Fixed Before the Campaign</a></li>
              <li><a href="#arguments" className="hover:underline">Arguments Are Scored — Not Curated</a></li>
              <li><a href="#reasonrank" className="hover:underline">ReasonRank: No Agenda, No Moderator Bias</a></li>
              <li><a href="#template" className="hover:underline">Worked Example: Jane Smith for Colorado Senate</a></li>
              <li><a href="#create" className="hover:underline">Create a Candidate Belief Page</a></li>
            </ul>
          </div>
        </header>

        <hr className="border-gray-200" />

        {/* ── how it works ───────────────────────────────────────────────────── */}
        <section id="how-it-works">
          <SectionAnchor id="how-it-works">
            <span>📋</span> How Candidate Evaluation Works Inside the ISE
          </SectionAnchor>

          {/* blue callout — matches ISEExampleSection style */}
          <div className="bg-[#f4f9ff] border-l-[5px] border-[#0055a4] rounded-r-md p-6 space-y-5">
            <p>
              A user creates a belief page:{' '}
              <em>&ldquo;Jane Smith is the most qualified candidate for U.S. Senate in Colorado.&rdquo;</em>{' '}
              It is filed at{' '}
              <code className="bg-white/70 px-1 py-0.5 rounded text-sm font-mono">
                Elections → United States → Colorado → Senate
              </code>{' '}
              and instantly inherits the same structural template every belief on the platform
              uses:{' '}
              <Link href="/Argument%20Trees" className="text-[var(--accent)] hover:underline">Argument Trees</Link>,{' '}
              <Link href="/Evidence%20Scoring" className="text-[var(--accent)] hover:underline">Evidence Scoring</Link>,{' '}
              <Link
                href="/w/page/159351732/Objective%20criteria%20scores"
                className="text-[var(--accent)] hover:underline"
              >
                Objective Criteria weighting
              </Link>,{' '}
              <Link
                href="/w/page/156187122/cost-benefit%20analysis"
                className="text-[var(--accent)] hover:underline"
              >
                Cost-Benefit Analysis
              </Link>, and{' '}
              <Link
                href="/w/page/156186840/automate%20conflict%20resolution"
                className="text-[var(--accent)] hover:underline"
              >
                Conflict Resolution mapping
              </Link>.
            </p>
            <p>
              No special configuration. No editorial setup. No custom rules for politicians.
              The architecture is identical whether evaluating a tax proposal, a scientific
              claim, or a Senate candidate.
            </p>
          </div>

          {/* inherited template blocks */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { emoji: '🌳', label: 'Argument Trees', href: '/Argument%20Trees' },
              { emoji: '🔬', label: 'Evidence Scoring', href: '/Evidence%20Scoring' },
              { emoji: '📏', label: 'Objective Criteria', href: '/w/page/159351732/Objective%20criteria%20scores' },
              { emoji: '⚖️', label: 'Cost-Benefit Analysis', href: '/w/page/156187122/cost-benefit%20analysis' },
              { emoji: '🤝', label: 'Conflict Resolution', href: '/w/page/156186840/automate%20conflict%20resolution' },
              { emoji: '📊', label: 'ReasonRank Scoring', href: '/ReasonRank' },
            ].map(({ emoji, label, href }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-[var(--foreground)]"
              >
                <span>{emoji}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* ── objective criteria ─────────────────────────────────────────────── */}
        <section id="criteria">
          <SectionAnchor id="criteria">
            <span>🎯</span> Objective Criteria — Fixed Before the Campaign
          </SectionAnchor>

          <p className="text-sm text-[var(--foreground)] mb-4 leading-relaxed">
            Before any candidate&apos;s belief page exists, the office node (e.g.,{' '}
            <em>Colorado → Senate</em>) already contains a scored, community-built set of{' '}
            <Link
              href="/w/page/159351732/Objective%20criteria%20scores"
              className="text-[var(--accent)] hover:underline"
            >
              Objective Criteria
            </Link>
            : which qualifications matter most for this office, which policy domains carry
            the highest{' '}
            <a
              href="https://myclob.pbworks.com/importance%20score"
              className="text-[var(--accent)] hover:underline"
            >
              Importance Scores
            </a>
            , and what measurable performance indicators distinguish effective officeholders
            from ineffective ones.
          </p>
          <p className="text-sm text-[var(--foreground)] mb-6 leading-relaxed">
            Every candidate inherits those criteria automatically. The goalposts are fixed
            before the campaign begins — and they are fixed equally. You cannot evaluate
            one candidate on policy while attacking another on personality. The scoring
            framework applies the same weights to every belief node in that election.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left font-semibold w-[45%]">Criterion</th>
                  <th className="px-3 py-2 text-center font-semibold w-[16%]">
                    <Link
                      href="https://myclob.pbworks.com/importance%20score"
                      className="text-[var(--accent)] hover:underline"
                    >
                      Importance
                    </Link>
                  </th>
                  <th className="px-3 py-2 text-center font-semibold w-[16%]">
                    <Link
                      href="/Linkage%20Scores"
                      className="text-[var(--accent)] hover:underline"
                    >
                      Linkage
                    </Link>
                  </th>
                  <th className="px-3 py-2 text-center font-semibold w-[13%]">Type</th>
                  <th className="px-3 py-2 text-center font-semibold w-[10%]">Weight</th>
                </tr>
              </thead>
              <tbody>
                {CRITERIA.map(c => {
                  const weight = ((c.importance / 100) * (c.linkage / 100) * 100).toFixed(0)
                  const isLow = c.importance < 50
                  return (
                    <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-2">{c.criterion}</td>
                      <td className="px-3 py-2 text-center font-mono">{c.importance}%</td>
                      <td className="px-3 py-2 text-center font-mono">{c.linkage}%</td>
                      <td className="px-3 py-2 text-center text-[var(--muted-foreground)]">{c.type}</td>
                      <td className={`px-3 py-2 text-center font-bold font-mono ${isLow ? 'text-orange-600' : 'text-green-700'}`}>
                        {weight}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 rounded-r p-4 text-sm">
            <strong>Key insight:</strong> Notice that &ldquo;Tabloid coverage / personal
            lifestyle&rdquo; carries a combined weight of ~3%, while &ldquo;Legislative
            track record&rdquo; carries ~87%. Manufactured scandal cannot override
            structural weight — no matter how viral the story.
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* ── arguments are scored ───────────────────────────────────────────── */}
        <section id="arguments">
          <SectionAnchor id="arguments">
            <span>🔍</span> Arguments Are Scored — Not Curated
          </SectionAnchor>

          <p className="text-sm text-[var(--foreground)] mb-4 leading-relaxed">
            When users submit arguments, each one is evaluated across three independent dimensions:
          </p>

          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            {[
              {
                label: 'Truth Score',
                href: 'https://myclob.pbworks.com/w/page/21960078/truth',
                description: 'Is the claim factually accurate and supported by linked evidence?',
                color: 'blue' as const,
              },
              {
                label: 'Linkage Score',
                href: 'https://myclob.pbworks.com/w/page/159338766/Linkage%20Scores',
                description: 'Does this argument actually connect to the question of qualification for this office?',
                color: 'green' as const,
              },
              {
                label: 'Importance Score',
                href: 'https://myclob.pbworks.com/importance%20score',
                description: 'How central is this criterion within the pre-defined evaluation framework?',
                color: 'orange' as const,
              },
            ].map(({ label, href, description, color }) => (
              <div
                key={label}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2"
              >
                <a
                  href={href}
                  className="font-semibold text-[var(--accent)] hover:underline text-sm"
                >
                  {label}
                </a>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{description}</p>
                <ScorePill value="0–100%" label={label} color={color} />
              </div>
            ))}
          </div>

          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            That third dimension neutralizes manufactured scandal. If a tabloid story is
            submitted as a reason to question a candidate&apos;s qualifications, the system
            does not suppress it — it simply weights it according to the importance the
            community assigned to personal conduct within the office-level criteria.{' '}
            <strong>Outrage cannot override structure. Visibility does not equal weight.</strong>
          </p>
        </section>

        <hr className="border-gray-200" />

        {/* ── reasonrank ─────────────────────────────────────────────────────── */}
        <section id="reasonrank">
          <SectionAnchor id="reasonrank">
            <span>⚡</span>{' '}
            <a
              href="https://myclob.pbworks.com/ReasonRank"
              className="text-[var(--accent)] hover:underline"
            >
              ReasonRank
            </a>
            : No Agenda. No Moderator Bias. No Exceptions.
          </SectionAnchor>

          <p className="text-sm text-[var(--foreground)] mb-4 leading-relaxed">
            ReasonRank does not know it is evaluating a politician. It applies the same
            recursive logic used everywhere else in the system: sub-arguments strengthen
            or weaken parent arguments, evidence adjusts Truth Scores, and weights
            propagate upward through the tree.
          </p>
          <p className="text-sm text-[var(--foreground)] mb-6 leading-relaxed">
            The output is not &ldquo;who dominated the debate stage.&rdquo; It is
            &ldquo;who scores highest under the criteria the public agreed upon before
            campaign noise began.&rdquo; The platform does not decide what matters. The
            scoring system does. And the scoring system treats every candidate — and
            every belief — the same.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
            <p className="font-semibold mb-2">ReasonRank recursion — simplified:</p>
            <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
              <li>Each argument has its own belief page with a Truth Score.</li>
              <li>Each argument also carries a Linkage Score to the parent belief.</li>
              <li>Impact = Truth Score × Linkage Score × Importance Weight.</li>
              <li>Sub-arguments adjust the Truth Score of their parent argument — recursively.</li>
              <li>
                The final{' '}
                <Link href="/Scoring" className="text-[var(--accent)] hover:underline">
                  Belief Score
                </Link>{' '}
                is the sum of all propagated impacts.
              </li>
            </ol>
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* ── worked example ─────────────────────────────────────────────────── */}
        <section id="template">
          <SectionAnchor id="template">
            <span>📄</span> Worked Example: Jane Smith for Colorado Senate
          </SectionAnchor>

          <p className="text-sm text-[var(--muted-foreground)] italic mb-6">
            Belief statement:{' '}
            <em>&ldquo;Jane Smith is the most qualified candidate for U.S. Senate in Colorado.&rdquo;</em>
            <br />
            Filed at:{' '}
            <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-xs">
              Elections → United States → Colorado → Senate
            </code>
          </p>

          {/* Meta box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 text-right space-y-1">
            <p className="text-sm">
              <strong>Topic:</strong> Elections → United States → Colorado → Senate
            </p>
            <p className="text-sm">
              Belief{' '}
              <Link
                href="/beliefs%20grouped%20and%20eventually%20sorted%20along%20the%20the%20positivity%20continuum"
                className="text-[var(--accent)] hover:underline"
              >
                Positivity
              </Link>{' '}
              Towards Topic: <strong>+72%</strong>
            </p>
            <p className="text-sm">
              <Link href="/algorithms/strong-to-weak" className="text-[var(--accent)] hover:underline">
                Claim Strength
              </Link>
              : <strong>Strong (80%)</strong> — &ldquo;most qualified&rdquo; is a broad assertion
            </p>
          </div>

          {/* Pro arguments */}
          <div className="mb-6 overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-green-50">
                  <th className="px-3 py-2 text-left w-[50%] font-semibold">
                    Top Scoring Reasons to Agree
                  </th>
                  <th className="px-3 py-2 text-center w-[14%] font-semibold">Arg Score</th>
                  <th className="px-3 py-2 text-center w-[18%] font-semibold">
                    <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">
                      Linkage
                    </Link>
                  </th>
                  <th className="px-3 py-2 text-center w-[10%] font-semibold">Impact</th>
                </tr>
              </thead>
              <tbody>
                {proArgs.map(arg => (
                  <tr key={arg.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-2">{arg.statement}</td>
                    <td className="px-3 py-2 text-center font-mono text-green-700">+{arg.argScore}</td>
                    <td className="px-3 py-2 text-center font-mono text-xs">
                      {arg.linkage}%{' '}
                      <span className="text-[var(--muted-foreground)]">({arg.linkageType})</span>
                    </td>
                    <td className="px-3 py-2 text-center font-bold font-mono text-green-700">
                      +{arg.impact.toFixed(1)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={3} className="px-3 py-2 text-right text-sm">Total Pro:</td>
                  <td className="px-3 py-2 text-center font-mono text-green-700">
                    +{totalPro.toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Con arguments */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-red-50">
                  <th className="px-3 py-2 text-left w-[50%] font-semibold">
                    Top Scoring Reasons to Disagree
                  </th>
                  <th className="px-3 py-2 text-center w-[14%] font-semibold">Arg Score</th>
                  <th className="px-3 py-2 text-center w-[18%] font-semibold">
                    <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">
                      Linkage
                    </Link>
                  </th>
                  <th className="px-3 py-2 text-center w-[10%] font-semibold">Impact</th>
                </tr>
              </thead>
              <tbody>
                {conArgs.map(arg => (
                  <tr key={arg.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-2">{arg.statement}</td>
                    <td className="px-3 py-2 text-center font-mono text-red-700">{arg.argScore}</td>
                    <td className="px-3 py-2 text-center font-mono text-xs">
                      {arg.linkage}%{' '}
                      <span className="text-[var(--muted-foreground)]">({arg.linkageType})</span>
                    </td>
                    <td className="px-3 py-2 text-center font-bold font-mono text-red-700">
                      {arg.impact.toFixed(1)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={3} className="px-3 py-2 text-right text-sm">Total Con:</td>
                  <td className="px-3 py-2 text-center font-mono text-red-700">
                    {totalCon.toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Scandal spotlight */}
          <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 rounded-r p-4 text-sm">
            <strong>Scandal spotlight:</strong> The tabloid story (row 4 in Con arguments)
            has an Arg Score of −40 — but because &ldquo;Personal lifestyle&rdquo; carries
            only 15% Linkage to the Senate qualification question, its Impact is just −6.0
            out of a possible −40. The story is not suppressed; it is simply weighted
            accurately. A high-impact legislative failure in the same con column would
            score −48.4 — eight times more influential on the final belief score.
          </div>

          {/* Overall score row */}
          <div className="mt-6 text-right space-y-1">
            <p className="text-lg font-bold">
              Score:{' '}
              <Link href="/Argument%20scores%20from%20sub-argument%20scores" className="text-[var(--accent)] hover:underline">
                {(totalPro + totalCon) >= 0 ? '+' : ''}
                {(totalPro + totalCon).toFixed(1)}
              </Link>{' '}
              <span className="text-sm font-normal text-[var(--muted-foreground)]">
                (based on argument scores)
              </span>
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Strength-adjusted score:{' '}
              <Link href="/algorithms/strong-to-weak" className="font-semibold text-[var(--accent)] hover:underline">
                {/* 80% claim strength → 0.75 * 0.8 = 0.6 burden factor → multiplier = 0.4 */}
                {((totalPro + totalCon) * 0.4).toFixed(1)}%
              </Link>{' '}
              <span className="text-xs">(applies 40% burden-of-proof factor for Strong claim)</span>
            </p>
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* ── full template sections ─────────────────────────────────────────── */}
        <section>
          <SectionAnchor id="full-template">
            <span>🗂️</span> All Sections Inherited by a Candidate Belief Page
          </SectionAnchor>
          <p className="text-sm text-[var(--foreground)] mb-4 leading-relaxed">
            Every candidate belief page automatically inherits all of the following sections
            from the universal belief template — no editorial configuration required:
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { emoji: '🌳', title: 'Argument Trees', desc: 'Recursive pro/con reasoning with Truth, Linkage, and Importance scoring.' },
              { emoji: '🔬', title: 'Evidence Scoring', desc: 'Linked studies, records, and sources rated by quality and reproducibility.' },
              { emoji: '📏', title: 'Objective Criteria', desc: 'Pre-defined, community-weighted qualifications for the office.' },
              { emoji: '⚖️', title: 'Core Values Conflict', desc: 'Maps the competing values each side is really optimizing for.' },
              { emoji: '🤝', title: 'Conflict Resolution', desc: 'Interests, assumptions, cost-benefit, impact, and compromise mapping.' },
              { emoji: '💸', title: 'Cost-Benefit Analysis', desc: 'Quantified costs and benefits of each candidacy claim.' },
              { emoji: '📅', title: 'Short vs Long-Term Impact', desc: 'Separates immediate from systemic consequences.' },
              { emoji: '🚧', title: 'Obstacles to Resolution', desc: 'Structural and motivational barriers to settling the question.' },
              { emoji: '🧠', title: 'Biases', desc: 'Cognitive and institutional biases that distort the evaluation.' },
              { emoji: '📚', title: 'Media Resources', desc: 'Curated books, articles, and videos sorted by positivity and magnitude.' },
              { emoji: '⚡', title: 'ReasonRank Score', desc: 'The final recursive score — propagated from all sub-arguments.' },
              { emoji: '🔗', title: 'Similar Beliefs', desc: 'Related candidate claims and analogous belief nodes across the platform.' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <p className="font-semibold text-sm text-[var(--foreground)] mb-1">
                  {emoji} {title}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* ── create a candidate page ────────────────────────────────────────── */}
        <section id="create">
          <SectionAnchor id="create">
            <span>📬</span> Create a Candidate Belief Page
          </SectionAnchor>
          <p className="text-sm text-[var(--foreground)] mb-4 leading-relaxed">
            Any user can create a belief page for any candidate. The platform does not vet
            candidacies; it evaluates the arguments. File the belief under the correct
            election node and the full template activates automatically — including the
            pre-existing Objective Criteria already weighted by the community for that
            office.
          </p>
          <ul className="list-disc list-inside text-sm space-y-2 text-[var(--foreground)]">
            <li>
              <strong>Step 1:</strong> Navigate to the correct election node (e.g.,{' '}
              <em>Elections → United States → Colorado → Senate</em>).
            </li>
            <li>
              <strong>Step 2:</strong> Click <em>&ldquo;Add a Belief&rdquo;</em> and write
              a clear, falsifiable statement: <em>&ldquo;[Name] is the most qualified
              candidate for [Office] in [Jurisdiction].&rdquo;</em>
            </li>
            <li>
              <strong>Step 3:</strong> Add arguments. Each argument is itself a belief page —
              link evidence, assign a Linkage Score, and let ReasonRank propagate the scores.
            </li>
            <li>
              <strong>Step 4:</strong> The community will debate, score, and weight every
              argument. The goalposts do not move. Neither do the rules.
            </li>
          </ul>

          <div className="mt-6 flex gap-4 flex-wrap">
            <Link
              href="/beliefs"
              className="inline-block bg-[#0055a4] text-white text-sm font-semibold px-4 py-2 rounded hover:bg-[#004080] transition-colors"
            >
              Browse Belief Pages →
            </Link>
            <a
              href="https://github.com/myklob/ideastockexchange"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-gray-300 text-sm font-semibold px-4 py-2 rounded hover:bg-gray-50 transition-colors"
            >
              GitHub — Technical Docs
            </a>
          </div>
        </section>

        {/* ── contribute ────────────────────────────────────────────────────── */}
        <section className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-sm">
          <p className="font-semibold text-[var(--foreground)] mb-2">📬 Contribute</p>
          <p className="text-[var(--muted-foreground)] mb-3">
            Help improve candidate Objective Criteria, strengthen argument scoring, or link
            new evidence.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/w/page/160433328/Contact%20Me"
              className="text-[var(--accent)] hover:underline"
            >
              Contact the maintainer
            </Link>
            <a
              href="https://github.com/myklob/ideastockexchange"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              GitHub repository
            </a>
            <Link href="/Argument%20Trees" className="text-[var(--accent)] hover:underline">
              How Argument Trees work
            </Link>
          </div>
        </section>

      </main>
    </div>
  )
}
