import { Assumption } from '@/lib/types/ise-core';
import { Badge } from './DiagnosticSection';
import { EvidenceCard } from './EvidenceCard';

export function AssumptionCard({ assumption }: { assumption: Assumption }) {
  const testabilityColors = {
    easily_testable: 'success' as const,
    testable: 'success' as const,
    difficult: 'warning' as const,
    unfalsifiable: 'critical' as const
  };

  const controversyLevel = (level: number) => {
    if (level < 30) return { label: 'Low Controversy', variant: 'success' as const };
    if (level < 60) return { label: 'Moderate Controversy', variant: 'warning' as const };
    return { label: 'High Controversy', variant: 'critical' as const };
  };

  const controversy = controversyLevel(assumption.controversyLevel);

  return (
    <div className="border border-[var(--border)] rounded-lg p-6 mb-6 last:mb-0">
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant={testabilityColors[assumption.testability]}>
          {assumption.testability.replace(/_/g, ' ')}
        </Badge>
        <Badge variant={controversy.variant}>
          {controversy.label} ({assumption.controversyLevel}%)
        </Badge>
        <Badge>{assumption.domain}</Badge>
      </div>

      <p className="text-lg font-semibold mb-4 leading-relaxed">
        "{assumption.statement}"
      </p>

      {assumption.evidence.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Evidence</h4>
          {assumption.evidence.map((evidence) => (
            <EvidenceCard key={evidence.id} evidence={evidence} />
          ))}
        </div>
      )}

      {assumption.evidence.length === 0 && (
        <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded p-3">
          <p className="text-sm text-[var(--warning)]">
            ⚠ No evidence linked yet. This assumption needs empirical backing.
          </p>
        </div>
      )}
    </div>
  );
}
