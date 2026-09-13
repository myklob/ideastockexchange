import Link from 'next/link'
import type { Metadata } from 'next'
import {
  GAP_WEIGHTS,
  LOAD_BEARING_WEIGHT,
  OPEN_RANGE_THRESHOLD,
  DEPTH_ATTENUATION,
} from '@/core/scoring/decision-leverage'

export const metadata: Metadata = {
  title: 'Decision Leverage — Idea Stock Exchange',
  description:
    'Which argument is worth settling next: how the Idea Stock Exchange ranks argument edges by the points of conclusion score still at stake on each one.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms</Link>
      {' > '}
      <strong>Decision Leverage</strong>
    </p>
  )
}

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-mono my-4 rounded">
      {children}
    </div>
  )
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'

export default function DecisionLeveragePage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">Decision Leverage</h1>
      <p className="text-lg text-gray-600 mb-6">
        Every other score answers &ldquo;what is the number?&rdquo; This one answers &ldquo;which
        number is worth arguing about next?&rdquo;
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The problem it solves</h2>
      <p className="mb-4">
        A belief page with thirty arguments is thirty invitations to spend an hour. Two of them are
        holding the conclusion up; the rest are decoration. Worse, the two that matter may be the
        two nobody has evidenced, in which case the page&apos;s confident-looking score is resting
        on a pair of assertions. Nothing on the page tells you that. Impact tells you how much an
        argument is currently contributing; it does not tell you how much that contribution could
        still change.
      </p>
      <p className="mb-4">
        Decision Leverage is the argument table read sideways. It ranks each edge by the points of
        conclusion score still at stake on it: high where an argument both carries the conclusion
        and rests on little, low where the argument is either settled or irrelevant. The top row is
        where the next hour of anyone&apos;s attention belongs.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The formula</h2>
      <FormulaBox>leverage = weight &times; openRange &times; 100</FormulaBox>
      <p className="mb-4">
        Two factors. The first is structural, the second epistemic, and the multiplication is the
        point: an argument that transmits nothing cannot be a crux however unsupported it is, and a
        fully-settled argument cannot be a crux however much it carries.
      </p>

      <h3 className="text-lg font-bold mt-6 mb-2">Weight: how much gets through</h3>
      <FormulaBox>
        weight = |linkage| &times; importance &times; uniqueness &times;{' '}
        {DEPTH_ATTENUATION}<sup>depth</sup>
      </FormulaBox>
      <p className="mb-4">
        This is the engine&apos;s own{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">impact formula</Link>{' '}
        with truth factored out. Impact is{' '}
        <code className="bg-gray-100 px-1 rounded">
          sign &times; truth &times; |linkage| &times; importance &times; uniqueness &times; 100
        </code>
        , so weight &times; 100 is exactly how many points of impact move per unit of truth. Move a
        child belief&apos;s truth score ten points and this belief&apos;s net score moves{' '}
        <code className="bg-gray-100 px-1 rounded">weight &times; 10</code> points. Nothing here is
        a new parameter; it is the existing weighting, differentiated.
      </p>

      <h3 className="text-lg font-bold mt-6 mb-2">Open range: how much is still unsettled</h3>
      <p className="mb-3">
        How much of the child&apos;s truth range is genuinely still open, in 0 to 1. Four gaps,
        each measuring one way a claim can be unfinished, combined as a weighted mean:
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm my-4">
          <thead className="bg-gray-100">
            <tr>
              <th className={TH}>Gap</th>
              <th className={TH}>Weight</th>
              <th className={TH}>How it is measured</th>
              <th className={TH}>What closes it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}>Evidence</td>
              <td className={TD}>{GAP_WEIGHTS.evidence.toFixed(2)}</td>
              <td className={TD}>
                1 &minus;{' '}
                <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
                  grounding
                </Link>{' '}
                of the child belief
              </td>
              <td className={TD}>Filing a tiered source on the child belief.</td>
            </tr>
            <tr>
              <td className={TD}>Linkage</td>
              <td className={TD}>{GAP_WEIGHTS.linkage.toFixed(2)}</td>
              <td className={TD}>1 / &radic;(1 + votes) in the edge&apos;s linkage sub-debate</td>
              <td className={TD}>
                Voting the{' '}
                <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
                  linkage
                </Link>{' '}
                sub-debate. An undebated linkage is an assumption, not a finding.
              </td>
            </tr>
            <tr>
              <td className={TD}>Examination</td>
              <td className={TD}>{GAP_WEIGHTS.examination.toFixed(2)}</td>
              <td className={TD}>
                1 / &radic;(1 + min(support, opposition)), counting the child&apos;s own
                sub-arguments and its evidence on each side
              </td>
              <td className={TD}>
                Someone arguing the other side, or a study that contradicts. Piling on one side
                closes nothing.
              </td>
            </tr>
            <tr>
              <td className={TD}>Scoring</td>
              <td className={TD}>{GAP_WEIGHTS.scoring.toFixed(2)}</td>
              <td className={TD}>1 when the child sub-debate has no score at all, else 0</td>
              <td className={TD}>The engine scoring the child&apos;s own tree.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mb-4">
        An edge with no evidence, an undebated linkage, no score and no opposition has its whole
        range open: openRange 1.0, because nothing about it has been established and any value it
        eventually takes is still on the table. An edge resting on replicated high-tier evidence,
        with a voted linkage and a genuinely two-sided sub-debate, approaches 0.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">A worked example</h2>
      <p className="mb-3">
        Two reasons to agree on the same belief. The first is the stronger argument by every
        existing measure; the second is the one worth working on.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm my-4">
          <thead className="bg-gray-100">
            <tr>
              <th className={TH}>Input</th>
              <th className={TH}>A: replicated finding</th>
              <th className={TH}>B: plausible assertion</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}>linkage &times; importance &times; uniqueness</td>
              <td className={TD}>0.9 &times; 0.9 &times; 1.0 = <strong>0.81</strong></td>
              <td className={TD}>0.8 &times; 0.75 &times; 1.0 = <strong>0.60</strong></td>
            </tr>
            <tr>
              <td className={TD}>Evidence gap</td>
              <td className={TD}>grounding 0.80 &rarr; 0.20</td>
              <td className={TD}>no evidence &rarr; 1.00</td>
            </tr>
            <tr>
              <td className={TD}>Linkage gap</td>
              <td className={TD}>15 votes &rarr; 0.25</td>
              <td className={TD}>0 votes &rarr; 1.00</td>
            </tr>
            <tr>
              <td className={TD}>Examination gap</td>
              <td className={TD}>3 opposing &rarr; 0.50</td>
              <td className={TD}>nothing attached &rarr; 1.00</td>
            </tr>
            <tr>
              <td className={TD}>Scoring gap</td>
              <td className={TD}>scored &rarr; 0.00</td>
              <td className={TD}>scored &rarr; 0.00</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}>openRange</td>
              <td className={TD}>
                0.40(0.20) + 0.25(0.25) + 0.20(0.50) + 0.15(0) = <strong>0.24</strong>
              </td>
              <td className={TD}>
                0.40(1) + 0.25(1) + 0.20(1) + 0.15(0) = <strong>0.85</strong>
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}><strong>Leverage</strong></td>
              <td className={TD}>0.81 &times; 0.24 &times; 100 = <strong>19.4</strong></td>
              <td className={TD}>0.60 &times; 0.85 &times; 100 = <strong>51.0</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mb-4">
        A contributes more to the score today and will keep doing so. B is where the score could
        still move: 51 points of conclusion are riding on a claim nobody has sourced, linked or
        contested. The ranking inverts the impact column, which is the whole reason to compute it.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The four statuses</h2>
      <p className="mb-3">
        An edge is load-bearing when weight &ge; {LOAD_BEARING_WEIGHT} and open when openRange
        &ge; {OPEN_RANGE_THRESHOLD}. The two thresholds make four quadrants:
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm my-4">
          <thead className="bg-gray-100">
            <tr>
              <th className={TH}>Status</th>
              <th className={TH}>Means</th>
              <th className={TH}>What to do</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}><strong>Crux</strong></td>
              <td className={TD}>Carries weight, rests on little.</td>
              <td className={TD}>Settle this first. It is the cheapest way to move the verdict.</td>
            </tr>
            <tr>
              <td className={TD}><strong>Load-bearing</strong></td>
              <td className={TD}>Carries weight and is supported.</td>
              <td className={TD}>
                The conclusion leans here. Attack it with evidence or not at all.
              </td>
            </tr>
            <tr>
              <td className={TD}><strong>Open but minor</strong></td>
              <td className={TD}>Unsettled, but transmits little.</td>
              <td className={TD}>Worth finishing eventually; it will not change the answer.</td>
            </tr>
            <tr>
              <td className={TD}><strong>Settled or minor</strong></td>
              <td className={TD}>Nothing meaningful left at stake.</td>
              <td className={TD}>Leave it.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mb-4">
        The belief section also reports <strong>concentration</strong>: the share of all unsettled
        score held by the single highest-leverage edge. Above half, one unresolved argument is
        carrying the verdict, and the belief&apos;s score should be read as provisional no matter
        how confident the number looks.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">What it is not</h2>
      <ul className="list-disc ml-6 mb-4 space-y-2">
        <li>
          <strong>Not a forecast.</strong> Leverage is an upper bound on movement. It assumes the
          open part of a claim&apos;s range could resolve anywhere within it, and says nothing
          about which way. Direction being unknown is exactly what makes the edge worth
          investigating.
        </li>
        <li>
          <strong>Not a measure of whether an argument is good.</strong> A crux can be nonsense
          that happens to sit on a high-linkage edge. Settling it may well mean demolishing it.
        </li>
        <li>
          <strong>Not a second opinion on the score.</strong> It reuses the same linkage,
          importance, uniqueness and grounding the engine already computed. If those are wrong,
          challenge them where they are computed; leverage inherits the error rather than
          correcting it.
        </li>
        <li>
          <strong>Not{' '}
          <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
            Confidence Stability
          </Link>
          .</strong>{' '}
          That grades a whole belief&apos;s score as settled or fragile. Leverage localizes the
          fragility to specific edges and weights it by how much each edge actually matters.
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-2">Where to see it</h2>
      <p className="mb-4">
        Every belief page with something at stake carries a Decision Leverage table under its
        argument trees, ranked, with a &ldquo;what would settle it&rdquo; link per row pointing at
        the page where that gap closes. The same readout is available as JSON at{' '}
        <code className="bg-gray-100 px-1 rounded">/api/beliefs/[id]/leverage</code>, thresholds
        included, so a consumer can reproduce the classification instead of trusting it. The
        implementation is{' '}
        <code className="bg-gray-100 px-1 rounded">src/core/scoring/decision-leverage.ts</code>.
      </p>
      <p className="mb-4">
        Start with{' '}
        <Link href="/beliefs" className="text-blue-700 hover:underline">the belief index</Link>{' '}
        and open any belief with an argument tree.
      </p>
    </div>
  )
}
