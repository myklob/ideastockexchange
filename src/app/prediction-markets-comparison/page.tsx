import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Idea Stock Exchange vs Other Prediction Markets Like Polymarket — Engineering Specification',
  description:
    'Engineering specification for the Idea Stock Exchange prediction-market layer: contract structure, settlement mechanics, LMSR pricing, and market-specific anti-manipulation properties — and how it differs from Polymarket and Kalshi.',
};

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <strong>Idea Stock Exchange vs Other Prediction Markets</strong>
    </p>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f9f9f9] border-l-4 border-[#3366cc] px-4 py-4 my-5 rounded">
      {children}
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-gray-100 border border-gray-300 rounded p-4 overflow-x-auto text-sm font-mono my-4 whitespace-pre">
      {children}
    </pre>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-[0.9em] font-mono">
      {children}
    </code>
  );
}

export default function PredictionMarketsComparisonPage() {
  return (
    <main className="max-w-[960px] mx-auto px-4 py-8 text-[#222]">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-3 leading-tight">
        Idea Stock Exchange vs Other Prediction Markets Like Polymarket
      </h1>
      <p className="text-lg text-gray-600 mb-4">
        Prediction Market Layer: Engineering Specification
      </p>
      <p className="mb-6">
        <Link
          href="/markets"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm"
        >
          → Browse the live play-money markets
        </Link>
      </p>

      <Callout>
        <p className="mb-2">
          <strong>Companion to:</strong>{' '}
          <InlineCode>ENGINEERING_SPEC.md</InlineCode>
        </p>
        <p className="mb-2">
          <strong>Audience:</strong> AI assistants and contributors building the market layer.
        </p>
        <p className="mb-2">
          <strong>Purpose:</strong> Define contract structure, settlement mechanics, and
          market-specific anti-manipulation properties.
        </p>
        <p>
          <strong>Status:</strong> Living document. The play-money version comes first; real-money
          mechanics are noted but out of scope for now.
        </p>
      </Callout>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">What this document covers</h2>
      <p className="mb-3">
        This is the market half of the Idea Stock Exchange. The reasoning-engine half is covered in{' '}
        <InlineCode>ENGINEERING_SPEC.md</InlineCode> and should be read first. Nothing in this
        document overrides the core invariants in that spec. In particular:
      </p>
      <ul className="list-disc list-inside ml-4 space-y-1 mb-3">
        <li>Markets do not feed the scoring engine.</li>
        <li>Author identity does not enter the score formula.</li>
        <li>Fallacy-accusation mechanics work the same for bettors as for non-bettors.</li>
      </ul>
      <p className="mb-4">
        If you find yourself wiring market data back into scoring, stop and re-read{' '}
        <InlineCode>ENGINEERING_SPEC.md</InlineCode> section &ldquo;Core invariants.&rdquo;
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Contract structure</h2>
      <p className="mb-3">
        A contract is a binary claim about a belief&apos;s score at a specific snapshot epoch.
      </p>
      <CodeBlock>
{`Contract:
  contract_id          UUID, primary key
  belief_node_id       UUID, foreign key to Node (must be node_type = BELIEF)
  threshold_value      FLOAT in [0, 1]       (the score threshold being bet on)
  direction            ENUM: ABOVE | BELOW
  resolution_epoch     DATE                  (must be a future epoch)
  created_at           TIMESTAMP
  creator_id           UUID, foreign key to users
  liquidity_pool       FLOAT                 (backing funds for AMM, if applicable)
  fee_rate             FLOAT                 (transaction fee, basis points)
  status               ENUM: OPEN | FROZEN | SETTLED | CANCELLED
  final_score          FLOAT, nullable       (populated at settlement)
  final_outcome        ENUM: YES | NO, nullable (populated at settlement)`}
      </CodeBlock>
      <p className="mb-3">
        Example contract:{' '}
        <InlineCode>&ldquo;Carbon pricing reduces emissions&rdquo; score &gt; 0.65 at 2026-07-31</InlineCode>.
      </p>
      <p className="mb-3">
        At resolution epoch, the belief&apos;s <InlineCode>EpochSnapshot.truth_score</InlineCode>{' '}
        for that date determines the outcome:
      </p>
      <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
        <li>
          If <InlineCode>direction = ABOVE</InlineCode> and{' '}
          <InlineCode>final_score &gt; threshold_value</InlineCode>, YES wins
        </li>
        <li>
          If <InlineCode>direction = BELOW</InlineCode> and{' '}
          <InlineCode>final_score &lt; threshold_value</InlineCode>, YES wins
        </li>
        <li>
          If the score equals the threshold exactly, the contract resolves NO
          (convention: strict inequality)
        </li>
      </ul>

      <h3 className="text-xl font-bold mt-6 mb-2">Why monthly epochs</h3>
      <p className="mb-3">
        Monthly gives enough time for the argument graph to evolve meaningfully. Daily is too
        noisy (scores jitter on every edit). Quarterly is too slow (users lose interest). Weekly
        might work but doubles computational cost on snapshots. Monthly matches the cadence at
        which news, elections, and policy developments actually produce new arguments.
      </p>
      <p className="mb-4">
        The epoch cron job runs at 23:59:59 on the last day of each month. All scores are computed
        against the graph state at that instant. Arguments posted at 23:59:58 count. Arguments
        posted at 00:00:01 of the next day do not.
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Why binary contracts</h3>
      <p className="mb-3">
        Binary contracts are simpler to settle, easier to explain to users, and compose into more
        complex positions through combination. If a user wants to bet on a narrower range
        (e.g., &ldquo;score between 0.55 and 0.65&rdquo;), they can take two binary positions
        (<InlineCode>&gt; 0.55 AND &lt; 0.65</InlineCode>). This is how Polymarket handles complex
        markets and it works.
      </p>
      <p className="mb-4">
        We do not offer multi-outcome contracts in Phase 2. Add them later if there&apos;s demand.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Positions</h2>
      <p className="mb-3">A position is a user&apos;s holding in a contract.</p>
      <CodeBlock>
{`Position:
  position_id          UUID, primary key
  user_id              UUID, foreign key to users
  contract_id          UUID, foreign key to Contract
  shares_yes           FLOAT                (number of YES shares held)
  shares_no            FLOAT                (number of NO shares held)
  avg_cost_yes         FLOAT                (average price paid per YES share)
  avg_cost_no          FLOAT                (average price paid per NO share)
  realized_pnl         FLOAT                (profits/losses from closed positions)
  updated_at           TIMESTAMP`}
      </CodeBlock>
      <p className="mb-3">
        Prices are in probability units: a YES share trading at $0.62 means the market implies a
        62% probability of YES.
      </p>
      <p className="mb-4">
        At settlement, winning shares pay $1.00, losing shares pay $0.00. A user with 100 YES
        shares on a contract that resolves YES receives $100 minus any transaction fees.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Pricing: LMSR vs order book</h2>
      <p className="mb-4">
        Two viable mechanisms for Phase 2. We start with LMSR because it provides continuous
        liquidity even with few traders.
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Logarithmic Market Scoring Rule (LMSR)</h3>
      <p className="mb-3">
        An automated market maker that guarantees someone is always willing to buy or sell at a
        quoted price. Used by Augur, early Polymarket, and academic prediction-market research.
      </p>
      <p className="mb-2">The cost function is:</p>
      <CodeBlock>
        {`C(q_yes, q_no) = b × ln(exp(q_yes/b) + exp(q_no/b))`}
      </CodeBlock>
      <p className="mb-2">Where:</p>
      <ul className="list-disc list-inside ml-4 space-y-1 mb-3">
        <li>
          <InlineCode>q_yes</InlineCode> and <InlineCode>q_no</InlineCode> are the net shares
          outstanding for each outcome
        </li>
        <li>
          <InlineCode>b</InlineCode> is the liquidity parameter (larger = more liquidity, more
          subsidy cost)
        </li>
      </ul>
      <p className="mb-2">Price of YES at current state:</p>
      <CodeBlock>
        {`P_yes = exp(q_yes/b) / (exp(q_yes/b) + exp(q_no/b))`}
      </CodeBlock>
      <p className="mb-2">
        Price of buying <InlineCode>dq</InlineCode> YES shares:
      </p>
      <CodeBlock>
        {`cost = C(q_yes + dq, q_no) - C(q_yes, q_no)`}
      </CodeBlock>
      <p className="mb-3">
        <strong>Liquidity parameter tuning:</strong> <InlineCode>b</InlineCode> determines how much
        price moves per share traded. Higher <InlineCode>b</InlineCode> means flatter prices (more
        liquid, but more capital required to subsidize the market). For play money, start with{' '}
        <InlineCode>b = 100</InlineCode>. For each real-money contract, <InlineCode>b</InlineCode>{' '}
        should be set based on expected volume.
      </p>
      <p className="mb-4">
        <strong>Subsidy cost:</strong> LMSR always loses money in expectation if the market is
        well-calibrated. The maximum possible loss is{' '}
        <InlineCode>b × ln(2) ≈ 0.69 × b</InlineCode>. The platform covers this out of transaction
        fees collected elsewhere or out of a dedicated liquidity pool.
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Order book</h3>
      <p className="mb-3">
        Users place limit and market orders. Trades execute when bids match asks. Standard
        exchange mechanics.
      </p>
      <p className="mb-3">
        <strong>Pros:</strong> no subsidy cost, familiar to crypto traders, scales to arbitrary
        volume. <strong>Cons:</strong> thin markets have wide spreads; early-stage contracts with
        few traders may have no bids at all.
      </p>
      <p className="mb-4">
        <strong>Decision:</strong> start with LMSR for Phase 2. If a contract reaches sufficient
        volume (define a threshold, say 1,000 shares traded), graduate it to an order book. This
        is the hybrid approach Polymarket uses.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Settlement mechanics</h2>
      <p className="mb-3">At epoch end, the settlement job runs in this order:</p>
      <ol className="list-decimal list-outside ml-6 space-y-3 mb-4">
        <li>
          <strong>Freeze the graph.</strong> All node creation, edge creation, and score-affecting
          edits are rejected starting at 23:59:59.999 of the last day of the month. Users can still
          read but cannot write.
        </li>
        <li>
          <strong>Compute final scores.</strong> Run the ReasonRank algorithm (see{' '}
          <InlineCode>ENGINEERING_SPEC.md</InlineCode>) against the frozen graph. Write results to{' '}
          <InlineCode>EpochSnapshot</InlineCode>.
        </li>
        <li>
          <strong>Settle contracts.</strong> For each contract with{' '}
          <InlineCode>resolution_epoch</InlineCode> matching this epoch:
          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
            <li>
              Read <InlineCode>EpochSnapshot.truth_score</InlineCode> for the belief
            </li>
            <li>Determine outcome (YES or NO) based on threshold and direction</li>
            <li>
              Update <InlineCode>Contract.final_score</InlineCode>,{' '}
              <InlineCode>Contract.final_outcome</InlineCode>,{' '}
              <InlineCode>Contract.status = SETTLED</InlineCode>
            </li>
          </ul>
        </li>
        <li>
          <strong>Credit positions.</strong> For each position in a settled contract:
          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
            <li>
              If user holds winning shares: credit the user&apos;s balance with{' '}
              <InlineCode>shares × $1.00</InlineCode>
            </li>
            <li>If user holds losing shares: no credit (losing shares are worthless)</li>
            <li>Compute and log realized P&amp;L</li>
            <li>Mark position closed</li>
          </ul>
        </li>
        <li>
          <strong>Unfreeze the graph.</strong> Resume normal write access at 00:00:00 of the
          following day.
        </li>
      </ol>

      <h3 className="text-xl font-bold mt-6 mb-2">Why graph freeze matters</h3>
      <p className="mb-3">
        Without the freeze, a large bettor could edit the graph between 23:59:00 and 00:00:00 and
        move the score enough to flip contract outcomes. Everyone with a losing position would have
        grounds to dispute the result.
      </p>
      <p className="mb-4">
        The freeze window should be announced in advance and long enough that no legitimate edit is
        blocked. Current plan: edits disabled from 23:50:00 to 00:10:00 of each epoch boundary
        (20-minute window).
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">
        Why the score is locked in <InlineCode>EpochSnapshot</InlineCode>
      </h3>
      <p className="mb-3">
        Once written, <InlineCode>EpochSnapshot</InlineCode> rows are immutable. Settlement is
        based on the snapshot value, not the live score. Even if the live score changes immediately
        after settlement (because someone posts new arguments on day 1 of the next month), the
        settled contracts stay settled.
      </p>
      <p className="mb-4">
        This is the same principle as a stock exchange&apos;s closing price. Everyone agrees the
        closing price is what it is, and trades settle against that value, even if the stock opens
        higher the next day.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Anti-manipulation properties specific to markets</h2>
      <p className="mb-4">
        The core ReasonRank anti-manipulation properties (see{' '}
        <InlineCode>ENGINEERING_SPEC.md</InlineCode>) apply to the market layer too. But markets
        introduce two new attack vectors that need specific defenses.
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Attack: Last-minute score manipulation</h3>
      <p className="mb-3">
        <strong>Vector:</strong> bettor holds position, waits until epoch end, edits graph to flip
        score, wins bet.
      </p>
      <p className="mb-2"><strong>Defense:</strong></p>
      <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
        <li>Graph freeze window (20 minutes before epoch boundary)</li>
        <li>Uniqueness scoring prevents spam edits from moving the score in the final window</li>
        <li>
          Monitoring: flag contracts where the final score is within 5% of the threshold AND the
          user making the move-edit has a position on the winning side
        </li>
      </ul>

      <h3 className="text-xl font-bold mt-6 mb-2">Attack: Wash trading</h3>
      <p className="mb-3">
        <strong>Vector:</strong> bettor trades with themselves (via multiple accounts) to create
        fake volume or move price.
      </p>
      <p className="mb-2"><strong>Defense:</strong></p>
      <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
        <li>KYC at real-money phase (Phase 4+)</li>
        <li>Device fingerprinting and behavioral analysis</li>
        <li>
          Transaction graph analysis: flag positions where buyer and seller have correlated trade
          patterns
        </li>
        <li>
          LMSR makes this harder because there&apos;s no counterparty to collude with on
          subsidized trades; wash trading only matters on order books
        </li>
      </ul>

      <h3 className="text-xl font-bold mt-6 mb-2">
        Attack: Coordinated argument brigading to move a score
      </h3>
      <p className="mb-3">
        <strong>Vector:</strong> a group of bettors all take the same position, then coordinate to
        post arguments that move the score.
      </p>
      <Callout>
        <p>
          <strong>
            This is the central attack the system must handle, because this is exactly what we
            want the market to incentivize &mdash; except we want the arguments they post to be
            good ones.
          </strong>
        </p>
      </Callout>
      <p className="mb-2">
        <strong>Defense:</strong> the ReasonRank engine itself. If the brigaded arguments are
        high-quality, the score legitimately should move and the bettors legitimately should win.
        If the brigaded arguments are low-quality, they get:
      </p>
      <ul className="list-disc list-inside ml-4 space-y-1 mb-3">
        <li>Compressed (if duplicative)</li>
        <li>Down-weighted (if weak evidence)</li>
        <li>Attacked (if bad linkage)</li>
        <li>Fallacy-tagged (if logically flawed)</li>
      </ul>
      <p className="mb-3">
        All of these are existing mechanisms in the scoring engine. The market layer doesn&apos;t
        need new anti-manipulation code; it needs to trust the scoring engine to do its job.
      </p>
      <p className="mb-4">
        <strong>What this means for engineers:</strong> do not add special market-layer protections
        that short-circuit the scoring engine. If the scoring engine isn&apos;t robust enough to
        handle adversarial bettors posting arguments, the right fix is to make the scoring engine
        more robust, not to add market-specific censorship or vote-manipulation detection.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Transparency requirements</h2>
      <p className="mb-3">
        Because settlement depends on the scoring engine&apos;s output, users must be able to
        verify the output. Minimum transparency requirements:
      </p>
      <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
        <li>
          <strong>Algorithm version is public.</strong> Every{' '}
          <InlineCode>EpochSnapshot</InlineCode> records which version of the scoring algorithm
          produced it. If we change the algorithm, old snapshots stay valid because they reference
          the old version.
        </li>
        <li>
          <strong>Next month&apos;s algorithm changes are announced in advance.</strong> Any
          algorithmic change that affects scoring is published at least two weeks before it takes
          effect. This gives users time to adjust positions or exit markets they don&apos;t like.
        </li>
        <li>
          <strong>Every score is auditable.</strong> Given the graph state at an epoch boundary
          and the algorithm version, any third party should be able to reproduce the score
          exactly. No hidden parameters, no server-side secret sauce.
        </li>
        <li>
          <strong>Graph state at epoch boundaries is archived</strong> so that historical
          settlements can always be re-verified against the exact graph that was scored.
        </li>
      </ul>
      <p className="mb-4">
        These are not negotiable. A market backed by a non-transparent oracle is not a market;
        it&apos;s a casino where the house decides who wins.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">What we are not building in Phase 2</h2>
      <p className="mb-3">
        These are viable ideas that belong to later phases. Don&apos;t implement them in the MVP.
      </p>
      <ul className="list-disc list-outside ml-6 space-y-3 mb-4">
        <li>
          <strong>Meta-markets on algorithm changes.</strong> (&ldquo;Will next month&apos;s
          algorithm increase the score of X?&rdquo;) Proposed by outside commentators. Rejected
          because it creates pressure on algorithm design from market positions. Algorithm
          governance must stay insulated from trading incentives.
        </li>
        <li>
          <strong>Continuous price feeds based on probabilistic score forecasts.</strong>{' '}
          Nice-to-have. Not needed for MVP. Simple LMSR based on current shares outstanding is
          sufficient.
        </li>
        <li>
          <strong>Complex derivatives (spreads, combinations, structured products).</strong> Users
          can construct these manually from binary positions. Platform support for them is a
          Phase 5 problem at earliest.
        </li>
        <li>
          <strong>Leveraged positions.</strong> No margin trading. No borrowing. Users bet with
          what they have. This eliminates an entire class of cascade-failure risks and is the
          right default for a platform still proving the mechanics work.
        </li>
        <li>
          <strong>Shorting the market itself.</strong> We don&apos;t offer shorts on &ldquo;this
          whole project will fail.&rdquo; The recursion is too cute to be useful.
        </li>
      </ul>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Open questions</h2>
      <ol className="list-decimal list-outside ml-6 space-y-3 mb-4">
        <li>
          <strong>Who pays for LMSR subsidies?</strong> Transaction fees from other contracts? A
          dedicated pool? A Forward Party grant? Each option has trade-offs.
        </li>
        <li>
          <strong>What&apos;s the right fee rate?</strong> Polymarket charges 2% on deposits and
          withdrawals but no transaction fees during trading. Kalshi charges varying per-contract
          fees. For play money this doesn&apos;t matter much; for real money it affects user
          retention versus revenue.
        </li>
        <li>
          <strong>How do we handle disputes?</strong> What if a user claims the scoring engine
          miscalculated? Appeal process? Re-run with audit logs? Needs a specification before
          Phase 4.
        </li>
        <li>
          <strong>Mobile-first or desktop-first UI?</strong> Polymarket went mobile-first. Kalshi
          started desktop and added mobile later. Our audience probably skews desktop given the
          reading-heavy nature of arguments, but mobile matters for market engagement.
        </li>
        <li>
          <strong>How do we display ReasonRank vs Market Price divergence?</strong> The FAQ
          promises users will see the gap. Exact UI treatment is undesigned. Needs mockups.
        </li>
      </ol>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">References</h2>
      <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
        <li>
          <InlineCode>ENGINEERING_SPEC.md</InlineCode> &mdash; Core scoring engine and invariants
        </li>
        <li>
          <InlineCode>COMPETITIVE_STRATEGY.md</InlineCode> &mdash; Strategic positioning relative
          to Kalshi and Polymarket
        </li>
        <li>
          Hanson, R. (2003). &ldquo;Combinatorial Information Market Design&rdquo; &mdash; LMSR
          origin paper
        </li>
        <li>
          Wolfers &amp; Zitzewitz (2004). &ldquo;Prediction Markets&rdquo; &mdash; Foundational
          review
        </li>
        <li>
          Polymarket and Kalshi technical blogs &mdash; Operational lessons from existing
          prediction markets
        </li>
      </ul>
    </main>
  );
}
