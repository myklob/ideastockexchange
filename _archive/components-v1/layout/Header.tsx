'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoMark } from '@/components/ui/LogoMark';

const NAV = [
  { href: '/',              label: 'Home' },
  { href: '/beliefs',       label: 'Beliefs' },
  { href: '/debate-topics', label: 'Debate Topics' },
  { href: '/markets',       label: 'Markets' },
  { href: '/arbitrage',     label: 'Arbitrage' },
  { href: '/cba',           label: 'CBA' },
  { href: '/protocol',      label: 'Protocol' },
];

export function Header({ credits = 1250 }: { credits?: number }) {
  const path = usePathname();

  return (
    <header className="border-b border-[var(--border)] bg-white sticky top-0 z-10">
      <div className="max-w-[1280px] mx-auto px-6 flex items-center gap-8 h-14">
        <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
          <LogoMark size={28} />
          <span className="font-bold text-base text-[var(--foreground)] tracking-tight">
            Idea Stock Exchange
          </span>
        </Link>

        <nav className="flex gap-1 flex-1">
          {NAV.map(n => {
            const active = n.href === '/' ? path === '/' : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={[
                  'px-2.5 py-2 text-sm no-underline whitespace-nowrap transition-colors duration-[var(--duration)]',
                  'border-b-2',
                  active
                    ? 'font-semibold text-[var(--foreground)] border-[var(--accent)]'
                    : 'font-medium text-[#525252] border-transparent hover:text-[var(--foreground)]',
                ].join(' ')}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-baseline gap-1.5 shrink-0">
          <span className="font-mono text-xs text-[var(--muted-foreground)]">Credits</span>
          <span className="font-mono font-bold text-sm text-[var(--foreground)]">
            {credits.toLocaleString()}
          </span>
        </div>
      </div>
    </header>
  );
}
