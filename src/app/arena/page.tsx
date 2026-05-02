import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import {
  computeBeliefUnitStats,
  type BeliefUnitInput,
} from '@/lib/battlefield'
import ArenaGame, { type ArenaEnemy } from './ArenaGame'

export const dynamic = 'force-dynamic'

async function fetchEnemies(): Promise<ArenaEnemy[]> {
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
    take: 60,
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
    const stats = computeBeliefUnitStats(input)
    return {
      id: b.id,
      slug: b.slug,
      name: b.statement,
      topic: b.subcategory ?? b.category ?? 'unsorted',
      positivity: b.positivity,
      hp: stats.hp,
      attack: stats.attack,
      defense: stats.defense,
      speed: stats.speed,
      level: stats.level,
      unitClass: stats.unitClass,
    }
  })
}

export default async function ArenaPage() {
  const enemies = await fetchEnemies()

  return (
    <div className="min-h-screen bg-[#0b0d12] text-neutral-100">
      <header className="border-b border-neutral-800 bg-[#10131a]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-black tracking-tight">
              Idea Arena
            </h1>
            <p className="text-xs text-neutral-400">
              A diep.io-style arena where every enemy is a real belief.
              Knock the ones you disagree with off the board.
            </p>
          </div>
          <nav className="flex items-center gap-4 text-xs text-neutral-300">
            <Link href="/battlefield" className="hover:text-white">
              Battlefield
            </Link>
            <Link href="/beliefs" className="hover:text-white">
              Beliefs
            </Link>
            <Link href="/" className="hover:text-white">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4">
        <ArenaGame enemies={enemies} />

        <section className="mt-6 grid gap-4 text-sm text-neutral-300 md:grid-cols-3">
          <div>
            <h2 className="mb-1 font-semibold text-white">Controls</h2>
            <ul className="space-y-1 text-neutral-400">
              <li>
                <kbd className="rounded bg-neutral-800 px-1.5 py-0.5">W A S D</kbd>{' '}
                or arrow keys to move
              </li>
              <li>
                <kbd className="rounded bg-neutral-800 px-1.5 py-0.5">Mouse</kbd>{' '}
                to aim
              </li>
              <li>
                <kbd className="rounded bg-neutral-800 px-1.5 py-0.5">Click</kbd>{' '}
                or hold to fire
              </li>
            </ul>
          </div>
          <div>
            <h2 className="mb-1 font-semibold text-white">How It Works</h2>
            <p className="text-neutral-400">
              Each enemy is a real belief from the database. Its size scales
              with HP, its color with stance (positivity), and its damage
              with attack stat. Defeating one returns 1 XP plus its level.
            </p>
          </div>
          <div>
            <h2 className="mb-1 font-semibold text-white">Want the Stats?</h2>
            <p className="text-neutral-400">
              See the same beliefs as a head-to-head card battle on{' '}
              <Link href="/battlefield" className="text-emerald-400 underline">
                /battlefield
              </Link>
              , or read the original page at{' '}
              <Link href="/beliefs" className="text-emerald-400 underline">
                /beliefs
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
