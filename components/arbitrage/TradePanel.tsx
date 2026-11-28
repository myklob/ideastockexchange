'use client';
import { useState } from 'react';
import { X } from 'lucide-react';

interface TradePanelProps {
  belief: {
    slug: string;
    statement: string;
    reasonRank: number;
    marketPrice: number;
  };
  onClose: () => void;
  onTrade?: (side: 'YES' | 'NO', amount: number) => Promise<void>;
}

export function TradePanel({ belief, onClose, onTrade }: TradePanelProps) {
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState('250');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const yesPrice   = belief.marketPrice / 100;
  const noPrice    = 1 - yesPrice;
  const rr         = belief.reasonRank / 100;
  const divergence = rr - yesPrice;
  const signal     = Math.abs(divergence) < 0.05 ? 'HOLD' : divergence > 0 ? 'BUY YES' : 'BUY NO';
  const parsed     = parseFloat(amount) || 0;
  const shares     = parsed / (side === 'YES' ? yesPrice : noPrice);

  async function handleTrade() {
    if (!parsed || !onTrade) return;
    setSubmitting(true);
    try {
      await onTrade(side, parsed);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#141414', border: '1px solid #262626', borderRadius: 12, padding: 20, width: 400, color: '#ededed', boxShadow: 'var(--shadow-lg)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, lineHeight: 1.3, paddingRight: 12 }}>
            {belief.statement.length > 60 ? belief.statement.slice(0, 60) + '…' : belief.statement}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer', padding: 2 }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>✓</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Trade placed</div>
            <div style={{ fontSize: 13, color: '#a3a3a3' }}>
              {parsed} credits → ~{shares.toFixed(2)} {side} shares
            </div>
            <button onClick={onClose} style={{ marginTop: 16, padding: '8px 18px', background: '#262626', color: '#ededed', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Signal block */}
            <div style={{ padding: 12, borderRadius: 6, background: '#0a0a0a', border: '1px solid #262626', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#a3a3a3', marginBottom: 4, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Arbitrage Signal
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13 }}>
                  RR <span style={{ fontFamily: 'var(--font-mono)' }}>{belief.reasonRank.toFixed(1)}%</span>
                  {' / '}
                  Mkt <span style={{ fontFamily: 'var(--font-mono)' }}>{belief.marketPrice.toFixed(1)}%</span>
                </span>
                <span style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                  background: signal === 'BUY YES' ? 'rgba(34,197,94,0.18)' : signal === 'BUY NO' ? 'rgba(239,68,68,0.18)' : 'rgba(107,114,128,0.18)',
                  color: signal === 'BUY YES' ? '#22c55e' : signal === 'BUY NO' ? '#ef4444' : '#9ca3af',
                }}>
                  {signal}
                </span>
              </div>
            </div>

            {/* YES / NO buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button
                onClick={() => setSide('YES')}
                style={{
                  flex: 1, padding: 10, borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  background: side === 'YES' ? '#16a34a' : '#0a0a0a',
                  color: side === 'YES' ? '#fff' : '#a3a3a3',
                  border: side === 'YES' ? '1px solid #16a34a' : '1px solid #262626',
                  fontFamily: 'inherit',
                }}
              >
                YES {(yesPrice * 100).toFixed(1)}c
              </button>
              <button
                onClick={() => setSide('NO')}
                style={{
                  flex: 1, padding: 10, borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  background: side === 'NO' ? '#dc2626' : '#0a0a0a',
                  color: side === 'NO' ? '#fff' : '#a3a3a3',
                  border: side === 'NO' ? '1px solid #dc2626' : '1px solid #262626',
                  fontFamily: 'inherit',
                }}
              >
                NO {(noPrice * 100).toFixed(1)}c
              </button>
            </div>

            {/* Amount */}
            <label style={{ display: 'block', fontSize: 11, color: '#a3a3a3', marginBottom: 4, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Investment (IdeaCredits)
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{
                width: '100%', background: '#0a0a0a', border: '1px solid #262626',
                color: '#fff', borderRadius: 6, padding: '8px 10px',
                fontFamily: 'var(--font-mono)', fontSize: 14, marginBottom: 12,
                outline: 'none',
              }}
            />

            {parsed > 0 && (
              <div style={{ fontSize: 11, color: '#a3a3a3', marginBottom: 14 }}>
                Estimated: ~{shares.toFixed(2)} {side} shares (slippage may apply)
              </div>
            )}

            <button
              onClick={handleTrade}
              disabled={submitting || !parsed}
              style={{
                width: '100%', padding: 10, background: parsed ? '#fff' : '#262626',
                color: parsed ? '#0a0a0a' : '#a3a3a3',
                border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14,
                cursor: parsed ? 'pointer' : 'not-allowed',
              }}
            >
              {submitting ? 'Placing…' : `Buy ${side} Shares`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
