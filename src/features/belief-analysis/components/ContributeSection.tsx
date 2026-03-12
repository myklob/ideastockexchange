import Link from 'next/link'

export default function ContributeSection() {
  return (
    <section>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Contribute</h1>

      <p className="text-sm mb-3">
        <Link href="/Contact%20Me" className="text-[var(--accent)] hover:underline">Contact us</Link> to contribute to the Idea Stock Exchange.
      </p>

      <p className="text-sm mb-4">
        <a
          href="https://github.com/myklob/ideastockexchange"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] hover:underline"
        >
          View the full codebase and technical documentation on GitHub
        </a>{' '}
        to understand the scoring algorithms, contribute to development, or adapt this system for your own use.
      </p>

      <p className="text-sm mb-2">Start by exploring how we:</p>
      <ul className="list-disc list-inside text-sm space-y-1 mb-4 text-[var(--muted-foreground)]">
        <li>Calculate <Link href="/Argument%20scores%20from%20sub-argument%20scores" className="text-[var(--accent)] hover:underline">argument scores from sub-arguments</Link></li>
        <li>Measure <Link href="/truth" className="text-[var(--accent)] hover:underline">truth</Link> and <Link href="/Evidence" className="text-[var(--accent)] hover:underline">evidence quality</Link></li>
        <li>Apply <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">linkage scores</Link> to weight relevance</li>
        <li>Implement <Link href="/ReasonRank" className="text-[var(--accent)] hover:underline">ReasonRank</Link> for quality-based sorting</li>
      </ul>

      <p className="text-sm text-[var(--muted-foreground)]">
        This template provides the structure. Your contributions provide the content.
        Together, we build humanity&apos;s knowledge infrastructure for better decisions.
      </p>
    </section>
  )
}
