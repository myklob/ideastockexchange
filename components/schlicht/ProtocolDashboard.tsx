'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  SchilchtBelief,
  SchilchtArgument,
  ProtocolLogEntry,
} from '@/lib/types/schlicht'
import ConfidenceMeter from './ConfidenceMeter'
import ArgumentCard from './ArgumentCard'
import ProtocolLog from './ProtocolLog'
import EvidenceTable from './EvidenceTable'
import ArgumentForm from './ArgumentForm'
import JsonProtocolModal from './JsonProtocolModal'

interface ProtocolDashboardProps {
  initialBelief: SchilchtBelief
}

// Simulated agent log entries for the live protocol feed
const simulatedLogTemplates = [
  {
    agentName: 'Logic-Core-Gamma',
    content:
      'Verified inference chain in argument tree. No circular dependencies detected.',
  },
  {
    agentName: 'Base-Rate-Enforcer',
    content:
      'Applied prior probability to recent submissions. Adjusting base rates.',
  },
  {
    agentName: 'Red-Team-Delta',
    content:
      'Probing high-confidence arguments for unstated assumptions.',
  },
  {
    agentName: 'Evidence-Bot-12',
    content:
      'Cross-referencing new source against existing evidence corpus.',
  },
  {
    agentName: 'Compress-Bot',
    content: 'Scanning for near-duplicate arguments. Merging redundancies.',
  },
  {
    agentName: 'Calibration-AI',
    content:
      'Recalibrating confidence interval based on argument distribution.',
  },
  {
    agentName: 'Logic-Core-Alpha',
    content:
      'Checking new submissions for formal fallacies. Queue: processing.',
  },
  {
    agentName: 'Red-Team-Beta',
    content: 'Testing rebuttal strength against counter-arguments.',
  },
  {
    agentName: 'Evidence-Bot-9',
    content:
      'Source quality assessment complete. Updating tier classifications.',
  },
  {
    agentName: 'System',
    content:
      'Recalculated Global Truth Score. Propagating updates to parent beliefs.',
  },
]

export default function ProtocolDashboard({
  initialBelief,
}: ProtocolDashboardProps) {
  const [belief, setBelief] = useState<SchilchtBelief>(initialBelief)
  const [showArgumentForm, setShowArgumentForm] = useState(false)
  const [showJsonModal, setShowJsonModal] = useState(false)
  const [isSimulating, setIsSimulating] = useState(true)

  const protocolId = `SCHLICHT-${belief.beliefId.slice(0, 8).toUpperCase()}`
  const activeAgentCount = Object.keys(belief.agents).length

  const proNetStrength = belief.proTree.reduce(
    (sum, a) => sum + a.impactScore,
    0
  )
  const conNetStrength = belief.conTree.reduce(
    (sum, a) => sum + Math.abs(a.impactScore),
    0
  )

  // Live protocol simulation
  useEffect(() => {
    if (!isSimulating) return

    const interval = setInterval(
      () => {
        const template =
          simulatedLogTemplates[
            Math.floor(Math.random() * simulatedLogTemplates.length)
          ]

        const newEntry: ProtocolLogEntry = {
          id: `log-sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: 'Now',
          agentName: template.agentName,
          content: template.content,
        }

        setBelief((prev) => ({
          ...prev,
          protocolLog: [newEntry, ...prev.protocolLog].slice(0, 20),
        }))
      },
      4000 + Math.random() * 4000
    )

    return () => clearInterval(interval)
  }, [isSimulating])

  // Handle new argument submission (from form or API)
  const handleNewArgument = useCallback((arg: SchilchtArgument) => {
    setBelief((prev) => {
      const updated = { ...prev }

      if (arg.side === 'pro') {
        updated.proTree = [...prev.proTree, arg]
      } else {
        updated.conTree = [...prev.conTree, arg]
      }

      // Recalculate metrics based on argument balance
      const totalProImpact = updated.proTree.reduce(
        (s, a) => s + a.impactScore,
        0
      )
      const totalConImpact = updated.conTree.reduce(
        (s, a) => s + a.impactScore,
        0
      )
      const netImpact = totalProImpact + totalConImpact
      const totalArgs = updated.proTree.length + updated.conTree.length
      const maxImpact = totalArgs * 100

      // Adjust truth score toward the argument balance
      const balanceRatio = maxImpact > 0 ? netImpact / maxImpact : 0
      const newTruthScore = Math.max(
        0.1,
        Math.min(0.99, 0.5 + balanceRatio * 0.5)
      )

      updated.metrics = {
        ...prev.metrics,
        truthScore: newTruthScore,
        adversarialCycles: prev.metrics.adversarialCycles + 1,
        lastUpdated: new Date().toISOString(),
      }

      // Add log entry for the submission
      const contributorLabel =
        arg.contributor?.type === 'ai'
          ? arg.contributor.name
          : `Human-Contributor (${arg.contributor?.name ?? 'Anonymous'})`

      const logEntry: ProtocolLogEntry = {
        id: `log-arg-${Date.now()}`,
        timestamp: 'Now',
        agentName: contributorLabel,
        content: `Submitted new ${arg.side} argument: "${arg.claim}". Pending Logic-Core review.`,
      }

      updated.protocolLog = [logEntry, ...prev.protocolLog].slice(0, 20)

      return updated
    })
  }, [])

  // Simulate adversarial attack
  const handleAdversarialAttack = useCallback(() => {
    setBelief((prev) => {
      const newTruth = Math.max(prev.metrics.truthScore - 0.012, 0.5)
      const newCI = Math.min(prev.metrics.confidenceInterval + 0.005, 0.15)

      const logEntry: ProtocolLogEntry = {
        id: `log-attack-${Date.now()}`,
        timestamp: 'Now',
        agentName: 'Red-Team-Sigma',
        content: `Launched coordinated attack on ${prev.proTree.length} high-confidence arguments. Testing robustness.`,
      }

      return {
        ...prev,
        metrics: {
          ...prev.metrics,
          truthScore: newTruth,
          confidenceInterval: newCI,
          adversarialCycles: prev.metrics.adversarialCycles + 1,
          volatility: 'medium' as const,
          lastUpdated: new Date().toISOString(),
        },
        protocolLog: [logEntry, ...prev.protocolLog].slice(0, 20),
      }
    })

    // Revert volatility after recovery
    setTimeout(() => {
      setBelief((prev) => {
        const recoveredTruth = Math.min(
          prev.metrics.truthScore + 0.005,
          initialBelief.metrics.truthScore
        )

        const recoveryLog: ProtocolLogEntry = {
          id: `log-recover-${Date.now()}`,
          timestamp: 'Now',
          agentName: 'Calibration-AI',
          content:
            'Attack absorbed. Confidence stabilizing. Volatility returning to baseline.',
        }

        return {
          ...prev,
          metrics: {
            ...prev.metrics,
            truthScore: recoveredTruth,
            volatility: 'low' as const,
          },
          protocolLog: [recoveryLog, ...prev.protocolLog].slice(0, 20),
        }
      })
    }, 5000)
  }, [initialBelief.metrics.truthScore])

  return (
    <div className="max-w-[1400px] mx-auto p-5">
      {/* Header: Belief statement + Confidence Meter */}
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4 leading-tight">
          {belief.statement}
        </h1>
        <ConfidenceMeter
          metrics={belief.metrics}
          status={belief.status}
          protocolId={protocolId}
          activeAgents={activeAgentCount}
        />
      </header>

      {/* Interactive Controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        <button
          onClick={handleAdversarialAttack}
          className="px-4 py-2 rounded font-semibold text-sm text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <span>&#x26A1;</span> Simulate Adversarial Attack
        </button>
        <button
          onClick={() => setShowArgumentForm(true)}
          className="px-4 py-2 rounded font-semibold text-sm text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2"
        >
          <span>+</span> Propose New Argument
        </button>
        <button
          onClick={() => setShowJsonModal(true)}
          className="px-4 py-2 rounded font-semibold text-sm text-[var(--foreground)] bg-[var(--muted)] border border-[var(--border)] hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <span>{'{}'}</span> View JSON Protocol
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
          {isSimulating ? 'Pause Simulation' : 'Resume Simulation'}
        </button>
      </div>

      {/* Participation info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5 text-sm">
        <div className="font-semibold text-blue-800 mb-1">
          Open Participation: Humans + AIs
        </div>
        <div className="text-blue-700">
          Submit arguments via the form above, or programmatically via{' '}
          <code className="text-xs bg-white px-1 py-0.5 rounded border border-blue-200">
            POST /api/protocol/{belief.beliefId}/arguments
          </code>
          . All submissions enter the adversarial review pipeline where
          Logic-Core, Evidence-Bot, and Red-Team agents evaluate them.
        </div>
      </div>

      {/* Main grid: Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-5">
        {/* Main content */}
        <main className="flex flex-col gap-6">
          {/* Pro arguments */}
          <section>
            <div className="flex justify-between items-center border-b-2 border-[var(--border)] pb-1 mb-4">
              <span className="text-sm uppercase tracking-wider font-semibold text-green-700">
                Verified Support Tree
              </span>
              <span className="text-xs text-[var(--muted-foreground)] font-mono">
                Net Strength: +{proNetStrength.toFixed(1)}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {belief.proTree.map((arg) => (
                <div key={arg.id} className="argument-card-animate">
                  <ArgumentCard argument={arg} />
                </div>
              ))}
              {belief.proTree.length === 0 && (
                <div className="text-sm text-[var(--muted-foreground)] italic p-4 bg-white rounded border border-[var(--border)]">
                  No supporting arguments yet. Be the first to propose one.
                </div>
              )}
            </div>
          </section>

          {/* Con arguments */}
          <section>
            <div className="flex justify-between items-center border-b-2 border-[var(--border)] pb-1 mb-4">
              <span className="text-sm uppercase tracking-wider font-semibold text-red-700">
                Active Counter-Arguments
              </span>
              <span className="text-xs text-[var(--muted-foreground)] font-mono">
                Net Weakness: -{conNetStrength.toFixed(1)}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {belief.conTree.map((arg) => (
                <div key={arg.id} className="argument-card-animate">
                  <ArgumentCard argument={arg} />
                </div>
              ))}
              {belief.conTree.length === 0 && (
                <div className="text-sm text-[var(--muted-foreground)] italic p-4 bg-white rounded border border-[var(--border)]">
                  No counter-arguments yet. Challenge this belief.
                </div>
              )}
            </div>
          </section>

          {/* Evidence */}
          <section>
            <div className="border-b-2 border-[var(--border)] pb-1 mb-4">
              <span className="text-sm uppercase tracking-wider font-semibold text-[var(--foreground)]">
                Foundational Data
              </span>
            </div>
            <EvidenceTable evidence={belief.evidence} />
          </section>

          {/* Comparison table */}
          <section className="bg-white border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-sm uppercase tracking-wider font-semibold text-[var(--foreground)] mb-4">
              Why This Beats Traditional Approaches
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-4 text-[var(--muted-foreground)] font-medium">
                      Wikipedia / Grokipedia
                    </th>
                    <th className="text-left py-2 text-[var(--accent)] font-medium">
                      ISE Schlicht Protocol
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[var(--muted-foreground)]">
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">Prose hides reasoning</td>
                    <td className="py-2 text-[var(--foreground)]">
                      JSON exposes argument structure
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">
                      Edit wars &rarr; consensus text
                    </td>
                    <td className="py-2 text-[var(--foreground)]">
                      Adversarial cycles &rarr; calibrated confidence
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">
                      &quot;X is true&quot; (declarative)
                    </td>
                    <td className="py-2 text-[var(--foreground)]">
                      &quot;X: 73% &plusmn; 8%&quot; (probabilistic)
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">Only humans can edit</td>
                    <td className="py-2 text-[var(--foreground)]">
                      Humans + AIs participate via shared protocol
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Trust through authority</td>
                    <td className="py-2 text-[var(--foreground)]">
                      Trust through inspectable protocol log
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside>
          <ProtocolLog
            entries={belief.protocolLog}
            protocolStatus={belief.protocolStatus}
            live={isSimulating}
          />
        </aside>
      </div>

      {/* Modals */}
      {showArgumentForm && (
        <ArgumentForm
          beliefId={belief.beliefId}
          onSubmit={handleNewArgument}
          onClose={() => setShowArgumentForm(false)}
        />
      )}
      {showJsonModal && (
        <JsonProtocolModal
          belief={belief}
          onClose={() => setShowJsonModal(false)}
        />
      )}
    </div>
  )
}
