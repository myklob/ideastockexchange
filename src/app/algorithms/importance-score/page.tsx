import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Importance Score — Idea Stock Exchange',
  description:
    'How the Idea Stock Exchange weights arguments by how much they matter — including sourcing importance from a dedicated, debatable sub-belief.',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms</Link>
      {' > '}
      <strong>Importance Score</strong>
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

// ─── Mapping table data ──────────────────────────────────────────────────────

const mappingRows = [
  {
    net: '+100',
    importance: '1.00',
    label: 'Decisive',
    meaning: 'The claim that this argument matters is fully supported. Full weight.',
  },
  {
    net: '+50',
    importance: '0.75',
    label: 'Major',
    meaning: 'The importance debate leans strongly toward mattering.',
  },
  {
    net: '0',
    importance: '0.50',
    label: 'Moderate',
    meaning: 'Unargued or evenly contested. The argument carries half weight.',
  },
  {
    net: '−50',
    importance: '0.25',
    label: 'Minor',
    meaning: 'The community has largely refuted the claim that this matters.',
  },
  {
    net: '−100',
    importance: '0.00',
    label: 'Negligible',
    meaning: 'Fully refuted. A true, relevant, unimportant argument contributes nothing.',
  },
]

// ─── Worked example data ─────────────────────────────────────────────────────

const naziRows = [
  {
    argument: '"The regime systematically murdered millions of people."',
    truth: '0.99',
    linkage: '0.98',
    importance: '1.00',
    impact: '+97.0',
    impactClass: 'text-green-700',
  },
  {
    argument: '"Nazi leaders were often rude in personal correspondence."',
    truth: '0.90',
    linkage: '0.30',
    importance: '0.05',
    impact: '+1.4',
    impactClass: 'text-orange-600',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImportanceScorePage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222]">
      <Breadcrumb />

      {/* ── Title ───────────────────────────────────────────────────────── */}
      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Importance Score: Measuring Whether an Argument Actually Matters
      </h1>

      <CalloutBox>
        <p className="text-[1.05rem]">
          <strong>The Core Diagnostic Question:</strong>{' '}
          <em>
            &ldquo;If this argument is true and connected, how far should it move the
            probability needle on the conclusion?&rdquo;
          </em>
        </p>
      </CalloutBox>

      {/* ── The problem ─────────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mt-8 mb-3">True and Relevant Is Still Not Enough</h2>

      <p className="mb-3">
        The{' '}
        <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">
          Truth Score
        </Link>{' '}
        asks whether an argument is accurate. The{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
          Linkage Score
        </Link>{' '}
        asks whether it connects to the conclusion. Both can be high while the argument remains
        trivial. A verified fact, genuinely on-topic, can still be a rounding error next to the
        considerations that actually decide the question.
      </p>
      <p className="mb-3">
        The Importance Score is the third dimension: a weight from <strong>0 to 1</strong>{' '}
        measuring how much a proven, connected argument should move the parent belief.
        A score of 1.0 means decisive, 0.5 means moderate, 0.1 means minor. On belief pages it
        appears as the <strong>Imp</strong> column in the argument tables.
      </p>
      <p className="mb-4">
        Without it, debates reward whoever can stack the most small true things. With it, one
        decisive argument outweighs a hundred trivia points &mdash; because the math says so,
        not because a moderator does.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── The killer feature ──────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">
        The Key Move: &ldquo;Does This Matter?&rdquo; Is Itself a Debatable Claim
      </h2>

      <p className="mb-3">
        Most scoring systems treat importance as a knob someone turns. The Idea Stock Exchange
        treats it as a <strong>claim someone must defend</strong>. An argument can carry an
        optional third edge: a dedicated <em>importance sub-belief</em> whose whole job is to
        assert that the argument matters.
      </p>
      <p className="mb-3">
        Example: under the conclusion <em>&ldquo;The US should adopt approval voting,&rdquo;</em>{' '}
        the argument <em>&ldquo;Plurality voting causes spoiler effects&rdquo;</em> can source its
        importance from the sub-belief{' '}
        <em>&ldquo;The spoiler effect is a major, solvable problem.&rdquo;</em> That sub-belief is
        a full belief page: it collects its own reasons to agree and disagree, and earns its own
        net score on the &minus;100 to +100 scale. The argument&apos;s importance is then derived
        from that net score by a linear map:
      </p>

      <FormulaBox>Importance = (Net Score + 100) / 200, clamped to [0, 1]</FormulaBox>

      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-center">Importance Belief Net Score</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Derived Importance</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Label</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {mappingRows.map(row => (
              <tr key={row.net} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 text-center font-mono">{row.net}</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono font-bold">
                  {row.importance}
                </td>
                <td className="border border-gray-300 px-3 py-2 font-semibold">{row.label}</td>
                <td className="border border-gray-300 px-3 py-2">{row.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mb-3">
        This closes a loophole every debate platform leaves open. If you think an opponent&apos;s
        argument is overweighted, you do not downvote it or complain &mdash; you add reasons to
        disagree with its importance belief. If those reasons survive scrutiny, the net score
        falls, the derived importance falls with it, and the argument&apos;s contribution to the
        parent shrinks automatically. The weight tracks the live debate about its own
        significance, the same way{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
          linkage
        </Link>{' '}
        tracks the live debate about the connection.
      </p>
      <p className="mb-4">
        Worked mapping: suppose the spoiler-effect importance belief settles at a net score of{' '}
        <strong>+62</strong>. Then Importance = (62 + 100) / 200 = <strong>0.81</strong>. If the
        argument itself has a truth score of 0.90 and a linkage of 0.85, its impact on the
        approval-voting conclusion is 0.90 &times; 0.85 &times; 0.81 &times; 100 ={' '}
        <strong>+62.0</strong>. Every number in that chain has a page where you can argue it down.
      </p>

      <h3 className="text-xl font-bold mt-5 mb-2">Making a Manual Weight Debatable</h3>
      <p className="mb-3">
        Not every argument has an importance sub-belief yet. When the edge is absent, the
        importance score is a manual value set when the argument is placed, defaulting to 1.0
        (full weight) &mdash; and every impact-provenance page for such an edge carries a
        one-click <em>Make importance debatable</em> affordance
        (<code>POST /api/arguments/[id]/importance</code>). Attaching creates the dedicated
        sub-belief; the multiplier opens neutral (0.5) until reasons land and tracks the
        sub-debate from then on. Think a point is being overweighted? You don&apos;t lobby a
        moderator &mdash; you post the counter-argument in the importance sub-debate, and if it
        holds up, the multiplier falls.
      </p>

      <h3 className="text-xl font-bold mt-5 mb-2">The Four Criteria That Anchor the Sub-Debate</h3>
      <p className="mb-3">
        Every attached importance sub-belief is seeded with these criteria as its
        falsifiability tests &mdash; the evidence that would move the multiplier, named in
        advance:
      </p>
      <ul className="list-disc ml-6 mb-3 space-y-1">
        <li>
          <strong>Scale of impact</strong> &mdash; how many people are affected, how severe the
          consequences, whether they are reversible. &ldquo;Raises taxes 0.01%&rdquo; and
          &ldquo;raises taxes 15%&rdquo; can both be true; magnitude is the difference.
        </li>
        <li>
          <strong>Decision relevance</strong> &mdash; does this change what action to take, or
          is it background? A treatment&apos;s success rate is decision-relevant; its discovery
          year is not.
        </li>
        <li>
          <strong>Causal proximity</strong> &mdash; root cause or distant side effect? In a
          homelessness debate, housing supply outranks edge-case shelter refusals because the
          first addresses scale.
        </li>
        <li>
          <strong>Testability</strong> &mdash; can &ldquo;this matters&rdquo; actually be
          verified (&ldquo;costs $500M annually&rdquo;), or is it speculation about
          hypotheticals (&ldquo;might set a bad precedent&rdquo;)?
        </li>
      </ul>
      <p className="mb-4">
        The older design rubric &mdash; <strong>scope</strong> (30%), <strong>magnitude</strong>{' '}
        (30%), <strong>reversibility</strong> (20%), <strong>urgency</strong> (20%) &mdash;
        remains guidance for placing manual weights. The computed paths are the linear map
        above and the manual default; the criteria are anchors for the sub-debates, not an
        automated formula.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Where it lands in the math ──────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Where Importance Enters the Math</h2>
      <p className="mb-3">
        When the scoring engine propagates a child belief&apos;s score up to its parent, each
        argument edge contributes:
      </p>

      <FormulaBox>
        Impact = sign &times; Truth &times; |Linkage| &times; Importance &times; Uniqueness &times; 100
      </FormulaBox>

      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>
          <strong>sign</strong> &mdash; +1 for reasons to agree, &minus;1 for reasons to disagree.
        </li>
        <li>
          <strong>Truth</strong> (0&ndash;1) &mdash; how well-supported the argument is by its own
          sub-arguments (
          <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">
            Truth Scores
          </Link>
          ).
        </li>
        <li>
          <strong>|Linkage|</strong> (0&ndash;1) &mdash; how strongly it connects to this
          conclusion (
          <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
            Linkage Scores
          </Link>
          ); the absolute value is used so the side alone controls direction.
        </li>
        <li>
          <strong>Importance</strong> (0&ndash;1) &mdash; this page.
        </li>
        <li>
          <strong>Uniqueness</strong> (0&ndash;1) &mdash; discount for restating an earlier
          same-side argument (
          <Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">
            Uniqueness Scores
          </Link>
          ).
        </li>
      </ul>
      <p className="mb-4">
        Because the factors multiply, a zero anywhere zeroes the whole contribution. True but
        irrelevant dies on linkage. Relevant but false dies on truth. True, relevant, but trivial
        dies here, on importance. Pro and con impacts then sum into the parent&apos;s net score,
        as described in the{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
          ReasonRank Algorithm
        </Link>
        .
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Worked example ──────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Worked Example: True but Unimportant</h2>
      <p className="mb-4">
        Conclusion: <em>&ldquo;The Nazi regime was morally catastrophic.&rdquo;</em> Consider two
        supporting arguments, both factually accurate:
      </p>

      <div className="overflow-x-auto mb-2">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left">Argument</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Truth</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Linkage</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Importance</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Impact</th>
            </tr>
          </thead>
          <tbody>
            {naziRows.map(row => (
              <tr key={row.argument} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">{row.argument}</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono">{row.truth}</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono">{row.linkage}</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono font-bold">
                  {row.importance}
                </td>
                <td className={`border border-gray-300 px-3 py-2 text-center font-mono font-bold ${row.impactClass}`}>
                  {row.impact}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 italic mb-4">
        Genocide row: 0.99 &times; 0.98 &times; 1.00 &times; 100 = +97.0. Rudeness row: 0.90
        &times; 0.30 &times; 0.05 &times; 100 = +1.4. (Uniqueness is 1.0 for both &mdash; neither
        restates the other.)
      </p>

      <p className="mb-3">
        Both arguments are true. Both even point the same direction. But systematic genocide is
        the reason the conclusion is true &mdash; scope in the millions, maximal magnitude,
        irreversible. Rudeness in correspondence is a footnote: weakly linked to moral
        catastrophe, and nearly weightless even where it connects. The impact column reflects a
        70&times; difference that no amount of citation quality on the rudeness claim can close.
      </p>
      <p className="mb-4">
        And if someone disagrees with that 0.05? They do not edit a number. They build the case
        on the rudeness argument&apos;s importance belief &mdash; and either the reasons hold up
        and the weight rises, or they do not and it stays a footnote. Importance is earned in
        public, like every other score on the platform.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Common objections ───────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Common Objections</h2>

      <h3 className="text-xl font-bold mt-4 mb-2">
        &ldquo;Isn&apos;t importance just linkage again?&rdquo;
      </h3>
      <p className="mb-4">
        No. Linkage asks whether the argument, if true, forces movement on the conclusion.
        Importance asks how large that movement should be. &ldquo;Nazi leaders were rude&rdquo;
        has <em>some</em> linkage to moral character &mdash; the connection is real, just weak
        and small. A perfectly linked argument about a tiny effect (a policy that provably saves
        $12 a year) has high linkage and low importance. The two scores fail independently, which
        is why both multiply into impact.
      </p>

      <h3 className="text-xl font-bold mt-4 mb-2">
        &ldquo;Won&apos;t people just set their own arguments to 1.0?&rdquo;
      </h3>
      <p className="mb-4">
        With manual weights, they can &mdash; which is exactly why the sourced path exists. An
        argument coasting on a default 1.0 is an open invitation: create its importance belief,
        add the reasons it does not matter, and let the derived score replace the assertion. The
        long-run equilibrium is that every contested weight becomes a debate, and defaults only
        survive where nobody objects.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Related links ───────────────────────────────────────────────── */}
      <div>
        <p className="font-bold mb-2">Related Algorithms &amp; Documentation:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
              ReasonRank Algorithm
            </Link>{' '}
            &mdash; How importance-weighted impacts aggregate into belief scores.
          </li>
          <li>
            <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">
              Truth Scores
            </Link>{' '}
            &mdash; The accuracy dimension of argument impact.
          </li>
          <li>
            <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
              Linkage Scores
            </Link>{' '}
            &mdash; The relevance dimension of argument impact.
          </li>
          <li>
            <Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">
              Uniqueness Scores
            </Link>{' '}
            &mdash; The redundancy discount that stops restatements from double-counting.
          </li>
          <li>
            <Link href="/algorithms/objective-criteria" className="text-blue-700 hover:underline">
              Objective Criteria
            </Link>{' '}
            &mdash; Agreeing on what counts as evidence before weighing it.
          </li>
        </ul>
      </div>

      <p className="mt-8 mb-2">
        Browse the{' '}
        <Link href="/beliefs" className="font-bold text-blue-700 hover:underline">
          belief index
        </Link>{' '}
        to see Importance Scores in the argument tables, or start with the{' '}
        <Link href="/algorithms" className="font-bold text-blue-700 hover:underline">
          algorithms overview
        </Link>
        .
      </p>
    </main>
  )
}
