'use client';
import { useState } from 'react';
import { TradePanel } from '@/components/arbitrage/TradePanel';

interface BeliefSummary {
  slug: string;
  statement: string;
  reasonRank: number;
  marketPrice: number;
}

export default function TradeButton({ belief }: { belief: BeliefSummary }) {
  const [open, setOpen] = useState(false);

  async function handleTrade(side: 'YES' | 'NO', amount: number) {
    await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beliefSlug: belief.slug, side, amount }),
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '8px 16px', background: '#2563eb', color: '#fff',
          border: 'none', borderRadius: 6, fontWeight: 500, fontSize: 14,
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        Trade
      </button>
      {open && (
        <TradePanel
          belief={belief}
          onClose={() => setOpen(false)}
          onTrade={handleTrade}
        />
      )}
    </>
  );
}
