import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ReasonRank vs. PageRank — Idea Stock Exchange',
  description:
    'A direct comparison of ReasonRank with Google’s PageRank: where the two algorithms agree, where they diverge, and why the divergences matter for evaluating ideas rather than ranking web pages.',
}

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>ReasonRank vs. PageRank</strong>
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

export default function ReasonRankVsPageRankPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight">
        ReasonRank vs. PageRank: A Direct Comparison
      </h1>

      <p className="mb-3 text-[1.05rem]">
        ReasonRank is consciously modeled on PageRank. Same recursion, same damping factor,
        same probability interpretation at the top level. The differences are where ranking a
        web of pages diverges from ranking a web of ideas, and that divergence is the entire
        reason ReasonRank exists. This page lays the two algorithms side by side so the
        kinship and the breaks are both visible.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Core Recursions, Side by Side</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#f9f9f9] border border-gray-200 rounded p-4">
          <p className="font-bold mb-2">PageRank</p>
          <FormulaBox>
            PR(A) = (1 &minus; d)/N + d &times; Σ PR(T<sub>i</sub>) / C(T<sub>i</sub>)
          </FormulaBox>
          <p className="text-sm text-gray-600 mt-2">
            Each page&apos;s rank is a damped average of the ranks of pages linking to it,
            divided by each linking page&apos;s outbound link count.
          </p>
        </div>
        <div className="bg-[#f9f9f9] border border-gray-200 rounded p-4">
          <p className="font-bold mb-2">ReasonRank</p>
          <FormulaBox>
            RR(A) = (1 &minus; d) &times; baseTruth + d &times; f(proSubRank &minus; conSubRank)
          </FormulaBox>
          <p className="text-sm text-gray-600 mt-2">
            Each argument&apos;s rank is a damped combination of its own base truth and the net
            of its supporting and opposing sub-arguments.
          </p>
        </div>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        Both algorithms use damping factor <code className="bg-gray-100 px-1 rounded">d = 0.85</code>.
        Both compute scores bottom-up via fixed-point iteration. Both interpret the result as
        a probability under a random-walk model. The structural similarity is deliberate.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Where They Diverge</h2>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Property</th>
              <th className="border border-gray-300 px-3 py-2 text-left">PageRank</th>
              <th className="border border-gray-300 px-3 py-2 text-left">ReasonRank</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">Edge polarity</td>
              <td className="border border-gray-300 px-3 py-2">
                One channel: a link is a vote &ldquo;for&rdquo; the linked page. There is no
                way to link to a page in opposition.
              </td>
              <td className="border border-gray-300 px-3 py-2">
                Two channels: every connection is explicitly &ldquo;agree&rdquo; or
                &ldquo;disagree&rdquo;. Pro and con sums are tracked separately and combined.
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">Edge weighting</td>
              <td className="border border-gray-300 px-3 py-2">
                One implicit weight: <code className="bg-white px-1 rounded">1 / C(T)</code>{' '}
                &mdash; one over the source page&apos;s outbound link count.
              </td>
              <td className="border border-gray-300 px-3 py-2">
                Four explicit weights: linkage, importance, uniqueness, and (for media)
                tier. Each multiplies into rawImpact.
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">Teleportation term</td>
              <td className="border border-gray-300 px-3 py-2">
                Uniform across all nodes: <code className="bg-white px-1 rounded">
                  (1 − d)/N
                </code>
                . Models random teleport.
              </td>
              <td className="border border-gray-300 px-3 py-2">
                Per-node base truth: <code className="bg-white px-1 rounded">
                  (1 − d) × baseTruth
                </code>
                . Models the argument&apos;s standalone plausibility, independent of
                sub-arguments.
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">Spam resistance</td>
              <td className="border border-gray-300 px-3 py-2">
                Vulnerable to link farms; defended via heuristics layered on top of the
                algorithm.
              </td>
              <td className="border border-gray-300 px-3 py-2">
                Defended at the algorithm level: linkage and importance gate every
                contribution, uniqueness deflates repetition, fallacy penalties zero out
                broken arguments.
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">What &ldquo;wins&rdquo;</td>
              <td className="border border-gray-300 px-3 py-2">
                Pages with many high-quality inbound links rise. The semantics of the link is
                ignored.
              </td>
              <td className="border border-gray-300 px-3 py-2">
                Arguments whose sub-tree of high-quality, on-topic, important supporters
                outweighs their opponents rise. Semantics of every edge matters.
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">Truth interpretation</td>
              <td className="border border-gray-300 px-3 py-2">
                The score is &ldquo;authority&rdquo; or &ldquo;importance in the link graph&rdquo; &mdash;
                says nothing about whether the page&apos;s content is true.
              </td>
              <td className="border border-gray-300 px-3 py-2">
                The score is the probability the claim is true given the structured pro/con
                debate beneath it. Combined with{' '}
                <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">
                  Logical Validity
                </Link>{' '}
                and{' '}
                <Link href="/algorithms/verification" className="text-blue-700 hover:underline">
                  Verification
                </Link>
                , it directly attempts to measure truth.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Why the Differences Matter</h2>

      <p className="mb-3">
        The single-channel link model is exactly right for the web: a link is a citation, an
        endorsement, a thread the original author found worth following. Negative citations are
        rare and noisy; treating every link as positive worked well for PageRank because the
        underlying medium roughly behaves that way.
      </p>

      <p className="mb-3">
        Argument graphs do not behave that way. Half the relationships in a debate are
        oppositions. Forcing them through a single-channel model would either silence the con
        side entirely (rank everything as if everyone agreed) or pretend disagreement is
        endorsement (count any reference as a vote for the source). Both are wrong. The
        two-channel model with explicit subtraction is the minimum fix.
      </p>

      <p className="mb-4">
        The four weight multipliers solve the parallel problem on the magnitude side. PageRank
        treats every link as carrying the same weight, modulated only by the source page&apos;s
        outbound count. An argument graph is full of edges whose magnitudes legitimately vary by
        orders of magnitude &mdash; a peripheral citation versus a load-bearing premise. The
        product of linkage, importance, uniqueness, and tier captures that range explicitly.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">What ReasonRank Inherits Unchanged</h2>

      <ul className="list-disc list-outside ml-6 mb-4 space-y-2">
        <li>
          <strong>Bottom-up recursion.</strong> A node&apos;s score is fully determined by its
          immediate children &mdash; no need to look at distant ancestors. This is what makes
          incremental updates feasible: if a deep premise changes, its ancestors recompute
          along the affected path without rescanning the whole graph.
        </li>
        <li>
          <strong>Damping factor 0.85.</strong> Same value PageRank settled on after empirical
          tuning, used here for the same reason: 15% from the node&apos;s own intrinsic signal
          gives a stable anchor that prevents pathological cycles from dominating the
          fixed-point.
        </li>
        <li>
          <strong>Probability interpretation.</strong> Both algorithms produce a value in
          [0, 1] that represents the &ldquo;probability that a random walker following the
          graph lands on this node.&rdquo; In ReasonRank the walker follows pro arguments to
          accumulate support and con arguments to accumulate opposition; the score is the share
          of the walk that supports.
        </li>
        <li>
          <strong>No depth penalty.</strong> The recursion treats every level the same. A
          high-quality deep argument is not penalized for being deep; it just has to clear the
          quality bar at every level on the way up.
        </li>
      </ul>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">A Worked Mapping</h2>

      <p className="mb-3">
        Read this as the same equation rewritten in two domains.
      </p>

      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">PageRank concept</th>
              <th className="border border-gray-300 px-3 py-2 text-left">ReasonRank analog</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Page</td>
              <td className="border border-gray-300 px-3 py-2">Argument or belief</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Inbound link</td>
              <td className="border border-gray-300 px-3 py-2">Sub-argument (pro or con)</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Outbound link count C(T)</td>
              <td className="border border-gray-300 px-3 py-2">numSubArgs (used to normalize)</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Random teleport (1 − d)/N</td>
              <td className="border border-gray-300 px-3 py-2">(1 − d) × baseTruth</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Link weight 1 / C(T)</td>
              <td className="border border-gray-300 px-3 py-2">linkage × importance × uniqueness</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">PR(T) — page&apos;s rank</td>
              <td className="border border-gray-300 px-3 py-2">RR(child) × side</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Σ over inbound links</td>
              <td className="border border-gray-300 px-3 py-2">proSubRank − conSubRank</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        The shape is identical. The semantics of every term are different, because what is being
        ranked is different. A web page is good when many pages link to it; an argument is good
        when many strong, on-topic, important supporters outweigh strong, on-topic, important
        challengers. Same recursion, different domain, different content in every multiplier.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Architectural Consequence</h2>

      <p className="mb-4">
        PageRank made information searchable. ReasonRank is an attempt to make argument
        searchable in the same sense &mdash; not just &ldquo;which page&apos;s authority is
        highest&rdquo; but &ldquo;which claim&apos;s evidence is strongest, with the math
        visible and challengeable.&rdquo; That is the gap PageRank cannot fill on its own and
        the reason a different scoring algorithm is needed for a different problem.
      </p>

      <hr className="my-6 border-gray-300" />

      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
              ReasonRank
            </Link>{' '}
            &mdash; the umbrella algorithm and how it composes the other scores
          </li>
          <li>
            <Link href="/algorithms/sub-argument-aggregation" className="text-blue-700 hover:underline">
              Sub-Argument Aggregation
            </Link>{' '}
            &mdash; the recursion in detail, with the full edge formula
          </li>
          <li>
            <Link href="/algorithms/strong-to-weak" className="text-blue-700 hover:underline">
              Strong-to-Weak Spectrum
            </Link>{' '}
            &mdash; the second coordinate axis ReasonRank uses that PageRank has no analog for
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
