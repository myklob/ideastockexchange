import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Search — Idea Stock Exchange',
  description:
    'Find any belief, argument, or topic. A good remark stays findable — arguments have one home instead of scattering across dead threads.',
}

export const dynamic = 'force-dynamic'

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

async function runSearch(q: string) {
  // SQLite LIKE is case-insensitive for ASCII, which is what Prisma's
  // `contains` compiles to here — good enough for a findability pass.
  const [beliefs, args, topics] = await Promise.all([
    prisma.belief.findMany({
      where: { statement: { contains: q } },
      select: { id: true, slug: true, statement: true, positivity: true },
      take: 25,
    }),
    prisma.argument.findMany({
      where: {
        status: 'published',
        OR: [{ claim: { contains: q } }, { belief: { statement: { contains: q } } }],
      },
      select: {
        id: true,
        claim: true,
        side: true,
        belief: { select: { slug: true, statement: true } },
        parentBelief: { select: { slug: true, statement: true } },
      },
      take: 25,
    }),
    prisma.debateTopic.findMany({
      where: { OR: [{ title: { contains: q } }, { definition: { contains: q } }] },
      select: { id: true, slug: true, title: true, definition: true },
      take: 10,
    }),
  ])
  return { beliefs, args, topics }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = (q ?? '').trim()
  const results = query.length >= 2 ? await runSearch(query) : null

  return (
    <div className={container}>
      <p className="text-right text-sm italic text-gray-600 mb-6">
        <Link href="/" className="text-blue-700 hover:underline">Home</Link>
        {' > '}
        <strong>Search</strong>
      </p>
      <h1 className="text-3xl font-bold mb-3">Search</h1>
      <p className="text-lg text-gray-600 mb-6">
        Every belief, argument, and topic has one permanent home. If someone said it well last
        week, it is still here — and still accumulating a score.
      </p>

      <form action="/search" method="get" className="mb-8">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search beliefs, arguments, and topics…"
          className="w-full border border-gray-300 rounded px-4 py-2 text-base"
        />
      </form>

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-gray-600">Type at least two characters.</p>
      )}

      {results && (
        <>
          <h2 className="text-xl font-bold mt-8 mb-2">
            Beliefs ({results.beliefs.length})
          </h2>
          {results.beliefs.length === 0 ? (
            <p className="text-sm text-gray-500 mb-4">No beliefs match.</p>
          ) : (
            <ul className="list-disc ml-6 mb-4 space-y-1">
              {results.beliefs.map(b => (
                <li key={b.id}>
                  <Link href={`/beliefs/${b.slug}`} className="text-blue-700 hover:underline">
                    {b.statement}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <h2 className="text-xl font-bold mt-8 mb-2">
            Arguments ({results.args.length})
          </h2>
          {results.args.length === 0 ? (
            <p className="text-sm text-gray-500 mb-4">No arguments match.</p>
          ) : (
            <ul className="list-disc ml-6 mb-4 space-y-1">
              {results.args.map(a => (
                <li key={a.id}>
                  <Link href={`/beliefs/${a.belief.slug}`} className="text-blue-700 hover:underline">
                    {a.claim ?? a.belief.statement}
                  </Link>{' '}
                  <span className="text-sm text-gray-500">
                    ({a.side === 'agree' ? 'supports' : 'opposes'}{' '}
                    <Link
                      href={`/beliefs/${a.parentBelief.slug}`}
                      className="text-blue-700 hover:underline"
                    >
                      {a.parentBelief.statement}
                    </Link>
                    )
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2 className="text-xl font-bold mt-8 mb-2">
            Topics ({results.topics.length})
          </h2>
          {results.topics.length === 0 ? (
            <p className="text-sm text-gray-500 mb-4">No topics match.</p>
          ) : (
            <ul className="list-disc ml-6 mb-4 space-y-1">
              {results.topics.map(t => (
                <li key={t.id}>
                  <Link href={`/debate-topics/${t.slug}`} className="text-blue-700 hover:underline">
                    {t.title}
                  </Link>{' '}
                  <span className="text-sm text-gray-500">{t.definition.slice(0, 120)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
