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

function TopicList({ topics }: { topics: DebateRelatedTopic[] }) {
  if (topics.length === 0) {
    return <span className="text-gray-400 text-xs">None listed</span>;
  }
  return (
    <ul className="list-none m-0 p-0 space-y-1">
      {topics.map((t, i) => (
        <li key={i}>
          <TopicLink topic={t} />
        </li>
      ))}
    </ul>
  );
}

export default function RelatedTopics({ relatedTopics }: Props) {
  const parents = relatedTopics.filter((t) => t.relationType === 'parent');
  const children = relatedTopics.filter((t) => t.relationType === 'child');
  // Legacy "opposingView" rows render under Adjacent — the template has no
  // separate opposing column.
  const siblings = relatedTopics.filter(
    (t) => t.relationType === 'sibling' || t.relationType === 'opposingView'
  );

  return (
    <div id="related" className="mb-8">
      <h2 className="text-xl font-bold mb-3">10. Related Topics</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-[#f0f3f6]">
              <th className="border border-gray-300 px-3 py-2 w-1/3">Broader (Parents)</th>
              <th className="border border-gray-300 px-3 py-2 w-1/3">Narrower (Children)</th>
              <th className="border border-gray-300 px-3 py-2 w-1/3">Adjacent (Siblings)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-3 align-top">
                <TopicList topics={parents} />
              </td>
              <td className="border border-gray-300 px-3 py-3 align-top">
                <TopicList topics={children} />
              </td>
              <td className="border border-gray-300 px-3 py-3 align-top">
                <TopicList topics={siblings} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
