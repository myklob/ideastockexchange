import { marketJson, marketErrorResponse } from '@/lib/markets/api'
import { executeBundle, type BundleLegParams } from '@/lib/markets/service'

/**
 * POST — execute a structured product: several binary legs bought
 * atomically (spreads, combinations). Example spread "score lands in
 * (0.55, 0.65]": YES on the >0.55 contract + NO on the >0.65 contract.
 * Body: { username, label, legs: [{ contractId, outcome, shares }] }.
 */
export async function POST(request: Request) {
  let body: { username?: string; label?: string; legs?: BundleLegParams[] }
  try {
    body = await request.json()
  } catch {
    return marketJson({ error: 'Body must be valid JSON.' }, { status: 400 })
  }
  if (!body.username || !body.label || !Array.isArray(body.legs)) {
    return marketJson({ error: 'username, label, and legs are required.' }, { status: 422 })
  }
  try {
    const result = await executeBundle(body.username, body.label, body.legs)
    return marketJson({ bundle: result.bundle, totalCost: result.totalCost }, { status: 201 })
  } catch (error) {
    return marketErrorResponse(error)
  }
}
