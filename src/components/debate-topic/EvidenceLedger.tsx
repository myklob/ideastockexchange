import Link from 'next/link';
import type { DebateEvidence } from '@/core/types/debate-topic';

interface Props {
  evidenceItems: DebateEvidence[];
}

function qualityColor(score: number): string {
  if (score >= 80) return 'text-green-700';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
}

function standingBadge(standing: string) {
  if (standing === 'FALSIFIED') {
    return <span className="font-semibold text-red-600">FALSIFIED</span>;
  }
  if (standing === 'DISPUTED') {
    return <span className="font-semibold text-[#b58900]">DISPUTED</span>;
  }
  return <span className="font-semibold text-gray-700">VERIFIED</span>;
}

function tierRank(tier: string | undefined): number {
  const n = Number((tier ?? 'T2').replace(/^T/i, ''));
  return Number.isFinite(n) ? n : 2;
}

export default function EvidenceLedger({ evidenceItems }: Props) {
  const rows = [...evidenceItems].sort(
    (a, b) => tierRank(a.tier) - tierRank(b.tier) || b.qualityScore - a.qualityScore
  );

  return (
    <div id="evidence-ledger" className="mb-8">
      <h2 className="text-xl font-bold mb-1">2. The Evidence Ledger</h2>
      <p className="text-sm text-gray-600 mb-3">
        The raw inputs every Belief Score on this page traces back to. Quality scores reflect
        methodology, sample size, and reproducibility. Ten independent sources confirming one finding
        raise that finding&apos;s{' '}
        <Link href="/algorithms/truth-scores" className="text-blue-600 hover:underline">Truth Score</Link>;
        they do not create ten arguments. Corroboration is rewarded. Repetition is not. See{' '}
        <Link href="/algorithms/unique-scores" className="text-blue-600 hover:underline">Duplication Scores</Link>.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-[#f0f3f6]">
              <th className="border border-gray-300 px-2 py-2 w-[6%] text-center">T</th>
              <th className="border border-gray-300 px-3 py-2 w-[20%]">Source</th>
              <th className="border border-gray-300 px-2 py-2 w-[5%] text-center">↑↓</th>
              <th className="border border-gray-300 px-3 py-2 w-[37%]">Argument It Bears On</th>
              <th className="border border-gray-300 px-2 py-2 w-[10%] text-center">Quality</th>
              <th className="border border-gray-300 px-2 py-2 w-[10%] text-center">
                <Link href="/algorithms/linkage-scores" className="text-blue-600 hover:underline">Linkage</Link>
              </th>
              <th className="border border-gray-300 px-2 py-2 w-[12%] text-center">Standing</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => (
              <tr key={e.id ?? i} id={e.id !== undefined ? `evidence-${e.id}` : undefined} className="align-top scroll-mt-4">
                <td className="border border-gray-300 px-2 py-2 text-center">{e.tier ?? 'T2'}</td>
                <td className="border border-gray-300 px-3 py-2">
                  {e.url ? (
                    <a href={e.url} className="text-blue-600 hover:underline">{e.title}</a>
                  ) : (
                    e.title
                  )}
                  {e.source && <span className="block text-xs text-gray-500">{e.source}</span>}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center font-bold">
                  {e.side === 'weakening' ? (
                    <span className="text-red-600">−</span>
                  ) : (
                    <span className="text-green-700">+</span>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2">{e.argument || e.finding}</td>
                <td className={`border border-gray-300 px-2 py-2 text-center font-bold ${qualityColor(e.qualityScore)}`}>
                  {e.qualityScore}%
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center font-mono">
                  {e.linkage !== undefined ? `+${e.linkage.toFixed(2)}` : '—'}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center">
                  {standingBadge(e.standing ?? 'VERIFIED')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-600 mt-2">
        <strong>Legend.</strong> <strong>T</strong> = evidence tier (T1 peer-reviewed, T2 reputable
        institution, T3 secondary, T4 anecdotal). <strong>↑↓</strong> = supports (+) or weakens (−) the
        linked argument. <strong>Quality</strong> = methodological strength of the evidence itself.{' '}
        <strong>Linkage</strong> = how directly this evidence bears on the specific argument it&apos;s
        attached to (see{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-600 hover:underline">Linkage Scores</Link>).{' '}
        <strong>Standing</strong> = where the evidence sits in the verification lifecycle: VERIFIED counts
        at full weight, DISPUTED at half weight while the challenge is open, FALSIFIED at zero, with the
        retraction propagating to every score built on it. See{' '}
        <Link href="/algorithms/evidence-scores" className="text-blue-600 hover:underline">Evidence Scores</Link>.
      </p>
    </div>
  );
}
