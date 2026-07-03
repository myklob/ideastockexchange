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
        Not a fourth axis. Continuum 3 sorts beliefs by altitude; this takes each stance and lists the
        assumptions a person must accept to hold it, which is how a fight at the bottom gets traced to its
        real root higher up.
        {keyInsight && (
          <>
            {' '}<strong className="text-gray-800">Core split:</strong> {keyInsight}
          </>
        )}
        {' '}<span className="text-gray-500">
          See: <a href="/Assumptions" className="text-blue-600 hover:underline">Assumptions</a>.
        </span>
      </p>
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
