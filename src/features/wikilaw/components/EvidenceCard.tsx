import { Evidence } from '@/core/types/ise-core';
import { Badge, QualityBar } from './DiagnosticSection';

export function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const supportVariant = {
    pro: 'success' as const,
    con: 'critical' as const,
    mixed: 'warning' as const
  };

  return (
    <div className="border border-[var(--border)] rounded-lg p-4 mb-4 last:mb-0">
      <div className="flex items-start justify-between mb-3">
        <Badge variant={supportVariant[evidence.supports]}>
          {evidence.supports.toUpperCase()}
        </Badge>
        <Badge>{evidence.type.replace(/_/g, ' ')}</Badge>
      </div>

      <p className="font-medium mb-2">{evidence.claim}</p>

      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        <strong>Source:</strong> {evidence.source}
      </p>

      {evidence.context && (
        <p className="text-sm text-[var(--muted-foreground)] mb-3">
          <strong>Context:</strong> {evidence.context}
        </p>
      )}

      {evidence.limitations.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium mb-1">Limitations:</p>
          <ul className="text-sm text-[var(--muted-foreground)] list-disc list-inside space-y-1">
            {evidence.limitations.map((limitation, idx) => (
              <li key={idx}>{limitation}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[var(--border)]">
        <p className="text-xs font-medium mb-2">Evidence Quality</p>
        <QualityBar score={evidence.quality.overall} label="Overall" />
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-[var(--muted-foreground)]">Rigor:</span>{' '}
            <span className="font-medium">{evidence.quality.rigor}</span>
          </div>
          <div>
            <span className="text-[var(--muted-foreground)]">Replicability:</span>{' '}
            <span className="font-medium">{evidence.quality.replicability}</span>
          </div>
          <div>
            <span className="text-[var(--muted-foreground)]">Transparency:</span>{' '}
            <span className="font-medium">{evidence.quality.transparency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
