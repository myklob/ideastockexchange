import Link from 'next/link'
import type { Metadata } from 'next'
import EquivalencyCalculator from './EquivalencyCalculator'

export const metadata: Metadata = {
  title: 'Belief Equivalency Scores — Idea Stock Exchange',
  description:
    'How the Idea Stock Exchange determines whether two differently-worded beliefs are making the same underlying claim — the anti-fragmentation mechanism.',
}

// ─── Sub-components ────────────────────────────────────────────────────────

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>Belief Equivalency Scores</strong>
    </p>
  )
}

function CalloutBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f9f9f9] border border-gray-300 px-4 py-4 mb-5 rounded">
      {children}
    </div>
  )
}

function SideCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-3 my-5 rounded-r">
      {children}
    </div>
  )
}

function MetaDebateBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f9f9f9] border border-gray-300 px-4 py-4 my-5 rounded">
      {children}
    </div>
  )
}

// ─── Equivalency band table data ────────────────────────────────────────────

const bands = [
  {
    score: '~100%',
    meaning:
      'Identical claims in different words. Merge into one page; the better-argued version becomes canonical.',
    rowClass: 'bg-emerald-50',
  },
  {
    score: '~70–90%',
    meaning:
      'Substantially overlapping but with a meaningful difference in scope or specificity. Link the pages; keep them separate but cross-reference their arguments.',
    rowClass: '',
  },
  {
    score: '~40–70%',
    meaning:
      'Same topic, different claim. Show as related beliefs on the spectrum — weaker or stronger versions of each other.',
    rowClass: '',
  },
  {
    score: 'Below ~40%',
    meaning: 'Different beliefs. Separate pages. No merging.',
    rowClass: 'bg-gray-50',
  },
]

// ─── Page ──────────────────────────────────────────────────────────────────

export default function BeliefEquivalencyPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222]">
      <Breadcrumb />

      {/* ── Title ─────────────────────────────────────────────── */}
      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Belief Equivalency Scores: Are These Two Beliefs Actually Saying the Same Thing?
      </h1>

      <CalloutBox>
        <p className="text-[1.05rem]">
          &ldquo;We should ban assault weapons.&rdquo; &ldquo;We should prohibit military-style
          rifles.&rdquo; &ldquo;We need to restrict access to high-capacity firearms.&rdquo; Are
          those three beliefs the same? Nearly the same? Meaningfully different? The answer
          determines whether they get one debate page or three — and whether the arguments and
          evidence accumulated under each of them combine or fragment. Belief Equivalency Scores
          exist to answer that question systematically.
        </p>
      </CalloutBox>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 1: Core Technique ─────────────────────────── */}
      <h2 className="text-2xl font-bold mt-6 mb-3">The Core Technique: Strip It Down</h2>

      <p className="mb-3">
        The most reliable way to test whether two beliefs are saying the same thing is to reduce
        each one to its bare logical skeleton. Two operations do most of the work.
      </p>

      <p className="mb-3">
        <strong>Remove filler words.</strong> Natural language is full of words that add tone,
        emphasis, or rhetorical color without changing the underlying claim. &ldquo;We really need
        to seriously consider whether we should perhaps ban assault weapons&rdquo; and &ldquo;ban
        assault weapons&rdquo; are making the same claim. Once the hedges, intensifiers, and
        political softening are stripped away, the logical content becomes visible.
      </p>

      <p className="mb-4">
        <strong>Replace synonyms with canonical terms.</strong> &ldquo;Prohibit,&rdquo;
        &ldquo;ban,&rdquo; &ldquo;restrict access to,&rdquo; and &ldquo;make illegal&rdquo; all
        point toward the same policy action at varying degrees of specificity.
        &ldquo;Military-style rifles,&rdquo; &ldquo;assault weapons,&rdquo; and &ldquo;high-capacity
        firearms&rdquo; overlap substantially while not being identical. The system substitutes a
        shared canonical term for each synonym cluster, then compares the resulting stripped-down
        versions. If two beliefs produce the same skeleton after both operations, their Equivalency
        Score approaches 100% and they get linked to the same canonical page.
      </p>

      <p className="mb-3">The process produces a spectrum rather than a binary:</p>

      {/* Equivalency band table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left w-[28%]">
                Equivalency Score
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">What it means</th>
            </tr>
          </thead>
          <tbody>
            {bands.map((b) => (
              <tr key={b.score} className={`border-b border-gray-200 ${b.rowClass}`}>
                <td className="border border-gray-300 px-4 py-3 font-bold font-mono">{b.score}</td>
                <td className="border border-gray-300 px-4 py-3">{b.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Live Calculator ───────────────────────────────────── */}
      <EquivalencyCalculator />

      <hr className="my-6 border-gray-300" />

      {/* ── Section 2: Anti-fragmentation ─────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">
        Why This Matters: Equivalency Is the Anti-Fragmentation Mechanism
      </h2>

      <p className="mb-3">
        Linguistic fragmentation is how the same debate gets run a thousand times in parallel. Every
        time someone phrases a familiar belief slightly differently and posts it as if it&apos;s a
        new contribution, the platform has to decide: is this a new idea worth its own page, or is
        it the same idea in a new outfit? Without Belief Equivalency Scores, there&apos;s no
        principled answer. The result is an ever-expanding list of nearly-identical belief pages,
        each with thin analysis, none accumulating the depth that a single well-maintained page
        would develop.
      </p>

      <p className="mb-4">
        With equivalency scoring, a user who searches for any variant of a claim gets routed to the
        canonical page where the full accumulated argument tree lives. Their new contribution gets
        added to that tree rather than starting a fresh empty thread. The platform gets stronger
        with each new participant instead of more fragmented.
      </p>

      <SideCallout>
        <p className="text-sm">
          <strong>How the algorithm works internally:</strong> Each belief statement is normalized
          through a four-step pipeline — lowercase + strip punctuation, tokenize, remove stopwords,
          then canonicalize synonyms (e.g. &ldquo;prohibit&rdquo; → &ldquo;ban&rdquo;,
          &ldquo;reduce&rdquo; → &ldquo;decrease&rdquo;). The resulting token sets are compared
          using Jaccard similarity: |A ∩ B| / |A ∪ B|. When a pre-computed semantic embedding
          score is also available, the final score blends both layers:{' '}
          <code className="bg-gray-100 px-1 rounded">
            score = 0.4 × mechanical + 0.6 × semantic
          </code>
          .
        </p>
      </SideCallout>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 3: Meta-debate ─────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">
        But Are They Actually Equivalent? (The Meta-Debate)
      </h2>

      <p className="mb-3">
        Here&apos;s where it gets genuinely interesting, and where the ISE takes the question more
        seriously than most platforms would bother to.
      </p>

      <p className="mb-3">
        Whether two beliefs are truly equivalent is itself a debatable claim. Philosophy departments
        have spent centuries on questions like this. Are &ldquo;assault weapons&rdquo; and
        &ldquo;military-style rifles&rdquo; the same category? A gun policy expert might argue
        they&apos;re meaningfully distinct legal terms with different regulatory histories. A
        linguist might point out that &ldquo;prohibit&rdquo; implies a harder legal bar than
        &ldquo;restrict access to.&rdquo; An ordinary user might reasonably feel that treating the
        two beliefs as equivalent distorts their position.
      </p>

      <p className="mb-4">
        The ISE doesn&apos;t resolve these disputes by algorithm alone. Every proposed equivalency
        link is itself a belief that can be challenged. Users can post reasons to agree or disagree
        with the equivalency claim — and those arguments get scored the same way everything else
        does. The equivalency score is not a declaration. It&apos;s a hypothesis that survives or
        fails under scrutiny.
      </p>

      <p className="mb-4">
        This creates a space for the kind of careful conceptual analysis that philosophy and
        linguistics bring — the precise unpacking of whether two statements really do mean the same
        thing, and under what conditions. Most people won&apos;t go there, and they don&apos;t have
        to. But the platform needs to have that space, because the quality of the merging decisions
        directly affects the quality of the argument trees that everyone else relies on. Getting the
        equivalency calls right matters.
      </p>

      <MetaDebateBox>
        <p className="font-bold mb-3">Example meta-debate:</p>

        <p className="mb-2">
          <strong>Proposed equivalency:</strong> &ldquo;We should ban assault weapons&rdquo; ≈
          &ldquo;We should prohibit military-style rifles&rdquo; (Score: 85%)
        </p>

        <p className="mb-2">
          <strong className="text-green-700">Reason to agree with the equivalency:</strong> Both
          claims advocate a legal prohibition on the same class of firearms. The different
          terminology reflects political framing, not a substantive policy difference.
        </p>

        <p className="mb-0">
          <strong className="text-red-700">Reason to disagree with the equivalency:</strong>{' '}
          &ldquo;Assault weapon&rdquo; is a defined legal category under the 1994 Federal Assault
          Weapons Ban with specific features (pistol grip, detachable magazine, etc.).
          &ldquo;Military-style rifle&rdquo; is an informal term with no legal definition. Merging
          them conflates a precise legal claim with a vague rhetorical one.
        </p>
      </MetaDebateBox>

      <p className="mb-4">
        That is a real, substantive dispute about meaning — and it has practical consequences for
        which evidence counts as relevant. The ISE is one of the few places it can be resolved
        through argument rather than editorial fiat.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 4: How It Connects ────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">How It Connects to the Broader Scoring System</h2>

      <p className="mb-3">
        Belief Equivalency Scores work alongside{' '}
        <Link href="/algorithms/topic-overlap" className="text-blue-700 hover:underline">
          Topic Overlap Scores
        </Link>
        , which catch duplicate arguments within a single page, and the positive-to-negative and
        strong-to-weak spectrums, which organize the full family of related beliefs by direction and
        intensity. Together they solve the three layers of linguistic fragmentation:
      </p>

      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>
          <strong>Same argument in different words</strong> — Equivalency Scores (this page)
        </li>
        <li>
          <strong>Same argument at different strengths</strong> —{' '}
          <Link href="/algorithms/topic-overlap" className="text-blue-700 hover:underline">
            strong-to-weak spectrum
          </Link>
        </li>
        <li>
          <strong>Same topic with opposite conclusions</strong> —{' '}
          <Link href="/algorithms/topic-overlap" className="text-blue-700 hover:underline">
            positive-to-negative spectrum
          </Link>
        </li>
      </ul>

      <p className="mb-4">
        When an equivalency link is confirmed, the{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
          sub-argument score cascade
        </Link>{' '}
        ensures that evidence and arguments from the merged pages propagate correctly into the
        canonical page&apos;s score. Nothing gets lost in the merge. The work done under either
        formulation survives and strengthens the unified analysis.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Related pages ─────────────────────────────────────── */}
      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/topic-overlap" className="text-blue-700 hover:underline">
              Topic Overlap Scores
            </Link>{' '}
            — catching duplicates within a single page
          </li>
          <li>
            <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
              Linkage Scores
            </Link>{' '}
            — how arguments connect to conclusions
          </li>
          <li>
            <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
              ReasonRank Algorithm
            </Link>{' '}
            — the full 11-dimension scoring system
          </li>
          <li>
            <Link href="/beliefs" className="text-blue-700 hover:underline">
              Belief Pages
            </Link>{' '}
            — browse canonical belief pages and their argument trees
          </li>
        </ul>
      </div>

      {/* ── Developer API note ────────────────────────────────── */}
      <div className="mt-8 border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm">
        <p className="font-bold mb-2">Developer API</p>
        <p className="text-gray-600 mb-2">
          The equivalency calculator above calls{' '}
          <code className="bg-white border border-gray-200 px-1 rounded">
            POST /api/beliefs/equivalency
          </code>
          . You can hit this endpoint directly:
        </p>
        <pre className="bg-white border border-gray-200 rounded p-3 text-xs overflow-x-auto">
          {`curl -X POST /api/beliefs/equivalency \\
  -H "Content-Type: application/json" \\
  -d '{
    "statementA": "We should ban assault weapons.",
    "statementB": "We should prohibit military-style rifles."
  }'`}
        </pre>
        <p className="text-gray-500 mt-2">
          Pass an optional <code className="bg-white border border-gray-200 px-1 rounded">semanticScore</code>{' '}
          (0–1) to blend in a pre-computed embedding similarity.{' '}
          <Link href="/api/beliefs/equivalency" className="text-blue-700 hover:underline">
            GET /api/beliefs/equivalency
          </Link>{' '}
          returns full endpoint documentation.
        </p>
      </div>
    </main>
  )
}
