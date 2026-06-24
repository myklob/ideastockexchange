#!/usr/bin/env node
/**
 * Wrapper for `prisma generate` that avoids downloading native engine binaries.
 *
 * Prisma 7 uses WASM-based engines for `prisma generate` — no native binary is
 * executed. But the CLI still calls `ensureNeededBinariesExist`, which tries to
 * fetch the schema-engine binary from binaries.prisma.sh. In network-restricted
 * environments that connection fails and the process crashes before generation runs.
 *
 * Setting PRISMA_SCHEMA_ENGINE_BINARY to any existing file makes the downloader
 * believe the binary is present and skip the fetch. The WASM engine (bundled in
 * node_modules/prisma/build/) is then used for the actual schema work.
 *
 * This is safe: `prisma generate` never executes the native binary itself.
 * `prisma db push` / `prisma migrate` do execute it; those commands should be run
 * with a real binary available or in an environment with binaries.prisma.sh access.
 */
import { execSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const stubDir = mkdtempSync(join(tmpdir(), 'prisma-stub-'))
const stubPath = join(stubDir, 'schema-engine-stub')
writeFileSync(stubPath, '')

try {
  execSync('npx prisma generate', {
    env: { ...process.env, PRISMA_SCHEMA_ENGINE_BINARY: stubPath },
    stdio: 'inherit',
  })
} finally {
  rmSync(stubDir, { recursive: true, force: true })
}
