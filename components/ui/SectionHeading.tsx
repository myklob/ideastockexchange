import Link from 'next/link'

interface SectionHeadingProps {
  emoji: string
  title: string
  href?: string
  subtitle?: string
  /** @deprecated use href */
  link?: string
}

export function SectionHeading({ emoji, title, href, subtitle, link }: SectionHeadingProps) {
  const dest = href ?? link
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 text-[22px] font-bold m-0">
        <span aria-hidden="true">{emoji}</span>
        {dest ? (
          <Link href={dest} className="text-[var(--accent)] hover:underline">
            {title}
          </Link>
        ) : (
          title
        )}
      </h2>
      {subtitle && (
        <p className="text-sm text-[var(--muted-foreground)] italic mt-1 mb-0">{subtitle}</p>
      )}
    </div>
  )
}
