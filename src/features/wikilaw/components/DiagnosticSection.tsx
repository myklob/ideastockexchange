import { ReactNode } from 'react';

interface DiagnosticSectionProps {
  title: string;
  children: ReactNode;
  severity?: 'info' | 'warning' | 'critical' | 'success';
}

export function DiagnosticSection({ title, children, severity = 'info' }: DiagnosticSectionProps) {
  const severityColors = {
    info: 'border-[var(--border)]',
    warning: 'border-[var(--warning)]/30 bg-[var(--warning)]/5',
    critical: 'border-[var(--destructive)]/30 bg-[var(--destructive)]/5',
    success: 'border-[var(--success)]/30 bg-[var(--success)]/5'
  };

  return (
    <section className={`border rounded-lg p-6 ${severityColors[severity]}`}>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}

export function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

export function InfoBox({ label, value }: { label: string; value: string | ReactNode }) {
  return (
    <div className="mb-3">
      <dt className="text-sm font-medium text-[var(--muted-foreground)] mb-1">{label}</dt>
      <dd className="text-base">{value}</dd>
    </div>
  );
}

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'success' | 'warning' | 'critical' }) {
  const variants = {
    default: 'bg-[var(--muted)] text-[var(--foreground)]',
    success: 'bg-[var(--success)]/20 text-[var(--success)]',
    warning: 'bg-[var(--warning)]/20 text-[var(--warning)]',
    critical: 'bg-[var(--destructive)]/20 text-[var(--destructive)]'
  };

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function QualityBar({ score, label }: { score: number; label: string }) {
  const getColor = (score: number) => {
    if (score >= 75) return 'bg-[var(--success)]';
    if (score >= 50) return 'bg-[var(--warning)]';
    return 'bg-[var(--destructive)]';
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{score}/100</span>
      </div>
      <div className="w-full bg-[var(--muted)] rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
