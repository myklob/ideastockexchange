#!/usr/bin/env node
/**
 * Syncs the Prisma schema's scalar fields to the SQLite database.
 *
 * This is a minimal "prisma db push" substitute for environments where the
 * schema engine binary can't be downloaded (e.g. Claude Code remote sessions
 * where binaries.prisma.sh is unreachable).
 *
 * What it does:
 * - Creates any model tables that are missing from the DB entirely
 * - Adds any scalar columns that exist in schema.prisma but not in the table
 *
 * What it does NOT do:
 * - Drop or rename columns / tables
 * - Create indexes or foreign key constraints on new tables (plain CREATE TABLE)
 * - Handle @default() expressions beyond simple literals
 *
 * Usage: node scripts/sync-schema-to-db.mjs [path/to/dev.db]
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const Database = require('better-sqlite3')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const schema = readFileSync(join(root, 'prisma/schema.prisma'), 'utf8')
const dbPath = process.argv[2] ?? join(root, 'prisma/dev.db')

// Map Prisma types → SQLite column types
const PRISMA_TO_SQL = {
  String: 'TEXT',
  Int: 'INTEGER',
  Float: 'REAL',
  Boolean: 'INTEGER',
  DateTime: 'DATETIME',
}

// Sensible defaults for NOT NULL columns
const SQL_DEFAULTS = {
  TEXT: "''",
  INTEGER: '0',
  REAL: '0.0',
  DATETIME: 'CURRENT_TIMESTAMP',
}

function parseModelFields(modelBlock) {
  const fields = []
  for (const line of modelBlock.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('///') || trimmed.startsWith('@') || trimmed === '}') continue
    const m = trimmed.match(/^(\w+)\s+(String|Int|Float|Boolean|DateTime)(\?)?(\s|$)/)
    if (!m) continue
    const [, name, prismaType, optional] = m
    fields.push({ name, sqlType: PRISMA_TO_SQL[prismaType], optional: optional === '?' })
  }
  return fields
}

function parseSchema(schemaText) {
  const models = {}
  const modelRe = /model\s+(\w+)\s*\{([^}]+)\}/g
  let match
  while ((match = modelRe.exec(schemaText)) !== null) {
    const [, name, body] = match
    models[name] = parseModelFields(body)
  }
  return models
}

const models = parseSchema(schema)
const db = new Database(dbPath)

const existingTables = new Set(
  db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name)
)

let tablesCreated = 0
let columnsAdded = 0

for (const [modelName, fields] of Object.entries(models)) {
  if (!existingTables.has(modelName)) {
    // Create the whole table
    const colDefs = fields.map(({ name, sqlType, optional }) => {
      if (name === 'id') return `"id" INTEGER PRIMARY KEY AUTOINCREMENT`
      const notNull = optional ? '' : ` NOT NULL DEFAULT ${SQL_DEFAULTS[sqlType]}`
      return `"${name}" ${sqlType}${notNull}`
    })
    const sql = `CREATE TABLE IF NOT EXISTS "${modelName}" (\n  ${colDefs.join(',\n  ')}\n)`
    try {
      db.exec(sql)
      console.log(`  ++ Created table: ${modelName}`)
      tablesCreated++
    } catch (e) {
      console.error(`  ✗ Create ${modelName}: ${e.message}`)
    }
    continue
  }

  // Table exists — add missing columns
  const existingCols = new Set(
    db.prepare(`PRAGMA table_info("${modelName}")`).all().map(c => c.name)
  )
  for (const { name, sqlType, optional } of fields) {
    if (existingCols.has(name)) continue
    const defaultClause = optional ? '' : ` NOT NULL DEFAULT ${SQL_DEFAULTS[sqlType]}`
    try {
      db.exec(`ALTER TABLE "${modelName}" ADD COLUMN "${name}" ${sqlType}${defaultClause}`)
      console.log(`  + ${modelName}.${name} (${sqlType}${optional ? '?' : ''})`)
      columnsAdded++
    } catch (e) {
      console.error(`  ✗ ${modelName}.${name}: ${e.message}`)
    }
  }
}

db.close()

if (tablesCreated + columnsAdded > 0) {
  console.log(`\nCreated ${tablesCreated} table(s), added ${columnsAdded} column(s).`)
} else {
  console.log('Schema already in sync — nothing to do.')
}
