import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ReasonRank — Idea Stock Exchange',
  description:
    'ReasonRank applies PageRank-style logic to arguments. Each idea earns its score from the quality of reasons supporting it — Truth, Linkage, Importance, Evidence, Objective Criteria, and Confidence Stability — minus the reasons against.',
}

const WIKI = 'https://myclob.pbworks.com'

// ─── Sub-components ─────────────────────────────────────────────────────────

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>ReasonRank</strong>
    </p>
  )
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-700 hover:underline"
    >
      {children}
    </a>
  )
}

function ScoreItem({
  name,
  href,
  external,
  children,
}: {
  name: string
  href: string
  external?: boolean
  children: React.ReactNode
}) {
  return (
    <li className="mb-3">
      <strong>
        {external ? (
          <ExternalLink href={href}>{name}</ExternalLink>
        ) : (
          <Link href={href} className="text-blue-700 hover:underline">{name}</Link>
        )}
      </strong>{' '}
      {children}
    </li>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ReasonRankPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight border-b-2 border-gray-200 pb-3">
        ReasonRank: Algorithms and the Promotion of Good Ideas
      </h1>

      <p className="mb-3">
        Google solved one of the hardest problems in human history: too much information, not
        enough signal. Before PageRank, the internet was a shouting match. After PageRank, the
        best pages rose to the top based on who linked to them and why.
      </p>

      <p className="mb-3">
        We have the same problem with ideas. The internet hasn&apos;t given us better thinking.
        It&apos;s given us louder thinking. Viral beats valid. Confident beats correct. The most
        emotionally satisfying argument wins, not the best-supported one.
      </p>

      <p className="mb-6">
        <strong>ReasonRank changes that.</strong> It applies the same logic as PageRank, but to
        arguments instead of web pages. Just as a page earns authority from the quality of links
        pointing to it, an idea earns its score from the quality of reasons supporting it.
      </p>

      <hr className="my-8 border-gray-300" />

      {/* ── How it works ────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">How the Scoring System Works</h2>

      <p className="mb-3">
        Every argument is a node in a graph. Pro and con sub-arguments hang off it. Each
        sub-argument has its own pro and con sub-arguments. The score of any node is computed
        from the scores of its children, weighted by how relevant they are and how much they
        should matter. When a foundational premise weakens, every conclusion built on it weakens
        automatically. This is the same recursive trick PageRank uses, except where PageRank
        only counts positive links, ReasonRank counts both supporting and opposing evidence and
        subtracts one from the other. See{' '}
        <ExternalLink href={`${WIKI}/w/page/159333015/Argument%20scores%20from%20sub-argument%20scores`}>
          Argument Scores from Sub-Argument Scores
        </ExternalLink>{' '}
        for the recursion in detail.
      </p>

      <p className="mb-6">
        The single number that comes out the top of the tree is not pulled from nowhere. It
        synthesizes a stack of interdependent scores, each measuring a different dimension of an
        argument&apos;s quality. Think of them as successive filters that a claim has to pass
        through before it earns weight in the final ledger.
      </p>

      {/* ── Fundamental Scores ───────────────────────────────────── */}
      <h3 className="text-xl font-bold mb-2">Fundamental Scores</h3>
      <p className="mb-3">
        These measure the quality of the argument and its evidence directly.
      </p>

      <ul className="list-disc list-outside ml-6 mb-6">
        <ScoreItem
          name="Truth Scores"
          href={`${WIKI}/w/page/159300627/Truth%20Scores`}
          external
        >
          are the foundation. They combine two independent checks: whether the logic holds
          (
          <ExternalLink href={`${WIKI}/w/page/159235779/Logical%20Validity`}>
            Logical Validity
          </ExternalLink>
          ) and whether the facts check out (
          <ExternalLink href={`${WIKI}/w/page/159301425/Verification%20Truth%20Score`}>
            Verification
          </ExternalLink>
          ). An argument can fail on either count, and the system catches both.
        </ScoreItem>

        <ScoreItem name="Linkage Scores" href="/algorithms/linkage-scores">
          test the connection between evidence and conclusion. A lot of bad reasoning fails
          here: the facts are real, but they don&apos;t actually prove what the arguer claims.
          Linkage asks whether the evidence supports this specific conclusion or just points in
          the same general direction.
        </ScoreItem>

        <ScoreItem
          name="Importance Scores"
          href={`${WIKI}/importance%20score`}
          external
        >
          separate truth from relevance. Not every true statement matters equally to a given
          conclusion. Without this filter, a mountain of minor correct points can bury one
          decisive counterargument simply by outnumbering it.
        </ScoreItem>

        <ScoreItem
          name="Evidence Scores"
          href={`${WIKI}/w/page/159353568/Evidence%20Scores`}
          external
        >
          evaluate the source material itself. A peer-reviewed meta-analysis and a confident
          tweet are not equally reliable, and the system treats them accordingly using a tiered
          quality framework (T1 through T4).
        </ScoreItem>

        <ScoreItem name="Objective Criteria Scores" href="/algorithms/objective-criteria">
          measure performance against standards that do not depend on values or ideology:
          measurable benchmarks that both sides of a debate can agree to in advance.
        </ScoreItem>

        <ScoreItem
          name="Confidence Stability Scores"
          href={`${WIKI}/w/page/163357458/Confidence%20Stability%20Scores`}
          external
        >
          track how settled a score is as new arguments arrive. A high score that has been
          stable under sustained scrutiny means something different from one that bounces
          around every time a new argument enters. Stability is itself evidence of robustness.
        </ScoreItem>
      </ul>

      {/* ── Administrative Scores ────────────────────────────────── */}
      <h3 className="text-xl font-bold mb-2">Administrative Scores</h3>
      <p className="mb-3">
        These do not measure argument quality directly. They prevent the gaming, repetition,
        and source confusion that would otherwise inflate the fundamental scores above. Without
        them, the same point dressed up ten different ways would count as ten different points,
        and an editorial styled like a study would carry the same weight as the study.
      </p>

      <ul className="list-disc list-outside ml-6 mb-6">
        <ScoreItem
          name="Media Truth Scores"
          href={`${WIKI}/w/page/162409713/Media%20Truth%20Score`}
          external
        >
          and{' '}
          <strong>
            <ExternalLink href={`${WIKI}/w/page/162410988/Media%20Genre%20and%20Style%20Scores%3A`}>
              Media Genre and Style Scores
            </ExternalLink>
          </strong>{' '}
          flag when a source is editorializing, sensationalizing, or misleading, even when the
          underlying facts are technically accurate. Genre carries information about
          reliability that raw fact-checking misses.
        </ScoreItem>

        <ScoreItem
          name="Topic Overlap Scores"
          href={`${WIKI}/w/page/162854901/topic_overlap_scores`}
          external
        >
          prevent the same basic point from inflating a score just because ten people said it
          slightly differently. Repetition is not confirmation. This filter also powers the
          &ldquo;Related Pages&rdquo; feature, surfacing the highest-scoring pages on adjacent
          topics.
        </ScoreItem>

        <ScoreItem name="Belief Equivalency Scores" href="/algorithms/belief-equivalency">
          identify when two differently-worded beliefs are making the same underlying claim, so
          the platform can link them and surface the better-argued version rather than running
          parallel redundant debates.
        </ScoreItem>
      </ul>

      {/* ── Subsystem-Specific Scores ────────────────────────────── */}
      <h3 className="text-xl font-bold mb-2">Subsystem-Specific Scores</h3>

      <ul className="list-disc list-outside ml-6 mb-6">
        <ScoreItem
          name="Cost or Benefit Likelihood Scores"
          href={`${WIKI}/Cost%20or%20Benefit%20Likelihood%20Scores`}
          external
        >
          apply to the{' '}
          <Link href="/cba/about" className="text-blue-700 hover:underline">
            Automated Cost-Benefit Analysis
          </Link>{' '}
          subsystem. They calculate the probability that a projected cost or benefit will
          actually occur, derived from the strength of the argument trees debating it rather
          than from a single analyst&apos;s estimate.
        </ScoreItem>
      </ul>

      <hr className="my-8 border-gray-300" />

      {/* ── Why this is different ───────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Why This Is Different From a Better Forum</h2>

      <p className="mb-3">
        Most online debate tools optimize for engagement. ReasonRank optimizes for accuracy.
        The difference is that engagement rewards emotional resonance and tribal confirmation,
        while accuracy rewards arguments that survive scrutiny from people who disagree with
        you.
      </p>

      <p className="mb-3">
        Misinformation does not have to be banned or suppressed in this system. It just loses,
        on the merits, in public, where everyone can see exactly which arguments failed and
        why. A claim built on a debunked study, irrelevant evidence, and a logical fallacy
        accumulates three separate score penalties and sinks accordingly: one against its{' '}
        <ExternalLink href={`${WIKI}/w/page/159353568/Evidence%20Scores`}>
          Evidence Score
        </ExternalLink>
        , one against its{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
          Linkage Score
        </Link>
        , and one against its{' '}
        <ExternalLink href={`${WIKI}/w/page/159235779/Logical%20Validity`}>
          Logical Validity
        </ExternalLink>
        . The reasoning is visible. Anyone can challenge the scoring. No black box.
      </p>

      <p className="mb-6">
        That is the infrastructure missing from every political debate, policy discussion, and
        public controversy right now: not a smarter moderator, but a shared system for asking{' '}
        <em>whose arguments are actually better-supported</em> and showing the math.
      </p>

      <hr className="my-8 border-gray-300" />

      {/* ── Explore further ─────────────────────────────────────── */}
      <div className="bg-[#e6f3ff] border-l-4 border-[#0066cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Explore further:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <ExternalLink href={`${WIKI}/Reason%20Rank%20vs%20PageRank`}>
              ReasonRank vs. PageRank: A Direct Comparison
            </ExternalLink>
          </li>
          <li>
            <ExternalLink
              href={`${WIKI}/w/page/159333015/Argument%20scores%20from%20sub-argument%20scores`}
            >
              How Sub-Argument Scores feed upward
            </ExternalLink>
          </li>
          <li>
            <Link href="/algorithms" className="text-blue-700 hover:underline">
              Full Algorithms overview
            </Link>
          </li>
          <li>
            <Link href="/cba/about" className="text-blue-700 hover:underline">
              Automated Cost-Benefit Analysis
            </Link>
          </li>
        </ul>
      </div>
    </main>
  )
}
