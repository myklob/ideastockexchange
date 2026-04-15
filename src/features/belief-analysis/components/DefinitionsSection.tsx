import Link from 'next/link'
import type { DefinitionItem } from '../types'

interface DefinitionsSectionProps {
  definitions: DefinitionItem[]
}

/**
 * Per BELIEF_PAGE_RULES.md Rule 1, this section renders LAST — after every
 * scored analysis section and immediately before the Contribute footer.
 * Definitions are a footnote for readers who need them, not a tutorial that
 * pushes the argument network below the fold. Do not move this component
 * above the Argument Trees.
 */
export default function DefinitionsSection({ definitions }: DefinitionsSectionProps) {
  return (
    <section>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
        📖 Definitions and Scoring Concepts
      </h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        Terminology used on this page. For full definitions of scoring concepts
        (<Link href="/truth" className="text-[var(--accent)] hover:underline">Truth</Link>,{' '}
        <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">Linkage</Link>,{' '}
        <Link href="/Importance%20Score" className="text-[var(--accent)] hover:underline">Importance</Link>,{' '}
        <Link href="/Evidence" className="text-[var(--accent)] hover:underline">Evidence tiers</Link>),
        follow the link on each concept's own page.
      </p>
      <table className="w-full border-collapse text-sm" style={{ borderColor: '#cccccc' }}>
        <thead>
          <tr>
            <th className="border border-gray-300 px-3 py-2 text-center bg-gray-50 w-[30%]">Term</th>
            <th className="border border-gray-300 px-3 py-2 text-center bg-gray-50 w-[70%]">Definition Used in This Analysis</th>
          </tr>
        </thead>
        <tbody>
          {definitions.length > 0 ? (
            definitions.map(def => (
              <tr key={def.id}>
                <td className="border border-gray-300 px-3 py-2 font-medium">{def.term}</td>
                <td className="border border-gray-300 px-3 py-2">{def.definition}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="border border-gray-300 px-3 py-2 text-[var(--muted-foreground)] italic" colSpan={2}>
                No page-specific definitions yet. Contribute to clarify the terms this page uses.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}
