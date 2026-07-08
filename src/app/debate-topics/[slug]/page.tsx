import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDebateTopic, findExistingDebateTopicSlugs } from '@/features/debate-topics/db';
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

  const relatedSlugs = topic.relatedTopics
    .map((t) => t.relatedSlug)
    .filter((s): s is string => Boolean(s));
  const existingSlugs = await findExistingDebateTopicSlugs(relatedSlugs);

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

        {/*
          How this page deduplicates a debate. Every belief gets a coordinate on three
          independent matching continuums — valence, magnitude, specificity. Engagement and
          the assumption stack are deliberately NOT matching coordinates.
        */}
        <div className="bg-[#f4f9ff] border-l-4 border-[#0055a4] p-3 my-4 text-sm">
          <strong>How this page deduplicates a debate.</strong> Every belief about this topic gets a coordinate on
          three independent continuums: <strong>valence</strong> (which direction it runs), <strong>magnitude</strong>{' '}
          (how absolute the claim is), and <strong>specificity</strong> (how general or concrete it is). Two beliefs
          that land on the same coordinate are the <em>same claim</em> in different words and get merged. Two that land
          nearly on top of each other get the redundancy discount: the second one contributes only its non-overlapping
          fraction, because saying a thing five ways is not five reasons. That is the whole point of one page per topic.
          The argument gets built once, here, instead of restarting from scratch on every forum.
        </div>

        <hr className="my-6" />

        {/* Continuum 1: Valence */}
        {topic.positions.length > 0 && (
          <>
            <Spectrum1Positions positions={topic.positions} />
            <hr className="my-6" />
          </>
        )}

        {/* Continuum 2: Claim Magnitude */}
        <Spectrum2Magnitude
          topicTitle={topic.title}
          claimMagnitudeLevels={topic.claimMagnitudeLevels}
        />
        <hr className="my-6" />

        {/* Continuum 3: Specificity — the Abstraction Ladder */}
        {topic.abstractionRungs.length > 0 && (
          <>
            <Spectrum4AbstractionLadder rungs={topic.abstractionRungs} topicTitle={topic.title} />
            <hr className="my-6" />
          </>
        )}

        {/* Assumption Stack Behind Each Position (a dependency map, not a continuum) */}
        {topic.assumptions.length > 0 && (
          <>
            <FoundationalAssumptions
              assumptions={topic.assumptions}
              keyInsight={topic.assumptionKeyInsight}
            />
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

        {/* The Engagement Landscape (a stakeholder map, not a matching continuum) */}
        {topic.escalationLevels.length > 0 && (
          <>
            <Spectrum3Escalation escalationLevels={topic.escalationLevels} topicTitle={topic.title} />
            <hr className="my-6" />
          </>
        )}

        {/* Common Ground and Compromise */}
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
            <RelatedTopics relatedTopics={topic.relatedTopics} existingSlugs={existingSlugs} />
            <hr className="my-6" />
          </>
        )}

        {/* Contribute */}
        <div>
          <h2 className="text-xl font-bold mb-2">📬 Contribute</h2>
          <p>
            Contact us to add beliefs, strengthen arguments, link new evidence, or propose objective criteria.
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
