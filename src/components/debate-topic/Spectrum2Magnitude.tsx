const MAGNITUDE_ROWS = [
  {
    label: 'Weak (20%)',
    sublabel: 'Modest Assertion',
    lookLike: (topic: string) =>
      `"${topic.charAt(0).toUpperCase() + topic.slice(1)} may offer some advantages for certain people in certain circumstances."`,
    scope: 'Narrow scope. Acknowledges exceptions. Easy to defend, rarely contested.',
  },
  {
    label: 'Moderate (50%)',
    sublabel: 'Standard Assertion',
    lookLike: (topic: string) =>
      `"${topic.charAt(0).toUpperCase() + topic.slice(1)} generally produces measurable outcomes that differ from alternatives."`,
    scope: 'Definite but bounded. The most debatable and productive level of claim.',
  },
  {
    label: 'Strong (80%)',
    sublabel: 'Broad Assertion',
    lookLike: (topic: string) =>
      `"${topic.charAt(0).toUpperCase() + topic.slice(1)} is the single most important factor for the outcomes in question."`,
    scope: 'Wide scope, categorical. Requires strong comparative evidence across alternatives.',
  },
  {
    label: 'Extreme (100%)',
    sublabel: 'Maximal Assertion',
    lookLike: () =>
      '"This must be abolished immediately" / "This is irredeemably harmful and must be universally mandated."',
    scope: 'Catastrophic or absolute framing. Hardest to defend rigorously; easiest to dismiss rhetorically.',
  },
];

interface Props {
  topicTitle: string;
}

export default function Spectrum2Magnitude({ topicTitle }: Props) {
  const lower = topicTitle.toLowerCase();

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">
        💪 Spectrum 2: Claim Magnitude{' '}
        <span className="text-base font-normal text-gray-600">(Weak ↔ Strong)</span>
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        How extreme or absolute the phrasing is — independent of whether the claim is true. Both "this has some benefits" and "this is the cornerstone of civilization" can be positive (Spectrum 1), but they assert very different things. The <strong>Belief Score</strong> separately indicates how well-supported each claim actually is.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 w-[20%]">Claim Magnitude</th>
              <th className="border border-gray-300 px-3 py-2 w-[45%]">What It Looks Like ({topicTitle} Examples)</th>
              <th className="border border-gray-300 px-3 py-2 w-[35%]">Scope of the Assertion</th>
            </tr>
          </thead>
          <tbody>
            {MAGNITUDE_ROWS.map((row) => (
              <tr key={row.label} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                  <strong>{row.label}</strong>
                  <br />
                  <span className="text-xs font-normal text-gray-600">{row.sublabel}</span>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">
                  {row.lookLike(lower)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-gray-600">{row.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-right text-xs mt-2 text-gray-500">
        See: <a href="/strong-to-weak" className="text-blue-600 hover:underline">Why We Need This Spectrum</a>
      </p>
    </div>
  );
}
