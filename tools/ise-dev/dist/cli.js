#!/usr/bin/env node
/**
 * ise-dev — Idea Stock Exchange developer CLI
 *
 * Usage:
 *   ise-dev score <beliefA> <beliefB>  Compute equivalency score between two beliefs
 *   ise-dev analyze <file>             Scan a newline-delimited belief list for near-duplicates
 *   ise-dev seed                       Seed the local ISE database with sample beliefs
 *   ise-dev dev                        Start the ISE development server
 *   ise-dev api-check [baseUrl]        Verify the ISE API is reachable and equivalency endpoint works
 *   ise-dev help                       Show this help text
 *
 * Install:
 *   # From the repository root:
 *   cd tools/ise-dev && npm link
 *
 *   # Then use anywhere:
 *   ise-dev score "ban assault weapons" "prohibit military-style rifles"
 */

'use strict'

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

// ─── ANSI colours (no dependencies) ────────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
}

function color(text, ...codes) {
  return codes.join('') + text + C.reset
}

function badge(label, bgCode) {
  return `${bgCode} ${label} ${C.reset}`
}

// ─── Shared equivalency logic (mirrors all-scores.ts Layer 1) ──────────────

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'to', 'of', 'in',
  'on', 'at', 'by', 'for', 'with', 'about', 'that', 'this', 'these',
  'those', 'it', 'its', 'we', 'our', 'you', 'your', 'they', 'their',
  'and', 'or', 'but', 'not', 'no', 'nor', 'so', 'yet', 'both', 'either',
  'neither', 'if', 'then', 'than', 'when', 'while', 'as', 'very', 'really',
  'quite', 'just', 'perhaps', 'maybe', 'somewhat', 'rather', 'need',
])

const SYNONYM_GROUPS = [
  ['ban', 'forbid', 'prohibit', 'outlaw', 'disallow', 'illegalize'],
  ['restrict', 'limit', 'constrain', 'curb', 'control', 'regulate'],
  ['increase', 'raise', 'hike', 'boost', 'elevate', 'grow'],
  ['decrease', 'lower', 'reduce', 'cut', 'shrink', 'diminish', 'drop'],
  ['require', 'mandate', 'force', 'compel', 'make'],
  ['help', 'aid', 'assist', 'support', 'benefit'],
  ['harm', 'hurt', 'damage', 'worsen', 'weaken'],
  ['good', 'beneficial', 'positive', 'useful', 'effective'],
  ['bad', 'harmful', 'negative', 'detrimental', 'damaging'],
  ['important', 'critical', 'crucial', 'essential', 'vital', 'key'],
  ['use', 'utilize', 'employ', 'apply'],
  ['allow', 'permit', 'enable', 'let'],
  ['end', 'stop', 'halt', 'cease', 'eliminate', 'abolish', 'remove'],
  ['start', 'begin', 'initiate', 'create', 'establish', 'implement'],
  ['big', 'large', 'major', 'significant', 'substantial', 'considerable'],
  ['small', 'minor', 'minimal', 'limited', 'modest'],
  ['gun', 'firearm', 'weapon', 'rifle', 'pistol'],
  ['tax', 'levy', 'fee', 'charge', 'tariff'],
  ['government', 'state', 'federal', 'public', 'national'],
  ['people', 'citizens', 'individuals', 'persons', 'humans', 'population'],
  ['money', 'funds', 'funding', 'capital', 'resources', 'revenue'],
  ['policy', 'law', 'legislation', 'regulation', 'rule', 'measure'],
]

const SYNONYM_MAP = new Map()
for (const group of SYNONYM_GROUPS) {
  const canonical = group[0]
  for (const word of group) SYNONYM_MAP.set(word, canonical)
}

const ANTONYM_PAIRS = [
  ['increase', 'decrease'],
  ['allow', 'ban'],
  ['good', 'bad'],
  ['help', 'harm'],
  ['true', 'false'],
  ['legal', 'illegal'],
  ['expand', 'shrink'],
]

const ANTONYM_MAP = new Map()
for (const [a, b] of ANTONYM_PAIRS) {
  ANTONYM_MAP.set(a, b)
  ANTONYM_MAP.set(b, a)
}

function normalizeClaim(text) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  const filtered = tokens.filter((t) => !STOPWORDS.has(t))

  // Resolve "not X" → antonym of X where possible
  const resolved = []
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === 'not' && i + 1 < filtered.length) {
      const next = SYNONYM_MAP.get(filtered[i + 1]) ?? filtered[i + 1]
      const antonym = ANTONYM_MAP.get(next)
      if (antonym) {
        resolved.push(antonym)
        i++ // skip next token
        continue
      }
    }
    resolved.push(filtered[i])
  }

  // Canonicalize synonyms
  const canonical = resolved.map((t) => SYNONYM_MAP.get(t) ?? t)

  // Sort for order invariance
  return new Set(canonical.sort())
}

function jaccardSimilarity(setA, setB) {
  let intersection = 0
  for (const t of setA) if (setB.has(t)) intersection++
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 1 : intersection / union
}

function mechanicalSimilarity(a, b) {
  return jaccardSimilarity(normalizeClaim(a), normalizeClaim(b))
}

function computeEquivalency(a, b) {
  const mSim = mechanicalSimilarity(a, b)
  const score = mSim >= 0.85 ? 1.0 : mSim

  let relationship
  if (score >= 0.90) relationship = 'identical'
  else if (score >= 0.70) relationship = 'near-identical'
  else if (score >= 0.45) relationship = 'overlapping'
  else if (score >= 0.20) relationship = 'related'
  else relationship = 'distinct'

  return { score, mechanicalSimilarity: mSim, relationship }
}

// ─── Formatting helpers ─────────────────────────────────────────────────────

function scoreBar(score, width = 30) {
  const filled = Math.round(score * width)
  const empty = width - filled
  const barColor =
    score >= 0.90 ? C.green
    : score >= 0.70 ? C.cyan
    : score >= 0.45 ? C.yellow
    : score >= 0.20 ? '\x1b[33m'
    : C.dim
  return barColor + '█'.repeat(filled) + C.dim + '░'.repeat(empty) + C.reset
}

function relationshipColor(rel) {
  switch (rel) {
    case 'identical': return C.green + C.bold
    case 'near-identical': return C.cyan + C.bold
    case 'overlapping': return C.yellow + C.bold
    case 'related': return '\x1b[33m' + C.bold
    default: return C.dim + C.bold
  }
}

function pct(n) {
  return `${(n * 100).toFixed(1)}%`
}

// ─── Commands ───────────────────────────────────────────────────────────────

function cmdScore(args) {
  if (args.length < 2) {
    console.error(color('Usage: ise-dev score <beliefA> <beliefB>', C.red))
    console.error(color('  Example: ise-dev score "ban guns" "prohibit firearms"', C.dim))
    process.exit(1)
  }
  const a = args[0]
  const b = args[1]

  const { score, mechanicalSimilarity: mSim, relationship } = computeEquivalency(a, b)

  console.log()
  console.log(color('  Belief Equivalency Score', C.bold))
  console.log(color('  ─────────────────────────────────────────────────', C.dim))
  console.log()
  console.log(`  Belief A: ${color(a, C.white)}`)
  console.log(`  Belief B: ${color(b, C.white)}`)
  console.log()
  console.log(`  Score    ${scoreBar(score)}  ${color(pct(score), C.bold)}`)
  console.log(`  Mech.    ${scoreBar(mSim)}  ${color(pct(mSim), C.dim)}`)
  console.log()
  console.log(`  Relationship: ${relationshipColor(relationship)}${relationship}${C.reset}`)
  console.log()

  const recommendations = {
    identical: 'Merge into one canonical page. Route all variants here.',
    'near-identical': 'Link pages and cross-reference argument trees. Keep separate.',
    overlapping: 'Show on spectrum as stronger/weaker versions of each other.',
    related: 'Show as related beliefs. Separate argument trees; no merging.',
    distinct: 'Treat as distinct beliefs. Separate pages.',
  }
  console.log(`  Action: ${color(recommendations[relationship] ?? 'Treat as distinct.', C.cyan)}`)
  console.log()

  console.log(color('  Score bands:', C.dim))
  console.log(color('   ≥ 90% identical   70-89% near-identical   45-69% overlapping', C.dim))
  console.log(color('   20-44% related    < 20% distinct', C.dim))
  console.log()
}

async function cmdAnalyze(args) {
  if (args.length < 1) {
    console.error(color('Usage: ise-dev analyze <file>', C.red))
    console.error(color('  File format: one belief statement per line.', C.dim))
    process.exit(1)
  }

  const filePath = path.resolve(args[0])
  if (!fs.existsSync(filePath)) {
    console.error(color(`File not found: ${filePath}`, C.red))
    process.exit(1)
  }

  const lines = fs.readFileSync(filePath, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'))

  console.log()
  console.log(color(`  Analyzing ${lines.length} beliefs for near-duplicates…`, C.bold))
  console.log(color('  ─────────────────────────────────────────────────', C.dim))
  console.log()

  const pairs = []
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const { score, relationship } = computeEquivalency(lines[i], lines[j])
      if (score >= 0.45) {
        pairs.push({ i, j, score, relationship, a: lines[i], b: lines[j] })
      }
    }
  }

  if (pairs.length === 0) {
    console.log(color('  No near-duplicate pairs found (threshold: 45%).', C.green))
    console.log()
    return
  }

  pairs.sort((a, b) => b.score - a.score)

  for (const p of pairs) {
    const relColor = relationshipColor(p.relationship)
    console.log(`  ${relColor}[${p.relationship.padEnd(14)}]${C.reset} ${color(pct(p.score), C.bold)}`)
    console.log(`    A (line ${p.i + 1}): ${p.a}`)
    console.log(`    B (line ${p.j + 1}): ${p.b}`)
    console.log()
  }

  const identical = pairs.filter((p) => p.relationship === 'identical').length
  const nearIdent = pairs.filter((p) => p.relationship === 'near-identical').length
  const overlapping = pairs.filter((p) => p.relationship === 'overlapping').length

  console.log(color('  Summary:', C.bold))
  console.log(`    ${color(String(identical), C.green)} identical pairs (recommend merge)`)
  console.log(`    ${color(String(nearIdent), C.cyan)} near-identical pairs (recommend link)`)
  console.log(`    ${color(String(overlapping), C.yellow)} overlapping pairs (show on spectrum)`)
  console.log()
}

function cmdSeed() {
  const root = findRepoRoot()
  if (!root) {
    console.error(color('Could not locate repository root (no package.json with next dependency).', C.red))
    console.error(color('Run this command from within the ise-dev tools directory or the repo root.', C.dim))
    process.exit(1)
  }

  console.log()
  console.log(color('  Seeding ISE database…', C.bold))
  console.log(color(`  Repo root: ${root}`, C.dim))
  console.log()

  try {
    execSync('npx prisma db push --skip-generate', {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env },
    })
    console.log()
    console.log(color('  Prisma schema pushed.', C.green))

    const seedPath = path.join(root, 'prisma', 'seed.ts')
    const seedJsPath = path.join(root, 'prisma', 'seed.js')
    if (fs.existsSync(seedPath) || fs.existsSync(seedJsPath)) {
      execSync('npx prisma db seed', { cwd: root, stdio: 'inherit' })
      console.log(color('  Seed data inserted.', C.green))
    } else {
      console.log(color('  No seed file found at prisma/seed.ts — skipping data seed.', C.yellow))
    }
  } catch (e) {
    console.error(color('  Seed failed. Check Prisma configuration and DATABASE_URL.', C.red))
    process.exit(1)
  }
  console.log()
}

function cmdDev() {
  const root = findRepoRoot()
  if (!root) {
    console.error(color('Could not locate repository root.', C.red))
    process.exit(1)
  }

  console.log()
  console.log(color('  Starting ISE development server…', C.bold))
  console.log(color(`  Repo root: ${root}`, C.dim))
  console.log(color('  Press Ctrl-C to stop.', C.dim))
  console.log()

  const child = spawn('npm', ['run', 'dev'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })

  child.on('exit', (code) => {
    if (code !== 0) process.exit(code ?? 1)
  })
}

async function cmdApiCheck(args) {
  const baseUrl = (args[0] ?? 'http://localhost:3000').replace(/\/$/, '')
  const endpoint = `${baseUrl}/api/beliefs/equivalency`

  console.log()
  console.log(color('  ISE API Check', C.bold))
  console.log(color('  ─────────────────────────────────────────────────', C.dim))
  console.log(`  Endpoint: ${color(endpoint, C.cyan)}`)
  console.log()

  // GET (docs)
  process.stdout.write('  GET  (docs)  … ')
  try {
    const res = await nodeFetch(`${endpoint}`)
    if (res.ok) {
      console.log(color('OK', C.green))
    } else {
      console.log(color(`HTTP ${res.status}`, C.yellow))
    }
  } catch (e) {
    console.log(color(`FAILED — ${e.message}`, C.red))
    console.log()
    console.log(color('  Is the server running? Try: ise-dev dev', C.dim))
    console.log()
    process.exit(1)
  }

  // POST (equivalency check)
  process.stdout.write('  POST (score) … ')
  const body = JSON.stringify({
    statementA: 'We should ban assault weapons.',
    statementB: 'We should prohibit military-style rifles.',
  })
  try {
    const res = await nodeFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    const json = await res.json()
    if (res.ok && typeof json.equivalencyScore === 'number') {
      console.log(color('OK', C.green))
      console.log()
      console.log(`  Sample result:`)
      console.log(`    Score:        ${color(pct(json.equivalencyScore), C.bold)}`)
      console.log(`    Relationship: ${color(json.relationship, C.cyan)}`)
      console.log(`    Layers:       ${json.layersUsed?.join(', ') ?? 'mechanical'}`)
    } else {
      console.log(color(`Unexpected response (HTTP ${res.status})`, C.yellow))
    }
  } catch (e) {
    console.log(color(`FAILED — ${e.message}`, C.red))
    process.exit(1)
  }
  console.log()
}

// ─── Utility: find repo root ─────────────────────────────────────────────

function findRepoRoot() {
  let dir = __dirname
  for (let i = 0; i < 8; i++) {
    const pkg = path.join(dir, 'package.json')
    if (fs.existsSync(pkg)) {
      try {
        const p = JSON.parse(fs.readFileSync(pkg, 'utf-8'))
        if (p.dependencies?.next || p.devDependencies?.next) return dir
      } catch {}
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

// ─── Minimal fetch polyfill for Node 18+ ─────────────────────────────────

async function nodeFetch(url, options = {}) {
  // Node 18+ has global fetch
  if (typeof fetch !== 'undefined') {
    return fetch(url, options)
  }
  // Fallback via http/https
  return new Promise((resolve, reject) => {
    const { http, https } = { http: require('http'), https: require('https') }
    const u = new URL(url)
    const lib = u.protocol === 'https:' ? https : http
    const reqOptions = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: options.method ?? 'GET',
      headers: options.headers ?? {},
    }
    const req = lib.request(reqOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data),
        })
      })
    })
    req.on('error', reject)
    if (options.body) req.write(options.body)
    req.end()
  })
}

// ─── Help ────────────────────────────────────────────────────────────────

function cmdHelp() {
  console.log()
  console.log(color('  ise-dev — Idea Stock Exchange Developer CLI', C.bold))
  console.log(color('  ─────────────────────────────────────────────────', C.dim))
  console.log()
  console.log('  Commands:')
  console.log()
  console.log(`  ${color('score', C.cyan)} <beliefA> <beliefB>`)
  console.log('    Compute Belief Equivalency Score between two statements.')
  console.log()
  console.log(`  ${color('analyze', C.cyan)} <file>`)
  console.log('    Scan a newline-delimited belief list for near-duplicate pairs.')
  console.log()
  console.log(`  ${color('seed', C.cyan)}`)
  console.log('    Push Prisma schema and seed the local ISE database.')
  console.log()
  console.log(`  ${color('dev', C.cyan)}`)
  console.log('    Start the Next.js development server (npm run dev).')
  console.log()
  console.log(`  ${color('api-check', C.cyan)} [baseUrl]`)
  console.log('    Verify the equivalency API endpoint is working.')
  console.log('    Default baseUrl: http://localhost:3000')
  console.log()
  console.log(`  ${color('help', C.cyan)}`)
  console.log('    Show this help text.')
  console.log()
  console.log('  Examples:')
  console.log()
  console.log(color('    ise-dev score "ban assault weapons" "prohibit military-style rifles"', C.dim))
  console.log(color('    ise-dev analyze beliefs.txt', C.dim))
  console.log(color('    ise-dev api-check http://localhost:3000', C.dim))
  console.log(color('    ise-dev seed', C.dim))
  console.log(color('    ise-dev dev', C.dim))
  console.log()
  console.log('  Install:')
  console.log()
  console.log(color('    cd tools/ise-dev && npm link', C.dim))
  console.log()
}

// ─── Entry point ────────────────────────────────────────────────────────

const [, , command, ...rest] = process.argv

switch (command) {
  case 'score':
    cmdScore(rest)
    break
  case 'analyze':
    cmdAnalyze(rest).catch((e) => { console.error(e); process.exit(1) })
    break
  case 'seed':
    cmdSeed()
    break
  case 'dev':
    cmdDev()
    break
  case 'api-check':
    cmdApiCheck(rest).catch((e) => { console.error(e); process.exit(1) })
    break
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    cmdHelp()
    break
  default:
    console.error(color(`Unknown command: ${command}`, C.red))
    cmdHelp()
    process.exit(1)
}
