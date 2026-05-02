import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { computeBeliefUnitStats, type BeliefUnitInput } from '@/lib/battlefield'
import { buildTopicGroups, type BattlefieldUnit } from '@/lib/battlefield-pairings'
import ArenaCanvas from './ArenaCanvas'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Arena · Battlefield of Ideas',
  description: 'A diep.io-style top-down arena where beliefs from the same topic fight live.',
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

export default async function ArenaPage() {
  const units = await fetchUnits()
  const groups = buildTopicGroups(units).filter(g => g.units.length >= 2)
  const fightable = groups.flatMap(g => g.units)

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-[1100px] mx-auto p-4 md:p-6">
        <header className="mb-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Idea Arena</h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Beliefs from the same topic spawn as tanks. They wander, target an opponent
              from their topic, and fire. HP, ATK, DEF, SPD &amp; AoE come from the
              argument-ledger stats. Last idea standing wins the round.
            </p>
          </div>
          <Link
            href="/battlefield"
            className="text-xs text-neutral-300 underline whitespace-nowrap"
          >
            &larr; Back to Battlefield
          </Link>
        </header>

        {fightable.length < 2 ? (
          <div className="rounded border border-neutral-800 bg-neutral-900 p-6 text-center text-sm text-neutral-400">
            Need at least two beliefs sharing a category before the arena can spawn a fight.
          </div>
        ) : (
          <ArenaCanvas units={fightable} groups={groups.map(g => ({ topic: g.topic, slugs: g.units.map(u => u.slug) }))} />
        )}
      </div>
    </div>
  )
}
