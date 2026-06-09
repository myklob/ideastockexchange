import type { TestablePredictionItem } from '../types'

interface FalsifiabilityTestSectionProps {
  confirm: string | null
  falsify: string | null
  /** Legacy single-field fallback when confirm/falsify are absent. */
  legacy: string | null
  predictions: TestablePredictionItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'

function lines(text: string | null) {
  if (!text) return <span>&nbsp;</span>
  return text.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)
}

export default function FalsifiabilityTestSection({
  confirm,
  falsify,
  legacy,
  predictions,
}: FalsifiabilityTestSectionProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
          <span>&#128269;</span> Falsifiability Test
        </h2>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-1/2`}>Evidence That Would Confirm</th>
              <th className={`${TH} w-1/2`}>Evidence That Would Falsify</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}>{lines(confirm)}</td>
              <td className={TD}>{lines(falsify ?? legacy)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span>&#128302;</span> Testable Predictions
        </h3>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-[45%]`}>Prediction</th>
              <th className={`${TH} w-[20%]`}>Timeframe</th>
              <th className={`${TH} w-[35%]`}>Verification Method</th>
            </tr>
          </thead>
          <tbody>
            {(predictions.length > 0 ? predictions : [null]).map((p, i) => (
              <tr key={p?.id ?? i}>
                <td className={TD}>{p?.prediction ?? <span>&nbsp;</span>}</td>
                <td className={TD}>{p?.timeframe ?? <span>&nbsp;</span>}</td>
                <td className={TD}>{p?.verificationMethod ?? <span>&nbsp;</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
