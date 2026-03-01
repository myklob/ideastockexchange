import type { DebatePosition } from '@/core/types/debate-topic';

interface Props {
  positions: DebatePosition[];
}

function rowBg(score: number): string {
  if (score <= -80) return 'bg-red-200';
  if (score < 0)   return 'bg-red-100';
  if (score === 0)  return 'bg-yellow-100';
  if (score < 80)  return 'bg-green-100';
  return 'bg-green-200';
}

function scoreColor(score: number): string {
  return score < 0 ? 'text-red-600' : score === 0 ? 'text-gray-700' : 'text-green-700';
}

export default function Spectrum1Positions({ positions }: Props) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">
        📊 Spectrum 1: The Debate Landscape{' '}
        <span className="text-base font-normal text-gray-600">(Negative ↔ Positive)</span>
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Maps the overall direction of a belief toward this topic, from total opposition (−100%) to total support (+100%).
        This spectrum captures <em>direction only</em>. How extreme the phrasing is, and how many principles someone is
        willing to violate to advance it, are separate dimensions measured in Spectrums 2 and 3.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 w-[12%]">Position</th>
              <th className="border border-gray-300 px-3 py-2 w-[38%]">Core Belief / Claim</th>
              <th className="border border-gray-300 px-3 py-2 w-[30%]">Top Underlying Argument</th>
              <th className="border border-gray-300 px-3 py-2 w-[10%] text-center">Belief Score</th>
              <th className="border border-gray-300 px-3 py-2 w-[10%] text-center">Media</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => (
              <tr key={pos.positionScore} className={rowBg(pos.positionScore)}>
                <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                  <strong>{pos.positionScore > 0 ? '+' : ''}{pos.positionScore}%</strong>
                  <br />
                  <span className="text-xs font-normal">({pos.positionLabel})</span>
                </td>
                <td className="border border-gray-300 px-3 py-2">{pos.coreBelief}</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-700">{pos.topArgument}</td>
                <td className={`border border-gray-300 px-3 py-2 text-center font-mono font-bold ${scoreColor(pos.positionScore)}`}>
                  {pos.beliefScore}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {pos.mediaUrl ? (
                    <a href={pos.mediaUrl} className="text-blue-600 hover:underline text-xs">[Link]</a>
                  ) : (
                    <span className="text-gray-400 text-xs">[Link]</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-right text-xs mt-2 text-gray-500">
        See: <a href="/positive-to-negative" className="text-blue-600 hover:underline">Full Positivity Framework</a>
        {' | '}
        <a href="/positive-to-negative" className="text-blue-600 hover:underline">Why We Need This Spectrum</a>
      </p>
    </div>
  );
}
