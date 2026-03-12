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
        📜 Foundational Assumptions: What You Must Believe at Each Position
      </h2>
      {keyInsight && (
        <p className="mb-3 text-sm">
          <strong>Key Insight:</strong> {keyInsight}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 w-[18%]">To Hold Position</th>
              <th className="border border-gray-300 px-3 py-2">You Must Believe These Assumptions (Ordered General → Specific)</th>
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
