'use client'

import { useEffect, useRef, useState } from 'react'

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
  vel: Vec
  hp: number
  maxHp: number
  radius: number
  color: string
  cooldown: number
  alive: boolean
}

interface PlayerState {
  pos: Vec
  vel: Vec
  hp: number
  maxHp: number
  level: number
  xp: number
  xpToNext: number
  fireCooldown: number
  radius: number
  attack: number
}

interface Bullet {
  pos: Vec
  vel: Vec
  ttl: number
  damage: number
  fromPlayer: boolean
  radius: number
}

const WORLD_SIZE = 2400
const VIEW_W = 960
const VIEW_H = 600
const PLAYER_SPEED = 220
const PLAYER_FIRE_RATE = 0.18
const BULLET_SPEED = 480
const BULLET_TTL = 1.4

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function colorForBelief(e: ArenaEnemy): string {
  // -100 -> red, 0 -> yellow, +100 -> green
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
    vel: { x: 0, y: 0 },
    hp: maxHp,
    maxHp,
    radius,
    color: colorForBelief(source),
    cooldown: Math.random() * 2,
    alive: true,
  }
}

function makePlayer(): PlayerState {
  return {
    pos: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 },
    vel: { x: 0, y: 0 },
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpToNext: 5,
    fireCooldown: 0,
    radius: 22,
    attack: 18,
  }
}

export default function ArenaGame({ enemies }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [hudState, setHudState] = useState({
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpToNext: 5,
    score: 0,
    lastKill: '' as string,
    enemiesAlive: 0,
    gameOver: false,
  })
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true
    const keys = new Set<string>()
    const mouse = { x: VIEW_W / 2, y: VIEW_H / 2, down: false }

    const player = makePlayer()
    let entities: EnemyEntity[] =
      enemies.length > 0
        ? enemies.map(spawnEnemy)
        : []
    let bullets: Bullet[] = []
    let score = 0
    let lastKill = ''
    let gameOver = false

    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase())
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
      if (entities.filter(e => e.alive).length === 0 && enemies.length > 0) {
        entities = enemies.map(spawnEnemy)
      }
    }

    const step = (dt: number) => {
      if (paused || gameOver) return

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
        player.pos.x + mx * PLAYER_SPEED * dt,
        player.radius,
        WORLD_SIZE - player.radius,
      )
      player.pos.y = clamp(
        player.pos.y + my * PLAYER_SPEED * dt,
        player.radius,
        WORLD_SIZE - player.radius,
      )

      // Aim direction in world space
      const camX = clamp(player.pos.x - VIEW_W / 2, 0, WORLD_SIZE - VIEW_W)
      const camY = clamp(player.pos.y - VIEW_H / 2, 0, WORLD_SIZE - VIEW_H)
      const aimX = mouse.x + camX - player.pos.x
      const aimY = mouse.y + camY - player.pos.y
      const aimLen = Math.hypot(aimX, aimY) || 1
      const aimDx = aimX / aimLen
      const aimDy = aimY / aimLen

      // Player firing
      player.fireCooldown -= dt
      if (mouse.down && player.fireCooldown <= 0) {
        bullets.push({
          pos: {
            x: player.pos.x + aimDx * (player.radius + 4),
            y: player.pos.y + aimDy * (player.radius + 4),
          },
          vel: { x: aimDx * BULLET_SPEED, y: aimDy * BULLET_SPEED },
          ttl: BULLET_TTL,
          damage: player.attack,
          fromPlayer: true,
          radius: 5,
        })
        player.fireCooldown = PLAYER_FIRE_RATE
      }

      // Enemy AI
      for (const en of entities) {
        if (!en.alive) continue
        const dx = player.pos.x - en.pos.x
        const dy = player.pos.y - en.pos.y
        const dist = Math.hypot(dx, dy) || 1
        const speed = 30 + en.source.speed * 0.6
        const ex = dx / dist
        const ey = dy / dist
        // Approach until close, then orbit
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
          bullets.push({
            pos: { x: en.pos.x, y: en.pos.y },
            vel: { x: ex * BULLET_SPEED * 0.7, y: ey * BULLET_SPEED * 0.7 },
            ttl: BULLET_TTL,
            damage: 4 + en.source.attack * 0.18,
            fromPlayer: false,
            radius: 4,
          })
          en.cooldown = 1.4 - clamp(en.source.speed / 100, 0, 1) * 0.9
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
          let hit = false
          for (const en of entities) {
            if (!en.alive) continue
            const d = Math.hypot(en.pos.x - b.pos.x, en.pos.y - b.pos.y)
            if (d < en.radius + b.radius) {
              const reduction = 1 - clamp(en.source.defense / 200, 0, 0.7)
              en.hp -= b.damage * reduction
              hit = true
              if (en.hp <= 0) {
                en.alive = false
                score += 1 + en.source.level
                player.xp += 1 + en.source.level
                lastKill = en.source.name
                while (player.xp >= player.xpToNext) {
                  player.xp -= player.xpToNext
                  player.level += 1
                  player.xpToNext = Math.ceil(player.xpToNext * 1.5)
                  player.maxHp += 20
                  player.hp = Math.min(player.hp + 30, player.maxHp)
                  player.attack += 3
                }
              }
              break
            }
          }
          if (!hit) surviving.push(b)
        } else {
          const d = Math.hypot(player.pos.x - b.pos.x, player.pos.y - b.pos.y)
          if (d < player.radius + b.radius) {
            player.hp -= b.damage
            if (player.hp <= 0) {
              player.hp = 0
              gameOver = true
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

      // Grid
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

      // World border
      ctx.strokeStyle = '#3b4258'
      ctx.lineWidth = 3
      ctx.strokeRect(-camX, -camY, WORLD_SIZE, WORLD_SIZE)

      // Enemies
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

        // HP bar
        const barW = en.radius * 2
        const hpPct = clamp(en.hp / en.maxHp, 0, 1)
        ctx.fillStyle = '#222'
        ctx.fillRect(sx - en.radius, sy - en.radius - 10, barW, 4)
        ctx.fillStyle = hpPct > 0.4 ? '#4ade80' : '#f87171'
        ctx.fillRect(sx - en.radius, sy - en.radius - 10, barW * hpPct, 4)

        // Label (truncated)
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

      // Bullets
      for (const b of bullets) {
        const sx = b.pos.x - camX
        const sy = b.pos.y - camY
        ctx.fillStyle = b.fromPlayer ? '#fde047' : '#fb7185'
        ctx.beginPath()
        ctx.arc(sx, sy, b.radius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Player
      const px = player.pos.x - camX
      const py = player.pos.y - camY
      const aimX = mouse.x - px
      const aimY = mouse.y - py
      const aimLen = Math.hypot(aimX, aimY) || 1
      const aimDx = aimX / aimLen
      const aimDy = aimY / aimLen

      // Barrel
      ctx.fillStyle = '#475569'
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(Math.atan2(aimDy, aimDx))
      ctx.fillRect(0, -8, player.radius + 18, 16)
      ctx.restore()

      // Body
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
          'Click "Restart" below to try again.',
          VIEW_W / 2,
          VIEW_H / 2 + 48,
        )
      } else if (paused) {
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
          xp: player.xp,
          xpToNext: player.xpToNext,
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
  }, [enemies, paused])

  if (enemies.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-[#10131a] p-8 text-center text-neutral-400">
        No beliefs in the database yet. Seed some beliefs and they will spawn
        as enemies in the arena.
      </div>
    )
  }

  const hpPct = (hudState.hp / hudState.maxHp) * 100
  const xpPct = (hudState.xp / hudState.xpToNext) * 100

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
        </div>
        <div className="absolute right-3 top-3 rounded bg-black/60 p-2 text-right text-xs text-white">
          <div>
            Score:{' '}
            <span className="font-bold tabular-nums">{hudState.score}</span>
          </div>
          <div className="text-neutral-400">
            Beliefs left: {hudState.enemiesAlive}
          </div>
          {hudState.lastKill && (
            <div className="mt-1 max-w-[220px] truncate text-emerald-300">
              KO: {hudState.lastKill}
            </div>
          )}
        </div>
      </div>
      <aside className="flex w-full flex-col gap-2 rounded-lg border border-neutral-800 bg-[#10131a] p-3 lg:w-72">
        <div className="flex gap-2">
          <button
            onClick={() => setPaused(p => !p)}
            disabled={hudState.gameOver}
            className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700 disabled:opacity-40"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => {
              setPaused(false)
              setHudState(s => ({ ...s, gameOver: false }))
              // re-mount the canvas effect by toggling a key would be cleaner;
              // simplest: reload the page so server-side fetch reseeds enemies too.
              window.location.reload()
            }}
            className="flex-1 rounded bg-emerald-700 px-3 py-1.5 text-sm hover:bg-emerald-600"
          >
            Restart
          </button>
        </div>
        <h3 className="mt-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Enemy roster ({enemies.length})
        </h3>
        <ul className="max-h-72 space-y-1 overflow-y-auto text-xs text-neutral-400">
          {enemies.slice(0, 40).map(e => (
            <li key={e.id} className="flex items-center justify-between gap-2">
              <span className="truncate" title={e.name}>
                {e.name}
              </span>
              <span className="shrink-0 text-neutral-500">L{e.level}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
