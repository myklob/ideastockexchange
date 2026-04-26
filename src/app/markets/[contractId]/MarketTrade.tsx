'use client';

import { useState, useSyncExternalStore } from 'react';
import {
  type LmsrState,
  type Side,
  applyTrade,
  avgPricePerShare,
  costToBuy,
  priceFor,
  priceYes,
} from '@/lib/markets/lmsr';

interface PortfolioEntry {
  /** Total YES shares held on this contract. */
  yes: number;
  /** Total NO shares held. */
  no: number;
  /** Cost-basis dollars for the YES position. */
  yesCostBasis: number;
  /** Cost-basis dollars for the NO position. */
  noCostBasis: number;
  /** AMM state shifted by this user's local trades. */
  state: LmsrState;
}

interface SavedPortfolio {
  cash: number;
  positions: Record<string, PortfolioEntry>;
}

const STORAGE_KEY = 'ise:markets:portfolio:v1';
const STARTING_CASH = 1000;
const EMPTY_PORTFOLIO: SavedPortfolio = { cash: STARTING_CASH, positions: {} };

let cachedSnapshot: SavedPortfolio = EMPTY_PORTFOLIO;
const subscribers = new Set<() => void>();

function readFromStorage(): SavedPortfolio {
  if (typeof window === 'undefined') return EMPTY_PORTFOLIO;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PORTFOLIO;
    const parsed = JSON.parse(raw) as SavedPortfolio;
    if (typeof parsed.cash !== 'number' || !parsed.positions) {
      return EMPTY_PORTFOLIO;
    }
    return parsed;
  } catch {
    return EMPTY_PORTFOLIO;
  }
}

function subscribe(cb: () => void): () => void {
  if (subscribers.size === 0 && typeof window !== 'undefined') {
    cachedSnapshot = readFromStorage();
  }
  subscribers.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cachedSnapshot = readFromStorage();
      subscribers.forEach((s) => s());
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }
  return () => {
    subscribers.delete(cb);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

function getSnapshot(): SavedPortfolio {
  return cachedSnapshot;
}

function getServerSnapshot(): SavedPortfolio {
  return EMPTY_PORTFOLIO;
}

function savePortfolio(p: SavedPortfolio) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  cachedSnapshot = p;
  subscribers.forEach((s) => s());
}

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatCents(p: number): string {
  return `${(p * 100).toFixed(1)}¢`;
}

interface Props {
  contractId: string;
  initialState: LmsrState;
  threshold: number;
  direction: 'ABOVE' | 'BELOW';
  currentScore: number;
}

export default function MarketTrade({
  contractId,
  initialState,
  threshold,
  direction,
  currentScore,
}: Props) {
  const portfolio = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [side, setSide] = useState<Side>('YES');
  const [shareInput, setShareInput] = useState('10');
  const [flash, setFlash] = useState<string | null>(null);

  const entry: PortfolioEntry = portfolio.positions[contractId] ?? {
    yes: 0,
    no: 0,
    yesCostBasis: 0,
    noCostBasis: 0,
    state: initialState,
  };

  const state = entry.state;
  const shares = Math.max(0, Number(shareInput) || 0);

  const marginalYes = priceYes(state);
  const marginalSide = priceFor(state, side);
  const quoteCost = costToBuy(state, side, shares);
  const quoteAvg = shares > 0 ? avgPricePerShare(state, side, shares) : marginalSide;

  const insufficientCash = quoteCost > portfolio.cash + 1e-9;
  const canBuy = shares > 0 && !insufficientCash;

  function handleBuy() {
    if (!canBuy) return;
    const newState = applyTrade(state, side, shares);
    const next: SavedPortfolio = {
      cash: portfolio.cash - quoteCost,
      positions: {
        ...portfolio.positions,
        [contractId]: {
          yes: side === 'YES' ? entry.yes + shares : entry.yes,
          no: side === 'NO' ? entry.no + shares : entry.no,
          yesCostBasis:
            side === 'YES' ? entry.yesCostBasis + quoteCost : entry.yesCostBasis,
          noCostBasis:
            side === 'NO' ? entry.noCostBasis + quoteCost : entry.noCostBasis,
          state: newState,
        },
      },
    };
    savePortfolio(next);
    setFlash(`Bought ${shares} ${side} for ${formatMoney(quoteCost)}`);
    setTimeout(() => setFlash(null), 2500);
  }

  function handleResetAccount() {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Reset cash to $1,000 and clear all positions?')
    ) {
      return;
    }
    savePortfolio({ cash: STARTING_CASH, positions: {} });
    setFlash('Account reset.');
    setTimeout(() => setFlash(null), 2000);
  }

  // Settlement-value preview: if the live score were to settle YES today,
  // what would this user pocket?
  const liveResolvesYes =
    direction === 'ABOVE' ? currentScore > threshold : currentScore < threshold;
  const settlementValueIfNow = liveResolvesYes ? entry.yes : entry.no;
  const totalCostBasis = entry.yesCostBasis + entry.noCostBasis;
  const unrealizedPnL = entry.yes * marginalYes + entry.no * (1 - marginalYes) - totalCostBasis;

  return (
    <div className="space-y-6">
      <PriceHeader state={state} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 border border-gray-200 rounded-lg p-5">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setSide('YES')}
              className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                side === 'YES'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Buy YES @ {formatCents(marginalYes)}
            </button>
            <button
              type="button"
              onClick={() => setSide('NO')}
              className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                side === 'NO'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Buy NO @ {formatCents(1 - marginalYes)}
            </button>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Shares</span>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                min={0}
                step={1}
                value={shareInput}
                onChange={(e) => setShareInput(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 font-mono text-right"
              />
              {[10, 25, 100].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setShareInput(String(n))}
                  className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  {n}
                </button>
              ))}
            </div>
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Avg price / share" value={formatCents(quoteAvg)} />
            <Stat label="Total cost" value={formatMoney(quoteCost)} />
            <Stat
              label="Max payout if won"
              value={formatMoney(shares * 1)}
              hint="$1.00 per winning share"
            />
            <Stat
              label="Profit if won"
              value={formatMoney(shares * 1 - quoteCost)}
              hint={
                shares > 0
                  ? `${(((shares * 1 - quoteCost) / quoteCost) * 100).toFixed(0)}% return`
                  : '—'
              }
            />
          </div>

          {insufficientCash && (
            <p className="mt-3 text-sm text-red-600">
              Not enough play money. You have {formatMoney(portfolio.cash)};
              this trade costs {formatMoney(quoteCost)}.
            </p>
          )}

          <button
            type="button"
            onClick={handleBuy}
            disabled={!canBuy}
            className={`mt-4 w-full py-3 rounded font-semibold text-white transition-colors ${
              canBuy
                ? side === 'YES'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {`Buy ${shares} ${side} for ${formatMoney(quoteCost)}`}
          </button>

          {flash && (
            <p className="mt-3 text-sm text-green-700 font-medium">{flash}</p>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Your account</h3>
            <button
              type="button"
              onClick={handleResetAccount}
              className="text-xs text-gray-500 hover:text-red-600 hover:underline"
            >
              Reset
            </button>
          </div>
          <Stat
            label="Play-money cash"
            value={formatMoney(portfolio.cash)}
          />
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">YES shares on this market</span>
              <span className="font-mono">{entry.yes.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">NO shares on this market</span>
              <span className="font-mono">{entry.no.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cost basis</span>
              <span className="font-mono">{formatMoney(totalCostBasis)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unrealized P/L</span>
              <span
                className={`font-mono ${unrealizedPnL >= 0 ? 'text-green-700' : 'text-red-700'}`}
              >
                {unrealizedPnL >= 0 ? '+' : ''}
                {formatMoney(unrealizedPnL)}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
            <p className="mb-1">
              If the contract settled <strong>now</strong> (live score{' '}
              {(currentScore * 100).toFixed(0)}%), you&apos;d receive{' '}
              <strong>{formatMoney(settlementValueIfNow)}</strong>.
            </p>
            <p>Positions saved to this browser only.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceHeader({ state }: { state: LmsrState }) {
  const py = priceYes(state);
  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-green-50 via-white to-red-50">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
            Implied YES probability
          </div>
          <div className="text-4xl font-bold text-gray-900 leading-none">
            {(py * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 mt-1">
            YES <span className="font-mono">{formatCents(py)}</span>
            {' · '}
            NO <span className="font-mono">{formatCents(1 - py)}</span>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>
            Inventory{' '}
            <span className="font-mono text-gray-700">
              q_yes={state.qYes.toFixed(0)} · q_no={state.qNo.toFixed(0)}
            </span>
          </div>
          <div>
            Liquidity{' '}
            <span className="font-mono text-gray-700">b={state.b}</span>
          </div>
        </div>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200 mt-4">
        <div className="bg-green-500" style={{ width: `${py * 100}%` }} />
        <div className="bg-red-400" style={{ width: `${(1 - py) * 100}%` }} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      {hint && <div className="text-xs text-gray-500">{hint}</div>}
    </div>
  );
}
