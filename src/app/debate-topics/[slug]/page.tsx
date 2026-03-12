import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDebateTopic } from '@/features/debate-topics/db';
import ExternalReferences from '@/components/debate-topic/ExternalReferences';
import TopicMetrics from '@/components/debate-topic/TopicMetrics';
import Spectrum1Positions from '@/components/debate-topic/Spectrum1Positions';
import Spectrum2Magnitude from '@/components/debate-topic/Spectrum2Magnitude';
import Spectrum3Escalation from '@/components/debate-topic/Spectrum3Escalation';
import FoundationalAssumptions from '@/components/debate-topic/FoundationalAssumptions';
import Spectrum4AbstractionLadder from '@/components/debate-topic/Spectrum4AbstractionLadder';
import CoreValuesConflict from '@/components/debate-topic/CoreValuesConflict';
import CommonGround from '@/components/debate-topic/CommonGround';
import EvidenceLedger from '@/components/debate-topic/EvidenceLedger';
import ObjectiveCriteriaTable from '@/components/debate-topic/ObjectiveCriteriaTable';
import MediaResources from '@/components/debate-topic/MediaResources';
import RelatedTopics from '@/components/debate-topic/RelatedTopics';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DebateTopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = await getDebateTopic(slug);

  if (!topic) notFound();

  const categoryPath = topic.categoryPath ?? [];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* External References */}
        <ExternalReferences external={topic.external} />

        {/* Breadcrumb + Title */}
        <div className="text-right text-sm mb-4 text-gray-600">
          <Link href="/debate-topics" className="text-blue-600 hover:underline">Topics</Link>
          {categoryPath.map((cat, i) => (
            <span key={i}>
              <span className="mx-1">›</span>
              <span className="text-gray-700">{cat}</span>
            </span>
          ))}
          <span className="mx-1">›</span>
          <strong>{topic.title}</strong>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-3">Topic: {topic.title}</h1>

        {/* Definition + Scope */}
        <p className="mb-2 text-sm">
          <strong>Definition:</strong> {topic.definition}
        </p>
        <p className="mb-4 text-sm">
          <strong>Scope:</strong> {topic.scope}
        </p>

        {/* Topic Metrics box */}
        <TopicMetrics
          importanceScore={topic.importanceScore}
          evidenceDepth={topic.evidenceDepth}
          controversyRating={topic.controversyRating}
        />

        <hr className="my-6" />

        {/* Spectrum 1: Debate Landscape */}
        {topic.positions.length > 0 && (
          <>
            <Spectrum1Positions positions={topic.positions} />
            <hr className="my-6" />
          </>
        )}

        {/* Spectrum 2: Claim Magnitude */}
        <Spectrum2Magnitude
          topicTitle={topic.title}
          claimMagnitudeLevels={topic.claimMagnitudeLevels}
        />
        <hr className="my-6" />

        {/* Spectrum 3: Civic Engagement Level */}
        {topic.escalationLevels.length > 0 && (
          <>
            <Spectrum3Escalation escalationLevels={topic.escalationLevels} topicTitle={topic.title} />
            <hr className="my-6" />
          </>
        )}

        {/* Foundational Assumptions */}
        {topic.assumptions.length > 0 && (
          <>
            <FoundationalAssumptions
              assumptions={topic.assumptions}
              keyInsight={topic.assumptionKeyInsight}
            />
            <hr className="my-6" />
          </>
        )}

        {/* Spectrum 4: Abstraction Ladder */}
        {topic.abstractionRungs.length > 0 && (
          <>
            <Spectrum4AbstractionLadder rungs={topic.abstractionRungs} topicTitle={topic.title} />
            <hr className="my-6" />
          </>
        )}

        {/* Core Values Conflict */}
        {topic.coreValues && (
          <>
            <CoreValuesConflict coreValues={topic.coreValues} topicTitle={topic.title} />
            <hr className="my-6" />
          </>
        )}

        {/* Common Ground */}
        {topic.commonGround && (
          <>
            <CommonGround commonGround={topic.commonGround} />
            <hr className="my-6" />
          </>
        )}

        {/* Evidence Ledger */}
        {topic.evidenceItems.length > 0 && (
          <>
            <EvidenceLedger evidenceItems={topic.evidenceItems} />
            <hr className="my-6" />
          </>
        )}

        {/* Objective Criteria */}
        {topic.objectiveCriteria.length > 0 && (
          <>
            <ObjectiveCriteriaTable criteria={topic.objectiveCriteria} topicTitle={topic.title} />
            <hr className="my-6" />
          </>
        )}

        {/* Media Resources */}
        {topic.mediaResources.length > 0 && (
          <>
            <MediaResources mediaResources={topic.mediaResources} />
            <hr className="my-6" />
          </>
        )}

        {/* Related Topics */}
        {topic.relatedTopics.length > 0 && (
          <>
            <RelatedTopics relatedTopics={topic.relatedTopics} />
            <hr className="my-6" />
          </>
        )}

        {/* Contribute */}
        <div>
          <h2 className="text-xl font-bold mb-2">📬 Contribute</h2>
          <p>
            <Link href="/contact" className="text-blue-600 hover:underline">Contact us</Link>{' '}
            to add beliefs, strengthen arguments, link new evidence, or propose objective criteria.
            <br />
            <a
              href="https://github.com/myklob/ideastockexchange"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>{' '}
            for technical implementation and scoring algorithms.
          </p>
        </div>

      </div>
    </div>
  );
}
