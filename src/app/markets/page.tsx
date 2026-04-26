import Link from 'next/link';
import type { Metadata } from 'next';
import {
  FEATURED_CONTRACTS,
  formatResolutionLabel,
  formatThresholdLabel,
} from '@/lib/markets/contracts';
import { priceYes } from '@/lib/markets/lmsr';

export const metadata: Metadata = {
  title: 'Prediction Markets — Idea Stock Exchange',
  description:
    'Buy YES/NO shares on the future ReasonRank score of belief pages. Play money. Settles against the live argument graph at the end of each month.',
};

function PriceBar({ priceYes }: { priceYes: number }) {
  const pctYes = Math.round(priceYes * 100);
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div className="bg-green-500" style={{ width: `${pctYes}%` }} />
      <div className="bg-red-400" style={{ width: `${100 - pctYes}%` }} />
    </div>
  );
}

export default function MarketsIndexPage() {
  const rows = FEATURED_CONTRACTS.map((c) => {
    const py = priceYes(c.state);
    return { contract: c, py };
  });

  return (
    <main className="max-w-[960px] mx-auto px-4 py-8 text-[#222]">
      <p className="text-right text-sm italic text-gray-600 mb-6">
        <Link href="/" className="text-blue-700 hover:underline">Home</Link>
        {' > '}
        <strong>Markets</strong>
      </p>

      <h1 className="text-3xl font-bold mb-2">Prediction Markets</h1>
      <p className="text-lg text-gray-600 mb-4">
        Buy YES or NO on the future ReasonRank score of a belief.
      </p>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded text-sm">
        <p className="mb-1">
          <strong>Play money.</strong> Every account starts with{' '}
          <span className="font-mono">$1,000</span>. Positions are stored
          locally in your browser, and prices are quoted by an LMSR market
          maker (<InlineLink href="/prediction-markets-comparison" />).
        </p>
        <p>
          Markets settle against{' '}
          <code className="font-mono text-xs bg-amber-100 px-1 rounded">
            EpochSnapshot.truth_score
          </code>{' '}
          on the resolution date. Move the score by posting better arguments
          on the belief page — not by trading.
        </p>
      </div>

      <div className="space-y-3">
        {rows.map(({ contract: c, py }) => {
          const yesPct = (py * 100).toFixed(0);
          const noPct = ((1 - py) * 100).toFixed(0);
          return (
            <Link
              key={c.id}
              href={`/markets/${c.id}`}
              className="block border border-gray-200 rounded-lg p-5 hover:border-blue-400 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <span className="font-medium">{c.category}</span>
                    <span>•</span>
                    <span>Resolves {formatResolutionLabel(c)}</span>
                  </div>
                  <h2 className="font-semibold text-lg leading-snug mb-1">
                    {c.beliefStatement}
                  </h2>
                  <p className="text-sm text-gray-600 mb-1">
                    Will <strong>{formatThresholdLabel(c)}</strong> at epoch
                    end? Current live score:{' '}
                    <span className="font-mono">
                      {(c.currentScore * 100).toFixed(0)}%
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 italic">{c.blurb}</p>
                </div>

                <div className="flex-shrink-0 text-right min-w-[120px]">
                  <div className="text-2xl font-bold text-green-700 leading-none">
                    {yesPct}¢
                  </div>
                  <div className="text-xs text-gray-500 mb-2">YES price</div>
                  <div className="text-sm text-red-600">{noPct}¢ NO</div>
                </div>
              </div>

              <PriceBar priceYes={py} />
            </Link>
          );
        })}
      </div>

      <div className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-600">
        <p>
          See the full mechanics in the{' '}
          <Link
            href="/prediction-markets-comparison"
            className="text-blue-700 hover:underline"
          >
            Prediction Market Layer engineering spec
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

function InlineLink({ href }: { href: string }) {
  return (
    <Link href={href} className="text-blue-700 hover:underline">
      see the spec
    </Link>
  );
}
