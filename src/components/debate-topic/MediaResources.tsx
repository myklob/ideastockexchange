import type { DebateMediaResource } from '@/core/types/debate-topic';

interface Props {
  mediaResources: DebateMediaResource[];
}

function positivityLabel(p: number): string {
  if (p > 0) return `+${p}%`;
  return `${p}%`;
}

export default function MediaResources({ mediaResources }: Props) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">📚 Best Media &amp; Resources</h2>
      <p className="text-xs text-gray-600 mb-3">
        Curated resources sorted by positivity score and informational value.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 w-[28%]">Title</th>
              <th className="border border-gray-300 px-3 py-2 w-[10%]">Medium</th>
              <th className="border border-gray-300 px-3 py-2 w-[14%]">Bias/Tone</th>
              <th className="border border-gray-300 px-3 py-2 w-[10%] text-center">Positivity</th>
              <th className="border border-gray-300 px-3 py-2 w-[10%] text-center">Magnitude</th>
              <th className="border border-gray-300 px-3 py-2 w-[8%] text-center">Escalation</th>
              <th className="border border-gray-300 px-3 py-2 w-[20%]">Key Insight</th>
            </tr>
          </thead>
          <tbody>
            {mediaResources.map((m, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">
                  {m.url ? (
                    <a href={m.url} className="text-blue-600 hover:underline">{m.title}</a>
                  ) : (
                    m.title
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-gray-600">{m.medium}</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-600">{m.biasOrTone}</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono font-semibold">
                  {positivityLabel(m.positivity)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">{m.magnitude}%</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{m.escalation}</td>
                <td className="border border-gray-300 px-3 py-2 text-xs text-gray-700">{m.keyInsight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-right text-xs mt-2 text-gray-500">
        See: <a href="/media-framework" className="text-blue-600 hover:underline">Media Framework</a>
      </p>
    </div>
  );
}
