import Link from 'next/link';
import type { DebateMediaResource } from '@/core/types/debate-topic';

interface Props {
  mediaResources: DebateMediaResource[];
}

function directionLabel(p: number): string {
  if (p > 0) return `+${p}%`;
  if (p < 0) return `−${Math.abs(p)}%`;
  return '0%';
}

export default function MediaResources({ mediaResources }: Props) {
  const sorted = [...mediaResources].sort((a, b) => b.positivity - a.positivity);

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">9. Best Media and Resources</h2>
      <p className="text-sm text-gray-600 mb-3">
        Curated sources sorted by direction and informational value. Direction and Magnitude are the same
        belief coordinates from sections 1 and 3, applied to what the source argues. The Escalation column
        applies section 4&apos;s ladder to the content itself: what level of action does this source
        advocate? A book can call for civil disobedience regardless of what any reader does. See{' '}
        <Link href="/media" className="text-blue-600 hover:underline">Media Framework</Link>.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-[#f0f3f6]">
              <th className="border border-gray-300 px-3 py-2 w-[28%]">Title</th>
              <th className="border border-gray-300 px-3 py-2 w-[12%]">Medium</th>
              <th className="border border-gray-300 px-3 py-2 w-[12%]">Bias / Tone</th>
              <th className="border border-gray-300 px-3 py-2 w-[10%] text-center">Direction</th>
              <th className="border border-gray-300 px-3 py-2 w-[10%] text-center">Magnitude</th>
              <th className="border border-gray-300 px-3 py-2 w-[10%] text-center">Escalation</th>
              <th className="border border-gray-300 px-3 py-2 w-[18%]">Key Insight</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
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
                  {directionLabel(m.positivity)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">{m.magnitude}%</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{m.escalation}</td>
                <td className="border border-gray-300 px-3 py-2 text-xs text-gray-700">{m.keyInsight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
