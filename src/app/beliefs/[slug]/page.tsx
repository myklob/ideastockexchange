import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchBeliefBySlug, computeBeliefScores } from '@/features/belief-analysis/data/fetch-belief'
import ScorecardSection from '@/features/belief-analysis/components/ScorecardSection'
import ArgumentTreesSection from '@/features/belief-analysis/components/ArgumentTreesSection'
import EvidenceSection from '@/features/belief-analysis/components/EvidenceSection'
import ConflictResolutionSection from '@/features/belief-analysis/components/ConflictResolutionSection'
import ObjectiveCriteriaSection from '@/features/belief-analysis/components/ObjectiveCriteriaSection'
import FalsifiabilityTestSection from '@/features/belief-analysis/components/FalsifiabilityTestSection'
import AssumptionsSection from '@/features/belief-analysis/components/AssumptionsSection'
import CostBenefitSection from '@/features/belief-analysis/components/CostBenefitSection'
import BiasesSection from '@/features/belief-analysis/components/BiasesSection'
import MediaResourcesSection from '@/features/belief-analysis/components/MediaResourcesSection'
import LegalSection from '@/features/belief-analysis/components/LegalSection'
import BeliefMappingSection from '@/features/belief-analysis/components/BeliefMappingSection'
import SimilarBeliefsSection from '@/features/belief-analysis/components/SimilarBeliefsSection'
import ContributeSection from '@/features/belief-analysis/components/ContributeSection'
import DefinitionsSection from '@/features/belief-analysis/components/DefinitionsSection'

interface BeliefPageProps {
  params: Promise<{ slug: string }>
}

/** Split a pipe- or newline-separated metadata list into trimmed, non-empty labels. */
function splitList(text: string | null): string[] {
  if (!text) return []
  return text
    .split(/[|\n]/)
    .map(s => s.trim())
    .filter(Boolean)
}

export default async function BeliefAnalysisPage({ params }: BeliefPageProps) {
  const { slug } = await params
  const belief = await fetchBeliefBySlug(decodeURIComponent(slug))

  if (!belief) {
    notFound()
  }

  const scores = computeBeliefScores(belief)
  const net = scores.totalPro - scores.totalCon
  const hasArgs = scores.totalPro > 0 || scores.totalCon > 0
  const netLabel = hasArgs ? `${net >= 0 ? '+' : ''}${net.toFixed(1)}` : 'To be calculated'

  const related = splitList(belief.relatedBeliefs)
  const supports = splitList(belief.supportsBeliefs)
  const category = belief.category || 'Uncategorized'

  return (
    <div className="min-h-screen bg-white">
      {/* App chrome */}
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

      <main className="max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]">
        {/* Breadcrumb (new template) */}
        <p className="text-right text-xs text-[var(--muted-foreground)] mb-2">
          <Link href="/" className="text-[var(--accent)] hover:underline">Home</Link> ›{' '}
          <Link href="/beliefs" className="text-[var(--accent)] hover:underline">Topics</Link> ›{' '}
          {category} › {belief.statement}
        </p>

        {/*
          Header per the new canonical template (docs/BELIEF_PAGE_RULES.md):
            Belief statement → metadata line (Topic / Dewey / Positivity / Net Belief
            Score / Related) → "Beliefs this supports" → straight to Argument Trees.
            NO summary/background/hook (Rule 2).
        */}
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2 leading-tight">
          Belief: {belief.statement}
        </h1>
        <p className="text-xs text-[var(--muted-foreground)] mb-3">
          <Link href="/beliefs" className="text-[var(--accent)] hover:underline">Topic</Link>:{' '}
          {category}
          {belief.subcategory && <> &gt; {belief.subcategory}</>}
          {belief.deweyNumber && <> · Dewey {belief.deweyNumber}</>}
          {' '}· Positivity {belief.positivity > 0 ? '+' : ''}{belief.positivity}%
          {' '}· Net Belief Score {netLabel}
          {related.length > 0 && (
            <> · Related: {related.join(' | ')}</>
          )}
        </p>
        {supports.length > 0 && (
          <p className="text-sm mb-6">
            <strong>🔗 Beliefs this supports:</strong> {supports.join(' | ')}
          </p>
        )}

        <div className="space-y-12">
          {/* 0. Scorecard — a readout of the top-scoring rows below, not a prose summary */}
          <ScorecardSection
            arguments={belief.arguments}
            totalPro={scores.totalPro}
            totalCon={scores.totalCon}
            bottomLine={belief.bottomLine ?? null}
            scoreMover={belief.scoreMover ?? null}
            falsifiabilityItems={belief.falsifiabilityItems ?? []}
          />

          <hr className="border-gray-200" />

          {/* 1. Argument Trees */}
          <ArgumentTreesSection
            arguments={belief.arguments}
            totalPro={scores.totalPro}
            totalCon={scores.totalCon}
            netInterpretation={belief.netInterpretation}
          />

          <hr className="border-gray-200" />

          {/* 2. Evidence Ledger */}
          <EvidenceSection evidence={belief.evidence} />

          <hr className="border-gray-200" />

          {/* 3. Conflict Resolution Framework (values rankings, interests, dispute types, obstacles) */}
          <ConflictResolutionSection
            values={belief.valuesAnalysis}
            interests={belief.interestsAnalysis}
            valueRankings={belief.valueRankings}
            interestEntries={belief.interestEntries}
            sharedInterests={belief.sharedInterests}
            disputeTypes={belief.disputeTypes}
            obstacles={belief.obstacles}
          />

          <hr className="border-gray-200" />

          {/* 4. Objective Criteria */}
          <ObjectiveCriteriaSection criteria={belief.objectiveCriteria} />

          <hr className="border-gray-200" />

          {/* 5. Falsifiability Test + Testable Predictions */}
          <FalsifiabilityTestSection
            items={belief.falsifiabilityItems ?? []}
            confirm={belief.falsifiabilityConfirm}
            falsify={belief.falsifiabilityFalsify}
            legacy={belief.falsifiability}
            predictions={belief.testablePredictions}
          />

          <hr className="border-gray-200" />

          {/* 6. Logical Anatomy & Foundational Assumptions */}
          <AssumptionsSection
            assumptions={belief.assumptions}
            componentClaims={belief.componentClaims ?? []}
            logicalForm={belief.logicalForm ?? null}
          />

          <hr className="border-gray-200" />

          {/* 7. Cost-Benefit Analysis (+ Short/Long-Term + Best Compromise Solutions) */}
          <CostBenefitSection
            cba={belief.costBenefitAnalysis}
            items={belief.costBenefitItems ?? []}
            impact={belief.impactAnalysis}
            impactEntries={belief.impactEntries ?? []}
            compromises={belief.compromises}
          />

          <hr className="border-gray-200" />

          {/* 8. Biases */}
          <BiasesSection biases={belief.biases} />

          <hr className="border-gray-200" />

          {/* 9. Media Resources */}
          <MediaResourcesSection media={belief.mediaResources} />

          <hr className="border-gray-200" />

          {/* 10. Legal Framework */}
          <LegalSection legal={belief.legalEntries} />

          <hr className="border-gray-200" />

          {/* 11. General to Specific Belief Mapping */}
          <BeliefMappingSection
            upstreamMappings={belief.upstreamMappings}
            downstreamMappings={belief.downstreamMappings}
          />

          <hr className="border-gray-200" />

          {/* 12. Similar Beliefs */}
          <SimilarBeliefsSection
            similarTo={belief.similarTo}
            similarFrom={belief.similarFrom}
            currentBeliefId={belief.id}
          />

          <hr className="border-gray-200" />

          {/* 13. Definitions — LAST before footer (Rule 1) */}
          <DefinitionsSection definitions={belief.definitions} />

          <hr className="border-gray-200" />

          {/* 14. Contribute / footer */}
          <ContributeSection />
        </div>
      </main>
    </div>
  )
}
