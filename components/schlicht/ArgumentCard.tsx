import { SchilchtArgument } from '@/lib/types/schlicht'
import AgentBadge from './AgentBadge'

interface ArgumentCardProps {
  argument: SchilchtArgument
}

function getAgentLabel(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('evidence')) return 'Verified Source'
  if (lower.includes('logic')) return 'Valid Inference'
  if (lower.includes('red') || lower.includes('adversar'))
    return 'Risk Assessment'
  if (lower.includes('compress')) return 'Deduplicated'
  if (lower.includes('calibration')) return 'Calibrated'
  if (lower.includes('base')) return 'Base Rate Applied'
  return 'Certified'
}

export default function ArgumentCard({ argument }: ArgumentCardProps) {
  const isPro = argument.side === 'pro'
  const borderColor = isPro ? 'border-l-green-600' : 'border-l-red-600'
  const impactColor = isPro ? 'text-green-700' : 'text-red-700'
  const impactPrefix = isPro ? '+' : ''

  return (
    <div
      className={`bg-white border border-[var(--border)] ${borderColor} border-l-4 rounded p-4 transition-transform hover:-translate-y-0.5 hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <h4 className="font-semibold text-[var(--foreground)]">
          {argument.claim}
        </h4>
        <span className="text-[10px] font-mono text-[var(--muted-foreground)] bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
          #{argument.id.replace('arg-', '').toUpperCase()}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--muted-foreground)] mb-3 leading-relaxed">
        {argument.description}
      </p>

      {/* Fallacies */}
      {argument.fallaciesDetected.length > 0 && (
        <div className="mb-3">
          {argument.fallaciesDetected.map((f, i) => (
            <div
              key={i}
              className="text-xs bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded mb-1"
            >
              Fallacy Detected: {f.type} &mdash; {f.description} (Impact:{' '}
              {f.impact})
            </div>
          ))}
        </div>
      )}

      {/* Agent badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {argument.certifiedBy.map((agent) => (
          <AgentBadge key={agent} name={agent} label={getAgentLabel(agent)} />
        ))}
      </div>

      {/* Scores */}
      <div className="flex gap-4 text-xs bg-[var(--muted)] p-2 rounded border border-[var(--border)]">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">
            Truth
          </span>
          <span className="font-bold">
            {(argument.truthScore * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">
            Linkage
          </span>
          <span className="font-bold">
            {(argument.linkageScore * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">
            Impact
          </span>
          <span className={`font-bold ${impactColor}`}>
            {impactPrefix}
            {argument.impactScore}
          </span>
        </div>
      </div>

      {/* Rebuttal */}
      {argument.rebuttal && (
        <div className="mt-3 pl-3 border-l-2 border-gray-300 bg-gray-50 p-2 rounded-r text-sm">
          <span className="font-semibold text-[var(--foreground)]">
            Rebuttal (#{argument.rebuttal.id.toUpperCase()}):
          </span>{' '}
          <span className="text-[var(--muted-foreground)]">
            {argument.rebuttal.statement}
          </span>
          <br />
          <em className="text-xs text-[var(--muted-foreground)]">
            (Confidence: {(argument.rebuttal.confidence * 100).toFixed(0)}%)
          </em>
        </div>
      )}
    </div>
  )
}
