'use client'

import { useState, useEffect, useCallback } from 'react'
import { CostBenefitAnalysis } from '@/lib/types/cba'
import { ProtocolLogEntry } from '@/lib/types/schlicht'
import ExpectedValueSummary from './ExpectedValueSummary'
import LineItemCard from './LineItemCard'
import LineItemForm from './LineItemForm'

interface CBADashboardProps {
  initialCBA: CostBenefitAnalysis
}

const simulatedLogTemplates = [
  { agentName: 'Base-Rate-Core-v3', content: 'Applying reference class forecasting to likelihood estimates. Adjusting base rates.' },
  { agentName: 'Red-Team-Delta', content: 'Probing optimistic benefit projections for unstated assumptions.' },
  { agentName: 'Evidence-Bot-9', content: 'Cross-referencing cost estimates against comparable project databases.' },
  { agentName: 'Calibration-AI-v5', content: 'Recalculating confidence intervals on likelihood scores. Widening CI for contested items.' },
  { agentName: 'Red-Team-Sigma', content: 'Testing economic development projection against Flyvbjerg reference class.' },
  { agentName: 'Logic-Core-Gamma', content: 'Checking argument chains for circular reasoning in cost overrun estimates.' },
  { agentName: 'Compress-Bot', content: 'Merging near-duplicate arguments across likelihood estimates.' },
  { agentName: 'Base-Rate-Enforcer', content: 'Enforcing outside-view priors on construction timeline estimates.' },
]

export default function CBADashboard({ initialCBA }: CBADashboardProps) {
  const [cba, setCba] = useState<CostBenefitAnalysis>(initialCBA)
  const [showLineItemForm, setShowLineItemForm] = useState(false)
  const [isSimulating, setIsSimulating] = useState(true)
  const [filter, setFilter] = useState<'all' | 'benefit' | 'cost'>('all')

  const benefits = cba.items.filter((i) => i.type === 'benefit')
  const costs = cba.items.filter((i) => i.type === 'cost')
  const filteredItems = filter === 'all' ? cba.items : cba.items.filter((i) => i.type === filter)

  // Simulated protocol log
  useEffect(() => {
    if (!isSimulating) return

    const interval = setInterval(() => {
      const template =
        simulatedLogTemplates[Math.floor(Math.random() * simulatedLogTemplates.length)]

      const newEntry: ProtocolLogEntry = {
        id: `log-cba-sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: 'Now',
        agentName: template.agentName,
        content: template.content,
      }

      setCba((prev) => ({
        ...prev,
        protocolLog: [newEntry, ...prev.protocolLog].slice(0, 15),
      }))
    }, 5000 + Math.random() * 5000)

    return () => clearInterval(interval)
  }, [isSimulating])

  const refreshCBA = useCallback(async () => {
    try {
      const res = await fetch(`/api/cba/${cba.id}`)
      if (res.ok) {
        const data = await res.json()
        setCba(data)
      }
    } catch {
      // Silently fail on refresh
    }
  }, [cba.id])

  return (
    <div className="max-w-[1400px] mx-auto p-5">
      {/* Header */}
      <header className="mb-5">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] leading-tight">
              {cba.title}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1 max-w-3xl leading-relaxed">
              {cba.description}
            </p>
          </div>
          <span
            className={`flex-shrink-0 text-xs px-2 py-1 rounded border font-semibold ${
              cba.status === 'active'
                ? 'text-green-700 bg-green-50 border-green-200'
                : cba.status === 'concluded'
                ? 'text-blue-700 bg-blue-50 border-blue-200'
                : 'text-gray-700 bg-gray-50 border-gray-200'
            }`}
          >
            {cba.status.toUpperCase()}
          </span>
        </div>
      </header>

      {/* Expected Value Summary */}
      <div className="mb-5">
        <ExpectedValueSummary cba={cba} />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        <button
          onClick={() => setShowLineItemForm(true)}
          className="px-4 py-2 rounded font-semibold text-sm text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2"
        >
          <span>+</span> Add Cost or Benefit
        </button>
        <button
          onClick={() => setIsSimulating((s) => !s)}
          className={`px-4 py-2 rounded font-semibold text-sm border transition-colors flex items-center gap-2 ${
            isSimulating
              ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
              : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
          }`}
        >
          <span>{isSimulating ? '\u23F8' : '\u25B6'}</span>
          {isSimulating ? 'Pause Agent Simulation' : 'Resume Agent Simulation'}
        </button>

        {/* Filter tabs */}
        <div className="flex border border-[var(--border)] rounded overflow-hidden ml-auto">
          {(['all', 'benefit', 'cost'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                filter === f
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-white text-[var(--muted-foreground)] hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? `All (${cba.items.length})` : f === 'benefit' ? `Benefits (${benefits.length})` : `Costs (${costs.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Participation info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5 text-sm">
        <div className="font-semibold text-blue-800 mb-1">
          Crowd-Sourced Analysis: Argue for Probabilities
        </div>
        <div className="text-blue-700">
          Each line item&apos;s likelihood is a nested belief with competing probability
          estimates. You don&apos;t vote on a probability &mdash; you argue for one
          with evidence, base rates, and historical data. The estimate backed by the
          strongest surviving argument tree wins. Submit via{' '}
          <code className="text-xs bg-white px-1 py-0.5 rounded border border-blue-200">
            POST /api/cba/{cba.id}/items
          </code>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Line items */}
        <main className="flex flex-col gap-4">
          {/* Benefits section */}
          {(filter === 'all' || filter === 'benefit') && benefits.length > 0 && (
            <section>
              <div className="flex justify-between items-center border-b-2 border-[var(--border)] pb-1 mb-4">
                <span className="text-sm uppercase tracking-wider font-semibold text-green-700">
                  Benefits
                </span>
                <span className="text-xs text-[var(--muted-foreground)] font-mono">
                  Expected: +{formatCompact(cba.totalExpectedBenefits)}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {benefits.map((item) => (
                  <LineItemCard
                    key={item.id}
                    item={item}
                    cbaId={cba.id}
                    onUpdate={refreshCBA}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Costs section */}
          {(filter === 'all' || filter === 'cost') && costs.length > 0 && (
            <section>
              <div className="flex justify-between items-center border-b-2 border-[var(--border)] pb-1 mb-4">
                <span className="text-sm uppercase tracking-wider font-semibold text-red-700">
                  Costs
                </span>
                <span className="text-xs text-[var(--muted-foreground)] font-mono">
                  Expected: -{formatCompact(cba.totalExpectedCosts)}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {costs.map((item) => (
                  <LineItemCard
                    key={item.id}
                    item={item}
                    cbaId={cba.id}
                    onUpdate={refreshCBA}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredItems.length === 0 && (
            <div className="text-sm text-[var(--muted-foreground)] italic p-8 bg-white rounded border border-[var(--border)] text-center">
              No {filter === 'all' ? 'line items' : filter === 'benefit' ? 'benefits' : 'costs'} yet. Add the first one.
            </div>
          )}

          {/* How it works section */}
          <section className="bg-white border border-[var(--border)] rounded-lg p-5 mt-2">
            <h3 className="text-sm uppercase tracking-wider font-semibold text-[var(--foreground)] mb-1">
              The Likelihood Score: Calibrated Probability for Cost-Benefit Analysis
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              A Likelihood Score is not a subjective guess, a slider, or a gut feeling.
              It is a nested belief that must earn its probability through structured reasoning.
            </p>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <h4 className="font-semibold text-[var(--foreground)] mb-1">1. The Likelihood as a &ldquo;Conclusion&rdquo;</h4>
                <p className="text-[var(--muted-foreground)]">
                  When a user adds a cost or benefit (e.g., &ldquo;This project will save $1M&rdquo;),
                  they are implicitly making a second claim: &ldquo;There is an X% chance this will happen.&rdquo;
                  That probability claim becomes a nested belief node with its own page. Multiple competing
                  estimates (e.g., &ldquo;30%,&rdquo; &ldquo;50&ndash;60%,&rdquo; &ldquo;90%+&rdquo;) can coexist and compete.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[var(--foreground)] mb-1">2. Arguments Build the Score (The Tree)</h4>
                <p className="text-[var(--muted-foreground)]">
                  Users and AI agents submit pro/con arguments that branch into sub-arguments, forming
                  an argument tree for each proposed likelihood. A likelihood earns strength only if it
                  has strong supporting sub-arguments and weak opposing sub-arguments. Evidence includes
                  base rates, historical data, and falsifiable assumptions.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[var(--foreground)] mb-1">3. ReasonRank Scoring</h4>
                <p className="text-[var(--muted-foreground)]">
                  Each argument in the tree is scored recursively using three metrics:
                  <strong> Truth</strong> (Is the evidence factually accurate?),
                  <strong> Linkage</strong> (How strongly does it connect to <em>this specific</em> probability?),
                  and <strong> Importance</strong> (How much does this argument move the probability?).
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[var(--foreground)] mb-1">4. The &ldquo;Winning&rdquo; Likelihood</h4>
                <p className="text-[var(--muted-foreground)]">
                  The Likelihood Score is not an average. It is the specific probability range supported by
                  the strongest surviving argument tree. If arguments for &ldquo;90% likelihood&rdquo; are exposed
                  as wishful thinking (low Truth or Linkage), that estimate decays. If arguments for
                  &ldquo;50% likelihood&rdquo; are grounded in solid reference classes and survive scrutiny,
                  50% becomes the active Likelihood Score.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border)]">
              <div className="text-xs text-[var(--muted-foreground)] mb-2">
                <strong className="text-[var(--foreground)]">Why This Matters:</strong>{' '}
                Combats optimism bias (proponents must justify why outcomes are <em>probable</em>).
                Standardizes comparisons (10% of $10M = 100% of $1M).
                Rejects intuition (mathematical expected value outperforms gut feeling).
              </div>
              <div className="text-xs text-[var(--foreground)] font-semibold text-center">
                The blunt rule: Impacts don&apos;t count unless their probabilities survive attack.
              </div>
            </div>
          </section>
        </main>

        {/* Sidebar: Protocol log */}
        <aside>
          <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden sticky top-20">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider font-semibold text-[var(--foreground)]">
                  Agent Activity Log
                </span>
                {isSimulating && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {cba.protocolLog.map((entry) => (
                <div
                  key={entry.id}
                  className="px-4 py-2.5 border-b border-gray-50 last:border-0 text-xs"
                >
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-semibold text-[var(--foreground)]">
                      {entry.agentName}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                      {entry.timestamp === 'Now'
                        ? 'just now'
                        : new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-[var(--muted-foreground)] leading-relaxed">
                    {entry.content}
                  </p>
                </div>
              ))}
              {cba.protocolLog.length === 0 && (
                <div className="px-4 py-8 text-xs text-[var(--muted-foreground)] text-center italic">
                  No agent activity yet.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Line Item Form Modal */}
      {showLineItemForm && (
        <LineItemForm
          cbaId={cba.id}
          onClose={() => setShowLineItemForm(false)}
          onSubmitted={() => {
            setShowLineItemForm(false)
            refreshCBA()
          }}
        />
      )}
    </div>
  )
}

function formatCompact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1e9) return `$${(abs / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `$${(abs / 1e6).toFixed(1)}M`
  if (abs >= 1e3) return `$${(abs / 1e3).toFixed(0)}K`
  return `$${abs.toFixed(0)}`
}
