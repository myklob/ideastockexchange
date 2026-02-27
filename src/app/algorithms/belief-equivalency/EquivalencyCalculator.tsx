'use client'

import { useState } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────

interface EquivalencyResult {
  statementA: string
  statementB: string
  equivalencyScore: number
  mechanicalSimilarity: number
  isMechanicalEquivalent: boolean
  relationship: 'identical' | 'near-identical' | 'overlapping' | 'related' | 'distinct'
  recommendation: string
  layersUsed: string[]
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function pct(n: number) {
  return `${Math.round(n * 100)}%`
}

const RELATIONSHIP_CONFIG: Record<
  string,
  { label: string; bar: string; badge: string; text: string }
> = {
  identical: {
    label: 'Identical',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    text: 'text-emerald-700',
  },
  'near-identical': {
    label: 'Near-Identical',
    bar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    text: 'text-blue-700',
  },
  overlapping: {
    label: 'Overlapping',
    bar: 'bg-yellow-500',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    text: 'text-yellow-700',
  },
  related: {
    label: 'Related',
    bar: 'bg-orange-400',
    badge: 'bg-orange-100 text-orange-800 border-orange-300',
    text: 'text-orange-700',
  },
  distinct: {
    label: 'Distinct',
    bar: 'bg-gray-400',
    badge: 'bg-gray-100 text-gray-700 border-gray-300',
    text: 'text-gray-600',
  },
}

const EXAMPLES = [
  {
    label: 'Near-identical (phrasing)',
    a: 'We should ban assault weapons.',
    b: 'We should prohibit military-style rifles.',
  },
  {
    label: 'Overlapping (scope)',
    a: 'The minimum wage should be raised.',
    b: 'We should raise the federal minimum wage to $15 per hour.',
  },
  {
    label: 'Identical (different words)',
    a: 'We should reduce carbon emissions.',
    b: 'We should lower carbon emissions.',
  },
  {
    label: 'Distinct (different claims)',
    a: 'We should increase the capital gains tax.',
    b: 'We should abolish the estate tax.',
  },
]

// ─── Component ─────────────────────────────────────────────────────────────

export default function EquivalencyCalculator() {
  const [statementA, setStatementA] = useState('')
  const [statementB, setStatementB] = useState('')
  const [result, setResult] = useState<EquivalencyResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function compute() {
    if (!statementA.trim() || !statementB.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/beliefs/equivalency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statementA, statementB }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      setResult(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  function loadExample(a: string, b: string) {
    setStatementA(a)
    setStatementB(b)
    setResult(null)
    setError(null)
  }

  const cfg = result ? (RELATIONSHIP_CONFIG[result.relationship] ?? RELATIONSHIP_CONFIG.distinct) : null

  return (
    <div className="border border-gray-300 rounded-lg p-5 my-6 bg-white">
      <h3 className="text-lg font-bold mb-1">Live Equivalency Calculator</h3>
      <p className="text-sm text-gray-500 mb-4">
        Enter two belief statements to compute their Equivalency Score using Layer 1 mechanical
        analysis (synonym canonicalization + Jaccard token overlap).
      </p>

      {/* Quick-load examples */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Load an example
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => loadExample(ex.a, ex.b)}
              className="text-xs border border-blue-300 text-blue-700 rounded px-2 py-1 hover:bg-blue-50 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="stmtA">
            Belief A
          </label>
          <textarea
            id="stmtA"
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="e.g. We should ban assault weapons."
            value={statementA}
            onChange={(e) => setStatementA(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="stmtB">
            Belief B
          </label>
          <textarea
            id="stmtB"
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="e.g. We should prohibit military-style rifles."
            value={statementB}
            onChange={(e) => setStatementB(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={compute}
        disabled={loading || !statementA.trim() || !statementB.trim()}
        className="bg-blue-700 text-white px-5 py-2 rounded font-semibold text-sm hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Computing…' : 'Compute Score'}
      </button>

      {/* Error */}
      {error && (
        <p className="mt-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded px-3 py-2">
          Error: {error}
        </p>
      )}

      {/* Result */}
      {result && cfg && (
        <div className="mt-5 border-t border-gray-200 pt-4 space-y-4">
          {/* Score bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-700">Equivalency Score</span>
              <span className="text-lg font-bold font-mono">{pct(result.equivalencyScore)}</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${cfg.bar}`}
                style={{ width: pct(result.equivalencyScore) }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0% Distinct</span>
              <span>100% Identical</span>
            </div>
          </div>

          {/* Relationship badge */}
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold border px-2 py-0.5 rounded ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-sm text-gray-500">
              Mechanical similarity: <strong className="font-mono">{pct(result.mechanicalSimilarity)}</strong>
              {' '}· Layers used: {result.layersUsed.join(' + ')}
            </span>
          </div>

          {/* Recommendation */}
          <div className={`text-sm font-medium ${cfg.text} bg-gray-50 border border-gray-200 rounded px-3 py-2`}>
            <strong>Recommendation:</strong> {result.recommendation}
          </div>

          {/* Breakdown */}
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              Show raw breakdown
            </summary>
            <pre className="mt-2 bg-gray-50 border border-gray-200 rounded p-3 text-xs overflow-x-auto">
              {JSON.stringify(
                {
                  equivalencyScore: result.equivalencyScore.toFixed(4),
                  mechanicalSimilarity: result.mechanicalSimilarity.toFixed(4),
                  isMechanicalEquivalent: result.isMechanicalEquivalent,
                  relationship: result.relationship,
                  layersUsed: result.layersUsed,
                },
                null,
                2,
              )}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
