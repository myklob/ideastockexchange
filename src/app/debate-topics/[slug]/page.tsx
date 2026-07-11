import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDebateTopic } from '@/features/debate-topics/db';
import ExternalReferences from '@/components/debate-topic/ExternalReferences';
import TopicMetrics from '@/components/debate-topic/TopicMetrics';
import PositionSpectrum from '@/components/debate-topic/PositionSpectrum';
import EvidenceLedger from '@/components/debate-topic/EvidenceLedger';
import ClaimMagnitude from '@/components/debate-topic/ClaimMagnitude';
import CivicEscalation from '@/components/debate-topic/CivicEscalation';
import FoundationalAssumptions from '@/components/debate-topic/FoundationalAssumptions';
import AbstractionLadder from '@/components/debate-topic/AbstractionLadder';
import CoreValuesConflict from '@/components/debate-topic/CoreValuesConflict';
import CommonGround from '@/components/debate-topic/CommonGround';
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
        <div className="text-right text-sm mb-4 text-gray-600 italic">
          <Link href="/debate-topics" className="text-blue-600 hover:underline">Topics</Link>
          {categoryPath.map((cat, i) => (
            <span key={i}>
              <span className="mx-1">&gt;</span>
              <span className="text-gray-700">{cat}</span>
            </span>
          ))}
          <span className="mx-1">&gt;</span>
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

        {/* Audit lock */}
        <div className="bg-[#fffbe6] border-l-4 border-[#b58900] px-3 py-2 my-3 text-xs">
          <strong>Audit lock.</strong> Every numeric score on this page is computed from linked argument
          and evidence nodes. Nothing here is hand-entered. If a score looks wrong, fix the underlying
          node, not the display. See{' '}
          <Link href="/algorithms/truth-scores" className="text-blue-600 hover:underline">Truth</Link>{' '}
          and{' '}
          <Link href="/algorithms/reason-rank" className="text-blue-600 hover:underline">ReasonRank</Link>.
        </div>

        {/* What This Page Is For */}
        <h2 className="text-xl font-bold mt-6 mb-2">What This Page Is For</h2>
        <p className="text-sm mb-4">
          One canonical home for everything anyone has argued about this topic. Arguments are scored by
          evidence quality, linked to the claims they support or undermine, and updated automatically when
          new data arrives. The rebuttal to any bad argument on this page is always one click away. See{' '}
          <Link href="/beliefs" className="text-blue-600 hover:underline">One Page Per Belief</Link> for
          the single-claim version of this design.
        </p>

        <hr className="my-6" />

        {/* 1. The Position Spectrum */}
        {topic.positions.length > 0 && (
          <>
            <PositionSpectrum positions={topic.positions} />
            <hr className="my-6" />
          </>
        )}

        {/* 2. The Evidence Ledger */}
        {topic.evidenceItems.length > 0 && (
          <>
            <EvidenceLedger evidenceItems={topic.evidenceItems} />
            <hr className="my-6" />
          </>
        )}

        {/* 3. Claim Magnitude */}
        <ClaimMagnitude
          topicTitle={topic.title}
          claimMagnitudeLevels={topic.claimMagnitudeLevels}
        />
        <hr className="my-6" />

        {/* 4. The Engagement Landscape: Civic Escalation */}
        {topic.escalationLevels.length > 0 && (
          <>
            <CivicEscalation escalationLevels={topic.escalationLevels} />
            <hr className="my-6" />
          </>
        )}

        {/* 5. Foundational Assumptions at Each Position */}
        {topic.assumptions.length > 0 && (
          <>
            <FoundationalAssumptions
              assumptions={topic.assumptions}
              keyInsight={topic.assumptionKeyInsight}
            />
            <hr className="my-6" />
          </>
        )}

        {/* 6. The Abstraction Ladder */}
        {topic.abstractionRungs.length > 0 && (
          <>
            <AbstractionLadder rungs={topic.abstractionRungs} topicTitle={topic.title} />
            <hr className="my-6" />
          </>
        )}

        {/* 7. Core Values Conflict */}
        {topic.coreValues && (
          <>
            <CoreValuesConflict coreValues={topic.coreValues} topicTitle={topic.title} />
            <hr className="my-6" />
          </>
        )}

        {/* 8. Common Ground and Compromise */}
        {topic.commonGround && (
          <>
            <CommonGround commonGround={topic.commonGround} />
            <hr className="my-6" />
          </>
        )}

        {/* 9. Best Media and Resources */}
        {topic.mediaResources.length > 0 && (
          <>
            <MediaResources mediaResources={topic.mediaResources} />
            <hr className="my-6" />
          </>
        )}

        {/* 10. Related Topics */}
        {topic.relatedTopics.length > 0 && (
          <>
            <RelatedTopics relatedTopics={topic.relatedTopics} />
            <hr className="my-6" />
          </>
        )}

        {/* Contribute */}
        <div>
          <h2 className="text-xl font-bold mb-2">Contribute</h2>
          <p className="mb-3">
            <Link href="/contact" className="text-blue-600 hover:underline">Contact us</Link>{' '}
            to add beliefs, strengthen arguments, or link new evidence.{' '}
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
          <p className="text-xs text-gray-600">
            <strong>Related design pages:</strong>{' '}
            <Link href="/beliefs" className="text-blue-600 hover:underline">One Page Per Belief</Link>,{' '}
            <Link href="/algorithms/unique-scores" className="text-blue-600 hover:underline">Duplication Scores</Link>,{' '}
            <Link href="/algorithms/combine-similar-beliefs" className="text-blue-600 hover:underline">Grouping Similar Phrasings</Link>,{' '}
            <Link href="/algorithms/topic-overlap" className="text-blue-600 hover:underline">Grouping by Sub-Topic</Link>.
          </p>
        </div>

      </div>
    </div>
  );
}
