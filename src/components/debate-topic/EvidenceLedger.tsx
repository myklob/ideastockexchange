import type { DebateEvidence } from '@/core/types/debate-topic';

interface Props {
  evidenceItems: DebateEvidence[];
}

function qualityColor(score: number): string {
  if (score >= 80) return 'text-green-700';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
}

export default function EvidenceLedger({ evidenceItems }: Props) {
  const supporting = evidenceItems.filter((e) => e.side === 'supporting');
  const weakening = evidenceItems.filter((e) => e.side === 'weakening');
  const maxRows = Math.max(supporting.length, weakening.length);

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-1">⚖️ The Evidence Ledger</h2>
      <p className="text-xs text-gray-600 mb-3">
        Weighing the raw data. Quality scores based on methodology, sample size, and reproducibility.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 w-[40%]">Supporting Evidence (Pro)</th>
              <th className="border border-gray-300 px-3 py-2 w-[10%] text-center">Quality</th>
              <th className="border border-gray-300 px-3 py-2 w-[40%]">Weakening Evidence (Skeptical)</th>
              <th className="border border-gray-300 px-3 py-2 w-[10%] text-center">Quality</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxRows }).map((_, i) => {
              const s = supporting[i];
              const w = weakening[i];
              return (
                <tr key={i} className="align-top">
                  <td className="border border-gray-300 px-3 py-2">
                    {s ? (
                      <>
                        {s.url ? (
                          <a href={s.url} className="font-semibold text-blue-600 hover:underline">{s.title}</a>
                        ) : (
                          <strong>{s.title}</strong>
                        )}
                        <br />
                        <span className="text-xs text-gray-500">{s.source}</span>
                        <br />
                        <span className="text-xs">{s.finding}</span>
                      </>
                    ) : null}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center align-middle">
                    {s ? (
                      <>
                        <span className={`font-bold ${qualityColor(s.qualityScore)}`}>[{s.qualityScore}%]</span>
                        <br />
                        <span className="text-xs text-gray-500">({s.qualityLabel})</span>
                      </>
                    ) : null}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {w ? (
                      <>
                        {w.url ? (
                          <a href={w.url} className="font-semibold text-blue-600 hover:underline">{w.title}</a>
                        ) : (
                          <strong>{w.title}</strong>
                        )}
                        <br />
                        <span className="text-xs text-gray-500">{w.source}</span>
                        <br />
                        <span className="text-xs">{w.finding}</span>
                      </>
                    ) : null}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center align-middle">
                    {w ? (
                      <>
                        <span className={`font-bold ${qualityColor(w.qualityScore)}`}>[{w.qualityScore}%]</span>
                        <br />
                        <span className="text-xs text-gray-500">({w.qualityLabel})</span>
                      </>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-right text-xs mt-2 text-gray-500">
        See: <a href="/evidence-scoring" className="text-blue-600 hover:underline">Evidence Scoring Methodology</a>
      </p>
    </div>
  );
}
