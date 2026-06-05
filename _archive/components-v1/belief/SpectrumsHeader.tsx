import Link from 'next/link'
import { getStrengthBand, formatStrength } from '@/lib/claim-strength'

interface SpectrumsHeaderProps {
  positivity: number
  specificity: number
  claimStrength: number
}

function valenceLabel(positivity: number): string {
  if (positivity >= 60) return 'Extremely Positive'
  if (positivity >= 20) return 'Mildly Positive'
  if (positivity > -20) return 'Neutral'
  if (positivity > -60) return 'Mildly Negative'
  return 'Extremely Negative'
}

function specificityLabel(specificity: number): string {
  if (specificity < 0.2) return 'Highly General'
  if (specificity < 0.45) return 'Moderately General'
  if (specificity < 0.7) return 'Case-Level'
  return 'Highly Specific'
}

interface SpectrumRowProps {
  label: string
  leftLabel: string
  rightLabel: string
  value: string
  pct: number
  gradient: string
}

function SpectrumRow({ label, leftLabel, rightLabel, value, pct, gradient }: SpectrumRowProps) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 shrink-0 font-mono uppercase tracking-wide text-[var(--muted-foreground)] text-[10px]">
        {label}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="relative h-3 rounded-full overflow-hidden border border-gray-200"
          style={{ background: gradient }}
        >
          <div
            className="absolute top-0 h-full w-0.5 bg-gray-900"
            style={{ left: `calc(${clamped}% - 1px)` }}
          />
        </div>
        <div className="flex justify-between mt-0.5 text-[10px] text-gray-500">
          <span>{leftLabel}</span>
          <span className="text-[var(--foreground)] font-semibold">{value}</span>
          <span>{rightLabel}</span>
        </div>
      </div>
    </div>
  )
}

export function SpectrumsHeader({ positivity, specificity, claimStrength }: SpectrumsHeaderProps) {
  const valencePct = ((positivity + 100) / 200) * 100
  const specPct = specificity * 100
  const strengthPct = claimStrength * 100
  const band = getStrengthBand(claimStrength)

  return (
    <div className="border border-[var(--border)] rounded p-3 mb-8 bg-gray-50">
      <div className="text-xs font-semibold text-[var(--muted-foreground)] mb-2 flex items-center gap-2">
        <span>Three Spectrums</span>
        <Link
          href="/One%20Page%20Per%20Belief"
          className="text-[var(--accent)] hover:underline text-[10px] font-normal"
        >
          (what is this?)
        </Link>
      </div>
      <div className="space-y-2 text-xs">
        <SpectrumRow
          label="Valence"
          leftLabel="Negative"
          rightLabel="Positive"
          value={`${valenceLabel(positivity)} (${positivity >= 0 ? '+' : ''}${positivity.toFixed(0)})`}
          pct={valencePct}
          gradient="linear-gradient(to right, #f8d7da 0%, #fff3cd 50%, #d4edda 100%)"
        />
        <SpectrumRow
          label="Specificity"
          leftLabel="General"
          rightLabel="Specific"
          value={specificityLabel(specificity)}
          pct={specPct}
          gradient="linear-gradient(to right, #e0e7ff 0%, #c7d2fe 100%)"
        />
        <SpectrumRow
          label="Intensity"
          leftLabel="Weak"
          rightLabel="Extreme"
          value={`${band.label} (${formatStrength(claimStrength)})`}
          pct={strengthPct}
          gradient="linear-gradient(to right, #d4edda 0%, #fff3cd 40%, #ffd8a8 75%, #f8d7da 100%)"
        />
      </div>
    </div>
  )
}
