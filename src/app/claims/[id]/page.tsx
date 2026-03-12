"use client";

import { useState, useEffect } from "react";
import TradePanel from "@/components/TradePanel";

interface ClaimDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  reasonRank: number;
  truthScore: number;
  logicalValidity: number;
  evidenceQuality: number;
  liquidityPool: {
    yesShares: number;
    noShares: number;
    totalVolume: number;
  } | null;
  subArguments: {
    id: string;
    position: string;
    content: string;
    logicalValidity: number;
    evidenceQuality: number;
  }[];
  evidence: {
    id: string;
    sourceType: string;
    description: string;
    reliabilityScore: number;
    sourceUrl: string | null;
  }[];
  marketPrice: {
    yes: number;
    no: number;
  };
  divergence: number;
}

export default function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimId, setClaimId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setClaimId(p.id));
  }, [params]);

  useEffect(() => {
    if (!claimId) return;
    async function fetchClaim() {
      setLoading(true);
      try {
        const res = await fetch(`/api/claims?status=ACTIVE`);
        const data = await res.json();
        const found = data.find((c: ClaimDetail) => c.id === claimId);
        setClaim(found || null);
      } catch {
        setClaim(null);
      }
      setLoading(false);
    }
    fetchClaim();
  }, [claimId]);

  if (loading) {
    return (
      <div className="text-center py-12 text-[var(--neutral)]">Loading claim...</div>
    );
  }

  if (!claim) {
    return (
      <div className="text-center py-12 text-[var(--neutral)]">Claim not found.</div>
    );
  }

  const yesPrice = claim.marketPrice.yes;
  const noPrice = claim.marketPrice.no;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold mb-2">{claim.title}</h1>
        <div className="flex gap-2 mb-4">
          <span className="text-xs text-[var(--neutral)] bg-[var(--card-bg)] px-2 py-1 rounded">
            {claim.category}
          </span>
          <span className="text-xs text-[var(--neutral)] bg-[var(--card-bg)] px-2 py-1 rounded">
            {claim.status}
          </span>
        </div>

        <p className="text-sm text-gray-300 mb-6">{claim.description}</p>

        {/* Fundamentals Panel */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-3">Fundamentals</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <MetricBox
              label="ReasonRank"
              value={`${(claim.reasonRank * 100).toFixed(1)}%`}
            />
            <MetricBox
              label="TruthScore"
              value={`${(claim.truthScore * 100).toFixed(1)}%`}
            />
            <MetricBox
              label="Logical Validity"
              value={`${(claim.logicalValidity * 100).toFixed(1)}%`}
            />
            <MetricBox
              label="Evidence Quality"
              value={`${(claim.evidenceQuality * 100).toFixed(1)}%`}
            />
          </div>
        </div>

        {/* Sub-Arguments */}
        <div className="mb-6">
          <h2 className="font-semibold mb-3">Arguments</h2>
          {claim.subArguments.length === 0 ? (
            <p className="text-sm text-[var(--neutral)]">
              No sub-arguments submitted. This claim is under-examined.
            </p>
          ) : (
            <div className="space-y-3">
              {claim.subArguments.map((arg) => (
                <div
                  key={arg.id}
                  className={`border rounded-lg p-3 ${
                    arg.position === "PRO"
                      ? "border-green-800/50 bg-green-900/10"
                      : "border-red-800/50 bg-red-900/10"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        arg.position === "PRO"
                          ? "bg-green-900/40 text-[var(--profit)]"
                          : "bg-red-900/40 text-[var(--loss)]"
                      }`}
                    >
                      {arg.position}
                    </span>
                    <span className="text-xs text-[var(--neutral)]">
                      Validity: {(arg.logicalValidity * 100).toFixed(0)}% |
                      Evidence: {(arg.evidenceQuality * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm">{arg.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Evidence */}
        <div>
          <h2 className="font-semibold mb-3">Evidence</h2>
          {claim.evidence.length === 0 ? (
            <p className="text-sm text-[var(--neutral)]">
              No evidence submitted.
            </p>
          ) : (
            <div className="space-y-2">
              {claim.evidence.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[var(--neutral)]">
                      {ev.sourceType.replace("_", " ")}
                    </span>
                    <span className="text-xs text-[var(--neutral)]">
                      Reliability: {(ev.reliabilityScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm">{ev.description}</p>
                  {ev.sourceUrl && (
                    <a
                      href={ev.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline mt-1 inline-block"
                    >
                      Source
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trade Sidebar */}
      <div>
        <TradePanel
          claimId={claim.id}
          claimTitle={claim.title}
          yesPrice={yesPrice}
          noPrice={noPrice}
          reasonRank={claim.reasonRank}
        />

        {/* Market Stats */}
        <div className="mt-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
          <h3 className="font-semibold mb-3 text-sm">Market Data</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--neutral)]">YES Price</span>
              <span className="font-mono text-[var(--profit)]">
                {(yesPrice * 100).toFixed(1)}c
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--neutral)]">NO Price</span>
              <span className="font-mono text-[var(--loss)]">
                {(noPrice * 100).toFixed(1)}c
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--neutral)]">Volume</span>
              <span className="font-mono">
                {(claim.liquidityPool?.totalVolume || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--neutral)]">Divergence</span>
              <span
                className={`font-mono font-semibold ${
                  claim.divergence > 0.05
                    ? "text-[var(--profit)]"
                    : claim.divergence < -0.05
                      ? "text-[var(--loss)]"
                      : "text-[var(--neutral)]"
                }`}
              >
                {claim.divergence > 0 ? "+" : ""}
                {(claim.divergence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--neutral)] mb-1">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  );
}
