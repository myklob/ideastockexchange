import type { DebateEscalation } from '@/core/types/debate-topic';

interface Props {
  escalationLevels: DebateEscalation[];
  topicTitle: string;
}

const ROW_COLORS = [
  'bg-green-50',
  'bg-green-100',
  'bg-yellow-100',
  'bg-yellow-200',
  'bg-orange-200',
  'bg-red-200',
];

export default function Spectrum3Escalation({ escalationLevels, topicTitle }: Props) {
  // Determine whether we have per-side data (pro/antiDescription populated)
  const hasPerSideData = escalationLevels.some(
    (e) => e.proDescription && e.proDescription.trim().length > 0
  );

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">
        ⚡ Spectrum 3: Civic Engagement Level{' '}
        <a href="/escalation-spectrum" className="text-base font-normal text-blue-600 hover:underline">
          (Passive ↔ Active)
        </a>
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        This captures how actively someone is willing to act on their position — not how extreme their
        belief is (Spectrum 2) or which direction it runs (Spectrum 1). Two people can hold identical
        beliefs at identical magnitudes and still differ enormously in how much they are willing to
        sacrifice to advance them. Mapping this dimension separately prevents the ISE from conflating
        conviction with action, and action with extremism.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 w-[18%]">Engagement Level</th>
              {hasPerSideData ? (
                <>
                  <th className="border border-gray-300 px-3 py-2 w-[22%]">
                    Pro-{topicTitle}: What It Looks Like
                  </th>
                  <th className="border border-gray-300 px-3 py-2 w-[22%]">
                    Anti-{topicTitle}: What It Looks Like
                  </th>
                  <th className="border border-gray-300 px-3 py-2 w-[19%]">
                    Pro-Topic Example
                  </th>
                  <th className="border border-gray-300 px-3 py-2 w-[19%]">
                    Anti-Topic Example
                  </th>
                </>
              ) : (
                <>
                  <th className="border border-gray-300 px-3 py-2 w-[33%]">
                    What It Looks Like on This Topic
                  </th>
                  <th className="border border-gray-300 px-3 py-2 w-[27%]">Example</th>
                  <th className="border border-gray-300 px-3 py-2 w-[22%]">Which Principles Are Still Honored</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {escalationLevels.map((row, i) => (
              <tr key={row.level} className={ROW_COLORS[i] ?? ''}>
                <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                  <strong>{row.level}. {row.levelLabel}</strong>
                  <br />
                  <span className="text-xs font-normal text-gray-600">{row.description}</span>
                </td>
                {hasPerSideData ? (
                  <>
                    <td className="border border-gray-300 px-3 py-2 text-gray-700 text-xs">
                      {row.proDescription || row.description}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-700 text-xs">
                      {row.antiDescription || row.description}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-600 text-xs italic">
                      {row.proExample || row.example}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-600 text-xs italic">
                      {row.antiExample || row.example}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border border-gray-300 px-3 py-2">{row.description}</td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-700">{row.example}</td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-600 text-xs">{row.principles}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-600 mt-3">
        <strong>Key insight:</strong> The three spectrums are fully independent. Someone can hold a
        moderate-magnitude claim (Spectrum 2 = 50%) about a cause they feel lukewarm about
        (Spectrum 1 = +40%) and still be willing to go to prison for it (Spectrum 3 = Level 4).
        Plotting a coordinate on each spectrum is what lets the system match beliefs accurately rather
        than bundling very different positions together.{' '}
        {escalationLevels.length > 4 && (
          <>
            For engagement beyond Level 4, see:{' '}
            <a href="/escalation-spectrum" className="text-blue-600 hover:underline">Escalation Spectrum</a>.
          </>
        )}
      </p>
      <p className="text-right text-xs mt-2 text-gray-500">
        See: <a href="/escalation-spectrum" className="text-blue-600 hover:underline">Escalation Spectrum Full Explanation</a>
      </p>
    </div>
  );
}
