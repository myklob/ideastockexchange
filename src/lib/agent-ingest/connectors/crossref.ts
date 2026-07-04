// CrossRef connector: DOI → bibliographic metadata. Used by the suggestion
// queue and the provenance-verification script. Suggestion-only by design —
// nothing here writes an Evidence row; acceptance is a separate, audited,
// validated move.

export interface CrossrefMetadata {
  doi: string
  title: string | null
  author: string | null
  publicationDate: string | null
  /** CrossRef work type, e.g. "journal-article", "book-chapter". */
  type: string | null
  containerTitle: string | null
  url: string | null
}

const CROSSREF_API = 'https://api.crossref.org/works/'

interface CrossrefAuthor { given?: string; family?: string }
interface CrossrefWork {
  DOI?: string
  title?: string[]
  author?: CrossrefAuthor[]
  issued?: { 'date-parts'?: number[][] }
  type?: string
  'container-title'?: string[]
  URL?: string
}

function formatAuthors(authors: CrossrefAuthor[] | undefined): string | null {
  if (!authors?.length) return null
  return authors
    .map(a => [a.given, a.family].filter(Boolean).join(' '))
    .filter(Boolean)
    .join('; ')
}

function formatDate(issued: CrossrefWork['issued']): string | null {
  const parts = issued?.['date-parts']?.[0]
  if (!parts?.length) return null
  const [y, m, d] = parts
  return [y, m, d]
    .filter((v): v is number => v !== undefined)
    .map((v, i) => (i === 0 ? String(v) : String(v).padStart(2, '0')))
    .join('-')
}

/** Look up a DOI on CrossRef. Returns null when the DOI does not resolve. */
export async function lookupDoi(doi: string): Promise<CrossrefMetadata | null> {
  const response = await fetch(CROSSREF_API + encodeURIComponent(doi.trim()), {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) return null
  const json = (await response.json()) as { message?: CrossrefWork }
  const work = json.message
  if (!work) return null
  return {
    doi: work.DOI ?? doi,
    title: work.title?.[0] ?? null,
    author: formatAuthors(work.author),
    publicationDate: formatDate(work.issued),
    type: work.type ?? null,
    containerTitle: work['container-title']?.[0] ?? null,
    url: work.URL ?? null,
  }
}

/**
 * Map a verified CrossRef work type to an evidence tier. This confirms
 * provenance metadata (tierVerified), which the engine may weight later —
 * it never writes a score.
 */
export function tierForCrossrefType(type: string | null): string | null {
  if (!type) return null
  if (type === 'journal-article' || type === 'proceedings-article') return 'T1'
  if (type === 'book' || type === 'book-chapter' || type === 'monograph' || type === 'report') return 'T2'
  return null
}
