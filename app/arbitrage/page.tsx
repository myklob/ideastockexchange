'use client';
import { useState } from 'react';
import { arbitrageRows } from '@/lib/data';
import { ArbitrageRow } from '@/lib/types';
import { TradePanel } from '@/components/arbitrage/TradePanel';
import { beliefs } from '@/lib/data';

function potentialReturn(row: ArbitrageRow): number {
  const rr = row.reasonRank / 100;
  const mkt = row.marketPrice / 100;
  if (row.signal === 'UNDER') {
    return mkt > 0 ? (rr - mkt) / mkt : 0;
  } else {
    const noPrice = 1 - mkt;
    return noPrice > 0 ? (mkt - rr) / noPrice : 0;
  }
}

export default function ArbitragePage() {
  const [minDiv, setMinDiv]       = useState(0.05);
  const [selected, setSelected]   = useState<ArbitrageRow | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);

  const rows = arbitrageRows.filter(r =>
    Math.abs(r.reasonRank - r.marketPrice) / 100 >= minDiv
  );

  function handleRowClick(row: ArbitrageRow) {
    setSelected(row);
    setTradeOpen(true);
  }

  const belief = selected ? beliefs.find(b => b.slug === selected.id) : null;

  async function handleTrade(side: 'YES' | 'NO', amount: number) {
    if (!selected) return;
    await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beliefSlug: selected.id, side, amount }),
    });
  }

  const openOpps = arbitrageRows.filter(r => Math.abs(r.reasonRank - r.marketPrice) / 100 >= 0.05).length;
  const totalVol = arbitrageRows.reduce((s, r) => s + r.volume, 0);
  const medDiv   = [...arbitrageRows]
    .map(r => Math.abs(r.reasonRank - r.marketPrice))
    .sort((a, b) => a - b)[Math.floor(arbitrageRows.length / 2)] ?? 0;

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Arbitrage Dashboard</h2>
          <p className="text-sm text-[var(--neutral)] mt-1">
            Claims where ReasonRank and Market Price diverge. Profit lives in the gap.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="minDiv" className="text-[var(--neutral)]">Min Divergence:</label>
          <select
            id="minDiv"
            value={minDiv}
            onChange={e => setMinDiv(parseFloat(e.target.value))}
            className="bg-[var(--card-bg)] border border-[var(--border)] rounded px-2 py-1 text-white"
          >
            <option value={0.05}>5%</option>
            <option value={0.10}>10%</option>
            <option value={0.20}>20%</option>
            <option value={0.30}>30%</option>
          </select>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        <DarkTile label="Open Opportunities" val={String(openOpps)} hint="+12 today" tone="profit" />
        <DarkTile label="24h Volume"          val={`$${Math.round(totalVol / 1000)}K`} hint="virtual credits" tone="neutral" />
        <DarkTile label="Median Divergence"   val={`${medDiv.toFixed(1)}%`} hint="across signals" tone="neutral" />
      </div>

      {rows.length === 0 ? (
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
          {rows.map(o => {
            const div = o.reasonRank - o.marketPrice;
            const ret = potentialReturn(o);
            return (
              <button
                key={o.id}
                onClick={() => handleRowClick(o)}
                className="grid grid-cols-7 gap-4 items-center bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-left cursor-pointer row-hover-dark"
                style={{ fontFamily: 'inherit', color: 'var(--foreground)', fontSize: 13 }}
              >
                <div className="col-span-2">
                  <span className="font-medium">{o.title}</span>
                  <span className="ml-2 text-xs text-[var(--neutral)]">{o.category}</span>
                </div>
                <div className="text-right font-mono tabular-nums">
                  {(o.reasonRank / 100 * 100).toFixed(1)}%
                </div>
                <div className="text-right font-mono tabular-nums">
                  {(o.marketPrice / 100 * 100).toFixed(1)}%
                </div>
                <div className={`text-right font-mono tabular-nums font-semibold ${div > 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                  {div > 0 ? '+' : ''}{div.toFixed(1)}%
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold font-mono ${
                    o.signal === 'UNDER'
                      ? 'bg-green-900/40 text-[var(--profit)]'
                      : 'bg-red-900/40 text-[var(--loss)]'
                  }`}>
                    {o.signal === 'UNDER' ? 'BUY YES' : 'BUY NO'}
                  </span>
                </div>
                <div className={`text-right font-mono tabular-nums font-semibold ${ret > 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                  {(ret * 100).toFixed(0)}%
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tradeOpen && belief && (
        <TradePanel
          belief={{ slug: belief.slug, statement: belief.statement, reasonRank: belief.reasonRank, marketPrice: belief.marketPrice }}
          onClose={() => setTradeOpen(false)}
          onTrade={handleTrade}
        />
      )}
    </div>
  );
}

function DarkTile({ label, val, hint, tone }: { label: string; val: string; hint: string; tone: string }) {
  const color = tone === 'profit' ? 'var(--profit)' : tone === 'loss' ? 'var(--loss)' : 'var(--foreground)';
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
      <div className="text-[11px] text-[var(--neutral)] uppercase tracking-wider font-mono">{label}</div>
      <div className="font-mono font-bold text-[28px] mt-1.5 tabular-nums" style={{ color }}>{val}</div>
      <div className="text-xs text-[var(--neutral)] mt-1">{hint}</div>
    </div>
  );
}
