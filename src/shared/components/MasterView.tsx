import React from 'react';
import { Belief } from '@/core/types/ise';
import {
  sortBeliefsByAbstraction,
  getAbstractionLabel,
  getIntensityLabel,
  getValenceLabel,
  getValenceColor,
  formatScore,
} from '@/shared/utils';

interface MasterViewProps {
  beliefs: Belief[];
  topicTitle: string;
}

export default function MasterView({ beliefs, topicTitle }: MasterViewProps) {
  const sortedBeliefs = sortBeliefsByAbstraction(beliefs);

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold mb-4">
        Putting It All Together: The Master View
      </h3>
      <p className="text-gray-700 mb-4">
        When we combine these dimensions, we get a complete picture of a topic. All statements
        regarding a subject—regardless of their tone or intensity—are merged into one page.
      </p>
      <p className="text-gray-700 mb-4">
        <strong>Topic:</strong> {topicTitle}
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-3 border-b text-left font-semibold">Hierarchy</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Intensity</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Valence</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Statement</th>
              <th className="px-4 py-3 border-b text-center font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedBeliefs.map((belief, index) => (
              <tr key={belief.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 border-b">
                  {index === 0
                    ? getAbstractionLabel(belief.abstractionLevel)
                    : `↓ ${getAbstractionLabel(belief.abstractionLevel)}`}
                </td>
                <td className="px-4 py-3 border-b">
                  {getIntensityLabel(belief.intensity)}
                </td>
                <td className={`px-4 py-3 border-b ${getValenceColor(belief.valence)}`}>
                  {getValenceLabel(belief.valence)}
                </td>
                <td className="px-4 py-3 border-b">&quot;{belief.statement}&quot;</td>
                <td className="px-4 py-3 border-b text-center font-bold">
                  {formatScore(belief.score)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-gray-600 italic mt-4">
        Result: A single page where you can find the best argument for the position you hold,
        or challenge yourself with the best argument for the opposing view.
      </p>
    </div>
  );
}
