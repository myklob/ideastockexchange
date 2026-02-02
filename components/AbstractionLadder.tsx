import React from 'react';
import { Belief } from '@/types';
import { sortBeliefsByAbstraction, getAbstractionLabel, formatScore } from '@/lib/utils';

interface AbstractionLadderProps {
  beliefs: Belief[];
}

export default function AbstractionLadder({ beliefs }: AbstractionLadderProps) {
  const sortedBeliefs = sortBeliefsByAbstraction(beliefs);

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold mb-4">
        Dimension 1: General → Specific (The Abstraction Ladder)
      </h3>
      <p className="text-gray-700 mb-4">
        Navigate up to see the broader principles or down to explore specific policy implementations.
        This prevents "category errors" where people argue about specific laws when they actually
        disagree on fundamental philosophy.
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 border-b text-left font-semibold">Level</th>
              <th className="px-6 py-3 border-b text-left font-semibold">Belief Statement</th>
              <th className="px-6 py-3 border-b text-center font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedBeliefs.map((belief, index) => (
              <tr key={belief.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b text-center font-medium">
                  {index === 0 ? (
                    <strong>{getAbstractionLabel(belief.abstractionLevel)}</strong>
                  ) : index === sortedBeliefs.length - 1 ? (
                    <strong>{getAbstractionLabel(belief.abstractionLevel)}</strong>
                  ) : (
                    '↓'
                  )}
                </td>
                <td className="px-6 py-4 border-b">&quot;{belief.statement}&quot;</td>
                <td className="px-6 py-4 border-b text-center font-semibold">
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
