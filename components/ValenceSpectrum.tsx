import React from 'react';
import { Belief } from '@/types';
import { sortBeliefsByValence, getValenceLabel, getValenceColor, formatScore } from '@/lib/utils';

interface ValenceSpectrumProps {
  beliefs: Belief[];
}

export default function ValenceSpectrum({ beliefs }: ValenceSpectrumProps) {
  const sortedBeliefs = sortBeliefsByValence(beliefs);

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold mb-4">
        Dimension 3: Negative → Positive (The Valence Spectrum)
      </h3>
      <p className="text-gray-700 mb-4">
        View the full spectrum of positions in one view. Instead of a binary "Pro/Con," we map
        the nuance of the debate, allowing users to find the exact point where they stand.
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 border-b text-left font-semibold">Position</th>
              <th className="px-6 py-3 border-b text-left font-semibold">Belief Statement</th>
              <th className="px-6 py-3 border-b text-center font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedBeliefs.map((belief) => (
              <tr key={belief.id} className="hover:bg-gray-50">
                <td className={`px-6 py-4 border-b font-semibold ${getValenceColor(belief.valence)}`}>
                  {getValenceLabel(belief.valence)}
                </td>
                <td className="px-6 py-4 border-b">&quot;{belief.statement}&quot;</td>
                <td className="px-6 py-4 border-b text-center font-bold">
                  {formatScore(belief.score)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
