"use client";

import { useState, useEffect } from "react";
import ClaimCard from "@/components/ClaimCard";

interface ClaimData {
  id: string;
  title: string;
  description: string;
  category: string;
  reasonRank: number;
  truthScore: number;
  liquidityPool: {
    yesShares: number;
    noShares: number;
    totalVolume: number;
  } | null;
  marketPrice: {
    yes: number;
    no: number;
  };
  divergence: number;
}

export default function MarketsPage() {
  const [claims, setClaims] = useState<ClaimData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("reasonRank");

  useEffect(() => {
    async function fetchClaims() {
      setLoading(true);
      try {
        const res = await fetch(`/api/claims?status=ACTIVE&sortBy=${sortBy}`);
        const data = await res.json();
        setClaims(data);
      } catch {
        setClaims([]);
      }
      setLoading(false);
    }
    fetchClaims();
  }, [sortBy]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Markets</h1>
          <p className="text-sm text-[var(--neutral)] mt-1">
            Active claims. Invest based on logical fundamentals, profit from
            market mispricing.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="sort" className="text-[var(--neutral)]">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[var(--card-bg)] border border-[var(--border)] rounded px-2 py-1 text-white"
          >
            <option value="reasonRank">ReasonRank</option>
            <option value="truthScore">TruthScore</option>
            <option value="updatedAt">Recent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--neutral)]">
          Loading markets...
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-12 text-[var(--neutral)]">
          No active claims. Create one to open a market.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {claims.map((claim) => (
            <ClaimCard
              key={claim.id}
              id={claim.id}
              title={claim.title}
              category={claim.category}
              reasonRank={claim.reasonRank}
              truthScore={claim.truthScore}
              marketPriceYes={claim.marketPrice.yes}
              marketPriceNo={claim.marketPrice.no}
              volume={claim.liquidityPool?.totalVolume || 0}
              divergence={claim.divergence}
            />
          ))}
        </div>
      )}
    </div>
  );
}
import Link from 'next/link';
import { exampleLaws } from '@/features/legal-framework/data/example-laws';

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

        {/* Cost-Benefit Analysis */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">
            Cost-Benefit Analysis: Calibrated Expected Value
          </h2>
          <p className="text-lg text-[var(--muted-foreground)] mb-8">
            Traditional CBA lets proponents claim &ldquo;Best Case Scenario&rdquo; without justification.
            Here, every cost and benefit has a Likelihood Score that must survive adversarial scrutiny.
            Impacts don&apos;t count unless their probabilities survive attack.
          </p>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="p-4 border border-[var(--border)] rounded-lg">
              <h3 className="font-semibold mb-2">Likelihood as Nested Belief</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Each probability is a claim that must be argued for with evidence, base rates, and historical data.
              </p>
            </div>
            <div className="p-4 border border-[var(--border)] rounded-lg">
              <h3 className="font-semibold mb-2">Competing Estimates</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Multiple probability estimates coexist. The one backed by the strongest argument tree wins.
              </p>
            </div>
            <div className="p-4 border border-[var(--border)] rounded-lg">
              <h3 className="font-semibold mb-2">Expected Value Formula</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Predicted Impact &times; Likelihood Score = Expected Value. A $10M risk at 10% subtracts exactly $1M.
              </p>
            </div>
          </div>

          <Link
            href="/cba"
            className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View Cost-Benefit Analyses
          </Link>
        </section>

        {/* ReasonRank Scoring System */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">
            The ReasonRank Scoring System
          </h2>
          <p className="text-lg text-[var(--muted-foreground)] mb-8">
            Like Google&apos;s PageRank but for reasoning. Every belief gets scored based on
            the network of arguments supporting and opposing it. All scores flow through
            a single unified scoring engine.
          </p>

          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border border-[var(--border)] rounded-lg overflow-hidden">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold w-1/4">Score Type</th>
                  <th className="text-left px-4 py-3 font-semibold">What It Measures</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-semibold">
                    <Link href="/protocol" className="text-[var(--accent)] hover:underline">ReasonRank</Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    The foundation. Uses argument network analysis. A belief&apos;s score = strength of
                    supporting arguments minus opposing arguments, weighted by each argument&apos;s linkage,
                    importance, logical validity, and evidence quality.
                  </td>
                </tr>
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-semibold">Truth Scores</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    ReasonRank applied to whether a belief is logically valid and empirically verified.
                    Measures &quot;Is this claim true?&quot; separate from &quot;Is it relevant?&quot;
                  </td>
                </tr>
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-semibold">Linkage Scores</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    How strongly evidence connects to conclusions. High linkage = &quot;If this evidence is true,
                    it necessarily strengthens the conclusion.&quot; Low linkage = &quot;True but irrelevant.&quot;
                  </td>
                </tr>
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-semibold">Evidence Scores</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    EVS = Source Weight × log2(Replications + 1) × Relevance × Consistency.
                    Peer-reviewed studies (T1) score higher than anecdotes (T4). Reproducible experiments
                    beat one-off observations.
                  </td>
                </tr>
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-semibold">Importance Weights</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    Two components: (1) ReasonRank score for whether an argument aligns with the best
                    objective criteria, (2) Total expected costs + benefits weighted by how critical
                    the belief is to outcomes.
                  </td>
                </tr>
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-semibold">
                    <Link href="/cba" className="text-[var(--accent)] hover:underline">Likelihood Scores</Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    ReasonRank applied to cost/benefit predictions. Competing forecasts argue for their
                    probability. The estimate backed by the strongest surviving argument tree wins.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-[var(--muted)] p-6 rounded-lg">
            <h3 className="font-semibold mb-3">How It All Connects</h3>
            <div className="text-sm text-[var(--muted-foreground)] space-y-2">
              <p>
                <strong>1.</strong> Every belief has a <strong>Truth Score</strong> computed from
                its argument tree (pro vs. con strength) and evidence quality.
              </p>
              <p>
                <strong>2.</strong> Each argument&apos;s impact is weighted by its <strong>Linkage Score</strong> (relevance)
                and <strong>Truth Score</strong> (accuracy). Detected fallacies reduce the truth score.
              </p>
              <p>
                <strong>3.</strong> Evidence is scored by the <strong>EVS formula</strong> —
                source independence, replication count, conclusion relevance, and replication consistency.
              </p>
              <p>
                <strong>4.</strong> In Cost-Benefit Analysis, each probability is a nested belief node
                with competing <strong>Likelihood Scores</strong>. The winner is determined by ReasonRank, not voting.
              </p>
              <p>
                <strong>5.</strong> All scores flow through a <strong>single unified scoring engine</strong>,
                ensuring Protocol beliefs and CBA estimates use identical logic.
              </p>
            </div>
            <div className="mt-4">
              <Link
                href="/api/scoring"
                className="text-sm text-[var(--accent)] hover:underline font-medium"
              >
                View Live Scoring Data (JSON) &rarr;
              </Link>
            </div>
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
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/laws"
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Laws
            </Link>
            <Link
              href="/cba"
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Cost-Benefit Analysis
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
                <li><Link href="/cba" className="text-[var(--muted-foreground)] hover:text-[var(--accent)]">Cost-Benefit Analysis</Link></li>
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
