import { NextResponse } from 'next/server'
import { HONESTY_LINE } from '@/lib/agent-ingest/contract'

/**
 * Every /api/v1 response carries the honesty line. Any surface an agent can
 * read must state that scores are placeholders pending the engine — never
 * let an agent (or its human) mistake stored structure for computed judgment.
 */
export function agentJson(data: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json({ notice: HONESTY_LINE, ...data }, init)
}
