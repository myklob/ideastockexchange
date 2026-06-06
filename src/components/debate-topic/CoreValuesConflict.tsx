import type { DebateCoreValues } from '@/core/types/debate-topic';

interface Props {
  coreValues: DebateCoreValues;
  topicTitle: string;
}

export default function CoreValuesConflict({ coreValues }: Props) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-3">
        ⚖️ Core Values Conflict
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
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
                    <strong>Critics say the actual motivation is:</strong>
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
                    <strong>Critics say the actual motivation is:</strong>
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
