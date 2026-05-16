import Link from 'next/link';

export const metadata = { title: 'Markets — ISE' };

export default function MarketsPage() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 24px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>Markets</h1>
      <p style={{ color: '#737373', maxWidth: 600, lineHeight: 1.6 }}>
        The Markets surface shows live YES/NO prediction markets for all tracked beliefs. Browse open positions,
        volume, and price history. Real market mechanics coming soon.
      </p>
      <Link href="/arbitrage" style={{ display: 'inline-block', marginTop: 16, padding: '10px 18px', background: '#2563eb', color: '#fff', textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>
        View Arbitrage Dashboard
      </Link>
    </div>
  );
}
