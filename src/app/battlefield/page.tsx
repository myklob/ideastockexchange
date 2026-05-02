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
  subcategory: string | null
  positivity: number
  stats: BeliefUnitStats
}

interface Battle {
  topic: string
  agree: UnitRow
  oppose: UnitRow
}

async function fetchUnits(): Promise<UnitRow[]> {
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

/**
 * Group beliefs by topic (subcategory ?? category), then pit each group's
 * most-positive belief against its most-negative belief. Within a topic, we
 * also keep any extras in a list so the user can see the full roster, but
 * the headline match is positive vs negative.
 */
function buildBattles(units: UnitRow[]): {
  battles: (Battle & { extras: UnitRow[] })[]
  unmatched: UnitRow[]
} {
  const byTopic = new Map<string, UnitRow[]>()
  const unmatched: UnitRow[] = []

  for (const u of units) {
    const topic = u.subcategory ?? u.category ?? null
    if (!topic) {
      unmatched.push(u)
      continue
    }
    const list = byTopic.get(topic) ?? []
    list.push(u)
    byTopic.set(topic, list)
  }

  const battles: (Battle & { extras: UnitRow[] })[] = []
  for (const [topic, list] of byTopic) {
    if (list.length < 2) {
      unmatched.push(...list)
      continue
    }
    const sorted = [...list].sort((a, b) => b.positivity - a.positivity)
    const agree = sorted[0]
    const oppose = sorted[sorted.length - 1]
    if (agree.id === oppose.id) {
      unmatched.push(...list)
      continue
    }
    const extras = sorted.slice(1, -1)
    battles.push({ topic, agree, oppose, extras })
  }

  battles.sort(
    (a, b) =>
      b.agree.stats.overall + b.oppose.stats.overall -
      (a.agree.stats.overall + a.oppose.stats.overall),
  )

  return { battles, unmatched }
}

const classColor: Record<BeliefUnitStats['unitClass'], string> = {
  Fortress: 'bg-blue-100 text-blue-900',
  Striker: 'bg-red-100 text-red-900',
  Scout: 'bg-amber-100 text-amber-900',
  Beacon: 'bg-purple-100 text-purple-900',
  Bulwark: 'bg-emerald-100 text-emerald-900',
  Recruit: 'bg-neutral-100 text-neutral-700',
}

function StatBar({
  label,
  value,
  side,
}: {
  label: string
  value: number
  side: 'left' | 'right'
}) {
  const barColor = side === 'left' ? 'bg-emerald-600' : 'bg-rose-600'
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-10 shrink-0 text-neutral-500">{label}</span>
      <div className="relative h-2 flex-1 rounded bg-neutral-200">
        <div
          className={`absolute inset-y-0 left-0 rounded ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right tabular-nums">{value}</span>
    </div>
  )
}

function FighterCard({
  unit,
  side,
  isWinner,
}: {
  unit: UnitRow
  side: 'left' | 'right'
  isWinner: boolean
}) {
  const stanceLabel = side === 'left' ? 'AGREE' : 'OPPOSE'
  const stanceColor =
    side === 'left'
      ? 'bg-emerald-50 border-emerald-200'
      : 'bg-rose-50 border-rose-200'
  return (
    <Link
      href={`/beliefs/${unit.slug}`}
      className={`flex-1 rounded-lg border p-4 transition-colors hover:border-neutral-500 ${stanceColor} ${
        isWinner ? 'ring-2 ring-yellow-400' : ''
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wide ${
            side === 'left'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {stanceLabel}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${classColor[unit.stats.unitClass]}`}
        >
          {unit.stats.unitClass} L{unit.stats.level}
        </span>
      </div>
      <div className="mb-3 text-sm font-semibold leading-tight">
        {unit.name}
      </div>
      <div className="space-y-1">
        <StatBar label="HP" value={unit.stats.hp} side={side} />
        <StatBar label="ATK" value={unit.stats.attack} side={side} />
        <StatBar label="DEF" value={unit.stats.defense} side={side} />
        <StatBar label="SPD" value={unit.stats.speed} side={side} />
        <StatBar label="AOE" value={unit.stats.aoe} side={side} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
        <span>Power</span>
        <span className="text-base font-bold tabular-nums text-neutral-900">
          {unit.stats.overall}
          {isWinner && <span className="ml-1 text-yellow-600">&#9819;</span>}
        </span>
      </div>
    </Link>
  )
}

function BattleCard({ battle }: { battle: Battle & { extras: UnitRow[] } }) {
  const agreeWins = battle.agree.stats.overall >= battle.oppose.stats.overall
  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          Topic: {battle.topic}
        </h3>
        <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
          Same arena &middot; opposing stances
        </span>
      </header>
      <div className="flex items-stretch gap-3">
        <FighterCard unit={battle.agree} side="left" isWinner={agreeWins} />
        <div className="flex w-10 flex-col items-center justify-center text-center">
          <div className="text-2xl font-black text-neutral-300">VS</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-neutral-400">
            Battle
          </div>
        </div>
        <FighterCard unit={battle.oppose} side="right" isWinner={!agreeWins} />
      </div>
      {battle.extras.length > 0 && (
        <details className="mt-3 text-xs text-neutral-500">
          <summary className="cursor-pointer hover:text-neutral-800">
            {battle.extras.length} other contender
            {battle.extras.length === 1 ? '' : 's'} in this arena
          </summary>
          <ul className="mt-2 space-y-1">
            {battle.extras.map(e => (
              <li key={e.id}>
                <Link
                  href={`/beliefs/${e.slug}`}
                  className="hover:underline"
                >
                  &middot; {e.name}{' '}
                  <span className="text-neutral-400">
                    (power {e.stats.overall}, positivity{' '}
                    {Math.round(e.positivity)})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  )
}

export default async function BattlefieldPage() {
  const units = await fetchUnits()
  const { battles, unmatched } = buildBattles(units)

  return (
    <div className="mx-auto max-w-[960px] p-6">
      <header className="mb-6">
        <h1 className="mb-1 text-3xl font-bold">The Battlefield of Ideas</h1>
        <p className="text-sm text-neutral-600">
          Each topic is an arena. Beliefs from the same topic with opposite
          stances fight head-to-head &mdash; e.g. &ldquo;Trump is a genius&rdquo;
          vs &ldquo;Trump is a moron.&rdquo; Stats come from the argument
          ledger; the higher overall power wins the round. Want to play it as
          a real game?{' '}
          <Link href="/arena" className="font-medium underline">
            Enter the Arena &rarr;
          </Link>
        </p>
      </header>

      {battles.length === 0 ? (
        <p className="text-neutral-500">
          No topic has at least two opposing beliefs yet. Add a counter-belief
          to any topic and a battle will appear here.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {battles.map(b => (
            <BattleCard key={b.topic} battle={b} />
          ))}
        </div>
      )}

      {unmatched.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
            Awaiting an opponent
          </h2>
          <ul className="space-y-1 text-sm text-neutral-600">
            {unmatched.map(u => (
              <li key={u.id}>
                <Link href={`/beliefs/${u.slug}`} className="hover:underline">
                  &middot; {u.name}{' '}
                  <span className="text-neutral-400">
                    (
                    {u.subcategory ?? u.category ?? 'no topic'}, power{' '}
                    {u.stats.overall})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
