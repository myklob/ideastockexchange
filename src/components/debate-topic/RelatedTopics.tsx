import Link from 'next/link';
import type { DebateRelatedTopic } from '@/core/types/debate-topic';

interface Props {
  relatedTopics: DebateRelatedTopic[];
}

function TopicLink({ topic }: { topic: DebateRelatedTopic }) {
  const href = topic.relatedSlug
    ? `/debate-topics/${topic.relatedSlug}`
    : topic.relatedUrl ?? '#';

  return (
    <Link href={href} className="text-blue-600 hover:underline">
      {topic.relatedTitle}
    </Link>
  );
}

export default function RelatedTopics({ relatedTopics }: Props) {
  const parents = relatedTopics.filter((t) => t.relationType === 'parent');
  const children = relatedTopics.filter((t) => t.relationType === 'child');
  const siblings = relatedTopics.filter((t) => t.relationType === 'sibling');

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-3">🔗 Related Topics</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 w-1/3">Broader Categories (Parents)</th>
              <th className="border border-gray-300 px-3 py-2 w-1/3">Specific Sub-Issues (Children)</th>
              <th className="border border-gray-300 px-3 py-2 w-1/3">Related Concepts (Siblings)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-3 align-top">
                {parents.length > 0 ? (
                  <span>
                    {parents.map((t, i) => (
                      <span key={i}>
                        {i > 0 && ', '}
                        <TopicLink topic={t} />
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">None listed</span>
                )}
              </td>
              <td className="border border-gray-300 px-3 py-3 align-top">
                {children.length > 0 ? (
                  <span>
                    {children.map((t, i) => (
                      <span key={i}>
                        {i > 0 && ', '}
                        <TopicLink topic={t} />
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">None listed</span>
                )}
              </td>
              <td className="border border-gray-300 px-3 py-3 align-top">
                {siblings.length > 0 ? (
                  <span>
                    {siblings.map((t, i) => (
                      <span key={i}>
                        {i > 0 && ', '}
                        <TopicLink topic={t} />
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">None listed</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
