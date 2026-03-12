import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTopicWithBeliefs } from '@/features/topics/data/sample-data';
import AbstractionLadder from '@/components/AbstractionLadder';
import ConfidenceScale from '@/components/ConfidenceScale';
import ValenceSpectrum from '@/components/ValenceSpectrum';
import MasterView from '@/components/MasterView';
import TopicObjectiveCriteria from '@/components/TopicObjectiveCriteria';

interface TopicPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { id } = await params;
  const topic = getTopicWithBeliefs(id);

  if (!topic) {
    notFound();
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </Link>
      </div>

      {/* Header: Title, Definition, Metrics */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-4xl font-bold mb-4">Topic: {topic.title}</h1>
        <p className="text-gray-700 mb-4">{topic.description}</p>
        {topic.parentTopics && topic.parentTopics.length > 0 && (
          <p className="text-sm text-gray-600">
            <strong>Parent Topics:</strong> {topic.parentTopics.join(', ')}
          </p>
        )}
      </div>

      {/* Spectrum 1: The Debate Landscape (Valence / Negative ↔ Positive) */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <ValenceSpectrum beliefs={topic.beliefs} />
      </div>

      {/* Spectrum 4: The Abstraction Ladder (General ↔ Specific) */}
      {topic.beliefs.length > 1 && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <AbstractionLadder beliefs={topic.beliefs} />
        </div>
      )}

      {/* Spectrum 2: Claim Magnitude (Weak ↔ Strong) */}
      {topic.beliefs.length > 1 && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <ConfidenceScale beliefs={topic.beliefs} />
        </div>
      )}

      {/* Master View: All dimensions combined */}
      {topic.beliefs.length > 1 && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <MasterView beliefs={topic.beliefs} topicTitle={topic.title} />
        </div>
      )}

      {/* Best Objective Criteria */}
      {topic.objectiveCriteria && topic.objectiveCriteria.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <TopicObjectiveCriteria criteria={topic.objectiveCriteria} />
        </div>
      )}

      {/* How It Works */}
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
          <li>
            <strong>Objective Criteria:</strong> Before scoring arguments, users agree on what
            good measurement looks like — criteria are themselves scored for validity, reliability,
            linkage, and importance.
          </li>
        </ul>
      </div>
    </div>
  );
}
