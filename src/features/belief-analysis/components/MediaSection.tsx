import Link from 'next/link'
import type { MediaItem } from '../types'
import SectionHeading from './SectionHeading'

interface MediaSectionProps {
  media: MediaItem[]
}

const MEDIA_TYPES = ['book', 'article', 'podcast', 'movie', 'song', 'poem', 'image', 'scientific_paper'] as const

const TYPE_LABELS: Record<string, string> = {
  book: 'Books',
  article: 'Articles',
  podcast: 'Podcasts',
  movie: 'Movies',
  song: 'Songs',
  poem: 'Poems',
  image: 'Images',
  scientific_paper: 'Scientific Papers',
}

const TYPE_LINKS: Record<string, string> = {
  book: '/Books',
  podcast: '/Podcasts',
  movie: '/Movies',
  song: '/Songs%20that%20agree',
}

function formatReach(reach: number): string {
  if (reach >= 1_000_000_000) return `${(reach / 1_000_000_000).toFixed(1)}B`
  if (reach >= 1_000_000) return `${(reach / 1_000_000).toFixed(1)}M`
  if (reach >= 1_000) return `${(reach / 1_000).toFixed(1)}K`
  if (reach > 0) return String(reach)
  return ''
}

function scoreColor(score: number): string {
  if (score >= 0.7) return 'text-green-700'
  if (score >= 0.4) return 'text-orange-600'
  return 'text-red-700'
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
                    <Link href={`/media/${m.id}`} className="text-[var(--accent)] hover:underline">
                      {m.title}
                    </Link>
                    {m.author && <span className="text-[var(--muted-foreground)]"> by {m.author}</span>}
                    {m.reach > 0 && (
                      <span className="text-xs text-[var(--muted-foreground)] ml-1">
                        (reach: {formatReach(m.reach)})
                      </span>
                    )}
                    {m.qualityScore > 0 && (
                      <span className={`text-xs ml-1 font-semibold ${scoreColor(m.qualityScore)}`}>
                        Q:{m.qualityScore.toFixed(2)}
                      </span>
                    )}
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
        subtitle="Each media item has its own page with belief arguments and quality analysis"
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

      {/* Link to why we track media */}
      <p className="text-xs text-[var(--muted-foreground)] mt-2">
        <Link href="/media/why-pro-con-media" className="text-[var(--accent)] hover:underline">
          Why do we track pro/con media per belief?
        </Link>
      </p>
    </section>
  )
}
