'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyRanks,
  emptyRanks,
  PER_RANK_MULTIPLIER,
  RANK_CAP,
  TANK_STAT_KEYS,
  TANK_STAT_LABELS,
  xpForLevel,
  type TankRanks,
  type TankStatKey,
  type TankStats,
} from '@/lib/tankStats'

export interface ArenaEnemy {
  id: number
  slug: string
  name: string
  topic: string
  positivity: number
  level: number
  unitClass: string
  tankBase: TankStats
}

interface Props {
  enemies: ArenaEnemy[]
}

interface Vec {
  x: number
  y: number
}

interface EnemyEntity {
  source: ArenaEnemy
  stats: TankStats
  pos: Vec
  hp: number
  radius: number
  color: string
  cooldown: number
  alive: boolean
}

interface PlayerState {
  pos: Vec
  hp: number
  level: number
  xp: number
  fireCooldown: number
  contactCooldown: number
  radius: number
}

interface Bullet {
  pos: Vec
  vel: Vec
  ttl: number
  damage: number
  fromPlayer: boolean
  radius: number
  pierceLeft: number
  hitIds: Set<number>
}

interface HudState {
  hp: number
  maxHp: number
  level: number
  xp: number
  xpToNext: number
  upgradePoints: number
  score: number
  bestScore: number
  careerScore: number
  lastKill: string
  enemiesAlive: number
  gameOver: boolean
  ranks: TankRanks
  effective: TankStats
}

const WORLD_SIZE = 2400
const VIEW_W = 960
const VIEW_H = 600
const BULLET_TTL = 1.4
const BEST_KEY = 'arena:bestScore'
const CAREER_KEY = 'arena:careerScore'

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function colorForBelief(positivity: number): string {
  const t = clamp((positivity + 100) / 200, 0, 1)
  const r = Math.round(220 * (1 - t) + 90 * t)
  const g = Math.round(80 * (1 - t) + 200 * t)
  return `rgb(${r}, ${g}, 90)`
}

function loadNumber(key: string): number {
  if (typeof window === 'undefined') return 0
  const raw = window.localStorage.getItem(key)
  if (raw == null) return 0
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function saveNumber(key: string, value: number): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, String(Math.max(0, Math.round(value))))
}

function spawnEnemy(source: ArenaEnemy): EnemyEntity {
  const stats = source.tankBase
  const radius = 18 + (Math.min(stats.maxHealth, 240) / 240) * 22
  return {
    source,
    stats,
    pos: { x: Math.random() * WORLD_SIZE, y: Math.random() * WORLD_SIZE },
    hp: stats.maxHealth,
    radius,
    color: colorForBelief(source.positivity),
    cooldown: Math.random() * 2,
    alive: true,
  }
}

export default function ArenaGame({ enemies }: Props) {
  const sortedRoster = useMemo(
    () =>
      [...enemies].sort(
        (a, b) =>
          b.tankBase.maxHealth +
          b.tankBase.bulletDamage * 4 -
          (a.tankBase.maxHealth + a.tankBase.bulletDamage * 4),
      ),
    [enemies],
  )

  const [champion, setChampion] = useState<ArenaEnemy | null>(null)
  const [runId, setRunId] = useState(0)
  const [hud, setHud] = useState<HudState | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [progression, setProgression] = useState<{
    ranks: TankRanks
    upgradePoints: number
  }>({ ranks: emptyRanks(), upgradePoints: 0 })
  const progressionRef = useRef(progression)
  useEffect(() => {
    progressionRef.current = progression
  })

  const [bestScoreState, setBestScoreState] = useState(0)
  const [careerScoreState, setCareerScoreState] = useState(0)
  useEffect(() => {
    // localStorage values can only be read after mount; this is the canonical
    // rehydration pattern and only runs once.
    /* eslint-disable react-hooks/set-state-in-effect */
    setBestScoreState(loadNumber(BEST_KEY))
    setCareerScoreState(loadNumber(CAREER_KEY))
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const pausedRef = useRef(false)
  const [pausedView, setPausedView] = useState(false)

  const spendUpgrade = useCallback((key: TankStatKey) => {
    setProgression(p => {
      if (p.upgradePoints <= 0 || p.ranks[key] >= RANK_CAP) return p
      return {
        ranks: { ...p.ranks, [key]: p.ranks[key] + 1 },
        upgradePoints: p.upgradePoints - 1,
      }
    })
  }, [])

  const togglePaused = useCallback(() => {
    pausedRef.current = !pausedRef.current
    setPausedView(pausedRef.current)
  }, [])

  const restart = useCallback(() => {
    pausedRef.current = false
    setPausedView(false)
    setProgression({ ranks: emptyRanks(), upgradePoints: 0 })
    progressionRef.current = { ranks: emptyRanks(), upgradePoints: 0 }
    setHud(null)
    setRunId(r => r + 1)
  }, [])

  const pickNewChampion = useCallback(() => {
    pausedRef.current = false
    setPausedView(false)
    setProgression({ ranks: emptyRanks(), upgradePoints: 0 })
    progressionRef.current = { ranks: emptyRanks(), upgradePoints: 0 }
    setHud(null)
    setChampion(null)
  }, [])

  const pickChampion = useCallback((c: ArenaEnemy) => {
    setProgression({ ranks: emptyRanks(), upgradePoints: 0 })
    progressionRef.current = { ranks: emptyRanks(), upgradePoints: 0 }
    setHud(null)
    setChampion(c)
  }, [])

  useEffect(() => {
    if (!champion) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true
    const keys = new Set<string>()
    const mouse = { x: VIEW_W / 2, y: VIEW_H / 2, down: false }

    const player: PlayerState = {
      pos: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 },
      hp: champion.tankBase.maxHealth,
      level: 1,
      xp: 0,
      fireCooldown: 0,
      contactCooldown: 0,
      radius: 22,
    }
    let entities: EnemyEntity[] = enemies
      .filter(e => e.id !== champion.id)
      .map(spawnEnemy)
    let bullets: Bullet[] = []
    let score = 0
    let lastKill = ''
    let gameOver = false
    let bestScore = loadNumber(BEST_KEY)
    let careerScore = loadNumber(CAREER_KEY)
    let endsRecorded = false

    const recordEndOfRun = () => {
      if (endsRecorded) return
      endsRecorded = true
      if (score > bestScore) {
        bestScore = score
        saveNumber(BEST_KEY, bestScore)
        setBestScoreState(bestScore)
      }
      careerScore += score
      saveNumber(CAREER_KEY, careerScore)
      setCareerScoreState(careerScore)
    }

    const registerKill = (en: EnemyEntity) => {
      score += 1 + en.source.level
      player.xp += 1 + en.source.level
      lastKill = en.source.name
      let earned = 0
      while (player.xp >= xpForLevel(player.level)) {
        player.xp -= xpForLevel(player.level)
        player.level += 1
        earned += 1
      }
      if (earned > 0) {
        setProgression(p => ({
          ...p,
          upgradePoints: p.upgradePoints + earned,
        }))
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      const wasDown = keys.has(k)
      keys.add(k)
      if (!wasDown) {
        const idx = '12345678'.indexOf(k)
        if (idx >= 0) spendUpgrade(TANK_STAT_KEYS[idx])
        if (k === 'p') togglePaused()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase())
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) * canvas.width) / rect.width
      mouse.y = ((e.clientY - rect.top) * canvas.height) / rect.height
    }
    const onMouseDown = () => {
      mouse.down = true
    }
    const onMouseUp = () => {
      mouse.down = false
    }
    const onBlur = () => {
      keys.clear()
      mouse.down = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mouseleave', onMouseUp)
    window.addEventListener('blur', onBlur)

    const respawnIfEmpty = () => {
      if (entities.filter(e => e.alive).length === 0) {
        entities = enemies
          .filter(e => e.id !== champion.id)
          .map(spawnEnemy)
      }
    }

    let last = performance.now()
    let hudTick = 0
    let frame = 0

    const step = (dt: number) => {
      if (pausedRef.current || gameOver) return
      const playerStats = applyRanks(
        champion.tankBase,
        progressionRef.current.ranks,
      )

      let mx = 0
      let my = 0
      if (keys.has('w') || keys.has('arrowup')) my -= 1
      if (keys.has('s') || keys.has('arrowdown')) my += 1
      if (keys.has('a') || keys.has('arrowleft')) mx -= 1
      if (keys.has('d') || keys.has('arrowright')) mx += 1
      const len = Math.hypot(mx, my)
      if (len > 0) {
        mx /= len
        my /= len
      }
      player.pos.x = clamp(
        player.pos.x + mx * playerStats.movementSpeed * dt,
        player.radius,
        WORLD_SIZE - player.radius,
      )
      player.pos.y = clamp(
        player.pos.y + my * playerStats.movementSpeed * dt,
        player.radius,
        WORLD_SIZE - player.radius,
      )

      const camX = clamp(player.pos.x - VIEW_W / 2, 0, WORLD_SIZE - VIEW_W)
      const camY = clamp(player.pos.y - VIEW_H / 2, 0, WORLD_SIZE - VIEW_H)
      const aimX = mouse.x + camX - player.pos.x
      const aimY = mouse.y + camY - player.pos.y
      const aimLen = Math.hypot(aimX, aimY) || 1
      const aimDx = aimX / aimLen
      const aimDy = aimY / aimLen

      player.fireCooldown -= dt
      if (mouse.down && player.fireCooldown <= 0) {
        bullets.push({
          pos: {
            x: player.pos.x + aimDx * (player.radius + 4),
            y: player.pos.y + aimDy * (player.radius + 4),
          },
          vel: {
            x: aimDx * playerStats.bulletSpeed,
            y: aimDy * playerStats.bulletSpeed,
          },
          ttl: BULLET_TTL,
          damage: playerStats.bulletDamage,
          fromPlayer: true,
          radius: 5,
          pierceLeft: Math.max(1, Math.floor(playerStats.bulletPenetration)),
          hitIds: new Set(),
        })
        player.fireCooldown = playerStats.reload
      }

      player.hp = Math.min(
        playerStats.maxHealth,
        player.hp + playerStats.healthRegen * dt,
      )
      player.contactCooldown = Math.max(0, player.contactCooldown - dt)

      for (const en of entities) {
        if (!en.alive) continue
        const dx = player.pos.x - en.pos.x
        const dy = player.pos.y - en.pos.y
        const dist = Math.hypot(dx, dy) || 1
        const ex = dx / dist
        const ey = dy / dist
        const enemySpeed = en.stats.movementSpeed * 0.5
        const approach = dist > 280 ? 1 : -0.3
        en.pos.x = clamp(
          en.pos.x + ex * enemySpeed * approach * dt,
          en.radius,
          WORLD_SIZE - en.radius,
        )
        en.pos.y = clamp(
          en.pos.y + ey * enemySpeed * approach * dt,
          en.radius,
          WORLD_SIZE - en.radius,
        )

        en.cooldown -= dt
        if (dist < 600 && en.cooldown <= 0) {
          bullets.push({
            pos: { x: en.pos.x, y: en.pos.y },
            vel: {
              x: ex * en.stats.bulletSpeed * 0.85,
              y: ey * en.stats.bulletSpeed * 0.85,
            },
            ttl: BULLET_TTL,
            damage: en.stats.bulletDamage,
            fromPlayer: false,
            radius: 4,
            pierceLeft: 1,
            hitIds: new Set(),
          })
          en.cooldown = en.stats.reload + 0.6
        }

        if (dist < player.radius + en.radius && player.contactCooldown <= 0) {
          en.hp -= playerStats.bodyDamage
          player.hp -= en.stats.bodyDamage
          player.contactCooldown = 0.4
          if (en.hp <= 0) {
            en.alive = false
            registerKill(en)
          }
          if (player.hp <= 0) {
            player.hp = 0
            gameOver = true
            recordEndOfRun()
          }
        }
      }

      const surviving: Bullet[] = []
      for (const b of bullets) {
        b.pos.x += b.vel.x * dt
        b.pos.y += b.vel.y * dt
        b.ttl -= dt
        if (
          b.ttl <= 0 ||
          b.pos.x < 0 ||
          b.pos.y < 0 ||
          b.pos.x > WORLD_SIZE ||
          b.pos.y > WORLD_SIZE
        ) {
          continue
        }
        if (b.fromPlayer) {
          let consumed = false
          for (const en of entities) {
            if (!en.alive) continue
            if (b.hitIds.has(en.source.id)) continue
            const d = Math.hypot(en.pos.x - b.pos.x, en.pos.y - b.pos.y)
            if (d < en.radius + b.radius) {
              en.hp -= b.damage
              b.hitIds.add(en.source.id)
              b.pierceLeft -= 1
              if (en.hp <= 0) {
                en.alive = false
                registerKill(en)
              }
              if (b.pierceLeft <= 0) {
                consumed = true
                break
              }
            }
          }
          if (!consumed) surviving.push(b)
        } else {
          const d = Math.hypot(player.pos.x - b.pos.x, player.pos.y - b.pos.y)
          if (d < player.radius + b.radius) {
            player.hp -= b.damage
            if (player.hp <= 0) {
              player.hp = 0
              gameOver = true
              recordEndOfRun()
            }
          } else {
            surviving.push(b)
          }
        }
      }
      bullets = surviving

      respawnIfEmpty()
    }

    const draw = () => {
      const camX = clamp(player.pos.x - VIEW_W / 2, 0, WORLD_SIZE - VIEW_W)
      const camY = clamp(player.pos.y - VIEW_H / 2, 0, WORLD_SIZE - VIEW_H)
      ctx.fillStyle = '#0b0d12'
      ctx.fillRect(0, 0, VIEW_W, VIEW_H)

      ctx.strokeStyle = '#1c2030'
      ctx.lineWidth = 1
      const gridSize = 60
      const startX = -((camX % gridSize) + gridSize) % gridSize
      const startY = -((camY % gridSize) + gridSize) % gridSize
      ctx.beginPath()
      for (let x = startX; x < VIEW_W; x += gridSize) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, VIEW_H)
      }
      for (let y = startY; y < VIEW_H; y += gridSize) {
        ctx.moveTo(0, y)
        ctx.lineTo(VIEW_W, y)
      }
      ctx.stroke()

      ctx.strokeStyle = '#3b4258'
      ctx.lineWidth = 3
      ctx.strokeRect(-camX, -camY, WORLD_SIZE, WORLD_SIZE)

      for (const en of entities) {
        if (!en.alive) continue
        const sx = en.pos.x - camX
        const sy = en.pos.y - camY
        if (sx < -80 || sy < -80 || sx > VIEW_W + 80 || sy > VIEW_H + 80) {
          continue
        }
        ctx.fillStyle = en.color
        ctx.beginPath()
        ctx.arc(sx, sy, en.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#0b0d12'
        ctx.lineWidth = 2
        ctx.stroke()

        const barW = en.radius * 2
        const hpPct = clamp(en.hp / en.stats.maxHealth, 0, 1)
        ctx.fillStyle = '#222'
        ctx.fillRect(sx - en.radius, sy - en.radius - 10, barW, 4)
        ctx.fillStyle = hpPct > 0.4 ? '#4ade80' : '#f87171'
        ctx.fillRect(sx - en.radius, sy - en.radius - 10, barW * hpPct, 4)

        const label =
          en.source.name.length > 38
            ? en.source.name.slice(0, 36) + '...'
            : en.source.name
        ctx.fillStyle = '#e5e7eb'
        ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(label, sx, sy + en.radius + 14)
        ctx.fillStyle = '#9ca3af'
        ctx.font = '10px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText(
          `${en.source.unitClass} L${en.source.level} · ${en.source.topic}`,
          sx,
          sy + en.radius + 26,
        )
      }

      for (const b of bullets) {
        const sx = b.pos.x - camX
        const sy = b.pos.y - camY
        ctx.fillStyle = b.fromPlayer ? '#fde047' : '#fb7185'
        ctx.beginPath()
        ctx.arc(sx, sy, b.radius, 0, Math.PI * 2)
        ctx.fill()
      }

      const px = player.pos.x - camX
      const py = player.pos.y - camY
      const aimX = mouse.x - px
      const aimY = mouse.y - py
      const aimLen = Math.hypot(aimX, aimY) || 1
      const aimDx = aimX / aimLen
      const aimDy = aimY / aimLen

      ctx.fillStyle = '#475569'
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(Math.atan2(aimDy, aimDx))
      ctx.fillRect(0, -8, player.radius + 18, 16)
      ctx.restore()

      ctx.fillStyle = colorForBelief(champion.positivity)
      ctx.beginPath()
      ctx.arc(px, py, player.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 3
      ctx.stroke()

      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)'
        ctx.fillRect(0, 0, VIEW_W, VIEW_H)
        ctx.fillStyle = '#f87171'
        ctx.font = 'bold 48px ui-sans-serif, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', VIEW_W / 2, VIEW_H / 2 - 20)
        ctx.fillStyle = '#e5e7eb'
        ctx.font = '16px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText(
          `Run ${score}  ·  Best ${bestScore}  ·  Career ${careerScore}`,
          VIEW_W / 2,
          VIEW_H / 2 + 12,
        )
        ctx.fillText(
          'Restart to retry, or pick a new champion.',
          VIEW_W / 2,
          VIEW_H / 2 + 36,
        )
      } else if (pausedRef.current) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(0, 0, VIEW_W, VIEW_H)
        ctx.fillStyle = '#e5e7eb'
        ctx.font = 'bold 36px ui-sans-serif, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2)
      }
    }

    const loop = (now: number) => {
      if (!running) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      step(dt)
      draw()
      hudTick += dt
      if (hudTick > 0.1) {
        hudTick = 0
        const snap = progressionRef.current
        const playerStats = applyRanks(champion.tankBase, snap.ranks)
        setHud({
          hp: Math.max(0, Math.round(player.hp)),
          maxHp: Math.round(playerStats.maxHealth),
          level: player.level,
          xp: Math.floor(player.xp),
          xpToNext: xpForLevel(player.level),
          upgradePoints: snap.upgradePoints,
          score,
          bestScore,
          careerScore,
          lastKill,
          enemiesAlive: entities.filter(e => e.alive).length,
          gameOver,
          ranks: { ...snap.ranks },
          effective: playerStats,
        })
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('mouseleave', onMouseUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [enemies, champion, runId, spendUpgrade, togglePaused])

  if (enemies.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-[#10131a] p-8 text-center text-neutral-400">
        No beliefs in the database yet. Seed some beliefs and they will spawn
        as champions and enemies in the arena.
      </div>
    )
  }

  if (!champion) {
    return (
      <ChampionPicker
        roster={sortedRoster}
        onPick={pickChampion}
        bestScore={bestScoreState}
        careerScore={careerScoreState}
      />
    )
  }

  const hpPct = hud ? (hud.hp / Math.max(1, hud.maxHp)) * 100 : 100
  const xpPct = hud ? (hud.xp / Math.max(1, hud.xpToNext)) * 100 : 0
  const ranks = hud?.ranks ?? progression.ranks
  const effective =
    hud?.effective ?? applyRanks(champion.tankBase, progression.ranks)
  const upgradePoints = hud?.upgradePoints ?? progression.upgradePoints
  const score = hud?.score ?? 0
  const bestScore = hud?.bestScore ?? bestScoreState
  const careerScore = hud?.careerScore ?? careerScoreState

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          className="block w-full max-w-full rounded-lg border border-neutral-800 bg-[#0b0d12] shadow-lg"
          style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
        />
        <div className="absolute left-3 top-3 rounded bg-black/60 p-2 text-xs text-white">
          <div className="mb-1 max-w-[280px] truncate font-semibold text-emerald-300">
            {champion.name}
          </div>
          <div className="mb-1 flex items-center gap-2">
            <span className="font-semibold">HP</span>
            <div className="h-2 w-32 overflow-hidden rounded bg-neutral-800">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <span className="tabular-nums">
              {hud?.hp ?? Math.round(champion.tankBase.maxHealth)}/
              {hud?.maxHp ?? Math.round(champion.tankBase.maxHealth)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">L{hud?.level ?? 1}</span>
            <div className="h-2 w-32 overflow-hidden rounded bg-neutral-800">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <span className="tabular-nums">
              {hud?.xp ?? 0}/{hud?.xpToNext ?? xpForLevel(1)}
            </span>
          </div>
        </div>
        <div className="absolute right-3 top-3 rounded bg-black/60 p-2 text-right text-xs text-white">
          <div>
            Run:{' '}
            <span className="font-bold tabular-nums text-emerald-300">
              {score}
            </span>
          </div>
          <div className="text-neutral-300">
            Best:{' '}
            <span className="tabular-nums">{bestScore}</span>
          </div>
          <div className="text-neutral-300">
            Career:{' '}
            <span className="tabular-nums">{careerScore}</span>
          </div>
          <div className="mt-1 text-neutral-400">
            Beliefs left: {hud?.enemiesAlive ?? 0}
          </div>
          {hud?.lastKill && (
            <div className="mt-1 max-w-[220px] truncate text-emerald-300">
              KO: {hud.lastKill}
            </div>
          )}
        </div>
      </div>

      <aside className="flex w-full flex-col gap-2 rounded-lg border border-neutral-800 bg-[#10131a] p-3 lg:w-80">
        <div className="flex gap-2">
          <button
            onClick={togglePaused}
            disabled={hud?.gameOver}
            className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700 disabled:opacity-40"
          >
            {pausedView ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={restart}
            className="flex-1 rounded bg-emerald-700 px-3 py-1.5 text-sm hover:bg-emerald-600"
          >
            Restart
          </button>
        </div>
        <button
          onClick={pickNewChampion}
          className="rounded bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700"
        >
          Pick New Champion
        </button>

        <div className="mt-1 flex items-baseline justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-neutral-500">
            Upgrades
          </span>
          <span className="text-neutral-300">
            Points:{' '}
            <span
              className={
                upgradePoints > 0
                  ? 'font-bold text-yellow-300'
                  : 'tabular-nums'
              }
            >
              {upgradePoints}
            </span>
          </span>
        </div>

        <ul className="space-y-1 text-xs">
          {TANK_STAT_KEYS.map((key, i) => (
            <UpgradeRow
              key={key}
              statKey={key}
              hotkey={i + 1}
              rank={ranks[key]}
              value={effective[key]}
              base={champion.tankBase[key]}
              canSpend={upgradePoints > 0 && ranks[key] < RANK_CAP}
              onSpend={() => spendUpgrade(key)}
            />
          ))}
        </ul>
      </aside>
    </div>
  )
}

function UpgradeRow({
  statKey,
  hotkey,
  rank,
  value,
  base,
  canSpend,
  onSpend,
}: {
  statKey: TankStatKey
  hotkey: number
  rank: number
  value: number
  base: number
  canSpend: boolean
  onSpend: () => void
}) {
  const dots = []
  for (let r = 0; r < RANK_CAP; r += 1) {
    dots.push(
      <span
        key={r}
        className={
          r < rank ? 'text-yellow-300' : 'text-neutral-700'
        }
      >
        &bull;
      </span>,
    )
  }
  const formatted = formatStat(statKey, value)
  const formattedBase = formatStat(statKey, base)
  return (
    <li>
      <button
        onClick={onSpend}
        disabled={!canSpend}
        className={
          'flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left ' +
          (canSpend
            ? 'bg-neutral-900 hover:bg-neutral-800'
            : 'bg-neutral-900/50 opacity-70')
        }
        title={`Base ${formattedBase}; rank ${rank}/${RANK_CAP}; ${
          PER_RANK_MULTIPLIER[statKey] === 0
            ? '+1 per rank'
            : `${(PER_RANK_MULTIPLIER[statKey] * 100).toFixed(0)}% per rank`
        }`}
      >
        <span className="flex w-5 shrink-0 justify-center rounded bg-neutral-800 px-1 text-[10px] tabular-nums text-neutral-400">
          {hotkey}
        </span>
        <span className="flex-1 truncate text-neutral-200">
          {TANK_STAT_LABELS[statKey]}
        </span>
        <span className="shrink-0 tabular-nums text-neutral-300">
          {formatted}
        </span>
        <span className="flex shrink-0 gap-px text-sm leading-none">
          {dots}
        </span>
      </button>
    </li>
  )
}

function formatStat(key: TankStatKey, value: number): string {
  if (key === 'reload') return `${value.toFixed(2)}s`
  if (key === 'healthRegen') return `${value.toFixed(2)}/s`
  if (key === 'bulletPenetration') return value.toFixed(0)
  if (key === 'movementSpeed' || key === 'bulletSpeed') {
    return value.toFixed(0)
  }
  return value.toFixed(1)
}

function ChampionPicker({
  roster,
  onPick,
  bestScore,
  careerScore,
}: {
  roster: ArenaEnemy[]
  onPick: (e: ArenaEnemy) => void
  bestScore: number
  careerScore: number
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-[#10131a] p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-white">
          Pick your champion
        </h2>
        <div className="text-xs text-neutral-400">
          Best run:{' '}
          <span className="tabular-nums text-emerald-300">{bestScore}</span>
          {' · '}
          Career:{' '}
          <span className="tabular-nums text-emerald-300">{careerScore}</span>
        </div>
      </div>
      <p className="mb-3 text-xs text-neutral-400">
        Each belief&apos;s tank stats are derived from its real-world
        characteristics. Bold claims hit harder; settled beliefs absorb more
        damage; specific claims fire faster.
      </p>
      <ul className="grid max-h-[520px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {roster.map(b => (
          <li key={b.id}>
            <button
              onClick={() => onPick(b)}
              className="flex w-full flex-col gap-1 rounded border border-neutral-800 bg-neutral-900 p-2 text-left text-xs hover:border-emerald-600 hover:bg-neutral-800"
            >
              <span className="line-clamp-2 font-semibold text-neutral-100">
                {b.name}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                {b.unitClass} · L{b.level} · {b.topic}
              </span>
              <dl className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-neutral-400">
                <Stat label="HP" value={b.tankBase.maxHealth.toFixed(0)} />
                <Stat
                  label="Regen"
                  value={`${b.tankBase.healthRegen.toFixed(2)}/s`}
                />
                <Stat label="Body" value={b.tankBase.bodyDamage.toFixed(0)} />
                <Stat
                  label="Bullet"
                  value={b.tankBase.bulletDamage.toFixed(0)}
                />
                <Stat
                  label="Pierce"
                  value={b.tankBase.bulletPenetration.toFixed(0)}
                />
                <Stat
                  label="Speed"
                  value={b.tankBase.movementSpeed.toFixed(0)}
                />
                <Stat
                  label="Reload"
                  value={`${b.tankBase.reload.toFixed(2)}s`}
                />
                <Stat
                  label="Bspd"
                  value={b.tankBase.bulletSpeed.toFixed(0)}
                />
              </dl>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-1">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="tabular-nums text-neutral-300">{value}</dd>
    </div>
  )
}
