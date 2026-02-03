'use client'

import { SchilchtBelief } from '@/lib/types/schlicht'

interface JsonProtocolModalProps {
  belief: SchilchtBelief
  onClose: () => void
}

export default function JsonProtocolModal({
  belief,
  onClose,
}: JsonProtocolModalProps) {
  const schlichtJson = {
    belief_id: belief.beliefId,
    statement: belief.statement,
    status: belief.status,
    metrics: {
      truth_score: belief.metrics.truthScore,
      confidence_interval: belief.metrics.confidenceInterval,
      volatility: belief.metrics.volatility,
      adversarial_cycles: belief.metrics.adversarialCycles,
      last_updated: belief.metrics.lastUpdated,
    },
    agents: Object.fromEntries(
      Object.entries(belief.agents).map(([role, agent]) => [role, agent.name])
    ),
    graph: {
      pro_tree: belief.proTree.map((arg) => ({
        id: arg.id,
        claim: arg.claim,
        truth_score: arg.truthScore,
        linkage_score: arg.linkageScore,
        impact_score: arg.impactScore,
        certified_by: arg.certifiedBy,
        contributor: arg.contributor ?? null,
      })),
      con_tree: belief.conTree.map((arg) => ({
        id: arg.id,
        claim: arg.claim,
        truth_score: arg.truthScore,
        linkage_score: arg.linkageScore,
        impact_score: arg.impactScore,
        certified_by: arg.certifiedBy,
        contributor: arg.contributor ?? null,
        ...(arg.rebuttal
          ? {
              rebuttal: {
                id: arg.rebuttal.id,
                statement: arg.rebuttal.statement,
                confidence: arg.rebuttal.confidence,
              },
            }
          : {}),
      })),
    },
    evidence: belief.evidence.map((ev) => ({
      id: ev.id,
      tier: ev.tier,
      tier_label: ev.tierLabel,
      title: ev.title,
      linkage_score: ev.linkageScore,
    })),
    protocol_log: belief.protocolLog.slice(0, 10).map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      agent: entry.agentName,
      content: entry.content,
    })),
    api: {
      submit_argument: `POST /api/protocol/${belief.beliefId}/arguments`,
      body_schema: {
        claim: 'string (required, max 500)',
        description: 'string (required, max 5000)',
        side: '"pro" | "con" (required)',
        contributor_name: 'string (required, max 200)',
        contributor_type: '"human" | "ai" (required)',
        truth_score: 'number 0-100 (optional, default 50)',
        linkage_score: 'number 0-100 (optional, default 50)',
      },
    },
  }

  const formattedJson = JSON.stringify(schlichtJson, null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden border border-[var(--border)] shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--border)] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              Schlicht Protocol JSON
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] font-mono mt-1">
              X-Protocol: schlicht-v1
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-xs px-3 py-1.5 rounded font-medium text-[var(--accent)] bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              Copy JSON
            </button>
            <button
              onClick={onClose}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-2xl leading-none px-1"
            >
              &times;
            </button>
          </div>
        </div>

        {/* JSON content */}
        <div className="overflow-auto flex-grow p-4 bg-[var(--muted)]">
          <pre className="text-xs font-mono leading-relaxed text-[var(--foreground)] whitespace-pre-wrap">
            {formattedJson}
          </pre>
        </div>
      </div>
    </div>
  )
}
