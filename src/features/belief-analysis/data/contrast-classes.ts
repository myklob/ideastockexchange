import { prisma } from '@/lib/prisma'
import type { ContrastClassData, ContrastClassOption } from '../types'

/**
 * Static contrast-class definitions, keyed by the focal belief's slug.
 *
 * A contrast class is the set of mutually exclusive rivals that answer the same
 * topic question and compete for the same slot — the denominator a belief is
 * priced against (docs/THE_DENOMINATOR.md). The option SCORES are not stored
 * here: each option points at its own belief by slug, and its score is resolved
 * from that belief's own argument tree at fetch time, so every number under the
 * line stays traceable (invariant §8.7). This lives as a static overlay (like
 * spectrum-coordinates.ts) so existing Prisma data keeps flowing untouched; a
 * future schema can promote it to a first-class topic relation.
 */
interface ContrastClassTemplate {
  question: string
  options: Array<{
    id: string
    label: string
    oneLine?: string
    /** Slug of the belief whose tree supplies this option's score. */
    slug?: string
    isFocal?: boolean
  }>
}

const CONTRAST_CLASSES: Record<string, ContrastClassTemplate> = {
  'universal-basic-income-should-be-implemented': {
    question:
      'What mechanism should guarantee a basic income floor in a developed economy?',
    options: [
      {
        id: 'ubi',
        label: 'Universal Basic Income',
        oneLine: 'Unconditional flat cash payment to every adult',
        slug: 'universal-basic-income-should-be-implemented',
        isFocal: true,
      },
      {
        id: 'nit',
        label: 'Negative income tax',
        oneLine: 'A transfer that phases out as earnings rise',
        slug: 'negative-income-tax',
      },
      {
        id: 'falc',
        label: 'Fully automated luxury communism',
        oneLine: 'Abolish wage labor once automation is total',
        slug: 'fully-automated-luxury-communism',
      },
    ],
  },
}

/** Net score (−100..+100) of a belief computed from its own argument + evidence tree. */
function netScore(
  args: Array<{ side: string; impactScore: number }>,
  evidence: Array<{ side: string; impactScore: number }>,
): number {
  const sum = (items: Array<{ side: string; impactScore: number }>, side: string) =>
    items.filter(i => i.side === side).reduce((s, i) => s + Math.abs(i.impactScore), 0)

  const pos = sum(args, 'agree') + sum(evidence, 'supporting')
  const neg = sum(args, 'disagree') + sum(evidence, 'weakening')
  const total = pos + neg
  return total > 0 ? ((pos - neg) / total) * 100 : 0
}

/**
 * Resolve the contrast class for a focal belief, computing each option's score
 * from its own belief's argument tree. Returns null when no contrast class is
 * defined for the slug (the section then renders nothing). An option whose
 * referenced belief is missing or unscored keeps score: null (Rule 6 — blank,
 * never a fabricated zero).
 */
export async function resolveContrastClass(
  focalSlug: string,
): Promise<ContrastClassData | null> {
  const template = CONTRAST_CLASSES[focalSlug]
  if (!template) return null

  const slugs = template.options
    .map(o => o.slug)
    .filter((s): s is string => Boolean(s))

  const beliefs = await prisma.belief.findMany({
    where: { slug: { in: slugs } },
    select: {
      slug: true,
      arguments: { select: { side: true, impactScore: true } },
      evidence: { select: { side: true, impactScore: true } },
    },
  })

  const scoreBySlug = new Map<string, number>()
  for (const b of beliefs) {
    scoreBySlug.set(b.slug, netScore(b.arguments, b.evidence))
  }

  const options: ContrastClassOption[] = template.options.map(o => ({
    id: o.id,
    label: o.label,
    oneLine: o.oneLine ?? null,
    slug: o.slug ?? null,
    isFocal: o.isFocal ?? false,
    score: o.slug && scoreBySlug.has(o.slug) ? scoreBySlug.get(o.slug)! : null,
  }))

  return { question: template.question, options }
}
