import { NextResponse } from 'next/server'
import {
  fetchFilteredBeliefs,
  type BeliefFilterParams,
} from '@/features/belief-analysis/data/fetch-belief'
import {
  toSpectrumCoordinates,
  fromValenceCoord,
  fromSpecificityCoord,
  fromIntensityCoord,
} from '@/features/belief-analysis/spectrum-coordinates'

/**
 * GET /api/beliefs
 *
 * The spectrum-query surface from /One Page Per Belief: Technical Specification (&sect;5).
 *
 * Query params (all optional; missing means "no bound on this axis"):
 *   valenceMin, valenceMax           — integers in -5..+5
 *   specificityMin, specificityMax   — integers in 1..10
 *   intensityMin, intensityMax       — integers in 1..5
 *   category                         — exact-match category string
 *   sortBy                           — 'valence' | 'specificity' | 'intensity' | 'statement' | 'updated' (default 'valence')
 *   sortDir                          — 'asc' | 'desc' (default 'asc' so the default sort goes negative → positive)
 *   limit                            — max rows to return
 *
 * Response: { beliefs: [&lt;spec shape&gt;] } where each entry follows &sect;1 of the spec
 * (belief_id, canonical_text, spectrum_coordinates, parent_topic_id).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const sp = url.searchParams

  const parseInt10 = (key: string): number | undefined => {
    const raw = sp.get(key)
    if (raw === null || raw === '') return undefined
    const n = parseInt(raw, 10)
    return Number.isFinite(n) ? n : undefined
  }

  const valenceMin = parseInt10('valenceMin')
  const valenceMax = parseInt10('valenceMax')
  const specificityMin = parseInt10('specificityMin')
  const specificityMax = parseInt10('specificityMax')
  const intensityMin = parseInt10('intensityMin')
  const intensityMax = parseInt10('intensityMax')

  const filters: BeliefFilterParams = {
    ...(valenceMin !== undefined ? { positivityMin: fromValenceCoord(valenceMin) } : {}),
    ...(valenceMax !== undefined ? { positivityMax: fromValenceCoord(valenceMax) } : {}),
    ...(specificityMin !== undefined ? { specificityMin: fromSpecificityCoord(specificityMin) } : {}),
    ...(specificityMax !== undefined ? { specificityMax: fromSpecificityCoord(specificityMax) } : {}),
    ...(intensityMin !== undefined ? { claimStrengthMin: fromIntensityCoord(intensityMin) } : {}),
    ...(intensityMax !== undefined ? { claimStrengthMax: fromIntensityCoord(intensityMax) } : {}),
  }

  const category = sp.get('category')
  if (category) filters.category = category

  const sortByMap: Record<string, BeliefFilterParams['sortBy']> = {
    valence: 'positivity',
    specificity: 'specificity',
    intensity: 'claimStrength',
    statement: 'statement',
    updated: 'updatedAt',
  }
  const sortByKey = sp.get('sortBy') ?? 'valence'
  filters.sortBy = sortByMap[sortByKey] ?? 'positivity'
  filters.sortDir = sp.get('sortDir') === 'desc' ? 'desc' : 'asc'

  const limitRaw = parseInt10('limit')
  if (limitRaw !== undefined && limitRaw > 0) {
    filters.limit = Math.min(limitRaw, 500)
  }

  const beliefs = await fetchFilteredBeliefs(filters)

  return NextResponse.json({
    beliefs: beliefs.map(b => ({
      belief_id: String(b.id),
      canonical_text: b.statement,
      spectrum_coordinates: toSpectrumCoordinates({
        positivity: b.positivity,
        specificity: b.specificity,
        claimStrength: b.claimStrength,
      }),
      parent_topic_id: b.category ?? null,
      slug: b.slug,
    })),
    count: beliefs.length,
  })
}
