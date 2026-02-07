import Link from "next/link";
import { prisma } from "@/lib/db";
import { getPositivityLabel, formatScore } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const beliefs = await prisma.belief.findMany({
    include: {
      arguments: true,
      evidence: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Idea Stock Exchange</h1>
        <p className="text-[var(--color-muted)]">
          A structured analysis platform where beliefs are scored through
          recursive{" "}
          <Link href="/concepts/reasons">argument trees</Link>,{" "}
          <Link href="/concepts/evidence">evidence verification</Link>, and{" "}
          <Link href="/concepts/linkage-scores">linkage scoring</Link>.
          Each belief has its own page with comprehensive analysis from multiple
          angles.
        </p>
        <p className="text-[var(--color-muted)] mt-2 text-sm">
          Scoring uses the{" "}
          <Link href="/concepts/reasonrank">ReasonRank</Link> algorithm.
          Each section builds a complete analysis.{" "}
          <Link
            href="https://github.com/myklob/ideastockexchange"
            target="_blank"
            rel="noopener"
          >
            View the full technical documentation on GitHub
          </Link>.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">All Beliefs</h2>
        <table className="ise-table">
          <thead>
            <tr className="bg-neutral">
              <th style={{ width: "50%" }}>Belief Statement</th>
              <th style={{ width: "15%" }}>Category</th>
              <th style={{ width: "12%" }}>
                <Link href="/concepts/positivity-continuum">Positivity</Link>
              </th>
              <th style={{ width: "11%" }}>
                <Link href="/concepts/reasons">Arguments</Link>
              </th>
              <th style={{ width: "12%" }}>
                <Link href="/concepts/evidence">Evidence</Link>
              </th>
            </tr>
          </thead>
          <tbody>
            {beliefs.map((belief) => {
              const proArgs = belief.arguments.filter(
                (a) => a.side === "agree"
              ).length;
              const conArgs = belief.arguments.filter(
                (a) => a.side === "disagree"
              ).length;
              const supEvidence = belief.evidence.filter(
                (e) => e.side === "supporting"
              ).length;
              const weakEvidence = belief.evidence.filter(
                (e) => e.side === "weakening"
              ).length;

              return (
                <tr key={belief.id}>
                  <td>
                    <Link
                      href={`/beliefs/${belief.slug}`}
                      className="font-medium"
                    >
                      {belief.statement}
                    </Link>
                  </td>
                  <td className="text-sm">
                    {belief.category}
                    {belief.subcategory && (
                      <span className="text-[var(--color-muted)]">
                        {" "}
                        &gt; {belief.subcategory}
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className="font-semibold"
                      title={getPositivityLabel(belief.positivity)}
                    >
                      {formatScore(belief.positivity)}
                    </span>
                    <br />
                    <span className="text-xs text-[var(--color-muted)]">
                      {getPositivityLabel(belief.positivity)}
                    </span>
                  </td>
                  <td className="text-sm">
                    <span className="text-green-600">+{proArgs}</span>
                    {" / "}
                    <span className="text-red-600">-{conArgs}</span>
                  </td>
                  <td className="text-sm">
                    <span className="text-green-600">+{supEvidence}</span>
                    {" / "}
                    <span className="text-red-600">-{weakEvidence}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 p-4 bg-neutral rounded text-sm">
        <h3 className="font-semibold mb-2">How It Works</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Each belief has its own page following the{" "}
            <Link href="/concepts/one-page-per-topic">One Page Per Topic</Link>{" "}
            principle
          </li>
          <li>
            Arguments are{" "}
            <Link href="/concepts/argument-scores-from-sub-arguments">
              scored recursively
            </Link>{" "}
            from sub-arguments using{" "}
            <Link href="/concepts/reasonrank">ReasonRank</Link>
          </li>
          <li>
            <Link href="/concepts/truth">Truth</Link> is multiplied by{" "}
            <Link href="/concepts/linkage-scores">linkage</Link> and{" "}
            <Link href="/concepts/importance-score">importance</Link>
          </li>
          <li>
            The system implements{" "}
            <Link href="/concepts/automate-conflict-resolution">
              automated conflict resolution
            </Link>{" "}
            based on &quot;Getting to Yes&quot;
          </li>
        </ul>
      </div>
    </div>
  );
}
