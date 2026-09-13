import Link from 'next/link'
import type { Metadata } from 'next'
import {
  fetchAllMedia,
  resolveMediaTruth,
  computeEpistemicImpact,
  formatReach,
  formatEpistemicImpact,
  formatSignedScore,
  getMediaTypeLabel,
} from '@/features/media/fetch-media'
import { genrePrior, resolveGenreType } from '@/core/scoring/media-truth'

export const metadata: Metadata = {
  title: 'Media Truth Score — Idea Stock Exchange',
  description:
    'How a work of media earns a signed truth score from the claims it makes: extract the claims, evaluate each at its own belief page, weight by centrality, aggregate. Genre never protects the work.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms</Link>
      {' > '}
      <strong>Media Truth Score</strong>
    </p>
  )
}

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-mono my-4 rounded">
      {children}
    </div>
  )
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-[#f0f3f6]'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

/** Signed -1..+1 scale: positive green, balanced orange, negative red. */
function signedScoreColor(score: number): string {
  if (score >= 0.2) return 'text-green-700'
  if (score > -0.2) return 'text-orange-600'
  return 'text-red-700'
}

export default async function MediaTruthScorePage() {
  // The live readout: every tracked work, scored by the engine right now.
  const allMedia = await fetchAllMedia()
  const liveRows = allMedia
    .map(media => ({
      media,
      truth: resolveMediaTruth(media),
      impact: computeEpistemicImpact(media),
    }))
    .sort((a, b) => {
      // Claims-backed scores first (they demonstrate the pipeline), then by
      // absolute epistemic impact — the biggest movers in either direction.
      if ((a.truth.basis === 'claims') !== (b.truth.basis === 'claims')) {
        return a.truth.basis === 'claims' ? -1 : 1
      }
      return Math.abs(b.impact) - Math.abs(a.impact)
    })
    .slice(0, 8)

  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-6">Media Truth Score: When Stories Bypass Your Brain</h1>

      {/* ── 1. Why ─────────────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mt-8 mb-3">1. Why: The 2,400-Year-Old Warning We Ignored</h2>
      <p className="mb-4">
        Plato warned us. Over two millennia ago, he saw how music and storytelling &ldquo;bypass
        reason and penetrate into the very core of the self.&rdquo; Ideas wrapped in compelling
        narrative spread faster than logical arguments, regardless of whether they&apos;re true.
      </p>
      <p className="mb-4">Voltaire put it more bluntly: &ldquo;Anything too stupid to be said is sung.&rdquo;</p>
      <p className="mb-4">
        Here&apos;s the problem: Your brain treats a well-told story as more credible than a
        well-documented fact. This isn&apos;t a bug. It&apos;s evolution. For most of human history,
        stories were our only way to transmit knowledge. The tribe that remembered &ldquo;don&apos;t
        eat the red berries&rdquo; through a memorable tale survived better than the tribe that
        relied on formal logic.
      </p>
      <p className="mb-4">
        But now we live in an era where stories scale to billions. Where entertainment corporations
        have psychological research departments. Where algorithms optimize for engagement, not
        truth. Where the most compelling lie reaches more people than the most rigorous study.
      </p>
      <p className="mb-4">
        The question isn&apos;t whether media influences beliefs. It obviously does; Plato settled
        that. The question is: Can we measure that influence? Can we separate compelling from
        accurate? Can we make truth visible when it&apos;s wrapped in narrative?
      </p>
      <p className="mb-4">
        We can&apos;t fix human psychology. But we can measure what stories are actually saying, and
        whether those claims are true.
      </p>
      <p className="mb-4"><strong>That&apos;s what Media Truth Scores do.</strong></p>

      <hr className="my-8 border-gray-300" />

      {/* ── 2. What ────────────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">2. What: Score the Claims, Not the Craft</h2>
      <p className="mb-4">
        A Media Truth Score evaluates how accurately a piece of media (book, film, article, podcast,
        whatever) represents reality. It measures both the truth value of the claims a work makes
        and how central those claims are to its message.
      </p>
      <p className="mb-2">This applies to everything:</p>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li><strong>Fiction</strong> makes claims about human nature, ethics, how the world works</li>
        <li><strong>Journalism</strong> makes claims about events and their significance</li>
        <li><strong>Documentary</strong> makes claims about facts and causal relationships</li>
        <li><strong>Commentary</strong> makes claims about what conclusions we should draw</li>
        <li><strong>Entertainment</strong> makes claims about what behavior is normal, desirable, effective</li>
      </ul>
      <p className="mb-4">
        Every story argues for something, even if indirectly. Media Truth Scores make those
        arguments visible and evaluate them systematically.
      </p>
      <p className="mb-4">
        <strong>
          The question isn&apos;t whether you enjoyed it. The question is: are its central claims
          about reality actually true?
        </strong>
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">What This Looks Like in Practice</h3>
      <p className="mb-3 text-sm italic text-gray-600">
        (Illustrative scores in the tables on this page, chosen to show the mechanism at work. The
        live values computed by the engine are in the readout further down, and every one of them
        is backed by a visible argument tree you can challenge.)
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={TH}>Media</th>
              <th className={TH}>Type</th>
              <th className={TH}>Central Claims</th>
              <th className={TH}>Score</th>
              <th className={TH}>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}><em>Silent Spring</em></td>
              <td className={TD}>Non-fiction</td>
              <td className={TD}>Pesticides cause environmental harm</td>
              <td className={`${TDC} font-bold text-green-700`}>+0.85</td>
              <td className={TD}>Well-supported by subsequent research</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}><em>The Good Earth</em></td>
              <td className={TD}>Fiction</td>
              <td className={TD}>Gender/class dynamics in rural China</td>
              <td className={`${TDC} font-bold text-green-700`}>+0.78</td>
              <td className={TD}>Themes align with historical evidence</td>
            </tr>
            <tr>
              <td className={TD}><em>Star Trek II</em></td>
              <td className={TD}>Fiction</td>
              <td className={TD}>Collective welfare &gt; individual attachment</td>
              <td className={`${TDC} font-bold text-green-700`}>+0.75</td>
              <td className={TD}>In this illustration, the pro arguments outscore the objections</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}><em>An Inconvenient Truth</em></td>
              <td className={TD}>Documentary</td>
              <td className={TD}>Climate change requires action</td>
              <td className={`${TDC} font-bold text-green-700`}>+0.70</td>
              <td className={TD}>Core claims strong; some predictions overstated</td>
            </tr>
            <tr>
              <td className={TD}>WMD Articles (2002-03)</td>
              <td className={TD}>Journalism</td>
              <td className={TD}>Iraq possesses WMDs</td>
              <td className={`${TDC} font-bold text-red-700`}>-0.70</td>
              <td className={TD}>High impact, core claims proven false</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}><em>Avengers: Infinity War</em></td>
              <td className={TD}>Fiction</td>
              <td className={TD}>Personal loyalty justifies any risk</td>
              <td className={`${TDC} font-bold text-red-700`}>-0.85</td>
              <td className={TD}>In this illustration, the universalization objections win the tree</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mb-4">
        <strong>Key insight:</strong> Fiction can score high when central claims about reality are
        well-supported. Journalism can score low when central claims are wrong. Genre doesn&apos;t
        protect you from evaluation.
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Truth Score vs. Influence Score</h3>
      <p className="mb-2">Here&apos;s where it gets crucial. We track two separate metrics:</p>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <strong>Media Truth Score</strong> measures the accuracy of central claims (evidence
          quality &times; centrality, on a -1.0 to +1.0 scale). Question: how truthful is this
          work&apos;s message?
        </li>
        <li>
          <strong>Media Influence Score</strong> measures reach and impact (views, sales, citations,
          cultural penetration, 0 to &infin;). Question: how many people are exposed to these
          claims?
        </li>
      </ul>
      <FormulaBox>Epistemic Impact = Media Truth Score &times; Media Influence Score</FormulaBox>
      <p className="mb-4">This measures total impact on collective understanding, positive or negative.</p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={TH}>Media</th>
              <th className={TH}>Truth</th>
              <th className={TH}>Influence</th>
              <th className={TH}>Epistemic Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}>Well-researched documentary</td>
              <td className={TDC}>+0.85</td>
              <td className={TDC}>5M views</td>
              <td className={`${TDC} font-bold text-green-700`}>+4.25M</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}>Viral misinformation video</td>
              <td className={TDC}>-0.60</td>
              <td className={TDC}>50M views</td>
              <td className={`${TDC} font-bold text-red-700`}>-30M</td>
            </tr>
            <tr>
              <td className={TD}>Accurate but obscure article</td>
              <td className={TDC}>+0.90</td>
              <td className={TDC}>500 views</td>
              <td className={`${TDC} font-bold text-green-700`}>+450</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}><em>Avengers: Infinity War</em></td>
              <td className={TDC}>-0.85</td>
              <td className={TDC}>2B views</td>
              <td className={`${TDC} font-bold text-red-700`}>-1.7B</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mb-4">
        Look at that last row. A blockbuster movie with questionable ethics reaches two billion
        people. That&apos;s not neutral. That&apos;s massive negative epistemic impact.
      </p>
      <p className="mb-4">
        This is why separating truth from influence matters. The most dangerous misinformation
        isn&apos;t the stuff nobody sees. It&apos;s the compelling story that spreads everywhere
        despite being wrong.
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Evaluating Ethical Claims in Entertainment</h3>
      <p className="mb-4">
        Fiction doesn&apos;t get a pass on ethics. When movies and shows make claims about how
        people should behave, those claims can be evaluated. The method matters, though: a normative
        claim gets decomposed into its testable components (does it universalize without
        contradiction, and what are the documented consequences when people act on it?), and those
        components are scored like any other claims. Pure value rankings, where the disagreement is
        about priorities rather than facts, route to the interests and values frameworks on each
        belief page&apos;s Conflict Resolution section instead of getting a fake truth number.
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={TH}>Claim Often Embedded</th>
              <th className={TH}>Truth Score</th>
              <th className={TH}>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}>&ldquo;True love means valuing one person over everyone&rdquo;</td>
              <td className={`${TDC} font-bold text-red-700`}>-0.75</td>
              <td className={TD}>Fails universalization; justifies tribalism</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}>&ldquo;Violence is the best solution&rdquo;</td>
              <td className={`${TDC} font-bold text-red-700`}>-0.60</td>
              <td className={TD}>Contradicted by conflict resolution research</td>
            </tr>
            <tr>
              <td className={TD}>&ldquo;Following your heart &gt; calculating consequences&rdquo;</td>
              <td className={`${TDC} font-bold text-red-700`}>-0.40</td>
              <td className={TD}>Mixed; sometimes true, often catastrophic</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}>&ldquo;Collective welfare &gt; individual attachment&rdquo;</td>
              <td className={`${TDC} font-bold text-green-700`}>+0.70</td>
              <td className={TD}>Supported by ethics literature, emergency response</td>
            </tr>
            <tr>
              <td className={TD}>&ldquo;Persistence overcomes rejection&rdquo; (stalking = romance)</td>
              <td className={`${TDC} font-bold text-red-700`}>-0.80</td>
              <td className={TD}>Normalizes harassment; contradicts consent research</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mb-4">
        You can&apos;t hide terrible ethics behind &ldquo;it&apos;s just entertainment.&rdquo; If
        your movie argues that stalking is romantic, that claim gets scored. If two billion people
        watch it, the epistemic impact is massive and negative.
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Why Genre Can&apos;t Save You</h3>
      <p className="mb-4">
        Media Truth Scores don&apos;t care about format, genre, or stated intent. They care about
        one thing: <strong>How true are the central claims, and how honestly are they represented?</strong>
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={TH}>Genre</th>
              <th className={TH}>Can&apos;t Hide Behind</th>
              <th className={TH}>Still Evaluated By</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}>Fiction</td>
              <td className={TD}>&ldquo;It&apos;s just a story&rdquo;</td>
              <td className={TD}>Central claims about reality/ethics</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}>News</td>
              <td className={TD}>&ldquo;It&apos;s journalism&rdquo;</td>
              <td className={TD}>Accuracy of reporting</td>
            </tr>
            <tr>
              <td className={TD}>Documentary</td>
              <td className={TD}>&ldquo;It&apos;s fact-based&rdquo;</td>
              <td className={TD}>Whether facts are actually accurate</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}>Opinion</td>
              <td className={TD}>&ldquo;It&apos;s my view&rdquo;</td>
              <td className={TD}>Whether supporting claims are true</td>
            </tr>
            <tr>
              <td className={TD}>Entertainment</td>
              <td className={TD}>&ldquo;It&apos;s just fun&rdquo;</td>
              <td className={TD}>Ethical claims embedded in narrative</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mb-4">
        This prevents dismissing fiction as &ldquo;just a story&rdquo; when it makes powerful
        claims, accepting journalism as true just because it&apos;s labeled &ldquo;news,&rdquo;
        giving documentaries automatic credibility, and letting propaganda hide behind
        &ldquo;entertainment&rdquo; or &ldquo;opinion.&rdquo;
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">The Five Principles</h3>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={TH}>Principle</th>
              <th className={TH}>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}><strong>Genre-neutral</strong></td>
              <td className={TD}>Same standards apply to fiction, journalism, documentary, opinion</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}><strong>Centrality-weighted</strong></td>
              <td className={TD}>Core claims matter more than peripheral details</td>
            </tr>
            <tr>
              <td className={TD}><strong>Evidence-based</strong></td>
              <td className={TD}>Truth scores determined by systematic evaluation</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}><strong>Dynamic</strong></td>
              <td className={TD}>Scores update as evidence base improves</td>
            </tr>
            <tr>
              <td className={TD}><strong>Transparent</strong></td>
              <td className={TD}>All reasoning visible and challengeable</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-gray-300" />

      {/* ── 3. How ─────────────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">3. How: The Five-Step Process</h2>
      <p className="mb-4 text-sm italic text-gray-600">
        Everything above is the design; this section is the machinery. Skip it freely; the score
        means what Section 2 says it means.
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Step 1: Extract the Claims</h3>
      <p className="mb-4">
        Every work contains assertions about how the world works. Some are explicit. Most are
        implicit.
      </p>
      <p className="mb-2">
        Take <em>The Good Earth</em> by Pearl S. Buck. It&apos;s fiction. But it makes specific
        claims:
      </p>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>&ldquo;Women in early 20th-century China were valued primarily for what they could provide men&rdquo;</li>
        <li>&ldquo;Land ownership was central to social status and survival&rdquo;</li>
        <li>&ldquo;Famine drove desperate people to cities&rdquo;</li>
        <li>&ldquo;Family loyalty often conflicted with individual desires&rdquo;</li>
      </ul>
      <p className="mb-4">
        Each of these connects to broader historical and sociological debates. Each can be evaluated
        against evidence.
      </p>
      <p className="mb-4">
        The process: extract claims from content (dialogue, narration, visual arguments); link them
        to existing beliefs already evaluated in the Idea Stock Exchange (
        <Link href="/beliefs" className="text-blue-700 hover:underline">one page per topic</Link>
        ); create new belief pages if the claim is novel.
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Step 2: Evaluate Each Claim&apos;s Truth Score</h3>
      <p className="mb-4">
        Once extracted, each claim gets evaluated using the standard framework: logical validity,
        evidence quality, verification level, and the performance of its pro/con arguments. These
        produce the claim&apos;s independent{' '}
        <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">Truth Score</Link>,
        evaluated across <em>all</em> sources that make this claim, not just this one piece of
        media.
      </p>
      <p className="mb-4">
        Example: &ldquo;Women in early 20th-century China were valued primarily for utility&rdquo;
        gets evaluated based on historical evidence from multiple sources, scholarly research on
        gender roles, primary source documents, and comparative cultural analysis.
      </p>
      <p className="mb-4">
        The truth score exists independently of <em>The Good Earth</em>. It reflects the broader
        evidence base. For this score&apos;s aggregation, each claim&apos;s truth is expressed on
        the signed scale: -1.0 (thoroughly debunked) through 0 (evidence balanced) to +1.0
        (extremely well supported). That signed form is what lets a work built on debunked central
        claims earn a negative score rather than merely a low one.
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Step 3: Calculate Centrality</h3>
      <p className="mb-4">
        Here&apos;s where it gets interesting.{' '}
        <strong>Not all claims are equally important to a work&apos;s message.</strong>
      </p>
      <p className="mb-4">
        The <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">Linkage Score</Link>{' '}
        measures: How central is this particular claim to this specific work? Users propose claims
        as central to the work&apos;s message; others challenge or support that centrality claim;
        the arguments are evaluated like any others, and higher-performing arguments mean a higher
        linkage score.
      </p>
      <p className="mb-2"><strong>Example: <em>The Good Earth</em></strong></p>
      <p className="mb-2">
        High linkage (central themes): gender roles and women&apos;s value (major theme throughout);
        the relationship between land ownership and identity (core to the protagonist&apos;s arc);
        the impact of poverty and famine (drives the entire plot).
      </p>
      <p className="mb-4">
        Low linkage (peripheral details): specific architectural details (mentioned but not
        central); passing weather references (background flavor); minor characters&apos; opinions
        (not emphasized).
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Step 4: Weight by Centrality</h3>
      <p className="mb-2">Each claim&apos;s contribution to the overall score is weighted by how central it is:</p>
      <FormulaBox>Weighted Claim Score = Truth Score &times; Linkage Score</FormulaBox>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={TH}>Claim Type</th>
              <th className={TH}>Effect on Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}><strong>Central + True:</strong> Core theme backed by evidence</td>
              <td className={TD}>Major positive contribution</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}><strong>Central + False:</strong> Core theme contradicted by evidence</td>
              <td className={TD}>Major negative contribution (misleading message)</td>
            </tr>
            <tr>
              <td className={TD}><strong>Peripheral + True:</strong> Minor detail that&apos;s accurate</td>
              <td className={TD}>Minor positive contribution</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}><strong>Peripheral + False:</strong> Minor detail that&apos;s wrong</td>
              <td className={TD}>Minor negative contribution</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mb-2"><strong>Concrete example</strong> <em>(illustrative)</em>:</p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={TH}>Claim</th>
              <th className={TH}>Truth</th>
              <th className={TH}>Linkage</th>
              <th className={TH}>Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}>Women valued for utility</td>
              <td className={TDC}>0.85</td>
              <td className={TDC}>0.95</td>
              <td className={`${TDC} font-bold`}>0.81</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}>Land = identity/status</td>
              <td className={TDC}>0.78</td>
              <td className={TDC}>0.90</td>
              <td className={`${TDC} font-bold`}>0.70</td>
            </tr>
            <tr>
              <td className={TD}>Famine drives migration</td>
              <td className={TDC}>0.92</td>
              <td className={TDC}>0.75</td>
              <td className={`${TDC} font-bold`}>0.69</td>
            </tr>
            <tr className="bg-gray-50">
              <td className={TD}>Architectural detail</td>
              <td className={TDC}>0.65</td>
              <td className={TDC}>0.15</td>
              <td className={`${TDC} font-bold`}>0.10</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mb-4">
        Central themes (high linkage) contribute most. Peripheral details barely matter, even if
        true.
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Step 5: Aggregate to Final Score</h3>
      <p className="mb-2">All weighted claim scores combine into a centrality-weighted average:</p>
      <FormulaBox>
        Media Truth Score = &Sigma; (Signed Truth Score &times; Linkage Score) / &Sigma; (Linkage
        Scores)
      </FormulaBox>
      <p className="mb-4">
        This produces a score between -1.0 and +1.0 reflecting how truthfully the media&apos;s
        central ideas align with reality, based on collective evaluation of those ideas, weighted
        appropriately by centrality.
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Where the Score Starts: The Genre Prior</h3>
      <p className="mb-4">
        Before any claims have been extracted, the engine assigns a work a starting value from its
        genre&apos;s base reliability (peer-reviewed material starts near{' '}
        <span className="font-mono">{genrePrior('peer_reviewed').toFixed(2)}</span>; social media
        posts start near{' '}
        <span className="font-mono">{genrePrior('social_media').toFixed(2)}</span>), paired with the
        Media Genre and Style Score that mirrors the evidence tier system. The genre prior is where
        a work&apos;s score starts; the claim-extraction pipeline above is how it earns a real one.
        A peer-reviewed paper full of debunked central claims falls from its prior; a work of
        fiction whose central claims survive scrutiny climbs above its own genre&apos;s starting
        line. The canonical math lives in the engine at{' '}
        <code className="bg-gray-100 px-1 rounded">src/core/scoring/media-truth.ts</code> (
        <a
          href="https://github.com/myklob/ideastockexchange"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 hover:underline"
        >
          github.com/myklob/ideastockexchange
        </a>
        ); when this page and the code disagree, the code wins.
      </p>

      <hr className="my-8 border-gray-300" />

      {/* ── Live engine readout ────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Live Engine Readout</h2>
      <p className="mb-3">
        The scores below are not illustrations — they are computed by the engine right now, from the{' '}
        <Link href="/media" className="text-blue-700 hover:underline">tracked media</Link> and their
        extracted claim ledgers. A score marked <em>genre prior</em> belongs to a work whose claims
        have not been extracted and linked yet. Click a work for its claim ledger; every signed
        truth traces to a belief page whose argument tree you can challenge.
      </p>
      {liveRows.length === 0 ? (
        <p className="mb-4 text-sm italic text-gray-600">
          No media tracked yet — add works and extract their claims to see live scores here.
        </p>
      ) : (
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr>
                <th className={TH}>Work</th>
                <th className={TH}>Type</th>
                <th className={TH}>Genre Prior</th>
                <th className={TH}>Scored Claims</th>
                <th className={TH}>Media Truth Score</th>
                <th className={TH}>Reach</th>
                <th className={TH}>Epistemic Impact</th>
              </tr>
            </thead>
            <tbody>
              {liveRows.map(({ media, truth, impact }, i) => (
                <tr key={media.id} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className={TD}>
                    <Link href={`/media/${media.id}`} className="text-blue-700 hover:underline">
                      {media.title}
                    </Link>
                  </td>
                  <td className={TDC}>{getMediaTypeLabel(media.mediaType)}</td>
                  <td className={`${TDC} font-mono`}>
                    {genrePrior(resolveGenreType(media.genreType, media.mediaType)).toFixed(2)}
                  </td>
                  <td className={TDC}>
                    {truth.basis === 'claims' ? truth.scoredClaimCount : '—'}
                  </td>
                  <td className={`${TDC} font-mono font-bold ${signedScoreColor(truth.score)}`}>
                    {formatSignedScore(truth.score)}
                    {truth.basis === 'genre-prior' && (
                      <span className="font-sans font-normal text-xs text-gray-600"> (genre prior)</span>
                    )}
                  </td>
                  <td className={`${TDC} font-mono`}>{formatReach(media.reach)}</td>
                  <td className={`${TDC} font-mono font-bold ${signedScoreColor(truth.score)}`}>
                    {formatEpistemicImpact(impact)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <hr className="my-8 border-gray-300" />

      {/* ── Practical applications ─────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Practical Applications</h2>
      <h3 className="text-lg font-bold mt-4 mb-2">For Readers/Viewers</h3>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>Quickly assess which media makes reliable claims</li>
        <li>Distinguish high-quality sources from misinformation</li>
        <li>Understand what central claims a work makes</li>
        <li>See how those claims connect to broader evidence</li>
      </ul>
      <h3 className="text-lg font-bold mt-4 mb-2">For Educators</h3>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>Assign media based on truth scores for different learning objectives</li>
        <li>Teach media literacy by comparing scores</li>
        <li>Show students how to evaluate sources systematically</li>
        <li>Demonstrate the difference between influence and accuracy</li>
      </ul>
      <h3 className="text-lg font-bold mt-4 mb-2">For Content Creators</h3>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>Get feedback on the accuracy of central claims</li>
        <li>Improve work by addressing low-scoring claims</li>
        <li>Demonstrate commitment to truth</li>
        <li>Build a reputation for reliability</li>
      </ul>
      <h3 className="text-lg font-bold mt-4 mb-2">For Platforms</h3>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>Recommend high-truth-score content</li>
        <li>Flag low-truth, high-influence content for review</li>
        <li>Create incentives for accuracy</li>
        <li>Reduce misinformation spread</li>
      </ul>

      <hr className="my-8 border-gray-300" />

      {/* ── Get involved ───────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">Get Involved</h2>
      <p className="mb-4">
        This is infrastructure for truth in narrative: tools that extract claims from stories,
        systems that evaluate those claims systematically, frameworks that separate compelling from
        accurate.
      </p>
      <p className="mb-2"><strong>Ways to contribute:</strong></p>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>Extract and evaluate claims from influential media</li>
        <li>Build argument networks for contested claims</li>
        <li>Test the scoring system and report edge cases</li>
        <li>Propose improvements to centrality evaluation</li>
      </ul>
      <p className="mb-4">
        <strong>
          <Link href="/contact" className="text-blue-700 hover:underline">Join the project.</Link>
        </strong>{' '}
        Challenge our methodology. Propose better frameworks. Or go straight to the{' '}
        <a
          href="https://github.com/myklob/ideastockexchange"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 hover:underline"
        >
          code
        </a>
        .
      </p>
      <p className="mb-4">
        Because here&apos;s what&apos;s at stake: Democracy requires citizens who can tell truth
        from propaganda. Progress requires distinguishing reliable information from compelling lies.
        Cooperation requires shared reality.
      </p>
      <p className="mb-4">
        None of that works when stories bypass our reasoning and we have no tools to evaluate their
        claims.
      </p>
      <p className="mb-4">
        <strong>Media Truth Scores are our answer. Transparent. Evidence-based. Genre-neutral.</strong>
      </p>
      <p className="mb-4">
        Help us build a world where narrative power doesn&apos;t automatically override factual
        accuracy, where influence is tracked separately from truth, where Plato&apos;s 2,400-year-old
        warning finally gets addressed systematically.
      </p>

      <hr className="my-8 border-gray-300" />

      {/* ── The score family ───────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">The Score Family</h2>
      <p className="mb-3 text-sm">
        Media Truth Scores are one member of a family of scores computed by the same engine. Each
        has its own page:
      </p>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
            Argument scores from sub-argument scores
          </Link>{' '}
          (ReasonRank)
        </li>
        <li>
          <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">Evidence Scores</Link>
        </li>
        <li>
          <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">Truth Scores</Link>
        </li>
        <li>
          <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">Linkage Scores</Link>
        </li>
        <li>
          <Link href="/algorithms/importance-score" className="text-blue-700 hover:underline">Importance Score</Link>
        </li>
        <li>
          <Link href="/algorithms/objective-criteria" className="text-blue-700 hover:underline">Objective criteria scores</Link>
        </li>
        <li>
          <Link href="/algorithms/topic-overlap" className="text-blue-700 hover:underline">Topic overlap scores</Link>
        </li>
        <li>
          <Link href="/books" className="text-blue-700 hover:underline">Book Logical Validity</Link>{' '}
          (the books index applies this pipeline to books)
        </li>
        <li>
          Media Genre and Style Scores (this score&apos;s genre-prior companion; see the genre
          tables in <code className="bg-gray-100 px-1 rounded">src/core/scoring/all-scores.ts</code>)
        </li>
      </ul>
      <p className="text-sm text-gray-600">
        Media Truth Score (this page) sits at the end of the pipeline: it aggregates the claim-level
        scores above across everything a work asserts. The full index is on the{' '}
        <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms</Link> page.
      </p>
    </div>
  )
}
