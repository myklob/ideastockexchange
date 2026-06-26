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
 *
 * The Arguments-vs-Evidence, Evidence Tiers, and Scoring Concepts prose
 * below is canonical — mirrored in templates/belief-analysis-template.html
 * and docs/BELIEF_PAGE_RULES.md. Keep the three in sync.
 */
export default function DefinitionsSection({ definitions }: DefinitionsSectionProps) {
  return (
    <section>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
        📖 Definitions and Scoring Concepts
      </h1>
      <div className="text-sm text-[var(--foreground)] space-y-3 mb-5">
        <p>
          <strong>Arguments vs. Evidence.</strong>{' '}
          <Link href="/algorithms/reason-rank" className="text-[var(--accent)] hover:underline">Arguments</Link>{' '}
          are logical claims — scored by logical validity and{' '}
          <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">linkage strength</Link>.{' '}
          Evidence is empirical data — scored by source tier and conclusion relevance. The scoring
          formula is <em>Argument Score = Evidence Quality x Logical Validity x Linkage Strength</em>.
          An argument with great evidence but a logical fallacy still scores low. Evidence
          attached to the wrong argument contributes almost nothing even if the data is
          impeccable. Both layers are required.
        </p>
        <p>
          <strong>Evidence Tiers.</strong> T1 = peer-reviewed / official data.
          T2 = expert analysis / institutional reports. T3 = investigative journalism / surveys.
          T4 = opinion / anecdotal. Tier is set by the underlying source, not the format — a
          meme visualizing a T1 study is T1. A pundit asserting a claim is T4 at best, and is
          an argument, not evidence.
        </p>
        <p>
          <strong>Scoring Concepts.</strong>{' '}
          Argument Scores are computed recursively — never manually assigned.{' '}
          Truth Scores integrate validity, evidence, and linkage.{' '}
          Importance Scores weight arguments by how much they move the needle.{' '}
          <Link href="/algorithms/reason-rank" className="text-[var(--accent)] hover:underline">ReasonRank</Link>{' '}
          sorts by quality, not volume or recency.
        </p>
      </div>
      <p className="text-sm text-[var(--muted-foreground)] mb-2">Page-specific terminology:</p>
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
