interface NonSequiturWarningProps {
  isNonSequitur: boolean
  isTrueButIrrelevant: boolean
  warningMessage: string | null
  truthScore: number
  linkageScore: number
}

/**
 * Warning tag for arguments that are "True but Irrelevant" or "Non Sequiturs".
 *
 * Displayed when:
 * - Linkage Score < 0.1 AND Truth Score > 80% → "True but Irrelevant"
 * - Classification is NON_SEQUITUR or IRRELEVANT → "Non Sequitur"
 */
export default function NonSequiturWarning({
  isNonSequitur,
  isTrueButIrrelevant,
  warningMessage,
  truthScore,
  linkageScore,
}: NonSequiturWarningProps) {
  if (!isNonSequitur && !isTrueButIrrelevant) return null

  const variant = isTrueButIrrelevant ? 'true-but-irrelevant' : 'non-sequitur'

  return (
    <div
      className={`rounded px-3 py-2 text-xs border ${
        variant === 'true-but-irrelevant'
          ? 'bg-amber-50 border-amber-300 text-amber-800'
          : 'bg-red-50 border-red-300 text-red-800'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold uppercase tracking-wider text-[10px]">
          {variant === 'true-but-irrelevant'
            ? 'True but Irrelevant'
            : 'Non Sequitur'}
        </span>
        <span className="text-[9px] font-mono opacity-70">
          Truth: {(truthScore * 100).toFixed(0)}% | Linkage: {(linkageScore * 100).toFixed(0)}%
        </span>
      </div>
      {warningMessage && (
        <p className="opacity-80">{warningMessage}</p>
      )}
      <p className="mt-1 opacity-70 italic">
        Net Weight = Truth ({(truthScore * 100).toFixed(0)}%) &times; Linkage ({(linkageScore * 100).toFixed(0)}%) = <strong>{(truthScore * linkageScore * 100).toFixed(0)}%</strong> contribution
      </p>
    </div>
  )
}
