import Link from 'next/link'
import type { ContrastClassData } from '../types'
import {
  comparativeScores,
  type ContrastOption,
} from '@/core/scoring/contrast-class'

interface ContrastClassSectionProps {
  contrastClass: ContrastClassData | null | undefined
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center font-mono text-xs'

function fmtScore(v: number | null): string {
  if (v == null) return ''
  return v.toFixed(2)
}

function fmtOcv(v: number | null): string {
  if (v == null) return ''
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`
}

/**
 * The Contrast Class block — the denominator made visible. Lists the mutually
 * exclusive rivals the focal belief is priced against, and (once their tree
 * scores exist) the opportunity-cost value of each against its best rival. A
 * bare pro-minus-con score silently picks "do nothing" as the denominator;
 * this section names the real one. See docs/THE_DENOMINATOR.md.
 */
export default function ContrastClassSection({ contrastClass }: ContrastClassSectionProps) {
  if (!contrastClass || contrastClass.options.length === 0) return null

  const { question, options } = contrastClass

  // Only run the comparative layer when every option carries a real score
  // (Rule 6: no fabricated OCV from missing scores).
  const allScored = options.every(o => o.score != null)
  const scored: ContrastOption[] = options.map(o => ({
    id: o.id,
    label: o.label,
    score: o.score ?? 0,
  }))
  const comparative = allScored ? comparativeScores(scored) : null

  const focal = options.find(o => o.isFocal)
  const focalResult = comparative && focal
    ? comparative.find(r => r.id === focal.id)
    : null
  const bestRival = focalResult?.bestRivalId
    ? options.find(o => o.id === focalResult.bestRivalId)
    : null

  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
        <span>&#9878;&#65039;</span>
        Contrast Class
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        The denominator, made visible. A score is always{' '}
        <em>compared to what</em> — these are the mutually exclusive rivals that
        answer the same question and compete for the same slot. The{' '}
        <Link href="/algorithms/strong-to-weak" className="text-[var(--accent)] hover:underline">value</Link>{' '}
        of an option is what it delivers minus what the best alternative would
        have delivered.
      </p>
      <p className="text-sm mb-4">
        <strong>Question:</strong> {question}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-[28%]`}>Option</th>
              <th className={`${TH} w-[40%]`}>One-line</th>
              <th className={`${TH} text-center w-[16%]`}>Score</th>
              <th className={`${TH} text-center w-[16%]`}>vs. best rival</th>
            </tr>
          </thead>
          <tbody>
            {options.map(o => {
              const r = comparative?.find(c => c.id === o.id)
              return (
                <tr key={o.id} className={o.isFocal ? 'bg-yellow-50 font-semibold' : ''}>
                  <td className={TD}>
                    {o.slug ? (
                      <Link href={`/beliefs/${o.slug}`} className="text-[var(--accent)] hover:underline">
                        {o.label}
                      </Link>
                    ) : (
                      o.label
                    )}
                    {o.isFocal && (
                      <span className="text-xs text-[var(--muted-foreground)] font-normal"> (this belief)</span>
                    )}
                  </td>
                  <td className={TD}>{o.oneLine ?? <span>&nbsp;</span>}</td>
                  <td className={TDC}>{fmtScore(o.score)}</td>
                  <td className={`${TDC} ${r && r.ocv != null ? (r.ocv > 0 ? 'text-green-700' : 'text-red-700') : ''}`}>
                    {r ? fmtOcv(r.ocv) : ''}
                    {r?.isWinner && <span className="text-green-700"> ★</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {focalResult && focalResult.ocv != null && bestRival ? (
        <p className="text-sm mt-4 p-2 bg-gray-100 border border-gray-300">
          <strong>
            Opportunity-cost value: {fmtOcv(focalResult.ocv)} vs. {bestRival.label}.
          </strong>{' '}
          {focalResult.ocv > 0
            ? `This is the best option in the field — it beats its strongest rival (${bestRival.label}) by ${focalResult.ocv.toFixed(2)}.`
            : `This option loses to its best rival (${bestRival.label}) by ${Math.abs(focalResult.ocv).toFixed(2)} — the verdict is "worse than ${bestRival.label}", not "good or bad in the abstract".`}
        </p>
      ) : (
        <p className="text-sm mt-4 text-[var(--muted-foreground)] italic">
          Opportunity-cost value appears once every option in the class carries a
          scored argument tree.
        </p>
      )}
    </section>
  )
}
