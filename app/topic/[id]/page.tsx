import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTopicWithBeliefs } from '@/data/sampleData';
import AbstractionLadder from '@/components/AbstractionLadder';
import ConfidenceScale from '@/components/ConfidenceScale';
import ValenceSpectrum from '@/components/ValenceSpectrum';
import MasterView from '@/components/MasterView';

interface TopicPageProps {
  params: {
    id: string;
  };
}

export default function TopicPage({ params }: TopicPageProps) {
  const topic = getTopicWithBeliefs(params.id);

  if (!topic) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-4xl font-bold mb-4">{topic.title}</h1>
        <p className="text-xl text-gray-700 mb-4">{topic.description}</p>
        {topic.parentTopics && topic.parentTopics.length > 0 && (
          <p className="text-sm text-gray-600">
            <strong>Parent Topics:</strong> {topic.parentTopics.join(', ')}
          </p>
        )}
      </div>

      {/* Show different views based on which topic it is */}
      {params.id === 'term-limits' && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <AbstractionLadder beliefs={topic.beliefs} />
        </div>
      )}

      {params.id === 'electric-cars' && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <ConfidenceScale beliefs={topic.beliefs} />
        </div>
      )}

      {params.id === 'social-media' && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <ValenceSpectrum beliefs={topic.beliefs} />
        </div>
      )}

      {params.id === 'trump-capability' && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <MasterView beliefs={topic.beliefs} topicTitle={topic.title} />
        </div>
      )}

      {/* Show all views for demonstration */}
      <div className="space-y-8">
        {params.id !== 'term-limits' && topic.beliefs.length > 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <AbstractionLadder beliefs={topic.beliefs} />
          </div>
        )}

        {params.id !== 'electric-cars' && topic.beliefs.length > 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <ConfidenceScale beliefs={topic.beliefs} />
          </div>
        )}

        {params.id !== 'social-media' && topic.beliefs.length > 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <ValenceSpectrum beliefs={topic.beliefs} />
          </div>
        )}

        {params.id !== 'trump-capability' && topic.beliefs.length > 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <MasterView beliefs={topic.beliefs} topicTitle={topic.title} />
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-bold mb-2">How It Works</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>
            <strong>Topic Hubs:</strong> Each major question gets its own hub where all
            perspectives converge.
          </li>
          <li>
            <strong>Belief Subpages:</strong> Every specific claim gets dedicated space with
            organized arguments and evidence.
          </li>
          <li>
            <strong>Side-by-Side Layout:</strong> Competing viewpoints appear together for direct
            comparison, preventing echo chambers.
          </li>
          <li>
            <strong>Dynamic Scoring:</strong> Arguments rise and fall based on truth, evidence
            quality, and logical strength.
          </li>
          <li>
            <strong>Linkage Scores:</strong> We don&apos;t just ask if a fact is true; we ask if
            it actually supports the conclusion.
          </li>
        </ul>
      </div>
    </div>
  );
}
