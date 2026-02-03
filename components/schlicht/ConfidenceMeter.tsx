'use client'

import { SchilchtMetrics, BeliefStatus } from '@/lib/types/schlicht'

interface ConfidenceMeterProps {
  metrics: SchilchtMetrics
  status: BeliefStatus
  protocolId: string
  activeAgents: number
}

function getStabilityLabel(volatility: string): string {
  switch (volatility) {
    case 'low':
      return 'High Stability'
    case 'medium':
      return 'Moderate Stability'
    case 'high':
      return 'Low Stability'
    default:
      return 'Unknown'
  }
}

function getStatusColor(status: BeliefStatus): string {
  switch (status) {
    case 'calibrated':
      return 'text-green-700 bg-green-50 border-green-200'
    case 'contested':
      return 'text-amber-700 bg-amber-50 border-amber-200'
    case 'emerging':
      return 'text-blue-700 bg-blue-50 border-blue-200'
    case 'archived':
      return 'text-gray-700 bg-gray-50 border-gray-200'
  }
}

export default function ConfidenceMeter({
  metrics,
  status,
  protocolId,
  activeAgents,
}: ConfidenceMeterProps) {
  const percentage = metrics.truthScore * 100
  const ciPercent = metrics.confidenceInterval * 100
  const barLeft = (percentage - ciPercent)
  const barWidth = ciPercent * 2

  const timeSinceUpdate = getTimeSince(metrics.lastUpdated)

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-5 shadow-sm">
      {/* Meta row */}
      <div className="flex flex-wrap justify-between text-xs text-[var(--muted-foreground)] font-mono mb-3 gap-2">
        <span>Protocol ID: {protocolId}</span>
        <span>Last Audit: {timeSinceUpdate}</span>
        <span>Active Agents: {activeAgents}</span>
        <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${getStatusColor(status)}`}>
          {status.toUpperCase()}
        </span>
      </div>

      {/* Confidence widget */}
      <div className="bg-[var(--muted)] p-4 rounded-md border border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0">
          <div className="text-3xl font-extrabold text-[var(--foreground)]">
            {percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-[var(--muted-foreground)]">
            &plusmn; {ciPercent.toFixed(1)}% CI
          </div>
        </div>

        {/* Bar */}
        <div className="flex-grow w-full">
          <div className="relative h-3 bg-gray-200 rounded-full overflow-visible">
            {/* CI range fill */}
            <div
              className="absolute h-full rounded-full"
              style={{
                left: `${Math.max(0, barLeft)}%`,
                width: `${Math.min(barWidth, 100 - Math.max(0, barLeft))}%`,
                background: 'linear-gradient(90deg, #3b82f6, #22c55e)',
                opacity: 0.7,
                transition: 'all 0.8s ease',
              }}
            />
            {/* Center marker */}
            <div
              className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-[var(--foreground)] z-10 rounded"
              style={{ left: `${percentage}%`, transition: 'left 0.8s ease' }}
            />
          </div>
          {/* Scale labels */}
          <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] mt-1 font-mono">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="text-right text-sm text-[var(--muted-foreground)] flex-shrink-0">
          <div className="font-semibold text-[var(--foreground)]">
            {getStabilityLabel(metrics.volatility)}
          </div>
          <div>{metrics.adversarialCycles.toLocaleString()} adversarial cycles</div>
        </div>
      </div>
    </div>
  )
}

function getTimeSince(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  if (diff < 1000) return 'just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}
