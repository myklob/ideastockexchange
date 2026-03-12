import Link from 'next/link'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getBooks(): Promise<any[]> {
  return (prisma as any).book.findMany({
    include: {
      topicOverlaps: true,
      authorProfile: true,
      _count: {
        select: {
          claims: true,
          fallacies: true,
        },
      },
    },
    orderBy: {
      logicalValidityScore: 'desc',
    },
  })
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-700 bg-green-50'
  if (score >= 60) return 'text-yellow-700 bg-yellow-50'
  return 'text-red-700 bg-red-50'
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Exceptional'
  if (score >= 80) return 'Strong'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Moderate'
  return 'Weak'
}

export const dynamic = 'force-dynamic'

export default async function BooksPage() {
  const books = await getBooks()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-900">Idea Stock Exchange</h1>
            <nav className="flex gap-6">
              <Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link>
              <Link href="/books" className="text-blue-600 hover:text-blue-800 font-semibold">Books</Link>
              <Link href="/topics" className="text-blue-600 hover:text-blue-800">Topics</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📚 Completed Evidence Analyses & Examples
          </h1>
          <p className="text-lg text-gray-700">
            See the ISE methodology in action with these detailed book analyses. Each demonstrates
            how systematic scrutiny reveals logic heatmaps—showing exactly where arguments excel
            or fail.
          </p>
        </div>

        {books.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <p className="text-gray-600 mb-4">No book analyses available yet.</p>
            <p className="text-gray-500 text-sm">
              Example books will be seeded into the database. Run the seed script to populate
              sample data.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {books.map((book: any) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="block bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        📖 {book.title}
                      </h2>
                      <p className="text-gray-600 mb-1">by {book.author}</p>
                      {book.publishYear && (
                        <p className="text-sm text-gray-500">Published: {book.publishYear}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-block px-4 py-2 rounded-lg font-bold text-lg ${getScoreColor(
                          book.logicalValidityScore
                        )}`}
                      >
                        {book.logicalValidityScore.toFixed(0)}/100
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {getScoreLabel(book.logicalValidityScore)}
                      </p>
                    </div>
                  </div>

                  {book.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{book.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-xs text-gray-600 mb-1">Logical Validity</p>
                      <p className="text-lg font-bold text-blue-900">
                        {book.logicalValidityScore.toFixed(0)}/100
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-xs text-gray-600 mb-1">Quality Score</p>
                      <p className="text-lg font-bold text-purple-900">
                        {book.qualityScore.toFixed(0)}/100
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-xs text-gray-600 mb-1">Claims Analyzed</p>
                      <p className="text-lg font-bold text-green-900">{book._count.claims}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <p className="text-xs text-gray-600 mb-1">Belief Impact (R₀)</p>
                      <p className="text-lg font-bold text-orange-900">
                        {book.beliefImpactWeight.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {book.topicOverlaps.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Topic Overlap:</strong>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {book.topicOverlaps.slice(0, 5).map((topic: any) => (
                          <span
                            key={topic.id}
                            className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm"
                          >
                            {topic.topicName} ({topic.overlapScore.toFixed(0)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {book._count.fallacies > 0 && (
                    <div className="mt-3 bg-red-50 border-l-4 border-red-600 p-3 rounded-r">
                      <p className="text-sm text-red-900">
                        <strong>⚠️ {book._count.fallacies} logical fallacies identified</strong>
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
