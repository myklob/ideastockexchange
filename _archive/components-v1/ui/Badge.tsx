import { ReactNode } from 'react'

type BadgeTone = 'pro' | 'con' | 'info' | 'warn' | 'neutral'

const styles: Record<BadgeTone, string> = {
  pro:     'bg-[#dcfce7] text-[#15803d] border-[#86efac]',
  con:     'bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]',
  info:    'bg-[#dbeafe] text-[#1e40af] border-[#93c5fd]',
  warn:    'bg-[#fed7aa] text-[#7c2d12] border-[#fdba74]',
  neutral: 'bg-[var(--muted)] text-[#525252] border-[var(--border)]',
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded border font-mono text-[11px] font-bold tracking-wider ${styles[tone]}`}>
      {children}
    </span>
  )
}
