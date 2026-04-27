import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Topic Overlap Scores — Idea Stock Exchange',
  description:
    'Topic Overlap Scores prevent repetition from inflating belief scores. A token-overlap deduplication assigns each argument an uniqueness factor; the same algorithm powers the Related Pages module.',
}

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>Topic Overlap</strong>
    </p>
  )
}

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-mono text-base my-4 rounded text-center">
      {children}
    </div>
  )
}

const examplePairs = [
  {
    a: 'The policy raises costs for low-income households.',
    b: 'The policy increases costs for low-income families.',
    sim: 0.85,
    note: 'Synonym + minor variation. Triggers mechanical equivalence.',
  },
  {
    a: 'Studies show the drug is effective in adults.',
    b: 'Studies show the drug works in adults.',
    sim: 0.90,
    note: '“Works” canonicalizes to a known synonym group; Layer-1 flag.',
  },
  {
    a: 'The treatment improves outcomes by 30%.',
    b: 'The treatment fails to improve outcomes.',
    sim: 0.05,
    note: 'Negation flips the canonical token; uniqueness preserved.',
  },
  {
    a: 'Carbon dioxide emissions cause warming.',
    b: 'Greenhouse gases drive temperature rise.',
    sim: 0.45,
    note: 'Different surface tokens; mechanical layer alone undercounts. A semantic-similarity layer can catch these when available.',
  },
]

export default function TopicOverlapPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Topic Overlap Scores: Repetition Is Not Confirmation
      </h1>

      <p className="mb-3 text-[1.05rem]">
        Without an overlap check, the same point made ten different ways would count as ten
        different points. That is the easiest way to manufacture apparent consensus on the
        platform &mdash; and the easiest gaming pattern to defeat. Topic Overlap Scores assign
        each argument a uniqueness factor between 0 and 1 based on how much its content already
        appears among earlier arguments on the page. Redundant arguments contribute
        proportionally less; novel arguments contribute fully.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Core Rule</h2>

      <FormulaBox>
        uniqueness = 1 &minus; max(similarity to any prior argument)
      </FormulaBox>

      <p className="mb-3">
        For each argument, the system computes its similarity to every other argument that
        already exists in the same context. The argument&apos;s uniqueness is one minus its
        highest such similarity. An argument 90% similar to an existing one carries 10% of the
        weight it would otherwise have. A fully novel argument carries 100%.
      </p>

      <p className="mb-4 text-sm text-gray-600">
        The first argument in any cluster always scores 100% &mdash; original claimants are
        not penalized for being first.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Three Similarity Layers</h2>

      <p className="mb-3">
        The full pipeline blends three independent similarity signals. The frontend implements
        the first; the backend can supply the others when available.
      </p>

      <ol className="list-decimal list-outside ml-6 mb-6 space-y-3">
        <li>
          <strong>Layer 1 &mdash; Mechanical equivalence.</strong> Token-overlap (Jaccard)
          similarity after normalizing synonyms and negated antonyms. Above the 0.85 threshold,
          two arguments are flagged as mechanically equivalent without needing further checks.
          Pure TypeScript, no external dependencies.
        </li>
        <li>
          <strong>Layer 2 &mdash; Semantic overlap.</strong> Cosine similarity of sentence
          embeddings produced by the backend. Catches paraphrases that share little surface
          vocabulary &mdash; &ldquo;CO<sub>2</sub> emissions cause warming&rdquo; vs.
          &ldquo;greenhouse gases drive temperature rise&rdquo;.
        </li>
        <li>
          <strong>Layer 3 &mdash; Community verification.</strong> Editors and other readers
          can affirm or reject a duplication flag in a sub-debate. The resolved community
          score, when present, supersedes the algorithmic estimate.
        </li>
      </ol>

      <p className="mb-3 text-sm text-gray-600">
        When all three layers are available, the blended similarity is{' '}
        <code className="bg-gray-100 px-1 rounded">0.4 × L1 + 0.6 × L2</code> (with L3 acting
        as a manual override). When only Layer 1 is available, it acts alone &mdash; this is
        the path the frontend always takes for arguments not yet processed by the backend
        embedding service.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Synonym and Antonym Normalization</h2>

      <p className="mb-3">
        Layer 1 treats words within a synonym group as the same token, and a negated word as
        the same token as its positive counterpart. This canonicalization solves a common
        edge case: the same claim worded with different vocabulary, e.g., &ldquo;reduce
        emissions&rdquo; and &ldquo;decrease emissions&rdquo;, scores as fully equivalent
        rather than slightly different.
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Argument A</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Argument B</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Similarity</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {examplePairs.map((p, i) => (
              <tr key={i}>
                <td className="border border-gray-300 px-3 py-2 italic">&ldquo;{p.a}&rdquo;</td>
                <td className="border border-gray-300 px-3 py-2 italic">&ldquo;{p.b}&rdquo;</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                  {p.sim.toFixed(2)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-xs text-gray-600">
                  {p.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">How Uniqueness Composes Into ReasonRank</h2>

      <p className="mb-3">
        Uniqueness multiplies into the rawImpact in the recursive ReasonRank propagation:
      </p>

      <FormulaBox>
        rawImpact = reasonRank &times; linkage &times; importance &times; uniqueness
      </FormulaBox>

      <p className="mb-4">
        A redundant argument loses weight proportional to its similarity, so a stack of ten
        near-identical arguments behaves much more like one argument. The first one in the
        stack carries full weight; the rest are heavily discounted. This is how the platform
        prevents the &ldquo;same point dressed up ten ways&rdquo; failure mode without
        deleting any of the contributions.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Related Pages Module</h2>

      <p className="mb-4">
        The same overlap algorithm powers the &ldquo;Related Pages&rdquo; section on every
        belief page. Pages with high pairwise overlap on their statement texts are surfaced as
        adjacent topics, ranked by overall ReasonRank score. This gives readers a way to
        navigate from a belief to the next-most-relevant one without relying on hand-curated
        cross-links.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Developer Reference</h2>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Source</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`import { calculateTopicOverlapScore } from '@/core/scoring'

const result = calculateTopicOverlapScore([
  { id: 'a1', text: 'The policy raises costs for low-income households.' },
  { id: 'a2', text: 'The policy increases costs for low-income families.' },
  { id: 'a3', text: 'The policy expands healthcare access.' },
])
// → { averageUniqueness, duplicatePairCount, contributionFactors: { a1: 1.0, a2: 0.15, a3: 1.0 } }`}
        </pre>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Implementation:{' '}
        <code className="bg-gray-100 px-1 rounded">
          src/core/scoring/all-scores.ts → calculateTopicOverlapScore
        </code>
        , delegating to mechanical similarity in{' '}
        <code className="bg-gray-100 px-1 rounded">
          src/core/scoring/duplication-scoring.ts
        </code>
        . The mechanical equivalence threshold is the constant{' '}
        <code className="bg-gray-100 px-1 rounded">MECHANICAL_EQUIVALENCE_THRESHOLD</code>{' '}
        (0.85).
      </p>

      <hr className="my-6 border-gray-300" />

      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/belief-equivalency" className="text-blue-700 hover:underline">
              Belief Equivalency
            </Link>{' '}
            &mdash; the same primitive applied at the belief-vs-belief level
          </li>
          <li>
            <Link href="/algorithms/combine-similar-beliefs" className="text-blue-700 hover:underline">
              Combine Similar Beliefs
            </Link>{' '}
            &mdash; the merging pipeline that runs after equivalency review
          </li>
          <li>
            <Link href="/algorithms/sub-argument-aggregation" className="text-blue-700 hover:underline">
              Sub-Argument Aggregation
            </Link>{' '}
            &mdash; where uniqueness multiplies into rawImpact
          </li>
          <li>
            <Link href="/algorithms" className="text-blue-700 hover:underline">
              Full Algorithms index
            </Link>
          </li>
        </ul>
      </div>
    </main>
  )
}
