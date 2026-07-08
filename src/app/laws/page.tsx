import Link from 'next/link'
import type { Metadata } from 'next'
import { exampleLaws } from '@/features/legal-framework/data/example-laws'

export const metadata: Metadata = {
  title: 'Browse Laws — Idea Stock Exchange',
  description:
    'wikiLaw diagnostic audits: laws analyzed for stated vs. operative purpose, operating assumptions, and evidence quality.',
}

export default function LawsIndexPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm text-[var(--accent)] hover:underline mb-4 inline-block">
            ← Back to wikiLaw
          </Link>
          <h1 className="text-3xl font-bold">Browse Laws</h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Each law is audited like legacy code: stated purpose vs. operative purpose,
            the assumptions it runs on, and the evidence for and against them.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <ul className="space-y-6 list-none p-0 m-0">
          {exampleLaws.map((law) => (
            <li key={law.id} className="border border-[var(--border)] rounded-lg p-6">
              <Link href={`/law/${law.id}`} className="text-xl font-semibold text-[var(--accent)] hover:underline">
                {law.officialTitle}
              </Link>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                {law.jurisdiction} · {law.citationCode} · {law.status}
              </p>
              <p className="text-sm mt-3">{law.plainEnglishSummary}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
