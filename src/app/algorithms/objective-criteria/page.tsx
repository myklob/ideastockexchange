import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Objective Criteria — Idea Stock Exchange',
  description:
    'How the Idea Stock Exchange agrees on measurement standards before evaluating evidence — settling the yardstick before the fight.',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms</Link>
      {' > '}
      <strong>Objective Criteria</strong>
    </p>
  )
}

function CalloutBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-3 mb-5 rounded-r">
      {children}
    </div>
  )
}

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-mono text-base my-4 rounded">
      {children}
    </div>
  )
}

// ─── Climate-criteria example table data ─────────────────────────────────────

const climateRows = [
  {
    criterion: 'Average Global Temperature',
    score: 85,
    pros: ['Direct physical evidence of heat retention'],
    cons: ['Averages hide extreme regional variances'],
  },
  {
    criterion: 'Glacier Mass Balance',
    score: 92,
    pros: [
      'Ice melts only when heat is added over time (integrates data)',
      'High reliability via satellite imagery',
      'Hard to manipulate or misinterpret',
    ],
    cons: [],
  },
  {
    criterion: 'Frequency of "Hot Days"',
    score: 60,
    pros: ['Affects humans directly'],
    cons: [
      'Subject to recency bias and local weather patterns',
      'Low reliability in historical data comparison',
      'Confounds weather with climate',
    ],
  },
  {
    criterion: 'Twitter Sentiment About Heat',
    score: 15,
    pros: [],
    cons: [
      'Measures perception, not reality',
      'Heavily influenced by bots and viral events',
      'No correlation with actual temperature records',
    ],
  },
]

function scoreBadgeClass(score: number) {
  if (score >= 80) return 'text-green-700 font-bold'
  if (score >= 60) return 'text-blue-700 font-bold'
  if (score >= 40) return 'text-orange-600 font-bold'
  return 'text-red-600 font-bold'
}

// ─── Real-world examples callout panels ──────────────────────────────────────

const examplePanels = [
  {
    bg: 'bg-[#f8fbff]',
    border: 'border-[#0055a4]',
    headingColor: 'text-[#003366]',
    title: '🏛️ 1. Politicians (Senate, Congress, President)',
    subtitle: 'Ignore the soundbites. Measure what actually predicts effective governance.',
    sections: [
      {
        heading: 'For All Elected Officials',
        items: [
          'Independence from concentrated money: Percentage of campaign funding from small-dollar donors vs. PACs and dark money.',
          'Legislative effectiveness: Ratio of bills that advanced out of committee vs. total introduced.',
          'Bipartisan track record: Percentage of passed legislation requiring cross-aisle co-sponsorship.',
          'Accuracy of public claims: Independent fact-check ratings aggregated over term.',
          'Constituent responsiveness: Town halls held, response rate to inquiries.',
          'Credible findings of misconduct: Adjudicated ethics violations or confirmed criminal conduct.',
        ],
      },
      {
        heading: 'Additional Criteria for Executive Roles',
        items: [
          'Organizational track record: Successfully managed large institutions without insolvency, regulatory intervention, or mass litigation?',
          'Crisis decision quality: Retrospective evaluation of major decisions under uncertainty.',
          'Appointee quality: Track record of selecting qualified, non-scandal-plagued subordinates.',
        ],
      },
    ],
  },
  {
    bg: 'bg-[#f9f9f9]',
    border: 'border-[#4CAF50]',
    headingColor: 'text-[#1b5e20]',
    title: '📦 2. Everyday Products',
    subtitle: '',
    sections: [
      {
        heading: 'Vehicles',
        items: [
          'Total cost of ownership per mile: Purchase price amortized over lifespan, plus fuel and maintenance.',
          'Environmental cost: Lifetime carbon footprint including manufacturing and disposal.',
          'Safety per mile driven: NHTSA and IIHS crash ratings weighted by miles driven.',
          'Reliability: Consumer Reports long-term data, not manufacturer claims.',
        ],
      },
      {
        heading: 'Cell Phones',
        items: [
          'Privacy: Independent audit scores for data collection practices.',
          'Repairability: iFixit repairability score.',
          'Software support lifespan: Years of guaranteed security updates.',
          'True cost over four years: Device + plan + accessory lock-in.',
        ],
      },
    ],
  },
  {
    bg: 'bg-[#fff9f0]',
    border: 'border-[#ff9800]',
    headingColor: 'text-[#e65100]',
    title: '💼 3. Career & Life Paths',
    subtitle: '',
    sections: [
      {
        heading: '',
        items: [
          'Automation displacement risk: Oxford/McKinsey automation probability index for the specific role, updated for current AI.',
          'Salary adjusted for cost of living and hours worked: $120k in NYC at 70 hrs/wk vs. $75k in Denver at 45 hrs/wk.',
          'Reported burnout rate: Gallup and sector-specific survey data on sustained job satisfaction.',
          'Mobility and optionality: Does this path open doors or close them?',
          'Long-term income trajectory: Median earnings at 10 and 20 years, not entry-level salary.',
        ],
      },
    ],
  },
  {
    bg: 'bg-[#fff0f5]',
    border: 'border-[#e91e63]',
    headingColor: 'text-[#880e4f]',
    title: '🏡 4. Lifestyle Choices',
    subtitle: '',
    sections: [
      {
        heading: 'Marriage and Long-Term Partnership',
        items: [
          'Long-term life satisfaction: Longitudinal data at ages 50, 65, and 80 — not snapshot happiness.',
          'Health outcomes: Mortality, cardiovascular, and mental health outcomes controlling for socioeconomic status.',
          'Financial stability: Comparative wealth accumulation and bankruptcy rates over 30 years.',
        ],
      },
      {
        heading: 'Having Children',
        items: [
          'Life satisfaction at 65+: Longitudinal fulfillment, loneliness, and regret data among parents vs. non-parents past retirement.',
          'Mental health trajectory: Depression and anxiety rates across parenting stages.',
          'Financial impact: Lifetime wealth differential including opportunity costs.',
        ],
      },
    ],
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ObjectiveCriteriaPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222]">
      <Breadcrumb />

      {/* ── Title ───────────────────────────────────────────────────────── */}
      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Objective Criteria: Agreeing on the Yardstick Before the Fight
      </h1>

      {/* ── Moving Goalposts ────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mt-8 mb-3">The Moving Goalposts Problem</h2>

      <p className="mb-3">You say: <em>&ldquo;The economy is great!&rdquo;</em></p>
      <p className="mb-3">I say: <em>&ldquo;The economy is terrible!&rdquo;</em></p>
      <p className="mb-3">
        Are we debating facts? No. You&rsquo;re looking at the stock market. I&rsquo;m looking at
        inflation. We&rsquo;re not disagreeing about reality. We&rsquo;re disagreeing about{' '}
        <em>which measurement tool counts as reality.</em>
      </p>
      <p className="mb-3">
        This is why most debates fail. Not because people can&rsquo;t agree on what&rsquo;s true,
        but because they can&rsquo;t agree on <em>how to measure what&rsquo;s true</em>. One person
        defines &ldquo;good economy&rdquo; as rising GDP. Another defines it as falling inequality.
        Another defines it as median wage growth. They&rsquo;re all measuring different things,
        calling it the same thing, and wondering why they can&rsquo;t convince each other.
      </p>
      <p className="mb-3">
        It&rsquo;s like arguing about who&rsquo;s taller when one person uses feet and the other
        uses kilograms.
      </p>
      <p className="mb-4">
        Before deep-diving into Pro/Con arguments, the ISE asks users to populate a table of shared
        metrics first. In a healthcare debate, for instance, users might agree that{' '}
        <em>&ldquo;cost per capita&rdquo;</em> and <em>&ldquo;life expectancy&rdquo;</em> are the
        primary rulers for measuring success. Those agreed-upon yardsticks then determine how the
        algorithm weights every subsequent argument. Change the yardstick and you change what counts
        as evidence. So we settle the yardstick first.
      </p>

      <CalloutBox>
        <p>
          <strong>The golden rule of reason:</strong> Before asking &ldquo;Who is right?&rdquo;,
          we must ask <em>&ldquo;How do we measure what is right?&rdquo;</em>
        </p>
      </CalloutBox>

      <hr className="my-6 border-gray-300" />

      {/* ── Solution ────────────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">The Solution: Decide the Yardstick First</h2>
      <p className="mb-3">
        Every ISE topic page has a dedicated section where people propose and debate objective
        criteria. Think of it as a demilitarized zone where opponents agree on standards before they
        start fighting over conclusions.
      </p>
      <p className="mb-4">
        The principle is simple:{' '}
        <strong>decide what counts as evidence before looking at the evidence.</strong> This is basic
        scientific method. You don&rsquo;t run an experiment, see what happens, then decide what you
        were measuring. You define your metrics first. Otherwise you&rsquo;re just cherry-picking
        whatever data supports your predetermined conclusion.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">How It Works</h2>

      <h3 className="text-xl font-bold mt-5 mb-2">Step 1: People Propose the Yardsticks</h3>
      <p className="mb-3">
        The community brainstorms specific, quantifiable metrics to evaluate the topic.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <p className="font-semibold mb-2">Topic: &ldquo;Is the Economy Healthy?&rdquo;</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>GDP Growth Rate</li>
            <li>Median Real Wage Growth</li>
            <li>Labor Force Participation Rate</li>
            <li>Gini Coefficient (Inequality)</li>
            <li>Consumer Price Index</li>
            <li>Housing Affordability Index</li>
          </ul>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <p className="font-semibold mb-2">Topic: &ldquo;Is Candidate X Intelligent?&rdquo;</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Standardized Test Scores (SAT / IQ)</li>
            <li>Vocabulary Complexity in Unscripted Speech</li>
            <li>Success Rate of Past Strategic Decisions</li>
            <li>Ability to Update Beliefs When Evidence Changes</li>
          </ul>
        </div>
      </div>

      <p className="mb-4">
        Notice what this does. It forces specificity. You can&rsquo;t hide behind vague claims like
        &ldquo;the economy is doing well&rdquo; when six concrete measures might tell different
        stories. And once you&rsquo;ve organized arguments this way for one president&rsquo;s
        economic record, it&rsquo;s trivially easy to apply the same structure to every president.
      </p>

      <hr className="my-6 border-gray-300" />

      <h3 className="text-xl font-bold mb-2">Step 2: The Community Scores the Yardsticks</h3>
      <p className="mb-3">
        Not all measures are created equal. People propose arguments about each criterion&rsquo;s
        quality across four dimensions — each scored by the same ReasonRank argument system used
        everywhere on the platform:
      </p>

      <div className="space-y-4 mb-5">
        {[
          {
            num: '1',
            label: 'Validity',
            desc: 'Does this actually measure what we think it measures?',
            example: 'Is the stock market a valid measure of human wellbeing?',
            pro: 'Corporate health predicts future employment and economic stability.',
            con: 'Stock market mostly measures corporate profit. Can rise while median wages fall.',
          },
          {
            num: '2',
            label: 'Reliability',
            desc: 'Can different people measure this consistently?',
            example: null,
            high: 'Vocabulary grade level in speeches (objective, algorithmic)',
            low: '"Candidate seems smart" (subjective, varies by observer)',
          },
          {
            num: '3',
            label: 'Independence',
            desc: 'Is the data source neutral?',
            example: null,
            low2: 'Study funded by an oil company on emissions safety',
            high2: 'NASA satellite data on atmospheric CO₂',
          },
          {
            num: '4',
            label: 'Linkage',
            desc: 'How strongly does this metric correlate with the ultimate goal?',
            example: null,
            items: [
              { strength: 'High', val: 'Median wage growth (directly affects most people\'s lives)' },
              { strength: 'Medium', val: 'GDP growth (benefits spread unevenly)' },
              { strength: 'Low', val: 'Stock market performance (affects investors primarily)' },
            ],
          },
        ].map(d => (
          <div key={d.num} className="border border-gray-200 rounded p-4">
            <h4 className="font-bold mb-1">
              <span className="inline-block w-6 h-6 rounded-full bg-blue-700 text-white text-xs text-center leading-6 mr-2">{d.num}</span>
              {d.label} &mdash;{' '}
              <span className="font-normal text-gray-700">{d.desc}</span>
            </h4>
            {d.example && (
              <p className="text-sm italic mb-2">Example: {d.example}</p>
            )}
            {d.pro && (
              <ul className="text-sm space-y-1 ml-4">
                <li><span className="text-green-700 font-semibold">For:</span> {d.pro}</li>
                <li><span className="text-red-700 font-semibold">Against:</span> {d.con}</li>
              </ul>
            )}
            {d.high && (
              <ul className="text-sm space-y-1 ml-4">
                <li><span className="text-green-700 font-semibold">High:</span> {d.high}</li>
                <li><span className="text-red-700 font-semibold">Low:</span> {d.low}</li>
              </ul>
            )}
            {d.low2 && (
              <ul className="text-sm space-y-1 ml-4">
                <li><span className="text-red-700 font-semibold">Low:</span> {d.low2}</li>
                <li><span className="text-green-700 font-semibold">High:</span> {d.high2}</li>
              </ul>
            )}
            {d.items && (
              <ul className="text-sm space-y-1 ml-4">
                {d.items.map(it => (
                  <li key={it.strength}>
                    <span className={`font-semibold ${it.strength === 'High' ? 'text-green-700' : it.strength === 'Low' ? 'text-red-700' : 'text-blue-700'}`}>{it.strength} linkage:</span>{' '}
                    {it.val}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <hr className="my-6 border-gray-300" />

      {/* ── Climate Example ─────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Real Example: Climate Change Severity</h2>
      <p className="mb-4">
        <strong>Goal:</strong> Determine how severe climate change is.
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left">Criterion</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Score</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Rationale</th>
            </tr>
          </thead>
          <tbody>
            {climateRows.map(row => (
              <tr key={row.criterion} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-semibold">{row.criterion}</td>
                <td className={`border border-gray-300 px-3 py-2 text-center font-mono font-bold ${scoreBadgeClass(row.score)}`}>
                  {row.score}%
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  <ul className="space-y-1">
                    {row.pros.map((p, i) => (
                      <li key={i}><span className="text-green-700">✅</span> {p}</li>
                    ))}
                    {row.cons.map((c, i) => (
                      <li key={i}><span className="text-red-600">❌</span> {c}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mb-4">
        When the system calculates climate change severity, evidence based on glacier mass gets
        weighted heavily. Evidence based on Twitter sentiment gets filtered out almost entirely.
        This is exactly how reasoning should work. Better measures get more weight. Worse measures
        get less. The math is transparent and anyone can challenge it by proposing better criteria
        or showing why existing ones are flawed.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Why This Changes Everything ─────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Why This Changes Everything</h2>

      <h3 className="text-xl font-bold mt-4 mb-2">1. It Exposes Hidden Values</h3>
      <p className="mb-4">
        When two people argue about economic policy, they often think they&rsquo;re debating facts.
        They&rsquo;re not. They&rsquo;re debating values. One prioritizes GDP (growth). The other
        prioritizes the Gini Coefficient (equality). By forcing them to rank these criteria, we
        reveal that their disagreement is about <strong>what matters</strong>, not{' '}
        <strong>what&rsquo;s true</strong>. Values disagreements are negotiable &mdash; you can
        find compromises, balanced approaches, and Pareto improvements.
      </p>

      <h3 className="text-xl font-bold mt-4 mb-2">2. It Filters Noise Automatically</h3>
      <p className="mb-4">
        Once the community establishes that Twitter sentiment analysis is a low-quality metric
        (due to bots, self-selection bias, and manipulation), any argument relying on Twitter data
        automatically gets downgraded. You don&rsquo;t have to re-litigate the reliability of
        Twitter polls every time someone cites one. The criteria score is already calculated.
        The algorithm already knows it&rsquo;s weak evidence. The math handles it permanently.
      </p>

      <h3 className="text-xl font-bold mt-4 mb-2">3. It Enables &ldquo;Getting to Yes&rdquo;</h3>
      <p className="mb-4">
        This is core negotiation theory (Fisher and Ury). If you agree on criteria first, the
        final decision becomes calculation rather than ego battle. Agreeing on measurement standards
        before looking at data removes most opportunities for motivated reasoning. You can&rsquo;t
        move the goalposts if you committed to them publicly before seeing which direction they
        pointed.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Scoring Formula ─────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">How Criteria Get Scored</h2>
      <p className="mb-3">
        Criteria scores are determined by arguments — the same recursive logic that governs the
        rest of the platform. For each of the four dimensions, the community debates its quality
        and the{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
          ReasonRank algorithm
        </Link>{' '}
        synthesizes the competing arguments into a dimension score using the sigmoid balance formula:
      </p>

      <FormulaBox>
        Dimension Score = sigmoid((SupportWeight &minus; OpposeWeight) / 100) &times; 100
      </FormulaBox>

      <p className="mb-3">
        Where <strong>SupportWeight</strong> and <strong>OpposeWeight</strong> are the
        geometric-mean-weighted sums of all arguments for and against that dimension. The four
        dimension scores are then averaged:
      </p>

      <FormulaBox>
        Total Score = (Validity + Reliability + Independence + Linkage) / 4
      </FormulaBox>

      <p className="mb-4">
        This means a criterion that is highly reliable (easy to measure consistently) but invalid
        (measures the wrong thing) gets a moderate score, accurately reflecting its mixed quality.
        No single dimension can hide a weakness in another.
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left">Score Range</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Label</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Example</th>
            </tr>
          </thead>
          <tbody>
            {[
              { range: '80–100%', label: 'Excellent', ex: 'Glacier mass balance for climate change' },
              { range: '60–80%', label: 'Good', ex: 'Average global temperature' },
              { range: '40–60%', label: 'Moderate', ex: 'Stock market as economic health proxy' },
              { range: '1–40%', label: 'Weak', ex: 'Frequency of hot days for climate trend' },
              { range: '0%', label: 'Invalid', ex: 'Twitter sentiment about heat' },
            ].map(r => (
              <tr key={r.label} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-mono">{r.range}</td>
                <td className="border border-gray-300 px-3 py-2 font-semibold">{r.label}</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-600">{r.ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="my-6 border-gray-300" />

      {/* ── Why This Matters for Democracy ──────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Why This Matters for Democracy</h2>
      <p className="mb-3">
        Most political dysfunction comes from fake disagreements. People argue about
        &ldquo;facts&rdquo; when they actually disagree about values. Or they argue about values
        when they actually disagree about what data is reliable. Objective Criteria separate these
        layers:
      </p>
      <ol className="list-decimal list-inside mb-5 space-y-2">
        <li><strong>Criteria layer:</strong> What counts as good measurement?</li>
        <li><strong>Data layer:</strong> What do those measurements actually show?</li>
        <li><strong>Values layer:</strong> Which measurements should we prioritize?</li>
      </ol>
      <p className="mb-4">
        Once you separate them, most debates get dramatically simpler. Some questions are
        empirical (what does the data show given these criteria?). Some are normative (which
        criteria should we care about most?). Mixing them creates endless confusion. Separating
        them creates the possibility of resolution.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Common Objections ────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Common Objections</h2>

      <h3 className="text-xl font-bold mt-4 mb-2">
        &ldquo;But some things can&rsquo;t be measured objectively!&rdquo;
      </h3>
      <p className="mb-4">
        True. That&rsquo;s exactly why we score criteria quality. Subjective measures get low
        scores. Arguments relying on them get downweighted accordingly. If you&rsquo;re debating
        something genuinely unmeasurable, the criteria layer makes that explicit &mdash;
        &ldquo;we have no good way to measure this&rdquo; is itself valuable information.
      </p>

      <h3 className="text-xl font-bold mt-4 mb-2">
        &ldquo;Who decides which criteria matter?&rdquo;
      </h3>
      <p className="mb-4">
        The community, through evidence-based argument. Someone proposes a criterion. Others
        propose arguments for or against its validity, reliability, independence, and linkage.
        The{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
          ReasonRank algorithm
        </Link>{' '}
        synthesizes the competing arguments into a score. No individual decides. The collective
        evaluation, weighted by argument quality, decides.
      </p>

      <h3 className="text-xl font-bold mt-4 mb-2">
        &ldquo;Can&rsquo;t people game this by proposing biased criteria?&rdquo;
      </h3>
      <p className="mb-4">
        They can try. But they have to defend their criteria publicly against informed opposition
        using verifiable evidence. &ldquo;Stock market performance&rdquo; as a measure of human
        welfare gets challenged with evidence that it&rsquo;s weakly linked to median quality of
        life. The bias becomes visible in the scoring. Gaming a transparent system is dramatically
        harder than gaming one with no criteria evaluation at all.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Examples panels ─────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-4">
        📐 Examples: Setting the Yardstick Before the Fight
      </h2>
      <p className="mb-6 text-gray-700">
        The fastest way to end a pointless argument is to define what &ldquo;good&rdquo; means
        before looking at the data. Here is how the Idea Stock Exchange turns contested questions
        into measurable criteria — applied consistently, regardless of who benefits.
      </p>

      {examplePanels.map(panel => (
        <div
          key={panel.title}
          className={`${panel.bg} border-l-4 ${panel.border} p-5 mb-6 rounded-r`}
        >
          <h3 className={`text-xl font-bold mt-0 mb-1 ${panel.headingColor}`}>{panel.title}</h3>
          {panel.subtitle && <p className="italic text-sm mb-3">{panel.subtitle}</p>}
          {panel.sections.map(sec => (
            <div key={sec.heading}>
              {sec.heading && <h4 className="font-semibold mt-3 mb-1">{sec.heading}</h4>}
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                {sec.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}

      <hr className="my-6 border-gray-300" />

      {/* ── Contribute ────────────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Contribute</h2>
      <p className="mb-4">
        The ISE is infrastructure, not a publication. The structure exists. The scoring logic
        exists. What fills it in is community knowledge — argued, evaluated, and scored the same
        way every other belief on the platform gets evaluated.
      </p>
      <p className="mb-4">
        If you see a major contested topic where no one has agreed on measurement standards,
        that&rsquo;s the most valuable place to start. Propose criteria. Argue for their validity.
        Challenge weak ones. The platform does the math. You provide the reasoning.
      </p>
      <p className="mb-6">
        <Link href="/contact" className="font-bold text-blue-700 hover:underline">
          Get involved.
        </Link>{' '}
        The most important debates in the world are stalled not because we lack data, but because
        we haven&rsquo;t agreed on what the data means. That&rsquo;s a solvable problem.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Related links ───────────────────────────────────────────────── */}
      <div>
        <p className="font-bold mb-2">Related Algorithms &amp; Documentation:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
              ReasonRank Algorithm
            </Link>{' '}
            &mdash; How objective criteria fit into overall scoring.
          </li>
          <li>
            <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
              Linkage Scores
            </Link>{' '}
            &mdash; How evidence-to-conclusion connections are measured.
          </li>
          <li>
            <Link href="/algorithms/strong-to-weak" className="text-blue-700 hover:underline">
              Strong-to-Weak Spectrum
            </Link>{' '}
            &mdash; Burden-of-proof scaling for claim strength.
          </li>
          <li>
            <Link href="/algorithms/belief-equivalency" className="text-blue-700 hover:underline">
              Belief Equivalency
            </Link>{' '}
            &mdash; Detecting differently-worded claims that make the same point.
          </li>
        </ul>
      </div>

      <p className="mt-8 mb-2">
        <Link href="/contact" className="font-bold text-blue-700 hover:underline">
          Contact me
        </Link>{' '}
        to propose new criteria for a contested topic, or to challenge existing criteria that are
        scoring too high.
      </p>
    </main>
  )
}
