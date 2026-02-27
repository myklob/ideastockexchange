import { NextRequest, NextResponse } from 'next/server'
import { calculateBeliefEquivalencyScore } from '@/core/scoring/all-scores'

/**
 * POST /api/beliefs/equivalency
 *
 * Computes the Belief Equivalency Score between two belief statements.
 *
 * The score determines whether two differently-worded beliefs are making
 * the same underlying claim and should be merged into a single canonical
 * page, linked as near-identical variants, or treated as distinct.
 *
 * Body:
 *   statementA     {string}  First belief statement
 *   statementB     {string}  Second belief statement
 *   semanticScore  {number?} Pre-computed semantic similarity (0–1), optional.
 *                            When absent, only the mechanical (Layer 1) score
 *                            is used, which is less accurate for paraphrases.
 *
 * Response:
 *   equivalencyScore    {number}  Blended 0–1 score
 *   mechanicalSimilarity {number} Layer 1 token-overlap score
 *   isMechanicalEquivalent {bool} true when mechanicalSimilarity ≥ 0.85
 *   relationship        {string}  "identical" | "near-identical" | "overlapping"
 *                                 | "related" | "distinct"
 *   recommendation      {string}  Human-readable action to take
 *   thresholds          {object}  Reference table of all score bands
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { statementA, statementB, semanticScore } = body as {
    statementA?: unknown
    statementB?: unknown
    semanticScore?: unknown
  }

  if (typeof statementA !== 'string' || statementA.trim().length === 0) {
    return NextResponse.json(
      { error: 'statementA must be a non-empty string' },
      { status: 422 },
    )
  }
  if (typeof statementB !== 'string' || statementB.trim().length === 0) {
    return NextResponse.json(
      { error: 'statementB must be a non-empty string' },
      { status: 422 },
    )
  }

  const semantic =
    typeof semanticScore === 'number' &&
    semanticScore >= 0 &&
    semanticScore <= 1
      ? semanticScore
      : null

  const result = calculateBeliefEquivalencyScore(
    statementA.trim(),
    statementB.trim(),
    semantic,
  )

  const recommendation = getRecommendation(result.relationship)

  return NextResponse.json({
    statementA: statementA.trim(),
    statementB: statementB.trim(),
    equivalencyScore: result.equivalencyScore,
    mechanicalSimilarity: result.mechanicalSimilarity,
    isMechanicalEquivalent: result.isMechanicalEquivalent,
    relationship: result.relationship,
    recommendation,
    layersUsed: semantic !== null ? ['mechanical', 'semantic'] : ['mechanical'],
    thresholds: {
      identical: '≥ 0.90 — merge into one canonical page',
      nearIdentical: '0.70–0.89 — link pages; keep separate but cross-reference',
      overlapping: '0.45–0.69 — show on spectrum as stronger/weaker variants',
      related: '0.20–0.44 — related topic; separate pages',
      distinct: '< 0.20 — different beliefs; no merging',
    },
  })
}

function getRecommendation(relationship: string): string {
  switch (relationship) {
    case 'identical':
      return 'Merge into one canonical page. Route all variants to the better-argued version.'
    case 'near-identical':
      return 'Link the pages and cross-reference their argument trees. Keep separate but surface both.'
    case 'overlapping':
      return 'Display as related beliefs on the spectrum — weaker or stronger versions of each other.'
    case 'related':
      return 'Show as related beliefs. Separate argument trees; no merging.'
    default:
      return 'Treat as distinct beliefs. Separate pages with no equivalency link.'
  }
}

/**
 * GET /api/beliefs/equivalency
 *
 * Returns documentation for this endpoint.
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/beliefs/equivalency',
    description:
      'Computes the Belief Equivalency Score between two statements to determine if they should be merged, linked, or kept separate.',
    body: {
      statementA: 'string (required) — first belief statement',
      statementB: 'string (required) — second belief statement',
      semanticScore:
        'number 0–1 (optional) — pre-computed semantic similarity from embedding model',
    },
    algorithm: {
      layer1:
        'Mechanical similarity: token overlap after synonym canonicalization and negated-antonym normalization (Jaccard coefficient)',
      layer2:
        'Semantic similarity: cosine distance of sentence embeddings (supplied externally)',
      blending: 'score = 0.4 × Layer1 + 0.6 × Layer2 (when Layer 2 available)',
    },
    scoreTable: {
      '≥ 0.90': 'identical — merge',
      '0.70–0.89': 'near-identical — link',
      '0.45–0.69': 'overlapping — spectrum',
      '0.20–0.44': 'related',
      '< 0.20': 'distinct',
    },
  })
}
