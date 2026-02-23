import Link from 'next/link'

export const metadata = {
  title: 'Automated Cost-Benefit Analysis (ACBA) | ISE',
  description:
    'How the ISE treats every input to the cost-benefit formula as a belief to be debated — automating likelihood, impact magnitude, and distributive fairness.',
}

export default function ACBAAboutPage() {
  return (
    <div className="min-h-screen bg-[var(--muted)]">
      {/* Navigation */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-2 text-sm">
          <Link href="/" className="text-[var(--accent)] hover:underline">
            Home
          </Link>
          <span className="text-[var(--muted-foreground)]">&rsaquo;</span>
          <Link href="/cba" className="text-[var(--accent)] hover:underline">
            Cost-Benefit Analysis
          </Link>
          <span className="text-[var(--muted-foreground)]">&rsaquo;</span>
          <span className="text-[var(--foreground)] font-semibold">
            Automated Cost-Benefit Analysis
          </span>
        </div>
      </nav>

      <div className="max-w-[960px] mx-auto px-4 py-10">
        {/* Title */}
        <h1 className="text-3xl font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-4 mb-6">
          Automated Cost-Benefit Analysis (ACBA)
        </h1>

        {/* Problem / Solution intro */}
        <div className="bg-white border border-[var(--border)] rounded-lg p-5 mb-8">
          <p className="text-[var(--foreground)] leading-relaxed">
            <strong>The core problem with every cost-benefit analysis ever done:</strong> the
            inputs are asserted, not calculated. Someone decides that a policy has a 40% chance of
            creating 10,000 jobs, and that number sits in a spreadsheet unchallenged. There is no
            mechanism for the public to contest it, no automatic update when contradicting evidence
            emerges, and no transparency about what assumptions are driving the conclusion.
          </p>
          <p className="text-[var(--foreground)] leading-relaxed mt-4">
            <strong>What ACBA does differently:</strong> it treats every input to the cost-benefit
            formula as a belief to be debated. The probability that a cost occurs, the magnitude of
            a benefit if it does, and the fairness of who pays versus who gains are each evaluated
            through the ISE&apos;s argument-scoring system. The math updates automatically as
            evidence changes.
          </p>
        </div>

        {/* The Formula */}
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          The Formula That Drives Everything
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          Standard cost-benefit analysis computes the expected value of any consequence using a
          simple formula that almost nobody actually implements rigorously:
        </p>

        <div className="bg-[var(--muted)] border-l-4 border-[var(--foreground)] px-6 py-4 text-center text-lg font-semibold text-[var(--foreground)] my-6">
          Expected Value of a Cost or Benefit = Likelihood (%) &times; Impact Magnitude
        </div>

        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          The problem is not the formula. The problem is that in traditional policy analysis, a
          single analyst or team fills in those numbers based on their judgment, their sources, and
          sometimes their preferred conclusion. ACBA replaces that with a structured public debate
          about each variable separately. The ISE does not ask &ldquo;is this policy good or
          bad?&rdquo; It asks three more tractable questions:
        </p>

        <ol className="list-decimal list-inside space-y-3 mb-6 pl-4">
          <li className="text-[var(--foreground)] leading-relaxed">
            <strong>How likely is this specific cost or benefit to actually occur?</strong>
          </li>
          <li className="text-[var(--foreground)] leading-relaxed">
            <strong>If it does occur, how large is the impact?</strong>
          </li>
          <li className="text-[var(--foreground)] leading-relaxed">
            <strong>
              Is it just for the people paying the cost to do so, given who receives the benefit?
            </strong>
          </li>
        </ol>

        <p className="text-[var(--foreground)] leading-relaxed mb-10">
          Each of those questions becomes its own belief page, with supporting and opposing
          arguments scored by the platform&apos;s ReasonRank algorithm. The scores feed back into
          the formula automatically.
        </p>

        {/* Step 1 */}
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          Step 1: Automating Likelihood
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          Say the claim is: &ldquo;Raising the minimum wage to $20 will eliminate 15% of
          entry-level jobs within two years.&rdquo; That is not treated as a given. It becomes a
          sub-belief, and users build argument trees specifically targeting its likelihood.
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse border border-[var(--border)] text-sm">
            <thead>
              <tr className="bg-[var(--muted)]">
                <th className="border border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--foreground)] w-1/2">
                  Arguments that raise the Likelihood score
                </th>
                <th className="border border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--foreground)] w-1/2">
                  Arguments that lower the Likelihood score
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[var(--border)] px-4 py-3 align-top text-[var(--foreground)] leading-relaxed">
                  Economic models showing elasticity of demand for low-wage labor. Historical
                  examples from cities that raised minimum wage and saw measurable job loss.
                  Peer-reviewed studies scored high on Evidence Tiers.
                </td>
                <td className="border border-[var(--border)] px-4 py-3 align-top text-[var(--foreground)] leading-relaxed">
                  Meta-analyses finding no significant employment effect across multiple cities.
                  Arguments identifying methodological flaws in the supporting studies. Evidence
                  that prior predictions of job loss failed to materialize in comparable cases.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[var(--foreground)] leading-relaxed mb-10">
          The system aggregates the Truth Scores and Linkage Scores of every argument on both sides
          and outputs a Likelihood percentage. If the evidence strongly supports the claim,
          Likelihood approaches 100%. If the claim is thoroughly debunked, it approaches 0%. That
          number is not an opinion. It is the weighted output of the argument tree.
        </p>

        {/* Step 2 */}
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          Step 2: Automating Impact Magnitude
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          A 5% chance of losing 1,000 jobs is not the same as a 5% chance of losing 1,000,000
          jobs. Impact matters as much as likelihood, and it also needs to be argued rather than
          asserted.
        </p>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          To prevent important impacts from being ignored, ACBA organizes consequences using{' '}
          <strong>Maslow&apos;s Hierarchy of Needs</strong> as a checklist:
        </p>

        <ul className="space-y-3 mb-6 pl-4">
          <li className="text-[var(--foreground)] leading-relaxed">
            <strong>Physiological (Level 1):</strong> Does this affect food, water, shelter, or
            baseline health? Costs at this level receive maximum weight. You cannot offset someone
            losing their housing against a stock market gain.
          </li>
          <li className="text-[var(--foreground)] leading-relaxed">
            <strong>Safety (Level 2):</strong> Physical security, health system access, financial
            stability.
          </li>
          <li className="text-[var(--foreground)] leading-relaxed">
            <strong>Social Belonging (Level 3):</strong> Community cohesion, family stability,
            civil relationships.
          </li>
          <li className="text-[var(--foreground)] leading-relaxed">
            <strong>Esteem and Self-Actualization (Level 4):</strong> Educational access, economic
            mobility, freedom to pursue goals.
          </li>
        </ul>

        <p className="text-[var(--foreground)] leading-relaxed mb-10">
          Users submit arguments about impact severity within each category. Those arguments are
          scored the same way Likelihood arguments are. The system multiplies the resulting Impact
          Score by the Likelihood percentage to produce an{' '}
          <strong>Expected Value</strong> for that specific consequence. Every consequence gets one.
        </p>

        {/* Step 3 */}
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          Step 3: Automating the Fairness Question
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          A policy that produces a large net benefit while concentrating all costs on a vulnerable
          minority is not the same as one where costs and benefits are distributed proportionally.
          Standard cost-benefit analysis frequently hides this by aggregating everything into a
          single number. ACBA treats distributive justice as a separate variable.
        </p>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          For each significant cost, the platform asks:{' '}
          <em>
            Is it just for this party to bear this cost so that those parties receive this benefit?
          </em>{' '}
          That question gets its own argument trees.
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse border border-[var(--border)] text-sm">
            <thead>
              <tr className="bg-[var(--muted)]">
                <th className="border border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--foreground)] w-1/2">
                  Arguments FOR the fairness of this distribution
                </th>
                <th className="border border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--foreground)] w-1/2">
                  Arguments AGAINST the fairness of this distribution
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[var(--border)] px-4 py-3 align-top text-[var(--foreground)] leading-relaxed">
                  The burdened party created the negative externality (e.g., the case for carbon
                  taxes). The burdened party has disproportionate ability to pay without threatening
                  basic needs. The distribution matches a principle most stakeholders have already
                  accepted.
                </td>
                <td className="border border-[var(--border)] px-4 py-3 align-top text-[var(--foreground)] leading-relaxed">
                  The burdened party receives none of the downstream benefits. The costs violate
                  basic physiological or safety needs (Maslow Level 1 or 2). The distribution
                  conflicts with constitutional or widely-shared values. The burdened party had no
                  meaningful participation in the decision.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[var(--foreground)] leading-relaxed mb-10">
          When the fairness arguments strongly favor the &ldquo;against&rdquo; column, the system
          flags a <strong>Distributive Justice Alert</strong>. The policy&apos;s overall score is
          penalized unless a modification is proposed that addresses the inequity. This is not a
          veto. It is a transparency mechanism: the analysis makes the trade-off visible rather than
          hiding it inside an aggregate number.
        </p>

        {/* How It All Connects */}
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          The Automation: How It All Connects
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          Here is what makes ACBA different from a well-organized spreadsheet: every input is a
          live argument tree, not a static number. When new evidence arrives, it enters the platform
          as an argument, gets scored by the community and the algorithm, and immediately propagates
          through the calculation.
        </p>

        <div className="bg-white border border-[var(--border)] rounded-lg p-5 font-mono text-sm leading-loose my-6">
          <strong>Example cascade:</strong>
          <br />
          <br />
          New study shows minimum wage job loss estimate was based on flawed data
          <br />
          &darr; User submits study as Tier 1 evidence on the &ldquo;15% job loss&rdquo; likelihood
          page
          <br />
          &darr; ReasonRank scores it high; opposing arguments can&apos;t rebut the methodology
          <br />
          &darr; Likelihood of that cost drops from 65% &rarr; 20%
          <br />
          &darr; Expected Value of that cost drops proportionally
          <br />
          &darr; The overall policy score adjusts upward automatically
          <br />
          &darr; Every user who flagged that cost receives a notification explaining the change
        </div>

        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          No one has to manually update a model. No analyst has to be convinced to revise their
          estimate. The evidence changes the math directly, because the math was always driven by
          the evidence.
        </p>
        <p className="text-[var(--foreground)] leading-relaxed mb-10">
          This is what &ldquo;automated&rdquo; means. Not that a computer replaces human judgment,
          but that human judgment about evidence propagates immediately and transparently into every
          conclusion that depends on it.
        </p>

        {/* Divider */}
        <hr className="border-t border-[var(--border)] my-8" />

        {/* Related pages */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-5">
          <strong className="text-[var(--foreground)]">Related pages:</strong>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/cba" className="text-[var(--accent)] hover:underline">
                Live ACBA Ledger &mdash; browse all analyses
              </Link>
            </li>
            <li>
              <Link href="/arguments" className="text-[var(--accent)] hover:underline">
                How Linkage Scores propagate argument strength
              </Link>
            </li>
            <li>
              <Link href="/beliefs" className="text-[var(--accent)] hover:underline">
                Stakeholder Interest Mapping
              </Link>
            </li>
            <li>
              <Link href="/protocol" className="text-[var(--accent)] hover:underline">
                How Truth Scores are calculated
              </Link>
            </li>
            <li>
              <a
                href="https://en.wikipedia.org/wiki/Cost-benefit_analysis"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                <em>Background: Cost-Benefit Analysis (Wikipedia)</em>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
