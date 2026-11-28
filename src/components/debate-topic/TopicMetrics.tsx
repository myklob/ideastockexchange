import Link from 'next/link';

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
    <div className="border border-gray-300 p-3 bg-[#f0f3f6] mb-3 text-center text-sm">
      <strong>Topic Metrics</strong>
      {' | '}
      <Link href="/algorithms/importance-score" className="text-blue-600 hover:underline">
        Importance
      </Link>
      :{' '}
      <strong className={scoreColor(importanceScore)}>{importanceScore}</strong>
      {' | '}
      <Link href="/algorithms/evidence-scores" className="text-blue-600 hover:underline">
        Evidence Depth
      </Link>
      :{' '}
      <strong className={depthColor(evidenceDepth)}>{evidenceDepth}</strong>
      {' | '}
      <Link href="/algorithms/reason-rank" className="text-blue-600 hover:underline">
        Controversy
      </Link>
      :{' '}
      <strong className={scoreColor(controversyRating)}>{controversyRating}</strong>
    </div>
  );
}
