import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Competitive Strategy | Idea Stock Exchange',
  description:
    'How the Idea Stock Exchange competes with Kalshi and Polymarket: a prediction market on belief scores, not events. A market and a reasoning platform that reinforce each other.',
};

export default function StrategyPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <nav className="text-sm mb-6">
            <Link href="/" className="text-[var(--accent)] hover:underline">
              &larr; Home
            </Link>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Idea Stock Exchange: Competitive Strategy
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-3xl leading-relaxed">
            How we compete with Kalshi and Polymarket, honestly. A living document for
            contributors deciding how to build features and outsiders evaluating the project.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-[var(--muted-foreground)]">
            <span>
              <strong className="text-[var(--foreground)]">Audience:</strong> Contributors,
              evaluators, future Mike.
            </span>
            <span>
              <strong className="text-[var(--foreground)]">Status:</strong> Living document.
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-16">
        {/* One-sentence pitch */}
        <section>
          <h2 className="text-3xl font-bold mb-6">The one-sentence pitch</h2>
          <div className="bg-[var(--muted)] border-l-4 border-[var(--accent)] p-6 rounded-lg">
            <p className="text-lg leading-relaxed">
              The Idea Stock Exchange is a prediction market where people bet on whether a
              belief&apos;s score will be above or below a threshold at the end of the month. The
              score is computed from the underlying argument graph, so the only way to move
              the score is to post better arguments.{' '}
              <strong>
                This is simultaneously a market and a reasoning platform, and the two halves
                reinforce each other.
              </strong>
            </p>
          </div>
        </section>

        {/* Who we're not competing with */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Who we&apos;re not competing with</h2>
          <div className="space-y-4 text-lg leading-relaxed">
            <p>
              Most of Kalshi&apos;s and Polymarket&apos;s volume is in event markets:
              elections, sports, weather, corporate earnings, Fed rate decisions. These are
              binary events with clean external resolution. A judge rings a bell, the outcome
              is observed, contracts settle.
            </p>
            <p>
              <strong>We don&apos;t do that, and we shouldn&apos;t try.</strong> Competing on
              event markets means competing on liquidity, UX polish, regulatory
              infrastructure, and speed to market. Kalshi has CFTC approval, hundreds of
              millions in funding, and years of head start. Polymarket has Polygon,
              crypto-native distribution, and a brand. We have none of those advantages and
              no realistic path to acquiring them.
            </p>
            <p>
              If you ever hear the project describe itself as &ldquo;Polymarket but for
              beliefs,&rdquo; correct the record. That framing guarantees failure. It sets us
              up to lose on every axis Polymarket is strong on and ignores the axis where
              we&apos;re actually different.
            </p>
          </div>
        </section>

        {/* The gap */}
        <section>
          <h2 className="text-3xl font-bold mb-6">The gap we fill that they can&apos;t</h2>
          <div className="space-y-4 text-lg leading-relaxed">
            <p>
              Prediction markets only work on events with external resolution. This limits
              them to a narrow slice of the questions people actually care about.
            </p>
            <p>The questions that matter most are the ones that never resolve:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Does universal basic income improve outcomes?</li>
              <li>Is carbon pricing effective at reducing emissions?</li>
              <li>Do charter schools outperform traditional public schools?</li>
              <li>Is nuclear power safer than renewables?</li>
              <li>Should the US adopt single-payer healthcare?</li>
            </ul>
            <p>
              Nobody rings a bell on these questions. There&apos;s no binary resolution date.
              No contract can settle on &ldquo;is UBI good&rdquo; because &ldquo;good&rdquo;
              depends on values, timeframe, comparison group, and about fifteen other things
              that people disagree about.
            </p>
            <p>
              Polymarket and Kalshi cannot touch these questions. Not because they
              haven&apos;t tried, but because their whole mechanism requires external
              resolution. They resolve on <em>facts</em> (did Biden win, did the Fed cut
              rates). They can&apos;t resolve on <em>arguments</em>.
            </p>
            <p>
              We can, because we resolve on an internal fact: the output of our own{' '}
              <Link href="/protocol" className="text-[var(--accent)] hover:underline">
                scoring engine
              </Link>{' '}
              at a specific date. The scoring engine evaluates the arguments that exist in
              the graph at snapshot time. If you want to move the score, you post better
              arguments, better evidence, or tighter linkages. The market creates a financial
              incentive to engage seriously with the reasoning.
            </p>
            <div className="bg-[var(--muted)] p-6 rounded-lg border border-[var(--border)]">
              <p>
                <strong>This is the gap.</strong> The world has roughly 10,000 questions
                that matter and maybe 100 of them are event-market-resolvable. We&apos;re
                going after the other 9,900.
              </p>
            </div>
          </div>
        </section>

        {/* Two halves */}
        <section>
          <h2 className="text-3xl font-bold mb-6">
            How the two halves reinforce each other
          </h2>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="p-6 border border-[var(--border)] rounded-lg bg-[var(--muted)]">
              <h3 className="text-xl font-semibold mb-3">
                Why markets need the reasoning platform
              </h3>
              <p className="leading-relaxed mb-3">
                Without the scoring engine, a market on &ldquo;is UBI good&rdquo; has nothing
                to settle against. You&apos;d need a judge, and judges bring bias. You&apos;d
                need a committee, and committees bring politics. You&apos;d need external
                polls, and polls measure popularity, not truth.
              </p>
              <p className="leading-relaxed">
                The scoring engine solves the resolution problem. A belief&apos;s score at
                epoch N is a defined computation over a defined graph at a defined time. The
                inputs are public, the algorithm is public, the output is reproducible.
                Contracts settle against the snapshot. Nobody needs to trust a judge.
              </p>
            </div>

            <div className="p-6 border border-[var(--border)] rounded-lg bg-[var(--muted)]">
              <h3 className="text-xl font-semibold mb-3">
                Why the reasoning platform needs markets
              </h3>
              <p className="leading-relaxed mb-3">
                Without markets, a reasoning platform is a wiki. Wikis work for some things
                (Wikipedia) and fail for others (every &ldquo;structured debate&rdquo; site
                that&apos;s ever existed). The difference is engagement.
              </p>
              <p className="leading-relaxed">
                Markets solve the engagement problem. Money on the line is the oldest and
                most reliable mechanism for getting humans to think carefully. Polymarket
                election markets are more accurate than most pollsters, not because traders
                are smarter than pollsters, but because traders have skin in the game.
                We&apos;re applying the same principle to arguments.
              </p>
            </div>
          </div>

          <h3 className="text-2xl font-semibold mb-4">The design choice this creates</h3>
          <div className="space-y-4 text-lg leading-relaxed">
            <p>
              A bettor can also post arguments. This is unusual. In a normal prediction
              market, you can&apos;t edit the resolution condition. In our market, a bettor
              who&apos;s long on &ldquo;UBI score &gt; 0.6&rdquo; can post new pro-UBI
              arguments. Two things follow:
            </p>
            <p>
              <strong>First, this is a feature, not a bug.</strong> Letting bettors edit the
              graph is exactly how we get engagement. The whole point is that they care
              because they have money on the line. Removing that would be like Polymarket
              refusing to let bettors follow the news.
            </p>
            <p>
              <strong>Second, the design has to handle it.</strong> A bettor can&apos;t just
              spam low-quality arguments to inflate their side, because:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Weak arguments drag down the parent column&apos;s average (spam backfires mechanically)</li>
              <li>Duplicate arguments compress to one node (volume doesn&apos;t matter)</li>
              <li>Fallacy accusations can challenge bad arguments (and those accusations are themselves scored arguments)</li>
              <li>Linkage sub-markets let users bet against relevance claims</li>
              <li>The scoring formula is public, so sophisticated manipulation is visible</li>
            </ul>
            <p>
              This is the central engineering challenge: make the scoring engine robust
              enough that bettors trying to move the score{' '}
              <em>by posting bad arguments</em> fail, and bettors trying to move the score{' '}
              <em>by posting good arguments</em> succeed. When that works, the market turns
              adversarial self-interest into truth-seeking.
            </p>
            <p>
              This is exactly the mechanism Robin Hanson has been pointing at for decades.
              We&apos;re applying it to a substrate he didn&apos;t have — a computed argument
              score rather than an external event.
            </p>
          </div>
        </section>

        {/* Manipulation resistance */}
        <section>
          <h2 className="text-3xl font-bold mb-6">
            Why we survive the &ldquo;bettors manipulate the score&rdquo; attack
          </h2>
          <p className="text-lg leading-relaxed mb-6">
            The obvious failure mode: someone bets big on &ldquo;score &gt; 0.7,&rdquo; then
            spams pro-arguments to push the score past 0.7, then cashes out. If this works,
            the system is broken. Here&apos;s why it doesn&apos;t:
          </p>

          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <ManipulationDefense
              title="Duplicate compression"
              description="Ten thousand pro-arguments that say the same thing in different words compress to one node. You can't spam your way to a higher score, because the scoring engine sees through synonym attacks."
            />
            <ManipulationDefense
              title="Weak arguments backfire"
              description="Low-quality pro-arguments drag down the average quality of the pro column. Post 500 evidence-free one-liners and your side's score goes down, not up."
            />
            <ManipulationDefense
              title="Linkage challenges"
              description="For each argument someone posts, other users can bet that the linkage is weak. If the argument doesn't actually support the conclusion, the linkage sub-market punishes the attacker."
            />
            <ManipulationDefense
              title="Evidence scrutiny"
              description="Arguments with bad citations get low evidence scores. Fake citations, misrepresented studies, and cherry-picked data fail here."
            />
            <ManipulationDefense
              title="Fallacy counter-arguments"
              description="Structured fallacy accusations go through the same scoring pipeline. A successful fallacy accusation reduces the target argument's contribution."
            />
            <ManipulationDefense
              title="Transparency"
              description="Every score is a deterministic function of the graph. Sophisticated manipulation leaves visible traces. Coordinated brigading produces detectable graph patterns."
            />
          </div>

          <div className="bg-[var(--muted)] border-l-4 border-[var(--accent)] p-6 rounded-lg">
            <p className="text-lg leading-relaxed">
              The net effect: the only reliable way to move the score is to post arguments
              that <em>survive attack</em>. Which means the market pays people to find and
              defend the truth, because the truth is what survives attack. This is the whole
              thesis. If the thesis is wrong, the project doesn&apos;t work. If it&apos;s
              right, we have something nobody else has.
            </p>
          </div>
        </section>

        {/* Revenue model */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Revenue model</h2>

          <div className="space-y-6">
            <div className="p-6 border border-[var(--border)] rounded-lg">
              <h3 className="text-xl font-semibold mb-2">
                Transaction fees on every bet
              </h3>
              <p className="leading-relaxed">
                Same as Polymarket and Kalshi. Proven model. No reason to innovate here.
                Rough scale: if daily volume is $1M, a 1% fee generates $10K/day
                ($3.65M/year). To get there, we need users who care about the beliefs
                we&apos;re scoring, not users who just want to gamble.
              </p>
            </div>

            <div className="p-6 border border-[var(--border)] rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Eventually: data licensing</h3>
              <p className="leading-relaxed mb-3">
                The argument graph is a real asset. A dense, well-scored argument graph on
                major policy questions is useful to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Academic researchers studying public reasoning</li>
                <li>Think tanks and policy institutions</li>
                <li>Corporate strategy teams making high-stakes decisions</li>
                <li>Foundations deciding where to allocate funding</li>
                <li>Newsrooms wanting to show &ldquo;here&apos;s the strongest argument on each side&rdquo;</li>
              </ul>
              <p className="leading-relaxed mt-3">
                Longer-term, not near-term. But it&apos;s why the argument graph matters
                independently of the market.
              </p>
            </div>

            <div className="p-6 border border-[var(--destructive)]/40 rounded-lg bg-[var(--destructive)]/5">
              <h3 className="text-xl font-semibold mb-2 text-[var(--destructive)]">
                Never: ads, sponsored content, or manipulated scores
              </h3>
              <p className="leading-relaxed">
                Any of these would destroy the integrity of the scoring engine, which is the
                entire asset. Hard no.
              </p>
            </div>
          </div>
        </section>

        {/* Regulatory strategy */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Regulatory strategy</h2>

          <div className="space-y-4">
            <RegPhase
              phase="Phase 1"
              title="Play money only"
              body="No real currency, no withdrawals, no regulatory exposure. Users compete for reputation and leaderboard position. This can run indefinitely, in any jurisdiction, without legal risk — and it's the right phase to debug the scoring engine and market mechanics without consequences."
            />
            <RegPhase
              phase="Phase 2"
              title="Limited real money in permissive jurisdictions"
              body="Once the play-money version is stable and has an engaged user base, we explore real-money versions in jurisdictions that allow it. This means consulting lawyers, probably starting offshore, and accepting that US users may be restricted."
            />
            <RegPhase
              phase="Phase 3"
              title="Full regulated markets, maybe"
              body="Kalshi spent years getting CFTC approval. If we ever go this route, it's a multi-year, multi-million-dollar regulatory process. We do it only if the project has succeeded enough at Phase 2 to justify the investment."
            />
          </div>

          <div className="mt-6 bg-[var(--muted)] p-6 rounded-lg space-y-3">
            <p className="leading-relaxed">
              <strong>We do not skip phases.</strong> Polymarket paid $1.4M in CFTC fines for
              operating without approval and lost US users for years. We don&apos;t repeat
              that mistake.
            </p>
            <p className="leading-relaxed">
              <strong>
                We build every phase in a way that doesn&apos;t foreclose the next.
              </strong>{' '}
              Play-money contract structure should mirror what real-money contracts would
              look like. Settlement mechanics should be production-grade even during the
              play-money phase. Code written in Phase 1 should not need to be rewritten in
              Phase 2.
            </p>
          </div>
        </section>

        {/* Staged plan */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Staged plan</h2>

          <div className="space-y-4">
            <StagedPhase
              phase="Phase 1"
              title="Build the scoring engine"
              status="current"
              body="Engineering spec covers this. Not market-related except that the scoring engine is the foundation everything else sits on."
            />
            <StagedPhase
              phase="Phase 2"
              title="Play-money prediction market layer"
              body="Monthly epoch snapshots for settlement. Binary contracts ('Belief X score > Y at epoch N'). Simple order book or AMM (LMSR). Leaderboard showing top traders, top argument-posters, top fallacy-finders. UI that makes the connection between posting arguments and moving prices explicit."
              note="Goal: prove the flywheel works at play-money scale. If it doesn't work here, the project doesn't work at all — and we find out cheaply."
            />
            <StagedPhase
              phase="Phase 3"
              title="Argument graph density"
              body="Build out canonical belief pages across policy domains (energy, climate, immigration, healthcare, education). A prediction market on sparse argument graphs produces boring markets. Dense graphs produce interesting ones."
            />
            <StagedPhase
              phase="Phase 4"
              title="Real-money pilot"
              body="Jurisdictional research, legal setup, KYC/AML infrastructure, limited launch in permissive markets. Do not touch this phase until Phase 2 has proven the mechanics work."
            />
            <StagedPhase
              phase="Phase 5"
              title="Research and institutional partnerships"
              body="License the graph to researchers. Partner with newsrooms to display 'here's the scored argument map' alongside opinion pieces. Work with think tanks on policy-question graphs. Long-horizon revenue diversification."
            />
          </div>

          <p className="mt-6 text-[var(--muted-foreground)] italic">
            No fixed dates on any of these. We build as best we can. Each phase is shippable
            as a stand-alone product.
          </p>
        </section>

        {/* Why it might work */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Why this might actually work</h2>
          <div className="space-y-4 text-lg leading-relaxed">
            <p>
              Most &ldquo;wiki for debates&rdquo; or &ldquo;structured reasoning
              platform&rdquo; projects have failed. Debatepedia died. Kialo has a loyal but
              tiny user base. Arguman.org is a ghost town. The pattern is clear: people
              don&apos;t come to structured reasoning platforms voluntarily, because
              structured reasoning is hard and there&apos;s no reward for doing it.
            </p>
            <p>
              The market <em>is</em> the reward. Not because we&apos;re turning thinking
              into gambling, but because a small amount of money at stake is the cleanest
              known mechanism for getting humans to pay attention. Prediction markets
              demonstrate this repeatedly: traders on Polymarket election markets are more
              accurate than pollsters, not because they&apos;re smarter, but because they
              lose money when they&apos;re wrong.
            </p>
            <p>
              We&apos;re applying that mechanism to arguments instead of events. It might
              work. It might not. If it doesn&apos;t, we&apos;ve built a reasoning platform,
              which still has value. If it does, we have something nobody else has: a market
              that pays people to improve the quality of public reasoning.
            </p>
            <p className="text-xl font-medium">
              That&apos;s worth building, regardless of whether it ever competes with Kalshi
              or Polymarket on volume. Those are games of a different kind. We&apos;re
              playing something adjacent, and the adjacency is the point.
            </p>
          </div>
        </section>

        {/* Next links */}
        <section className="bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Where to go next</h2>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/protocol"
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              The Scoring Engine
            </Link>
            <Link
              href="/debate-topics"
              className="border border-[var(--border)] hover:border-[var(--accent)] px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Argument Graph
            </Link>
            <Link
              href="/cba"
              className="border border-[var(--border)] hover:border-[var(--accent)] px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Cost-Benefit Analysis
            </Link>
            <Link
              href="/faq"
              className="border border-[var(--border)] hover:border-[var(--accent)] px-6 py-3 rounded-lg font-medium transition-colors"
            >
              FAQ &amp; Criticisms
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function ManipulationDefense({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 border border-[var(--border)] rounded-lg">
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
    </div>
  );
}

function RegPhase({
  phase,
  title,
  body,
}: {
  phase: string;
  title: string;
  body: string;
}) {
  return (
    <div className="p-6 border border-[var(--border)] rounded-lg">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-sm font-medium text-[var(--accent)]">{phase}</span>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <p className="leading-relaxed text-[var(--muted-foreground)]">{body}</p>
    </div>
  );
}

function StagedPhase({
  phase,
  title,
  body,
  status,
  note,
}: {
  phase: string;
  title: string;
  body: string;
  status?: string;
  note?: string;
}) {
  return (
    <div className="p-6 border border-[var(--border)] rounded-lg">
      <div className="flex items-baseline gap-3 mb-2 flex-wrap">
        <span className="text-sm font-medium text-[var(--accent)]">{phase}</span>
        <h3 className="text-xl font-semibold">{title}</h3>
        {status === 'current' && (
          <span className="text-xs px-2 py-1 rounded bg-[var(--success)]/10 text-[var(--success)] font-medium">
            Current
          </span>
        )}
      </div>
      <p className="leading-relaxed text-[var(--muted-foreground)]">{body}</p>
      {note && (
        <p className="mt-3 text-sm italic border-l-2 border-[var(--accent)] pl-3">
          {note}
        </p>
      )}
    </div>
  );
}
