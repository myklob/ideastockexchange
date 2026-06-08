import Link from 'next/link'
import type { MediaItem } from '../types'

interface MediaResourcesSectionProps {
  media: MediaItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'

function MediaList({ items }: { items: MediaItem[] }) {
  const books = items.filter(m => m.mediaType === 'book')
  const other = items.filter(m => m.mediaType !== 'book')
  return (
    <>
      <strong><Link href="/Books" className="text-[var(--accent)] hover:underline">Books</Link></strong>
      <br />
      {books.length > 0 ? (
        books.map(m => (
          <span key={m.id} className="block">
            {m.url ? (
              <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">{m.title}</a>
            ) : m.title}
            {m.author && <span className="text-[var(--muted-foreground)]"> — {m.author}</span>}
          </span>
        ))
      ) : (
        <span>&nbsp;</span>
      )}
      {other.length > 0 && (
        <div className="mt-2">
          {other.map(m => (
            <span key={m.id} className="block">
              <span className="capitalize text-[var(--muted-foreground)]">{m.mediaType.replace(/_/g, ' ')}: </span>
              {m.url ? (
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">{m.title}</a>
              ) : m.title}
              {m.author && <span className="text-[var(--muted-foreground)]"> — {m.author}</span>}
            </span>
          ))}
        </div>
      )}
    </>
  )
}

export default function MediaResourcesSection({ media }: MediaResourcesSectionProps) {
  const supporting = media.filter(m => m.side === 'supporting' || m.side === 'agree')
  const challenging = media.filter(m => m.side === 'opposing' || m.side === 'weakening' || m.side === 'disagree')

  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
        <span>&#128218;</span>
        <Link href="/media" className="text-[var(--accent)] hover:underline">Media Resources</Link>
      </h2>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className={`${TH} w-1/2`}>Supporting the Belief</th>
            <th className={`${TH} w-1/2`}>Challenging or Complicating the Belief</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={TD}><MediaList items={supporting} /></td>
            <td className={TD}><MediaList items={challenging} /></td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
