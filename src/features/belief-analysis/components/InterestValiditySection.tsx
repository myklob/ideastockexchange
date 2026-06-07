import Link from 'next/link'
import type {
  InterestValidityDebate,
  ValidityReasonItem,
  InterestComparisonItem,
  InterestScenarioItem,
} from '../types'

interface InterestValiditySectionProps {
  debates: InterestValidityDebate[]
}

/** A single placeholder debate so the template skeleton renders when no data exists. */
const PLACEHOLDER_DEBATE: InterestValidityDebate = { interest: '' }

function scoreCell(score: number | null | undefined): React.ReactNode {
  if (score == null) {
    return <span className="text-[var(--muted-foreground)] italic">[±XX]</span>
  }
  const sign = score > 0 ? '+' : ''
  return <span className="font-mono">{sign}{score}</span>
}

function validityCell(score: number | null | undefined): React.ReactNode {
  if (score == null) {
    return <span className="text-[var(--muted-foreground)] italic">[pending]</span>
  }
  return <span className="font-mono">{score}/100</span>
}

function ReasonRows({
  rows,
  positive,
}: {
  rows: ValidityReasonItem[]
  positive: boolean
}) {
  const data: Array<ValidityReasonItem | null> = rows.length > 0 ? rows : [null, null]
  return (
    <>
      {data.map((row, i) => (
        <li key={i} className="py-1">
          {row ? (
            <>
              <span className={positive ? 'text-green-700' : 'text-red-700'}>
                {scoreCell(row.score)}
              </span>{' '}
              <span>{row.reason}</span>
              {row.criterion && (
                <span className="text-[var(--muted-foreground)] text-xs">
                  {' '}(criterion: {row.criterion})
                </span>
              )}
            </>
          ) : (
            <span className="text-[var(--muted-foreground)] italic text-sm">
              {positive
                ? '[reason it is valid, named by opening words] (criterion)'
                : '[reason it is not valid] (criterion)'}
            </span>
          )}
        </li>
      ))}
    </>
  )
}

function TwoColumnReasons({
  leftTitle,
  rightTitle,
  leftRows,
  rightRows,
}: {
  leftTitle: string
  rightTitle: string
  leftRows: ValidityReasonItem[]
  rightRows: ValidityReasonItem[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 text-left font-semibold w-1/2">{leftTitle}</th>
            <th className="px-3 py-2 text-left font-semibold w-1/2">{rightTitle}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-3 py-2 align-top">
              <ul className="list-none space-y-0">
                <ReasonRows rows={leftRows} positive />
              </ul>
            </td>
            <td className="px-3 py-2 align-top">
              <ul className="list-none space-y-0">
                <ReasonRows rows={rightRows} positive={false} />
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function SummaryScorecard({ debate }: { debate: InterestValidityDebate }) {
  const placeholder = (text: string) => (
    <span className="text-[var(--muted-foreground)] italic">{text}</span>
  )
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 text-center font-semibold w-1/3">Valid at all? (Scope 1)</th>
            <th className="px-3 py-2 text-center font-semibold w-1/3">
              Vs rival interest, in general (Scope 2)
            </th>
            <th className="px-3 py-2 text-center font-semibold w-1/3">
              In a specific scenario (Scope 3)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-center">
            <td className="px-3 py-3 align-top bg-green-50">
              <div className="text-lg font-bold">
                {debate.validityScore != null ? (
                  <span className="font-mono">{debate.validityScore}/100</span>
                ) : (
                  placeholder('[XX]/100')
                )}
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                {debate.scope1Note ?? placeholder('[where it is strong, where it is weak]')}
              </div>
            </td>
            <td className="px-3 py-3 align-top bg-yellow-50">
              <div className="text-lg font-bold">
                {debate.scope2Verdict ?? placeholder('[higher / tied / lower]')}
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                {debate.scope2Note ?? placeholder('[why, e.g. both sit in the Safety band]')}
              </div>
            </td>
            <td className="px-3 py-3 align-top bg-red-50">
              <div className="text-lg font-bold">
                {debate.scope3Verdict ?? placeholder('[wins / yields]')}
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                {debate.scope3Note ?? placeholder('[the deciding scenario fact]')}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function ComparisonTable({ rows }: { rows: InterestComparisonItem[] }) {
  const data: Array<InterestComparisonItem | null> = rows.length > 0 ? rows : [null, null]
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 text-left font-semibold w-[40%]">Interest</th>
            <th className="px-3 py-2 text-left font-semibold w-[35%]">Maslow prior (starting band)</th>
            <th className="px-3 py-2 text-center font-semibold w-[25%]">Current validity</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="px-3 py-2 align-top">
                {row ? (
                  row.isThisInterest ? <strong>{row.interest}</strong> : row.interest
                ) : (
                  <span className="text-[var(--muted-foreground)] italic">
                    {i === 0 ? '[this interest]' : '[competing interest]'}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 align-top">
                {row?.maslowPrior ?? (
                  <span className="text-[var(--muted-foreground)] italic">[level, e.g. Safety 70-85]</span>
                )}
              </td>
              <td className="px-3 py-2 align-top text-center">{validityCell(row?.currentValidity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const SCENARIO_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function ScenarioBlock({ scenario, index }: { scenario: InterestScenarioItem | null; index: number }) {
  const letter = SCENARIO_LETTERS[index] ?? String(index + 1)
  const defaultTitle = index === 0 ? 'the case where this interest wins' : 'the case where this interest yields'
  return (
    <div className="border border-gray-200 rounded p-4 space-y-3">
      <h5 className="text-sm font-semibold text-[#2c3e50]">
        Scenario {letter}:{' '}
        {scenario?.title ? (
          scenario.title
        ) : (
          <span className="font-normal text-[var(--muted-foreground)] italic">[{defaultTitle}]</span>
        )}
      </h5>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-semibold w-[30%]">Scenario</th>
              <th className="px-3 py-2 text-left font-semibold w-[35%]">Competing interest</th>
              <th className="px-3 py-2 text-left font-semibold w-[35%]">Scenario fact that moves the ranking</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 align-top">
                {scenario?.scenario ?? (
                  <span className="text-[var(--muted-foreground)] italic">[describe the specific conflict]</span>
                )}
              </td>
              <td className="px-3 py-2 align-top">
                {scenario?.competingInterest ?? (
                  <span className="text-[var(--muted-foreground)] italic">[the interest it collides with here]</span>
                )}
              </td>
              <td className="px-3 py-2 align-top">
                {scenario?.scenarioFact ?? (
                  <span className="text-[var(--muted-foreground)] italic">[e.g. the harm is imminent and contained]</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <TwoColumnReasons
        leftTitle="Reasons it should win here"
        rightTitle="Reasons it should yield here"
        leftRows={scenario?.winReasons ?? []}
        rightRows={scenario?.yieldReasons ?? []}
      />

      <p className="text-sm">
        <strong>In-scenario ranking:</strong>{' '}
        {scenario?.inScenarioRanking ?? (
          <span className="text-[var(--muted-foreground)] italic">
            [this interest wins / yields here] — may differ from the general ranking; note why the
            scenario facts caused it
          </span>
        )}
      </p>
      {index === 0 && (
        <p className="text-xs text-[var(--muted-foreground)]">
          A near-reversal between scenarios is a textbook{' '}
          <Link href="/Compromise" className="text-[var(--accent)] hover:underline">compromise candidate</Link>:
          a small, achievable change to the scenario facts could flip which interest wins without
          denying the underlying need. This is the input the Conflict Resolution Pipeline reads at
          steps 5 and 6.
        </p>
      )}
    </div>
  )
}

function DebateBlock({ debate }: { debate: InterestValidityDebate }) {
  const scenarios: Array<InterestScenarioItem | null> =
    debate.scenarios && debate.scenarios.length > 0 ? debate.scenarios : [null, null]
  const objectiveCriteria = debate.objectiveCriteria ?? []

  return (
    <div className="space-y-6 border-l-2 border-gray-200 pl-4">
      {/* Intro + the interest */}
      <div className="space-y-3">
        <p className="text-sm text-[var(--muted-foreground)]">
          &ldquo;This interest is valid&rdquo; is a claim like any other, so here are the scored
          reasons on both sides, at three scopes: valid at all, more or less valid than the competing
          interest in general, and which interest wins inside a specific scenario. The question is
          about the underlying <em>interest</em> — the need behind the position — not about any single
          policy.
        </p>
        <div className="border-l-4 border-[#2c3e50] bg-[#f4f6f8] px-4 py-3">
          <p className="text-sm m-0">
            <strong>The interest:</strong>{' '}
            {debate.interest ? (
              <span>&ldquo;{debate.interest}&rdquo;</span>
            ) : (
              <span className="text-[var(--muted-foreground)] italic">
                [state it as a need, fear, or desire, in the holder&apos;s own voice]
              </span>
            )}
          </p>
        </div>

        {/* Summary scorecard */}
        <SummaryScorecard debate={debate} />
        <p className="text-xs text-[var(--muted-foreground)]">
          <strong>How to read this:</strong> treat the interest as valid until the reasons below lower
          it. The score traces only to those reasons, never to who holds the interest, how powerful
          they are, or how loudly they assert it.
        </p>
      </div>

      {/* Scope 1 */}
      <div>
        <h4 className="text-sm font-semibold mb-1">Scope 1: Is This Interest Valid At All?</h4>
        <p className="text-xs text-[var(--muted-foreground)] mb-2">
          The absolute question. Each reason is a scored argument, named by its opening words, attached
          to the criterion it leans on (universal test, reciprocity, rests on a true premise, harm to
          others, impact scope, reversibility, alternative satisfaction).
        </p>
        <TwoColumnReasons
          leftTitle="Reasons it IS valid"
          rightTitle="Reasons it is NOT valid"
          leftRows={debate.validReasons ?? []}
          rightRows={debate.invalidReasons ?? []}
        />
        <p className="text-sm mt-2">
          <strong>Resulting Interest Validity:</strong> {validityCell(debate.validityScore)}, traceable
          to the reasons above.
        </p>

        {/* How this page works */}
        <div className="bg-[#f8f9f9] border border-[#d5dbdb] px-4 py-3 mt-4 text-xs space-y-2">
          <p className="m-0">
            <strong>How this page works.</strong> Default: the interest is valid until an argument
            lowers it, so the burden is on the challenge. Both sides are assumed rational, holding
            their interest for a real need rather than from stupidity or malice. Arguments set the
            score and nothing else does. Maslow is a prior, a starting band, not a verdict; the reasons
            can move it.
          </p>
          <p className="m-0 text-[var(--muted-foreground)]">
            <em>Scores are illustrative placeholders; the live scoring engine is on the roadmap, not
            running yet.</em> For the definition and two-score model see{' '}
            <Link href="/Interests" className="text-[var(--accent)] hover:underline">Interest</Link>;
            for how the reasons are scored see{' '}
            <Link href="/ReasonRank" className="text-[var(--accent)] hover:underline">ReasonRank</Link>.
            This page applies that model, it does not restate it.
          </p>
        </div>
      </div>

      {/* Scope 2 */}
      <div>
        <h4 className="text-sm font-semibold mb-1">Scope 2: More or Less Valid Than Other Interests, In General?</h4>
        <p className="text-xs text-[var(--muted-foreground)] mb-2">
          The comparative question, scenario-independent. Name the natural rival interest. Start from
          the Maslow prior for each, then let the reasons adjust the ranking. If both start in the same
          band, that is exactly why the general ranking is close and the real fight moves to specific
          scenarios.
        </p>
        <ComparisonTable rows={debate.generalComparisons ?? []} />
        <p className="text-sm mt-3 mb-2">
          The comparative claim, &ldquo;this interest is more valid than the competing interest in
          general,&rdquo; then gets its own two columns:
        </p>
        <TwoColumnReasons
          leftTitle="Reasons this interest ranks higher"
          rightTitle="Reasons the other interest ranks higher"
          leftRows={debate.ranksHigherReasons ?? []}
          rightRows={debate.ranksLowerReasons ?? []}
        />
        <p className="text-sm mt-2">
          <strong>General ranking:</strong>{' '}
          {debate.generalRanking ?? (
            <span className="text-[var(--muted-foreground)] italic">
              [higher / lower / roughly tied] — if tied, neither dominates in the abstract, which tells
              you the disagreement lives in the scenarios below
            </span>
          )}
        </p>
      </div>

      {/* Scope 3 */}
      <div>
        <h4 className="text-sm font-semibold mb-1">Scope 3: Validity Within a Specific Conflict or Scenario</h4>
        <p className="text-xs text-[var(--muted-foreground)] mb-2">
          The contextual question, and the one that drives real conflict resolution. The same interest
          that is generally tied can clearly win in one scenario and clearly yield in another, because
          the scenario facts (imminence, scale, who else is present, reversibility) move the ranking.
        </p>
        <div className="space-y-4">
          {scenarios.map((scenario, i) => (
            <ScenarioBlock key={i} scenario={scenario} index={i} />
          ))}
        </div>
      </div>

      {/* Objective criteria for this interest's validity */}
      <div>
        <h4 className="text-sm font-semibold mb-1">Objective Criteria for This Interest&apos;s Validity</h4>
        <p className="text-xs text-[var(--muted-foreground)] mb-2">
          The clear, testable criteria a neutral party would use to judge this interest&apos;s
          validity, so the debate stays anchored to standards instead of sympathy. These feed the
          reasons in all three scopes above.
        </p>
        <ul className="list-disc list-inside text-sm space-y-1">
          {objectiveCriteria.length > 0 ? (
            objectiveCriteria.map((c, i) => <li key={i}>{c}</li>)
          ) : (
            <>
              <li className="text-[var(--muted-foreground)] italic">
                [criterion, e.g. whether the same interest, exercised universally, remains sustainable]
              </li>
              <li className="text-[var(--muted-foreground)] italic">
                [criterion, e.g. the number of people whose basic security genuinely depends on it]
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}

export default function InterestValiditySection({ debates }: InterestValiditySectionProps) {
  const data = debates.length > 0 ? debates : [PLACEHOLDER_DEBATE]

  return (
    <div>
      <h3 className="text-base font-semibold mb-1">Interest Validity Debate</h3>
      <p className="text-xs text-[var(--muted-foreground)] italic mb-3">
        When an interest&apos;s validity is itself the fight, it gets its own pro/con tree at three
        scopes — valid at all, more or less valid than other interests in general, and valid within a
        specific conflict. Validity is set by the scored reasons, nothing else. See the{' '}
        <Link href="/Interests" className="text-[var(--accent)] hover:underline">Interest</Link>{' '}
        two-score model.
      </p>
      <div className="space-y-8">
        {data.map((debate, i) => (
          <DebateBlock key={i} debate={debate} />
        ))}
      </div>
    </div>
  )
}
