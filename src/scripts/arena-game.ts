import {
  applyStatRanks,
  MAX_STAT_RANK,
  STAT_NAMES,
  type ChampionStats,
  type StatName,
} from '../lib/battlefield';

export interface ArenaBelief {
  slug: string;
  name: string;
  topic: string;
  positivity: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
  unitClass: string;
  champion: ChampionStats;
}

interface Vec {
  x: number;
  y: number;
}

interface Enemy {
  source: ArenaBelief;
  pos: Vec;
  hp: number;
  maxHp: number;
  radius: number;
  color: string;
  cooldown: number;
  alive: boolean;
}

interface Bullet {
  pos: Vec;
  vel: Vec;
  ttl: number;
  damage: number;
  fromPlayer: boolean;
  radius: number;
  remaining: number;
}

interface Player {
  pos: Vec;
  hp: number;
  level: number;
  xp: number;
  xpToNext: number;
  fireCooldown: number;
  damageCooldown: number;
  bodyContactCooldown: number;
  radius: number;
  unspentPoints: number;
  ranks: Record<StatName, number>;
}

const WORLD = 2400;
const VIEW_W = 960;
const VIEW_H = 600;
const BULLET_TTL = 1.4;
const REGEN_DELAY = 2.0;
const BODY_HIT_INTERVAL = 0.4;
const BEST_KEY = 'arena:bestScore';
const CAREER_KEY = 'arena:careerScore';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function colorFor(e: ArenaBelief): string {
  const t = clamp((e.positivity + 100) / 200, 0, 1);
  const r = Math.round(220 * (1 - t) + 90 * t);
  const g = Math.round(80 * (1 - t) + 200 * t);
  return `rgb(${r}, ${g}, 90)`;
}

function spawnEnemy(source: ArenaBelief): Enemy {
  const maxHp = 30 + source.hp * 1.6;
  return {
    source,
    pos: { x: Math.random() * WORLD, y: Math.random() * WORLD },
    hp: maxHp,
    maxHp,
    radius: 18 + (source.hp / 100) * 22,
    color: colorFor(source),
    cooldown: Math.random() * 2,
    alive: true,
  };
}

function emptyRanks(): Record<StatName, number> {
  return {
    healthRegen: 0,
    maxHealth: 0,
    bodyDamage: 0,
    bulletSpeed: 0,
    bulletPenetration: 0,
    bulletDamage: 0,
    reload: 0,
    movementSpeed: 0,
  };
}

function readInt(key: string): number {
  try {
    const v = parseInt(localStorage.getItem(key) ?? '0', 10);
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

function writeInt(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* storage unavailable (private mode etc.) — scores just won't persist */
  }
}

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Arena: missing #${id}`);
  return el as T;
}

function formatStat(name: StatName, value: number): string {
  if (name === 'reload') return `${value.toFixed(2)}s`;
  if (name === 'healthRegen') return `${value.toFixed(1)}/s`;
  return String(Math.round(value));
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 2) + '…' : s;
}

export function startArena() {
  const dataEl = document.getElementById('arena-data');
  if (!dataEl) return;
  const roster = JSON.parse(dataEl.textContent ?? '[]') as ArenaBelief[];
  if (roster.length === 0) return;

  const picker = $('picker');
  const game = $('game');
  const search = $<HTMLInputElement>('picker-search');
  const list = $('picker-list');
  const empty = $('picker-empty');

  let best = readInt(BEST_KEY);
  let career = readInt(CAREER_KEY);
  const refreshPickerScores = () => {
    $('pick-best').textContent = String(best);
    $('pick-career').textContent = String(career);
  };
  refreshPickerScores();

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const li of Array.from(list.children) as HTMLElement[]) {
      const hit = q === '' || li.dataset.name?.includes(q) || li.dataset.topic?.includes(q);
      li.hidden = !hit;
      if (hit) shown++;
    }
    empty.hidden = shown > 0;
  });

  let stop: (() => void) | null = null;

  list.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>('button.pick');
    if (!btn) return;
    const champion = roster.find((r) => r.slug === btn.dataset.slug);
    if (!champion) return;
    picker.hidden = true;
    game.hidden = false;
    stop = runSession(champion, roster.filter((r) => r !== champion), {
      best,
      career,
      onScore(score, runEnded) {
        if (score > best) {
          best = score;
          writeInt(BEST_KEY, best);
        }
        if (runEnded) {
          career += score;
          writeInt(CAREER_KEY, career);
        }
        return { best, career };
      },
      onExit() {
        stop?.();
        stop = null;
        game.hidden = true;
        picker.hidden = false;
        refreshPickerScores();
      },
    });
  });
}

interface SessionHooks {
  best: number;
  career: number;
  onScore(score: number, runEnded: boolean): { best: number; career: number };
  onExit(): void;
}

function runSession(champion: ArenaBelief, roster: ArenaBelief[], hooks: SessionHooks): () => void {
  const canvas = $<HTMLCanvasElement>('arena');
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const base = champion.champion;
  const player: Player = {
    pos: { x: WORLD / 2, y: WORLD / 2 },
    hp: base.maxHealth,
    level: 1,
    xp: 0,
    xpToNext: 5,
    fireCooldown: 0,
    damageCooldown: 0,
    bodyContactCooldown: 0,
    radius: 22,
    unspentPoints: 0,
    ranks: emptyRanks(),
  };
  let entities = roster.map(spawnEnemy);
  let bullets: Bullet[] = [];
  let score = 0;
  let lastKill = '';
  let gameOver = false;
  let paused = false;
  let reportedDeath = false;
  let { best, career } = hooks;

  const stats = () => applyStatRanks(base, player.ranks);

  const hud = {
    champion: $('hud-champion'),
    hpBar: $('hud-hp-bar'),
    hp: $('hud-hp'),
    level: $('hud-level'),
    xpBar: $('hud-xp-bar'),
    xp: $('hud-xp'),
    points: $('hud-points'),
    score: $('hud-score'),
    best: $('hud-best'),
    career: $('hud-career'),
    left: $('hud-left'),
    kill: $('hud-kill'),
    panelPoints: $('panel-points'),
    pause: $<HTMLButtonElement>('btn-pause'),
    newChampion: $<HTMLButtonElement>('btn-new'),
    upgrades: Array.from(document.querySelectorAll<HTMLButtonElement>('button.upgrade')),
  };
  hud.champion.textContent = `Champion: ${champion.name}`;
  hud.kill.textContent = '';

  const renderPanel = () => {
    const s = stats();
    hud.panelPoints.textContent = `${player.unspentPoints} pts`;
    hud.panelPoints.classList.toggle('warn', player.unspentPoints > 0);
    hud.points.hidden = player.unspentPoints === 0;
    hud.points.textContent = `${player.unspentPoints} upgrade point${player.unspentPoints === 1 ? '' : 's'} — press 1-8`;
    for (const btn of hud.upgrades) {
      const name = btn.dataset.stat as StatName;
      const rank = player.ranks[name];
      btn.disabled = gameOver || player.unspentPoints <= 0 || rank >= MAX_STAT_RANK;
      btn.querySelector('[data-value]')!.textContent = formatStat(name, s[name]);
      btn.querySelector('[data-pips]')!.textContent =
        '■'.repeat(rank) + '□'.repeat(MAX_STAT_RANK - rank);
    }
  };

  const renderHud = () => {
    const s = stats();
    hud.hpBar.style.width = `${clamp((player.hp / s.maxHealth) * 100, 0, 100)}%`;
    hud.hp.textContent = `${Math.max(0, Math.round(player.hp))}/${Math.round(s.maxHealth)}`;
    hud.level.textContent = `L${player.level}`;
    hud.xpBar.style.width = `${clamp((player.xp / player.xpToNext) * 100, 0, 100)}%`;
    hud.xp.textContent = `${player.xp}/${player.xpToNext}`;
    hud.score.textContent = String(score);
    hud.best.textContent = String(best);
    hud.career.textContent = String(career);
    hud.left.textContent = String(entities.filter((e) => e.alive).length);
    hud.kill.textContent = lastKill ? `KO: ${lastKill}` : '';
  };

  const upgrade = (name: StatName) => {
    if (gameOver || player.unspentPoints <= 0 || player.ranks[name] >= MAX_STAT_RANK) return;
    const before = stats().maxHealth;
    player.ranks[name] += 1;
    player.unspentPoints -= 1;
    const after = stats().maxHealth;
    if (after > before) player.hp = Math.min(player.hp + (after - before), after);
    renderPanel();
    renderHud();
  };

  const grantXp = (amount: number, killName: string) => {
    player.xp += amount;
    lastKill = killName;
    while (player.xp >= player.xpToNext) {
      player.xp -= player.xpToNext;
      player.level += 1;
      player.unspentPoints += 1;
      player.xpToNext = Math.ceil(player.xpToNext * 1.5);
      const s = stats();
      player.hp = Math.min(s.maxHealth, player.hp + s.maxHealth * 0.2);
    }
    renderPanel();
  };

  const keys = new Set<string>();
  const mouse = { x: VIEW_W / 2, y: VIEW_H / 2, down: false };

  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    keys.add(k);
    if (k >= '1' && k <= '8') {
      const stat = STAT_NAMES[parseInt(k, 10) - 1];
      if (stat) upgrade(stat);
    }
    if (k === 'p' || k === 'escape') togglePause();
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
  const onMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) * canvas.width) / rect.width;
    mouse.y = ((e.clientY - rect.top) * canvas.height) / rect.height;
  };
  const onMouseDown = () => (mouse.down = true);
  const onMouseUp = () => (mouse.down = false);
  const onBlur = () => {
    keys.clear();
    mouse.down = false;
  };
  const onUpgradeClick = (e: Event) => {
    const btn = (e.currentTarget as HTMLButtonElement).dataset.stat as StatName;
    upgrade(btn);
  };
  const togglePause = () => {
    if (gameOver) return;
    paused = !paused;
    hud.pause.textContent = paused ? 'Resume' : 'Pause';
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);
  window.addEventListener('blur', onBlur);
  hud.pause.addEventListener('click', togglePause);
  hud.newChampion.addEventListener('click', hooks.onExit);
  for (const btn of hud.upgrades) btn.addEventListener('click', onUpgradeClick);
  hud.pause.textContent = 'Pause';
  hud.pause.disabled = false;

  const step = (dt: number) => {
    if (paused || gameOver) return;
    const s = stats();

    let mx = 0;
    let my = 0;
    if (keys.has('w') || keys.has('arrowup')) my -= 1;
    if (keys.has('s') || keys.has('arrowdown')) my += 1;
    if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
    if (keys.has('d') || keys.has('arrowright')) mx += 1;
    const len = Math.hypot(mx, my);
    if (len > 0) {
      mx /= len;
      my /= len;
    }
    player.pos.x = clamp(player.pos.x + mx * s.movementSpeed * dt, player.radius, WORLD - player.radius);
    player.pos.y = clamp(player.pos.y + my * s.movementSpeed * dt, player.radius, WORLD - player.radius);

    player.damageCooldown = Math.max(0, player.damageCooldown - dt);
    if (player.damageCooldown <= 0 && player.hp < s.maxHealth) {
      player.hp = Math.min(s.maxHealth, player.hp + s.healthRegen * dt);
    }
    player.bodyContactCooldown = Math.max(0, player.bodyContactCooldown - dt);

    const camX = clamp(player.pos.x - VIEW_W / 2, 0, WORLD - VIEW_W);
    const camY = clamp(player.pos.y - VIEW_H / 2, 0, WORLD - VIEW_H);
    const aimX = mouse.x + camX - player.pos.x;
    const aimY = mouse.y + camY - player.pos.y;
    const aimLen = Math.hypot(aimX, aimY) || 1;
    const adx = aimX / aimLen;
    const ady = aimY / aimLen;

    player.fireCooldown -= dt;
    if (mouse.down && player.fireCooldown <= 0) {
      bullets.push({
        pos: { x: player.pos.x + adx * (player.radius + 4), y: player.pos.y + ady * (player.radius + 4) },
        vel: { x: adx * s.bulletSpeed, y: ady * s.bulletSpeed },
        ttl: BULLET_TTL,
        damage: s.bulletDamage,
        fromPlayer: true,
        radius: 5,
        remaining: Math.max(1, Math.round(s.bulletPenetration)),
      });
      player.fireCooldown = s.reload;
    }

    const hurtPlayer = (amount: number) => {
      player.hp -= amount;
      player.damageCooldown = REGEN_DELAY;
      if (player.hp <= 0) {
        player.hp = 0;
        gameOver = true;
      }
    };
    const kill = (en: Enemy) => {
      en.alive = false;
      const reward = 1 + en.source.level;
      score += reward;
      grantXp(reward, en.source.name);
    };

    for (const en of entities) {
      if (!en.alive) continue;
      const dx = player.pos.x - en.pos.x;
      const dy = player.pos.y - en.pos.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ex = dx / dist;
      const ey = dy / dist;
      const eSpeed = 30 + en.source.speed * 0.6;
      const approach = dist > 280 ? 1 : -0.3;
      en.pos.x = clamp(en.pos.x + ex * eSpeed * approach * dt, en.radius, WORLD - en.radius);
      en.pos.y = clamp(en.pos.y + ey * eSpeed * approach * dt, en.radius, WORLD - en.radius);

      if (dist < player.radius + en.radius && player.bodyContactCooldown <= 0) {
        const reduction = 1 - clamp(en.source.defense / 200, 0, 0.7);
        en.hp -= s.bodyDamage * reduction;
        player.bodyContactCooldown = BODY_HIT_INTERVAL;
        hurtPlayer(4 + en.source.attack * 0.15);
        if (en.hp <= 0) kill(en);
      }

      en.cooldown -= dt;
      if (dist < 480 && en.cooldown <= 0) {
        bullets.push({
          pos: { x: en.pos.x, y: en.pos.y },
          vel: { x: ex * 340, y: ey * 340 },
          ttl: BULLET_TTL,
          damage: 4 + en.source.attack * 0.18,
          fromPlayer: false,
          radius: 4,
          remaining: 1,
        });
        en.cooldown = 1.4 - clamp(en.source.speed / 100, 0, 1) * 0.9;
      }
    }

    const surviving: Bullet[] = [];
    for (const b of bullets) {
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;
      b.ttl -= dt;
      if (b.ttl <= 0 || b.pos.x < 0 || b.pos.y < 0 || b.pos.x > WORLD || b.pos.y > WORLD) continue;
      if (b.fromPlayer) {
        let alive = true;
        for (const en of entities) {
          if (!en.alive) continue;
          if (Math.hypot(en.pos.x - b.pos.x, en.pos.y - b.pos.y) < en.radius + b.radius) {
            const reduction = 1 - clamp(en.source.defense / 200, 0, 0.7);
            en.hp -= b.damage * reduction;
            b.remaining -= 1;
            if (en.hp <= 0) kill(en);
            if (b.remaining <= 0) {
              alive = false;
              break;
            }
          }
        }
        if (alive) surviving.push(b);
      } else if (Math.hypot(player.pos.x - b.pos.x, player.pos.y - b.pos.y) < player.radius + b.radius) {
        hurtPlayer(b.damage);
      } else {
        surviving.push(b);
      }
    }
    bullets = surviving;

    if (!entities.some((e) => e.alive)) entities = roster.map(spawnEnemy);
  };

  const font = (px: number, bold = false) =>
    `${bold ? 'bold ' : ''}${px}px ui-sans-serif, system-ui, sans-serif`;

  const draw = () => {
    const camX = clamp(player.pos.x - VIEW_W / 2, 0, WORLD - VIEW_W);
    const camY = clamp(player.pos.y - VIEW_H / 2, 0, WORLD - VIEW_H);

    ctx.fillStyle = '#0b0f14';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.strokeStyle = '#1c2432';
    ctx.lineWidth = 1;
    const grid = 60;
    const sx0 = -((camX % grid) + grid) % grid;
    const sy0 = -((camY % grid) + grid) % grid;
    ctx.beginPath();
    for (let x = sx0; x < VIEW_W; x += grid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VIEW_H);
    }
    for (let y = sy0; y < VIEW_H; y += grid) {
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW_W, y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#3b4258';
    ctx.lineWidth = 3;
    ctx.strokeRect(-camX, -camY, WORLD, WORLD);

    ctx.textAlign = 'center';
    for (const en of entities) {
      if (!en.alive) continue;
      const sx = en.pos.x - camX;
      const sy = en.pos.y - camY;
      if (sx < -80 || sy < -80 || sx > VIEW_W + 80 || sy > VIEW_H + 80) continue;
      ctx.fillStyle = en.color;
      ctx.beginPath();
      ctx.arc(sx, sy, en.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0b0f14';
      ctx.lineWidth = 2;
      ctx.stroke();

      const pct = clamp(en.hp / en.maxHp, 0, 1);
      ctx.fillStyle = '#222';
      ctx.fillRect(sx - en.radius, sy - en.radius - 10, en.radius * 2, 4);
      ctx.fillStyle = pct > 0.4 ? '#4ade80' : '#f87171';
      ctx.fillRect(sx - en.radius, sy - en.radius - 10, en.radius * 2 * pct, 4);

      ctx.fillStyle = '#e5e7eb';
      ctx.font = font(11);
      ctx.fillText(truncate(en.source.name, 38), sx, sy + en.radius + 14);
      ctx.fillStyle = '#9ca3af';
      ctx.font = font(10);
      ctx.fillText(`${en.source.unitClass} L${en.source.level} · ${en.source.topic}`, sx, sy + en.radius + 26);
    }

    for (const b of bullets) {
      ctx.fillStyle = b.fromPlayer ? '#fde047' : '#fb7185';
      ctx.beginPath();
      ctx.arc(b.pos.x - camX, b.pos.y - camY, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const px = player.pos.x - camX;
    const py = player.pos.y - camY;
    const angle = Math.atan2(mouse.y - py, mouse.x - px);
    ctx.fillStyle = '#475569';
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillRect(0, -8, player.radius + 18, 16);
    ctx.restore();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(px, py, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0b0f14';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#e5e7eb';
    ctx.font = font(11);
    ctx.fillText(truncate(champion.name, 50), px, py - player.radius - 8);

    if (gameOver || paused) {
      ctx.fillStyle = gameOver ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      if (gameOver) {
        ctx.fillStyle = '#f87171';
        ctx.font = font(48, true);
        ctx.fillText('GAME OVER', VIEW_W / 2, VIEW_H / 2 - 10);
        ctx.fillStyle = '#e5e7eb';
        ctx.font = font(16);
        ctx.fillText(`Score: ${score} · Level: ${player.level}`, VIEW_W / 2, VIEW_H / 2 + 24);
        ctx.fillText('Click "New Champion" to play again.', VIEW_W / 2, VIEW_H / 2 + 48);
      } else {
        ctx.fillStyle = '#e5e7eb';
        ctx.font = font(36, true);
        ctx.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2);
      }
    }
  };

  let running = true;
  let frame = 0;
  let last = performance.now();
  let hudTick = 0;
  const loop = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    draw();
    hudTick += dt;
    if (hudTick > 0.1) {
      hudTick = 0;
      ({ best, career } = hooks.onScore(score, false));
      renderHud();
    }
    if (gameOver && !reportedDeath) {
      reportedDeath = true;
      ({ best, career } = hooks.onScore(score, true));
      hud.pause.disabled = true;
      renderPanel();
      renderHud();
    }
    frame = requestAnimationFrame(loop);
  };
  renderPanel();
  renderHud();
  frame = requestAnimationFrame(loop);

  return () => {
    running = false;
    cancelAnimationFrame(frame);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('mouseleave', onMouseUp);
    window.removeEventListener('blur', onBlur);
    hud.pause.removeEventListener('click', togglePause);
    hud.newChampion.removeEventListener('click', hooks.onExit);
    for (const btn of hud.upgrades) btn.removeEventListener('click', onUpgradeClick);
    if (!reportedDeath && score > 0) hooks.onScore(score, true);
  };
}
