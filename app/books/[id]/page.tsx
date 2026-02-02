import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBookAnalysisReport } from '@/lib/services/bookService'
import { BookAnalysisReport } from '@/lib/types'

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-50 border-green-600 text-green-900'
  if (score >= 60) return 'bg-yellow-50 border-yellow-600 text-yellow-900'
  return 'bg-red-50 border-red-600 text-red-900'
}

function ProgressBar({ value, max = 100, color = 'blue' }: { value: number; max?: number; color?: string }) {
  const percentage = Math.min((value / max) * 100, 100)
  const colorClass = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
  }[color] || 'bg-blue-600'

  return (
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        className={`h-3 rounded-full ${colorClass} transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export default async function BookAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const report = await getBookAnalysisReport(id)

  if (!report) {
    notFound()
  }

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

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Book Title */}
        <div className="mb-8">
          <Link href="/books" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to all books
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{report.book.title}</h1>
          <p className="text-xl text-gray-600">by {report.book.author}</p>
          {report.book.publishYear && (
            <p className="text-gray-500 mt-1">Published: {report.book.publishYear}</p>
          )}
        </div>

        {/* Four-Dimensional Scores */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📊 Four-Dimensional Scoring Framework
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Logical Validity Score</span>
                <span className="font-bold text-blue-900">
                  {report.scores.logicalValidityScore.toFixed(1)}/100
                </span>
              </div>
              <ProgressBar value={report.scores.logicalValidityScore} color="blue" />
              <p className="text-sm text-gray-600 mt-1">
                Weighted validity across {report.claimAnalysis.totalClaims} claims
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Book Quality Score</span>
                <span className="font-bold text-purple-900">
                  {report.scores.qualityScore.toFixed(1)}/100
                </span>
              </div>
              <ProgressBar value={report.scores.qualityScore} color="purple" />
              <p className="text-sm text-gray-600 mt-1">
                Writing, goals, engagement, originality
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Belief Impact Weight (R₀)</span>
                <span className="font-bold text-orange-900">
                  {report.scores.beliefImpactWeight.toFixed(2)}
                </span>
              </div>
              <ProgressBar value={report.scores.beliefImpactWeight} max={10} color="orange" />
              <p className="text-sm text-gray-600 mt-1">Log of reach (sales + citations + shares)</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Author Truth Equity</span>
                <span className="font-bold text-green-900">
                  {report.authorCredibility.truthEquityScore.toFixed(1)}/100
                </span>
              </div>
              <ProgressBar value={report.authorCredibility.truthEquityScore} color="green" />
              <p className="text-sm text-gray-600 mt-1">
                Historical accuracy across author's works
              </p>
            </div>
          </div>
        </div>

        {/* Claim Analysis */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🔍 Claim-by-Claim Analysis</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-green-50 border-l-4 border-green-600 p-4">
              <p className="text-sm text-gray-600 mb-1">Strong Claims (80-100)</p>
              <p className="text-3xl font-bold text-green-900">
                {report.claimAnalysis.validityDistribution.strong}
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
              <p className="text-sm text-gray-600 mb-1">Moderate Claims (60-79)</p>
              <p className="text-3xl font-bold text-yellow-900">
                {report.claimAnalysis.validityDistribution.moderate}
              </p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-600 p-4">
              <p className="text-sm text-gray-600 mb-1">Weak Claims (0-59)</p>
              <p className="text-3xl font-bold text-red-900">
                {report.claimAnalysis.validityDistribution.weak}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">
              <strong>Average Claim Validity:</strong>{' '}
              {report.claimAnalysis.averageValidity.toFixed(1)}/100
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Total Claims Analyzed:</strong> {report.claimAnalysis.totalClaims}
            </p>
          </div>
        </div>

        {/* Logic Battlegrounds */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            ⚔️ The 6 Logic Battlegrounds
          </h2>

          <div className="space-y-6">
            {/* Fallacy Autopsy Theater */}
            <div className="border-l-4 border-red-600 pl-4 bg-red-50 p-4 rounded-r">
              <h3 className="text-lg font-bold text-red-900 mb-2">
                1. Fallacy Autopsy Theater
              </h3>
              <p className="text-gray-700">
                <strong>{report.logicBattlegrounds.fallacyCount}</strong> logical fallacies
                identified
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Tests for strawmen, ad hominem, post hoc reasoning, false equivalences
              </p>
            </div>

            {/* Contradiction Trials */}
            <div className="border-l-4 border-orange-600 pl-4 bg-orange-50 p-4 rounded-r">
              <h3 className="text-lg font-bold text-orange-900 mb-2">2. Contradiction Trials</h3>
              <p className="text-gray-700">
                <strong>{report.logicBattlegrounds.contradictionCount}</strong> internal
                contradictions found
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Checks for incompatible claims within the same work
              </p>
            </div>

            {/* Evidence War Rooms */}
            <div className="border-l-4 border-cyan-600 pl-4 bg-cyan-50 p-4 rounded-r">
              <h3 className="text-lg font-bold text-cyan-900 mb-2">3. Evidence War Rooms</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div>
                  <p className="text-xs text-gray-600">Peer-Reviewed</p>
                  <p className="text-xl font-bold text-cyan-900">
                    {report.logicBattlegrounds.evidenceQuality.tier1}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Statistical</p>
                  <p className="text-xl font-bold text-cyan-900">
                    {report.logicBattlegrounds.evidenceQuality.tier2}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Anecdotal</p>
                  <p className="text-xl font-bold text-cyan-900">
                    {report.logicBattlegrounds.evidenceQuality.tier3}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Speculation</p>
                  <p className="text-xl font-bold text-cyan-900">
                    {report.logicBattlegrounds.evidenceQuality.tier4}
                  </p>
                </div>
              </div>
            </div>

            {/* Metaphor MRI Scans */}
            <div className="border-l-4 border-purple-600 pl-4 bg-purple-50 p-4 rounded-r">
              <h3 className="text-lg font-bold text-purple-900 mb-2">4. Metaphor MRI Scans</h3>
              <p className="text-gray-700">
                Metaphor accuracy:{' '}
                <strong>{(report.logicBattlegrounds.metaphorAccuracy * 100).toFixed(0)}%</strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Evaluates whether analogies clarify or distort
              </p>
            </div>

            {/* Prediction Mortuaries */}
            <div className="border-l-4 border-pink-600 pl-4 bg-pink-50 p-4 rounded-r">
              <h3 className="text-lg font-bold text-pink-900 mb-2">5. Prediction Mortuaries</h3>
              <p className="text-gray-700">
                Prediction accuracy:{' '}
                <strong>
                  {report.logicBattlegrounds.predictionAccuracy !== null
                    ? `${report.logicBattlegrounds.predictionAccuracy.toFixed(0)}%`
                    : 'No predictions evaluated yet'}
                </strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Testable predictions tracked against real-world outcomes
              </p>
            </div>

            {/* Belief Transmission Labs */}
            <div className="border-l-4 border-green-600 pl-4 bg-green-50 p-4 rounded-r">
              <h3 className="text-lg font-bold text-green-900 mb-2">
                6. Belief Transmission Labs
              </h3>
              <p className="text-gray-700">
                Belief R₀: <strong>{report.scores.beliefImpactWeight.toFixed(2)}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Tracks citations, social shares, and societal reach
              </p>
            </div>
          </div>
        </div>

        {/* Topic Breakdown */}
        {report.topicBreakdown.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Topic Overlap Scores</h2>
            <p className="text-gray-600 mb-6">
              How central specific beliefs are to this book's thesis:
            </p>

            <div className="space-y-4">
              {report.topicBreakdown
                .sort((a, b) => b.overlapScore - a.overlapScore)
                .map((topic) => (
                  <div key={topic.topic}>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-700">{topic.topic}</span>
                      <span className="font-bold text-blue-900">
                        {topic.overlapScore.toFixed(0)}%
                      </span>
                    </div>
                    <ProgressBar value={topic.overlapScore} color="blue" />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Author Credibility */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">👤 Author Credibility</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Truth Equity Score</p>
              <p className="text-3xl font-bold text-blue-900 mb-2">
                {report.authorCredibility.truthEquityScore.toFixed(1)}/100
              </p>
              <p className="text-sm text-gray-600">Historical accuracy across all works</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Prediction Track Record</p>
              <p className="text-3xl font-bold text-purple-900 mb-2">
                {report.authorCredibility.predictionTrackRecord.toFixed(0)}%
              </p>
              <p className="text-sm text-gray-600">Accurate forecasts vs. total predictions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
