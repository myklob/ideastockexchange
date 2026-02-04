import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  calculateBeliefScore,
  calculateEvidenceVerificationScore,
  calculateLinkageScore,
  getEvidenceTypeWeight,
  getPositivityLabel,
  formatScore,
  formatPercentage,
} from "@/lib/scoring";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BeliefPage({ params }: Props) {
  const { slug } = await params;

  const belief = await prisma.belief.findUnique({
    where: { slug },
    include: {
      arguments: {
        include: {
          belief: {
            include: {
              arguments: {
                include: {
                  belief: { include: { arguments: true, evidence: true } },
                  linkageArguments: true,
                },
              },
              evidence: true,
            },
          },
          linkageArguments: true,
        },
      },
      evidence: true,
      objectiveCriteria: true,
      valuesAnalysis: true,
      interestsAnalysis: true,
      assumptions: true,
      costBenefitAnalysis: true,
      impactAnalysis: true,
      compromises: true,
      obstacles: true,
      biases: true,
      mediaResources: true,
      legalEntries: true,
      upstreamMappings: {
        include: { parentBelief: true },
      },
      downstreamMappings: {
        include: { childBelief: true },
      },
      similarTo: {
        include: { toBelief: true },
      },
      similarFrom: {
        include: { fromBelief: true },
      },
    },
  });

  if (!belief) return notFound();

  const score = calculateBeliefScore(belief);
  const proArgs = belief.arguments.filter((a) => a.side === "agree");
  const conArgs = belief.arguments.filter((a) => a.side === "disagree");
  const supEvidence = belief.evidence.filter((e) => e.side === "supporting");
  const weakEvidence = belief.evidence.filter((e) => e.side === "weakening");
  const acceptAssumptions = belief.assumptions.filter((a) => a.side === "accept");
  const rejectAssumptions = belief.assumptions.filter((a) => a.side === "reject");
  const supporterObstacles = belief.obstacles.filter((o) => o.side === "supporter");
  const oppositionObstacles = belief.obstacles.filter((o) => o.side === "opposition");
  const supporterBiases = belief.biases.filter((b) => b.side === "supporter");
  const opponentBiases = belief.biases.filter((b) => b.side === "opponent");
  const supportingMedia = belief.mediaResources.filter((m) => m.side === "supporting");
  const opposingMedia = belief.mediaResources.filter((m) => m.side === "opposing");
  const supportingLaws = belief.legalEntries.filter((l) => l.side === "supporting");
  const contradictingLaws = belief.legalEntries.filter((l) => l.side === "contradicting");

  const upstreamSupport = belief.upstreamMappings.filter((m) => m.side === "support");
  const upstreamOppose = belief.upstreamMappings.filter((m) => m.side === "oppose");
  const downstreamSupport = belief.downstreamMappings.filter((m) => m.side === "support");
  const downstreamOppose = belief.downstreamMappings.filter((m) => m.side === "oppose");

  const extremeSimilar = [
    ...belief.similarTo.filter((s) => s.variant === "extreme").map((s) => ({ id: s.id, belief: s.toBelief })),
    ...belief.similarFrom.filter((s) => s.variant === "extreme").map((s) => ({ id: s.id, belief: s.fromBelief })),
  ];
  const moderateSimilar = [
    ...belief.similarTo.filter((s) => s.variant === "moderate").map((s) => ({ id: s.id, belief: s.toBelief })),
    ...belief.similarFrom.filter((s) => s.variant === "moderate").map((s) => ({ id: s.id, belief: s.fromBelief })),
  ];

  // Compute argument impacts
  function computeArgImpact(arg: (typeof proArgs)[0]): number {
    const linkage = calculateLinkageScore({
      linkageArguments: arg.linkageArguments,
    });
    const subScore = calculateBeliefScore(arg.belief, 1, 5);
    return subScore * linkage;
  }

  function computeEvidenceImpact(ev: (typeof supEvidence)[0]): number {
    const evs = calculateEvidenceVerificationScore({
      sourceIndependenceWeight: ev.sourceIndependenceWeight,
      replicationQuantity: ev.replicationQuantity,
      conclusionRelevance: ev.conclusionRelevance,
      replicationPercentage: ev.replicationPercentage,
    });
    return evs * getEvidenceTypeWeight(ev.evidenceType) * ev.linkageScore;
  }

  const proTotal = proArgs.reduce((sum, a) => sum + computeArgImpact(a), 0);
  const conTotal = conArgs.reduce((sum, a) => sum + computeArgImpact(a), 0);
  const supEvidenceTotal = supEvidence.reduce((sum, e) => sum + computeEvidenceImpact(e), 0);
  const weakEvidenceTotal = weakEvidence.reduce((sum, e) => sum + computeEvidenceImpact(e), 0);

  function renderMediaByType(resources: typeof supportingMedia, type: string) {
    const items = resources.filter((r) => r.mediaType === type);
    if (items.length === 0) return null;
    return items.map((r, i) => (
      <span key={r.id}>
        {i + 1}.{" "}
        {r.url ? (
          <a href={r.url} target="_blank" rel="noopener">
            {r.title}
          </a>
        ) : (
          r.title
        )}
        {r.author && ` — ${r.author}`}
        <br />
      </span>
    ));
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", lineHeight: 1.6, color: "#333" }}>
      {/* ── Header ── */}
      <h1 className="text-2xl font-bold mb-4">
        Belief: {belief.statement}
      </h1>

      <div className="bg-[var(--color-neutral)] p-4 border border-[var(--color-border)] mb-6 rounded">
        <p className="text-right m-0">
          <Link href="/concepts/one-page-per-topic">Topic</Link>:{" "}
          {belief.category}
          {belief.subcategory && <> &gt; {belief.subcategory}</>}
        </p>
        {belief.deweyNumber && (
          <p className="text-right m-0">Topic IDs: Dewey: {belief.deweyNumber}</p>
        )}
        <p className="text-right m-0">
          Belief{" "}
          <Link href="/concepts/positivity-continuum">Positivity</Link>{" "}
          Towards Topic:{" "}
          <strong>{formatScore(belief.positivity)}%</strong>
          {" "}({getPositivityLabel(belief.positivity)})
        </p>
        <p className="text-right text-sm mt-1">
          Each section builds a complete analysis from multiple angles.{" "}
          <Link
            href="https://github.com/myklob/ideastockexchange"
            target="_blank"
            rel="noopener"
          >
            View the full technical documentation on GitHub
          </Link>.
        </p>
      </div>

      {/* ── Argument Trees ── */}
      <h1 className="text-2xl font-bold mt-8 mb-2">
        <Link href="/concepts/reasons">Argument Trees</Link>
      </h1>
      <p className="text-sm text-[var(--color-muted)] mb-4">
        Each reason is a belief with its own page. Scoring is recursive based on{" "}
        <Link href="/concepts/truth">truth</Link>,{" "}
        <Link href="/concepts/linkage-scores">linkage</Link>, and{" "}
        <Link href="/concepts/importance-score">importance</Link>.
      </p>

      {/* Reasons to Agree */}
      <table className="ise-table mb-4">
        <thead>
          <tr className="bg-agree">
            <th style={{ width: "60%" }}>
              <Link href="/concepts/scoring">Top Scoring</Link> Reasons to Agree
            </th>
            <th style={{ width: "15%" }}>Argument Score</th>
            <th style={{ width: "13%" }}>
              <Link href="/concepts/linkage-scores">Linkage Score</Link>
            </th>
            <th style={{ width: "12%" }}>Impact</th>
          </tr>
        </thead>
        <tbody>
          {proArgs.map((arg) => {
            const linkage = calculateLinkageScore({
              linkageArguments: arg.linkageArguments,
            });
            const subScore = calculateBeliefScore(arg.belief, 1, 5);
            const impact = computeArgImpact(arg);
            return (
              <tr key={arg.id}>
                <td>
                  <Link href={`/beliefs/${arg.belief.slug}`}>
                    {arg.belief.statement}
                  </Link>
                </td>
                <td>{formatScore(subScore)}</td>
                <td>{formatPercentage(linkage)}</td>
                <td>{formatScore(impact)}</td>
              </tr>
            );
          })}
          {proArgs.length === 0 && (
            <tr>
              <td colSpan={4} className="text-[var(--color-muted)] italic">
                No supporting arguments yet
              </td>
            </tr>
          )}
          <tr className="bg-neutral">
            <td colSpan={3} className="text-right font-bold">
              Total Pro:
            </td>
            <td className="font-bold">{formatScore(proTotal)}</td>
          </tr>
        </tbody>
      </table>

      {/* Reasons to Disagree */}
      <table className="ise-table mb-8">
        <thead>
          <tr className="bg-disagree">
            <th style={{ width: "60%" }}>
              <Link href="/concepts/scoring">Top Scoring</Link> Reasons to Disagree
            </th>
            <th style={{ width: "15%" }}>Argument Score</th>
            <th style={{ width: "13%" }}>
              <Link href="/concepts/linkage-scores">Linkage Score</Link>
            </th>
            <th style={{ width: "12%" }}>Impact</th>
          </tr>
        </thead>
        <tbody>
          {conArgs.map((arg) => {
            const linkage = calculateLinkageScore({
              linkageArguments: arg.linkageArguments,
            });
            const subScore = calculateBeliefScore(arg.belief, 1, 5);
            const impact = computeArgImpact(arg);
            return (
              <tr key={arg.id}>
                <td>
                  <Link href={`/beliefs/${arg.belief.slug}`}>
                    {arg.belief.statement}
                  </Link>
                </td>
                <td>{formatScore(subScore)}</td>
                <td>{formatPercentage(linkage)}</td>
                <td>{formatScore(impact)}</td>
              </tr>
            );
          })}
          {conArgs.length === 0 && (
            <tr>
              <td colSpan={4} className="text-[var(--color-muted)] italic">
                No opposing arguments yet
              </td>
            </tr>
          )}
          <tr className="bg-neutral">
            <td colSpan={3} className="text-right font-bold">
              Total Con:
            </td>
            <td className="font-bold">{formatScore(conTotal)}</td>
          </tr>
        </tbody>
      </table>

      <hr className="border-[var(--color-border)] my-8" />

      {/* ── Best Evidence ── */}
      <h2 className="text-xl font-bold mt-8 mb-2">
        <Link href="/concepts/evidence">Best Evidence</Link>
      </h2>
      <p className="text-sm text-[var(--color-muted)] mb-4">
        Key: <strong>T1</strong>=Peer-reviewed/Official, <strong>T2</strong>=Expert/Institutional,{" "}
        <strong>T3</strong>=Journalism/Surveys, <strong>T4</strong>=Opinion/Anecdote
      </p>

      {/* Supporting Evidence */}
      <table className="ise-table mb-4">
        <thead>
          <tr className="bg-agree">
            <th style={{ width: "50%" }}>Top Supporting Evidence</th>
            <th style={{ width: "15%" }}>Evidence Score</th>
            <th style={{ width: "13%" }}>
              <Link href="/concepts/linkage-scores">Linkage Score</Link>
            </th>
            <th style={{ width: "10%" }}>Type</th>
            <th style={{ width: "12%" }}>Impact</th>
          </tr>
        </thead>
        <tbody>
          {supEvidence.map((ev) => {
            const evs = calculateEvidenceVerificationScore({
              sourceIndependenceWeight: ev.sourceIndependenceWeight,
              replicationQuantity: ev.replicationQuantity,
              conclusionRelevance: ev.conclusionRelevance,
              replicationPercentage: ev.replicationPercentage,
            });
            const impact = computeEvidenceImpact(ev);
            return (
              <tr key={ev.id}>
                <td>
                  {ev.sourceUrl ? (
                    <a href={ev.sourceUrl} target="_blank" rel="noopener">
                      {ev.description}
                    </a>
                  ) : (
                    ev.description
                  )}
                </td>
                <td>{formatScore(evs)}</td>
                <td>{formatPercentage(ev.linkageScore)}</td>
                <td>{ev.evidenceType}</td>
                <td>{formatScore(impact)}</td>
              </tr>
            );
          })}
          {supEvidence.length === 0 && (
            <tr>
              <td colSpan={5} className="text-[var(--color-muted)] italic">
                No supporting evidence yet
              </td>
            </tr>
          )}
          <tr className="bg-neutral">
            <td colSpan={4} className="text-right font-bold">
              Total Contributing:
            </td>
            <td className="font-bold">{formatScore(supEvidenceTotal)}</td>
          </tr>
        </tbody>
      </table>

      {/* Weakening Evidence */}
      <table className="ise-table mb-8">
        <thead>
          <tr className="bg-disagree">
            <th style={{ width: "50%" }}>Top Weakening Evidence</th>
            <th style={{ width: "15%" }}>Evidence Score</th>
            <th style={{ width: "13%" }}>
              <Link href="/concepts/linkage-scores">Linkage Score</Link>
            </th>
            <th style={{ width: "10%" }}>Type</th>
            <th style={{ width: "12%" }}>Impact</th>
          </tr>
        </thead>
        <tbody>
          {weakEvidence.map((ev) => {
            const evs = calculateEvidenceVerificationScore({
              sourceIndependenceWeight: ev.sourceIndependenceWeight,
              replicationQuantity: ev.replicationQuantity,
              conclusionRelevance: ev.conclusionRelevance,
              replicationPercentage: ev.replicationPercentage,
            });
            const impact = computeEvidenceImpact(ev);
            return (
              <tr key={ev.id}>
                <td>
                  {ev.sourceUrl ? (
                    <a href={ev.sourceUrl} target="_blank" rel="noopener">
                      {ev.description}
                    </a>
                  ) : (
                    ev.description
                  )}
                </td>
                <td>{formatScore(evs)}</td>
                <td>{formatPercentage(ev.linkageScore)}</td>
                <td>{ev.evidenceType}</td>
                <td>{formatScore(impact)}</td>
              </tr>
            );
          })}
          {weakEvidence.length === 0 && (
            <tr>
              <td colSpan={5} className="text-[var(--color-muted)] italic">
                No weakening evidence yet
              </td>
            </tr>
          )}
          <tr className="bg-neutral">
            <td colSpan={4} className="text-right font-bold">
              Total Weakening:
            </td>
            <td className="font-bold">{formatScore(weakEvidenceTotal)}</td>
          </tr>
        </tbody>
      </table>

      <hr className="border-[var(--color-border)] my-8" />

      {/* ── Objective Criteria ── */}
      <h2 className="text-xl font-bold mt-8 mb-2">
        <Link href="/concepts/objective-criteria">Best Scoring Objective Criteria</Link>
      </h2>
      <p className="text-sm text-[var(--color-muted)] mb-4 italic">
        For Measuring the Strength of this Belief
      </p>

      <table className="ise-table mb-8">
        <thead>
          <tr className="bg-neutral">
            <th style={{ width: "45%" }}>Top Objective Criteria</th>
            <th style={{ width: "15%" }}>Independence Score</th>
            <th style={{ width: "15%" }}>
              <Link href="/concepts/linkage-scores">Linkage Score</Link>
            </th>
            <th style={{ width: "13%" }}>Criteria Type</th>
            <th style={{ width: "12%" }}>Total Score</th>
          </tr>
        </thead>
        <tbody>
          {belief.objectiveCriteria.map((oc) => (
            <tr key={oc.id}>
              <td>{oc.description}</td>
              <td>{formatPercentage(oc.independenceScore)}</td>
              <td>{formatPercentage(oc.linkageScore)}</td>
              <td>{oc.criteriaType}</td>
              <td>{formatScore(oc.totalScore)}</td>
            </tr>
          ))}
          {belief.objectiveCriteria.length === 0 && (
            <tr>
              <td colSpan={5} className="text-[var(--color-muted)] italic">
                No objective criteria defined yet
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <hr className="border-[var(--color-border)] my-8" />

      {/* ── Core Values Conflict ── */}
      <h2 className="text-xl font-bold mt-8 mb-4">
        <Link href="/concepts/american-values">Core Values Conflict</Link>
      </h2>

      <table className="ise-table mb-2">
        <thead>
          <tr className="bg-neutral">
            <th style={{ width: "50%" }}>Supporting Values</th>
            <th style={{ width: "50%" }}>Opposing Values</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top">
              <strong>Advertised:</strong>
              <br />
              {belief.valuesAnalysis?.supportingAdvertised || "—"}
              <br />
              <br />
              <strong>Actual:</strong>
              <br />
              {belief.valuesAnalysis?.supportingActual || "—"}
            </td>
            <td className="align-top">
              <strong>Advertised:</strong>
              <br />
              {belief.valuesAnalysis?.opposingAdvertised || "—"}
              <br />
              <br />
              <strong>Actual:</strong>
              <br />
              {belief.valuesAnalysis?.opposingActual || "—"}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="text-sm italic text-[var(--color-muted)] mb-8">
        (What supporters claim vs. what actually motivates them)
      </p>

      <hr className="border-[var(--color-border)] my-8" />

      {/* ── Conflict Resolution Framework ── */}
      <h1 className="text-2xl font-bold mt-8 mb-4">
        <Link href="/concepts/automate-conflict-resolution">
          Conflict Resolution
        </Link>{" "}
        Framework
      </h1>

      {/* Interests & Motivations */}
      <h2 className="text-xl font-bold mt-6 mb-4">
        <Link href="/concepts/interests">Interest &amp; Motivations</Link>
      </h2>

      <table className="ise-table mb-6">
        <thead>
          <tr className="bg-neutral">
            <th style={{ width: "50%" }}>Supporters</th>
            <th style={{ width: "50%" }}>Opponents</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top whitespace-pre-line">
              {belief.interestsAnalysis?.supporterInterests || "—"}
            </td>
            <td className="align-top whitespace-pre-line">
              {belief.interestsAnalysis?.opponentInterests || "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Shared and Conflicting Interests */}
      <h2 className="text-xl font-bold mt-6 mb-4">
        <Link href="/concepts/interests">Shared and Conflicting Interests</Link>
      </h2>

      <table className="ise-table mb-8">
        <thead>
          <tr className="bg-info">
            <th style={{ width: "50%" }}>Shared Interests</th>
            <th style={{ width: "50%" }}>Conflicting Interests</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top whitespace-pre-line">
              {belief.interestsAnalysis?.sharedInterests || "—"}
            </td>
            <td className="align-top whitespace-pre-line">
              {belief.interestsAnalysis?.conflictingInterests || "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Foundational Assumptions */}
      <h2 className="text-xl font-bold mt-6 mb-4">
        <Link href="/concepts/assumptions">Foundational Assumptions</Link>
      </h2>

      <table className="ise-table mb-8">
        <thead>
          <tr className="bg-neutral">
            <th style={{ width: "50%" }}>Required to Accept This Belief</th>
            <th style={{ width: "50%" }}>Required to Reject This Belief</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top">
              {acceptAssumptions.map((a, i) => (
                <span key={a.id}>
                  {i + 1}. {a.statement}{" "}
                  <span className="text-xs text-[var(--color-muted)]">
                    [{a.strength}]
                  </span>
                  <br />
                </span>
              ))}
              {acceptAssumptions.length === 0 && "—"}
            </td>
            <td className="align-top">
              {rejectAssumptions.map((a, i) => (
                <span key={a.id}>
                  {i + 1}. {a.statement}{" "}
                  <span className="text-xs text-[var(--color-muted)]">
                    [{a.strength}]
                  </span>
                  <br />
                </span>
              ))}
              {rejectAssumptions.length === 0 && "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Cost-Benefit Analysis */}
      <h2 className="text-xl font-bold mt-6 mb-4">
        <Link href="/concepts/cost-benefit-analysis">Cost-Benefit Analysis</Link>
      </h2>

      <table className="ise-table mb-8">
        <thead>
          <tr>
            <th className="bg-agree" style={{ width: "40%" }}>
              Potential Benefits
            </th>
            <th className="bg-agree" style={{ width: "10%" }}>
              Likelihood
            </th>
            <th className="bg-disagree" style={{ width: "40%" }}>
              Potential Costs
            </th>
            <th className="bg-disagree" style={{ width: "10%" }}>
              Likelihood
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top whitespace-pre-line">
              {belief.costBenefitAnalysis?.benefits || "—"}
            </td>
            <td className="align-top">
              {belief.costBenefitAnalysis?.benefitLikelihood != null
                ? formatPercentage(belief.costBenefitAnalysis.benefitLikelihood)
                : "—"}
            </td>
            <td className="align-top whitespace-pre-line">
              {belief.costBenefitAnalysis?.costs || "—"}
            </td>
            <td className="align-top">
              {belief.costBenefitAnalysis?.costLikelihood != null
                ? formatPercentage(belief.costBenefitAnalysis.costLikelihood)
                : "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Short vs Long-Term Impacts */}
      <h2 className="text-xl font-bold mt-6 mb-4">
        Short vs. Long-Term Impacts
      </h2>

      <table className="ise-table mb-8">
        <thead>
          <tr className="bg-neutral">
            <th style={{ width: "50%" }}>Short-Term (0-2 Years)</th>
            <th style={{ width: "50%" }}>Long-Term (5+ Years)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top whitespace-pre-line">
              {belief.impactAnalysis?.shortTermEffects || "—"}
              {belief.impactAnalysis?.shortTermCosts && (
                <>
                  <br />
                  <br />
                  <strong>Transition costs:</strong>{" "}
                  {belief.impactAnalysis.shortTermCosts}
                </>
              )}
            </td>
            <td className="align-top whitespace-pre-line">
              {belief.impactAnalysis?.longTermEffects || "—"}
              {belief.impactAnalysis?.longTermChanges && (
                <>
                  <br />
                  <br />
                  <strong>Structural changes:</strong>{" "}
                  {belief.impactAnalysis.longTermChanges}
                </>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Best Compromise Solutions */}
      <h2 className="text-xl font-bold mt-6 mb-4">
        <Link href="/concepts/compromise">Best Compromise Solutions</Link>
      </h2>

      <table className="ise-table mb-8">
        <thead>
          <tr className="bg-info">
            <th>Solutions Addressing Core Concerns</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {belief.compromises.map((c, i) => (
                <span key={c.id}>
                  {i + 1}. {c.description}
                  <br />
                  <br />
                </span>
              ))}
              {belief.compromises.length === 0 && "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Obstacles to Resolution */}
      <h2 className="text-xl font-bold mt-6 mb-4">
        <Link href="/concepts/obstacles-to-resolution">
          Primary Obstacles to Resolution
        </Link>
      </h2>

      <table className="ise-table mb-8">
        <thead>
          <tr className="bg-disagree">
            <th style={{ width: "50%" }}>Barriers to Supporter Honesty</th>
            <th style={{ width: "50%" }}>Barriers to Opposition Honesty</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top">
              {supporterObstacles.map((o, i) => (
                <span key={o.id}>
                  {i + 1}. {o.description}
                  <br />
                </span>
              ))}
              {supporterObstacles.length === 0 && "—"}
            </td>
            <td className="align-top">
              {oppositionObstacles.map((o, i) => (
                <span key={o.id}>
                  {i + 1}. {o.description}
                  <br />
                </span>
              ))}
              {oppositionObstacles.length === 0 && "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Biases */}
      <h2 className="text-xl font-bold mt-6 mb-4">
        <Link href="/concepts/bias">Biases</Link>
      </h2>

      <table className="ise-table mb-8">
        <thead>
          <tr className="bg-neutral">
            <th style={{ width: "50%" }}>Affecting Supporters</th>
            <th style={{ width: "50%" }}>Affecting Opponents</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top">
              {supporterBiases.map((b, i) => (
                <span key={b.id}>
                  {i + 1}. <strong>{b.biasType.replace(/_/g, " ")}</strong>
                  {b.description && `: ${b.description}`}
                  <br />
                </span>
              ))}
              {supporterBiases.length === 0 && "—"}
            </td>
            <td className="align-top">
              {opponentBiases.map((b, i) => (
                <span key={b.id}>
                  {i + 1}. <strong>{b.biasType.replace(/_/g, " ")}</strong>
                  {b.description && `: ${b.description}`}
                  <br />
                </span>
              ))}
              {opponentBiases.length === 0 && "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Media Resources */}
      <h2 className="text-xl font-bold mt-6 mb-4">
        <Link href="/concepts/media">Media Resources</Link>
      </h2>

      <table className="ise-table mb-8">
        <thead>
          <tr>
            <th className="bg-agree" style={{ width: "50%" }}>
              Supporting
            </th>
            <th className="bg-disagree" style={{ width: "50%" }}>
              Opposing
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top">
              <strong>
                <Link href="/concepts/books">Books</Link>
              </strong>
              <br />
              {renderMediaByType(supportingMedia, "book") || "—"}
              <br />
              <strong>Articles</strong>
              <br />
              {renderMediaByType(supportingMedia, "article") || "—"}
              <br />
              <strong>
                <Link href="/concepts/podcasts">Podcasts</Link>
              </strong>
              <br />
              {renderMediaByType(supportingMedia, "podcast") || "—"}
              <br />
              <strong>
                <Link href="/concepts/movies">Movies</Link>
              </strong>
              <br />
              {renderMediaByType(supportingMedia, "movie") || "—"}
              <br />
              <strong>
                <Link href="/concepts/songs-that-agree">Songs</Link>
              </strong>
              <br />
              {renderMediaByType(supportingMedia, "song") || "—"}
            </td>
            <td className="align-top">
              <strong>
                <Link href="/concepts/books">Books</Link>
              </strong>
              <br />
              {renderMediaByType(opposingMedia, "book") || "—"}
              <br />
              <strong>Articles</strong>
              <br />
              {renderMediaByType(opposingMedia, "article") || "—"}
              <br />
              <strong>
                <Link href="/concepts/podcasts">Podcasts</Link>
              </strong>
              <br />
              {renderMediaByType(opposingMedia, "podcast") || "—"}
              <br />
              <strong>
                <Link href="/concepts/movies">Movies</Link>
              </strong>
              <br />
              {renderMediaByType(opposingMedia, "movie") || "—"}
              <br />
              <strong>
                <Link href="/concepts/songs-that-agree">Songs</Link>
              </strong>
              <br />
              {renderMediaByType(opposingMedia, "song") || "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Legal Framework */}
      <h2 className="text-xl font-bold mt-6 mb-4">
        <Link href="/concepts/legal-framework">Legal Framework</Link>
      </h2>

      <table className="ise-table mb-8">
        <thead>
          <tr className="bg-neutral">
            <th style={{ width: "50%" }}>Supporting Laws</th>
            <th style={{ width: "50%" }}>Contradicting Laws</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top">
              {supportingLaws.map((l, i) => (
                <span key={l.id}>
                  {i + 1}. {l.description}
                  {l.jurisdiction && (
                    <span className="text-xs text-[var(--color-muted)]">
                      {" "}
                      [{l.jurisdiction}]
                    </span>
                  )}
                  <br />
                </span>
              ))}
              {supportingLaws.length === 0 && "—"}
            </td>
            <td className="align-top">
              {contradictingLaws.map((l, i) => (
                <span key={l.id}>
                  {i + 1}. {l.description}
                  {l.jurisdiction && (
                    <span className="text-xs text-[var(--color-muted)]">
                      {" "}
                      [{l.jurisdiction}]
                    </span>
                  )}
                  <br />
                </span>
              ))}
              {contradictingLaws.length === 0 && "—"}
            </td>
          </tr>
        </tbody>
      </table>

      <hr className="border-[var(--color-border)] my-8" />

      {/* ── General to Specific Belief Mapping ── */}
      <h2 className="text-xl font-bold mt-8 mb-4">
        <Link href="/concepts/belief-sorting">
          General to Specific Belief Mapping
        </Link>
      </h2>

      <h3 className="font-semibold mb-2">Most General (Upstream)</h3>
      <table className="ise-table mb-4">
        <thead>
          <tr className="bg-neutral">
            <th style={{ width: "50%" }}>Support</th>
            <th style={{ width: "50%" }}>Oppose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top">
              {upstreamSupport.map((m, i) => (
                <span key={m.id}>
                  {i + 1}.{" "}
                  <Link href={`/beliefs/${m.parentBelief.slug}`}>
                    {m.parentBelief.statement}
                  </Link>
                  <br />
                </span>
              ))}
              {upstreamSupport.length === 0 && "—"}
            </td>
            <td className="align-top">
              {upstreamOppose.map((m, i) => (
                <span key={m.id}>
                  {i + 1}.{" "}
                  <Link href={`/beliefs/${m.parentBelief.slug}`}>
                    {m.parentBelief.statement}
                  </Link>
                  <br />
                </span>
              ))}
              {upstreamOppose.length === 0 && "—"}
            </td>
          </tr>
        </tbody>
      </table>

      <h3 className="font-semibold mb-2">More Specific (Downstream)</h3>
      <table className="ise-table mb-8">
        <thead>
          <tr className="bg-neutral">
            <th style={{ width: "50%" }}>Support</th>
            <th style={{ width: "50%" }}>Oppose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top">
              {downstreamSupport.map((m, i) => (
                <span key={m.id}>
                  {i + 1}.{" "}
                  <Link href={`/beliefs/${m.childBelief.slug}`}>
                    {m.childBelief.statement}
                  </Link>
                  <br />
                </span>
              ))}
              {downstreamSupport.length === 0 && "—"}
            </td>
            <td className="align-top">
              {downstreamOppose.map((m, i) => (
                <span key={m.id}>
                  {i + 1}.{" "}
                  <Link href={`/beliefs/${m.childBelief.slug}`}>
                    {m.childBelief.statement}
                  </Link>
                  <br />
                </span>
              ))}
              {downstreamOppose.length === 0 && "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Similar Beliefs */}
      <h2 className="text-xl font-bold mt-6 mb-4">
        <Link href="/concepts/combine-similar-beliefs">Similar Beliefs</Link>
      </h2>

      <table className="ise-table mb-8">
        <thead>
          <tr className="bg-neutral">
            <th style={{ width: "50%" }}>More Extreme Versions</th>
            <th style={{ width: "50%" }}>More Moderate Versions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top">
              {extremeSimilar.map((s, i) => (
                <span key={s.id}>
                  {i + 1}.{" "}
                  <Link href={`/beliefs/${s.belief.slug}`}>
                    {s.belief.statement}
                  </Link>
                  <br />
                </span>
              ))}
              {extremeSimilar.length === 0 && "—"}
            </td>
            <td className="align-top">
              {moderateSimilar.map((s, i) => (
                <span key={s.id}>
                  {i + 1}.{" "}
                  <Link href={`/beliefs/${s.belief.slug}`}>
                    {s.belief.statement}
                  </Link>
                  <br />
                </span>
              ))}
              {moderateSimilar.length === 0 && "—"}
            </td>
          </tr>
        </tbody>
      </table>

      <hr className="border-[var(--color-border)] my-8" />

      {/* ── Contribute ── */}
      <h1 className="text-2xl font-bold mt-8 mb-4">Contribute</h1>
      <p>
        <Link href="/concepts/contact-me">Contact</Link> to contribute to the
        Idea Stock Exchange.
      </p>
      <p>
        <Link
          href="https://github.com/myklob/ideastockexchange"
          target="_blank"
          rel="noopener"
        >
          View the full codebase and technical documentation on GitHub
        </Link>{" "}
        to understand the scoring algorithms, contribute to development, or
        adapt this system for your own use.
      </p>
      <p>Start by exploring how we:</p>
      <ul className="list-disc list-inside mb-4">
        <li>
          Calculate{" "}
          <Link href="/concepts/argument-scores-from-sub-arguments">
            argument scores from sub-arguments
          </Link>
        </li>
        <li>
          Measure <Link href="/concepts/truth">truth</Link> and{" "}
          <Link href="/concepts/evidence">evidence quality</Link>
        </li>
        <li>
          Apply{" "}
          <Link href="/concepts/linkage-scores">linkage scores</Link> to weight
          relevance
        </li>
        <li>
          Implement{" "}
          <Link href="/concepts/reasonrank">ReasonRank</Link> for
          quality-based sorting
        </li>
      </ul>
      <p className="text-sm text-[var(--color-muted)]">
        This template provides the structure. Your contributions provide the
        content. Together, we build humanity&apos;s knowledge infrastructure for
        better decisions.
      </p>

      <p className="text-right text-lg font-bold mt-6">
        Score:{" "}
        <span
          style={{
            color:
              score >= 0 ? "var(--color-link)" : "#ef4444",
          }}
        >
          {formatScore(score)}
        </span>{" "}
        <span className="text-sm font-normal text-[var(--color-muted)]">
          (based on{" "}
          <Link href="/concepts/argument-scores-from-sub-arguments">
            argument scores
          </Link>
          )
        </span>
      </p>
    </div>
  );
}
