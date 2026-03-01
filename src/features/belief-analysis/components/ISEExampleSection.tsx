import Link from 'next/link'

/**
 * ISEExampleSection — renders the blue highlighted "How Candidate Evaluation Works"
 * example box for the "set aside distractions" belief page.
 *
 * Placed between the intro paragraphs and the standard analysis sections, it shows
 * a concrete demonstration of how ISE scoring neutralizes manufactured scandal and
 * media distraction when evaluating political candidates.
 */
export default function ISEExampleSection() {
  return (
    <div className="bg-[#f4f9ff] border-l-[5px] border-[#0055a4] rounded-r-md p-6 mb-8">
      {/* Header */}
      <p className="font-bold mb-3">
        🏛️ Example: How Candidate Evaluation Works Inside the ISE
      </p>

      {/* Setup */}
      <p className="mb-4">
        A user creates a belief page:{' '}
        <em>"Jane Smith is the most qualified candidate for U.S. Senate in Colorado."</em>{' '}
        It is filed at{' '}
        <code className="bg-white/70 px-1 py-0.5 rounded text-sm font-mono">
          Elections → United States → Colorado → Senate
        </code>{' '}
        and instantly inherits the same structural template every belief on the platform
        uses:{' '}
        <Link href="/Argument%20Trees" className="text-[var(--accent)] hover:underline">
          Argument Trees
        </Link>
        ,{' '}
        <Link href="/Evidence%20Scoring" className="text-[var(--accent)] hover:underline">
          Evidence Scoring
        </Link>
        ,{' '}
        <Link
          href="/w/page/159351732/Objective%20criteria%20scores"
          className="text-[var(--accent)] hover:underline"
        >
          Objective Criteria weighting
        </Link>
        ,{' '}
        <Link
          href="/w/page/156187122/cost-benefit%20analysis"
          className="text-[var(--accent)] hover:underline"
        >
          Cost-Benefit Analysis
        </Link>
        , and{' '}
        <Link
          href="/w/page/156186840/automate%20conflict%20resolution"
          className="text-[var(--accent)] hover:underline"
        >
          Conflict Resolution mapping
        </Link>
        .
      </p>
      <p className="mb-6">
        No special configuration. No editorial setup. No custom rules for politicians.
        The architecture is identical whether evaluating a tax proposal, a scientific
        claim, or a Senate candidate.
      </p>

      {/* Criteria Come First */}
      <p className="font-bold mb-3">The Criteria Come First — and Apply to Everyone</p>
      <p className="mb-6">
        Before Jane Smith&apos;s page existed, the Colorado Senate node already contained
        a scored, community-built set of{' '}
        <Link
          href="/w/page/159351732/Objective%20criteria%20scores"
          className="text-[var(--accent)] hover:underline"
        >
          Objective Criteria
        </Link>
        : which qualifications matter most for this office, which policy domains carry
        the highest{' '}
        <a
          href="https://myclob.pbworks.com/importance%20score"
          className="text-[var(--accent)] hover:underline"
        >
          Importance Scores
        </a>
        , and what measurable performance indicators distinguish effective senators from
        ineffective ones.
        <br />
        <br />
        Jane Smith&apos;s page inherits those criteria automatically. So does every other
        candidate. The goalposts are fixed before the campaign begins — and they are
        fixed equally. You cannot evaluate one candidate on policy while attacking
        another on personality. The scoring framework applies the same weights to every
        belief node in that election.
      </p>

      {/* Arguments Are Scored */}
      <p className="font-bold mb-3">Arguments Are Scored — Not Curated</p>
      <p className="mb-3">
        When users submit arguments, each one is evaluated across three independent
        dimensions:
      </p>
      <ul className="list-none space-y-2 mb-6 pl-2">
        <li>
          <strong>
            <a
              href="https://myclob.pbworks.com/w/page/21960078/truth"
              className="text-[var(--accent)] hover:underline"
            >
              Truth Score
            </a>
            :
          </strong>{' '}
          Is the claim factually accurate and supported by linked evidence?
        </li>
        <li>
          <strong>
            <a
              href="https://myclob.pbworks.com/w/page/159338766/Linkage%20Scores"
              className="text-[var(--accent)] hover:underline"
            >
              Linkage Score
            </a>
            :
          </strong>{' '}
          Does this argument actually connect to the question of Senate qualification?
        </li>
        <li>
          <strong>
            <a
              href="https://myclob.pbworks.com/importance%20score"
              className="text-[var(--accent)] hover:underline"
            >
              Importance Score
            </a>
            :
          </strong>{' '}
          How central is this criterion within the pre-defined evaluation framework?
        </li>
      </ul>
      <p className="mb-6">
        That third dimension neutralizes manufactured scandal. If a tabloid story is
        submitted as a reason to question her qualifications, the system does not
        suppress it — it simply weights it according to the importance the community
        assigned to personal conduct within the office-level criteria. Outrage cannot
        override structure. Visibility does not equal weight.
      </p>

      {/* No Agenda */}
      <p className="font-bold mb-3">No Agenda. No Moderator Bias. No Exceptions.</p>
      <p>
        <a
          href="https://myclob.pbworks.com/ReasonRank"
          className="text-[var(--accent)] hover:underline"
        >
          ReasonRank
        </a>{' '}
        does not know it is evaluating a politician. It applies the same recursive logic
        used everywhere else in the system: sub-arguments strengthen or weaken parent
        arguments, evidence adjusts Truth Scores, and weights propagate upward through
        the tree.
        <br />
        <br />
        The output is not &ldquo;who dominated the debate stage.&rdquo; It is &ldquo;who
        scores highest under the criteria the public agreed upon before campaign noise
        began.&rdquo; The platform does not decide what matters. The scoring system does.
        And the scoring system treats every candidate — and every belief — the same.
      </p>
    </div>
  )
}
