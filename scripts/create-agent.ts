/**
 * Mint an agent identity and API key for the /api/v1 ingestion surface.
 *
 *   npx tsx scripts/create-agent.ts --name grok-writer [--operator "xAI"] [--description "..."]
 *   npx tsx scripts/create-agent.ts --name grok-writer --new-key    # rotate: mint another key
 *   npx tsx scripts/create-agent.ts --name grok-writer --revoke     # revoke all keys
 *
 * The key is printed ONCE and only its SHA-256 hash is stored. Agent identity
 * is provenance metadata — it never enters any scoring path.
 */

import { prisma } from '@/lib/prisma'
import { generateAgentKey, hashAgentKey } from '@/lib/agent-auth'

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  return idx >= 0 ? process.argv[idx + 1] : undefined
}

async function main() {
  const name = argValue('--name')
  if (!name) {
    console.error('Usage: npx tsx scripts/create-agent.ts --name <agent-name> [--operator <who>] [--description <text>] [--new-key] [--revoke]')
    process.exit(1)
  }

  const existing = await prisma.agent.findUnique({ where: { name } })

  if (process.argv.includes('--revoke')) {
    if (!existing) {
      console.error(`No agent named "${name}".`)
      process.exit(1)
    }
    const { count } = await prisma.agentApiKey.updateMany({
      where: { agentId: existing.id, revoked: false },
      data: { revoked: true },
    })
    console.log(`Revoked ${count} key(s) for agent "${name}".`)
    return
  }

  let agent = existing
  if (!agent) {
    agent = await prisma.agent.create({
      data: {
        name,
        operator: argValue('--operator') ?? null,
        description: argValue('--description') ?? null,
      },
    })
    console.log(`Created agent "${agent.name}" (id ${agent.id}).`)
  } else if (!process.argv.includes('--new-key')) {
    console.error(`Agent "${name}" already exists. Pass --new-key to mint another key, or --revoke to revoke keys.`)
    process.exit(1)
  }

  const key = generateAgentKey()
  await prisma.agentApiKey.create({
    data: { agentId: agent.id, hashedKey: hashAgentKey(key) },
  })

  console.log('')
  console.log('Agent API key (shown once — only a hash is stored):')
  console.log('')
  console.log(`  ${key}`)
  console.log('')
  console.log('Use it as:  Authorization: Bearer <key>')
  console.log('Or:         ISE_AGENT_KEY=<key> npx tsx scripts/ingest-batch.ts payload.json')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
