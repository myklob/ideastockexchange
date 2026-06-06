import type { DebateAbstractionRung } from '@/core/types/debate-topic';

interface Props {
  rungs: DebateAbstractionRung[];
  topicTitle: string;
}

export default function Spectrum4AbstractionLadder({ rungs, topicTitle }: Props) {
  return (
    <div id="specificity" className="mb-8">
      <h2 className="text-xl font-bold mb-1">
        🧩 Continuum 3: Specificity, the Abstraction Ladder{' '}
        <a href="/general-to-specific" className="text-base font-normal text-blue-600 hover:underline">
          (General ↔ Specific)
        </a>
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        How concrete a claim is. The same topic supports claims at very different altitudes, from a sweeping worldview
        down to a single line-item policy, and these are genuinely different claims that need separate scoring. Two
        people can agree at the top of the ladder and split at the bottom, or disagree about first principles and still
        converge on the same specific reform. Mapping the rungs is what lets the engine match a broad principle to a
        broad principle without falsely merging it with a narrow policy that happens to lean the same direction.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 w-[15%]">Rung</th>
              <th className="border border-gray-300 px-3 py-2 w-[42%]">Pro-{topicTitle} Chain</th>
              <th className="border border-gray-300 px-3 py-2 w-[43%]">Anti-{topicTitle} Chain</th>
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
