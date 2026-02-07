"use client";

import { useState, useEffect } from "react";

interface ArbitrageOpportunity {
  claimId: string;
  title: string;
  category: string;
  reasonRank: number;
  truthScore: number;
  marketPrice: number;
  divergence: number;
  direction: "UNDERVALUED" | "OVERVALUED";
  magnitude: number;
  potentialReturn: number;
  volume: number;
}

export default function ArbitrageDashboard() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [minDivergence, setMinDivergence] = useState(0.05);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOpportunities() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/arbitrage?minDivergence=${minDivergence}&limit=50`
        );
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      } catch {
        setOpportunities([]);
      }
      setLoading(false);
    }
    fetchOpportunities();
  }, [minDivergence]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Arbitrage Dashboard</h2>
          <p className="text-sm text-[var(--neutral)] mt-1">
            Claims where ReasonRank and Market Price diverge. Profit lives in the gap.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="minDiv" className="text-[var(--neutral)]">
            Min Divergence:
          </label>
          <select
            id="minDiv"
            value={minDivergence}
            onChange={(e) => setMinDivergence(parseFloat(e.target.value))}
            className="bg-[var(--card-bg)] border border-[var(--border)] rounded px-2 py-1 text-white"
          >
            <option value={0.05}>5%</option>
            <option value={0.10}>10%</option>
            <option value={0.20}>20%</option>
            <option value={0.30}>30%</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--neutral)]">
          Loading opportunities...
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-12 text-[var(--neutral)]">
          No arbitrage opportunities found at this threshold.
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Header */}
          <div className="grid grid-cols-7 gap-4 text-xs font-semibold text-[var(--neutral)] uppercase tracking-wide px-4">
            <div className="col-span-2">Claim</div>
            <div className="text-right">ReasonRank</div>
            <div className="text-right">Market Price</div>
            <div className="text-right">Divergence</div>
            <div className="text-right">Signal</div>
            <div className="text-right">Potential Return</div>
          </div>

          {/* Rows */}
          {opportunities.map((opp) => (
            <div
              key={opp.claimId}
              className="grid grid-cols-7 gap-4 items-center bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-4 py-3 hover:border-white/20 transition-colors"
            >
              <div className="col-span-2">
                <a
                  href={`/claims/${opp.claimId}`}
                  className="font-medium hover:text-white transition-colors"
                >
                  {opp.title}
                </a>
                <span className="ml-2 text-xs text-[var(--neutral)]">
                  {opp.category}
                </span>
              </div>
              <div className="text-right font-mono">
                {(opp.reasonRank * 100).toFixed(1)}%
              </div>
              <div className="text-right font-mono">
                {(opp.marketPrice * 100).toFixed(1)}%
              </div>
              <div
                className={`text-right font-mono font-semibold ${
                  opp.direction === "UNDERVALUED"
                    ? "text-[var(--profit)]"
                    : "text-[var(--loss)]"
                }`}
              >
                {opp.divergence > 0 ? "+" : ""}
                {(opp.divergence * 100).toFixed(1)}%
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                    opp.direction === "UNDERVALUED"
                      ? "bg-green-900/40 text-[var(--profit)]"
                      : "bg-red-900/40 text-[var(--loss)]"
                  }`}
                >
                  {opp.direction === "UNDERVALUED" ? "BUY YES" : "BUY NO"}
                </span>
              </div>
              <div
                className={`text-right font-mono font-semibold ${
                  opp.potentialReturn > 0
                    ? "text-[var(--profit)]"
                    : "text-[var(--loss)]"
                }`}
              >
                {(opp.potentialReturn * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
