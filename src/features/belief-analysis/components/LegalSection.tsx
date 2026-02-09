import type { LegalItem } from '../types'
import SectionHeading from './SectionHeading'

interface LegalSectionProps {
  legal: LegalItem[]
}

export default function LegalSection({ legal }: LegalSectionProps) {
  const supporting = legal.filter(l => l.side === 'supporting')
  const contradicting = legal.filter(l => l.side === 'contradicting')

  return (
    <section>
      <SectionHeading
        emoji="&#x2696;&#xFE0F;"
        title="Legal Framework"
        href="/Local%2C%20federal%2C%20and%20international%20laws%20that%20agree"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Supporting Laws</th>
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Contradicting Laws</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 align-top text-sm">
                {supporting.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {supporting.map(l => (
                      <li key={l.id}>
                        {l.description}
                        {l.jurisdiction && (
                          <span className="ml-1 text-xs text-[var(--muted-foreground)]">({l.jurisdiction})</span>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="text-[var(--muted-foreground)]">
                    <p>1. Local, state, federal laws that support this</p>
                    <p>2. International treaties</p>
                  </div>
                )}
              </td>
              <td className="px-3 py-3 align-top text-sm">
                {contradicting.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {contradicting.map(l => (
                      <li key={l.id}>
                        {l.description}
                        {l.jurisdiction && (
                          <span className="ml-1 text-xs text-[var(--muted-foreground)]">({l.jurisdiction})</span>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="text-[var(--muted-foreground)]">
                    <p>1. Local, state, federal laws that contradict this</p>
                    <p>2. International treaties</p>
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
