import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Algorithms & Scores — Idea Stock Exchange',
  description:
    'Index of every scoring algorithm that powers belief pages on the Idea Stock Exchange — Truth, Linkage, Importance, Evidence, Confidence Stability, Media, Topic Overlap, Equivalency, and the recursive ReasonRank propagation that ties them together.',
}

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <strong>Algorithms &amp; Scores</strong>
    </p>
  )
}

function Card({
  title,
  href,
  blurb,
}: {
  title: string
  href: string
  blurb: React.ReactNode
}) {
  return (
    <li className="border border-gray-200 rounded p-4 hover:border-[#3366cc] transition-colors">
      <Link href={href} className="text-blue-700 hover:underline font-bold text-lg block mb-1">
        {title}
      </Link>
      <p className="text-sm text-gray-700">{blurb}</p>
    </li>
  )
}

function Section({
  title,
  intro,
  children,
}: {
  title: string
  intro: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-sm text-gray-700 mb-4">{intro}</p>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-none p-0">{children}</ul>
    </section>
  )
}

export default function AlgorithmsIndexPage() {
  return (
    <main className="max-w-[960px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-3 leading-tight">Algorithms &amp; Scores</h1>
      <p className="mb-6 text-[1.05rem]">
        Every score on a belief page is the output of a specific, inspectable algorithm. Nothing
        is a black box. This index lists each algorithm, what it measures, and how it composes
        into the single ReasonRank truth score that ranks claims across the platform.
      </p>

      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r mb-8">
        <p className="text-sm">
          <strong>How to read this page.</strong> Fundamental scores measure argument quality
          directly. Administrative scores prevent gaming, repetition, and source confusion from
          inflating the fundamental scores. Subsystem-specific scores apply to dedicated features
          like Cost-Benefit Analysis. The architecture pages at the bottom explain the recursion
          that ties everything together.
        </p>
      </div>

      <Section
        title="Fundamental Scores"
        intro="The core dimensions of argument quality. Every belief page surfaces these directly."
      >
        <Card
          title="Truth Scores"
          href="/algorithms/truth-scores"
          blurb="Combines Logical Validity (do the arguments hold?) with Verification (do the underlying facts check out?). The headline number on every belief page."
        />
        <Card
          title="Logical Validity"
          href="/algorithms/logical-validity"
          blurb="Fallacy detection and structural soundness. Penalizes arguments whose form is broken even if the content sounds plausible."
        />
        <Card
          title="Verification"
          href="/algorithms/verification"
          blurb="Empirical fact-checking against EVS-weighted evidence. Asks whether the claims can be replicated by independent sources."
        />
        <Card
          title="Linkage Scores"
          href="/algorithms/linkage-scores"
          blurb="How well evidence actually supports the conclusion it is offered for. Catches the mountain of true-but-irrelevant arguments."
        />
        <Card
          title="Importance Scores"
          href="/algorithms/importance-scores"
          blurb="Decisive, significant, moderate, minor, or negligible. Prevents many small correct points from drowning out a single decisive one."
        />
        <Card
          title="Evidence Scores"
          href="/algorithms/evidence-scores"
          blurb="The EVS formula: ESIW × log₂(ERQ + 1) × ECRS × ERP. T1 peer-review through T4 social media."
        />
        <Card
          title="Objective Criteria"
          href="/algorithms/objective-criteria"
          blurb="Validity × Reliability × Independence × Linkage of any benchmark proposed as a yardstick for the belief."
        />
        <Card
          title="Confidence Stability"
          href="/algorithms/confidence-stability"
          blurb="argFactor × dominanceRatio. Robust, established, developing, or fragile — how much new arguments still move the score."
        />
      </Section>

      <Section
        title="Administrative Scores"
        intro="Scores that protect the integrity of the fundamental scores. Without them, the same claim repeated many times would inflate a score, and an editorial could carry the weight of a peer-reviewed study."
      >
        <Card
          title="Media Truth"
          href="/algorithms/media-truth"
          blurb="Editorializing, sensationalism, and misleading-framing flags applied to media sources cited as evidence."
        />
        <Card
          title="Media Genre & Style"
          href="/algorithms/media-genre-style"
          blurb="Maps each source from peer-reviewed at the top to social-media at the bottom, parallel to evidence tiers T1–T4."
        />
        <Card
          title="Topic Overlap"
          href="/algorithms/topic-overlap"
          blurb="Token-overlap deduplication that prevents repetition from inflating scores. Also powers the Related Pages module."
        />
        <Card
          title="Belief Equivalency"
          href="/algorithms/belief-equivalency"
          blurb="Detects when two differently-worded beliefs are the same underlying claim, so the platform can merge debates instead of running them in parallel."
        />
      </Section>

      <Section
        title="Subsystem-Specific Scores"
        intro="Scores that apply to dedicated features rather than every belief page."
      >
        <Card
          title="Cost-Benefit Likelihood"
          href="/algorithms/cba-likelihood"
          blurb="pro_total / (pro_total + con_total) over the argument trees beneath each projected cost or benefit. Drives expected-value calculations."
        />
        <Card
          title="Combine Similar Beliefs"
          href="/algorithms/combine-similar-beliefs"
          blurb="The pipeline that unifies near-duplicate beliefs into a single canonical page after equivalency review."
        />
      </Section>

      <Section
        title="Architecture & Composition"
        intro="How the individual scores combine into the headline ReasonRank number — and how strength, recursion, and PageRank ancestry shape the result."
      >
        <Card
          title="ReasonRank"
          href="/algorithms/reason-rank"
          blurb="The umbrella algorithm. PageRank-style recursive propagation, but with two channels (pro and con) that subtract."
        />
        <Card
          title="Sub-Argument Aggregation"
          href="/algorithms/sub-argument-aggregation"
          blurb="impactScore = sign × childTruth × |linkage| × importance × 100. The math that lets a child belief's score flow up to its parent."
        />
        <Card
          title="Strong-to-Weak Spectrum"
          href="/algorithms/strong-to-weak"
          blurb="Burden-of-proof scaler. Extreme phrasings of a claim must produce proportionally stronger evidence to land the same adjusted score."
        />
        <Card
          title="ReasonRank vs. PageRank"
          href="/algorithms/reason-rank-vs-pagerank"
          blurb="A direct side-by-side: where the two algorithms agree, where they diverge, and why the divergences matter for evaluating ideas."
        />
      </Section>

      <hr className="my-8 border-gray-300" />

      <div className="bg-[#f9f9f9] border border-gray-200 rounded p-4 text-sm text-gray-700">
        <p className="mb-2">
          <strong>For developers.</strong> Every algorithm above is implemented in{' '}
          <code className="bg-white border border-gray-200 px-1 rounded">src/core/scoring/</code>{' '}
          and called from{' '}
          <code className="bg-white border border-gray-200 px-1 rounded">
            computeBeliefScores()
          </code>{' '}
          in <code className="bg-white border border-gray-200 px-1 rounded">
            src/features/belief-analysis/data/fetch-belief.ts
          </code>
          . The explainer pages here are kept in sync with that code so the formulas you read
          here are the formulas that run.
        </p>
      </div>
    </main>
  )
}
