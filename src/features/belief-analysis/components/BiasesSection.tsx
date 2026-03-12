import type { BiasItem } from '../types'
import SectionHeading from './SectionHeading'

interface BiasesSectionProps {
  biases: BiasItem[]
}

function formatBiasType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function BiasesSection({ biases }: BiasesSectionProps) {
  const supporterBiases = biases.filter(b => b.side === 'supporter')
  const opponentBiases = biases.filter(b => b.side === 'opponent')

  return (
    <section>
      <SectionHeading
        emoji="&#x1F9E0;"
        title="Biases"
        href="/bias"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Affecting Supporters</th>
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Affecting Opponents</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 align-top text-sm">
                {supporterBiases.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {supporterBiases.map(b => (
                      <li key={b.id}>
                        <strong>{formatBiasType(b.biasType)}</strong>
                        {b.description && <span className="text-[var(--muted-foreground)]"> - {b.description}</span>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="text-[var(--muted-foreground)]">
                    <p>1. Confirmation bias?</p>
                    <p>2. Motivated reasoning?</p>
                    <p>3. Availability heuristic?</p>
                  </div>
                )}
              </td>
              <td className="px-3 py-3 align-top text-sm">
                {opponentBiases.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {opponentBiases.map(b => (
                      <li key={b.id}>
                        <strong>{formatBiasType(b.biasType)}</strong>
                        {b.description && <span className="text-[var(--muted-foreground)]"> - {b.description}</span>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="text-[var(--muted-foreground)]">
                    <p>1. Confirmation bias?</p>
                    <p>2. Motivated reasoning?</p>
                    <p>3. Availability heuristic?</p>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
