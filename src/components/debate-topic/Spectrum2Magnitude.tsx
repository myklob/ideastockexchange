import type { DebateClaimMagnitude } from '@/core/types/debate-topic';

// Canonical band names per the topic template: Modest / Moderate / Strong / Total.
// Older rows were stored as "Weak (20%)" … "Extreme (100%)" with "X Assertion"
// sublabels; normalize at render so every topic shows the current canon.
const LEVEL_RENAMES: Record<string, string> = {
  'Weak (20%)': 'Modest (20%)',
  'Extreme (100%)': 'Total (100%)',
};

const SUBLABEL_RENAMES: Record<string, string> = {
  'Modest Assertion': 'Hedged',
  Modest: 'Hedged',
  'Standard Assertion': 'Standard',
  'Broad Assertion': 'Broad',
  'Maximal Assertion': 'Maximal',
};

function canonicalLevel(level: string): string {
  return LEVEL_RENAMES[level] ?? level;
}

function canonicalSublabel(sublabel: string): string {
  return SUBLABEL_RENAMES[sublabel] ?? sublabel;
}

// Generic fallback rows used when no DB-backed data is available for a topic.
// Each row describes what a belief *sounds like* at that strength, on either side,
// plus the telltale words that place it there.
const GENERIC_MAGNITUDE_ROWS = [
  {
    sortOrder: 0,
    magnitudeLevel: 'Modest (20%)',
    magnitudePercent: 20,
    sublabel: 'Hedged',
    proExample: (topic: string) =>
      `${topic} is somewhat good, openly admitting real flaws and exceptions.`,
    antiExample: (topic: string) =>
      `${topic} is somewhat bad, while conceding it works acceptably much of the time.`,
    scopeDescription: 'Narrow. Hedged with “some,” “tends to,” “in certain cases.”',
  },
  {
    sortOrder: 1,
    magnitudeLevel: 'Moderate (50%)',
    magnitudePercent: 50,
    sublabel: 'Standard',
    proExample: (topic: string) =>
      `${topic} is clearly better than the alternatives in most cases.`,
    antiExample: (topic: string) =>
      `${topic} is clearly worse than the alternatives in most cases.`,
    scopeDescription: 'Definite but bounded. “Clearly,” “generally.” Where most serious arguments live.',
  },
  {
    sortOrder: 2,
    magnitudeLevel: 'Strong (80%)',
    magnitudePercent: 80,
    sublabel: 'Broad',
    proExample: (topic: string) =>
      `${topic} is right across the board and the alternatives reliably fail.`,
    antiExample: (topic: string) =>
      `${topic} is wrong across the board and fails wherever it is tried.`,
    scopeDescription: 'Near-universal. “Across the board,” “fundamentally.” Little room for exceptions.',
  },
  {
    sortOrder: 3,
    magnitudeLevel: 'Total (100%)',
    magnitudePercent: 100,
    sublabel: 'Maximal',
    proExample: (topic: string) =>
      `${topic} is always right, everywhere, with no legitimate exception.`,
    antiExample: (topic: string) =>
      `${topic} is always wrong, has never once worked and never will.`,
    scopeDescription: 'Total, zero limits. “Always,” “never.” One counterexample sinks it.',
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
    <div id="magnitude" className="mb-8">
      <h2 className="text-xl font-bold mb-1">
        💪 Continuum 2: Claim Magnitude, How Absolute the Claim Is{' '}
        <a href="/strong-to-weak" className="text-base font-normal text-blue-600 hover:underline">
          (Modest ↔ Total)
        </a>
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        How absolute the claim is, from a hedged &ldquo;sometimes&rdquo; to a flat &ldquo;always,&rdquo;
        independent of which way it runs and of whether it is true. Two beliefs match on this axis when
        they are equally bold.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 w-[16%]">Claim Magnitude</th>
              <th className="border border-gray-300 px-3 py-2 w-[32%]">Pro Belief at This Strength</th>
              <th className="border border-gray-300 px-3 py-2 w-[32%]">Anti Belief at This Strength</th>
              <th className="border border-gray-300 px-3 py-2 w-[20%]">Scope &amp; Telltale Words</th>
            </tr>
          </thead>
          <tbody>
            {hasDbData
              ? claimMagnitudeLevels.map((row) => (
                  <tr key={row.sortOrder} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                      <strong>{canonicalLevel(row.magnitudeLevel)}</strong>
                      <br />
                      <span className="text-xs font-normal text-gray-600">{canonicalSublabel(row.sublabel)}</span>
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
                    <td className="border border-gray-300 px-3 py-2 text-gray-700">
                      {row.proExample(lower)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-700">
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
        <strong>Key insight:</strong> The strongest arguments on either side usually live at Moderate (50%),
        not Total (100%). Attacking only the Total versions is a straw man. Engage the best version of the
        opposing argument, not the loudest.
      </div>
      <p className="text-right text-xs mt-2 text-gray-500">
        See: <a href="/strong-to-weak" className="text-blue-600 hover:underline">Why We Need This Continuum</a>
      </p>
    </div>
  );
}
