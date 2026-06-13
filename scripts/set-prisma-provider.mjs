#!/usr/bin/env node
/**
 * Rewrites the datasource provider in prisma/schema.prisma to match DATABASE_URL.
 * Runs before `prisma generate` so the generated client matches the runtime adapter.
 *
 * - postgres:// or postgresql:// URL  → provider = "postgresql"
 * - file: URL or absent               → provider = "sqlite" (no-op on the committed schema)
 *
 * Scoped by regex to the `datasource db { … }` block; the generator block's
 * `provider = "prisma-client"` line is never touched.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schemaPath = resolve(__dirname, '../prisma/schema.prisma')

const url = process.env.DATABASE_URL ?? ''
const targetProvider = /^postgres(ql)?:\/\//i.test(url) ? 'postgresql' : 'sqlite'

const original = readFileSync(schemaPath, 'utf8')

// Replace only the provider line inside the datasource block.
// Matches: datasource db { ... provider = "anything" ... }
const updated = original.replace(
  /(datasource\s+\w+\s*\{[^}]*?\bprovider\s*=\s*")[^"]*(")/s,
  `$1${targetProvider}$2`
)

if (updated === original) {
  // Already correct — nothing to write.
  process.exit(0)
}

writeFileSync(schemaPath, updated, 'utf8')
console.log(`[set-prisma-provider] datasource provider → ${targetProvider}`)
