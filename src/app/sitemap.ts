import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://ideastockexchange.vercel.app'

const STATIC_PATHS = ['', '/beliefs', '/topics', '/demo', '/how-it-works', '/contribute', '/conversations', '/algorithms', '/faq']

/** Public pages: every belief page and topic hub, plus the fixed entry points. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [beliefs, topics] = await Promise.all([
    prisma.belief.findMany({ select: { slug: true, updatedAt: true }, orderBy: { id: 'asc' } }),
    prisma.topic.findMany({ select: { slug: true, updatedAt: true } }),
  ])
  return [
    ...STATIC_PATHS.map(path => ({ url: `${SITE_URL}${path}`, changeFrequency: 'daily' as const })),
    ...beliefs.map(b => ({ url: `${SITE_URL}/beliefs/${b.slug}`, lastModified: b.updatedAt, changeFrequency: 'weekly' as const })),
    ...topics.map(t => ({ url: `${SITE_URL}/topics/${t.slug}`, lastModified: t.updatedAt, changeFrequency: 'weekly' as const })),
  ]
}
