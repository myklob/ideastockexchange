"use client";

interface ClaimCardProps {
  id: string;
  title: string;
  category: string;
  reasonRank: number;
  truthScore: number;
  marketPriceYes: number;
  marketPriceNo: number;
  volume: number;
  divergence: number;
}

export default function ClaimCard({
  id,
  title,
  category,
  reasonRank,
  truthScore,
  marketPriceYes,
  marketPriceNo,
  volume,
  divergence,
}: ClaimCardProps) {
  const divergenceAbs = Math.abs(divergence);
  const isUndervalued = divergence > 0.05;
  const isOvervalued = divergence < -0.05;

  return (
    <a
      href={`/claims/${id}`}
      className="block bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4 hover:border-white/20 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <span className="text-xs text-[var(--neutral)]">{category}</span>
        </div>
        {divergenceAbs > 0.05 && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              isUndervalued
                ? "bg-green-900/40 text-[var(--profit)]"
                : "bg-red-900/40 text-[var(--loss)]"
            }`}
          >
            {isUndervalued ? "UNDERVALUED" : "OVERVALUED"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-[var(--neutral)] text-xs mb-1">Fundamentals</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono font-semibold">
              {(reasonRank * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-[var(--neutral)]">ReasonRank</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xs">
              {(truthScore * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-[var(--neutral)]">TruthScore</span>
          </div>
        </div>

        <div>
          <div className="text-[var(--neutral)] text-xs mb-1">Market</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono font-semibold text-[var(--profit)]">
              YES {(marketPriceYes * 100).toFixed(1)}c
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono font-semibold text-[var(--loss)]">
              NO {(marketPriceNo * 100).toFixed(1)}c
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border)] flex justify-between text-xs text-[var(--neutral)]">
        <span>Vol: {volume.toLocaleString()} credits</span>
        <span
          className={`font-semibold ${
            isUndervalued
              ? "text-[var(--profit)]"
              : isOvervalued
                ? "text-[var(--loss)]"
                : "text-[var(--neutral)]"
          }`}
        >
          Gap: {divergence > 0 ? "+" : ""}
          {(divergence * 100).toFixed(1)}%
        </span>
      </div>
    </a>
  );
}
