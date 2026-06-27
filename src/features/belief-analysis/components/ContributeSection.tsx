import Link from 'next/link'

export default function ContributeSection() {
  return (
    <section>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
        <span>📬</span> Contribute
      </h1>

      <p className="text-sm mb-3">
        Posted by ~Myclob.{' '}
        Contact mike.laub@gmail.com to contribute to the Idea Stock Exchange.
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
        <li>Calculate <Link href="/algorithms/reason-rank" className="text-[var(--accent)] hover:underline">argument scores from sub-arguments</Link></li>
        <li>Measure truth and evidence quality</li>
        <li>Apply <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">linkage scores</Link> to weight relevance</li>
        <li>Implement <Link href="/algorithms/reason-rank" className="text-[var(--accent)] hover:underline">ReasonRank</Link> for quality-based sorting</li>
      </ul>

      <p className="text-sm text-[var(--muted-foreground)]">
        This template provides the structure. Your contributions provide the content.
        Together, we build humanity&apos;s knowledge infrastructure for better decisions.
      </p>
    </section>
  )
}
