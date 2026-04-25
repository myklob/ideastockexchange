import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchBeliefBySlug, computeBeliefScores } from '@/features/belief-analysis/data/fetch-belief'
import ArgumentTreesSection from '@/features/belief-analysis/components/ArgumentTreesSection'
import EvidenceSection from '@/features/belief-analysis/components/EvidenceSection'
import ObjectiveCriteriaSection from '@/features/belief-analysis/components/ObjectiveCriteriaSection'
import ValuesSection from '@/features/belief-analysis/components/ValuesSection'
import InterestsSection from '@/features/belief-analysis/components/InterestsSection'
import AssumptionsSection from '@/features/belief-analysis/components/AssumptionsSection'
import CostBenefitSection from '@/features/belief-analysis/components/CostBenefitSection'
import CompromisesSection from '@/features/belief-analysis/components/CompromisesSection'
import ObstaclesSection from '@/features/belief-analysis/components/ObstaclesSection'
import BiasesSection from '@/features/belief-analysis/components/BiasesSection'
import LegalSection from '@/features/belief-analysis/components/LegalSection'
import BeliefMappingSection from '@/features/belief-analysis/components/BeliefMappingSection'
import SimilarBeliefsSection from '@/features/belief-analysis/components/SimilarBeliefsSection'
import ContributeSection from '@/features/belief-analysis/components/ContributeSection'
import DefinitionsSection from '@/features/belief-analysis/components/DefinitionsSection'

interface BeliefPageProps {
  params: Promise<{ slug: string }>
}

export default async function BeliefAnalysisPage({ params }: BeliefPageProps) {
  const { slug } = await params
  const belief = await fetchBeliefBySlug(decodeURIComponent(slug))

  if (!belief) {
    notFound()
  }

  const scores = computeBeliefScores(belief)
  const proPart = scores.totalPro.toFixed(1)
  const conPart = scores.totalCon.toFixed(1)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <Link href="/beliefs" className="text-sm text-[var(--accent)] hover:underline">Beliefs</Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <span className="text-sm text-[var(--muted-foreground)] truncate max-w-[300px]">{belief.statement}</span>
          </div>
          <Link
            href={`/api/beliefs/${belief.id}`}
            className="text-xs font-mono text-[var(--muted-foreground)] hover:text-[var(--accent)] border border-[var(--border)] px-2 py-1 rounded"
          >
            View JSON
          </Link>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        {/*
          Header per the canonical template (docs/BELIEF_PAGE_RULES.md):
            - Belief statement
            - Score (pro/con from sub-arguments) + Topic line
            - Then straight to Argument Trees. NO summary/background/hook (Rule 2).
        */}
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3 leading-tight">
          {belief.statement}
        </h1>
        <p className="text-sm mb-8 leading-7">
          <strong>Score:</strong>{' '}
          <Link
            href="/Argument%20scores%20from%20sub-argument%20scores"
            className="text-[var(--accent)] hover:underline"
          >
            +{proPart} pro / -{conPart} con
          </Link>{' '}
          <span className="text-xs text-[var(--muted-foreground)]">
            (computed from sub-argument scores)
          </span>
          <br />
          <strong>Topic:</strong>{' '}
          <Link href="/One%20Page%20Per%20Topic" className="text-[var(--accent)] hover:underline">
            {belief.category || 'Uncategorized'}
          </Link>
          {belief.subcategory && <> &gt; {belief.subcategory}</>}
        </p>

        {/*
          Section order is CANONICAL per docs/BELIEF_PAGE_RULES.md.
          Definitions live LAST, never first (Rule 1). No background/summary section
          between the metadata and the Argument Trees (Rule 2). Do not reorder
          without updating the canonical rules doc.

          Removed (intentionally) from the page per the new template:
            - Standalone Falsifiability Test section (folded into Objective Criteria thresholds)
            - Standalone Testable Predictions section (express predictions as objective criteria)
            - Standalone Media Resources section (visual/video items live in the Evidence Ledger)
            - Standalone Short vs. Long-Term Impact section (now a sub-table inside CBA)
        */}
        <div className="space-y-12">
          {/* 1. Argument Trees */}
          <ArgumentTreesSection
            arguments={belief.arguments}
            totalPro={scores.totalPro}
            totalCon={scores.totalCon}
          />

          <hr className="border-gray-200" />

          {/* 2. Evidence Ledger (text/data + visual/video) */}
          <EvidenceSection
            evidence={belief.evidence}
            totalSupporting={scores.totalSupportingEvidence}
            totalWeakening={scores.totalWeakeningEvidence}
            media={belief.mediaResources}
          />

          <hr className="border-gray-200" />

          {/* 3. Values Conflict Analysis (4 sub-tables) */}
          <ValuesSection values={belief.valuesAnalysis} />

          <hr className="border-gray-200" />

          {/* 4. Interests and Motivations (3 sub-tables) */}
          <InterestsSection interests={belief.interestsAnalysis} />

          <hr className="border-gray-200" />

          {/* 5. Foundational Assumptions */}
          <AssumptionsSection assumptions={belief.assumptions} />

          <hr className="border-gray-200" />

          {/* 6. Objective Criteria (Criterion / Current Status / Threshold for Agreement) */}
          <ObjectiveCriteriaSection criteria={belief.objectiveCriteria} />

          <hr className="border-gray-200" />

          {/* 7. Cost-Benefit Analysis (Benefits/Costs + Short-Term vs Long-Term sub-table) */}
          <CostBenefitSection cba={belief.costBenefitAnalysis} impact={belief.impactAnalysis} />

          <hr className="border-gray-200" />

          {/* 8. Resolution: Compromise + Obstacles, then Biases */}
          <section className="space-y-8">
            <CompromisesSection compromises={belief.compromises} />
            <ObstaclesSection obstacles={belief.obstacles} />
            <BiasesSection biases={belief.biases} />
          </section>

          <hr className="border-gray-200" />

          {/* 9. Belief Mapping (Upstream / Downstream / Similar) */}
          <BeliefMappingSection
            upstreamMappings={belief.upstreamMappings}
            downstreamMappings={belief.downstreamMappings}
          />
          <SimilarBeliefsSection
            similarTo={belief.similarTo}
            similarFrom={belief.similarFrom}
            currentBeliefId={belief.id}
          />

          <hr className="border-gray-200" />

          {/* 10. Legal Framework */}
          <LegalSection legal={belief.legalEntries} />

          <hr className="border-gray-200" />

          {/* 11. Definitions and Scoring Concepts — LAST before footer (Rule 1) */}
          <DefinitionsSection definitions={belief.definitions} />

          <hr className="border-gray-200" />

          {/* 12. Contribute / footer */}
          <ContributeSection />
        </div>
      </main>
    </div>
  )
}
