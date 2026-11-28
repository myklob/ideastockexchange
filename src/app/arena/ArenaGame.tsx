'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BeliefUnitInput } from '@/lib/battlefield'
import {
  applyTankRanks,
  computeTankBaseStats,
  emptyRanks,
  MAX_RANK,
  TANK_STAT_KEYS,
  TANK_STAT_LABELS,
  xpForLevel,
  type TankStatKey,
  type TankStats,
} from '@/lib/arena-tank'

export interface ArenaEnemy {
  id: number
  slug: string
  name: string
  topic: string
  positivity: number
  hp: number
  attack: number
  defense: number
  speed: number
  level: number
  unitClass: string
  tankInput: BeliefUnitInput
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
  pos: Vec
  hp: number
  maxHp: number
  radius: number
  color: string
  cooldown: number
  contactCooldown: number
  alive: boolean
}

interface PlayerState {
  pos: Vec
  hp: number
  maxHp: number
  level: number
  xp: number
  upgradePoints: number
  fireCooldown: number
  radius: number
  stats: TankStats
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

const WORLD_SIZE = 2400
const VIEW_W = 960
const VIEW_H = 600
const BULLET_TTL = 1.4
const BEST_SCORE_KEY = 'arena:bestScore'
const CAREER_SCORE_KEY = 'arena:careerScore'

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function colorForBelief(e: ArenaEnemy): string {
  const t = clamp((e.positivity + 100) / 200, 0, 1)
  const r = Math.round(220 * (1 - t) + 90 * t)
  const g = Math.round(80 * (1 - t) + 200 * t)
  const b = 90
  return `rgb(${r}, ${g}, ${b})`
}

function spawnEnemy(source: ArenaEnemy): EnemyEntity {
  const radius = 18 + (source.hp / 100) * 22
  const maxHp = 30 + source.hp * 1.6
  return {
    source,
    pos: {
      x: Math.random() * WORLD_SIZE,
      y: Math.random() * WORLD_SIZE,
    },
    hp: maxHp,
    maxHp,
    radius,
    color: colorForBelief(source),
    cooldown: Math.random() * 2,
    contactCooldown: 0,
    alive: true,
  }
}

function makePlayer(stats: TankStats): PlayerState {
  return {
    pos: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 },
    hp: stats.maxHealth,
    maxHp: stats.maxHealth,
    level: 1,
    xp: 0,
    upgradePoints: 0,
    fireCooldown: 0,
    radius: 22,
    stats,
  }
}

function readNumber(key: string): number {
  if (typeof window === 'undefined') return 0
  const raw = window.localStorage.getItem(key)
  if (!raw) return 0
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function writeNumber(key: string, value: number) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, String(Math.floor(value)))
}

export default function ArenaGame({ enemies }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [championId, setChampionId] = useState<number | null>(
    enemies[0]?.id ?? null,
  )
  const [runId, setRunId] = useState(0)
  const [paused, setPaused] = useState(false)
  const [ranks, setRanks] = useState<Record<TankStatKey, number>>(emptyRanks())
  const [bestScore, setBestScore] = useState(0)
  const [careerScore, setCareerScore] = useState(0)
  const [hudState, setHudState] = useState({
    hp: 0,
    maxHp: 0,
    level: 1,
    xp: 0,
    xpToNext: 5,
    upgradePoints: 0,
    score: 0,
    lastKill: '' as string,
    enemiesAlive: 0,
    gameOver: false,
  })

  const champion = useMemo(
    () => enemies.find(e => e.id === championId) ?? enemies[0] ?? null,
    [enemies, championId],
  )

  const ranksRef = useRef(ranks)
  const pausedRef = useRef(paused)

  useEffect(() => {
    ranksRef.current = ranks
  }, [ranks])

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  // Hydrate persistent scores from localStorage on mount. Reading window
  // during render isn't safe (SSR), so we mirror into state after mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setBestScore(readNumber(BEST_SCORE_KEY))
    setCareerScore(readNumber(CAREER_SCORE_KEY))
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const restart = useCallback(() => {
    setPaused(false)
    setRanks(emptyRanks())
    setRunId(id => id + 1)
  }, [])

  const pickChampion = useCallback(
    (id: number) => {
      if (id === championId) return
      setChampionId(id)
      setRanks(emptyRanks())
      setRunId(rid => rid + 1)
      setPaused(false)
    },
    [championId],
  )

  // Queue of upgrade requests from the side-panel UI; the game loop owns
  // the authoritative upgradePoints counter and drains this each frame.
  const pendingUpgradesRef = useRef<TankStatKey[]>([])

  const spendPoint = useCallback((key: TankStatKey) => {
    pendingUpgradesRef.current.push(key)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !champion) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const baseStats = computeTankBaseStats(champion.tankInput)
    const initialStats = applyTankRanks(baseStats, ranksRef.current)

    let running = true
    const keys = new Set<string>()
    const mouse = { x: VIEW_W / 2, y: VIEW_H / 2, down: false }

    const player = makePlayer(initialStats)
    const enemyPool = enemies.filter(e => e.id !== champion.id)
    let entities: EnemyEntity[] =
      enemyPool.length > 0 ? enemyPool.map(spawnEnemy) : []
    let bullets: Bullet[] = []
    let score = 0
    let runCareer = 0
    let lastKill = ''
    let gameOver = false
    const recomputePlayerStats = () => {
      const stats = applyTankRanks(baseStats, ranksRef.current)
      const ratio = player.maxHp > 0 ? player.hp / player.maxHp : 1
      player.maxHp = stats.maxHealth
      player.hp = clamp(stats.maxHealth * ratio, 0, stats.maxHealth)
      player.stats = stats
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      keys.add(k)
      // Upgrade keys 1..8 → spend a point on the corresponding stat.
      const slot = '12345678'.indexOf(k)
      if (slot >= 0 && player.upgradePoints > 0 && !gameOver) {
        const statKey = TANK_STAT_KEYS[slot]
        if ((ranksRef.current[statKey] ?? 0) < MAX_RANK) {
          player.upgradePoints -= 1
          setRanks(prev => ({ ...prev, [statKey]: (prev[statKey] ?? 0) + 1 }))
          recomputePlayerStats()
        }
      }
      if (k === 'p') setPaused(p => !p)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase())
    }
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

    let last = performance.now()

    const respawnIfEmpty = () => {
      if (entities.filter(e => e.alive).length === 0 && enemyPool.length > 0) {
        entities = enemyPool.map(spawnEnemy)
      }
    }

    const drainPendingUpgrades = () => {
      const queue = pendingUpgradesRef.current
      if (queue.length === 0) return
      let applied = false
      while (queue.length > 0 && player.upgradePoints > 0) {
        const k = queue.shift()!
        if ((ranksRef.current[k] ?? 0) >= MAX_RANK) continue
        player.upgradePoints -= 1
        setRanks(prev => ({ ...prev, [k]: (prev[k] ?? 0) + 1 }))
        applied = true
      }
      // Drop any leftover unauthorized requests (stat at cap, no points).
      queue.length = 0
      if (applied) recomputePlayerStats()
    }

    const step = (dt: number) => {
      if (pausedRef.current || gameOver) return
      drainPendingUpgrades()

      // Player movement
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
        player.pos.x + mx * player.stats.movementSpeed * dt,
        player.radius,
        WORLD_SIZE - player.radius,
      )
      player.pos.y = clamp(
        player.pos.y + my * player.stats.movementSpeed * dt,
        player.radius,
        WORLD_SIZE - player.radius,
      )

      // Passive regen
      player.hp = clamp(
        player.hp + player.stats.healthRegen * dt,
        0,
        player.maxHp,
      )

      // Aim direction in world space
      const camX = clamp(player.pos.x - VIEW_W / 2, 0, WORLD_SIZE - VIEW_W)
      const camY = clamp(player.pos.y - VIEW_H / 2, 0, WORLD_SIZE - VIEW_H)
      const aimX = mouse.x + camX - player.pos.x
      const aimY = mouse.y + camY - player.pos.y
      const aimLen = Math.hypot(aimX, aimY) || 1
      const aimDx = aimX / aimLen
      const aimDy = aimY / aimLen

      // Player firing — reload (sec/shot) gates the cadence.
      player.fireCooldown -= dt
      if (mouse.down && player.fireCooldown <= 0) {
        const speed = player.stats.bulletSpeed
        const b: Bullet = {
          pos: {
            x: player.pos.x + aimDx * (player.radius + 4),
            y: player.pos.y + aimDy * (player.radius + 4),
          },
          vel: { x: aimDx * speed, y: aimDy * speed },
          ttl: BULLET_TTL,
          damage: player.stats.bulletDamage,
          fromPlayer: true,
          radius: 5 + Math.min(4, player.stats.bulletDamage / 10),
          pierceLeft: Math.max(1, Math.floor(player.stats.bulletPenetration)),
          hitIds: new Set(),
        }
        bullets.push(b)
        player.fireCooldown = player.stats.reload
      }

      // Enemy AI + contact damage
      for (const en of entities) {
        if (!en.alive) continue
        const dx = player.pos.x - en.pos.x
        const dy = player.pos.y - en.pos.y
        const dist = Math.hypot(dx, dy) || 1
        const speed = 30 + en.source.speed * 0.6
        const ex = dx / dist
        const ey = dy / dist
        const approach = dist > 280 ? 1 : -0.3
        en.pos.x = clamp(
          en.pos.x + ex * speed * approach * dt,
          en.radius,
          WORLD_SIZE - en.radius,
        )
        en.pos.y = clamp(
          en.pos.y + ey * speed * approach * dt,
          en.radius,
          WORLD_SIZE - en.radius,
        )

        en.cooldown -= dt
        if (dist < 480 && en.cooldown <= 0) {
          const enemyBulletSpeed = 380
          bullets.push({
            pos: { x: en.pos.x, y: en.pos.y },
            vel: { x: ex * enemyBulletSpeed, y: ey * enemyBulletSpeed },
            ttl: BULLET_TTL,
            damage: 4 + en.source.attack * 0.18,
            fromPlayer: false,
            radius: 4,
            pierceLeft: 1,
            hitIds: new Set(),
          })
          en.cooldown = 1.4 - clamp(en.source.speed / 100, 0, 1) * 0.9
        }

        // Contact: ramming. Player body damage hits enemy, enemy body
        // damage hits player. Both apply on a 0.4s shared cooldown to
        // avoid melting at full framerate.
        en.contactCooldown = Math.max(0, en.contactCooldown - dt)
        if (dist < player.radius + en.radius && en.contactCooldown === 0) {
          en.hp -= player.stats.bodyDamage
          player.hp -= 6 + en.source.attack * 0.12
          en.contactCooldown = 0.4
          if (en.hp <= 0) {
            en.alive = false
            const reward = 1 + en.source.level
            score += reward
            runCareer += reward
            player.xp += reward
            lastKill = en.source.name
            // Level up loop
            while (player.xp >= xpForLevel(player.level)) {
              player.xp -= xpForLevel(player.level)
              player.level += 1
              player.upgradePoints += 1
            }
          }
        }
      }

      // Bullets
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
              const reduction = 1 - clamp(en.source.defense / 200, 0, 0.7)
              en.hp -= b.damage * reduction
              b.hitIds.add(en.source.id)
              b.pierceLeft -= 1
              // Damage falloff per pierce so penetration is good but not infinite.
              b.damage *= 0.7
              if (en.hp <= 0) {
                en.alive = false
                const reward = 1 + en.source.level
                score += reward
                runCareer += reward
                player.xp += reward
                lastKill = en.source.name
                while (player.xp >= xpForLevel(player.level)) {
                  player.xp -= xpForLevel(player.level)
                  player.level += 1
                  player.upgradePoints += 1
                }
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
          } else {
            surviving.push(b)
          }
        }
      }
      bullets = surviving

      if (player.hp <= 0) {
        player.hp = 0
        gameOver = true
        // End-of-run book-keeping: persist career delta and update best.
        const careerNew = readNumber(CAREER_SCORE_KEY) + runCareer
        writeNumber(CAREER_SCORE_KEY, careerNew)
        setCareerScore(careerNew)
        const bestNew = Math.max(readNumber(BEST_SCORE_KEY), score)
        writeNumber(BEST_SCORE_KEY, bestNew)
        setBestScore(bestNew)
        runCareer = 0
      }

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
        if (
          sx < -80 ||
          sy < -80 ||
          sx > VIEW_W + 80 ||
          sy > VIEW_H + 80
        ) {
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
        const hpPct = clamp(en.hp / en.maxHp, 0, 1)
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

      ctx.fillStyle = '#38bdf8'
      ctx.beginPath()
      ctx.arc(px, py, player.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#0b0d12'
      ctx.lineWidth = 3
      ctx.stroke()

      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, VIEW_W, VIEW_H)
        ctx.fillStyle = '#f87171'
        ctx.font = 'bold 48px ui-sans-serif, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', VIEW_W / 2, VIEW_H / 2 - 10)
        ctx.fillStyle = '#e5e7eb'
        ctx.font = '16px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText(
          `Score: ${score} · Level: ${player.level}`,
          VIEW_W / 2,
          VIEW_H / 2 + 24,
        )
        ctx.fillText(
          'Click "Restart" or pick a new champion below.',
          VIEW_W / 2,
          VIEW_H / 2 + 48,
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

    let frame = 0
    let hudTick = 0
    const loop = (now: number) => {
      if (!running) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      step(dt)
      draw()
      hudTick += dt
      if (hudTick > 0.1) {
        hudTick = 0
        setHudState({
          hp: Math.max(0, Math.round(player.hp)),
          maxHp: Math.round(player.maxHp),
          level: player.level,
          xp: Math.floor(player.xp),
          xpToNext: xpForLevel(player.level),
          upgradePoints: player.upgradePoints,
          score,
          lastKill,
          enemiesAlive: entities.filter(e => e.alive).length,
          gameOver,
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
    // runId triggers a hard remount on champion change or restart click;
    // paused/ranks live in refs so toggling them doesn't tear down the loop.
  }, [enemies, champion, runId])

  if (enemies.length === 0 || !champion) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-[#10131a] p-8 text-center text-neutral-400">
        No beliefs in the database yet. Seed some beliefs and they will spawn
        as enemies in the arena.
      </div>
    )
  }

  const hpPct = hudState.maxHp > 0 ? (hudState.hp / hudState.maxHp) * 100 : 0
  const xpPct = hudState.xpToNext > 0 ? (hudState.xp / hudState.xpToNext) * 100 : 0
  const baseStats = computeTankBaseStats(champion.tankInput)
  const liveStats = applyTankRanks(baseStats, ranks)

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
          <div className="mb-1 flex items-center gap-2">
            <span className="font-semibold">HP</span>
            <div className="h-2 w-32 overflow-hidden rounded bg-neutral-800">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <span className="tabular-nums">
              {hudState.hp}/{hudState.maxHp}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">L{hudState.level}</span>
            <div className="h-2 w-32 overflow-hidden rounded bg-neutral-800">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <span className="tabular-nums">
              {hudState.xp}/{hudState.xpToNext}
            </span>
          </div>
          {hudState.upgradePoints > 0 && (
            <div className="mt-1 text-[11px] font-semibold text-amber-300">
              {hudState.upgradePoints} upgrade point
              {hudState.upgradePoints === 1 ? '' : 's'} (press 1&ndash;8)
            </div>
          )}
        </div>
        <div className="absolute right-3 top-3 rounded bg-black/60 p-2 text-right text-xs text-white">
          <div>
            Run:{' '}
            <span className="font-bold tabular-nums">{hudState.score}</span>
          </div>
          <div className="text-amber-300">
            Best:{' '}
            <span className="font-semibold tabular-nums">
              {Math.max(bestScore, hudState.score)}
            </span>
          </div>
          <div className="text-emerald-300">
            Career:{' '}
            <span className="font-semibold tabular-nums">
              {careerScore + (hudState.gameOver ? 0 : hudState.score)}
            </span>
          </div>
          <div className="mt-1 text-neutral-400">
            Beliefs left: {hudState.enemiesAlive}
          </div>
          {hudState.lastKill && (
            <div className="mt-1 max-w-[220px] truncate text-emerald-300">
              KO: {hudState.lastKill}
            </div>
          )}
        </div>
      </div>

      <aside className="flex w-full flex-col gap-2 rounded-lg border border-neutral-800 bg-[#10131a] p-3 lg:w-80">
        <div className="flex gap-2">
          <button
            onClick={() => setPaused(p => !p)}
            disabled={hudState.gameOver}
            className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700 disabled:opacity-40"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={restart}
            className="flex-1 rounded bg-emerald-700 px-3 py-1.5 text-sm hover:bg-emerald-600"
          >
            Restart
          </button>
        </div>

        <div className="mt-2 rounded border border-neutral-800 bg-[#0e1118] p-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Champion
          </div>
          <div className="text-sm font-semibold text-white" title={champion.name}>
            {champion.name}
          </div>
          <div className="text-[11px] text-neutral-400">
            {champion.unitClass} · {champion.topic}
          </div>
        </div>

        <div className="mt-1">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            <span>Tank Stats</span>
            <span className="text-amber-300">
              {hudState.upgradePoints > 0
                ? `${hudState.upgradePoints} pt`
                : 'Spend on level-up'}
            </span>
          </div>
          <ul className="mt-1 space-y-1">
            {TANK_STAT_KEYS.map((k, i) => {
              const rank = ranks[k] ?? 0
              const canSpend =
                hudState.upgradePoints > 0 && rank < MAX_RANK && !hudState.gameOver
              return (
                <li key={k}>
                  <button
                    onClick={() => spendPoint(k)}
                    disabled={!canSpend}
                    className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-[12px] ${
                      canSpend
                        ? 'bg-neutral-800 hover:bg-neutral-700'
                        : 'bg-neutral-900 text-neutral-500'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <kbd className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-neutral-300">
                        {i + 1}
                      </kbd>
                      <span>{TANK_STAT_LABELS[k]}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums text-neutral-400">
                        {formatStatValue(k, liveStats[k])}
                      </span>
                      <span className="font-mono text-[10px] text-amber-300">
                        {renderRankPips(rank)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <h3 className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          Pick a champion ({enemies.length})
        </h3>
        <ul className="max-h-56 space-y-1 overflow-y-auto text-xs">
          {enemies.map(e => {
            const active = e.id === championId
            return (
              <li key={e.id}>
                <button
                  onClick={() => pickChampion(e.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left ${
                    active
                      ? 'bg-sky-700 text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`}
                  title={e.name}
                >
                  <span className="truncate">{e.name}</span>
                  <span className="shrink-0 text-[10px] opacity-70">
                    L{e.level}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>
    </div>
  )
}

function formatStatValue(key: TankStatKey, value: number): string {
  if (key === 'reload') return `${value.toFixed(2)}s`
  if (key === 'healthRegen') return `${value.toFixed(2)}/s`
  if (key === 'bulletPenetration') return value.toFixed(1)
  return Math.round(value).toString()
}

function renderRankPips(rank: number): string {
  return '●'.repeat(rank) + '○'.repeat(MAX_RANK - rank)
}
