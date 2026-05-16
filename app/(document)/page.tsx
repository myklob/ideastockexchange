import Link from 'next/link';
import { beliefs } from '@/lib/data';

const FEATURE_CARDS = [
  { title: 'Plain-English Decode',  description: 'What the claim actually asserts, stripped of rhetoric.',                              href: '/beliefs/carbon-tax-reduces-emissions' },
  { title: 'Three Spectrums',       description: 'Valence × Specificity × Intensity. Direction is not strength.',                       href: '/beliefs/carbon-tax-reduces-emissions' },
  { title: 'Argument Trees',        description: 'Recursive pro/con structure scored by Linkage Score, Truth Score, and impact.',        href: '/beliefs/carbon-tax-reduces-emissions' },
  { title: 'Evidence Ledger',       description: 'Supporting vs weakening evidence with T1–T4 quality tiers.',                           href: '/beliefs/carbon-tax-reduces-emissions' },
  { title: 'Objective Criteria',    description: 'Validity, Reliability, Linkage, Importance — agreed before measurement.',             href: '/beliefs/carbon-tax-reduces-emissions' },
  { title: 'Stakeholder Ledger',    description: "Who pays, who benefits, who's the silent victim of second-order effects.",             href: '/beliefs/carbon-tax-reduces-emissions' },
];

const PILLARS = [
  {
    heading: 'ReasonRank',
    colorBar: 'var(--accent)',
    body: 'The logic score. Truth × Relevance × Importance, computed recursively from the network of sub-arguments — like PageRank for claims.',
    footer: `Used by ${beliefs.length.toLocaleString()} beliefs`,
  },
  {
    heading: 'Market Price',
    colorBar: 'var(--pro)',
    body: 'The conviction score. Users invest virtual IdeaCredits in YES/NO shares; price reflects crowd probability — separate from logical soundness.',
    footer: '$3.2M virtual volume / mo',
  },
  {
    heading: 'The Arbitrage',
    colorBar: 'var(--con)',
    body: 'When ReasonRank and Market Price diverge, profit lives in the gap. Buy YES on the undervalued; buy NO on the overhyped.',
    footer: `${beliefs.filter(b => Math.abs(b.reasonRank - b.marketPrice) >= 10).length} open opportunities`,
  },
];

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-[1280px] mx-auto px-6 py-[72px]">
          <h1 className="m-0 text-[56px] font-bold tracking-[-0.025em] leading-[1.05]">
            The architecture of reason.
          </h1>
          <p className="mt-3 mb-6 text-xl text-[var(--muted-foreground)]">
            Computational Epistemology Platform
          </p>
          <p className="text-[17px] leading-[1.7] max-w-[720px] mb-3">
            Every claim is a bet on reality. It says: "If we believe X, we'll get outcome Y."
            But unlike every other bet humans make,{' '}
            <strong>we're not allowed to check the math</strong>.
          </p>
          <p className="text-[17px] leading-[1.7] max-w-[720px] mb-7">
            Idea Stock Exchange turns each belief into something you can{' '}
            <strong>test, argue about, and improve</strong> — and lets you trade on the gap
            between logic and crowd.
          </p>
          <div className="flex gap-3">
            <Link href="/beliefs" className="inline-block px-[22px] py-3 rounded-lg bg-[var(--accent)] text-white font-medium text-[15px] no-underline hover:bg-[var(--accent-hover)] transition-colors">
              Browse Beliefs
            </Link>
            <Link href="/arbitrage" className="inline-block px-[22px] py-3 rounded-lg bg-transparent text-[var(--foreground)] border border-[var(--border)] font-medium text-[15px] no-underline hover:border-[var(--accent)] transition-colors">
              View Arbitrage
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-[1280px] mx-auto px-6 py-12">

        {/* ── Three Pillars ─────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-[28px] font-bold tracking-tight m-0 mb-5">The Three Pillars</h2>
          <div className="flex gap-4">
            {PILLARS.map(p => (
              <div key={p.heading} className="flex-1 p-5 border border-[var(--border)] rounded-lg bg-white flex flex-col gap-2.5">
                <div className="h-[3px] w-7 rounded-full" style={{ background: p.colorBar }} />
                <h3 className="m-0 text-lg font-bold">{p.heading}</h3>
                <p className="m-0 text-sm text-[#525252] leading-relaxed">{p.body}</p>
                <div className="mt-auto pt-3 border-t border-[var(--muted)] font-mono text-xs text-[var(--muted-foreground)]">
                  {p.footer}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Belief Page Features ──────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-[28px] font-bold tracking-tight m-0 mb-2">The Belief Page: A Diagnostic Panel</h2>
          <p className="text-base text-[var(--muted-foreground)] max-w-[720px] leading-relaxed m-0 mb-5">
            Each belief gets one permanent, canonical page. Not a text dump — a verification dashboard.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {FEATURE_CARDS.map(c => (
              <Link
                key={c.title}
                href={c.href}
                className="card-hover block p-4 border border-[var(--border)] rounded-lg bg-white no-underline"
              >
                <h3 className="m-0 text-base font-semibold text-[var(--foreground)]">{c.title}</h3>
                <p className="m-0 mt-1.5 text-[13px] text-[var(--muted-foreground)] leading-[1.5]">{c.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="text-center rounded-xl px-6 py-14" style={{ background: 'linear-gradient(180deg, #eff6ff 0%, rgba(239,246,255,0.3) 100%)' }}>
          <h2 className="text-[28px] font-bold tracking-tight m-0 mb-2">
            The legal code stops being sacred when it becomes auditable.
          </h2>
          <p className="text-lg text-[var(--muted-foreground)] m-0 mb-7">Start debugging.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/debate-topics" className="inline-block px-[22px] py-3 rounded-lg bg-[var(--accent)] text-white font-medium text-[15px] no-underline hover:bg-[var(--accent-hover)] transition-colors">
              Browse Topics
            </Link>
            <Link href="/cba" className="inline-block px-[22px] py-3 rounded-lg bg-[var(--accent)] text-white font-medium text-[15px] no-underline hover:bg-[var(--accent-hover)] transition-colors">
              Cost-Benefit Analysis
            </Link>
            <Link href="/arbitrage" className="inline-block px-[22px] py-3 rounded-lg bg-transparent text-[var(--foreground)] border border-[var(--border)] font-medium text-[15px] no-underline hover:border-[var(--accent)] transition-colors">
              Arbitrage Dashboard
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
