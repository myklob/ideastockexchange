import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { computeBeliefUnitStats, type BeliefUnitInput } from '@/lib/battlefield'
import {
  buildTopicGroups,
  UNCATEGORISED,
  type BattlefieldUnit,
} from '@/lib/battlefield-pairings'
import SpectatorArena from './SpectatorArena'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Spectate · Idea Arena',
  description: 'Watch beliefs from the same topic fight each other in a top-down arena.',
}

async function fetchUnits(): Promise<BattlefieldUnit[]> {
  const beliefs = await prisma.belief.findMany({
    select: {
      id: true,
      slug: true,
      statement: true,
      category: true,
      subcategory: true,
      positivity: true,
      stabilityScore: true,
      claimStrength: true,
      arguments: { select: { side: true } },
      evidence: { select: { id: true } },
      legalEntries: { select: { side: true } },
      mediaResources: { select: { id: true } },
      objectiveCriteria: { select: { id: true } },
      downstreamMappings: { select: { id: true } },
      upstreamMappings: { select: { side: true } },
    },
  })

  return beliefs.map(b => {
    const agree = b.arguments.filter(a => a.side === 'agree').length
    const disagree = b.arguments.filter(a => a.side === 'disagree').length
    const supportingLaws = b.legalEntries.filter(l => l.side === 'supporting').length
    const upstreamSupport = b.upstreamMappings.filter(m => m.side === 'support').length
    const input: BeliefUnitInput = {
      positivity: b.positivity,
      stabilityScore: b.stabilityScore,
      claimStrength: b.claimStrength,
      argumentCount: b.arguments.length,
      agreeArgumentCount: agree,
      disagreeArgumentCount: disagree,
      evidenceCount: b.evidence.length,
      supportingLawsCount: supportingLaws,
      downstreamCount: b.downstreamMappings.length,
      upstreamSupportCount: upstreamSupport,
      mediaCount: b.mediaResources.length,
      criteriaCount: b.objectiveCriteria.length,
    }
    return {
      id: b.id,
      slug: b.slug,
      name: b.statement,
      category: b.category,
      subcategory: b.subcategory,
      positivity: b.positivity,
      stats: computeBeliefUnitStats(input),
    }
  })
}

export default async function SpectatePage() {
  const units = await fetchUnits()
  const groups = buildTopicGroups(units).filter(
    g => g.topic !== UNCATEGORISED && g.units.length >= 2,
  )
  const fighters = groups.flatMap(g => g.units)

  return (
    <div className="min-h-screen bg-[#0b0d12] text-neutral-100">
      <header className="border-b border-neutral-800 bg-[#10131a]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-black tracking-tight">Idea Arena &middot; Spectate</h1>
            <p className="text-xs text-neutral-400">
              No player. Beliefs from the same topic spawn as tanks and fight each other
              &mdash; &ldquo;Trump is a genius&rdquo; hunts &ldquo;Trump is a moron&rdquo;
              first. Last idea standing wins the round.
            </p>
          </div>
          <nav className="flex items-center gap-4 text-xs text-neutral-300">
            <Link href="/arena" className="hover:text-white">
              Play
            </Link>
            <Link href="/battlefield" className="hover:text-white">
              Battlefield
            </Link>
            <Link href="/beliefs" className="hover:text-white">
              Beliefs
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4">
        {fighters.length < 2 ? (
          <div className="rounded border border-neutral-800 bg-neutral-900 p-6 text-center text-sm text-neutral-400">
            Need at least two beliefs sharing a topic before the arena can spawn a fight.
          </div>
        ) : (
          <SpectatorArena
            units={fighters}
            groups={groups.map(g => ({ topic: g.topic, slugs: g.units.map(u => u.slug) }))}
          />
        )}
      </main>
    </div>
  )
}
