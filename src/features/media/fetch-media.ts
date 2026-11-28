import { prisma } from '@/lib/prisma'
import type { MediaItem } from '@/features/belief-analysis/types'
import {
  epistemicImpact,
  mediaTruthScore,
  resolveGenreType,
  signedTruthFromPositivity,
  type MediaTruthResult,
} from '@/core/scoring/media-truth'

/** One extracted claim with the belief page that evaluates it. */
export interface MediaClaimWithBelief {
  id: number
  claimText: string
  /** Centrality (0-1): how central the claim is to this work's message. */
  linkageScore: number
  sortOrder: number
  /** Null while the claim awaits linking — it contributes nothing until then. */
  belief: {
    id: number
    slug: string
    statement: string
    positivity: number
  } | null
}

export interface MediaWithBelief extends MediaItem {
  belief: {
    id: number
    slug: string
    statement: string
    category: string | null
  }
  claims: MediaClaimWithBelief[]
}

// Mutable object (not `as const`) because Prisma's orderBy input types
// reject readonly tuples.
const MEDIA_INCLUDE = {
  belief: {
    select: { id: true, slug: true, statement: true, category: true },
  },
  qualityArguments: {
    orderBy: { impactScore: 'desc' as const },
  },
  // The claim ledger, centrality first — the source of the signed score.
  claims: {
    include: {
      belief: { select: { id: true, slug: true, statement: true, positivity: true } },
    },
    orderBy: [{ linkageScore: 'desc' as const }, { sortOrder: 'asc' as const }],
  },
}

/** Fetch all media resources with their linked beliefs and claim ledgers */
export async function fetchAllMedia(): Promise<MediaWithBelief[]> {
  const media = await prisma.mediaResource.findMany({
    include: MEDIA_INCLUDE,
    orderBy: { reach: 'desc' },
  })

  return media as unknown as MediaWithBelief[]
}

/** Fetch a single media resource by ID with all related data */
export async function fetchMediaById(id: number): Promise<MediaWithBelief | null> {
  const media = await prisma.mediaResource.findUnique({
    where: { id },
    include: MEDIA_INCLUDE,
  })

  return media as unknown as MediaWithBelief | null
}

/** The signed truth (-1..+1) of one claim, from its belief's engine net. */
export function claimSignedTruth(claim: MediaClaimWithBelief): number | null {
  if (!claim.belief) return null
  return signedTruthFromPositivity(claim.belief.positivity)
}

/**
 * The work's signed Media Truth Score (-1..+1): the centrality-weighted
 * average of its claims' signed truths, or the genre prior until claims are
 * extracted and linked. Canonical math: src/core/scoring/media-truth.ts.
 */
export function resolveMediaTruth(media: MediaWithBelief): MediaTruthResult {
  return mediaTruthScore(
    (media.claims ?? []).map(c => ({
      signedTruth: claimSignedTruth(c),
      linkage: c.linkageScore,
    })),
    resolveGenreType(media.genreType, media.mediaType),
  )
}

/**
 * Epistemic impact for a media item: signed Media Truth Score × reach.
 * Signed on purpose — wrong-and-viral is a large negative number, not a
 * neutral one.
 */
export function computeEpistemicImpact(media: MediaWithBelief): number {
  return epistemicImpact(resolveMediaTruth(media).score, media.reach)
}

/** Format reach as human-readable string (e.g. 50M, 2K) */
export function formatReach(reach: number): string {
  if (reach >= 1_000_000_000) return `${(reach / 1_000_000_000).toFixed(1)}B`
  if (reach >= 1_000_000) return `${(reach / 1_000_000).toFixed(1)}M`
  if (reach >= 1_000) return `${(reach / 1_000).toFixed(1)}K`
  return String(reach)
}

/** Format a signed epistemic impact (e.g. +4.3M, -1.7B, -450). */
export function formatEpistemicImpact(impact: number): string {
  const sign = impact > 0 ? '+' : impact < 0 ? '-' : ''
  return `${sign}${formatReach(Math.abs(Math.round(impact)))}`
}

/** Format a signed Media Truth Score for display (e.g. +0.85, -0.60). */
export function formatSignedScore(score: number): string {
  return `${score >= 0 ? '+' : ''}${score.toFixed(2)}`
}

/** Get display label for a media type */
export function getMediaTypeLabel(mediaType: string): string {
  const labels: Record<string, string> = {
    book: 'Book',
    article: 'Article',
    podcast: 'Podcast',
    movie: 'Film',
    song: 'Song',
    poem: 'Poem',
    image: 'Image',
    scientific_paper: 'Scientific Paper',
  }
  return labels[mediaType] || mediaType
}

/** Get emoji for a media type */
export function getMediaTypeEmoji(mediaType: string): string {
  const emojis: Record<string, string> = {
    book: '\u{1F4D6}',
    article: '\u{1F4F0}',
    podcast: '\u{1F3A7}',
    movie: '\u{1F3AC}',
    song: '\u{1F3B5}',
    poem: '\u{1F4DC}',
    image: '\u{1F5BC}',
    scientific_paper: '\u{1F52C}',
  }
  return emojis[mediaType] || '\u{1F4CB}'
}
