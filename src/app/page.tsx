"use client";

import { useState, useEffect } from "react";
import ClaimCard from "@/components/ClaimCard";

interface ClaimData {
  id: string;
  title: string;
  description: string;
  category: string;
  reasonRank: number;
  truthScore: number;
  liquidityPool: {
    yesShares: number;
    noShares: number;
    totalVolume: number;
  } | null;
  marketPrice: {
    yes: number;
    no: number;
  };
  divergence: number;
}

export default function MarketsPage() {
  const [claims, setClaims] = useState<ClaimData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("reasonRank");

  useEffect(() => {
    async function fetchClaims() {
      setLoading(true);
      try {
        const res = await fetch(`/api/claims?status=ACTIVE&sortBy=${sortBy}`);
        const data = await res.json();
        setClaims(data);
      } catch {
        setClaims([]);
      }
      setLoading(false);
    }
    fetchClaims();
  }, [sortBy]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Markets</h1>
          <p className="text-sm text-[var(--neutral)] mt-1">
            Active claims. Invest based on logical fundamentals, profit from
            market mispricing.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="sort" className="text-[var(--neutral)]">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[var(--card-bg)] border border-[var(--border)] rounded px-2 py-1 text-white"
          >
            <option value="reasonRank">ReasonRank</option>
            <option value="truthScore">TruthScore</option>
            <option value="updatedAt">Recent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--neutral)]">
          Loading markets...
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-12 text-[var(--neutral)]">
          No active claims. Create one to open a market.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {claims.map((claim) => (
            <ClaimCard
              key={claim.id}
              id={claim.id}
              title={claim.title}
              category={claim.category}
              reasonRank={claim.reasonRank}
              truthScore={claim.truthScore}
              marketPriceYes={claim.marketPrice.yes}
              marketPriceNo={claim.marketPrice.no}
              volume={claim.liquidityPool?.totalVolume || 0}
              divergence={claim.divergence}
            />
          ))}
        </div>
      )}
    </div>
  );
}
