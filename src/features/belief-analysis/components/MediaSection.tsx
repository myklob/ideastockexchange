import Link from 'next/link'
import type { MediaItem } from '../types'
import SectionHeading from './SectionHeading'

interface MediaSectionProps {
  media: MediaItem[]
}

const MEDIA_TYPES = ['book', 'article', 'podcast', 'movie', 'song'] as const

const TYPE_LABELS: Record<string, string> = {
  book: 'Books',
  article: 'Articles',
  podcast: 'Podcasts',
  movie: 'Movies',
  song: 'Songs',
}

const TYPE_LINKS: Record<string, string> = {
  book: '/Books',
  podcast: '/Podcasts',
  movie: '/Movies',
  song: '/Songs%20that%20agree',
}

function MediaList({ items, side }: { items: MediaItem[]; side: string }) {
  const filtered = items.filter(m => m.side === side)

  return (
    <div className="space-y-3">
      {MEDIA_TYPES.map(type => {
        const typeItems = filtered.filter(m => m.mediaType === type)
        const label = TYPE_LABELS[type]
        const link = TYPE_LINKS[type]

        return (
          <div key={type}>
            <strong>
              {link ? (
                <Link href={link} className="text-[var(--accent)] hover:underline">{label}</Link>
              ) : (
                label
              )}
            </strong>
            <br />
            {typeItems.length > 0 ? (
              <ol className="list-decimal list-inside">
                {typeItems.map(m => (
                  <li key={m.id} className="text-sm">
                    {m.url ? (
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                        {m.title}
                      </a>
                    ) : (
                      m.title
                    )}
                    {m.author && <span className="text-[var(--muted-foreground)]"> by {m.author}</span>}
                  </li>
                ))}
              </ol>
            ) : (
              <span className="text-sm text-[var(--muted-foreground)] italic">None yet</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function MediaSection({ media }: MediaSectionProps) {
  return (
    <section>
      <SectionHeading
        emoji="&#x1F4DA;"
        title="Media Resources"
        href="/media"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 text-center w-1/2 font-semibold bg-green-50">Supporting</th>
              <th className="px-3 py-2 text-center w-1/2 font-semibold bg-red-50">Opposing</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 align-top"><MediaList items={media} side="supporting" /></td>
              <td className="px-3 py-3 align-top"><MediaList items={media} side="opposing" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
