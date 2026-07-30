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

function ScenarioBlock({ scenario, index }: { scenario: InterestScenarioItem | null; index: number }) {
  return (
    <div className="border border-gray-200 rounded p-4 space-y-3">
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
                  <span className="text-[var(--muted-foreground)] italic">[e.g. the harm is imminent and irreversible]</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-sm">
        The scenario claim, &ldquo;in this conflict, this interest should outrank the competing
        interest,&rdquo; gets its two columns:
      </p>
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
          A near-tie here often marks a compromise candidate: a place where a small, achievable
          change to the scenario facts would flip which interest wins.
        </p>
      )}
    </div>
  )
}

function DebateBlock({ debate }: { debate: InterestValidityDebate }) {
  const scenarios: Array<InterestScenarioItem | null> =
    debate.scenarios && debate.scenarios.length > 0 ? debate.scenarios : [null]
  const objectiveCriteria = debate.objectiveCriteria ?? []

  return (
    <div className="space-y-6 border-l-2 border-gray-200 pl-4">
      <div>
        <p className="text-sm">
          <strong>The interest:</strong>{' '}
          {debate.interest ? (
            debate.interest
          ) : (
            <span className="text-[var(--muted-foreground)] italic">
              [state it as a need, fear, or desire, e.g. &ldquo;I need to feel my neighborhood is safe&rdquo;]
            </span>
          )}
        </p>
        <ul className="text-xs text-[var(--muted-foreground)] list-disc list-inside mt-2 space-y-1">
          <li><strong>Default:</strong> treat the interest as valid until an argument lowers it. The burden is on the challenge.</li>
          <li><strong>Both sides are rational:</strong> assume each side holds its interest for reasons tied to a real need.</li>
          <li><strong>Arguments set the score:</strong> validity traces entirely to the scored reasons below, never to who holds the interest or how loudly they assert it.</li>
          <li><strong>Maslow is a prior, not a verdict:</strong> the reasons below can move the starting band up or down.</li>
        </ul>
      </div>

      {/* Scope 1 */}
      <div>
        <h4 className="text-sm font-semibold mb-1">Scope 1: Is This Interest Valid At All?</h4>
        <p className="text-xs text-[var(--muted-foreground)] mb-2">
          The absolute question. Each reason is a scored argument, named by its opening words and
          attached to the criterion it leans on.
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
      </div>

      {/* Scope 2 */}
      <div>
        <h4 className="text-sm font-semibold mb-1">Scope 2: More or Less Valid Than Other Interests, In General?</h4>
        <p className="text-xs text-[var(--muted-foreground)] mb-2">
          The comparative question, scenario-independent. Start from the Maslow prior, then let the
          reasons adjust the ranking.
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
              [this interest above / below / tied with the comparison], by [XX] points
            </span>
          )}
        </p>
      </div>

      {/* Scope 3 */}
      <div>
        <h4 className="text-sm font-semibold mb-1">Scope 3: Validity Within a Specific Conflict or Scenario</h4>
        <p className="text-xs text-[var(--muted-foreground)] mb-2">
          The contextual question, and the one that drives real conflict resolution. An interest that
          is generally valid can rank differently once a concrete scenario sets the facts.
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
          validity. These feed the reasons in all three scopes above.
        </p>
        <ul className="list-disc list-inside text-sm space-y-1">
          {objectiveCriteria.length > 0 ? (
            objectiveCriteria.map((c, i) => <li key={i}>{c}</li>)
          ) : (
            <>
              <li className="text-[var(--muted-foreground)] italic">
                [criterion, e.g. &ldquo;number of people whose basic security depends on it&rdquo;]
              </li>
              <li className="text-[var(--muted-foreground)] italic">
                [criterion, e.g. &ldquo;whether the same interest, applied universally, is sustainable&rdquo;]
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
        Interest{' '}
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
