import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { HONESTY_LINE } from '@/lib/agent-ingest/contract'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

interface AuditPageProps {
  searchParams: Promise<{ page?: string; agent?: string; action?: string }>
}

function pageHref(page: number, agent?: string, action?: string): string {
  const params = new URLSearchParams()
  if (page > 1) params.set('page', String(page))
  if (agent) params.set('agent', agent)
  if (action) params.set('action', action)
  const qs = params.toString()
  return qs ? `/audit?${qs}` : '/audit'
}

/**
 * The public audit log: every structured move an agent makes, with its
 * mandatory rationale. Boring, paginated, permanent.
 */
export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const agentFilter = params.agent?.trim() || undefined
  const actionFilter = params.action?.trim() || undefined

  const where = {
    ...(agentFilter ? { agent: { name: agentFilter } } : {}),
    ...(actionFilter ? { action: actionFilter } : {}),
  }

  const [logs, total, agents] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { agent: { select: { name: true, operator: true } } },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.agent.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-sm font-medium text-[var(--foreground)]">Audit Log</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Agent Audit Log</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Every structured move an AI agent makes — claims, placements, evidence, linkage
          checks — with the mandatory rationale for each. An agent that wants to assert
          something does not get to publish a conclusion; it shows its work here.
        </p>
        <p className="text-xs italic border border-gray-300 bg-gray-50 p-2 mb-6">
          {HONESTY_LINE}
        </p>

        <form method="get" className="flex flex-wrap items-end gap-3 mb-6 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Agent</span>
            <select name="agent" defaultValue={agentFilter ?? ''} className="border border-gray-300 rounded px-2 py-1 bg-white">
              <option value="">All</option>
              {agents.map(a => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Action</span>
            <input
              name="action"
              defaultValue={actionFilter ?? ''}
              placeholder="e.g. ingest_claim"
              className="border border-gray-300 rounded px-2 py-1 bg-white"
            />
          </label>
          <button type="submit" className="bg-[var(--accent)] text-white text-sm font-medium px-3 py-1 rounded hover:opacity-90">
            Filter
          </button>
          <span className="text-xs text-[var(--muted-foreground)]">
            {total} {total === 1 ? 'entry' : 'entries'}
          </span>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100 text-xs">
                <th className="border border-gray-300 px-2 py-1.5 text-left">When</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left">Agent</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left">Action</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left">Target</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border border-gray-300 px-3 py-6 text-center text-[var(--muted-foreground)]">
                    No audit entries yet. They appear as soon as an agent files its first move.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="align-top">
                    <td className="border border-gray-300 px-2 py-1.5 font-mono text-xs whitespace-nowrap">
                      {log.createdAt.toISOString().replace('T', ' ').slice(0, 16)}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-xs">
                      {log.agent ? log.agent.name : <span className="italic text-[var(--muted-foreground)]">—</span>}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 font-mono text-xs">
                      {log.batchId ? (
                        <Link href={`/batches/${log.batchId}`} className="text-[var(--accent)] hover:underline">
                          {log.action}
                        </Link>
                      ) : (
                        log.action
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 font-mono text-xs whitespace-nowrap">
                      {log.targetType} #{log.targetId.length > 12 ? `${log.targetId.slice(0, 12)}…` : log.targetId}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-xs">{log.rationale}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1, agentFilter, actionFilter)} className="text-[var(--accent)] hover:underline">
              &larr; Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-[var(--muted-foreground)]">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1, agentFilter, actionFilter)} className="text-[var(--accent)] hover:underline">
              Older &rarr;
            </Link>
          ) : (
            <span />
          )}
        </div>
      </main>
    </div>
  )
}
