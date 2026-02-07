import { notFound } from 'next/navigation';
import Link from 'next/link';
import { exampleLaws } from '@/features/legal-framework/data/example-laws';
import { DiagnosticSection, SubSection, InfoBox, Badge, QualityBar } from '@/features/legal-framework/components/DiagnosticSection';
import { AssumptionCard } from '@/features/legal-framework/components/AssumptionCard';
import { EvidenceCard } from '@/features/legal-framework/components/EvidenceCard';

export async function generateStaticParams() {
  return exampleLaws.map((law) => ({
    id: law.id,
  }));
}

export default async function LawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const law = exampleLaws.find((l) => l.id === id);

  if (!law) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm text-[var(--accent)] hover:underline mb-4 inline-block">
            ← Back to wikiLaw
          </Link>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge>{law.jurisdiction}</Badge>
            <Badge>{law.category.replace(/_/g, ' ')}</Badge>
            <Badge variant={law.status === 'active' ? 'success' : 'warning'}>
              {law.status}
            </Badge>
          </div>

          <h1 className="text-4xl font-bold mb-2">{law.officialTitle}</h1>
          <p className="text-[var(--muted-foreground)] mb-4">{law.citationCode}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[var(--muted-foreground)]">Enacted:</span>{' '}
              <span>{law.enactedDate.toLocaleDateString()}</span>
            </div>
            {law.lastAmended && (
              <div>
                <span className="text-[var(--muted-foreground)]">Last Amended:</span>{' '}
                <span>{law.lastAmended.toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Plain-English Decode */}
        <DiagnosticSection title="Plain-English Decode">
          <SubSection title="What This Law Actually Does">
            <p className="text-lg leading-relaxed">{law.plainEnglishSummary}</p>
          </SubSection>

          <SubSection title="Real-World Impact">
            <p className="leading-relaxed">{law.realWorldImpact}</p>
          </SubSection>
        </DiagnosticSection>

        {/* Stated vs. Operative Purpose */}
        <DiagnosticSection
          title="Stated vs. Operative Purpose"
          severity={law.purposeGap ? 'warning' : 'info'}
        >
          <div className="grid md:grid-cols-2 gap-6">
            <InfoBox
              label="What the law claims to do"
              value={<p className="leading-relaxed">{law.statedPurpose}</p>}
            />
            <InfoBox
              label="What incentives it actually creates"
              value={<p className="leading-relaxed">{law.operativePurpose}</p>}
            />
          </div>

          {law.purposeGap && (
            <div className="mt-6 p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-[var(--warning)]">⚠</span> Purpose Gap Detected
              </h3>
              <p className="text-[var(--muted-foreground)] leading-relaxed">{law.purposeGap}</p>
            </div>
          )}
        </DiagnosticSection>

        {/* Operating Assumptions */}
        <DiagnosticSection title="Operating Assumptions: What Must Be True for This to Work">
          <p className="text-[var(--muted-foreground)] mb-6">
            Every law depends on beliefs about how reality works. Here are the core assumptions
            this law operationalizes:
          </p>

          {law.operatingAssumptions.map((assumption) => (
            <AssumptionCard key={assumption.id} assumption={assumption} />
          ))}
        </DiagnosticSection>

        {/* Evidence Audit */}
        <DiagnosticSection title="Evidence Audit: Does It Work?">
          <SubSection title="Effectiveness Assessment">
            <div className="mb-6">
              <h4 className="font-semibold mb-2">
                Does this law achieve its stated goal?
              </h4>
              <div className="flex items-center gap-4 mb-2">
                <QualityBar
                  score={law.evidenceAudit.achievesStatedGoal.confidence}
                  label="Confidence"
                />
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Verification method: {law.evidenceAudit.achievesStatedGoal.verificationMethod}
                {' | '}
                Consensus: {law.evidenceAudit.achievesStatedGoal.consensusLevel.replace(/_/g, ' ')}
              </p>
            </div>
          </SubSection>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <SubSection title="Arguments For Effectiveness">
              {law.evidenceAudit.effectiveness.pro.length > 0 ? (
                law.evidenceAudit.effectiveness.pro.map((evidence) => (
                  <EvidenceCard key={evidence.id} evidence={evidence} />
                ))
              ) : (
                <p className="text-[var(--muted-foreground)] italic">
                  No strong arguments for effectiveness documented.
                </p>
              )}
            </SubSection>

            <SubSection title="Arguments Against Effectiveness">
              {law.evidenceAudit.effectiveness.con.map((evidence) => (
                <EvidenceCard key={evidence.id} evidence={evidence} />
              ))}
            </SubSection>
          </div>

          {law.evidenceAudit.effectiveness.realWorldExamples.length > 0 && (
            <SubSection title="Real-World Examples">
              {law.evidenceAudit.effectiveness.realWorldExamples.map((example, idx) => (
                <div
                  key={idx}
                  className="border border-[var(--border)] rounded-lg p-4 mb-3 last:mb-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold">{example.jurisdiction}</span>
                    <Badge
                      variant={
                        example.outcome === 'positive'
                          ? 'success'
                          : example.outcome === 'negative'
                          ? 'critical'
                          : 'warning'
                      }
                    >
                      {example.outcome}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{example.description}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {example.source} ({example.date.getFullYear()})
                  </p>
                </div>
              ))}
            </SubSection>
          )}

          {law.evidenceAudit.unintendedConsequences.length > 0 && (
            <SubSection title="Unintended Consequences">
              {law.evidenceAudit.unintendedConsequences.map((consequence, idx) => {
                const severityVariant = {
                  minor: 'default' as const,
                  moderate: 'warning' as const,
                  major: 'warning' as const,
                  critical: 'critical' as const
                };

                return (
                  <div
                    key={idx}
                    className="border border-[var(--border)] rounded-lg p-4 mb-3 last:mb-0"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={severityVariant[consequence.severity]}>
                        {consequence.severity} severity
                      </Badge>
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {consequence.likelihood}% likelihood
                      </span>
                    </div>
                    <p className="font-medium mb-2">{consequence.description}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      <strong>Affected:</strong> {consequence.affectedPopulation}
                    </p>
                  </div>
                );
              })}
            </SubSection>
          )}
        </DiagnosticSection>

        {/* Justification Test */}
        <DiagnosticSection title="Justification Stress-Test">
          {law.justificationTest.constitutionalIssues.length > 0 && (
            <SubSection title="Constitutional Issues">
              {law.justificationTest.constitutionalIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="border border-[var(--border)] rounded-lg p-4 mb-3 last:mb-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold">{issue.provision}</span>
                    <Badge
                      variant={
                        issue.severity === 'clear_violation'
                          ? 'critical'
                          : issue.severity === 'likely'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {issue.severity.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{issue.conflict}</p>
                  {issue.precedent.length > 0 && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      <strong>Precedent:</strong> {issue.precedent.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </SubSection>
          )}

          <SubSection title="American Values Alignment">
            <div className="space-y-3">
              {law.justificationTest.valuesAlignment.map((alignment, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-3 border border-[var(--border)] rounded"
                >
                  <Badge
                    variant={
                      alignment.alignment === 'supports'
                        ? 'success'
                        : alignment.alignment === 'conflicts'
                        ? 'critical'
                        : 'default'
                    }
                  >
                    {alignment.alignment}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium mb-1">
                      {alignment.value.replace(/_/g, ' ')}
                      {alignment.importance === 'core' && (
                        <span className="text-xs text-[var(--muted-foreground)]"> (core value)</span>
                      )}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {alignment.reasoning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="Reversibility Test">
            <div
              className={`p-4 rounded-lg border ${
                law.justificationTest.reversibilityTest.survives
                  ? 'bg-[var(--success)]/10 border-[var(--success)]/30'
                  : 'bg-[var(--destructive)]/10 border-[var(--destructive)]/30'
              }`}
            >
              <p className="font-semibold mb-2">
                {law.justificationTest.reversibilityTest.survives
                  ? '✓ Survives reversibility test'
                  : '✗ Fails reversibility test'}
              </p>
              <p className="text-sm mb-3">{law.justificationTest.reversibilityTest.reasoning}</p>
              {law.justificationTest.reversibilityTest.vulnerabilities.length > 0 && (
                <>
                  <p className="text-sm font-medium mb-2">Vulnerabilities:</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {law.justificationTest.reversibilityTest.vulnerabilities.map((vuln, idx) => (
                      <li key={idx}>{vuln}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </SubSection>

          <SubSection title="Proportionality Assessment">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <InfoBox label="Harm Prevented" value={law.justificationTest.proportionality.harmPrevented} />
              <InfoBox label="Restriction Imposed" value={law.justificationTest.proportionality.restrictionImposed} />
            </div>
            <div
              className={`p-4 rounded-lg ${
                law.justificationTest.proportionality.isProportional
                  ? 'bg-[var(--success)]/10 border border-[var(--success)]/30'
                  : 'bg-[var(--warning)]/10 border border-[var(--warning)]/30'
              }`}
            >
              <p className="font-semibold mb-2">
                {law.justificationTest.proportionality.isProportional
                  ? '✓ Proportional'
                  : '⚠ Disproportionate'}
              </p>
              <p className="text-sm">{law.justificationTest.proportionality.reasoning}</p>
            </div>
          </SubSection>
        </DiagnosticSection>

        {/* Stakeholder Ledger */}
        <DiagnosticSection title="Stakeholder Ledger: Who Pays, Who Benefits">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <InfoBox
              label="Wealth Distribution"
              value={<Badge>{law.stakeholderLedger.wealthDistribution}</Badge>}
            />
            <InfoBox
              label="Benefit Concentration"
              value={<Badge>{law.stakeholderLedger.concentrationOfBenefit}</Badge>}
            />
            <InfoBox
              label="Cost Concentration"
              value={<Badge>{law.stakeholderLedger.concentrationOfCost}</Badge>}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <SubSection title="Winners">
              {law.stakeholderLedger.winners.map((stakeholder, idx) => (
                <StakeholderCard key={idx} stakeholder={stakeholder} type="winner" />
              ))}
            </SubSection>

            <SubSection title="Losers">
              {law.stakeholderLedger.losers.map((stakeholder, idx) => (
                <StakeholderCard key={idx} stakeholder={stakeholder} type="loser" />
              ))}
            </SubSection>

            <SubSection title="Silent Victims (Second-Order Effects)">
              {law.stakeholderLedger.silentVictims.map((stakeholder, idx) => (
                <StakeholderCard key={idx} stakeholder={stakeholder} type="silent" />
              ))}
            </SubSection>
          </div>
        </DiagnosticSection>

        {/* Implementation Tracker */}
        <DiagnosticSection title="Implementation Tracker: Statute vs. Reality">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <InfoBox
              label="Budget Allocated"
              value={`$${law.implementationTracker.budgetAllocated.toLocaleString()}`}
            />
            <InfoBox
              label="Budget Required"
              value={`$${law.implementationTracker.budgetRequired.toLocaleString()}`}
            />
            <InfoBox
              label="Enforcement Capacity"
              value={
                <Badge
                  variant={
                    law.implementationTracker.enforcementCapacity === 'adequate'
                      ? 'success'
                      : 'warning'
                  }
                >
                  {law.implementationTracker.enforcementCapacity}
                </Badge>
              }
            />
          </div>

          {law.implementationTracker.enforcementPattern.length > 0 && (
            <SubSection title="Enforcement Patterns">
              {law.implementationTracker.enforcementPattern.map((pattern, idx) => (
                <div key={idx} className="border border-[var(--border)] rounded-lg p-4 mb-4 last:mb-0">
                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium mb-1">On Paper:</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {pattern.statutoryRequirement}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">In Practice:</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {pattern.actualPractice}
                      </p>
                    </div>
                  </div>
                  {pattern.gap && (
                    <div className="p-3 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded">
                      <p className="text-sm"><strong>Gap:</strong> {pattern.gap}</p>
                    </div>
                  )}
                  {pattern.disparateImpact && (
                    <div className="mt-2">
                      <Badge variant="critical">Disparate Impact Detected</Badge>
                    </div>
                  )}
                </div>
              ))}
            </SubSection>
          )}

          {law.implementationTracker.commonWorkarounds.length > 0 && (
            <SubSection title="Common Workarounds">
              <ul className="list-disc list-inside space-y-2">
                {law.implementationTracker.commonWorkarounds.map((workaround, idx) => (
                  <li key={idx} className="text-sm">{workaround}</li>
                ))}
              </ul>
            </SubSection>
          )}

          {law.implementationTracker.regulatoryCapture.present && (
            <div className="mt-4 p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/30 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-[var(--destructive)]">⚠</span> Regulatory Capture Detected
              </h4>
              {law.implementationTracker.regulatoryCapture.description && (
                <p className="text-sm">{law.implementationTracker.regulatoryCapture.description}</p>
              )}
            </div>
          )}
        </DiagnosticSection>

        {/* Call to Action */}
        <div className="bg-[var(--muted)] p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">
            Think you can improve this law?
          </h2>
          <p className="text-[var(--muted-foreground)] mb-6">
            Submit a structured proposal with evidence, mechanism, and trade-off analysis.
          </p>
          <Link
            href={`/proposal/new?lawId=${law.id}`}
            className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Suggest a Change
          </Link>
        </div>
      </main>
    </div>
  );
}

function StakeholderCard({
  stakeholder,
  type
}: {
  stakeholder: any;
  type: 'winner' | 'loser' | 'silent';
}) {
  const typeColors = {
    winner: 'border-[var(--success)]/30 bg-[var(--success)]/5',
    loser: 'border-[var(--destructive)]/30 bg-[var(--destructive)]/5',
    silent: 'border-[var(--warning)]/30 bg-[var(--warning)]/5'
  };

  const magnitudeBadge: Record<string, 'default' | 'warning' | 'critical'> = {
    low: 'default',
    medium: 'warning',
    high: 'critical',
    critical: 'critical'
  };

  return (
    <div className={`border rounded-lg p-4 mb-3 last:mb-0 ${typeColors[type]}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="font-semibold">{stakeholder.group}</span>
        <Badge variant={magnitudeBadge[stakeholder.magnitude] || 'default'}>
          {stakeholder.magnitude}
        </Badge>
      </div>
      <p className="text-sm mb-2">{stakeholder.description}</p>
      <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
        <span>{stakeholder.size.toLocaleString()} affected</span>
        <span>{stakeholder.impactType}</span>
      </div>
    </div>
  );
}
