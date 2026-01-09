import Link from 'next/link';
import { getAllTopicsWithBeliefs } from '@/data/sampleData';

export default function Home() {
  const topics = getAllTopicsWithBeliefs();

  return (
    <div>
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-3xl font-bold mb-4">
          The Architecture of Reason: One Page Per Topic
        </h2>
        <h3 className="text-xl text-gray-700 mb-6">
          <strong>The Core Belief:</strong> To cure the chaos of online discourse, we must create
          a single, unified page for every topic. This page must organize beliefs in three
          simultaneous dimensions—General to Specific, Weak to Strong, and Negative to
          Positive—allowing users to navigate complexity with the clarity of a map.
        </h3>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4">The Problem: The Broken Debate</h2>
        <p className="text-gray-700 mb-4">
          Right now, online discussions fail us in four critical ways:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>
            <strong>Topic Drift:</strong> Conversations wander, losing focus and momentum.
          </li>
          <li>
            <strong>Scattered Arguments:</strong> Brilliant insights vanish into endless,
            unsearchable comment threads.
          </li>
          <li>
            <strong>Repetition Without Progress:</strong> We argue in circles, never building on
            what came before.
          </li>
          <li>
            <strong>No Collective Memory:</strong> There is no record of what has been proven,
            disproven, or refined over time.
          </li>
        </ol>
        <p className="text-gray-700">
          The cost? Lost insights, wasted energy, and debates that generate heat but no light.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4">The Solution: Multi-Dimensional Belief Mapping</h2>
        <p className="text-gray-700 mb-4">
          We solve this by treating ideas not as a stream of text, but as data points in a 3D
          space. On the Idea Stock Exchange, every topic page allows you to sort the chaos into
          order using three specific axes:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>
            <strong>General → Specific (The Abstraction Ladder):</strong> Navigate between
            fundamental principles and specific implementations
          </li>
          <li>
            <strong>Weak → Strong (The Confidence Scale):</strong> Sort beliefs by claim
            intensity and required burden of proof
          </li>
          <li>
            <strong>Negative → Positive (The Valence Spectrum):</strong> Map the full nuance of
            positions instead of binary Pro/Con
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Explore Example Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topic/${topic.id}`}
              className="block p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <h3 className="text-xl font-bold mb-2 text-blue-700">{topic.title}</h3>
              <p className="text-gray-600 mb-3">{topic.description}</p>
              <p className="text-sm text-gray-500">
                {topic.beliefs.length} belief{topic.beliefs.length !== 1 ? 's' : ''} mapped
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-8 mt-8">
        <h2 className="text-2xl font-bold mb-4">The Vision</h2>
        <p className="text-gray-700 mb-4">
          By giving every topic its own "room" where ideas can be organized across multiple
          dimensions, we create the infrastructure for collective intelligence. This isn&apos;t
          just better debate—it&apos;s a foundation for evidence-based governance, systematic
          conflict resolution, and decisions that actually serve the common good.
        </p>
        <p className="text-gray-700 mb-4">
          Ideas are tested, not just shouted. Evidence is gathered, not ignored. Progress is
          measured, not assumed.
        </p>
        <p className="text-gray-900 font-bold text-lg">
          This is how democracy evolves. This is how we move from tribal warfare to collaborative
          wisdom.
        </p>
      </div>
    </div>
  );
}
