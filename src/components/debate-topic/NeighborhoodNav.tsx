import Link from 'next/link';
import type { DebateRelatedTopic } from '@/core/types/debate-topic';

interface Props {
  relatedTopics: DebateRelatedTopic[];
}

function topicHref(topic: DebateRelatedTopic): string {
  return topic.relatedSlug ? `/debate-topics/${topic.relatedSlug}` : topic.relatedUrl ?? '#related';
}

function TopicLinks({ topics }: { topics: DebateRelatedTopic[] }) {
  return (
    <>
      {topics.map((t, i) => (
        <span key={i}>
          {i > 0 && ', '}
          <Link href={topicHref(t)} className="text-blue-600 hover:underline">
            {t.relatedTitle}
          </Link>
        </span>
      ))}
    </>
  );
}

// The anti-topic-drift affordance: exploring the neighborhood of an idea is
// explicit movement along the page's dimensions, not a wander. Leaving the
// topic is a deliberate link out to a parent or child page.
export default function NeighborhoodNav({ relatedTopics }: Props) {
  const parents = relatedTopics.filter((t) => t.relationType === 'parent');
  const children = relatedTopics.filter((t) => t.relationType === 'child');

  return (
    <div className="border border-gray-300 bg-gray-50 px-4 py-3 my-4 text-sm">
      <p className="mb-1.5">
        <strong>Navigate, don&apos;t drift.</strong> Every move away from this exact question is
        explicit — a coordinate shift on this page or a link to another page, never a tangent. See{' '}
        <Link href="/problems/topic-drift" className="text-blue-600 hover:underline">Topic Drift</Link>.
      </p>
      <ul className="list-none m-0 p-0 space-y-0.5 text-gray-700">
        <li>
          <span className="inline-block w-32 text-gray-500">More general ↑</span>
          {parents.length > 0 ? (
            <TopicLinks topics={parents} />
          ) : (
            <span className="text-gray-400">no parent topics yet</span>
          )}
        </li>
        <li>
          <span className="inline-block w-32 text-gray-500">More specific ↓</span>
          {children.length > 0 ? (
            <TopicLinks topics={children} />
          ) : (
            <span className="text-gray-400">no child topics yet</span>
          )}
        </li>
        <li>
          <span className="inline-block w-32 text-gray-500">Other direction</span>
          <a href="#direction" className="text-blue-600 hover:underline">
            the full position spectrum (section 1)
          </a>
        </li>
        <li>
          <span className="inline-block w-32 text-gray-500">Bolder / hedged</span>
          <a href="#magnitude" className="text-blue-600 hover:underline">
            the same claim at other magnitudes (section 3)
          </a>
        </li>
      </ul>
    </div>
  );
}
