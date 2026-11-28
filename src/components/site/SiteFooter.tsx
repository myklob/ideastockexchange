import Link from 'next/link'

const RESOURCES = [
  { href: '/protocol', label: 'Schlicht Protocol' },
  { href: '/product-reviews', label: 'Product Reviews' },
  { href: '/cba', label: 'Cost-Benefit Analysis' },
  { href: '/markets', label: 'Prediction Markets' },
  { href: '/leverage', label: 'What to argue next' },
  { href: '/faq', label: 'FAQ & Criticisms' },
  { href: '/contact', label: 'Contact' },
]

const FRAMEWORK = [
  { href: '/algorithms/truth-scores', label: 'Truth' },
  { href: '/algorithms/linkage-scores', label: 'Linkage' },
  { href: '/algorithms/importance-score', label: 'Importance' },
  { href: '/algorithms/evidence-scores', label: 'Evidence' },
  { href: '/algorithms/assumptions', label: 'Assumptions' },
  { href: '/algorithms/strong-to-weak', label: 'Strong-to-Weak Spectrum' },
  { href: '/algorithms', label: 'All algorithms' },
]

function FooterLinks({ heading, links }: { heading: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="m-0 text-sm font-bold text-[var(--foreground)]">{heading}</h4>
      <ul className="list-none p-0 mt-3 flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-[13px] text-[var(--muted-foreground)] no-underline hover:text-[var(--foreground)] transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] mt-16 bg-[var(--background)]">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <h4 className="m-0 text-sm font-bold text-[var(--foreground)]">Idea Stock Exchange</h4>
          <p className="text-[13px] text-[var(--muted-foreground)] mt-2 leading-relaxed">
            Computational Epistemology Platform. Making confidence inspectable.
          </p>
        </div>
        <FooterLinks heading="Resources" links={RESOURCES} />
        <FooterLinks heading="Framework" links={FRAMEWORK} />
      </div>
      <div className="border-t border-[var(--border)] px-6 py-5 text-center text-[13px] text-[var(--muted-foreground)]">
        No ideological ownership. Good ideas win by surviving reality.
      </div>
    </footer>
  )
}
