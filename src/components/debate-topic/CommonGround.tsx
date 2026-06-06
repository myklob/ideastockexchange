import type { DebateCommonGround } from '@/core/types/debate-topic';

interface Props {
  commonGround: DebateCommonGround;
}

export default function CommonGround({ commonGround }: Props) {
  const valueConflicts = commonGround.valueConflicts ?? [];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">
        🤝 Common Ground and Compromise
      </h2>
      <p className="text-sm text-gray-600 mb-3">
        Once both sides&apos; costs and benefits are scored under Cost-Benefit Analysis, the same scored trees read
        sideways and three things fall out automatically. This is the conflict readout, not an editor&apos;s guess at
        where people might get along.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100 align-top">
              <th className="border border-gray-300 px-3 py-2 w-1/3">
                Shared Interests
                <br />
                <span className="text-xs font-normal text-gray-500">Impacts both sides actually want</span>
              </th>
              <th className="border border-gray-300 px-3 py-2 w-1/3">
                Real Value Conflicts
                <br />
                <span className="text-xs font-normal text-gray-500">
                  Where one side prices freedom and the other prices safety
                </span>
              </th>
              <th className="border border-gray-300 px-3 py-2 w-1/3">
                Compromise Candidates
                <br />
                <span className="text-xs font-normal text-gray-500">
                  A small, achievable likelihood shift would flip a category&apos;s net
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-3 align-top">
                <ol className="list-decimal list-inside space-y-1">
                  {commonGround.agreements.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ol>
              </td>
              <td className="border border-gray-300 px-3 py-3 align-top">
                {valueConflicts.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {valueConflicts.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ol>
                ) : (
                  <span className="text-gray-400 text-xs">None listed</span>
                )}
              </td>
              <td className="border border-gray-300 px-3 py-3 align-top">
                <ol className="list-decimal list-inside space-y-1">
                  {commonGround.compromises.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ol>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="bg-blue-50 p-3 border-l-4 border-blue-700 mt-3 text-xs">
        <strong>Why this column matters:</strong> The Compromise Candidates are the winnable disagreements — the ones a
        small shift in likelihood can actually flip — as opposed to the symbolic value conflicts that no negotiation
        resolves. Pointing people at the tractable fights instead of the eternal ones is the payoff of scoring both
        sides with equal rigor.
      </div>
    </div>
  );
}
