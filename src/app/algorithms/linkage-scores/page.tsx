import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Linkage Scores — Idea Stock Exchange',
  description:
    'How the Idea Stock Exchange separates true arguments from relevant ones using Linkage Scores (ECLS & ACLS).',
}

// ─── Sub-components ────────────────────────────────────────────────────────

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms</Link>
      {' > '}
      <strong>Linkage Scores</strong>
    </p>
  )
}

function CalloutBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-3 mb-5 rounded-r">
      {children}
    </div>
  )
}

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-mono text-lg my-4 rounded">
      {children}
    </div>
  )
}

function MasterFormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 border border-gray-300 px-4 py-4 text-center text-xl font-bold my-5 rounded">
      {children}
    </div>
  )
}

// ─── Example table data ─────────────────────────────────────────────────────

const carbonTaxRows = [
  {
    argument: '"Carbon taxes reduce emissions in countries that implement them."',
    truth: 0.85,
    linkage: '+0.90',
    linkageClass: 'text-green-700',
    why: <><strong>Direct Evidence:</strong> Shows the policy achieves its stated goal.</>,
  },
  {
    argument: '"Climate change is real and human-caused."',
    truth: 0.95,
    linkage: '+0.60',
    linkageClass: 'text-blue-700',
    why: <><strong>Context:</strong> Establishes the problem exists, but doesn&apos;t prove this specific solution works.</>,
  },
  {
    argument: '"Many economists support market-based environmental policies."',
    truth: 0.80,
    linkage: '+0.20',
    linkageClass: 'text-orange-600',
    why: <><strong>Weak Support:</strong> Appeals to authority without showing the mechanism.</>,
  },
  {
    argument: '"Carbon has atomic number 6."',
    truth: 1.00,
    linkage: '0.00',
    linkageClass: 'text-red-600',
    why: <><strong>Irrelevant:</strong> Perfectly true, completely unrelated to policy effectiveness.</>,
  },
]

// ─── Page ──────────────────────────────────────────────────────────────────

export default function LinkageScoresPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222]">
      <Breadcrumb />

      {/* ── Title ─────────────────────────────────────────────── */}
      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Linkage Scores: When True Arguments Don&apos;t Actually Connect
      </h1>

      <CalloutBox>
        <p className="text-[1.05rem]">
          <strong>The Core Diagnostic Question:</strong>{' '}
          <em>
            &ldquo;If this argument or evidence were 100% true, would it actually force the
            linked conclusion to be true?&rdquo;
          </em>
        </p>
      </CalloutBox>

      {/* ── Section 1 ─────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mt-8 mb-3">The Problem: Truth Isn&apos;t Enough</h2>

      <p className="mb-3">
        Here is a verified, 100% true statement:{' '}
        <em>&ldquo;The earth orbits the sun.&rdquo;</em>
      </p>
      <p className="mb-3">
        Now imagine someone uses it to argue we should implement a national carbon tax. They cite
        NASA. They provide impeccable evidence. The claim is 100% verified. It is also completely
        irrelevant.
      </p>
      <p className="mb-3">
        This is the fundamental flaw of traditional debate and social media: they treat all true
        statements as equally valid support for a conclusion. People &ldquo;win&rdquo; arguments by
        shouting accurate facts that are logically disconnected from the point. The Idea Stock
        Exchange solves this by separating two questions that debate almost always conflates:
      </p>
      <ol className="list-decimal list-inside mb-5 space-y-1">
        <li>
          <strong>Is this argument true?</strong>{' '}
          (Measured by the{' '}
          <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">
            Truth Score
          </Link>
          )
        </li>
        <li>
          <strong>Does this argument actually connect to the conclusion?</strong>{' '}
          (Measured by the Linkage Score)
        </li>
      </ol>

      {/* ── Example table ─────────────────────────────────────── */}
      <div className="overflow-x-auto mb-2">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left">
                Conclusion: &ldquo;We need a Carbon Tax&rdquo;
              </th>
              <th className="border border-gray-300 px-3 py-2 text-center">Truth Score</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Linkage Score</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Why?</th>
            </tr>
          </thead>
          <tbody>
            {carbonTaxRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">{row.argument}</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                  {row.truth.toFixed(2)}
                </td>
                <td className={`border border-gray-300 px-3 py-2 text-center font-bold font-mono ${row.linkageClass}`}>
                  {row.linkage}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">{row.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 italic mb-6">
        A perfect Truth Score with a zero Linkage Score contributes nothing to the parent belief.
        It is not enough to cite true things &mdash; you must show how they connect.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 2 ─────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">How It Works: Debates Inside Debates</h2>

      <p className="mb-3">
        On the Idea Stock Exchange, the connection between two ideas is not assumed &mdash;{' '}
        <strong>the connection itself is a claim that can be debated.</strong>
      </p>
      <p className="mb-3">
        Every belief page shows Reasons to Agree and Reasons to Disagree. Next to each reason is a
        Linkage Score.{' '}
        <strong>You can click on any Linkage Score to debate it.</strong> That click opens a new
        nested page dedicated entirely to the question:{' '}
        <em>&ldquo;Does Argument X actually support Conclusion Y?&rdquo;</em> That page shows its
        own Reasons to Agree and Disagree &mdash; and each of those has its own Linkage Score,
        which can itself be clicked and debated.
      </p>
      <p className="mb-3">
        This creates an infinitely navigable <strong>reason web</strong>. To maintain precision,
        the system tracks two distinct types of links:
      </p>
      <ul className="list-disc list-inside mb-5 space-y-2">
        <li>
          <strong>ECLS (Evidence-to-Conclusion Linkage Score):</strong> How directly does raw data
          support a claim?{' '}
          <em>
            (e.g., A peer-reviewed atmospheric study &rarr; 95% linkage to &ldquo;CO&#x2082; traps
            heat.&rdquo;)
          </em>
        </li>
        <li>
          <strong>ACLS (Argument-to-Conclusion Linkage Score):</strong> How strongly does one
          conceptual argument support another?{' '}
          <em>
            (e.g., &ldquo;Solar prices dropped 80%&rdquo; &rarr; 75% linkage to &ldquo;We should
            end fossil fuel subsidies.&rdquo;)
          </em>
        </li>
      </ul>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 3 ─────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Common Linkage Failures (And How We Filter Them)</h2>
      <p className="mb-4">
        Low Linkage Scores instantly expose the most common logical fallacies in modern debate:
      </p>

      <h3 className="text-xl font-bold mt-5 mb-2">1. The Data Dump (Neutralizing the &ldquo;Gish Gallop&rdquo;)</h3>
      <p className="mb-4">
        <em>
          &ldquo;Here are 50 studies about climate change, therefore carbon tax!&rdquo;
        </em>{' '}
        The studies might all be true. But if they don&apos;t specifically address whether a carbon
        tax works, their linkage scores are low. The algorithm mathematically silences volume: 100
        weak connections (0.1) are outweighed by a single strong one (0.9).
      </p>

      <h3 className="text-xl font-bold mt-5 mb-2">2. The Emotional Bypass</h3>
      <p className="mb-4">
        <em>&ldquo;Polar bears are dying, therefore carbon tax!&rdquo;</em> True, and affecting.
        But it doesn&apos;t establish that a carbon tax specifically will save polar bears over
        other interventions. High emotion, low linkage.
      </p>

      <h3 className="text-xl font-bold mt-5 mb-2">3. The Credential Drop</h3>
      <p className="mb-4">
        <em>
          &ldquo;A Nobel Prize-winning economist supports this, therefore it is right!&rdquo;
        </em>{' '}
        Appeals to authority are weak linkage unless the authority&apos;s specific reasoning is
        provided. Without the mechanism, it is name-dropping.
      </p>

      <h3 className="text-xl font-bold mt-5 mb-2">4. The Correlation Shuffle</h3>
      <p className="mb-4">
        <em>&ldquo;Countries with carbon taxes have lower emissions.&rdquo;</em> Sounds strong, but
        is it causal? Perhaps those countries also have stricter regulations or different energy
        infrastructure. Correlation alone gets medium linkage. Proven causation gets high linkage.
      </p>

      <h3 className="text-xl font-bold mt-5 mb-2">5. The Category Error (Hidden Assumptions)</h3>
      <p className="mb-4">
        <em>
          &ldquo;Taxes change behavior, therefore a carbon tax will reduce emissions.&rdquo;
        </em>{' '}
        General principles need specific application. Moving from general to specific requires
        unstated{' '}
        <Link href="/algorithms/assumptions" className="text-blue-700 hover:underline">
          Assumptions
        </Link>
        . When the platform detects a moderate linkage score (40&ndash;60%), it prompts users to
        add the missing assumption as a bridge node, making the hidden reasoning explicit and
        testable.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 4 ─────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">The Mathematics of Linkage</h2>

      <h3 className="text-xl font-bold mt-4 mb-2">The Multiplier Scale (&minus;1.0 to +1.0)</h3>
      <p className="mb-3">
        Linkage Scores act as a multiplier ranging from <strong>&minus;1.0</strong> (actively
        contradicts the conclusion) to <strong>+1.0</strong> (deductively proves it). The score is
        dynamically generated by the community&apos;s nested debate about the connection:
      </p>

      <FormulaBox>Linkage Score = (A &minus; D) / (A + D)</FormulaBox>

      <p className="mb-3">
        <em>
          Where <strong>A</strong> = the total adjusted weight of arguments supporting the linkage,
          and <strong>D</strong> = the total adjusted weight of arguments opposing it.
        </em>
      </p>
      <p className="mb-4">
        For example: if a connection has supporting arguments totaling A&nbsp;=&nbsp;3 and opposing
        arguments totaling D&nbsp;=&nbsp;1, the Linkage Score is (3&nbsp;&minus;&nbsp;1) /
        (3&nbsp;+&nbsp;1) = <strong>0.50</strong>. The argument passes 50% of its potential weight
        up to the conclusion. If support and opposition are equal, the score is 0.0 &mdash; the
        argument contributes nothing until the community resolves the debate.
      </p>

      <h3 className="text-xl font-bold mt-5 mb-2">Depth Attenuation: Keeping Arguments Grounded</h3>
      <p className="mb-3">
        Arguments form networks, but <strong>linkage weakens with distance.</strong> To prevent
        debaters from building elaborate theoretical chains that drift far from the original
        question, the system applies <strong>Depth Attenuation</strong>. Each level deeper an
        argument goes, its contribution to the top-level belief is multiplied by 0.5 raised to the
        power of its depth:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>
          <strong>Level 0 (Direct argument):</strong> Full weight (0.5⁰ = 1.0)
        </li>
        <li>
          <strong>Level 1 (Argument supporting the argument):</strong> Half weight (0.5¹ = 0.5)
        </li>
        <li>
          <strong>Level 2 (Supporting the support):</strong> Quarter weight (0.5² = 0.25)
        </li>
      </ul>
      <p className="mb-4">
        This forces the conversation to stay focused on direct, highly relevant evidence rather than
        rewarding whoever can construct the longest theoretical chain.
      </p>

      <h3 className="text-xl font-bold mt-5 mb-2">The Master Formula</h3>
      <p className="mb-3">
        In the{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
          ReasonRank Algorithm
        </Link>
        , the total impact an argument passes up to its parent conclusion is:
      </p>

      <MasterFormulaBox>
        Argument Impact = Truth Score &times; Linkage Score &times; Importance Score
      </MasterFormulaBox>

      <p className="mb-3">This three-way multiplication creates a precise filter:</p>
      <ul className="list-disc list-inside mb-5 space-y-1">
        <li>
          <strong>True but irrelevant</strong> arguments are zeroed out (high truth, zero linkage).
        </li>
        <li>
          <strong>Relevant but false</strong> arguments are zeroed out (zero truth, high linkage).
        </li>
        <li>
          <strong>True and relevant but trivial</strong> arguments are minimized (high truth, high
          linkage, low importance).
        </li>
      </ul>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 5 ─────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">
        Proportional Belief Updating: Why This Changes Everything
      </h2>
      <p className="mb-3">
        Linkage Scores enable mathematically precise, automated belief updates across the entire
        platform. When new evidence strengthens one node, every conclusion that depends on it
        updates automatically &mdash; in exact proportion to its reliance on that node.
      </p>
      <p className="mb-3">
        <strong>Example:</strong> A landmark new study strengthens the argument &ldquo;CO&#x2082;
        traps heat,&rdquo; raising its Truth Score by 10 points.
      </p>
      <ul className="list-disc list-inside mb-5 space-y-1">
        <li>
          <strong>&ldquo;Climate change is real&rdquo;</strong> (linked at 90%) &rarr;{' '}
          <strong>automatically gains 9 points</strong>
        </li>
        <li>
          <strong>&ldquo;We should ban gas cars&rdquo;</strong> (linked at 40%) &rarr;{' '}
          <strong>automatically gains 4 points</strong>
        </li>
      </ul>
      <p className="mb-4">
        This is how a rational mind <em>should</em> work: when a foundational premise changes,
        every downstream conclusion updates in proportion to how much it relies on that premise. The
        platform makes that process visible, systematic, and immune to motivated reasoning.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 6 ─────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">How the Platform Elicits Linkage Scores</h2>
      <p className="mb-3">
        Rather than letting users freely assign a number (which invites gaming), the platform
        derives Linkage Scores from diagnostic questions:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>
          <strong>Direction:</strong> Does this argument support or oppose the conclusion?
        </li>
        <li>
          <strong>Relevance:</strong> If this argument were proven 100% true, would it force an
          update to the conclusion?
        </li>
        <li>
          <strong>Necessity:</strong> If this argument were proven false, would the conclusion
          suffer significantly?
        </li>
        <li>
          <strong>Sufficiency:</strong> Does this argument alone justify the conclusion, or does it
          require additional support?
        </li>
      </ul>
      <p className="mb-3">
        The platform also runs two automated checks. When an argument scores high on Truth but low
        on Linkage, the interface flags it as <strong>&ldquo;True but Irrelevant.&rdquo;</strong>{' '}
        When community scoring settles in the moderate range (40&ndash;60%), the system prompts
        users to identify and add the missing assumption as its own debatable node.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section 7 ─────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">System Logic Requirements for Developers</h2>
      <p className="mb-3 text-gray-600 italic">
        The following describes the logical architecture the Linkage engine requires, without
        prescribing implementation patterns.
      </p>
      <p className="mb-3">
        The Linkage Score is a property of the <strong>edge</strong> (the connection between two
        beliefs), not either belief itself. A single argument can have a 90% linkage to one
        conclusion and a 15% linkage to a completely different one &mdash; these are independent
        relationships stored separately. Community votes on linkage are weighted by each
        voter&apos;s established reputation in logical reasoning, not general popularity. When a
        Linkage Score changes significantly, the system propagates the effect up the belief tree,
        recalculating every ancestor node that depends on it. This recursive propagation is the
        same mechanism that makes the entire ReasonRank system self-correcting.
      </p>
      <p className="mb-5">
        The system distinguishes two sub-types of linkage edge:
      </p>
      <ul className="list-disc list-inside mb-5 space-y-2">
        <li>
          <strong>ECLS</strong> — stored on <code className="bg-gray-100 px-1 rounded">Evidence</code>{' '}
          records, measuring how directly raw data supports a belief claim.
        </li>
        <li>
          <strong>ACLS</strong> — stored on <code className="bg-gray-100 px-1 rounded">Argument</code>{' '}
          records, measuring how strongly one conceptual argument supports a parent belief.
        </li>
      </ul>
      <p className="mb-4">
        Both types are scored using the same <code className="bg-gray-100 px-1 rounded">(A&minus;D)/(A+D)</code>{' '}
        community-debate formula, but are queried, displayed, and updated through separate data
        paths to maintain precision. Depth attenuation (0.5&#x207F; multiplier) is applied at
        query time when propagating scores up the tree.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Related links ─────────────────────────────────────── */}
      <div>
        <p className="font-bold mb-2">Related Algorithms &amp; Documentation:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
              ReasonRank Algorithm
            </Link>{' '}
            &mdash; How linkage fits into overall scoring.
          </li>
          <li>
            <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">
              Truth Scores
            </Link>{' '}
            &mdash; Measuring factual accuracy, independent of relevance.
          </li>
          <li>
            <Link href="/algorithms/importance-score" className="text-blue-700 hover:underline">
              Importance Score
            </Link>{' '}
            &mdash; The third dimension of argument impact.
          </li>
          <li>
            <Link href="/algorithms/assumptions" className="text-blue-700 hover:underline">
              Assumptions
            </Link>{' '}
            &mdash; Bridging the gap in low-linkage arguments.
          </li>
          <li>
            <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
              Evidence Scores
            </Link>{' '}
            &mdash; Quality assessment framework for data sources.
          </li>
        </ul>
      </div>

      <p className="mt-8 mb-2">
        <Link href="/contact" className="font-bold text-blue-700 hover:underline">
          Contact me
        </Link>{' '}
        to help test the linkage calculator or propose improvements to the scoring algorithms.
      </p>
    </main>
  )
}
