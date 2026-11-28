import type { DebateCommonGround } from '@/core/types/debate-topic';

interface Props {
  commonGround: DebateCommonGround;
}

export default function CommonGround({ commonGround }: Props) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">8. Common Ground and Compromise</h2>
      <p className="text-sm text-gray-600 mb-3">
        Solutions that address both sides&apos; core concerns are more durable than victories. Compromise
        positions belong here.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-[#f0f3f6]">
              <th className="border border-gray-300 px-3 py-2 w-1/2">What Both Sides Might Agree On</th>
              <th className="border border-gray-300 px-3 py-2 w-1/2">Possible Compromise Positions</th>
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
