import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCBA } from '@/features/cost-benefit-analysis/data/cba-data'
import CBADashboard from '@/features/cost-benefit-analysis/components/CBADashboard'

interface CBAPageProps {
  params: Promise<{ id: string }>
}

export default async function CBAPage({ params }: CBAPageProps) {
  const { id } = await params
  const cba = getCBA(id)

  if (!cba) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      {/* Navigation */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold text-[var(--foreground)]">
              ISE
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <Link
              href="/cba"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Cost-Benefit Analysis
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <span className="text-sm text-[var(--muted-foreground)] font-mono truncate max-w-[200px]">
              {cba.id}
            </span>
          </div>
          <Link
            href={`/api/cba/${id}`}
            className="text-xs font-mono text-[var(--muted-foreground)] hover:text-[var(--accent)] border border-[var(--border)] px-2 py-1 rounded"
          >
            View JSON
          </Link>
        </div>
      </nav>

      {/* Dashboard */}
      <CBADashboard initialCBA={cba} />
    </div>
  )
}
