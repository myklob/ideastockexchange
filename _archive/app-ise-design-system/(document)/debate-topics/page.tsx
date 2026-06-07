import Link from 'next/link';

export const metadata = { title: 'Debate Topics — ISE' };

export default function DebateTopicsPage() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 24px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>Debate Topics</h1>
      <p style={{ color: '#737373', maxWidth: 600, lineHeight: 1.6 }}>
        The full Debate Topics surface is under active development. This view will list canonical debate
        positions with objective criteria agreed before measurement — Validity, Reliability, Linkage,
        Importance — so scoring precedes argument.
      </p>
      <Link href="/" style={{ display: 'inline-block', marginTop: 16, padding: '10px 18px', background: '#2563eb', color: '#fff', textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>
        Back to home
      </Link>
    </div>
  );
}
