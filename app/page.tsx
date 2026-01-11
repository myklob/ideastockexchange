import Link from 'next/link';
import { exampleLaws } from '@/lib/data/example-laws';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">
            wikiLaw
          </h1>
          <p className="text-2xl text-[var(--muted-foreground)] mb-8">
            The Operating System for Law
          </p>
          <p className="text-lg max-w-3xl leading-relaxed">
            Every law is a bet on reality. It says: "If we enforce X, we'll get outcome Y."
            But unlike every other bet humans make, <strong>we're not allowed to check the math</strong>.
          </p>
          <p className="text-lg max-w-3xl leading-relaxed mt-4">
            wikiLaw changes that. It takes every law in every state and turns it into something
            you can actually <strong>test, argue about, and improve</strong>.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Core Concept */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">
            From Legal Text to Testable Claims
          </h2>
          <div className="bg-[var(--muted)] p-8 rounded-lg">
            <p className="text-lg mb-4">
              Right now, legal databases just catalog words. <strong>wikiLaw catalogs the beliefs those words operationalize.</strong>
            </p>
            <p className="text-lg">
              We sort laws two ways at once:
            </p>
            <ul className="list-disc list-inside ml-4 mt-4 space-y-2 text-lg">
              <li><strong>By Category</strong> (Tax, housing, education, criminal justice)</li>
              <li><strong>By the Actual Claims About Reality They Depend On</strong></li>
            </ul>
          </div>
        </section>

        {/* Example Laws */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">
            Example Laws
          </h2>
          <p className="text-lg text-[var(--muted-foreground)] mb-8">
            See how wikiLaw exposes the operating logic, evidence, and tradeoffs behind real legislation.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {exampleLaws.map((law) => (
              <Link
                key={law.id}
                href={`/law/${law.id}`}
                className="block p-6 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--accent)]">
                    {law.jurisdiction}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                    {law.category.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-2">
                  {law.officialTitle}
                </h3>

                <p className="text-[var(--muted-foreground)] mb-4">
                  {law.plainEnglishSummary}
                </p>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Stated Purpose:</span>{' '}
                    <span className="text-[var(--muted-foreground)]">
                      {law.statedPurpose.substring(0, 80)}...
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Operative Purpose:</span>{' '}
                    <span className="text-[var(--muted-foreground)]">
                      {law.operativePurpose.substring(0, 80)}...
                    </span>
                  </div>
                </div>

                {law.purposeGap && (
                  <div className="mt-4 p-3 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded">
                    <span className="text-sm font-medium text-[var(--warning)]">
                      ⚠ Purpose Gap Detected
                    </span>
                  </div>
                )}

                <div className="mt-4 text-sm text-[var(--accent)] font-medium">
                  View Diagnostic Dashboard →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* The Law Page */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">
            The Law Page: A Diagnostic Panel
          </h2>
          <p className="text-lg text-[var(--muted-foreground)] mb-6">
            Each law gets one permanent, canonical page. Not a text dump. A <strong>verification dashboard</strong>:
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DiagnosticFeature
              title="Plain-English Decode"
              description="What the law actually changes in the real world, stripped of legalese."
            />
            <DiagnosticFeature
              title="Stated vs. Operative Purpose"
              description="What the law claims it's doing vs. the incentives it actually creates."
            />
            <DiagnosticFeature
              title="Evidence Audit"
              description="The best arguments and data for/against effectiveness, organized with quality scoring."
            />
            <DiagnosticFeature
              title="Justification Stress-Test"
              description="Constitutional conflicts, values alignment, and the reversibility test."
            />
            <DiagnosticFeature
              title="Stakeholder Ledger"
              description="Who pays? Who benefits? Who's the silent victim of second-order effects?"
            />
            <DiagnosticFeature
              title="Implementation Tracker"
              description="What the law says on paper vs. what actually gets enforced."
            />
          </div>
        </section>

        {/* Suggest a Change */}
        <section className="mb-16 bg-[var(--muted)] p-8 rounded-lg">
          <h2 className="text-3xl font-bold mb-6">
            Suggest a Change: Pull Requests for Society
          </h2>
          <p className="text-lg mb-6">
            wikiLaw doesn't just audit existing laws. It generates <strong>versioned upgrades</strong>.
          </p>
          <p className="text-lg mb-6">
            A proposal isn't a rant or a wish list. It's a <strong>structured amendment</strong> with required fields:
          </p>

          <ul className="space-y-3 mb-8">
            <ProposalRequirement
              number="1"
              title="Goal"
              description="What measurable failure are you fixing? Tied to Interests framework."
            />
            <ProposalRequirement
              number="2"
              title="Mechanism"
              description="How does your wording change incentives? Walk through the causal chain."
            />
            <ProposalRequirement
              number="3"
              title="Evidence"
              description="Why will your fix work? What data would prove you wrong?"
            />
            <ProposalRequirement
              number="4"
              title="Trade-off Audit"
              description="Explicit costs, risks, and burdens. Honesty earns credibility."
            />
          </ul>

          <Link
            href="/proposal/new"
            className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create a Proposal
          </Link>
        </section>

        {/* The Vision */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">
            Why This Matters
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-lg leading-relaxed mb-4">
              Most legal sites tell you what the law <em>says</em>.
            </p>
            <p className="text-lg leading-relaxed mb-4">
              <strong>wikiLaw demands to know: Does it work? Is it justified? What does it break?
              And what would work better?</strong>
            </p>
            <p className="text-lg leading-relaxed mb-4">
              It replaces moral theater with mechanism design. It replaces tribal loyalty with
              consequential analysis. It turns law from priesthood to engineering.
            </p>
            <p className="text-lg leading-relaxed">
              The Founders built a Constitution with separation of powers, checks and balances,
              and amendment processes because they knew humans couldn't be trusted with unchecked
              authority. <strong>wikiLaw applies that same institutional design philosophy to every
              statute in the code.</strong>
            </p>
          </div>
        </section>

        {/* Get Started */}
        <section className="bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5 p-12 rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-4">
            The legal code stops being sacred when it becomes auditable.
          </h2>
          <p className="text-xl text-[var(--muted-foreground)] mb-8">
            Start debugging.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/laws"
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Laws
            </Link>
            <Link
              href="/about"
              className="border border-[var(--border)] hover:border-[var(--accent)] px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Learn More
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-24">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-4">wikiLaw</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                The Operating System for Law. Part of the Idea Stock Exchange.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]">About</Link></li>
                <li><Link href="/laws" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]">Browse Laws</Link></li>
                <li><Link href="/proposals" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]">Proposals</Link></li>
                <li><a href="https://myclob.pbworks.com" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]" target="_blank" rel="noopener noreferrer">MyClob Framework</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Framework</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://myclob.pbworks.com/w/page/21960078/truth" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]" target="_blank" rel="noopener noreferrer">Truth</a></li>
                <li><a href="https://myclob.pbworks.com/w/page/159301140/Interests" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]" target="_blank" rel="noopener noreferrer">Interests</a></li>
                <li><a href="https://myclob.pbworks.com/w/page/159353568/Evidence" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]" target="_blank" rel="noopener noreferrer">Evidence</a></li>
                <li><a href="https://myclob.pbworks.com/Assumptions" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]" target="_blank" rel="noopener noreferrer">Assumptions</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
            <p>No ideological ownership. Good ideas win by surviving reality.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component for diagnostic features
function DiagnosticFeature({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 border border-[var(--border)] rounded-lg">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
    </div>
  );
}

// Component for proposal requirements
function ProposalRequirement({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <li className="flex gap-4">
      <span className="flex-shrink-0 w-8 h-8 bg-[var(--accent)] text-white rounded-full flex items-center justify-center font-bold">
        {number}
      </span>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-[var(--muted-foreground)]">{description}</p>
      </div>
    </li>
  );
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
