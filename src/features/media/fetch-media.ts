import { prisma } from '@/lib/prisma'
import type { MediaItem, MediaQualityArgumentItem } from '@/features/belief-analysis/types'

export interface MediaWithBelief extends MediaItem {
  belief: {
    id: number
    slug: string
    statement: string
    category: string | null
  }
}

/** Fetch all media resources with their linked beliefs */
export async function fetchAllMedia(): Promise<MediaWithBelief[]> {
  const media = await prisma.mediaResource.findMany({
    include: {
      belief: {
        select: { id: true, slug: true, statement: true, category: true },
      },
      qualityArguments: {
        orderBy: { impactScore: 'desc' },
      },
    },
    orderBy: { reach: 'desc' },
  })

  return media as unknown as MediaWithBelief[]
}

/** Fetch a single media resource by ID with all related data */
export async function fetchMediaById(id: number): Promise<MediaWithBelief | null> {
  const media = await prisma.mediaResource.findUnique({
    where: { id },
    include: {
      belief: {
        select: { id: true, slug: true, statement: true, category: true },
      },
      qualityArguments: {
        orderBy: { impactScore: 'desc' },
      },
    },
  })

  return media as unknown as MediaWithBelief | null
}

/** Compute epistemic impact for a media item: truthScore × reach */
export function computeEpistemicImpact(media: MediaItem): number {
  return media.truthScore * media.reach
}

/** Format reach as human-readable string (e.g. 50M, 2K) */
export function formatReach(reach: number): string {
  if (reach >= 1_000_000_000) return `${(reach / 1_000_000_000).toFixed(1)}B`
  if (reach >= 1_000_000) return `${(reach / 1_000_000).toFixed(1)}M`
  if (reach >= 1_000) return `${(reach / 1_000).toFixed(1)}K`
  return String(reach)
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
