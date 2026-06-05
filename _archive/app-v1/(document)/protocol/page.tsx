import Link from 'next/link';

export const metadata = { title: 'Schlicht Protocol — ISE' };

export default function ProtocolPage() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 24px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>Schlicht Protocol</h1>
      <p style={{ color: '#737373', maxWidth: 640, lineHeight: 1.6, marginBottom: 12 }}>
        The Schlicht Protocol is ISE's verification log for AI-agent reasoning chains. Each agent inference
        is cryptographically timestamped, scored by the argument engine, and published as an immutable ledger
        entry. The goal: auditability of machine-generated claims at the same standard as human arguments.
      </p>
      <p style={{ color: '#737373', maxWidth: 640, lineHeight: 1.6 }}>
        Live protocol log and AI-agent verification dashboard under development.
      </p>
      <Link href="/" style={{ display: 'inline-block', marginTop: 16, padding: '10px 18px', background: '#2563eb', color: '#fff', textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>
        Back to home
      </Link>
    </div>
  );
}
