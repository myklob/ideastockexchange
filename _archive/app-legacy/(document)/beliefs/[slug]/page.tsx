import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBelief, beliefs } from '@/lib/data'
import { SpectrumsHeader } from '@/components/belief/SpectrumsHeader'
import { ScoreDashboard } from '@/components/belief/ScoreDashboard'
import { ProConTable } from '@/components/belief/ProConTable'
import { EvidenceLedger } from '@/components/belief/EvidenceLedger'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Callout } from '@/components/ui/Callout'
import TradeButton from './TradeButton'

export function generateStaticParams() {
  return beliefs.map(b => ({ slug: b.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const b = getBelief(params.slug)
  return { title: b ? `${b.statement.slice(0, 60)} — ISE` : 'Belief — ISE' }
}

export default function BeliefPage({ params }: { params: { slug: string } }) {
  const belief = getBelief(params.slug)
  if (!belief) notFound()

  return (
    <div className="max-w-[960px] mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="text-xs text-[var(--muted-foreground)] font-mono mb-4 flex items-center gap-1">
        <Link href="/" className="text-[var(--muted-foreground)] no-underline hover:text-[var(--foreground)] transition-colors uppercase">Home</Link>
        <span className="opacity-40">/</span>
        <Link href="/beliefs" className="text-[var(--muted-foreground)] no-underline hover:text-[var(--foreground)] transition-colors uppercase">Beliefs</Link>
        <span className="opacity-40">/</span>
        <span className="text-[var(--foreground)] uppercase">{belief.slug}</span>
      </div>

      <h1 className="text-[38px] font-bold m-0 mb-2 tracking-[-0.02em] leading-[1.15]">
        {belief.statement}
      </h1>
      <p className="text-sm text-[var(--muted-foreground)] m-0 mb-6">
        Last evaluated {belief.lastEvaluated} · {belief.argCount} sub-arguments · {belief.contributors} contributors
      </p>

      <SpectrumsHeader
        positivity={belief.spectrums.positivity}
        specificity={belief.spectrums.specificity}
        claimStrength={belief.spectrums.claimStrength}
      />

      <div className="flex justify-between items-start mb-4">
        <SectionHeading emoji="📊" title="Live Score" subtitle="The arbitrage opportunity between logic and market." />
        <TradeButton belief={{ slug: belief.slug, statement: belief.statement, reasonRank: belief.reasonRank, marketPrice: belief.marketPrice }} />
      </div>
      <ScoreDashboard
        reasonRank={belief.reasonRank}
        marketPrice={belief.marketPrice}
        volume={belief.volume}
      />

      <div className="h-8" />

      <SectionHeading
        emoji="🔍"
        title="Argument Trees"
        subtitle="Each reason is a belief with its own page. Scoring is recursive based on truth, linkage, and importance."
      />
      <ProConTable proArgs={belief.proArgs} conArgs={belief.conArgs} />

      <div className="h-8" />

      <SectionHeading
        emoji="⚖️"
        title="The Evidence Ledger"
        subtitle="Weighing the raw data. Quality scores based on methodology, sample size, and reproducibility."
      />
      <EvidenceLedger evidence={belief.evidence} />

      <div className="h-6" />
      <Callout tone="warn" title="Why this matters:">
        A claim supported by a criterion scoring 92% carries far more evidential weight than one supported by a
        criterion scoring 15% — regardless of how confidently either claim is stated.
      </Callout>
    </div>
  )
}
