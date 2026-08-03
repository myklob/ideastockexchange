import Link from 'next/link'
import type { SiblingBeliefItem } from '../types'

interface RelatedTopicsSectionProps {
  category: string | null
  /** The category cluster, including this belief itself. */
  siblings: SiblingBeliefItem[]
  currentBeliefId: number
}

/**
 * The Related Topics footer: the sibling beliefs in this belief's category
 * cluster, linked, with the current page appearing as plain text, unlinked.
 * Renders nothing when the belief has no category or no siblings — empty
 * scaffolding is not analysis.
 */
export default function RelatedTopicsSection({
  category,
  siblings,
  currentBeliefId,
}: RelatedTopicsSectionProps) {
  const others = siblings.filter(s => s.id !== currentBeliefId)
  if (!category || others.length === 0) return null

  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
        <span>&#128279;</span> Related Topics
      </h2>
      <p className="text-sm mb-2">
        <Link
          href={`/beliefs?category=${encodeURIComponent(category)}`}
          className="text-[var(--accent)] hover:underline"
        >
          {category}
        </Link>{' '}
        / related beliefs{' '}
        <span className="text-[11px] text-[#999]">
          (the sibling beliefs in this cluster; the current page appears as plain text, unlinked)
        </span>
        :
      </p>
      <ol className="list-decimal list-inside text-sm space-y-1">
        {siblings.map(s =>
          s.id === currentBeliefId ? (
            <li key={s.id} className="text-[var(--muted-foreground)]">{s.statement}</li>
          ) : (
            <li key={s.id}>
              <Link href={`/beliefs/${s.slug}`} className="text-[var(--accent)] hover:underline">
                {s.statement}
              </Link>
            </li>
          ),
        )}
      </ol>
    </section>
  )
}
