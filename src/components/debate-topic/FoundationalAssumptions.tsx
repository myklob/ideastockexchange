import type { DebateAssumption } from '@/core/types/debate-topic';

interface Props {
  assumptions: DebateAssumption[];
  keyInsight?: string;
}

const RANGE_BG: Record<string, string> = {
  '-100 to -50': 'bg-red-200',
  '-50 to -20': 'bg-red-100',
  '-20 to +20': 'bg-yellow-100',
  '+20 to +50': 'bg-green-100',
  '+50 to +100': 'bg-green-200',
};

export default function FoundationalAssumptions({ assumptions, keyInsight }: Props) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">
        📜 Assumption Stack Behind Each Position
      </h2>
      <p className="text-sm text-gray-600 mb-3">
        This is not a fourth continuum. It is the dependency map sitting under the Continuum 1 positions above. It
        answers a different question: to land at a given valence, what chain of assumptions do you have to accept, from
        broadest worldview down to the narrowest topic-specific claim? Surfacing the stack is how a disagreement at the
        bottom gets traced to its real root higher up, which is usually where the actual fight is.
      </p>
      {keyInsight && (
        <p className="mb-3 text-sm">
          <strong>Core split:</strong> {keyInsight}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 w-[15%]">To Hold Position</th>
              <th className="border border-gray-300 px-3 py-2">You Must Accept These Assumptions (General to Specific)</th>
            </tr>
          </thead>
          <tbody>
            {assumptions.map((a) => (
              <tr key={a.positionRange}>
                <td className={`border border-gray-300 px-3 py-2 text-center font-semibold ${RANGE_BG[a.positionRange] ?? ''}`}>
                  <strong>{a.positionRange}%</strong>
                  <br />
                  <span className="text-xs font-normal">({a.positionLabel})</span>
                </td>
                <td className={`border border-gray-300 px-3 py-2 ${RANGE_BG[a.positionRange] ?? ''}`}>
                  {a.assumptions.map((text, i) => (
                    <div key={i} className={i > 0 ? 'mt-1' : ''}>
                      {text}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
