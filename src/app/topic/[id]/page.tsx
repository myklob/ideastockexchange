import { permanentRedirect } from 'next/navigation'

interface TopicRedirectProps {
  params: Promise<{ id: string }>
}

/**
 * The sample-data topic prototype lived here. Topic hubs are now
 * database-backed at /topics/[slug]; the seeded slugs match the old sample
 * ids, so old links land on the same topic.
 */
export default async function TopicRedirect({ params }: TopicRedirectProps) {
  const { id } = await params
  permanentRedirect(`/topics/${id}`)
}
