/**
 * Epoch arithmetic for the market layer. Epochs are calendar months, labeled
 * "YYYY-MM". The snapshot boundary is 23:59:59.999 UTC on the last day of the
 * month: arguments posted at 23:59:58 count, arguments posted at 00:00:01 the
 * next day do not.
 *
 * The graph freeze window runs 23:50:00 (boundary day) → 00:10:00 (next day),
 * UTC. All score-affecting writes are rejected inside it; reading stays open.
 */

const EPOCH_LABEL = /^\d{4}-(0[1-9]|1[0-2])$/

export function isValidEpochLabel(epoch: string): boolean {
  return EPOCH_LABEL.test(epoch)
}

export function epochLabelFor(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function parseEpoch(epoch: string): { year: number; month: number } {
  if (!isValidEpochLabel(epoch)) throw new Error(`Invalid epoch label "${epoch}" (expected YYYY-MM)`)
  const [y, m] = epoch.split('-').map(n => parseInt(n, 10))
  return { year: y, month: m }
}

/** The snapshot instant: 23:59:59.999 UTC on the month's last day. */
export function epochBoundary(epoch: string): Date {
  const { year, month } = parseEpoch(epoch)
  // Day 0 of the next month is the last day of this month.
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
}

export function previousEpoch(epoch: string): string {
  const { year, month } = parseEpoch(epoch)
  const d = new Date(Date.UTC(year, month - 2, 1))
  return epochLabelFor(d)
}

export function nextEpoch(epoch: string): string {
  const { year, month } = parseEpoch(epoch)
  const d = new Date(Date.UTC(year, month, 1))
  return epochLabelFor(d)
}

/** Freeze window around one epoch boundary. */
export function freezeWindow(epoch: string): { start: Date; end: Date } {
  const boundary = epochBoundary(epoch)
  const start = new Date(boundary.getTime())
  start.setUTCHours(23, 50, 0, 0)
  const end = new Date(boundary.getTime() + 1) // 00:00:00.000 next day
  end.setUTCMinutes(10, 0, 0)
  return { start, end }
}

/**
 * True while score-affecting graph writes must be rejected. Checked by the
 * agent ingestion path and any other graph writer that adopts it.
 */
export function isGraphFrozen(now: Date): boolean {
  const { start, end } = freezeWindow(epochLabelFor(now))
  if (now >= start && now < end) return true
  // The first minutes of a month fall in the PREVIOUS epoch's window.
  const prev = freezeWindow(previousEpoch(epochLabelFor(now)))
  return now >= prev.start && now < prev.end
}

/** Human-readable freeze rejection, quoted by writers during the window. */
export const GRAPH_FREEZE_MESSAGE =
  'Graph freeze: score-affecting edits are rejected from 23:50 to 00:10 UTC ' +
  'around each monthly epoch boundary while the snapshot locks the closing ' +
  'price. Reading stays open. Retry after the window.'

/** Contracts must resolve at a strictly future boundary. */
export function isFutureEpoch(epoch: string, now: Date): boolean {
  return epochBoundary(epoch).getTime() > now.getTime()
}

/** Grace period for the snapshot job; beyond it, PLATFORM_FAILURE contracts
 *  on that epoch settle YES. */
export const SNAPSHOT_GRACE_MS = 72 * 60 * 60 * 1000
