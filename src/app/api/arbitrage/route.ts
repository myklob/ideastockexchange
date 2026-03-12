import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeDivergence } from "@/lib/market-maker";

// GET /api/arbitrage: Surface claims where ReasonRank and Market Price diverge.
// These are the profit opportunities.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const minDivergence = parseFloat(searchParams.get("minDivergence") || "0.05");
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const claims = await prisma.claim.findMany({
    where: { status: "ACTIVE" },
    include: { liquidityPool: true },
  });

  const opportunities = claims
    .map((claim) => {
      const pool = claim.liquidityPool;
      if (!pool) return null;

      const yesPrice = pool.noShares / (pool.yesShares + pool.noShares);
      const { divergence, direction, magnitude } = computeDivergence(
        claim.reasonRank,
        yesPrice
      );

      if (magnitude < minDivergence) return null;

      return {
        claimId: claim.id,
        title: claim.title,
        category: claim.category,
        reasonRank: claim.reasonRank,
        truthScore: claim.truthScore,
        marketPrice: yesPrice,
        divergence,
        direction,
        magnitude,
        potentialReturn: magnitude / yesPrice,
        volume: pool.totalVolume,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.magnitude || 0) - (a?.magnitude || 0))
    .slice(0, limit);

  return NextResponse.json({
    count: opportunities.length,
    opportunities,
  });
}
