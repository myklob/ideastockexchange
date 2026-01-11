import Link from 'next/link'
import { prisma } from '@/lib/db'

async function getTopics() {
  const topicOverlaps = await prisma.topicOverlap.findMany({
    include: {
      book: {
        include: {
          authorProfile: true,
        },
      },
    },
    orderBy: {
      overlapScore: 'desc',
    },
  })

  // Group by topic name
  const topicsMap = new Map<string, any[]>()

  topicOverlaps.forEach((overlap) => {
    if (!topicsMap.has(overlap.topicName)) {
      topicsMap.set(overlap.topicName, [])
    }
    topicsMap.get(overlap.topicName)!.push({
      book: overlap.book,
      overlapScore: overlap.overlapScore,
    })
  })

  return Array.from(topicsMap.entries()).map(([name, books]) => ({
    name,
    bookCount: books.length,
    books: books.sort((a, b) => b.overlapScore - a.overlapScore),
  }))
}

export default async function TopicsPage() {
  const topics = await getTopics()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-900">Idea Stock Exchange</h1>
            <nav className="flex gap-6">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                Home
              </Link>
              <Link href="/books" className="text-blue-600 hover:text-blue-800">
                Books
              </Link>
              <Link
                href="/topics"
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Topics
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎯 Topics & Beliefs</h1>
          <p className="text-lg text-gray-700">
            Books organized by the beliefs they defend or challenge. Each topic shows which books
            address it most centrally, with overlap scores indicating how central that belief is to
            the book's thesis.
          </p>
        </div>

        {topics.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <p className="text-gray-600 mb-4">No topics available yet.</p>
            <p className="text-gray-500 text-sm">
              Run the seed script to populate sample data with books and their topic overlaps.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {topics.map((topic) => (
              <div key={topic.name} className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{topic.name}</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {topic.bookCount} {topic.bookCount === 1 ? 'book' : 'books'} address this topic
                </p>

                <div className="space-y-3">
                  {topic.books.map((item) => (
                    <Link
                      key={item.book.id}
                      href={`/books/${item.book.id}`}
                      className="block border-l-4 border-blue-600 pl-4 py-2 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.book.title}</p>
                          <p className="text-sm text-gray-600">{item.book.author}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-blue-900">
                            {item.overlapScore.toFixed(0)}%
                          </p>
                          <p className="text-xs text-gray-600">overlap</p>
                        </div>
                      </div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${item.overlapScore}%` }}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
