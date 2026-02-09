import type { CompromiseItem } from '../types'
import SectionHeading from './SectionHeading'

interface CompromisesSectionProps {
  compromises: CompromiseItem[]
}

export default function CompromisesSection({ compromises }: CompromisesSectionProps) {
  return (
    <section>
      <SectionHeading
        emoji="&#x1F91D;"
        title="Best Compromise Solutions"
        href="/Compromise"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-blue-50">
              <th className="px-3 py-2 text-left font-semibold">Solutions Addressing Core Concerns</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 text-sm">
                {compromises.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-2">
                    {compromises.map(c => (
                      <li key={c.id}>{c.description}</li>
                    ))}
                  </ol>
                ) : (
                  <div className="space-y-1 text-[var(--muted-foreground)]">
                    <p>1. How could we address both sides' core interests?</p>
                    <p>2. What creative solutions haven't been tried?</p>
                    <p>3. What partial implementations could test ideas?</p>
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
