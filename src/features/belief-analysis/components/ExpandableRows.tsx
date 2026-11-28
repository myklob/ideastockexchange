'use client'

import { useState } from 'react'

interface ExpandableRowsProps {
  /** How many rows are hidden behind the toggle. Renders nothing when 0. */
  moreCount: number
  /** Column count of the host table, so the toggle row spans it. */
  colSpan: number
  /** The below-the-fold rows (already score-ordered), shown when expanded. */
  children: React.ReactNode
}

/**
 * Collapses a table's lower-scoring rows behind a "Show N more" toggle so
 * each table leads with its top-scoring content. Rendered inside <tbody>.
 */
export default function ExpandableRows({ moreCount, colSpan, children }: ExpandableRowsProps) {
  const [open, setOpen] = useState(false)
  if (moreCount <= 0) return null
  return (
    <>
      {open && children}
      <tr>
        <td colSpan={colSpan} className="border border-gray-300 px-3 py-1.5 text-center bg-gray-50">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            {open ? 'Show top rows only' : `Show ${moreCount} more lower-scoring ${moreCount === 1 ? 'row' : 'rows'}`}
          </button>
        </td>
      </tr>
    </>
  )
}
