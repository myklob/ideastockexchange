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
