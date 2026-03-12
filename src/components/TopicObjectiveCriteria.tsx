import Link from 'next/link';
import { TopicObjectiveCriterion, QualityLevel } from '@/core/types/ise';

interface TopicObjectiveCriteriaProps {
  criteria: TopicObjectiveCriterion[];
}

function criteriaScoreColor(score: number): string {
  if (score >= 80) return 'text-green-700';
  if (score >= 50) return 'text-orange-500';
  return 'text-red-600';
}

function qualityBadge(level: QualityLevel) {
  const colors: Record<QualityLevel, string> = {
    High: 'text-green-700 font-semibold',
    Med: 'text-orange-500 font-semibold',
    Low: 'text-red-600 font-semibold',
  };
  return <span className={colors[level]}>{level}</span>;
}

export default function TopicObjectiveCriteria({ criteria }: TopicObjectiveCriteriaProps) {
  const sorted = [...criteria].sort((a, b) => b.criteriaScore - a.criteriaScore);

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-2">
        📏{' '}
        <Link
          href="/w/page/159351732/Objective%20criteria%20scores"
          className="text-blue-700 hover:underline"
        >
          Best Objective Criteria
        </Link>{' '}
        for Measuring Beliefs on This Topic
      </h2>
      <p className="text-sm text-gray-700 mb-3">
        Before arguments about this topic can be scored, users must first agree on{' '}
        <em>what good measurement looks like</em>. This section lists proposed criteria,
        sorted by their community-assigned{' '}
        <Link
          href="/w/page/159351732/Objective%20criteria%20scores"
          className="text-blue-600 hover:underline"
        >
          Objective Criteria Score
        </Link>
        . Each criterion is itself a belief with its own page: users submit reasons to agree
        or disagree that it is a valid, reliable, independent, and relevant measure. The
        scores below are calculated recursively from those sub-arguments &mdash; no manual
        ranking, no editorial judgment.
      </p>

      <div className="bg-blue-50 border-l-4 border-blue-600 p-3 mb-4 text-sm">
        <strong>How each criterion is scored across four dimensions:</strong>
        <ul className="mt-2 ml-4 list-disc space-y-1">
          <li>
            <strong>
              <Link href="/w/page/21960078/truth" className="text-blue-600 hover:underline">
                Validity
              </Link>
              :
            </strong>{' '}
            Does this measure actually capture what we claim it captures?
          </li>
          <li>
            <strong>Reliability:</strong> Can different observers measure it consistently
            without subjective manipulation?
          </li>
          <li>
            <strong>
              <Link
                href="/w/page/159338766/Linkage%20Scores"
                className="text-blue-600 hover:underline"
              >
                Linkage
              </Link>
              :
            </strong>{' '}
            How directly does this metric connect to the core claim being evaluated?
          </li>
          <li>
            <strong>
              <Link
                href="/w/page/162731388/Importance%20Score"
                className="text-blue-600 hover:underline"
              >
                Importance
              </Link>
              :
            </strong>{' '}
            If valid and linked, how significant is this metric relative to others available?
          </li>
        </ul>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-blue-100">
              <th className="px-3 py-2 text-left font-semibold w-[28%]">Proposed Criterion</th>
              <th className="px-3 py-2 text-center font-semibold w-[12%]">
                <Link
                  href="/w/page/159351732/Objective%20criteria%20scores"
                  className="text-blue-700 hover:underline"
                >
                  Criteria Score
                </Link>
              </th>
              <th className="px-3 py-2 text-center font-semibold w-[15%]">
                <Link href="/w/page/21960078/truth" className="text-blue-700 hover:underline">
                  Validity
                </Link>
              </th>
              <th className="px-3 py-2 text-center font-semibold w-[15%]">Reliability</th>
              <th className="px-3 py-2 text-center font-semibold w-[15%]">
                <Link
                  href="/w/page/159338766/Linkage%20Scores"
                  className="text-blue-700 hover:underline"
                >
                  Linkage
                </Link>
              </th>
              <th className="px-3 py-2 text-center font-semibold w-[15%]">
                <Link
                  href="/w/page/162731388/Importance%20Score"
                  className="text-blue-700 hover:underline"
                >
                  Importance
                </Link>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((criterion) => (
              <tr
                key={criterion.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-3 py-3">
                  {criterion.url ? (
                    <Link href={criterion.url} className="text-blue-600 hover:underline font-medium">
                      {criterion.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{criterion.name}</span>
                  )}
                  <br />
                  <span className="text-xs text-gray-500">{criterion.description}</span>
                </td>
                <td className="px-3 py-3 text-center font-mono font-bold">
                  <span className={criteriaScoreColor(criterion.criteriaScore)}>
                    {criterion.criteriaScore}%
                  </span>
                </td>
                <td className="px-3 py-3 text-center">{qualityBadge(criterion.validity)}</td>
                <td className="px-3 py-3 text-center">{qualityBadge(criterion.reliability)}</td>
                <td className="px-3 py-3 text-center">{qualityBadge(criterion.linkage)}</td>
                <td className="px-3 py-3 text-center">{qualityBadge(criterion.importance)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td colSpan={6} className="px-3 py-2 text-xs text-gray-500 italic">
                Don&apos;t see a criterion that belongs here?{' '}
                <Link href="/Contact%20Me" className="text-blue-600 hover:underline">
                  Submit a proposal
                </Link>{' '}
                with reasons to support its validity, reliability, linkage, and importance. The
                community will score it.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-red-50 border-l-4 border-red-600 p-3 mt-4 text-sm">
        <strong>Why this matters:</strong> Arguments submitted anywhere on this topic page are
        automatically weighted by how well they connect to high-scoring criteria. A claim
        supported by a criterion scoring 92% carries far more evidential weight than one
        supported by a criterion scoring 15% &mdash; regardless of how confidently either claim is
        stated. The yardstick is agreed upon before the measurements begin.
      </div>

      <p className="text-right text-sm mt-2">
        See:{' '}
        <Link
          href="/w/page/159351732/Objective%20criteria%20scores"
          className="text-blue-600 hover:underline"
        >
          Full Objective Criteria Scoring Methodology
        </Link>
      </p>
    </div>
  );
}
