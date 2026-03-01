import type { DebateEscalation } from '@/core/types/debate-topic';

interface Props {
  escalationLevels: DebateEscalation[];
  topicTitle: string;
}

const ROW_COLORS = [
  'bg-green-100',
  'bg-green-200',
  'bg-yellow-100',
  'bg-yellow-200',
  'bg-orange-200',
  'bg-red-200',
];

export default function Spectrum3Escalation({ escalationLevels, topicTitle }: Props) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">
        ⚡ Spectrum 3: Escalation{' '}
        <span className="text-base font-normal text-gray-600">(Preference ↔ Any Means Necessary)</span>
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        How many other principles someone is willing to violate to advance their position on {topicTitle.toLowerCase()}. A person can hold strong views (Spectrum 1 = +100%) and still refuse to act outside democratic and legal process. Willingness to escalate says nothing about whether the underlying belief is correct.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 w-[18%]">Level</th>
              <th className="border border-gray-300 px-3 py-2 w-[28%]">What It Looks Like on This Topic</th>
              <th className="border border-gray-300 px-3 py-2 w-[32%]">Example</th>
              <th className="border border-gray-300 px-3 py-2 w-[22%]">Which Principles Are Still Honored</th>
            </tr>
          </thead>
          <tbody>
            {escalationLevels.map((row, i) => (
              <tr key={row.level} className={ROW_COLORS[i] ?? ''}>
                <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                  <strong>{row.level}. {row.levelLabel}</strong>
                </td>
                <td className="border border-gray-300 px-3 py-2">{row.description}</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-700">{row.example}</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-600 text-xs">{row.principles}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-red-50 p-3 border-l-4 border-red-600 mt-3 text-xs">
        <strong>Key insight:</strong> Most people engaged in the {topicTitle.toLowerCase()} debate — on all sides — operate at Levels 1 and 2. The system distinguishes these positions not to equate them morally, but to accurately map where different actors actually sit and avoid misrepresenting normal advocacy as extremism.
      </div>
      <p className="text-right text-xs mt-2 text-gray-500">
        See: <a href="/escalation-spectrum" className="text-blue-600 hover:underline">Escalation Spectrum Full Explanation</a>
      </p>
    </div>
  );
}
