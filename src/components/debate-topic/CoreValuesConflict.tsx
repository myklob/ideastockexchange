import type { DebateCoreValues } from '@/core/types/debate-topic';

interface Props {
  coreValues: DebateCoreValues;
  topicTitle: string;
}

export default function CoreValuesConflict({ coreValues }: Props) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">7. Core Values Conflict</h2>
      <p className="text-sm text-gray-600 mb-3">
        Most policy disagreements are not disagreements about facts. They are disagreements about which
        values take priority when values conflict. This table makes the priorities on both sides explicit,
        including the gap between advertised values and motivations critics attribute.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-[#f0f3f6]">
              <th className="border border-gray-300 px-3 py-2 w-1/2">
                Values Supporting This Topic
              </th>
              <th className="border border-gray-300 px-3 py-2 w-1/2">
                Values Opposing This Topic
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-3 align-top">
                <strong>Advertised:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  {coreValues.supportingAdvertised.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ol>
                {coreValues.supportingActual.length > 0 && (
                  <>
                    <br />
                    <strong>Actual (per critics):</strong>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      {coreValues.supportingActual.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ol>
                  </>
                )}
              </td>
              <td className="border border-gray-300 px-3 py-3 align-top">
                <strong>Advertised:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  {coreValues.opposingAdvertised.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ol>
                {coreValues.opposingActual.length > 0 && (
                  <>
                    <br />
                    <strong>Actual (per critics):</strong>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      {coreValues.opposingActual.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ol>
                  </>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
