import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import {
  computeBeliefUnitStats,
  type BeliefUnitInput,
  type BeliefUnitStats,
} from '@/lib/battlefield'
import {
  buildTopicGroups,
  simulateBout,
  type BattlefieldUnit,
  type Matchup,
} from '@/lib/battlefield-pairings'

export const dynamic = 'force-dynamic'

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

const classColor: Record<BeliefUnitStats['unitClass'], string> = {
  Fortress: 'bg-blue-100 text-blue-900 border-blue-300',
  Striker: 'bg-red-100 text-red-900 border-red-300',
  Scout: 'bg-amber-100 text-amber-900 border-amber-300',
  Beacon: 'bg-purple-100 text-purple-900 border-purple-300',
  Bulwark: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  Recruit: 'bg-neutral-100 text-neutral-700 border-neutral-300',
}

function StatBar({ label, value, side }: { label: string; value: number; side: 'left' | 'right' }) {
  const fillSide = side === 'left' ? 'right-0' : 'left-0'
  const align = side === 'left' ? 'flex-row-reverse text-right' : ''
  return (
    <div className={`flex items-center gap-2 text-[11px] ${align}`}>
      <span className="w-10 shrink-0 text-neutral-500">{label}</span>
      <div className="relative h-1.5 flex-1 rounded bg-neutral-200">
        <div
          className={`absolute inset-y-0 ${fillSide} rounded bg-neutral-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-7 text-right tabular-nums text-neutral-700">{value}</span>
    </div>
  )
}

function SideCard({
  unit,
  side,
  isPredictedWinner,
}: {
  unit: BattlefieldUnit
  side: 'left' | 'right'
  isPredictedWinner: boolean
}) {
  const align = side === 'left' ? 'text-right' : 'text-left'
  return (
    <Link
      href={`/beliefs/${unit.slug}`}
      className={`flex-1 min-w-0 block rounded border p-3 hover:border-neutral-500 transition-colors ${
        isPredictedWinner ? 'border-emerald-400 bg-emerald-50/40' : 'border-neutral-200'
      }`}
    >
      <div className={`flex items-start gap-2 mb-2 ${side === 'left' ? 'flex-row-reverse' : ''}`}>
        <span
          className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-medium ${classColor[unit.stats.unitClass]}`}
        >
          {unit.stats.unitClass} L{unit.stats.level}
        </span>
        <div className={`min-w-0 ${align}`}>
          <div className="font-semibold text-sm leading-snug line-clamp-3">{unit.name}</div>
          <div className="text-[11px] text-neutral-500 tabular-nums mt-0.5">
            positivity {unit.positivity > 0 ? '+' : ''}
            {Math.round(unit.positivity)}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <StatBar label="HP" value={unit.stats.hp} side={side} />
        <StatBar label="ATK" value={unit.stats.attack} side={side} />
        <StatBar label="DEF" value={unit.stats.defense} side={side} />
        <StatBar label="SPD" value={unit.stats.speed} side={side} />
        <StatBar label="AOE" value={unit.stats.aoe} side={side} />
      </div>
    </Link>
  )
}

function MatchupRow({ matchup }: { matchup: Matchup }) {
  if (matchup.pair.length === 1) {
    const lone = matchup.pair[0]
    return (
      <div className="flex items-stretch gap-3">
        <SideCard unit={lone} side="left" isPredictedWinner={false} />
        <div className="flex flex-col items-center justify-center w-14 shrink-0 text-neutral-400 text-xs">
          <span className="font-bold">VS</span>
          <span className="mt-1 text-center leading-tight">awaiting<br />challenger</span>
        </div>
        <div className="flex-1 min-w-0 rounded border border-dashed border-neutral-300 p-3 text-center text-xs text-neutral-400 flex items-center justify-center">
          No opposing belief in this topic yet.
        </div>
      </div>
    )
  }

  const [left, right] = matchup.pair
  const bout = simulateBout(left, right)
  return (
    <div className="flex items-stretch gap-3">
      <SideCard unit={left} side="left" isPredictedWinner={bout.winner?.id === left.id} />
      <div className="flex flex-col items-center justify-center w-14 shrink-0 text-neutral-500">
        <span className="text-xs font-bold tracking-wider">VS</span>
        <span className="mt-1 text-[10px] text-neutral-400 text-center leading-tight">
          {bout.winner ? `${bout.ticks}t` : 'draw'}
        </span>
      </div>
      <SideCard unit={right} side="right" isPredictedWinner={bout.winner?.id === right.id} />
    </div>
  )
}

export default async function BattlefieldPage() {
  const units = await fetchUnits()
  const groups = buildTopicGroups(units)
  const totalMatchups = groups.reduce((sum, g) => sum + g.matchups.length, 0)

  return (
    <div className="max-w-[960px] mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-1">The Battlefield of Ideas</h1>
        <p className="text-sm text-neutral-600">
          Beliefs from the same topic line up against each other. The most-supported idea
          faces the most-opposed; stats come from the argument ledger (HP from stability,
          ATK from claim strength &times; argument volume, DEF from supporting structure,
          SPD from content velocity, AoE from downstream dependents). The green-bordered
          card is the predicted winner of a head-to-head bout.
        </p>
        <p className="text-sm text-neutral-600 mt-2">
          Want to see them actually fight?{' '}
          <Link href="/arena" className="underline font-medium">
            Open the live arena &rarr;
          </Link>{' '}
          (diep.io-style top-down brawl). The full game-engine feed is at{' '}
          <Link href="/api/battlefield/units" className="underline">
            /api/battlefield/units
          </Link>
          .
        </p>
      </header>

      {units.length === 0 ? (
        <p className="text-neutral-500">No beliefs to deploy yet.</p>
      ) : totalMatchups === 0 ? (
        <p className="text-neutral-500">
          Beliefs found, but none share a topic — add a category to two beliefs to start a fight.
        </p>
      ) : (
        <div className="space-y-8">
          {groups.map(g => (
            <section key={g.topic}>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-xl font-semibold">{g.topic}</h2>
                <span className="text-xs text-neutral-500">
                  {g.units.length} {g.units.length === 1 ? 'idea' : 'ideas'}
                  {g.matchups.length > 0 &&
                    ` · ${g.matchups.length} matchup${g.matchups.length === 1 ? '' : 's'}`}
                </span>
              </div>
              {g.matchups.length === 0 ? (
                <p className="text-xs text-neutral-400 italic">
                  Only one belief on this topic so far.
                </p>
              ) : (
                <div className="space-y-3">
                  {g.matchups.map((m, i) => (
                    <MatchupRow key={i} matchup={m} />
                  ))}
                </div>
              )}
              {g.ronin && g.matchups.length > 0 && (
                <p className="mt-2 text-[11px] text-neutral-400 italic">
                  Sitting out this round: <Link href={`/beliefs/${g.ronin.slug}`} className="underline">{g.ronin.name}</Link>
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
