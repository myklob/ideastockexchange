'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/beliefs', label: 'Beliefs' },
  { href: '/topics', label: 'Topics' },
  { href: '/debate-topics', label: 'Debate Topics' },
  { href: '/markets', label: 'Markets' },
  { href: '/cba', label: 'CBA' },
  { href: '/protocol', label: 'Protocol' },
  { href: '/how-it-works', label: 'How it works' },
]

export function SiteHeader() {
  const path = usePathname() ?? '/'

  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)] sticky top-0 z-50">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 flex items-center gap-6 h-14">
        <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ise-logo-mark.svg" alt="" aria-hidden="true" width={28} height={28} className="rounded-md" />
          <span className="font-bold text-base text-[var(--foreground)] tracking-tight whitespace-nowrap">
            Idea Stock Exchange
          </span>
        </Link>

        <nav aria-label="Site" className="flex gap-1 flex-1 min-w-0 overflow-x-auto">
          {NAV.map((n) => {
            const active = n.href === '/' ? path === '/' : path.startsWith(n.href)
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'px-2.5 py-2 text-sm no-underline whitespace-nowrap border-b-2',
                  'transition-colors duration-[var(--duration)]',
                  active
                    ? 'font-semibold text-[var(--foreground)] border-[var(--ise-accent)]'
                    : 'font-medium text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)]',
                ].join(' ')}
              >
                {n.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
