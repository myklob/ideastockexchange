import React from 'react';
import { Belief } from '@/core/types/ise';
import { sortBeliefsByIntensity, getIntensityLabel, formatScore } from '@/shared/utils';

interface ConfidenceScaleProps {
  beliefs: Belief[];
}

export default function ConfidenceScale({ beliefs }: ConfidenceScaleProps) {
  const sortedBeliefs = sortBeliefsByIntensity(beliefs);

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold mb-4">
        Dimension 2: Weak → Strong (The Confidence Scale)
      </h3>
      <p className="text-gray-700 mb-4">
        Sort beliefs by intensity. Note that the strongest claims often have lower scores because
        they require a higher burden of proof. This dimension helps users distinguish between
        nuanced reality and dogmatic extremism.
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 border-b text-left font-semibold">Belief Statement</th>
              <th className="px-6 py-3 border-b text-center font-semibold">Intensity</th>
              <th className="px-6 py-3 border-b text-center font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedBeliefs.map((belief) => (
              <tr key={belief.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b">&quot;{belief.statement}&quot;</td>
                <td className="px-6 py-4 border-b text-center">
                  {belief.intensityPercentage}% ({getIntensityLabel(belief.intensity)})
                </td>
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
