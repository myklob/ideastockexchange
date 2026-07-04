/**
 * Post an ingestion batch through the public API — the cron-friendly path
 * for external agent pipelines.
 *
 *   ISE_AGENT_KEY=ise_agent_... npx tsx scripts/ingest-batch.ts payload.json
 *   ISE_AGENT_KEY=... npx tsx scripts/ingest-batch.ts payload.json --url https://host/api/v1/ingest
 *
 * The payload file holds one JSON body in the shape documented in
 * docs/AI_AGENT_INTEGRATION_SPEC.md. Rejections print the named failure
 * modes so agent developers learn the vocabulary.
 */

import fs from 'fs'

const DEFAULT_URL = 'http://localhost:3000/api/v1/ingest'

async function main() {
  const [file] = process.argv.slice(2).filter(a => !a.startsWith('--'))
  const urlIdx = process.argv.indexOf('--url')
  const url = urlIdx >= 0 ? process.argv[urlIdx + 1] : DEFAULT_URL
  const key = process.env.ISE_AGENT_KEY

  if (!file) {
    console.error('Usage: ISE_AGENT_KEY=<key> npx tsx scripts/ingest-batch.ts <payload.json> [--url <ingest url>]')
    process.exit(1)
  }
  if (!key) {
    console.error('ISE_AGENT_KEY is not set. Mint one with: npx tsx scripts/create-agent.ts --name <agent>')
    process.exit(1)
  }

  let payload: unknown
  try {
    payload = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    console.error(`Could not read ${file} as JSON: ${e instanceof Error ? e.message : e}`)
    process.exit(1)
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
  })

  const body = await response.json()
  console.log(JSON.stringify(body, null, 2))

  if (!response.ok) {
    console.error(`\nRejected (HTTP ${response.status}).`)
    process.exit(1)
  }
  console.log(`\nAccepted (HTTP ${response.status}). Batch page: ${body.batchUrl}`)
  console.log('Audit trail: /audit')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
