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
        The scored <a href="/w/page/156187122/cost-benefit%20analysis" className="text-blue-600 hover:underline">cost-benefit</a>{' '}
        trees read sideways. Compromise Candidates are the winnable disagreements, the ones a small
        likelihood shift can flip, as opposed to the symbolic value conflicts no negotiation resolves. That
        is the payoff of scoring both sides with equal rigor.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100 align-top">
              <th className="border border-gray-300 px-3 py-2 w-1/3">
                Shared Interests
                <br />
                <span className="text-xs font-normal text-gray-500">Impacts both sides want</span>
              </th>
              <th className="border border-gray-300 px-3 py-2 w-1/3">
                Real Value Conflicts
                <br />
                <span className="text-xs font-normal text-gray-500">
                  One side prices freedom, the other safety
                </span>
              </th>
              <th className="border border-gray-300 px-3 py-2 w-1/3">
                Compromise Candidates
                <br />
                <span className="text-xs font-normal text-gray-500">
                  A small likelihood shift flips a category&apos;s net
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
    </div>
  );
}
