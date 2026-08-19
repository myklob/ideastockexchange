import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeDivergence } from "@/lib/market-maker";
import { badRequest, parseBoundedFloat, parseBoundedInt } from "@/lib/api-params";

// GET /api/arbitrage: Surface claims where ReasonRank and Market Price diverge.
// These are the profit opportunities.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const minDivergence = parseBoundedFloat(searchParams.get("minDivergence"), {
    fallback: 0.05,
    min: 0,
    max: 1,
  });
  const limit = parseBoundedInt(searchParams.get("limit"), {
    fallback: 20,
    min: 1,
    max: 200,
  });
  if (minDivergence === null) {
    return badRequest("minDivergence must be a number between 0 and 1");
  }
  if (limit === null) {
    return badRequest("limit must be an integer between 1 and 200");
  }

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
