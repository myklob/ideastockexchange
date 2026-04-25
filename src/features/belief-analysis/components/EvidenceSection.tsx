import Link from 'next/link'
import type { EvidenceItem, MediaItem } from '../types'
import SectionHeading from './SectionHeading'

interface EvidenceSectionProps {
  evidence: EvidenceItem[]
  totalSupporting: number
  totalWeakening: number
  /**
   * Media items render in the Visual and Video Evidence sub-table per the new
   * canonical template — they are evidence, tiered by underlying source. The
   * separate Media Resources section is gone.
   */
  media?: MediaItem[]
}

function tierBadge(type: string): React.ReactNode {
  const styles: Record<string, string> = {
    T1: 'bg-green-100 text-green-800',
    T2: 'bg-blue-100 text-blue-800',
    T3: 'bg-yellow-100 text-yellow-800',
    T4: 'bg-red-100 text-red-800',
  }
  const label = ['T1', 'T2', 'T3', 'T4'].includes(type) ? type : 'T?'
  const color = styles[label] ?? 'bg-gray-100 text-gray-800'
  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${color}`}>
      {label}
    </span>
  )
}

function stanceLabel(side: string): string {
  if (side === 'supporting') return 'Supports'
  if (side === 'weakening') return 'Weakens'
  return side
}

function linkagePct(score: number | null | undefined): string {
  if (score == null) return ''
  return `${Math.round(score * 100)}%`
}

const MEDIA_TYPE_GLYPHS: Record<string, string> = {
  image: '📊 Chart',
  scientific_paper: '📊 Chart',
  article: '📷 Photo',
  song: '🎭 Meme / Cartoon',
  poem: '🎭 Meme / Cartoon',
  movie: '🎥 Video / Documentary',
  podcast: '🎥 Video / Documentary',
  book: '📚 Book',
}

function mediaTypeGlyph(mediaType: string): string {
  return MEDIA_TYPE_GLYPHS[mediaType] ?? `📄 ${mediaType.replace(/_/g, ' ')}`
}

function mediaToTier(m: MediaItem): string {
  // Underlying source determines tier per Rule 4 / Evidence Tiers.
  if (m.reliabilityTier && /^T[1-4]$/.test(m.reliabilityTier)) return m.reliabilityTier
  // Fallback by genre
  switch (m.genreType) {
    case 'peer_reviewed': return 'T1'
    case 'expert_analysis':
    case 'institutional_report': return 'T2'
    case 'news_report':
    case 'survey': return 'T3'
    default: return 'T4'
  }
}

export default function EvidenceSection({
  evidence,
  totalSupporting,
  totalWeakening,
  media = [],
}: EvidenceSectionProps) {
  const sortedEvidence = [...evidence].sort((a, b) => {
    // T1 first, then T2 ... within tier sort by side (supporting first)
    const tierOrder: Record<string, number> = { T1: 1, T2: 2, T3: 3, T4: 4 }
    const at = tierOrder[a.evidenceType] ?? 5
    const bt = tierOrder[b.evidenceType] ?? 5
    if (at !== bt) return at - bt
    if (a.side !== b.side) return a.side === 'supporting' ? -1 : 1
    return Math.abs(b.impactScore) - Math.abs(a.impactScore)
  })

  return (
    <section>
      <SectionHeading
        emoji="&#x1F52C;"
        title="Evidence Ledger"
        href="/Evidence"
        subtitle="Evidence is empirical data: studies, statistics, records, observations, and media. Each item is tiered by source quality and linked to the specific argument it bears on."
      />
      <p className="text-xs text-[var(--muted-foreground)] mb-4">
        Tier reflects the underlying source, not the format — a meme visualizing a T1
        study is T1; a pundit asserting a claim is T4 at best, and is an argument, not
        evidence.{' '}
        <span className="italic">
          T1 = Peer-reviewed / Official, T2 = Expert / Institutional,
          T3 = Journalism / Surveys, T4 = Opinion / Anecdote.
        </span>
      </p>

      {/* 4a. Text and Data Sources */}
      <div className="mb-8">
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span>📄</span> Text and Data Sources
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-center w-[8%] font-semibold">Tier</th>
                <th className="px-3 py-2 text-left w-[40%] font-semibold">Source</th>
                <th className="px-3 py-2 text-center w-[10%] font-semibold">Stance</th>
                <th className="px-3 py-2 text-left w-[30%] font-semibold">Argument It Bears On</th>
                <th className="px-3 py-2 text-center w-[12%] font-semibold">
                  <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">
                    Linkage
                  </Link>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedEvidence.length > 0 ? (
                sortedEvidence.map(item => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-center align-top">{tierBadge(item.evidenceType)}</td>
                    <td className="px-3 py-3 align-top">
                      {item.sourceUrl ? (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:underline"
                        >
                          {item.description}
                        </a>
                      ) : (
                        item.description
                      )}
                    </td>
                    <td className="px-3 py-3 text-center align-top text-xs">{stanceLabel(item.side)}</td>
                    <td className="px-3 py-3 align-top text-xs text-[var(--muted-foreground)]">
                      {/* Argument linkage is encoded in linkageScore; the actual argument
                          this bears on lives on the argument page. */}
                      &mdash;
                    </td>
                    <td className="px-3 py-3 text-center align-top font-mono text-xs">
                      {linkagePct(item.linkageScore)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-sm text-[var(--muted-foreground)] italic">
                    No evidence submitted yet.
                  </td>
                </tr>
              )}
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={4} className="px-3 py-2 text-right text-sm">
                  Net Evidence Impact:
                </td>
                <td className="px-3 py-2 text-center text-sm font-mono">
                  <span className="text-green-700">+{totalSupporting.toFixed(1)}</span>
                  {' / '}
                  <span className="text-red-700">-{totalWeakening.toFixed(1)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4b. Visual and Video Evidence (formerly the Media Resources section) */}
      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span>📸</span> Visual and Video Evidence
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left w-[15%] font-semibold">Type</th>
                <th className="px-3 py-2 text-left w-[25%] font-semibold">Description</th>
                <th className="px-3 py-2 text-center w-[10%] font-semibold">Stance</th>
                <th className="px-3 py-2 text-left w-[18%] font-semibold">Source</th>
                <th className="px-3 py-2 text-center w-[8%] font-semibold">Tier</th>
                <th className="px-3 py-2 text-left w-[14%] font-semibold">Argument It Bears On</th>
                <th className="px-3 py-2 text-center w-[10%] font-semibold">
                  <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">
                    Linkage
                  </Link>
                </th>
              </tr>
            </thead>
            <tbody>
              {media.length > 0 ? (
                media.map(m => (
                  <tr key={m.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 align-top text-xs">{mediaTypeGlyph(m.mediaType)}</td>
                    <td className="px-3 py-3 align-top">
                      {m.url ? (
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:underline"
                        >
                          {m.title}
                        </a>
                      ) : (
                        m.title
                      )}
                      {m.author && (
                        <span className="text-xs text-[var(--muted-foreground)]"> — {m.author}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center align-top text-xs capitalize">
                      {m.side === 'agree' ? 'Supports' : m.side === 'disagree' ? 'Weakens' : m.side}
                    </td>
                    <td className="px-3 py-3 align-top text-xs text-[var(--muted-foreground)]">
                      {m.author ?? ''}
                    </td>
                    <td className="px-3 py-3 text-center align-top">{tierBadge(mediaToTier(m))}</td>
                    <td className="px-3 py-3 align-top text-xs text-[var(--muted-foreground)]">&mdash;</td>
                    <td className="px-3 py-3 text-center align-top font-mono text-xs">
                      {linkagePct(m.linkageScore)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 py-3 text-sm text-[var(--muted-foreground)] italic">
                    No visual or video evidence submitted yet. Charts, photos, memes, video,
                    and book imagery all belong here, tiered by underlying source.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
