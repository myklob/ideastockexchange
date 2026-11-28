import type { FalsifiabilityItemRow, TestablePredictionItem } from '../types'
import { formatScore, pairBySide, rankByScore, TABLE_TOP_LIMIT } from '../lib/ranking'
import ExpandableRows from './ExpandableRows'

interface FalsifiabilityTestSectionProps {
  /** Scored score-mover rows (side "strengthen" / "weaken"), ranked by score. */
  items?: FalsifiabilityItemRow[]
  /** Legacy free-text fallbacks when no scored rows exist yet. */
  confirm: string | null
  falsify: string | null
  /** Legacy single-field fallback when confirm/falsify are absent. */
  legacy: string | null
  predictions: TestablePredictionItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

function lines(text: string | null): React.ReactNode {
  if (!text) return <span>&nbsp;</span>
  return text.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)
}

function MoverPairRow({ s, w }: { s: FalsifiabilityItemRow | null; w: FalsifiabilityItemRow | null }) {
  return (
    <tr>
      <td className={TD}>{s?.description ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(s?.score) ?? <span>&nbsp;</span>}</td>
      <td className={TD}>{w?.description ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(w?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )
}

export default function FalsifiabilityTestSection({
  items = [],
  confirm,
  falsify,
  legacy,
  predictions,
}: FalsifiabilityTestSectionProps) {
  const strengthen = rankByScore(items.filter(i => i.side === 'strengthen'), i => i.score, Infinity).top
  const weaken = rankByScore(items.filter(i => i.side === 'weaken'), i => i.score, Infinity).top
  const pairs = pairBySide(strengthen, weaken)
  const topPairs = pairs.slice(0, TABLE_TOP_LIMIT)
  const restPairs = pairs.slice(TABLE_TOP_LIMIT)

  const rankedPredictions = rankByScore(predictions, p => p.score, Infinity).top
  const topPredictions = rankedPredictions.slice(0, TABLE_TOP_LIMIT)
  const restPredictions = rankedPredictions.slice(TABLE_TOP_LIMIT)

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
          <span>&#129514;</span> Falsifiability Test
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-3">
          Evidence rarely proves or disproves anything outright; it strengthens or weakens. Each
          row&apos;s Score is the performance of its own pro/con sub-debate: if this evidence
          appeared, would it actually move this belief?
        </p>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-[42%]`}>Evidence That Would Strengthen</th>
              <th className={`${TH} text-center w-[8%]`}>Score</th>
              <th className={`${TH} w-[42%]`}>Evidence That Would Weaken</th>
              <th className={`${TH} text-center w-[8%]`}>Score</th>
            </tr>
          </thead>
          <tbody>
            {pairs.length > 0 ? (
              <>
                {topPairs.map(([s, w], i) => (
                  <MoverPairRow key={s?.id ?? w?.id ?? i} s={s} w={w} />
                ))}
                <ExpandableRows moreCount={restPairs.length} colSpan={4}>
                  {restPairs.map(([s, w], i) => (
                    <MoverPairRow key={s?.id ?? w?.id ?? i} s={s} w={w} />
                  ))}
                </ExpandableRows>
              </>
            ) : (
              <tr>
                <td className={TD}>{lines(confirm)}</td>
                <td className={TDC}>&nbsp;</td>
                <td className={TD}>{lines(falsify ?? legacy)}</td>
                <td className={TDC}>&nbsp;</td>
              </tr>
            )}
            <tr className="bg-gray-50">
              <td className={`${TD} text-xs text-[#555]`} colSpan={4}>
                <em>
                  If no realistic evidence could falsify this belief, say so here and note what that
                  implies about the strength of the claim.
                </em>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-1 flex items-center gap-2">
          <span>&#128302;</span> Testable Predictions
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] italic mb-2">
          If this belief is true, what should the world show us that it would not show us otherwise?
          Each prediction that comes true or fails feeds back into the belief score above.
        </p>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-[30%]`}>Prediction</th>
              <th className={`${TH} text-center w-[10%]`}>Follows If&hellip;</th>
              <th className={`${TH} w-[12%]`}>Timeframe</th>
              <th className={`${TH} w-[26%]`}>Verification Method</th>
              <th className={`${TH} text-center w-[14%]`}>Result So Far</th>
              <th className={`${TH} text-center w-[8%]`}>Score</th>
            </tr>
          </thead>
          <tbody>
            {(topPredictions.length > 0 ? topPredictions : [null]).map((p, i) => (
              <tr key={p?.id ?? i}>
                <td className={TD}>{p?.prediction ?? <span>&nbsp;</span>}</td>
                <td className={`${TDC} capitalize`}>{p ? (p.followsIf ?? 'true') : <span>&nbsp;</span>}</td>
                <td className={TD}>{p?.timeframe ?? <span>&nbsp;</span>}</td>
                <td className={TD}>{p?.verificationMethod ?? <span>&nbsp;</span>}</td>
                <td className={TDC}>{p?.resultSoFar ?? <span>&nbsp;</span>}</td>
                <td className={`${TDC} font-mono`}>{formatScore(p?.score) ?? <span>&nbsp;</span>}</td>
              </tr>
            ))}
            <ExpandableRows moreCount={restPredictions.length} colSpan={6}>
              {restPredictions.map(p => (
                <tr key={p.id}>
                  <td className={TD}>{p.prediction}</td>
                  <td className={`${TDC} capitalize`}>{p.followsIf ?? 'true'}</td>
                  <td className={TD}>{p.timeframe ?? <span>&nbsp;</span>}</td>
                  <td className={TD}>{p.verificationMethod ?? <span>&nbsp;</span>}</td>
                  <td className={TDC}>{p.resultSoFar ?? <span>&nbsp;</span>}</td>
                  <td className={`${TDC} font-mono`}>{formatScore(p.score) ?? <span>&nbsp;</span>}</td>
                </tr>
              ))}
            </ExpandableRows>
          </tbody>
        </table>
      </div>
    </section>
  )
}
