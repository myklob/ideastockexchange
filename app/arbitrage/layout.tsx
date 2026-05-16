import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Arbitrage Dashboard — ISE' };

export default function ArbitrageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#ededed' }}>
      <DarkHeader />
      {children}
    </div>
  );
}

function DarkHeader() {
  const NAV = [
    { href: '/',           label: 'Home' },
    { href: '/beliefs',    label: 'Beliefs' },
    { href: '/debate-topics', label: 'Debate Topics' },
    { href: '/markets',    label: 'Markets' },
    { href: '/arbitrage',  label: 'Arbitrage', active: true },
    { href: '/cba',        label: 'CBA' },
    { href: '/protocol',   label: 'Protocol' },
  ];
  return (
    <header style={{ borderBottom: '1px solid #262626', background: '#0a0a0a', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 32, height: 56 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <ISEMarkDark size={28} />
          <span style={{ fontWeight: 700, fontSize: 16, color: '#ededed', letterSpacing: '-0.01em' }}>
            Idea Stock Exchange
          </span>
        </a>
        <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
          {NAV.map(n => (
            <a key={n.href} href={n.href} style={{
              padding: '8px 10px', fontSize: 14, fontWeight: n.active ? 600 : 400,
              color: n.active ? '#ededed' : '#a3a3a3',
              borderBottom: n.active ? '2px solid #3b82f6' : '2px solid transparent',
              textDecoration: 'none',
            }}>
              {n.label}
            </a>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#737373' }}>Credits</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: '#ededed' }}>1,250</span>
        </div>
      </div>
    </header>
  );
}

function ISEMarkDark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 144 144" aria-hidden="true">
      <rect width="144" height="144" rx="28" fill="#0f172a"/>
      <g stroke="#3b82f6" strokeWidth="1.3" strokeOpacity="0.5" fill="none" strokeLinecap="round">
        <line x1="32" y1="110" x2="56" y2="92"/>
        <line x1="56" y1="92"  x2="72" y2="78"/>
        <line x1="72" y1="78"  x2="92" y2="58"/>
        <line x1="92" y1="58"  x2="115" y2="38"/>
        <line x1="56" y1="92"  x2="48" y2="74"/>
        <line x1="72" y1="78"  x2="64" y2="64"/>
        <line x1="92" y1="58"  x2="106" y2="74"/>
      </g>
      <path d="M 32 110 L 56 92 L 72 78 L 92 58 L 115 38" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="32" cy="110" r="5"   fill="#ef4444"/>
      <circle cx="72" cy="78"  r="4.5" fill="#22c55e"/>
      <circle cx="92" cy="58"  r="6"   fill="#3b82f6"/>
      <circle cx="115" cy="38" r="7"   fill="#60a5fa"/>
    </svg>
  );
}
