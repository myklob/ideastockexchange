import Link from 'next/link'
import {
  fetchFilteredBeliefs,
  fetchBeliefCategories,
  type BeliefFilterParams,
} from '@/features/belief-analysis/data/fetch-belief'
import { getStrengthBand, formatStrength } from '@/core/scoring/claim-strength'

interface BeliefsPageSearchParams {
  valence?: string       // 'all' | 'extreme-neg' | 'mild-neg' | 'neutral' | 'mild-pos' | 'extreme-pos'
  specificity?: string   // 'all' | 'general' | 'case-level' | 'specific'
  intensity?: string     // 'all' | 'weak' | 'moderate' | 'strong' | 'extreme'
  category?: string      // 'all' | <category name>
  sort?: string          // 'valence' | 'specificity' | 'intensity' | 'statement'
  dir?: string           // 'asc' | 'desc'
}

interface BeliefsIndexProps {
  searchParams: Promise<BeliefsPageSearchParams>
}

const VALENCE_BUCKETS: Record<string, { min: number; max: number; label: string }> = {
  'extreme-neg': { min: -100, max: -60, label: 'Extremely Negative' },
  'mild-neg':    { min: -60,  max: -20, label: 'Mildly Negative' },
  'neutral':     { min: -20,  max:  20, label: 'Neutral' },
  'mild-pos':    { min:  20,  max:  60, label: 'Mildly Positive' },
  'extreme-pos': { min:  60,  max: 100, label: 'Extremely Positive' },
}

const SPECIFICITY_BUCKETS: Record<string, { min: number; max: number; label: string }> = {
  general:      { min: 0,    max: 0.33, label: 'General Principle' },
  'case-level': { min: 0.33, max: 0.66, label: 'Case-Level' },
  specific:     { min: 0.66, max: 1.0,  label: 'Specific Instance' },
}

const INTENSITY_BUCKETS: Record<string, { min: number; max: number; label: string }> = {
  weak:     { min: 0,    max: 0.35, label: 'Weak' },
  moderate: { min: 0.35, max: 0.65, label: 'Moderate' },
  strong:   { min: 0.65, max: 0.9,  label: 'Strong' },
  extreme:  { min: 0.9,  max: 1.0,  label: 'Extreme' },
}

function paramsToFilters(p: BeliefsPageSearchParams): BeliefFilterParams {
  const filters: BeliefFilterParams = {}

  if (p.valence && p.valence !== 'all') {
    const bucket = VALENCE_BUCKETS[p.valence]
    if (bucket) {
      filters.positivityMin = bucket.min
      filters.positivityMax = bucket.max
    }
  }
  if (p.specificity && p.specificity !== 'all') {
    const bucket = SPECIFICITY_BUCKETS[p.specificity]
    if (bucket) {
      filters.specificityMin = bucket.min
      filters.specificityMax = bucket.max
    }
  }
  if (p.intensity && p.intensity !== 'all') {
    const bucket = INTENSITY_BUCKETS[p.intensity]
    if (bucket) {
      filters.claimStrengthMin = bucket.min
      filters.claimStrengthMax = bucket.max
    }
  }
  if (p.category && p.category !== 'all') {
    filters.category = p.category
  }

  const sortMap: Record<string, BeliefFilterParams['sortBy']> = {
    valence: 'positivity',
    specificity: 'specificity',
    intensity: 'claimStrength',
    statement: 'statement',
    updated: 'updatedAt',
  }
  filters.sortBy = sortMap[p.sort ?? ''] ?? 'positivity'
  filters.sortDir = p.dir === 'desc' ? 'desc' : 'asc'

  return filters
}

function valenceLabel(positivity: number): string {
  if (positivity >= 60) return 'Extremely Positive'
  if (positivity >= 20) return 'Mildly Positive'
  if (positivity > -20) return 'Neutral'
  if (positivity > -60) return 'Mildly Negative'
  return 'Extremely Negative'
}

function specificityLabel(specificity: number): string {
  if (specificity < 0.33) return 'General'
  if (specificity < 0.66) return 'Case-Level'
  return 'Specific'
}

export default async function BeliefsIndexPage({ searchParams }: BeliefsIndexProps) {
  const params = await searchParams
  const filters = paramsToFilters(params)
  const [beliefs, categories] = await Promise.all([
    fetchFilteredBeliefs(filters),
    fetchBeliefCategories(),
  ])

  const activeValence = params.valence ?? 'all'
  const activeSpecificity = params.specificity ?? 'all'
  const activeIntensity = params.intensity ?? 'all'
  const activeCategory = params.category ?? 'all'
  const activeSort = params.sort ?? 'valence'
  const activeDir = params.dir === 'desc' ? 'desc' : 'asc'

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-sm font-medium text-[var(--foreground)]">All Beliefs</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Belief Analysis Pages</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Every belief is a coordinate on three spectrums:{' '}
          <strong>Valence</strong> (negative ↔ positive),{' '}
          <strong>Specificity</strong> (general ↔ specific), and{' '}
          <strong>Intensity</strong> (weak ↔ extreme). Filter or re-sort below to navigate the space.
        </p>

        <form
          method="get"
          className="border border-[var(--border)] rounded p-3 mb-6 bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm"
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Valence</span>
            <select name="valence" defaultValue={activeValence} className="border border-gray-300 rounded px-2 py-1 bg-white">
              <option value="all">All</option>
              {Object.entries(VALENCE_BUCKETS).map(([key, b]) => (
                <option key={key} value={key}>{b.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Specificity</span>
            <select name="specificity" defaultValue={activeSpecificity} className="border border-gray-300 rounded px-2 py-1 bg-white">
              <option value="all">All</option>
              {Object.entries(SPECIFICITY_BUCKETS).map(([key, b]) => (
                <option key={key} value={key}>{b.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Intensity</span>
            <select name="intensity" defaultValue={activeIntensity} className="border border-gray-300 rounded px-2 py-1 bg-white">
              <option value="all">All</option>
              {Object.entries(INTENSITY_BUCKETS).map(([key, b]) => (
                <option key={key} value={key}>{b.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Category</span>
            <select name="category" defaultValue={activeCategory} className="border border-gray-300 rounded px-2 py-1 bg-white">
              <option value="all">All</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Sort by</span>
            <select name="sort" defaultValue={activeSort} className="border border-gray-300 rounded px-2 py-1 bg-white">
              <option value="valence">Valence</option>
              <option value="specificity">Specificity</option>
              <option value="intensity">Intensity</option>
              <option value="statement">Statement</option>
              <option value="updated">Recently updated</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Direction</span>
            <select name="dir" defaultValue={activeDir} className="border border-gray-300 rounded px-2 py-1 bg-white">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
          <div className="md:col-span-3 flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--muted-foreground)]">
              {beliefs.length} {beliefs.length === 1 ? 'belief' : 'beliefs'} match
            </span>
            <div className="flex gap-2">
              <Link
                href="/beliefs"
                className="text-xs text-[var(--accent)] hover:underline"
              >
                Reset
              </Link>
              <button
                type="submit"
                className="bg-[var(--accent)] text-white text-sm font-medium px-3 py-1 rounded hover:opacity-90"
              >
                Apply
              </button>
            </div>
          </div>
        </form>

        {beliefs.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            <p className="text-lg mb-2">No beliefs match these filters.</p>
            <p className="text-sm">Try widening one of the spectrums above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {beliefs.map(belief => {
              const band = getStrengthBand(belief.claimStrength)
              return (
                <Link
                  key={belief.id}
                  href={`/beliefs/${belief.slug}`}
                  className="block bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-[var(--foreground)] mb-1">{belief.statement}</h2>
                      <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
                        {belief.category && <span>{belief.category}</span>}
                        {belief.subcategory && <span>&gt; {belief.subcategory}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded border border-gray-300 bg-white font-mono">
                          Valence:{' '}
                          <strong>
                            {belief.positivity >= 0 ? '+' : ''}{belief.positivity.toFixed(0)}
                          </strong>{' '}
                          ({valenceLabel(belief.positivity)})
                        </span>
                        <span className="px-1.5 py-0.5 rounded border border-gray-300 bg-white font-mono">
                          Specificity: <strong>{specificityLabel(belief.specificity)}</strong>
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded border border-gray-300 font-mono"
                          style={{ backgroundColor: band.hexColor }}
                        >
                          Intensity: <strong>{band.label}</strong> ({formatStrength(belief.claimStrength)})
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className={`text-sm font-bold ${belief.positivity >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {belief.positivity >= 0 ? '+' : ''}{belief.positivity.toFixed(0)}%
                      </span>
                      <div className="text-xs text-[var(--muted-foreground)]">positivity</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
