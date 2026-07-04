const MAX_SLUG_LENGTH = 80

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (slug.length <= MAX_SLUG_LENGTH) return slug
  const cut = slug.slice(0, MAX_SLUG_LENGTH)
  const lastDash = cut.lastIndexOf('-')
  return lastDash > 40 ? cut.slice(0, lastDash) : cut
}

/** Readable statement for a stub belief created from a slug the agent named
 *  but the graph doesn't have yet. A human (or the agent) refines it later. */
export function deSlug(slug: string): string {
  const words = slug.replace(/-/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
