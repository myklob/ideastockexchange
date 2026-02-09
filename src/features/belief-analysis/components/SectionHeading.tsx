import Link from 'next/link'

interface SectionHeadingProps {
  emoji: string
  title: string
  href?: string
  subtitle?: string
}

export default function SectionHeading({ emoji, title, href, subtitle }: SectionHeadingProps) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
        <span>{emoji}</span>
        {href ? (
          <Link href={href} className="text-[var(--accent)] hover:underline">{title}</Link>
        ) : (
          title
        )}
      </h2>
      {subtitle && (
        <p className="text-sm text-[var(--muted-foreground)] italic mt-1">{subtitle}</p>
      )}
    </div>
  )
}
