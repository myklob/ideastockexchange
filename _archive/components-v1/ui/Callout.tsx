import { ReactNode } from 'react'

type CalloutTone = 'info' | 'warn' | 'ok'

const styles: Record<CalloutTone, string> = {
  info: 'border-l-[var(--accent)]   bg-[var(--ise-accent-soft)]',
  warn: 'border-l-[var(--con-600)]  bg-[var(--con-50)]',
  ok:   'border-l-[var(--success)]  bg-[#f0fdf4]',
}

export function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: CalloutTone
  title?: string
  children: ReactNode
}) {
  return (
    <div className={`border-l-4 ${styles[tone]} px-3.5 py-3 rounded-r-[var(--radius)] text-sm leading-relaxed`}>
      {title && <strong>{title} </strong>}
      {children}
    </div>
  )
}
