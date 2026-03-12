import type { DebateClaimMagnitude } from '@/core/types/debate-topic';

// Generic fallback rows used when no DB-backed data is available for a topic
const GENERIC_MAGNITUDE_ROWS = [
  {
    sortOrder: 0,
    magnitudeLevel: 'Weak (20%)',
    magnitudePercent: 20,
    sublabel: 'Modest Assertion',
    proExample: (topic: string) =>
      `"${topic} has some advantages, though it has real flaws that need addressing."`,
    antiExample: (topic: string) =>
      `"${topic} has some structural inefficiencies that make it less effective than alternatives in certain contexts."`,
    scopeDescription: 'Narrow scope. Leaves room for exceptions and context-dependence.',
  },
  {
    sortOrder: 1,
    magnitudeLevel: 'Moderate (50%)',
    magnitudePercent: 50,
    sublabel: 'Standard Assertion',
    proExample: (topic: string) =>
      `"${topic}, when functioning well, produces significantly better outcomes than the available alternatives."`,
    antiExample: (topic: string) =>
      `"${topic} is significantly compromised by specific structural flaws, producing reliably suboptimal outcomes."`,
    scopeDescription: 'Clear claim without overstating. The level at which most serious academic arguments operate.',
  },
  {
    sortOrder: 2,
    magnitudeLevel: 'Strong (80%)',
    magnitudePercent: 80,
    sublabel: 'Broad Assertion',
    proExample: (topic: string) =>
      `"${topic} is the only approach that provides the key benefits in question, and any alternative is fundamentally unjust or ineffective."`,
    antiExample: (topic: string) =>
      `"${topic} is fundamentally broken and cannot produce good outcomes without changes so drastic it would cease to be recognizable."`,
    scopeDescription: 'Wide scope, absolute framing. Leaves little room for alternatives or incremental improvement.',
  },
  {
    sortOrder: 3,
    magnitudeLevel: 'Extreme (100%)',
    magnitudePercent: 100,
    sublabel: 'Maximal Assertion',
    proExample: () =>
      '"This is the pinnacle of human achievement in this domain and any deviation from it, however small, must be resisted by any means necessary."',
    antiExample: () =>
      '"This is a total fraud — a permanent mechanism of harm — that has never served its intended beneficiaries and never will."',
    scopeDescription: 'Catastrophic framing with no limiting conditions. The hardest to defend and the easiest to dismiss without engaging the moderate arguments.',
  },
];

interface Props {
  topicTitle: string;
  claimMagnitudeLevels?: DebateClaimMagnitude[];
}

export default function Spectrum2Magnitude({ topicTitle, claimMagnitudeLevels }: Props) {
  const lower = topicTitle.charAt(0).toUpperCase() + topicTitle.slice(1).toLowerCase();

  // Use DB-backed data if available, otherwise fall back to generic templates
  const hasDbData = claimMagnitudeLevels && claimMagnitudeLevels.length > 0;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">
        💪 Spectrum 2: Claim Magnitude{' '}
        <a href="/strong-to-weak" className="text-base font-normal text-blue-600 hover:underline">
          (Weak ↔ Strong)
        </a>
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        This spectrum captures how extreme or absolute the phrasing of a claim is, independent of whether it is true and
        independent of which direction the claim runs. A weak pro-topic claim and a weak anti-topic claim are both modest
        assertions — they just point in opposite directions. The <strong>Belief Score</strong>, calculated dynamically
        from linked pro and con sub-arguments, separately indicates how well-supported any given claim actually is.
        Spectrum 2 just identifies the structural magnitude of the assertion so that equivalent claims can be matched
        and grouped correctly.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 w-[18%]">Claim Magnitude</th>
              <th className="border border-gray-300 px-3 py-2 w-[35%]">Pro-Topic Example</th>
              <th className="border border-gray-300 px-3 py-2 w-[35%]">Anti-Topic Example</th>
              <th className="border border-gray-300 px-3 py-2 w-[12%]">Scope</th>
            </tr>
          </thead>
          <tbody>
            {hasDbData
              ? claimMagnitudeLevels.map((row) => (
                  <tr key={row.sortOrder} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                      <strong>{row.magnitudeLevel}</strong>
                      <br />
                      <span className="text-xs font-normal text-gray-600">{row.sublabel}</span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-700">
                      {row.proExample}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-700">
                      {row.antiExample}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-600 text-xs">
                      {row.scopeDescription}
                    </td>
                  </tr>
                ))
              : GENERIC_MAGNITUDE_ROWS.map((row) => (
                  <tr key={row.magnitudeLevel} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                      <strong>{row.magnitudeLevel}</strong>
                      <br />
                      <span className="text-xs font-normal text-gray-600">{row.sublabel}</span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">
                      {row.proExample(lower)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">
                      {row.antiExample(lower)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-600 text-xs">
                      {row.scopeDescription}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <div className="bg-blue-50 p-3 border-l-4 border-blue-700 mt-3 text-xs">
        <strong>Key insight:</strong> The strongest arguments on either side typically operate at Moderate (50%)
        magnitude, not Extreme (100%). Dismissing opposition by attacking only the Extreme (100%) versions is a straw
        man. The ISE requires engaging with the best version of the opposing argument, not the loudest one.
      </div>
      <p className="text-right text-xs mt-2 text-gray-500">
        See: <a href="/strong-to-weak" className="text-blue-600 hover:underline">Why We Need This Spectrum</a>
      </p>
    </div>
  );
}
