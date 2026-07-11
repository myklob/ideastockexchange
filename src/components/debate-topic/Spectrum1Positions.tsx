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
    <div id="direction" className="mb-8">
      <h2 className="text-xl font-bold mb-1">1. The Position Spectrum (Negative ↔ Positive)</h2>
      <p className="text-sm text-gray-600 mb-4">
        Where do beliefs about this topic sit on the direction of support? This dimension captures
        direction <em>only</em>. How extreme the phrasing is, and how far someone is willing to go to act
        on the belief, are tracked in sections 3 and 4.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-[#f0f3f6]">
              <th className="border border-gray-300 px-3 py-2 w-[10%]">Position</th>
              <th className="border border-gray-300 px-3 py-2 w-[38%]">Belief Held at This Position</th>
              <th className="border border-gray-300 px-3 py-2 w-[28%]">Top Sub-Argument Driving the Score</th>
              <th className="border border-gray-300 px-3 py-2 w-[12%] text-center">Belief Score</th>
              <th className="border border-gray-300 px-3 py-2 w-[12%] text-center">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => (
              <tr key={pos.positionScore} className={rowBg(pos.positionScore)}>
                <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                  <strong>{pos.positionScore > 0 ? '+' : ''}{pos.positionScore}%</strong>
                  <br />
                  <span className="text-xs font-normal">{pos.positionLabel}</span>
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {pos.mediaUrl ? (
                    <a href={pos.mediaUrl} className="text-blue-600 hover:underline">{pos.coreBelief}</a>
                  ) : (
                    pos.coreBelief
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-gray-700">{pos.topArgument}</td>
                <td className={`border border-gray-300 px-3 py-2 text-center font-mono font-bold ${scoreColor(pos.positionScore)}`}>
                  {pos.beliefScore}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {pos.evidenceId !== undefined ? (
                    <a href={`#evidence-${pos.evidenceId}`} className="text-blue-600 hover:underline">
                      ledger
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-600 mt-2">
        <strong>Reading the table.</strong> The Position column is a coordinate, not a verdict. The Belief
        Score is the verdict, computed from linked sub-arguments. A position can be widely held (lots of
        people sit at +50%) and still have a low Belief Score, because what people believe and what
        survives evidence are different questions.
      </p>
    </div>
  );
}
