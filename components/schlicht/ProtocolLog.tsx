'use client'

import { ProtocolLogEntry } from '@/lib/types/schlicht'

interface ProtocolLogProps {
  entries: ProtocolLogEntry[]
  protocolStatus: {
    claimsPendingLogicCheck: number
    activeRedTeams: number
  }
}

function getAgentColor(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('logic')) return 'text-purple-600'
  if (lower.includes('evidence') || lower.includes('scholar'))
    return 'text-orange-600'
  if (lower.includes('red')) return 'text-red-600'
  if (lower.includes('compress')) return 'text-gray-600'
  if (lower.includes('calibration')) return 'text-blue-600'
  if (lower.includes('base')) return 'text-teal-600'
  if (lower.includes('system')) return 'text-indigo-600'
  return 'text-[var(--accent)]'
}

export default function ProtocolLog({
  entries,
  protocolStatus,
}: ProtocolLogProps) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden sticky top-5">
      {/* Header */}
      <div className="bg-[var(--foreground)] text-white px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-bold tracking-wide">
          SCHLICHT PROTOCOL LOG
        </span>
        <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
      </div>

      {/* Log entries */}
      <div className="max-h-[500px] overflow-y-auto">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="px-4 py-3 border-b border-gray-100 grid grid-cols-[24px_1fr] gap-2 text-sm"
          >
            <span className="text-[var(--muted-foreground)] text-xs font-mono pt-0.5">
              {entry.timestamp}
            </span>
            <div className="text-[var(--foreground)]">
              <span className={`font-bold ${getAgentColor(entry.agentName)}`}>
                {entry.agentName}
              </span>{' '}
              <span className="text-[var(--muted-foreground)]">
                {entry.content}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Status footer */}
      <div className="px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
        <div className="font-semibold text-[var(--foreground)] mb-1">
          Protocol Status:
        </div>
        <div>
          {protocolStatus.claimsPendingLogicCheck} Claims Pending Logic Check
        </div>
        <div>{protocolStatus.activeRedTeams} Red Teams Active</div>
      </div>
    </div>
  )
}
