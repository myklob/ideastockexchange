import type { TestablePrediction } from '@/generated/prisma'

interface TestablePredictionsSectionProps {
  predictions: TestablePrediction[]
}

export default function TestablePredictionsSection({ predictions }: TestablePredictionsSectionProps) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">🔮 Testable Predictions</h2>
      <table className="w-full border-collapse text-sm" style={{ borderColor: '#cccccc' }}>
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-3 py-2 text-left">Prediction</th>
            <th className="border border-gray-300 px-3 py-2 text-left w-[20%]">Timeframe</th>
            <th className="border border-gray-300 px-3 py-2 text-left w-[30%]">Verification Method</th>
          </tr>
        </thead>
        <tbody>
          {predictions.length > 0 ? (
            predictions.map(p => (
              <tr key={p.id}>
                <td className="border border-gray-300 px-3 py-2">{p.prediction}</td>
                <td className="border border-gray-300 px-3 py-2">{p.timeframe ?? ''}</td>
                <td className="border border-gray-300 px-3 py-2">{p.verificationMethod ?? ''}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="border border-gray-300 px-3 py-2 text-[var(--muted-foreground)]">&nbsp;</td>
              <td className="border border-gray-300 px-3 py-2 text-[var(--muted-foreground)]">&nbsp;</td>
              <td className="border border-gray-300 px-3 py-2 text-[var(--muted-foreground)]">&nbsp;</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}
