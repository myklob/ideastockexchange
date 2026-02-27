'use client'

import Link from 'next/link'
import {
  STRENGTH_BANDS,
  getStrengthBand,
  getStrengthLabel,
  applyStrengthPenalty,
  formatStrength,
} from '@/core/scoring/claim-strength'

// ─── Single-belief bar ───────────────────────────────────────────

interface StrengthSpectrumBarProps {
  /** Claim strength value (0–1) */
  claimStrength: number
  /** Raw ReasonRank/importance-weighted score (0–1) before strength adjustment */
  rawScore?: number
  /** Whether to show the adjusted score alongside */
  showAdjusted?: boolean
  /** Whether to show the evidence-required text */
  showDetails?: boolean
}

/**
 * A compact visual bar showing where a belief sits on the strong-to-weak
 * spectrum, with optional display of the adjusted score.
 */
export default function StrengthSpectrumBar({
  claimStrength,
  rawScore,
  showAdjusted = true,
  showDetails = false,
}: StrengthSpectrumBarProps) {
  const band = getStrengthBand(claimStrength)
  const adjustedScore = rawScore !== undefined
    ? applyStrengthPenalty(rawScore, claimStrength)
    : undefined
  const pct = claimStrength * 100

  return (
    <div className="space-y-2">
      {/* Gradient bar with marker */}
      <div className="relative h-4 rounded-full overflow-hidden"
        style={{
          background: 'linear-gradient(to right, #d4edda 0%, #fff3cd 40%, #ffd8a8 75%, #f8d7da 100%)',
        }}
      >
        {/* Position marker */}
        <div
          className="absolute top-0 h-full w-1 bg-gray-800 rounded-full"
          style={{ left: `calc(${pct}% - 2px)` }}
        />
      </div>

      {/* Labels row */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Weak</span>
        <span className="font-semibold" style={{ color: '#555' }}>
          {band.label} ({formatStrength(claimStrength)})
        </span>
        <span>Extreme</span>
      </div>

      {showDetails && (
        <p className="text-xs text-gray-600 italic mt-1">
          {band.descriptor}: {band.evidenceRequired}
        </p>
      )}

      {showAdjusted && adjustedScore !== undefined && rawScore !== undefined && (
        <div className="flex items-center gap-3 text-xs mt-1">
          <span className="text-gray-500">Raw score: <strong>{(rawScore * 100).toFixed(0)}%</strong></span>
          <span className="text-gray-400">→</span>
          <span className="text-gray-700">
            Strength-adjusted:{' '}
            <strong className={
              adjustedScore >= 0.75 ? 'text-green-700' :
              adjustedScore >= 0.55 ? 'text-yellow-700' :
              adjustedScore >= 0.30 ? 'text-orange-700' :
              'text-red-700'
            }>
              {(adjustedScore * 100).toFixed(0)}%
            </strong>
          </span>
          <Link
            href="/algorithms/strong-to-weak"
            className="text-blue-600 hover:underline ml-auto"
          >
            How this works →
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Multi-belief spectrum table ─────────────────────────────────

export interface StrengthSpectrumEntry {
  id: number | string
  slug?: string
  statement: string
  claimStrength: number
  rawScore?: number
}

interface StrengthSpectrumTableProps {
  entries: StrengthSpectrumEntry[]
  /** Example topic label for column header (e.g. "Immigration") */
  topicLabel?: string
}

/**
 * A full spectrum table showing multiple beliefs sorted from weak to extreme,
 * analogous to the HTML table in the Strong-to-Weak Spectrum documentation.
 */
export function StrengthSpectrumTable({
  entries,
  topicLabel = 'Topic',
}: StrengthSpectrumTableProps) {
  const sorted = [...entries].sort((a, b) => a.claimStrength - b.claimStrength)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-2 text-center w-[18%]">Claim Strength</th>
            <th className="border border-gray-300 px-3 py-2 text-left w-[37%]">
              Example ({topicLabel})
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left w-[30%]">
              Evidence Required
            </th>
            <th className="border border-gray-300 px-3 py-2 text-center w-[15%]">
              Typical Score
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => {
            const band = getStrengthBand(entry.claimStrength)
            const adjustedScore = entry.rawScore !== undefined
              ? applyStrengthPenalty(entry.rawScore, entry.claimStrength)
              : undefined

            return (
              <tr key={entry.id}>
                <td
                  className="border border-gray-300 px-3 py-3 text-center"
                  style={{ backgroundColor: band.hexColor }}
                >
                  <strong>{band.label} ({band.percentage})</strong>
                  <br />
                  <span className="text-xs">{band.descriptor}</span>
                </td>
                <td className="border border-gray-300 px-3 py-3">
                  {entry.slug ? (
                    <Link
                      href={`/beliefs/${encodeURIComponent(entry.slug)}`}
                      className="text-blue-700 hover:underline"
                    >
                      &ldquo;{entry.statement}&rdquo;
                    </Link>
                  ) : (
                    <>&ldquo;{entry.statement}&rdquo;</>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-3 text-xs text-gray-600">
                  {band.evidenceRequired}
                </td>
                <td
                  className="border border-gray-300 px-3 py-3 text-center"
                  style={{ backgroundColor: band.hexColor }}
                >
                  {adjustedScore !== undefined ? (
                    <>
                      <strong>{(adjustedScore * 100).toFixed(0)}%</strong>
                      <br />
                      <span className="text-xs text-gray-500">
                        ({(band.typicalScoreRange.min * 100).toFixed(0)}–
                        {(band.typicalScoreRange.max * 100).toFixed(0)}%)
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {(band.typicalScoreRange.min * 100).toFixed(0)}–
                      {(band.typicalScoreRange.max * 100).toFixed(0)}%
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Two-axis coordinate display ─────────────────────────────────

interface TwoAxisCoordinateProps {
  positivity: number    // -100 to +100
  claimStrength: number // 0 to 1
  statement?: string
}

/**
 * A compact two-axis coordinate display showing where a belief sits
 * in the (positive↔negative) × (weak↔extreme) space.
 */
export function TwoAxisCoordinate({ positivity, claimStrength, statement }: TwoAxisCoordinateProps) {
  const band = getStrengthBand(claimStrength)
  const valenceLabel = positivity > 20 ? 'Positive' : positivity < -20 ? 'Negative' : 'Neutral'
  const valenceColor = positivity > 20 ? 'text-green-700' : positivity < -20 ? 'text-red-700' : 'text-gray-600'

  return (
    <div className="inline-flex items-center gap-2 text-xs border border-gray-200 rounded px-2 py-1 bg-gray-50">
      <span className="text-gray-500">Position:</span>
      <span className={`font-semibold ${valenceColor}`}>
        {valenceLabel} ({positivity >= 0 ? '+' : ''}{positivity.toFixed(0)}%)
      </span>
      <span className="text-gray-400">×</span>
      <span
        className="font-semibold px-1 rounded text-xs"
        style={{ backgroundColor: band.hexColor }}
      >
        {band.label} ({formatStrength(claimStrength)})
      </span>
      {statement && (
        <Link
          href="/algorithms/strong-to-weak"
          className="text-blue-600 hover:underline"
          title="Learn about the strong-to-weak spectrum"
        >
          ?
        </Link>
      )}
    </div>
  )
}

// ─── Band legend ─────────────────────────────────────────────────

/**
 * A horizontal legend showing all four strength bands with colors.
 */
export function StrengthBandLegend() {
  return (
    <div className="flex gap-2 flex-wrap">
      {STRENGTH_BANDS.map((band) => (
        <div
          key={band.value}
          className="text-xs px-2 py-1 rounded border border-gray-200"
          style={{ backgroundColor: band.hexColor }}
        >
          <strong>{band.label}</strong> ({band.percentage})
        </div>
      ))}
    </div>
  )
}
