import { carbonTaxCBA } from '@/lib/data';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Callout } from '@/components/ui/Callout';
import { CBATable } from '@/components/cba/CBATable';

export const metadata = { title: 'Cost-Benefit Analysis — ISE' };

export default function CBAPage() {
  const benefits = carbonTaxCBA.filter(r => r.side === 'benefit');
  const costs    = carbonTaxCBA.filter(r => r.side === 'cost');

  const evBenefits = benefits.reduce((s, r) => s + r.impactValue * r.likelihood / 100, 0);
  const evCosts    = costs.reduce(   (s, r) => s + r.impactValue * r.likelihood / 100, 0);
  const netEV      = evBenefits + evCosts;

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
        Cost-Benefit Analysis
      </h1>
      <p style={{ fontSize: 14, color: '#737373', margin: '6px 0 18px' }}>
        Carbon tax (revenue-neutral, $50/ton starting 2027) · 10-year horizon
      </p>

      <Callout tone="info" title="Calibrated EV:">
        Each cost and benefit's <em>predicted impact</em> is multiplied by its{' '}
        <em>likelihood score</em> — a nested belief that must survive its own argument tree.
        Impacts don't count unless their probabilities survive attack.
      </Callout>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '20px 0 28px' }}>
        <EVTile label="Expected Benefits" val={`+$${evBenefits.toFixed(1)}B`} tone="pro" />
        <EVTile label="Expected Costs"    val={`−$${Math.abs(evCosts).toFixed(1)}B`} tone="con" />
        <EVTile
          label="Net Expected Value"
          val={`${netEV >= 0 ? '+' : '−'}$${Math.abs(netEV).toFixed(1)}B`}
          tone={netEV >= 0 ? 'pro' : 'con'}
        />
      </div>

      <SectionHeading emoji="📈" title="Benefits Ledger" subtitle="Predicted impact × likelihood = expected value" />
      <CBATable rows={benefits} kind="benefit" />

      <div style={{ height: 24 }} />

      <SectionHeading emoji="📉" title="Costs Ledger" />
      <CBATable rows={costs} kind="cost" />
    </div>
  );
}

function EVTile({ label, val, tone }: { label: string; val: string; tone: 'pro' | 'con' }) {
  const color = tone === 'pro' ? '#15803d' : '#b91c1c';
  return (
    <div style={{ padding: 18, border: '1px solid #e5e5e5', borderRadius: 8, background: '#fff' }}>
      <div style={{ fontSize: 11, color: '#737373', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 32, color, marginTop: 6, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {val}
      </div>
    </div>
  );
}
