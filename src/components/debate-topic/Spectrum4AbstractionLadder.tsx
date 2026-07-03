import type { DebateAbstractionRung } from '@/core/types/debate-topic';

interface Props {
  rungs: DebateAbstractionRung[];
  topicTitle: string;
}

/**
 * Continuum 3: the general-to-specific tree. A general (worldview) belief
 * branches into subcategories, and each subcategory holds the specific beliefs
 * beneath it. A belief only merges with another that shares its branch AND its
 * rung. Rows seeded before branching existed carry rungType "rung" and render
 * as the old flat ladder.
 */
function TreeRows({ rungs }: { rungs: DebateAbstractionRung[] }) {
  const generals = rungs.filter((r) => r.rungType === 'general');
  const rest = rungs.filter((r) => r.rungType !== 'general');

  // Subcategory rows use ├─ except the last branch, which uses └─.
  const lastSubcategoryIndex = rest.reduce(
    (last, r, i) => (r.rungType === 'subcategory' ? i : last),
    -1,
  );

  return (
    <>
      {generals.map((rung) => (
        <tr key={rung.sortOrder} className="hover:bg-gray-50">
          <td className="border border-gray-300 px-3 py-2 bg-[#eef3f8]">
            <strong>Most General</strong>
            <br />
            <span className="text-xs font-normal text-gray-600">(Worldview)</span>
          </td>
          <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">&ldquo;{rung.proChain}&rdquo;</td>
          <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">&ldquo;{rung.conChain}&rdquo;</td>
        </tr>
      ))}
      {generals.length > 0 && rest.length > 0 && (
        <tr>
          <td className="border border-gray-300 px-3 py-1.5 text-center text-xs text-gray-500" colSpan={3}>
            the general belief branches into subcategories ↓
          </td>
        </tr>
      )}
      {rest.map((rung, i) => {
        if (rung.rungType === 'subcategory') {
          const connector = i === lastSubcategoryIndex ? '└─' : '├─';
          return (
            <tr key={rung.sortOrder} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2 bg-[#f4f9ff]">
                <strong>{connector} {rung.branchName ?? 'Subcategory'}</strong>
                {rung.rungLabel && (
                  <>
                    <br />
                    <span className="text-xs font-normal text-gray-600">{rung.rungLabel}</span>
                  </>
                )}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">&ldquo;{rung.proChain}&rdquo;</td>
              <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">&ldquo;{rung.conChain}&rdquo;</td>
            </tr>
          );
        }
        return (
          <tr key={rung.sortOrder} className="hover:bg-gray-50">
            <td className="border border-gray-300 px-3 py-2 pl-8 text-gray-600">
              └─ <em>Specific</em>
            </td>
            <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">&ldquo;{rung.proChain}&rdquo;</td>
            <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">&ldquo;{rung.conChain}&rdquo;</td>
          </tr>
        );
      })}
    </>
  );
}

function LadderRows({ rungs }: { rungs: DebateAbstractionRung[] }) {
  return (
    <>
      {rungs.map((rung, i) => (
        <tr key={rung.sortOrder} className="hover:bg-gray-50">
          <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
            {i === 0 ? <strong>Most General</strong> : i === rungs.length - 1 ? <strong>Most Specific</strong> : ''}
            <br />
            <span className="text-xs font-normal text-gray-600">{rung.rungLabel}</span>
          </td>
          <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">&ldquo;{rung.proChain}&rdquo;</td>
          <td className="border border-gray-300 px-3 py-2 text-gray-700 italic">&ldquo;{rung.conChain}&rdquo;</td>
        </tr>
      ))}
    </>
  );
}

export default function Spectrum4AbstractionLadder({ rungs, topicTitle }: Props) {
  const hasTree = rungs.some((r) => r.rungType && r.rungType !== 'rung');

  return (
    <div id="specificity" className="mb-8">
      <h2 className="text-xl font-bold mb-1">
        🌳 Continuum 3: General to Specific, with Branching Subcategories{' '}
        <a href="/general-to-specific" className="text-base font-normal text-blue-600 hover:underline">
          (General ↔ Specific)
        </a>
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        The same topic holds claims at every altitude, from a sweeping worldview down to one line-item
        policy. A general belief <strong>branches</strong> into subcategories, and each subcategory holds
        the specific beliefs beneath it. A belief only merges with another that shares its branch{' '}
        <em>and</em> its rung, so a worldview never gets double-counted with the policy it implies. A
        subcategory that outgrows a row graduates to its own child page (see{' '}
        <a href="#related" className="text-blue-600 hover:underline">Related Topics</a>).
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 w-[24%]">Rung / Branch</th>
              <th className="border border-gray-300 px-3 py-2 w-[38%]">Pro-{topicTitle} Belief</th>
              <th className="border border-gray-300 px-3 py-2 w-[38%]">Anti-{topicTitle} Belief</th>
            </tr>
          </thead>
          <tbody>
            {hasTree ? <TreeRows rungs={rungs} /> : <LadderRows rungs={rungs} />}
          </tbody>
        </table>
      </div>
      <p className="text-right text-xs mt-2 text-gray-500">
        See: <a href="/general-to-specific" className="text-blue-600 hover:underline">General to Specific Framework</a>
      </p>
    </div>
  );
}
