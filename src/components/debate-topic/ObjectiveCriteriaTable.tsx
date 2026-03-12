import type { DebateObjectiveCriteria } from '@/core/types/debate-topic';

interface Props {
  criteria: DebateObjectiveCriteria[];
  topicTitle: string;
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

export default function ObjectiveCriteriaTable({ criteria, topicTitle }: Props) {
  const sorted = [...criteria].sort((a, b) => b.criteriaScore - a.criteriaScore);

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">
        📏 Best Objective Criteria for Measuring Beliefs on {topicTitle}
      </h2>
      <p className="text-xs text-gray-600 mb-3">
        Before debating whether {topicTitle.toLowerCase()} is good or bad, the ISE asks users to agree on <em>what good measurement looks like</em>. Each criterion below is itself a belief with its own page. Users submit reasons to agree or disagree that it is valid, reliable, and actually linked to the core question. Scores are calculated recursively — no editorial judgment required.
      </p>

      <div className="bg-blue-50 border-l-4 border-blue-600 p-3 mb-3 text-xs">
        <strong>How each criterion is scored:</strong>
        <ul className="mt-1 ml-4 list-disc space-y-1">
          <li><strong>Validity:</strong> Does this measure actually capture what we claim it captures?</li>
          <li><strong>Reliability:</strong> Can different observers measure it consistently?</li>
          <li><strong>Linkage:</strong> How directly does this connect to the core claim?</li>
          <li><strong>Importance:</strong> How significant is this metric relative to others?</li>
        </ul>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-blue-100">
              <th className="border border-gray-300 px-3 py-2 w-[32%]">Proposed Criterion</th>
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
                Don&apos;t see a criterion that belongs here?{' '}
                <a href="/contact" className="text-blue-600 hover:underline">Submit a proposal</a>{' '}
                with reasons supporting its validity, reliability, linkage, and importance.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-red-50 border-l-4 border-red-600 p-3 mt-3 text-xs">
        <strong>Why this matters:</strong> Arguments supported by high-scoring criteria carry far more evidential weight. The yardstick is agreed upon before the measurements begin — so no one can move the goalposts mid-debate.
      </div>
    </div>
  );
}
