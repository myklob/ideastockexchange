function scoreColor(pct: number): string {
  if (pct >= 80) return 'var(--score-excellent)'
  if (pct >= 60) return 'var(--score-good)'
  if (pct >= 40) return 'var(--score-moderate)'
  return 'var(--score-weak)'
}

function ScoreTile({
  label, value, suffix, colorStyle, sub,
}: {
  label: string; value: string; suffix: string; colorStyle: string; sub: string;
}) {
  return (
    <div className="border border-[var(--border)] rounded-lg p-3.5 bg-white">
      <div className="text-[11px] text-[var(--muted-foreground)] font-mono uppercase tracking-wider mb-1.5">
        {label}
      </div>
      <div className="font-mono font-bold text-[28px] leading-none tabular-nums" style={{ color: colorStyle }}>
        {value}
        <span className="text-base ml-0.5">{suffix}</span>
      </div>
      <div className="text-[11px] text-[var(--muted-foreground)] mt-1.5">{sub}</div>
    </div>
  )
}

export function ScoreDashboard({
  reasonRank,
  marketPrice,
  volume,
}: {
  reasonRank: number
  marketPrice: number
  volume: number
}) {
  const divergence = reasonRank - marketPrice
  return (
    <div className="grid grid-cols-4 gap-3">
      <ScoreTile
        label="ReasonRank"
        value={reasonRank.toFixed(1)}
        suffix="%"
        colorStyle={scoreColor(reasonRank)}
        sub="Truth × Relevance × Importance"
      />
      <ScoreTile
        label="Market Price"
        value={marketPrice.toFixed(1)}
        suffix="c"
        colorStyle="var(--score-good)"
        sub="YES share price"
      />
      <ScoreTile
        label="Divergence"
        value={`${divergence >= 0 ? '+' : ''}${divergence.toFixed(1)}`}
        suffix="%"
        colorStyle={divergence >= 0 ? 'var(--score-excellent)' : 'var(--score-weak)'}
        sub={divergence >= 0 ? 'Undervalued by crowd' : 'Overvalued by crowd'}
      />
      <ScoreTile
        label="Volume"
        value={volume.toLocaleString()}
        suffix=""
        colorStyle="var(--foreground)"
        sub="credits this month"
      />
    </div>
  )
}
