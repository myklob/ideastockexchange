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
      Importance:{' '}
      <strong className={scoreColor(importanceScore)}>{importanceScore}</strong>
      {' | '}
      Evidence Depth:{' '}
      <strong className={depthColor(evidenceDepth)}>{evidenceDepth}</strong>
      {' | '}
      <a href="/algorithms/reason-rank" className="text-blue-600 hover:underline">
        Controversy Rating
      </a>
      :{' '}
      <strong className={scoreColor(controversyRating)}>{controversyRating}</strong>
    </div>
  );
}
