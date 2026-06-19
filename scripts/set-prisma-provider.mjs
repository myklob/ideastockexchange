#!/usr/bin/env node
/**
 * Align the Prisma datasource provider in prisma/schema.prisma with the active
 * DATABASE_URL before `prisma generate` / `prisma db push` runs.
 *
 * This repo is SQLite-local / Postgres-prod. Prisma's datasource `provider`
 * must be a static string literal — it cannot read env() — and the generated
 * client is provider-specific. So a Postgres deploy needs the provider flipped
 * to `postgresql` at build time; otherwise a SQLite-flavored client gets paired
 * with the pg adapter at runtime (src/lib/prisma.ts) and every query throws.
 *
 * Idempotent by design: with a `file:` URL (local dev) it leaves the committed
 * `sqlite` provider untouched; with a `postgres://` URL it rewrites the provider
 * to `postgresql` in the ephemeral build checkout. Never commit the rewritten
 * schema from a Postgres build.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const schemaPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'prisma',
  'schema.prisma',
)

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db'
const desired = /^postgres(ql)?:\/\//.test(url) ? 'postgresql' : 'sqlite'

const schema = readFileSync(schemaPath, 'utf8')

// Replace the provider only inside the `datasource <name> { ... }` block, so the
// generator's `provider = "prisma-client"` line is never touched. `[^}]*?` cannot
// cross a closing brace, keeping the match scoped to the datasource block.
const updated = schema.replace(
  /(datasource\s+\w+\s*\{[^}]*?provider\s*=\s*)"[^"]*"/,
  `$1"${desired}"`,
)

if (updated === schema) {
  console.log(`[set-prisma-provider] datasource provider already "${desired}"`)
} else {
  writeFileSync(schemaPath, updated)
  console.log(
    `[set-prisma-provider] set datasource provider to "${desired}" ` +
      `(DATABASE_URL is ${desired === 'postgresql' ? 'Postgres' : 'SQLite'})`,
  )
}
