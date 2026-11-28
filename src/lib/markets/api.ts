import { NextResponse } from 'next/server'
import { MarketError } from './service'
import { SCORING_ALGORITHM_VERSION } from './engine'

/**
 * Every market response that mentions a score says which engine produced it.
 * Settlement runs the provisional versioned engine; nothing here is the crowd
 * writing scores — prices predict what the engine will publish, never feed it.
 */
export const MARKET_SCORE_NOTICE =
  `Scores and forecasts come from the versioned provisional engine (${SCORING_ALGORITHM_VERSION}). ` +
  'Market prices predict future engine output; they never feed back into scoring.'

export function marketJson(data: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json({ notice: MARKET_SCORE_NOTICE, ...data }, init)
}

export function marketErrorResponse(error: unknown) {
  if (error instanceof MarketError) {
    return marketJson({ error: error.message }, { status: error.status })
  }
  throw error
}
