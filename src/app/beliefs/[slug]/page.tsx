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
import ImpactSection from '@/features/belief-analysis/components/ImpactSection'
import CompromisesSection from '@/features/belief-analysis/components/CompromisesSection'
import ObstaclesSection from '@/features/belief-analysis/components/ObstaclesSection'
import BiasesSection from '@/features/belief-analysis/components/BiasesSection'
import MediaSection from '@/features/belief-analysis/components/MediaSection'
import LegalSection from '@/features/belief-analysis/components/LegalSection'
import BeliefMappingSection from '@/features/belief-analysis/components/BeliefMappingSection'
import SimilarBeliefsSection from '@/features/belief-analysis/components/SimilarBeliefsSection'
import ContributeSection from '@/features/belief-analysis/components/ContributeSection'

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
        {/* Header */}
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4 leading-tight">
          Belief: {belief.statement}
        </h1>

        {/* Meta info box */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
          <div className="text-right space-y-1">
            <p className="text-sm">
              <Link href="/One%20Page%20Per%20Topic" className="text-[var(--accent)] hover:underline">Topic</Link>:{' '}
              {belief.category || 'Uncategorized'}
              {belief.subcategory && <> &gt; {belief.subcategory}</>}
            </p>
            {belief.deweyNumber && (
              <p className="text-sm">Topic IDs: Dewey: {belief.deweyNumber}</p>
            )}
            <p className="text-sm">
              Belief{' '}
              <Link href="/beliefs%20grouped%20and%20eventually%20sorted%20along%20the%20the%20positivity%20continuum" className="text-[var(--accent)] hover:underline">
                Positivity
              </Link>{' '}
              Towards Topic: <strong>{belief.positivity >= 0 ? '+' : ''}{belief.positivity.toFixed(0)}%</strong>
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              Each section builds a complete analysis from multiple angles.{' '}
              <a
                href="https://github.com/myklob/ideastockexchange"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                View the full technical documentation on GitHub
              </a>.
            </p>
          </div>
        </div>

        {/* All analysis sections */}
        <div className="space-y-12">
          {/* 1. Argument Trees */}
          <ArgumentTreesSection
            arguments={belief.arguments}
            totalPro={scores.totalPro}
            totalCon={scores.totalCon}
          />

          <hr className="border-gray-200" />

          {/* 2. Evidence */}
          <EvidenceSection
            evidence={belief.evidence}
            totalSupporting={scores.totalSupportingEvidence}
            totalWeakening={scores.totalWeakeningEvidence}
          />

          <hr className="border-gray-200" />

          {/* 3. Objective Criteria */}
          <ObjectiveCriteriaSection criteria={belief.objectiveCriteria} />

          <hr className="border-gray-200" />

          {/* 4. Core Values Conflict */}
          <ValuesSection values={belief.valuesAnalysis} />

          <hr className="border-gray-200" />

          {/* Conflict Resolution Framework */}
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              <Link href="/automate%20conflict%20resolution" className="text-[var(--accent)] hover:underline">
                Conflict Resolution
              </Link>{' '}
              Framework
            </h1>

            <div className="space-y-10">
              {/* 5. Interests & Motivations */}
              <InterestsSection interests={belief.interestsAnalysis} />

              {/* 6. Foundational Assumptions */}
              <AssumptionsSection assumptions={belief.assumptions} />

              {/* 7. Cost-Benefit Analysis */}
              <CostBenefitSection cba={belief.costBenefitAnalysis} />

              {/* 8. Short vs Long-Term Impacts */}
              <ImpactSection impact={belief.impactAnalysis} />

              {/* 9. Compromise Solutions */}
              <CompromisesSection compromises={belief.compromises} />

              {/* 10. Obstacles to Resolution */}
              <ObstaclesSection obstacles={belief.obstacles} />

              {/* 11. Biases */}
              <BiasesSection biases={belief.biases} />
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* 12. Media Resources */}
          <MediaSection media={belief.mediaResources} />

          <hr className="border-gray-200" />

          {/* 13. Legal Framework */}
          <LegalSection legal={belief.legalEntries} />

          <hr className="border-gray-200" />

          {/* 14. General to Specific Belief Mapping */}
          <BeliefMappingSection
            upstreamMappings={belief.upstreamMappings}
            downstreamMappings={belief.downstreamMappings}
          />

          {/* 15. Similar Beliefs */}
          <SimilarBeliefsSection
            similarTo={belief.similarTo}
            similarFrom={belief.similarFrom}
            currentBeliefId={belief.id}
          />

          <hr className="border-gray-200" />

          {/* 16. Contribute */}
          <ContributeSection />

          {/* Overall Score */}
          <div className="text-right">
            <p className="text-lg font-bold">
              Score:{' '}
              <Link
                href="/Argument%20scores%20from%20sub-argument%20scores"
                className="text-[var(--accent)] hover:underline"
              >
                {scores.overallScore >= 0 ? '+' : ''}{scores.overallScore.toFixed(1)}
              </Link>
              {' '}
              <span className="text-sm font-normal text-[var(--muted-foreground)]">
                (based on argument scores)
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
