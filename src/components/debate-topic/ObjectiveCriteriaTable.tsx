import type { DebateObjectiveCriteria } from '@/core/types/debate-topic';

interface Props {
  criteria: DebateObjectiveCriteria[];
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-700';
  if (score >= 50) return 'text-orange-500';
  return 'text-red-600';
}

type QLevel = 'High' | 'Med' | 'Low';
function qualityBadge(level: QLevel): React.ReactNode {
  const colors: Record<QLevel, string> = {
    High: 'text-green-700 font-semibold',
    Med: 'text-orange-500 font-semibold',
    Low: 'text-red-600 font-semibold',
  };
  return <span className={colors[level] ?? 'font-semibold'}>{level}</span>;
}

export default function ObjectiveCriteriaTable({ criteria }: Props) {
  const sorted = [...criteria].sort((a, b) => b.criteriaScore - a.criteriaScore);

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">
        📏 Best Objective Criteria for This Topic
      </h2>
      <p className="text-xs text-gray-600 mb-3">
        Agree on the yardstick before measuring. Each proposed criterion is a belief with its own page,
        scored on four dimensions: <strong>Validity</strong> (does it capture what we claim?),{' '}
        <strong>Reliability</strong> (do different observers get the same reading?), <strong>Linkage</strong>{' '}
        (how directly it connects to the claim), and <strong>Importance</strong>. Arguments that connect to
        high-scoring criteria carry more weight.{' '}
        <span className="text-gray-500">
          See: <a href="/algorithms/objective-criteria" className="text-blue-600 hover:underline">Objective Criteria Scoring</a>.
        </span>
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-blue-100">
              <th className="border border-gray-300 px-3 py-2 w-[28%]">Proposed Criterion</th>
              <th className="border border-gray-300 px-3 py-2 w-[12%] text-center">Criteria Score</th>
              <th className="border border-gray-300 px-3 py-2 w-[14%] text-center">Validity</th>
              <th className="border border-gray-300 px-3 py-2 w-[14%] text-center">Reliability</th>
              <th className="border border-gray-300 px-3 py-2 w-[14%] text-center">Linkage</th>
              <th className="border border-gray-300 px-3 py-2 w-[14%] text-center">Importance</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id ?? c.name} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">
                  {c.url ? (
                    <a href={c.url} className="font-medium text-blue-600 hover:underline">{c.name}</a>
                  ) : (
                    <span className="font-medium">{c.name}</span>
                  )}
                  <br />
                  <span className="text-xs text-gray-500">{c.description}</span>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono font-bold">
                  <span className={scoreColor(c.criteriaScore)}>{c.criteriaScore}%</span>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {qualityBadge(c.validity as QLevel)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {qualityBadge(c.reliability as QLevel)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {qualityBadge(c.linkage as QLevel)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {qualityBadge(c.importance as QLevel)}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td colSpan={6} className="px-3 py-2 text-xs text-gray-500 italic">
                Missing a criterion?{' '}
                <a href="/contact" className="text-blue-600 hover:underline">Submit a proposal</a>{' '}
                with reasons for its validity, reliability, linkage, and importance. The community scores it.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
