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
import Link from 'next/link'
import { BookOpen, Target, Scale, Lightbulb } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-900">Idea Stock Exchange</h1>
            <nav className="flex gap-6">
              <Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link>
              <Link href="/books" className="text-blue-600 hover:text-blue-800">Books</Link>
              <Link href="/topics" className="text-blue-600 hover:text-blue-800">Topics</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Book Analysis: Combat Reports for Ideas
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            The Idea Stock Exchange doesn't provide traditional book reviews—it generates{' '}
            <strong>combat reports for ideas</strong>. Every book submitted faces systematic
            scrutiny across six logical battlegrounds.
          </p>
          <Link
            href="/books"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Explore Book Analyses
          </Link>
        </div>
      </div>

      {/* Core Principle */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg mb-12">
          <p className="text-lg mb-4">
            <strong>Core Principle:</strong> Every book receives granular scoring for each claim,
            weighted by centrality to the book's thesis. This combines evidence scoring, linkage
            strength, and truth evaluation to transform subjective literary influence into
            quantifiable, transparent metrics.
          </p>
        </div>

        {/* Four-Dimensional Scoring Framework */}
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          📊 The Four-Dimensional Scoring Framework
        </h2>
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-start gap-4">
              <Scale className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">
                  1. Logical Validity Score
                </h3>
                <p className="text-gray-700 text-sm mb-2">0-100 scale</p>
                <p className="text-gray-600">
                  How well arguments survive logical scrutiny—fallacy count, internal consistency,
                  evidence quality, predictive accuracy.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-start gap-4">
              <BookOpen className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">
                  2. Book Quality Score
                </h3>
                <p className="text-gray-700 text-sm mb-2">0-100 scale</p>
                <p className="text-gray-600">
                  Whether the book achieves its stated goals—entertainment value, educational
                  clarity, persuasive power, writing quality.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-start gap-4">
              <Target className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-green-900 mb-2">
                  3. Topic Overlap Score
                </h3>
                <p className="text-gray-700 text-sm mb-2">Per belief: 0-100%</p>
                <p className="text-gray-600">
                  How central a specific belief is to the book's thesis—determines which topic
                  pages display this book prominently.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-start gap-4">
              <Lightbulb className="w-8 h-8 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-orange-900 mb-2">
                  4. Belief Impact Weight
                </h3>
                <p className="text-gray-700 text-sm mb-2">Influence multiplier</p>
                <p className="text-gray-600">
                  How many people have been exposed to these arguments—societal reach and
                  transmission rate ("Belief R₀").
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Six Logic Battlegrounds */}
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          ⚔️ The 6 Logic Battlegrounds
        </h2>
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <p className="text-gray-700 mb-6">
            The Logical Validity Score is forged through systematic scrutiny across six specific
            theaters of reasoning. Each quote, argument, or prediction becomes a testable belief
            that rises or falls based on crowd-judged debate:
          </p>

          <div className="space-y-6">
            <div className="border-l-4 border-red-600 pl-4">
              <h3 className="text-lg font-bold text-red-900 mb-2">
                1. Fallacy Autopsy Theater
              </h3>
              <p className="text-gray-600 text-sm">
                Tests logical structure quality—strawmen, ad hominem attacks, post hoc reasoning,
                false equivalences, slippery slopes.
              </p>
            </div>

            <div className="border-l-4 border-orange-600 pl-4">
              <h3 className="text-lg font-bold text-orange-900 mb-2">
                2. Contradiction Trials
              </h3>
              <p className="text-gray-600 text-sm">
                Tests internal consistency—do different parts of the book contradict each other?
              </p>
            </div>

            <div className="border-l-4 border-cyan-600 pl-4">
              <h3 className="text-lg font-bold text-cyan-900 mb-2">
                3. Evidence War Rooms
              </h3>
              <p className="text-gray-600 text-sm">
                Data verification—does the cited evidence actually support the conclusion?
              </p>
            </div>

            <div className="border-l-4 border-purple-600 pl-4">
              <h3 className="text-lg font-bold text-purple-900 mb-2">
                4. Metaphor MRI Scans
              </h3>
              <p className="text-gray-600 text-sm">
                Analogy accuracy—does the comparison clarify or distort?
              </p>
            </div>

            <div className="border-l-4 border-pink-600 pl-4">
              <h3 className="text-lg font-bold text-pink-900 mb-2">
                5. Prediction Mortuaries
              </h3>
              <p className="text-gray-600 text-sm">
                Forecasting accuracy—testable predictions tracked against real-world outcomes.
              </p>
            </div>

            <div className="border-l-4 border-green-600 pl-4">
              <h3 className="text-lg font-bold text-green-900 mb-2">
                6. Belief Transmission Labs
              </h3>
              <p className="text-gray-600 text-sm">
                Societal spread velocity—"Belief R₀" (reproduction rate).
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Join the Logic Audit Movement
          </h2>
          <p className="text-gray-700 mb-6">
            Books don't own the truth—you and the crowd define it. The ISE transforms reading
            from passive consumption to active critical analysis.
          </p>
          <Link
            href="/books"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Explore Example Analyses
          </Link>
        </div>
      </div>
    </div>
  )
}
