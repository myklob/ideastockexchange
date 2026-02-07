"use client";

import { useState, useEffect } from "react";

interface Holding {
  claimId: string;
  claimTitle?: string;
  shareType: "YES" | "NO";
  quantity: number;
  avgPurchasePrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

interface PortfolioData {
  user: {
    id: string;
    username: string;
    currentBalance: number;
  };
  totalValue: number;
  totalInvested: number;
  unrealizedPnl: number;
  realizedPnl: number;
  roi: number;
  holdings: Holding[];
}

export default function PortfolioView({ userId }: { userId: string }) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPortfolio() {
      setLoading(true);
      try {
        const res = await fetch(`/api/portfolio?userId=${userId}`);
        const data = await res.json();
        setPortfolio(data);
      } catch {
        setPortfolio(null);
      }
      setLoading(false);
    }
    fetchPortfolio();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-12 text-[var(--neutral)]">
        Loading portfolio...
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="text-center py-12 text-[var(--neutral)]">
        Portfolio not found.
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="Total Value"
          value={portfolio.totalValue.toFixed(2)}
          suffix="credits"
        />
        <SummaryCard
          label="Unrealized P&L"
          value={portfolio.unrealizedPnl.toFixed(2)}
          suffix="credits"
          color={portfolio.unrealizedPnl >= 0 ? "profit" : "loss"}
        />
        <SummaryCard
          label="Realized P&L"
          value={portfolio.realizedPnl.toFixed(2)}
          suffix="credits"
          color={portfolio.realizedPnl >= 0 ? "profit" : "loss"}
        />
        <SummaryCard
          label="ROI"
          value={(portfolio.roi * 100).toFixed(1)}
          suffix="%"
          color={portfolio.roi >= 0 ? "profit" : "loss"}
        />
      </div>

      {/* Cash Balance */}
      <div className="mb-6 text-sm text-[var(--neutral)]">
        Available Balance:{" "}
        <span className="font-mono text-white">
          {portfolio.user.currentBalance.toFixed(2)} credits
        </span>
      </div>

      {/* Holdings Table */}
      <h3 className="text-lg font-semibold mb-4">Active Positions</h3>
      {portfolio.holdings.length === 0 ? (
        <div className="text-center py-8 text-[var(--neutral)]">
          No active positions. Invest in claims to build your portfolio.
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 gap-4 text-xs font-semibold text-[var(--neutral)] uppercase tracking-wide px-4 py-3 bg-[var(--card-bg)]">
            <div className="col-span-2">Claim</div>
            <div className="text-right">Position</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Avg Cost</div>
            <div className="text-right">Current</div>
            <div className="text-right">P&L</div>
          </div>
          {portfolio.holdings.map((h, i) => (
            <div
              key={`${h.claimId}-${h.shareType}`}
              className={`grid grid-cols-7 gap-4 items-center px-4 py-3 text-sm ${
                i % 2 === 0 ? "bg-[var(--background)]" : "bg-[var(--card-bg)]"
              }`}
            >
              <div className="col-span-2 font-medium">
                {h.claimTitle || h.claimId}
              </div>
              <div className="text-right">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    h.shareType === "YES"
                      ? "bg-green-900/40 text-[var(--profit)]"
                      : "bg-red-900/40 text-[var(--loss)]"
                  }`}
                >
                  {h.shareType}
                </span>
              </div>
              <div className="text-right font-mono">{h.quantity.toFixed(2)}</div>
              <div className="text-right font-mono">
                {h.avgPurchasePrice.toFixed(3)}
              </div>
              <div className="text-right font-mono">
                {h.currentPrice.toFixed(3)}
              </div>
              <div
                className={`text-right font-mono font-semibold ${
                  h.unrealizedPnl >= 0
                    ? "text-[var(--profit)]"
                    : "text-[var(--loss)]"
                }`}
              >
                {h.unrealizedPnl >= 0 ? "+" : ""}
                {h.unrealizedPnl.toFixed(2)}
                <span className="text-xs ml-1">
                  ({(h.unrealizedPnlPercent * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: string;
  suffix: string;
  color?: "profit" | "loss";
}) {
  const colorClass =
    color === "profit"
      ? "text-[var(--profit)]"
      : color === "loss"
        ? "text-[var(--loss)]"
        : "text-white";

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
      <div className="text-xs text-[var(--neutral)] uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className={`text-xl font-mono font-bold ${colorClass}`}>
        {value}
        <span className="text-sm font-normal ml-1">{suffix}</span>
      </div>
    </div>
  );
}
