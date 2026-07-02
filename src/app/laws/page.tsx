import Link from 'next/link';
import type { Metadata } from 'next';
import { exampleLaws } from '@/features/legal-framework/data/example-laws';
import { Badge } from '@/features/legal-framework/components/DiagnosticSection';

export const metadata: Metadata = {
  title: 'Browse Laws — Idea Stock Exchange',
  description:
    'Laws analyzed with the wikiLaw diagnostic framework: stated purpose vs. operative purpose, operating assumptions, and the evidence behind each.',
};

export default function LawsPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm text-[var(--accent)] hover:underline mb-4 inline-block">
            ← Back to wikiLaw
          </Link>
          <h1 className="text-4xl font-bold mb-2">Browse Laws</h1>
          <p className="text-[var(--muted-foreground)]">
            Each law gets a diagnostic: what it claims to do, what it actually does, and whether
            its operating assumptions survive contact with evidence.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {exampleLaws.map((law) => (
          <Link
            key={law.id}
            href={`/law/${law.id}`}
            className="block border border-[var(--border)] rounded-lg p-6 hover:border-[var(--accent)] transition-colors"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge>{law.jurisdiction}</Badge>
              <Badge>{law.category.replace(/_/g, ' ')}</Badge>
              <Badge variant={law.status === 'active' ? 'success' : 'warning'}>{law.status}</Badge>
            </div>
            <h2 className="text-2xl font-bold mb-1">{law.officialTitle}</h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">{law.citationCode}</p>
            <p className="text-[var(--foreground)]">{law.plainEnglishSummary}</p>
          </Link>
        ))}
      </main>
    </div>
  );
}
