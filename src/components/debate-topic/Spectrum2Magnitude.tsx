import Link from 'next/link';
import type { DebateClaimMagnitude } from '@/core/types/debate-topic';

// Canonical band names per the topic template: Weak / Moderate / Strong / Extreme.
// Older rows were stored as "Modest (20%)" … "Total (100%)" with "X Assertion"
// sublabels; normalize at render so every topic shows the current canon.
const LEVEL_RENAMES: Record<string, string> = {
  'Modest (20%)': 'Weak (20%)',
  'Total (100%)': 'Extreme (100%)',
};

const SUBLABEL_RENAMES: Record<string, string> = {
  'Modest Assertion': 'Hedged',
  Modest: 'Hedged',
  'Standard Assertion': 'Standard',
  'Broad Assertion': 'Categorical',
  Broad: 'Categorical',
  'Maximal Assertion': 'Maximal',
};

function canonicalLevel(level: string): string {
  return LEVEL_RENAMES[level] ?? level;
}

function canonicalSublabel(sublabel: string): string {
  return SUBLABEL_RENAMES[sublabel] ?? sublabel;
}

// Generic fallback rows used when no DB-backed data is available for a topic.
// Each row describes what a belief *sounds like* at that strength, on either side.
const GENERIC_MAGNITUDE_ROWS = [
  {
    magnitudeLevel: 'Weak (20%)',
    sublabel: 'Hedged',
    proExample: (topic: string) => `${topic} can be a useful tool in some cases.`,
    antiExample: (topic: string) => `${topic} may not be the best tool here.`,
    scopeDescription: 'Narrow. Acknowledges exceptions.',
  },
  {
    magnitudeLevel: 'Moderate (50%)',
    sublabel: 'Standard',
    proExample: (topic: string) => `${topic} is clearly better than the alternatives in most cases.`,
    antiExample: (topic: string) => `${topic} fails to deliver what its supporters claim.`,
    scopeDescription: 'Definite but bounded. Most defensible level.',
  },
  {
    magnitudeLevel: 'Strong (80%)',
    sublabel: 'Categorical',
    proExample: (topic: string) => `${topic} is fundamentally the right approach.`,
    antiExample: (topic: string) => `${topic} is fundamentally the wrong approach.`,
    scopeDescription: 'Wide. Little room for exceptions.',
  },
  {
    magnitudeLevel: 'Extreme (100%)',
    sublabel: 'Maximal',
    proExample: (topic: string) => `${topic} is the only acceptable option, everywhere, always.`,
    antiExample: (topic: string) => `${topic} has never once worked and never will.`,
    scopeDescription: 'Catastrophic framing, no limits. Easy to dismiss.',
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
      <h2 className="text-xl font-bold mb-1">3. Claim Magnitude (Weak ↔ Strong)</h2>
      <p className="text-sm text-gray-600 mb-4">
        How extreme is the phrasing of a claim, independent of which direction it runs and independent of
        whether it&apos;s true? A weak pro claim and a weak anti claim are both modest assertions. The
        Belief Score, computed elsewhere, tells you how well-supported a claim is. This dimension just
        identifies its structural reach so equivalent claims can be matched and grouped. See{' '}
        <Link href="/algorithms/strong-to-weak" className="text-blue-600 hover:underline">
          Magnitude Spectrum
        </Link>.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-[#f0f3f6]">
              <th className="border border-gray-300 px-3 py-2 w-[18%]">Magnitude</th>
              <th className="border border-gray-300 px-3 py-2 w-[33%]">Pro-Topic Example</th>
              <th className="border border-gray-300 px-3 py-2 w-[33%]">Anti-Topic Example</th>
              <th className="border border-gray-300 px-3 py-2 w-[16%]">Scope</th>
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
      <div className="bg-[#eef5ff] p-3 border-l-4 border-[#36c] mt-3 text-sm">
        <strong>Why this matters.</strong> The strongest real arguments on either side typically operate
        at Moderate magnitude. Engaging only with the Extreme version of an opposing claim is a straw man.
        The platform requires engaging the best version of the opposing argument, not the loudest.
      </div>
    </div>
  );
}
