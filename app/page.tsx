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
            Every law is a bet on reality. It says: &quot;If we enforce X, we&apos;ll get outcome Y.&quot;
            But unlike every other bet humans make, <strong>we&apos;re not allowed to check the math</strong>.
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
                      Purpose Gap Detected
                    </span>
                  </div>
                )}

                <div className="mt-4 text-sm text-[var(--accent)] font-medium">
                  View Diagnostic Dashboard &rarr;
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
            wikiLaw doesn&apos;t just audit existing laws. It generates <strong>versioned upgrades</strong>.
          </p>
          <p className="text-lg mb-6">
            A proposal isn&apos;t a rant or a wish list. It&apos;s a <strong>structured amendment</strong> with required fields:
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
              and amendment processes because they knew humans couldn&apos;t be trusted with unchecked
              authority. <strong>wikiLaw applies that same institutional design philosophy to every
              statute in the code.</strong>
            </p>
          </div>
        </section>

        {/* Schlicht Protocol */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">
            The Schlicht Protocol: AI-Powered Truth Verification
          </h2>
          <p className="text-lg text-[var(--muted-foreground)] mb-8">
            Specialized AI swarms continuously audit beliefs through adversarial protocol.
            Every claim gets a confidence meter, agent-certified arguments, and a live protocol log.
          </p>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="p-4 border border-[var(--border)] rounded-lg">
              <h3 className="font-semibold mb-2">Confidence Meter</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Not &quot;true&quot; or &quot;false&quot;&mdash;a probability distribution earned after thousands of adversarial cycles.
              </p>
            </div>
            <div className="p-4 border border-[var(--border)] rounded-lg">
              <h3 className="font-semibold mb-2">Agent Attribution</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Every score certified by specialized AIs: Logic-Check, Evidence-Bot, Red-Team.
              </p>
            </div>
            <div className="p-4 border border-[var(--border)] rounded-lg">
              <h3 className="font-semibold mb-2">Live Protocol Log</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Watch agents propose, attack, and merge claims in real-time. The sausage being made&mdash;cleanly.
              </p>
            </div>
          </div>

          <Link
            href="/protocol"
            className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View Protocol Dashboards
          </Link>
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
              href="/protocol"
              className="border border-[var(--border)] hover:border-[var(--accent)] px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Protocol Views
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-24">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-4">Idea Stock Exchange</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Computational Epistemology Platform. Making confidence inspectable.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/protocol" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]">Schlicht Protocol</Link></li>
                <li><Link href="/laws" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]">Browse Laws</Link></li>
                <li><a href="https://github.com/myklob/ideastockexchange/wiki" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]" target="_blank" rel="noopener noreferrer">Framework Wiki</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Framework</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://github.com/myklob/ideastockexchange/wiki/Truth-Score" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]" target="_blank" rel="noopener noreferrer">Truth</a></li>
                <li><a href="https://github.com/myklob/ideastockexchange/wiki" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]" target="_blank" rel="noopener noreferrer">Interests</a></li>
                <li><a href="https://github.com/myklob/ideastockexchange/wiki/Evidence-Verification-Score-(EVS)" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]" target="_blank" rel="noopener noreferrer">Evidence</a></li>
                <li><a href="https://github.com/myklob/ideastockexchange/wiki" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]" target="_blank" rel="noopener noreferrer">Assumptions</a></li>
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

function DiagnosticFeature({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 border border-[var(--border)] rounded-lg">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
    </div>
  );
}

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
}
