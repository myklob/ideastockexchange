import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Confidence Stability — Idea Stock Exchange',
  description:
    'Confidence Stability tracks how settled a belief score is under sustained scrutiny. argFactor × dominanceRatio classifies pages as robust, established, developing, or fragile.',
}

const statuses = [
  {
    label: 'Robust',
    threshold: '≥ 0.75',
    color: '#16a34a',
    description:
      'Many arguments, with one side clearly dominant. New entries rarely shift the headline number. Treat the score as stable enough to act on.',
  },
  {
    label: 'Established',
    threshold: '0.50 – 0.74',
    color: '#65a30d',
    description:
      'Well-argued and leaning, but the gap between sides is not yet decisive. New entries can shift the score, though the direction is unlikely to flip.',
  },
  {
    label: 'Developing',
    threshold: '0.25 – 0.49',
    color: '#ca8a04',
    description:
      'Either the page is sparsely argued, or the two sides are close enough that small changes move the score noticeably.',
  },
  {
    label: 'Fragile',
    threshold: '< 0.25',
    color: '#dc2626',
    description:
      'Few arguments and a near-balanced score. The headline number is currently noise; one or two strong contributions could change it entirely.',
  },
]

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>Confidence Stability</strong>
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

export default function ConfidenceStabilityPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Confidence Stability: How Settled Is the Score?
      </h1>

      <p className="mb-3 text-[1.05rem]">
        A 75% truth score on a page with three arguments and a 75% truth score on a page with
        forty arguments mean different things. The first is provisional &mdash; the next strong
        argument could swing it. The second has survived contact with a meaningful number of
        challengers and held its position. The Confidence Stability score quantifies that
        difference so a reader can tell at a glance whether the headline number is stable enough
        to act on.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Formula</h2>

      <FormulaBox>
        stabilityScore = argFactor &times; (0.4 + 0.6 &times; dominanceRatio)
      </FormulaBox>

      <p className="mb-3">
        Two independent factors compose into the final score:
      </p>

      <ul className="list-disc list-outside ml-6 mb-4 space-y-2">
        <li>
          <strong>argFactor</strong> = <code className="bg-gray-100 px-1 rounded">
            min(1, argumentCount / 10)
          </code>{' '}
          &mdash; depth of debate. Ten arguments is the baseline for a fully stress-tested page;
          beyond that, additional arguments stop moving the factor.
        </li>
        <li>
          <strong>dominanceRatio</strong> ={' '}
          <code className="bg-gray-100 px-1 rounded">
            |proStrength &minus; conStrength| / (proStrength + conStrength)
          </code>{' '}
          &mdash; one-sidedness of the result. 0 is perfectly balanced; 1 is fully dominant on
          one side.
        </li>
      </ul>

      <p className="mb-4 text-sm text-gray-600">
        The 0.4 floor inside the dominance term keeps a deeply-argued but balanced page from
        scoring zero. Balanced pages with many contributions are not&nbsp;<em>unstable</em>{' '}
        in the sense that they are about to flip &mdash; they are settled around 50/50, which is
        itself a stable epistemic state.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Four Status Bands</h2>

      <div className="space-y-3 mb-6">
        {statuses.map((s) => (
          <div
            key={s.label}
            className="border border-gray-200 rounded p-3"
            style={{ borderLeftWidth: 4, borderLeftColor: s.color }}
          >
            <div className="flex items-center gap-3 mb-1">
              <span
                className="font-bold text-sm px-2 py-0.5 rounded text-white"
                style={{ backgroundColor: s.color }}
              >
                {s.label}
              </span>
              <span className="text-sm font-mono text-gray-500">{s.threshold}</span>
            </div>
            <p className="text-sm text-gray-700">{s.description}</p>
          </div>
        ))}
      </div>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Why Two Factors</h2>

      <p className="mb-3">
        Either factor alone produces misleading results. Argument count alone would call a
        page with 50 arguments &ldquo;stable&rdquo; even if those arguments produced a perfect
        50/50 split &mdash; in which case the next strong contribution could move the score
        substantially. Dominance alone would call a page with one pro argument and zero con
        arguments fully stable, when in reality nobody has tested the claim yet.
      </p>

      <p className="mb-4">
        Multiplied together, the two factors require <em>both</em> conditions: enough
        arguments that the score has been challenged, and enough one-sidedness in the result
        that further challenges would have to be substantial to overturn it. The 0.4 floor on
        the dominance term softens the multiplication so balanced-but-deep pages are still
        recognized as established.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Worked Examples</h2>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2">Scenario</th>
              <th className="border border-gray-300 px-3 py-2">argCount</th>
              <th className="border border-gray-300 px-3 py-2">pro / con</th>
              <th className="border border-gray-300 px-3 py-2">argFactor</th>
              <th className="border border-gray-300 px-3 py-2">dominance</th>
              <th className="border border-gray-300 px-3 py-2">stability</th>
              <th className="border border-gray-300 px-3 py-2">status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2">New page, one-sided</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">2</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">10 / 0</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.20</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">1.00</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.20</td>
              <td className="border border-gray-300 px-3 py-2 text-center">Fragile</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Maturing debate</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">6</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">12 / 4</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.60</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.50</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.42</td>
              <td className="border border-gray-300 px-3 py-2 text-center">Developing</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Settled, leaning</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">14</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">18 / 6</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">1.00</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.50</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.70</td>
              <td className="border border-gray-300 px-3 py-2 text-center">Established</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Mature, decisive</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">20</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">30 / 4</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">1.00</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.76</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.86</td>
              <td className="border border-gray-300 px-3 py-2 text-center">Robust</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Mature, balanced</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">20</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">15 / 15</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">1.00</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.00</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.40</td>
              <td className="border border-gray-300 px-3 py-2 text-center">Developing</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-600 italic mb-4">
        The last row is the one most readers initially find counterintuitive. A heavily-argued,
        perfectly-balanced page does not score &ldquo;robust&rdquo; &mdash; the 0.4 floor keeps
        it visible, but the system flags that the next strong argument could meaningfully shift
        the headline. That is the right call: balance is not the same as resolution.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">How to Read It on a Belief Page</h2>

      <p className="mb-3">
        Confidence Stability does not change the headline truth score. It sits next to it.
        Two pages can have the same 0.78 truth score; one might be Robust, the other Fragile.
        That information should change how a reader uses the score &mdash; whether to cite it
        confidently in another argument, or to treat it as an open question awaiting more
        evidence.
      </p>

      <p className="mb-4">
        The signal is also useful for editors deciding where to invest argumentation effort.
        Fragile pages are where a thoughtful contribution moves the most. Robust pages are
        where the marginal argument barely registers.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Developer Reference</h2>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Source</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`import { calculateConfidenceStabilityScore } from '@/core/scoring'

const result = calculateConfidenceStabilityScore(proStrength, conStrength, argCount)
// → { stabilityScore, status, argumentCount, dominanceRatio }
//   status is 'robust' | 'established' | 'developing' | 'fragile'`}
        </pre>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Implementation:{' '}
        <code className="bg-gray-100 px-1 rounded">
          src/core/scoring/all-scores.ts → calculateConfidenceStabilityScore
        </code>
        . The 10-argument depth threshold is the constant{' '}
        <code className="bg-gray-100 px-1 rounded">STABILITY_ARG_THRESHOLD</code> in that file.
      </p>

      <hr className="my-6 border-gray-300" />

      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">
              Truth Scores
            </Link>{' '}
            &mdash; the headline number that Confidence Stability is qualifying
          </li>
          <li>
            <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
              ReasonRank
            </Link>{' '}
            &mdash; how proStrength and conStrength are computed
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
