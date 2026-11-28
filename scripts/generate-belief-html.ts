/**
 * Publish step: render a live Belief (and its arguments' linkage pages) from
 * the DB into the canonical HTML, using the DB as the source of truth.
 *
 *   npx tsx scripts/generate-belief-html.ts <slug> [--route] [--out DIR]
 *   npx tsx scripts/generate-belief-html.ts --all   [--route] [--out DIR]
 *
 * Default link mode is 'file' (self-navigable belief_<slug>.html siblings).
 * Pass --route to emit /beliefs/<slug> links for the live Next.js app.
 *
 * This mirrors the existing Blogger/PBworks publishers: it produces the static
 * HTML; wiring the output to a specific host is a thin follow-up.
 */

import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { fetchBeliefBySlug } from '@/features/belief-analysis/data/fetch-belief'
import { beliefToHtmlInput, type ParentEdge } from '@/lib/html-generator/from-belief'
import { renderBeliefHtml, renderLinkageHtml } from '@/lib/html-generator/belief-html'

function parseArgs(argv: string[]) {
  const linkMode: 'file' | 'route' = argv.includes('--route') ? 'route' : 'file'
  const outIdx = argv.indexOf('--out')
  const outDir = outIdx >= 0 ? argv[outIdx + 1] : 'generated/belief-pages'
  const all = argv.includes('--all')
  const slug = argv.find((a) => !a.startsWith('--') && a !== (outIdx >= 0 ? argv[outIdx + 1] : ''))
  return { linkMode, outDir: path.resolve(process.cwd(), outDir), all, slug }
}

/** Find the parent arguments (edges where this belief is the reason) for backlinks. */
async function findParents(beliefId: number): Promise<ParentEdge[]> {
  const edges = await prisma.argument.findMany({
    where: { beliefId },
    select: { parentBelief: { select: { slug: true, statement: true } } },
  })
  return edges.map((e) => ({
    parentStatement: e.parentBelief.statement,
    parentSlug: e.parentBelief.slug,
    argumentLabel: null,
  }))
}

async function renderOne(slug: string, linkMode: 'file' | 'route', outDir: string): Promise<string[]> {
  const belief = await fetchBeliefBySlug(slug)
  if (!belief) {
    console.warn(`! skipped ${slug}: not found`)
    return []
  }

  const parents = await findParents(belief.id)
  const input = beliefToHtmlInput(belief, { parents, linkMode })
  const written: string[] = []

  const beliefFile = path.join(outDir, `belief_${slug}.html`)
  fs.writeFileSync(beliefFile, renderBeliefHtml(input), 'utf8')
  written.push(beliefFile)

  // One linkage page per argument edge.
  for (const a of belief.arguments) {
    const linkageArgs = await prisma.linkageArgument.findMany({
      where: { argumentId: a.id },
      select: { side: true, statement: true, strength: true },
    })
    const html = renderLinkageHtml({
      argumentId: a.id,
      argumentLabel: a.belief.statement,
      parentStatement: belief.statement,
      parentSlug: belief.slug,
      childStatement: a.belief.statement,
      childSlug: a.belief.slug,
      linkageScore: a.linkageScore,
      subArguments: linkageArgs.map((l) => ({
        side: l.side === 'disagree' ? 'disagree' : 'agree',
        statement: l.statement,
        strength: l.strength,
      })),
      linkMode,
    })
    const linkageFile = path.join(outDir, `linkage_${a.id}.html`)
    fs.writeFileSync(linkageFile, html, 'utf8')
    written.push(linkageFile)
  }

  return written
}

async function main() {
  const { linkMode, outDir, all, slug } = parseArgs(process.argv.slice(2))
  fs.mkdirSync(outDir, { recursive: true })

  let slugs: string[]
  if (all) {
    const beliefs = await prisma.belief.findMany({ select: { slug: true } })
    slugs = beliefs.map((b) => b.slug)
  } else if (slug) {
    slugs = [slug]
  } else {
    console.error('Usage: generate-belief-html.ts <slug> | --all [--route] [--out DIR]')
    process.exit(1)
  }

  let count = 0
  for (const s of slugs) {
    const written = await renderOne(s, linkMode, outDir)
    count += written.length
  }
  console.log(`Wrote ${count} files to ${outDir}`)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
