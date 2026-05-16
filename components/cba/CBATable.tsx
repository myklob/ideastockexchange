import { CBAItem } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

const th: React.CSSProperties = { border: '1px solid #e5e5e5', padding: '8px 10px', textAlign: 'left', fontWeight: 600 };
const td: React.CSSProperties = { border: '1px solid #e5e5e5', padding: '10px 12px', verticalAlign: 'top' };

function LikelihoodMeter({ pct }: { pct: number }) {
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#ea580c' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 99, background: '#f5f5f5', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {pct}%
      </span>
    </div>
  );
}

export function CBATable({ rows, kind }: { rows: CBAItem[]; kind: 'benefit' | 'cost' }) {
  const isPro = kind === 'benefit';
  const totalEV = rows.reduce((s, r) => s + (r.impactValue * r.likelihood / 100), 0);

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d4d4d4', fontSize: 13 }}>
      <thead>
        <tr style={{ background: isPro ? '#f0fdf4' : '#fef2f2' }}>
          <th style={{ ...th, width: '40%' }}>Line Item</th>
          <th style={{ ...th, textAlign: 'right',  width: '17%' }}>Predicted Impact</th>
          <th style={{ ...th, textAlign: 'center', width: '15%' }}>Likelihood</th>
          <th style={{ ...th, textAlign: 'center', width: '12%' }}>Evidence</th>
          <th style={{ ...th, textAlign: 'right',  width: '16%' }}>Expected Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => {
          const ev = r.impactValue * r.likelihood / 100;
          const evLabel = `${ev >= 0 ? '+' : '−'}$${Math.abs(ev).toFixed(1)}B`;
          return (
            <tr key={r.id} style={{ borderBottom: '1px solid #e5e5e5' }}>
              <td style={td}>{r.label}</td>
              <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)', color: isPro ? '#15803d' : '#b91c1c', fontVariantNumeric: 'tabular-nums' }}>
                {r.impact}
              </td>
              <td style={{ ...td, textAlign: 'center' }}>
                <LikelihoodMeter pct={r.likelihood} />
              </td>
              <td style={{ ...td, textAlign: 'center' }}>
                <Badge tone={r.evidence >= 80 ? 'pro' : r.evidence >= 60 ? 'info' : 'warn'}>
                  {r.evidence}%
                </Badge>
              </td>
              <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: isPro ? '#15803d' : '#b91c1c', fontVariantNumeric: 'tabular-nums' }}>
                {evLabel}
              </td>
            </tr>
          );
        })}
        <tr style={{ background: '#f5f5f5', fontWeight: 700 }}>
          <td colSpan={4} style={{ ...td, textAlign: 'right' }}>Total Expected Value</td>
          <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)', color: isPro ? '#15803d' : '#b91c1c', fontVariantNumeric: 'tabular-nums' }}>
            {totalEV >= 0 ? '+' : '−'}${Math.abs(totalEV).toFixed(1)}B
          </td>
        </tr>
      </tbody>
    </table>
  );
}
