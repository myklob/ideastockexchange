interface Props {
  importanceScore: number;   // 0–100
  evidenceDepth: string;     // "Low" | "Med" | "High"
  controversyRating: number; // 0–100
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-green-700';
  if (score >= 40) return 'text-yellow-700';
  return 'text-red-700';
}

function depthColor(depth: string): string {
  if (depth === 'High') return 'text-green-700';
  if (depth === 'Med') return 'text-yellow-700';
  return 'text-red-700';
}

export default function TopicMetrics({ importanceScore, evidenceDepth, controversyRating }: Props) {
  return (
    <div className="border border-gray-300 p-3 bg-gray-50 mb-6 text-center text-sm">
      <strong>Topic Metrics</strong>
      <br />
      <a href="/algorithms/importance-score" className="text-blue-600 hover:underline">
        Importance
      </a>
      :{' '}
      <strong className={scoreColor(importanceScore)}>{importanceScore}</strong>
      {' | '}
      <a href="/algorithms/evidence-scores" className="text-blue-600 hover:underline">
        Evidence Depth
      </a>
      :{' '}
      <strong className={depthColor(evidenceDepth)}>{evidenceDepth}</strong>
      {' | '}
      <a href="/algorithms/reason-rank" className="text-blue-600 hover:underline">
        Controversy
      </a>
      :{' '}
      <strong className={scoreColor(controversyRating)}>{controversyRating}</strong>
      <p className="mt-1.5 mb-0 text-[11px] text-gray-500">
        Every bracketed number on this page is a placeholder until the{' '}
        <a href="/algorithms/reason-rank" className="text-blue-600 hover:underline">ReasonRank</a>{' '}
        engine computes live scores.
      </p>
    </div>
  );
}
