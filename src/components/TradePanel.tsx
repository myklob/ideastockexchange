"use client";

import { useState } from "react";

interface TradePanelProps {
  claimId: string;
  claimTitle: string;
  yesPrice: number;
  noPrice: number;
  reasonRank: number;
}

export default function TradePanel({
  claimId,
  claimTitle,
  yesPrice,
  noPrice,
  reasonRank,
}: TradePanelProps) {
  const [shareType, setShareType] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPrice = shareType === "YES" ? yesPrice : noPrice;
  const estimatedShares =
    parseFloat(amount) > 0 ? parseFloat(amount) / currentPrice : 0;

  const divergence = reasonRank - yesPrice;
  const signal =
    Math.abs(divergence) < 0.05
      ? "HOLD"
      : divergence > 0
        ? "BUY YES"
        : "BUY NO";

  async function handleTrade() {
    if (!amount || parseFloat(amount) <= 0) return;
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo-user",
          claimId,
          shareType,
          direction: "BUY",
          amount: parseFloat(amount),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Trade failed.");
      } else {
        setResult(
          `Purchased ${data.transaction.sharesReceived.toFixed(2)} ${shareType} shares at ${data.transaction.pricePerShare.toFixed(4)} per share.`
        );
        setAmount("");
      }
    } catch {
      setError("Network error. Try again.");
    }
    setSubmitting(false);
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
      <h3 className="font-semibold mb-3">Trade: {claimTitle}</h3>

      {/* Signal */}
      <div className="mb-4 p-3 rounded bg-[var(--background)] border border-[var(--border)]">
        <div className="text-xs text-[var(--neutral)] mb-1">
          Arbitrage Signal
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">
            ReasonRank: <span className="font-mono">{(reasonRank * 100).toFixed(1)}%</span>
            {" / "}
            Market: <span className="font-mono">{(yesPrice * 100).toFixed(1)}%</span>
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              signal === "BUY YES"
                ? "bg-green-900/40 text-[var(--profit)]"
                : signal === "BUY NO"
                  ? "bg-red-900/40 text-[var(--loss)]"
                  : "bg-gray-800 text-[var(--neutral)]"
            }`}
          >
            {signal}
          </span>
        </div>
      </div>

      {/* Share Type Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShareType("YES")}
          className={`flex-1 py-2 rounded text-sm font-semibold transition-colors ${
            shareType === "YES"
              ? "bg-green-600 text-white"
              : "bg-[var(--background)] text-[var(--neutral)] border border-[var(--border)]"
          }`}
        >
          YES {(yesPrice * 100).toFixed(1)}c
        </button>
        <button
          onClick={() => setShareType("NO")}
          className={`flex-1 py-2 rounded text-sm font-semibold transition-colors ${
            shareType === "NO"
              ? "bg-red-600 text-white"
              : "bg-[var(--background)] text-[var(--neutral)] border border-[var(--border)]"
          }`}
        >
          NO {(noPrice * 100).toFixed(1)}c
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label
          htmlFor="amount"
          className="block text-xs text-[var(--neutral)] mb-1"
        >
          Investment (IdeaCredits)
        </label>
        <input
          id="amount"
          type="number"
          min="0"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 font-mono text-white"
        />
      </div>

      {/* Estimate */}
      {estimatedShares > 0 && (
        <div className="mb-4 text-xs text-[var(--neutral)]">
          Estimated shares: ~{estimatedShares.toFixed(2)} {shareType}
          <br />
          (Actual amount may differ due to slippage.)
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleTrade}
        disabled={submitting || !amount || parseFloat(amount) <= 0}
        className="w-full py-2 rounded font-semibold text-sm bg-white text-black hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Executing..." : `Buy ${shareType} Shares`}
      </button>

      {/* Feedback */}
      {result && (
        <div className="mt-3 p-2 rounded bg-green-900/20 text-[var(--profit)] text-xs">
          {result}
        </div>
      )}
      {error && (
        <div className="mt-3 p-2 rounded bg-red-900/20 text-[var(--loss)] text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
