import { Fragment } from 'react';
import type { DebateAbstractionRung } from '@/core/types/debate-topic';

interface Props {
  rungs: DebateAbstractionRung[];
  topicTitle: string;
}

// Section 6: the abstraction ladder. The same upstream worldview generates many
// downstream policy positions; each rung renders as a row with a ↓ connector to
// the next. Rows keep whatever rungLabel they were authored with (canonical
// chain: Worldview → Political principle → Position on this topic → Specific
// policy); rows from the retired branching-tree era fall back to branchName.
function rungDisplayLabel(rung: DebateAbstractionRung): string {
  return rung.rungLabel || rung.branchName || 'Specific policy';
}

export default function AbstractionLadder({ rungs, topicTitle }: Props) {
  return (
    <div id="specificity" className="mb-8">
      <h2 className="text-xl font-bold mb-1">6. The Abstraction Ladder (General ↔ Specific)</h2>
      <p className="text-sm text-gray-600 mb-4">
        The same upstream worldview can generate dozens of downstream policy positions. Tracing the chain
        makes explicit what is actually being argued about.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-[#f0f3f6]">
              <th className="border border-gray-300 px-3 py-2 w-[15%]">Level</th>
              <th className="border border-gray-300 px-3 py-2 w-[42%]">Pro-{topicTitle} Chain</th>
              <th className="border border-gray-300 px-3 py-2 w-[43%]">Anti-{topicTitle} Chain</th>
            </tr>
          </thead>
          <tbody>
            {rungs.map((rung, i) => (
              <Fragment key={rung.sortOrder}>
                {i > 0 && (
                  <tr>
                    <td className="border border-gray-300 px-3 py-1 text-center text-gray-500">↓</td>
                    <td className="border border-gray-300 px-3 py-1 text-center text-gray-500">↓</td>
                    <td className="border border-gray-300 px-3 py-1 text-center text-gray-500">↓</td>
                  </tr>
                )}
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <strong>{rungDisplayLabel(rung)}</strong>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">&ldquo;{rung.proChain}&rdquo;</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">&ldquo;{rung.conChain}&rdquo;</td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
