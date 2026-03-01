import type { DebateAbstractionRung } from '@/core/types/debate-topic';

interface Props {
  rungs: DebateAbstractionRung[];
  topicTitle: string;
}

export default function Spectrum4AbstractionLadder({ rungs, topicTitle }: Props) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">
        🪜 Spectrum 4: The Abstraction Ladder{' '}
        <span className="text-base font-normal text-gray-600">(General ↔ Specific)</span>
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Shows how general worldviews cascade into specific positions on {topicTitle.toLowerCase()} policy.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 w-[18%]">Level</th>
              <th className="border border-gray-300 px-3 py-2 w-[41%]">Pro-{topicTitle} Assumption Chain</th>
              <th className="border border-gray-300 px-3 py-2 w-[41%]">Skeptical/Anti-{topicTitle} Assumption Chain</th>
            </tr>
          </thead>
          <tbody>
            {rungs.map((rung, i) => (
              <>
                <tr key={rung.sortOrder} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                    {i === 0 ? <strong>Most General</strong> : i === rungs.length - 1 ? <strong>Most Specific</strong> : ''}
                    <br />
                    <span className="text-xs font-normal text-gray-600">{rung.rungLabel}</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">
                    &ldquo;{rung.proChain}&rdquo;
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">
                    &ldquo;{rung.conChain}&rdquo;
                  </td>
                </tr>
                {i < rungs.length - 1 && (
                  <tr key={`arrow-${rung.sortOrder}`} className="bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-400">↓</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-400">↓</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-400">↓</td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-right text-xs mt-2 text-gray-500">
        See: <a href="/general-to-specific" className="text-blue-600 hover:underline">General to Specific Framework</a>
      </p>
    </div>
  );
}
