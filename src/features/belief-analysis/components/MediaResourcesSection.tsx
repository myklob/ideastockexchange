import Link from 'next/link'
import type { MediaItem } from '../types'
import { formatScore, pairBySide, rankByScore, TABLE_TOP_LIMIT } from '../lib/ranking'
import ExpandableRows from './ExpandableRows'

interface MediaResourcesSectionProps {
  media: MediaItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

function typeLabel(mediaType: string): string {
  return mediaType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function MediaCell({ m }: { m: MediaItem | null }) {
  if (!m) return <span>&nbsp;</span>
  return (
    <>
      {m.url ? (
        <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
          {m.title}
        </a>
      ) : (
        m.title
      )}
      {(m.author || m.year) && (
        <span className="text-[var(--muted-foreground)]">
          {' '}({[m.author, m.year].filter(Boolean).join(', ')})
        </span>
      )}
    </>
  )
}

function MediaPairRow({ s, c }: { s: MediaItem | null; c: MediaItem | null }) {
  return (
    <tr>
      <td className={TD}><MediaCell m={s} /></td>
      <td className={TDC}>{s ? typeLabel(s.mediaType) : <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{s ? formatScore(s.impactScore) : <span>&nbsp;</span>}</td>
      <td className={TD}><MediaCell m={c} /></td>
      <td className={TDC}>{c ? typeLabel(c.mediaType) : <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{c ? formatScore(c.impactScore) : <span>&nbsp;</span>}</td>
    </tr>
  )
}

export default function MediaResourcesSection({ media }: MediaResourcesSectionProps) {
  const supporting = rankByScore(
    media.filter(m => m.side === 'supporting' || m.side === 'agree'),
    m => m.impactScore,
    Infinity,
  ).top
  const challenging = rankByScore(
    media.filter(m => m.side === 'opposing' || m.side === 'weakening' || m.side === 'disagree'),
    m => m.impactScore,
    Infinity,
  ).top
  const pairs = pairBySide(supporting, challenging)
  const topPairs = pairs.length > 0 ? pairs.slice(0, TABLE_TOP_LIMIT) : [[null, null] as [MediaItem | null, MediaItem | null]]
  const restPairs = pairs.slice(TABLE_TOP_LIMIT)

  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
        <span>&#128218;</span>
        <Link href="/media" className="text-[var(--accent)] hover:underline">Media Resources</Link>
      </h2>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-green-100 text-center font-semibold px-3 py-2" colSpan={3}>
              Supporting the Belief
            </th>
            <th className="border border-gray-300 bg-red-100 text-center font-semibold px-3 py-2" colSpan={3}>
              Challenging or Complicating the Belief
            </th>
          </tr>
          <tr className="bg-gray-100 text-xs">
            <th className={`${TH} w-[30%]`}>Resource (Author, Year)</th>
            <th className={`${TH} text-center w-[12%]`}>Type</th>
            <th className={`${TH} text-center w-[8%]`}>Score</th>
            <th className={`${TH} w-[30%]`}>Resource (Author, Year)</th>
            <th className={`${TH} text-center w-[12%]`}>Type</th>
            <th className={`${TH} text-center w-[8%]`}>Score</th>
          </tr>
        </thead>
        <tbody>
          {topPairs.map(([s, c], i) => (
            <MediaPairRow key={s?.id ?? c?.id ?? i} s={s} c={c} />
          ))}
          <ExpandableRows moreCount={restPairs.length} colSpan={6}>
            {restPairs.map(([s, c], i) => (
              <MediaPairRow key={s?.id ?? c?.id ?? i} s={s} c={c} />
            ))}
          </ExpandableRows>
        </tbody>
      </table>
    </section>
  )
}
