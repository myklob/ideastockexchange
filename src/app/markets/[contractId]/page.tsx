import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getContract,
  formatResolutionLabel,
  formatThresholdLabel,
} from '@/lib/markets/contracts';
import MarketTrade from './MarketTrade';

interface PageProps {
  params: Promise<{ contractId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { contractId } = await params;
  const c = getContract(contractId);
  if (!c) return { title: 'Market not found' };
  return {
    title: `${c.beliefStatement} — Market — Idea Stock Exchange`,
    description: `Buy YES/NO on whether the belief score is ${formatThresholdLabel(c)} at ${formatResolutionLabel(c)}.`,
  };
}

export default async function MarketDetailPage({ params }: PageProps) {
  const { contractId } = await params;
  const contract = getContract(contractId);
  if (!contract) notFound();

  return (
    <main className="max-w-[960px] mx-auto px-4 py-8 text-[#222]">
      <p className="text-right text-sm italic text-gray-600 mb-6">
        <Link href="/" className="text-blue-700 hover:underline">Home</Link>
        {' > '}
        <Link href="/markets" className="text-blue-700 hover:underline">Markets</Link>
        {' > '}
        <strong className="truncate">{contract.beliefStatement.slice(0, 60)}…</strong>
      </p>

      <div className="text-xs text-gray-500 mb-2">
        <span className="font-medium">{contract.category}</span>
        {' • '}
        <span>Resolves {formatResolutionLabel(contract)}</span>
        {' • '}
        <span className="font-mono">{contract.id}</span>
      </div>

      <h1 className="text-2xl font-bold mb-2 leading-tight">
        {contract.beliefStatement}
      </h1>
      <p className="text-lg text-gray-700 mb-6">
        Will <strong>{formatThresholdLabel(contract)}</strong> at epoch end
        ({formatResolutionLabel(contract)})?
      </p>

      <MarketTrade
        contractId={contract.id}
        initialState={contract.state}
        threshold={contract.threshold}
        direction={contract.direction}
        currentScore={contract.currentScore}
      />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
            Live belief score
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {(contract.currentScore * 100).toFixed(0)}%
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Computed by the ReasonRank engine from the current argument
            graph. The market is betting on what this number will be at{' '}
            {formatResolutionLabel(contract)}.
          </p>
          <Link
            href={`/beliefs/${contract.beliefSlug}`}
            className="inline-block mt-3 text-sm text-blue-700 hover:underline"
          >
            Open the belief page →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
            Settlement rule
          </div>
          <p className="text-sm text-gray-800">
            <strong>YES</strong> wins if the live score is{' '}
            <strong>{contract.direction === 'ABOVE' ? 'above' : 'below'}</strong>{' '}
            <strong>{(contract.threshold * 100).toFixed(0)}%</strong> at{' '}
            {formatResolutionLabel(contract)}. Strict inequality — ties
            resolve NO.
          </p>
          <p className="text-xs text-gray-500 mt-2 italic">
            The graph freezes for 20 minutes around each epoch boundary so
            no last-minute edits flip outcomes.
          </p>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
        <p className="mb-1">
          <strong>Want to move the price?</strong> Don&apos;t out-bid the AMM —
          go improve the underlying argument graph. Better arguments,
          better evidence, tighter linkages all show up in the next
          snapshot.
        </p>
        <p>
          Read{' '}
          <Link
            href="/prediction-markets-comparison"
            className="text-blue-700 hover:underline"
          >
            the engineering spec
          </Link>{' '}
          for the full settlement mechanics.
        </p>
      </div>
    </main>
  );
}
