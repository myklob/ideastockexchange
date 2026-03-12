import Link from 'next/link';
import { listDebateTopics } from '@/features/debate-topics/db';

export const dynamic = 'force-dynamic';

export default async function DebateTopicsListPage() {
  const topics = await listDebateTopics();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-900">Idea Stock Exchange</h1>
          <nav className="flex gap-6 text-sm">
            <Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link>
            <Link href="/debate-topics" className="text-blue-600 hover:text-blue-800 font-semibold">Debate Topics</Link>
            <Link href="/beliefs" className="text-blue-600 hover:text-blue-800">Beliefs</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">📖 Debate Topic Pages</h1>
            <p className="text-gray-700 max-w-2xl">
              Wikipedia-for-debates: each topic page maps the full spectrum of positions, the evidence, the foundational assumptions, and the escalation levels — so you can understand any debate without getting lost in partisan framing.
            </p>
          </div>
          <div className="flex flex-col gap-2 ml-6 shrink-0">
            <Link
              href="/debate-topics/new"
              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 text-sm text-center"
            >
              + Create Topic
            </Link>
            <Link
              href="/debate-topics/new?generate=1"
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 text-sm text-center"
            >
              🤖 AI Generate
            </Link>
          </div>
        </div>

        {topics.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <p className="text-2xl mb-3">📭</p>
            <p className="text-gray-600 mb-4">No debate topics yet.</p>
            <p className="text-gray-500 text-sm mb-6">
              Create the first topic manually or let AI generate a full structured page for any debate.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/debate-topics/new"
                className="px-5 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
              >
                Create Manually
              </Link>
              <Link
                href="/debate-topics/new?generate=1"
                className="px-5 py-2 bg-green-700 text-white rounded hover:bg-green-800"
              >
                🤖 AI Generate
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/debate-topics/${topic.slug}`}
                className="block bg-white rounded-lg shadow-sm border p-5 hover:shadow-md hover:border-blue-300 transition-all"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-1">{topic.title}</h2>
                {topic.categoryPath.length > 0 && (
                  <p className="text-xs text-gray-500 mb-2">
                    {topic.categoryPath.join(' › ')}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  Added {new Date(topic.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
