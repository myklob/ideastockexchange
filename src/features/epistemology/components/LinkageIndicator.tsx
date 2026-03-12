import { LinkageClassification } from '@/core/types/schlicht'

interface LinkageIndicatorProps {
  score: number                        // -1.0 to 1.0
  classification?: LinkageClassification
  compact?: boolean                    // Show small inline version
}

/**
 * Visual chain link indicator between parent and child beliefs.
 *
 * Color/Opacity mapping from the spec:
 * - Solid Green (1.0): Deductive Link (Unbreakable)
 * - Blue (0.7-0.9): Strong Causal Link
 * - Grey (0.4-0.6): Contextual Link
 * - Faint/Orange (0.1-0.3): Weak Link
 * - Red Cross (0.0): Broken Link (Irrelevant/Fallacy)
 * - Red (-1.0): Contradiction
 */
export default function LinkageIndicator({
  score,
  classification,
  compact = false,
}: LinkageIndicatorProps) {
  const abs = Math.abs(score)
  const { color, bgColor, borderColor, icon, label, opacity } = getLinkageVisuals(score, classification)

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${borderColor} ${bgColor}`}
        style={{ opacity: Math.max(0.4, opacity) }}
        title={`Linkage: ${(score * 100).toFixed(0)}% — ${label}`}
      >
        <span>{icon}</span>
        <span className={color}>{(score * 100).toFixed(0)}%</span>
      </span>
    )
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded border ${borderColor} ${bgColor} transition-all`}
      style={{ opacity: Math.max(0.5, opacity) }}
    >
      {/* Chain link icon */}
      <span className="text-base" title={label}>{icon}</span>

      {/* Score */}
      <div className="flex flex-col">
        <span className={`text-xs font-bold ${color}`}>
          {score > 0 ? '+' : ''}{(score * 100).toFixed(0)}%
        </span>
        <span className="text-[9px] text-[var(--muted-foreground)] uppercase tracking-wider">
          {label}
        </span>
      </div>

      {/* Strength bar */}
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden ml-2">
        <div
          className={`h-full rounded-full transition-all ${getBarColor(score)}`}
          style={{ width: `${abs * 100}%` }}
        />
      </div>
    </div>
  )
}

function getLinkageVisuals(score: number, classification?: LinkageClassification): {
  color: string
  bgColor: string
  borderColor: string
  icon: string
  label: string
  opacity: number
} {
  const abs = Math.abs(score)

  // Contradiction
  if (score < -0.5 || classification === 'CONTRADICTION') {
    return {
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      icon: '\u26D4', // no entry
      label: 'Contradiction',
      opacity: 1.0,
    }
  }

  // Irrelevant / Non Sequitur
  if (abs < 0.05 || classification === 'IRRELEVANT' || classification === 'NON_SEQUITUR') {
    return {
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: '\u2717', // ballot x
      label: classification === 'NON_SEQUITUR' ? 'Non Sequitur' : 'Irrelevant',
      opacity: 0.5,
    }
  }

  // Weak / Anecdotal (0.05-0.35)
  if (abs < 0.35 || classification === 'ANECDOTAL') {
    return {
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: '\u{1F517}', // link
      label: 'Weak Link',
      opacity: 0.6,
    }
  }

  // Contextual (0.35-0.65)
  if (abs < 0.65 || classification === 'CONTEXTUAL') {
    return {
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
      icon: '\u{1F517}', // link
      label: 'Context',
      opacity: 0.8,
    }
  }

  // Strong Causal (0.65-0.95)
  if (abs < 0.95 || classification === 'STRONG_CAUSAL') {
    return {
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      icon: '\u{1F517}', // link
      label: 'Strong Link',
      opacity: 0.95,
    }
  }

  // Deductive Proof (0.95+)
  return {
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-400',
    icon: '\u26D3', // chains
    label: 'Proof',
    opacity: 1.0,
  }
}

function getBarColor(score: number): string {
  const abs = Math.abs(score)
  if (score < -0.5) return 'bg-red-600'
  if (abs < 0.05) return 'bg-red-400'
  if (abs < 0.35) return 'bg-orange-400'
  if (abs < 0.65) return 'bg-gray-400'
  if (abs < 0.95) return 'bg-blue-500'
  return 'bg-green-500'
}
