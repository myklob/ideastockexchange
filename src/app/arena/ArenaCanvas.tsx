'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { BattlefieldUnit } from '@/lib/battlefield-pairings'

interface TopicGroup {
  topic: string
  slugs: string[]
}

interface Tank {
  unit: BattlefieldUnit
  topic: string
  color: string
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  hp: number
  maxHp: number
  radius: number
  cooldown: number
  alive: boolean
  kills: number
}

interface Bullet {
  ownerId: number
  topic: string
  color: string
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  ttl: number
  radius: number
}

interface ScoreboardRow {
  slug: string
  name: string
  hp: number
  maxHp: number
  kills: number
  alive: boolean
  topic: string
  color: string
}

const ARENA_W = 1040
const ARENA_H = 640
const TICK_MS = 1000 / 60
const TOPIC_PALETTE = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
]

function colorForTopic(idx: number): string {
  return TOPIC_PALETTE[idx % TOPIC_PALETTE.length]
}

function radiusFor(unit: BattlefieldUnit): number {
  return 14 + (unit.stats.hp / 100) * 14 + (unit.stats.aoe / 100) * 6
}

function maxHpFor(unit: BattlefieldUnit): number {
  return 60 + unit.stats.hp * 1.4
}

function speedFor(unit: BattlefieldUnit): number {
  return 0.4 + (unit.stats.speed / 100) * 1.6
}

function reloadFor(unit: BattlefieldUnit): number {
  return Math.max(20, 110 - unit.stats.speed * 0.6)
}

function damageFor(attacker: BattlefieldUnit, defender: BattlefieldUnit): number {
  const base = Math.max(2, attacker.stats.attack * 0.18)
  const mitigation = 1 - Math.min(0.7, defender.stats.defense / 220)
  return base * mitigation
}

function bulletSpeedFor(unit: BattlefieldUnit): number {
  return 3.5 + (unit.stats.attack / 100) * 3
}

function spawnTanks(units: BattlefieldUnit[], topicColors: Map<string, string>): Tank[] {
  return units.map((u, i) => {
    const angle = (i / Math.max(1, units.length)) * Math.PI * 2
    const radius = Math.min(ARENA_W, ARENA_H) * 0.35
    const cx = ARENA_W / 2
    const cy = ARENA_H / 2
    const topic = u.subcategory?.trim() || u.category?.trim() || 'Uncategorised'
    const color = topicColors.get(topic) ?? '#999'
    return {
      unit: u,
      topic,
      color,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      angle: angle + Math.PI,
      hp: maxHpFor(u),
      maxHp: maxHpFor(u),
      radius: radiusFor(u),
      cooldown: Math.random() * 60,
      alive: true,
      kills: 0,
    }
  })
}

interface Props {
  units: BattlefieldUnit[]
  groups: TopicGroup[]
}

export default function ArenaCanvas({ units, groups }: Props) {
  const [round, setRound] = useState(1)
  const [running, setRunning] = useState(true)

  return (
    <ArenaScene
      key={round}
      units={units}
      groups={groups}
      round={round}
      running={running}
      onToggleRun={() => setRunning(r => !r)}
      onReset={() => { setRound(r => r + 1); setRunning(true) }}
    />
  )
}

interface SceneProps extends Props {
  round: number
  running: boolean
  onToggleRun: () => void
  onReset: () => void
}

function ArenaScene({ units, groups, round, running, onToggleRun, onReset }: SceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)
  const accumulatorRef = useRef<number>(0)

  const topicColors = useMemo(() => {
    const map = new Map<string, string>()
    groups.forEach((g, i) => map.set(g.topic, colorForTopic(i)))
    return map
  }, [groups])

  // Tanks/bullets exist for the lifetime of this scene instance. The parent keys
  // this component by `round`, so Reset triggers a fresh mount and re-runs the
  // initialisation effect below.
  const tanksRef = useRef<Tank[]>([])
  const bulletsRef = useRef<Bullet[]>([])

  const initialScoreboard = useMemo<ScoreboardRow[]>(() => {
    const provisional = spawnTanks(units, topicColors)
    return provisional.map(t => ({
      slug: t.unit.slug,
      name: t.unit.name,
      hp: Math.round(t.hp),
      maxHp: Math.round(t.maxHp),
      kills: 0,
      alive: true,
      topic: t.topic,
      color: t.color,
    }))
  }, [units, topicColors])

  const [scoreboard, setScoreboard] = useState<ScoreboardRow[]>(initialScoreboard)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [winner, setWinner] = useState<{ slug: string; name: string; topic: string } | null>(null)

  // Game loop
  useEffect(() => {
    if (tanksRef.current.length === 0) {
      tanksRef.current = spawnTanks(units, topicColors)
      bulletsRef.current = []
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctxOrNull = canvas.getContext('2d')
    if (!ctxOrNull) return
    const ctx: CanvasRenderingContext2D = ctxOrNull

    let scoreboardTimer = 0
    let stopped = false

    function pickTarget(self: Tank, all: Tank[]): Tank | null {
      let best: Tank | null = null
      let bestScore = Infinity
      for (const t of all) {
        if (!t.alive || t.unit.id === self.unit.id) continue
        const dx = t.x - self.x
        const dy = t.y - self.y
        const dist = Math.hypot(dx, dy)
        // Same-topic enemies are massively preferred ("Trump genius vs Trump moron").
        const topicBonus = t.topic === self.topic ? 0 : 800
        const score = dist + topicBonus
        if (score < bestScore) {
          bestScore = score
          best = t
        }
      }
      return best
    }

    function step() {
      const tanks = tanksRef.current ?? []
      const bullets = bulletsRef.current

      for (const tank of tanks) {
        if (!tank.alive) continue

        const target = pickTarget(tank, tanks)
        const sp = speedFor(tank.unit)

        if (target) {
          const dx = target.x - tank.x
          const dy = target.y - tank.y
          const dist = Math.hypot(dx, dy) || 1
          tank.angle = Math.atan2(dy, dx)
          const ideal = 180 + tank.unit.stats.aoe * 0.8
          const seek = dist > ideal
            ? 1
            : dist < ideal * 0.6
              ? -0.7
              : 0.15 * Math.sin(performance.now() / 600 + tank.unit.id)
          tank.vx += (dx / dist) * 0.08 * seek
          tank.vy += (dy / dist) * 0.08 * seek
        } else {
          tank.vx += (Math.random() - 0.5) * 0.05
          tank.vy += (Math.random() - 0.5) * 0.05
        }

        const v = Math.hypot(tank.vx, tank.vy)
        if (v > sp) {
          tank.vx = (tank.vx / v) * sp
          tank.vy = (tank.vy / v) * sp
        }
        tank.vx *= 0.96
        tank.vy *= 0.96
        tank.x += tank.vx
        tank.y += tank.vy

        if (tank.x < tank.radius) { tank.x = tank.radius; tank.vx *= -0.6 }
        if (tank.x > ARENA_W - tank.radius) { tank.x = ARENA_W - tank.radius; tank.vx *= -0.6 }
        if (tank.y < tank.radius) { tank.y = tank.radius; tank.vy *= -0.6 }
        if (tank.y > ARENA_H - tank.radius) { tank.y = ARENA_H - tank.radius; tank.vy *= -0.6 }

        tank.cooldown -= 1
        if (target && tank.cooldown <= 0) {
          tank.cooldown = reloadFor(tank.unit)
          const bs = bulletSpeedFor(tank.unit)
          bullets.push({
            ownerId: tank.unit.id,
            topic: tank.topic,
            color: tank.color,
            x: tank.x + Math.cos(tank.angle) * (tank.radius + 6),
            y: tank.y + Math.sin(tank.angle) * (tank.radius + 6),
            vx: Math.cos(tank.angle) * bs,
            vy: Math.sin(tank.angle) * bs,
            damage: damageFor(tank.unit, target.unit),
            ttl: 110,
            radius: 4 + (tank.unit.stats.attack / 100) * 4,
          })
          tank.vx -= Math.cos(tank.angle) * 0.3
          tank.vy -= Math.sin(tank.angle) * 0.3
        }
      }

      for (const b of bullets) {
        b.x += b.vx
        b.y += b.vy
        b.ttl -= 1
        if (b.x < 0 || b.x > ARENA_W || b.y < 0 || b.y > ARENA_H) b.ttl = 0
      }
      for (const b of bullets) {
        if (b.ttl <= 0) continue
        for (const tank of tanks) {
          if (!tank.alive) continue
          if (tank.unit.id === b.ownerId) continue
          const dx = tank.x - b.x
          const dy = tank.y - b.y
          if (Math.hypot(dx, dy) <= tank.radius + b.radius) {
            tank.hp -= b.damage
            const k = b.damage * 0.04
            const len = Math.hypot(dx, dy) || 1
            tank.vx += (dx / len) * k * 0.4
            tank.vy += (dy / len) * k * 0.4
            b.ttl = 0
            if (tank.hp <= 0) {
              tank.alive = false
              const killer = tanks.find(t => t.unit.id === b.ownerId)
              if (killer) killer.kills += 1
            }
            break
          }
        }
      }
      bulletsRef.current = bullets.filter(b => b.ttl > 0)

      const aliveAll = tanks.filter(t => t.alive)
      if (aliveAll.length === 1 && tanks.length > 1) {
        const champ = aliveAll[0]
        setWinner({ slug: champ.unit.slug, name: champ.unit.name, topic: champ.topic })
        stopped = true
        if (running) onToggleRun()
      } else if (aliveAll.length === 0 && tanks.length > 0) {
        setWinner(null)
        stopped = true
        if (running) onToggleRun()
      }
    }

    function syncScoreboardFromRefs() {
      setScoreboard(
        (tanksRef.current ?? []).map(t => ({
          slug: t.unit.slug,
          name: t.unit.name,
          hp: Math.max(0, Math.round(t.hp)),
          maxHp: Math.round(t.maxHp),
          kills: t.kills,
          alive: t.alive,
          topic: t.topic,
          color: t.color,
        })),
      )
    }

    function draw() {
      const tanks = tanksRef.current ?? []
      const bullets = bulletsRef.current

      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, ARENA_W, ARENA_H)
      ctx.strokeStyle = '#1f1f23'
      ctx.lineWidth = 1
      const grid = 40
      for (let x = 0; x <= ARENA_W; x += grid) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ARENA_H); ctx.stroke()
      }
      for (let y = 0; y <= ARENA_H; y += grid) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ARENA_W, y); ctx.stroke()
      }

      for (const b of bullets) {
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
        ctx.fillStyle = b.color
        ctx.globalAlpha = 0.9
        ctx.fill()
        ctx.globalAlpha = 1
      }

      for (const tank of tanks) {
        if (!tank.alive) continue
        const isSelected = tank.unit.slug === selectedSlug
        const barrelLen = tank.radius + 10
        ctx.save()
        ctx.translate(tank.x, tank.y)
        ctx.rotate(tank.angle)
        ctx.fillStyle = '#3f3f46'
        ctx.fillRect(0, -5, barrelLen, 10)
        ctx.restore()

        ctx.beginPath()
        ctx.arc(tank.x, tank.y, tank.radius, 0, Math.PI * 2)
        ctx.fillStyle = tank.color
        ctx.fill()
        ctx.lineWidth = isSelected ? 3 : 2
        ctx.strokeStyle = isSelected ? '#ffffff' : '#000000'
        ctx.stroke()

        const barW = tank.radius * 2
        const barH = 4
        const bx = tank.x - tank.radius
        const by = tank.y - tank.radius - 10
        ctx.fillStyle = '#27272a'
        ctx.fillRect(bx, by, barW, barH)
        ctx.fillStyle = tank.hp / tank.maxHp > 0.4 ? '#22c55e' : '#ef4444'
        ctx.fillRect(bx, by, barW * Math.max(0, tank.hp / tank.maxHp), barH)

        ctx.fillStyle = '#e5e5e5'
        ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
        ctx.textAlign = 'center'
        const label = tank.unit.name.length > 36 ? tank.unit.name.slice(0, 33) + '…' : tank.unit.name
        ctx.fillText(label, tank.x, by - 4)
      }
    }

    function loop(now: number) {
      if (!lastTickRef.current) lastTickRef.current = now
      const delta = now - lastTickRef.current
      lastTickRef.current = now
      if (running && !stopped) {
        accumulatorRef.current += delta
        let safety = 0
        while (accumulatorRef.current >= TICK_MS && safety < 5) {
          step()
          accumulatorRef.current -= TICK_MS
          safety++
        }
        scoreboardTimer += delta
        if (scoreboardTimer >= 250) {
          scoreboardTimer = 0
          syncScoreboardFromRefs()
        }
      }
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTickRef.current = 0
      accumulatorRef.current = 0
    }
  }, [running, selectedSlug, onToggleRun, units, topicColors])

  function onCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = ARENA_W / rect.width
    const scaleY = ARENA_H / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const hit = (tanksRef.current ?? []).find(t => Math.hypot(t.x - x, t.y - y) <= t.radius + 4)
    setSelectedSlug(hit && hit.alive ? hit.unit.slug : null)
  }

  const selected = selectedSlug ? units.find(u => u.slug === selectedSlug) : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2 text-xs">
          <button
            type="button"
            onClick={onToggleRun}
            className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
          >
            {running ? 'Pause' : 'Resume'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
          >
            Reset Round
          </button>
          <span className="ml-auto text-neutral-500">
            Round {round} · {scoreboard.filter(s => s.alive).length}/{scoreboard.length} alive
          </span>
        </div>
        <div className="relative rounded border border-neutral-800 overflow-hidden bg-black">
          <canvas
            ref={canvasRef}
            width={ARENA_W}
            height={ARENA_H}
            onClick={onCanvasClick}
            className="block w-full h-auto cursor-crosshair"
            style={{ aspectRatio: `${ARENA_W} / ${ARENA_H}` }}
          />
          {winner && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-center px-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Champion</div>
                <div className="text-xl font-bold text-emerald-400 mb-1">{winner.name}</div>
                <div className="text-xs text-neutral-400 mb-4">topic: {winner.topic}</div>
                <div className="flex gap-2 justify-center">
                  <Link
                    href={`/beliefs/${winner.slug}`}
                    className="px-3 py-1.5 text-xs rounded bg-emerald-600 hover:bg-emerald-500"
                  >
                    Open belief page
                  </Link>
                  <button
                    type="button"
                    onClick={onReset}
                    className="px-3 py-1.5 text-xs rounded bg-neutral-700 hover:bg-neutral-600"
                  >
                    Rematch
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
          {groups.map((g, i) => (
            <span key={g.topic} className="inline-flex items-center gap-1.5 text-neutral-400">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: TOPIC_PALETTE[i % TOPIC_PALETTE.length] }}
              />
              {g.topic} ({g.slugs.length})
            </span>
          ))}
        </div>
      </div>

      <aside className="rounded border border-neutral-800 bg-neutral-900 p-3 text-xs space-y-3 min-w-0">
        <div>
          <div className="font-semibold text-neutral-200 mb-2">Combatants</div>
          <ul className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
            {scoreboard
              .slice()
              .sort((a, b) => Number(b.alive) - Number(a.alive) || b.kills - a.kills || b.hp - a.hp)
              .map(s => (
                <li
                  key={s.slug}
                  onClick={() => setSelectedSlug(s.slug)}
                  className={`cursor-pointer rounded px-2 py-1.5 border ${
                    s.slug === selectedSlug ? 'border-neutral-400 bg-neutral-800' : 'border-transparent hover:bg-neutral-800/60'
                  } ${s.alive ? '' : 'opacity-40'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="truncate flex-1">{s.name}</span>
                    <span className="tabular-nums text-neutral-400 shrink-0">{s.hp}/{s.maxHp}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5 flex justify-between">
                    <span className="truncate">{s.topic}</span>
                    <span>{s.kills} {s.kills === 1 ? 'kill' : 'kills'}</span>
                  </div>
                </li>
              ))}
          </ul>
        </div>

        {selected && (
          <div className="border-t border-neutral-800 pt-3">
            <div className="font-semibold text-neutral-200 mb-1 leading-snug">{selected.name}</div>
            <div className="text-[10px] text-neutral-500 mb-2">
              {selected.subcategory || selected.category || 'Uncategorised'}
            </div>
            <div className="grid grid-cols-5 gap-1 text-center">
              {(['hp', 'attack', 'defense', 'speed', 'aoe'] as const).map(k => (
                <div key={k} className="bg-neutral-800 rounded px-1 py-1">
                  <div className="text-[9px] uppercase text-neutral-500">{k === 'attack' ? 'ATK' : k === 'defense' ? 'DEF' : k === 'speed' ? 'SPD' : k.toUpperCase()}</div>
                  <div className="tabular-nums font-medium">{selected.stats[k]}</div>
                </div>
              ))}
            </div>
            <Link
              href={`/beliefs/${selected.slug}`}
              className="mt-2 block text-center text-[11px] underline text-neutral-300"
            >
              Open belief page &rarr;
            </Link>
          </div>
        )}

        <div className="border-t border-neutral-800 pt-3 text-[10px] leading-relaxed text-neutral-500">
          Click a tank to inspect. Same-color tanks share a topic and target each other first.
          Bullet damage = ATK &times; defense mitigation; reload speed scales with SPD.
        </div>
      </aside>
    </div>
  )
}
