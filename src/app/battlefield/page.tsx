import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import {
  computeBeliefUnitStats,
  type BeliefUnitInput,
  type BeliefUnitStats,
} from '@/lib/battlefield'

export const dynamic = 'force-dynamic'

interface UnitRow {
  id: number
  slug: string
  name: string
  category: string | null
  stats: BeliefUnitStats
}

async function fetchUnits(): Promise<UnitRow[]> {
  const beliefs = await prisma.belief.findMany({
    select: {
      id: true,
      slug: true,
      statement: true,
      category: true,
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

  const rows = beliefs.map(b => {
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
      stats: computeBeliefUnitStats(input),
    }
  })

  rows.sort((a, b) => b.stats.overall - a.stats.overall)
  return rows
}

const classColor: Record<BeliefUnitStats['unitClass'], string> = {
  Fortress: 'bg-blue-100 text-blue-900',
  Striker: 'bg-red-100 text-red-900',
  Scout: 'bg-amber-100 text-amber-900',
  Beacon: 'bg-purple-100 text-purple-900',
  Bulwark: 'bg-emerald-100 text-emerald-900',
  Recruit: 'bg-neutral-100 text-neutral-700',
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 shrink-0 text-neutral-500">{label}</span>
      <div className="relative h-2 flex-1 rounded bg-neutral-200">
        <div
          className="absolute inset-y-0 left-0 rounded bg-neutral-700"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right tabular-nums">{value}</span>
    </div>
  )
}

export default async function BattlefieldPage() {
  const units = await fetchUnits()

  return (
    <div className="max-w-[960px] mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-1">The Battlefield of Ideas</h1>
        <p className="text-sm text-neutral-600">
          Every belief is a unit. Stats are derived from the argument ledger:
          HP from stability, Attack from claim strength &times; argument
          volume, Defense from supporting laws and structural backing, Speed
          from content velocity, AoE from how many downstream beliefs depend
          on it. The full game-engine feed is available at{' '}
          <Link href="/api/battlefield/units" className="underline">
            /api/battlefield/units
          </Link>
          .
        </p>
      </header>

      {units.length === 0 ? (
        <p className="text-neutral-500">No beliefs to deploy yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {units.map(u => (
            <Link
              key={u.id}
              href={`/beliefs/${u.slug}`}
              className="block rounded border border-neutral-200 p-4 hover:border-neutral-400 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{u.name}</div>
                  {u.category && (
                    <div className="text-xs text-neutral-500">{u.category}</div>
                  )}
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${classColor[u.stats.unitClass]}`}
                >
                  {u.stats.unitClass} L{u.stats.level}
                </span>
              </div>

              <div className="space-y-1 mt-3">
                <StatBar label="HP" value={u.stats.hp} />
                <StatBar label="ATK" value={u.stats.attack} />
                <StatBar label="DEF" value={u.stats.defense} />
                <StatBar label="SPD" value={u.stats.speed} />
                <StatBar label="AOE" value={u.stats.aoe} />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                <span>Overall</span>
                <span className="text-base font-bold text-neutral-900 tabular-nums">
                  {u.stats.overall}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
