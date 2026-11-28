import Link from 'next/link'
import type { ArgumentWithBelief } from '../types'
import AddArgumentForm from './AddArgumentForm'
import SuggestEvidenceForm from './SuggestEvidenceForm'

interface ContributeSectionProps {
  /** When set, the section renders the live add-a-reason form. Optional so
   *  reuse sites (legacy routes) keep the static footer. */
  beliefId?: number
  /** When set, the section renders the suggest-evidence form. */
  beliefSlug?: string
  highStakes?: boolean
  arguments?: ArgumentWithBelief[]
}

function strongest(args: ArgumentWithBelief[], side: string) {
  const onSide = args.filter(a => a.side === side)
  if (onSide.length === 0) return null
  const best = onSide.reduce((a, b) =>
    Math.abs(b.impactScore) > Math.abs(a.impactScore) ? b : a,
  )
  return {
    id: best.id,
    claim: best.claim ?? best.belief.statement,
    impactScore: best.impactScore,
  }
}

export default function ContributeSection({
  beliefId,
  beliefSlug,
  highStakes = false,
  arguments: args = [],
}: ContributeSectionProps) {
  return (
    <section>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
        <span>📬</span> Contribute
      </h1>

      <p className="text-sm mb-3">
        Three moves are supported: <strong>add a row</strong> — a new reason to agree or
        disagree, below — <strong>challenge a number</strong>: every score on this page is a
        doorway into the sub-debate that produced it, so click the score you disagree with and
        argue there — or <strong>suggest evidence</strong>: attach a source to this claim, the
        smallest contribution there is.
      </p>

      {beliefId != null && (
        <div className="mb-4">
          <AddArgumentForm
            beliefId={beliefId}
            highStakes={highStakes}
            strongestAgree={strongest(args, 'agree')}
            strongestDisagree={strongest(args, 'disagree')}
          />
        </div>
      )}

      {beliefSlug != null && (
        <div className="mb-4">
          <SuggestEvidenceForm beliefSlug={beliefSlug} />
        </div>
      )}

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
        <li>Measure <Link href="/algorithms/truth-scores" className="text-[var(--accent)] hover:underline">truth</Link> and <Link href="/algorithms/evidence-scores" className="text-[var(--accent)] hover:underline">evidence quality</Link></li>
        <li>Apply <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">linkage scores</Link> to weight relevance</li>
        <li>Discount restatements with <Link href="/algorithms/unique-scores" className="text-[var(--accent)] hover:underline">uniqueness scores</Link></li>
      </ul>

      <p className="text-sm text-[var(--muted-foreground)]">
        This template provides the structure. Your contributions provide the content.
        Together, we build humanity&apos;s knowledge infrastructure for better decisions.
      </p>
    </section>
  )
}
